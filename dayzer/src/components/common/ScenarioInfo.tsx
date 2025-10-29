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
      // Parse date string as local time to avoid timezone shift
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
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
      <div className={`w-full p-6 ${className}`}>
        <div className="text-sm text-gs-gray-500">Loading scenario info...</div>
      </div>
    );
  }

  if (error || !selectedScenario) {
    return (
      <div className={`w-full p-6 ${className}`}>
        <div className="text-sm text-gs-red-500">
          {error || 'No scenario available'}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative p-6 ${className}`}>
      <div className="flex items-center flex-wrap gap-x-8 gap-y-4">
        {/* 1. Simulation Date */}
        <div className="flex items-center gap-2 relative">
          <span className="text-sm font-medium text-gs-gray-600">Simulation Date:</span>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-sm font-semibold text-gs-gray-900 hover:text-gs-blue-600 cursor-pointer underline decoration-dotted underline-offset-2 flex items-center gap-1 transition-colors font-mono"
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gs-gray-600">Date Range:</span>
            <span className="text-sm font-semibold text-gs-gray-900 font-mono">
              {formatDisplayDate(dateRange.start)} - {formatDisplayDate(dateRange.end)}
            </span>
          </div>
        )}
        
        {/* 3. Dayzer Scenario ID */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gs-gray-600">Dayzer Scenario ID:</span>
          <span className="text-sm font-semibold text-gs-blue-600 font-mono">{selectedScenario.scenarioid}</span>
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