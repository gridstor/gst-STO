import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Primary database client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

interface LMPDataPoint {
  datetime: string;
  dayName: string;
  thisWeekLMP: number | null;
  lastWeekLMP: number | null;
}

export const GET: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    // Create secondary database connection
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get('scenarioid');
    const comparisonPeriod = url.searchParams.get('period') || 'lastWeek'; // 'lastWeek', 'lastYear', 'thisWeek'
    
    let scenarioid: number | null = null;
    
    if (requestedScenarioid) {
      scenarioid = parseInt(requestedScenarioid, 10);
    } else {
      return new Response(
        JSON.stringify({ error: 'scenarioid is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get simulation date as reference point
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

    // Parse simulation date (format: "June 30, 2025")
    const simulationDate = new Date(scenarioInfo.simulation_date);
    
    // Calculate date ranges
    // This week: simulation date through 6 days later
    const thisWeekStart = new Date(simulationDate);
    const thisWeekEnd = new Date(simulationDate);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    
    // Calculate comparison period based on selection
    let comparisonStart: Date;
    let comparisonEnd: Date;
    let comparisonLabel: string;
    
    if (comparisonPeriod === 'lastYear') {
      // Last year: same week, one year ago
      comparisonStart = new Date(simulationDate);
      comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
      comparisonEnd = new Date(comparisonStart);
      comparisonEnd.setDate(comparisonEnd.getDate() + 6);
      comparisonLabel = 'Last Year';
    } else if (comparisonPeriod === 'lastWeek' || comparisonPeriod === 'thisWeek') {
      // Last week: 7 days before simulation date through day before simulation date
      comparisonStart = new Date(simulationDate);
      comparisonStart.setDate(comparisonStart.getDate() - 7);
      comparisonEnd = new Date(simulationDate);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonEnd.setHours(23, 59, 59, 999);
      comparisonLabel = 'Last Week';
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid comparison period' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }


    // Query this week's LMP from primary database (Unit 66038 - Goleta)
    const thisWeekData = await prisma.results_units.findMany({
      where: {
        scenarioid,
        unitid: 66038,
        Date: {
          gte: thisWeekStart,
          lte: thisWeekEnd,
        },
      },
      select: {
        Date: true,
        Hour: true,
        lmp: true,
      },
      orderBy: [
        { Date: 'asc' },
        { Hour: 'asc' }
      ],
    });

    // Query comparison period's LMP from secondary database (historical data)
    let comparisonData: any[] = [];
    try {
      const comparisonResult = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ['GOLETA_6_N100', 'DALMP', comparisonStart.toISOString(), comparisonEnd.toISOString()]);
      
      comparisonData = comparisonResult.rows;
    } catch (queryError) {
      console.error('Failed to query secondary database:', queryError);
      comparisonData = [];
    }


    // Create combined hourly data
    const combinedData: LMPDataPoint[] = [];
    
    // Generate all 168 hours for this week
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const currentDate = new Date(thisWeekStart);
        currentDate.setDate(currentDate.getDate() + day);
        currentDate.setHours(hour, 0, 0, 0);
        
        // Get day name
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[currentDate.getDay()];
        
        // Find this week's LMP
        const thisWeekMatch = thisWeekData.find(d => {
          const dataDate = new Date(d.Date);
          dataDate.setHours(d.Hour, 0, 0, 0);
          return dataDate.getTime() === currentDate.getTime();
        });
        
        // Find comparison period's LMP (same day/hour offset from comparison start)
        const comparisonDateTime = new Date(comparisonStart);
        comparisonDateTime.setDate(comparisonDateTime.getDate() + day);
        comparisonDateTime.setHours(hour, 0, 0, 0);
        
        // For DA LMP (Day-Ahead), the data is at the hour ending mark
        // Match exactly on the hour
        const hourlyRecords = comparisonData.filter(d => {
          const dataDate = new Date(d.local_datetime_ib);
          return dataDate.getTime() === comparisonDateTime.getTime();
        });
        
        let lastWeekLMP = null;
        if (hourlyRecords.length > 0) {
          const validRecords = hourlyRecords.filter(r => r.value !== null && !isNaN(Number(r.value)));
          if (validRecords.length > 0) {
            const sum = validRecords.reduce((acc, r) => acc + Number(r.value), 0);
            lastWeekLMP = sum / validRecords.length; // Average if multiple records
          }
        }
        
        combinedData.push({
          datetime: currentDate.toISOString(),
          dayName,
          thisWeekLMP: thisWeekMatch?.lmp || null,
          lastWeekLMP: lastWeekLMP,
        });
      }
    }

    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      comparisonPeriod,
      data: combinedData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        comparisonRange: `${comparisonStart.toDateString()} - ${comparisonEnd.toDateString()}`,
        totalHours: combinedData.length,
        thisWeekDataPoints: thisWeekData.length,
        comparisonDataPoints: comparisonData.length,
        comparisonLabel
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch TB2.6 LMP comparison data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    // Clean up the secondary connection
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
};

