import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const MONTHLY_CHARGING_RESTRICTIONS = {
  0: [8.4, 39.9, 39.9, 39.9, 39.9, 39.9, 39.9, 2.6, 2.6, 2.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 6.6, 8.4, 8.4, 8.4, 8.4, 8.4],
  // Jan
  1: [6.3, 40.4, 40.4, 40.4, 40.4, 40.4, 40.4, 4.7, 4.7, 4.7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6.3, 6.3, 6.3, 6.3, 6.3],
  // Feb
  2: [4.7, 33.9, 33.9, 33.9, 33.9, 33.9, 33.9, 7.4, 7.4, 7.4, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 4.7, 4.7, 4.7, 4.7, 4.7],
  // Mar
  3: [25.4, 29.4, 29.4, 29.4, 29.4, 29.4, 29.4, 15.3, 15.3, 15.3, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 24.6, 25.4, 25.4, 25.4, 25.4, 25.4],
  // Apr
  4: [28.9, 37.1, 37.1, 37.1, 37.1, 37.1, 37.1, 25.5, 25.5, 25.5, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 24.4, 28.9, 28.9, 28.9, 28.9, 28.9],
  // May
  5: [30.8, 45.3, 45.3, 45.3, 45.3, 45.3, 45.3, 19.6, 19.6, 19.6, 20, 20, 20, 20, 20, 20, 20, 20, 20, 30.8, 30.8, 30.8, 30.8, 30.8],
  // Jun
  6: [5.6, 37.4, 37.4, 37.4, 37.4, 37.4, 37.4, 3.5, 3.5, 3.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5.6, 5.6, 5.6, 5.6, 5.6],
  // Jul
  7: [0.5, 36, 36, 36, 36, 36, 36, 1.7, 1.7, 1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5],
  // Aug
  8: [6.1, 34.4, 34.4, 34.4, 34.4, 34.4, 34.4, 2.6, 2.6, 2.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6.1, 6.1, 6.1, 6.1, 6.1],
  // Sep
  9: [11, 41.3, 41.3, 41.3, 41.3, 41.3, 41.3, 11, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 11, 11, 11],
  // Oct
  10: [14.3, 40.1, 40.1, 40.1, 40.1, 40.1, 40.1, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 14.3, 14.3, 14.3, 14.3, 14.3],
  // Nov
  11: [8.2, 42.3, 42.3, 42.3, 42.3, 42.3, 42.3, 5.2, 5.2, 5.2, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 7.1, 8.2, 8.2, 8.2, 8.2, 8.2]
  // Dec
};
function getDominantMonth(startDate, endDate) {
  const monthCounts = {};
  const current = new Date(startDate);
  while (current <= endDate) {
    const month = current.getMonth();
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    current.setDate(current.getDate() + 1);
  }
  let dominantMonth = startDate.getMonth();
  let maxDays = 0;
  Object.entries(monthCounts).forEach(([month, days]) => {
    if (days > maxDays) {
      maxDays = days;
      dominantMonth = parseInt(month);
    }
  });
  console.log("📅 Month day counts:", monthCounts);
  console.log("📅 Dominant month:", dominantMonth, "(", new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" }), ")");
  return dominantMonth;
}
function getChargingRestrictionsForMonth(month) {
  return MONTHLY_CHARGING_RESTRICTIONS[month] || MONTHLY_CHARGING_RESTRICTIONS[9];
}
const GET = async ({ request }) => {
  let secondaryPool = null;
  try {
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let targetScenario;
    if (requestedScenarioId) {
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true, simulation_date: true }
      });
      console.log("Using requested scenario:", targetScenario);
    } else {
      targetScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: "desc" },
        select: { scenarioid: true, scenarioname: true, simulation_date: true }
      });
      console.log("Using latest scenario:", targetScenario);
    }
    if (!targetScenario) {
      return new Response(
        JSON.stringify({ error: "No scenarios found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const today = targetScenario.simulation_date ? new Date(targetScenario.simulation_date) : /* @__PURE__ */ new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(today.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    const lastYearStart = new Date(today);
    lastYearStart.setFullYear(today.getFullYear() - 1);
    lastYearStart.setHours(0, 0, 0, 0);
    const lastYearEnd = new Date(today);
    lastYearEnd.setFullYear(today.getFullYear() - 1);
    lastYearEnd.setDate(today.getDate() + 6);
    lastYearEnd.setHours(23, 59, 59, 999);
    console.log("This week:", thisWeekStart.toISOString(), "to", thisWeekEnd.toISOString());
    console.log("Last week:", lastWeekStart.toISOString(), "to", lastWeekEnd.toISOString());
    console.log("Last year:", lastYearStart.toISOString(), "to", lastYearEnd.toISOString());
    const thisWeekResults = await calculateThisWeekTB26(targetScenario.scenarioid, thisWeekStart, thisWeekEnd);
    const lastWeekResults = await calculateLastWeekTB26(secondaryPool, lastWeekStart, lastWeekEnd);
    const lastYearResults = await calculateLastWeekTB26(secondaryPool, lastYearStart, lastYearEnd);
    const currentMonthIndex = today.getMonth();
    const chargingRestrictions = getChargingRestrictionsForMonth(currentMonthIndex);
    const currentMonth = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const result = {
      thisWeek: thisWeekResults,
      lastWeek: lastWeekResults,
      lastYear: lastYearResults,
      scenarioId: targetScenario.scenarioid,
      dateRanges: {
        thisWeek: `${thisWeekStart.toISOString().split("T")[0]} to ${thisWeekEnd.toISOString().split("T")[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split("T")[0]} to ${lastWeekEnd.toISOString().split("T")[0]}`,
        lastYear: `${lastYearStart.toISOString().split("T")[0]} to ${lastYearEnd.toISOString().split("T")[0]}`
      },
      chargingRestrictions,
      currentMonth
    };
    console.log("Final TB2.6 Results:", {
      thisWeek: thisWeekResults.totalTB26.toFixed(2),
      lastWeek: lastWeekResults.totalTB26.toFixed(2),
      lastYear: lastYearResults.totalTB26.toFixed(2)
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("TB2.6 calculation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to calculate TB2.6",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (secondaryPool) {
      await secondaryPool.end();
    }
  }
};
async function calculateThisWeekTB26(scenarioId, startDate, endDate) {
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  console.log(`🔋 This Week: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" })} charging restrictions`);
  const results = await prisma.results_units.findMany({
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
      energy: true,
      congestion: true,
      losses: true
    },
    orderBy: [
      { Date: "asc" },
      { Hour: "asc" }
    ]
  });
  console.log("Raw data count:", results.length);
  if (results.length === 0) {
    return {
      totalTB26: 0,
      energyTB26: 0,
      congestionTB26: 0,
      weeklyBreakdown: []
    };
  }
  const processedData = results.map((row) => ({
    Date: row.Date,
    Hour: row.Hour,
    energy: row.energy || 0,
    congestion: row.congestion || 0,
    losses: row.losses || 0,
    lmp: (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
  }));
  const dataByDate = {};
  processedData.forEach((row) => {
    const dateKey = row.Date.toISOString().split("T")[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = [];
    }
    dataByDate[dateKey].push(row);
  });
  console.log("Days found:", Object.keys(dataByDate));
  const dailyRevenues = [];
  Object.keys(dataByDate).forEach((dateString) => {
    const dayData = dataByDate[dateString];
    if (dayData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dayData.length} hours`);
      return;
    }
    const sortedByLMP = [...dayData].sort((a, b) => a.lmp - b.lmp);
    const batteryCapacity = 160;
    const efficiency = 0.86;
    let totalCost = 0;
    let energyCost = 0;
    let congestionCost = 0;
    let mwBought = 0;
    let buyIndex = 0;
    console.log(`🔋 Charging for ${dateString} (This Week Forecast):`);
    while (mwBought < batteryCapacity && buyIndex < sortedByLMP.length) {
      const hour = sortedByLMP[buyIndex];
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1;
      let restriction = chargingRestrictions[hourBeginning];
      if (mwBought + restriction > batteryCapacity) {
        restriction = batteryCapacity - mwBought;
      }
      totalCost += restriction * hour.lmp;
      energyCost += restriction * (hour.energy || 0);
      congestionCost += restriction * (hour.congestion || 0);
      console.log(`  HE ${hourEnding} (HB ${hourBeginning}): Buy ${restriction.toFixed(1)} MW @ $${hour.lmp.toFixed(2)}/MWh (restriction: ${chargingRestrictions[hourBeginning]} MW)`);
      mwBought += restriction;
      buyIndex++;
    }
    console.log(`  Total charged: ${mwBought.toFixed(1)} MW, Total cost: $${totalCost.toFixed(2)}`);
    const availableEnergy = batteryCapacity * efficiency;
    const discharge1 = { hour: sortedByLMP[23], amount: 60 };
    const discharge2 = { hour: sortedByLMP[22], amount: 60 };
    const discharge3 = { hour: sortedByLMP[21], amount: availableEnergy - 120 };
    const totalRevenue = discharge1.amount * discharge1.hour.lmp + discharge2.amount * discharge2.hour.lmp + discharge3.amount * discharge3.hour.lmp;
    const energyRevenue = discharge1.amount * (discharge1.hour.energy || 0) + discharge2.amount * (discharge2.hour.energy || 0) + discharge3.amount * (discharge3.hour.energy || 0);
    const congestionRevenue = discharge1.amount * (discharge1.hour.congestion || 0) + discharge2.amount * (discharge2.hour.congestion || 0) + discharge3.amount * (discharge3.hour.congestion || 0);
    console.log(`  Total revenue: $${totalRevenue.toFixed(2)}, Net: $${(totalRevenue - totalCost).toFixed(2)}`);
    dailyRevenues.push({
      date: dateString,
      totalRevenue: totalRevenue - totalCost,
      energyRevenue: energyRevenue - energyCost,
      congestionRevenue: congestionRevenue - congestionCost
    });
    console.log(`${dateString}: Total=${(totalRevenue - totalCost).toFixed(2)}, Energy=${(energyRevenue - energyCost).toFixed(2)}, Congestion=${(congestionRevenue - congestionCost).toFixed(2)}`);
  });
  const weeklyTotal = dailyRevenues.reduce((sum, day) => sum + day.totalRevenue, 0);
  const weeklyEnergy = dailyRevenues.reduce((sum, day) => sum + day.energyRevenue, 0);
  const weeklyCongestion = dailyRevenues.reduce((sum, day) => sum + day.congestionRevenue, 0);
  const dailyCount = dailyRevenues.length;
  const dailyAvgTotal = weeklyTotal / dailyCount;
  const dailyAvgEnergy = weeklyEnergy / dailyCount;
  const dailyAvgCongestion = weeklyCongestion / dailyCount;
  const totalTB26 = dailyAvgTotal / (60 * 1e3) * 30.25;
  const energyTB26 = dailyAvgEnergy / (60 * 1e3) * 30.25;
  const congestionTB26 = dailyAvgCongestion / (60 * 1e3) * 30.25;
  console.log("🔋 This Week TB2,6 with restrictions:", {
    totalTB26: totalTB26.toFixed(2),
    energyTB26: energyTB26.toFixed(2),
    congestionTB26: congestionTB26.toFixed(2)
  });
  return {
    totalTB26,
    energyTB26,
    congestionTB26,
    weeklyBreakdown: dailyRevenues
  };
}
async function calculateLastWeekTB26(pool, startDate, endDate) {
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  console.log(`🔋 Last Week/Year: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" })} charging restrictions`);
  const queryStartDate = new Date(startDate);
  queryStartDate.setDate(queryStartDate.getDate() - 1);
  const queryEndDate = new Date(endDate);
  queryEndDate.setDate(queryEndDate.getDate() + 1);
  console.log("🔍 Query date range (extended):", queryStartDate.toISOString(), "to", queryEndDate.toISOString());
  console.log("🔍 Target date range (actual):", startDate.toISOString(), "to", endDate.toISOString());
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
    ["GOLETA_6_N100", "DALMP", "DALMP_Congestion", "DALMP_Energy", queryStartDate.toISOString(), queryEndDate.toISOString()]
  );
  console.log("Raw historical data count:", results.rows.length);
  if (results.rows.length === 0) {
    return {
      totalTB26: 0,
      energyTB26: 0,
      congestionTB26: 0,
      weeklyBreakdown: []
    };
  }
  const hourlyDataMap = {};
  results.rows.forEach((row) => {
    const datetime = new Date(row.local_datetime_ib);
    datetime.setHours(datetime.getHours() + 1);
    if (datetime >= startDate && datetime <= endDate) {
      const datetimeKey = datetime.toISOString();
      if (!hourlyDataMap[datetimeKey]) {
        hourlyDataMap[datetimeKey] = {
          originalIB: row.local_datetime_ib
        };
      }
      switch (row.attribute) {
        case "DALMP":
          hourlyDataMap[datetimeKey].dalmp = Number(row.value);
          break;
        case "DALMP_Energy":
          hourlyDataMap[datetimeKey].dalmp_energy = Number(row.value);
          break;
        case "DALMP_Congestion":
          hourlyDataMap[datetimeKey].dalmp_congestion = Number(row.value);
          break;
      }
    }
  });
  console.log("🔍 Unique hour ending times found:", Object.keys(hourlyDataMap).length);
  console.log("🔍 Sample hour ending times:", Object.keys(hourlyDataMap).slice(0, 5));
  for (let d = 0; d < 7; d++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + d);
    const dateStr = checkDate.toISOString().split("T")[0];
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
  const processedData = Object.keys(hourlyDataMap).map((datetimeKey) => {
    const datetime = new Date(datetimeKey);
    const hourData = hourlyDataMap[datetimeKey];
    if (hourData.dalmp === void 0) {
      console.log("⚠️ Missing DALMP for:", datetimeKey, "Original IB:", hourData.originalIB);
      return null;
    }
    return {
      Date: datetime,
      Hour: datetime.getHours() === 0 ? 24 : datetime.getHours(),
      // Convert 0 to 24 for HE format
      energy: hourData.dalmp_energy || 0,
      congestion: hourData.dalmp_congestion || 0,
      losses: null,
      // No losses data in yes_fundamentals
      lmp: hourData.dalmp
    };
  }).filter((item) => item !== null);
  console.log("Processed historical data count:", processedData.length);
  console.log("Sample processed data:", processedData.slice(0, 3));
  const dataByDate = {};
  processedData.forEach((row) => {
    const dateKey = row.Date.toISOString().split("T")[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = [];
    }
    dataByDate[dateKey].push(row);
  });
  console.log("Days found:", Object.keys(dataByDate));
  const dailyRevenues = [];
  Object.keys(dataByDate).forEach((dateString) => {
    const dayData = dataByDate[dateString];
    if (dayData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dayData.length} hours`);
      return;
    }
    const sortedByLMP = [...dayData].sort((a, b) => a.lmp - b.lmp);
    const batteryCapacity = 160;
    const efficiency = 0.86;
    let totalCost = 0;
    let energyCost = 0;
    let congestionCost = 0;
    let mwBought = 0;
    let buyIndex = 0;
    console.log(`🔋 Charging for ${dateString}:`);
    while (mwBought < batteryCapacity && buyIndex < sortedByLMP.length) {
      const hour = sortedByLMP[buyIndex];
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1;
      let restriction = chargingRestrictions[hourBeginning];
      if (mwBought + restriction > batteryCapacity) {
        restriction = batteryCapacity - mwBought;
      }
      totalCost += restriction * hour.lmp;
      energyCost += restriction * (hour.energy || 0);
      congestionCost += restriction * (hour.congestion || 0);
      console.log(`  HE ${hourEnding} (HB ${hourBeginning}): Buy ${restriction.toFixed(1)} MW @ $${hour.lmp.toFixed(2)}/MWh (restriction: ${chargingRestrictions[hourBeginning]} MW)`);
      mwBought += restriction;
      buyIndex++;
    }
    console.log(`  Total charged: ${mwBought.toFixed(1)} MW, Total cost: $${totalCost.toFixed(2)}`);
    const availableEnergy = batteryCapacity * efficiency;
    const discharge1 = { hour: sortedByLMP[23], amount: 60 };
    const discharge2 = { hour: sortedByLMP[22], amount: 60 };
    const discharge3 = { hour: sortedByLMP[21], amount: availableEnergy - 120 };
    const totalRevenue = discharge1.amount * discharge1.hour.lmp + discharge2.amount * discharge2.hour.lmp + discharge3.amount * discharge3.hour.lmp;
    const energyRevenue = discharge1.amount * (discharge1.hour.energy || 0) + discharge2.amount * (discharge2.hour.energy || 0) + discharge3.amount * (discharge3.hour.energy || 0);
    const congestionRevenue = discharge1.amount * (discharge1.hour.congestion || 0) + discharge2.amount * (discharge2.hour.congestion || 0) + discharge3.amount * (discharge3.hour.congestion || 0);
    console.log(`  Total revenue: $${totalRevenue.toFixed(2)}, Net: $${(totalRevenue - totalCost).toFixed(2)}`);
    dailyRevenues.push({
      date: dateString,
      totalRevenue: totalRevenue - totalCost,
      energyRevenue: energyRevenue - energyCost,
      congestionRevenue: congestionRevenue - congestionCost
    });
    console.log(`${dateString}: Total=${(totalRevenue - totalCost).toFixed(2)}, Energy=${(energyRevenue - energyCost).toFixed(2)}, Congestion=${(congestionRevenue - congestionCost).toFixed(2)}`);
  });
  const weeklyTotal = dailyRevenues.reduce((sum, day) => sum + day.totalRevenue, 0);
  const weeklyEnergy = dailyRevenues.reduce((sum, day) => sum + day.energyRevenue, 0);
  const weeklyCongestion = dailyRevenues.reduce((sum, day) => sum + day.congestionRevenue, 0);
  const dailyCount = dailyRevenues.length;
  const dailyAvgTotal = weeklyTotal / dailyCount;
  const dailyAvgEnergy = weeklyEnergy / dailyCount;
  const dailyAvgCongestion = weeklyCongestion / dailyCount;
  const totalTB26 = dailyAvgTotal / (60 * 1e3) * 30.25;
  const energyTB26 = dailyAvgEnergy / (60 * 1e3) * 30.25;
  const congestionTB26 = dailyAvgCongestion / (60 * 1e3) * 30.25;
  console.log("🔋 Last Week TB2,6 with restrictions:", {
    totalTB26: totalTB26.toFixed(2),
    energyTB26: energyTB26.toFixed(2),
    congestionTB26: congestionTB26.toFixed(2)
  });
  return {
    totalTB26,
    energyTB26,
    congestionTB26,
    weeklyBreakdown: dailyRevenues
  };
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
