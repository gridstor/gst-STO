import React, { useState, useEffect } from 'react';

interface FundamentalsData {
  component: string;
  thisWeekAvg: number;
  lastWeekAvg: number;
  thisWeekMax: number;
  lastWeekMax: number;
  thisWeekMin: number;
  lastWeekMin: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'flat';
}

export default function FundamentalsOverview() {
  const [data, setData] = useState<FundamentalsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch with all hours (no filter)
        const response = await fetch('/api/week-overview?hours=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24');
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching fundamentals overview:', err);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-6xl mx-auto">
        <div className="text-center text-gray-500">Loading fundamentals overview...</div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return null;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Fundamentals Overview</h2>
        <p className="text-sm text-gray-600">This Week vs Last Week Comparison</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((item, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-3">{item.component}</h3>
            
            {/* Trend Indicator */}
            <div className={`text-2xl font-bold mb-4 ${getTrendColor(item.trend)}`}>
              {getTrendIcon(item.trend)} {Math.abs(item.percentageChange).toFixed(1)}% {item.trend === 'up' ? 'Higher' : item.trend === 'down' ? 'Lower' : 'Flat'}
            </div>

            {/* This Week and Last Week Columns */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border-r border-gray-300">
                <p className="font-semibold text-gray-600 mb-3">This Week</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Avg</p>
                    <p className="font-bold text-gray-900">{item.thisWeekAvg.toFixed(1)} GW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max</p>
                    <p className="font-medium text-gray-700">{item.thisWeekMax.toFixed(1)} GW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Min</p>
                    <p className="font-medium text-gray-700">{item.thisWeekMin.toFixed(1)} GW</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-600 mb-3">Last Week</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Avg</p>
                    <p className="font-bold text-gray-900">{item.lastWeekAvg.toFixed(1)} GW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max</p>
                    <p className="font-medium text-gray-700">{item.lastWeekMax.toFixed(1)} GW</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Min</p>
                    <p className="font-medium text-gray-700">{item.lastWeekMin.toFixed(1)} GW</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

