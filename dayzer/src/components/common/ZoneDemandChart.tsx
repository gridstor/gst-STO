import React, { useState, useEffect, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface ZoneDemandDataPoint {
  datetime: string;
  [zoneName: string]: string | number;
}

interface ZoneDemandResponse {
  scenarioid: number | null;
  data: ZoneDemandDataPoint[];
}

const ZoneDemandChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<ZoneDemandDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableZones, setAvailableZones] = useState<string[]>([]);
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
        const response = await fetch(`/api/zone-demand?scenarioid=${selectedScenario.scenarioid}`);
        const result: ZoneDemandResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          
          // Extract available zones from the data (excluding datetime)
          if (result.data.length > 0) {
            const zones = Object.keys(result.data[0]).filter(
              key => key !== 'datetime'
            );
            setAvailableZones(zones);
          }
          
          setError(null);
        } else {
          setError('Failed to fetch zone demand data');
        }
      } catch (err) {
        setError('Error loading zone demand data');
        console.error('Error fetching zone demand data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);

  // Color mapping for different zones (GridStor palette)
  const zoneColors: { [key: string]: string } = {
    'Pacific Gas & Electric': '#3B82F6',
    'San Diego Gas & Electric': '#EF4444', 
    'Southern CA Edison': '#10B981',
    'Valley Electric Association': '#F59E0B',
  };

  // Prepare Plotly data traces
  const plotlyData = useMemo(() => {
    if (data.length === 0 || availableZones.length === 0) return [];

    // Calculate totals for each time point
    const totals = data.map(d => {
      return availableZones.reduce((sum, zone) => sum + (Number(d[zone]) || 0), 0);
    });

    // Create traces for each zone
    const zoneTraces = availableZones.map((zone) => ({
      x: data.map(d => d.datetime),
      y: data.map(d => Number(d[zone]) || 0),
      name: zone,
      type: 'scatter' as const,
      mode: 'lines' as const,
      stackgroup: 'one',
      fillcolor: zoneColors[zone] || '#6B7280',
      line: {
        width: 0.5,
        color: zoneColors[zone] || '#6B7280'
      },
      hovertemplate: '<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>'
    }));

    // Add an invisible trace for total demand (shown only in tooltip)
    const totalTrace = {
      x: data.map(d => d.datetime),
      y: totals,
      name: 'Total Demand',
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: {
        width: 0,
        color: 'rgba(0,0,0,0)'
      },
      showlegend: false,
      hovertemplate: '<b>Total Demand</b><br>%{y:.2f} GW<br><extra></extra>'
    };

    return [...zoneTraces, totalTrace];
  }, [data, availableZones]);

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
        text: 'Demand (GW)',
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
      filename: 'zone_demand_chart',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  return (
    <div className="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6">
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
        <div className="text-gs-gray-500">No zone demand data available.</div>
      )}
    </div>
  );
};

export default ZoneDemandChart; 