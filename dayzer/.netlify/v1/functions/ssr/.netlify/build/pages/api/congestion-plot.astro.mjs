import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
const GET = async ({ request }) => {
  try {
    console.log("=== Congestion Plot API Debug ===");
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
      console.log("No scenarioid found!");
      return new Response(
        JSON.stringify({ error: "No scenario found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Starting database queries...");
    console.log("Query 1: binding_constraints_report");
    const bindingConstraints = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, congestion 
      FROM binding_constraints_report 
      WHERE itemid = 66038 AND scenarioid = ${scenarioid}
    `;
    console.log("Binding constraints found:", bindingConstraints.length);
    console.log("Query 2: transmission_constraint_characteristics");
    const constraintMapping = await prisma.$queryRaw`
      SELECT constraintid, constraintname, constrainttype 
      FROM transmission_constraint_characteristics 
      WHERE scenarioid = ${scenarioid}
    `;
    console.log("Constraint mappings found:", constraintMapping.length);
    console.log("Query 3: results_constraints");
    const shadowPrices = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, shadowprice 
      FROM results_constraints 
      WHERE scenarioid = ${scenarioid}
    `;
    console.log("Shadow prices found:", shadowPrices.length);
    console.log("Query 4: results_units");
    const resultsUnit = await prisma.$queryRaw`
      SELECT "Date", "Hour", congestion 
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid}
    `;
    console.log("Results units found:", resultsUnit.length);
    if (bindingConstraints.length === 0) {
      console.log("No binding constraints data found for unitid 66038 and scenarioid", scenarioid);
      return new Response(JSON.stringify({
        scenarioid,
        data: [],
        metadata: { constraintNames: [], constraintDetails: {} },
        debug: {
          bindingConstraints: 0,
          constraintMapping: constraintMapping.length,
          shadowPrices: shadowPrices.length,
          resultsUnit: resultsUnit.length
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Processing data...");
    console.log("Sample binding constraints data:");
    console.log(bindingConstraints.slice(0, 3));
    console.log("Sample constraint mapping data:");
    console.log(constraintMapping.slice(0, 3));
    console.log("Sample shadow prices data:");
    console.log(shadowPrices.slice(0, 3));
    console.log("Sample results unit data:");
    console.log(resultsUnit.slice(0, 3));
    const constraintsWithNames = bindingConstraints.map((bc) => {
      const constraintInfo = constraintMapping.find((cm) => cm.constraintid === bc.constraintid);
      return {
        Date: bc.Date,
        Hour: bc.Hour,
        constraintid: bc.constraintid,
        congestion: bc.congestion || 0,
        constraintname: constraintInfo?.constraintname || `Constraint ${bc.constraintid}`,
        constrainttype: constraintInfo?.constrainttype || "Unknown"
      };
    });
    const constraintsWithShadowPrices = constraintsWithNames.map((item) => {
      const shadowPriceRecord = shadowPrices.find(
        (sp) => sp.Date.getTime() === item.Date.getTime() && sp.Hour === item.Hour && sp.constraintid === item.constraintid
      );
      const shadowprice = shadowPriceRecord?.shadowprice || 0;
      return {
        ...item,
        shadowprice,
        shiftFactor: shadowprice !== 0 ? item.congestion / shadowprice : 0,
        datetime: new Date(item.Date.getTime() + item.Hour * 60 * 60 * 1e3).toISOString()
      };
    });
    const datetimeGroups = /* @__PURE__ */ new Map();
    constraintsWithShadowPrices.forEach((item) => {
      if (!datetimeGroups.has(item.datetime)) {
        datetimeGroups.set(item.datetime, {});
      }
      const existing = datetimeGroups.get(item.datetime)[item.constraintname] || 0;
      datetimeGroups.get(item.datetime)[item.constraintname] = existing + item.congestion;
    });
    const allConstraintNames = [...new Set(constraintsWithShadowPrices.map((item) => item.constraintname))];
    console.log("Unique constraint names:", allConstraintNames);
    const totalCongestionMap = /* @__PURE__ */ new Map();
    resultsUnit.forEach((ru) => {
      const datetime = new Date(ru.Date.getTime() + ru.Hour * 60 * 60 * 1e3).toISOString();
      totalCongestionMap.set(datetime, ru.congestion || 0);
    });
    const resultData = Array.from(datetimeGroups.keys()).sort().map((datetime) => {
      const constraintData = datetimeGroups.get(datetime);
      const totalCongestion = totalCongestionMap.get(datetime) || 0;
      const row = {
        datetime,
        "Total Congestion": totalCongestion
      };
      let sumConstraints = 0;
      allConstraintNames.forEach((constraintName) => {
        const congestionValue = constraintData[constraintName] || 0;
        row[constraintName] = congestionValue;
        sumConstraints += congestionValue;
      });
      row["Other"] = totalCongestion - sumConstraints;
      return row;
    });
    console.log("Final result data points:", resultData.length);
    console.log("Sample data point:", resultData[0]);
    console.log("More sample data points:");
    console.log(resultData.slice(0, 3));
    if (resultData.length > 0) {
      const samplePoint = resultData[Math.floor(resultData.length / 2)];
      const constraintSum = allConstraintNames.reduce((sum, name) => sum + (samplePoint[name] || 0), 0);
      console.log("Debug sample point analysis:");
      console.log("Total Congestion:", samplePoint["Total Congestion"]);
      console.log("Sum of constraints:", constraintSum);
      console.log("Other:", samplePoint["Other"]);
      console.log("Math check:", constraintSum + samplePoint["Other"], "should equal", samplePoint["Total Congestion"]);
    }
    const constraintDetails = constraintsWithShadowPrices.reduce((acc, item) => {
      if (!acc[item.constraintname]) {
        acc[item.constraintname] = {};
      }
      acc[item.constraintname][item.datetime] = {
        shiftFactor: item.shiftFactor,
        shadowprice: item.shadowprice
      };
      return acc;
    }, {});
    const metadata = {
      constraintNames: allConstraintNames,
      constraintDetails
    };
    console.log("=== API Success ===");
    return new Response(JSON.stringify({
      scenarioid,
      data: resultData,
      metadata
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("=== Database error in congestion-plot API ===");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({
        error: "Failed to fetch congestion data from database",
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
