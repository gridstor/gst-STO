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

// Monthly charging restrictions (indexed by month 0-11 for Jan-Dec)
// Same as TB2,6 and Weekly Congestion
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
  
  console.log('📅 MEC: Month day counts:', monthCounts);
  console.log('📅 MEC: Dominant month:', dominantMonth, '(', new Date(2025, dominantMonth, 1).toLocaleDateString('en-US', { month: 'long' }), ')');
  
  return dominantMonth;
}

// Helper function to get charging restrictions for a specific month
function getChargingRestrictionsForMonth(month: number): number[] {
  return MONTHLY_CHARGING_RESTRICTIONS[month] || MONTHLY_CHARGING_RESTRICTIONS[9]; // Default to October if not found
}

interface HourlyLMPData {
  Date: Date;
  Hour: number;
  lmp: number;
}

interface MarginalUnitData {
  unitid: number;
  unitname: string;
  unittype: string;
  hour: number;
  energyCost: number;
}

interface MECData {
  date: string;
  topHoursMEC: number;
  bottomHoursMEC: number;
  topHoursUnit: string;
  bottomHoursUnit: string;
  isLastWeek: boolean;
  topHoursDetails: MarginalUnitData[];
  bottomHoursDetails: MarginalUnitData[];
  topHours: number[];
  bottomHours: number[];
}

interface MECResponse {
  scenarioId: number;
  data: MECData[];
  dateRanges: {
    lastWeek: string;
    thisWeek: string;
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('=== MCE Overview API ===');
    
    // Check if scenarioId is provided in query parameters
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get('scenarioId');
    
    let targetScenario;
    if (requestedScenarioId) {
      // Use requested scenario
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: {
          scenarioid: true,
          scenarioname: true,
          simulation_date: true
        }
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
        select: {
          scenarioid: true,
          scenarioname: true,
          simulation_date: true
        }
      });
      
      // If no CAISO_WEEK scenario found, fall back to most recent overall
      if (!targetScenario) {
        targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: 'desc' },
          select: {
            scenarioid: true,
            scenarioname: true,
            simulation_date: true
          }
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

    const scenario = targetScenario;
    console.log('Using scenario:', scenario);

    // Define date ranges based on scenario's simulation date (if provided) or today
    const today = scenario.simulation_date ? new Date(scenario.simulation_date) : new Date();
    
    // This Week: simulation date through simulation date + 6 (7 days total)
    const thisWeekStart = new Date(today);
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(today.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);
    
    // Last Week: (Today - 7) through yesterday (7 day span backward)
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    console.log('This week:', thisWeekStart.toISOString(), 'to', thisWeekEnd.toISOString());
    console.log('Last week:', lastWeekStart.toISOString(), 'to', lastWeekEnd.toISOString());

    // Calculate This Week MCE data
    const thisWeekResults = await calculateWeeklyMEC(
      scenario.scenarioid, 
      thisWeekStart, 
      thisWeekEnd,
      false // isLastWeek = false
    );

    // Calculate Last Week MCE data
    const lastWeekResults = await calculateWeeklyMEC(
      scenario.scenarioid, 
      lastWeekStart, 
      lastWeekEnd,
      true // isLastWeek = true
    );

    const allData = [...lastWeekResults, ...thisWeekResults];

    const result: MECResponse = {
      scenarioId: scenario.scenarioid,
      data: allData,
      dateRanges: {
        thisWeek: `${thisWeekStart.toISOString().split('T')[0]} to ${thisWeekEnd.toISOString().split('T')[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]}`
      }
    };

