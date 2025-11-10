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

// Monthly charging restrictions (indexed by month 0-11 for Jan-Dec)
// Based on table: HB 0 = 7PM-1AM, HB 1-6 = 1AM-7AM, HB 7-9 = 7AM-10AM, HB 10-18 = 10AM-7PM, HB 19-23 = 7PM-1AM
const MONTHLY_CHARGING_RESTRICTIONS: { [month: number]: number[] } = {
  0: [8.4, 39.9, 39.9, 39.9, 39.9, 39.9, 39.9, 2.6, 2.6, 2.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 8.4, 8.4, 8.4, 8.4, 8.4], // Jan
  1: [6.3, 40.4, 40.4, 40.4, 40.4, 40.4, 40.4, 4.7, 4.7, 4.7, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 6.3, 6.3, 6.3, 6.3, 6.3], // Feb
  2: [4.7, 33.9, 33.9, 33.9, 33.9, 33.9, 33.9, 7.4, 7.4, 7.4, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 4.7, 4.7, 4.7, 4.7, 4.7], // Mar
  3: [25.4, 29.4, 29.4, 29.4, 29.4, 29.4, 29.4, 15.3, 15.3, 15.3, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 25.4, 25.4, 25.4, 25.4, 25.4], // Apr
  4: [28.9, 37.1, 37.1, 37.1, 37.1, 37.1, 37.1, 25.5, 25.5, 25.5, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 28.9, 28.9, 28.9, 28.9, 28.9], // May
  5: [30.8, 45.3, 45.3, 45.3, 45.3, 45.3, 45.3, 19.6, 19.6, 19.6, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 30.8, 30.8, 30.8, 30.8, 30.8], // Jun
  6: [5.6, 37.4, 37.4, 37.4, 37.4, 37.4, 37.4, 3.5, 3.5, 3.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5.6, 5.6, 5.6, 5.6, 5.6], // Jul
  7: [0.5, 36.0, 36.0, 36.0, 36.0, 36.0, 36.0, 1.7, 1.7, 1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5], // Aug
  8: [6.1, 34.4, 34.4, 34.4, 34.4, 34.4, 34.4, 2.6, 2.6, 2.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6.1, 6.1, 6.1, 6.1, 6.1], // Sep
  9: [11.0, 41.3, 41.3, 41.3, 41.3, 41.3, 41.3, 11.0, 11.0, 11.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.0, 11.0, 11.0, 11.0, 11.0], // Oct
  10: [14.3, 40.1, 40.1, 40.1, 40.1, 40.1, 40.1, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 11.0, 14.3, 14.3, 14.3, 14.3, 14.3], // Nov
  11: [8.2, 42.3, 42.3, 42.3, 42.3, 42.3, 42.3, 5.2, 5.2, 5.2, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 8.2, 8.2, 8.2, 8.2, 8.2], // Dec
};

// Helper function to determine dominant month in a date range
function getDominantMonth(startDate: Date, endDate: Date): number {
  const monthCounts: { [month: number]: number } = {};
  
  // Count days in each month
  const current = new Date(startDate);
  while (current <= endDate) {
    const month = current.getMonth();
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    current.setDate(current.getDate() + 1);
  }
  
  // Find month with most days
  let dominantMonth = startDate.getMonth();
  let maxDays = 0;
  
  Object.entries(monthCounts).forEach(([month, days]) => {
    if (days > maxDays) {
      maxDays = days;
      dominantMonth = parseInt(month);
    }
  });
  
  console.log('📅 Month day counts:', monthCounts);
  console.log('📅 Dominant month:', dominantMonth, '(', new Date(2025, dominantMonth, 1).toLocaleDateString('en-US', { month: 'long' }), ')');
  
  return dominantMonth;
}

// Helper function to get charging restrictions for a specific month
function getChargingRestrictionsForMonth(month: number): number[] {
  return MONTHLY_CHARGING_RESTRICTIONS[month] || MONTHLY_CHARGING_RESTRICTIONS[9]; // Default to October if not found
}

interface HourlyData {
  Date: Date;
  Hour: number;
  energy: number | null;
  congestion: number | null;
  losses: number | null;
  lmp: number;
}

interface HistoricalHourlyData {
  datetime: Date;
  hour: number;
  dalmp: number;
  dalmp_energy: number;
  dalmp_congestion: number;
}

