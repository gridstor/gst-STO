import React, { useEffect, useState } from 'react';

interface ScenarioInfo {
  scenarioid: number;
  simulationDate?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function ScenarioIdBubble() {
  const [scenarioInfo, setScenarioInfo] = useState<ScenarioInfo | null>(null);

  useEffect(() => {
    fetch('/api/zone-demand')
      .then(res => res.json())
      .then(data => {
        setScenarioInfo({
          scenarioid: data.scenarioid,
          simulationDate: data.simulationDate,
          dateRange: data.dateRange
        });
      });
  }, []);

  if (!scenarioInfo) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex flex-col gap-1 px-6 py-3 rounded-lg bg-blue-100 text-blue-700 text-sm shadow">
        {scenarioInfo.simulationDate && (
          <div className="text-center">
            <span className="font-semibold">Simulation Date: </span>
            <span className="font-mono">{formatDate(scenarioInfo.simulationDate)}</span>
          </div>
        )}
        {scenarioInfo.dateRange && (
          <div className="text-center">
            <span className="font-semibold">Date Range: </span>
            <span className="font-mono">
              {formatDate(scenarioInfo.dateRange.start)} - {formatDate(scenarioInfo.dateRange.end)}
            </span>
          </div>
        )}
        <div className="text-center">
          <span className="font-semibold">Dayzer Scenario ID: </span>
          <span className="font-mono">{scenarioInfo.scenarioid}</span>
        </div>
      </div>
    </div>
  );
} 