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
        JSON.stringify({ error: "No scenario found" }),
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
    const lastWeekStart = new Date(simulationDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(simulationDate);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    const forecastWeekData = await prisma.results_units.findMany({
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
    const lastWeekResult = await secondaryPool.query(`
      SELECT local_datetime_ib, value 
      FROM yes_fundamentals 
      WHERE entity = $1 
        AND attribute = $2 
        AND local_datetime_ib >= $3 
        AND local_datetime_ib <= $4
      ORDER BY local_datetime_ib ASC
    `, ["GOLETA_6_N100", "RTLMP", lastWeekStart.toISOString(), lastWeekEnd.toISOString()]);
    const lastWeekRawData = lastWeekResult.rows;
    const lastWeekHourlyData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 1; hour <= 24; hour++) {
        const targetDate = new Date(lastWeekStart);
        targetDate.setDate(targetDate.getDate() + day);
        const hourStart = new Date(targetDate);
        hourStart.setHours(hour - 1, 0, 0, 0);
        const hourEnd = new Date(targetDate);
        hourEnd.setHours(hour, 0, 0, 0);
        const hourlyRecords = lastWeekRawData.filter((d) => {
          const dataDate = new Date(d.local_datetime_ib);
          return dataDate >= hourStart && dataDate < hourEnd;
        });
        if (hourlyRecords.length > 0) {
          const validRecords = hourlyRecords.filter((r) => r.value !== null && !isNaN(Number(r.value)));
          if (validRecords.length > 0) {
            const sum = validRecords.reduce((acc, r) => acc + Number(r.value), 0);
            const avgLMP = sum / validRecords.length;
            lastWeekHourlyData.push({
              date: new Date(targetDate),
              hour,
              lmp: avgLMP
            });
          }
        }
      }
    }
    const forecastWeekFrequency = new Array(24).fill(0);
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(thisWeekStart);
      dayDate.setDate(dayDate.getDate() + day);
      const dayHours = forecastWeekData.filter((d) => {
        const dataDate = new Date(d.Date);
        return dataDate.toDateString() === dayDate.toDateString();
      }).map((d) => ({
        hour: d.Hour,
        // This should be HE format
        lmp: d.lmp || 0
      }));
      const bottom3Hours = dayHours.sort((a, b) => a.lmp - b.lmp).slice(0, 3).map((d) => d.hour);
      bottom3Hours.forEach((hour) => {
        if (hour >= 1 && hour <= 24) {
          forecastWeekFrequency[hour - 1]++;
        }
      });
    }
    const lastWeekFrequency = new Array(24).fill(0);
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(lastWeekStart);
      dayDate.setDate(dayDate.getDate() + day);
      const dayHours = lastWeekHourlyData.filter((d) => {
        return d.date.toDateString() === dayDate.toDateString();
      });
      const bottom3Hours = dayHours.sort((a, b) => a.lmp - b.lmp).slice(0, 3).map((d) => d.hour);
      bottom3Hours.forEach((hour) => {
        if (hour >= 1 && hour <= 24) {
          lastWeekFrequency[hour - 1]++;
        }
      });
    }
    const response = {
      forecastWeekFrequency,
      lastWeekFrequency,
      metadata: {
        forecastWeekRange: `${thisWeekStart.toDateString()} - ${thisWeekEnd.toDateString()}`,
        lastWeekRange: `${lastWeekStart.toDateString()} - ${lastWeekEnd.toDateString()}`
      }
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Bottom hours frequency error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch bottom hours frequency data" }),
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
