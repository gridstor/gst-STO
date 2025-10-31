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
        JSON.stringify({ error: 'No scenario found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get simulation date to calculate date range
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

    const results = await prisma.$queryRaw`
      SELECT "Date", "Hour", energy, congestion, losses 
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid}
        AND "Date" >= ${forecastStart}
        AND "Date" <= ${forecastEnd}
      ORDER BY "Date" ASC, "Hour" ASC
    ` as any[];

    const data = results.map((row: any) => {
      // Create a datetime by combining date and hour using setHours for proper handling
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      
      return {
        datetime: datetime.toISOString(),
        Energy: row.energy,
        Congestion: row.congestion,
        Loss: row.losses,
        LMP: row.energy + row.congestion + row.losses,
      };
    });

    return new Response(JSON.stringify(data), {
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