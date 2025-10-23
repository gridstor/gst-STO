import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
export { renderers } from '../../renderers.mjs';

const prisma = new PrismaClient();
const LIKEDAY_MAP = {
  "RT Load": "RTLOAD:10000328798",
  "RT Net Load": "RTLOAD_NET_OF_RENEWABLES:10000328798",
  "RT LMP": "RTLMP:20000001321",
  "RT Energy": "RTENERGY:20000001321",
  "RT Congestion": "RTCONG:20000001321",
  "DA LMP": "DALMP:20000001321",
  "DA Load": "DA_DEMAND_FORECAST:10000328798",
  "DA Net Load": "DA%20NET%20DEMAND%20FC:10000328798:today+48hours"
};
const POST = async ({ request }) => {
  try {
    const params = await request.json();
    console.log("🚀 Secondary analysis for:", params.matchVariable);
    console.log("🚀 Reference date:", params.referenceDate);
    console.log("🚀 Similar days:", params.topSimilarDays);
    const yesAuth = process.env.YES_AUTH || '["nicholas.seah@gridstor.com","Sing@pore2023"]';
    if (!yesAuth) ;
    const credentials = JSON.parse(yesAuth);
    const [username, password] = credentials;
    let referenceData;
    if (params.referenceMode === "forecast") {
      if (!params.scenarioId) {
        return new Response(
          JSON.stringify({ error: "Scenario ID required for forecast mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      referenceData = await fetchForecastData(params.scenarioId, params.referenceDate, params.matchVariable);
      if (!referenceData || referenceData.length === 0) {
        return new Response(
          JSON.stringify({ error: "No forecast data found for the selected scenario and date" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      const urlItem2 = LIKEDAY_MAP[params.matchVariable];
      referenceData = await fetchYESEnergyData(
        username,
        password,
        params.referenceDate,
        params.referenceDate,
        urlItem2
      );
      if (!referenceData || referenceData.length === 0) {
        return new Response(
          JSON.stringify({ error: "No data found for reference date" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    const chartData = {};
    chartData[params.matchVariable] = {};
    chartData[params.matchVariable][params.referenceDate] = referenceData;
    const urlItem = LIKEDAY_MAP[params.matchVariable];
    for (const day of params.topSimilarDays) {
      const dayData = await fetchYESEnergyData(username, password, day, day, urlItem);
      if (dayData && dayData.length > 0) {
        chartData[params.matchVariable][day] = dayData;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return new Response(JSON.stringify({
      success: true,
      variable: params.matchVariable,
      chartData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Secondary analysis error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to perform secondary analysis",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
async function fetchYESEnergyData(username, password, startDate, endDate, item) {
  const url = `https://services.yesenergy.com/PS/rest/timeseries/multiple.html?agglevel=hour&startdate=${startDate}&enddate=${endDate}&timezone=PST&items=${item}`;
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
  const parsedData = parseHtmlTable(htmlText);
  return parsedData;
}
function parseHtmlTable(html) {
  const $ = cheerio.load(html);
  const tables = $("table");
  if (tables.length === 0) return [];
  const table = tables.first();
  const data = [];
  let headers = [];
  table.find("thead tr, tr").first().find("th, td").each((i, el) => {
    headers.push($(el).text().trim());
  });
  table.find("tbody tr, tr").each((rowIndex, row) => {
    if (rowIndex === 0 && table.find("thead").length > 0) return;
    const rowData = {};
    let hasData = false;
    $(row).find("td, th").each((cellIndex, cell) => {
      const cellValue = $(cell).text().trim();
      const headerName = headers[cellIndex];
      if (headerName && cellValue) {
        hasData = true;
        if (isDateString(cellValue) || isTextValue(cellValue)) {
          rowData[headerName] = cellValue;
        } else {
          const numValue = parseFloat(cellValue);
          rowData[headerName] = isNaN(numValue) ? cellValue : numValue;
        }
      }
    });
    if (hasData) {
      const processedRow = convertYESEnergyUnits(rowData);
      data.push(processedRow);
    }
  });
  return data;
}
function convertYESEnergyUnits(rowData) {
  return rowData;
}
function isDateString(value) {
  return /^\d{1,2}\/\d{1,2}\/\d{4}(\s\d{1,2}:\d{2}:\d{2})?$/.test(value);
}
function isTextValue(value) {
  const textValues = [
    "ONPEAK",
    "OFFPEAK",
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER"
  ];
  return textValues.includes(value.toUpperCase());
}
async function fetchForecastData(scenarioId, referenceDate, matchVariable) {
  try {
    const targetDate = new Date(referenceDate);
    switch (matchVariable) {
      case "RT LMP":
        const lmpResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            energy: true,
            congestion: true,
            losses: true
          }
        });
        return lmpResults.map((row) => ({
          DATETIME: `${row.Date.toISOString().split("T")[0]} ${String(row.Hour).padStart(2, "0")}:00:00`,
          MARKETDAY: row.Date.toISOString().split("T")[0],
          HOURENDING: row.Hour,
          "GOLETA_6_N100 (RTLMP)": (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
        }));
      case "RT Energy":
        const energyResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            energy: true
          }
        });
        return energyResults.map((row) => ({
          DATETIME: `${row.Date.toISOString().split("T")[0]} ${String(row.Hour).padStart(2, "0")}:00:00`,
          MARKETDAY: row.Date.toISOString().split("T")[0],
          HOURENDING: row.Hour,
          "GOLETA_6_N100 (RTENERGY)": row.energy || 0
        }));
      case "RT Congestion":
        const congestionResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            congestion: true
          }
        });
        return congestionResults.map((row) => ({
          DATETIME: `${row.Date.toISOString().split("T")[0]} ${String(row.Hour).padStart(2, "0")}:00:00`,
          MARKETDAY: row.Date.toISOString().split("T")[0],
          HOURENDING: row.Hour,
          "GOLETA_6_N100 (RTCONG)": row.congestion || 0
        }));
      case "RT Load":
        const loadResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            demandmw: true
          }
        });
        const loadByHour = {};
        loadResults.forEach((row) => {
          if (!loadByHour[row.Hour]) {
            loadByHour[row.Hour] = 0;
          }
          loadByHour[row.Hour] += row.demandmw || 0;
        });
        return Object.keys(loadByHour).map((hour) => ({
          DATETIME: `${targetDate.toISOString().split("T")[0]} ${String(hour).padStart(2, "0")}:00:00`,
          MARKETDAY: targetDate.toISOString().split("T")[0],
          HOURENDING: parseInt(hour),
          "CAISO (RTLOAD)": loadByHour[parseInt(hour)]
          // Keep in MW
        }));
      case "RT Net Load":
        const netLoadDemandResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            demandmw: true
          }
        });
        const renewableResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
            OR: [
              { fuelname: "sun" },
              { fuelname: "Sun" },
              { fuelname: "wind" },
              { fuelname: "Wind" }
            ]
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            fuelname: true,
            generationmw: true
          }
        });
        const demandByHour = {};
        const renewableByHour = {};
        netLoadDemandResults.forEach((row) => {
          if (!demandByHour[row.Hour]) demandByHour[row.Hour] = 0;
          demandByHour[row.Hour] += row.demandmw || 0;
        });
        renewableResults.forEach((row) => {
          if (!renewableByHour[row.Hour]) renewableByHour[row.Hour] = 0;
          renewableByHour[row.Hour] += row.generationmw || 0;
        });
        return Object.keys(demandByHour).map((hour) => {
          const hourNum = parseInt(hour);
          const demandMW = demandByHour[hourNum];
          const renewableMW = renewableByHour[hourNum] || 0;
          const netLoadMW = demandMW - renewableMW;
          return {
            DATETIME: `${targetDate.toISOString().split("T")[0]} ${String(hourNum).padStart(2, "0")}:00:00`,
            MARKETDAY: targetDate.toISOString().split("T")[0],
            HOURENDING: hourNum,
            "CAISO (RTLOAD_NET_OF_RENEWABLES)": netLoadMW
          };
        });
      case "DA LMP":
        const daLmpResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            energy: true,
            congestion: true,
            losses: true
          }
        });
        return daLmpResults.map((row) => ({
          DATETIME: `${row.Date.toISOString().split("T")[0]} ${String(row.Hour).padStart(2, "0")}:00:00`,
          MARKETDAY: row.Date.toISOString().split("T")[0],
          HOURENDING: row.Hour,
          "GOLETA_6_N100 (DALMP)": (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
        }));
      case "DA Load":
        const daLoadResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            demandmw: true
          }
        });
        const daLoadByHour = {};
        daLoadResults.forEach((row) => {
          if (!daLoadByHour[row.Hour]) {
            daLoadByHour[row.Hour] = 0;
          }
          daLoadByHour[row.Hour] += row.demandmw || 0;
        });
        return Object.keys(daLoadByHour).map((hour) => ({
          DATETIME: `${targetDate.toISOString().split("T")[0]} ${String(hour).padStart(2, "0")}:00:00`,
          MARKETDAY: targetDate.toISOString().split("T")[0],
          HOURENDING: parseInt(hour),
          "CAISO (DA_DEMAND_FORECAST)": daLoadByHour[parseInt(hour)]
          // Keep in MW
        }));
      case "DA Net Load":
        const daNetLoadDemandResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            demandmw: true
          }
        });
        const daRenewableResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
            OR: [
              { fuelname: "sun" },
              { fuelname: "Sun" },
              { fuelname: "wind" },
              { fuelname: "Wind" }
            ]
          },
          orderBy: { Hour: "asc" },
          select: {
            Date: true,
            Hour: true,
            fuelname: true,
            generationmw: true
          }
        });
        const daDemandByHour = {};
        const daRenewableByHour = {};
        daNetLoadDemandResults.forEach((row) => {
          if (!daDemandByHour[row.Hour]) daDemandByHour[row.Hour] = 0;
          daDemandByHour[row.Hour] += row.demandmw || 0;
        });
        daRenewableResults.forEach((row) => {
          if (!daRenewableByHour[row.Hour]) daRenewableByHour[row.Hour] = 0;
          daRenewableByHour[row.Hour] += row.generationmw || 0;
        });
        return Object.keys(daDemandByHour).map((hour) => {
          const hourNum = parseInt(hour);
          const demandMW = daDemandByHour[hourNum];
          const renewableMW = daRenewableByHour[hourNum] || 0;
          const netLoadMW = demandMW - renewableMW;
          return {
            DATETIME: `${targetDate.toISOString().split("T")[0]} ${String(hourNum).padStart(2, "0")}:00:00`,
            MARKETDAY: targetDate.toISOString().split("T")[0],
            HOURENDING: hourNum,
            "CAISO (DA NET DEMAND FC)": netLoadMW
          };
        });
      default:
        console.error("Unknown match variable:", matchVariable);
        return [];
    }
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return [];
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
