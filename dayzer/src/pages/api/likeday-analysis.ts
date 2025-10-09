import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for Dayzer database access
const prisma = new PrismaClient();

// Variable mapping for YES Energy API
const LIKEDAY_MAP: { [key: string]: string } = {
  "RT Load": 'RTLOAD:10000328798',
  "RT Net Load": 'RTLOAD_NET_OF_RENEWABLES:10000328798',
  "RT LMP": 'RTLMP:20000001321',
  "RT Energy": 'RTENERGY:20000001321',
  "RT Congestion": 'RTCONG:20000001321',
  "DA LMP": 'DALMP:20000001321',
  "DA Load": 'DA_DEMAND_FORECAST:10000328798',
  "DA Net Load": 'DA%20NET%20DEMAND%20FC:10000328798:today+48hours',
};

interface LikedayRequest {
  referenceDate: string;
  startDate: string;
  endDate: string;
  matchVariable: string;
  topN: number;
  euclideanWeight: number;
  referenceMode: 'historical' | 'forecast';
  scenarioId?: number;
  scenarioName?: string;
}

interface YESEnergyDataPoint {
  DATETIME: string;
  MARKETDAY: string;
  HOURENDING: number;
  [key: string]: string | number;
}

interface SimilarityScore {
  day: string;
  euclidean: number;
  cosine: number;
  euclidean_z: number;
  cosine_z: number;
  combined_score: number;
  rank: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const params: LikedayRequest = await request.json();
    
