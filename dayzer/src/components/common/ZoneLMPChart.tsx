import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface LMPDataPoint {
  datetime: string;
  energy: number;
  congestion: number;
  losses: number;
  totalLMP: number;
}

interface Zone {
  id: number;
  name: string;
}

interface LMPResponse {
  scenarioid: number | null;
  data: LMPDataPoint[];
  zones: Zone[];
}

const ZoneLMPChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<LMPDataPoint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // First, fetch zones list
  useEffect(() => {
    const fetchZones = async () => {
      if (!selectedScenario) {
        return;
      }

      try {
        const response = await fetch(`/api/zone-lmp?scenarioid=${selectedScenario.scenarioid}`);
        const result: LMPResponse = await response.json();
        
        if (response.ok) {
          setZones(result.zones);
        } else {
          console.error('Failed to fetch zones');
        }
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };

    fetchZones();
  }, [selectedScenario]);

  // Auto-select Southern CA Edison as default zone
  useEffect(() => {
    if (zones.length > 0 && selectedZone === null) {
      const sceZone = zones.find(zone => zone.name === "Southern CA Edison");
      if (sceZone) {
        setSelectedZone(sceZone.id);
      }
    }
  }, [zones, selectedZone]);

  // Fetch data for selected zone
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario || !selectedZone) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/zone-lmp?scenarioid=${selectedScenario.scenarioid}&zoneid=${selectedZone}`);
        const result: LMPResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError('Failed to fetch LMP data');
        }
      } catch (err) {
        setError('Error loading LMP data');
        console.error('Error fetching LMP data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, selectedZone]);

  const formatTooltip = (value: number, name: string) => {
    const displayName = name === 'totalLMP' ? 'Total LMP' : 
                       name.charAt(0).toUpperCase() + name.slice(1);
    return [`$${value.toFixed(2)}`, displayName];
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

  return (
    <div className="bg-white border-l-4 border-gs-green-500 rounded-lg shadow-gs-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gs-gray-900">Zone LMP Components</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="zone-select" className="text-sm font-medium text-gray-700">
            Select Zone:
          </label>
          <select
            id="zone-select"
            value={selectedZone || ''}
            onChange={(e) => setSelectedZone(e.target.value ? parseInt(e.target.value) : null)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Zone --</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading chart data...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {!loading && !error && selectedZone && data.length > 0 && (
        <div style={{ width: '100%', height: '500px' }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 25 }}>
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
                  value: '$/MWh', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={formatTooltipLabel}
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'totalLMP') return 'Total LMP';
                  return value.charAt(0).toUpperCase() + value.slice(1);
                }}
              />
              <Area 
                type="monotone" 
                dataKey="energy" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="congestion" 
                stackId="1" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="losses" 
                stackId="1" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.6}
              />
              <Line 
                type="monotone" 
                dataKey="totalLMP" 
                stroke="#000000" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && selectedZone && data.length === 0 && (
        <div className="text-gray-600">No data available for the selected zone.</div>
      )}

      {!loading && !error && !selectedZone && (
        <div className="text-gray-600">Please select a zone to view LMP data.</div>
      )}
    </div>
  );
};

export default ZoneLMPChart; 