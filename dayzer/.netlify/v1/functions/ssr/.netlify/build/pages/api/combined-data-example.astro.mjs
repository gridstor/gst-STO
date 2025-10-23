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
    const scenarioid = url.searchParams.get("scenarioid") || "12345";
    const primaryData = await prisma.results_units.findMany({
      where: {
        scenarioid: parseInt(scenarioid),
        unitid: 56154
        // Your current unit
      },
      select: {
        Date: true,
        Hour: true,
        generationmw: true,
        lmp: true
      },
      take: 100
      // Limit for example
    });
    const combinedData = primaryData.map((primary) => {
      const datetime = new Date(primary.Date);
      datetime.setHours(primary.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      return {
        datetime: datetimeKey,
        primaryGeneration: primary.generationmw,
        primaryLMP: primary.lmp
        // secondaryValue: matchingSecondary?.value || null,
        // secondaryName: matchingSecondary?.name || null,
      };
    });
    return new Response(JSON.stringify({
      scenarioid: parseInt(scenarioid),
      data: combinedData
      // metadata: {
      //   primaryRecords: primaryData.length,
      //   secondaryRecords: secondaryData.length,
      //   combinedRecords: combinedData.length,
      // }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch combined data" }),
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
