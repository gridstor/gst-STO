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
  try {
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get("scenarioid");
    const hoursParam = url.searchParams.get("hours");
    const selectedHours = hoursParam ? hoursParam.split(",").map((h) => parseInt(h.trim(), 10)).filter((h) => h >= 1 && h <= 24) : Array.from({ length: 24 }, (_, i) => i + 1);
    let scenarioid = null;
    if (requestedScenarioid) {
      scenarioid = parseInt(requestedScenarioid, 10);
    } else {
      let latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioname: {
            contains: "CAISO_WEEK"
          }
        },
        orderBy: { scenarioid: "desc" },
        select: { scenarioid: true, simulation_date: true }
      });
      if (!latestScenario) {
        latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: "desc" },
          select: { scenarioid: true, simulation_date: true }
        });
      }
      scenarioid = latestScenario?.scenarioid || null;
    }
    if (!scenarioid) {
      return new Response(
        JSON.stringify({ scenarioid: null, data: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const scenarioInfo = await prisma.info_scenarioid_scenarioname_mapping.findUnique({
      where: { scenarioid },
      select: { simulation_date: true }
    });
    if (!scenarioInfo?.simulation_date) {
      return new Response(
        JSON.stringify({ error: "No simulation date found for scenario" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const simulationDate = new Date(scenarioInfo.simulation_date);
    const thisWeekStart = new Date(simulationDate);
    const thisWeekEnd = new Date(simulationDate);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    const lastWeekStart = new Date(simulationDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(simulationDate);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    const demandResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid,
        Date: {
          gte: thisWeekStart,
          lte: thisWeekEnd
        },
        Hour: {
          in: selectedHours
        }
      },
      select: {
        Date: true,
        Hour: true,
        demandmw: true
      }
    });
    const renewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid,
        OR: [
          { fuelname: "sun" },
          { fuelname: "Sun" },
          { fuelname: "wind" },
          { fuelname: "Wind" }
        ],
        Date: {
          gte: thisWeekStart,
          lte: thisWeekEnd
        },
        Hour: {
          in: selectedHours
        }
      },
      select: {
        Date: true,
        Hour: true,
        fuelname: true,
        generationmw: true
      }
    });
    const demandByDatetime = {};
    demandResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!demandByDatetime[datetimeKey]) {
        demandByDatetime[datetimeKey] = 0;
      }
      demandByDatetime[datetimeKey] += (row.demandmw || 0) / 1e3;
    });
    const renewableByDatetime = {};
    renewableResults.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      if (!renewableByDatetime[datetimeKey]) {
        renewableByDatetime[datetimeKey] = 0;
      }
      renewableByDatetime[datetimeKey] += (row.generationmw || 0) / 1e3;
    });
    const demandHourlyValues = Object.values(demandByDatetime);
    const renewableHourlyValues = Object.values(renewableByDatetime);
    const thisWeekAvgTotalDemand = demandHourlyValues.length > 0 ? demandHourlyValues.reduce((sum, val) => sum + val, 0) / demandHourlyValues.length : 0;
    const thisWeekMaxTotalDemand = demandHourlyValues.length > 0 ? Math.max(...demandHourlyValues) : 0;
    const thisWeekMinTotalDemand = demandHourlyValues.length > 0 ? Math.min(...demandHourlyValues) : 0;
    const thisWeekAvgRenewable = renewableHourlyValues.length > 0 ? renewableHourlyValues.reduce((sum, val) => sum + val, 0) / renewableHourlyValues.length : 0;
    const thisWeekMaxRenewable = renewableHourlyValues.length > 0 ? Math.max(...renewableHourlyValues) : 0;
    const thisWeekMinRenewable = renewableHourlyValues.length > 0 ? Math.min(...renewableHourlyValues) : 0;
    const thisWeekAvgNetLoad = thisWeekAvgTotalDemand - thisWeekAvgRenewable;
    const thisWeekMaxNetLoad = thisWeekMaxTotalDemand - thisWeekMinRenewable;
    const thisWeekMinNetLoad = thisWeekMinTotalDemand - thisWeekMaxRenewable;
    let lastWeekAvgTotalDemand = 0;
    let lastWeekMaxTotalDemand = 0;
    let lastWeekMinTotalDemand = 0;
    let lastWeekAvgNetLoad = 0;
    let lastWeekMaxNetLoad = 0;
    let lastWeekMinNetLoad = 0;
    let lastWeekAvgRenewable = 0;
    let lastWeekMaxRenewable = 0;
    let lastWeekMinRenewable = 0;
    try {
      const demandQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
      `, ["CAISO", "RTLOAD", lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
      const netLoadQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
      `, ["CAISO", "NET_RTLOAD", lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
      const renewableQuery = await secondaryPool.query(`
        SELECT local_datetime_ib, attribute, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute IN ($2, $3)
          AND local_datetime_ib >= $4 
          AND local_datetime_ib <= $5
      `, ["CAISO", "RTGEN_SOLAR", "RTGEN_WIND", lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
      const filterByHours = (rows) => {
        return rows.filter((row) => {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1);
          const hour = datetime.getHours();
          const hourEnding = hour === 0 ? 24 : hour;
          return selectedHours.includes(hourEnding);
        });
      };
      const filteredDemand = filterByHours(demandQuery.rows);
      const filteredNetLoad = filterByHours(netLoadQuery.rows);
      const filteredRenewable = filterByHours(renewableQuery.rows);
      if (filteredDemand.length > 0) {
        const demandValues = filteredDemand.map((row) => Number(row.value) || 0);
        lastWeekAvgTotalDemand = demandValues.reduce((sum, val) => sum + val, 0) / demandValues.length / 1e3;
        lastWeekMaxTotalDemand = Math.max(...demandValues) / 1e3;
        lastWeekMinTotalDemand = Math.min(...demandValues) / 1e3;
      }
      if (filteredNetLoad.length > 0) {
        const netLoadValues = filteredNetLoad.map((row) => Number(row.value) || 0);
        lastWeekAvgNetLoad = netLoadValues.reduce((sum, val) => sum + val, 0) / netLoadValues.length / 1e3;
        lastWeekMaxNetLoad = Math.max(...netLoadValues) / 1e3;
        lastWeekMinNetLoad = Math.min(...netLoadValues) / 1e3;
      }
      if (filteredRenewable.length > 0) {
        const renewableByHour = {};
        filteredRenewable.forEach((row) => {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1);
          const hourKey = datetime.toISOString();
          if (!renewableByHour[hourKey]) {
            renewableByHour[hourKey] = 0;
          }
          renewableByHour[hourKey] += Number(row.value) || 0;
        });
        const hourlyTotals = Object.values(renewableByHour);
        if (hourlyTotals.length > 0) {
          const totalRenewable = hourlyTotals.reduce((sum, hourTotal) => sum + hourTotal, 0);
          lastWeekAvgRenewable = totalRenewable / hourlyTotals.length / 1e3;
          lastWeekMaxRenewable = Math.max(...hourlyTotals) / 1e3;
          lastWeekMinRenewable = Math.min(...hourlyTotals) / 1e3;
        }
      }
    } catch (queryError) {
      console.error("Failed to query secondary database:", queryError);
    }
    const calculateTrend = (thisWeek, lastWeek) => {
      if (lastWeek === 0) return { trend: "flat", magnitude: "small", absoluteChange: 0, percentageChange: 0 };
      const absoluteChange = thisWeek - lastWeek;
      const percentageChange = absoluteChange / lastWeek * 100;
      let trend = "flat";
      let magnitude = "small";
      if (Math.abs(percentageChange) < 0.1) {
        trend = "flat";
        magnitude = "small";
      } else if (percentageChange > 0) {
        trend = "up";
        magnitude = Math.abs(percentageChange) > 15 ? "large" : Math.abs(percentageChange) > 5 ? "medium" : "small";
      } else {
        trend = "down";
        magnitude = Math.abs(percentageChange) > 15 ? "large" : Math.abs(percentageChange) > 5 ? "medium" : "small";
      }
      return { trend, magnitude, absoluteChange, percentageChange };
    };
    const demandTrend = calculateTrend(thisWeekAvgTotalDemand, lastWeekAvgTotalDemand);
    const netLoadTrend = calculateTrend(thisWeekAvgNetLoad, lastWeekAvgNetLoad);
    const renewableTrend = calculateTrend(thisWeekAvgRenewable, lastWeekAvgRenewable);
    const overviewData = [
      {
        component: "Total Demand",
        thisWeekAvg: thisWeekAvgTotalDemand,
        lastWeekAvg: lastWeekAvgTotalDemand,
        thisWeekMax: thisWeekMaxTotalDemand,
        lastWeekMax: lastWeekMaxTotalDemand,
        thisWeekMin: thisWeekMinTotalDemand,
        lastWeekMin: lastWeekMinTotalDemand,
        ...demandTrend
      },
      {
        component: "Net Load",
        thisWeekAvg: thisWeekAvgNetLoad,
        lastWeekAvg: lastWeekAvgNetLoad,
        thisWeekMax: thisWeekMaxNetLoad,
        lastWeekMax: lastWeekMaxNetLoad,
        thisWeekMin: thisWeekMinNetLoad,
        lastWeekMin: lastWeekMinNetLoad,
        ...netLoadTrend
      },
      {
        component: "Renewable Generation",
        thisWeekAvg: thisWeekAvgRenewable,
        lastWeekAvg: lastWeekAvgRenewable,
        thisWeekMax: thisWeekMaxRenewable,
        lastWeekMax: lastWeekMaxRenewable,
        thisWeekMin: thisWeekMinRenewable,
        lastWeekMin: lastWeekMinRenewable,
        ...renewableTrend
      }
    ];
    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      selectedHours,
      data: overviewData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`,
        hoursIncluded: selectedHours.length,
        totalDataPoints: demandHourlyValues.length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch week overview data" }),
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
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
