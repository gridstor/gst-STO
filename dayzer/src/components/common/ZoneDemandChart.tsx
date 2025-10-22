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

    return availableZones.map((zone) => ({
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
      hovertemplate: '<b>%{fullData.name}</b><br>' +
                     '%{y:.2f} GW<br>' +
                     '<extra></extra>'
    }));
  }, [data, availableZones]);

  // Plotly layout configuration
  const layout: any = useMemo(() => ({
    height: 500,
    margin: { l: 70, r: 40, t: 40, b: 60 },
    xaxis: {
      title: { text: '' },
      tickformat: '%b %d',
      tickangle: -45,
      showgrid: true,
      gridcolor: '#E5E7EB',
      zeroline: false,
    },
    yaxis: {
      title: {
        text: 'Demand (GW)',
        font: {
          size: 12,
          color: '#4B5563',
          family: 'Inter, sans-serif'
        }
      },
      showgrid: true,
      gridcolor: '#E5E7EB',
      zeroline: false,
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: '#E5E7EB',
      font: {
        family: 'Inter, sans-serif',
        size: 12
      }
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
      font: {
        size: 11,
        family: 'Inter, sans-serif'
      }
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: {
      family: 'Inter, sans-serif',
      size: 11,
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
      <h3 className="text-lg font-semibold text-gs-gray-900 mb-6">Hourly Zone Demand</h3>

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