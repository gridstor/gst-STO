import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
    const caisoWeekScenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
      where: {
        scenarioname: {
          contains: "CAISO_WEEK"
        }
      },
      select: {
        scenarioid: true,
        simulation_date: true,
        scenarioname: true
      },
      orderBy: {
        scenarioid: "desc"
        // Order by scenarioid desc as fallback
      }
    });
    console.log("=== DEBUG: All CAISO_WEEK scenarios ===");
    console.log("Total scenarios found:", caisoWeekScenarios.length);
    const july1Scenario = caisoWeekScenarios.find((s) => s.scenarioname === "CAISO_WEEK202507010500R");
    console.log("July 1st scenario found:", july1Scenario);
    const nullDateScenarios = caisoWeekScenarios.filter((s) => !s.simulation_date);
    console.log("Scenarios with null simulation_date:", nullDateScenarios.length);
    if (nullDateScenarios.length > 0) {
      console.log("Null date scenarios:", nullDateScenarios.map((s) => s.scenarioname));
    }
    const availableScenarios = caisoWeekScenarios.filter((scenario) => scenario.simulation_date).map((scenario) => ({
      scenarioid: scenario.scenarioid,
      simulation_date: scenario.simulation_date,
      // ! because we filtered out nulls above
      scenarioname: scenario.scenarioname
    })).sort((a, b) => {
      const dateA = new Date(a.simulation_date);
      const dateB = new Date(b.simulation_date);
      return dateB.getTime() - dateA.getTime();
    });
    console.log("=== DEBUG: After filtering ===");
    console.log("Available scenarios after filtering:", availableScenarios.length);
    const july1Available = availableScenarios.find((s) => s.scenarioname === "CAISO_WEEK202507010500R");
    console.log("July 1st in available scenarios:", july1Available);
    const defaultScenario = availableScenarios.length > 0 ? availableScenarios[0] : null;
    console.log("Available scenarios count:", availableScenarios.length);
    console.log("Default scenario selected:", defaultScenario);
    console.log("First 3 scenarios by date:", availableScenarios.slice(0, 3));
    return new Response(JSON.stringify({
      scenarios: availableScenarios,
      defaultScenario,
      count: availableScenarios.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Available scenarios API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch available scenarios",
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
