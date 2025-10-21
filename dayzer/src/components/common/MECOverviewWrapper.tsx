import React from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import MECOverviewChart from './MECOverviewChart';

export default function MECOverviewWrapper() {
  const { selectedScenario } = useScenario();
  
  if (!selectedScenario) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-500">Loading MEC data...</div>
      </div>
    );
  }
  
  // MECOverviewChart already handles scenario prop internally
  // We just need to ensure it receives the selected scenario
  return (
    <div id="mec-overview" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 scroll-mt-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">MEC Overview</h2>
        <div className="flex flex-wrap justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-600"></div>
            <span className="text-gray-600">Top 2 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-600"></div>
            <span className="text-gray-600">Bottom 2 Hours</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <MECOverviewChart scenarioId={selectedScenario.scenarioid} />
      </div>
    </div>
  );
}

