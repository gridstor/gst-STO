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
  console.log("📅 Congestion: Month day counts:", monthCounts);
  console.log("📅 Congestion: Dominant month:", dominantMonth, "(", new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" }), ")");
  return dominantMonth;
}
function getChargingRestrictionsForMonth(month) {
  return MONTHLY_CHARGING_RESTRICTIONS[month] || MONTHLY_CHARGING_RESTRICTIONS[9];
}
const GET = async ({ request }) => {
  try {
    console.log("=== Weekly Congestion API ===");
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
    console.log("This week (dynamic):", thisWeekStart.toISOString(), "to", thisWeekEnd.toISOString());
    console.log("Last week (dynamic):", lastWeekStart.toISOString(), "to", lastWeekEnd.toISOString());
    const thisWeekResults = await calculateWeeklyCongestion(
      scenario.scenarioid,
      thisWeekStart,
      thisWeekEnd
    );
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
        thisWeek: `${thisWeekStart.toISOString().split("T")[0]} to ${thisWeekEnd.toISOString().split("T")[0]}`,
        lastWeek: `${lastWeekStart.toISOString().split("T")[0]} to ${lastWeekEnd.toISOString().split("T")[0]}`
      }
    };
    console.log("Weekly congestion calculation completed");
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Weekly congestion calculation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to calculate weekly congestion",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
async function calculateWeeklyCongestion(scenarioId, startDate, endDate) {
  console.log("Calculating weekly congestion for scenario:", scenarioId);
  const dominantMonth = getDominantMonth(startDate, endDate);
  const chargingRestrictions = getChargingRestrictionsForMonth(dominantMonth);
  console.log(`🔋 Weekly Congestion: Using ${new Date(2025, dominantMonth, 1).toLocaleDateString("en-US", { month: "long" })} charging restrictions`);
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
  const constraintMappingRaw = await prisma.$queryRaw`
    SELECT constraintid, constraintname 
    FROM "output_db"."transmission_constraint_characteristics"
    WHERE scenarioid = ${scenarioId}
  `;
  const constraintMapping = constraintMappingRaw.map((row) => ({
    constraintid: Number(row.constraintid),
    constraintname: row.constraintname
  }));
  const constraintNameMap = /* @__PURE__ */ new Map();
  constraintMapping.forEach((item) => {
    constraintNameMap.set(item.constraintid, item.constraintname);
  });
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
    console.log(`${dateString}: Detailed LMP breakdown (available hours only):`);
    console.log(`  Available hours sorted by LMP (descending):`);
    sortedByLMP.forEach((hour, index) => {
      const hourEnding = hour.Hour;
      const hourBeginning = hourEnding === 1 ? 0 : hourEnding - 1;
      const restriction = chargingRestrictions[hourBeginning];
      const position = index === 0 ? " (HIGHEST)" : index === 1 ? " (2ND HIGHEST)" : index === sortedByLMP.length - 2 ? " (2ND LOWEST)" : index === sortedByLMP.length - 1 ? " (LOWEST)" : "";
      console.log(`    Hour ${hour.Hour} (HB ${hourBeginning}): LMP=$${hour.lmp.toFixed(2)}, Restriction=${restriction} MW${position}`);
    });
    console.log(`  → Top hours (highest LMP, chargeable): ${topHours}`);
    console.log(`  → Bottom hours (lowest LMP, chargeable): ${bottomHours}`);
    const targetDate = new Date(dateString);
    const allTargetHours = [...topHours, ...bottomHours];
    const congestionDataRaw = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, congestion 
      FROM "output_db"."binding_constraints_report"
      WHERE itemid = 66038 
        AND scenarioid = ${scenarioId}
        AND "Date" = ${targetDate}
        AND "Hour" = ANY(${allTargetHours})
    `;
    const congestionData = congestionDataRaw.map((row) => ({
      Date: new Date(row.Date),
      Hour: Number(row.Hour),
      constraintid: Number(row.constraintid),
      congestion: Number(row.congestion || 0)
    }));
    const processedCongestionData = congestionData.map((item) => ({
      Date: item.Date,
      Hour: item.Hour,
      constraintid: item.constraintid,
      congestion: item.congestion,
      constraintname: constraintNameMap.get(item.constraintid) || `Constraint ${item.constraintid}`
    }));
    const topHoursCongestion = processedCongestionData.filter(
      (item) => topHours.includes(item.Hour)
    );
    const topConstraintAvgs = calculateConstraintAverages(topHoursCongestion);
    const topMostImpactful = findMostImpactfulConstraint(topConstraintAvgs);
    const bottomHoursCongestion = processedCongestionData.filter(
      (item) => bottomHours.includes(item.Hour)
    );
    const bottomConstraintAvgs = calculateConstraintAverages(bottomHoursCongestion);
    const bottomMostImpactful = findMostImpactfulConstraint(bottomConstraintAvgs);
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
function calculateConstraintAverages(congestionData) {
  const constraintStats = /* @__PURE__ */ new Map();
  congestionData.forEach((item) => {
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
function findMostImpactfulConstraint(constraintAvgs) {
  let mostImpactful = { name: "No constraints", avgCongestion: 0 };
  let maxAbsValue = 0;
  constraintAvgs.forEach((stats, name) => {
    const absValue = Math.abs(stats.avg);
    if (absValue > maxAbsValue) {
      maxAbsValue = absValue;
      mostImpactful = {
        name,
        avgCongestion: stats.avg
        // Return actual value, not absolute
      };
    }
  });
  return mostImpactful;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
