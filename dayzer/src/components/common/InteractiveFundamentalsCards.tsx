import React, { useState, useEffect, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface FundamentalsData {
  component: string;
  thisWeekAvg: number;
  lastWeekAvg: number;
  thisWeekMax: number;
  lastWeekMax: number;
  thisWeekMin: number;
  lastWeekMin: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'flat';
}

interface LoadDataPoint {
  datetime: string;
  dayName: string;
  thisWeekValue: number | null;
  lastWeekValue: number | null;
}

interface WeeklyLoadResponse {
  scenarioid: number | null;
  simulationDate: string;
  metric: string;
  data: LoadDataPoint[];
  metadata: {
    thisWeekRange: string;
    lastWeekRange: string;
    totalHours: number;
    thisWeekDataPoints: number;
    lastWeekDataPoints: number;
    secondaryDBStatus: string;
  };
}

type MetricType = 'totalDemand' | 'netLoad' | 'renewableGeneration' | null;

const metricMap: Record<string, MetricType> = {
  'Total Demand': 'totalDemand',
  'Net Load': 'netLoad',
  'Renewable Generation': 'renewableGeneration',
};

const metricLabels: Record<string, string> = {
  'totalDemand': 'Total Demand',
  'netLoad': 'Net Load',
  'renewableGeneration': 'Renewable Generation',
};

export default function InteractiveFundamentalsCards() {
  const { selectedScenario } = useScenario();
  const [cardsData, setCardsData] = useState<FundamentalsData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const [chartData, setChartData] = useState<LoadDataPoint[]>([]);
  const [chartMetadata, setChartMetadata] = useState<WeeklyLoadResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [Plot, setPlot] = useState<any>(null);
  
  // Load Plotly only on client side
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);

  // Inject animation styles on client side only
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const styleId = 'interactive-fundamentals-animations';
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

  // Fetch cards data
  useEffect(() => {
    const fetchCardsData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/week-overview?hours=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24');
        if (response.ok) {
          const result = await response.json();
          setCardsData(result.data || []);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching fundamentals overview:', err);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchCardsData();
  }, []);

  // Fetch chart data when a metric is selected
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedScenario || !selectedMetric) {
        return;
      }

      setChartLoading(true);
      try {
        const response = await fetch(`/api/weekly-load-comparison?scenarioid=${selectedScenario.scenarioid}&metric=${selectedMetric}`);
        const result: WeeklyLoadResponse = await response.json();
        
        if (response.ok) {
          setChartData(result.data);
          setChartMetadata(result.metadata);
        } else {
          console.error('Failed to fetch chart data');
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedScenario, selectedMetric]);

  const handleCardClick = (component: string) => {
    const metric = metricMap[component];
    if (metric === selectedMetric) {
      // Clicking the same card again - deselect
      setSelectedMetric(null);
    } else {
      // Select new metric
      setSelectedMetric(metric);
    }
  };

  // Prepare Plotly data traces
  const plotlyData = useMemo(() => {
    if (chartData.length === 0) return [];

    const traces = [
      {
        x: chartData.map(d => d.datetime),
        y: chartData.map(d => d.thisWeekValue),
        name: 'Forecast Week',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#000000',
          width: 2
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{x|%b %d, %Y at %I:%M %p}<br>%{y:.2f} GW<br><extra></extra>'
      },
      {
        x: chartData.map(d => d.datetime),
        y: chartData.map(d => d.lastWeekValue),
        name: 'Last Week',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#EF4444',
          width: 2,
          dash: 'dash'
        },
        customdata: chartData.map(d => {
          const date = new Date(d.datetime);
          const lastWeekDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
          return lastWeekDate.toISOString();
        }),
        connectgaps: false,
        hovertemplate: '<b>%{fullData.name}</b><br>%{customdata|%b %d, %Y at %I:%M %p}<br>%{y:.2f} GW<extra></extra>'
      }
    ];

    return traces;
  }, [chartData]);

  // Plotly layout configuration
  const layout: any = useMemo(() => {
    if (!selectedMetric) return {};
    
    // Calculate tick values - one per day (at midnight or first hour)
    const tickvals: string[] = [];
    const ticktext: string[] = [];
    
    if (chartData.length > 0) {
      const seenDates = new Set<string>();
      chartData.forEach(d => {
        const date = new Date(d.datetime);
        const dateKey = date.toDateString();
        
        if (!seenDates.has(dateKey)) {
          seenDates.add(dateKey);
          tickvals.push(d.datetime);
          // Get weekday abbreviation (Mon, Tue, Wed, etc.)
          ticktext.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
      });
    }
    
    return {
      autosize: true,
      margin: { l: 80, r: 40, t: 20, b: 60 },
      xaxis: {
        title: { text: '' },
        tickvals: tickvals,
        ticktext: ticktext,
        tickangle: 0,
        showgrid: true,
        gridcolor: '#E5E7EB',
        zeroline: false,
        showline: true,
        linecolor: '#6B7280',
        linewidth: 1,
        ticks: 'outside',
        ticklen: 5,
        tickwidth: 1,
        tickcolor: '#6B7280',
        tickfont: {
          size: 13,
          family: 'Inter, sans-serif',
          color: '#6B7280'
        },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikecolor: '#9CA3AF',
        spikedash: 'solid',
        hoverformat: ' '
      },
      yaxis: {
        title: {
          text: `${metricLabels[selectedMetric]} (GW)`,
          font: {
            size: 14,
            color: '#4B5563',
            family: 'Inter, sans-serif'
          }
        },
        showgrid: true,
        gridcolor: '#E5E7EB',
        zeroline: false,
        showline: true,
        linecolor: '#6B7280',
        linewidth: 1,
        ticks: 'outside',
        ticklen: 5,
        tickwidth: 1,
        tickcolor: '#6B7280',
        tickfont: {
          size: 13,
          family: 'Inter, sans-serif',
          color: '#6B7280'
        }
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: 'white',
        bordercolor: '#E5E7EB',
        font: {
          family: 'Inter, sans-serif',
          size: 13
        },
        namelength: -1
      },
      hoverdistance: 20,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'left',
        x: 0,
        font: {
          size: 13,
          family: 'Inter, sans-serif'
        }
      },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: 'Inter, sans-serif',
        size: 13,
        color: '#6B7280'
      }
    };
  }, [selectedMetric, chartData]);

  // Plotly config for interactivity
  const config: any = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'] as any,
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'weekly_comparison_chart',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-gs-green-600';
    if (trend === 'down') return 'text-gs-red-600';
    return 'text-gs-gray-600';
  };

  const getAccentColor = (component: string) => {
    if (component === 'Total Demand') return 'border-gs-gray-700';
    if (component === 'Net Load') return 'border-gs-purple-500';
    if (component === 'Renewable Generation') return 'border-gs-green-500';
    return 'border-gs-purple-500';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6">
        <div className="text-center text-gs-gray-500">Loading fundamentals overview...</div>
      </div>
    );
  }

  if (error || cardsData.length === 0) {
    return null;
  }

  // Get the selected card data
  const selectedCardData = selectedMetric 
    ? cardsData.find(item => metricMap[item.component] === selectedMetric)
    : null;

  return (
    <div className="space-y-6">
      {/* Layout changes based on selection */}
      {selectedMetric && selectedCardData ? (
        // Two-column layout: Selected card on left, chart on right
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
          {/* Selected Card - Takes 1 column */}
          <div className="lg:col-span-1">
            <div 
              onClick={() => handleCardClick(selectedCardData.component)}
              className={`bg-white border-l-4 ${getAccentColor(selectedCardData.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer ring-2 ring-blue-500 ring-offset-2 animate-slideInFromRight`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gs-gray-900">{selectedCardData.component}</h3>
                <span className="text-blue-600 text-sm font-medium">Selected</span>
              </div>
              
              {/* Trend Indicator */}
              <div className={`text-xl font-bold mb-6 font-mono ${getTrendColor(selectedCardData.trend)}`}>
                {getTrendIcon(selectedCardData.trend)} {Math.abs(selectedCardData.percentageChange).toFixed(1)}% {selectedCardData.trend === 'up' ? 'Higher' : selectedCardData.trend === 'down' ? 'Lower' : 'Flat'}
              </div>

              {/* Compact progression layout */}
              <div className="space-y-3">
                {/* Weekly Average */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Average
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.lastWeekAvg.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.thisWeekAvg.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg >= 0 ? '+' : ''}{(selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg).toFixed(1)} GW
                    </div>
                  </div>
                </div>

                {/* Weekly Maximum */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Maximum
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.lastWeekMax.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.thisWeekMax.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      selectedCardData.thisWeekMax - selectedCardData.lastWeekMax >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {selectedCardData.thisWeekMax - selectedCardData.lastWeekMax >= 0 ? '+' : ''}{(selectedCardData.thisWeekMax - selectedCardData.lastWeekMax).toFixed(1)} GW
                    </div>
                  </div>
                </div>

                {/* Weekly Minimum */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Minimum
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.lastWeekMin.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {selectedCardData.thisWeekMin.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      selectedCardData.thisWeekMin - selectedCardData.lastWeekMin >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {selectedCardData.thisWeekMin - selectedCardData.lastWeekMin >= 0 ? '+' : ''}{(selectedCardData.thisWeekMin - selectedCardData.lastWeekMin).toFixed(1)} GW
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2 flex">
            <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6 flex-1 flex flex-col transition-all duration-300 animate-slideInFromRight">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gs-gray-900">
                  Weekly Comparison: {metricLabels[selectedMetric]}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMetric(null);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Close Chart
                </button>
              </div>

              {chartLoading && <div className="text-gs-gray-500">Loading chart data...</div>}
              
              {!Plot && !chartLoading && (
                <div className="text-gs-gray-500">Loading chart library...</div>
              )}
              
              {!chartLoading && chartData.length > 0 && Plot && (
                <div className="flex-1" style={{ width: '100%', minHeight: '0' }}>
                  <Plot
                    data={plotlyData}
                    layout={layout}
                    config={config}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                  />
                </div>
              )}

              {!chartLoading && chartData.length === 0 && (
                <div className="text-gs-gray-500">No chart data available.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Three-column layout: All cards visible when nothing is selected
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
          {cardsData.map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleCardClick(item.component)}
              className={`bg-white border-l-4 ${getAccentColor(item.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer transform hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gs-gray-900">{item.component}</h3>
              </div>
              
              {/* Trend Indicator */}
              <div className={`text-xl font-bold mb-6 font-mono ${getTrendColor(item.trend)}`}>
                {getTrendIcon(item.trend)} {Math.abs(item.percentageChange).toFixed(1)}% {item.trend === 'up' ? 'Higher' : item.trend === 'down' ? 'Lower' : 'Flat'}
              </div>

              {/* Compact progression layout */}
              <div className="space-y-3">
                {/* Weekly Average */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Average
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.lastWeekAvg.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.thisWeekAvg.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      item.thisWeekAvg - item.lastWeekAvg >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {item.thisWeekAvg - item.lastWeekAvg >= 0 ? '+' : ''}{(item.thisWeekAvg - item.lastWeekAvg).toFixed(1)} GW
                    </div>
                  </div>
                </div>

                {/* Weekly Maximum */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Maximum
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.lastWeekMax.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.thisWeekMax.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      item.thisWeekMax - item.lastWeekMax >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {item.thisWeekMax - item.lastWeekMax >= 0 ? '+' : ''}{(item.thisWeekMax - item.lastWeekMax).toFixed(1)} GW
                    </div>
                  </div>
                </div>

                {/* Weekly Minimum */}
                <div className="bg-gs-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
                    Weekly Minimum
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.lastWeekMin.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className="text-gs-gray-400 text-lg">→</div>
                    <div className="text-2xl font-bold text-gs-gray-900 font-mono">
                      {item.thisWeekMin.toFixed(1)}
                    </div>
                    <div className="text-xs text-gs-gray-500">GW</div>
                    <div className={`text-xs font-medium font-mono ml-auto ${
                      item.thisWeekMin - item.lastWeekMin >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
                    }`}>
                      {item.thisWeekMin - item.lastWeekMin >= 0 ? '+' : ''}{(item.thisWeekMin - item.lastWeekMin).toFixed(1)} GW
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

