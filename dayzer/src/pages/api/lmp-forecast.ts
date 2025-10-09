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

interface LMPDataPoint {
  datetime: string; // ISO string for hour beginning
  energy: number;
  congestion: number;
  losses: number;
  lmp: number;
}

export const GET: APIRoute = async ({ request }) => {
  try {
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
      console.log('LMP Forecast - Using requested scenario:', latestScenario);
    } else {
      // Get most recent scenario (default behavior)
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true, scenarioname: true },
      });
      console.log('LMP Forecast - Using latest scenario:', latestScenario);
    }

    if (!latestScenario) {
      return new Response(
        JSON.stringify({ error: 'No scenarios found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using latest scenario for LMP forecast:', latestScenario);

    // Determine the date range based on latest scenario data (same logic as Load Forecast)
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: latestScenario.scenarioid,
        unitid: 66038, // Goleta unit
      },
      _min: { Date: true },
      _max: { Date: true },
    });

    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: 'No LMP data found for this scenario' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use only the last 7 days of the forecast data (same as Load Forecast)
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days total
    startDate.setHours(0, 0, 0, 0);

    console.log('LMP forecast span:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get LMP components data from results_units for Goleta (unitid = 66038)
    const lmpResults = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        unitid: 66038,
        Date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        Date: true,
        Hour: true,
        energy: true,
        congestion: true,
        losses: true,
        lmp: true,
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
    });

    console.log('LMP forecast data points:', lmpResults.length);

    // Process data: convert hour ending to hour beginning
    const lmpData: LMPDataPoint[] = lmpResults.map(row => {
      // Convert hour ending to hour beginning
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0); // HE 1 -> HB 0, HE 2 -> HB 1, etc.

      return {
        datetime: datetime.toISOString(),
        energy: row.energy || 0,
        congestion: row.congestion || 0,
        losses: row.losses || 0,
        lmp: row.lmp || 0,
      };
    });

    console.log('Processed LMP forecast data points:', lmpData.length);
    if (lmpData.length > 0) {
      console.log('First LMP point:', lmpData[0]);
      console.log('Last LMP point:', lmpData[lmpData.length - 1]);
    }

    return new Response(JSON.stringify({
      success: true,
      data: lmpData,
      metadata: {
        scenario: latestScenario,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          durationDays: 7,
        },
        dataPoints: {
          combined: lmpData.length,
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LMP forecast error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch LMP forecast data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
