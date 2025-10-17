import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import CalendarPicker from './CalendarPicker';

interface ScenarioInfoProps {
  className?: string;
}

export default function ScenarioInfo({ className = '' }: ScenarioInfoProps) {
  const { selectedScenario, availableScenarios, setSelectedScenario, loading, error } = useScenario();
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Fetch date range when scenario changes
  useEffect(() => {
    if (!selectedScenario) return;
    
    fetch(`/api/zone-demand?scenarioid=${selectedScenario.scenarioid}`)
      .then(res => res.json())
      .then(data => {
        if (data.dateRange) {
          setDateRange(data.dateRange);
        }
      })
      .catch(err => console.error('Error fetching date range:', err));
  }, [selectedScenario]);

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

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate: string) => {
    // Find the scenario with the matching simulation date
    const matchingScenario = availableScenarios.find(
      scenario => scenario.simulation_date === selectedDate
    );
    
    if (matchingScenario) {
      setSelectedScenario(matchingScenario);
    }
  };

  // Get available dates for the calendar
  const getAvailableDates = () => {
    const dates = availableScenarios.map(scenario => scenario.simulation_date);
    console.log('ScenarioInfo - Available scenarios:', availableScenarios);
    console.log('ScenarioInfo - Extracted dates:', dates);
    return dates;
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex justify-center">
              <div className="text-sm text-gray-500">Loading scenario info...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !selectedScenario) {
    return (
      <div className={`w-full ${className}`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex justify-center">
              <div className="text-sm text-red-500">
                {error || 'No scenario available'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative ${className}`}>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex justify-center">
            <div className="flex items-center space-x-6">
              {/* 1. Simulation Date */}
              <div className="flex items-center space-x-1 relative">
                <span className="text-sm font-medium text-gray-500">Simulation Date:</span>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer underline decoration-dotted underline-offset-2 flex items-center space-x-1"
                >
                  <span>{formatDisplayDate(selectedScenario.simulation_date)}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                
                {/* Calendar Picker */}
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <CalendarPicker
                      availableDates={getAvailableDates()}
                      selectedDate={selectedScenario.simulation_date}
                      onDateSelect={handleDateSelect}
                      onClose={() => setShowCalendar(false)}
                    />
                  </div>
                )}
              </div>
              
              {/* 2. Date Range */}
              {dateRange && (
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-500">Date Range:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDisplayDate(dateRange.start)} - {formatDisplayDate(dateRange.end)}
                  </span>
                </div>
              )}
              
              {/* 3. Dayzer Scenario ID */}
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-500">Dayzer Scenario ID:</span>
                <span className="text-sm font-semibold text-blue-600">{selectedScenario.scenarioid}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close calendar when clicking outside */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
} 