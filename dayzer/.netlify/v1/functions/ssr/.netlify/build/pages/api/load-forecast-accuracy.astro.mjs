import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
const POST = async ({ request }) => {
  let secondaryPool = null;
  try {
    const { selectedHours } = await request.json();
    if (!selectedHours || selectedHours.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hours selected for analysis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    const url = new URL(request.url);
    const requestedScenarioId = url.searchParams.get("scenarioId");
    let lastWeekScenario;
    if (requestedScenarioId) {
      lastWeekScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: { scenarioid: parseInt(requestedScenarioId) },
        select: { scenarioid: true, scenarioname: true }
      });
      console.log("Load Forecast Accuracy - Using requested scenario:", lastWeekScenario);
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
      console.log("Load Forecast Accuracy - Using latest-7 scenario:", lastWeekScenario);
    }
    if (!lastWeekScenario) {
      const errorMsg = requestedScenarioId ? `Requested scenario ${requestedScenarioId} not found` : `Last week scenario (latest - 7) not found`;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Using last week scenario for accuracy analysis:", lastWeekScenario.scenarioid);
    const dayzerDateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid: lastWeekScenario.scenarioid },
      _min: { Date: true },
      _max: { Date: true }
    });
    if (!dayzerDateRange._min.Date || !dayzerDateRange._max.Date) {
      return new Response(
        JSON.stringify({ error: "No data found for scenario 43" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const endDate = new Date(dayzerDateRange._max.Date);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    console.log("Accuracy analysis date range:", startDate.toISOString(), "to", endDate.toISOString());
    console.log("Selected hours for analysis:", selectedHours);
    const dayzerLoadResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours }
      },
      select: { Date: true, Hour: true, demandmw: true }
    });
    console.log("Dayzer load results found:", dayzerLoadResults.length);
    if (dayzerLoadResults.length > 0) {
      console.log("First Dayzer result:", dayzerLoadResults[0]);
      console.log("Last Dayzer result:", dayzerLoadResults[dayzerLoadResults.length - 1]);
    }
    const dayzerLoadMap = {};
    dayzerLoadResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerLoadMap[key] = (dayzerLoadMap[key] || 0) + (row.demandmw || 0);
    });
    console.log("Dayzer load map keys (first 5):", Object.keys(dayzerLoadMap).slice(0, 5));
    console.log("Dayzer load map keys (last 5):", Object.keys(dayzerLoadMap).slice(-5));
    const dayzerRenewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid: lastWeekScenario.scenarioid,
        Date: { gte: startDate, lte: endDate },
        Hour: { in: selectedHours },
        fuelname: { in: ["Sun", "sun", "Wind", "wind"] }
      },
      select: { Date: true, Hour: true, generationmw: true }
    });
    const dayzerRenewableMap = {};
    dayzerRenewableResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour - 1, 0, 0, 0);
      const key = datetime.toISOString();
      dayzerRenewableMap[key] = (dayzerRenewableMap[key] || 0) + (row.generationmw || 0);
    });
    const caisoLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'DA_LOAD_FORECAST'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map((h) => h - 1)]);
    const caisoLoadMap = {};
    caisoLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      caisoLoadMap[datetime.toISOString()] = parseFloat(row.value) || 0;
    });
    const caisoNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'DA_NET_LOAD_FORECAST'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map((h) => h - 1)]);
    const caisoNetLoadMap = {};
    caisoNetLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      caisoNetLoadMap[datetime.toISOString()] = parseFloat(row.value) || 0;
    });
    const rtLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'RTLOAD'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map((h) => h - 1)]);
    const rtLoadMap = {};
    rtLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      if (!rtLoadMap[key]) {
        rtLoadMap[key] = { sum: 0, count: 0 };
      }
      rtLoadMap[key].sum += parseFloat(row.value) || 0;
      rtLoadMap[key].count += 1;
    });
    const rtNetLoadQuery = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = 'CAISO' 
        AND attribute = 'NET_RTLOAD'
        AND local_datetime_ib >= $1 
        AND local_datetime_ib <= $2
        AND EXTRACT(hour FROM local_datetime_ib) = ANY($3)
      ORDER BY local_datetime_ib ASC
    `, [startDate.toISOString(), endDate.toISOString(), selectedHours.map((h) => h - 1)]);
    const rtNetLoadMap = {};
    rtNetLoadQuery.rows.forEach((row) => {
      const datetime = new Date(row.local_datetime_ib);
      datetime.setMinutes(0, 0, 0);
      const key = datetime.toISOString();
      if (!rtNetLoadMap[key]) {
        rtNetLoadMap[key] = { sum: 0, count: 0 };
      }
      rtNetLoadMap[key].sum += parseFloat(row.value) || 0;
      rtNetLoadMap[key].count += 1;
    });
    const calculateErrorMetrics = (forecasts, actuals) => {
      const errors = [];
      const actualValues = [];
      Object.keys(forecasts).forEach((datetime) => {
        const forecast = forecasts[datetime];
        const actualData = actuals[datetime];
        if (actualData && actualData.count > 0) {
          const actual = actualData.sum / actualData.count;
          const error = forecast - actual;
          errors.push(error);
          actualValues.push(actual);
        }
      });
      if (errors.length === 0) {
        return { mae: 0, rmse: 0, mape: 0, bias: 0, dataPoints: 0 };
      }
      const mae = errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((sum, err) => sum + err * err, 0) / errors.length);
      const bias = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      let mapeSum = 0;
      let mapeCount = 0;
      for (let i = 0; i < errors.length; i++) {
        if (actualValues[i] !== 0) {
          mapeSum += Math.abs(errors[i]) / Math.abs(actualValues[i]);
          mapeCount++;
        }
      }
      const mape = mapeCount > 0 ? mapeSum / mapeCount * 100 : 0;
      return { mae, rmse, mape, bias, dataPoints: errors.length };
    };
    const dayzerLoadErrors = calculateErrorMetrics(dayzerLoadMap, rtLoadMap);
    const dayzerNetLoadMap = {};
    Object.keys(dayzerLoadMap).forEach((key) => {
      const load = dayzerLoadMap[key];
      const renewable = dayzerRenewableMap[key] || 0;
      dayzerNetLoadMap[key] = load - renewable;
    });
    const dayzerNetLoadErrors = calculateErrorMetrics(dayzerNetLoadMap, rtNetLoadMap);
    const caisoLoadErrors = calculateErrorMetrics(caisoLoadMap, rtLoadMap);
    const caisoNetLoadErrors = calculateErrorMetrics(caisoNetLoadMap, rtNetLoadMap);
    const timeSeriesErrors = Object.keys(dayzerLoadMap).map((datetime) => ({
      datetime,
      dayzerLoadError: rtLoadMap[datetime] ? Math.abs(dayzerLoadMap[datetime] - rtLoadMap[datetime].sum / rtLoadMap[datetime].count) : null,
      dayzerNetLoadError: rtNetLoadMap[datetime] ? Math.abs(dayzerNetLoadMap[datetime] - rtNetLoadMap[datetime].sum / rtNetLoadMap[datetime].count) : null,
      caisoLoadError: rtLoadMap[datetime] && caisoLoadMap[datetime] ? Math.abs(caisoLoadMap[datetime] - rtLoadMap[datetime].sum / rtLoadMap[datetime].count) : null,
      caisoNetLoadError: rtNetLoadMap[datetime] && caisoNetLoadMap[datetime] ? Math.abs(caisoNetLoadMap[datetime] - rtNetLoadMap[datetime].sum / rtNetLoadMap[datetime].count) : null
    })).sort((a, b) => a.datetime.localeCompare(b.datetime));
    console.log("Time series errors created:", timeSeriesErrors.length, "data points");
    if (timeSeriesErrors.length > 0) {
      console.log("First error point:", timeSeriesErrors[0]);
      console.log("Last error point:", timeSeriesErrors[timeSeriesErrors.length - 1]);
    }
    return new Response(JSON.stringify({
      success: true,
      data: {
        dayzerLoad: dayzerLoadErrors,
        dayzerNetLoad: dayzerNetLoadErrors,
        caisoLoad: caisoLoadErrors,
        caisoNetLoad: caisoNetLoadErrors,
        timeSeriesErrors
      },
      metadata: {
        selectedHours,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0]
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Forecast accuracy calculation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to calculate forecast accuracy",
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
