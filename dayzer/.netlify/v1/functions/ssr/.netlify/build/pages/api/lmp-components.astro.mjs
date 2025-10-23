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
        JSON.stringify({ error: "No scenario found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const results = await prisma.$queryRaw`
      SELECT "Date", "Hour", energy, congestion, losses 
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid}
      ORDER BY "Date" ASC, "Hour" ASC
    `;
    const data = results.map((row) => {
      const date = new Date(row.Date);
      const hour = String(row.Hour).padStart(2, "0");
      return {
        datetime: `${date.toISOString().slice(0, 10)}T${hour}:00`,
        Energy: row.energy,
        Congestion: row.congestion,
        Loss: row.losses,
        LMP: row.energy + row.congestion + row.losses
      };
    });
    return new Response(JSON.stringify(data), {
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
