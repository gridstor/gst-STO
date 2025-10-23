import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  let thirdPool = null;
  try {
    if (process.env.DATABASE_URL_THIRD) {
      try {
        thirdPool = new Pool({
          connectionString: process.env.DATABASE_URL_THIRD,
          ssl: { rejectUnauthorized: false }
        });
        console.log("Third database connection created successfully for weather last week");
      } catch (error) {
        console.error("Failed to create third database connection:", error);
        thirdPool = null;
      }
    } else {
      console.log("DATABASE_URL_THIRD not configured, skipping weather last week data");
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
      console.log("Weather Last Week - Using requested scenario for date range:", lastWeekScenario);
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
      console.log("Weather Last Week - Using latest scenario:", latestScenario.scenarioid, "and last week scenario:", lastWeekScenario?.scenarioid);
    }
    if (!lastWeekScenario) {
      const errorMessage = requestedScenarioId ? `Requested scenario ${requestedScenarioId} not found` : `Last week scenario not found`;
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Using weather last week scenario for date range:", lastWeekScenario.scenarioid);
    const dayzerDateRange = await prisma.results_units.aggregate({
      where: {
        scenarioid: lastWeekScenario.scenarioid
      },
      _min: { Date: true },
      _max: { Date: true }
    });
    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: "No date range found for last week scenario" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    console.log("Weather last week query dates:", startDate.toISOString(), "to", endDate.toISOString());
    const weatherData = [];
    if (thirdPool) {
      try {
        const tempForecastQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_FORECAST_SB"
          FROM "ERCOT"."Goleta_Weather_Forecast" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        const tempActualQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        const tempNormalQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "TEMP_NORM_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        const hddQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "HDD_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        const cddQuery = await thirdPool.query(`
          SELECT "DATETIME_HE", "CDD_SB"
          FROM "ERCOT"."Goleta_YES_Pulls" 
          WHERE "DATETIME_HE" >= $1 
            AND "DATETIME_HE" <= $2
          ORDER BY "DATETIME_HE" ASC
        `, [startDate.toISOString(), endDate.toISOString()]);
        console.log("Temperature forecast data points:", tempForecastQuery.rows.length);
        console.log("Temperature actual data points:", tempActualQuery.rows.length);
        console.log("Temperature normal data points:", tempNormalQuery.rows.length);
        console.log("HDD data points:", hddQuery.rows.length);
        console.log("CDD data points:", cddQuery.rows.length);
        const tempForecastMap = {};
        const tempActualMap = {};
        const tempNormalMap = {};
        const hddMap = {};
        const cddMap = {};
        tempForecastQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          tempForecastMap[datetimeKey] = parseFloat(row.TEMP_FORECAST_SB) || 0;
        });
        tempActualQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          tempActualMap[datetimeKey] = parseFloat(row.TEMP_SB) || 0;
        });
        tempNormalQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          tempNormalMap[datetimeKey] = parseFloat(row.TEMP_NORM_SB) || 0;
        });
        hddQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          hddMap[datetimeKey] = parseFloat(row.HDD_SB) || 0;
        });
        cddQuery.rows.forEach((row) => {
          const datetime = new Date(row.DATETIME_HE);
          datetime.setHours(datetime.getHours() - 1);
          const datetimeKey = datetime.toISOString();
          cddMap[datetimeKey] = parseFloat(row.CDD_SB) || 0;
        });
        const allDatetimes = /* @__PURE__ */ new Set([
          ...Object.keys(tempForecastMap),
          ...Object.keys(tempActualMap),
          ...Object.keys(tempNormalMap),
          ...Object.keys(hddMap),
          ...Object.keys(cddMap)
        ]);
        Array.from(allDatetimes).sort().forEach((datetime) => {
          weatherData.push({
            datetime,
            temperatureForecast: tempForecastMap[datetime] || 0,
            temperatureActual: tempActualMap[datetime] || 0,
            temperatureNormal: tempNormalMap[datetime] || 0,
            hdd: hddMap[datetime] || 0,
            cdd: cddMap[datetime] || 0
          });
        });
      } catch (queryError) {
        console.error("Failed to query weather last week data:", queryError);
        console.log("Continuing without weather last week data");
      }
    } else {
      console.log("Third database not available, skipping weather last week query");
    }
    weatherData.sort((a, b) => a.datetime.localeCompare(b.datetime));
    console.log("Last week combined weather data points:", weatherData.length);
    if (weatherData.length > 0) {
      console.log("Last week first weather point:", weatherData[0]);
      console.log("Last week last weather point:", weatherData[weatherData.length - 1]);
    }
    return new Response(JSON.stringify({
      success: true,
      data: weatherData,
      metadata: {
        scenario: lastWeekScenario,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          durationDays: 7
        },
        dataPoints: {
          combined: weatherData.length
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Weather last week forecast error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather last week forecast data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
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
