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
        select: { scenarioid: true }
      });
      if (!latestScenario) {
        latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: "desc" },
          select: { scenarioid: true }
        });
      }
      scenarioid = latestScenario?.scenarioid || null;
    }
    if (!scenarioid) {
      return new Response(
        JSON.stringify({ scenarioid: null, data: [] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const demandResults = await prisma.zone_demand.findMany({
      where: {
        scenarioid
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ],
      select: {
        Date: true,
        Hour: true,
        demandmw: true
      }
    });
    console.log("Raw zone_demand count:", demandResults.length);
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
    const renewableResults = await prisma.results_units.findMany({
      where: {
        scenarioid,
        OR: [
          { fuelname: "sun" },
          { fuelname: "Sun" },
          { fuelname: "wind" },
          { fuelname: "Wind" }
        ]
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ],
      select: {
        Date: true,
        Hour: true,
        fuelname: true,
        generationmw: true
      }
    });
    console.log("Raw renewable results count:", renewableResults.length);
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
    const processedData = Object.keys(demandByDatetime).map((datetime) => {
      const totalDemand = demandByDatetime[datetime];
      const renewableGeneration = renewableByDatetime[datetime] || 0;
      const netLoad = totalDemand - renewableGeneration;
      return {
        datetime,
        totalDemand,
        renewableGeneration,
        netLoad
      };
    }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    let caisoNetLoadByDatetime = {};
    try {
      const caisoNetLoadResult = await secondaryPool.query(`
        SELECT local_datetime_ib, value 
        FROM yes_fundamentals 
        WHERE entity = $1 AND attribute = $2
        ORDER BY local_datetime_ib ASC
      `, ["CAISO", "DA_NET_LOAD_FORECAST"]);
      console.log("Raw CAISO Net Load count:", caisoNetLoadResult.rows.length);
      caisoNetLoadResult.rows.forEach((row) => {
        if (row.local_datetime_ib && row.value) {
          const datetime = new Date(row.local_datetime_ib);
          datetime.setHours(datetime.getHours() + 1);
          const datetimeKey = datetime.toISOString();
          caisoNetLoadByDatetime[datetimeKey] = row.value / 1e3;
        }
      });
    } catch (queryError) {
      console.error("Failed to query CAISO Net Load from secondary database:", queryError);
      caisoNetLoadByDatetime = {};
    }
    const finalProcessedData = processedData.map((item) => ({
      ...item,
      caisoNetLoad: caisoNetLoadByDatetime[item.datetime] || null
    }));
    console.log("Processed net load data count:", finalProcessedData.length);
    console.log("First 3 processed records:", finalProcessedData.slice(0, 3));
    return new Response(JSON.stringify({
      scenarioid,
      data: finalProcessedData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data from database" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
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
