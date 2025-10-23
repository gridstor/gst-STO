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
    console.log("Secondary PostgreSQL connection created");
    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get("scenarioid");
    const metric = url.searchParams.get("metric") || "totalDemand";
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
    console.log("Date ranges:", {
      simulation: simulationDate.toISOString(),
      thisWeek: `${thisWeekStart.toISOString()} to ${thisWeekEnd.toISOString()}`,
      lastWeek: `${lastWeekStart.toISOString()} to ${lastWeekEnd.toISOString()}`
    });
    let thisWeekData = [];
    if (metric === "totalDemand") {
      const demandResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid,
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd
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
      thisWeekData = Object.keys(demandByDatetime).map((datetime) => ({
        datetime,
        value: demandByDatetime[datetime]
      }));
    } else if (metric === "netLoad") {
      const demandResults = await prisma.zone_demand.findMany({
        where: {
          scenarioid,
          Date: {
            gte: thisWeekStart,
            lte: thisWeekEnd
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
          }
        },
        select: {
          Date: true,
          Hour: true,
          fuelname: true,
          generationmw: true
        },
        orderBy: [
          { Date: "asc" },
          { Hour: "asc" }
        ]
      });
      const demandByDatetime = {};
      const renewableByDatetime = {};
      demandResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        if (!demandByDatetime[datetimeKey]) {
          demandByDatetime[datetimeKey] = 0;
        }
        demandByDatetime[datetimeKey] += (row.demandmw || 0) / 1e3;
      });
      renewableResults.forEach((row) => {
        const datetime = new Date(row.Date);
        datetime.setHours(row.Hour, 0, 0, 0);
        const datetimeKey = datetime.toISOString();
        if (!renewableByDatetime[datetimeKey]) {
          renewableByDatetime[datetimeKey] = 0;
        }
        renewableByDatetime[datetimeKey] += (row.generationmw || 0) / 1e3;
      });
      thisWeekData = Object.keys(demandByDatetime).map((datetime) => ({
        datetime,
        value: demandByDatetime[datetime] - (renewableByDatetime[datetime] || 0)
      }));
    } else if (metric === "renewableGeneration") {
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
          }
        },
        select: {
          Date: true,
          Hour: true,
          fuelname: true,
          generationmw: true
        },
        orderBy: [
          { Date: "asc" },
          { Hour: "asc" }
        ]
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
      thisWeekData = Object.keys(renewableByDatetime).map((datetime) => ({
        datetime,
        value: renewableByDatetime[datetime]
      }));
    }
    let lastWeekData = [];
    try {
      let attributes = [];
      if (metric === "totalDemand") {
        attributes = ["RTLOAD"];
      } else if (metric === "netLoad") {
        attributes = ["NET_RTLOAD"];
      } else if (metric === "renewableGeneration") {
        attributes = ["RTGEN_SOLAR", "RTGEN_WIND"];
      }
      const placeholders = attributes.map((_, i) => `$${i + 4}`).join(", ");
      const lastWeekResult = await secondaryPool.query(`
        SELECT local_datetime_ib, attribute, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute IN (${placeholders})
          AND local_datetime_ib >= $2 
          AND local_datetime_ib <= $3
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", lastWeekStart.toISOString(), lastWeekEnd.toISOString(), ...attributes]);
      console.log("Last week query result count:", lastWeekResult.rows.length);
      const hourlyData = {};
      lastWeekResult.rows.forEach((row) => {
        if (row.value !== null && !isNaN(Number(row.value))) {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1);
          const hourKey = datetime.toISOString();
          if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = { values: [], count: 0 };
          }
          hourlyData[hourKey].values.push(Number(row.value));
          hourlyData[hourKey].count++;
        }
      });
      lastWeekData = Object.keys(hourlyData).map((datetime) => {
        const hourData = hourlyData[datetime];
        let finalValue;
        if (metric === "renewableGeneration") {
          finalValue = hourData.values.reduce((sum, val) => sum + val, 0);
        } else {
          finalValue = hourData.values.reduce((sum, val) => sum + val, 0) / hourData.values.length;
        }
        return {
          datetime,
          value: finalValue / 1e3
          // Convert MW to GW
        };
      });
    } catch (queryError) {
      console.error("Failed to query secondary database:", queryError);
      lastWeekData = [];
    }
    const combinedData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const currentDate = new Date(thisWeekStart);
        currentDate.setDate(currentDate.getDate() + day);
        currentDate.setHours(hour, 0, 0, 0);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = dayNames[currentDate.getDay()];
        const thisWeekMatch = thisWeekData.find((d) => {
          const dataDate = new Date(d.datetime);
          return dataDate.getTime() === currentDate.getTime();
        });
        const lastWeekDateTime = new Date(currentDate);
        lastWeekDateTime.setDate(lastWeekDateTime.getDate() - 7);
        const lastWeekMatch = lastWeekData.find((d) => {
          const dataDate = new Date(d.datetime);
          return dataDate.getTime() === lastWeekDateTime.getTime();
        });
        combinedData.push({
          datetime: currentDate.toISOString(),
          dayName,
          thisWeekValue: thisWeekMatch?.value || null,
          lastWeekValue: lastWeekMatch?.value || null
        });
      }
    }
    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      metric,
      data: combinedData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`,
        totalHours: combinedData.length,
        thisWeekDataPoints: thisWeekData.length,
        lastWeekDataPoints: lastWeekData.length,
        secondaryDBStatus: "connected"
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch weekly load comparison data" }),
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
