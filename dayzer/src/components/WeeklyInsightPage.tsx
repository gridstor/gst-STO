import React from 'react';
import { ScenarioProvider } from '../contexts/ScenarioContext';
import ScenarioDatePicker from './common/ScenarioDatePicker';
import CombinedLoadChart from './common/CombinedLoadChart';
import CombinedRenewablesChart from './common/CombinedRenewablesChart';
import CombinedLMPChart from './common/CombinedLMPChart';
import CombinedWeatherChart from './common/CombinedWeatherChart';

export default function WeeklyInsightPage() {
  return (
    <ScenarioProvider>
      <div className="py-12 space-y-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gs-gray-900 mb-2">Market Operations Outlook</h1>
            <p className="text-gs-gray-600">Weekly forecast analysis and historical comparisons</p>
          </div>
          
          {/* Scenario Date Picker Container */}
          <div className="mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
            <ScenarioDatePicker />
          </div>
          
          <div className="space-y-12">
            
            {/* Pricing Section */}
            <section id="pricing" className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Pricing</h2>
                <p className="text-gs-gray-600">Locational Marginal Pricing forecasts and historical component breakdown</p>
              </div>
              <CombinedLMPChart />
            </section>
            
            {/* Fundamentals Section */}
            <section id="fundamentals" className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Fundamentals</h2>
                <p className="text-gs-gray-600">CAISO Load, Net Load, and Renewable forecasts and historicals</p>
              </div>
              
              {/* Load Forecast */}
              <div className="mb-8">
                <CombinedLoadChart />
              </div>
              
              {/* Renewables Forecast */}
              <div>
                <CombinedRenewablesChart />
              </div>
            </section>
            
            {/* Weather Section */}
            <section id="weather" className="scroll-mt-24">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">Weather</h2>
                <p className="text-gs-gray-600">Los Angeles Temperature and Degree-Day forecasts and historicals</p>
              </div>
              <CombinedWeatherChart />
            </section>
            
          </div>
        </div>
      </div>
    </ScenarioProvider>
  );
}

