import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get parameters from query
    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get('scenarioid');
    
    let scenarioid: number | null = null;
    
    if (requestedScenarioid) {
      scenarioid = parseInt(requestedScenarioid, 10);
    } else {
      // Find the most recent scenarioid with "CAISO_WEEK" in the name
      let latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioname: {
            contains: 'CAISO_WEEK'
          }
        },
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true },
      });
      
      // If no CAISO_WEEK scenario found, fall back to most recent overall
      if (!latestScenario) {
        latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: 'desc' },
          select: { scenarioid: true },
        });
      }
      
      scenarioid = latestScenario?.scenarioid || null;
    }
    
    if (!scenarioid) {
      return new Response(
        JSON.stringify({ scenarioid: null, data: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get scenario metadata to determine date range
    const scenarioInfo = await prisma.info_scenarioid_scenarioname_mapping.findUnique({
      where: { scenarioid },
      select: { simulation_date: true }
    });

    if (!scenarioInfo?.simulation_date) {
      return new Response(
        JSON.stringify({ error: 'No simulation date found for scenario' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate consistent date range: simulation_date through simulation_date + 6 (7 days total)
    // Parse date carefully to avoid timezone shift
    console.log('Simulation date string:', scenarioInfo.simulation_date);
    const simulationDate = new Date(scenarioInfo.simulation_date);
    console.log('Parsed simulation date:', simulationDate);
    
    const forecastStart = new Date(simulationDate);
    forecastStart.setHours(0, 0, 0, 0);
    const forecastEnd = new Date(simulationDate);
    forecastEnd.setDate(forecastEnd.getDate() + 6);
    forecastEnd.setHours(23, 59, 59, 999);
    
    console.log('Forecast range:', forecastStart.toISOString(), 'to', forecastEnd.toISOString());

    // Get total demand from zone_demand table
    const demandResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid,
        Date: {
          gte: forecastStart,
          lte: forecastEnd
        }
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
      select: {
        Date: true,
        Hour: true,
        demandmw: true,
      },
    });

    console.log('Raw zone_demand count:', demandResults.length);

    // Aggregate total demand by datetime
    const demandByDatetime: { [key: string]: number } = {};
    demandResults.forEach((row: { Date: Date; Hour: number; demandmw: number | null }) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      if (!demandByDatetime[datetimeKey]) {
        demandByDatetime[datetimeKey] = 0;
      }
      
      demandByDatetime[datetimeKey] += (row.demandmw || 0) / 1000; // Convert MW to GW
    });

    // Get renewable generation from results_units table (solar and wind)
    const renewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid,
        Date: {
          gte: forecastStart,
          lte: forecastEnd
        },
        OR: [
          { fuelname: 'sun' },
          { fuelname: 'Sun' },
          { fuelname: 'wind' },
          { fuelname: 'Wind' }
        ]
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
      select: {
        Date: true,
        Hour: true,
        fuelname: true,
        generationmw: true,
      },
    });

    console.log('Raw renewable results count:', renewableResults.length);

    // Aggregate renewable generation by datetime
    const renewableByDatetime: { [key: string]: number } = {};
    renewableResults.forEach((row: { Date: Date; Hour: number; fuelname: string | null; generationmw: number | null }) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      if (!renewableByDatetime[datetimeKey]) {
        renewableByDatetime[datetimeKey] = 0;
      }
      
      renewableByDatetime[datetimeKey] += (row.generationmw || 0) / 1000; // Convert MW to GW
    });

    // Combine demand and renewable data to calculate net load
    const processedData = Object.keys(demandByDatetime)
      .map(datetime => {
        const totalDemand = demandByDatetime[datetime];
        const renewableGeneration = renewableByDatetime[datetime] || 0;
        const netLoad = totalDemand - renewableGeneration;
        
        return {
          datetime,
          totalDemand,
          renewableGeneration,
          netLoad,
        };
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    // Get CAISO Net Load forecast data from yes_fundamentals table
    const caisoNetLoadResults = await prisma.yes_fundamentals.findMany({
      where: {
        attribute: 'DA_NET_LOAD_FORECAST',
        entity: 'CAISO'
      },
      orderBy: [
        { local_datetime_lb: 'asc' }
      ],
      select: {
        local_datetime_lb: true,
        value: true,
      },
    });

    console.log('Raw CAISO Net Load count:', caisoNetLoadResults.length);

    // Process CAISO Net Load data - convert hour beginning to hour ending and to GW
    const caisoNetLoadByDatetime: { [key: string]: number } = {};
    caisoNetLoadResults.forEach((row: { local_datetime_lb: Date | null; value: number | null }) => {
      if (row.local_datetime_lb && row.value) {
        // Convert hour beginning to hour ending by adding 1 hour
        const datetime = new Date(row.local_datetime_lb);
        datetime.setHours(datetime.getHours() + 1);
        const datetimeKey = datetime.toISOString();
        
        // Convert MW to GW
        caisoNetLoadByDatetime[datetimeKey] = row.value / 1000;
      }
    });

    // Add CAISO Net Load to the processed data
    const finalProcessedData = processedData.map(item => ({
      ...item,
      caisoNetLoad: caisoNetLoadByDatetime[item.datetime] || null,
    }));

    console.log('Processed net load data count:', finalProcessedData.length);
    console.log('First 3 processed records:', finalProcessedData.slice(0, 3));

    return new Response(JSON.stringify({ 
      scenarioid, 
      data: finalProcessedData 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data from database' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}; 