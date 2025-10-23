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
    let lastWeekData = [];
    try {
      const lastWeekResult = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 
          AND attribute = $2 
          AND local_datetime_ib >= $3 
          AND local_datetime_ib <= $4
        ORDER BY local_datetime_ib ASC
      `, ["GOLETA_6_N100", "DALMP", lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
      lastWeekData = lastWeekResult.rows;
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
          const dataDate = new Date(d.Date);
          dataDate.setHours(d.Hour, 0, 0, 0);
          return dataDate.getTime() === currentDate.getTime();
        });
        const lastWeekDateTime = new Date(currentDate);
        lastWeekDateTime.setDate(lastWeekDateTime.getDate() - 7);
        const hourStart = new Date(lastWeekDateTime);
        hourStart.setHours(hourStart.getHours() - 1, 0, 0, 0);
        const hourEnd = new Date(lastWeekDateTime);
        hourEnd.setHours(hourEnd.getHours(), 0, 0, 0);
        const hourlyRecords = lastWeekData.filter((d) => {
          const dataDate = new Date(d.local_datetime_ib);
          return dataDate >= hourStart && dataDate < hourEnd;
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
      JSON.stringify({ error: "Failed to fetch weekly LMP comparison data" }),
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
