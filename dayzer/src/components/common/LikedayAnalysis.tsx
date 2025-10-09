import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CalendarPicker from './CalendarPicker';

interface LikedayAnalysisProps {}

interface SimilarityScore {
  day: string;
  euclidean: number;
  cosine: number;
  euclidean_z: number;
  cosine_z: number;
  combined_score: number;
  rank: number;
}

interface LikedayResults {
  success: boolean;
  referenceDate: string;
  matchVariable: string;
  topN: number;
  euclideanWeight: number;
  similarityScores: SimilarityScore[];
  chartData: any;
}

interface Scenario {
  scenarioid: number;
  simulation_date: string;
  scenarioname: string;
}

type ReferenceMode = 'historical' | 'forecast';

const LikedayAnalysis: React.FC<LikedayAnalysisProps> = () => {
  // Reference mode state
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('historical');
  
  // Scenario state for forecast mode
  const [availableScenarios, setAvailableScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Form state
  const [referenceDate, setReferenceDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [matchVariable, setMatchVariable] = useState('RT LMP');
  const [topN, setTopN] = useState(5);
  const [euclideanWeight, setEuclideanWeight] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [secondaryVariable, setSecondaryVariable] = useState<string>('');
  const [secondaryData, setSecondaryData] = useState<any>(null);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  
  // Line visibility state for primary chart
  const [visibleLines, setVisibleLines] = useState<{[key: string]: boolean}>({
    reference: true,
  });
  
  // Line visibility state for secondary chart
  const [secondaryVisibleLines, setSecondaryVisibleLines] = useState<{[key: string]: boolean}>({
    reference: true,
  });

  // All available variables
  const allVariables = [
    'RT Load', 
    'RT Net Load', 
    'RT LMP', 
    'RT Energy', 
    'RT Congestion',
    'DA LMP',
    'DA Load',
    'DA Net Load'
  ];

  // Match variable options - filtered based on mode
  const matchVariableOptions = referenceMode === 'forecast' 
    ? ['DA LMP', 'DA Load', 'DA Net Load'] // Only DA variables in forecast mode
    : allVariables; // All variables in historical mode

  // Secondary variable options - always show all variables
  const secondaryVariableOptions = allVariables;

  // Reset match variable when switching modes if current selection is not available
  useEffect(() => {
    if (!matchVariableOptions.includes(matchVariable)) {
      // If current match variable is not in the filtered list, reset to first available option
      setMatchVariable(matchVariableOptions[0] || 'RT Load');
    }
  }, [referenceMode]);

  // Load available scenarios when switching to forecast mode
  useEffect(() => {
    const fetchScenarios = async () => {
      if (referenceMode !== 'forecast') return;
      
      setScenarioLoading(true);
      try {
        const response = await fetch('/api/available-scenarios');
        if (response.ok) {
          const data = await response.json();
          setAvailableScenarios(data.scenarios || []);
          
          // Set default scenario
          if (data.defaultScenario) {
            setSelectedScenario(data.defaultScenario);
          }
        }
      } catch (err) {
        console.error('Error fetching scenarios:', err);
      } finally {
        setScenarioLoading(false);
      }
    };

    fetchScenarios();
  }, [referenceMode]);

  // Load available dates when scenario changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!selectedScenario || referenceMode !== 'forecast') return;

      try {
        // For now, we'll use the scenario's simulation_date as the available date
        // In the future, this could be expanded to query the database for actual date ranges
        const simulationDate = new Date(selectedScenario.simulation_date);
        const dates = [];
        
        // Generate a week of dates starting from simulation date
        for (let i = 0; i < 7; i++) {
          const date = new Date(simulationDate);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        setAvailableDates(dates);
        
        // Set the first available date as default
        if (dates.length > 0) {
          setReferenceDate(dates[0]);
        }
      } catch (err) {
        console.error('Error setting available dates:', err);
      }
    };

    fetchAvailableDates();
  }, [selectedScenario, referenceMode]);

  const handleModeToggle = (mode: ReferenceMode) => {
    setReferenceMode(mode);
    setError(null);
    setResults(null);
    
    if (mode === 'historical') {
      // Reset to historical reference date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setReferenceDate(yesterday.toISOString().split('T')[0]);
    }
  };

  const handleScenarioChange = (scenarioId: string) => {
    const scenario = availableScenarios.find(s => s.scenarioid.toString() === scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle date selection from calendar (updates scenario based on selected date)
  const handleDateSelect = (selectedDate: string) => {
    // Find the scenario with the matching simulation date
    const matchingScenario = availableScenarios.find(
      scenario => scenario.simulation_date === selectedDate
    );
    
    if (matchingScenario) {
      setSelectedScenario(matchingScenario);
      setShowCalendar(false);
    }
  };

  // Get available dates for the calendar
  const getAvailableDates = () => {
    return availableScenarios.map(scenario => scenario.simulation_date);
  };

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Validation for forecast mode
      if (referenceMode === 'forecast') {
        if (!selectedScenario) {
          setError('Please select a scenario for forecast analysis');
          return;
        }
        if (!referenceDate) {
          setError('Please select a forecast reference date');
          return;
        }
      }
      
      setProgress('Fetching data...');
      
      const requestBody = {
        referenceDate,
        startDate,
        endDate,
        matchVariable,
        topN,
        euclideanWeight,
        referenceMode,
        // Include scenario info for forecast mode
        ...(referenceMode === 'forecast' && {
          scenarioId: selectedScenario?.scenarioid,
          scenarioName: selectedScenario?.scenarioname
        })
      };
      
      const response = await fetch('/api/likeday-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `Analysis failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response isn't JSON, use status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setProgress('Analyzing patterns...');
      let data: LikedayResults;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response format from server');
      }
      
      setProgress('Generating visualizations...');
      setResults(data);
      
      // Initialize visible lines state with all lines visible
      const initialVisibleLines: {[key: string]: boolean} = { reference: true };
      data.similarityScores.forEach((score: SimilarityScore) => {
        initialVisibleLines[score.day] = true;
      });
      setVisibleLines(initialVisibleLines);
      
      setProgress('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleSecondaryAnalysis = async () => {
    if (!results || !secondaryVariable) return;
    
    setSecondaryLoading(true);
    setError(null);
    
    try {
      setProgress('Fetching secondary variable data...');
      
      const requestBody = {
        referenceDate,
        referenceMode,
        matchVariable: secondaryVariable, // Use secondary variable as match variable
        topSimilarDays: results.similarityScores.slice(0, topN).map((score: any) => score.day),
        ...(referenceMode === 'forecast' && {
          scenarioId: selectedScenario?.scenarioid,
          scenarioName: selectedScenario?.scenarioname
        })
      };
      
      const response = await fetch('/api/likeday-secondary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `Secondary analysis failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response format from server');
      }
      
      setSecondaryData(data);
      
      // Initialize secondary visible lines state with all lines visible
      const initialSecondaryVisibleLines: {[key: string]: boolean} = { reference: true };
      results?.similarityScores.forEach((score: SimilarityScore) => {
        initialSecondaryVisibleLines[score.day] = true;
      });
      setSecondaryVisibleLines(initialSecondaryVisibleLines);
      
      setProgress('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Secondary analysis failed');
      setProgress('');
    } finally {
      setSecondaryLoading(false);
    }
  };

  const handleDebug = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      setProgress('Fetching debug info...');
      
      const response = await fetch('/api/likeday-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        let errorMessage = `Debug failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response format from server');
      }
      setDebugInfo(data.debug);
      setProgress('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Debug failed');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVariableUnit = (variable: string) => {
    if (variable.includes('LMP') || variable.includes('Energy') || variable.includes('Congestion')) {
      return '$/MWh';
    } else if (variable.includes('Load')) {
      return 'MW';
    } else {
      return 'Value';
    }
  };

  const processChartDataForSecondaryVariable = (variable: string, data: any) => {
    if (!data || !data.chartData) return [];

    const referenceData = data.chartData?.[variable]?.[referenceDate];
    if (!referenceData) return [];

    const chartData = [];

    // Process data for hours 1-24
    for (let hour = 1; hour <= 24; hour++) {
      const hourData: any = { hour };

      // Add reference data
      const refPoint = referenceData.find((point: any) => point.HOURENDING === hour);
      if (refPoint) {
        const variableKey = Object.keys(refPoint).find(key => {
          const keyUpper = key.toUpperCase();
          const varUpper = variable.toUpperCase();
          
          // Same robust matching logic as main function
          if (varUpper.includes('RT LOAD') && !varUpper.includes('NET')) {
            return keyUpper.includes('RTLOAD') && !keyUpper.includes('NET');
          } else if (varUpper.includes('RT NET LOAD')) {
            return keyUpper.includes('RTLOAD_NET') || keyUpper.includes('NET_OF_RENEWABLES');
          } else if (varUpper.includes('RT LMP')) {
            return keyUpper.includes('RTLMP');
          } else if (varUpper.includes('RT ENERGY')) {
            return keyUpper.includes('RTENERGY');
          } else if (varUpper.includes('RT CONGESTION')) {
            return keyUpper.includes('RTCONG');
          } else if (varUpper.includes('DA LMP')) {
            return keyUpper.includes('DALMP');
          } else if (varUpper.includes('DA LOAD') && !varUpper.includes('NET')) {
            return keyUpper.includes('DA_DEMAND_FORECAST') || keyUpper.includes('DADEMANDFORECAST');
          } else if (varUpper.includes('DA NET LOAD')) {
            return keyUpper.includes('DA NET DEMAND FC') || keyUpper.includes('DANETDEMANDFC');
          }
          
          return keyUpper.includes(varUpper.replace(/\s+/g, '')) || 
                 keyUpper.includes(varUpper.replace(/\s+/g, '_'));
        });
        
        if (variableKey) {
          hourData[`reference_${variable.replace(/\s+/g, '_')}`] = refPoint[variableKey];
        }
      }

      // Add similar days data
      results.similarityScores.slice(0, topN).forEach((score: any, index: number) => {
        const similarDayData = data.chartData?.[variable]?.[score.day];
        if (similarDayData) {
          const simPoint = similarDayData.find((point: any) => point.HOURENDING === hour);
          if (simPoint) {
            const variableKey = Object.keys(simPoint).find(key => {
              const keyUpper = key.toUpperCase();
              const varUpper = variable.toUpperCase();
              
              // Same robust matching logic
              if (varUpper.includes('RT LOAD') && !varUpper.includes('NET')) {
                return keyUpper.includes('RTLOAD') && !keyUpper.includes('NET');
              } else if (varUpper.includes('RT NET LOAD')) {
                return keyUpper.includes('RTLOAD_NET') || keyUpper.includes('NET_OF_RENEWABLES');
              } else if (varUpper.includes('RT LMP')) {
                return keyUpper.includes('RTLMP');
              } else if (varUpper.includes('RT ENERGY')) {
                return keyUpper.includes('RTENERGY');
              } else if (varUpper.includes('RT CONGESTION')) {
                return keyUpper.includes('RTCONG');
              } else if (varUpper.includes('DA LMP')) {
                return keyUpper.includes('DALMP');
              } else if (varUpper.includes('DA LOAD') && !varUpper.includes('NET')) {
                return keyUpper.includes('DA_DEMAND_FORECAST') || keyUpper.includes('DADEMANDFORECAST');
              } else if (varUpper.includes('DA NET LOAD')) {
                return keyUpper.includes('DA NET DEMAND FC') || keyUpper.includes('DANETDEMANDFC');
              }
              
              return keyUpper.includes(varUpper.replace(/\s+/g, '')) || 
                     keyUpper.includes(varUpper.replace(/\s+/g, '_'));
            });
            
            if (variableKey) {
              hourData[`${score.day}_${variable.replace(/\s+/g, '_')}`] = simPoint[variableKey];
            }
          }
        }
      });

      chartData.push(hourData);
    }

    return chartData;
  };

  const processChartDataForVariable = (variable: string) => {
    if (!results || !results.chartData) return [];

    const referenceData = results.chartData?.[variable]?.[results.referenceDate];
    if (!referenceData) return [];

    console.log(`🔍 Processing chart data for variable: ${variable}`);
    console.log('🔍 Reference data sample:', referenceData.slice(0, 2));

    const chartData = [];

    // Process data for hours 1-24
    for (let hour = 1; hour <= 24; hour++) {
      const hourData: any = { hour };

      // Add reference data
      const refPoint = referenceData.find((point: any) => point.HOURENDING === hour);
      if (refPoint) {
        // More robust variable key finding
        const variableKey = Object.keys(refPoint).find(key => {
          const keyUpper = key.toUpperCase();
          const varUpper = variable.toUpperCase();
          
          // Direct match patterns for different variables
          if (varUpper.includes('RT LOAD') && !varUpper.includes('NET')) {
            return keyUpper.includes('RTLOAD') && !keyUpper.includes('NET');
          } else if (varUpper.includes('RT NET LOAD')) {
            return keyUpper.includes('RTLOAD_NET') || keyUpper.includes('NET_OF_RENEWABLES');
          } else if (varUpper.includes('RT LMP')) {
            return keyUpper.includes('RTLMP');
          } else if (varUpper.includes('RT ENERGY')) {
            return keyUpper.includes('RTENERGY');
          } else if (varUpper.includes('RT CONGESTION')) {
            return keyUpper.includes('RTCONG');
          } else if (varUpper.includes('DA LMP')) {
            return keyUpper.includes('DALMP');
          } else if (varUpper.includes('DA LOAD') && !varUpper.includes('NET')) {
            return keyUpper.includes('DA_DEMAND_FORECAST') || keyUpper.includes('DADEMANDFORECAST');
          } else if (varUpper.includes('DA NET LOAD')) {
            return keyUpper.includes('DA NET DEMAND FC') || keyUpper.includes('DANETDEMANDFC');
          }
          
          // Fallback to original logic
          return keyUpper.includes(varUpper.replace(/\s+/g, '')) || 
                 keyUpper.includes(varUpper.replace(/\s+/g, '_'));
        });
        
        if (variableKey) {
          hourData[`reference_${variable.replace(/\s+/g, '_')}`] = refPoint[variableKey];
          console.log(`🔍 Hour ${hour}: Found reference key "${variableKey}" = ${refPoint[variableKey]}`);
        } else {
          console.log(`⚠️ Hour ${hour}: No variable key found for ${variable}. Available keys:`, Object.keys(refPoint));
        }
      }

      // Add similar days data
      results.similarityScores.slice(0, topN).forEach((score: any, index: number) => {
        const similarDayData = results.chartData?.[variable]?.[score.day];
        if (similarDayData) {
          const simPoint = similarDayData.find((point: any) => point.HOURENDING === hour);
          if (simPoint) {
            const variableKey = Object.keys(simPoint).find(key => {
              const keyUpper = key.toUpperCase();
              const varUpper = variable.toUpperCase();
              
              // Same robust matching logic
              if (varUpper.includes('RT LOAD') && !varUpper.includes('NET')) {
                return keyUpper.includes('RTLOAD') && !keyUpper.includes('NET');
              } else if (varUpper.includes('RT NET LOAD')) {
                return keyUpper.includes('RTLOAD_NET') || keyUpper.includes('NET_OF_RENEWABLES');
              } else if (varUpper.includes('RT LMP')) {
                return keyUpper.includes('RTLMP');
              } else if (varUpper.includes('RT ENERGY')) {
                return keyUpper.includes('RTENERGY');
              } else if (varUpper.includes('RT CONGESTION')) {
                return keyUpper.includes('RTCONG');
              } else if (varUpper.includes('DA LMP')) {
                return keyUpper.includes('DALMP');
              } else if (varUpper.includes('DA LOAD') && !varUpper.includes('NET')) {
                return keyUpper.includes('DA_DEMAND_FORECAST') || keyUpper.includes('DADEMANDFORECAST');
              } else if (varUpper.includes('DA NET LOAD')) {
                return keyUpper.includes('DA NET DEMAND FC') || keyUpper.includes('DANETDEMANDFC');
              }
              
              return keyUpper.includes(varUpper.replace(/\s+/g, '')) || 
                     keyUpper.includes(varUpper.replace(/\s+/g, '_'));
            });
            
            if (variableKey) {
              hourData[`${score.day}_${variable.replace(/\s+/g, '_')}`] = simPoint[variableKey];
            }
          }
        }
      });

      chartData.push(hourData);
    }

    console.log(`🔍 Final chart data for ${variable}:`, chartData.slice(0, 3));
    return chartData;
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Likeday Parameters</h2>
        
        <div className="space-y-6">
          {/* Reference Mode Toggle - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Mode
            </label>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${referenceMode === 'historical' ? 'text-gray-900' : 'text-gray-500'}`}>
                Historical
              </span>
              <button
                onClick={() => handleModeToggle(referenceMode === 'historical' ? 'forecast' : 'historical')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  referenceMode === 'forecast' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    referenceMode === 'forecast' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${referenceMode === 'forecast' ? 'text-gray-900' : 'text-gray-500'}`}>
                Forecast
              </span>
            </div>
          </div>

          {/* Conditional Fields Based on Reference Mode */}
          {referenceMode === 'forecast' && (
            <div className="relative">
              {scenarioLoading ? (
                <div className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading scenarios...</div>
                </div>
              ) : availableScenarios.length === 0 ? (
                <div className="flex justify-center py-4">
                  <div className="text-sm text-red-500">No scenarios available</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scenario ID - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scenario ID
                    </label>
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900 font-medium">
                      {selectedScenario?.scenarioid || '--'}
                    </div>
                  </div>

                  {/* Simulation Date - Calendar Picker */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Simulation Date
                    </label>
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span>
                        {selectedScenario ? formatDisplayDate(selectedScenario.simulation_date) : 'Select Date'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {/* Calendar Picker */}
                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <CalendarPicker
                          availableDates={getAvailableDates()}
                          selectedDate={selectedScenario?.simulation_date || ''}
                          onDateSelect={handleDateSelect}
                          onClose={() => setShowCalendar(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Forecast Reference Date - Keep existing dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forecast Reference Date
                    </label>
                    <select
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!selectedScenario || availableDates.length === 0}
                    >
                      {availableDates.length === 0 ? (
                        <option value="">No dates available</option>
                      ) : (
                        availableDates.map(date => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Overlay to close calendar when clicking outside */}
              {showCalendar && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendar(false)}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reference Date (Historical Mode Only) */}
            {referenceMode === 'historical' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Date
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  max={new Date(Date.now() - 86400000).toISOString().split('T')[0]} // Yesterday
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Historical Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historical Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Historical End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historical End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Today
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Match Variable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Variable
              </label>
              <select
                value={matchVariable}
                onChange={(e) => setMatchVariable(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {matchVariableOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Top N */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top N Similar Days
              </label>
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Euclidean Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Euclidean Weight: {euclideanWeight.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={euclideanWeight}
                onChange={(e) => setEuclideanWeight(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Shape</span>
                <span>Magnitude</span>
              </div>
            </div>
          </div>
        </div>

        {/* Run Analysis Button */}
        <div className="mt-6">
          <button
            onClick={handleAnalysis}
            disabled={loading || (referenceMode === 'forecast' && !selectedScenario)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Analyzing...' : 'Run Likeday Analysis'}
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-4 text-sm text-blue-600">
            {progress}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Debug Information</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <strong>Requested URL:</strong>
              <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                {debugInfo.requestedUrl}
              </div>
            </div>
            
            <div>
              <strong>Date Range:</strong> {debugInfo.requestedDateRange}
            </div>
            
            <div>
              <strong>Total Records:</strong> {debugInfo.totalRecords}
            </div>
            
            <div>
              <strong>Unique Days Found:</strong> {debugInfo.uniqueDays.length}
              <div className="mt-2 max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
                {debugInfo.uniqueDays.join(', ')}
              </div>
            </div>
            
            <div>
              <strong>Sample Data:</strong>
              <pre className="mt-2 max-h-40 overflow-y-auto bg-gray-100 p-2 rounded text-xs">
                {JSON.stringify(debugInfo.sampleData, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Date Format Examples:</strong>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs">
                {JSON.stringify(debugInfo.dateTimeFormat, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Similarity Scores Table - Always Visible */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Similarity Scores
        </h3>
        
        {results ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Euclidean Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cosine Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combined Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.similarityScores.map((score: any, index: number) => (
                  <tr key={score.day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {score.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(score.day)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {score.euclidean.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {score.cosine.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {score.combined_score.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Run Analysis to See Results</p>
            <p className="mt-2">Similarity scores for the most similar historical days will appear here.</p>
          </div>
        )}
      </div>

      {/* Comparison Chart - Always Visible */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {results ? results.matchVariable : 'Variable Comparison'}
        </h3>
        
        {results ? (
          (() => {
            const chartData = processChartDataForVariable(results.matchVariable);
            if (chartData.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No chart data available for the selected parameters.
                </div>
              );
            }

            // Generate blue color gradient (darkest to lightest)
            const generateBlueGradient = (count: number) => {
              const colors = [];
              for (let i = 0; i < count; i++) {
                // Create a wider range from very dark blue to very light blue
                const ratio = i / Math.max(count - 1, 1);
                
                // Start with dark blue and progress to light blue
                const r = Math.floor(30 + (150 * ratio));   // 30 -> 180
                const g = Math.floor(60 + (150 * ratio));   // 60 -> 210  
                const b = Math.floor(120 + (135 * ratio));  // 120 -> 255
                
                colors.push(`rgb(${r}, ${g}, ${b})`);
              }
              return colors;
            };

            const blueColors = generateBlueGradient(results.topN);
            const yAxisLabel = getVariableUnit(results.matchVariable);
            
            // Toggle line visibility
            const toggleLine = (lineKey: string) => {
              setVisibleLines(prev => ({
                ...prev,
                [lineKey]: !prev[lineKey]
              }));
            };

            // Custom tooltip formatter
            const formatTooltip = (value: number, name: string) => {
              if (name === 'Reference') {
                return [`${value?.toFixed(2)} ${yAxisLabel}`, `Reference (${formatDate(results.referenceDate)})`];
              } else if (name.startsWith('Day ')) {
                const index = parseInt(name.split(' ')[1]) - 1;
                const similarDay = results.similarityScores[index];
                return [`${value?.toFixed(2)} ${yAxisLabel}`, `${similarDay.rank} (${formatDate(similarDay.day)})`];
              }
              return [`${value?.toFixed(2)} ${yAxisLabel}`, name];
            };

            return (
              <div>
                {/* Line Toggle Controls */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    {/* Reference Line Toggle */}
                    <button
                      onClick={() => toggleLine('reference')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        visibleLines.reference
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Reference ({formatDate(results.referenceDate)})
                    </button>
                    
                    {/* Similar Day Line Toggles */}
                    {results.similarityScores.slice(0, topN).map((score: SimilarityScore, index: number) => (
                      <button
                        key={score.day}
                        onClick={() => toggleLine(score.day)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          visibleLines[score.day]
                            ? 'text-white'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: visibleLines[score.day] ? blueColors[index] : undefined
                        }}
                      >
                        #{score.rank} ({formatDate(score.day)})
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 40, right: 30, left: 40, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      type="number"
                      domain={[1, 24]}
                      ticks={[1, 4, 8, 12, 16, 20, 24]}
                      label={{ value: 'Hour', position: 'bottom', offset: 0 }}
                    />
                    <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={formatTooltip}
                      labelFormatter={(hour) => `Hour ${hour}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    
                    {/* Reference date line (red) */}
                    <Line
                      type="monotone"
                      dataKey={`reference_${results.matchVariable.replace(/\s+/g, '_')}`}
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={false}
                      name="Reference"
                      connectNulls={false}
                      hide={!visibleLines.reference}
                    />
                    
                    {/* Similar days lines (blue gradient) */}
                    {results.similarityScores.slice(0, topN).map((score: any, index: number) => (
                      <Line
                        key={score.day}
                        type="monotone"
                        dataKey={`${score.day}_${results.matchVariable.replace(/\s+/g, '_')}`}
                        stroke={blueColors[index]}
                        strokeWidth={2}
                        dot={false}
                        name={`${score.rank} (${formatDate(score.day)})`}
                        connectNulls={false}
                        hide={!visibleLines[score.day]}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Run Analysis to See Chart</p>
            <p className="mt-2">Reference date vs similar historical days comparison will appear here.</p>
          </div>
        )}
      </div>

      {/* Secondary Comparison Chart - Always Visible */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Secondary Variable Comparison
          </h3>
          <div className="flex items-end gap-3">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare Variable
              </label>
              <select
                value={secondaryVariable}
                onChange={(e) => {
                  setSecondaryVariable(e.target.value);
                  setSecondaryData(null); // Clear previous secondary data
                }}
                disabled={!results}
                className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
                  !results ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">Select variable...</option>
                {secondaryVariableOptions
                  .filter(variable => variable !== matchVariable)
                  .map(variable => (
                    <option key={variable} value={variable}>
                      {variable}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleSecondaryAnalysis}
              disabled={!results || !secondaryVariable || secondaryLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
            >
              {secondaryLoading ? 'Loading...' : 'Compare'}
            </button>
          </div>
        </div>

        {results && secondaryVariable && secondaryData ? (
          <div className="h-96">
            {(() => {
              // Use secondary data instead of results data
              const chartData = processChartDataForSecondaryVariable(secondaryVariable, secondaryData);
              
              // Generate blue color gradient (same as main chart)
              const generateBlueGradient = (count: number) => {
                const colors = [];
                for (let i = 0; i < count; i++) {
                  // Create a wider range from very dark blue to very light blue
                  const ratio = i / Math.max(count - 1, 1);
                  
                  // Start with dark blue and progress to light blue
                  const r = Math.floor(30 + (150 * ratio));   // 30 -> 180
                  const g = Math.floor(60 + (150 * ratio));   // 60 -> 210  
                  const b = Math.floor(120 + (135 * ratio));  // 120 -> 255
                  
                  colors.push(`rgb(${r}, ${g}, ${b})`);
                }
                return colors;
              };

              const blueColors = generateBlueGradient(topN);
              
              // Toggle line visibility for secondary chart
              const toggleSecondaryLine = (lineKey: string) => {
                setSecondaryVisibleLines(prev => ({
                  ...prev,
                  [lineKey]: !prev[lineKey]
                }));
              };
              
              console.log('🔍 Secondary chart data:', chartData.length, 'points');
              if (chartData.length > 0) {
                console.log('🔍 First hour keys:', Object.keys(chartData[0]));
                console.log('🔍 First hour data:', chartData[0]);
              }

              return (
                <div>
                  {/* Line Toggle Controls for Secondary Chart */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-3">
                      {/* Reference Line Toggle */}
                      <button
                        onClick={() => toggleSecondaryLine('reference')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          secondaryVisibleLines.reference
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Reference ({formatDate(referenceDate)})
                      </button>
                      
                      {/* Similar Day Line Toggles */}
                      {results.similarityScores.slice(0, topN).map((score: SimilarityScore, index: number) => (
                        <button
                          key={score.day}
                          onClick={() => toggleSecondaryLine(score.day)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            secondaryVisibleLines[score.day]
                              ? 'text-white'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: secondaryVisibleLines[score.day] ? blueColors[index] : undefined
                          }}
                        >
                          #{score.rank} ({formatDate(score.day)})
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 60, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour"
                  domain={[1, 24]}
                  type="number"
                  ticks={[1, 4, 8, 12, 16, 20, 24]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Hour', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: `${secondaryVariable} (${getVariableUnit(secondaryVariable)})`, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    name
                  ]}
                  labelFormatter={(hour) => `Hour ${hour}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  verticalAlign="bottom"
                />
                
                {/* Reference Line */}
                <Line
                  type="monotone"
                  dataKey={`reference_${secondaryVariable.replace(/\s+/g, '_')}`}
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={false}
                  name="Reference"
                  hide={!secondaryVisibleLines.reference}
                />
                
                {/* Similar Days Lines - Use same colors as main chart */}
                {(() => {
                  const generateBlueGradient = (count: number) => {
                    const colors = [];
                    for (let i = 0; i < count; i++) {
                      const ratio = i / Math.max(count - 1, 1);
                      const r = Math.floor(30 + (150 * ratio));
                      const g = Math.floor(60 + (150 * ratio));
                      const b = Math.floor(120 + (135 * ratio));
                      colors.push(`rgb(${r}, ${g}, ${b})`);
                    }
                    return colors;
                  };

                  const blueColors = generateBlueGradient(topN);
                  
                  return results.similarityScores.slice(0, topN).map((score: any, index: number) => (
                    <Line
                      key={score.day}
                      type="monotone"
                      dataKey={`${score.day}_${secondaryVariable.replace(/\s+/g, '_')}`}
                      stroke={blueColors[index]}
                      strokeWidth={2}
                      dot={false}
                      name={`${score.rank} (${formatDate(score.day)})`}
                      hide={!secondaryVisibleLines[score.day]}
                    />
                  ));
                })()}
              </LineChart>
            </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium mb-2">Secondary Variable Comparison</p>
              <p className="text-sm">
                {!results 
                  ? "Run analysis first, then select a variable and click Compare"
                  : !secondaryVariable
                  ? "Select a variable from the dropdown and click Compare"
                  : "Click the Compare button to load this variable's data"
                }
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default LikedayAnalysis; 