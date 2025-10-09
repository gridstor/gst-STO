import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

interface RenewablesDataPoint {
  datetime: string; // ISO string for hour beginning
  dayzerWind: number; // 0 for missing data instead of null
  dayzerSolar: number; // 0 for missing data instead of null
  dayzerWindT1: number; // t-1 Wind forecast
  dayzerSolarT1: number; // t-1 Solar forecast
  caisoWind: number; // 0 for missing data instead of null
  caisoSolar: number; // 0 for missing data instead of null
  rtWind: number; // RT Wind actuals
  rtSolar: number; // RT Solar actuals
}

export const GET: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    // Create secondary database connection for CAISO data
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    // Check if a specific scenario is requested via URL parameter
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get('scenarioId');
    
    let lastWeekScenario;
    if (requestedScenarioId) {
      // Use the requested scenario directly
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Renewables Last Week - Using requested scenario:', lastWeekScenario);
    } else {
      // Get most recent scenario and use (latest - 7) for last week comparison
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

      // Use scenario that's 7 less than the latest (for last week comparison)
      const lastWeekScenarioId = latestScenario.scenarioid - 7;
      
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioid: lastWeekScenarioId,
        },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Renewables Last Week - Using latest scenario:', latestScenario.scenarioid, 'and last week scenario:', lastWeekScenario?.scenarioid);
    }

    if (!lastWeekScenario) {
      const errorMessage = requestedScenarioId 
        ? `Requested scenario ${requestedScenarioId} not found`
        : `Last week scenario not found`;
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using renewables last week scenario:', lastWeekScenario.scenarioid);

    // Determine the date range based on last week scenario data
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
      },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ 
          error: 'No Dayzer renewables data found for last week scenario',
          details: `Scenario ${lastWeekScenario.scenarioid} has no data in results_units table`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the tail 7 days of the forecast data
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total (end date - 6 previous days)
    startDate.setHours(0, 0, 0, 0);

    console.log('Last week renewables 7-day forecast range:', startDate.toISOString(), 'to', endDate.toISOString());

    // 1. Get Dayzer Wind Forecast (results_units table)
    const dayzerWindResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: startDate,
          lte: endDate,
        },
        fuelname: {
          in: ['Wind', 'wind']
        }
      },
      select: {
        Date: true,
        Hour: true,
        generationmw: true,
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
    });

    console.log('Last week Dayzer wind data points:', dayzerWindResults.length);

    // Group and sum Dayzer wind by date/hour
    const dayzerWindMap: { [key: string]: number } = {};
    dayzerWindResults.forEach(row => {
      // Convert hour ending to hour beginning
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0); // HE 1 -> HB 0, HE 2 -> HB 1, etc.
      const datetimeKey = datetime.toISOString();
      
      if (!dayzerWindMap[datetimeKey]) {
        dayzerWindMap[datetimeKey] = 0;
      }
      dayzerWindMap[datetimeKey] += (row.generationmw || 0);
    });

    // 2. Get Dayzer Solar Forecast (results_units table)
    const dayzerSolarResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: startDate,
          lte: endDate,
        },
        fuelname: {
          in: ['Sun', 'sun']
        }
      },
      select: {
        Date: true,
        Hour: true,
        generationmw: true,
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
    });

    console.log('Last week Dayzer solar data points:', dayzerSolarResults.length);

    // Group and sum Dayzer solar by date/hour
    const dayzerSolarMap: { [key: string]: number } = {};
    dayzerSolarResults.forEach(row => {
      // Convert hour ending to hour beginning
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      if (!dayzerSolarMap[datetimeKey]) {
        dayzerSolarMap[datetimeKey] = 0;
      }
      dayzerSolarMap[datetimeKey] += (row.generationmw || 0);
    });

    // 3. Get CAISO Wind Forecast from secondary database
    const caisoWindQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ['CAISO', 'WIND_FORECAST_BIDCLOSE', startDate.toISOString(), endDate.toISOString()]);

    console.log('Last week CAISO wind data points:', caisoWindQuery.rows.length);

    const caisoWindMap: { [key: string]: number } = {};
    caisoWindQuery.rows.forEach((row: any) => {
      // CAISO wind data is 5-minute granularity, aggregate to hourly
      const datetime = new Date(row.local_datetime_ib);
      // Round down to the hour to aggregate 5-minute intervals
      datetime.setMinutes(0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      if (!caisoWindMap[datetimeKey]) {
        caisoWindMap[datetimeKey] = 0;
      }
      // Sum all 5-minute values within the hour
      caisoWindMap[datetimeKey] += parseFloat(row.value) || 0;
    });

    // Average the CAISO Wind values (since we summed 12 five-minute intervals per hour)
    Object.keys(caisoWindMap).forEach(key => {
      caisoWindMap[key] = caisoWindMap[key] / 12; // 12 five-minute intervals per hour
    });

    // 4. Get CAISO Solar Forecast from secondary database
    const caisoSolarQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ['CAISO', 'BIDCLOSE_SOLAR_FORECAST', startDate.toISOString(), endDate.toISOString()]);

    console.log('Last week CAISO solar data points:', caisoSolarQuery.rows.length);

    const caisoSolarMap: { [key: string]: number } = {};
    caisoSolarQuery.rows.forEach((row: any) => {
      // CAISO solar data is already hourly, use directly
      const datetime = new Date(row.local_datetime_ib);
      const datetimeKey = datetime.toISOString();
      
      // Use the value directly (already hourly average)
      caisoSolarMap[datetimeKey] = parseFloat(row.value) || 0;
    });

    // 5. Get RT Wind Actuals from secondary database
    const rtWindQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ['CAISO', 'RTGEN_WIND', startDate.toISOString(), endDate.toISOString()]);

    console.log('Last week RT Wind actuals data points:', rtWindQuery.rows.length);

    const rtWindMap: { [key: string]: { sum: number, count: number } } = {};
    rtWindQuery.rows.forEach((row: any) => {
      // RT data is 5-minute granularity, aggregate to hourly
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtWindMap[key]) {
        rtWindMap[key] = { sum: 0, count: 0 };
      }
      rtWindMap[key].sum += parseFloat(row.value) || 0;
      rtWindMap[key].count += 1;
    });

    // 6. Get RT Solar Actuals from secondary database
    const rtSolarQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ['CAISO', 'RTGEN_SOLAR', startDate.toISOString(), endDate.toISOString()]);

    console.log('Last week RT Solar actuals data points:', rtSolarQuery.rows.length);

    const rtSolarMap: { [key: string]: { sum: number, count: number } } = {};
    rtSolarQuery.rows.forEach((row: any) => {
      // RT data is 5-minute granularity, aggregate to hourly
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      
      if (!rtSolarMap[key]) {
        rtSolarMap[key] = { sum: 0, count: 0 };
      }
      rtSolarMap[key].sum += parseFloat(row.value) || 0;
      rtSolarMap[key].count += 1;
    });

    // 7. Get t-1 forecast data for Dayzer Wind and Solar (concatenated single-day forecasts)
    console.log('Fetching t-1 renewables forecast data...');
    
    // Get the date range for last week
    const lastWeekStartDate = new Date(startDate);
    const lastWeekEndDate = new Date(endDate);
    
    // Get all dates in the last week range
    const lastWeekDates: Date[] = [];
    for (let d = new Date(lastWeekStartDate); d <= lastWeekEndDate; d.setDate(d.getDate() + 1)) {
      lastWeekDates.push(new Date(d));
    }
    
    console.log('Last week dates for t-1 renewables analysis:', lastWeekDates.map(d => d.toISOString().split('T')[0]));

    // Get all scenarios to find t-1 scenarios
    const allScenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
      select: { scenarioid: true, simulation_date: true },
      orderBy: { scenarioid: 'asc' }
    });

    const dayzerWindT1Map: { [key: string]: number } = {};
    const dayzerSolarT1Map: { [key: string]: number } = {};

    // For each day in last week, get the t-1 scenario forecast for that specific day
    for (const targetDate of lastWeekDates) {
      // Find the t-1 scenario (scenario run the day before the target date)
      const t1Date = new Date(targetDate);
      t1Date.setDate(t1Date.getDate() - 1);
      const t1DateStr = t1Date.toISOString().split('T')[0];

      const t1Scenario = allScenarios.find(s => {
        // Convert database date to YYYY-MM-DD for comparison
        let dbDateStr: string;
        if (typeof s.simulation_date === 'string') {
          // Handle DD-MMM-YYYY format from database
          const date = new Date(s.simulation_date);
          dbDateStr = date.toISOString().split('T')[0];
        } else {
          dbDateStr = s.simulation_date.toISOString().split('T')[0];
        }
        
        return dbDateStr === t1DateStr;
      });

      if (t1Scenario) {
        console.log(`t-1 renewables for ${targetDate.toISOString().split('T')[0]}: Using scenario ${t1Scenario.scenarioid} (${t1DateStr})`);

        // Get wind forecast for the target date from the t-1 scenario
        const t1WindData = await prisma.results_units.findMany({
          where: {
            scenarioid: t1Scenario.scenarioid,
            Date: targetDate,
            fuelname: { in: ['Wind', 'wind'] }
          },
          select: { Hour: true, generationmw: true }
        });

        // Get solar forecast for the target date from the t-1 scenario
        const t1SolarData = await prisma.results_units.findMany({
          where: {
            scenarioid: t1Scenario.scenarioid,
            Date: targetDate,
            fuelname: { in: ['Sun', 'sun'] }
          },
          select: { Hour: true, generationmw: true }
        });

        // Process t-1 wind data
        t1WindData.forEach(row => {
          const datetime = new Date(targetDate);
          datetime.setHours(row.Hour - 1, 0, 0, 0); // Convert hour ending to hour beginning
          const datetimeKey = datetime.toISOString();
          
          if (!dayzerWindT1Map[datetimeKey]) {
            dayzerWindT1Map[datetimeKey] = 0;
          }
          dayzerWindT1Map[datetimeKey] += (row.generationmw || 0);
        });

        // Process t-1 solar data
        t1SolarData.forEach(row => {
          const datetime = new Date(targetDate);
          datetime.setHours(row.Hour - 1, 0, 0, 0); // Convert hour ending to hour beginning
          const datetimeKey = datetime.toISOString();
          
          if (!dayzerSolarT1Map[datetimeKey]) {
            dayzerSolarT1Map[datetimeKey] = 0;
          }
          dayzerSolarT1Map[datetimeKey] += (row.generationmw || 0);
        });
      } else {
        console.log(`t-1 renewables for ${targetDate.toISOString().split('T')[0]}: No scenario found for ${t1DateStr}`);
      }
    }

    console.log('t-1 Wind data points:', Object.keys(dayzerWindT1Map).length);
    console.log('t-1 Solar data points:', Object.keys(dayzerSolarT1Map).length);
    if (Object.keys(dayzerWindT1Map).length > 0) {
      console.log('Sample t-1 Wind data:', Object.entries(dayzerWindT1Map).slice(0, 3));
    }
    if (Object.keys(dayzerSolarT1Map).length > 0) {
      console.log('Sample t-1 Solar data:', Object.entries(dayzerSolarT1Map).slice(0, 3));
    }

    // 8. Combine all data into time series
    const allDatetimes = new Set([
      ...Object.keys(dayzerWindMap),
      ...Object.keys(dayzerSolarMap),
      ...Object.keys(caisoWindMap),
      ...Object.keys(caisoSolarMap),
      ...Object.keys(rtWindMap),
      ...Object.keys(rtSolarMap)
    ]);

    const renewablesData: RenewablesDataPoint[] = Array.from(allDatetimes)
      .sort()
      .map(datetime => {
        return {
          datetime,
          dayzerWind: dayzerWindMap[datetime] || 0, // Use 0 instead of null for missing data
          dayzerSolar: dayzerSolarMap[datetime] || 0, // Use 0 instead of null for missing data
          dayzerWindT1: dayzerWindT1Map[datetime] || 0, // t-1 Wind forecast
          dayzerSolarT1: dayzerSolarT1Map[datetime] || 0, // t-1 Solar forecast
          caisoWind: caisoWindMap[datetime] || 0, // Use 0 instead of null for missing data
          caisoSolar: caisoSolarMap[datetime] || 0, // Use 0 instead of null for missing data
          rtWind: rtWindMap[datetime] ? (rtWindMap[datetime].sum / rtWindMap[datetime].count) : 0, // RT Wind actuals averaged
          rtSolar: rtSolarMap[datetime] ? (rtSolarMap[datetime].sum / rtSolarMap[datetime].count) : 0, // RT Solar actuals averaged
        };
      });

    console.log('Last week combined renewables data points:', renewablesData.length);
    if (renewablesData.length > 0) {
      console.log('Last week first renewables point:', renewablesData[0]);
      console.log('Last week last renewables point:', renewablesData[renewablesData.length - 1]);
    }

    return new Response(JSON.stringify({
      success: true,
      data: renewablesData,
      metadata: {
        scenario: lastWeekScenario,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          durationDays: 7,
        },
        dataPoints: {
          dayzerWind: Object.keys(dayzerWindMap).length,
          dayzerSolar: Object.keys(dayzerSolarMap).length,
          caisoWind: caisoWindQuery.rows.length,
          caisoSolar: caisoSolarQuery.rows.length,
          rtWind: rtWindQuery.rows.length,
          rtSolar: rtSolarQuery.rows.length,
          combined: renewablesData.length,
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Renewables Last Week forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch renewables last week forecast data', 
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
