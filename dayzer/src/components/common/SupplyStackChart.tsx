import React, { useState, useEffect, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface SupplyDataPoint {
  datetime: string;
  'Total Generation': number;
  [fuelType: string]: number | string;
}

interface SupplyResponse {
  scenarioid: number | null;
  data: SupplyDataPoint[];
}

const SupplyStackChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<SupplyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
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
        const response = await fetch(`/api/supply-stack?scenarioid=${selectedScenario.scenarioid}`);
        const result: SupplyResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          
          // Extract available fuel types from the data
          if (result.data.length > 0) {
            const fuels = Object.keys(result.data[0]).filter(
              key => key !== 'datetime' && key !== 'Total Generation'
            );
            setAvailableFuels(fuels);
          }
          
          setError(null);
        } else {
          setError('Failed to fetch supply stack data');
        }
      } catch (err) {
        setError('Error loading supply stack data');
        console.error('Error fetching supply stack data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);


  // Color mapping for different fuel types - distinct color palette
  const fuelColors: { [key: string]: string } = {
    'Solar': '#FCD34D',        // Light Yellow - bright renewable
    'Wind': '#34D399',         // Light Green - renewable energy
    'Hydro': '#60A5FA',        // Light Blue - water energy
    'Natural Gas': '#F97316',  // Orange - distinct from yellow/red
    'Fuel Oil': '#7C2D12',     // Dark Brown - earth tone fossil
    'Nuclear': '#8B5CF6',      // Purple - distinct tech color
    'Battery': '#EC4899',      // Pink - energy storage
    'Geothermal': '#047857',   // Dark Green - earth energy
    'Other': '#6B7280',        // Gray - neutral
  };

  // Prepare Plotly data traces
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];

    const traces: any[] = [];

    // Add stacked area traces for each fuel type
    availableFuels.forEach((fuel) => {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => Number(d[fuel]) || 0),
        name: fuel,
        type: 'scatter',
        mode: 'lines',
        stackgroup: 'one',
        fillcolor: fuelColors[fuel] || '#6B7280',
        line: {
          width: 0.5,
          color: fuelColors[fuel] || '#6B7280'
        },
        hovertemplate: '<b>%{fullData.name}</b><br><span style="line-height: 0.8;">%{y:.2f} GW</span><extra></extra>'
      });
    });

    // Add Total Generation line overlay (using original data)
    traces.push({
      x: data.map(d => d.datetime),
      y: data.map(d => Number(d['Total Generation']) || 0),
      name: 'Total Generation',
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#000000',
        width: 2
      },
      hovertemplate: '<b>%{fullData.name}</b><br><span style="line-height: 0.8;">%{y:.2f} GW</span><extra></extra>'
    });

    return traces;
  }, [data, availableFuels, fuelColors]);

  // Plotly layout configuration
  const layout: any = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 90 },
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
        text: 'Generation (GW)',
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
      namelength: -1,
      align: 'left'
    },
    hoverdistance: 20,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.15,
      xanchor: 'center',
      x: 0.5,
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
      filename: 'supply_stack_chart',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  return (
    <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-6">Hourly Supply Stack</h3>

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
        <div className="text-gs-gray-500">No supply stack data available.</div>
      )}
    </div>
  );
};

export default SupplyStackChart; 