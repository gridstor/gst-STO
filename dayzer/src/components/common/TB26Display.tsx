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
}

interface TB26DisplayProps {
  tb26Data: TB26Data | null;
}

export default function TB26Display({ tb26Data }: TB26DisplayProps) {
  const [showRestrictions, setShowRestrictions] = useState(false);

  const formatTB26Value = (value: number | undefined) => value?.toFixed(2) || 'X.XX';

  // Get current month info
  const currentMonthIndex = new Date().getMonth();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* Show Charging Restrictions Button (Left) */}
          <button
            onClick={() => setShowRestrictions(!showRestrictions)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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

          {/* Title (Center) */}
          <h2 className="text-2xl font-semibold text-gray-800 flex-1">TB2.6 Performance Overview</h2>
          
          {/* Spacer (Right) */}
          <div className="w-[200px]"></div>
        </div>
        <p className="text-xs text-gray-500">Based on 60MW/160MWh battery with 86% round-trip efficiency, Day-Ahead values</p>
      </div>
      
      {/* TB2.6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Last Year Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Last Year</h3>
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900">${formatTB26Value(tb26Data?.lastYear?.totalTB26)}</div>
            <div className="text-sm text-gray-500">/kW-month</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Energy:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.lastYear?.energyTB26)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Congestion:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.lastYear?.congestionTB26)}</span>
            </div>
          </div>
        </div>

        {/* Last Week Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Last Week</h3>
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900">${formatTB26Value(tb26Data?.lastWeek?.totalTB26)}</div>
            <div className="text-sm text-gray-500">/kW-month</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Energy:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.lastWeek?.energyTB26)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Congestion:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.lastWeek?.congestionTB26)}</span>
            </div>
          </div>
        </div>

        {/* This Week Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-3">This Week</h3>
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900">${formatTB26Value(tb26Data?.thisWeek?.totalTB26)}</div>
            <div className="text-sm text-gray-500">/kW-month</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Energy:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.thisWeek?.energyTB26)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Congestion:</span>
              <span className="font-medium text-gray-900">${formatTB26Value(tb26Data?.thisWeek?.congestionTB26)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Charging Restrictions Table */}
      {showRestrictions && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Charging Restrictions (MW)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700">Time Period</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 0 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Jan</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 1 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Feb</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 2 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Mar</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 3 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Apr</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 4 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>May</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 5 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Jun</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 6 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Jul</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 7 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Aug</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 8 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Sep</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 9 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Oct</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 10 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Nov</th>
                  <th className={`border px-4 py-3 text-sm font-semibold ${currentMonthIndex === 11 ? 'border-blue-600 border-4 bg-blue-100 text-blue-800' : 'border-gray-300 text-gray-700'}`}>Dec</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">1 AM - 7 AM</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 0 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>39.9</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 1 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>40.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 2 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>33.9</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 3 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>29.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 4 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>37.1</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 5 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>45.3</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 6 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>37.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 7 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>36.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 8 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>34.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 9 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>41.3</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 10 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>40.1</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 11 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>42.3</td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">7 AM - 10 AM</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 0 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>2.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 1 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>4.7</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 2 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>7.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 3 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>15.3</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 4 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>25.5</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 5 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>19.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 6 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>3.5</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 7 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>1.7</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 8 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>2.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 9 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>11.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 10 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>11.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 11 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>5.2</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">10 AM - 7 PM</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 0 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>6.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 1 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>7.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 2 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>11.7</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 3 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>24.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 4 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>24.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 5 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>20.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 6 ? 'border-blue-600 border-4 bg-red-300 font-semibold' : 'border-gray-300 bg-red-200 font-semibold'}`}>0.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 7 ? 'border-blue-600 border-4 bg-red-300 font-semibold' : 'border-gray-300 bg-red-200 font-semibold'}`}>0.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 8 ? 'border-blue-600 border-4 bg-red-300 font-semibold' : 'border-gray-300 bg-red-200 font-semibold'}`}>0.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 9 ? 'border-blue-600 border-4 bg-red-300 font-semibold' : 'border-gray-300 bg-red-200 font-semibold'}`}>0.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 10 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>11.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 11 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>7.1</td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">7 PM - 1 AM</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 0 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>8.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 1 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>6.3</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 2 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>4.7</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 3 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>25.4</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 4 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>28.9</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 5 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>30.8</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 6 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>5.6</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 7 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>0.5</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 8 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>6.1</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 9 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>11.0</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 10 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>14.3</td>
                  <td className={`border px-4 py-3 text-sm text-center ${currentMonthIndex === 11 ? 'border-blue-600 border-4 bg-blue-100 font-semibold' : 'border-gray-300'}`}>8.2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

