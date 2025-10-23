import React, { useEffect, useState, useMemo } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface CongestionData {
  datetime: string;
  'Total Congestion': number;
  Other: number;
  [constraintName: string]: string | number;
}

interface CongestionResponse {
  scenarioid: number;
  data: CongestionData[];
  metadata: {
    constraintNames: string[];
    constraintDetails: {
      [constraintName: string]: {
        [datetime: string]: {
          shiftFactor: number;
          shadowprice: number;
        };
      };
    };
  };
}

// Generate distinct colors for constraints
const generateColors = (count: number): string[] => {
  const distinctColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A',
    '#AB47BC', '#FF7043', '#26A69A', '#42A5F5', '#FFCA28',
    '#EF5350', '#29B6F6', '#9CCC65', '#EC407A', '#78909C',
    '#FDD835', '#8D6E63', '#D4E157', '#FF8A65', '#81C784',
  ];
  
  if (count <= distinctColors.length) {
    return distinctColors.slice(0, count);
  }
  
  const additionalColors = [];
  for (let i = distinctColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    const saturation = 70 + (i % 3) * 10;
    const lightness = 45 + (i % 4) * 10;
    additionalColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return [...distinctColors, ...additionalColors];
};

export default function CongestionChart() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState<CongestionData[]>([]);
  const [metadata, setMetadata] = useState<CongestionResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinnedData, setPinnedData] = useState<CongestionData | null>(null);
  const [hoveredData, setHoveredData] = useState<CongestionData | null>(null);
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
        const response = await fetch(`/api/congestion-plot?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch congestion data');
        }
        const result: CongestionResponse = await response.json();
        setData(result.data);
        setMetadata(result.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario]);

  // Function to shorten constraint names
  const shortenConstraintName = (name: string) => {
    if (name === 'Other' || name === 'Total Congestion') return name;
    
    const parts = name.split('_');
    if (parts.length > 2) {
      const shortened = `${parts[0]}_${parts[1]}...${parts[parts.length - 1]}`;
      return shortened.length > 25 ? shortened.substring(0, 25) + '...' : shortened;
    }
    return name.length > 25 ? name.substring(0, 25) + '...' : name;
  };

  // Get all constraint names
  const allConstraints = useMemo(() => {
    if (!metadata) return [];
    return [...(metadata.constraintNames || []), 'Other'];
  }, [metadata]);

  const colors = useMemo(() => generateColors(allConstraints.length), [allConstraints.length]);

  // Plotly traces configuration
  const traces: any[] = useMemo(() => {
    if (!data || data.length === 0 || allConstraints.length === 0) return [];

    const traces = [];

    // Add stacked areas for each constraint
    allConstraints.forEach((constraintName, index) => {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => Number(d[constraintName]) || 0),
        name: shortenConstraintName(constraintName),
        type: 'scatter' as const,
        mode: 'lines' as const,
        stackgroup: 'one',
        fillcolor: colors[index],
        line: {
          width: 0.5,
          color: colors[index]
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>',
        customdata: data.map(d => constraintName) // Store original constraint name
      });
    });

    // Add Total Congestion as a line overlay
    traces.push({
      x: data.map(d => d.datetime),
      y: data.map(d => d['Total Congestion']),
      name: 'Total Congestion',
      type: 'scatter' as const,
      mode: 'lines' as const,
      line: {
        color: '#000000',
        width: 2
      },
      hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
    });

    return traces;
  }, [data, allConstraints, colors]);

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
    showlegend: false,
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
      filename: 'congestion_analysis',
      height: 600,
      width: 1200,
      scale: 2
    }
  };

  // Prepare table data when hovering or pinned
  const getTableData = () => {
    const activeData = pinnedData || hoveredData;
    if (!activeData || !metadata) return [];
    
    const datetime = activeData.datetime;
    const tableRows = [];
    
    // Add constraints with their values
    for (const constraintName of allConstraints) {
      const value = Number(activeData[constraintName]) || 0;
      if (Math.abs(value) >= 0.01) {
        const details = metadata.constraintDetails[constraintName]?.[datetime];
        tableRows.push({
          name: constraintName,
          value: value,
          shiftFactor: details?.shiftFactor || null,
          shadowPrice: details?.shadowprice || null
        });
      }
    }
    
    // Sort by value (highest to lowest)
    tableRows.sort((a, b) => b.value - a.value);
    
    // Add Total Congestion at the end
    const totalCongestion = Number(activeData['Total Congestion']) || 0;
    if (totalCongestion !== 0) {
      tableRows.push({
        name: 'Total Congestion',
        value: totalCongestion,
        shiftFactor: null,
        shadowPrice: null
      });
    }
    
    return tableRows;
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })}`;
  };

  // Handle Plotly click event
  const handlePlotClick = (event: any) => {
    if (event.points && event.points.length > 0) {
      const pointIndex = event.points[0].pointIndex;
      const clickedData = data[pointIndex];
      
      if (pinnedData && pinnedData.datetime === clickedData.datetime) {
        setPinnedData(null);
      } else {
        setPinnedData(clickedData);
        setHoveredData(null);
      }
    }
  };

  // Handle Plotly hover event
  const handlePlotHover = (event: any) => {
    if (!pinnedData && event.points && event.points.length > 0) {
      const pointIndex = event.points[0].pointIndex;
      setHoveredData(data[pointIndex]);
    }
  };

  // Handle Plotly unhover event
  const handlePlotUnhover = () => {
    if (!pinnedData) {
      setHoveredData(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-gs-gray-500">Loading congestion data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-gs-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!metadata || allConstraints.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-gs-gray-500">No congestion data available</div>
      </div>
    );
  }

  if (!Plot) {
    return (
      <div className="w-full bg-white rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 p-6 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-gs-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex flex-col w-full h-full">
      <div className="flex-1 min-h-0">
        <Plot
          data={traces}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
          onClick={handlePlotClick}
          onHover={handlePlotHover}
          onUnhover={handlePlotUnhover}
        />
      </div>
      
      {/* Hover Details Table */}
      <div className="mt-6 border-t border-gs-gray-200 pt-6 flex-shrink-0" style={{ height: '320px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gs-gray-800">
            {pinnedData 
              ? `Constraint Details - ${formatTooltipLabel(pinnedData.datetime)} (Pinned)` 
              : hoveredData 
                ? `Constraint Details - ${formatTooltipLabel(hoveredData.datetime)}` 
                : 'Constraint Details'
            }
          </h3>
          {pinnedData && (
            <button 
              onClick={() => setPinnedData(null)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Unpin
            </button>
          )}
        </div>
        <div className="overflow-x-auto" style={{ height: 'calc(100% - 60px)' }}>
          <table className="min-w-full bg-gs-gray-50 border border-gs-gray-200 rounded-lg">
            <thead className="bg-gs-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gs-gray-700 border-b border-gs-gray-300">Constraint Name</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b border-gs-gray-300">Congestion ($/MWh)</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b border-gs-gray-300">Shift Factor</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b border-gs-gray-300">Shadow Price ($/MWh)</th>
              </tr>
            </thead>
            <tbody>
              {(pinnedData || hoveredData) ? (
                getTableData().map((row, index) => (
                  <tr key={index} className={`${row.name === 'Total Congestion' ? 'border-t-2 border-gs-gray-400 bg-blue-50' : 'hover:bg-gs-gray-100'}`}>
                    <td className="px-4 py-2 text-sm text-gs-gray-800 border-b border-gs-gray-200">
                      {row.name}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right border-b border-gs-gray-200 font-mono ${
                      row.value > 0 ? 'text-gs-green-600' : row.value < 0 ? 'text-gs-red-600' : 'text-gs-gray-800'
                    }`}>
                      {row.value >= 0 ? '+' : ''}${row.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gs-gray-600 text-right border-b border-gs-gray-200">
                      {row.shiftFactor !== null ? row.shiftFactor.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gs-gray-600 text-right border-b border-gs-gray-200">
                      {row.shadowPrice !== null ? `$${row.shadowPrice.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gs-gray-500 text-sm">
                    Hover over the chart to view constraint details, or click to pin data for a specific time period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
