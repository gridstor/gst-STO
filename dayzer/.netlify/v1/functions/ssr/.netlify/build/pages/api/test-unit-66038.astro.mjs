import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
const GET = async ({ request }) => {
  try {
    console.log("=== Testing Unit 66038 Data ===");
    let latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      where: {
        scenarioname: {
          contains: "CAISO_WEEK"
        }
      },
      orderBy: { scenarioid: "desc" },
      select: {
        scenarioid: true,
        simulation_date: true
      }
    });
    if (!latestScenario) {
      latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        orderBy: { scenarioid: "desc" },
        select: {
          scenarioid: true,
          simulation_date: true
        }
      });
    }
    const scenarioid = latestScenario?.scenarioid;
    const simulation_date = latestScenario?.simulation_date;
    console.log("Using scenarioid:", scenarioid);
    if (!scenarioid) {
      return new Response(JSON.stringify({ error: "No scenario found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const unit66038InBinding = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM binding_constraints_report 
      WHERE itemid = 66038 AND scenarioid = ${scenarioid}
    `;
    const unit66038InResults = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid}
    `;
    const sampleBindingData = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, congestion 
      FROM binding_constraints_report 
      WHERE itemid = 66038 AND scenarioid = ${scenarioid}
      ORDER BY "Date", "Hour"
      LIMIT 5
    `;
    const sampleResultsData = await prisma.$queryRaw`
      SELECT "Date", "Hour", energy, congestion, losses 
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid}
      ORDER BY "Date", "Hour"
      LIMIT 5
    `;
    const result = {
      scenarioid,
      simulation_date,
      unit66038: {
        bindingConstraintsCount: unit66038InBinding[0]?.count || 0,
        resultsUnitsCount: unit66038InResults[0]?.count || 0,
        sampleBindingData,
        sampleResultsData
      }
    };
    console.log("Unit 66038 test results:", result);
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
