import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ErrorMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  dataPoints: number;
}

interface RenewableErrorData {
  dayzerWind: ErrorMetrics;
  dayzerSolar: ErrorMetrics;
  caisoWind: ErrorMetrics;
  caisoSolar: ErrorMetrics;
  timeSeriesErrors: Array<{
    datetime: string;
    dayzerWindError: number | null;
    dayzerSolarError: number | null;
    caisoWindError: number | null;
    caisoSolarError: number | null;
  }>;
}

interface RenewableAccuracyResponse {
  success: boolean;
  data: RenewableErrorData;
  metadata: {
    selectedHours: number[];
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export default function RenewableForecastAccuracy() {
  const [data, setData] = useState<RenewableErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([12, 13, 14, 15, 16]); // Default solar peak hours
  const [pendingHours, setPendingHours] = useState<number[]>([12, 13, 14, 15, 16]); // Hours being selected
  const [copying, setCopying] = useState(false);

  // Hour options for selection
  const hourOptions = Array.from({length: 24}, (_, i) => i + 1); // 1-24

  useEffect(() => {
    const fetchAccuracyData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching renewable forecast accuracy data...');
        const response = await fetch('/api/renewable-forecast-accuracy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedHours: selectedHours
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Renewable accuracy API error:', errorText);
          throw new Error(`Failed to fetch renewable accuracy data: ${response.status} ${errorText}`);
        }
        
        const jsonData: RenewableAccuracyResponse = await response.json();
        console.log('Received renewable accuracy data:', jsonData);
        
        setData(jsonData.data);
      } catch (err) {
        console.error('Renewable accuracy API error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch renewable accuracy data');
      } finally {
        setLoading(false);
      }
    };

    if (selectedHours.length > 0) {
      fetchAccuracyData();
    }
  }, [selectedHours]);

  // Handle hour selection (updates pending hours only)
  const handleHourToggle = (hour: number) => {
    setPendingHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  };

  // Apply pending hour selection
  const applyHourSelection = () => {
    setSelectedHours([...pendingHours]);
  };

  // Select all hours
  const selectAllHours = () => {
    setPendingHours([...hourOptions]);
  };

  // Clear all hour selections
  const clearHours = () => {
    setPendingHours([]);
  };

