import React, { useEffect, useState, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface LmpData {
  datetime: string;
  Energy: number;
  Congestion: number;
  Loss: number;
  LMP: number;
}

export default function PricingChart() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<LmpData[]>([]);
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
        const response = await fetch(`/api/lmp-components?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pricing data');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);

  // Plotly traces configuration
  const traces: any[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.Energy),
        name: 'Energy',
        type: 'scatter' as const,
        mode: 'lines' as const,
        stackgroup: 'one',
        fillcolor: '#3B82F6',
        line: {
          width: 0.5,
          color: '#3B82F6'
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.Congestion),
        name: 'Congestion',
        type: 'scatter' as const,
        mode: 'lines' as const,
        stackgroup: 'one',
        fillcolor: '#EF4444',
        line: {
          width: 0.5,
          color: '#EF4444'
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.Loss),
        name: 'Losses',
        type: 'scatter' as const,
        mode: 'lines' as const,
        stackgroup: 'one',
        fillcolor: '#F59E0B',
        line: {
          width: 0.5,
          color: '#F59E0B'
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      },
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.LMP),
        name: 'Total LMP',
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: {
          color: '#000000',
          width: 2
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      }
    ];
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
      hoverformat: '%b %d, %Y at %I:%M %p'
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

  // Plotly config
  const config: any = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'lmp_breakdown',
      height: 600,
      width: 1200,
      scale: 2
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center">
        <div className="text-gs-gray-500">Loading pricing data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center">
        <div className="text-gs-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!Plot) {
    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center">
        <div className="text-gs-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
}