interface DailyRevenue {
  date: string;
  totalRevenue: number;
  energyRevenue: number;
  congestionRevenue: number;
}

interface TB26Result {
  thisWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
    weeklyBreakdown: DailyRevenue[];
  };
  lastWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
    weeklyBreakdown: DailyRevenue[];
  };
  lastYear: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
    weeklyBreakdown: DailyRevenue[];
  };
  scenarioId: number;
  dateRanges: {
    thisWeek: string;
    lastWeek: string;
    lastYear: string;
  };
  chargingRestrictions: number[];
  currentMonth: string;
}

export const GET: APIRoute = async ({ request }) => {
  let secondaryPool: Pool | null = null;
  
  try {
    // Create secondary database connection for yes_fundamentals
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });

    // Check if scenarioId is provided in query parameters
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get('scenarioId');
    
    let targetScenario;
    if (requestedScenarioId) {
      // Use requested scenario
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true, simulation_date: true },
      });
      console.log('Using requested scenario:', targetScenario);
    } else {
      // Find the most recent scenarioid with "CAISO_WEEK" in the name
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioname: {
            contains: 'CAISO_WEEK'
          }
        },
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true, scenarioname: true, simulation_date: true },
      });
      
      // If no CAISO_WEEK scenario found, fall back to most recent overall
      if (!targetScenario) {
        targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: 'desc' },
          select: { scenarioid: true, scenarioname: true, simulation_date: true },
        });
      }
      console.log('Using latest CAISO_WEEK scenario:', targetScenario);
    }

    if (!targetScenario) {
      return new Response(
        JSON.stringify({ error: 'No scenarios found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Define date ranges based on scenario's simulation date (if provided) or today
    const today = targetScenario.simulation_date ? new Date(targetScenario.simulation_date) : new Date();
    
    // This Week: Today through today + 6 days (7 day span forward)
    const thisWeekStart = new Date(today);
    thisWeekStart.setHours(0, 0, 0, 0); // Start of day
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(today.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999); // End of day
    
    // Last Week: (Today - 7) through yesterday (7 day span backward)
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0); // Start of day
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 1); // Yesterday
    lastWeekEnd.setHours(23, 59, 59, 999); // End of yesterday
    
    // Last Year: Same as This Week but previous year (7 days)
    const lastYearStart = new Date(today);
    lastYearStart.setFullYear(today.getFullYear() - 1);
    lastYearStart.setHours(0, 0, 0, 0); // Start of day
    const lastYearEnd = new Date(today);
    lastYearEnd.setFullYear(today.getFullYear() - 1);
    lastYearEnd.setDate(today.getDate() + 6); // Today + 6 days (same as This Week)
    lastYearEnd.setHours(23, 59, 59, 999); // End of day

    console.log('This week:', thisWeekStart.toISOString(), 'to', thisWeekEnd.toISOString());
    console.log('Last week:', lastWeekStart.toISOString(), 'to', lastWeekEnd.toISOString());
    console.log('Last year:', lastYearStart.toISOString(), 'to', lastYearEnd.toISOString());

    // Calculate This Week using target scenario
    const thisWeekResults = await calculateThisWeekTB26(targetScenario.scenarioid, thisWeekStart, thisWeekEnd);
    
    // Calculate Last Week (existing logic)
    const lastWeekResults = await calculateLastWeekTB26(secondaryPool, lastWeekStart, lastWeekEnd);

    // Calculate Last Year (new logic)
    const lastYearResults = await calculateLastWeekTB26(secondaryPool, lastYearStart, lastYearEnd);

    // Get current month's charging restrictions for display
    const currentMonthIndex = today.getMonth();
    const chargingRestrictions = getChargingRestrictionsForMonth(currentMonthIndex);
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const result: TB26Result = {
      thisWeek: thisWeekResults,
      lastWeek: lastWeekResults,
      lastYear: lastYearResults,
      scenarioId: targetScenario.scenarioid,
      dateRanges: {
        thisWeek: `${thisWeekStart.toISOString().split('T')[0]} to ${thisWeekEnd.toISOString().split('T')[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]}`,
        lastYear: `${lastYearStart.toISOString().split('T')[0]} to ${lastYearEnd.toISOString().split('T')[0]}`
      },
      chargingRestrictions: chargingRestrictions,
      currentMonth: currentMonth
    };

    console.log('Final TB2.6 Results:', {
      thisWeek: thisWeekResults.totalTB26.toFixed(2),
      lastWeek: lastWeekResults.totalTB26.toFixed(2),
      lastYear: lastYearResults.totalTB26.toFixed(2)
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TB2.6 calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate TB2.6', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
};

// This Week calculation with charging restrictions
async function calculateThisWeekTB26(scenarioId: number, startDate: Date, endDate: Date) {
  console.log(`🔋 This Week: Using day-level granularity for charging restrictions`);

  // Fetch data from results_units for Goleta (unitid = 66038)
  const results = await prisma.results_units.findMany({
    where: {
      scenarioid: scenarioId,
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
    },
    orderBy: [
      { Date: 'asc' },
      { Hour: 'asc' }
    ],
  });

  console.log('Raw data count:', results.length);

  if (results.length === 0) {
    return {
      totalTB26: 0,
      energyTB26: 0,
      congestionTB26: 0,
      weeklyBreakdown: [],
    };
  }

  // Process data: calculate LMP and group by day
  const processedData: HourlyData[] = results.map(row => ({
    Date: row.Date,
    Hour: row.Hour,
    energy: row.energy || 0,
    congestion: row.congestion || 0,
    losses: row.losses || 0,
    lmp: (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
  }));

  // Group by date
  const dataByDate: { [dateString: string]: HourlyData[] } = {};
  processedData.forEach(row => {
    const dateKey = row.Date.toISOString().split('T')[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = [];
    }
    dataByDate[dateKey].push(row);
  });

  console.log('Days found:', Object.keys(dataByDate));

  // Calculate daily revenues with charging restrictions
  const dailyRevenues: DailyRevenue[] = [];

  Object.keys(dataByDate).forEach(dateString => {
    const dayData = dataByDate[dateString];
    
    if (dayData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dayData.length} hours`);
      return;
    }

    // Get charging restrictions for THIS SPECIFIC DAY's month
    const dayDate = new Date(dateString);
    const dayMonth = dayDate.getMonth();
    const chargingRestrictions = getChargingRestrictionsForMonth(dayMonth);
    const monthName = dayDate.toLocaleDateString('en-US', { month: 'long' });
    
    console.log(`🔋 Charging for ${dateString} (This Week Forecast) - Using ${monthName} restrictions`);

    // Sort by LMP (cheapest first)
    const sortedByLMP = [...dayData].sort((a, b) => a.lmp - b.lmp);

    // Battery specs
    const batteryCapacity = 160; // MWh
    const efficiency = 0.86;

    // NEW CHARGING LOGIC WITH RESTRICTIONS
    let totalCost = 0;
    let energyCost = 0;
    let congestionCost = 0;
    let mwBought = 0;
    let buyIndex = 0;

    // Iteratively buy energy from cheapest hours until we reach capacity
    while (mwBought < batteryCapacity && buyIndex < sortedByLMP.length) {
      const hour = sortedByLMP[buyIndex];
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1; // HE 1 -> HB 0, HE 2 -> HB 1, etc.
      
      // Get charging restriction for this hour
      let restriction = chargingRestrictions[hourBeginning];
      
      // Don't exceed battery capacity
      if (mwBought + restriction > batteryCapacity) {
        restriction = batteryCapacity - mwBought;
      }

      // Add to costs
      totalCost += restriction * hour.lmp;
      energyCost += restriction * (hour.energy || 0);
      congestionCost += restriction * (hour.congestion || 0);
      
      console.log(`  HE ${hourEnding} (HB ${hourBeginning}): Buy ${restriction.toFixed(1)} MW @ $${hour.lmp.toFixed(2)}/MWh (restriction: ${chargingRestrictions[hourBeginning]} MW)`);
      
      mwBought += restriction;
      buyIndex++;
    }

    console.log(`  Total charged: ${mwBought.toFixed(1)} MW, Total cost: $${totalCost.toFixed(2)}`);

    // DISCHARGING LOGIC (unchanged - still use 3 most expensive hours)
    const availableEnergy = batteryCapacity * efficiency; // 137.6 MWh
    
    const discharge1 = { hour: sortedByLMP[23], amount: 60 }; // Most expensive
    const discharge2 = { hour: sortedByLMP[22], amount: 60 }; // 2nd most expensive
    const discharge3 = { hour: sortedByLMP[21], amount: availableEnergy - 120 }; // 3rd most expensive, remainder (17.6)

    // Calculate revenues (discharging)
    const totalRevenue = 
      discharge1.amount * discharge1.hour.lmp +
      discharge2.amount * discharge2.hour.lmp +
      discharge3.amount * discharge3.hour.lmp;

    const energyRevenue = 
      discharge1.amount * (discharge1.hour.energy || 0) +
      discharge2.amount * (discharge2.hour.energy || 0) +
      discharge3.amount * (discharge3.hour.energy || 0);

    const congestionRevenue = 
      discharge1.amount * (discharge1.hour.congestion || 0) +
      discharge2.amount * (discharge2.hour.congestion || 0) +
      discharge3.amount * (discharge3.hour.congestion || 0);

    console.log(`  Total revenue: $${totalRevenue.toFixed(2)}, Net: $${(totalRevenue - totalCost).toFixed(2)}`);

    // Net daily revenues
    dailyRevenues.push({
      date: dateString,
      totalRevenue: totalRevenue - totalCost,
      energyRevenue: energyRevenue - energyCost,
      congestionRevenue: congestionRevenue - congestionCost,
    });

    console.log(`${dateString}: Total=${(totalRevenue - totalCost).toFixed(2)}, Energy=${(energyRevenue - energyCost).toFixed(2)}, Congestion=${(congestionRevenue - congestionCost).toFixed(2)}`);
  });

  // Calculate weekly totals
  const weeklyTotal = dailyRevenues.reduce((sum, day) => sum + day.totalRevenue, 0);
  const weeklyEnergy = dailyRevenues.reduce((sum, day) => sum + day.energyRevenue, 0);
  const weeklyCongestion = dailyRevenues.reduce((sum, day) => sum + day.congestionRevenue, 0);

  // Calculate daily averages
  const dailyCount = dailyRevenues.length;
  const dailyAvgTotal = weeklyTotal / dailyCount;
  const dailyAvgEnergy = weeklyEnergy / dailyCount;
  const dailyAvgCongestion = weeklyCongestion / dailyCount;

  // Convert to $/kW-month using Python formula: (daily_avg_revenue / (60*1000)) * 30.25
  const totalTB26 = (dailyAvgTotal / (60 * 1000)) * 30.25;
  const energyTB26 = (dailyAvgEnergy / (60 * 1000)) * 30.25;
  const congestionTB26 = (dailyAvgCongestion / (60 * 1000)) * 30.25;

  console.log('🔋 This Week TB2,6 with restrictions:', {
    totalTB26: totalTB26.toFixed(2),
    energyTB26: energyTB26.toFixed(2),
    congestionTB26: congestionTB26.toFixed(2)
  });

  return {
    totalTB26,
    energyTB26,
    congestionTB26,
    weeklyBreakdown: dailyRevenues,
  };
}

async function calculateLastWeekTB26(pool: Pool, startDate: Date, endDate: Date) {
  console.log(`🔋 Last Week/Year: Using day-level granularity for charging restrictions`);

  // Adjust query to capture boundary hours - extend range by 1 day on each side
  const queryStartDate = new Date(startDate);
  queryStartDate.setDate(queryStartDate.getDate() - 1);
  const queryEndDate = new Date(endDate);
  queryEndDate.setDate(queryEndDate.getDate() + 1);

  console.log('🔍 Query date range (extended):', queryStartDate.toISOString(), 'to', queryEndDate.toISOString());
  console.log('🔍 Target date range (actual):', startDate.toISOString(), 'to', endDate.toISOString());

  const results = await pool.query(
    `SELECT 
       local_datetime_ib,
       attribute,
       value
     FROM yes_fundamentals 
     WHERE entity = $1 
       AND attribute IN ($2, $3, $4)
       AND local_datetime_ib >= $5 
       AND local_datetime_ib <= $6
     ORDER BY local_datetime_ib, attribute`,
    ['GOLETA_6_N100', 'DALMP', 'DALMP_Congestion', 'DALMP_Energy', queryStartDate.toISOString(), queryEndDate.toISOString()]
  );

  console.log('Raw historical data count:', results.rows.length);

  if (results.rows.length === 0) {
    return {
      totalTB26: 0,
      energyTB26: 0,
      congestionTB26: 0,
      weeklyBreakdown: [],
    };
  }

  // Group data by hour ending datetime and pivot attributes
  const hourlyDataMap: { [datetimeKey: string]: { dalmp?: number, dalmp_energy?: number, dalmp_congestion?: number, originalIB?: string } } = {};

  results.rows.forEach((row: any) => {
    // Convert interval beginning to interval ending (add 1 hour)
    const datetime = new Date(row.local_datetime_ib);
    datetime.setHours(datetime.getHours() + 1);
    
    // Only include hours that fall within our target date range
    if (datetime >= startDate && datetime <= endDate) {
      const datetimeKey = datetime.toISOString();

      if (!hourlyDataMap[datetimeKey]) {
        hourlyDataMap[datetimeKey] = {
          originalIB: row.local_datetime_ib
        };
      }

      switch (row.attribute) {
        case 'DALMP':
          hourlyDataMap[datetimeKey].dalmp = Number(row.value);
          break;
        case 'DALMP_Energy':
          hourlyDataMap[datetimeKey].dalmp_energy = Number(row.value);
          break;
        case 'DALMP_Congestion':
          hourlyDataMap[datetimeKey].dalmp_congestion = Number(row.value);
          break;
      }
    }
  });

  console.log('🔍 Unique hour ending times found:', Object.keys(hourlyDataMap).length);
  console.log('🔍 Sample hour ending times:', Object.keys(hourlyDataMap).slice(0, 5));
  
  // Debug: Check for missing hours in each day
  for (let d = 0; d < 7; d++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    let hoursFound = 0;
    for (let h = 1; h <= 24; h++) {
      const testDateTime = new Date(checkDate);
      testDateTime.setHours(h === 24 ? 0 : h);
      if (h === 24) testDateTime.setDate(testDateTime.getDate() + 1);
      const testKey = testDateTime.toISOString();
      
      if (hourlyDataMap[testKey]) {
        hoursFound++;
      }
    }
    console.log(`🔍 ${dateStr}: Found ${hoursFound}/24 hours`);
  }

  // Convert to HourlyData format
  const processedData: HourlyData[] = Object.keys(hourlyDataMap)
    .map(datetimeKey => {
      const datetime = new Date(datetimeKey);
      const hourData = hourlyDataMap[datetimeKey];
      
      // Only include records where we have DALMP (total LMP)
      if (hourData.dalmp === undefined) {
        console.log('⚠️ Missing DALMP for:', datetimeKey, 'Original IB:', hourData.originalIB);
        return null;
      }

      return {
        Date: datetime,
        Hour: datetime.getHours() === 0 ? 24 : datetime.getHours(), // Convert 0 to 24 for HE format
        energy: hourData.dalmp_energy || 0,
        congestion: hourData.dalmp_congestion || 0,
        losses: null, // No losses data in yes_fundamentals
        lmp: hourData.dalmp
      };
    })
    .filter(item => item !== null) as HourlyData[];

  console.log('Processed historical data count:', processedData.length);
  console.log('Sample processed data:', processedData.slice(0, 3));

  // Group by date
  const dataByDate: { [dateString: string]: HourlyData[] } = {};
  processedData.forEach(row => {
    const dateKey = row.Date.toISOString().split('T')[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = [];
    }
    dataByDate[dateKey].push(row);
  });

  console.log('Days found:', Object.keys(dataByDate));

  // Calculate daily revenues with charging restrictions
  const dailyRevenues: DailyRevenue[] = [];

  Object.keys(dataByDate).forEach(dateString => {
    const dayData = dataByDate[dateString];
    
    if (dayData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dayData.length} hours`);
      return;
    }

    // Get charging restrictions for THIS SPECIFIC DAY's month
    const dayDate = new Date(dateString);
    const dayMonth = dayDate.getMonth();
    const chargingRestrictions = getChargingRestrictionsForMonth(dayMonth);
    const monthName = dayDate.toLocaleDateString('en-US', { month: 'long' });
    
    console.log(`🔋 Charging for ${dateString} - Using ${monthName} restrictions`);

    // Sort by LMP (cheapest first)
    const sortedByLMP = [...dayData].sort((a, b) => a.lmp - b.lmp);

    // Battery specs
    const batteryCapacity = 160; // MWh
    const efficiency = 0.86;

    // NEW CHARGING LOGIC WITH RESTRICTIONS
    let totalCost = 0;
    let energyCost = 0;
    let congestionCost = 0;
    let mwBought = 0;
    let buyIndex = 0;

    // Iteratively buy energy from cheapest hours until we reach capacity
    while (mwBought < batteryCapacity && buyIndex < sortedByLMP.length) {
      const hour = sortedByLMP[buyIndex];
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1; // HE 1 -> HB 0, HE 2 -> HB 1, etc.
      
      // Get charging restriction for this hour
      let restriction = chargingRestrictions[hourBeginning];
      
      // Don't exceed battery capacity
      if (mwBought + restriction > batteryCapacity) {
        restriction = batteryCapacity - mwBought;
      }

      // Add to costs
      totalCost += restriction * hour.lmp;
      energyCost += restriction * (hour.energy || 0);
      congestionCost += restriction * (hour.congestion || 0);
      
      console.log(`  HE ${hourEnding} (HB ${hourBeginning}): Buy ${restriction.toFixed(1)} MW @ $${hour.lmp.toFixed(2)}/MWh (restriction: ${chargingRestrictions[hourBeginning]} MW)`);
      
      mwBought += restriction;
      buyIndex++;
    }

    console.log(`  Total charged: ${mwBought.toFixed(1)} MW, Total cost: $${totalCost.toFixed(2)}`);

    // DISCHARGING LOGIC (unchanged - still use 3 most expensive hours)
    const availableEnergy = batteryCapacity * efficiency; // 137.6 MWh
    
    const discharge1 = { hour: sortedByLMP[23], amount: 60 }; // Most expensive
    const discharge2 = { hour: sortedByLMP[22], amount: 60 }; // 2nd most expensive
    const discharge3 = { hour: sortedByLMP[21], amount: availableEnergy - 120 }; // 3rd most expensive, remainder (17.6)

    // Calculate revenues (discharging)
    const totalRevenue = 
      discharge1.amount * discharge1.hour.lmp +
      discharge2.amount * discharge2.hour.lmp +
      discharge3.amount * discharge3.hour.lmp;

    const energyRevenue = 
      discharge1.amount * (discharge1.hour.energy || 0) +
      discharge2.amount * (discharge2.hour.energy || 0) +
      discharge3.amount * (discharge3.hour.energy || 0);

    const congestionRevenue = 
      discharge1.amount * (discharge1.hour.congestion || 0) +
      discharge2.amount * (discharge2.hour.congestion || 0) +
      discharge3.amount * (discharge3.hour.congestion || 0);

    console.log(`  Total revenue: $${totalRevenue.toFixed(2)}, Net: $${(totalRevenue - totalCost).toFixed(2)}`);

    // Net daily revenues
    dailyRevenues.push({
      date: dateString,
      totalRevenue: totalRevenue - totalCost,
      energyRevenue: energyRevenue - energyCost,
      congestionRevenue: congestionRevenue - congestionCost,
    });

    console.log(`${dateString}: Total=${(totalRevenue - totalCost).toFixed(2)}, Energy=${(energyRevenue - energyCost).toFixed(2)}, Congestion=${(congestionRevenue - congestionCost).toFixed(2)}`);
  });

  // Calculate weekly totals
  const weeklyTotal = dailyRevenues.reduce((sum, day) => sum + day.totalRevenue, 0);
  const weeklyEnergy = dailyRevenues.reduce((sum, day) => sum + day.energyRevenue, 0);
  const weeklyCongestion = dailyRevenues.reduce((sum, day) => sum + day.congestionRevenue, 0);

  // Calculate daily averages
  const dailyCount = dailyRevenues.length;
  const dailyAvgTotal = weeklyTotal / dailyCount;
  const dailyAvgEnergy = weeklyEnergy / dailyCount;
  const dailyAvgCongestion = weeklyCongestion / dailyCount;

  // Convert to $/kW-month using Python formula: (daily_avg_revenue / (60*1000)) * 30.25
  const totalTB26 = (dailyAvgTotal / (60 * 1000)) * 30.25;
  const energyTB26 = (dailyAvgEnergy / (60 * 1000)) * 30.25;
  const congestionTB26 = (dailyAvgCongestion / (60 * 1000)) * 30.25;

  console.log('🔋 Last Week TB2,6 with restrictions:', {
    totalTB26: totalTB26.toFixed(2),
    energyTB26: energyTB26.toFixed(2),
    congestionTB26: congestionTB26.toFixed(2)
  });

  return {
    totalTB26,
    energyTB26,
    congestionTB26,
    weeklyBreakdown: dailyRevenues,
  };
} 