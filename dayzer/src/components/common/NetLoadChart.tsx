import React, { useState, useEffect, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface NetLoadDataPoint {
  datetime: string;
  totalDemand: number;
  renewableGeneration: number;
  netLoad: number;
  caisoNetLoad: number | null;
}

interface NetLoadResponse {
  scenarioid: number | null;
  data: NetLoadDataPoint[];
}

const NetLoadChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<NetLoadDataPoint[]>([]);
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
      try {
        const response = await fetch(`/api/net-load-with-caiso?scenarioid=${selectedScenario.scenarioid}`);
        const result: NetLoadResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError('Failed to fetch net load data');
        }
      } catch (err) {
        setError('Error loading net load data');
        console.error('Error fetching net load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);

  // Display names for metrics
  const displayNames: { [key: string]: string } = {
    totalDemand: 'Total Demand',
    renewableGeneration: 'Renewable Generation',
    netLoad: 'Net Load',
    caisoNetLoad: 'CAISO Net Load'
  };

  // Prepare Plotly data traces
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];

    const traces = [
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.totalDemand),
        name: 'Total Demand',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#3B82F6',
          width: 2
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.netLoad),
        name: 'Net Load',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#EF4444',
          width: 2
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.caisoNetLoad),
        name: 'CAISO Net Load',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#F59E0B',
          width: 2,
          dash: 'dash'
        },
        connectgaps: false,
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.renewableGeneration),
        name: 'Renewable Generation',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#10B981',
          width: 2
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>'
      }
    ];

    return traces;
  }, [data]);

  // Plotly layout configuration
  const layout: any = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 70 },
    xaxis: {
      title: { text: '' },
      tickformat: '%b %d',
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
      hoverformat: '<b style="font-size: 14px;">%b %d, %Y at %I:%M %p</b><br>'
    },
    yaxis: {
      title: {
        text: 'Load (GW)',
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

  // Plotly config for interactivity
  const config: any = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'] as any,
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'net_load_chart',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  return (
    <div className="bg-white border-l-4 border-gs-purple-500 rounded-lg shadow-gs-sm p-6">
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-6">Net Load</h3>

      {loading && <div className="text-gs-gray-500">Loading chart data...</div>}
      {error && <div className="text-gs-red-500">Error: {error}</div>}
      
      {!Plot && !loading && !error && (
        <div className="text-gs-gray-500">Loading chart library...</div>
      )}
      
      {!loading && !error && data.length > 0 && Plot && (
        <div style={{ width: '100%', height: '500px' }}>
          <Plot
            data={plotlyData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-gs-gray-500">No net load data available.</div>
      )}
    </div>
  );
};

export default NetLoadChart; 