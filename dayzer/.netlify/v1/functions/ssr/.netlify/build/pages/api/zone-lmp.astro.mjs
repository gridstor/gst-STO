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
    const requestedZoneid = url.searchParams.get("zoneid");
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
        JSON.stringify({ scenarioid: null, data: [], zones: [] }),
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
    const whereConditions = {
      scenarioid
    };
    if (requestedZoneid) {
      whereConditions.zoneid = parseInt(requestedZoneid, 10);
    }
    const results = await prisma.results_zones.findMany({
      where: whereConditions,
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" },
        { zoneid: "asc" }
      ],
      select: {
        Date: true,
        Hour: true,
        zoneid: true,
        energy: true,
        congestion: true,
        losses: true
      }
    });
    console.log("Raw results_zones count:", results.length);
    console.log("First 3 results_zones records:", results.slice(0, 3));
    if (!requestedZoneid) {
      const uniqueZoneIds = Array.from(new Set(results.map((r) => r.zoneid)));
      const allowedZoneNames = [
        "Pacific Gas & Electric",
        "San Diego Gas & Electric",
        "Southern CA Edison",
        "Valley Electric Association"
      ];
      const zones = uniqueZoneIds.map((zoneid) => ({
        id: zoneid,
        name: zoneIdToName.get(zoneid) || `Zone_${zoneid}`
      })).filter((zone) => allowedZoneNames.includes(zone.name)).sort((a, b) => a.name.localeCompare(b.name));
      return new Response(JSON.stringify({
        scenarioid,
        zones,
        data: []
        // Empty data when no zone is selected
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const processedData = results.map((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const energy = row.energy || 0;
      const congestion = row.congestion || 0;
      const losses = row.losses || 0;
      const totalLMP = energy + congestion + losses;
      return {
        datetime: datetime.toISOString(),
        zoneid: row.zoneid,
        zonename: zoneIdToName.get(row.zoneid) || `Zone_${row.zoneid}`,
        energy,
        congestion,
        losses,
        totalLMP
      };
    });
    return new Response(JSON.stringify({
      scenarioid,
      data: processedData,
      zones: []
      // Empty zones array when returning specific zone data
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
