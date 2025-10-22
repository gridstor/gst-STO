import React from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioInfo from './common/ScenarioInfo';
import MECOverviewWrapper from './common/MECOverviewWrapper';
import ZoneDemandChart from './common/ZoneDemandChart';
import NetLoadChart from './common/NetLoadChart';
import WeeklyLoadComparison from './common/WeeklyLoadComparison';
import WeekOverview from './common/WeekOverview';
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
            
            {/* Zone Demand Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Total Demand by Zone</h2>
                <p className="text-gs-gray-600">Hourly demand forecast across CAISO zones</p>
              </div>
              <ZoneDemandChart />
            </section>
            
            {/* Net Load Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Net Load Forecast</h2>
                <p className="text-gs-gray-600">System net load after renewable generation</p>
              </div>
              <NetLoadChart />
            </section>
            
            {/* Weekly Load Comparison and Week Overview */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Weekly Analysis</h2>
                <p className="text-gs-gray-600">Load comparison and fundamentals overview</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WeeklyLoadComparison />
                </div>
                <div className="lg:col-span-1">
                  <WeekOverview />
                </div>
              </div>
            </section>
            
            {/* Zone LMP Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Locational Marginal Pricing</h2>
                <p className="text-gs-gray-600">LMP forecast by zone</p>
              </div>
              <ZoneLMPChart />
            </section>
            
            {/* Supply Stack Chart */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Generation Mix</h2>
                <p className="text-gs-gray-600">Hourly generation by fuel type</p>
              </div>
              <SupplyStackChart />
            </section>
            
            {/* MEC Overview - Full Width at Bottom */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Marginal Energy Cost</h2>
                <p className="text-gs-gray-600">MEC trends for top and bottom hours</p>
              </div>
              <MECOverviewWrapper />
            </section>
            
          </div>
        </div>
      </div>
    </ScenarioProvider>
  );
} 