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
    const simulationDate = new Date(scenarioInfo.simulation_date);
    const forecastStart = new Date(simulationDate);
    const forecastEnd = new Date(simulationDate);
    forecastEnd.setDate(forecastEnd.getDate() + 6);

    // Get zone name mappings for this scenario
    const zoneNameMappings = await prisma.info_zoneid_zonename_mapping.findMany({
      where: {
        scenarioid,
      },
      select: {
        zoneid: true,
        zonename: true,
      },
    });

    // Create a map from zoneid to zonename
    const zoneIdToName = new Map(
      zoneNameMappings.map((mapping: { zoneid: number; zonename: string }) => [mapping.zoneid, mapping.zonename])
    );

    const results = await prisma.zone_demand.findMany({
      where: {
        scenarioid,
        Date: {
          gte: forecastStart,
          lte: forecastEnd
        }
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' },
        { zoneid: 'asc' }
      ],
      select: {
        Date: true,
        Hour: true,
        zoneid: true,
        demandmw: true,
      },
    });

    console.log('Raw zone_demand count:', results.length);
    console.log('First 3 zone_demand records:', results.slice(0, 3));
    console.log('Date range in data:', {
      first: results[0]?.Date,
      last: results[results.length - 1]?.Date
    });
    console.log('Hour range sample:', results.slice(0, 24).map((r: { Date: Date; Hour: number; zoneid: number; demandmw: number | null }) => ({ Date: r.Date, Hour: r.Hour, zoneid: r.zoneid })));

    // Filter to only include the specific zones we want to display
    const allowedZoneNames = [
      "Pacific Gas & Electric",
      "San Diego Gas & Electric", 
      "Southern CA Edison",
      "Valley Electric Association"
    ];

    // Process and aggregate data by datetime
    const aggregatedData: { [datetime: string]: { [zoneName: string]: number } } = {};

    results.forEach((row: { Date: Date; Hour: number; zoneid: number; demandmw: number | null }) => {
      // Get zone name from mapping
      const zoneName = zoneIdToName.get(row.zoneid) as string | undefined;
      
      // Skip if zone name is not in our allowed list
      if (!zoneName || !allowedZoneNames.includes(zoneName)) {
        return;
      }
      
      // Create a datetime key by combining date and hour
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      
      // Convert MW to GW and ensure non-negative
      const demandGW = Math.max(0, (row.demandmw || 0) / 1000);
      
      if (!aggregatedData[datetimeKey]) {
        aggregatedData[datetimeKey] = {};
      }
      
      if (!aggregatedData[datetimeKey][zoneName]) {
        aggregatedData[datetimeKey][zoneName] = 0;
      }
      
      aggregatedData[datetimeKey][zoneName] += demandGW;
    });

    // Convert to array format for the chart
    const processedData = Object.entries(aggregatedData)
      .map(([datetime, zones]: [string, { [zoneName: string]: number }]) => {
        const result: any = { datetime };
        Object.entries(zones).forEach(([zoneName, demand]) => {
          result[zoneName] = demand;
        });
        return result;
      })
      .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    console.log('Processed zone demand data count:', processedData.length);
    console.log('First 3 processed records:', processedData.slice(0, 3));
    console.log('Unique datetime count:', Object.keys(aggregatedData).length);
    console.log('Sample datetime keys:', Object.keys(aggregatedData).slice(0, 10));

    // Get scenario metadata (simulation date)
    const scenarioMetadata = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: { scenarioid },
      select: { 
        simulation_date: true,
        scenarioname: true
      }
    });

    // Calculate date range from the data
    let dateRange = null;
    if (results.length > 0) {
      const dates = results.map(r => r.Date);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      dateRange = {
        start: minDate.toISOString().split('T')[0],
        end: maxDate.toISOString().split('T')[0]
      };
    }

    return new Response(JSON.stringify({ 
      scenarioid,
      simulationDate: scenarioMetadata?.simulation_date || null,
      dateRange,
      data: processedData 
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