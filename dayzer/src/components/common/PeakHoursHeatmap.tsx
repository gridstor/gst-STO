import React, { useEffect, useState, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface PeakHoursData {
  forecastWeekFrequency: number[];  // HE1-24 frequency (0-7)
  lastWeekFrequency: number[];      // HE1-24 frequency (0-7)
  metadata: {
    forecastWeekRange: string;
    lastWeekRange: string;
  };
}

export default function PeakHoursHeatmap() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<PeakHoursData | null>(null);
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
        const response = await fetch(`/api/peak-hours-frequency?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch peak hours frequency data');
        }
        const result: PeakHoursData = await response.json();
        setData(result);
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
    if (!data) return [];

    const hourEndings = Array.from({ length: 24 }, (_, i) => i + 1);

    return [
      {
        x: hourEndings,
        y: data.forecastWeekFrequency,
        name: 'Forecast Week',
        type: 'bar' as const,
        marker: {
          color: '#3B82F6', // Blue
          line: {
            color: '#2563EB',
            width: 1
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>Hour: %{x}<br>Frequency: %{y} days<br><extra></extra>'
      },
      {
        x: hourEndings,
        y: data.lastWeekFrequency,
        name: 'Last Week',
        type: 'bar' as const,
        marker: {
          color: '#EF4444', // Red
          line: {
            color: '#DC2626',
            width: 1
          }
        },
        hovertemplate: '<b>%{fullData.name}</b><br>Hour: %{x}<br>Frequency: %{y} days<br><extra></extra>'
      }
    ];
  }, [data]);

  // Plotly layout configuration
  const layout: any = useMemo(() => ({
    height: 300,
    margin: { l: 60, r: 40, t: 20, b: 60 },
    xaxis: {
      title: {
        text: 'Hour Ending',
        font: {
          size: 14,
          color: '#4B5563',
          family: 'Inter, sans-serif'
        }
      },
      showgrid: false,
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
      }
    },
    yaxis: {
      title: {
        text: 'Frequency (Days)',
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
      },
      range: [0, 7],
      dtick: 1
    },
    barmode: 'group',
    bargap: 0.15,
    bargroupgap: 0.1,
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
      filename: 'peak_hours_frequency',
      height: 600,
      width: 1200,
      scale: 2
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-gs-gray-500">Loading peak hours...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-gs-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!Plot || !data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-gs-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500" style={{ height: '400px' }}>
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-4">Peak Hours Frequency</h3>
      <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
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
}
