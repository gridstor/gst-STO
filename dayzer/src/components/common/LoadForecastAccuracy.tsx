import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ErrorMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  dataPoints: number;
}

interface ErrorData {
  dayzerLoad: ErrorMetrics;
  dayzerNetLoad: ErrorMetrics;
  caisoLoad: ErrorMetrics;
  caisoNetLoad: ErrorMetrics;
  timeSeriesErrors: Array<{
    datetime: string;
    dayzerLoadError: number | null;
    dayzerNetLoadError: number | null;
    caisoLoadError: number | null;
    caisoNetLoadError: number | null;
  }>;
}

interface AccuracyResponse {
  success: boolean;
  data: ErrorData;
  metadata: {
    selectedHours: number[];
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export default function LoadForecastAccuracy() {
  const [data, setData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([17, 18, 19, 20]); // Default peak hours
  const [pendingHours, setPendingHours] = useState<number[]>([17, 18, 19, 20]); // Hours being selected
  const [copying, setCopying] = useState(false);
  
  // Forecast and Actuals selection
  const [selectedForecast, setSelectedForecast] = useState<string>('dayzerLoad');
  const [selectedActuals, setSelectedActuals] = useState<string>('rtLoad');

  // Available forecast sources
  const forecastOptions = [
    { value: 'dayzerLoad', label: 'Dayzer Load' },
    { value: 'dayzerNetLoad', label: 'Dayzer Net Load' },
    { value: 'dayzerLoadT1', label: 'Dayzer Load t-1' },
    { value: 'dayzerNetLoadT1', label: 'Dayzer Net Load t-1' },
    { value: 'caisoLoad', label: 'CAISO Load' },
    { value: 'caisoNetLoad', label: 'CAISO Net Load' },
    { value: 'caisoLoad7D', label: 'CAISO Load 7D' },
  ];

  // Available actuals sources
  const actualsOptions = [
    { value: 'rtLoad', label: 'RT Load' },
    { value: 'rtNetLoad', label: 'RT Net Load' },
    { value: 'daLoad', label: 'DA Load' },
    { value: 'daNetLoad', label: 'DA Net Load' },
  ];

  // Hour options for selection
  const hourOptions = Array.from({length: 24}, (_, i) => i + 1); // 1-24

  const fetchAccuracyData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check URL parameters for selected scenarios
      const urlParams = new URLSearchParams(window.location.search);
      const lastWeekScenario = urlParams.get('lastWeekScenario');
      
      console.log('Fetching load forecast accuracy data with scenario:', lastWeekScenario);
      
      // Build API URL with scenario parameter if available
      const apiUrl = lastWeekScenario 
        ? `/api/load-forecast-accuracy?scenarioId=${lastWeekScenario}`
        : '/api/load-forecast-accuracy';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            selectedHours: selectedHours,
            forecast: selectedForecast,
            actuals: selectedActuals
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Accuracy API error:', errorText);
          throw new Error(`Failed to fetch accuracy data: ${response.status} - ${errorText}`);
        }

        const result: AccuracyResponse = await response.json();
        console.log('Load forecast accuracy data:', result);

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error('Invalid accuracy data received');
        }
      } catch (err) {
        console.error('Load forecast accuracy error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch accuracy data');
      } finally {
        setLoading(false);
      }
    };

  // Listen for scenario changes
  useEffect(() => {
    const handleScenarioChange = (event: CustomEvent) => {
      console.log('LoadForecastAccuracy received scenario change:', event.detail);
      // Refetch accuracy data with new scenario
      if (selectedHours.length > 0) {
        fetchAccuracyData();
      }
    };

    window.addEventListener('scenarioChanged', handleScenarioChange as EventListener);
    
    return () => {
      window.removeEventListener('scenarioChanged', handleScenarioChange as EventListener);
    };
  }, [selectedHours, selectedForecast, selectedActuals]);

  // Initial data fetch
  useEffect(() => {
    if (selectedHours.length > 0) {
      fetchAccuracyData();
    }
  }, [selectedHours, selectedForecast, selectedActuals]);

  // Hour selection handlers
  const toggleHour = (hour: number) => {
    setPendingHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const applyHourSelection = () => {
    setSelectedHours([...pendingHours]);
  };

  const selectAllHours = () => {
    setPendingHours([...hourOptions]);
  };

  const selectPeakHours = () => {
    setPendingHours([17, 18, 19, 20]);
  };

  const clearHours = () => {
    setPendingHours([]);
  };

  // Copy section as image
  const copyAccuracySectionAsImage = async () => {
    if (copying) return;
    setCopying(true);

    try {
      // Find the accuracy section (everything inside the screenshot area)
      const accuracySection = document.querySelector('.load-forecast-accuracy-screenshot');
      
      if (!accuracySection) {
        console.error('Accuracy section not found');
        setCopying(false);
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(accuracySection as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Load forecast accuracy section copied to clipboard');
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
          }
        }
        setCopying(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing accuracy section:', error);
      setCopying(false);
    }
  };

  // Format error values for display
  const formatError = (value: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toLocaleString('en-US')} MW`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading forecast accuracy data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading accuracy data</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Forecast vs Actuals Selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Forecast vs Actuals Comparison:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Forecast Source:</label>
            <select
              value={selectedForecast}
              onChange={(e) => setSelectedForecast(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {forecastOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Actuals Source:</label>
            <select
              value={selectedActuals}
              onChange={(e) => setSelectedActuals(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {actualsOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hour Selection Controls - Outside Screenshot Area */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Select Hours for Analysis:</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllHours}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
              >
                All Hours
              </button>
              <button
                onClick={selectPeakHours}
                className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors"
              >
                Peak Hours (17-20)
              </button>
              <button
                onClick={clearHours}
                className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {/* Hour Grid */}
          <div className="grid grid-cols-12 gap-1 mb-4">
            {hourOptions.map(hour => (
              <button
                key={hour}
                onClick={() => toggleHour(hour)}
                className={`h-8 text-xs font-medium rounded transition-colors ${
                  pendingHours.includes(hour)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {hour}
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Selected: {pendingHours.length > 0 ? pendingHours.join(', ') : 'None'}
            </div>
            <button
              onClick={applyHourSelection}
              disabled={pendingHours.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot Area Starts Here */}
      <div className="load-forecast-accuracy-screenshot bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        
        {/* Copy Button - Inside Screenshot Area */}
        <div className="flex justify-end mb-4">
          <button
            onClick={copyAccuracySectionAsImage}
            disabled={copying}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {copying ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Copying...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
                Copy Accuracy
              </>
            )}
          </button>
        </div>

        {data && (
          <>
            {/* Dynamic Single Forecast Metrics Card */}
            <div className="flex justify-center mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full max-w-md">
                <h4 className="text-lg font-semibold text-blue-800 mb-4 text-center">
                  {forecastOptions.find(f => f.value === selectedForecast)?.label} vs {actualsOptions.find(a => a.value === selectedActuals)?.label}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">MAE:</span>
                    <span className="font-semibold text-blue-800">{data[selectedForecast as keyof ErrorData] ? formatError((data[selectedForecast as keyof ErrorData] as ErrorMetrics).mae) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">RMSE:</span>
                    <span className="font-semibold text-blue-800">{data[selectedForecast as keyof ErrorData] ? formatError((data[selectedForecast as keyof ErrorData] as ErrorMetrics).rmse) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">MAPE:</span>
                    <span className="font-semibold text-blue-800">{data[selectedForecast as keyof ErrorData] ? formatError((data[selectedForecast as keyof ErrorData] as ErrorMetrics).mape, true) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-medium">Bias:</span>
                    <span className="font-semibold text-blue-800">{data[selectedForecast as keyof ErrorData] ? formatError((data[selectedForecast as keyof ErrorData] as ErrorMetrics).bias) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-blue-700 font-medium">Data Points:</span>
                    <span className="font-semibold text-blue-800">{data[selectedForecast as keyof ErrorData] ? (data[selectedForecast as keyof ErrorData] as ErrorMetrics).dataPoints : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Series Error Chart */}
            <div className="mt-8">
              <div className="text-center mb-4">
                <h4 className="text-lg font-medium text-gray-700">Hourly Forecast Errors</h4>
                <p className="text-sm text-gray-600">{forecastOptions.find(f => f.value === selectedForecast)?.label} vs {actualsOptions.find(a => a.value === selectedActuals)?.label} - Absolute error over time for selected hours</p>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.timeSeriesErrors}
                    margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={true} />
                    <XAxis 
                      dataKey="datetime"
                      tickFormatter={(value, index) => {
                        const date = new Date(value);
                        if (index % 24 === 0) { // Show every 24th tick (daily)
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          });
                        }
                        return '';
                      }}
                      stroke="#6b7280"
                      fontSize={12}
                      height={40}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => `${value.toLocaleString('en-US')} MW`}
                      label={{ value: 'Absolute Error (MW)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        });
                      }}
                      formatter={(value: any, name: string) => [
                        `${Math.abs(value).toLocaleString('en-US')} MW`,
                        name.replace('Error', ' Error')
                      ]}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    
                    {/* Dynamic single line based on selected forecast */}
                    <Line
                      type="monotone"
                      dataKey={`${selectedForecast}Error`}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name={`${forecastOptions.find(f => f.value === selectedForecast)?.label} Error`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



