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
        JSON.stringify({ scenarioid: null, data: [] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const results = await prisma.results_units.findMany({
      where: {
        scenarioid
      },
      orderBy: [
        { Date: "asc" },
        { Hour: "asc" }
      ],
      select: {
        Date: true,
        Hour: true,
        fuelname: true,
        generationmw: true
      }
    });
    console.log("Raw results_units count:", results.length);
    console.log("First 3 results_units records:", results.slice(0, 3));
    const cleanFuelName = (rawFuelName) => {
      let fuelName = rawFuelName;
      if (fuelName === "MWH") fuelName = "Battery";
      else if (fuelName === "Nuc Fuel") fuelName = "Nuclear";
      else if (fuelName === "Renewble") fuelName = "Geothermal";
      else if (fuelName === "Sun") fuelName = "Solar";
      else if (fuelName === "sun") fuelName = "Solar";
      else if (fuelName === "wind") fuelName = "Wind";
      else if (fuelName === "Wind") fuelName = "Wind";
      else if (fuelName === "Water") fuelName = "Hydro";
      else if (fuelName && fuelName.includes("NG_")) fuelName = "Natural Gas";
      else if (fuelName && fuelName.includes("FO2")) fuelName = "Fuel Oil";
      else if (fuelName === "Landfill") fuelName = "Other";
      else if (fuelName === "Refuse") fuelName = "Other";
      else if (fuelName === "OTHER") fuelName = "Other";
      else if (fuelName === "Other") fuelName = "Other";
      else if (fuelName === "Purchase") fuelName = "Other";
      return fuelName;
    };
    const aggregatedData = {};
    results.forEach((row) => {
      const datetime = new Date(row.Date);
      datetime.setHours(row.Hour, 0, 0, 0);
      const datetimeKey = datetime.toISOString();
      const rawFuelName = row.fuelname || "Unknown";
      const mappedFuelName = cleanFuelName(rawFuelName);
      const generationGW = (row.generationmw || 0) / 1e3;
      const finalGenerationGW = mappedFuelName === "Battery" || rawFuelName === "MWH" ? generationGW : Math.max(0, generationGW);
      if (!aggregatedData[datetimeKey]) {
        aggregatedData[datetimeKey] = {};
      }
      if (!aggregatedData[datetimeKey][mappedFuelName]) {
        aggregatedData[datetimeKey][mappedFuelName] = 0;
      }
      aggregatedData[datetimeKey][mappedFuelName] += finalGenerationGW;
    });
    const processedData = Object.entries(aggregatedData).map(([datetime, fuels]) => {
      const totalGeneration = Object.values(fuels).reduce((sum, value) => sum + value, 0);
      return {
        datetime,
        ...fuels,
        "Total Generation": totalGeneration
      };
    }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    console.log("Processed data count:", processedData.length);
    console.log("First 3 processed records:", processedData.slice(0, 3));
    return new Response(JSON.stringify({
      scenarioid,
      data: processedData
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
