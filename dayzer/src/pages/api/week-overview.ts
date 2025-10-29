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

interface WeekOverviewData {
  component: string;
  thisWeekAvg: number;
  lastWeekAvg: number;
  thisWeekMax: number;
  lastWeekMax: number;
  thisWeekMin: number;
  lastWeekMin: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'flat';
  magnitude: 'small' | 'medium' | 'large';
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
    const hoursParam = url.searchParams.get('hours');
    
    // Parse hours filter (default to all hours 1-24)
    const selectedHours = hoursParam ? 
      hoursParam.split(',').map(h => parseInt(h.trim(), 10)).filter(h => h >= 1 && h <= 24) :
      Array.from({ length: 24 }, (_, i) => i + 1);
    
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
    
    // This week: simulation date + 1 through simulation date + 7
    const thisWeekStart = new Date(simulationDate);
    thisWeekStart.setDate(thisWeekStart.getDate() + 1); // Start 1 day after simulation
    const thisWeekEnd = new Date(simulationDate);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7); // End 7 days after simulation
    
    // Last week: 7 days before simulation date through day before simulation date
    const lastWeekStart = new Date(simulationDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(simulationDate);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Get this week's forecast data from primary database
    const demandResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid,
        Date: {
          gte: thisWeekStart,
          lte: thisWeekEnd,
        },
        Hour: {
          in: selectedHours
        }
      },
      select: {
        Date: true,
        Hour: true,
        demandmw: true,
      },
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
        Hour: {
          in: selectedHours
        }
      },
      select: {
        Date: true,
        Hour: true,
        fuelname: true,
        generationmw: true,
      },
    });

    // Aggregate demand by datetime (similar to weekly load comparison)
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

    // Calculate this week's averages from aggregated hourly data
    const demandHourlyValues = Object.values(demandByDatetime);
    const renewableHourlyValues = Object.values(renewableByDatetime);
    
    const thisWeekAvgTotalDemand = demandHourlyValues.length > 0 ? 
      demandHourlyValues.reduce((sum, val) => sum + val, 0) / demandHourlyValues.length : 0;
    const thisWeekMaxTotalDemand = demandHourlyValues.length > 0 ? Math.max(...demandHourlyValues) : 0;
    const thisWeekMinTotalDemand = demandHourlyValues.length > 0 ? Math.min(...demandHourlyValues) : 0;
    
    const thisWeekAvgRenewable = renewableHourlyValues.length > 0 ? 
      renewableHourlyValues.reduce((sum, val) => sum + val, 0) / renewableHourlyValues.length : 0;
    const thisWeekMaxRenewable = renewableHourlyValues.length > 0 ? Math.max(...renewableHourlyValues) : 0;
    const thisWeekMinRenewable = renewableHourlyValues.length > 0 ? Math.min(...renewableHourlyValues) : 0;
    
    const thisWeekAvgNetLoad = thisWeekAvgTotalDemand - thisWeekAvgRenewable;
    const thisWeekMaxNetLoad = thisWeekMaxTotalDemand - thisWeekMinRenewable; // Max net load when demand is max and renewables are min
    const thisWeekMinNetLoad = thisWeekMinTotalDemand - thisWeekMaxRenewable; // Min net load when demand is min and renewables are max

    // Get last week's actual data from secondary database
    let lastWeekAvgTotalDemand = 0;
    let lastWeekMaxTotalDemand = 0;
    let lastWeekMinTotalDemand = 0;
    let lastWeekAvgNetLoad = 0;
    let lastWeekMaxNetLoad = 0;
    let lastWeekMinNetLoad = 0;
    let lastWeekAvgRenewable = 0;
    let lastWeekMaxRenewable = 0;
    let lastWeekMinRenewable = 0;

    try {
      // Get actual total demand
      const demandQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
      `, ['CAISO', 'RTLOAD', lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);

      // Get actual net load
      const netLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
      `, ['CAISO', 'NET_RTLOAD', lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);

      // Get actual renewable generation
      const renewableQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, attribute, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute IN ($2, $3)
          AND local_datetime_ib >= $4 
          AND local_datetime_ib <= $5
      `, ['CAISO', 'RTGEN_SOLAR', 'RTGEN_WIND', lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);

      // Filter by selected hours and calculate averages
      const filterByHours = (rows: any[]) => {
        return rows.filter(row => {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1); // Convert to hour ending
          const hour = datetime.getHours();
          const hourEnding = hour === 0 ? 24 : hour; // Convert 0 to 24 for HE format
          return selectedHours.includes(hourEnding);
        });
      };

      const filteredDemand = filterByHours(demandQuery.rows);
      const filteredNetLoad = filterByHours(netLoadQuery.rows);
      const filteredRenewable = filterByHours(renewableQuery.rows);

      // Calculate averages, max, and min for Last Week
      if (filteredDemand.length > 0) {
        const demandValues = filteredDemand.map(row => Number(row.value) || 0);
        lastWeekAvgTotalDemand = (demandValues.reduce((sum, val) => sum + val, 0) / demandValues.length) / 1000; // Convert MW to GW
        lastWeekMaxTotalDemand = Math.max(...demandValues) / 1000;
        lastWeekMinTotalDemand = Math.min(...demandValues) / 1000;
      }

      if (filteredNetLoad.length > 0) {
        const netLoadValues = filteredNetLoad.map(row => Number(row.value) || 0);
        lastWeekAvgNetLoad = (netLoadValues.reduce((sum, val) => sum + val, 0) / netLoadValues.length) / 1000; // Convert MW to GW
        lastWeekMaxNetLoad = Math.max(...netLoadValues) / 1000;
        lastWeekMinNetLoad = Math.min(...netLoadValues) / 1000;
      }

      // Fix renewable calculation - aggregate by hour first, then average
      if (filteredRenewable.length > 0) {
        // Group renewable data by datetime (hour)
        const renewableByHour: { [key: string]: number } = {};
        
        filteredRenewable.forEach((row: any) => {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1); // Convert to hour ending
          const hourKey = datetime.toISOString();
          
          if (!renewableByHour[hourKey]) {
            renewableByHour[hourKey] = 0;
          }
          renewableByHour[hourKey] += Number(row.value) || 0;
        });
        
        // Calculate average, max, and min from hourly totals
        const hourlyTotals = Object.values(renewableByHour);
        if (hourlyTotals.length > 0) {
          const totalRenewable = hourlyTotals.reduce((sum, hourTotal) => sum + hourTotal, 0);
          lastWeekAvgRenewable = (totalRenewable / hourlyTotals.length) / 1000; // Convert MW to GW
          lastWeekMaxRenewable = Math.max(...hourlyTotals) / 1000;
          lastWeekMinRenewable = Math.min(...hourlyTotals) / 1000;
        }
      }

    } catch (queryError) {
      console.error('Failed to query secondary database:', queryError);
    }

    // Calculate changes and trends
    const calculateTrend = (thisWeek: number, lastWeek: number): {
      trend: 'up' | 'down' | 'flat';
      magnitude: 'small' | 'medium' | 'large';
      absoluteChange: number;
      percentageChange: number;
    } => {
      if (lastWeek === 0) return { trend: 'flat', magnitude: 'small', absoluteChange: 0, percentageChange: 0 };
      
      const absoluteChange = thisWeek - lastWeek;
      const percentageChange = (absoluteChange / lastWeek) * 100;
      
      let trend: 'up' | 'down' | 'flat' = 'flat';
      let magnitude: 'small' | 'medium' | 'large' = 'small';
      
      if (Math.abs(percentageChange) < 0.1) {
        trend = 'flat';
        magnitude = 'small';
      } else if (percentageChange > 0) {
        trend = 'up';
        magnitude = Math.abs(percentageChange) > 15 ? 'large' : Math.abs(percentageChange) > 5 ? 'medium' : 'small';
      } else {
        trend = 'down';
        magnitude = Math.abs(percentageChange) > 15 ? 'large' : Math.abs(percentageChange) > 5 ? 'medium' : 'small';
      }
      
      return { trend, magnitude, absoluteChange, percentageChange };
    };

    const demandTrend = calculateTrend(thisWeekAvgTotalDemand, lastWeekAvgTotalDemand);
    const netLoadTrend = calculateTrend(thisWeekAvgNetLoad, lastWeekAvgNetLoad);
    const renewableTrend = calculateTrend(thisWeekAvgRenewable, lastWeekAvgRenewable);

    const overviewData: WeekOverviewData[] = [
      {
        component: 'Total Demand',
        thisWeekAvg: thisWeekAvgTotalDemand,
        lastWeekAvg: lastWeekAvgTotalDemand,
        thisWeekMax: thisWeekMaxTotalDemand,
        lastWeekMax: lastWeekMaxTotalDemand,
        thisWeekMin: thisWeekMinTotalDemand,
        lastWeekMin: lastWeekMinTotalDemand,
        ...demandTrend
      },
      {
        component: 'Net Load',
        thisWeekAvg: thisWeekAvgNetLoad,
        lastWeekAvg: lastWeekAvgNetLoad,
        thisWeekMax: thisWeekMaxNetLoad,
        lastWeekMax: lastWeekMaxNetLoad,
        thisWeekMin: thisWeekMinNetLoad,
        lastWeekMin: lastWeekMinNetLoad,
        ...netLoadTrend
      },
      {
        component: 'Renewable Generation',
        thisWeekAvg: thisWeekAvgRenewable,
        lastWeekAvg: lastWeekAvgRenewable,
        thisWeekMax: thisWeekMaxRenewable,
        lastWeekMax: lastWeekMaxRenewable,
        thisWeekMin: thisWeekMinRenewable,
        lastWeekMin: lastWeekMinRenewable,
        ...renewableTrend
      }
    ];

    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      selectedHours,
      data: overviewData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`,
        hoursIncluded: selectedHours.length,
        totalDataPoints: demandHourlyValues.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch week overview data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    // Clean up the secondary connection
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
}; 