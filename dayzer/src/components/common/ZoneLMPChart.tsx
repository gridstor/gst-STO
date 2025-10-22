import React, { useState, useEffect, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface LMPDataPoint {
  datetime: string;
  energy: number;
  congestion: number;
  losses: number;
  totalLMP: number;
}

interface Zone {
  id: number;
  name: string;
}

interface LMPResponse {
  scenarioid: number | null;
  data: LMPDataPoint[];
  zones: Zone[];
}

const ZoneLMPChart: React.FC = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<LMPDataPoint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [Plot, setPlot] = useState<any>(null);
  
  // Load Plotly only on client side
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);

  // First, fetch zones list
  useEffect(() => {
    const fetchZones = async () => {
      if (!selectedScenario) {
        return;
      }

      try {
        const response = await fetch(`/api/zone-lmp?scenarioid=${selectedScenario.scenarioid}`);
        const result: LMPResponse = await response.json();
        
        if (response.ok) {
          setZones(result.zones);
        } else {
          console.error('Failed to fetch zones');
        }
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };

    fetchZones();
  }, [selectedScenario]);

  // Auto-select Southern CA Edison as default zone
  useEffect(() => {
    if (zones.length > 0 && selectedZone === null) {
      const sceZone = zones.find(zone => zone.name === "Southern CA Edison");
      if (sceZone) {
        setSelectedZone(sceZone.id);
      }
    }
  }, [zones, selectedZone]);

  // Fetch data for selected zone
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario || !selectedZone) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/zone-lmp?scenarioid=${selectedScenario.scenarioid}&zoneid=${selectedZone}`);
        const result: LMPResponse = await response.json();
        
        if (response.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError('Failed to fetch LMP data');
        }
      } catch (err) {
        setError('Error loading LMP data');
        console.error('Error fetching LMP data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, selectedZone]);

  // Prepare Plotly data traces
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];

    const traces = [
      {
        x: data.map(d => d.datetime),
        y: data.map(d => d.energy),
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
        y: data.map(d => d.congestion),
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
        y: data.map(d => d.losses),
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
        y: data.map(d => d.totalLMP),
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

  // Plotly config for interactivity
  const config: any = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'] as any,
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'zone_lmp_chart',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  return (
    <div className="bg-white border-l-4 border-gs-green-500 rounded-lg shadow-gs-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gs-gray-900">Zone LMP Components</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="zone-select" className="text-sm font-medium text-gray-700">
            Select Zone:
          </label>
          <select
            id="zone-select"
            value={selectedZone || ''}
            onChange={(e) => setSelectedZone(e.target.value ? parseInt(e.target.value) : null)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Zone --</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-gs-gray-500">Loading chart data...</div>}
      {error && <div className="text-gs-red-500">Error: {error}</div>}
      
      {!Plot && !loading && !error && (
        <div className="text-gs-gray-500">Loading chart library...</div>
      )}
      
      {!loading && !error && selectedZone && data.length > 0 && Plot && (
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

      {!loading && !error && selectedZone && data.length === 0 && (
        <div className="text-gs-gray-500">No data available for the selected zone.</div>
      )}

      {!loading && !error && !selectedZone && (
        <div className="text-gs-gray-500">Please select a zone to view LMP data.</div>
      )}
    </div>
  );
};

export default ZoneLMPChart; 