import React, { useState, useEffect } from 'react';

interface ScenarioDate {
  date: string; // YYYY-MM-DD format
  scenarioid: number;
  scenarioname: string;
  hasPreviousWeek: boolean;
}

interface ScenarioDatePickerProps {
  onDateChange?: (selectedDate: string, currentWeekScenario: number, lastWeekScenario: number | null) => void;
}

function ScenarioDatePicker({ onDateChange }: ScenarioDatePickerProps = {}) {
  const [availableDates, setAvailableDates] = useState<ScenarioDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchAvailableDates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/available-scenario-dates');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch available dates: ${response.status}`);
        }
        
        const data = await response.json();
        
        setAvailableDates(data.availableDates || []);
        
        // Set default date
        const defaultDate = data.defaultDate || data.availableDates[0]?.date;
        if (defaultDate) {
          setSelectedDate(defaultDate);
          handleDateSelection(defaultDate, data.availableDates);
        }
      } catch (err) {
        console.error('Error fetching available dates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch available dates');
        
        // Fallback: Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        if (onDateChange) {
          onDateChange(today, 0, null); // Use fallback scenario IDs
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDates();
  }, []);

  const handleDateSelection = (dateStr: string, dates: ScenarioDate[] = availableDates) => {
    // Selected date becomes "today" - we need scenarios for past week and future week
    
    // Future Week: Selected date scenario (for forecasting the upcoming week)
    const futureWeekScenario = dates.find(d => d.date === dateStr);
    if (!futureWeekScenario) return;

    // Past Week: Find scenario for 7 days before selected date (parse as local time)
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const pastWeekDate = new Date(selectedDate);
    pastWeekDate.setDate(selectedDate.getDate() - 7);
    const pastWeekDateStr = `${pastWeekDate.getFullYear()}-${String(pastWeekDate.getMonth() + 1).padStart(2, '0')}-${String(pastWeekDate.getDate()).padStart(2, '0')}`;
    
    const pastWeekScenario = dates.find(d => d.date === pastWeekDateStr);


    setSelectedDate(dateStr);
    setIsCalendarOpen(false);
    
    // Trigger a custom event to notify charts of the change
    // Charts will use the scenario IDs from the event detail
    window.dispatchEvent(new CustomEvent('scenarioChanged', {
      detail: {
        selectedDate: dateStr,
        currentWeekScenario: futureWeekScenario.scenarioid,
        lastWeekScenario: pastWeekScenario?.scenarioid || null
      }
    }));
    
    // Call the callback if provided
    if (onDateChange) {
      onDateChange(
        dateStr, 
        futureWeekScenario.scenarioid, 
        pastWeekScenario?.scenarioid || null
      );
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    // Parse as local time to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate calendar grid for current month
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const grid: (ScenarioDate | null | { dayNumber: number })[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Format date as YYYY-MM-DD without timezone conversion
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      
      const currentDate = new Date(year, month, day); // Local time
      const cutoffDate = new Date(2025, 8, 16); // Sept 16, 2025 in local time
      
      // Only allow dates after September 16th, 2025
      const isAfterCutoff = currentDate > cutoffDate;
      const scenarioForDate = availableDates.find(d => d.date === dateStr);
      
      if (scenarioForDate && isAfterCutoff) {
        grid.push(scenarioForDate);
      } else {
        grid.push({ dayNumber: day }); // Non-selectable date with day number
      }
    }
    
    return { grid, startDayOfWeek };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="text-sm text-gray-600">Loading available dates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-1">Error loading scenario dates</div>
          <div className="text-sm text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const { grid: calendarGrid, startDayOfWeek } = generateCalendarGrid();
  const selectedScenario = availableDates.find(d => d.date === selectedDate);
  
  const currentMonthName = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const lastWeekScenario = selectedScenario?.hasPreviousWeek ? availableDates.find(d => {
    const selectedDate = new Date(selectedScenario.date);
    const pastWeekDate = new Date(selectedDate);
    pastWeekDate.setDate(selectedDate.getDate() - 7);
    return d.date === pastWeekDate.toISOString().split('T')[0];
  }) : null;

  // Calculate date ranges (parse as local time to avoid timezone shift)
  const forecastDateRange = selectedScenario ? (() => {
    const [year, month, day] = selectedScenario.date.split('-').map(Number);
    const simDate = new Date(year, month - 1, day);
    const startDate = new Date(simDate); // Starts ON simulation date
    const endDate = new Date(simDate);
    endDate.setDate(simDate.getDate() + 6); // 6 days forward (7 days total)
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  })() : null;

  const historicalDateRange = selectedScenario ? (() => {
    const [year, month, day] = selectedScenario.date.split('-').map(Number);
    const simDate = new Date(year, month - 1, day);
    const endDate = new Date(simDate);
    endDate.setDate(simDate.getDate() - 1); // Day before simulation date
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days back
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  })() : null;

  return (
    <div className="w-full relative">
      <div className="flex items-start gap-x-12 gap-y-4 flex-wrap">
        {/* Column 1: Simulation Date */}
        <div className="flex items-center gap-2 relative">
          <span className="text-sm font-medium text-gs-gray-600">Simulation Date:</span>
          <button
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
            }}
            className="text-sm font-semibold text-gs-gray-900 hover:text-gs-blue-600 cursor-pointer underline decoration-dotted underline-offset-2 flex items-center gap-1 transition-colors font-mono"
          >
            <span>{selectedDate ? formatDisplayDate(selectedDate) : 'Select Date'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Calendar Dropdown */}
          {isCalendarOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 w-[280px]">
            {/* Calendar Header with Navigation */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <button 
                onClick={() => navigateMonth('prev')}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h4 className="text-sm font-semibold text-gray-700">{currentMonthName}</h4>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => navigateMonth('next')}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xs ml-2"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs text-gray-500 text-center p-1 font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((dateObj, index) => (
                  <div key={index} className="aspect-square">
                    {dateObj && 'date' in dateObj ? (
                      // Selectable date with scenario
                      <button
                        onClick={() => handleDateSelection(dateObj.date)}
                        className={`w-full h-full text-xs rounded text-center transition-colors ${
                          selectedDate === dateObj.date
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-blue-100'
                        }`}
                      >
                        {parseInt(dateObj.date.split('-')[2])}
                      </button>
                    ) : dateObj && 'dayNumber' in dateObj ? (
                      // Non-selectable date (greyed out)
                      <div className="w-full h-full text-xs text-gray-300 text-center p-2 cursor-not-allowed">
                        {dateObj.dayNumber}
                      </div>
                    ) : (
                      // Empty cell (before month starts)
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Column 2: Forecast Info */}
        {selectedScenario && (
          <div className="space-y-2">
            {/* Forecast Scenario ID */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gs-gray-600">Forecast Scenario ID:</span>
              <span className="text-sm font-semibold text-gs-blue-600 font-mono">{selectedScenario.scenarioid}</span>
            </div>
            
            {/* Forecast Date Range */}
            {forecastDateRange && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gs-gray-600">Forecast Date Range:</span>
                <span className="text-sm font-semibold text-gs-gray-900 font-mono">
                  {forecastDateRange.start} - {forecastDateRange.end}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Column 3: Historical Info */}
        {selectedScenario?.hasPreviousWeek && lastWeekScenario && (
          <div className="space-y-2">
            {/* Historical Scenario ID */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gs-gray-600">Historical Scenario ID:</span>
              <span className="text-sm font-semibold text-gs-blue-600 font-mono">{lastWeekScenario.scenarioid}</span>
            </div>
            
            {/* Historical Date Range */}
            {historicalDateRange && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gs-gray-600">Historical Date Range:</span>
                <span className="text-sm font-semibold text-gs-gray-900 font-mono">
                  {historicalDateRange.start} - {historicalDateRange.end}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Overlay to close calendar when clicking outside */}
      {isCalendarOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
}

export default ScenarioDatePicker;
