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

interface AccuracyRequest {
  selectedHours: number[];
}

export const POST: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    const { selectedHours }: AccuracyRequest = await request.json();
    
    if (!selectedHours || selectedHours.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hours selected for analysis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create secondary database connection
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    // Check if a specific scenario is requested via URL parameter
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get('scenarioId');
    
    let lastWeekScenario;
    if (requestedScenarioId) {
      // Use the requested scenario directly (past week scenario from date picker)
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Load Forecast Accuracy - Using requested scenario:', lastWeekScenario);
    } else {
      // Get most recent scenario and use (latest - 7) for last week analysis (default behavior)
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
      
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: lastWeekScenarioId },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Load Forecast Accuracy - Using latest-7 scenario:', lastWeekScenario);
    }

    if (!lastWeekScenario) {
      const errorMsg = requestedScenarioId 
        ? `Requested scenario ${requestedScenarioId} not found`
        : `Last week scenario (latest - 7) not found`;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using last week scenario for accuracy analysis:', lastWeekScenario.scenarioid);

    // Get date range for scenario 43 (first 7 days)
    const dayzerDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: lastWeekScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No data found for scenario 43' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the tail 7 days of the last week scenario for accuracy analysis
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total (end date - 6 previous days)
    startDate.setHours(0, 0, 0, 0);

    console.log('Accuracy analysis date range:', startDate.toISOString(), 'to', endDate.toISOString());
    console.log('Selected hours for analysis:', selectedHours);

    // Fetch forecast data (same logic as load-last-week-forecast.ts)
    // 1. Dayzer Load Forecast
    const dayzerLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours }
      },
      select: { Date: true, Hour: true, demandmw: true },
    });

    console.log('Dayzer load results found:', dayzerLoadResults.length);
    if (dayzerLoadResults.length > 0) {
      console.log('First Dayzer result:', dayzerLoadResults[0]);
      console.log('Last Dayzer result:', dayzerLoadResults[dayzerLoadResults.length - 1]);
    }

    const dayzerLoadMap: { [key: string]: number } = {};
    dayzerLoadResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerLoadMap[key] = (dayzerLoadMap[key] || 0) + (row.demandmw || 0);
    });

    console.log('Dayzer load map keys (first 5):', Object.keys(dayzerLoadMap).slice(0, 5));
    console.log('Dayzer load map keys (last 5):', Object.keys(dayzerLoadMap).slice(-5));

    // 2. Dayzer renewables for net load calculation
    const dayzerRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours },
        fuelname: { in: ['Sun', 'sun', 'Wind', 'wind'] }
      },
      select: { Date: true, Hour: true, generationmw: true },
    });

    const dayzerRenewableMap: { [key: string]: number } = {};
    dayzerRenewableResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerRenewableMap[key] = (dayzerRenewableMap[key] || 0) + (row.generationmw || 0);
    });

    // 3. CAISO DA Load Forecast
    const caisoLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'DA_LOAD_FORECAST'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]); // Convert to hour beginning

    const caisoLoadMap: { [key: string]: number } = {};
    caisoLoadQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      caisoLoadMap[datetime.toISOString()] = parseFloat(row.value) || 0;
    });

    // 4. CAISO DA Net Load Forecast
    const caisoNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'DA_NET_LOAD_FORECAST'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    const caisoNetLoadMap: { [key: string]: number } = {};
    caisoNetLoadQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      caisoNetLoadMap[datetime.toISOString()] = parseFloat(row.value) || 0;
    });

    // 5. RT Load Actuals
    const rtLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'RTLOAD'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    // Aggregate RT Load to hourly
    const rtLoadMap: { [key: string]: { sum: number, count: number } } = {};
    rtLoadQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtLoadMap[key]) {
        rtLoadMap[key] = { sum: 0, count: 0 };
      }
      rtLoadMap[key].sum += parseFloat(row.value) || 0;
      rtLoadMap[key].count += 1;
    });

    // 6. RT Net Load Actuals
    const rtNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'NET_RTLOAD'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map(h => h - 1)]);

    // Aggregate RT Net Load to hourly
    const rtNetLoadMap: { [key: string]: { sum: number, count: number } } = {};
    rtNetLoadQuery.rows.forEach((row: any) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtNetLoadMap[key]) {
        rtNetLoadMap[key] = { sum: 0, count: 0 };
      }
      rtNetLoadMap[key].sum += parseFloat(row.value) || 0;
      rtNetLoadMap[key].count += 1;
    });

    // Calculate error metrics
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

    // Calculate metrics for each forecast type
    const dayzerLoadErrors = calculateErrorMetrics(dayzerLoadMap, rtLoadMap);
    
    const dayzerNetLoadMap: { [key: string]: number } = {};
    Object.keys(dayzerLoadMap).forEach(key => {
      const load = dayzerLoadMap[key];
      const renewable = dayzerRenewableMap[key] || 0;
      dayzerNetLoadMap[key] = load - renewable;
    });
    const dayzerNetLoadErrors = calculateErrorMetrics(dayzerNetLoadMap, rtNetLoadMap);
    
    const caisoLoadErrors = calculateErrorMetrics(caisoLoadMap, rtLoadMap);
    const caisoNetLoadErrors = calculateErrorMetrics(caisoNetLoadMap, rtNetLoadMap);

    // Create time series error data
    const timeSeriesErrors = Object.keys(dayzerLoadMap).map(datetime => ({
      datetime,
      dayzerLoadError: rtLoadMap[datetime] ? Math.abs(dayzerLoadMap[datetime] - (rtLoadMap[datetime].sum / rtLoadMap[datetime].count)) : null,
      dayzerNetLoadError: rtNetLoadMap[datetime] ? Math.abs(dayzerNetLoadMap[datetime] - (rtNetLoadMap[datetime].sum / rtNetLoadMap[datetime].count)) : null,
      caisoLoadError: rtLoadMap[datetime] && caisoLoadMap[datetime] ? Math.abs(caisoLoadMap[datetime] - (rtLoadMap[datetime].sum / rtLoadMap[datetime].count)) : null,
      caisoNetLoadError: rtNetLoadMap[datetime] && caisoNetLoadMap[datetime] ? Math.abs(caisoNetLoadMap[datetime] - (rtNetLoadMap[datetime].sum / rtNetLoadMap[datetime].count)) : null,
    })).sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log('Time series errors created:', timeSeriesErrors.length, 'data points');
    if (timeSeriesErrors.length > 0) {
      console.log('First error point:', timeSeriesErrors[0]);
      console.log('Last error point:', timeSeriesErrors[timeSeriesErrors.length - 1]);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        dayzerLoad: dayzerLoadErrors,
        dayzerNetLoad: dayzerNetLoadErrors,
        caisoLoad: caisoLoadErrors,
        caisoNetLoad: caisoNetLoadErrors,
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
    console.error('Forecast accuracy calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate forecast accuracy', 
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
