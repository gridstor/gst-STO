import * as cheerio from 'cheerio';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  try {
    console.log("process.env keys:", Object.keys(process.env));
    console.log("process.env.YES_AUTH:", process.env.YES_AUTH);
    console.log("import.meta.env.YES_AUTH:", '["nicholas.seah@gridstor.com","Sing@pore2023"]');
    const yesAuth = process.env.YES_AUTH || '["nicholas.seah@gridstor.com","Sing@pore2023"]';
    if (!yesAuth) ;
    const credentials = JSON.parse(yesAuth);
    const [username, password] = credentials;
    const url = "https://services.yesenergy.com/PS/rest/timeseries/multiple.html?agglevel=hour&startdate=2025-07-09&items=RTLMP:10000697077";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`YES Energy API responded with status: ${response.status}`);
    }
    const htmlText = await response.text();
    console.log("YES Energy API response length:", htmlText.length);
    const processedData = parseHtmlTable(htmlText);
    return new Response(JSON.stringify({
      success: true,
      data: processedData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("YES Energy API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch data from YES Energy API",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
function parseHtmlTable(html) {
  try {
    const $ = cheerio.load(html);
    const tables = $("table");
    if (tables.length === 0) {
      console.log("No tables found in HTML response");
      return [];
    }
    console.log(`Found ${tables.length} table(s) in HTML response`);
    const table = tables.first();
    const data = [];
    let headers = [];
    table.find("thead tr, tr").first().find("th, td").each((i, el) => {
      headers.push($(el).text().trim());
    });
    console.log("Headers found:", headers);
    table.find("tbody tr, tr").each((rowIndex, row) => {
      if (rowIndex === 0 && table.find("thead").length > 0) {
        return;
      }
      const rowData = {};
      let hasData = false;
      $(row).find("td, th").each((cellIndex, cell) => {
        const cellValue = $(cell).text().trim();
        const headerName = headers[cellIndex];
        if (headerName && cellValue) {
          hasData = true;
          const numValue = parseFloat(cellValue);
          rowData[headerName] = isNaN(numValue) ? cellValue : numValue;
        }
      });
      if (hasData) {
        data.push(rowData);
      }
    });
    console.log(`Parsed ${data.length} rows of data`);
    console.log("Sample data:", data.slice(0, 2));
    return data;
  } catch (error) {
    console.error("Error parsing HTML table:", error);
    return [];
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
