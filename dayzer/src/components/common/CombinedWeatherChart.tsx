import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface CombinedWeatherDataPoint {
  datetime: string;
  // Last Week data (left side)
  temperatureForecastLastWeek?: number;
  temperatureActualLastWeek?: number;
  temperatureNormalLastWeek?: number;
  hddLastWeek?: number;
  cddLastWeek?: number;
  // Forecast data (right side)
  temperatureForecastForecast?: number;
  isLastWeek: boolean; // Flag to determine background shading
}

interface CombinedWeatherResponse {
  success: boolean;
  data: CombinedWeatherDataPoint[];
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

export default function CombinedWeatherChart() {
  const [data, setData] = useState<CombinedWeatherDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CombinedWeatherResponse['metadata'] | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [tempYAxisMax, setTempYAxisMax] = useState<number>(100);
  const [tempYAxisMin, setTempYAxisMin] = useState<number>(30);
  const [degreeYAxisMax, setDegreeYAxisMax] = useState<number>(50);
  const [degreeYAxisMin, setDegreeYAxisMin] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'full' | 'lastWeek' | 'forecast'>('full');
  const [showCustomization, setShowCustomization] = useState<boolean>(false);
  
  // Store current scenario IDs in component state
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState<string | null>(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState<string | null>(null);
  
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
    temperatureForecast: true,
    temperatureActual: true,
    temperatureNormal: true,
    hdd: true,
    cdd: true,
  });

  const [lineCustomization, setLineCustomization] = useState({
    temperatureForecast: { color: '#3b82f6', style: 'solid' }, // Blue
    temperatureActual: { color: '#ef4444', style: 'solid' }, // Red
    temperatureNormal: { color: '#22c55e', style: 'solid' }, // Green
    hdd: { color: '#8b5cf6', style: 'solid' }, // Violet
    cdd: { color: '#f59e0b', style: 'solid' }, // Amber
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
      // Get values for visible temperature lines
      const tempValues: number[] = [];
      if (newVisibleLines.temperatureForecast) {
        data.forEach(point => {
          if (point.temperatureForecastLastWeek) tempValues.push(point.temperatureForecastLastWeek);
          if (point.temperatureForecastForecast) tempValues.push(point.temperatureForecastForecast);
        });
      }
      if (newVisibleLines.temperatureActual) {
        data.forEach(point => {
          if (point.temperatureActualLastWeek) tempValues.push(point.temperatureActualLastWeek);
        });
      }
      if (newVisibleLines.temperatureNormal) {
        data.forEach(point => {
          if (point.temperatureNormalLastWeek) tempValues.push(point.temperatureNormalLastWeek);
        });
      }

      // Get values for visible degree-day lines
      const degreeValues: number[] = [];
      if (newVisibleLines.hdd) {
        data.forEach(point => {
          if (point.hddLastWeek) degreeValues.push(point.hddLastWeek);
        });
      }
      if (newVisibleLines.cdd) {
        data.forEach(point => {
          if (point.cddLastWeek) degreeValues.push(point.cddLastWeek);
        });
      }

      // Auto-scale temperature Y-axis
      if (tempValues.length > 0) {
        const tempMin = Math.min(...tempValues);
        const tempMax = Math.max(...tempValues);
        const tempPadding = (tempMax - tempMin) * 0.1; // 10% padding
        setTempYAxisMin(Math.floor(tempMin - tempPadding));
        setTempYAxisMax(Math.ceil(tempMax + tempPadding));
      }

      // Auto-scale degree-days Y-axis
      if (degreeValues.length > 0) {
        const degreeMin = Math.min(...degreeValues);
        const degreeMax = Math.max(...degreeValues);
        const degreePadding = (degreeMax - degreeMin) * 0.1; // 10% padding
        setDegreeYAxisMin(Math.floor(degreeMin - degreePadding));
        setDegreeYAxisMax(Math.ceil(degreeMax + degreePadding));
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use scenario IDs from component state
      console.log('Fetching weather with scenarios:', { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });

      // Build API URLs with scenario parameters from state
      const forecastUrl = currentWeekScenarioId 
        ? `/api/weather-forecast?scenarioId=${currentWeekScenarioId}`
        : '/api/weather-forecast';
        
      const lastWeekUrl = lastWeekScenarioId 
        ? `/api/weather-last-week-forecast?scenarioId=${lastWeekScenarioId}`
        : '/api/weather-last-week-forecast';

      console.log('Weather API URLs:', { forecastUrl, lastWeekUrl });
      console.log('Fetching weather forecast and last week data separately...');
      
      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      console.log('Weather forecast response status:', forecastResponse.status);
      console.log('Weather last week response status:', lastWeekResponse.status);

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`Weather Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`Weather Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();

      console.log('Weather Forecast data:', forecastData);
      console.log('Weather Last week data:', lastWeekData);
      console.log('Weather Forecast data points:', forecastData.data?.length || 0);
      console.log('Weather Last week data points:', lastWeekData.data?.length || 0);

      // Combine the data
      const combinedData: CombinedWeatherDataPoint[] = [];

      // Add last week data
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point: any) => {
            combinedData.push({
              datetime: point.datetime,
              isLastWeek: true,
              temperatureForecastLastWeek: point.temperatureForecast,
              temperatureActualLastWeek: point.temperatureActual,
              temperatureNormalLastWeek: point.temperatureNormal,
              hddLastWeek: point.hdd,
              cddLastWeek: point.cdd,
            });
        });
      }

