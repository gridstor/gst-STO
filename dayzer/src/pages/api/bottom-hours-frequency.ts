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

interface BottomHoursData {
  forecastWeekFrequency: number[];  // HE1-24 frequency (0-7)
  lastWeekFrequency: number[];      // HE1-24 frequency (0-7)
  metadata: {
    forecastWeekRange: string;
    lastWeekRange: string;
  };
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
        select: { scenarioid: true, simulation_date: true },
      });
      
      if (!latestScenario) {
        latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: 'desc' },
          select: { scenarioid: true, simulation_date: true },
        });
      }
      
      scenarioid = latestScenario?.scenarioid || null;
    }
    
    if (!scenarioid) {
      return new Response(
        JSON.stringify({ error: 'No scenario found' }),
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

    // Parse simulation date and calculate date ranges
    const simulationDate = new Date(scenarioInfo.simulation_date);
    
    // This week: simulation date through 6 days later
    const thisWeekStart = new Date(simulationDate);
    const thisWeekEnd = new Date(simulationDate);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    
    // Last week: 7 days before simulation date through day before simulation date
    const lastWeekStart = new Date(simulationDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(simulationDate);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Query forecast week's LMP from primary database (Unit 66038)
    const forecastWeekData = await prisma.results_units.findMany({
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

    // Query last week's LMP from secondary database
    const lastWeekResult = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ['GOLETA_6_N100', 'DALMP', lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
    
    const lastWeekRawData = lastWeekResult.rows;

    // Convert last week's DALMP data to hourly averages
    const lastWeekHourlyData: { date: Date, hour: number, lmp: number }[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 1; hour <= 24; hour++) { // HE 1-24
        const targetDate = new Date(lastWeekStart);
        targetDate.setDate(targetDate.getDate() + day);
        
        // For HE hour, we need data from (hour-1):00 to hour:00
        const hourStart = new Date(targetDate);
        hourStart.setHours(hour - 1, 0, 0, 0);
        const hourEnd = new Date(targetDate);
        hourEnd.setHours(hour, 0, 0, 0);
        
        // Find all 5-minute records within this hour
        const hourlyRecords = lastWeekRawData.filter(d => {
          const dataDate = new Date(d.local_datetime_ib);
          return dataDate >= hourStart && dataDate < hourEnd;
        });
        
        if (hourlyRecords.length > 0) {
          const validRecords = hourlyRecords.filter(r => r.value !== null && !isNaN(Number(r.value)));
          if (validRecords.length > 0) {
            const sum = validRecords.reduce((acc, r) => acc + Number(r.value), 0);
            const avgLMP = sum / validRecords.length;
            lastWeekHourlyData.push({
              date: new Date(targetDate),
              hour: hour,
              lmp: avgLMP
            });
          }
        }
      }
    }

    // Analyze forecast week: find bottom 3 hours for each day
    const forecastWeekFrequency = new Array(24).fill(0); // HE1-24
    
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(thisWeekStart);
      dayDate.setDate(dayDate.getDate() + day);
      
      // Get all hours for this day
      const dayHours = forecastWeekData.filter(d => {
        const dataDate = new Date(d.Date);
        return dataDate.toDateString() === dayDate.toDateString();
      }).map(d => ({
        hour: d.Hour, // This should be HE format
        lmp: d.lmp || 0
      }));
      
      // Sort by LMP ascending (lowest first) and get bottom 3
      const bottom3Hours = dayHours
        .sort((a, b) => a.lmp - b.lmp)
        .slice(0, 3)
        .map(d => d.hour);
      
      // Increment frequency for each bottom 3 hour
      bottom3Hours.forEach(hour => {
        if (hour >= 1 && hour <= 24) {
          forecastWeekFrequency[hour - 1]++; // Convert HE1-24 to 0-23 index
        }
      });
    }

    // Analyze last week: find bottom 3 hours for each day
    const lastWeekFrequency = new Array(24).fill(0); // HE1-24
    
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(lastWeekStart);
      dayDate.setDate(dayDate.getDate() + day);
      
      // Get all hours for this day
      const dayHours = lastWeekHourlyData.filter(d => {
        return d.date.toDateString() === dayDate.toDateString();
      });
      
      // Sort by LMP ascending (lowest first) and get bottom 3
      const bottom3Hours = dayHours
        .sort((a, b) => a.lmp - b.lmp)
        .slice(0, 3)
        .map(d => d.hour);
      
      // Increment frequency for each bottom 3 hour
      bottom3Hours.forEach(hour => {
        if (hour >= 1 && hour <= 24) {
          lastWeekFrequency[hour - 1]++; // Convert HE1-24 to 0-23 index
        }
      });
    }

    const response: BottomHoursData = {
      forecastWeekFrequency: forecastWeekFrequency,
      lastWeekFrequency: lastWeekFrequency,
      metadata: {
        forecastWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`,
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bottom hours frequency error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bottom hours frequency data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
}; 