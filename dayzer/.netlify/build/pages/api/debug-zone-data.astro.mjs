import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
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
      return new Response(JSON.stringify({ error: "No scenario found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const demandCount = await prisma.zone_demand.count({
      where: { scenarioid }
    });
    const sampleDemandData = await prisma.zone_demand.findMany({
      where: { scenarioid },
      take: 5,
      select: {
        Date: true,
        Hour: true,
        demandmw: true,
        zoneid: true
      }
    });
    const zoneMappingCount = await prisma.info_zoneid_zonename_mapping.count({
      where: { scenarioid }
    });
    const zoneMappings = await prisma.info_zoneid_zonename_mapping.findMany({
      where: { scenarioid },
      select: {
        zoneid: true,
        zonename: true
      }
    });
    const uniqueZonesInDemand = await prisma.zone_demand.findMany({
      where: { scenarioid },
      select: { zoneid: true },
      distinct: ["zoneid"]
    });
    const dateRange = await prisma.zone_demand.aggregate({
      where: { scenarioid },
      _min: { Date: true },
      _max: { Date: true }
    });
    return new Response(JSON.stringify({
      scenarioid,
      debug: {
        demandRecordCount: demandCount,
        sampleDemandData,
        zoneMappingCount,
        zoneMappings,
        uniqueZonesInDemand: uniqueZonesInDemand.map((z) => z.zoneid),
        dateRange: {
          min: dateRange._min.Date,
          max: dateRange._max.Date
        }
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Debug error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
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
