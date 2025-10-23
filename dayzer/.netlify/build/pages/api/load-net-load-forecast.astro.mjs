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
        console.log("Third database connection created successfully");
      } catch (error) {
        console.error("Failed to create third database connection:", error);
        console.log("Continuing without CAISO Load 7D data");
        thirdPool = null;
      }
    } else {
      console.log("DATABASE_URL_THIRD not configured, skipping CAISO Load 7D data");
      thirdPool = null;
    }
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let latestScenario;
    if (requestedScenarioId) {
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("Load Forecast - Using requested scenario:", latestScenario);
    } else {
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: "desc" },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("Load Forecast - Using latest scenario:", latestScenario);
    }
    if (!latestScenario) {
      return new Response(
        JSON.stringify({ error: "No scenarios found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Using latest scenario:", latestScenario);
    const zoneDataCount = await prisma.zone_demand.count({
      where: {
        scenarioid: latestScenario.scenarioid
      }
    });
    console.log("Zone demand data count for scenario:", zoneDataCount);
    let dayzerDateRange;
    let useResultsUnits = false;
    if (zoneDataCount === 0) {
      console.log("No zone_demand data, checking results_units...");
      dayzerDateRange = await prisma.results_units.aggregate({
        where: {
          scenarioid: latestScenario.scenarioid
        },
        _min: { Date: true },
        _max: { Date: true }
      });
      useResultsUnits = true;
    } else {
      dayzerDateRange = await prisma.zone_demand.aggregate({
        where: {
          scenarioid: latestScenario.scenarioid
        },
        _min: { Date: true },
        _max: { Date: true }
      });
    }
    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({
          error: "No Dayzer forecast data found for this scenario",
          details: `Scenario ${latestScenario.scenarioid} has no data in zone_demand or results_units tables`
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    console.log("7-day forecast range:", startDate.toISOString(), "to", endDate.toISOString());
    console.log("Forecast duration: 7 days");
    const dayzerLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
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
    console.log("Dayzer load data points:", dayzerLoadResults.length);
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
        scenarioid: latestScenario.scenarioid,
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
    console.log("Dayzer renewable data points:", dayzerRenewableResults.length);
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
    console.log("CAISO load data points:", caisoLoadQuery.rows.length);
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
    console.log("CAISO net load data points:", caisoNetLoadQuery.rows.length);
    const caisoNetLoadMap = {};
    caisoNetLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      const datetimeKey = datetime.toISOString();
      caisoNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
    });
    const caisoLoad7DMap = {};
    let caisoLoad7DQuery = { rows: [] };
    if (thirdPool) {
      try {
        caisoLoad7DQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "CAISO_LOAD_FORECAST_7DAY"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        console.log("CAISO Load 7D data points:", caisoLoad7DQuery.rows.length);
        caisoLoad7DQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          const value = parseFloat(row.CAISO_LOAD_FORECAST_7DAY) || 0;
          caisoLoad7DMap[datetimeKey] = value;
        });
      } catch (queryError) {
        console.error("Failed to query CAISO Load 7D data:", queryError);
        console.log("Continuing without CAISO Load 7D data");
      }
    } else {
      console.log("Third database not available, skipping CAISO Load 7D query");
    }
    const allDatetimes = /* @__PURE__ */ new Set([
      ...Object.keys(dayzerLoadMap),
      ...Object.keys(caisoLoadMap),
      ...Object.keys(caisoNetLoadMap)
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
        caisoLoad: caisoLoadMap[datetime] || null,
        // Keep in MW
        caisoNetLoad: caisoNetLoadMap[datetime] || null,
        // Keep in MW
        caisoLoad7D: caisoLoad7DMap[datetime] || null
        // Keep in MW
      };
    }).filter(
      (point) => point.dayzerLoad !== null || point.dayzerNetLoad !== null || point.caisoLoad !== null || point.caisoNetLoad !== null || point.caisoLoad7D !== null
    );
    console.log("Combined forecast data points:", forecastData.length);
    if (forecastData.length > 0) {
      console.log("First point:", forecastData[0]);
      console.log("Last point:", forecastData[forecastData.length - 1]);
      const pointsWithCaiso7D = forecastData.filter((p) => p.caisoLoad7D !== null && p.caisoLoad7D !== void 0);
      console.log("Points with CAISO Load 7D data:", pointsWithCaiso7D.length);
      if (pointsWithCaiso7D.length > 0) {
        console.log("Sample CAISO Load 7D point:", pointsWithCaiso7D[0]);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data: forecastData,
      metadata: {
        scenario: latestScenario,
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
          caisoLoad7D: caisoLoad7DQuery.rows.length,
          combined: forecastData.length
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Load/Net Load forecast error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch load/net load forecast data",
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
