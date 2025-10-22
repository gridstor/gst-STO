import React from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import MECOverviewChart from './MECOverviewChart';

export default function MECOverviewWrapper() {
  const { selectedScenario } = useScenario();
  
  if (!selectedScenario) {
    return (
      <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
        <div className="text-gs-gray-500">Loading MEC data...</div>
      </div>
    );
  }
  
  // MECOverviewChart already handles its own card styling with blue border
  // Just pass the scenarioId
  return (
    <div id="mec-overview" className="scroll-mt-6">
      <MECOverviewChart scenarioId={selectedScenario.scenarioid} />
    </div>
  );
}

