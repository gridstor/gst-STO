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

interface ScenarioDate {
  date: string; // YYYY-MM-DD format
  scenarioid: number;
  scenarioname: string;
  hasPreviousWeek: boolean; // Whether t-7 scenario exists
}

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('🔍 SCENARIO DATES API STARTING...');

    // Get all scenarios with simulation_date, ordered by date desc
    console.log('Querying info_scenarioid_scenarioname_mapping table...');
    let scenarios;
    try {
      scenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
        where: {
          simulation_date: { not: null },
          scenarioname: { contains: 'CAISO_WEEK' }, // Only CAISO_WEEK scenarios
        },
        select: {
          scenarioid: true,
          scenarioname: true,
          simulation_date: true,
        },
        orderBy: {
          simulation_date: 'desc'
        }
      });
      console.log('Prisma query successful. Total scenarios found:', scenarios.length);
    } catch (prismaError) {
      console.error('Prisma query failed:', prismaError);
      throw new Error(`Database query failed: ${prismaError instanceof Error ? prismaError.message : 'Unknown error'}`);
    }

    // Group scenarios by simulation_date and get the highest scenarioid for each date
    const dateScenarioMap: { [date: string]: { scenarioid: number, scenarioname: string } } = {};
    
    scenarios.forEach(scenario => {
      if (scenario.simulation_date) {
        // Handle both Date objects and string dates
        let dateStr: string;
        if (typeof scenario.simulation_date === 'string') {
          // If it's already a string, convert to YYYY-MM-DD format
          const date = new Date(scenario.simulation_date);
          dateStr = date.toISOString().split('T')[0];
        } else {
          // If it's a Date object, convert to ISO string
          dateStr = scenario.simulation_date.toISOString().split('T')[0];
        }
        
        console.log('Processing scenario:', scenario.scenarioid, 'date:', dateStr);
        
        // Keep the highest scenarioid for each date (most recent run)
        if (!dateScenarioMap[dateStr] || scenario.scenarioid > dateScenarioMap[dateStr].scenarioid) {
          dateScenarioMap[dateStr] = {
            scenarioid: scenario.scenarioid,
            scenarioname: scenario.scenarioname || `Scenario ${scenario.scenarioid}`
          };
          
          // Debug specific dates
          if (dateStr === '2025-09-18' || dateStr === '2025-09-11') {
            console.log(`KEY DATE MAPPING: ${dateStr} → Scenario ${scenario.scenarioid}`);
          }
        }
      }
    });

    console.log('Unique dates with scenarios:', Object.keys(dateScenarioMap).length);

    // Create array of available dates with previous week check
    const availableDates: ScenarioDate[] = [];
    const dateEntries = Object.entries(dateScenarioMap);

    for (const [dateStr, scenarioInfo] of dateEntries) {
      const currentDate = new Date(dateStr);
      const previousWeekDate = new Date(currentDate);
      previousWeekDate.setDate(currentDate.getDate() - 7);
      const previousWeekDateStr = previousWeekDate.toISOString().split('T')[0];

      // Check if previous week scenario exists
      const hasPreviousWeek = dateScenarioMap[previousWeekDateStr] !== undefined;

      availableDates.push({
        date: dateStr,
        scenarioid: scenarioInfo.scenarioid,
        scenarioname: scenarioInfo.scenarioname,
        hasPreviousWeek: hasPreviousWeek
      });
    }

    // Sort by date descending (most recent first)
    availableDates.sort((a, b) => b.date.localeCompare(a.date));

    console.log('Available dates processed:', availableDates.length);
    if (availableDates.length > 0) {
      console.log('Most recent available date:', availableDates[0]);
      console.log('Oldest available date:', availableDates[availableDates.length - 1]);
    }

    // Find today's date or closest available date as default
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = availableDates.find(d => d.date <= today) || availableDates[0];

    return new Response(JSON.stringify({
      success: true,
      availableDates: availableDates,
      defaultDate: defaultDate?.date || null,
      metadata: {
        totalDates: availableDates.length,
        dateRange: {
          earliest: availableDates[availableDates.length - 1]?.date,
          latest: availableDates[0]?.date
        },
        datesWithPreviousWeek: availableDates.filter(d => d.hasPreviousWeek).length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Available scenario dates error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch available scenario dates', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
