import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MECData {
  date: string;
  topHoursMEC: number;
  bottomHoursMEC: number;
  topHoursUnit: string;
  bottomHoursUnit: string;
  isLastWeek: boolean;
  topHoursDetails: MarginalUnitData[];
  bottomHoursDetails: MarginalUnitData[];
  topHours: number[];
  bottomHours: number[];
}

interface MarginalUnitData {
  unitid: number;
  unitname: string;
  unittype: string;
  hour: number;
  energyCost: number;
}

interface MECResponse {
  scenarioId: number;
  data: MECData[];
  dateRanges: {
    lastWeek: string;
    thisWeek: string;
  };
}

interface MECOverviewChartProps {
  scenarioId?: number; // Optional: if provided, will fetch MEC for this specific scenario
}

export default function MECOverviewChart({ scenarioId }: MECOverviewChartProps = {}) {
  const [data, setData] = useState<MECData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching MCE overview data...');
        const apiUrl = scenarioId 
          ? `${window.location.origin}/api/mec-overview?scenarioId=${scenarioId}`
          : `${window.location.origin}/api/mec-overview`;
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`Failed to fetch MCE overview data: ${response.status} ${errorText}`);
        }
        
        const jsonData: MECResponse = await response.json();
        console.log('Received data:', jsonData);
        setData(jsonData.data);
      } catch (err) {
        console.error('API error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch MCE data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scenarioId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const topData = payload.find((p: any) => p.dataKey === 'topHoursMEC');
      const bottomData = payload.find((p: any) => p.dataKey === 'bottomHoursMEC');
      const dataPoint = data.find(d => d.date === label);

      if (!dataPoint) return null;

      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg max-w-sm text-left">
          <p className="font-medium mb-3">{`Date: ${label}`}</p>
          
          {topData && dataPoint.topHours && dataPoint.topHours.length > 0 && (
            <div className="mb-4">
              <p className="text-red-600 font-medium mb-2">
                Top 2 Hours: (Hour {dataPoint.topHours.join(' & ')}) - ${topData.value.toFixed(2)}/MWh
              </p>
              {dataPoint.topHoursDetails && dataPoint.topHoursDetails.map((unit, index) => (
                <p key={index} className="text-sm text-gray-700 ml-2">
                  (<span className="font-bold">{unit.unittype}</span>) {unit.unitname}
                </p>
              ))}
            </div>
          )}
          
          {bottomData && dataPoint.bottomHours && dataPoint.bottomHours.length > 0 && (
            <div>
              <p className="text-blue-600 font-medium mb-2">
                Bottom 2 Hours: (Hour {dataPoint.bottomHours.join(' & ')}) - ${bottomData.value.toFixed(2)}/MWh
              </p>
              {dataPoint.bottomHoursDetails && dataPoint.bottomHoursDetails.map((unit, index) => (
                <p key={index} className="text-sm text-gray-700 ml-2">
                  (<span className="font-bold">{unit.unittype}</span>) {unit.unitname}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatXAxisTick = (value: string) => {
    // Parse date string as local time to avoid timezone shift
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
        <div className="flex items-center justify-center h-80 text-gs-gray-500">
          <p>Loading MEC overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
        <div className="flex items-center justify-center h-80 text-gs-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Filter to only This Week data
  const thisWeekData = data.filter(d => !d.isLastWeek);

  // Calculate Y-axis domain using This Week data
  const allValues = thisWeekData.flatMap(d => [d.topHoursMEC, d.bottomHoursMEC]);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  // Add some padding to the range (10% on each side)
  const padding = (maxValue - minValue) * 0.1;
  const yAxisDomain = [
    Math.max(0, Math.floor(minValue - padding)), 
    Math.ceil(maxValue + padding)
  ];

  // Calculate Y-axis ticks every $10
  const generateYAxisTicks = () => {
    const ticks = [];
    const [minDomain, maxDomain] = yAxisDomain;
    // Start from the nearest $10 below the minimum
    const startTick = Math.floor(minDomain / 10) * 10;
    // End at the nearest $10 above the maximum
    const endTick = Math.ceil(maxDomain / 10) * 10;
    
    for (let tick = startTick; tick <= endTick; tick += 10) {
      ticks.push(tick);
    }
    return ticks;
  };

  const yAxisTicks = generateYAxisTicks();

  const ChartContent = () => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={thisWeekData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            domain={yAxisDomain}
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
            ticks={yAxisTicks}
            label={{ 
              value: '$/MWh', 
              angle: -90, 
              position: 'insideLeft',
              style: { 
                textAnchor: 'middle',
                fill: '#4B5563',
                fontSize: 12,
                fontWeight: 600
              }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey="topHoursMEC"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Top 2 Hours"
          />
          <Line
            type="monotone"
            dataKey="bottomHoursMEC"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Bottom 2 Hours"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // If no scenarioId provided (homepage), make it clickable
  if (scenarioId === undefined) {
    return (
      <a 
        href="/short-term-outlook/caiso-system#mec-overview"
        className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer"
      >
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gs-red-600"></div>
              <span className="text-gs-gray-600">Top 2 Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gs-blue-600"></div>
              <span className="text-gs-gray-600">Bottom 2 Hours</span>
            </div>
          </div>
        </div>
        <ChartContent />
      </a>
    );
  }

  return (
    <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gs-red-600"></div>
            <span className="text-gs-gray-600">Top 2 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gs-blue-600"></div>
            <span className="text-gs-gray-600">Bottom 2 Hours</span>
          </div>
        </div>
      </div>
      <ChartContent />
    </div>
  );
} 