    console.log('MCE calculation completed');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MCE calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate MCE overview', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function calculateWeeklyMEC(
  scenarioId: number, 
  startDate: Date, 
  endDate: Date,
  isLastWeek: boolean
): Promise<MECData[]> {
  
  console.log('Calculating weekly MCE for scenario:', scenarioId);
  
  // Determine dominant month for this week to get appropriate charging restrictions
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  
  console.log(`🔋 MEC Overview: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString('en-US', { month: 'long' })} charging restrictions`);
  
  // Step 1: Fetch LMP data from results_units (unitid = 66038) - same as weekly congestion
  const lmpResults = await prisma.results_units.findMany({
    where: {
      scenarioid: scenarioId,
      unitid: 66038,
      Date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      Date: true,
      Hour: true,
      lmp: true
    },
    orderBy: [
      { Date: 'asc' },
      { Hour: 'asc' }
    ]
  });

  console.log('LMP data count:', lmpResults.length);

  if (lmpResults.length === 0) {
    return [];
  }

  // Step 2: Process LMP data and group by day
  const lmpDataByDate: { [dateString: string]: HourlyLMPData[] } = {};
  
  lmpResults.forEach((row) => {
    const dateKey = new Date(row.Date).toISOString().split('T')[0];
    
    if (!lmpDataByDate[dateKey]) {
      lmpDataByDate[dateKey] = [];
    }
    
    lmpDataByDate[dateKey].push({
      Date: new Date(row.Date),
      Hour: row.Hour,
      lmp: row.lmp || 0
    });
  });

  console.log('LMP data grouped by date:', Object.keys(lmpDataByDate).map(date => `${date}: ${lmpDataByDate[date].length} hours`));

  // Step 3: For each day, identify top/bottom hours and get marginal unit data
  const results: MECData[] = [];

  for (const [dateString, dailyLmpData] of Object.entries(lmpDataByDate)) {
    if (dailyLmpData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dailyLmpData.length} hours`);
      continue;
    }

    // Filter hours based on charging restrictions (only include hours where charging > 0)
    const availableHours = dailyLmpData.filter(hour => {
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1; // HE 1 -> HB 0
      const restriction = chargingRestrictions[hourBeginning];
      return restriction > 0; // Only include hours where charging is allowed
    });

    console.log(`${dateString}: Total hours: 24, Available for charging: ${availableHours.length}`);

    // Sort available hours by LMP to find top 2 and bottom 2
    const sortedByLMP = [...availableHours].sort((a, b) => b.lmp - a.lmp);
    
    if (sortedByLMP.length < 4) {
      console.warn(`${dateString}: Not enough available hours (${sortedByLMP.length}) to identify top/bottom 2`);
      continue; // Skip this day
    }

    const topHours = [sortedByLMP[0].Hour, sortedByLMP[1].Hour]; // Highest LMP among available
    const bottomHours = [sortedByLMP[sortedByLMP.length - 2].Hour, sortedByLMP[sortedByLMP.length - 1].Hour]; // Lowest LMP among available

    console.log(`${dateString}: Top hours (chargeable): ${topHours}, Bottom hours (chargeable): ${bottomHours}`);

    // Step 4: Get marginal unit data for these specific hours
    const targetDate = new Date(dateString);
    const allTargetHours = [...topHours, ...bottomHours];

    // Query marginal_units_report with margintype = 'm'
    const marginalUnitsRaw = await prisma.$queryRaw`
      SELECT unitid, unitname, "Date", "Hour"
      FROM marginal_units_report
      WHERE scenarioid = ${scenarioId}
        AND "Date" = ${targetDate}
        AND "Hour" = ANY(${allTargetHours})
        AND margintype = 'm'
    ` as any[];

    // Convert BigInt values
    const marginalUnits = marginalUnitsRaw.map((row: any) => ({
      unitid: Number(row.unitid),
      unitname: row.unitname,
      date: new Date(row.Date),
      hour: Number(row.Hour)
    }));

    if (marginalUnits.length === 0) {
      console.warn(`No marginal units found for ${dateString}`);
      continue;
    }

    // Step 5: Get energy costs from results_units
    const unitIds = [...new Set(marginalUnits.map(u => u.unitid))];
    // Use Prisma ORM for results_units energy costs
    const energyCosts = await prisma.results_units.findMany({
      where: {
        scenarioid: scenarioId,
        unitid: {
          in: unitIds
        },
        Date: targetDate,
        Hour: {
          in: allTargetHours
        }
      },
      select: {
        unitid: true,
        Date: true,
        Hour: true,
        energy: true
      }
    });

    // Step 6: Get unit types from generation_unit_characteristics
    // Use Prisma ORM for generation_unit_characteristics
    const unitCharacteristics = await prisma.generation_unit_characteristics.findMany({
      where: {
        scenarioid: scenarioId,
        unitid: {
          in: unitIds
        }
      },
      select: {
        unitid: true,
        unittype: true
      }
    });

    // Create lookup maps
    const energyCostMap = new Map();
    energyCosts.forEach(cost => {
      const key = `${cost.unitid}-${cost.Hour}`;
      energyCostMap.set(key, cost.energy || 0);
    });

    const unitTypeMap = new Map();
    unitCharacteristics.forEach(char => {
      unitTypeMap.set(char.unitid, char.unittype || 'Unknown');
    });

    // Step 7: Build marginal unit data with energy costs and unit types
    const marginalUnitsWithCosts: MarginalUnitData[] = marginalUnits.map(unit => {
      const costKey = `${unit.unitid}-${unit.hour}`;
      const energyCost = energyCostMap.get(costKey) || 0;
      const unitType = unitTypeMap.get(unit.unitid) || 'Unknown';

      return {
        unitid: unit.unitid,
        unitname: unit.unitname,
        unittype: unitType,
        hour: unit.hour,
        energyCost: energyCost
      };
    });

    // Step 8: Find max energy costs for top and bottom hours
    const topHoursUnits = marginalUnitsWithCosts.filter(u => topHours.includes(u.hour));
    const bottomHoursUnits = marginalUnitsWithCosts.filter(u => bottomHours.includes(u.hour));

    // Find maximum energy cost for top hours
    const topMaxCost = topHoursUnits.length > 0 ? Math.max(...topHoursUnits.map(u => u.energyCost)) : 0;
    const topMaxUnit = topHoursUnits.find(u => u.energyCost === topMaxCost);
    const topHoursWithMaxCost = topHoursUnits.filter(u => u.energyCost === topMaxCost);

    // Find maximum energy cost for bottom hours
    const bottomMaxCost = bottomHoursUnits.length > 0 ? Math.max(...bottomHoursUnits.map(u => u.energyCost)) : 0;
    const bottomMaxUnit = bottomHoursUnits.find(u => u.energyCost === bottomMaxCost);
    const bottomHoursWithMaxCost = bottomHoursUnits.filter(u => u.energyCost === bottomMaxCost);

    // Step 9: Add to results
    results.push({
      date: dateString,
      topHoursMEC: topMaxCost,
      bottomHoursMEC: bottomMaxCost,
      topHoursUnit: topMaxUnit?.unittype || 'Unknown',
      bottomHoursUnit: bottomMaxUnit?.unittype || 'Unknown',
      isLastWeek: isLastWeek,
      topHoursDetails: topHoursWithMaxCost,
      bottomHoursDetails: bottomHoursWithMaxCost,
      topHours: topHours,
      bottomHours: bottomHours
    });

    console.log(`${dateString}: Top MEC = $${topMaxCost}, Bottom MEC = $${bottomMaxCost}`);
  }

  console.log(`Processed ${results.length} days of MCE data`);
  return results;
} 