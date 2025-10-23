import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  let secondaryPool = null;
  let thirdPool = null;
  try {
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    if (process.env.DATABASE_URL_THIRD) {
      try {
        thirdPool = new Pool({
          connectionString: process.env.DATABASE_URL_THIRD,
          ssl: { rejectUnauthorized: false }
        });
      } catch (error) {
        console.error("Failed to create third database connection:", error);
        thirdPool = null;
      }
    } else {
      thirdPool = null;
    }
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let lastWeekScenario;
    if (requestedScenarioId) {
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("Load Last Week - Using requested scenario:", lastWeekScenario);
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
      const lastWeekScenarioId2 = latestScenario.scenarioid - 7;
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioid: lastWeekScenarioId2
        },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("Load Last Week - Using latest-7 scenario:", lastWeekScenario);
    }
    if (!lastWeekScenario) {
      return new Response(
        JSON.stringify({ error: `Last week scenario ${lastWeekScenarioId} (latest - 7) not found` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Using last week scenario:", lastWeekScenario.scenarioid);
    const zoneDataCount = await prisma.zone_demand.count({
      where: {
        scenarioid: lastWeekScenario.scenarioid
      }
    });
    console.log("Zone demand data count for last week scenario:", zoneDataCount);
    let dayzerDateRange;
    let useResultsUnits = false;
    if (zoneDataCount === 0) {
      console.log("No zone_demand data, checking results_units...");
      dayzerDateRange = await prisma.results_units.aggregate({
        where: {
          scenarioid: lastWeekScenario.scenarioid
        },
        _min: { Date: true },
        _max: { Date: true }
      });
      useResultsUnits = true;
    } else {
      dayzerDateRange = await prisma.zone_demand.aggregate({
        where: {
          scenarioid: lastWeekScenario.scenarioid
        },
        _min: { Date: true },
        _max: { Date: true }
      });
    }
    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({
          error: "No Dayzer last week forecast data found for this scenario",
          details: `Scenario ${lastWeekScenario.scenarioid} has no data in zone_demand or results_units tables`
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    console.log("Last week 7-day forecast range:", startDate.toISOString(), "to", endDate.toISOString());
    console.log("Last week forecast duration: 7 days");
    const dayzerLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        Date: true,
        Hour: true,
        demandmw: true
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ]
    });
    console.log("Last week Dayzer load data points:", dayzerLoadResults.length);
    const dayzerLoadMap = {};
    dayzerLoadResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!dayzerLoadMap[datetimeKey]) {
        dayzerLoadMap[datetimeKey] = 0;
      }
      dayzerLoadMap[datetimeKey] += row.demandmw || 0;
    });
    const dayzerRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: startDate,
          lte: endDate
        },
        fuelname: {
          in: ["Sun", "sun", "Wind", "wind"]
        }
      },
      select: {
        Date: true,
        Hour: true,
        generationmw: true
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ]
    });
    console.log("Last week Dayzer renewable data points:", dayzerRenewableResults.length);
    const dayzerRenewableMap = {};
    dayzerRenewableResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!dayzerRenewableMap[datetimeKey]) {
        dayzerRenewableMap[datetimeKey] = 0;
      }
      dayzerRenewableMap[datetimeKey] += row.generationmw || 0;
    });
    const caisoLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ["CAISO", "DA_LOAD_FORECAST", startDate.toISOString(), endDate.toISOString()]);
    console.log("Last week CAISO load data points:", caisoLoadQuery.rows.length);
    const caisoLoadMap = {};
    caisoLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      const datetimeKey = datetime.toISOString();
      caisoLoadMap[datetimeKey] = parseFloat(row.value) || 0;
    });
    const caisoNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ["CAISO", "DA_NET_LOAD_FORECAST", startDate.toISOString(), endDate.toISOString()]);
    console.log("Last week CAISO net load data points:", caisoNetLoadQuery.rows.length);
    const caisoNetLoadMap = {};
    caisoNetLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      const datetimeKey = datetime.toISOString();
      caisoNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
    });
    const caisoLoad7DMap = {};
    if (thirdPool) {
      try {
        const caisoLoad7DQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "CAISO_LOAD_FORECAST_7DAY"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        console.log("Last week CAISO Load 7D data points:", caisoLoad7DQuery.rows.length);
        caisoLoad7DQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          const value = parseFloat(row.CAISO_LOAD_FORECAST_7DAY) || 0;
          caisoLoad7DMap[datetimeKey] = value;
        });
      } catch (queryError) {
        console.error("Failed to query last week CAISO Load 7D data:", queryError);
        console.log("Continuing without last week CAISO Load 7D data");
      }
    } else {
      console.log("Third database not available, skipping last week CAISO Load 7D query");
    }
    console.log("RT actuals using same date range as forecasts:", startDate.toISOString(), "to", endDate.toISOString());
    const rtLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ["CAISO", "RTLOAD", startDate.toISOString(), endDate.toISOString()]);
    console.log("Last week RT Load actuals data points:", rtLoadQuery.rows.length);
    const rtLoadMap = {};
    rtLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!rtLoadMap[datetimeKey]) {
        rtLoadMap[datetimeKey] = 0;
      }
      rtLoadMap[datetimeKey] += parseFloat(row.value) || 0;
    });
    Object.keys(rtLoadMap).forEach((key) => {
      rtLoadMap[key] = rtLoadMap[key] / 12;
    });
    const rtNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ["CAISO", "NET_RTLOAD", startDate.toISOString(), endDate.toISOString()]);
    console.log("Last week RT Net Load actuals data points:", rtNetLoadQuery.rows.length);
    const rtNetLoadMap = {};
    rtNetLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!rtNetLoadMap[datetimeKey]) {
        rtNetLoadMap[datetimeKey] = 0;
      }
      rtNetLoadMap[datetimeKey] += parseFloat(row.value) || 0;
    });
    Object.keys(rtNetLoadMap).forEach((key) => {
      rtNetLoadMap[key] = rtNetLoadMap[key] / 12;
    });
    console.log("Fetching t-1 forecast data...");
    const dayzerLoadT1Map = {};
    const dayzerNetLoadT1Map = {};
    const lastWeekDates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      lastWeekDates.push(new Date(d));
    }
    console.log("Last week dates for t-1 analysis:", lastWeekDates.map((d) => d.toISOString().split("T")[0]));
    for (const targetDate of lastWeekDates) {
      const t1Date = new Date(targetDate);
      t1Date.setDate(targetDate.getDate() - 1);
      const t1DateStr = t1Date.toISOString().split("T")[0];
      const allScenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
        select: { scenarioid: true, scenarioname: true, simulation_date: true },
        orderBy: { scenarioid: "desc" }
      });
      const t1Scenario = allScenarios.find((s) => {
        if (!s.simulation_date) return false;
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
        console.log(`t-1 for ${targetDate.toISOString().split("T")[0]}: Using scenario ${t1Scenario.scenarioid} (${t1DateStr})`);
        const t1LoadData = await prisma.zone_demand.findMany({
          where: {
            scenarioid: t1Scenario.scenarioid,
            Date: targetDate
          },
          select: { Hour: true, demandmw: true }
        });
        const t1RenewableData = await prisma.results_units.findMany({
          where: {
            scenarioid: t1Scenario.scenarioid,
            Date: targetDate,
            fuelname: { in: ["Wind", "wind", "Sun", "sun"] }
          },
          select: { Hour: true, generationmw: true }
        });
        t1LoadData.forEach((row) => {
          const datetime = new Date(targetDate);
          datetime.setHours(row.Hour - 1, 0, 0, 0);
          const datetimeKey = datetime.toISOString();
          if (!dayzerLoadT1Map[datetimeKey]) {
            dayzerLoadT1Map[datetimeKey] = 0;
          }
          dayzerLoadT1Map[datetimeKey] += row.demandmw || 0;
        });
        const t1RenewableMap = {};
        t1RenewableData.forEach((row) => {
          const datetime = new Date(targetDate);
          datetime.setHours(row.Hour - 1, 0, 0, 0);
          const datetimeKey = datetime.toISOString();
          if (!t1RenewableMap[datetimeKey]) {
            t1RenewableMap[datetimeKey] = 0;
          }
          t1RenewableMap[datetimeKey] += row.generationmw || 0;
        });
        Object.keys(dayzerLoadT1Map).forEach((datetimeKey) => {
          if (datetimeKey.startsWith(targetDate.toISOString().split("T")[0])) {
            const load = dayzerLoadT1Map[datetimeKey];
            const renewable = t1RenewableMap[datetimeKey] || 0;
            dayzerNetLoadT1Map[datetimeKey] = load - renewable;
          }
        });
      } else {
        console.log(`No t-1 scenario found for ${targetDate.toISOString().split("T")[0]} (looking for ${t1DateStr})`);
      }
    }
    console.log("t-1 Load data points:", Object.keys(dayzerLoadT1Map).length);
    console.log("t-1 Net Load data points:", Object.keys(dayzerNetLoadT1Map).length);
    if (Object.keys(dayzerLoadT1Map).length > 0) {
      console.log("Sample t-1 Load data:", Object.entries(dayzerLoadT1Map).slice(0, 3));
    }
    if (Object.keys(dayzerNetLoadT1Map).length > 0) {
      console.log("Sample t-1 Net Load data:", Object.entries(dayzerNetLoadT1Map).slice(0, 3));
    }
    const allDatetimes = /* @__PURE__ */ new Set([
      ...Object.keys(dayzerLoadMap),
      ...Object.keys(caisoLoadMap),
      ...Object.keys(caisoNetLoadMap),
      ...Object.keys(rtLoadMap),
      ...Object.keys(rtNetLoadMap)
    ]);
    const forecastData = Array.from(allDatetimes).sort().map((datetime) => {
      const dayzerLoad = dayzerLoadMap[datetime] || null;
      const dayzerRenewable = dayzerRenewableMap[datetime] || 0;
      const dayzerNetLoad = dayzerLoad !== null ? dayzerLoad - dayzerRenewable : null;
      return {
        datetime,
        dayzerLoad,
        // Keep in MW
        dayzerNetLoad,
        // Keep in MW
        dayzerLoadT1: dayzerLoadT1Map[datetime] || null,
        // t-1 Load forecast in MW
        dayzerNetLoadT1: dayzerNetLoadT1Map[datetime] || null,
        // t-1 Net Load forecast in MW
        caisoLoad: caisoLoadMap[datetime] || null,
        // Keep in MW
        caisoNetLoad: caisoNetLoadMap[datetime] || null,
        // Keep in MW
        caisoLoad7D: caisoLoad7DMap[datetime] || null,
        // CAISO Load 7D in MW
        rtLoad: rtLoadMap[datetime] || null,
        // RT Load actuals in MW
        rtNetLoad: rtNetLoadMap[datetime] || null
        // RT Net Load actuals in MW
      };
    }).filter(
      (point) => point.dayzerLoad !== null || point.dayzerNetLoad !== null || point.caisoLoad !== null || point.caisoNetLoad !== null || point.caisoLoad7D !== null || point.rtLoad !== null || point.rtNetLoad !== null
    );
    console.log("Last week combined forecast data points:", forecastData.length);
    if (forecastData.length > 0) {
      console.log("Last week first point:", forecastData[0]);
      console.log("Last week last point:", forecastData[forecastData.length - 1]);
    }
    return new Response(JSON.stringify({
      success: true,
      data: forecastData,
      metadata: {
        scenario: lastWeekScenario,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          durationDays: 7
        },
        dataPoints: {
          dayzerLoad: Object.keys(dayzerLoadMap).length,
          dayzerRenewable: Object.keys(dayzerRenewableMap).length,
          caisoLoad: caisoLoadQuery.rows.length,
          caisoNetLoad: caisoNetLoadQuery.rows.length,
          rtLoad: rtLoadQuery.rows.length,
          rtNetLoad: rtNetLoadQuery.rows.length,
          combined: forecastData.length
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Load Last Week forecast error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch last week load/net load forecast data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (secondaryPool) {
      await secondaryPool.end();
    }
    if (thirdPool) {
      await thirdPool.end();
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
