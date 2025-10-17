import React from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioInfo from './common/ScenarioInfo';
import ZoneDemandChart from './common/ZoneDemandChart';
import NetLoadChart from './common/NetLoadChart';
import WeeklyLoadComparison from './common/WeeklyLoadComparison';
import WeekOverview from './common/WeekOverview';
import ZoneLMPChart from './common/ZoneLMPChart';
import SupplyStackChart from './common/SupplyStackChart';

export default function CAISOFundamentalsPage() {
  return (
    <ScenarioProvider>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">CAISO System</h1>
          <p className="mt-2 text-sm text-gray-600">System-wide Fundamentals Forecast of Load, Net Load, and Generation</p>
        </div>
        
        {/* Scenario Info Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ScenarioInfo />
        </div>
        
        {/* Charts without container wrapper */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <ZoneDemandChart />
            <NetLoadChart />
            
            {/* Weekly Load Comparison and Week Overview in 2/3 + 1/3 layout */}
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                <WeeklyLoadComparison />
              </div>
              <div className="col-span-1">
                <WeekOverview />
              </div>
            </div>
            
            <ZoneLMPChart />
            <SupplyStackChart />
          </div>
        </div>
      </div>
    </ScenarioProvider>
  );
} 