  // Copy accuracy section as image
  const copyAccuracyAsImage = async () => {
    setCopying(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const accuracySection = document.querySelector('.renewable-accuracy-container') as HTMLElement;
      
      if (!accuracySection) {
        throw new Error('Renewable accuracy section not found');
      }

      const canvas = await html2canvas(accuracySection, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopying(false);
          } catch (clipboardError) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'renewable-forecast-accuracy.png';
            link.click();
            URL.revokeObjectURL(url);
            setCopying(false);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing renewable accuracy section:', error);
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
        <div className="text-gray-500">Loading renewable forecast accuracy data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading renewable accuracy data</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hour Selection Controls - Outside Screenshot Area */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Select Hours for Renewable Analysis:</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllHours}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
              >
                All Hours
              </button>
              <button
                onClick={clearHours}
                className="bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 mb-3">
            {hourOptions.map(hour => (
              <button
                key={hour}
                onClick={() => handleHourToggle(hour)}
                className={`p-2 text-xs rounded border font-medium transition-colors ${
                  pendingHours.includes(hour)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {hour}
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600">
              Pending: {pendingHours.length > 0 ? pendingHours.join(', ') : 'None'} | 
              Applied: {selectedHours.length > 0 ? selectedHours.join(', ') : 'None'}
            </div>
            <button
              onClick={applyHourSelection}
              disabled={JSON.stringify(pendingHours) === JSON.stringify(selectedHours) || pendingHours.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
            >
              Apply
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Analyzing {selectedHours.length} hour(s) for renewable forecast accuracy
          </div>
          <button
            onClick={copyAccuracyAsImage}
            disabled={copying}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium text-sm flex items-center gap-2"
          >
            {copying ? 'Copying...' : 'Copy Renewable Accuracy'}
          </button>
        </div>
      </div>

      {/* Renewable Accuracy Analysis Container - This gets captured */}
      <div className="renewable-accuracy-container bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Renewable Forecast Accuracy</h3>
          <p className="text-sm text-gray-600 mt-1">
            Error metrics for hours: {selectedHours.join(', ')}
          </p>
        </div>

        {data && (
          <>
            {/* Error Summary Cards (Option A) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Dayzer Wind Error */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Dayzer Wind</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">MAE:</span>
                    <span className="font-medium text-blue-800">{formatError(data.dayzerWind.mae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">RMSE:</span>
                    <span className="font-medium text-blue-800">{formatError(data.dayzerWind.rmse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">MAPE:</span>
                    <span className="font-medium text-blue-800">{formatError(data.dayzerWind.mape, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Bias:</span>
                    <span className="font-medium text-blue-800">{formatError(data.dayzerWind.bias)}</span>
                  </div>
                </div>
              </div>

              {/* Dayzer Solar Error */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-800 mb-3">Dayzer Solar</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">MAE:</span>
                    <span className="font-medium text-yellow-800">{formatError(data.dayzerSolar.mae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">RMSE:</span>
                    <span className="font-medium text-yellow-800">{formatError(data.dayzerSolar.rmse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">MAPE:</span>
                    <span className="font-medium text-yellow-800">{formatError(data.dayzerSolar.mape, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Bias:</span>
                    <span className="font-medium text-yellow-800">{formatError(data.dayzerSolar.bias)}</span>
                  </div>
                </div>
              </div>

              {/* CAISO Wind Error */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-teal-800 mb-3">CAISO Wind</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-teal-700">MAE:</span>
                    <span className="font-medium text-teal-800">{formatError(data.caisoWind.mae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700">RMSE:</span>
                    <span className="font-medium text-teal-800">{formatError(data.caisoWind.rmse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700">MAPE:</span>
                    <span className="font-medium text-teal-800">{formatError(data.caisoWind.mape, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700">Bias:</span>
                    <span className="font-medium text-teal-800">{formatError(data.caisoWind.bias)}</span>
                  </div>
                </div>
              </div>

              {/* CAISO Solar Error */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">CAISO Solar</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-orange-700">MAE:</span>
                    <span className="font-medium text-orange-800">{formatError(data.caisoSolar.mae)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">RMSE:</span>
                    <span className="font-medium text-orange-800">{formatError(data.caisoSolar.rmse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">MAPE:</span>
                    <span className="font-medium text-orange-800">{formatError(data.caisoSolar.mape, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Bias:</span>
                    <span className="font-medium text-orange-800">{formatError(data.caisoSolar.bias)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Series Error Chart (Option C) */}
            <div className="mt-8">
              <div className="text-center mb-4">
                <h4 className="text-lg font-medium text-gray-700">Hourly Renewable Forecast Errors</h4>
                <p className="text-sm text-gray-600">Absolute error over time for selected hours</p>
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
                        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                        
                        // Check if this is the first occurrence of this date in the data
                        const isFirstOccurrenceOfDay = data.timeSeriesErrors.findIndex(point => {
                          const pointDate = new Date(point.datetime);
                          return pointDate.toISOString().split('T')[0] === dateString;
                        }) === index;
                        
                        if (isFirstOccurrenceOfDay) {
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }
                        return '';
                      }}
                      stroke="#6b7280"
                      fontSize={12}
                      height={40}
                      interval={0}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => value.toLocaleString('en-US')}
                      label={{ 
                        value: 'Absolute Error (MW)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -40,
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${Math.abs(value).toLocaleString('en-US')} MW`,
                        name
                      ]}
                      labelFormatter={(datetime) => {
                        const date = new Date(datetime);
                        return date.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        });
                      }}
                    />
                    
                    {/* Renewable Error Lines */}
                    <Line
                      type="monotone"
                      dataKey="dayzerWindError"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Dayzer Wind Error"
                    />
                    <Line
                      type="monotone"
                      dataKey="dayzerSolarError"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={false}
                      name="Dayzer Solar Error"
                    />
                    <Line
                      type="monotone"
                      dataKey="caisoWindError"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={false}
                      name="CAISO Wind Error"
                    />
                    <Line
                      type="monotone"
                      dataKey="caisoSolarError"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      name="CAISO Solar Error"
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

