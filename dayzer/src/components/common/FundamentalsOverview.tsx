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
      <div className="bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6">
        <div className="text-center text-gs-gray-500">Loading fundamentals overview...</div>
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
    if (trend === 'up') return 'text-gs-green-600';
    if (trend === 'down') return 'text-gs-red-600';
    return 'text-gs-gray-600';
  };

  const getAccentColor = (component: string) => {
    if (component === 'Total Demand') return 'border-gs-gray-700';
    if (component === 'Net Load') return 'border-gs-purple-500';
    if (component === 'Renewable Generation') return 'border-gs-green-500';
    return 'border-gs-purple-500'; // fallback
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, index) => (
          <a 
            key={index}
            href="/short-term-outlook/caiso-system#weekly-analysis"
            className={`bg-white border-l-4 ${getAccentColor(item.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-gs-base p-6 cursor-pointer block hover:scale-[1.02] transform`}
          >
            <h3 className="text-lg font-semibold text-gs-gray-900 mb-4">{item.component}</h3>
            
            {/* Trend Indicator */}
            <div className={`text-xl font-bold mb-6 font-mono ${getTrendColor(item.trend)}`}>
              {getTrendIcon(item.trend)} {Math.abs(item.percentageChange).toFixed(1)}% {item.trend === 'up' ? 'Higher' : item.trend === 'down' ? 'Lower' : 'Flat'}
            </div>

            {/* Compact progression layout */}
            <div className="space-y-3">
              {/* Weekly Average */}
              <div className="bg-gs-gray-50 rounded-lg p-4">
                <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                  Weekly Average
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.lastWeekAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className="text-gs-gray-400 text-lg">→</div>
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.thisWeekAvg.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className={`text-xs font-medium font-mono ml-auto ${
                    item.thisWeekAvg - item.lastWeekAvg >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                  }`}>
                    {item.thisWeekAvg - item.lastWeekAvg >= 0 ? '+' : ''}{(item.thisWeekAvg - item.lastWeekAvg).toFixed(1)} GW
                  </div>
                </div>
              </div>

              {/* Weekly Maximum */}
              <div className="bg-gs-gray-50 rounded-lg p-4">
                <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                  Weekly Maximum
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.lastWeekMax.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className="text-gs-gray-400 text-lg">→</div>
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.thisWeekMax.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className={`text-xs font-medium font-mono ml-auto ${
                    item.thisWeekMax - item.lastWeekMax >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                  }`}>
                    {item.thisWeekMax - item.lastWeekMax >= 0 ? '+' : ''}{(item.thisWeekMax - item.lastWeekMax).toFixed(1)} GW
                  </div>
                </div>
              </div>

              {/* Weekly Minimum */}
              <div className="bg-gs-gray-50 rounded-lg p-4">
                <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                  Weekly Minimum
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.lastWeekMin.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className="text-gs-gray-400 text-lg">→</div>
                  <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                    {item.thisWeekMin.toFixed(1)}
                  </div>
                  <div className="text-xs text-gs-gray-500">GW</div>
                  <div className={`text-xs font-medium font-mono ml-auto ${
                    item.thisWeekMin - item.lastWeekMin >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                  }`}>
                    {item.thisWeekMin - item.lastWeekMin >= 0 ? '+' : ''}{(item.thisWeekMin - item.lastWeekMin).toFixed(1)} GW
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

