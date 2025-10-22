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
          
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gs-gray-900 mb-2">Goleta</h1>
            <p className="text-gs-gray-600">Local market price analysis and congestion insights</p>
          </div>
          
          {/* Scenario Info Container */}
          <div className="mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm">
            <ScenarioInfo />
          </div>
          
          <div className="space-y-12">
            
            {/* TB2.6 Performance Overview */}
            <section id="tb26-analysis" className="mb-12 scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Goleta TB2.6 Performance Overview</h2>
                <p className="text-gs-gray-600">Based on 60MW/160MWh Battery with 86% Round-Trip Efficiency, Day-Ahead Pricing</p>
              </div>
              <TB26Wrapper />
            </section>
            
            {/* Charts with Side Sections */}
            <div className="space-y-12">
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