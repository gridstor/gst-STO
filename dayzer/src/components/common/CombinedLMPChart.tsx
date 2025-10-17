import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface CombinedLMPDataPoint {
  datetime: string;
  // Last Week data (left side)
  energyLastWeek?: number;
  congestionLastWeek?: number;
  lossesLastWeek?: number;
  lmpLastWeek?: number;
  energyT1LastWeek?: number; // New t-1 energy data
  congestionT1LastWeek?: number; // New t-1 congestion data
  lossesT1LastWeek?: number; // New t-1 losses data
  lmpT1LastWeek?: number; // New t-1 total LMP data
  // DA LMP components (last week only - from yes_fundamentals)
  daLMPLastWeek?: number;
  daCongestionLastWeek?: number;
  daEnergyLastWeek?: number;
  daLossLastWeek?: number;
  rtLMPLastWeek?: number;
  // Forecast data (right side)
  energyForecast?: number;
  congestionForecast?: number;
  lossesForecast?: number;
  lmpForecast?: number;
  isLastWeek: boolean; // Flag to determine background shading
}

interface CombinedLMPResponse {
  success: boolean;
  data: CombinedLMPDataPoint[];
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

export default function CombinedLMPChart() {
  const [data, setData] = useState<CombinedLMPDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CombinedLMPResponse['metadata'] | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState<number>(100);
  const [yAxisMin, setYAxisMin] = useState<number>(-20);
  const [viewMode, setViewMode] = useState<'full' | 'lastWeek' | 'forecast'>('full');
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
    energy: true,
    congestion: true,
    losses: true,
    lmp: true,
    energyT1: false, // New t-1 energy line
    congestionT1: false, // New t-1 congestion line
    lossesT1: false, // New t-1 losses line
    lmpT1: false, // New t-1 total LMP line
    // DA LMP components
    daLMP: false,
    daCongestion: false, 
    daEnergy: false,
    daLoss: false,
    rtLMP: true,
  });

  const [lineCustomization, setLineCustomization] = useState({
    energy: { color: '#3b82f6', style: 'solid' }, // Blue
    congestion: { color: '#ef4444', style: 'solid' }, // Red
    losses: { color: '#22c55e', style: 'solid' }, // Green
    lmp: { color: '#f59e0b', style: 'solid' }, // Amber
    energyT1: { color: '#1d4ed8', style: 'solid' }, // Dark Blue
    congestionT1: { color: '#b91c1c', style: 'solid' }, // Dark Red
    lossesT1: { color: '#15803d', style: 'solid' }, // Dark Green
    lmpT1: { color: '#d97706', style: 'solid' }, // Dark Amber
    // DA LMP components
    daLMP: { color: '#8b5cf6', style: 'dashed' }, // Violet, dashed
    daCongestion: { color: '#ec4899', style: 'dashed' }, // Pink, dashed
    daEnergy: { color: '#06b6d4', style: 'dashed' }, // Cyan, dashed
    daLoss: { color: '#84cc16', style: 'dashed' }, // Lime, dashed
    rtLMP: { color: '#6b7280', style: 'solid' }, // Gray
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
      
      // Collect values from all visible LMP lines
      data.forEach(point => {
        if (newVisibleLines.energy) {
          if (point.energyLastWeek) visibleValues.push(point.energyLastWeek);
          if (point.energyForecast) visibleValues.push(point.energyForecast);
        }
        if (newVisibleLines.congestion) {
          if (point.congestionLastWeek) visibleValues.push(point.congestionLastWeek);
          if (point.congestionForecast) visibleValues.push(point.congestionForecast);
        }
        if (newVisibleLines.losses) {
          if (point.lossesLastWeek) visibleValues.push(point.lossesLastWeek);
          if (point.lossesForecast) visibleValues.push(point.lossesForecast);
        }
        if (newVisibleLines.lmp) {
          if (point.lmpLastWeek) visibleValues.push(point.lmpLastWeek);
          if (point.lmpForecast) visibleValues.push(point.lmpForecast);
        }
        if (newVisibleLines.energyT1) {
          if (point.energyT1LastWeek) visibleValues.push(point.energyT1LastWeek);
        }
        if (newVisibleLines.congestionT1) {
          if (point.congestionT1LastWeek) visibleValues.push(point.congestionT1LastWeek);
        }
        if (newVisibleLines.lossesT1) {
          if (point.lossesT1LastWeek) visibleValues.push(point.lossesT1LastWeek);
        }
        if (newVisibleLines.lmpT1) {
          if (point.lmpT1LastWeek) visibleValues.push(point.lmpT1LastWeek);
        }
        if (newVisibleLines.daLMP) {
          if (point.daLMPLastWeek) visibleValues.push(point.daLMPLastWeek);
        }
        if (newVisibleLines.daCongestion) {
          if (point.daCongestionLastWeek) visibleValues.push(point.daCongestionLastWeek);
        }
        if (newVisibleLines.daEnergy) {
          if (point.daEnergyLastWeek) visibleValues.push(point.daEnergyLastWeek);
        }
        if (newVisibleLines.daLoss) {
          if (point.daLossLastWeek) visibleValues.push(point.daLossLastWeek);
        }
        if (newVisibleLines.rtLMP) {
          if (point.rtLMPLastWeek) visibleValues.push(point.rtLMPLastWeek);
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
      
      console.log('Fetching LMP with scenarios:', { currentWeekScenario, lastWeekScenario });

      // Build API URLs with scenario parameters
      const forecastUrl = currentWeekScenario 
        ? `/api/lmp-forecast?scenarioId=${currentWeekScenario}`
        : '/api/lmp-forecast';
        
      const lastWeekUrl = lastWeekScenario 
        ? `/api/lmp-last-week-forecast?scenarioId=${lastWeekScenario}`
        : '/api/lmp-last-week-forecast';

      console.log('LMP API URLs:', { forecastUrl, lastWeekUrl });
      console.log('Fetching LMP forecast and last week data separately...');
      
      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`LMP Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`LMP Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();

      console.log('LMP Forecast data:', forecastData);
      console.log('LMP Last week data:', lastWeekData);

      // Combine the data
      const combinedData: CombinedLMPDataPoint[] = [];

      // Add last week data
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            energyLastWeek: point.energy,
            congestionLastWeek: point.congestion,
            lossesLastWeek: point.losses,
            lmpLastWeek: point.lmp,
            energyT1LastWeek: point.energyT1 || 0,
            congestionT1LastWeek: point.congestionT1 || 0,
            lossesT1LastWeek: point.lossesT1 || 0,
            lmpT1LastWeek: point.lmpT1 || 0,
            daLMPLastWeek: point.daLMP,
            daCongestionLastWeek: point.daCongestion,
            daEnergyLastWeek: point.daEnergy,
            daLossLastWeek: point.daLoss,
            rtLMPLastWeek: point.rtLMP,
          });
        });
      }

      // Add forecast data
      if (forecastData.data) {
        forecastData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            energyForecast: point.energy,
            congestionForecast: point.congestion,
            lossesForecast: point.losses,
            lmpForecast: point.lmp,
          });
        });
      }

      // Sort by datetime
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

      console.log('Combined LMP data points:', combinedData.length);
      if (combinedData.length > 0) {
        console.log('Sample combined LMP data point:', combinedData[0]);
        console.log('Data keys in first point:', Object.keys(combinedData[0]));
      }
      setData(combinedData);
      
      // Auto-scale Y-axis based on initial data
      if (combinedData.length > 0) {
        const allValues: number[] = [];
        
        // Collect all visible line values
        combinedData.forEach(point => {
          if (visibleLines.energy) {
            if (point.energyLastWeek) allValues.push(point.energyLastWeek);
            if (point.energyForecast) allValues.push(point.energyForecast);
          }
          if (visibleLines.congestion) {
            if (point.congestionLastWeek) allValues.push(point.congestionLastWeek);
            if (point.congestionForecast) allValues.push(point.congestionForecast);
          }
          if (visibleLines.losses) {
            if (point.lossesLastWeek) allValues.push(point.lossesLastWeek);
            if (point.lossesForecast) allValues.push(point.lossesForecast);
          }
          if (visibleLines.lmp) {
            if (point.lmpLastWeek) allValues.push(point.lmpLastWeek);
            if (point.lmpForecast) allValues.push(point.lmpForecast);
          }
          if (visibleLines.energyT1 && point.energyT1LastWeek) allValues.push(point.energyT1LastWeek);
          if (visibleLines.congestionT1 && point.congestionT1LastWeek) allValues.push(point.congestionT1LastWeek);
          if (visibleLines.lossesT1 && point.lossesT1LastWeek) allValues.push(point.lossesT1LastWeek);
          if (visibleLines.lmpT1 && point.lmpT1LastWeek) allValues.push(point.lmpT1LastWeek);
          if (visibleLines.daLMP && point.daLMPLastWeek) allValues.push(point.daLMPLastWeek);
          if (visibleLines.daCongestion && point.daCongestionLastWeek) allValues.push(point.daCongestionLastWeek);
          if (visibleLines.daEnergy && point.daEnergyLastWeek) allValues.push(point.daEnergyLastWeek);
          if (visibleLines.daLoss && point.daLossLastWeek) allValues.push(point.daLossLastWeek);
          if (visibleLines.rtLMP && point.rtLMPLastWeek) allValues.push(point.rtLMPLastWeek);
        });

        if (allValues.length > 0) {
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const padding = (max - min) * 0.1; // 10% padding
          setYAxisMin(Math.floor(min - padding));
          setYAxisMax(Math.ceil(max + padding));
          console.log('LMP chart auto-scaled Y-axis:', { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
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
      console.error('Combined LMP data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch combined LMP data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for scenario changes from the date picker
    const handleScenarioChange = () => {
      console.log('LMP chart: Scenario changed, refetching data...');
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
      const chartContainer = document.querySelector('.combined-lmp-chart-container');
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
            console.log('LMP chart copied to clipboard');
          } catch (err) {
            console.error('Failed to copy LMP chart to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying LMP chart:', error);
    } finally {
      setCopying(false);
    }
  };

  // Copy legend as image function  
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);

    try {
      const toggleContainer = document.querySelector('.lmp-toggle-lines-section');
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
            console.log('LMP legend copied to clipboard');
          } catch (err) {
            console.error('Failed to copy LMP legend to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying LMP legend:', error);
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
            .filter((entry: any) => entry.value !== null && entry.value !== undefined && entry.name !== "Zero Line")
            .map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: ${entry.value.toFixed(2)}/MWh
              </p>
            ))}
        </div>
      );
    }
    return null;
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
        <div className="text-gray-500">Loading combined LMP data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-red-500">Error loading combined LMP data: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Action Buttons */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left spacer for future buttons */}
          <div></div>

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
              min="-100"
              max="50"
              step="10"
              value={yAxisMin}
              onChange={(e) => setYAxisMin(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[80px]">${yAxisMin}/MWh</span>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <label className="text-sm font-medium text-gray-700">Y-Axis Max:</label>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={yAxisMax}
              onChange={(e) => setYAxisMax(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[80px]">${yAxisMax}/MWh</span>
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
                energy: false,
                congestion: false,
                losses: false,
                lmp: false,
                energyT1: false,
                congestionT1: false,
                lossesT1: false,
                lmpT1: false,
                daLMP: false,
                daCongestion: false,
                daEnergy: false,
                daLoss: false,
                rtLMP: false,
              })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
            >
              Remove All
            </button>
          </div>
          
          {showCustomization && (
            <div className="lmp-toggle-lines-section grid grid-cols-1 gap-2">
            {Object.entries(visibleLines).map(([lineKey, isVisible]) => {
              const customization = lineCustomization[lineKey as keyof typeof lineCustomization];
              let lineName = lineKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              // Clean up specific line names
              if (lineKey === 'energy') lineName = 'Dayzer Energy';
              if (lineKey === 'congestion') lineName = 'Dayzer Congestion';
              if (lineKey === 'losses') lineName = 'Dayzer Loss';
              if (lineKey === 'lmp') lineName = 'Dayzer LMP';
              if (lineKey === 'energyT1') lineName = 'Dayzer Energy t-1';
              if (lineKey === 'congestionT1') lineName = 'Dayzer Congestion t-1';
              if (lineKey === 'lossesT1') lineName = 'Dayzer Loss t-1';
              if (lineKey === 'lmpT1') lineName = 'Dayzer LMP t-1';
              if (lineKey === 'daLMP') lineName = 'DA LMP';
              if (lineKey === 'daCongestion') lineName = 'DA Congestion';
              if (lineKey === 'daEnergy') lineName = 'DA Energy';
              if (lineKey === 'daLoss') lineName = 'DA Loss';
              if (lineKey === 'rtLMP') lineName = 'RT LMP';
              
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
      <div className="combined-lmp-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">LMP Forecast</h3>
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
                domain={[yAxisMin, yAxisMax]}
                ticks={(() => {
                  const roundedMin = Math.floor(yAxisMin / 5) * 5;
                  const roundedMax = Math.ceil(yAxisMax / 5) * 5;
                  const ticks = [];
                  for (let tick = roundedMin; tick <= roundedMax; tick += 5) {
                    ticks.push(tick);
                  }
                  return ticks;
                })()}
                label={{ value: '$/MWh', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero reference line */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#000000"
                strokeWidth={1}
                dot={false}
                connectNulls={true}
                name="Zero Line"
              />
              
              {/* Energy - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="energyLastWeek"
                stroke={lineCustomization.energy.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.energy.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Energy"
                connectNulls={false}
                hide={!visibleLines.energy}
              />
              <Line
                type="stepAfter"
                dataKey="energyForecast"
                stroke={lineCustomization.energy.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.energy.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Energy"
                connectNulls={false}
                hide={!visibleLines.energy}
              />

              {/* Energy t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="energyT1LastWeek"
                stroke={lineCustomization.energyT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.energyT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Energy t-1"
                connectNulls={false}
                hide={!visibleLines.energyT1}
              />
              
              {/* Congestion - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="congestionLastWeek"
                stroke={lineCustomization.congestion.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.congestion.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Congestion"
                connectNulls={false}
                hide={!visibleLines.congestion}
              />
              <Line
                type="stepAfter"
                dataKey="congestionForecast"
                stroke={lineCustomization.congestion.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.congestion.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Congestion"
                connectNulls={false}
                hide={!visibleLines.congestion}
              />

              {/* Congestion t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="congestionT1LastWeek"
                stroke={lineCustomization.congestionT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.congestionT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Congestion t-1"
                connectNulls={false}
                hide={!visibleLines.congestionT1}
              />
              
              {/* Losses - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="lossesLastWeek"
                stroke={lineCustomization.losses.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.losses.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Loss"
                connectNulls={false}
                hide={!visibleLines.losses}
              />
              <Line
                type="stepAfter"
                dataKey="lossesForecast"
                stroke={lineCustomization.losses.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.losses.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Loss"
                connectNulls={false}
                hide={!visibleLines.losses}
              />

              {/* Losses t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="lossesT1LastWeek"
                stroke={lineCustomization.lossesT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.lossesT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Loss t-1"
                connectNulls={false}
                hide={!visibleLines.lossesT1}
              />
              
              {/* Total LMP - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="lmpLastWeek"
                stroke={lineCustomization.lmp.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.lmp.style)?.dashArray || ''}
                dot={false}
                name="Dayzer LMP"
                connectNulls={false}
                hide={!visibleLines.lmp}
              />
              <Line
                type="stepAfter"
                dataKey="lmpForecast"
                stroke={lineCustomization.lmp.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.lmp.style)?.dashArray || ''}
                dot={false}
                name="Dayzer LMP"
                connectNulls={false}
                hide={!visibleLines.lmp}
              />

              {/* Total LMP t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="lmpT1LastWeek"
                stroke={lineCustomization.lmpT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.lmpT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer LMP t-1"
                connectNulls={false}
                hide={!visibleLines.lmpT1}
              />
              
              {/* DA Energy - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="daEnergyLastWeek"
                stroke={lineCustomization.daEnergy.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.daEnergy.style)?.dashArray || ''}
                dot={false}
                name="DA Energy"
                connectNulls={false}
                hide={!visibleLines.daEnergy}
              />
              
              {/* DA Congestion - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="daCongestionLastWeek"
                stroke={lineCustomization.daCongestion.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.daCongestion.style)?.dashArray || ''}
                dot={false}
                name="DA Congestion"
                connectNulls={false}
                hide={!visibleLines.daCongestion}
              />
              
              {/* DA Loss - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="daLossLastWeek"
                stroke={lineCustomization.daLoss.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.daLoss.style)?.dashArray || ''}
                dot={false}
                name="DA Loss"
                connectNulls={false}
                hide={!visibleLines.daLoss}
              />
              
              {/* DA LMP - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="daLMPLastWeek"
                stroke={lineCustomization.daLMP.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.daLMP.style)?.dashArray || ''}
                dot={false}
                name="DA LMP"
                connectNulls={false}
                hide={!visibleLines.daLMP}
              />
              
              {/* RT LMP - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="rtLMPLastWeek"
                stroke={lineCustomization.rtLMP.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.rtLMP.style)?.dashArray || ''}
                dot={false}
                name="RT LMP"
                connectNulls={false}
                hide={!visibleLines.rtLMP}
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
                  if (lineKey === 'energy') lineName = 'Dayzer Energy';
                  if (lineKey === 'congestion') lineName = 'Dayzer Congestion';
                  if (lineKey === 'losses') lineName = 'Dayzer Loss';
                  if (lineKey === 'lmp') lineName = 'Dayzer LMP';
                  if (lineKey === 'energyT1') lineName = 'Dayzer Energy t-1';
                  if (lineKey === 'congestionT1') lineName = 'Dayzer Congestion t-1';
                  if (lineKey === 'lossesT1') lineName = 'Dayzer Loss t-1';
                  if (lineKey === 'lmpT1') lineName = 'Dayzer LMP t-1';
                  if (lineKey === 'daLMP') lineName = 'DA LMP';
                  if (lineKey === 'daCongestion') lineName = 'DA Congestion';
                  if (lineKey === 'daEnergy') lineName = 'DA Energy';
                  if (lineKey === 'daLoss') lineName = 'DA Loss';
                  if (lineKey === 'rtLMP') lineName = 'RT LMP';
                  
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
    </div>
  );
}
