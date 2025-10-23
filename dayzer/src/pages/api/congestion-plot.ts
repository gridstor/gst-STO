import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('=== Congestion Plot API Debug ===');
    
    // Get parameters from query
    const url = new URL(request.url);
    const requestedScenarioid = url.searchParams.get('scenarioid');
    
    let scenarioid: number | null = null;
    
    if (requestedScenarioid) {
      scenarioid = parseInt(requestedScenarioid, 10);
    } else {
      // Find the most recent scenarioid with "CAISO_WEEK" in the name
      let latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
        where: {
          scenarioname: {
            contains: 'CAISO_WEEK'
          }
        },
        orderBy: { scenarioid: 'desc' },
        select: { scenarioid: true },
      });
      
      // If no CAISO_WEEK scenario found, fall back to most recent overall
      if (!latestScenario) {
        latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
          orderBy: { scenarioid: 'desc' },
          select: { scenarioid: true },
        });
      }
      
      scenarioid = latestScenario?.scenarioid || null;
    }
    
    if (!scenarioid) {
      console.log('No scenarioid found!');
      return new Response(
        JSON.stringify({ error: 'No scenario found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get simulation date to filter data
    const scenarioInfo = await prisma.info_scenarioid_scenarioname_mapping.findUnique({
      where: { scenarioid },
      select: { simulation_date: true }
    });

    if (!scenarioInfo?.simulation_date) {
      return new Response(
        JSON.stringify({ error: 'No simulation date found for scenario' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const simulationDate = new Date(scenarioInfo.simulation_date);
    simulationDate.setHours(0, 0, 0, 0); // Start of simulation day
    
    console.log('Starting database queries...');
    console.log('Filtering for dates >= ', simulationDate.toISOString());

    // Query 1: binding_constraints_report - Only from simulation date onwards
    console.log('Query 1: binding_constraints_report');
    const bindingConstraints = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, congestion 
      FROM binding_constraints_report 
      WHERE itemid = 66038 AND scenarioid = ${scenarioid} AND "Date" >= ${simulationDate}
    ` as any[];
    console.log('Binding constraints found:', bindingConstraints.length);

    // Query 2: transmission_constraint_characteristics  
    console.log('Query 2: transmission_constraint_characteristics');
    const constraintMapping = await prisma.$queryRaw`
      SELECT constraintid, constraintname, constrainttype 
      FROM transmission_constraint_characteristics 
      WHERE scenarioid = ${scenarioid}
    ` as any[];
    console.log('Constraint mappings found:', constraintMapping.length);

    // Query 3: results_constraints - Only from simulation date onwards
    console.log('Query 3: results_constraints');
    const shadowPrices = await prisma.$queryRaw`
      SELECT "Date", "Hour", constraintid, shadowprice 
      FROM results_constraints 
      WHERE scenarioid = ${scenarioid} AND "Date" >= ${simulationDate}
    ` as any[];
    console.log('Shadow prices found:', shadowPrices.length);

    // Query 4: results_units - Only from simulation date onwards
    console.log('Query 4: results_units');
    const resultsUnit = await prisma.$queryRaw`
      SELECT "Date", "Hour", congestion 
      FROM results_units 
      WHERE unitid = 66038 AND scenarioid = ${scenarioid} AND "Date" >= ${simulationDate}
    ` as any[];
    console.log('Results units found:', resultsUnit.length);

    if (bindingConstraints.length === 0) {
      console.log('No binding constraints data found for unitid 66038 and scenarioid', scenarioid);
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing data...');

    // Debug: Check sample binding constraints data
    console.log('Sample binding constraints data:');
    console.log(bindingConstraints.slice(0, 3));
    
    // Debug: Check sample constraint mapping data  
    console.log('Sample constraint mapping data:');
    console.log(constraintMapping.slice(0, 3));
    
    // Debug: Check sample shadow prices data
    console.log('Sample shadow prices data:');
    console.log(shadowPrices.slice(0, 3));
    
    // Debug: Check sample results unit data
    console.log('Sample results unit data:');
    console.log(resultsUnit.slice(0, 3));

    // Step 1: Merge binding constraints with constraint mapping (like Python merge)
    const constraintsWithNames = bindingConstraints.map((bc: any) => {
      const constraintInfo = constraintMapping.find((cm: any) => cm.constraintid === bc.constraintid);
      return {
        Date: bc.Date,
        Hour: bc.Hour,
        constraintid: bc.constraintid,
        congestion: bc.congestion || 0,
        constraintname: constraintInfo?.constraintname || `Constraint ${bc.constraintid}`,
        constrainttype: constraintInfo?.constrainttype || 'Unknown',
      };
    });

    // Step 2: Merge with shadow prices (like Python merge)
    const constraintsWithShadowPrices = constraintsWithNames.map((item: any) => {
      const shadowPriceRecord = shadowPrices.find((sp: any) => 
        sp.Date.getTime() === item.Date.getTime() && 
        sp.Hour === item.Hour && 
        sp.constraintid === item.constraintid
      );
      const shadowprice = shadowPriceRecord?.shadowprice || 0;
      
      return {
        ...item,
        shadowprice,
        shiftFactor: shadowprice !== 0 ? item.congestion / shadowprice : 0,
        datetime: new Date(item.Date.getTime() + (item.Hour * 60 * 60 * 1000)).toISOString(),
      };
    });

    // Step 3: Create pivot structure (like Python pivot)
    // Group by datetime, then create columns for each constraint name
    const datetimeGroups = new Map();
    
    constraintsWithShadowPrices.forEach((item: any) => {
      if (!datetimeGroups.has(item.datetime)) {
        datetimeGroups.set(item.datetime, {});
      }
      // Sum congestion if multiple records for same constraint at same time
      const existing = datetimeGroups.get(item.datetime)[item.constraintname] || 0;
      datetimeGroups.get(item.datetime)[item.constraintname] = existing + item.congestion;
    });

    // Step 4: Get all unique constraint names (like constraints_list in Python)
    const allConstraintNames = [...new Set(constraintsWithShadowPrices.map((item: any) => item.constraintname))];
    console.log('Unique constraint names:', allConstraintNames);

    // Step 5: Merge with results_units for total congestion (like Python merge)
    const totalCongestionMap = new Map();
    resultsUnit.forEach((ru: any) => {
      const datetime = new Date(ru.Date.getTime() + (ru.Hour * 60 * 60 * 1000)).toISOString();
      totalCongestionMap.set(datetime, ru.congestion || 0);
    });

    // Step 6: Build final result array (like res_df in Python)
    const resultData = Array.from(datetimeGroups.keys())
      .sort()
      .map((datetime: string) => {
        const constraintData = datetimeGroups.get(datetime);
        const totalCongestion = totalCongestionMap.get(datetime) || 0;
        
        const row: any = {
          datetime: datetime,
          'Total Congestion': totalCongestion,
        };

        // Add each constraint as a column (like pivot in Python)
        let sumConstraints = 0;
        allConstraintNames.forEach((constraintName: string) => {
          const congestionValue = constraintData[constraintName] || 0;
          row[constraintName] = congestionValue;
          sumConstraints += congestionValue;
        });

        // Calculate "Other" category (like Python: Total - sum(constraints))
        row['Other'] = totalCongestion - sumConstraints;

        return row;
      });

    console.log('Final result data points:', resultData.length);
    console.log('Sample data point:', resultData[0]);
    
    // Debug: Check a few more sample data points
    console.log('More sample data points:');
    console.log(resultData.slice(0, 3));
    
    // Debug: Check constraint sums vs total
    if (resultData.length > 0) {
      const samplePoint = resultData[Math.floor(resultData.length / 2)]; // Middle point
      const constraintSum = allConstraintNames.reduce((sum, name) => sum + (samplePoint[name] || 0), 0);
      console.log('Debug sample point analysis:');
      console.log('Total Congestion:', samplePoint['Total Congestion']);
      console.log('Sum of constraints:', constraintSum);
      console.log('Other:', samplePoint['Other']);
      console.log('Math check:', constraintSum + samplePoint['Other'], 'should equal', samplePoint['Total Congestion']);
    }

    // Create metadata for enhanced tooltips
    const constraintDetails = constraintsWithShadowPrices.reduce((acc: any, item: any) => {
      if (!acc[item.constraintname]) {
        acc[item.constraintname] = {};
      }
      acc[item.constraintname][item.datetime] = {
        shiftFactor: item.shiftFactor,
        shadowprice: item.shadowprice,
      };
      return acc;
    }, {});

    const metadata = {
      constraintNames: allConstraintNames,
      constraintDetails: constraintDetails,
    };

    console.log('=== API Success ===');
    return new Response(JSON.stringify({ 
      scenarioid, 
      data: resultData,
      metadata: metadata,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== Database error in congestion-plot API ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch congestion data from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}; 