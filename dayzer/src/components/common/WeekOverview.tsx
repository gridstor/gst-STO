import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface WeekOverviewData {
  component: string;
  thisWeekAvg: number;
  lastWeekAvg: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'flat';
  magnitude: 'small' | 'medium' | 'large';
}

interface WeekOverviewResponse {
  scenarioid: number | null;
  simulationDate: string;
  selectedHours: number[];
  data: WeekOverviewData[];
  metadata: {
    thisWeekRange: string;
    lastWeekRange: string;
    hoursIncluded: number;
    totalDataPoints: number;
  };
}

const WeekOverview: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<WeekOverviewData[]>([]);
  const [metadata, setMetadata] = useState<WeekOverviewResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hour filter state
  const [selectedHours, setSelectedHours] = useState<number[]>(Array.from({ length: 24 }, (_, i) => i + 1));
  const [appliedHours, setAppliedHours] = useState<number[]>(Array.from({ length: 24 }, (_, i) => i + 1));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const hours = Array.from({ length: 24 }, (_, i) => i + 1);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const hoursParam = appliedHours.join(',');
        const response = await fetch(`/api/week-overview?scenarioid=${selectedScenario.scenarioid}&hours=${hoursParam}`);
        const result: WeekOverviewResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          setMetadata(result.metadata);
          setError(null);
        } else {
          setError('Failed to fetch week overview data');
        }
      } catch (err) {
        setError('Error loading week overview data');
        console.error('Error fetching week overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, appliedHours]);

  const handleHourToggle = (hour: number) => {
    setSelectedHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    setSelectedHours(hours);
  };

  const handleDeselectAll = () => {
    setSelectedHours([]);
  };

  const handleApply = () => {
    setAppliedHours(selectedHours);
    setIsDropdownOpen(false);
  };

  const handleDropdownClose = () => {
    setSelectedHours(appliedHours);
    setIsDropdownOpen(false);
  };

  const hasChanges = JSON.stringify(selectedHours.sort()) !== JSON.stringify(appliedHours.sort());

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.hour-filter-dropdown')) {
          setIsDropdownOpen(false);
          setSelectedHours(appliedHours);
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
        setSelectedHours(appliedHours);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen, appliedHours]);

  const getTrendDisplay = (item: WeekOverviewData) => {
    let arrow = '→';
    let color = 'text-gray-600';
    
    if (item.trend === 'up') {
      arrow = item.magnitude === 'large' ? '↑↑' : '↑';
      color = item.magnitude === 'large' ? 'text-green-700' : 'text-green-600';
    } else if (item.trend === 'down') {
      arrow = item.magnitude === 'large' ? '↓↓' : '↓';
      color = item.magnitude === 'large' ? 'text-red-700' : 'text-red-600';
    }
    
    const direction = item.trend === 'up' ? 'Up' : item.trend === 'down' ? 'Down' : 'Flat';
    
    return {
      arrow,
      color,
      text: `${arrow} ${direction} ${Math.abs(item.percentageChange).toFixed(1)}%`
    };
  };

  return (
    <div className="bg-white border-l-4 border-gs-purple-500 rounded-lg shadow-gs-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gs-gray-900">Week Overview</h3>
        
        {/* Hour Filter Dropdown */}
        <div className="relative hour-filter-dropdown">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              // Reset selected hours to applied hours when opening dropdown
              if (!isDropdownOpen) {
                setSelectedHours([...appliedHours]);
              }
            }}
            className="w-full max-w-72 bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-gray-700">
              Hours: {appliedHours.length === 24 
                ? 'All' 
                : appliedHours.length === 0 
                  ? 'None' 
                  : `${appliedHours.length} Selected`}
            </span>
            {hasChanges && (
              <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full" title="Pending changes"></span>
            )}
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
              <div className="p-2 border-b border-gray-200">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800 mr-4"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Deselect All
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 p-3">
                {hours.map(hour => (
                  <label key={hour} className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedHours.includes(hour)}
                      onChange={() => handleHourToggle(hour)}
                      className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">HE{hour}</span>
                  </label>
                ))}
              </div>
              {hasChanges && (
                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={handleApply}
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm font-medium"
                  >
                    Apply ({selectedHours.length} Hour{selectedHours.length !== 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {metadata && (
        <div className="mb-4 text-xs text-gray-600">
          <p>This Week: {metadata.thisWeekRange}</p>
          <p>Last Week: {metadata.lastWeekRange}</p>
          <p>Hours: {metadata.hoursIncluded}/24</p>
        </div>
      )}

      {loading && <div className="text-gray-600">Loading overview data...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {!loading && !error && data.length > 0 && (
        <div className="space-y-6">
          {/* Top row: Total Demand and Net Load */}
          <div className="grid grid-cols-2 gap-6">
            {data.filter(item => item.component === 'Total Demand' || item.component === 'Net Load').map((item, index) => {
              const trendDisplay = getTrendDisplay(item);
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-64">
                  <div className="text-sm font-medium text-gray-600 mb-4">{item.component}</div>
                  
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">This Week</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {item.thisWeekAvg.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">GW</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">Last Week</div>
                      <div className="text-3xl font-bold text-red-500">
                        {item.lastWeekAvg.toFixed(1)}
                      </div>
                      <div className="text-sm text-red-400 mt-1">GW</div>
                    </div>
                  </div>
                  
                  {/* Trend indicator - styled badge */}
                  <div className="flex justify-center">
                    <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                      item.trend === 'up' 
                        ? 'bg-green-100 text-green-800' 
                        : item.trend === 'down' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="text-lg font-bold">
                        {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                      </span>
                      <span className="font-semibold">
                        {Math.abs(item.percentageChange).toFixed(1)}%
                      </span>
                      <span className="text-sm">
                        {item.trend === 'up' ? 'Up' : item.trend === 'down' ? 'Down' : 'Flat'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Bottom row: Renewable Generation - centered (bowling pin style) */}
          <div className="flex justify-center">
            {data.filter(item => item.component === 'Renewable Generation').map((item, index) => {
              const trendDisplay = getTrendDisplay(item);
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-64" style={{ width: 'calc(50% - 12px)' }}>
                  <div className="text-sm font-medium text-gray-600 mb-4">{item.component}</div>
                  
                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">This Week</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {item.thisWeekAvg.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">GW</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">Last Week</div>
                      <div className="text-3xl font-bold text-red-500">
                        {item.lastWeekAvg.toFixed(1)}
                      </div>
                      <div className="text-sm text-red-400 mt-1">GW</div>
                    </div>
                  </div>
                  
                  {/* Trend indicator - styled badge */}
                  <div className="flex justify-center">
                    <div className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                      item.trend === 'up' 
                        ? 'bg-green-100 text-green-800' 
                        : item.trend === 'down' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="text-lg font-bold">
                        {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                      </span>
                      <span className="font-semibold">
                        {Math.abs(item.percentageChange).toFixed(1)}%
                      </span>
                      <span className="text-sm">
                        {item.trend === 'up' ? 'Up' : item.trend === 'down' ? 'Down' : 'Flat'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-gray-600">No week overview data available.</div>
      )}
    </div>
  );
};

export default WeekOverview; 