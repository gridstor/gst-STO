import React, { useState } from 'react';

interface TB26Data {
  thisWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  lastWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  lastYear: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  dateRanges?: {
    thisWeek: string;
    lastWeek: string;
    lastYear: string;
  };
}

interface TB26DisplayProps {
  tb26Data: TB26Data | null;
  scenarioId?: number; // Optional: if provided, will fetch TB2.6 for this specific scenario
}

export default function TB26Display({ tb26Data: initialData, scenarioId }: TB26DisplayProps) {
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [tb26Data, setTb26Data] = useState<TB26Data | null>(initialData);
  const [loading, setLoading] = useState(false);
  
  // Fetch TB2.6 data when scenarioId changes
  React.useEffect(() => {
    if (scenarioId === undefined) {
      // Use initial data if no scenarioId provided (homepage behavior)
      setTb26Data(initialData);
      return;
    }
    
    const fetchTB26 = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tb26-calculation?scenarioId=${scenarioId}`);
        if (response.ok) {
          const data = await response.json();
          setTb26Data(data);
        }
      } catch (error) {
        console.error('Error fetching TB2.6 data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTB26();
  }, [scenarioId, initialData]);

  const formatTB26Value = (value: number | undefined) => value?.toFixed(2) || 'X.XX';

  // Get current month info from TB2.6 data or fallback to today
  // This ensures the highlighted month matches the selected scenario
  const currentMonthIndex = React.useMemo(() => {
    if (tb26Data?.dateRanges?.thisWeek) {
      // Extract month from "This Week" date range (e.g., "2025-09-15 to 2025-09-21")
      const startDate = tb26Data.dateRanges.thisWeek.split(' to ')[0];
      const date = new Date(startDate);
      return date.getMonth();
    }
    // Fallback to today's month if no date range available
    return new Date().getMonth();
  }, [tb26Data]);

  return (
    <div>
      <div className="mb-6">
        {/* Show Charging Restrictions Button */}
        <button
          onClick={() => setShowRestrictions(!showRestrictions)}
          className="px-4 py-2 bg-gs-gray-100 hover:bg-gs-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showRestrictions ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showRestrictions ? 'Hide' : 'Show'} Charging Restrictions
        </button>
      </div>
      
      {/* TB2.6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Last Year Card */}
        <a 
          href="/short-term-outlook/goleta"
          className="bg-white border-l-4 border-gs-amber-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">Last Year</h3>
            {tb26Data?.dateRanges?.lastYear && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.lastYear}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.lastYear?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastYear?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastYear?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </a>

        {/* Last Week Card */}
        <a 
          href="/short-term-outlook/goleta"
          className="bg-white border-l-4 border-gs-red-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">Last Week</h3>
            {tb26Data?.dateRanges?.lastWeek && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.lastWeek}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.lastWeek?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastWeek?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastWeek?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </a>

        {/* This Week Card */}
        <a 
          href="/short-term-outlook/goleta"
          className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">This Week</h3>
            {tb26Data?.dateRanges?.thisWeek && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.thisWeek}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.thisWeek?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.thisWeek?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.thisWeek?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Collapsible Charging Restrictions Table */}
      {showRestrictions && (
        <div className="mt-8 pt-6 border-t border-gs-gray-200">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gs-gray-900 mb-2">Charging Restrictions (MW)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gs-gray-100">
                  <th className="border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700">Time Period</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 0 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jan</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 1 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Feb</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 2 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Mar</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 3 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Apr</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 4 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>May</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 5 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jun</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 6 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jul</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 7 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Aug</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 8 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Sep</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 9 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Oct</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 10 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Nov</th>
                  <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 11 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Dec</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50">
                  <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">1 AM - 7 AM</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>39.9</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>40.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>33.9</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>29.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>37.1</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>45.3</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>37.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>36.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>34.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>41.3</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>40.1</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>42.3</td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">7 AM - 10 AM</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>2.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>4.7</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>15.3</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>25.5</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>19.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>3.5</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>1.7</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>2.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>5.2</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">10 AM - 7 PM</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>6.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.7</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>24.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>24.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>20.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.1</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">7 PM - 1 AM</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>8.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>6.3</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>4.7</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>25.4</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>28.9</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>30.8</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>5.6</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>0.5</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>6.1</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>11.0</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>14.3</td>
                  <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>8.2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



