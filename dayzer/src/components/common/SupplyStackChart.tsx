import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SupplyDataPoint {
  datetime: string;
  'Total Generation': number;
  [fuelType: string]: number | string;
}

interface SupplyResponse {
  scenarioid: number | null;
  data: SupplyDataPoint[];
}

const SupplyStackChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<SupplyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
  const [visibleFuels, setVisibleFuels] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/supply-stack?scenarioid=${selectedScenario.scenarioid}`);
        const result: SupplyResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          
          // Extract available fuel types from the data
          if (result.data.length > 0) {
            const fuels = Object.keys(result.data[0]).filter(
              key => key !== 'datetime' && key !== 'Total Generation'
            );
            setAvailableFuels(fuels);
            
            // Initialize all fuels as visible
            const initialVisibility: { [key: string]: boolean } = {};
            fuels.forEach(fuel => {
              initialVisibility[fuel] = true;
            });
            setVisibleFuels(initialVisibility);
          }
          
          setError(null);
        } else {
          setError('Failed to fetch supply stack data');
        }
      } catch (err) {
        setError('Error loading supply stack data');
        console.error('Error fetching supply stack data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);

  // Calculate total generation dynamically based on visible fuels
  const processedData = data.map(point => {
    const newPoint = { ...point };
    
    // Recalculate total generation based on visible fuels only
    let recalculatedTotal = 0;
    availableFuels.forEach(fuel => {
      if (visibleFuels[fuel] && typeof point[fuel] === 'number') {
        recalculatedTotal += point[fuel] as number;
      }
    });
    
    newPoint['Total Generation'] = recalculatedTotal;
    return newPoint;
  });

  const toggleFuelVisibility = (fuel: string) => {
    setVisibleFuels(prev => ({
      ...prev,
      [fuel]: !prev[fuel]
    }));
  };

  const showAllFuels = () => {
    const allVisible: { [key: string]: boolean } = {};
    availableFuels.forEach(fuel => {
      allVisible[fuel] = true;
    });
    setVisibleFuels(allVisible);
  };

  const hideAllFuels = () => {
    const allHidden: { [key: string]: boolean } = {};
    availableFuels.forEach(fuel => {
      allHidden[fuel] = false;
    });
    setVisibleFuels(allHidden);
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === 'Total Generation') {
      return [`${value.toFixed(2)} GW`, 'Total Generation'];
    }
    return [`${value.toFixed(2)} GW`, name];
  };

  // Custom tick formatter to show clean date progression
  const formatDateTick = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Formatter for tooltip to show date and hour
  const formatTooltipLabel = (label: string) => {
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
  };

  // Color mapping for different fuel types
  const fuelColors: { [key: string]: string } = {
    'Solar': '#FFD700',        // Gold - bright and distinct
    'Wind': '#00CED1',         // Dark Turquoise - distinct blue-green
    'Hydro': '#1E90FF',        // Dodger Blue - clear blue
    'Natural Gas': '#FF6347',  // Tomato Red - distinct red
    'Fuel Oil': '#8B0000',     // Dark Red - darker than Natural Gas
    'Nuclear': '#9932CC',      // Dark Orchid - distinct purple
    'Battery': '#FF1493',      // Deep Pink - very distinct
    'Geothermal': '#FF8C00',   // Dark Orange - distinct from yellow/red
    'Other': '#708090',        // Slate Gray - neutral distinct
  };

  return (
    <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-6">Hourly Supply Stack</h3>

      {loading && <div className="text-gray-600">Loading chart data...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {!loading && !error && data.length > 0 && (
        <>
          {/* Fuel Type Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Fuel Types:</h3>
              <div className="space-x-2">
                <button
                  onClick={showAllFuels}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Show All
                </button>
                <button
                  onClick={hideAllFuels}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Hide All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableFuels.map(fuel => (
                <label key={fuel} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleFuels[fuel] || false}
                    onChange={() => toggleFuelVisibility(fuel)}
                    className="rounded"
                  />
                  <span 
                    className="text-sm"
                    style={{ color: fuelColors[fuel] || '#6B7280' }}
                  >
                    {fuel}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: '500px' }}>
            <ResponsiveContainer>
              <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 60, bottom: 25 }}>
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
                    value: 'Generation (GW)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelFormatter={formatTooltipLabel}
                />
                <Legend />
                
                {/* Render areas for each visible fuel type */}
                {availableFuels.map((fuel, index) => 
                  visibleFuels[fuel] && (
                    <Area
                      key={fuel}
                      type="monotone"
                      dataKey={fuel}
                      stackId="1"
                      stroke={fuelColors[fuel] || '#6B7280'}
                      fill={fuelColors[fuel] || '#6B7280'}
                      fillOpacity={0.6}
                    />
                  )
                )}
                
                {/* Total generation line overlay */}
                <Line
                  type="monotone"
                  dataKey="Total Generation"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-gray-600">No supply stack data available.</div>
      )}
    </div>
  );
};

export default SupplyStackChart; 