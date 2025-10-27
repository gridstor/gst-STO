import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const GET: APIRoute = async () => {
  const startTime = performance.now();
  
  try {
    // Test Primary Database
    const primaryStart = performance.now();
    const primaryTests = await testPrimaryDatabase();
    const primaryLatency = Math.round(performance.now() - primaryStart);

    // Test Secondary Database
    const secondaryStart = performance.now();
    const secondaryTests = await testSecondaryDatabase();
    const secondaryLatency = Math.round(performance.now() - secondaryStart);

    // Test Third Database
    const thirdStart = performance.now();
    const thirdTests = await testThirdDatabase();
    const thirdLatency = Math.round(performance.now() - thirdStart);

    const totalLatency = Math.round(performance.now() - startTime);

    // Determine overall status based on all databases
    let overallStatus = 'healthy';
    if (primaryTests.status === 'error' || secondaryTests.status === 'error' || thirdTests.status === 'error') {
      overallStatus = 'error';
    } else if (primaryTests.status === 'warning' || secondaryTests.status === 'warning' || thirdTests.status === 'warning') {
      overallStatus = 'warning';
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalLatency,
      databases: {
        primary: {
          ...primaryTests,
          latency: primaryLatency
        },
        secondary: {
          ...secondaryTests,
          latency: secondaryLatency
        },
        third: {
          ...thirdTests,
          latency: thirdLatency
        }
      },
      summary: {
        totalScenarios: primaryTests.scenariosCount || 0,
        latestScenario: primaryTests.latestScenario,
        latestScenarioName: primaryTests.latestScenarioName,
        dataDateRange: primaryTests.dateRange,
        lastUpdatedDatetime: primaryTests.lastUpdatedDatetime
      },
      recommendations: generateRecommendations(primaryTests, secondaryTests, thirdTests)
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check database connections and .env configuration'
    }, null, 2), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function testPrimaryDatabase() {
  try {
    console.log('Testing primary database connection...');
    
    // First, try a simple connection test
    await prisma.$connect();
    console.log('Primary database connected successfully');
    
    // Get scenario count
    const scenariosCount = await prisma.info_scenarioid_scenarioname_mapping.count();
    console.log('Scenarios count:', scenariosCount);
    
    // Get latest scenario
    const latestScenario = await prisma.info_scenarioid_scenarioname_mapping.findFirst({
      orderBy: { scenarioid: 'desc' },
      select: {
        scenarioid: true,
        simulation_date: true,
        scenarioname: true
      }
    });
    console.log('Latest scenario:', latestScenario);

    // Get table row counts for the LATEST SCENARIO ONLY (filtered by scenarioid)
    const latestScenarioId = latestScenario?.scenarioid;
    
    const [
      zoneDemandCount,
      resultsZonesCount,
      resultsUnitsCount,
      resultsConstraintsCount,
      resultsReservesCount,
      bindingConstraintsCount,
      zoneNameMappingsCount
    ] = await Promise.all([
      latestScenarioId ? prisma.zone_demand.count({ where: { scenarioid: latestScenarioId } }) : 0,
      latestScenarioId ? prisma.results_zones.count({ where: { scenarioid: latestScenarioId } }) : 0,
      latestScenarioId ? prisma.results_units.count({ where: { scenarioid: latestScenarioId } }) : 0,
      latestScenarioId ? prisma.results_constraints.count({ where: { scenarioid: latestScenarioId } }) : 0,
      latestScenarioId ? prisma.results_reserves.count({ where: { scenarioid: latestScenarioId } }) : 0,
      latestScenarioId ? prisma.binding_constraints_report.count({ where: { scenarioid: latestScenarioId } }) : 0,
      prisma.info_zoneid_zonename_mapping.count() // Not filtered - mapping table
    ]);

    const tables = {
      info_scenarioid_scenarioname_mapping: { 
        rows: scenariosCount, 
        status: scenariosCount > 0 ? 'healthy' : 'warning',
        description: 'Scenario metadata (all scenarios)'
      },
      info_zoneid_zonename_mapping: { 
        rows: zoneNameMappingsCount, 
        status: zoneNameMappingsCount > 0 ? 'healthy' : 'warning',
        description: 'Zone name mappings (all zones)'
      },
      zone_demand: { 
        rows: zoneDemandCount, 
        status: zoneDemandCount > 0 ? 'healthy' : 'warning',
        description: `Load/demand data (scenario #${latestScenarioId})`
      },
      results_zones: { 
        rows: resultsZonesCount, 
        status: resultsZonesCount > 0 ? 'healthy' : 'warning',
        description: `Zone-level results (scenario #${latestScenarioId})`
      },
      results_units: { 
        rows: resultsUnitsCount, 
        status: resultsUnitsCount > 0 ? 'healthy' : 'warning',
        description: `Unit/generation results (scenario #${latestScenarioId})`
      },
      results_constraints: { 
        rows: resultsConstraintsCount, 
        status: resultsConstraintsCount > 0 ? 'healthy' : 'warning',
        description: `Constraint flows (scenario #${latestScenarioId})`
      },
      results_reserves: { 
        rows: resultsReservesCount, 
        status: resultsReservesCount > 0 ? 'healthy' : 'warning',
        description: `Reserve results (scenario #${latestScenarioId})`
      },
      binding_constraints_report: { 
        rows: bindingConstraintsCount, 
        status: bindingConstraintsCount > 0 ? 'healthy' : 'warning',
        description: `Binding constraints (scenario #${latestScenarioId})`
      }
    };

    // Use simulation_date from info_scenarioid_scenarioname_mapping table
    const lastUpdatedDatetime = latestScenario?.simulation_date 
      ? new Date(latestScenario.simulation_date).toISOString()
      : null;
    
    console.log('Last updated datetime:', lastUpdatedDatetime, 'from simulation_date field');

    // Get date range from actual forecast data if scenario exists
    let dateRange = null;
    if (latestScenario) {
      const dateRangeResult = await prisma.results_zones.aggregate({
        where: { scenarioid: latestScenario.scenarioid },
        _min: { Date: true },
        _max: { Date: true }
      });
      
      if (dateRangeResult._min.Date && dateRangeResult._max.Date) {
        dateRange = {
          start: dateRangeResult._min.Date.toISOString().split('T')[0],
          end: dateRangeResult._max.Date.toISOString().split('T')[0]
        };
      }
    }

    return {
      status: scenariosCount > 0 ? 'healthy' : 'warning',
      connected: true,
      scenariosCount,
      latestScenario: latestScenario?.scenarioid,
      latestScenarioName: latestScenario?.scenarioname,
      dateRange,
      lastUpdatedDatetime,
      tables
    };
  } catch (error) {
    console.error('Primary database test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      tables: {}
    };
  }
}

async function testSecondaryDatabase() {
  let secondaryPool: Pool | null = null;
  
  try {
    console.log('Testing secondary database connection...');
    console.log('Secondary DB URL exists:', !!process.env.DATABASE_URL_SECONDARY);
    
    // Create secondary database connection for CAISO data
    secondaryPool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Secondary pool created, testing connection...');

    // Get latest data timestamp from YES Energy fundamentals
    const latestYESResult = await secondaryPool.query(
      'SELECT local_datetime_ib FROM yes_fundamentals ORDER BY local_datetime_ib DESC LIMIT 1'
    );
    const latestYES = latestYESResult.rows[0]?.local_datetime_ib;
    
    // Calculate date range for last week (7 days back from latest)
    let lastWeekStart = null;
    let lastWeekEnd = null;
    if (latestYES) {
      lastWeekEnd = new Date(latestYES);
      lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    }

    // Get row counts filtered to last week
    const yesFundamentalsLastWeekResult = await secondaryPool.query(
      'SELECT COUNT(*) FROM yes_fundamentals WHERE local_datetime_ib >= $1 AND local_datetime_ib <= $2',
      [lastWeekStart?.toISOString(), lastWeekEnd?.toISOString()]
    );
    const yesFundamentalsLastWeekCount = lastWeekStart ? parseInt(yesFundamentalsLastWeekResult.rows[0].count) : 0;

    const tables = {
      yes_fundamentals: { 
        rows: yesFundamentalsLastWeekCount, 
        status: yesFundamentalsLastWeekCount > 0 ? 'healthy' : 'warning',
        description: 'YES Energy/CAISO fundamentals (last 7 days)'
      }
    };

    // Check data freshness (warn if > 7 days old)
    const isStale = latestYES 
      ? (Date.now() - new Date(latestYES).getTime()) > (7 * 24 * 60 * 60 * 1000)
      : true;

    const dateRange = lastWeekStart && lastWeekEnd ? {
      start: lastWeekStart.toISOString().split('T')[0],
      end: lastWeekEnd.toISOString().split('T')[0]
    } : null;

    const latestDate = latestYES ? new Date(latestYES).toISOString().split('T')[0] : null;

    return {
      status: yesFundamentalsLastWeekCount > 0 && !isStale ? 'healthy' : 'warning',
      connected: true,
      tables,
      dataFreshness: isStale ? 'stale' : 'current',
      latestDate,
      dateRange
    };
  } catch (error) {
    console.error('Secondary database test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      tables: {}
    };
  } finally {
    if (secondaryPool) {
      try {
        await secondaryPool.end();
        console.log('Secondary pool connection closed');
      } catch (err) {
        console.error('Error closing secondary pool:', err);
      }
    }
  }
}

async function testThirdDatabase() {
  let thirdPool: Pool | null = null;
  
  try {
    console.log('Testing third database connection...');
    console.log('Third DB URL exists:', !!process.env.DATABASE_URL_THIRD);
    
    if (!process.env.DATABASE_URL_THIRD) {
      console.log('DATABASE_URL_THIRD not configured');
      return {
        status: 'warning',
        connected: false,
        error: 'DATABASE_URL_THIRD not configured',
        tables: {}
      };
    }
    
    // Create third database connection for ERCOT/Weather data
    thirdPool = new Pool({
      connectionString: process.env.DATABASE_URL_THIRD,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Third pool created, testing connection...');

    // Get latest data timestamp from Goleta Weather Forecast
    const latestWeatherResult = await thirdPool.query(
      'SELECT "DATETIME_HE" FROM "ERCOT"."Goleta_Weather_Forecast" ORDER BY "DATETIME_HE" DESC LIMIT 1'
    );
    const latestWeather = latestWeatherResult.rows[0]?.DATETIME_HE;
    
    // Calculate date range for last week (7 days back from latest)
    let lastWeekStart = null;
    let lastWeekEnd = null;
    if (latestWeather) {
      lastWeekEnd = new Date(latestWeather);
      lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    }

    // Get row counts filtered to last week
    const weatherForecastCountResult = await thirdPool.query(
      'SELECT COUNT(*) FROM "ERCOT"."Goleta_Weather_Forecast" WHERE "DATETIME_HE" >= $1 AND "DATETIME_HE" <= $2',
      [lastWeekStart?.toISOString(), lastWeekEnd?.toISOString()]
    );
    const weatherForecastCount = lastWeekStart ? parseInt(weatherForecastCountResult.rows[0].count) : 0;

    const yesPullsCountResult = await thirdPool.query(
      'SELECT COUNT(*) FROM "ERCOT"."Goleta_YES_Pulls" WHERE "DATETIME_HE" >= $1 AND "DATETIME_HE" <= $2',
      [lastWeekStart?.toISOString(), lastWeekEnd?.toISOString()]
    );
    const yesPullsCount = lastWeekStart ? parseInt(yesPullsCountResult.rows[0].count) : 0;

    const tables = {
      'Goleta_Weather_Forecast': { 
        rows: weatherForecastCount, 
        status: weatherForecastCount > 0 ? 'healthy' : 'warning',
        description: 'Temperature forecasts (last 7 days)'
      },
      'Goleta_YES_Pulls': {
        rows: yesPullsCount,
        status: yesPullsCount > 0 ? 'healthy' : 'warning',
        description: 'Weather actuals & CAISO load (last 7 days)'
      }
    };

    // Check data freshness (warn if > 7 days old)
    const isStale = latestWeather 
      ? (Date.now() - new Date(latestWeather).getTime()) > (7 * 24 * 60 * 60 * 1000)
      : true;

    const dateRange = lastWeekStart && lastWeekEnd ? {
      start: lastWeekStart.toISOString().split('T')[0],
      end: lastWeekEnd.toISOString().split('T')[0]
    } : null;

    const latestDate = latestWeather ? new Date(latestWeather).toISOString().split('T')[0] : null;

    return {
      status: weatherForecastCount > 0 && !isStale ? 'healthy' : 'warning',
      connected: true,
      tables,
      dataFreshness: isStale ? 'stale' : 'current',
      latestDate,
      dateRange
    };
  } catch (error) {
    console.error('Third database test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      tables: {}
    };
  } finally {
    if (thirdPool) {
      try {
        await thirdPool.end();
        console.log('Third pool connection closed');
      } catch (err) {
        console.error('Error closing third pool:', err);
      }
    }
  }
}

function generateRecommendations(primaryTests: any, secondaryTests: any, thirdTests: any): string[] {
  const recommendations: string[] = [];

  if (primaryTests.status === 'error') {
    recommendations.push('❌ DZNode database connection failed - check DATABASE_URL in .env');
  } else if (primaryTests.scenariosCount === 0) {
    recommendations.push('⚠️ No scenarios found in DZNode database - data may need to be imported');
  }

  if (secondaryTests.status === 'error') {
    recommendations.push('❌ Postgres database connection failed - check SECONDARY_DATABASE_URL in .env');
  } else if (secondaryTests.dataFreshness === 'stale') {
    recommendations.push('⚠️ Postgres database data is stale (>7 days old) - consider refreshing CAISO data');
  }

  if (thirdTests.status === 'error') {
    recommendations.push('❌ Analytics database connection failed - check DATABASE_URL_THIRD in .env');
  } else if (!thirdTests.connected) {
    recommendations.push('⚠️ Analytics database not configured - weather forecast features will be unavailable');
  } else if (thirdTests.dataFreshness === 'stale') {
    recommendations.push('⚠️ Analytics database data is stale (>7 days old) - consider refreshing weather data');
  }

  if (primaryTests.status === 'healthy' && secondaryTests.status === 'healthy' && thirdTests.status === 'healthy') {
    recommendations.push('✅ All systems operational - databases are healthy and connected');
  }

  return recommendations;
}

