import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
const GET = async ({ request }) => {
  try {
    console.log("=== Testing All Binding Constraints Data ===");
    const totalBindingConstraints = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total_count
      FROM binding_constraints_report
    `;
    const scenariosWithBindingConstraints = await prisma.$queryRaw`
      SELECT scenarioid, COUNT(*)::int as count
      FROM binding_constraints_report
      GROUP BY scenarioid
      ORDER BY count DESC
      LIMIT 5
    `;
    const unitsWithBindingConstraints = await prisma.$queryRaw`
      SELECT itemid, COUNT(*)::int as count
      FROM binding_constraints_report
      GROUP BY itemid
      ORDER BY count DESC
      LIMIT 10
    `;
    const availableScenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
      orderBy: { scenarioid: "desc" },
      take: 5,
      select: {
        scenarioid: true,
        scenarioname: true
      }
    });
    const result = {
      tests: {
        totalBindingConstraintsInDatabase: totalBindingConstraints[0]?.total_count || 0,
        scenariosWithBindingConstraints,
        unitsWithBindingConstraints,
        availableScenarios
      }
    };
    console.log("Binding constraints test results:", result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Binding constraints test error:", error);
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
