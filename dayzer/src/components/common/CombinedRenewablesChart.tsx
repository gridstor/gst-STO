import React, { useState, useEffect, useMemo, memo } from 'react';

interface CombinedRenewablesDataPoint {
  datetime: string;
  // Last Week data
  dayzerWindLastWeek?: number;
  dayzerSolarLastWeek?: number;
  dayzerWindT1LastWeek?: number;
  dayzerSolarT1LastWeek?: number;
  caisoWindLastWeek?: number;
  caisoSolarLastWeek?: number;
  rtWindLastWeek?: number;
  rtSolarLastWeek?: number;
  // Forecast data
  dayzerWindForecast?: number;
  dayzerSolarForecast?: number;
  caisoWindForecast?: number;
  caisoSolarForecast?: number;
  isLastWeek: boolean;
}

const CombinedRenewablesChart = memo(function CombinedRenewablesChart() {
  const [data, setData] = useState<CombinedRenewablesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [Plot, setPlot] = useState<any>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [plotRevision, setPlotRevision] = useState(0);
  
  // Store current scenario IDs in component state
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState<string | null>(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState<string | null>(null);

  // Trigger plot resize when customization panel toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlotRevision(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [showCustomization]);
  
  // Color palette
  const colorOptions = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#f43f5e',
    '#a855f7', '#eab308', '#6b7280', '#1f2937'
  ];

  // Line style options for Plotly
  const styleOptions = [
    { value: 'solid', label: 'Solid' },
    { value: 'dash', label: 'Dashed' },
    { value: 'dot', label: 'Dotted' },
    { value: 'dashdot', label: 'Dash-Dot' },
  ];

  // Line customization state
  const [lineCustomization, setLineCustomization] = useState({
    dayzerWind: { color: '#EF4444', style: 'solid', visible: true },
    dayzerSolar: { color: '#F97316', style: 'solid', visible: true },
    dayzerWindT1: { color: '#B91C1C', style: 'dot', visible: false },
    dayzerSolarT1: { color: '#C2410C', style: 'dot', visible: false },
    caisoWind: { color: '#3B82F6', style: 'solid', visible: true },
    caisoSolar: { color: '#22C55E', style: 'solid', visible: true },
    rtWind: { color: '#8B5CF6', style: 'solid', visible: true },
    rtSolar: { color: '#EC4899', style: 'solid', visible: true },
  });

  // Load Plotly only on client side
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching renewables with scenarios:', { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });

      // Build API URLs with scenario parameters from state
      const forecastUrl = currentWeekScenarioId 
        ? `/api/renewables-forecast?scenarioId=${currentWeekScenarioId}`
        : '/api/renewables-forecast';
        
      const lastWeekUrl = lastWeekScenarioId 
        ? `/api/renewables-last-week-forecast?scenarioId=${lastWeekScenarioId}`
        : '/api/renewables-last-week-forecast';
      
      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`Renewables Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`Renewables Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();

      // Combine the data
      const combinedData: CombinedRenewablesDataPoint[] = [];

      // Add last week data
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            dayzerWindLastWeek: point.dayzerWind,
            dayzerSolarLastWeek: point.dayzerSolar,
            dayzerWindT1LastWeek: point.dayzerWindT1 || 0,
            dayzerSolarT1LastWeek: point.dayzerSolarT1 || 0,
            caisoWindLastWeek: point.caisoWind,
            caisoSolarLastWeek: point.caisoSolar,
            rtWindLastWeek: point.rtWind,
            rtSolarLastWeek: point.rtSolar,
          });
        });
      }

      // Add forecast data
      if (forecastData.data) {
        forecastData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            dayzerWindForecast: point.dayzerWind,
            dayzerSolarForecast: point.dayzerSolar,
            caisoWindForecast: point.caisoWind,
            caisoSolarForecast: point.caisoSolar,
          });
        });
      }

      // Sort by datetime
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

      setData(combinedData);

    } catch (err) {
      console.error('Combined renewables data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch combined renewables data');
    } finally {
      setLoading(false);
    }
  };

  // Listen for scenario changes
  useEffect(() => {
    const handleScenarioChange = (event: CustomEvent) => {
      console.log('Renewables chart received scenario change:', event.detail);
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
    };

    window.addEventListener('scenarioChanged', handleScenarioChange as EventListener);
    return () => window.removeEventListener('scenarioChanged', handleScenarioChange as EventListener);
  }, []);
  
  // Refetch when scenario IDs change
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);

  // Get boundary dates for grey shading
  const lastWeekEndDate = useMemo(() => {
    const lastWeekPoints = data.filter(d => d.isLastWeek);
    if (lastWeekPoints.length > 0) {
      return lastWeekPoints[lastWeekPoints.length - 1].datetime;
    }
    return null;
  }, [data]);

  const firstDate = useMemo(() => {
    if (data.length > 0) {
      return data[0].datetime;
    }
    return null;
  }, [data]);

  // Create Plotly traces - combine last week and forecast into continuous lines
  const traces: any[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const traces: any[] = [];
    const lastWeekData = data.filter(d => d.isLastWeek);

    // Dayzer Wind - Combined continuous line
    if (lineCustomization.dayzerWind.visible) {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => d.isLastWeek ? d.dayzerWindLastWeek : d.dayzerWindForecast),
        name: 'Dayzer Wind',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerWind.color,
          width: 2,
          dash: lineCustomization.dayzerWind.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // Dayzer Solar - Combined continuous line
    if (lineCustomization.dayzerSolar.visible) {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => d.isLastWeek ? d.dayzerSolarLastWeek : d.dayzerSolarForecast),
        name: 'Dayzer Solar',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerSolar.color,
          width: 2,
          dash: lineCustomization.dayzerSolar.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // CAISO Wind - Combined continuous line
    if (lineCustomization.caisoWind.visible) {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => d.isLastWeek ? d.caisoWindLastWeek : d.caisoWindForecast),
        name: 'CAISO Wind',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.caisoWind.color,
          width: 2,
          dash: lineCustomization.caisoWind.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // CAISO Solar - Combined continuous line
    if (lineCustomization.caisoSolar.visible) {
      traces.push({
        x: data.map(d => d.datetime),
        y: data.map(d => d.isLastWeek ? d.caisoSolarLastWeek : d.caisoSolarForecast),
        name: 'CAISO Solar',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.caisoSolar.color,
          width: 2,
          dash: lineCustomization.caisoSolar.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // Dayzer Wind t-1 (Last Week only)
    if (lineCustomization.dayzerWindT1.visible) {
      traces.push({
        x: lastWeekData.map(d => d.datetime),
        y: lastWeekData.map(d => d.dayzerWindT1LastWeek),
        name: 'Dayzer Wind t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerWindT1.color,
          width: 2,
          dash: lineCustomization.dayzerWindT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // Dayzer Solar t-1 (Last Week only)
    if (lineCustomization.dayzerSolarT1.visible) {
      traces.push({
        x: lastWeekData.map(d => d.datetime),
        y: lastWeekData.map(d => d.dayzerSolarT1LastWeek),
        name: 'Dayzer Solar t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerSolarT1.color,
          width: 2,
          dash: lineCustomization.dayzerSolarT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // RT Wind (Last Week only)
    if (lineCustomization.rtWind.visible) {
      traces.push({
        x: lastWeekData.map(d => d.datetime),
        y: lastWeekData.map(d => d.rtWindLastWeek),
        name: 'RT Wind',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.rtWind.color,
          width: 2,
          dash: lineCustomization.rtWind.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    // RT Solar (Last Week only)
    if (lineCustomization.rtSolar.visible) {
      traces.push({
        x: lastWeekData.map(d => d.datetime),
        y: lastWeekData.map(d => d.rtSolarLastWeek),
        name: 'RT Solar',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.rtSolar.color,
          width: 2,
          dash: lineCustomization.rtSolar.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>%{y:,.0f} MW<br><extra></extra>'
      });
    }

    return traces;
  }, [data, lineCustomization]);

  // Plotly layout configuration
  const layout: any = useMemo(() => {
    const layoutConfig: any = {
      height: 600,
      margin: { l: 80, r: 40, t: 40, b: 140 },
      title: {
        text: '',
        font: {
          size: 18,
          family: 'Inter, sans-serif',
          color: '#111827'
        }
      },
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
          size: 11,
          family: 'Inter, sans-serif',
          color: '#6B7280'
        },
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikecolor: '#9CA3AF',
        spikedash: 'solid',
        hoverformat: '%b %d, %Y at %I:%M %p',
        dtick: 86400000,
        tick0: data.length > 0 ? data[0].datetime : undefined
      },
      yaxis: {
        title: {
          text: 'Generation (MW)',
          font: {
            size: 14,
            color: '#4B5563',
            family: 'Inter, sans-serif'
          }
        },
        showgrid: true,
        gridcolor: '#E5E7EB',
        zeroline: true,
        zerolinecolor: '#9CA3AF',
        zerolinewidth: 1,
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
        yanchor: 'top',
        y: -0.25,
        xanchor: 'center',
        x: 0.5,
        font: {
          size: 14,
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

    // Add grey background shape for last week if we have the dates
    if (firstDate && lastWeekEndDate) {
      layoutConfig.shapes = [{
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: firstDate,
        x1: lastWeekEndDate,
        y0: 0,
        y1: 1,
        fillcolor: '#E5E7EB',
        opacity: 0.3,
        layer: 'below',
        line: {
          width: 0
        }
      }];
    }

    return layoutConfig;
  }, [data, firstDate, lastWeekEndDate]);

  // Plotly config with performance optimizations
  const config: any = useMemo(() => ({
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'renewables_forecast',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border border-gs-gray-200 h-96 flex items-center justify-center">
        <div className="text-gs-gray-500">Loading renewables data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border border-gs-gray-200 h-96 flex items-center justify-center">
        <div className="text-gs-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!Plot) {
  return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border border-gs-gray-200 h-96 flex items-center justify-center">
        <div className="text-gs-gray-500">Loading chart...</div>
      </div>
    );
  }

  // Toggle line visibility
  const toggleLine = (lineKey: keyof typeof lineCustomization) => {
    setLineCustomization(prev => ({
      ...prev,
      [lineKey]: { ...prev[lineKey], visible: !prev[lineKey].visible }
    }));
  };

  return (
    <div className="space-y-4">
      {/* Chart and Customization Panel Container */}
      <div className={`grid gap-4 ${showCustomization ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {/* Chart Container - Takes 2/3 when customization is shown */}
        <div className={`bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 ${showCustomization ? 'col-span-2' : ''}`} style={{ minHeight: '700px' }}>
          {/* Title and Customize Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gs-gray-900">Renewables Forecast</h3>
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center gap-2 px-4 py-2 bg-gs-blue-500 hover:bg-gs-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showCustomization ? 'Hide' : 'Show'} Customize Lines
            </button>
          </div>
          {Plot && (
            <div style={{ width: '100%', height: '600px' }}>
              <Plot
                key={`renewables-chart-${currentWeekScenarioId}-${lastWeekScenarioId}`}
                data={traces}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                revision={plotRevision}
              />
            </div>
          )}
        </div>

        {/* Customization Panel - Takes 1/3 on the right when shown */}
        {showCustomization && (
          <div className="bg-gs-gray-50 border border-gs-gray-200 rounded-lg p-4 overflow-y-auto" style={{ maxHeight: '700px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gs-gray-900">Line Settings</h3>
            <button
                onClick={() => {
                  const newCustomization = { ...lineCustomization };
                  Object.keys(newCustomization).forEach(key => {
                    newCustomization[key as keyof typeof lineCustomization].visible = false;
                  });
                  setLineCustomization(newCustomization);
                }}
                className="px-2 py-1 text-xs font-medium text-gs-red-600 hover:text-gs-red-800 border border-gs-red-300 hover:border-gs-red-400 rounded transition-colors"
              >
                Hide All
            </button>
          </div>
          
            <div className="space-y-2">
              {Object.entries(lineCustomization).map(([lineKey, customization]) => {
                let lineName = lineKey;
                
                // Clean up line names
              if (lineKey === 'dayzerWind') lineName = 'Dayzer Wind';
              if (lineKey === 'dayzerSolar') lineName = 'Dayzer Solar';
              if (lineKey === 'dayzerWindT1') lineName = 'Dayzer Wind t-1';
              if (lineKey === 'dayzerSolarT1') lineName = 'Dayzer Solar t-1';
              if (lineKey === 'caisoWind') lineName = 'CAISO Wind';
              if (lineKey === 'caisoSolar') lineName = 'CAISO Solar';
              if (lineKey === 'rtWind') lineName = 'RT Wind';
              if (lineKey === 'rtSolar') lineName = 'RT Solar';
              
              return (
                <div 
                  key={lineKey} 
                    className="rounded-md p-2 bg-white shadow-sm"
                  style={{
                      border: `2px solid ${customization.visible ? customization.color : '#d1d5db'}`,
                  }}
                >
                    {/* Checkbox and Variable Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={customization.visible}
                        onChange={() => toggleLine(lineKey as keyof typeof lineCustomization)}
                        className="w-4 h-4 text-gs-blue-600 bg-gs-gray-100 border-gs-gray-300 rounded focus:ring-gs-blue-500"
                      />
                      <span className="text-xs font-bold text-gs-gray-700">{lineName}</span>
                    </div>
                    
                    {/* Only show customization options if line is visible */}
                    {customization.visible && (
                      <>
                        {/* Style Selector */}
                      <select
                        value={customization.style}
                        onChange={(e) => setLineCustomization(prev => ({
                          ...prev,
                          [lineKey]: { ...prev[lineKey as keyof typeof prev], style: e.target.value }
                        }))}
                          className="text-xs border border-gs-gray-300 rounded px-2 py-1 w-full mb-2"
                      >
                        {styleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                        {/* Color Picker - Compact Grid */}
                        <div className="grid grid-cols-8 gap-1">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            onClick={() => setLineCustomization(prev => ({
                              ...prev,
                              [lineKey]: { ...prev[lineKey as keyof typeof prev], color }
                            }))}
                              className={`w-5 h-5 rounded border ${
                              customization.color === color 
                                  ? 'border-gs-gray-800 border-2' 
                                  : 'border-gs-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      </>
                    )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CombinedRenewablesChart;
