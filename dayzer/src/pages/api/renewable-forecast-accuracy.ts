import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const prisma = new PrismaClient();

interface ErrorMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  dataPoints: number;
}

interface RenewableAccuracyRequest {
  selectedHours: number[];
}

export const POST: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    const { selectedHours }: RenewableAccuracyRequest = await request.json();
    
    if (!selectedHours || selectedHours.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hours selected for renewable analysis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create secondary database connection
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    // Get most recent scenario and use (latest - 7) for last week analysis
    const latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      orderBy: { scenarioid: 'desc' },
      select: { scenarioid: true, scenarioname: true },
    });

    if (!latestScenario) {
      return new Response(
        JSON.stringify({ error: 'No scenarios found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lastWeekScenarioId = latestScenario.scenarioid - 7;
    
    const lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: { scenarioid: lastWeekScenarioId },
      select: { scenarioid: true, scenarioname: true },
    });

    if (!lastWeekScenario) {
      return new Response(
        JSON.stringify({ error: `Last week scenario ${lastWeekScenarioId} (latest - 7) not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using latest scenario:', latestScenario.scenarioid, 'and last week scenario for renewables:', lastWeekScenario.scenarioid);

    // Get date range for last week scenario (tail 7 days)
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: { scenarioid: lastWeekScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No data found for last week renewables scenario' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the tail 7 days of the last week scenario
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    console.log('Renewable accuracy analysis date range:', startDate.toISOString(), 'to', endDate.toISOString());
    console.log('Selected hours for renewable analysis:', selectedHours);

    // Fetch renewable forecast data for selected hours
    // 1. Dayzer Wind Forecast
    const dayzerWindResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours },
        fuelname: { in: ['Wind', 'wind'] }
      },
      select: { Date: true, Hour: true, generationmw: true },
    });

    const dayzerWindMap: { [key: string]: number } = {};
    dayzerWindResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerWindMap[key] = (dayzerWindMap[key] || 0) + (row.generationmw || 0);
    });

    // 2. Dayzer Solar Forecast
    const dayzerSolarResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours },
        fuelname: { in: ['Sun', 'sun'] }
      },
      select: { Date: true, Hour: true, generationmw: true },
    });

    const dayzerSolarMap: { [key: string]: number } = {};
    dayzerSolarResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerSolarMap[key] = (dayzerSolarMap[key] || 0) + (row.generationmw || 0);
    });

    // 3. CAISO Wind Forecast
    const caisoWindQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'WIND_FORECAST_BIDCLOSE'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]); // Convert to hour beginning

    const caisoWindMap: { [key: string]: number } = {};
    caisoWindQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      if (!caisoWindMap[key]) caisoWindMap[key] = 0;
      caisoWindMap[key] += parseFloat(row.value) || 0;
    });
    // Average CAISO wind (5-minute data)
    Object.keys(caisoWindMap).forEach(key => {
      const count = caisoWindQuery.rows.filter(row => {
        const dt = new Date(row.local_datetime_ib);
        dt.setMinutes(0, 0, 0);
        return dt.toISOString() === key;
      }).length;
      if (count > 0) caisoWindMap[key] = caisoWindMap[key] / count;
    });

    // 4. CAISO Solar Forecast
    const caisoSolarQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'BIDCLOSE_SOLAR_FORECAST'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    const caisoSolarMap: { [key: string]: number } = {};
    caisoSolarQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      const key = datetime.toISOString();
      caisoSolarMap[key] = parseFloat(row.value) || 0;
    });

    // 5. RT Wind Actuals
    const rtWindQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'RTGEN_WIND'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    // Aggregate RT Wind to hourly averages
    const rtWindMap: { [key: string]: { sum: number, count: number } } = {};
    rtWindQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtWindMap[key]) {
        rtWindMap[key] = { sum: 0, count: 0 };
      }
      rtWindMap[key].sum += parseFloat(row.value) || 0;
      rtWindMap[key].count += 1;
    });

    // 6. RT Solar Actuals
    const rtSolarQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'RTGEN_SOLAR'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    // Aggregate RT Solar to hourly averages
    const rtSolarMap: { [key: string]: { sum: number, count: number } } = {};
    rtSolarQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtSolarMap[key]) {
        rtSolarMap[key] = { sum: 0, count: 0 };
      }
      rtSolarMap[key].sum += parseFloat(row.value) || 0;
      rtSolarMap[key].count += 1;
    });

    // Calculate error metrics function
    const calculateErrorMetrics = (forecasts: { [key: string]: number }, actuals: { [key: string]: { sum: number, count: number } }): ErrorMetrics => {
      const errors: number[] = [];
      const actualValues: number[] = [];
      
      Object.keys(forecasts).forEach(datetime => {
        const forecast = forecasts[datetime];
        const actualData = actuals[datetime];
        
        if (actualData && actualData.count > 0) {
          const actual = actualData.sum / actualData.count; // Average of 5-minute values
          const error = forecast - actual;
          
          errors.push(error);
          actualValues.push(actual);
        }
      });

      if (errors.length === 0) {
        return { mae: 0, rmse: 0, mape: 0, bias: 0, dataPoints: 0 };
      }

      const mae = errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((sum, err) => sum + err * err, 0) / errors.length);
      const bias = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      
      // MAPE calculation
      let mapeSum = 0;
      let mapeCount = 0;
      for (let i = 0; i < errors.length; i++) {
        if (actualValues[i] !== 0) {
          mapeSum += Math.abs(errors[i]) / Math.abs(actualValues[i]);
          mapeCount++;
        }
      }
      const mape = mapeCount > 0 ? (mapeSum / mapeCount) * 100 : 0;

      return { mae, rmse, mape, bias, dataPoints: errors.length };
    };

    // Calculate metrics for each renewable forecast type
    const dayzerWindErrors = calculateErrorMetrics(dayzerWindMap, rtWindMap);
    const dayzerSolarErrors = calculateErrorMetrics(dayzerSolarMap, rtSolarMap);
    const caisoWindErrors = calculateErrorMetrics(caisoWindMap, rtWindMap);
    const caisoSolarErrors = calculateErrorMetrics(caisoSolarMap, rtSolarMap);

    // Create time series error data
    const timeSeriesErrors = Object.keys(dayzerWindMap).map(datetime => ({
      datetime,
      dayzerWindError: rtWindMap[datetime] ? Math.abs(dayzerWindMap[datetime] - (rtWindMap[datetime].sum / rtWindMap[datetime].count)) : null,
      dayzerSolarError: rtSolarMap[datetime] ? Math.abs(dayzerSolarMap[datetime] - (rtSolarMap[datetime].sum / rtSolarMap[datetime].count)) : null,
      caisoWindError: rtWindMap[datetime] && caisoWindMap[datetime] ? Math.abs(caisoWindMap[datetime] - (rtWindMap[datetime].sum / rtWindMap[datetime].count)) : null,
      caisoSolarError: rtSolarMap[datetime] && caisoSolarMap[datetime] ? Math.abs(caisoSolarMap[datetime] - (rtSolarMap[datetime].sum / rtSolarMap[datetime].count)) : null,
    })).sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log('Renewable time series errors created:', timeSeriesErrors.length, 'data points');

    return new Response(JSON.stringify({
      success: true,
      data: {
        dayzerWind: dayzerWindErrors,
        dayzerSolar: dayzerSolarErrors,
        caisoWind: caisoWindErrors,
        caisoSolar: caisoSolarErrors,
        timeSeriesErrors: timeSeriesErrors,
      },
      metadata: {
        selectedHours,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Renewable forecast accuracy calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate renewable forecast accuracy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
};



