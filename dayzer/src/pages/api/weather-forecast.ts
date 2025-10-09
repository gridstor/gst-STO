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
  temperatureForecast: number; // Temperature forecast in Fahrenheit
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
        console.log('Third database connection created successfully for weather forecast');
      } catch (error) {
        console.error('Failed to create third database connection:', error);
        thirdPool = null;
      }
    } else {
      console.log('DATABASE_URL_THIRD not configured, skipping weather forecast data');
      thirdPool = null;
    }

    // Use EXACT same logic as load-net-load-forecast.ts
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
      console.log('Weather Forecast - Using requested scenario for date range:', latestScenario);
    } else {
      // Get most recent scenario (default behavior)
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('Weather Forecast - Using latest scenario for date range:', latestScenario);
    }

    if (!latestScenario) {
      return new Response(
        JSON.stringify({ error: 'No scenarios found for date range calculation' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the date range from the scenario (same as load chart)
    const zoneDataCount = await prisma.zone_demand.count({
      where: {
        scenarioid: latestScenario.scenarioid,
      },
    });

    let dayzerDateRange;
    if (zoneDataCount === 0) {
      dayzerDateRange = await prisma.results_units.aggregate({
        where: {
          scenarioid: latestScenario.scenarioid,
        },
        _min: { Date: true },
        _max: { Date: true },
      });
    } else {
      dayzerDateRange = await prisma.zone_demand.aggregate({
        where: {
          scenarioid: latestScenario.scenarioid,
        },
        _min: { Date: true },
        _max: { Date: true },
      });
    }

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No date range found for scenario' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use only the last 7 days of the forecast data (EXACT same as load chart)
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total
    startDate.setHours(0, 0, 0, 0);

    console.log('Weather forecast span:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get Temperature Forecast from third database (Goleta_Weather_Forecast table)
    const weatherData: WeatherDataPoint[] = [];

    if (thirdPool) {
      try {
        const temperatureForecastQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_FORECAST_SB"
          FROM "ERCOT"."Goleta_Weather_Forecast" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);

        console.log('Temperature forecast data points:', temperatureForecastQuery.rows.length);

        temperatureForecastQuery.rows.forEach((row: any) => {
          // Convert hour ending to hour beginning (same as load chart)
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1); // Convert HE to HB
          const datetimeKey = datetime.toISOString();
          const tempForecast = parseFloat(row.TEMP_FORECAST_SB) || 0;


          weatherData.push({
            datetime: datetimeKey,
            temperatureForecast: tempForecast,
          });
        });
      } catch (queryError) {
        console.error('Failed to query weather forecast data:', queryError);
        console.log('Continuing without weather forecast data');
      }
    } else {
      console.log('Third database not available, skipping weather forecast query');
    }

    // Sort by datetime
    weatherData.sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log('Processed weather forecast data points:', weatherData.length);
    if (weatherData.length > 0) {
      console.log('First weather forecast point:', weatherData[0]);
      console.log('Last weather forecast point:', weatherData[weatherData.length - 1]);
    }

    return new Response(JSON.stringify({
      success: true,
      data: weatherData,
      metadata: {
        scenario: latestScenario,
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
    console.error('Weather forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch weather forecast data', 
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
