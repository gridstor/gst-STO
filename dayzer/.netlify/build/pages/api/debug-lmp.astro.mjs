import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
    console.log("=== Debug LMP for 7/25 ===");
    const latestScenarioResultRaw = await prisma.$queryRaw`
      SELECT scenarioid, scenarioname, simulation_date
      FROM "output_db"."info_scenarioid_scenarioname_mapping"
      ORDER BY scenarioid DESC
      LIMIT 1
    `;
    if (!latestScenarioResultRaw || latestScenarioResultRaw.length === 0) {
      return new Response(
        JSON.stringify({ error: "No scenarios found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const latestScenario = {
      ...latestScenarioResultRaw[0],
      scenarioid: Number(latestScenarioResultRaw[0].scenarioid)
    };
    console.log("Using scenario:", latestScenario);
    const availableDates = await prisma.$queryRaw`
      SELECT DISTINCT "Date", COUNT(*) as hour_count
      FROM "output_db"."results_units"
      WHERE scenarioid = ${latestScenario.scenarioid} AND unitid = 66038
      GROUP BY "Date"
      ORDER BY "Date" ASC
      LIMIT 20
    `;
    console.log("Available dates in current scenario:", availableDates);
    const targetDate = /* @__PURE__ */ new Date("2025-07-25");
    const targetDateString = "2025-07-25";
    console.log("JavaScript Date object:", targetDate.toISOString());
    console.log("Target date string:", targetDateString);
    const lmpResults1 = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        unitid: 66038,
        Date: targetDate
      },
      select: {
        Date: true,
        Hour: true,
        energy: true,
        congestion: true,
        losses: true
      },
      orderBy: [{ Hour: "asc" }]
    });
    console.log(`Method 1 (Date object): Found ${lmpResults1.length} hours`);
    const lmpResults2Raw = await prisma.$queryRaw`
      SELECT "Date", "Hour", energy, congestion, losses
      FROM "output_db"."results_units"
      WHERE scenarioid = ${latestScenario.scenarioid} 
        AND unitid = 66038 
        AND "Date" = ${targetDateString}::date
      ORDER BY "Hour" ASC
    `;
    const lmpResults2 = lmpResults2Raw.map((row) => ({
      ...row,
      Hour: Number(row.Hour),
      energy: Number(row.energy || 0),
      congestion: Number(row.congestion || 0),
      losses: Number(row.losses || 0)
    }));
    console.log(`Method 2 (Raw SQL with schema): Found ${lmpResults2.length} hours`);
    const startOfDay = /* @__PURE__ */ new Date("2025-07-25T00:00:00.000Z");
    const endOfDay = /* @__PURE__ */ new Date("2025-07-25T23:59:59.999Z");
    const lmpResults3 = await prisma.results_units.findMany({
      where: {
        scenarioid: latestScenario.scenarioid,
        unitid: 66038,
        Date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        Date: true,
        Hour: true,
        energy: true,
        congestion: true,
        losses: true
      },
      orderBy: [{ Hour: "asc" }]
    });
    console.log(`Method 3 (Date range): Found ${lmpResults3.length} hours`);
    const rawSampleRaw = await prisma.$queryRaw`
      SELECT "Date", "Hour", energy, congestion, losses
      FROM "output_db"."results_units"
      WHERE scenarioid = ${latestScenario.scenarioid} 
        AND unitid = 66038 
        AND "Date" >= '2025-07-24'::date 
        AND "Date" <= '2025-07-26'::date
      ORDER BY "Date", "Hour" ASC
      LIMIT 10
    `;
    const rawSample = rawSampleRaw.map((row) => ({
      ...row,
      Hour: Number(row.Hour),
      energy: Number(row.energy || 0),
      congestion: Number(row.congestion || 0),
      losses: Number(row.losses || 0)
    }));
    console.log("Raw sample data around 7/25/2025:", rawSample);
    const availableDatesConverted = availableDates.map((row) => ({
      Date: row.Date,
      hour_count: Number(row.hour_count)
    }));
    let actualData = lmpResults2.length > 0 ? lmpResults2 : lmpResults1.length > 0 ? lmpResults1 : lmpResults3.length > 0 ? lmpResults3 : [];
    const result = {
      debugInfo: {
        scenarioId: latestScenario.scenarioid,
        scenarioName: latestScenario.scenarioname,
        targetJSDate: targetDate.toISOString(),
        targetDateString,
        note: "Updated to search for 2025-07-25 since scenario contains 2025 data",
        availableDates: availableDatesConverted.slice(0, 10),
        rawSampleData: rawSample,
        queryResults: {
          method1_dateObject: lmpResults1.length,
          method2_rawSQL: lmpResults2.length,
          method3_dateRange: lmpResults3.length
        }
      }
    };
    if (actualData.length === 0) {
      return new Response(JSON.stringify(result, null, 2), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const processedData = actualData.map((row) => ({
      hour: row.Hour,
      energy: row.energy || 0,
      congestion: row.congestion || 0,
      losses: row.losses || 0,
      lmp: (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
    }));
    const sortedByLMP = [...processedData].sort((a, b) => b.lmp - a.lmp);
    result.data = {
      date: "2025-07-25",
      totalHours: processedData.length,
      hoursChronological: processedData,
      hoursByLMP: sortedByLMP,
      topHours: {
        highest: { hour: sortedByLMP[0]?.hour, lmp: sortedByLMP[0]?.lmp },
        secondHighest: { hour: sortedByLMP[1]?.hour, lmp: sortedByLMP[1]?.lmp }
      },
      bottomHours: {
        secondLowest: { hour: sortedByLMP[22]?.hour, lmp: sortedByLMP[22]?.lmp },
        lowest: { hour: sortedByLMP[23]?.hour, lmp: sortedByLMP[23]?.lmp }
      }
    };
    console.log("Successfully found data!");
    console.log("Top 2 hours:", result.data.topHours);
    console.log("Bottom 2 hours:", result.data.bottomHours);
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Debug LMP error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to debug LMP data",
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
