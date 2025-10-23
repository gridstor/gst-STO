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
    const comparisonPeriod = url.searchParams.get("period") || "lastWeek";
    let scenarioid = null;
    if (requestedScenarioid) {
      scenarioid = parseInt(requestedScenarioid, 10);
    } else {
      return new Response(
        JSON.stringify({ error: "scenarioid is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
    let comparisonStart;
    let comparisonEnd;
    let comparisonLabel;
    if (comparisonPeriod === "lastYear") {
      comparisonStart = new Date(simulationDate);
      comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
      comparisonEnd = new Date(comparisonStart);
      comparisonEnd.setDate(comparisonEnd.getDate() + 6);
      comparisonLabel = "Last Year";
    } else if (comparisonPeriod === "lastWeek" || comparisonPeriod === "thisWeek") {
      comparisonStart = new Date(simulationDate);
      comparisonStart.setDate(comparisonStart.getDate() - 7);
      comparisonEnd = new Date(simulationDate);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      comparisonEnd.setHours(23, 59, 59, 999);
      comparisonLabel = "Last Week";
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid comparison period" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const thisWeekData = await prisma.results_units.findMany({
      where: {
        scenarioid,
        unitid: 66038,
        Date: {
          gte: thisWeekStart,
          lte: thisWeekEnd
        }
      },
      select: {
        Date: true,
        Hour: true,
        lmp: true
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ]
    });
    let comparisonData = [];
    try {
      const comparisonResult = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP", comparisonStart.toISOString(), comparisonEnd.toISOString()]);
      comparisonData = comparisonResult.rows;
    } catch (queryError) {
      console.error("Failed to query secondary database:", queryError);
      comparisonData = [];
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
          const dataDate = new Date(d.Date);
          dataDate.setHours(d.Hour, 0, 0, 0);
          return dataDate.getTime() === currentDate.getTime();
        });
        const comparisonDateTime = new Date(comparisonStart);
        comparisonDateTime.setDate(comparisonDateTime.getDate() + day);
        comparisonDateTime.setHours(hour, 0, 0, 0);
        const hourlyRecords = comparisonData.filter((d) => {
          const dataDate = new Date(d.local_datetime_ib);
          return dataDate.getTime() === comparisonDateTime.getTime();
        });
        let lastWeekLMP = null;
        if (hourlyRecords.length > 0) {
          const validRecords = hourlyRecords.filter((r) => r.value !== null && !isNaN(Number(r.value)));
          if (validRecords.length > 0) {
            const sum = validRecords.reduce((acc, r) => acc + Number(r.value), 0);
            lastWeekLMP = sum / validRecords.length;
          }
        }
        combinedData.push({
          datetime: currentDate.toISOString(),
          dayName,
          thisWeekLMP: thisWeekMatch?.lmp || null,
          lastWeekLMP
        });
      }
    }
    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioInfo.simulation_date,
      comparisonPeriod,
      data: combinedData,
      metadata: {
        thisWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        comparisonRange: `${comparisonStart.toDateString()} - ${comparisonEnd.toDateString()}`,
        totalHours: combinedData.length,
        thisWeekDataPoints: thisWeekData.length,
        comparisonDataPoints: comparisonData.length,
        comparisonLabel
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch TB2.6 LMP comparison data" }),
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
