import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
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
    const zoneNameMappings = await prisma.info_zoneid_zonename_mapping.findMany({
      where: {
        scenarioid
      },
      select: {
        zoneid: true,
        zonename: true
      }
    });
    const zoneIdToName = new Map(
      zoneNameMappings.map((mapping) => [mapping.zoneid, mapping.zonename])
    );
    const results = await prisma.zone_demand.findMany({
      where: {
        scenarioid
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" },
        { zoneid: "asc" }
      ],
      select: {
        Date: true,
        Hour: true,
        zoneid: true,
        demandmw: true
      }
    });
    console.log("Raw zone_demand count:", results.length);
    console.log("First 3 zone_demand records:", results.slice(0, 3));
    console.log("Date range in data:", {
      first: results[0]?.Date,
      last: results[results.length - 1]?.Date
    });
    console.log("Hour range sample:", results.slice(0, 24).map((r) => ({ Date: r.Date, Hour: r.Hour, zoneid: r.zoneid })));
    const allowedZoneNames = [
      "Pacific Gas & Electric",
      "San Diego Gas & Electric",
      "Southern CA Edison",
      "Valley Electric Association"
    ];
    const aggregatedData = {};
    results.forEach((row) => {
      const zoneName = zoneIdToName.get(row.zoneid);
      if (!zoneName || !allowedZoneNames.includes(zoneName)) {
        return;
      }
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      const demandGW = Math.max(0, (row.demandmw || 0) / 1e3);
      if (!aggregatedData[datetimeKey]) {
        aggregatedData[datetimeKey] = {};
      }
      if (!aggregatedData[datetimeKey][zoneName]) {
        aggregatedData[datetimeKey][zoneName] = 0;
      }
      aggregatedData[datetimeKey][zoneName] += demandGW;
    });
    const processedData = Object.entries(aggregatedData).map(([datetime, zones]) => {
      const result = { datetime };
      Object.entries(zones).forEach(([zoneName, demand]) => {
        result[zoneName] = demand;
      });
      return result;
    }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    console.log("Processed zone demand data count:", processedData.length);
    console.log("First 3 processed records:", processedData.slice(0, 3));
    console.log("Unique datetime count:", Object.keys(aggregatedData).length);
    console.log("Sample datetime keys:", Object.keys(aggregatedData).slice(0, 10));
    const scenarioMetadata = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: { scenarioid },
      select: {
        simulation_date: true,
        scenarioname: true
      }
    });
    let dateRange = null;
    if (results.length > 0) {
      const dates = results.map((r) => r.Date);
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      dateRange = {
        start: minDate.toISOString().split("T")[0],
        end: maxDate.toISOString().split("T")[0]
      };
    }
    return new Response(JSON.stringify({
      scenarioid,
      simulationDate: scenarioMetadata?.simulation_date || null,
      dateRange,
      data: processedData
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
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
