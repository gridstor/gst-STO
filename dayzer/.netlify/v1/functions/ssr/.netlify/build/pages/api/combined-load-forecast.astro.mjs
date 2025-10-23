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
  console.log("=== COMBINED LOAD FORECAST API CALLED ===");
  try {
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
    const lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: { scenarioid: lastWeekScenarioId },
      select: { scenarioid: true, scenarioname: true }
    });
    if (!lastWeekScenario) {
      return new Response(
        JSON.stringify({ error: `Scenario ${lastWeekScenarioId} not found for last week comparison` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Combined Load - Latest scenario:", latestScenario);
    console.log("Combined Load - Last week scenario:", lastWeekScenario);
    const lastWeekDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: lastWeekScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true }
    });
    if (!lastWeekDateRange._min.Date || !lastWeekDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: "No last week data found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const lastWeekEndDate = new Date(lastWeekDateRange._max.Date);
    lastWeekEndDate.setHours(23, 59, 59, 999);
    const lastWeekStartDate = new Date(lastWeekEndDate);
    lastWeekStartDate.setDate(lastWeekEndDate.getDate() - 6);
    lastWeekStartDate.setHours(0, 0, 0, 0);
    const forecastDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: latestScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true }
    });
    if (!forecastDateRange._min.Date || !forecastDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: "No forecast data found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const forecastEndDate = new Date(forecastDateRange._max.Date);
    forecastEndDate.setHours(23, 59, 59, 999);
    const forecastStartDate = new Date(forecastEndDate);
    forecastStartDate.setDate(forecastEndDate.getDate() - 6);
    forecastStartDate.setHours(0, 0, 0, 0);
    console.log("Last week date range:", lastWeekStartDate.toISOString(), "to", lastWeekEndDate.toISOString());
    console.log("Forecast date range:", forecastStartDate.toISOString(), "to", forecastEndDate.toISOString());
    console.log("About to fetch Last Week Load Data...");
    let lastWeekLoadResults;
    try {
      lastWeekLoadResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid: lastWeekScenario.scenarioid,
          Date: {
            gte: lastWeekStartDate,
            lte: lastWeekEndDate
          }
        },
        select: { Date: true, Hour: true, demandmw: true },
        orderBy: [{ Date: "asc" }, { Hour: "asc" }]
      });
      console.log("Last Week Load Data fetched:", lastWeekLoadResults.length, "records");
    } catch (error) {
      console.error("Error fetching last week load data:", error);
      throw error;
    }
    const lastWeekRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: {
          gte: lastWeekStartDate,
          lte: lastWeekEndDate
        },
        fuelname: { in: ["Wind", "wind", "Sun", "sun"] }
      },
      select: { Date: true, Hour: true, generationmw: true },
      orderBy: [{ Date: "asc" }, { Hour: "asc" }]
    });
    console.log("Last Week Renewable Data fetched:", lastWeekRenewableResults.length, "records");
    const forecastLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        Date: {
          gte: forecastStartDate,
          lte: forecastEndDate
        }
      },
      select: { Date: true, Hour: true, demandmw: true },
      orderBy: [{ Date: "asc" }, { Hour: "asc" }]
    });
    const forecastRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        Date: {
          gte: forecastStartDate,
          lte: forecastEndDate
        },
        fuelname: { in: ["Wind", "wind", "Sun", "sun"] }
      },
      select: { Date: true, Hour: true, generationmw: true },
      orderBy: [{ Date: "asc" }, { Hour: "asc" }]
    });
    console.log("Data counts:");
    console.log("- Last week load results:", lastWeekLoadResults.length);
    console.log("- Last week renewable results:", lastWeekRenewableResults.length);
    console.log("- Forecast load results:", forecastLoadResults.length);
    console.log("- Forecast renewable results:", forecastRenewableResults.length);
    const secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    let caisoLastWeekLoadMap = {};
    let caisoLastWeekNetLoadMap = {};
    let caisoForecastLoadMap = {};
    let caisoForecastNetLoadMap = {};
    let rtLastWeekLoadMap = {};
    let rtLastWeekNetLoadMap = {};
    try {
      const caisoLastWeekLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "DA_LOAD_FORECAST", lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);
      caisoLastWeekLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoLastWeekLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      const caisoLastWeekNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "DA_NET_LOAD_FORECAST", lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);
      caisoLastWeekNetLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoLastWeekNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      const caisoForecastLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "DA_LOAD_FORECAST", forecastStartDate.toISOString(), forecastEndDate.toISOString()]);
      caisoForecastLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoForecastLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      const caisoForecastNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "DA_NET_LOAD_FORECAST", forecastStartDate.toISOString(), forecastEndDate.toISOString()]);
      caisoForecastNetLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        const datetimeKey = datetime.toISOString();
        caisoForecastNetLoadMap[datetimeKey] = parseFloat(row.value) || 0;
      });
      const rtLastWeekLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "RTLOAD", lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);
      const rtLoadTemp = {};
      rtLastWeekLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        datetime.setMinutes(0, 0, 0);
        const key = datetime.toISOString();
        if (!rtLoadTemp[key]) {
          rtLoadTemp[key] = { sum: 0, count: 0 };
        }
        rtLoadTemp[key].sum += parseFloat(row.value) || 0;
        rtLoadTemp[key].count += 1;
      });
      Object.keys(rtLoadTemp).forEach((key) => {
        rtLastWeekLoadMap[key] = rtLoadTemp[key].sum / rtLoadTemp[key].count;
      });
      const rtLastWeekNetLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, "value" 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "NET_RTLOAD", lastWeekStartDate.toISOString(), lastWeekEndDate.toISOString()]);
      const rtNetLoadTemp = {};
      rtLastWeekNetLoadQuery.rows.forEach((row) => {
        const datetime = new Date(row.local_datetime_ib);
        datetime.setMinutes(0, 0, 0);
        const key = datetime.toISOString();
        if (!rtNetLoadTemp[key]) {
          rtNetLoadTemp[key] = { sum: 0, count: 0 };
        }
        rtNetLoadTemp[key].sum += parseFloat(row.value) || 0;
        rtNetLoadTemp[key].count += 1;
      });
      Object.keys(rtNetLoadTemp).forEach((key) => {
        rtLastWeekNetLoadMap[key] = rtNetLoadTemp[key].sum / rtNetLoadTemp[key].count;
      });
    } catch (poolError) {
      console.error("Error fetching CAISO/RT data:", poolError);
    } finally {
      await secondaryPool.end();
    }
    const lastWeekLoadMap = {};
    lastWeekLoadResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!lastWeekLoadMap[datetimeKey]) {
        lastWeekLoadMap[datetimeKey] = 0;
      }
      lastWeekLoadMap[datetimeKey] += row.demandmw || 0;
    });
    const lastWeekRenewableMap = {};
    lastWeekRenewableResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!lastWeekRenewableMap[datetimeKey]) {
        lastWeekRenewableMap[datetimeKey] = 0;
      }
      lastWeekRenewableMap[datetimeKey] += row.generationmw || 0;
    });
    const forecastLoadMap = {};
    forecastLoadResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!forecastLoadMap[datetimeKey]) {
        forecastLoadMap[datetimeKey] = 0;
      }
      forecastLoadMap[datetimeKey] += row.demandmw || 0;
    });
    const forecastRenewableMap = {};
    forecastRenewableResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!forecastRenewableMap[datetimeKey]) {
        forecastRenewableMap[datetimeKey] = 0;
      }
      forecastRenewableMap[datetimeKey] += row.generationmw || 0;
    });
    const allDatetimes = /* @__PURE__ */ new Set();
    Object.keys(lastWeekLoadMap).forEach((dt) => allDatetimes.add(dt));
    Object.keys(forecastLoadMap).forEach((dt) => allDatetimes.add(dt));
    const sortedDatetimes = Array.from(allDatetimes).sort();
    const combinedData = sortedDatetimes.map((datetime) => {
      const isLastWeek = datetime >= lastWeekStartDate.toISOString() && datetime <= lastWeekEndDate.toISOString();
      return {
        datetime,
        isLastWeek,
        // Last Week data (only populated for last week dates)
        dayzerLoadLastWeek: isLastWeek ? lastWeekLoadMap[datetime] : void 0,
        dayzerNetLoadLastWeek: isLastWeek ? (lastWeekLoadMap[datetime] || 0) - (lastWeekRenewableMap[datetime] || 0) : void 0,
        caisoLoadLastWeek: isLastWeek ? caisoLastWeekLoadMap[datetime] : void 0,
        caisoNetLoadLastWeek: isLastWeek ? caisoLastWeekNetLoadMap[datetime] : void 0,
        rtLoadLastWeek: isLastWeek ? rtLastWeekLoadMap[datetime] : void 0,
        rtNetLoadLastWeek: isLastWeek ? rtLastWeekNetLoadMap[datetime] : void 0,
        // Forecast data (only populated for forecast dates)
        dayzerLoadForecast: !isLastWeek ? forecastLoadMap[datetime] : void 0,
        dayzerNetLoadForecast: !isLastWeek ? (forecastLoadMap[datetime] || 0) - (forecastRenewableMap[datetime] || 0) : void 0,
        caisoLoadForecast: !isLastWeek ? caisoForecastLoadMap[datetime] : void 0,
        caisoNetLoadForecast: !isLastWeek ? caisoForecastNetLoadMap[datetime] : void 0
      };
    });
    console.log("Combined data points:", combinedData.length);
    console.log("Last week data points:", combinedData.filter((d) => d.isLastWeek).length);
    console.log("Forecast data points:", combinedData.filter((d) => !d.isLastWeek).length);
    if (combinedData.length > 0) {
      const sampleLastWeek = combinedData.find((d) => d.isLastWeek);
      const sampleForecast = combinedData.find((d) => !d.isLastWeek);
      if (sampleLastWeek) {
        console.log("Sample Last Week data:", {
          datetime: sampleLastWeek.datetime,
          load: sampleLastWeek.dayzerLoadLastWeek,
          renewable: lastWeekRenewableMap[sampleLastWeek.datetime],
          netLoad: sampleLastWeek.dayzerNetLoadLastWeek
        });
      }
      if (sampleForecast) {
        console.log("Sample Forecast data:", {
          datetime: sampleForecast.datetime,
          load: sampleForecast.dayzerLoadForecast,
          renewable: forecastRenewableMap[sampleForecast.datetime],
          netLoad: sampleForecast.dayzerNetLoadForecast
        });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      data: combinedData,
      metadata: {
        lastWeekScenario,
        forecastScenario: latestScenario,
        lastWeekDateRange: {
          start: lastWeekStartDate.toISOString().split("T")[0],
          end: lastWeekEndDate.toISOString().split("T")[0]
        },
        forecastDateRange: {
          start: forecastStartDate.toISOString().split("T")[0],
          end: forecastEndDate.toISOString().split("T")[0]
        },
        dataPoints: {
          lastWeek: combinedData.filter((d) => d.isLastWeek).length,
          forecast: combinedData.filter((d) => !d.isLastWeek).length,
          combined: combinedData.length
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Combined load forecast error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch combined load forecast data",
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
