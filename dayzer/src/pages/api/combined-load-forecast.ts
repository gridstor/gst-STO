import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
const { Pool } = pkg;

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

interface CombinedLoadDataPoint {
  datetime: string;
  // Last Week data
  dayzerLoadLastWeek?: number;
  dayzerNetLoadLastWeek?: number;
  caisoLoadLastWeek?: number;
  caisoNetLoadLastWeek?: number;
  rtLoadLastWeek?: number;
  rtNetLoadLastWeek?: number;
  // Forecast data
  dayzerLoadForecast?: number;
  dayzerNetLoadForecast?: number;
  caisoLoadForecast?: number;
  caisoNetLoadForecast?: number;
  isLastWeek: boolean;
}

export const GET: APIRoute = async ({ request }) => {
  console.log('=== COMBINED LOAD FORECAST API CALLED ===');
  try {
    // Get most recent scenario
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
    const lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: { scenarioid: lastWeekScenarioId },
      select: { scenarioid: true, scenarioname: true },
    });

    if (!lastWeekScenario) {
      return new Response(
        JSON.stringify({ error: `Scenario ${lastWeekScenarioId} not found for last week comparison` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Combined Load - Latest scenario:', latestScenario);
    console.log('Combined Load - Last week scenario:', lastWeekScenario);

    // Get date ranges for both scenarios
    // 1. Last Week Data Range (tail 7 days)
    const lastWeekDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: lastWeekScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!lastWeekDateRange._min.Date || !lastWeekDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No last week data found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lastWeekEndDate = new Date(lastWeekDateRange._max.Date);
    lastWeekEndDate.setHours(23, 59, 59, 999);
    const lastWeekStartDate = new Date(lastWeekEndDate);
    lastWeekStartDate.setDate(lastWeekEndDate.getDate() - 6); // 7 days total
    lastWeekStartDate.setHours(0, 0, 0, 0);

    // 2. Forecast Data Range (tail 7 days)
    const forecastDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: latestScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!forecastDateRange._min.Date || !forecastDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No forecast data found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const forecastEndDate = new Date(forecastDateRange._max.Date);
    forecastEndDate.setHours(23, 59, 59, 999);
    const forecastStartDate = new Date(forecastEndDate);
    forecastStartDate.setDate(forecastEndDate.getDate() - 6); // 7 days total
    forecastStartDate.setHours(0, 0, 0, 0);

    console.log('Last week date range:', lastWeekStartDate.toISOString(), 'to', lastWeekEndDate.toISOString());
    console.log('Forecast date range:', forecastStartDate.toISOString(), 'to', forecastEndDate.toISOString());

    console.log('About to fetch Last Week Load Data...');

    // Fetch Last Week Load Data
    let lastWeekLoadResults;
    try {
      lastWeekLoadResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid: lastWeekScenario.scenarioid,
          Date: {
            gte: lastWeekStartDate,
            lte: lastWeekEndDate,
          },
        },
        select: { Date: true, Hour: true, demandmw: true },
        orderBy: [{ Date: 'asc' }, { Hour: 'asc' }],
      });
      console.log('Last Week Load Data fetched:', lastWeekLoadResults.length, 'records');
    } catch (error) {
      console.error('Error fetching last week load data:', error);
      throw error;
    }

    // Fetch Last Week Net Load Data (renewables)
    const lastWeekRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: lastWeekStartDate,
          lte: lastWeekEndDate,
        },
        fuelname: { in: ['Wind', 'wind', 'Sun', 'sun'] },
      },
      select: { Date: true, Hour: true, generationmw: true },
      orderBy: [{ Date: 'asc' }, { Hour: 'asc' }],
    });

    console.log('Last Week Renewable Data fetched:', lastWeekRenewableResults.length, 'records');

    // Fetch Forecast Load Data
    const forecastLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        Date: {
          gte: forecastStartDate,
          lte: forecastEndDate,
        },
      },
      select: { Date: true, Hour: true, demandmw: true },
      orderBy: [{ Date: 'asc' }, { Hour: 'asc' }],
    });

    // Fetch Forecast Net Load Data (renewables)
    const forecastRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        Date: {
          gte: forecastStartDate,
          lte: forecastEndDate,
        },
        fuelname: { in: ['Wind', 'wind', 'Sun', 'sun'] },
      },
      select: { Date: true, Hour: true, generationmw: true },
      orderBy: [{ Date: 'asc' }, { Hour: 'asc' }],
    });

    console.log('Data counts:');
    console.log('- Last week load results:', lastWeekLoadResults.length);
    console.log('- Last week renewable results:', lastWeekRenewableResults.length);
    console.log('- Forecast load results:', forecastLoadResults.length);
    console.log('- Forecast renewable results:', forecastRenewableResults.length);

    // Create secondary database connection for CAISO and RT data
    const secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    let caisoLastWeekLoadMap: { [key: string]: number } = {};
    let caisoLastWeekNetLoadMap: { [key: string]: number } = {};
    let caisoForecastLoadMap: { [key: string]: number } = {};
    let caisoForecastNetLoadMap: { [key: string]: number } = {};
    let rtLastWeekLoadMap: { [key: string]: number } = {};
    let rtLastWeekNetLoadMap: { [key: string]: number } = {};

    try {
      // Get CAISO Last Week Load
      const caisoLastWeekLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'DA_LOAD_FORECAST', lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);

      caisoLastWeekLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoLastWeekLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });

      // Get CAISO Last Week Net Load
      const caisoLastWeekNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'DA_NET_LOAD_FORECAST', lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);

      caisoLastWeekNetLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoLastWeekNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });

      // Get CAISO Forecast Load
      const caisoForecastLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'DA_LOAD_FORECAST', forecastStartDate.toISOString(), forecastEndDate.toISOString()]);

      caisoForecastLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoForecastLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });

      // Get CAISO Forecast Net Load
      const caisoForecastNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'DA_NET_LOAD_FORECAST', forecastStartDate.toISOString(), forecastEndDate.toISOString()]);

      caisoForecastNetLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoForecastNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });

      // Get RT Last Week Load
      const rtLastWeekLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'RTLOAD', lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);

      const rtLoadTemp: { [key: string]: { sum: number, count: number } } = {};
      rtLastWeekLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        datetime.setMinutes(0, 0, 0);
        const key = datetime.toISOString();
        if (!rtLoadTemp[key]) { rtLoadTemp[key] = { sum: 0, count: 0 }; }
        rtLoadTemp[key].sum += parseFloat(row.value) || 0;
        rtLoadTemp[key].count += 1;
      });
      Object.keys(rtLoadTemp).forEach(key => {
        rtLastWeekLoadMap[key] = rtLoadTemp[key].sum / rtLoadTemp[key].count;
      });

      // Get RT Last Week Net Load
      const rtLastWeekNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', 'NET_RTLOAD', lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);

      const rtNetLoadTemp: { [key: string]: { sum: number, count: number } } = {};
      rtLastWeekNetLoadQuery.rows.forEach((row: any) => {
        const datetime = new Date(row.local_datetime_ib);
        datetime.setMinutes(0, 0, 0);
        const key = datetime.toISOString();
        if (!rtNetLoadTemp[key]) { rtNetLoadTemp[key] = { sum: 0, count: 0 }; }
        rtNetLoadTemp[key].sum += parseFloat(row.value) || 0;
        rtNetLoadTemp[key].count += 1;
      });
      Object.keys(rtNetLoadTemp).forEach(key => {
        rtLastWeekNetLoadMap[key] = rtNetLoadTemp[key].sum / rtNetLoadTemp[key].count;
      });

    } catch (poolError) {
      console.error('Error fetching CAISO/RT data:', poolError);
    } finally {
      await secondaryPool.end();
    }

    // Process Last Week Load Data
    const lastWeekLoadMap: { [key: string]: number } = {};
    lastWeekLoadResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0); // Convert hour ending to hour beginning
      const datetimeKey = datetime.toISOString();
      
      if (!lastWeekLoadMap[datetimeKey]) {
        lastWeekLoadMap[datetimeKey] = 0;
      }
      lastWeekLoadMap[datetimeKey] += (row.demandmw || 0); // SUM multiple zones
    });

    // Process Last Week Renewable Data (for net load calculation)
    const lastWeekRenewableMap: { [key: string]: number } = {};
    lastWeekRenewableResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!lastWeekRenewableMap[datetimeKey]) {
        lastWeekRenewableMap[datetimeKey] = 0;
      }
      lastWeekRenewableMap[datetimeKey] += (row.generationmw || 0);
    });

    // Process Forecast Load Data
    const forecastLoadMap: { [key: string]: number } = {};
    forecastLoadResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      if (!forecastLoadMap[datetimeKey]) {
        forecastLoadMap[datetimeKey] = 0;
      }
      forecastLoadMap[datetimeKey] += (row.demandmw || 0); // SUM multiple zones
    });

    // Process Forecast Renewable Data
    const forecastRenewableMap: { [key: string]: number } = {};
    forecastRenewableResults.forEach(row => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!forecastRenewableMap[datetimeKey]) {
        forecastRenewableMap[datetimeKey] = 0;
      }
      forecastRenewableMap[datetimeKey] += (row.generationmw || 0);
    });

    // Create combined timeline
    const allDatetimes = new Set<string>();
    
    // Add all last week datetimes
    Object.keys(lastWeekLoadMap).forEach(dt => allDatetimes.add(dt));
    // Add all forecast datetimes
    Object.keys(forecastLoadMap).forEach(dt => allDatetimes.add(dt));

    const sortedDatetimes = Array.from(allDatetimes).sort();

    // Create combined data points
    const combinedData: CombinedLoadDataPoint[] = sortedDatetimes.map(datetime => {
      const isLastWeek = datetime >= lastWeekStartDate.toISOString() && datetime <= lastWeekEndDate.toISOString();
      
      return {
        datetime,
        isLastWeek,
        // Last Week data (only populated for last week dates)
        dayzerLoadLastWeek: isLastWeek ? lastWeekLoadMap[datetime] : undefined,
        dayzerNetLoadLastWeek: isLastWeek ? (lastWeekLoadMap[datetime] || 0) - (lastWeekRenewableMap[datetime] || 0) : undefined,
        caisoLoadLastWeek: isLastWeek ? caisoLastWeekLoadMap[datetime] : undefined,
        caisoNetLoadLastWeek: isLastWeek ? caisoLastWeekNetLoadMap[datetime] : undefined,
        rtLoadLastWeek: isLastWeek ? rtLastWeekLoadMap[datetime] : undefined,
        rtNetLoadLastWeek: isLastWeek ? rtLastWeekNetLoadMap[datetime] : undefined,
        // Forecast data (only populated for forecast dates)
        dayzerLoadForecast: !isLastWeek ? forecastLoadMap[datetime] : undefined,
        dayzerNetLoadForecast: !isLastWeek ? (forecastLoadMap[datetime] || 0) - (forecastRenewableMap[datetime] || 0) : undefined,
        caisoLoadForecast: !isLastWeek ? caisoForecastLoadMap[datetime] : undefined,
        caisoNetLoadForecast: !isLastWeek ? caisoForecastNetLoadMap[datetime] : undefined,
      };
    });

    console.log('Combined data points:', combinedData.length);
    console.log('Last week data points:', combinedData.filter(d => d.isLastWeek).length);
    console.log('Forecast data points:', combinedData.filter(d => !d.isLastWeek).length);

    // Debug: Check sample values
    if (combinedData.length > 0) {
      const sampleLastWeek = combinedData.find(d => d.isLastWeek);
      const sampleForecast = combinedData.find(d => !d.isLastWeek);
      
      if (sampleLastWeek) {
        console.log('Sample Last Week data:', {
          datetime: sampleLastWeek.datetime,
          load: sampleLastWeek.dayzerLoadLastWeek,
          renewable: lastWeekRenewableMap[sampleLastWeek.datetime],
          netLoad: sampleLastWeek.dayzerNetLoadLastWeek
        });
      }
      
      if (sampleForecast) {
        console.log('Sample Forecast data:', {
          datetime: sampleForecast.datetime,
          load: sampleForecast.dayzerLoadForecast,
          renewable: forecastRenewableMap[sampleForecast.datetime],
          netLoad: sampleForecast.dayzerNetLoadForecast
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: combinedData,
      metadata: {
        lastWeekScenario: lastWeekScenario,
        forecastScenario: latestScenario,
        lastWeekDateRange: {
          start: lastWeekStartDate.toISOString().split('T')[0],
          end: lastWeekEndDate.toISOString().split('T')[0],
        },
        forecastDateRange: {
          start: forecastStartDate.toISOString().split('T')[0],
          end: forecastEndDate.toISOString().split('T')[0],
        },
        dataPoints: {
          lastWeek: combinedData.filter(d => d.isLastWeek).length,
          forecast: combinedData.filter(d => !d.isLastWeek).length,
          combined: combinedData.length,
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Combined load forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch combined load forecast data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
