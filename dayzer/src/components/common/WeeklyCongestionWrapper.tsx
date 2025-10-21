import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

export default function WeeklyCongestionWrapper() {
  const { selectedScenario } = useScenario();
  const [congestionData, setCongestionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedScenario) return;

    const fetchCongestionData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/weekly-congestion?scenarioId=${selectedScenario.scenarioid}`);
        if (response.ok) {
          const data = await response.json();
          setCongestionData(data);
        }
      } catch (error) {
        console.error('Error fetching weekly congestion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCongestionData();
  }, [selectedScenario]);

  // Helper function to format congestion values
  const formatCongestionValue = (value: number) => value?.toFixed(2) || '0.00';

  // Helper function to get color class based on congestion value
  const getCongestionColorClass = (value: number) => {
    if (value >= 0) {
      // Positive values - red scale
      if (value >= 50) return 'bg-red-700 text-white';
      if (value >= 30) return 'bg-red-600 text-white';
      if (value >= 15) return 'bg-red-500 text-white';
      if (value >= 5) return 'bg-red-400 text-white';
      if (value >= 1) return 'bg-red-300 text-white';
      return 'bg-red-100 text-gray-800';
    } else {
      // Negative values - blue scale
      const absValue = Math.abs(value);
      if (absValue >= 50) return 'bg-blue-700 text-white';
      if (absValue >= 30) return 'bg-blue-600 text-white';
      if (absValue >= 15) return 'bg-blue-500 text-white';
      if (absValue >= 5) return 'bg-blue-400 text-white';
      if (absValue >= 1) return 'bg-blue-300 text-white';
      return 'bg-blue-100 text-gray-800';
    }
  };

  // Helper function to format date for display (MM/DD)
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-500">Loading congestion data...</div>
      </div>
    );
  }

  if (!congestionData) {
    return null;
  }

  return (
    <div id="weekly-congestion" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 scroll-mt-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Weekly Congestion</h2>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Positive Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-gray-600">Negative Congestion</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Last Week Chart */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-700 text-center">Last Week</h3>

          {/* Top 2 Hours Stacked Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Top 2 Hours</span>
            </div>

            <div className="relative">
              <div className="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                {congestionData.lastWeek && congestionData.lastWeek.length > 0 ? (
                  congestionData.lastWeek.map((day: any) => (
                    <div
                      key={day.date}
                      className={`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`}
                      style={{ width: `${100 / congestionData.lastWeek.length}%` }}
                      title={`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh - ${day.topHours.constraintName}`}
                    >
                      <div className="text-center">
                        <div>{formatDateDisplay(day.date)}</div>
                        <div>${formatCongestionValue(day.topHours.avgCongestion)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom 2 Hours Stacked Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Bottom 2 Hours</span>
            </div>

            <div className="relative">
              <div className="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                {congestionData.lastWeek && congestionData.lastWeek.length > 0 ? (
                  congestionData.lastWeek.map((day: any) => (
                    <div
                      key={day.date}
                      className={`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`}
                      style={{ width: `${100 / congestionData.lastWeek.length}%` }}
                      title={`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh - ${day.bottomHours.constraintName}`}
                    >
                      <div className="text-center">
                        <div>{formatDateDisplay(day.date)}</div>
                        <div>${formatCongestionValue(day.bottomHours.avgCongestion)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* This Week Chart */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-700 text-center">This Week</h3>

          {/* Top 2 Hours Stacked Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Top 2 Hours</span>
            </div>

            <div className="relative">
              <div className="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                {congestionData.thisWeek && congestionData.thisWeek.length > 0 ? (
                  congestionData.thisWeek.map((day: any) => (
                    <div
                      key={day.date}
                      className={`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`}
                      style={{ width: `${100 / congestionData.thisWeek.length}%` }}
                      title={`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh - ${day.topHours.constraintName}`}
                    >
                      <div className="text-center">
                        <div>{formatDateDisplay(day.date)}</div>
                        <div>${formatCongestionValue(day.topHours.avgCongestion)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom 2 Hours Stacked Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-medium">Bottom 2 Hours</span>
            </div>

            <div className="relative">
              <div className="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                {congestionData.thisWeek && congestionData.thisWeek.length > 0 ? (
                  congestionData.thisWeek.map((day: any) => (
                    <div
                      key={day.date}
                      className={`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`}
                      style={{ width: `${100 / congestionData.thisWeek.length}%` }}
                      title={`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh - ${day.bottomHours.constraintName}`}
                    >
                      <div className="text-center">
                        <div>{formatDateDisplay(day.date)}</div>
                        <div>${formatCongestionValue(day.bottomHours.avgCongestion)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

