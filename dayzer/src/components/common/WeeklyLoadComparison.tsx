import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface LoadDataPoint {
  datetime: string;
  dayName: string;
  thisWeekValue: number | null;
  lastWeekValue: number | null;
}

interface WeeklyLoadResponse {
  scenarioid: number | null;
  simulationDate: string;
  metric: string;
  data: LoadDataPoint[];
  metadata: {
    thisWeekRange: string;
    lastWeekRange: string;
    totalHours: number;
    thisWeekDataPoints: number;
    lastWeekDataPoints: number;
    secondaryDBStatus: string;
  };
}

const WeeklyLoadComparison: React.FC = React.memo(() => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<LoadDataPoint[]>([]);
  const [metadata, setMetadata] = useState<WeeklyLoadResponse['metadata'] | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('totalDemand');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<LoadDataPoint | null>(null);
  const [pinnedData, setPinnedData] = useState<LoadDataPoint | null>(null);

  const metricOptions = [
    { value: 'totalDemand', label: 'Total Demand' },
    { value: 'netLoad', label: 'Net Load' },
    { value: 'renewableGeneration', label: 'Renewable Generation' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/weekly-load-comparison?scenarioid=${selectedScenario.scenarioid}&metric=${selectedMetric}`);
        const result: WeeklyLoadResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          setMetadata(result.metadata);
          setError(null);
        } else {
          setError('Failed to fetch weekly load comparison data');
        }
      } catch (err) {
        setError('Error loading weekly load comparison data');
        console.error('Error fetching weekly load comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, selectedMetric]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMouseMove = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0] && !pinnedData) {
      const newHoveredData = data.activePayload[0].payload;
      
      // Only update if the data actually changed
      if (!hoveredData || hoveredData.datetime !== newHoveredData.datetime) {
        setHoveredData(newHoveredData);
      }
    }
  }, [pinnedData, hoveredData]);

  const handleMouseLeave = useCallback(() => {
    if (!pinnedData) {
      setHoveredData(null);
    }
  }, [pinnedData]);

  // Handle click to pin/unpin data
  const handleChartClick = useCallback((event: any) => {
    if (event && event.activePayload && event.activePayload.length > 0) {
      const clickedData = event.activePayload[0].payload;
      if (pinnedData && pinnedData.datetime === clickedData.datetime) {
        // Clicking on the same pinned data - unpin it
        setPinnedData(null);
      } else {
        // Pin the clicked data
        setPinnedData(clickedData);
        setHoveredData(null); // Clear hover data when pinning
      }
    } else {
      // Clicked on empty space - unpin
      setPinnedData(null);
    }
  }, [pinnedData]);

  const handleMetricChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(event.target.value);
    setPinnedData(null); // Clear pinned data when metric changes
    setHoveredData(null); // Clear hover data when metric changes
  }, []);

  // Memoize the selected metric label
  const selectedMetricLabel = useMemo(() => {
    const option = metricOptions.find(opt => opt.value === selectedMetric);
    return option ? option.label : 'Total Demand';
  }, [selectedMetric]);

  // Memoize the active data for the info table
  const activeData = useMemo(() => pinnedData || hoveredData, [pinnedData, hoveredData]);

  // Memoize the table content to prevent unnecessary recalculations
  const tableContent = useMemo(() => {
    if (!activeData) return null;
    
    const forecastDate = new Date(activeData.datetime);
    const lastWeekDate = new Date(forecastDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const forecastValue = activeData.thisWeekValue;
    const lastWeekValue = activeData.lastWeekValue;
    
    // Calculate difference and percentage
    let difference = null;
    let percentageChange = null;
    let changeDisplay = 'N/A';
    
    if (forecastValue !== null && lastWeekValue !== null) {
      difference = forecastValue - lastWeekValue;
      percentageChange = ((difference / lastWeekValue) * 100);
      const arrow = difference > 0 ? '↑' : difference < 0 ? '↓' : '→';
      const sign = difference > 0 ? '+' : '';
      changeDisplay = `${arrow} ${sign}${difference.toFixed(2)} GW (${sign}${percentageChange.toFixed(1)}%)`;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const forecastDay = dayNames[forecastDate.getDay()];
    const lastWeekDay = dayNames[lastWeekDate.getDay()];
    const sameDay = forecastDay === lastWeekDay;
    
    return {
      forecastDate,
      lastWeekDate,
      forecastValue,
      lastWeekValue,
      difference,
      changeDisplay,
      forecastDay,
      lastWeekDay,
      sameDay
    };
  }, [activeData]);

  const formatTooltipLabel = useCallback((label: string) => {
    const date = new Date(label);
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })}`;
  }, []);

  const formatDateTick = useCallback((tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short'
    });
  }, []);

  return (
    <div className="bg-white border-l-4 border-gs-green-500 rounded-lg shadow-gs-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gs-gray-900">Weekly Load Comparison</h3>
        <select
          value={selectedMetric}
          onChange={handleMetricChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {metricOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {metadata && (
        <div className="mb-4 text-sm text-gray-600">
          <p>This Week: {metadata.thisWeekRange}</p>
          <p>Last Week: {metadata.lastWeekRange}</p>
        </div>
      )}

      {loading && <div className="text-gray-600">Loading chart data...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {!loading && !error && data.length > 0 && (
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer>
            <LineChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 60, bottom: 25 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="datetime"
                tickFormatter={formatDateTick}
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval={23}
                height={50}
              />
              <YAxis 
                label={{ 
                  value: `${selectedMetricLabel} (GW)`, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Legend 
                formatter={(value) => {
                  const displayNames: { [key: string]: string } = {
                    thisWeekValue: 'Forecast Week',
                    lastWeekValue: 'Last Week'
                  };
                  return displayNames[value] || value;
                }}
              />
              
              {/* Forecast Week - Black solid line */}
              <Line
                type="monotone"
                dataKey="thisWeekValue"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
                strokeDasharray=""
                connectNulls={false}
                name="Forecast Week"
              />
              
              {/* Last Week - Red dashed line */}
              <Line
                type="monotone"
                dataKey="lastWeekValue"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                connectNulls={false}
                name="Last Week"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-gray-600">No weekly load comparison data available.</div>
      )}

      {/* Fixed info area below chart */}
      <div className="mt-4 h-32 flex items-center">
        {activeData ? (
          <div className="w-full">
            {pinnedData && (
              <div className="flex justify-end mb-2">
                <button 
                  onClick={() => setPinnedData(null)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Unpin
                </button>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded p-2 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 px-2 font-medium text-gray-700 bg-gray-100 text-xs">Metric</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 bg-gray-100 text-xs">Forecast Week</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 bg-gray-100 text-xs">Last Week</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 bg-gray-100 text-xs">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {tableContent && (
                    <>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 px-2 font-medium text-gray-600 text-xs">Time</td>
                        <td className="py-1 px-2 text-black text-xs">{formatTooltipLabel(tableContent.forecastDate.toISOString())}</td>
                        <td className="py-1 px-2 text-red-500 text-xs">{formatTooltipLabel(tableContent.lastWeekDate.toISOString())}</td>
                        <td className="py-1 px-2 text-gray-600 text-xs">{tableContent.sameDay ? 'Same Hour' : 'Different Hour'}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 px-2 font-medium text-gray-600 text-xs">{selectedMetricLabel}</td>
                        <td className="py-1 px-2 text-black text-xs">
                          {tableContent.forecastValue !== null ? `${Number(tableContent.forecastValue).toFixed(2)} GW` : 'No data'}
                        </td>
                        <td className="py-1 px-2 text-red-500 text-xs">
                          {tableContent.lastWeekValue !== null ? `${Number(tableContent.lastWeekValue).toFixed(2)} GW` : 'No data'}
                        </td>
                        <td className={`py-1 px-2 font-medium text-xs ${
                          tableContent.difference === null ? 'text-gray-400' : 
                          tableContent.difference > 0 ? 'text-green-600' : 
                          tableContent.difference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {tableContent.changeDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 font-medium text-gray-600 text-xs">Day</td>
                        <td className="py-1 px-2 text-black text-xs">{tableContent.forecastDay}</td>
                        <td className="py-1 px-2 text-red-500 text-xs">{tableContent.lastWeekDay}</td>
                        <td className="py-1 px-2 text-gray-600 text-xs">{tableContent.sameDay ? 'Same Day' : 'Different Day'}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500 text-sm">Hover over the chart to see detailed breakdown, or click to pin data</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default WeeklyLoadComparison; 