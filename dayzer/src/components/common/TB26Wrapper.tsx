import React from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import TB26Display from './TB26Display';

export default function TB26Wrapper() {
  const { selectedScenario } = useScenario();
  
  if (!selectedScenario) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-500">Loading TB2.6 data...</div>
      </div>
    );
  }
  
  return <TB26Display tb26Data={null} scenarioId={selectedScenario.scenarioid} />;
}




