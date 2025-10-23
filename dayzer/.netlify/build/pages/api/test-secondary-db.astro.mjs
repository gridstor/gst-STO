import { Pool } from 'pg';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  console.log("Test secondary DB endpoint called");
  let pool = null;
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL_SECONDARY
    });
    console.log("PostgreSQL connection pool created");
    const countResult = await pool.query("SELECT COUNT(*) FROM yes_fundamentals");
    const totalRecords = parseInt(countResult.rows[0].count);
    console.log("Total records in yes_fundamentals:", totalRecords);
    const sampleResult = await pool.query(`
      SELECT entity, attribute, utc_datetime_ib, value 
      FROM yes_fundamentals 
      LIMIT 5
    `);
    console.log("Sample records:", sampleResult.rows);
    const entitiesResult = await pool.query(`
      SELECT DISTINCT entity 
      FROM yes_fundamentals 
      LIMIT 20
    `);
    const attributesResult = await pool.query(`
      SELECT DISTINCT attribute 
      FROM yes_fundamentals 
      LIMIT 20
    `);
    return new Response(JSON.stringify({
      success: true,
      totalRecords,
      sampleRecords: sampleResult.rows,
      availableEntities: entitiesResult.rows.map((row) => row.entity),
      availableAttributes: attributesResult.rows.map((row) => row.attribute)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Secondary DB test failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
