import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
    console.log("🔍 SCENARIO DATES API STARTING...");
    console.log("Querying info_scenarioid_scenarioname_mapping table...");
    let scenarios;
    try {
      scenarios = await prisma.info_scenarioid_scenarioname_mapping.findMany({
        where: {
          simulation_date: { not: null },
          scenarioname: { contains: "CAISO_WEEK" }
          // Only CAISO_WEEK scenarios
        },
        select: {
          scenarioid: true,
          scenarioname: true,
          simulation_date: true
        },
        orderBy: {
          simulation_date: "desc"
        }
      });
      console.log("Prisma query successful. Total scenarios found:", scenarios.length);
    } catch (prismaError) {
      console.error("Prisma query failed:", prismaError);
      throw new Error(`Database query failed: ${prismaError instanceof Error ? prismaError.message : "Unknown error"}`);
    }
    const dateScenarioMap = {};
    scenarios.forEach((scenario) => {
      if (scenario.simulation_date) {
        let dateStr;
        if (typeof scenario.simulation_date === "string") {
          const date = new Date(scenario.simulation_date);
          dateStr = date.toISOString().split("T")[0];
        } else {
          dateStr = scenario.simulation_date.toISOString().split("T")[0];
        }
        console.log("Processing scenario:", scenario.scenarioid, "date:", dateStr);
        if (!dateScenarioMap[dateStr] || scenario.scenarioid > dateScenarioMap[dateStr].scenarioid) {
          dateScenarioMap[dateStr] = {
            scenarioid: scenario.scenarioid,
            scenarioname: scenario.scenarioname || `Scenario ${scenario.scenarioid}`
          };
          if (dateStr === "2025-09-18" || dateStr === "2025-09-11") {
            console.log(`KEY DATE MAPPING: ${dateStr} → Scenario ${scenario.scenarioid}`);
          }
        }
      }
    });
    console.log("Unique dates with scenarios:", Object.keys(dateScenarioMap).length);
    const availableDates = [];
    const dateEntries = Object.entries(dateScenarioMap);
    for (const [dateStr, scenarioInfo] of dateEntries) {
      const currentDate = new Date(dateStr);
      const previousWeekDate = new Date(currentDate);
      previousWeekDate.setDate(currentDate.getDate() - 7);
      const previousWeekDateStr = previousWeekDate.toISOString().split("T")[0];
      const hasPreviousWeek = dateScenarioMap[previousWeekDateStr] !== void 0;
      availableDates.push({
        date: dateStr,
        scenarioid: scenarioInfo.scenarioid,
        scenarioname: scenarioInfo.scenarioname,
        hasPreviousWeek
      });
    }
    availableDates.sort((a, b) => b.date.localeCompare(a.date));
    console.log("Available dates processed:", availableDates.length);
    if (availableDates.length > 0) {
      console.log("Most recent available date:", availableDates[0]);
      console.log("Oldest available date:", availableDates[availableDates.length - 1]);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const defaultDate = availableDates.find((d) => d.date <= today) || availableDates[0];
    return new Response(JSON.stringify({
      success: true,
      availableDates,
      defaultDate: defaultDate?.date || null,
      metadata: {
        totalDates: availableDates.length,
        dateRange: {
          earliest: availableDates[availableDates.length - 1]?.date,
          latest: availableDates[0]?.date
        },
        datesWithPreviousWeek: availableDates.filter((d) => d.hasPreviousWeek).length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Available scenario dates error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch available scenario dates",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
