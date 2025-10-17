import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import RenewableForecastAccuracy from './RenewableForecastAccuracy';

interface CombinedRenewablesDataPoint {
  datetime: string;
  // Last Week data (left side)
  dayzerWindLastWeek?: number;
  dayzerSolarLastWeek?: number;
  dayzerWindT1LastWeek?: number; // New t-1 wind data
  dayzerSolarT1LastWeek?: number; // New t-1 solar data
  caisoWindLastWeek?: number;
  caisoSolarLastWeek?: number;
  rtWindLastWeek?: number;
  rtSolarLastWeek?: number;
  // Forecast data (right side)
  dayzerWindForecast?: number;
  dayzerSolarForecast?: number;
  caisoWindForecast?: number;
  caisoSolarForecast?: number;
  isLastWeek: boolean; // Flag to determine background shading
}

interface CombinedRenewablesResponse {
  success: boolean;
  data: CombinedRenewablesDataPoint[];
  metadata: {
    lastWeekScenario: {
      scenarioid: number;
      scenarioname: string;
    };
    forecastScenario: {
      scenarioid: number;
      scenarioname: string;
    };
    lastWeekDateRange: {
      start: string;
      end: string;
    };
    forecastDateRange: {
      start: string;
      end: string;
    };
    dataPoints: {
      lastWeek: number;
      forecast: number;
      combined: number;
    };
  };
}

