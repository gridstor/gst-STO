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
    if (!validateInputs(params)) {
      return new Response(
        JSON.stringify({ error: "Invalid input parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
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
      console.log("🚀 ENTERING FORECAST MODE");
      console.log("🚀 Scenario ID:", params.scenarioId);
      console.log("🚀 Reference Date:", params.referenceDate);
      console.log("🚀 Match Variable:", params.matchVariable);
      console.log("Fetching forecast data for scenario:", params.scenarioId, "date:", params.referenceDate);
      referenceData = await fetchForecastData(params.scenarioId, params.referenceDate, params.matchVariable);
      console.log("🔥 Forecast data returned:", referenceData?.length || 0, "records");
      if (referenceData && referenceData.length > 0) {
        console.log("🔥 First forecast record:", referenceData[0]);
        console.log("🔥 Forecast data keys:", Object.keys(referenceData[0]));
      }
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
    console.log("Fetching historical data from:", params.startDate, "to:", params.endDate);
    const urlItem = LIKEDAY_MAP[params.matchVariable];
    const historicalData = await fetchYESEnergyData(
      username,
      password,
      params.startDate,
      params.endDate,
      urlItem
    );
    console.log("Historical data count:", historicalData.length);
    if (!historicalData || historicalData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No historical data found for date range" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("Pivoting data...");
    const referencePivot = pivotDataframe(referenceData);
    const historicalPivot = pivotDataframe(historicalData);
    console.log("Reference pivot keys:", Object.keys(referencePivot));
    console.log("Historical pivot keys (first 10):", Object.keys(historicalPivot).slice(0, 10));
    const similarities = calculateDistances(historicalPivot, referencePivot);
    const rankedDays = rankDays(similarities, params.euclideanWeight);
    const topSimilarDays = rankedDays.slice(0, params.topN);
    let allVariableData;
    if (params.referenceMode === "forecast") {
      allVariableData = await fetchSingleVariableData(
        username,
        password,
        params.scenarioId,
        params.referenceDate,
        topSimilarDays.map((d) => d.day),
        params.matchVariable,
        "mixed"
      );
    } else {
      allVariableData = await fetchSingleVariableData(
        username,
        password,
        null,
        params.referenceDate,
        topSimilarDays.map((d) => d.day),
        params.matchVariable,
        "historical"
      );
    }
    console.log("📈 Final chart data keys:", Object.keys(allVariableData));
    console.log("📈 Match variable chart data:", Object.keys(allVariableData[params.matchVariable] || {}));
    if (allVariableData[params.matchVariable]) {
      console.log("📈 Reference date data sample:", allVariableData[params.matchVariable][params.referenceDate]?.slice(0, 3));
      const firstSimilarDay = topSimilarDays[0]?.day;
      if (firstSimilarDay) {
        console.log("📈 First similar day data sample:", allVariableData[params.matchVariable][firstSimilarDay]?.slice(0, 3));
      }
      console.log("📈 All dates in chart data:", Object.keys(allVariableData[params.matchVariable]));
    }
    return new Response(JSON.stringify({
      success: true,
      referenceDate: params.referenceDate,
      referenceMode: params.referenceMode,
      matchVariable: params.matchVariable,
      topN: params.topN,
      euclideanWeight: params.euclideanWeight,
      similarityScores: topSimilarDays,
      chartData: allVariableData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Likeday analysis error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to perform likeday analysis",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
function validateInputs(params) {
  if (!params.referenceDate || !params.startDate || !params.endDate) return false;
  if (!params.matchVariable || !LIKEDAY_MAP[params.matchVariable]) return false;
  if (params.topN < 1 || params.topN > 20) return false;
  if (params.euclideanWeight < 0 || params.euclideanWeight > 1) return false;
  if (!params.referenceMode || !["historical", "forecast"].includes(params.referenceMode)) return false;
  if (params.referenceMode === "forecast") {
    if (!params.scenarioId || typeof params.scenarioId !== "number") return false;
  }
  if (params.referenceMode === "historical") {
    const refDate = new Date(params.referenceDate);
    const today = /* @__PURE__ */ new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (refDate > yesterday) return false;
  }
  return true;
}
async function fetchYESEnergyData(username, password, startDate, endDate, item) {
  const url = `https://services.yesenergy.com/PS/rest/timeseries/multiple.html?agglevel=hour&startdate=${startDate}&enddate=${endDate}&timezone=PST&items=${item}`;
  console.log("YES Energy API URL:", url);
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
  console.log("YES Energy response length:", htmlText.length);
  const parsedData = parseHtmlTable(htmlText);
  console.log("Parsed data points:", parsedData.length);
  if (parsedData.length > 0) {
    console.log("Sample parsed data:", parsedData.slice(0, 3));
  }
  const filteredData = parsedData.filter((row) => {
    return typeof row.HOURENDING === "number" && !isNaN(row.HOURENDING);
  });
  console.log("Filtered data points (after removing headers):", filteredData.length);
  return filteredData;
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
function pivotDataframe(data) {
  const result = {};
  const valueColumn = Object.keys(data[0]).find((col) => col.includes("("));
  if (!valueColumn) return result;
  const grouped = {};
  data.forEach((row) => {
    const day = row.MARKETDAY;
    if (!day || typeof day !== "string") return;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(row);
  });
  Object.keys(grouped).forEach((day) => {
    const dayData = grouped[day];
    const hourlyValues = new Array(24).fill(null);
    dayData.forEach((row) => {
      const hour = row.HOURENDING;
      const value = row[valueColumn];
      if (hour >= 1 && hour <= 24) {
        hourlyValues[hour - 1] = value;
      }
    });
    if (hourlyValues.every((val) => val !== null)) {
      result[day] = hourlyValues;
    }
  });
  return result;
}
function calculateDistances(historical, reference) {
  const refDay = Object.keys(reference)[0];
  const refValues = reference[refDay];
  const scores = [];
  Object.keys(historical).forEach((day) => {
    const dayValues = historical[day];
    const euclidean = Math.sqrt(
      dayValues.reduce((sum, val, i) => sum + Math.pow(val - refValues[i], 2), 0)
    );
    const dotProduct = dayValues.reduce((sum, val, i) => sum + val * refValues[i], 0);
    const magnitudeA = Math.sqrt(dayValues.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(refValues.reduce((sum, val) => sum + val * val, 0));
    const cosine = 1 - dotProduct / (magnitudeA * magnitudeB);
    scores.push({
      day,
      euclidean,
      cosine,
      euclidean_z: 0,
      // Will be calculated in rankDays
      cosine_z: 0,
      combined_score: 0,
      rank: 0
    });
  });
  return scores;
}
function rankDays(scores, euclideanWeight) {
  const euclideanValues = scores.map((s) => s.euclidean);
  const cosineValues = scores.map((s) => s.cosine);
  const euclideanMean = euclideanValues.reduce((a, b) => a + b) / euclideanValues.length;
  const cosineMean = cosineValues.reduce((a, b) => a + b) / cosineValues.length;
  const euclideanStd = Math.sqrt(euclideanValues.reduce((sum, val) => sum + Math.pow(val - euclideanMean, 2), 0) / euclideanValues.length);
  const cosineStd = Math.sqrt(cosineValues.reduce((sum, val) => sum + Math.pow(val - cosineMean, 2), 0) / cosineValues.length);
  scores.forEach((score) => {
    score.euclidean_z = (score.euclidean - euclideanMean) / euclideanStd;
    score.cosine_z = (score.cosine - cosineMean) / cosineStd;
    score.combined_score = euclideanWeight * score.euclidean_z + (1 - euclideanWeight) * score.cosine_z;
  });
  scores.sort((a, b) => a.combined_score - b.combined_score);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });
  return scores;
}
async function fetchSingleVariableData(username, password, scenarioId, referenceDate, similarDays, matchVariable, mode) {
  const results = {};
  const variableData = {};
  if (mode === "mixed" && scenarioId) {
    const forecastData = await fetchForecastData(scenarioId, referenceDate, matchVariable);
    if (forecastData && forecastData.length > 0) {
      variableData[referenceDate] = forecastData;
    }
    const item = LIKEDAY_MAP[matchVariable];
    for (const date of similarDays) {
      const historicalData = await fetchYESEnergyData(username, password, date, date, item);
      if (historicalData && historicalData.length > 0) {
        variableData[date] = historicalData;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } else {
    const allDates = [referenceDate, ...similarDays];
    const item = LIKEDAY_MAP[matchVariable];
    for (const date of allDates) {
      const data = await fetchYESEnergyData(username, password, date, date, item);
      if (data && data.length > 0) {
        variableData[date] = data;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  results[matchVariable] = variableData;
  return results;
}
async function fetchForecastData(scenarioId, referenceDate, matchVariable) {
  console.log("⚡ fetchForecastData called with:", { scenarioId, referenceDate, matchVariable });
  try {
    const targetDate = new Date(referenceDate);
    console.log("⚡ Target date created:", targetDate);
    const result = [];
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
        console.log("🔍 Fetching RT Net Load data for scenario:", scenarioId, "date:", referenceDate);
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
        console.log("📊 Demand results count:", netLoadDemandResults.length);
        console.log("📊 First few demand results:", netLoadDemandResults.slice(0, 3));
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
        console.log("🌱 Renewable results count:", renewableResults.length);
        console.log("🌱 First few renewable results:", renewableResults.slice(0, 3));
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
        console.log("📊 Aggregated demand by hour (MW):", demandByHour);
        console.log("🌱 Aggregated renewable by hour (MW):", renewableByHour);
        const netLoadResult = Object.keys(demandByHour).map((hour) => {
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
        console.log("⚡ Final net load result sample:", netLoadResult.slice(0, 3));
        console.log("⚡ Net load values for hours 1-3:", netLoadResult.slice(0, 3).map((r) => r["CAISO (RTLOAD_NET_OF_RENEWABLES)"]));
        return netLoadResult;
      case "DA LMP":
        console.log("🔥 Fetching DA LMP forecast data for scenario:", scenarioId, "date:", targetDate);
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
        console.log("🔥 DA LMP results found:", daLmpResults.length);
        return daLmpResults.map((row) => ({
          DATETIME: `${row.Date.toISOString().split("T")[0]} ${String(row.Hour).padStart(2, "0")}:00:00`,
          MARKETDAY: row.Date.toISOString().split("T")[0],
          HOURENDING: row.Hour,
          "GOLETA_6_N100 (DALMP)": (row.energy || 0) + (row.congestion || 0) + (row.losses || 0)
        }));
      case "DA Load":
        console.log("🔥 Fetching DA Load forecast data for scenario:", scenarioId, "date:", targetDate);
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
        console.log("🔥 DA Load results found:", daLoadResults.length);
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
        console.log("🔥 Fetching DA Net Load forecast data for scenario:", scenarioId, "date:", targetDate);
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
        console.log("🔥 DA Net Load demand results found:", daNetLoadDemandResults.length);
        console.log("🔥 DA Net Load renewable results found:", daRenewableResults.length);
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
