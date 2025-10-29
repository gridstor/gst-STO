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
// Same as TB2,6 calculation
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
  
  console.log('📅 Congestion: Month day counts:', monthCounts);
  console.log('📅 Congestion: Dominant month:', dominantMonth, '(', new Date(2025, dominantMonth, 1).toLocaleDateString('en-US', { month: 'long' }), ')');
  
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

interface CongestionData {
  Date: Date;
  Hour: number;
  constraintid: number;
  congestion: number;
  constraintname: string;
}

interface DayCongestionResult {
  date: string;
  topHours: {
    hours: number[];
    constraintName: string;
    avgCongestion: number;
  };
  bottomHours: {
    hours: number[];
    constraintName: string;
    avgCongestion: number;
  };
}

interface WeeklyCongestionResponse {
  scenarioId: number;
  thisWeek: DayCongestionResult[];
  lastWeek: DayCongestionResult[]; // Future implementation
  dateRanges: {
    thisWeek: string;
    lastWeek: string;
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('=== Weekly Congestion API ===');
    
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
      // Get most recent scenario (default behavior)
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: 'desc' },
        select: {
          scenarioid: true,
          scenarioname: true,
          simulation_date: true
        }
      });
      console.log('Using latest scenario:', targetScenario);
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

    console.log('This week (dynamic):', thisWeekStart.toISOString(), 'to', thisWeekEnd.toISOString());
    console.log('Last week (dynamic):', lastWeekStart.toISOString(), 'to', lastWeekEnd.toISOString());

    // Calculate This Week congestion data
    const thisWeekResults = await calculateWeeklyCongestion(
      scenario.scenarioid, 
      thisWeekStart, 
      thisWeekEnd
    );

    // Calculate Last Week congestion data (now enabled with dynamic dates)
    const lastWeekResults = await calculateWeeklyCongestion(
      scenario.scenarioid, 
      lastWeekStart, 
      lastWeekEnd
    );

    const result = {
      scenarioId: scenario.scenarioid,
      thisWeek: thisWeekResults,
      lastWeek: lastWeekResults,
      dateRanges: {
        thisWeek: `${thisWeekStart.toISOString().split('T')[0]} to ${thisWeekEnd.toISOString().split('T')[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]}`
      }
    };

    console.log('Weekly congestion calculation completed');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Weekly congestion calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate weekly congestion', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function calculateWeeklyCongestion(
  scenarioId: number, 
  startDate: Date, 
  endDate: Date
): Promise<DayCongestionResult[]> {
  
  console.log('Calculating weekly congestion for scenario:', scenarioId);
  
  // Determine dominant month for this week to get appropriate charging restrictions
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  
  console.log(`🔋 Weekly Congestion: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString('en-US', { month: 'long' })} charging restrictions`);
  
  // Step 1: Fetch LMP data from results_units (unitid = 66038)
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

  // Step 3: Fetch constraint mapping for names
  const constraintMapping = await prisma.transmission_constraint_characteristics.findMany({
    where: {
      scenarioid: scenarioId
    },
    select: {
      constraintid: true,
      constraintname: true
    }
  });

  const constraintNameMap = new Map();
  constraintMapping.forEach((item) => {
    constraintNameMap.set(item.constraintid, item.constraintname);
  });

  // Step 4: For each day, identify hours and find most impactful constraints
  const results: DayCongestionResult[] = [];

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

    console.log(`${dateString}: Detailed LMP breakdown (available hours only):`);
    console.log(`  Available hours sorted by LMP (descending):`);
    sortedByLMP.forEach((hour, index) => {
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1;
      const restriction = chargingRestrictions[hourBeginning];
      const position = index === 0 ? ' (HIGHEST)' : 
                     index === 1 ? ' (2ND HIGHEST)' : 
                     index === sortedByLMP.length - 2 ? ' (2ND LOWEST)' : 
                     index === sortedByLMP.length - 1 ? ' (LOWEST)' : '';
      console.log(`    Hour ${hour.Hour} (HB ${hourBeginning}): LMP=$${hour.lmp.toFixed(2)}, Restriction=${restriction} MW${position}`);
    });
    console.log(`  → Top hours (highest LMP, chargeable): ${topHours}`);
    console.log(`  → Bottom hours (lowest LMP, chargeable): ${bottomHours}`);

    // Step 5: Get congestion data for these specific hours
    const targetDate = new Date(dateString);
    const allTargetHours = [...topHours, ...bottomHours];

    const congestionData = await prisma.binding_constraints_report.findMany({
      where: {
        itemid: 66038,
        scenarioid: scenarioId,
        Date: targetDate,
        Hour: {
          in: allTargetHours
        }
      },
      select: {
        Date: true,
        Hour: true,
        constraintid: true,
        congestion: true
      }
    });

    // Process congestion data with constraint names
    const processedCongestionData: CongestionData[] = congestionData.map((item) => ({
      Date: new Date(item.Date),
      Hour: item.Hour,
      constraintid: item.constraintid,
      congestion: item.congestion || 0,
      constraintname: constraintNameMap.get(item.constraintid) || `Constraint ${item.constraintid}`
    }));

    // Step 6: Calculate constraint averages for top hours
    const topHoursCongestion = processedCongestionData.filter(item => 
      topHours.includes(item.Hour)
    );
    const topConstraintAvgs = calculateConstraintAverages(topHoursCongestion);
    const topMostImpactful = findMostImpactfulConstraint(topConstraintAvgs);

    // Step 7: Calculate constraint averages for bottom hours  
    const bottomHoursCongestion = processedCongestionData.filter(item => 
      bottomHours.includes(item.Hour)
    );
    const bottomConstraintAvgs = calculateConstraintAverages(bottomHoursCongestion);
    const bottomMostImpactful = findMostImpactfulConstraint(bottomConstraintAvgs);

    // Step 8: Add to results
    results.push({
      date: dateString,
      topHours: {
        hours: topHours.sort(),
        constraintName: topMostImpactful.name,
        avgCongestion: topMostImpactful.avgCongestion
      },
      bottomHours: {
        hours: bottomHours.sort(),
        constraintName: bottomMostImpactful.name,
        avgCongestion: bottomMostImpactful.avgCongestion
      }
    });
  }

  console.log(`Processed ${results.length} days of congestion data`);
  return results;
}

function calculateConstraintAverages(congestionData: CongestionData[]): Map<string, { sum: number, count: number, avg: number }> {
  const constraintStats = new Map();

  congestionData.forEach(item => {
    const name = item.constraintname;
    if (!constraintStats.has(name)) {
      constraintStats.set(name, { sum: 0, count: 0, avg: 0 });
    }
    
    const stats = constraintStats.get(name);
    stats.sum += item.congestion;
    stats.count += 1;
    stats.avg = stats.sum / stats.count;
  });

  return constraintStats;
}

function findMostImpactfulConstraint(constraintAvgs: Map<string, { avg: number }>): { name: string, avgCongestion: number } {
  let mostImpactful = { name: 'No constraints', avgCongestion: 0 };
  let maxAbsValue = 0;

  constraintAvgs.forEach((stats, name) => {
    const absValue = Math.abs(stats.avg);
    if (absValue > maxAbsValue) {
      maxAbsValue = absValue;
      mostImpactful = {
        name: name,
        avgCongestion: stats.avg // Return actual value, not absolute
      };
    }
  });

  return mostImpactful;
} 