    // Validate inputs
    if (!validateInputs(params)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials for YES Energy (always needed for historical comparison)
    const yesAuth = process.env.YES_AUTH || import.meta.env.YES_AUTH;
    if (!yesAuth) {
      return new Response(
        JSON.stringify({ error: 'YES_AUTH not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const credentials = JSON.parse(yesAuth);
    const [username, password] = credentials;

    let referenceData: YESEnergyDataPoint[];
    
    // Step 1: Fetch reference day data based on mode
    if (params.referenceMode === 'forecast') {
      // Fetch forecast data from Dayzer database
      if (!params.scenarioId) {
        return new Response(
          JSON.stringify({ error: 'Scenario ID required for forecast mode' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('🚀 ENTERING FORECAST MODE');
      console.log('🚀 Scenario ID:', params.scenarioId);
      console.log('🚀 Reference Date:', params.referenceDate);
      console.log('🚀 Match Variable:', params.matchVariable);
      
      console.log('Fetching forecast data for scenario:', params.scenarioId, 'date:', params.referenceDate);
      referenceData = await fetchForecastData(params.scenarioId, params.referenceDate, params.matchVariable);
      
      console.log('🔥 Forecast data returned:', referenceData?.length || 0, 'records');
      if (referenceData && referenceData.length > 0) {
        console.log('🔥 First forecast record:', referenceData[0]);
        console.log('🔥 Forecast data keys:', Object.keys(referenceData[0]));
      }
      
      if (!referenceData || referenceData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No forecast data found for the selected scenario and date' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Historical mode: fetch from YES Energy API
      const urlItem = LIKEDAY_MAP[params.matchVariable];
      referenceData = await fetchYESEnergyData(
        username, 
        password, 
        params.referenceDate, 
        params.referenceDate, 
        urlItem
      );

      if (!referenceData || referenceData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No data found for reference date' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 2: Always fetch historical data from YES Energy for comparison
    console.log('Fetching historical data from:', params.startDate, 'to:', params.endDate);
    const urlItem = LIKEDAY_MAP[params.matchVariable];
    const historicalData = await fetchYESEnergyData(
      username, 
      password, 
      params.startDate, 
      params.endDate, 
      urlItem
    );

    console.log('Historical data count:', historicalData.length);

    if (!historicalData || historicalData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No historical data found for date range' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Pivot data
    console.log('Pivoting data...');
    const referencePivot = pivotDataframe(referenceData);
    const historicalPivot = pivotDataframe(historicalData);

    console.log('Reference pivot keys:', Object.keys(referencePivot));
    console.log('Historical pivot keys (first 10):', Object.keys(historicalPivot).slice(0, 10));

    // Step 4: Calculate similarities
    const similarities = calculateDistances(historicalPivot, referencePivot);
    
    // Step 5: Rank days
    const rankedDays = rankDays(similarities, params.euclideanWeight);
    
    // Step 6: Get top N similar days
    const topSimilarDays = rankedDays.slice(0, params.topN);
    
    // Step 7: Fetch data for only the match variable (optimization)
    let allVariableData;
    if (params.referenceMode === 'forecast') {
      // For forecast mode, fetch only match variable
      allVariableData = await fetchSingleVariableData(
        username, 
        password, 
        params.scenarioId!,
        params.referenceDate, 
        topSimilarDays.map(d => d.day),
        params.matchVariable,
        'mixed'
      );
    } else {
      // Historical mode: fetch only match variable from YES Energy
      allVariableData = await fetchSingleVariableData(
        username, 
        password, 
        null,
        params.referenceDate, 
        topSimilarDays.map(d => d.day),
        params.matchVariable,
        'historical'
      );
    }

    console.log('📈 Final chart data keys:', Object.keys(allVariableData));
    console.log('📈 Match variable chart data:', Object.keys(allVariableData[params.matchVariable] || {}));
    if (allVariableData[params.matchVariable]) {
      console.log('📈 Reference date data sample:', allVariableData[params.matchVariable][params.referenceDate]?.slice(0, 3));
      const firstSimilarDay = topSimilarDays[0]?.day;
      if (firstSimilarDay) {
        console.log('📈 First similar day data sample:', allVariableData[params.matchVariable][firstSimilarDay]?.slice(0, 3));
      }
      console.log('📈 All dates in chart data:', Object.keys(allVariableData[params.matchVariable]));
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
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Likeday analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform likeday analysis', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Helper functions
function validateInputs(params: LikedayRequest): boolean {
  // Basic validation
  if (!params.referenceDate || !params.startDate || !params.endDate) return false;
  if (!params.matchVariable || !LIKEDAY_MAP[params.matchVariable]) return false;
  if (params.topN < 1 || params.topN > 20) return false;
  if (params.euclideanWeight < 0 || params.euclideanWeight > 1) return false;
  if (!params.referenceMode || !['historical', 'forecast'].includes(params.referenceMode)) return false;
  
  // Forecast mode specific validation
  if (params.referenceMode === 'forecast') {
    if (!params.scenarioId || typeof params.scenarioId !== 'number') return false;
  }
  
  // Date validation for historical mode
  if (params.referenceMode === 'historical') {
    const refDate = new Date(params.referenceDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (refDate > yesterday) return false;
  }
  
  return true;
}

async function fetchYESEnergyData(
  username: string, 
  password: string, 
  startDate: string, 
  endDate: string, 
  item: string
): Promise<YESEnergyDataPoint[]> {
  const url = `https://services.yesenergy.com/PS/rest/timeseries/multiple.html?agglevel=hour&startdate=${startDate}&enddate=${endDate}&timezone=PST&items=${item}`;
  
  console.log('YES Energy API URL:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`YES Energy API responded with status: ${response.status}`);
  }

  const htmlText = await response.text();
  console.log('YES Energy response length:', htmlText.length);
  
  const parsedData = parseHtmlTable(htmlText);
  console.log('Parsed data points:', parsedData.length);
  if (parsedData.length > 0) {
    console.log('Sample parsed data:', parsedData.slice(0, 3));
  }
  
  // Filter out header rows (where HOURENDING is not a number)
  const filteredData = parsedData.filter(row => {
    return typeof row.HOURENDING === 'number' && !isNaN(row.HOURENDING);
  });
  
  console.log('Filtered data points (after removing headers):', filteredData.length);
  
  return filteredData;
}

function parseHtmlTable(html: string): YESEnergyDataPoint[] {
  const $ = cheerio.load(html);
  const tables = $('table');
  
  if (tables.length === 0) return [];

  const table = tables.first();
  const data: YESEnergyDataPoint[] = [];
  let headers: string[] = [];

  // Extract headers
  table.find('thead tr, tr').first().find('th, td').each((i, el) => {
    headers.push($(el).text().trim());
  });

  // Extract data rows
  table.find('tbody tr, tr').each((rowIndex, row) => {
    if (rowIndex === 0 && table.find('thead').length > 0) return;

    const rowData: any = {};
    let hasData = false;

    $(row).find('td, th').each((cellIndex, cell) => {
      const cellValue = $(cell).text().trim();
      const headerName = headers[cellIndex];

      if (headerName && cellValue) {
        hasData = true;
        
        // Smart parsing: keep dates and text as strings, only parse pure numbers
        if (isDateString(cellValue) || isTextValue(cellValue)) {
          rowData[headerName] = cellValue;
        } else {
          const numValue = parseFloat(cellValue);
          rowData[headerName] = isNaN(numValue) ? cellValue : numValue;
        }
      }
    });

    if (hasData) {
      // Post-process to convert units for consistency
      const processedRow = convertYESEnergyUnits(rowData);
      data.push(processedRow);
    }
  });

  return data;
}

// Convert YES Energy units to match our forecast data units
function convertYESEnergyUnits(rowData: any): YESEnergyDataPoint {
  // No conversion needed - YES Energy already returns data in correct units
  // Load values are in MW, LMP values are in $/MWh
  return rowData;
}

// Helper functions for smart parsing
function isDateString(value: string): boolean {
  // Check for date patterns like "01/01/2024" or "01/01/2024 01:00:00"
  return /^\d{1,2}\/\d{1,2}\/\d{4}(\s\d{1,2}:\d{2}:\d{2})?$/.test(value);
}

function isTextValue(value: string): boolean {
  // Check for known text values that should not be parsed as numbers
  const textValues = ['ONPEAK', 'OFFPEAK', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                     'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return textValues.includes(value.toUpperCase());
}

function pivotDataframe(data: YESEnergyDataPoint[]): { [day: string]: number[] } {
  const result: { [day: string]: number[] } = {};
  
  // Find the value column (contains parentheses)
  const valueColumn = Object.keys(data[0]).find(col => col.includes('('));
  if (!valueColumn) return result;

  // Group by MARKETDAY (should be full date like "01/01/2024")
  const grouped: { [day: string]: YESEnergyDataPoint[] } = {};
  data.forEach(row => {
    const day = row.MARKETDAY as string;
    if (!day || typeof day !== 'string') return; // Skip if no valid MARKETDAY
    
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(row);
  });

  // Convert to pivot format
  Object.keys(grouped).forEach(day => {
    const dayData = grouped[day];
    const hourlyValues = new Array(24).fill(null);
    
    dayData.forEach(row => {
      const hour = row.HOURENDING as number;
      const value = row[valueColumn] as number;
      if (hour >= 1 && hour <= 24) {
        hourlyValues[hour - 1] = value;
      }
    });

    // Only include days with complete data (no nulls)
    if (hourlyValues.every(val => val !== null)) {
      result[day] = hourlyValues;
    }
  });

  return result;
}

function calculateDistances(
  historical: { [day: string]: number[] }, 
  reference: { [day: string]: number[] }
): SimilarityScore[] {
  const refDay = Object.keys(reference)[0];
  const refValues = reference[refDay];
  
  const scores: SimilarityScore[] = [];
  
  Object.keys(historical).forEach(day => {
    const dayValues = historical[day];
    
    // Calculate Euclidean distance
    const euclidean = Math.sqrt(
      dayValues.reduce((sum, val, i) => sum + Math.pow(val - refValues[i], 2), 0)
    );
    
    // Calculate Cosine distance
    const dotProduct = dayValues.reduce((sum, val, i) => sum + val * refValues[i], 0);
    const magnitudeA = Math.sqrt(dayValues.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(refValues.reduce((sum, val) => sum + val * val, 0));
    const cosine = 1 - (dotProduct / (magnitudeA * magnitudeB));
    
    scores.push({
      day,
      euclidean,
      cosine,
      euclidean_z: 0, // Will be calculated in rankDays
      cosine_z: 0,
      combined_score: 0,
      rank: 0
    });
  });
  
  return scores;
}

function rankDays(scores: SimilarityScore[], euclideanWeight: number): SimilarityScore[] {
  // Calculate z-scores
  const euclideanValues = scores.map(s => s.euclidean);
  const cosineValues = scores.map(s => s.cosine);
  
  const euclideanMean = euclideanValues.reduce((a, b) => a + b) / euclideanValues.length;
  const cosineMean = cosineValues.reduce((a, b) => a + b) / cosineValues.length;
  
  const euclideanStd = Math.sqrt(euclideanValues.reduce((sum, val) => sum + Math.pow(val - euclideanMean, 2), 0) / euclideanValues.length);
  const cosineStd = Math.sqrt(cosineValues.reduce((sum, val) => sum + Math.pow(val - cosineMean, 2), 0) / cosineValues.length);
  
  // Calculate combined scores and ranks
  scores.forEach(score => {
    score.euclidean_z = (score.euclidean - euclideanMean) / euclideanStd;
    score.cosine_z = (score.cosine - cosineMean) / cosineStd;
    score.combined_score = (euclideanWeight * score.euclidean_z) + ((1 - euclideanWeight) * score.cosine_z);
  });
  
  // Sort by combined score and assign ranks
  scores.sort((a, b) => a.combined_score - b.combined_score);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });
  
  return scores;
}

async function fetchSingleVariableData(
  username: string, 
  password: string, 
  scenarioId: number | null,
  referenceDate: string, 
  similarDays: string[],
  matchVariable: string,
  mode: 'historical' | 'mixed'
): Promise<any> {
  const results: any = {};
  const variableData: any = {};
  
  if (mode === 'mixed' && scenarioId) {
    // Forecast data for reference date
    const forecastData = await fetchForecastData(scenarioId, referenceDate, matchVariable);
    if (forecastData && forecastData.length > 0) {
      variableData[referenceDate] = forecastData;
    }
    
    // Historical data for similar days from YES Energy
    const item = LIKEDAY_MAP[matchVariable];
    for (const date of similarDays) {
      const historicalData = await fetchYESEnergyData(username, password, date, date, item);
      if (historicalData && historicalData.length > 0) {
        variableData[date] = historicalData;
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    // Historical mode: fetch only match variable from YES Energy
    const allDates = [referenceDate, ...similarDays];
    const item = LIKEDAY_MAP[matchVariable];
    
    for (const date of allDates) {
      const data = await fetchYESEnergyData(username, password, date, date, item);
      if (data && data.length > 0) {
        variableData[date] = data;
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  results[matchVariable] = variableData;
  return results;
}

async function fetchAllVariableData(
  username: string, 
  password: string, 
  referenceDate: string, 
  similarDays: string[]
): Promise<any> {
  const allDates = [referenceDate, ...similarDays];
  const variables = Object.keys(LIKEDAY_MAP);
  const results: any = {};
  
  for (const variable of variables) {
    const item = LIKEDAY_MAP[variable];
    const variableData: any = {};
    
    for (const date of allDates) {
      const data = await fetchYESEnergyData(username, password, date, date, item);
      if (data && data.length > 0) {
        variableData[date] = data;
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    results[variable] = variableData;
  }
  
  return results;
} 

async function fetchForecastData(
  scenarioId: number,
  referenceDate: string,
  matchVariable: string
): Promise<YESEnergyDataPoint[]> {
  console.log('⚡ fetchForecastData called with:', { scenarioId, referenceDate, matchVariable });
  
  try {
    const targetDate = new Date(referenceDate);
    console.log('⚡ Target date created:', targetDate);
    const result: YESEnergyDataPoint[] = [];
    
    switch (matchVariable) {
      case 'RT LMP':
        // Fetch from results_units for unit 66038 (Goleta)
        const lmpResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            energy: true,
            congestion: true,
            losses: true,
          },
        });
        
        return lmpResults.map(row => ({
          DATETIME: `${row.Date.toISOString().split('T')[0]} ${String(row.Hour).padStart(2, '0')}:00:00`,
          MARKETDAY: row.Date.toISOString().split('T')[0],
          HOURENDING: row.Hour,
          'GOLETA_6_N100 (RTLMP)': (row.energy || 0) + (row.congestion || 0) + (row.losses || 0),
        }));
        
      case 'RT Energy':
        // Fetch energy component from results_units
        const energyResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            energy: true,
          },
        });
        
        return energyResults.map(row => ({
          DATETIME: `${row.Date.toISOString().split('T')[0]} ${String(row.Hour).padStart(2, '0')}:00:00`,
          MARKETDAY: row.Date.toISOString().split('T')[0],
          HOURENDING: row.Hour,
          'GOLETA_6_N100 (RTENERGY)': row.energy || 0,
        }));
        
      case 'RT Congestion':
        // Fetch congestion component from results_units
        const congestionResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            congestion: true,
          },
        });
        
        return congestionResults.map(row => ({
          DATETIME: `${row.Date.toISOString().split('T')[0]} ${String(row.Hour).padStart(2, '0')}:00:00`,
          MARKETDAY: row.Date.toISOString().split('T')[0],
          HOURENDING: row.Hour,
          'GOLETA_6_N100 (RTCONG)': row.congestion || 0,
        }));
        
      case 'RT Load':
        // Fetch from zone_demand, aggregate across all zones
        const loadResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            demandmw: true,
          },
        });
        
        // Aggregate by hour
        const loadByHour: { [hour: number]: number } = {};
        loadResults.forEach(row => {
          if (!loadByHour[row.Hour]) {
            loadByHour[row.Hour] = 0;
          }
          loadByHour[row.Hour] += (row.demandmw || 0);
        });
        
        return Object.keys(loadByHour).map(hour => ({
          DATETIME: `${targetDate.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:00:00`,
          MARKETDAY: targetDate.toISOString().split('T')[0],
          HOURENDING: parseInt(hour),
          'CAISO (RTLOAD)': loadByHour[parseInt(hour)], // Keep in MW
        }));
        
      case 'RT Net Load':
        // Fetch demand and renewable generation
        console.log('🔍 Fetching RT Net Load data for scenario:', scenarioId, 'date:', referenceDate);
        
        const netLoadDemandResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            demandmw: true,
          },
        });
        
        console.log('📊 Demand results count:', netLoadDemandResults.length);
        console.log('📊 First few demand results:', netLoadDemandResults.slice(0, 3));
        
        const renewableResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
            OR: [
              { fuelname: 'sun' },
              { fuelname: 'Sun' },
              { fuelname: 'wind' },
              { fuelname: 'Wind' }
            ]
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            fuelname: true,
            generationmw: true,
          },
        });
        
        console.log('🌱 Renewable results count:', renewableResults.length);
        console.log('🌱 First few renewable results:', renewableResults.slice(0, 3));
        
        // Aggregate by hour
        const demandByHour: { [hour: number]: number } = {};
        const renewableByHour: { [hour: number]: number } = {};
        
        netLoadDemandResults.forEach(row => {
          if (!demandByHour[row.Hour]) demandByHour[row.Hour] = 0;
          demandByHour[row.Hour] += (row.demandmw || 0);
        });
        
        renewableResults.forEach(row => {
          if (!renewableByHour[row.Hour]) renewableByHour[row.Hour] = 0;
          renewableByHour[row.Hour] += (row.generationmw || 0);
        });
        
        console.log('📊 Aggregated demand by hour (MW):', demandByHour);
        console.log('🌱 Aggregated renewable by hour (MW):', renewableByHour);
        
        const netLoadResult = Object.keys(demandByHour).map(hour => {
          const hourNum = parseInt(hour);
          const demandMW = demandByHour[hourNum];
          const renewableMW = renewableByHour[hourNum] || 0;
          const netLoadMW = demandMW - renewableMW; // Keep in MW
          
          return {
            DATETIME: `${targetDate.toISOString().split('T')[0]} ${String(hourNum).padStart(2, '0')}:00:00`,
            MARKETDAY: targetDate.toISOString().split('T')[0],
            HOURENDING: hourNum,
            'CAISO (RTLOAD_NET_OF_RENEWABLES)': netLoadMW,
          };
        });
        
        console.log('⚡ Final net load result sample:', netLoadResult.slice(0, 3));
        console.log('⚡ Net load values for hours 1-3:', netLoadResult.slice(0, 3).map(r => r['CAISO (RTLOAD_NET_OF_RENEWABLES)']));
        
        return netLoadResult;
        
      case 'DA LMP':
        // Use Dayzer's LMP forecast (energy + congestion + losses)
        console.log('🔥 Fetching DA LMP forecast data for scenario:', scenarioId, 'date:', targetDate);
        const daLmpResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            unitid: 66038,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            energy: true,
            congestion: true,
            losses: true,
          },
        });
        
        console.log('🔥 DA LMP results found:', daLmpResults.length);
        
        return daLmpResults.map(row => ({
          DATETIME: `${row.Date.toISOString().split('T')[0]} ${String(row.Hour).padStart(2, '0')}:00:00`,
          MARKETDAY: row.Date.toISOString().split('T')[0],
          HOURENDING: row.Hour,
          'GOLETA_6_N100 (DALMP)': (row.energy || 0) + (row.congestion || 0) + (row.losses || 0),
        }));
        
      case 'DA Load':
        // Use Dayzer's load forecast (demandmw from zone_demand)
        console.log('🔥 Fetching DA Load forecast data for scenario:', scenarioId, 'date:', targetDate);
        const daLoadResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            demandmw: true,
          },
        });
        
        console.log('🔥 DA Load results found:', daLoadResults.length);
        
        // Aggregate by hour
        const daLoadByHour: { [hour: number]: number } = {};
        daLoadResults.forEach(row => {
          if (!daLoadByHour[row.Hour]) {
            daLoadByHour[row.Hour] = 0;
          }
          daLoadByHour[row.Hour] += (row.demandmw || 0);
        });
        
        return Object.keys(daLoadByHour).map(hour => ({
          DATETIME: `${targetDate.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:00:00`,
          MARKETDAY: targetDate.toISOString().split('T')[0],
          HOURENDING: parseInt(hour),
          'CAISO (DA_DEMAND_FORECAST)': daLoadByHour[parseInt(hour)], // Keep in MW
        }));
        
      case 'DA Net Load':
        // Use Dayzer's net load forecast (demand - renewables)
        console.log('🔥 Fetching DA Net Load forecast data for scenario:', scenarioId, 'date:', targetDate);
        const daNetLoadDemandResults = await prisma.zone_demand.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            demandmw: true,
          },
        });
        
        const daRenewableResults = await prisma.results_units.findMany({
          where: {
            scenarioid: scenarioId,
            Date: targetDate,
            OR: [
              { fuelname: 'sun' },
              { fuelname: 'Sun' },
              { fuelname: 'wind' },
              { fuelname: 'Wind' }
            ]
          },
          orderBy: { Hour: 'asc' },
          select: {
            Date: true,
            Hour: true,
            fuelname: true,
            generationmw: true,
          },
        });
        
        console.log('🔥 DA Net Load demand results found:', daNetLoadDemandResults.length);
        console.log('🔥 DA Net Load renewable results found:', daRenewableResults.length);
        
        // Aggregate by hour
        const daDemandByHour: { [hour: number]: number } = {};
        const daRenewableByHour: { [hour: number]: number } = {};
        
        daNetLoadDemandResults.forEach(row => {
          if (!daDemandByHour[row.Hour]) daDemandByHour[row.Hour] = 0;
          daDemandByHour[row.Hour] += (row.demandmw || 0);
        });
        
        daRenewableResults.forEach(row => {
          if (!daRenewableByHour[row.Hour]) daRenewableByHour[row.Hour] = 0;
          daRenewableByHour[row.Hour] += (row.generationmw || 0);
        });
        
        return Object.keys(daDemandByHour).map(hour => {
          const hourNum = parseInt(hour);
          const demandMW = daDemandByHour[hourNum];
          const renewableMW = daRenewableByHour[hourNum] || 0;
          const netLoadMW = demandMW - renewableMW; // Keep in MW
          
          return {
            DATETIME: `${targetDate.toISOString().split('T')[0]} ${String(hourNum).padStart(2, '0')}:00:00`,
            MARKETDAY: targetDate.toISOString().split('T')[0],
            HOURENDING: hourNum,
            'CAISO (DA NET DEMAND FC)': netLoadMW,
          };
        });
        
      default:
        console.error('Unknown match variable:', matchVariable);
        return [];
    }
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    return [];
  }
}

async function fetchMixedVariableData(
  username: string,
  password: string,
  scenarioId: number,
  referenceDate: string,
  similarDays: string[]
): Promise<any> {
  const results: any = {};
  const variables = Object.keys(LIKEDAY_MAP);
  
  // Fetch forecast data for reference date
  for (const variable of variables) {
    const variableData: any = {};
    
    // Forecast data for reference date
    const forecastData = await fetchForecastData(scenarioId, referenceDate, variable);
    if (forecastData && forecastData.length > 0) {
      variableData[referenceDate] = forecastData;
    }
    
    // Historical data for similar days from YES Energy
    for (const date of similarDays) {
      const item = LIKEDAY_MAP[variable];
      const historicalData = await fetchYESEnergyData(username, password, date, date, item);
      if (historicalData && historicalData.length > 0) {
        variableData[date] = historicalData;
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    results[variable] = variableData;
  }
  
  return results;
} 