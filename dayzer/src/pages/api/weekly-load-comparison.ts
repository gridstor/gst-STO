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

interface LoadDataPoint {
  datetime: string;
  dayName: string;
  thisWeekValue: number | null;
  lastWeekValue: number | null;
}

export const GET: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    // Create secondary database connection
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Secondary PostgreSQL connection created');

    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get('scenarioid');
    const metric = url.searchParams.get('metric') || 'totalDemand'; // Default to totalDemand
    
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
        JSON.stringify({ scenarioid: null, data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
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

    console.log('Date ranges:', {
      simulation: simulationDate.toISOString(),
      thisWeek: `${thisWeekStart.toISOString()} to ${thisWeekEnd.toISOString()}`,
      lastWeek: `${lastWeekStart.toISOString()} to ${lastWeekEnd.toISOString()}`
    });

    // Get this week's forecast data from primary database
    let thisWeekData: any[] = [];
    
    if (metric === 'totalDemand') {
      // Get total demand from zone_demand table
      const demandResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid,
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd,
          },
        },
        select: {
          Date: true,
          Hour: true,
          demandmw: true,
        },
        orderBy: [
          { Date: 'asc' },
          { Hour: 'asc' }
        ],
      });

      // Aggregate by datetime
      const demandByDatetime: { [key: string]: number } = {};
      demandResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        
        if (!demandByDatetime[datetimeKey]) {
          demandByDatetime[datetimeKey] = 0;
        }
        demandByDatetime[datetimeKey] += (row.demandmw || 0) / 1000; // Convert MW to GW
      });

      thisWeekData = Object.keys(demandByDatetime).map(datetime => ({
        datetime,
        value: demandByDatetime[datetime]
      }));

    } else if (metric === 'netLoad') {
      // Get net load data using same logic as net-load-with-caiso endpoint
      const demandResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid,
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd,
          },
        },
        select: {
          Date: true,
          Hour: true,
          demandmw: true,
        },
        orderBy: [
          { Date: 'asc' },
          { Hour: 'asc' }
        ],
      });

      const renewableResults = await prisma.results_units.findMany({
        where: {
          scenarioid,
          OR: [
            { fuelname: 'sun' },
            { fuelname: 'Sun' },
            { fuelname: 'wind' },
            { fuelname: 'Wind' }
          ],
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd,
          },
        },
        select: {
          Date: true,
          Hour: true,
          fuelname: true,
          generationmw: true,
        },
        orderBy: [
          { Date: 'asc' },
          { Hour: 'asc' }
        ],
      });

      // Aggregate demand and renewables by datetime
      const demandByDatetime: { [key: string]: number } = {};
      const renewableByDatetime: { [key: string]: number } = {};

      demandResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        
        if (!demandByDatetime[datetimeKey]) {
          demandByDatetime[datetimeKey] = 0;
        }
        demandByDatetime[datetimeKey] += (row.demandmw || 0) / 1000; // Convert MW to GW
      });

      renewableResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        
        if (!renewableByDatetime[datetimeKey]) {
          renewableByDatetime[datetimeKey] = 0;
        }
        renewableByDatetime[datetimeKey] += (row.generationmw || 0) / 1000; // Convert MW to GW
      });

      // Calculate net load
      thisWeekData = Object.keys(demandByDatetime).map(datetime => ({
        datetime,
        value: demandByDatetime[datetime] - (renewableByDatetime[datetime] || 0)
      }));

    } else if (metric === 'renewableGeneration') {
      // Get renewable generation data
      const renewableResults = await prisma.results_units.findMany({
        where: {
          scenarioid,
          OR: [
            { fuelname: 'sun' },
            { fuelname: 'Sun' },
            { fuelname: 'wind' },
            { fuelname: 'Wind' }
          ],
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd,
          },
        },
        select: {
          Date: true,
          Hour: true,
          fuelname: true,
          generationmw: true,
        },
        orderBy: [
          { Date: 'asc' },
          { Hour: 'asc' }
        ],
      });

      // Aggregate renewables by datetime
      const renewableByDatetime: { [key: string]: number } = {};
      renewableResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        
        if (!renewableByDatetime[datetimeKey]) {
          renewableByDatetime[datetimeKey] = 0;
        }
        renewableByDatetime[datetimeKey] += (row.generationmw || 0) / 1000; // Convert MW to GW
      });

      thisWeekData = Object.keys(renewableByDatetime).map(datetime => ({
        datetime,
        value: renewableByDatetime[datetime]
      }));
    }

    // Get last week's actual data from secondary database
    let lastWeekData: any[] = [];
    try {
      let attributes: string[] = [];
      
      if (metric === 'totalDemand') {
        attributes = ['RTLOAD'];
      } else if (metric === 'netLoad') {
        attributes = ['NET_RTLOAD'];
      } else if (metric === 'renewableGeneration') {
        attributes = ['RTGEN_SOLAR', 'RTGEN_WIND'];
      }

      const placeholders = attributes.map((_, i) => `$${i + 4}`).join(', ');
      const lastWeekResult = await secondaryPool.query(`
        SELECT local_datetime_ib, attribute, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute IN (${placeholders})
          AND local_datetime_ib >= $2 
          AND local_datetime_ib <= $3
        ORDER BY local_datetime_ib ASC
      `, ['CAISO', lastWeekStart.toISOString(), lastWeekEnd.toISOString(), ...attributes]);
      
      console.log('Last week query result count:', lastWeekResult.rows.length);
      
      // Process and aggregate to hourly
      const hourlyData: { [key: string]: { values: number[], count: number } } = {};
      
      lastWeekResult.rows.forEach((row: { local_datetime_ib: Date; attribute: string; value: number | null }) => {
        if (row.value !== null && !isNaN(Number(row.value))) {
          // Convert to hour ending
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1);
          const hourKey = datetime.toISOString();
          
          if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = { values: [], count: 0 };
          }
          
          hourlyData[hourKey].values.push(Number(row.value));
          hourlyData[hourKey].count++;
        }
      });

      // Convert to final format with hourly totals/averages
      lastWeekData = Object.keys(hourlyData).map(datetime => {
        const hourData = hourlyData[datetime];
        
        let finalValue: number;
        if (metric === 'renewableGeneration') {
          // For renewable generation: SUM the values (RTGEN_SOLAR + RTGEN_WIND)
          finalValue = hourData.values.reduce((sum, val) => sum + val, 0);
        } else {
          // For other metrics: AVERAGE the values (in case there are multiple readings per hour)
          finalValue = hourData.values.reduce((sum, val) => sum + val, 0) / hourData.values.length;
        }
        
        return {
          datetime,
          value: finalValue / 1000 // Convert MW to GW
        };
      });

    } catch (queryError) {
      console.error('Failed to query secondary database:', queryError);
      lastWeekData = [];
    }

    // Create combined hourly data
    const combinedData: LoadDataPoint[] = [];
    
    // Generate all 168 hours for this week
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const currentDate = new Date(thisWeekStart);
        currentDate.setDate(currentDate.getDate() + day);
        currentDate.setHours(hour, 0, 0, 0);
        
        // Get day name
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[currentDate.getDay()];
        
        // Find this week's value
        const thisWeekMatch = thisWeekData.find(d => {
          const dataDate = new Date(d.datetime);
          return dataDate.getTime() === currentDate.getTime();
        });
        
        // Find last week's value (same day/hour but previous week)
        const lastWeekDateTime = new Date(currentDate);
        lastWeekDateTime.setDate(lastWeekDateTime.getDate() - 7);
        
        const lastWeekMatch = lastWeekData.find(d => {
          const dataDate = new Date(d.datetime);
          return dataDate.getTime() === lastWeekDateTime.getTime();
        });
        
        combinedData.push({
          datetime: currentDate.toISOString(),
          dayName,
          thisWeekValue: thisWeekMatch?.value || null,
          lastWeekValue: lastWeekMatch?.value || null,
        });
      }
    }

    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      metric,
      data: combinedData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`,
        totalHours: combinedData.length,
        thisWeekDataPoints: thisWeekData.length,
        lastWeekDataPoints: lastWeekData.length,
        secondaryDBStatus: 'connected'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weekly load comparison data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    // Clean up the secondary connection
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
}; 