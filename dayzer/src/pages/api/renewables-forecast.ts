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
  caisoWind: number; // 0 for missing data instead of null
  caisoSolar: number; // 0 for missing data instead of null
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
    
    let latestScenario;
    if (requestedScenarioId) {
      // Use the requested scenario
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Renewables Forecast - Using requested scenario:', latestScenario);
    } else {
      // Get most recent scenario (default behavior)
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Renewables Forecast - Using latest scenario:', latestScenario);
    }

    if (!latestScenario) {
      return new Response(
        JSON.stringify({ error: 'No scenarios found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using latest scenario for renewables:', latestScenario);

    // Determine the date range based on scenario 50 data (same logic as Load Forecast)
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: latestScenario.scenarioid,
      },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No Dayzer renewables forecast data found for this scenario' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use only the last 7 days of the forecast data (same as Load Forecast)
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total
    startDate.setHours(0, 0, 0, 0);

    console.log('Renewables forecast span:', startDate.toISOString(), 'to', endDate.toISOString());

    // 1. Get Dayzer Wind Forecast (results_units table)
    const dayzerWindResults = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
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

    console.log('Dayzer wind data points:', dayzerWindResults.length);

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
        scenarioid: latestScenario.scenarioid,
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

    console.log('Dayzer solar data points:', dayzerSolarResults.length);
    
    // Debug: Check what solar data looks like
    if (dayzerSolarResults.length > 0) {
      console.log('Sample Dayzer solar records:');
      dayzerSolarResults.slice(0, 5).forEach((row, index) => {
        console.log(`Solar ${index}:`, {
          Date: row.Date,
          Hour: row.Hour,
          generationmw: row.generationmw
        });
      });
      
      // Check for unusually high values
      const highValues = dayzerSolarResults.filter(row => (row.generationmw || 0) > 1000);
      console.log('High solar values (>1000 MW):', highValues.length);
      if (highValues.length > 0) {
        console.log('Sample high values:', highValues.slice(0, 3));
      }
    }

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

    // Debug: Check aggregated solar values
    const solarValues = Object.values(dayzerSolarMap);
    if (solarValues.length > 0) {
      console.log('Dayzer solar aggregated values:');
      console.log('Max:', Math.max(...solarValues).toFixed(0), 'MW');
      console.log('Min:', Math.min(...solarValues).toFixed(0), 'MW');
      console.log('Average:', (solarValues.reduce((a, b) => a + b, 0) / solarValues.length).toFixed(0), 'MW');
      console.log('Sample aggregated values:', Object.entries(dayzerSolarMap).slice(0, 3));
    }

    // 3. First, check what CAISO wind attributes are available
    const availableWindAttributes = await secondaryPool.query(`
      SELECT DISTINCT attribute 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute ILIKE '%wind%'
      ORDER BY attribute ASC
    `);

    console.log('Available CAISO wind attributes:', availableWindAttributes.rows.map(r => r.attribute));

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

    console.log('CAISO wind data points:', caisoWindQuery.rows.length);
    console.log('CAISO wind query used attribute: WIND_FORECAST_BIDCLOSE');
    
    // Debug: Check sample CAISO wind datetime values to confirm interval beginning
    if (caisoWindQuery.rows.length > 0) {
      console.log('Sample CAISO wind datetime values (confirming interval beginning):');
      caisoWindQuery.rows.slice(0, 5).forEach((row: any, index: number) => {
        const datetime = new Date(row.local_datetime_ib);
        console.log(`Wind ${index}: ${row.local_datetime_ib} (minutes: ${datetime.getMinutes()}, seconds: ${datetime.getSeconds()})`);
      });
    }

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

    console.log('CAISO wind map sample values (after aggregation):', Object.entries(caisoWindMap).slice(0, 3));

    // 4. First, check what CAISO solar attributes are available
    const availableSolarAttributes = await secondaryPool.query(`
      SELECT DISTINCT attribute 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute ILIKE '%solar%'
      ORDER BY attribute ASC
    `);

    console.log('Available CAISO solar attributes:', availableSolarAttributes.rows.map(r => r.attribute));

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

    console.log('CAISO solar data points:', caisoSolarQuery.rows.length);
    console.log('CAISO solar query used attribute: BIDCLOSE_SOLAR_FORECAST');
    
    // Debug: Check sample CAISO solar datetime values to confirm interval beginning
    if (caisoSolarQuery.rows.length > 0) {
      console.log('Sample CAISO solar datetime values (confirming interval beginning):');
      caisoSolarQuery.rows.slice(0, 5).forEach((row: any, index: number) => {
        const datetime = new Date(row.local_datetime_ib);
        console.log(`Solar ${index}: ${row.local_datetime_ib} (minutes: ${datetime.getMinutes()}, seconds: ${datetime.getSeconds()}, value: ${row.value})`);
      });
    }

    const caisoSolarMap: { [key: string]: number } = {};
    caisoSolarQuery.rows.forEach((row: any) => {
      // CAISO data is already hourly (not 5-minute), use directly
      const datetime = new Date(row.local_datetime_ib);
      const datetimeKey = datetime.toISOString();
      
      // Use the value directly (already hourly average)
      caisoSolarMap[datetimeKey] = parseFloat(row.value) || 0;
    });

    console.log('CAISO solar map sample values:', Object.entries(caisoSolarMap).slice(0, 3));

    // 5. Combine all data into time series
    const allDatetimes = new Set([
      ...Object.keys(dayzerWindMap),
      ...Object.keys(dayzerSolarMap),
      ...Object.keys(caisoWindMap),
      ...Object.keys(caisoSolarMap)
    ]);

    const renewablesData: RenewablesDataPoint[] = Array.from(allDatetimes)
      .sort()
      .map(datetime => {
        return {
          datetime,
          dayzerWind: dayzerWindMap[datetime] || 0, // Use 0 instead of null for missing data
          dayzerSolar: dayzerSolarMap[datetime] || 0, // Use 0 instead of null for missing data
          caisoWind: caisoWindMap[datetime] || 0, // Use 0 instead of null for missing data
          caisoSolar: caisoSolarMap[datetime] || 0, // Use 0 instead of null for missing data
        };
      })
      // Don't filter out any points since we're using 0 instead of null
      // Keep all datetime points to ensure continuous chart

    console.log('Combined renewables data points:', renewablesData.length);
    if (renewablesData.length > 0) {
      console.log('First renewables point:', renewablesData[0]);
      console.log('Last renewables point:', renewablesData[renewablesData.length - 1]);
      
      // Debug: Check data availability for each source
      const samplePoint = renewablesData[Math.floor(renewablesData.length / 2)]; // Middle point
      console.log('Sample data point breakdown:', {
        datetime: samplePoint.datetime,
        dayzerWind: samplePoint.dayzerWind,
        dayzerSolar: samplePoint.dayzerSolar,
        caisoWind: samplePoint.caisoWind,
        caisoSolar: samplePoint.caisoSolar
      });
      
      // Count non-null values for each source
      const counts = renewablesData.reduce((acc, point) => {
        if (point.dayzerWind !== null) acc.dayzerWind++;
        if (point.dayzerSolar !== null) acc.dayzerSolar++;
        if (point.caisoWind !== null) acc.caisoWind++;
        if (point.caisoSolar !== null) acc.caisoSolar++;
        return acc;
      }, { dayzerWind: 0, dayzerSolar: 0, caisoWind: 0, caisoSolar: 0 });
      
      console.log('Data availability counts:', counts);
    }

    return new Response(JSON.stringify({
      success: true,
      data: renewablesData,
      metadata: {
        scenario: latestScenario,
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
          combined: renewablesData.length,
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Renewables forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch renewables forecast data', 
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
