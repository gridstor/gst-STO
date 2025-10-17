import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import LoadForecastAccuracy from './LoadForecastAccuracy';

interface CombinedLoadDataPoint {
  datetime: string;
  // Last Week data (left side)
  dayzerLoadLastWeek?: number;
  dayzerNetLoadLastWeek?: number;
  dayzerLoadT1LastWeek?: number; // New t-1 load data
  dayzerNetLoadT1LastWeek?: number; // New t-1 net load data
  caisoLoadLastWeek?: number;
  caisoNetLoadLastWeek?: number;
  caisoLoad7DLastWeek?: number; // CAISO Load 7D last week data
  rtLoadLastWeek?: number;
  rtNetLoadLastWeek?: number;
  // Forecast data (right side)
  dayzerLoadForecast?: number;
  dayzerNetLoadForecast?: number;
  caisoLoadForecast?: number;
  caisoNetLoadForecast?: number;
  caisoLoad7DForecast?: number;
  isLastWeek: boolean; // Flag to determine background shading
}

interface CombinedLoadResponse {
  success: boolean;
  data: CombinedLoadDataPoint[];
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

export default function CombinedLoadChart() {
  const [data, setData] = useState<CombinedLoadDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CombinedLoadResponse['metadata'] | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState<number>(50000);
  const [yAxisMin, setYAxisMin] = useState<number>(-10000);
  const [viewMode, setViewMode] = useState<'full' | 'lastWeek' | 'forecast'>('full');
  const [showAccuracy, setShowAccuracy] = useState<boolean>(false);
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
    dayzerLoad: true,
    dayzerNetLoad: true,
    dayzerLoadT1: false, // New t-1 load line
    dayzerNetLoadT1: false, // New t-1 net load line
    caisoLoad: true,
    caisoNetLoad: true,
    caisoLoad7D: false, // New CAISO Load 7D line
    rtLoad: true,
    rtNetLoad: true,
  });

  const [lineCustomization, setLineCustomization] = useState({
    dayzerLoad: { color: '#ef4444', style: 'solid' }, // Red
    dayzerNetLoad: { color: '#f97316', style: 'solid' }, // Orange
    dayzerLoadT1: { color: '#b91c1c', style: 'solid' }, // Dark Red
    dayzerNetLoadT1: { color: '#c2410c', style: 'solid' }, // Dark Orange
    caisoLoad: { color: '#3b82f6', style: 'solid' }, // Blue
    caisoNetLoad: { color: '#22c55e', style: 'solid' }, // Green
    caisoLoad7D: { color: '#1e40af', style: 'solid' }, // Dark Blue
    rtLoad: { color: '#8b5cf6', style: 'solid' }, // Violet
    rtNetLoad: { color: '#ec4899', style: 'solid' }, // Pink
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
      
      // Collect values from all visible lines
      data.forEach(point => {
        if (newVisibleLines.dayzerLoad) {
          if (point.dayzerLoadLastWeek) visibleValues.push(point.dayzerLoadLastWeek);
          if (point.dayzerLoadForecast) visibleValues.push(point.dayzerLoadForecast);
        }
        if (newVisibleLines.dayzerNetLoad) {
          if (point.dayzerNetLoadLastWeek) visibleValues.push(point.dayzerNetLoadLastWeek);
          if (point.dayzerNetLoadForecast) visibleValues.push(point.dayzerNetLoadForecast);
        }
        if (newVisibleLines.dayzerLoadT1) {
          if (point.dayzerLoadT1LastWeek) visibleValues.push(point.dayzerLoadT1LastWeek);
        }
        if (newVisibleLines.dayzerNetLoadT1) {
          if (point.dayzerNetLoadT1LastWeek) visibleValues.push(point.dayzerNetLoadT1LastWeek);
        }
        if (newVisibleLines.caisoLoad) {
          if (point.caisoLoadLastWeek) visibleValues.push(point.caisoLoadLastWeek);
          if (point.caisoLoadForecast) visibleValues.push(point.caisoLoadForecast);
        }
        if (newVisibleLines.caisoNetLoad) {
          if (point.caisoNetLoadLastWeek) visibleValues.push(point.caisoNetLoadLastWeek);
          if (point.caisoNetLoadForecast) visibleValues.push(point.caisoNetLoadForecast);
        }
        if (newVisibleLines.caisoLoad7D) {
          if (point.caisoLoad7DLastWeek) visibleValues.push(point.caisoLoad7DLastWeek);
          if (point.caisoLoad7DForecast) visibleValues.push(point.caisoLoad7DForecast);
        }
        if (newVisibleLines.rtLoad) {
          if (point.rtLoadLastWeek) visibleValues.push(point.rtLoadLastWeek);
        }
        if (newVisibleLines.rtNetLoad) {
          if (point.rtNetLoadLastWeek) visibleValues.push(point.rtNetLoadLastWeek);
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
      // Use scenario IDs from component state
      console.log('Fetching with scenarios:', { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });

      // Build API URLs with scenario parameters from state
      const forecastUrl = currentWeekScenarioId 
        ? `/api/load-net-load-forecast?scenarioId=${currentWeekScenarioId}`
        : '/api/load-net-load-forecast';
        
      const lastWeekUrl = lastWeekScenarioId 
        ? `/api/load-last-week-forecast?scenarioId=${lastWeekScenarioId}`
        : '/api/load-last-week-forecast';

      console.log('API URLs:', { forecastUrl, lastWeekUrl });
      console.log('Fetching load forecast and last week data separately...');
      
      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      console.log('API Response status:', {
        forecast: forecastResponse.status,
        lastWeek: lastWeekResponse.status
      });

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        console.error('Forecast API error:', errorText);
        throw new Error(`Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        console.error('Last Week API error:', errorText);
        throw new Error(`Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

        const forecastData = await forecastResponse.json();
        const lastWeekData = await lastWeekResponse.json();

        console.log('Forecast data points:', forecastData.data?.length || 0);
        console.log('Last week data points:', lastWeekData.data?.length || 0);

        // Combine the data
        const combinedData: CombinedLoadDataPoint[] = [];

        // Add last week data
        if (lastWeekData.data) {
          lastWeekData.data.forEach((point: any) => {
            combinedData.push({
              datetime: point.datetime,
              isLastWeek: true,
              dayzerLoadLastWeek: point.dayzerLoad,
              dayzerNetLoadLastWeek: point.dayzerNetLoad,
              dayzerLoadT1LastWeek: point.dayzerLoadT1 || 0, // t-1 data from API
              dayzerNetLoadT1LastWeek: point.dayzerNetLoadT1 || 0, // t-1 data from API
              caisoLoadLastWeek: point.caisoLoad,
              caisoNetLoadLastWeek: point.caisoNetLoad,
              caisoLoad7DLastWeek: point.caisoLoad7D, // CAISO Load 7D last week data
              rtLoadLastWeek: point.rtLoad,
              rtNetLoadLastWeek: point.rtNetLoad,
            });
          });
        }

        // Add forecast data
        if (forecastData.data) {
          forecastData.data.forEach((point: any) => {
            combinedData.push({
              datetime: point.datetime,
              isLastWeek: false,
              dayzerLoadForecast: point.dayzerLoad,
              dayzerNetLoadForecast: point.dayzerNetLoad,
              caisoLoadForecast: point.caisoLoad,
              caisoNetLoadForecast: point.caisoNetLoad,
              caisoLoad7DForecast: point.caisoLoad7D,
            });
          });
        }

        // Sort by datetime
        combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

        console.log('Combined data points:', combinedData.length);
        if (combinedData.length > 0) {
          console.log('Sample combined data point:', combinedData[0]);
          console.log('Data keys in first point:', Object.keys(combinedData[0]));
          
        }
        setData(combinedData);
        
        // Auto-scale Y-axis based on initial data
        if (combinedData.length > 0) {
          const allValues: number[] = [];
          
          // Collect all visible line values
          combinedData.forEach(point => {
            if (visibleLines.dayzerLoad) {
              if (point.dayzerLoadLastWeek) allValues.push(point.dayzerLoadLastWeek);
              if (point.dayzerLoadForecast) allValues.push(point.dayzerLoadForecast);
            }
            if (visibleLines.dayzerNetLoad) {
              if (point.dayzerNetLoadLastWeek) allValues.push(point.dayzerNetLoadLastWeek);
              if (point.dayzerNetLoadForecast) allValues.push(point.dayzerNetLoadForecast);
            }
            if (visibleLines.dayzerLoadT1 && point.dayzerLoadT1LastWeek) allValues.push(point.dayzerLoadT1LastWeek);
            if (visibleLines.dayzerNetLoadT1 && point.dayzerNetLoadT1LastWeek) allValues.push(point.dayzerNetLoadT1LastWeek);
            if (visibleLines.caisoLoad) {
              if (point.caisoLoadLastWeek) allValues.push(point.caisoLoadLastWeek);
              if (point.caisoLoadForecast) allValues.push(point.caisoLoadForecast);
            }
            if (visibleLines.caisoNetLoad) {
              if (point.caisoNetLoadLastWeek) allValues.push(point.caisoNetLoadLastWeek);
              if (point.caisoNetLoadForecast) allValues.push(point.caisoNetLoadForecast);
            }
            if (visibleLines.caisoLoad7D) {
              if (point.caisoLoad7DLastWeek) allValues.push(point.caisoLoad7DLastWeek);
              if (point.caisoLoad7DForecast) allValues.push(point.caisoLoad7DForecast);
            }
            if (visibleLines.rtLoad && point.rtLoadLastWeek) allValues.push(point.rtLoadLastWeek);
            if (visibleLines.rtNetLoad && point.rtNetLoadLastWeek) allValues.push(point.rtNetLoadLastWeek);
          });

          if (allValues.length > 0) {
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const padding = (max - min) * 0.1; // 10% padding
            setYAxisMin(Math.floor(min - padding));
            setYAxisMax(Math.ceil(max + padding));
            console.log('Load chart auto-scaled Y-axis:', { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
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
        console.error('Combined load API error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch combined load data');
      } finally {
        setLoading(false);
      }
    };

  // Listen for scenario changes
  useEffect(() => {
    const handleScenarioChange = (event: CustomEvent) => {
      console.log('CombinedLoadChart received scenario change:', event.detail);
      // Store scenario IDs in state from event
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
      // Refetch data will happen automatically when state changes
    };

    window.addEventListener('scenarioChanged', handleScenarioChange as EventListener);
    
    return () => {
      window.removeEventListener('scenarioChanged', handleScenarioChange as EventListener);
    };
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
    setCopying(true);
    try {
      const chartContainer = document.querySelector('.combined-load-chart-container .recharts-wrapper');
      if (!chartContainer) {
        throw new Error('Combined load chart not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      
      const chartSection = chartContainer.closest('.bg-white.p-6.rounded-lg.shadow-lg.border.border-gray-200') as HTMLElement;
      if (!chartSection) {
        throw new Error('Chart section not found');
      }

      const canvas = await html2canvas(chartSection, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopying(false);
          } catch (clipboardError) {
            console.error('Failed to copy to clipboard:', clipboardError);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'combined-load-chart.png';
            link.click();
            URL.revokeObjectURL(url);
            setCopying(false);
          }
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error capturing chart:', error);
      setCopying(false);
      alert('Failed to copy chart. Please try right-clicking and selecting "Copy image" instead.');
    }
  };

  // Copy legend as image function
  const copyLegendAsImage = async () => {
    setCopyingLegend(true);
    try {
      // Find the line toggle buttons container (this serves as our legend)
      const legendContainer = document.querySelector('.bg-gray-50 .grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6');
      if (!legendContainer) {
        throw new Error('Legend not found');
      }

      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(legendContainer as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopyingLegend(false);
          } catch (clipboardError) {
            console.error('Failed to copy legend to clipboard:', clipboardError);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'combined-load-legend.png';
            link.click();
            URL.revokeObjectURL(url);
            setCopyingLegend(false);
          }
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error capturing legend:', error);
      setCopyingLegend(false);
      alert('Failed to copy legend. Please try right-clicking and selecting "Copy image" instead.');
    }
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const datetime = new Date(label);
      const dateStr = datetime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const timeStr = datetime.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      });

      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-medium mb-2">{`${dateStr} at ${timeStr}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value?.toLocaleString() || 0} MW`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels to show only at 12:00 AM for each day
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    const hour = date.getHours();
    
    if (hour === 0) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
    return '';
  };

  // Format Y-axis numbers with commas
  const formatYAxisTick = (value: number) => {
    return `${value.toLocaleString()}`;
  };

  // Calculate Y-axis ticks at multiples of 5,000 for cleaner intervals
  const calculateYAxisTicks = (min: number, max: number) => {
    const roundedMin = Math.floor(min / 5000) * 5000;
    const roundedMax = Math.ceil(max / 5000) * 5000;
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
        <div className="text-gray-500">Loading combined load data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading combined load data</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-gray-500">No combined load data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Copy Buttons - Outside Screenshot Area */}
      <div className="flex justify-between items-start">
        {/* Show Accuracy Button */}
        <button
          onClick={() => setShowAccuracy(!showAccuracy)}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
            showAccuracy
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {showAccuracy ? 'Hide' : 'Show'} Load Forecast Accuracy
        </button>
        
        <div className="flex gap-2">
          {/* Copy Chart Button */}
          <button
            onClick={copyChartAsImage}
            disabled={copying}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors"
          >
            {copying ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Copying...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Chart
              </>
            )}
          </button>
          
          {/* Copy Legend Button */}
          <button
            onClick={copyLegendAsImage}
            disabled={copyingLegend}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors"
          >
            {copyingLegend ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      {/* Y-Axis Range Controls and View Toggle - Outside Screenshot Area */}
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
              min="-20000"
              max="10000"
              step="5000"
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
              min="30000"
              max="80000"
              step="5000"
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
                dayzerLoad: false,
                dayzerNetLoad: false,
                dayzerLoadT1: false,
                dayzerNetLoadT1: false,
                caisoLoad: false,
                caisoNetLoad: false,
                caisoLoad7D: false,
                rtLoad: false,
                rtNetLoad: false,
              })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
            >
              Remove All
            </button>
          </div>
          
          {showCustomization && (
            <div className="load-toggle-lines-section grid grid-cols-1 gap-2">
            {Object.entries(visibleLines).map(([lineKey, isVisible]) => {
              const customization = lineCustomization[lineKey as keyof typeof lineCustomization];
              let lineName = lineKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              // Clean up specific line names
              if (lineKey === 'dayzerLoad') lineName = 'Dayzer Load';
              if (lineKey === 'dayzerNetLoad') lineName = 'Dayzer Net Load';
              if (lineKey === 'dayzerLoadT1') lineName = 'Dayzer Load t-1';
              if (lineKey === 'dayzerNetLoadT1') lineName = 'Dayzer Net Load t-1';
              if (lineKey === 'caisoLoad') lineName = 'CAISO DA Load';
              if (lineKey === 'caisoNetLoad') lineName = 'CAISO Net Load';
              if (lineKey === 'caisoLoad7D') lineName = 'CAISO 7D Load';
              if (lineKey === 'rtLoad') lineName = 'RT Load';
              if (lineKey === 'rtNetLoad') lineName = 'RT Net Load';
              
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

      {/* Chart Container - This is what gets captured */}
      <div className="combined-load-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Load Forecast</h3>
        </div>
        
        <div className="h-[500px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 20, left: 80, bottom: 20 }}
            >
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
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatYAxisTick}
                domain={[yAxisMin, yAxisMax]}
                ticks={calculateYAxisTicks(yAxisMin, yAxisMax)}
                label={{ 
                  value: 'Load (MW)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: -50,
                  style: { textAnchor: 'middle' }
                }}
                axisLine={true}
                tickLine={true}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference Line at Y=0 */}
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="#000000"
                strokeWidth={1}
                dot={false}
                name=""
                connectNulls={true}
              />
              
              {/* Dayzer Load - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerLoadLastWeek"
                stroke={lineCustomization.dayzerLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerLoad.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Load Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerLoad}
              />
              <Line
                type="stepAfter"
                dataKey="dayzerLoadForecast"
                stroke={lineCustomization.dayzerLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerLoad.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Load Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerLoad}
              />
              
              {/* Dayzer Net Load - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerNetLoadLastWeek"
                stroke={lineCustomization.dayzerNetLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerNetLoad.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Net Load Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerNetLoad}
              />
              <Line
                type="stepAfter"
                dataKey="dayzerNetLoadForecast"
                stroke={lineCustomization.dayzerNetLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerNetLoad.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Net Load Forecast"
                connectNulls={false}
                hide={!visibleLines.dayzerNetLoad}
              />
              
              {/* Dayzer Load t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerLoadT1LastWeek"
                stroke={lineCustomization.dayzerLoadT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerLoadT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Load t-1"
                connectNulls={false}
                hide={!visibleLines.dayzerLoadT1}
              />
              
              {/* Dayzer Net Load t-1 - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="dayzerNetLoadT1LastWeek"
                stroke={lineCustomization.dayzerNetLoadT1.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.dayzerNetLoadT1.style)?.dashArray || ''}
                dot={false}
                name="Dayzer Net Load t-1"
                connectNulls={false}
                hide={!visibleLines.dayzerNetLoadT1}
              />
              
              {/* CAISO Load - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="caisoLoadLastWeek"
                stroke={lineCustomization.caisoLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoLoad.style)?.dashArray || ''}
                dot={false}
                name="CAISO DA Load Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoLoad}
              />
              <Line
                type="stepAfter"
                dataKey="caisoLoadForecast"
                stroke={lineCustomization.caisoLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoLoad.style)?.dashArray || ''}
                dot={false}
                name="CAISO DA Load Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoLoad}
              />

              {/* CAISO Load 7D - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="caisoLoad7DLastWeek"
                stroke={lineCustomization.caisoLoad7D.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoLoad7D.style)?.dashArray || ''}
                dot={false}
                name="CAISO Load 7D Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoLoad7D}
              />
              <Line
                type="stepAfter"
                dataKey="caisoLoad7DForecast"
                stroke={lineCustomization.caisoLoad7D.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoLoad7D.style)?.dashArray || ''}
                dot={false}
                name="CAISO Load 7D Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoLoad7D}
              />
              
              {/* CAISO Net Load - Dynamic styling */}
              <Line
                type="stepAfter"
                dataKey="caisoNetLoadLastWeek"
                stroke={lineCustomization.caisoNetLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoNetLoad.style)?.dashArray || ''}
                dot={false}
                name="CAISO DA Net Load Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoNetLoad}
              />
              <Line
                type="stepAfter"
                dataKey="caisoNetLoadForecast"
                stroke={lineCustomization.caisoNetLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.caisoNetLoad.style)?.dashArray || ''}
                dot={false}
                name="CAISO DA Net Load Forecast"
                connectNulls={false}
                hide={!visibleLines.caisoNetLoad}
              />
              
              {/* RT Load Actuals - Dynamic styling */}
              <Line
                type="monotone"
                dataKey="rtLoadLastWeek"
                stroke={lineCustomization.rtLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.rtLoad.style)?.dashArray || ''}
                dot={false}
                name="RT Load Actuals"
                connectNulls={false}
                hide={!visibleLines.rtLoad}
              />
              
              {/* RT Net Load Actuals - Dynamic styling */}
              <Line
                type="monotone"
                dataKey="rtNetLoadLastWeek"
                stroke={lineCustomization.rtNetLoad.color}
                strokeWidth={2}
                strokeDasharray={styleOptions.find(s => s.value === lineCustomization.rtNetLoad.style)?.dashArray || ''}
                dot={false}
                name="RT Net Load Actuals"
                connectNulls={false}
                hide={!visibleLines.rtNetLoad}
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
                  if (lineKey === 'dayzerLoad') lineName = 'Dayzer Load';
                  if (lineKey === 'dayzerNetLoad') lineName = 'Dayzer Net Load';
                  if (lineKey === 'dayzerLoadT1') lineName = 'Dayzer Load t-1';
                  if (lineKey === 'dayzerNetLoadT1') lineName = 'Dayzer Net Load t-1';
                  if (lineKey === 'caisoLoad') lineName = 'CAISO Load';
                  if (lineKey === 'caisoNetLoad') lineName = 'CAISO Net Load';
                  if (lineKey === 'caisoLoad7D') lineName = 'CAISO Load 7D';
                  if (lineKey === 'rtLoad') lineName = 'RT Load';
                  if (lineKey === 'rtNetLoad') lineName = 'RT Net Load';
                  
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

      {/* Conditional Load Forecast Accuracy Section */}
      {showAccuracy && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Load Forecast Accuracy</h3>
            <p className="text-sm text-gray-600">Error metrics comparing forecasts vs actual RT data</p>
          </div>
          <LoadForecastAccuracy />
        </div>
      )}

    </div>
  );
}