export default function CombinedRenewablesChart() {
  const [data, setData] = useState<CombinedRenewablesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CombinedRenewablesResponse['metadata'] | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState<number>(20000);
  const [yAxisMin, setYAxisMin] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'full' | 'lastWeek' | 'forecast'>('full');
  const [showAccuracy, setShowAccuracy] = useState<boolean>(false);
  const [showCustomization, setShowCustomization] = useState<boolean>(false);
  
  // Color palette (16 colors)
  const colorOptions = [
    '#3b82f6', // Blue
    '#ef4444', // Red  
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f43f5e', // Rose
    '#a855f7', // Purple
    '#eab308', // Yellow
    '#6b7280', // Gray
    '#1f2937', // Dark Gray
  ];

  // Line style options
  const styleOptions = [
    { value: 'solid', label: 'Solid', dashArray: '' },
    { value: 'dashed', label: 'Dashed', dashArray: '5 5' },
    { value: 'dotted', label: 'Dotted', dashArray: '2 2' },
  ];

  const [visibleLines, setVisibleLines] = useState({
    dayzerWind: true,
    dayzerSolar: true,
    dayzerWindT1: false,
    dayzerSolarT1: false,
    caisoWind: true,
    caisoSolar: true,
    rtWind: true,
    rtSolar: true,
  });

  const [lineCustomization, setLineCustomization] = useState({
    dayzerWind: { color: '#ef4444', style: 'solid' }, // Red
    dayzerSolar: { color: '#f97316', style: 'solid' }, // Orange
    dayzerWindT1: { color: '#b91c1c', style: 'solid' }, // Dark Red
    dayzerSolarT1: { color: '#c2410c', style: 'solid' }, // Dark Orange
    caisoWind: { color: '#3b82f6', style: 'solid' }, // Blue
    caisoSolar: { color: '#22c55e', style: 'solid' }, // Green
    rtWind: { color: '#8b5cf6', style: 'solid' }, // Violet
    rtSolar: { color: '#ec4899', style: 'solid' }, // Pink
  });

  // Toggle line visibility and auto-scale Y-axis
  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    const newVisibleLines = {
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    };
    
    setVisibleLines(newVisibleLines);
    
    // Auto-scale Y-axis based on currently visible lines
    if (data.length > 0) {
      const visibleValues: number[] = [];
      
      // Collect values from all visible renewable lines
      data.forEach(point => {
        if (newVisibleLines.dayzerWind) {
          if (point.dayzerWindLastWeek) visibleValues.push(point.dayzerWindLastWeek);
          if (point.dayzerWindForecast) visibleValues.push(point.dayzerWindForecast);
        }
        if (newVisibleLines.dayzerSolar) {
          if (point.dayzerSolarLastWeek) visibleValues.push(point.dayzerSolarLastWeek);
          if (point.dayzerSolarForecast) visibleValues.push(point.dayzerSolarForecast);
        }
        if (newVisibleLines.dayzerWindT1) {
          if (point.dayzerWindT1LastWeek) visibleValues.push(point.dayzerWindT1LastWeek);
        }
        if (newVisibleLines.dayzerSolarT1) {
          if (point.dayzerSolarT1LastWeek) visibleValues.push(point.dayzerSolarT1LastWeek);
        }
        if (newVisibleLines.caisoWind) {
          if (point.caisoWindLastWeek) visibleValues.push(point.caisoWindLastWeek);
          if (point.caisoWindForecast) visibleValues.push(point.caisoWindForecast);
        }
        if (newVisibleLines.caisoSolar) {
          if (point.caisoSolarLastWeek) visibleValues.push(point.caisoSolarLastWeek);
          if (point.caisoSolarForecast) visibleValues.push(point.caisoSolarForecast);
        }
        if (newVisibleLines.rtWind) {
          if (point.rtWindLastWeek) visibleValues.push(point.rtWindLastWeek);
        }
        if (newVisibleLines.rtSolar) {
          if (point.rtSolarLastWeek) visibleValues.push(point.rtSolarLastWeek);
        }
      });

      // Auto-scale Y-axis if we have visible data
      if (visibleValues.length > 0) {
        const min = Math.min(...visibleValues);
        const max = Math.max(...visibleValues);
        const padding = (max - min) * 0.1; // 10% padding
        setYAxisMin(Math.floor(min - padding));
        setYAxisMax(Math.ceil(max + padding));
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check sessionStorage for selected scenarios (no longer using URL parameters)
      const currentWeekScenario = sessionStorage.getItem('currentWeekScenario');
      const lastWeekScenario = sessionStorage.getItem('lastWeekScenario');
      
      console.log('Fetching renewables with scenarios:', { currentWeekScenario, lastWeekScenario });

      // Build API URLs with scenario parameters
      const forecastUrl = currentWeekScenario 
        ? `/api/renewables-forecast?scenarioId=${currentWeekScenario}`
        : '/api/renewables-forecast';
        
      const lastWeekUrl = lastWeekScenario 
        ? `/api/renewables-last-week-forecast?scenarioId=${lastWeekScenario}`
        : '/api/renewables-last-week-forecast';

      console.log('Renewables API URLs:', { forecastUrl, lastWeekUrl });
      console.log('Fetching renewables forecast and last week data separately...');
      
      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`Renewables Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`Renewables Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();

      console.log('Renewables Forecast data:', forecastData);
      console.log('Renewables Last week data:', lastWeekData);

      // Combine the data
      const combinedData: CombinedRenewablesDataPoint[] = [];

      // Add last week data
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            dayzerWindLastWeek: point.dayzerWind,
            dayzerSolarLastWeek: point.dayzerSolar,
            dayzerWindT1LastWeek: point.dayzerWindT1 || 0,
            dayzerSolarT1LastWeek: point.dayzerSolarT1 || 0,
            caisoWindLastWeek: point.caisoWind,
            caisoSolarLastWeek: point.caisoSolar,
            rtWindLastWeek: point.rtWind,
            rtSolarLastWeek: point.rtSolar,
          });
        });
      }

      // Add forecast data
      if (forecastData.data) {
        forecastData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            dayzerWindForecast: point.dayzerWind,
            dayzerSolarForecast: point.dayzerSolar,
            caisoWindForecast: point.caisoWind,
            caisoSolarForecast: point.caisoSolar,
          });
        });
      }

      // Sort by datetime
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

      console.log('Combined renewables data points:', combinedData.length);
      if (combinedData.length > 0) {
        console.log('Sample combined renewables data point:', combinedData[0]);
        console.log('Data keys in first point:', Object.keys(combinedData[0]));
      }
      setData(combinedData);
      
      // Auto-scale Y-axis based on initial data
      if (combinedData.length > 0) {
        const allValues: number[] = [];
        
        // Collect all visible line values
        combinedData.forEach(point => {
          if (visibleLines.dayzerWind) {
            if (point.dayzerWindLastWeek) allValues.push(point.dayzerWindLastWeek);
            if (point.dayzerWindForecast) allValues.push(point.dayzerWindForecast);
          }
          if (visibleLines.dayzerSolar) {
            if (point.dayzerSolarLastWeek) allValues.push(point.dayzerSolarLastWeek);
            if (point.dayzerSolarForecast) allValues.push(point.dayzerSolarForecast);
          }
          if (visibleLines.dayzerWindT1 && point.dayzerWindT1LastWeek) allValues.push(point.dayzerWindT1LastWeek);
          if (visibleLines.dayzerSolarT1 && point.dayzerSolarT1LastWeek) allValues.push(point.dayzerSolarT1LastWeek);
          if (visibleLines.caisoWind) {
            if (point.caisoWindLastWeek) allValues.push(point.caisoWindLastWeek);
            if (point.caisoWindForecast) allValues.push(point.caisoWindForecast);
          }
          if (visibleLines.caisoSolar) {
            if (point.caisoSolarLastWeek) allValues.push(point.caisoSolarLastWeek);
            if (point.caisoSolarForecast) allValues.push(point.caisoSolarForecast);
          }
          if (visibleLines.rtWind && point.rtWindLastWeek) allValues.push(point.rtWindLastWeek);
          if (visibleLines.rtSolar && point.rtSolarLastWeek) allValues.push(point.rtSolarLastWeek);
        });

        if (allValues.length > 0) {
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const padding = (max - min) * 0.1; // 10% padding
          setYAxisMin(Math.floor(min - padding));
          setYAxisMax(Math.ceil(max + padding));
          console.log('Renewables chart auto-scaled Y-axis:', { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
        }
      }
      
      // Create combined metadata
      setMetadata({
        lastWeekScenario: lastWeekData.metadata?.scenario || { scenarioid: 0, scenarioname: 'Unknown' },
        forecastScenario: forecastData.metadata?.scenario || { scenarioid: 0, scenarioname: 'Unknown' },
        lastWeekDateRange: lastWeekData.metadata?.dateRange || { start: '', end: '' },
        forecastDateRange: forecastData.metadata?.dateRange || { start: '', end: '' },
        dataPoints: {
          lastWeek: lastWeekData.data?.length || 0,
          forecast: forecastData.data?.length || 0,
          combined: combinedData.length,
        }
      });

    } catch (err) {
      console.error('Combined renewables data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch combined renewables data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for scenario changes from the date picker
    const handleScenarioChange = () => {
      console.log('Renewables chart: Scenario changed, refetching data...');
      fetchData();
    };

    window.addEventListener('scenarioChanged', handleScenarioChange);
    return () => window.removeEventListener('scenarioChanged', handleScenarioChange);
  }, []);

  // Copy chart as image function
  const copyChartAsImage = async () => {
    if (copying) return;
    setCopying(true);

    try {
      const chartContainer = document.querySelector('.combined-renewables-chart-container');
      if (!chartContainer) {
        throw new Error('Chart container not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartContainer as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Renewables chart copied to clipboard');
          } catch (err) {
            console.error('Failed to copy renewables chart to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying renewables chart:', error);
    } finally {
      setCopying(false);
    }
  };

  // Copy legend as image function  
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);

    try {
      const toggleContainer = document.querySelector('.renewables-toggle-lines-section');
      if (!toggleContainer) {
        throw new Error('Toggle lines container not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(toggleContainer as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Renewables legend copied to clipboard');
          } catch (err) {
            console.error('Failed to copy renewables legend to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying renewables legend:', error);
    } finally {
      setCopyingLegend(false);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const datetime = new Date(label);
      const formattedDate = datetime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const formattedTime = datetime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium text-gray-800 mb-2">
            {formattedDate} at {formattedTime}
          </p>
          {payload
            .filter((entry: any) => entry.value !== null && entry.value !== undefined)
            .map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {entry.value.toLocaleString()} MW
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis labels with full numbers and commas
  const formatYAxisTick = (value: number) => {
    return `${value.toLocaleString()}`;
  };

  // Generate Y-axis ticks at multiples of 5,000 for cleaner intervals
  const generateYAxisTicks = () => {
    const roundedMin = Math.floor(yAxisMin / 5000) * 5000;
    const roundedMax = Math.ceil(yAxisMax / 5000) * 5000;
    const ticks = [];
    for (let tick = roundedMin; tick <= roundedMax; tick += 5000) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };

  // Find the boundary between last week and forecast data
  const lastWeekEndIndex = data.findIndex(d => !d.isLastWeek);
  const lastWeekEndDate = lastWeekEndIndex > 0 ? data[lastWeekEndIndex - 1]?.datetime : null;
  const forecastStartDate = lastWeekEndIndex >= 0 ? data[lastWeekEndIndex]?.datetime : null;

  // Filter data based on view mode
  const filteredData = data.filter(d => {
    if (viewMode === 'full') return true;
    if (viewMode === 'lastWeek') return d.isLastWeek;
    if (viewMode === 'forecast') return !d.isLastWeek;
    return true;
  });

  // Determine if we should show the grey background
  const showGreyBackground = viewMode === 'full' || viewMode === 'lastWeek';

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading combined renewables data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-red-500">Error loading combined renewables data: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Action Buttons */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Show Renewable Forecast Accuracy Button (Left) */}
          <button
            onClick={() => setShowAccuracy(!showAccuracy)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showAccuracy ? 'Hide' : 'Show'} Renewable Forecast Accuracy
          </button>

          {/* Copy Buttons (Right) */}
          <div className="flex items-center gap-4">
            {/* Copy Chart Button */}
            <button
              onClick={copyChartAsImage}
              disabled={copying}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {copying ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Copying...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Chart
                </>
              )}
            </button>

            {/* Copy Legend Button */}
            <button
              onClick={copyLegendAsImage}
              disabled={copyingLegend}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {copyingLegend ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Copying...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Legend
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Y-Axis Range Controls and View Toggle */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('full')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Full
              </button>
              <button
                onClick={() => setViewMode('lastWeek')}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${
                  viewMode === 'lastWeek'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setViewMode('forecast')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'forecast'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Forecast
              </button>
            </div>
          </div>
        
          {/* Y-Axis Min Control */}
          <div className="flex items-center justify-center gap-4">
            <label className="text-sm font-medium text-gray-700">Y-Axis Min:</label>
            <input
              type="range"
              min="-5000"
              max="15000"
              step="1000"
              value={yAxisMin}
              onChange={(e) => setYAxisMin(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[80px]">{yAxisMin.toLocaleString()} MW</span>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <label className="text-sm font-medium text-gray-700">Y-Axis Max:</label>
            <input
              type="range"
              min="10000"
              max="40000"
              step="1000"
              value={yAxisMax}
              onChange={(e) => setYAxisMax(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[80px]">{yAxisMax.toLocaleString()} MW</span>
          </div>
        </div>
        
        {/* Line Customization List */}
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showCustomization ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Customize Lines
            </button>
            
            <button
              onClick={() => setVisibleLines({
                dayzerWind: false,
                dayzerSolar: false,
                dayzerWindT1: false,
                dayzerSolarT1: false,
                caisoWind: false,
                caisoSolar: false,
                rtWind: false,
                rtSolar: false,
              })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
            >
              Remove All
            </button>
          </div>
          
          {showCustomization && (
            <div className="renewables-toggle-lines-section grid grid-cols-1 gap-2">
            {Object.entries(visibleLines).map(([lineKey, isVisible]) => {
              const customization = lineCustomization[lineKey as keyof typeof lineCustomization];
              let lineName = lineKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              // Clean up specific line names
              if (lineKey === 'dayzerWind') lineName = 'Dayzer Wind';
              if (lineKey === 'dayzerSolar') lineName = 'Dayzer Solar';
              if (lineKey === 'dayzerWindT1') lineName = 'Dayzer Wind t-1';
              if (lineKey === 'dayzerSolarT1') lineName = 'Dayzer Solar t-1';
              if (lineKey === 'caisoWind') lineName = 'CAISO Wind';
              if (lineKey === 'caisoSolar') lineName = 'CAISO Solar';
              if (lineKey === 'rtWind') lineName = 'RT Wind';
              if (lineKey === 'rtSolar') lineName = 'RT Solar';
              
              return (
                <div 
                  key={lineKey} 
                  className="rounded-md p-3 bg-white shadow-sm"
                  style={{
                    border: `2px ${customization.style === 'solid' ? 'solid' : 
                            customization.style === 'dashed' ? 'dashed' : 'dotted'} ${
                            isVisible ? customization.color : '#d1d5db'
                          }`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Checkbox and Variable Name */}
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleLine(lineKey as keyof typeof visibleLines)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-gray-700">{lineName}</span>
                    </div>
                    
                    {/* Right: Style Selector + Colors */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <select
                        value={customization.style}
                        onChange={(e) => setLineCustomization(prev => ({
                          ...prev,
                          [lineKey]: { ...prev[lineKey as keyof typeof prev], style: e.target.value }
                        }))}
                        className="text-sm border border-gray-300 rounded px-3 py-1 w-24"
                      >
                        {styleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      {/* Color Picker */}
                      <div className="flex gap-1">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            onClick={() => setLineCustomization(prev => ({
                              ...prev,
                              [lineKey]: { ...prev[lineKey as keyof typeof prev], color }
                            }))}
                            className={`w-4 h-4 rounded border ${
                              customization.color === color 
                                ? 'border-gray-800 border-2' 
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="combined-renewables-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Renewables Forecast</h3>
        </div>
        
        <div className="h-[500px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                horizontal={true}
                vertical={true}
              />
              
              {/* Light grey background for Last Week area */}
              {showGreyBackground && lastWeekEndDate && forecastStartDate && (
                <ReferenceArea
                  x1={filteredData[0]?.datetime}
                  x2={lastWeekEndDate}
                  fill="#e5e7eb"
                  fillOpacity={0.5}
                />
              )}
              
              <XAxis 
                dataKey="datetime"
                tickFormatter={(tickItem: string) => {
                  const date = new Date(tickItem);
                  const hour = date.getHours();
                  if (hour === 0) {
                    return date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    });
                  }
                  return '';
                }}
                stroke="#6b7280"
                fontSize={12}
                height={40}
                interval={23}
                axisLine={true}
                tickLine={true}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatYAxisTick}
                domain={[yAxisMin, yAxisMax]}
                ticks={generateYAxisTicks()}
                label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Dayzer Wind - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerWindLastWeek"
                stroke={lineCustomization.dayzerWind.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerWind.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Wind Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerWind}
              />
              <Line
                type="stepAfter"
                dataKey="dayzerWindForecast"
                stroke={lineCustomization.dayzerWind.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerWind.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Wind Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerWind}
              />

              {/* Dayzer Wind t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerWindT1LastWeek"
                stroke={lineCustomization.dayzerWindT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerWindT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Wind t-1"
                connectNulls={false}
                hide={!visibleLines.dayzerWindT1}
              />
              
              {/* Dayzer Solar - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerSolarLastWeek"
                stroke={lineCustomization.dayzerSolar.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerSolar.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Solar Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerSolar}
              />
              <Line
                type="stepAfter"
                dataKey="dayzerSolarForecast"
                stroke={lineCustomization.dayzerSolar.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerSolar.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Solar Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerSolar}
              />

              {/* Dayzer Solar t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerSolarT1LastWeek"
                stroke={lineCustomization.dayzerSolarT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerSolarT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Solar t-1"
                connectNulls={false}
                hide={!visibleLines.dayzerSolarT1}
              />
              
              {/* CAISO Wind - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="caisoWindLastWeek"
                stroke={lineCustomization.caisoWind.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoWind.style)?.dashArray || ''}
                dot={false}
                name="CAISO Wind Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoWind}
              />
              <Line
                type="stepAfter"
                dataKey="caisoWindForecast"
                stroke={lineCustomization.caisoWind.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoWind.style)?.dashArray || ''}
                dot={false}
                name="CAISO Wind Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoWind}
              />
              
              {/* CAISO Solar - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="caisoSolarLastWeek"
                stroke={lineCustomization.caisoSolar.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoSolar.style)?.dashArray || ''}
                dot={false}
                name="CAISO Solar Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoSolar}
              />
              <Line
                type="stepAfter"
                dataKey="caisoSolarForecast"
                stroke={lineCustomization.caisoSolar.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoSolar.style)?.dashArray || ''}
                dot={false}
                name="CAISO Solar Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoSolar}
              />
              
              {/* RT Wind - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="rtWindLastWeek"
                stroke={lineCustomization.rtWind.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.rtWind.style)?.dashArray || ''}
                dot={false}
                name="RT Wind Actuals"
                connectNulls={false}
                hide={!visibleLines.rtWind}
              />
              
              {/* RT Solar - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="rtSolarLastWeek"
                stroke={lineCustomization.rtSolar.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.rtSolar.style)?.dashArray || ''}
                dot={false}
                name="RT Solar Actuals"
                connectNulls={false}
                hide={!visibleLines.rtSolar}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Line Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(visibleLines)
                .filter(([_, isVisible]) => isVisible)
                .map(([lineKey, _]) => {
                  const customization = lineCustomization[lineKey as keyof typeof lineCustomization];
                  let lineName = lineKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  
                  // Clean up specific line names
                  if (lineKey === 'dayzerWind') lineName = 'Dayzer Wind';
                  if (lineKey === 'dayzerSolar') lineName = 'Dayzer Solar';
                  if (lineKey === 'dayzerWindT1') lineName = 'Dayzer Wind t-1';
                  if (lineKey === 'dayzerSolarT1') lineName = 'Dayzer Solar t-1';
                  if (lineKey === 'caisoWind') lineName = 'CAISO Wind';
                  if (lineKey === 'caisoSolar') lineName = 'CAISO Solar';
                  if (lineKey === 'rtWind') lineName = 'RT Wind';
                  if (lineKey === 'rtSolar') lineName = 'RT Solar';
                  
                  const dashArray = styleOptions.find(s => s.value === customization.style)?.dashArray || '';
                  
                  return (
                    <div key={lineKey} className="flex items-center gap-3">
                      <svg width="35" height="4" className="flex-shrink-0">
                        <line
                          x1="0"
                          y1="2"
                          x2="35"
                          y2="2"
                          stroke={customization.color}
                          strokeWidth="3"
                          strokeDasharray={dashArray}
                        />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium">{lineName}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Renewable Forecast Accuracy Section */}
      {showAccuracy && (
        <div className="p-6 border-t border-gray-200">
          <RenewableForecastAccuracy />
        </div>
      )}
    </div>
  );
}
