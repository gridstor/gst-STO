import React, { useState, useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface TB26Data {
  thisWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  lastWeek: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  lastYear: {
    totalTB26: number;
    energyTB26: number;
    congestionTB26: number;
  };
  dateRanges?: {
    thisWeek: string;
    lastWeek: string;
    lastYear: string;
  };
}

type TimePeriod = 'thisWeek' | 'lastWeek' | 'lastYear' | null;

interface InteractiveTB26CardsProps {
  onPeriodSelect: (period: TimePeriod) => void;
  selectedPeriod: TimePeriod;
  showRestrictions: boolean;
  setShowRestrictions: (show: boolean) => void;
}

export default function InteractiveTB26Cards({ onPeriodSelect, selectedPeriod, showRestrictions, setShowRestrictions }: InteractiveTB26CardsProps) {
  const { selectedScenario } = useScenario();
  const [tb26Data, setTb26Data] = useState<TB26Data | null>(null);
  const [loading, setLoading] = useState(false);

  // Inject animation styles on client side only
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const styleId = 'interactive-tb26-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInFromRight {
          animation: slideInFromRight 0.4s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  // Fetch TB2.6 data when scenarioId changes
  useEffect(() => {
    if (selectedScenario === undefined || !selectedScenario) {
      return;
    }
    
    const fetchTB26 = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tb26-calculation?scenarioId=${selectedScenario.scenarioid}`);
        if (response.ok) {
          const data = await response.json();
          setTb26Data(data);
        }
      } catch (error) {
        console.error('Error fetching TB2.6 data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTB26();
  }, [selectedScenario]);

  const formatTB26Value = (value: number | undefined) => value?.toFixed(2) || 'X.XX';

  // Get current month info from TB2.6 data or fallback to today
  const currentMonthIndex = React.useMemo(() => {
    if (tb26Data?.dateRanges?.thisWeek) {
      const startDate = tb26Data.dateRanges.thisWeek.split(' to ')[0];
      const date = new Date(startDate);
      return date.getMonth();
    }
    return new Date().getMonth();
  }, [tb26Data]);

  const handleCardClick = (period: TimePeriod) => {
    if (selectedPeriod === period) {
      // Deselect if clicking the same card
      onPeriodSelect(null);
    } else {
      onPeriodSelect(period);
    }
  };

  const getCardBorder = (period: TimePeriod) => {
    if (period === 'lastYear') return 'border-gs-amber-500';
    if (period === 'lastWeek') return 'border-gs-red-500';
    if (period === 'thisWeek') return 'border-gs-blue-500';
    return 'border-gs-gray-300';
  };

  const getCardClasses = (period: TimePeriod) => {
    const isSelected = selectedPeriod === period;
    const baseClasses = `bg-white border-l-4 ${getCardBorder(period)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer`;
    
    if (isSelected) {
      return `${baseClasses} ring-2 ring-blue-500 ring-offset-2 animate-slideInFromRight`;
    }
    
    return `${baseClasses} transform hover:scale-[1.02]`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6">
        <div className="text-center text-gs-gray-500">Loading TB2.6 data...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex-1">
      <div className="mb-6">
        {/* Show Charging Restrictions Button */}
        <button
          onClick={() => setShowRestrictions(!showRestrictions)}
          className="px-4 py-2 bg-gs-gray-100 hover:bg-gs-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showRestrictions ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showRestrictions ? 'Hide' : 'Show'} Charging Restrictions
        </button>
      </div>
      
      {/* TB2.6 Cards */}
      <div className={selectedPeriod ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
        {/* Last Year Card */}
        {(!selectedPeriod || selectedPeriod === 'lastYear') && (
          <div 
            onClick={() => handleCardClick('lastYear')}
            className={getCardClasses('lastYear')}
          >
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">Last Year</h3>
              {selectedPeriod === 'lastYear' && (
                <span className="text-blue-600 text-sm font-medium">Selected</span>
              )}
            </div>
            {tb26Data?.dateRanges?.lastYear && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.lastYear}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.lastYear?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastYear?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastYear?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Last Week Card */}
        {(!selectedPeriod || selectedPeriod === 'lastWeek') && (
          <div 
            onClick={() => handleCardClick('lastWeek')}
            className={getCardClasses('lastWeek')}
          >
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">Last Week</h3>
              {selectedPeriod === 'lastWeek' && (
                <span className="text-blue-600 text-sm font-medium">Selected</span>
              )}
            </div>
            {tb26Data?.dateRanges?.lastWeek && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.lastWeek}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.lastWeek?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastWeek?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.lastWeek?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* This Week Card */}
        {(!selectedPeriod || selectedPeriod === 'thisWeek') && (
          <div 
            onClick={() => handleCardClick('thisWeek')}
            className={getCardClasses('thisWeek')}
          >
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gs-gray-900 mb-1">This Week</h3>
              {selectedPeriod === 'thisWeek' && (
                <span className="text-blue-600 text-sm font-medium">Selected</span>
              )}
            </div>
            {tb26Data?.dateRanges?.thisWeek && (
              <p className="text-xs text-gs-gray-500">{tb26Data.dateRanges.thisWeek}</p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold text-gs-gray-900 font-mono">${formatTB26Value(tb26Data?.thisWeek?.totalTB26)}</div>
            <div className="text-sm text-gs-gray-500">/kW-month</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Energy</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.thisWeek?.energyTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gs-gray-200">
              <span className="text-gs-gray-600 uppercase tracking-wide">Congestion</span>
              <div className="text-right">
                <span className="font-mono font-medium text-gs-gray-900">${formatTB26Value(tb26Data?.thisWeek?.congestionTB26)}</span>
                <div className="text-xs text-gs-gray-500">/kW-month</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

