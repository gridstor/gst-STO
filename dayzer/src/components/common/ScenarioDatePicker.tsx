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
    console.log('📅 DATE PICKER COMPONENT MOUNTED');
    
    const fetchAvailableDates = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('📅 DATE PICKER: Fetching available dates...');
        const response = await fetch('/api/available-scenario-dates');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch available dates: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Available dates received:', data);
        console.log('Available dates count:', data.availableDates?.length || 0);
        
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

    // Past Week: Find scenario for 7 days before selected date
    const selectedDate = new Date(dateStr);
    const pastWeekDate = new Date(selectedDate);
    pastWeekDate.setDate(selectedDate.getDate() - 7);
    const pastWeekDateStr = pastWeekDate.toISOString().split('T')[0];
    
    const pastWeekScenario = dates.find(d => d.date === pastWeekDateStr);

    console.log(`SELECTED: ${dateStr} → Future: ${futureWeekScenario.scenarioid}, Past: ${pastWeekScenario?.scenarioid || 'None'}`);

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
    const date = new Date(dateStr);
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
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const currentDate = new Date(dateStr);
      const cutoffDate = new Date('2025-09-16');
      
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

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Scenario Info Display */}
      {selectedScenario && (
        <div className="text-sm text-gray-600">
          <div className="mb-1">
            <span className="font-medium">Forecast Scenario ID:</span> {selectedScenario.scenarioid}
          </div>
          {selectedScenario.hasPreviousWeek && (
            <div>
              <span className="font-medium">Historical Scenario ID:</span> {
                availableDates.find(d => {
                  const selectedDate = new Date(selectedScenario.date);
                  const pastWeekDate = new Date(selectedDate);
                  pastWeekDate.setDate(selectedDate.getDate() - 7);
                  return d.date === pastWeekDate.toISOString().split('T')[0];
                })?.scenarioid || 'N/A'
              }
            </div>
          )}
        </div>
      )}
      
      {/* Date Picker */}
      <div className="relative">
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Simulation Date:</span>
        </div>
        <button
          onClick={() => {
            console.log('📅 CALENDAR BUTTON CLICKED');
            setIsCalendarOpen(!isCalendarOpen);
          }}
          className="bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center gap-2"
        >
          {selectedDate ? formatDisplayDate(selectedDate) : 'Select Date'}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Calendar Dropdown */}
        {isCalendarOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-[280px]">
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
                        {new Date(dateObj.date).getDate()}
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

      {/* Click outside to close calendar */}
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
