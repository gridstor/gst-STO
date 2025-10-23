import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
const GET = async ({ request }) => {
  try {
    console.log("=== Testing Congestion Data Availability ===");
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
    const scenarioid = latestScenario?.scenarioid;
    console.log("Using scenarioid:", scenarioid);
    if (!scenarioid) {
      return new Response(JSON.stringify({ error: "No scenario found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const allBindingConstraints = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total_count
      FROM binding_constraints_report 
      WHERE scenarioid = ${scenarioid}
    `;
    const uniqueUnits = await prisma.$queryRaw`
      SELECT DISTINCT itemid, COUNT(*)::int as count
      FROM binding_constraints_report 
      WHERE scenarioid = ${scenarioid}
      GROUP BY itemid
      ORDER BY count DESC
      LIMIT 10
    `;
    const unit56154InResults = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM results_units 
      WHERE unitid = 56154 AND scenarioid = ${scenarioid}
    `;
    const sampleResultsUnits = await prisma.$queryRaw`
      SELECT DISTINCT unitid, COUNT(*)::int as count
      FROM results_units 
      WHERE scenarioid = ${scenarioid}
      GROUP BY unitid
      ORDER BY count DESC
      LIMIT 5
    `;
    const result = {
      scenarioid,
      tests: {
        totalBindingConstraints: allBindingConstraints[0]?.total_count || 0,
        uniqueUnitsInBindingConstraints: uniqueUnits,
        unit56154InResultsUnits: unit56154InResults[0]?.count || 0,
        sampleUnitsInResultsUnits: sampleResultsUnits
      }
    };
    console.log("Test results:", result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
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
