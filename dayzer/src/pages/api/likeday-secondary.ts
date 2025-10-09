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
};

interface SecondaryRequest {
  referenceDate: string;
  referenceMode: 'historical' | 'forecast';
  matchVariable: string;
  topSimilarDays: string[];
  scenarioId?: number;
  scenarioName?: string;
}

interface YESEnergyDataPoint {
  DATETIME: string;
  MARKETDAY: string;
  HOURENDING: number;
  [key: string]: string | number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const params: SecondaryRequest = await request.json();
    
    console.log('🚀 Secondary analysis for:', params.matchVariable);
    console.log('🚀 Reference date:', params.referenceDate);
    console.log('🚀 Similar days:', params.topSimilarDays);

    // Get credentials for YES Energy
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
    
    // Fetch reference day data based on mode
    if (params.referenceMode === 'forecast') {
      // Fetch forecast data from Dayzer database
      if (!params.scenarioId) {
        return new Response(
          JSON.stringify({ error: 'Scenario ID required for forecast mode' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      referenceData = await fetchForecastData(params.scenarioId, params.referenceDate, params.matchVariable);
      
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

    // Fetch similar days data from YES Energy
    const chartData: any = {};
    chartData[params.matchVariable] = {};
    
    // Add reference data
    chartData[params.matchVariable][params.referenceDate] = referenceData;
    
    // Fetch similar days data
    const urlItem = LIKEDAY_MAP[params.matchVariable];
    for (const day of params.topSimilarDays) {
      const dayData = await fetchYESEnergyData(username, password, day, day, urlItem);
      if (dayData && dayData.length > 0) {
        chartData[params.matchVariable][day] = dayData;
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Response(JSON.stringify({
      success: true,
      variable: params.matchVariable,
      chartData: chartData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Secondary analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform secondary analysis', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Helper functions (copied from main likeday-analysis.ts)
async function fetchYESEnergyData(
  username: string, 
  password: string, 
  startDate: string, 
  endDate: string, 
  item: string
): Promise<YESEnergyDataPoint[]> {
  const url = `https://services.yesenergy.com/PS/rest/timeseries/multiple.html?agglevel=hour&startdate=${startDate}&enddate=${endDate}&timezone=PST&items=${item}`;
  
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
  const parsedData = parseHtmlTable(htmlText);
  
  return parsedData;
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
  const converted = { ...rowData };
  
  // Convert Load and Net Load from MW to GW for consistency with forecast data
  Object.keys(converted).forEach(key => {
    if (typeof converted[key] === 'number' && 
        (key.includes('RTLOAD') || key.includes('RTLOAD_NET_OF_RENEWABLES'))) {
      converted[key] = converted[key] / 1000; // Convert MW to GW
    }
  });
  
  return converted;
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

async function fetchForecastData(
  scenarioId: number,
  referenceDate: string,
  matchVariable: string
): Promise<YESEnergyDataPoint[]> {
  try {
    const targetDate = new Date(referenceDate);
    
    switch (matchVariable) {
      case 'RT LMP':
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
          'CAISO (RTLOAD)': loadByHour[parseInt(hour)] / 1000, // Convert MW to GW
        }));
        
      case 'RT Net Load':
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
        
        return Object.keys(demandByHour).map(hour => {
          const hourNum = parseInt(hour);
          const demandMW = demandByHour[hourNum];
          const renewableMW = renewableByHour[hourNum] || 0;
          const netLoadGW = (demandMW - renewableMW) / 1000; // Convert MW to GW
          
          return {
            DATETIME: `${targetDate.toISOString().split('T')[0]} ${String(hourNum).padStart(2, '0')}:00:00`,
            MARKETDAY: targetDate.toISOString().split('T')[0],
            HOURENDING: hourNum,
            'CAISO (RTLOAD_NET_OF_RENEWABLES)': netLoadGW,
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

