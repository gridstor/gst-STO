import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
export { renderers } from '../../renderers.mjs';

const { Pool } = pkg;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let lastWeekScenario;
    if (requestedScenarioId) {
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("LMP Last Week - Using requested scenario:", lastWeekScenario);
    } else {
      const latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: "desc" },
        select: { scenarioid: true, scenarioname: true }
      });
      if (!latestScenario) {
        return new Response(
          JSON.stringify({ error: "No scenarios found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      const lastWeekScenarioId = latestScenario.scenarioid - 7;
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: lastWeekScenarioId },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("LMP Last Week - Using latest scenario:", latestScenario.scenarioid, "and last week scenario:", lastWeekScenario?.scenarioid);
    }
    if (!lastWeekScenario) {
      const errorMessage = requestedScenarioId ? `Requested scenario ${requestedScenarioId} not found` : `Last week scenario not found`;
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Using LMP last week scenario:", lastWeekScenario.scenarioid);
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        unitid: 66038
        // Goleta unit
      },
      _min: { Date: true },
      _max: { Date: true }
    });
    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: "No LMP data found for last week scenario" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const forecastStartDate = new Date(dayzerDateRange._min.Date);
    const forecastEndDate = new Date(dayzerDateRange._max.Date);
    const today = /* @__PURE__ */ new Date();
    console.log("Forecast date range:", forecastStartDate.toISOString(), "to", forecastEndDate.toISOString());
    console.log("Today:", today.toISOString());
    console.log("Forecast is in future:", forecastStartDate > today);
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    console.log("LMP last week query dates:", startDate.toISOString(), "to", endDate.toISOString());
    const lmpForecastResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
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
        losses: true,
        lmp: true
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ]
    });
    console.log("LMP last week forecast data points:", lmpForecastResults.length);
    const secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    let rtLMPMap = {};
    try {
      const rtLMPQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value"
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "RTLMP", startDate.toISOString(), endDate.toISOString()]);
      console.log("RT LMP query - EXACT date range:", startDate.toISOString(), "to", endDate.toISOString());
      console.log("RT LMP data points found:", rtLMPQuery.rows.length);
      const testQuery = await secondaryPool.query(`
        SELECT COUNT(*) as count, MIN(local_datetime_ib) as min_date, MAX(local_datetime_ib) as max_date
        FROM yes_fundamentals 
        WHERE entity = 'GOLETA_6_N100' 
          AND attribute = 'RTLMP'
      `);
      console.log("GOLETA_6_N100 RTLMP total data availability:", testQuery.rows[0]);
      if (rtLMPQuery.rows.length > 0) {
        console.log("First RT LMP value:", rtLMPQuery.rows[0]);
        console.log("Last RT LMP value:", rtLMPQuery.rows[rtLMPQuery.rows.length - 1]);
      } else {
        console.log("NO RT LMP DATA FOUND for date range - trying 2019 dates...");
        const test2019Query = await secondaryPool.query(`
          SELECT local_datetime_ib, "value"
          FROM yes_fundamentals 
          WHERE entity = 'GOLETA_6_N100' 
            AND attribute = 'RTLMP'
            AND local_datetime_ib >= '2019-12-31T00:00:00Z'
            AND local_datetime_ib <= '2019-12-31T23:59:59Z'
          ORDER BY local_datetime_ib ASC
          LIMIT 5
        `);
        console.log("2019 test data points:", test2019Query.rows.length);
        if (test2019Query.rows.length > 0) {
          console.log("Sample 2019 data:", test2019Query.rows[0]);
        }
      }
      const rtLMPTemp = {};
      rtLMPQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        datetime.setMinutes(0, 0, 0);
        const datetimeKey = datetime.toISOString();
        const value = parseFloat(row.value) || 0;
        if (!rtLMPTemp[datetimeKey]) {
          rtLMPTemp[datetimeKey] = { sum: 0, count: 0 };
        }
        rtLMPTemp[datetimeKey].sum += value;
        rtLMPTemp[datetimeKey].count += 1;
      });
      Object.keys(rtLMPTemp).forEach((key) => {
        rtLMPMap[key] = rtLMPTemp[key].sum / rtLMPTemp[key].count;
      });
      console.log("RT LMP map created with", Object.keys(rtLMPMap).length, "entries");
      const nonZeroValues = Object.entries(rtLMPMap).filter(([key, value]) => value !== 0);
      console.log("Non-zero RT LMP values:", nonZeroValues.length);
      if (nonZeroValues.length > 0) {
        console.log("Sample non-zero RT LMP:", nonZeroValues[0]);
      }
    } catch (poolError) {
      console.error("Error fetching RT LMP data:", poolError);
      rtLMPMap = {};
    }
    let daLMPMap = {};
    let daCongestionMap = {};
    let daEnergyMap = {};
    let daLossMap = {};
    try {
      const daLMPQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value"
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP", startDate.toISOString(), endDate.toISOString()]);
      const daCongestionQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value"
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP_Congestion", startDate.toISOString(), endDate.toISOString()]);
      const daEnergyQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value"
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP_Energy", startDate.toISOString(), endDate.toISOString()]);
      const daLossQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value"
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP_Loss", startDate.toISOString(), endDate.toISOString()]);
      console.log("DA LMP data points:", daLMPQuery.rows.length);
      console.log("DA Congestion data points:", daCongestionQuery.rows.length);
      console.log("DA Energy data points:", daEnergyQuery.rows.length);
      console.log("DA Loss data points:", daLossQuery.rows.length);
      daLMPQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        daLMPMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      daCongestionQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        daCongestionMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      daEnergyQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        daEnergyMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      daLossQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        daLossMap[datetimeKey] = parseFloat(row.value) || 0;
      });
    } catch (poolError) {
      console.error("Error fetching DA LMP data:", poolError);
      daLMPMap = {};
      daCongestionMap = {};
      daEnergyMap = {};
      daLossMap = {};
    } finally {
      await secondaryPool.end();
    }
    console.log("Fetching t-1 LMP forecast data...");
    const lastWeekStartDate = new Date(startDate);
    const lastWeekEndDate = new Date(endDate);
    const lastWeekDates = [];
    for (let d = new Date(lastWeekStartDate); d <= lastWeekEndDate; d.setDate(d.getDate() + 1)) {
      lastWeekDates.push(new Date(d));
    }
    console.log("Last week dates for t-1 LMP analysis:", lastWeekDates.map((d) => d.toISOString().split("T")[0]));
    const allScenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
      select: { scenarioid: true, simulation_date: true },
      orderBy: { scenarioid: "asc" }
    });
    const energyT1Map = {};
    const congestionT1Map = {};
    const lossesT1Map = {};
    const lmpT1Map = {};
    for (const targetDate of lastWeekDates) {
      const t1Date = new Date(targetDate);
      t1Date.setDate(t1Date.getDate() - 1);
      const t1DateStr = t1Date.toISOString().split("T")[0];
      const t1Scenario = allScenarios.find((s) => {
        let dbDateStr;
        if (typeof s.simulation_date === "string") {
          const date = new Date(s.simulation_date);
          dbDateStr = date.toISOString().split("T")[0];
        } else {
          dbDateStr = s.simulation_date.toISOString().split("T")[0];
        }
        return dbDateStr === t1DateStr;
      });
      if (t1Scenario) {
        console.log(`t-1 LMP for ${targetDate.toISOString().split("T")[0]}: Using scenario ${t1Scenario.scenarioid} (${t1DateStr})`);
        const t1LMPData = await prisma.results_units.findMany({
          where: {
            scenarioid: t1Scenario.scenarioid,
            Date: targetDate,
            unitid: 66038
            // Goleta unit
          },
          select: { Hour: true, energy: true, congestion: true, losses: true, lmp: true }
        });
        t1LMPData.forEach((row) => {
          const datetime = new Date(targetDate);
          datetime.setHours(row.Hour - 1, 0, 0, 0);
          const datetimeKey = datetime.toISOString();
          energyT1Map[datetimeKey] = row.energy || 0;
          congestionT1Map[datetimeKey] = row.congestion || 0;
          lossesT1Map[datetimeKey] = row.losses || 0;
          lmpT1Map[datetimeKey] = row.lmp || 0;
        });
      } else {
        console.log(`t-1 LMP for ${targetDate.toISOString().split("T")[0]}: No scenario found for ${t1DateStr}`);
      }
    }
    console.log("t-1 Energy data points:", Object.keys(energyT1Map).length);
    console.log("t-1 Congestion data points:", Object.keys(congestionT1Map).length);
    console.log("t-1 Losses data points:", Object.keys(lossesT1Map).length);
    console.log("t-1 LMP data points:", Object.keys(lmpT1Map).length);
    const lmpData = lmpForecastResults.map((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      const rtLMPValue = rtLMPMap[datetimeKey] || 0;
      return {
        datetime: datetimeKey,
        energy: row.energy || 0,
        congestion: row.congestion || 0,
        losses: row.losses || 0,
        lmp: row.lmp || 0,
        energyT1: energyT1Map[datetimeKey] || 0,
        // t-1 Energy forecast
        congestionT1: congestionT1Map[datetimeKey] || 0,
        // t-1 Congestion forecast
        lossesT1: lossesT1Map[datetimeKey] || 0,
        // t-1 Losses forecast
        lmpT1: lmpT1Map[datetimeKey] || 0,
        // t-1 Total LMP forecast
        // DA LMP components from yes_fundamentals (already hour beginning)
        daLMP: daLMPMap[datetimeKey] || 0,
        daCongestion: daCongestionMap[datetimeKey] || 0,
        daEnergy: daEnergyMap[datetimeKey] || 0,
        daLoss: daLossMap[datetimeKey] || 0,
        // TODO: Replace with actual historical energy and congestion data
        actualEnergy: 0,
        // Placeholder
        actualCongestion: 0,
        // Placeholder
        // RT LMP from yes_fundamentals (already hour beginning)
        rtLMP: rtLMPValue
      };
    });
    console.log("Processed LMP last week data points:", lmpData.length);
    if (lmpData.length > 0) {
      console.log("First LMP last week point:", lmpData[0]);
      console.log("Last LMP last week point:", lmpData[lmpData.length - 1]);
      const withRTLMP = lmpData.filter((d) => d.rtLMP !== 0);
      console.log("Data points with RT LMP (non-zero):", withRTLMP.length);
      if (withRTLMP.length > 0) {
        console.log("Sample RT LMP data:", withRTLMP[0]);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data: lmpData,
      metadata: {
        scenario: lastWeekScenario,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          durationDays: 7
        },
        dataPoints: {
          combined: lmpData.length
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("LMP last week forecast error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch LMP last week forecast data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
