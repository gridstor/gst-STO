import React, { useEffect, useState, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface LMPDataPoint {
  datetime: string;
  dayName: string;
  thisWeekLMP: number | null;
  lastWeekLMP: number | null;
}

interface WeeklyLMPResponse {
  scenarioid: number;
  simulationDate: string;
  data: LMPDataPoint[];
  metadata: {
    thisWeekRange: string;
    lastWeekRange?: string;
    comparisonRange?: string;
    totalHours: number;
    thisWeekDataPoints: number;
    lastWeekDataPoints?: number;
    comparisonDataPoints?: number;
    comparisonLabel?: string;
  };
}

type TimePeriod = 'thisWeek' | 'lastWeek' | 'lastYear' | null;

interface WeeklyLMPComparisonProps {
  selectedPeriod?: TimePeriod;
}

export default React.memo(function WeeklyLMPComparison({ selectedPeriod }: WeeklyLMPComparisonProps) {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<LMPDataPoint[]>([]);
  const [metadata, setMetadata] = useState<WeeklyLMPResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [Plot, setPlot] = useState<any>(null);

  // Load Plotly only on client side
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let response;
        
        // If Last Year is selected, use the tb26-lmp-comparison API
        if (selectedPeriod === 'lastYear') {
          response = await fetch(`/api/tb26-lmp-comparison?scenarioid=${selectedScenario.scenarioid}&period=lastYear`);
        } else {
          // For lastWeek and thisWeek, use the regular weekly-lmp-comparison API
          response = await fetch(`/api/weekly-lmp-comparison?scenarioid=${selectedScenario.scenarioid}`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch LMP comparison data');
        }
        const result: WeeklyLMPResponse = await response.json();
        setData(result.data);
        setMetadata(result.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, selectedPeriod]);

  // Plotly traces configuration
  const traces: any[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Prepare custom data with both datetimes
    const customdata = data.map(d => {
      const forecastDate = new Date(d.datetime);
      
      // Calculate comparison date based on selected period
      let comparisonDate;
      if (selectedPeriod === 'lastYear') {
        // Last year: same day/time one year ago
        comparisonDate = new Date(forecastDate);
        comparisonDate.setFullYear(comparisonDate.getFullYear() - 1);
      } else {
        // Last week: 7 days ago
        comparisonDate = new Date(forecastDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      return {
        forecastDatetime: forecastDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) + ' at ' + forecastDate.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        }),
        lastWeekDatetime: comparisonDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) + ' at ' + comparisonDate.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        })
      };
    });

    return [
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.thisWeekLMP),
        customdata: customdata.map(c => [c.forecastDatetime, c.lastWeekDatetime]),
        name: 'Forecast Week',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#000000',
          width: 2
        },
        connectgaps: false,
        hovertemplate: 
          '<b style="font-size: 13px;">Forecast Week</b><br>' +
          '<span style="color: #6B7280; font-size: 11px;">%{customdata[0]}</span><br>' +
          '<b style="font-size: 13px;">$%{y:.2f}/MWh</b>' +
          '<extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.lastWeekLMP),
        customdata: customdata.map(c => [c.forecastDatetime, c.lastWeekDatetime]),
        name: selectedPeriod === 'lastYear' ? 'Last Year' : 'Last Week',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#EF4444',
          width: 2,
          dash: 'dash'
        },
        connectgaps: false,
        hovertemplate: 
          '<br><b style="font-size: 13px;">' + (selectedPeriod === 'lastYear' ? 'Last Year' : 'Last Week') + '</b><br>' +
          '<span style="color: #6B7280; font-size: 11px;">%{customdata[1]}</span><br>' +
          '<b style="font-size: 13px;">$%{y:.2f}/MWh</b>' +
          '<extra></extra>'
      }
    ];
  }, [data, selectedPeriod]);

  // Plotly layout configuration
  const layout: any = useMemo(() => ({
    autosize: true,
    margin: { l: 60, r: 40, t: 50, b: 60 },
    xaxis: {
      title: { text: '' },
      tickformat: '%a',
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
        size: 11,
        family: 'Inter, sans-serif',
        color: '#6B7280'
      },
      showspikes: true,
      spikemode: 'across',
      spikethickness: 1,
      spikecolor: '#9CA3AF',
      spikedash: 'solid',
      hoverformat: ''
    },
    yaxis: {
      title: {
        text: '$/MWh',
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
        size: 12,
        color: '#1F2937'
      },
      namelength: -1,
      align: 'left'
    },
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
  }), []);

  // Plotly config
  const config: any = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'weekly_lmp_comparison',
      height: 600,
      width: 1200,
      scale: 2
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full h-full">
        <div className="text-gs-gray-500">Loading LMP comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full h-full">
        <div className="text-gs-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!Plot) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full h-full">
        <div className="text-gs-gray-500">Loading chart...</div>
      </div>
    );
  }

  // Get chart title based on selected period
  const getChartTitle = () => {
    if (selectedPeriod === 'lastYear') return 'LMP Comparison: This Week vs Last Year';
    return 'LMP Comparison: This Week vs Last Week';
  };

  // Get comparison label for the second line
  const getComparisonLabel = () => {
    if (selectedPeriod === 'lastYear') return 'Last Year';
    return 'Last Week';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex flex-col w-full h-full">
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-4">{getChartTitle()}</h3>
      
      <div className="flex-1 min-h-0 w-full">
        <Plot
          data={traces}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}); 
