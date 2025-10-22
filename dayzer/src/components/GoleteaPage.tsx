import React from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioInfo from './common/ScenarioInfo';
import TB26Wrapper from './common/TB26Wrapper';
import WeeklyCongestionWrapper from './common/WeeklyCongestionWrapper';
import PricingChart from './common/PricingChart';
import CongestionChart from './common/CongestionChart';
import WeeklyLMPComparison from './common/WeeklyLMPComparison';
import PeakHoursHeatmap from './common/PeakHoursHeatmap';
import BottomHoursHeatmap from './common/BottomHoursHeatmap';
import ImpactfulConstraints from './common/ImpactfulConstraints';

export default function GoleteaPage() {
  return (
    <ScenarioProvider>
      <div className="py-12 space-y-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-gray-900">Goleta</h1>
            
            {/* Scenario Info Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <ScenarioInfo />
            </div>
            
            {/* TB2.6 Performance Overview */}
            <TB26Wrapper />
            
            {/* Charts with Side Sections */}
            <div className="space-y-8">
              {/* Row 1: LMP Breakdown + Weekly LMP Comparison */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <PricingChart />
                </div>
                <div className="col-span-1">
                  <WeeklyLMPComparison />
                </div>
              </div>
              
              {/* Peak Hours Frequency Heatmap - Full Width */}
              <div>
                <PeakHoursHeatmap />
              </div>
              
              {/* Bottom Hours Frequency Heatmap - Full Width */}
              <div>
                <BottomHoursHeatmap />
              </div>
              
              {/* Weekly Congestion - Full Width */}
              <div>
                <WeeklyCongestionWrapper />
              </div>
              
              {/* Row 2: Congestion Analysis + Side Section 2 */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <CongestionChart />
                </div>
                <div className="col-span-1">
                  <ImpactfulConstraints />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScenarioProvider>
  );
} 