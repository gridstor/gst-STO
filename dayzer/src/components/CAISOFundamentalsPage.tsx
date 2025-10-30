import React from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioInfo from './common/ScenarioInfo';
import MECOverviewWrapper from './common/MECOverviewWrapper';
import ZoneDemandChart from './common/ZoneDemandChart';
import NetLoadChart from './common/NetLoadChart';
import InteractiveFundamentalsCards from './common/InteractiveFundamentalsCards';
import ZoneLMPChart from './common/ZoneLMPChart';
import SupplyStackChart from './common/SupplyStackChart';

export default function CAISOFundamentalsPage() {
  return (
    <ScenarioProvider>
      <div className="py-12 space-y-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gs-gray-900 mb-2">CAISO System</h1>
            <p className="text-gs-gray-600">System-wide fundamentals forecast of load, net load, and generation</p>
          </div>
          
          {/* Scenario Info Container */}
          <div className="mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm">
            <ScenarioInfo />
          </div>
          
          <div className="space-y-12">
            
            {/* Weekly Analysis with Interactive Cards */}
            <section id="weekly-analysis" className="mb-12 scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Weekly Fundamentals Comparison</h2>
                <p className="text-gs-gray-600">Click on a card to view weekly comparison chart</p>
              </div>
              <InteractiveFundamentalsCards />
            </section>
            
            {/* Net Load Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Fundamentals Forecast</h2>
                <p className="text-gs-gray-600">System load, net load, and renewables generation forecast</p>
              </div>
              <NetLoadChart />
            </section>
            
            {/* Supply Stack Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Generation Mix</h2>
                <p className="text-gs-gray-600">Hourly generation by fuel type</p>
              </div>
              <SupplyStackChart />
            </section>
            
            {/* Zone Demand Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Total Demand by Zone</h2>
                <p className="text-gs-gray-600">Hourly demand forecast across CAISO zones</p>
              </div>
              <ZoneDemandChart />
            </section>
            
            {/* Zone LMP Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Locational Marginal Pricing</h2>
                <p className="text-gs-gray-600">LMP forecast by zone</p>
              </div>
              <ZoneLMPChart />
            </section>
            
            {/* MEC Overview - Full Width at Bottom */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Marginal Unit</h2>
                <p className="text-gs-gray-600">Marginal Unit for Top 2 and Bottom 2 Hours</p>
              </div>
              <MECOverviewWrapper />
            </section>
            
          </div>
        </div>
      </div>
    </ScenarioProvider>
  );
} 