import React, { useState, useEffect, useMemo } from 'react';
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

  // Plotly component state
  const [Plot, setPlot] = useState<any>(null);

  // Load Plotly only on client side
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);

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
  const formatDisplayDate = (dateInput: string | Date | any) => {
    try {
      if (!dateInput) {
        return 'Invalid Date';
      }
      
      let date: Date;
      
      // If it's already a Date object, use it directly
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        // Handle string formats
        if (dateInput.includes('/')) {
          // MM/DD/YYYY format
          const [month, day, year] = dateInput.split('/').map(Number);
          date = new Date(year, month - 1, day);
        } else if (dateInput.includes('T')) {
          // ISO format (e.g., "2025-10-29T00:00:00.000Z")
          date = new Date(dateInput);
        } else if (dateInput.includes('-')) {
          const parts = dateInput.split('-');
          
          // Check if it's DD-MMM-YYYY format (e.g., "29-Oct-2025")
          if (parts.length === 3 && isNaN(Number(parts[1]))) {
            // Month is text (e.g., "Oct"), use Date constructor
            date = new Date(dateInput);
          } else {
            // YYYY-MM-DD format - parse as local date
            const datePart = dateInput.split('T')[0]; // Remove time part if exists
            const [year, month, day] = datePart.split('-').map(Number);
            date = new Date(year, month - 1, day);
          }
        } else {
          // Try using Date constructor as fallback
          date = new Date(dateInput);
        }
      } else {
        return String(dateInput);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Use UTC to avoid timezone shifting for ISO dates
      });
    } catch (error) {
      console.error('formatDisplayDate error:', dateInput, error);
      return String(dateInput);
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
    try {
      // Handle both MM/DD/YYYY (from YES Energy API) and YYYY-MM-DD formats
      let date: Date;
      
      if (dateString.includes('/')) {
        // MM/DD/YYYY format (from YES Energy API)
        const [month, day, year] = dateString.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else if (dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        return dateString; // Return as-is if format is unrecognized
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString; // Return as-is if parsing fails
    }
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
    <div className="space-y-12">
      {/* Controls Section */}
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500">
        <h2 className="text-2xl font-semibold text-gs-gray-900 mb-6">Analysis Parameters</h2>
        
        <div className="space-y-6">
          {/* Reference Mode Toggle - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gs-gray-700 mb-2">
              Reference Mode
            </label>
            <div className="inline-flex items-center space-x-3 bg-gs-gray-50 border border-gs-gray-300 rounded-lg px-4 py-3">
              <span className={`text-sm font-medium ${referenceMode === 'historical' ? 'text-gs-gray-900' : 'text-gs-gray-500'}`}>
                Historical
              </span>
              <button
                onClick={() => handleModeToggle(referenceMode === 'historical' ? 'forecast' : 'historical')}
                className={`relative inline-flex h-6 w-11 items-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gs-blue-500 focus:ring-offset-2 ${
                  referenceMode === 'forecast' ? 'bg-gs-blue-500' : 'bg-gs-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    referenceMode === 'forecast' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${referenceMode === 'forecast' ? 'text-gs-gray-900' : 'text-gs-gray-500'}`}>
                Forecast
              </span>
            </div>
          </div>

          {/* Conditional Fields Based on Reference Mode */}
          {referenceMode === 'forecast' && (
            <div className="relative">
              {scenarioLoading ? (
                <div className="flex justify-center py-4">
                  <div className="text-sm text-gs-gray-500">Loading scenarios...</div>
                </div>
              ) : availableScenarios.length === 0 ? (
                <div className="flex justify-center py-4">
                  <div className="text-sm text-gs-red-500">No scenarios available</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scenario ID - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                      Scenario ID
                    </label>
                    <div className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 bg-gs-gray-50 text-gs-gray-900 font-medium font-mono">
                      {selectedScenario?.scenarioid || '--'}
                    </div>
                  </div>

                  {/* Simulation Date - Calendar Picker */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                      Simulation Date
                    </label>
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 text-left bg-white hover:bg-gs-gray-50 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 flex items-center justify-between transition-colors"
                    >
                      <span>
                        {selectedScenario ? formatDisplayDate(selectedScenario.simulation_date) : 'Select Date'}
                      </span>
                      <svg className="w-4 h-4 text-gs-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                      Forecast Reference Date
                    </label>
                    <select
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                      className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 transition-colors"
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
                <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                  Reference Date
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  max={new Date(Date.now() - 86400000).toISOString().split('T')[0]} // Yesterday
                  className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 transition-colors"
                />
              </div>
            )}

            {/* Historical Start Date */}
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                Historical Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 transition-colors"
              />
            </div>

            {/* Historical End Date */}
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                Historical End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Today
                className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 transition-colors"
              />
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Match Variable */}
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                Match Variable
              </label>
              <select
                value={matchVariable}
                onChange={(e) => setMatchVariable(e.target.value)}
                className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 transition-colors"
              >
                {matchVariableOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Top N */}
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                Top N Similar Days
              </label>
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full border border-gs-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500 font-mono transition-colors"
              />
            </div>

            {/* Euclidean Weight */}
            <div>
              <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                Euclidean Weight: <span className="font-mono">{euclideanWeight.toFixed(2)}</span>
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
              <div className="flex justify-between text-xs text-gs-gray-500 mt-1">
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
            className="bg-gs-blue-500 text-white px-6 py-3 rounded-lg hover:bg-gs-blue-600 disabled:bg-gs-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Analyzing...' : 'Run Likeday Analysis'}
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-4 text-sm text-gs-blue-500 font-medium">
            {progress}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-gs-red-500 font-medium">
            Error: {error}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="bg-gs-amber-50 p-6 rounded-lg border-l-4 border-gs-amber-500 shadow-gs-sm">
          <h3 className="text-xl font-semibold text-gs-gray-900 mb-4">Debug Information</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <strong className="text-gs-gray-700">Requested URL:</strong>
              <div className="font-mono text-xs bg-gs-gray-50 p-2 rounded-lg mt-1 break-all border border-gs-gray-200">
                {debugInfo.requestedUrl}
              </div>
            </div>
            
            <div>
              <strong className="text-gs-gray-700">Date Range:</strong> <span className="font-mono">{debugInfo.requestedDateRange}</span>
            </div>
            
            <div>
              <strong className="text-gs-gray-700">Total Records:</strong> <span className="font-mono">{debugInfo.totalRecords}</span>
            </div>
            
            <div>
              <strong className="text-gs-gray-700">Unique Days Found:</strong> <span className="font-mono">{debugInfo.uniqueDays.length}</span>
              <div className="mt-2 max-h-32 overflow-y-auto bg-gs-gray-50 p-2 rounded-lg border border-gs-gray-200 font-mono text-xs">
                {debugInfo.uniqueDays.join(', ')}
              </div>
            </div>
            
            <div>
              <strong className="text-gs-gray-700">Sample Data:</strong>
              <pre className="mt-2 max-h-40 overflow-y-auto bg-gs-gray-50 p-2 rounded-lg text-xs font-mono border border-gs-gray-200">
                {JSON.stringify(debugInfo.sampleData, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong className="text-gs-gray-700">Date Format Examples:</strong>
              <pre className="mt-2 bg-gs-gray-50 p-2 rounded-lg text-xs font-mono border border-gs-gray-200">
                {JSON.stringify(debugInfo.dateTimeFormat, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Similarity Scores Table - Always Visible */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Similarity Scores</h2>
          <p className="text-gs-gray-600">Ranked by combined similarity score</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-purple-500">
        {results ? (
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gs-gray-200">
                <thead className="bg-gs-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gs-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gs-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gs-gray-700 uppercase tracking-wider">
                    Euclidean Distance
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gs-gray-700 uppercase tracking-wider">
                    Cosine Distance
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gs-gray-700 uppercase tracking-wider">
                    Combined Score
                  </th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gs-gray-200">
                {results.similarityScores.map((score: any, index: number) => (
                    <tr key={score.day} className={index % 2 === 0 ? 'bg-white' : 'bg-gs-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gs-gray-900 font-mono">
                        #{score.rank}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gs-gray-900">
                      {formatDate(score.day)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gs-gray-900 font-mono">
                      {score.euclidean.toFixed(2)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gs-gray-900 font-mono">
                      {score.cosine.toFixed(4)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gs-gray-900 font-mono">
                      {score.combined_score.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <div className="text-center py-12 text-gs-gray-500">
            <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gs-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
              <p className="text-lg font-medium text-gs-gray-900">Run Analysis to See Results</p>
              <p className="mt-2 text-gs-gray-600">Similarity scores for the most similar historical days will appear here.</p>
          </div>
        )}
      </div>
      </section>

      {/* Comparison Chart - Always Visible */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">
          {results ? results.matchVariable : 'Variable Comparison'}
          </h2>
          <p className="text-gs-gray-600">Reference date vs similar historical days</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500">
        {results ? (
          (() => {
            const chartData = processChartDataForVariable(results.matchVariable);
            if (chartData.length === 0) {
              return (
                  <div className="text-center py-8 text-gs-gray-500">
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

            // Generate Plotly traces
            const traces: any[] = [];

            // Reference line (red)
            traces.push({
              x: chartData.map(d => d.hour),
              y: chartData.map(d => d[`reference_${results.matchVariable.replace(/\s+/g, '_')}`]),
              name: `Reference (${formatDate(results.referenceDate)})`,
              type: 'scatter',
              mode: 'lines',
              line: {
                color: '#EF4444',
                width: 3
              },
              hovertemplate: `<b>Reference (${formatDate(results.referenceDate)})</b><br>Hour %{x}<br>%{y:.2f} ${yAxisLabel}<extra></extra>`
            });

            // Similar days lines (blue gradient)
            results.similarityScores.slice(0, topN).forEach((score: any, index: number) => {
              traces.push({
                x: chartData.map(d => d.hour),
                y: chartData.map(d => d[`${score.day}_${results.matchVariable.replace(/\s+/g, '_')}`]),
                name: `#${score.rank} (${formatDate(score.day)})`,
                type: 'scatter',
                mode: 'lines',
                line: {
                  color: blueColors[index],
                  width: 2
                },
                hovertemplate: `<b>#${score.rank} (${formatDate(score.day)})</b><br>Hour %{x}<br>%{y:.2f} ${yAxisLabel}<extra></extra>`
              });
            });

            // Plotly layout
            const layout = {
              height: 400,
              margin: { l: 80, r: 40, t: 20, b: 60 },
              xaxis: {
                title: { text: 'Hour', font: { size: 14, family: 'Inter, sans-serif', color: '#374151' } },
                tickmode: 'array',
                tickvals: [1, 4, 8, 12, 16, 20, 24],
                showgrid: true,
                gridcolor: '#E5E7EB',
                zeroline: false,
                showline: true,
                linecolor: '#6B7280',
                linewidth: 1
              },
              yaxis: {
                title: { text: yAxisLabel, font: { size: 14, family: 'Inter, sans-serif', color: '#374151' } },
                showgrid: true,
                gridcolor: '#E5E7EB',
                zeroline: true,
                zerolinecolor: '#9CA3AF',
                showline: true,
                linecolor: '#6B7280',
                linewidth: 1
              },
              hovermode: 'x unified',
              legend: {
                orientation: 'h',
                yanchor: 'top',
                y: -0.2,
                xanchor: 'center',
                x: 0.5,
                font: { size: 11, family: 'Inter, sans-serif' }
              },
              showlegend: true,
              plot_bgcolor: 'white',
              paper_bgcolor: 'white'
            };

            const config = {
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
              toImageButtonOptions: {
                format: 'png',
                filename: `likeday_${results.matchVariable.replace(/\s+/g, '_')}`,
                height: 600,
                width: 1200,
                scale: 2
              }
            };

            return (
              <div>
                {!Plot ? (
                  <div className="h-96 flex items-center justify-center text-gs-gray-500">
                    Loading chart...
                  </div>
                ) : (
                  <Plot
                    data={traces}
                    layout={layout}
                    config={config}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                  />
                )}
              </div>
            );
          })()
        ) : (
          <div className="text-center py-12 text-gs-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gs-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gs-gray-900">Run Analysis to See Chart</p>
            <p className="mt-2 text-gs-gray-600">Reference date vs similar historical days comparison will appear here.</p>
          </div>
        )}
      </div>
      </section>

      {/* Secondary Comparison Chart - Always Visible */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Secondary Variable Comparison</h2>
          <p className="text-gs-gray-600">Compare an additional variable using the same similar days</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-green-500">
          <div className="flex items-center justify-between mb-6">
          <div className="flex items-end gap-3">
            <div className="w-48">
                <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                Compare Variable
              </label>
              <select
                value={secondaryVariable}
                onChange={(e) => {
                  setSecondaryVariable(e.target.value);
                  setSecondaryData(null); // Clear previous secondary data
                }}
                disabled={!results}
                  className={`w-full p-2 border border-gs-gray-300 rounded-lg text-sm transition-colors ${
                    !results ? 'bg-gs-gray-100 text-gs-gray-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-gs-blue-500 focus:border-gs-blue-500'
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
                className="bg-gs-green-500 text-white px-4 py-2 rounded-lg hover:bg-gs-green-600 disabled:bg-gs-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-colors"
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
              
              console.log('🔍 Secondary chart data:', chartData.length, 'points');
              if (chartData.length > 0) {
                console.log('🔍 First hour keys:', Object.keys(chartData[0]));
                console.log('🔍 First hour data:', chartData[0]);
              }

              // Generate secondary Plotly traces
              const secondaryTraces: any[] = [];
              const secondaryYAxisLabel = getVariableUnit(secondaryVariable);

              // Reference line (red)
              secondaryTraces.push({
                x: chartData.map(d => d.hour),
                y: chartData.map(d => d[`reference_${secondaryVariable.replace(/\s+/g, '_')}`]),
                name: `Reference (${formatDate(referenceDate)})`,
                type: 'scatter',
                mode: 'lines',
                line: {
                  color: '#EF4444',
                  width: 3
                },
                hovertemplate: `<b>Reference (${formatDate(referenceDate)})</b><br>Hour %{x}<br>%{y:.2f} ${secondaryYAxisLabel}<extra></extra>`
              });

              // Similar days lines (blue gradient)
              results.similarityScores.slice(0, topN).forEach((score: any, index: number) => {
                secondaryTraces.push({
                  x: chartData.map(d => d.hour),
                  y: chartData.map(d => d[`${score.day}_${secondaryVariable.replace(/\s+/g, '_')}`]),
                  name: `#${score.rank} (${formatDate(score.day)})`,
                  type: 'scatter',
                  mode: 'lines',
                  line: {
                    color: blueColors[index],
                    width: 2
                  },
                  hovertemplate: `<b>#${score.rank} (${formatDate(score.day)})</b><br>Hour %{x}<br>%{y:.2f} ${secondaryYAxisLabel}<extra></extra>`
                });
              });

              // Secondary Plotly layout
              const secondaryLayout = {
                height: 400,
                margin: { l: 80, r: 40, t: 20, b: 60 },
                xaxis: {
                  title: { text: 'Hour', font: { size: 14, family: 'Inter, sans-serif', color: '#374151' } },
                  tickmode: 'array',
                  tickvals: [1, 4, 8, 12, 16, 20, 24],
                  showgrid: true,
                  gridcolor: '#E5E7EB',
                  zeroline: false,
                  showline: true,
                  linecolor: '#6B7280',
                  linewidth: 1
                },
                yaxis: {
                  title: { text: `${secondaryVariable} (${secondaryYAxisLabel})`, font: { size: 14, family: 'Inter, sans-serif', color: '#374151' } },
                  showgrid: true,
                  gridcolor: '#E5E7EB',
                  zeroline: true,
                  zerolinecolor: '#9CA3AF',
                  showline: true,
                  linecolor: '#6B7280',
                  linewidth: 1
                },
                hovermode: 'x unified',
                legend: {
                  orientation: 'h',
                  yanchor: 'top',
                  y: -0.2,
                  xanchor: 'center',
                  x: 0.5,
                  font: { size: 11, family: 'Inter, sans-serif' }
                },
                showlegend: true,
                plot_bgcolor: 'white',
                paper_bgcolor: 'white'
              };

              const secondaryConfig = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
                toImageButtonOptions: {
                  format: 'png',
                  filename: `likeday_${secondaryVariable.replace(/\s+/g, '_')}`,
                  height: 600,
                  width: 1200,
                  scale: 2
                }
              };

              return (
                <div>
                  {!Plot ? (
                    <div className="h-96 flex items-center justify-center text-gs-gray-500">
                      Loading chart...
                    </div>
                  ) : (
                    <Plot
                      data={secondaryTraces}
                      layout={secondaryLayout}
                      config={secondaryConfig}
                      style={{ width: '100%', height: '400px' }}
                      useResizeHandler={true}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gs-gray-200 rounded-lg">
            <div className="text-center text-gs-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium mb-2 text-gs-gray-900">Secondary Variable Comparison</p>
              <p className="text-sm text-gs-gray-600">
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
      </section>

    </div>
  );
};

export default LikedayAnalysis; 