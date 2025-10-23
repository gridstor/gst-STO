import React, { useState } from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioInfo from './common/ScenarioInfo';
import InteractiveTB26Cards from './common/InteractiveTB26Cards';
import ChargingRestrictionsTable from './common/ChargingRestrictionsTable';
import WeeklyCongestionWrapper from './common/WeeklyCongestionWrapper';
import PricingChart from './common/PricingChart';
import CongestionChart from './common/CongestionChart';
import WeeklyLMPComparison from './common/WeeklyLMPComparison';
import PeakHoursHeatmap from './common/PeakHoursHeatmap';
import BottomHoursHeatmap from './common/BottomHoursHeatmap';
import ImpactfulConstraints from './common/ImpactfulConstraints';

type TimePeriod = 'thisWeek' | 'lastWeek' | 'lastYear' | null;

export default function GoleteaPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(null);
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [showImpactfulConstraints, setShowImpactfulConstraints] = useState(false);

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
                <p className="text-gs-gray-600">{selectedPeriod ? 'Click on a card to view LMP comparison chart' : 'Based on 60MW/160MWh Battery with 86% Round-Trip Efficiency, Day-Ahead Pricing'}</p>
              </div>
              
              {/* Conditional Layout based on selection */}
              <div className={selectedPeriod ? "grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch" : ""}>
                {/* Cards Column */}
                <div className={selectedPeriod ? "lg:col-span-1 min-w-0 flex" : ""}>
                  <InteractiveTB26Cards 
                    onPeriodSelect={setSelectedPeriod}
                    selectedPeriod={selectedPeriod}
                    showRestrictions={showRestrictions}
                    setShowRestrictions={setShowRestrictions}
                  />
                </div>
                
                {/* Chart Column - Only shows when period is selected */}
                {selectedPeriod && (
                  <div className="lg:col-span-2 min-w-0 flex">
                    <WeeklyLMPComparison selectedPeriod={selectedPeriod} />
                  </div>
                )}
              </div>
            </section>
            
            {/* Charging Restrictions Table - Full Width Section */}
            {showRestrictions && (
              <section className="mb-12">
                <div className="bg-white rounded-lg shadow-gs-sm border border-gs-gray-200 p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gs-gray-900 mb-2">Charging Restrictions (MW)</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <ChargingRestrictionsTable />
                  </div>
                </div>
              </section>
            )}
            
            {/* Charts with Side Sections */}
            <div className="space-y-12">
              {/* LMP Breakdown - Full Width */}
              <section id="lmp-breakdown" className="scroll-mt-24">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">LMP Breakdown</h2>
                  <p className="text-gs-gray-600">Hourly price components and total LMP analysis</p>
                </div>
                <PricingChart />
              </section>
              
              {/* Peak and Bottom Hours Analysis - Side by Side */}
              <section id="hours-analysis" className="scroll-mt-24">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Peak & Bottom Hours Analysis</h2>
                  <p className="text-gs-gray-600">Frequency distribution comparing forecast week vs prior week</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <PeakHoursHeatmap />
                  </div>
                  <div>
                    <BottomHoursHeatmap />
                  </div>
                </div>
              </section>
              
              {/* Weekly Congestion - Full Width */}
              <section id="weekly-congestion" className="scroll-mt-24">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Weekly Congestion Analysis</h2>
                  <p className="text-gs-gray-600">Congestion patterns and price impact over time</p>
                </div>
                <WeeklyCongestionWrapper />
              </section>
              
              {/* Congestion Analysis */}
              <section id="congestion-breakdown" className="scroll-mt-24">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Congestion Breakdown</h2>
                    <p className="text-gs-gray-600">Detailed congestion cost analysis and impactful constraints</p>
                  </div>
                  <button
                    onClick={() => setShowImpactfulConstraints(!showImpactfulConstraints)}
                    className="px-4 py-2 bg-gs-blue-500 hover:bg-gs-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${showImpactfulConstraints ? 'rotate-90' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showImpactfulConstraints ? 'Hide' : 'Show'} Impactful Constraints
                  </button>
                </div>
                
                {/* Conditional Layout */}
                <div className={showImpactfulConstraints ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch" : ""}>
                  <div className={showImpactfulConstraints ? "flex" : ""}>
                    <CongestionChart />
                  </div>
                  
                  {showImpactfulConstraints && (
                    <div className="flex">
                      <ImpactfulConstraints />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
          
        </div>
      </div>
    </ScenarioProvider>
  );
} 