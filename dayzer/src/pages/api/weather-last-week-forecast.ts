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

interface WeatherDataPoint {
  datetime: string; // ISO string for hour beginning
  temperatureForecast: number; // Temperature forecast in Fahrenheit (extended to last week)
  temperatureActual: number; // Temperature actual in Fahrenheit
  temperatureNormal: number; // Normal temperature in Fahrenheit
  hdd: number; // Heating degree days
  cdd: number; // Cooling degree days
}

export const GET: APIRoute = async ({ request }) => {
  let thirdPool: Pool | null = null;
  
  try {
    // Create third database connection for weather data
    if (process.env.DATABASE_URL_THIRD) {
      try {
        thirdPool = new Pool({
          connectionString: process.env.DATABASE_URL_THIRD,
          ssl: { rejectUnauthorized: false }
        });
        console.log('Third database connection created successfully for weather last week');
      } catch (error) {
        console.error('Failed to create third database connection:', error);
        thirdPool = null;
      }
    } else {
      console.log('DATABASE_URL_THIRD not configured, skipping weather last week data');
      thirdPool = null;
    }

    // Use EXACT same logic as load-last-week-forecast.ts
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
      console.log('Weather Last Week - Using requested scenario for date range:', lastWeekScenario);
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
        where: { scenarioid: lastWeekScenarioId },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Weather Last Week - Using latest scenario:', latestScenario.scenarioid, 'and last week scenario:', lastWeekScenario?.scenarioid);
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

    console.log('Using weather last week scenario for date range:', lastWeekScenario.scenarioid);

    // Get the date range from the scenario (same as load chart)
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
      },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No date range found for last week scenario' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the tail 7 days of the last week scenario (EXACT same as load chart)
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total
    startDate.setHours(0, 0, 0, 0);

    console.log('Weather last week query dates:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get Weather data from third database (Goleta_YES_Pulls table)
    const weatherData: WeatherDataPoint[] = [];

    if (thirdPool) {
      try {
        // Get Temperature Forecast data (extend into last week)
        const tempForecastQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_FORECAST_SB"
          FROM "ERCOT"."Goleta_Weather_Forecast" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        // Get Temperature Actual data
        const tempActualQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        // Get Normal Temperature data
        const tempNormalQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_NORM_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        // Get HDD data
        const hddQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "HDD_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        // Get CDD data
        const cddQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "CDD_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        console.log('Temperature forecast data points:', tempForecastQuery.rows.length);
        console.log('Temperature actual data points:', tempActualQuery.rows.length);
        console.log('Temperature normal data points:', tempNormalQuery.rows.length);
        console.log('HDD data points:', hddQuery.rows.length);
        console.log('CDD data points:', cddQuery.rows.length);

        // Create maps for each weather component
        const tempForecastMap: { [key: string]: number } = {};
        const tempActualMap: { [key: string]: number } = {};
        const tempNormalMap: { [key: string]: number } = {};
        const hddMap: { [key: string]: number } = {};
        const cddMap: { [key: string]: number } = {};

        // Process Temperature Forecast data
        tempForecastQuery.rows.forEach((row: any) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          tempForecastMap[datetimeKey] = parseFloat(row.TEMP_FORECAST_SB) || 0;
        });

        // Process Temperature Actual data
        tempActualQuery.rows.forEach((row: any) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          tempActualMap[datetimeKey] = parseFloat(row.TEMP_SB) || 0;
          
        });

        // Process Normal Temperature data
        tempNormalQuery.rows.forEach((row: any) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          tempNormalMap[datetimeKey] = parseFloat(row.TEMP_NORM_SB) || 0;
        });

        // Process HDD data
        hddQuery.rows.forEach((row: any) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          hddMap[datetimeKey] = parseFloat(row.HDD_SB) || 0;
        });

        // Process CDD data
        cddQuery.rows.forEach((row: any) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          cddMap[datetimeKey] = parseFloat(row.CDD_SB) || 0;
        });

        // Combine all weather data into time series
        const allDatetimes = new Set([
          ...Object.keys(tempForecastMap),
          ...Object.keys(tempActualMap),
          ...Object.keys(tempNormalMap),
          ...Object.keys(hddMap),
          ...Object.keys(cddMap)
        ]);

        Array.from(allDatetimes)
          .sort()
          .forEach(datetime => {
            weatherData.push({
              datetime,
              temperatureForecast: tempForecastMap[datetime] || 0,
              temperatureActual: tempActualMap[datetime] || 0,
              temperatureNormal: tempNormalMap[datetime] || 0,
              hdd: hddMap[datetime] || 0,
              cdd: cddMap[datetime] || 0,
            });
          });

      } catch (queryError) {
        console.error('Failed to query weather last week data:', queryError);
        console.log('Continuing without weather last week data');
      }
    } else {
      console.log('Third database not available, skipping weather last week query');
    }

    // Sort final data by datetime
    weatherData.sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log('Last week combined weather data points:', weatherData.length);
    if (weatherData.length > 0) {
      console.log('Last week first weather point:', weatherData[0]);
      console.log('Last week last weather point:', weatherData[weatherData.length - 1]);
    }

    return new Response(JSON.stringify({
      success: true,
      data: weatherData,
      metadata: {
        scenario: lastWeekScenario,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          durationDays: 7,
        },
        dataPoints: {
          combined: weatherData.length,
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Weather last week forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch weather last week forecast data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (thirdPool) {
      await thirdPool.end();
    }
  }
};