      // Add forecast data
      if (forecastData.data) {
        forecastData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            temperatureForecastForecast: point.temperatureForecast,
          });
        });
      }

      // Sort by datetime
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

      console.log('Combined weather data points:', combinedData.length);
      if (combinedData.length > 0) {
        console.log('Sample combined weather data point:', combinedData[0]);
        console.log('Data keys in first point:', Object.keys(combinedData[0]));
        
      }

      // Auto-scale Y-axis based on data
      if (combinedData.length > 0) {
        const tempValues = combinedData.flatMap(point => [
          point.temperatureActualLastWeek,
          point.temperatureNormalLastWeek,
          point.temperatureForecastForecast
        ].filter(v => v !== null && v !== undefined));

        const degreeValues = combinedData.flatMap(point => [
          point.hddLastWeek,
          point.cddLastWeek
        ].filter(v => v !== null && v !== undefined));

        if (tempValues.length > 0) {
          const tempMin = Math.min(...tempValues);
          const tempMax = Math.max(...tempValues);
          const tempPadding = (tempMax - tempMin) * 0.1; // 10% padding
          setTempYAxisMin(Math.floor(tempMin - tempPadding));
          setTempYAxisMax(Math.ceil(tempMax + tempPadding));
        }

        if (degreeValues.length > 0) {
          const degreeMin = Math.min(...degreeValues);
          const degreeMax = Math.max(...degreeValues);
          const degreePadding = (degreeMax - degreeMin) * 0.1; // 10% padding
          setDegreeYAxisMin(Math.floor(degreeMin - degreePadding));
          setDegreeYAxisMax(Math.ceil(degreeMax + degreePadding));
        }
      }

      setData(combinedData);
      
      // Auto-scale Y-axes based on initial data
      if (combinedData.length > 0) {
        const tempValues: number[] = [];
        const degreeValues: number[] = [];
        
        // Collect all visible line values
        combinedData.forEach(point => {
          // Temperature values
          if (visibleLines.temperatureForecast && point.temperatureForecastLastWeek) tempValues.push(point.temperatureForecastLastWeek);
          if (visibleLines.temperatureForecast && point.temperatureForecastForecast) tempValues.push(point.temperatureForecastForecast);
          if (visibleLines.temperatureActual && point.temperatureActualLastWeek) tempValues.push(point.temperatureActualLastWeek);
          if (visibleLines.temperatureNormal && point.temperatureNormalLastWeek) tempValues.push(point.temperatureNormalLastWeek);
          
          // Degree day values
          if (visibleLines.hdd && point.hddLastWeek) degreeValues.push(point.hddLastWeek);
          if (visibleLines.cdd && point.cddLastWeek) degreeValues.push(point.cddLastWeek);
        });

        // Auto-scale temperature axis
        if (tempValues.length > 0) {
          const min = Math.min(...tempValues);
          const max = Math.max(...tempValues);
          const padding = (max - min) * 0.1; // 10% padding
          setTempYAxisMin(Math.floor(min - padding));
          setTempYAxisMax(Math.ceil(max + padding));
          console.log('Weather chart auto-scaled Temperature Y-axis:', { min, max, tempYAxisMin: Math.floor(min - padding), tempYAxisMax: Math.ceil(max + padding) });
        }

        // Auto-scale degree days axis
        if (degreeValues.length > 0) {
          const min = Math.min(...degreeValues);
          const max = Math.max(...degreeValues);
          const padding = (max - min) * 0.1; // 10% padding
          setDegreeYAxisMin(Math.floor(min - padding));
          setDegreeYAxisMax(Math.ceil(max + padding));
          console.log('Weather chart auto-scaled Degree Days Y-axis:', { min, max, degreeYAxisMin: Math.floor(min - padding), degreeYAxisMax: Math.ceil(max + padding) });
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
      console.error('Combined weather data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch combined weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for scenario changes from the date picker
    const handleScenarioChange = (event: CustomEvent) => {
      console.log('Weather chart received scenario change:', event.detail);
      // Store scenario IDs in state from event
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
      // Refetch will happen automatically when state changes
    };

    window.addEventListener('scenarioChanged', handleScenarioChange as EventListener);
    return () => window.removeEventListener('scenarioChanged', handleScenarioChange as EventListener);
  }, []);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);
  
  // Refetch when scenario IDs change
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);

  // Copy chart as image function
  const copyChartAsImage = async () => {
    if (copying) return;
    setCopying(true);

    try {
      const chartContainer = document.querySelector('.combined-weather-chart-container');
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
            console.log('Weather chart copied to clipboard');
          } catch (err) {
            console.error('Failed to copy weather chart to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying weather chart:', error);
    } finally {
      setCopying(false);
    }
  };

  // Copy legend as image function  
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);

    try {
      const toggleContainer = document.querySelector('.weather-toggle-lines-section');
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
            console.log('Weather legend copied to clipboard');
          } catch (err) {
            console.error('Failed to copy weather legend to clipboard:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error copying weather legend:', error);
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
            .map((entry: any, index: number) => {
              const unit = entry.dataKey.includes('temperature') ? '°F' : 
                          (entry.dataKey.includes('hdd') || entry.dataKey.includes('cdd')) ? ' degree-days' : '';
              return (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {entry.name}: {entry.value.toFixed(1)}{unit}
                </p>
              );
            })}
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels - add one day to correct the offset
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    date.setDate(date.getDate() + 1); // Add one day
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Format Y-axis labels for temperature
  const formatTempYAxisTick = (value: number) => {
    return `${value}°F`;
  };

  // Format Y-axis labels for degree days
  const formatDegreeYAxisTick = (value: number) => {
    return `${value}`;
  };

  // Generate Y-axis ticks for temperature at multiples of 5
  const generateTempYAxisTicks = () => {
    const min = Math.floor(tempYAxisMin / 5) * 5;
    const max = Math.ceil(tempYAxisMax / 5) * 5;
    const ticks = [];
    for (let tick = min; tick <= max; tick += 5) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };

  // Generate Y-axis ticks for degree days at multiples of 5
  const generateDegreeYAxisTicks = () => {
    const min = Math.floor(degreeYAxisMin / 5) * 5;
    const max = Math.ceil(degreeYAxisMax / 5) * 5;
    const ticks = [];
    for (let tick = min; tick <= max; tick += 5) {
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
  
  // Debug grey background (after variables are defined)
  console.log('Grey background debug:');
  console.log('- lastWeekEndIndex:', lastWeekEndIndex);
  console.log('- lastWeekEndDate:', lastWeekEndDate);
  console.log('- forecastStartDate:', forecastStartDate);
  console.log('- showGreyBackground:', showGreyBackground);
  console.log('- filteredData length:', filteredData.length);
  if (filteredData.length > 0) {
    console.log('- first filtered data:', filteredData[0]?.datetime);
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading combined weather data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-red-500">Error loading combined weather data: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Action Buttons */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left spacer */}
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
        <div className="grid grid-cols-5 gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('full')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Full
              </button>
              <button
                onClick={() => setViewMode('lastWeek')}
                className={`px-2 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${
                  viewMode === 'lastWeek'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setViewMode('forecast')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'forecast'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Forecast
              </button>
            </div>
          </div>
        
          {/* Temperature Y-Axis Min Control */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">Temp Min:</label>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={tempYAxisMin}
              onChange={(e) => setTempYAxisMin(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{tempYAxisMin}°F</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">Temp Max:</label>
            <input
              type="range"
              min="70"
              max="120"
              step="5"
              value={tempYAxisMax}
              onChange={(e) => setTempYAxisMax(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{tempYAxisMax}°F</span>
          </div>

          {/* Degree Days Y-Axis Min Control */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">DD Min:</label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={degreeYAxisMin}
              onChange={(e) => setDegreeYAxisMin(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{degreeYAxisMin}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <label className="text-sm font-medium text-gray-700">DD Max:</label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={degreeYAxisMax}
              onChange={(e) => setDegreeYAxisMax(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{degreeYAxisMax}</span>
          </div>
        </div>
        
        {/* Line Customization List */}
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center justify-start mb-3">
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
          </div>
          
          {showCustomization && (
            <div className="weather-toggle-lines-section grid grid-cols-1 gap-2">
            {Object.entries(visibleLines).map(([lineKey, isVisible]) => {
              const customization = lineCustomization[lineKey as keyof typeof lineCustomization];
              let lineName = lineKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              // Capitalize HDD and CDD
              if (lineKey === 'hdd') lineName = 'HDD';
              if (lineKey === 'cdd') lineName = 'CDD';
              
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
                    
                    {/* Right: Style Selector + Preview + Colors */}
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
      <div className="combined-weather-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Weather Forecast</h3>
        </div>
        
        <div className="h-[500px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
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
                tickFormatter={formatXAxisTick}
                stroke="#6b7280"
                fontSize={12}
                height={40}
                interval={23}
                axisLine={true}
                tickLine={true}
              />
              
              {/* Left Y-Axis for Temperature */}
              <YAxis 
                yAxisId="temperature"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatTempYAxisTick}
                domain={[tempYAxisMin, tempYAxisMax]}
                ticks={generateTempYAxisTicks()}
                label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Right Y-Axis for Degree Days */}
              <YAxis 
                yAxisId="degreeDays"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatDegreeYAxisTick}
                domain={[degreeYAxisMin, degreeYAxisMax]}
                ticks={generateDegreeYAxisTicks()}
                label={{ value: 'Degree Days', angle: 90, position: 'insideRight' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Temperature Forecast - Dynamic styling */}
              <Line
                yAxisId="temperature"
                type="stepAfter"
                dataKey="temperatureForecastLastWeek"
                stroke={lineCustomization.temperatureForecast.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.temperatureForecast.style)?.dashArray || ''}
                dot={false}
                name="Temperature Forecast"
                connectNulls={false}
                hide={!visibleLines.temperatureForecast}
              />
              <Line
                yAxisId="temperature"
                type="stepAfter"
                dataKey="temperatureForecastForecast"
                stroke={lineCustomization.temperatureForecast.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.temperatureForecast.style)?.dashArray || ''}
                dot={false}
                name="Temperature Forecast"
                connectNulls={false}
                hide={!visibleLines.temperatureForecast}
              />
              
              {/* Temperature Actual - Dynamic styling */}
              <Line
                yAxisId="temperature"
                type="stepAfter"
                dataKey="temperatureActualLastWeek"
                stroke={lineCustomization.temperatureActual.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.temperatureActual.style)?.dashArray || ''}
                dot={false}
                name="Temperature Actual"
                connectNulls={false}
                hide={!visibleLines.temperatureActual}
              />
              
              {/* Normal Temperature - Dynamic styling */}
              <Line
                yAxisId="temperature"
                type="stepAfter"
                dataKey="temperatureNormalLastWeek"
                stroke={lineCustomization.temperatureNormal.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.temperatureNormal.style)?.dashArray || ''}
                dot={false}
                name="Normal Temperature"
                connectNulls={false}
                hide={!visibleLines.temperatureNormal}
              />
              
              {/* HDD - Dynamic styling */}
              <Line
                yAxisId="degreeDays"
                type="stepAfter"
                dataKey="hddLastWeek"
                stroke={lineCustomization.hdd.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.hdd.style)?.dashArray || ''}
                dot={false}
                name="HDD"
                connectNulls={false}
                hide={!visibleLines.hdd}
              />
              
              {/* CDD - Dynamic styling */}
              <Line
                yAxisId="degreeDays"
                type="stepAfter"
                dataKey="cddLastWeek"
                stroke={lineCustomization.cdd.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.cdd.style)?.dashArray || ''}
                dot={false}
                name="CDD"
                connectNulls={false}
                hide={!visibleLines.cdd}
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
                  if (lineKey === 'temperatureForecast') lineName = 'Temperature Forecast';
                  if (lineKey === 'temperatureActual') lineName = 'Temperature Actual';
                  if (lineKey === 'temperatureNormal') lineName = 'Normal Temperature';
                  if (lineKey === 'hdd') lineName = 'HDD';
                  if (lineKey === 'cdd') lineName = 'CDD';
                  
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
