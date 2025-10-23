import { PrismaClient } from '@prisma/client';
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
  console.log("📅 MEC: Month day counts:", monthCounts);
  console.log("📅 MEC: Dominant month:", dominantMonth, "(", new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" }), ")");
  return dominantMonth;
}
function getChargingRestrictionsForMonth(month) {
  return MONTHLY_CHARGING_RESTRICTIONS[month] || MONTHLY_CHARGING_RESTRICTIONS[9];
}
const GET = async ({ request }) => {
  try {
    console.log("=== MCE Overview API ===");
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let targetScenarioRaw;
    if (requestedScenarioId) {
      targetScenarioRaw = await prisma.$queryRaw`
        SELECT scenarioid, scenarioname, simulation_date
        FROM "output_db"."info_scenarioid_scenarioname_mapping"
        WHERE scenarioid = ${parseInt(requestedScenarioId)}
        LIMIT 1
      `;
      console.log("Using requested scenario:", targetScenarioRaw[0]);
    } else {
      targetScenarioRaw = await prisma.$queryRaw`
        SELECT scenarioid, scenarioname, simulation_date
        FROM "output_db"."info_scenarioid_scenarioname_mapping"
        ORDER BY scenarioid DESC
        LIMIT 1
      `;
      console.log("Using latest scenario:", targetScenarioRaw[0]);
    }
    if (!targetScenarioRaw || targetScenarioRaw.length === 0) {
      return new Response(
        JSON.stringify({ error: "No scenarios found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const scenario = {
      ...targetScenarioRaw[0],
      scenarioid: Number(targetScenarioRaw[0].scenarioid)
    };
    console.log("Using scenario:", scenario);
    const today = scenario.simulation_date ? new Date(scenario.simulation_date) : /* @__PURE__ */ new Date();
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
    console.log("This week:", thisWeekStart.toISOString(), "to", thisWeekEnd.toISOString());
    console.log("Last week:", lastWeekStart.toISOString(), "to", lastWeekEnd.toISOString());
    const thisWeekResults = await calculateWeeklyMEC(
      scenario.scenarioid,
      thisWeekStart,
      thisWeekEnd,
      false
      // isLastWeek = false
    );
    const lastWeekResults = await calculateWeeklyMEC(
      scenario.scenarioid,
      lastWeekStart,
      lastWeekEnd,
      true
      // isLastWeek = true
    );
    const allData = [...lastWeekResults, ...thisWeekResults];
    const result = {
      scenarioId: scenario.scenarioid,
      data: allData,
      dateRanges: {
        thisWeek: `${thisWeekStart.toISOString().split("T")[0]} to ${thisWeekEnd.toISOString().split("T")[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split("T")[0]} to ${lastWeekEnd.toISOString().split("T")[0]}`
      }
    };
    console.log("MCE calculation completed");
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("MCE calculation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to calculate MCE overview",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
async function calculateWeeklyMEC(scenarioId, startDate, endDate, isLastWeek) {
  console.log("Calculating weekly MCE for scenario:", scenarioId);
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  console.log(`🔋 MEC Overview: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" })} charging restrictions`);
  const lmpResultsRaw = await prisma.$queryRaw`
    SELECT "Date", "Hour", lmp
    FROM "output_db"."results_units"
    WHERE scenarioid = ${scenarioId}
      AND unitid = 66038
      AND "Date" >= ${startDate}
      AND "Date" <= ${endDate}
    ORDER BY "Date" ASC, "Hour" ASC
  `;
  const lmpResults = lmpResultsRaw.map((row) => ({
    ...row,
    Hour: Number(row.Hour),
    lmp: Number(row.lmp || 0)
  }));
  console.log("LMP data count:", lmpResults.length);
  if (lmpResults.length === 0) {
    return [];
  }
  const lmpDataByDate = {};
  lmpResults.forEach((row) => {
    const dateKey = new Date(row.Date).toISOString().split("T")[0];
    if (!lmpDataByDate[dateKey]) {
      lmpDataByDate[dateKey] = [];
    }
    lmpDataByDate[dateKey].push({
      Date: new Date(row.Date),
      Hour: row.Hour,
      lmp: row.lmp
    });
  });
  console.log("LMP data grouped by date:", Object.keys(lmpDataByDate).map((date) => `${date}: ${lmpDataByDate[date].length} hours`));
  const results = [];
  for (const [dateString, dailyLmpData] of Object.entries(lmpDataByDate)) {
    if (dailyLmpData.length !== 24) {
      console.warn(`Incomplete data for ${dateString}: ${dailyLmpData.length} hours`);
      continue;
    }
    const availableHours = dailyLmpData.filter((hour) => {
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1;
      const restriction = chargingRestrictions[hourBeginning];
      return restriction > 0;
    });
    console.log(`${dateString}: Total hours: 24, Available for charging: ${availableHours.length}`);
    const sortedByLMP = [...availableHours].sort((a, b) => b.lmp - a.lmp);
    if (sortedByLMP.length < 4) {
      console.warn(`${dateString}: Not enough available hours (${sortedByLMP.length}) to identify top/bottom 2`);
      continue;
    }
    const topHours = [sortedByLMP[0].Hour, sortedByLMP[1].Hour];
    const bottomHours = [sortedByLMP[sortedByLMP.length - 2].Hour, sortedByLMP[sortedByLMP.length - 1].Hour];
    console.log(`${dateString}: Top hours (chargeable): ${topHours}, Bottom hours (chargeable): ${bottomHours}`);
    const targetDate = new Date(dateString);
    const allTargetHours = [...topHours, ...bottomHours];
    const marginalUnitsRaw = await prisma.$queryRaw`
      SELECT mur.unitid, mur.unitname, mur."Date", mur."Hour"
      FROM "output_db"."marginal_units_report" mur
      WHERE mur.scenarioid = ${scenarioId}
        AND mur."Date" = ${targetDate}
        AND mur."Hour" = ANY(${allTargetHours})
        AND mur.margintype = 'm'
    `;
    const marginalUnits = marginalUnitsRaw.map((row) => ({
      unitid: Number(row.unitid),
      unitname: row.unitname,
      date: new Date(row.Date),
      hour: Number(row.Hour)
    }));
    if (marginalUnits.length === 0) {
      console.warn(`No marginal units found for ${dateString}`);
      continue;
    }
    const unitIds = [...new Set(marginalUnits.map((u) => u.unitid))];
    const energyCostsRaw = await prisma.$queryRaw`
      SELECT unitid, "Date", "Hour", energy
      FROM "output_db"."results_units"
      WHERE scenarioid = ${scenarioId}
        AND unitid = ANY(${unitIds})
        AND "Date" = ${targetDate}
        AND "Hour" = ANY(${allTargetHours})
    `;
    const energyCosts = energyCostsRaw.map((row) => ({
      unitid: Number(row.unitid),
      Date: new Date(row.Date),
      Hour: Number(row.Hour),
      energy: Number(row.energy || 0)
    }));
    const unitCharacteristicsRaw = await prisma.$queryRaw`
      SELECT unitid, unittype
      FROM "output_db"."generation_unit_characteristics"
      WHERE scenarioid = ${scenarioId}
        AND unitid = ANY(${unitIds})
    `;
    const unitCharacteristics = unitCharacteristicsRaw.map((row) => ({
      unitid: Number(row.unitid),
      unittype: row.unittype
    }));
    const energyCostMap = /* @__PURE__ */ new Map();
    energyCosts.forEach((cost) => {
      const key = `${cost.unitid}-${cost.Hour}`;
      energyCostMap.set(key, cost.energy);
    });
    const unitTypeMap = /* @__PURE__ */ new Map();
    unitCharacteristics.forEach((char) => {
      unitTypeMap.set(char.unitid, char.unittype);
    });
    const marginalUnitsWithCosts = marginalUnits.map((unit) => {
      const costKey = `${unit.unitid}-${unit.hour}`;
      const energyCost = energyCostMap.get(costKey) || 0;
      const unitType = unitTypeMap.get(unit.unitid) || "Unknown";
      return {
        unitid: unit.unitid,
        unitname: unit.unitname,
        unittype: unitType,
        hour: unit.hour,
        energyCost
      };
    });
    const topHoursUnits = marginalUnitsWithCosts.filter((u) => topHours.includes(u.hour));
    const bottomHoursUnits = marginalUnitsWithCosts.filter((u) => bottomHours.includes(u.hour));
    const topMaxCost = topHoursUnits.length > 0 ? Math.max(...topHoursUnits.map((u) => u.energyCost)) : 0;
    const topMaxUnit = topHoursUnits.find((u) => u.energyCost === topMaxCost);
    const topHoursWithMaxCost = topHoursUnits.filter((u) => u.energyCost === topMaxCost);
    const bottomMaxCost = bottomHoursUnits.length > 0 ? Math.max(...bottomHoursUnits.map((u) => u.energyCost)) : 0;
    const bottomMaxUnit = bottomHoursUnits.find((u) => u.energyCost === bottomMaxCost);
    const bottomHoursWithMaxCost = bottomHoursUnits.filter((u) => u.energyCost === bottomMaxCost);
    results.push({
      date: dateString,
      topHoursMEC: topMaxCost,
      bottomHoursMEC: bottomMaxCost,
      topHoursUnit: topMaxUnit?.unittype || "Unknown",
      bottomHoursUnit: bottomMaxUnit?.unittype || "Unknown",
      isLastWeek,
      topHoursDetails: topHoursWithMaxCost,
      bottomHoursDetails: bottomHoursWithMaxCost,
      topHours,
      bottomHours
    });
    console.log(`${dateString}: Top MEC = $${topMaxCost}, Bottom MEC = $${bottomMaxCost}`);
  }
  console.log(`Processed ${results.length} days of MCE data`);
  return results;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
