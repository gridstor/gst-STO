import React, { useState, useEffect, useMemo, memo } from 'react';

interface CombinedLMPDataPoint {
  datetime: string;
  // Last Week data
  energyLastWeek?: number;
  congestionLastWeek?: number;
  lossesLastWeek?: number;
  lmpLastWeek?: number;
  energyT1LastWeek?: number;
  congestionT1LastWeek?: number;
  lossesT1LastWeek?: number;
  lmpT1LastWeek?: number;
  // DA LMP components (last week only)
  daLMPLastWeek?: number;
  daCongestionLastWeek?: number;
  daEnergyLastWeek?: number;
  daLossLastWeek?: number;
  rtLMPLastWeek?: number;
  // Forecast data
  energyForecast?: number;
  congestionForecast?: number;
  lossesForecast?: number;
  lmpForecast?: number;
  isLastWeek: boolean;
}

const CombinedLMPChart = memo(function CombinedLMPChart() {
  const [data, setData] = useState<CombinedLMPDataPoint[]>([]);
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
    // Small delay to allow grid layout to adjust before triggering Plotly resize
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
    dayzerEnergy: { color: '#3B82F6', style: 'solid', visible: true },
    dayzerCongestion: { color: '#EF4444', style: 'solid', visible: true },
    dayzerLoss: { color: '#22C55E', style: 'solid', visible: true },
    dayzerLMP: { color: '#F59E0B', style: 'solid', visible: true },
    dayzerEnergyT1: { color: '#1D4ED8', style: 'dot', visible: false },
    dayzerCongestionT1: { color: '#B91C1C', style: 'dot', visible: false },
    dayzerLossT1: { color: '#15803D', style: 'dot', visible: false },
    dayzerLMPT1: { color: '#D97706', style: 'dot', visible: false },
    daEnergy: { color: '#06B6D4', style: 'dash', visible: false },
    daCongestion: { color: '#EC4899', style: 'dash', visible: false },
    daLoss: { color: '#84CC16', style: 'dash', visible: false },
    daLMP: { color: '#8B5CF6', style: 'dash', visible: false },
    rtLMP: { color: '#6B7280', style: 'solid', visible: true },
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
      console.log('Fetching LMP with scenarios:', { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });

      // Build API URLs with scenario parameters from state
      const forecastUrl = currentWeekScenarioId 
        ? `/api/lmp-forecast?scenarioId=${currentWeekScenarioId}`
        : '/api/lmp-forecast';
        
      const lastWeekUrl = lastWeekScenarioId 
        ? `/api/lmp-last-week-forecast?scenarioId=${lastWeekScenarioId}`
        : '/api/lmp-last-week-forecast';

      // Fetch both APIs in parallel
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);

      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`LMP Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }

      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`LMP Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }

      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();

      // Combine the data
      const combinedData: CombinedLMPDataPoint[] = [];

      // Add last week data
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            energyLastWeek: point.energy,
            congestionLastWeek: point.congestion,
            lossesLastWeek: point.losses,
            lmpLastWeek: point.lmp,
            energyT1LastWeek: point.energyT1 || 0,
            congestionT1LastWeek: point.congestionT1 || 0,
            lossesT1LastWeek: point.lossesT1 || 0,
            lmpT1LastWeek: point.lmpT1 || 0,
            daLMPLastWeek: point.daLMP,
            daCongestionLastWeek: point.daCongestion,
            daEnergyLastWeek: point.daEnergy,
            daLossLastWeek: point.daLoss,
            rtLMPLastWeek: point.rtLMP,
          });
        });
      }

      // Add forecast data
      if (forecastData.data) {
        forecastData.data.forEach((point: any) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            energyForecast: point.energy,
            congestionForecast: point.congestion,
            lossesForecast: point.losses,
            lmpForecast: point.lmp,
          });
        });
      }

      // Sort by datetime
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));

      setData(combinedData);

    } catch (err) {
      console.error('Combined LMP data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch combined LMP data');
    } finally {
      setLoading(false);
    }
  };

  // Listen for scenario changes
  useEffect(() => {
    const handleScenarioChange = (event: CustomEvent) => {
      console.log('LMP chart received scenario change:', event.detail);
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

  // Pre-process data for better performance
  const processedData = useMemo(() => {
    const lastWeekData = data.filter(d => d.isLastWeek);
    const allX = data.map(d => d.datetime);
    const lastWeekX = lastWeekData.map(d => d.datetime);
    
    return {
      allX,
      lastWeekX,
      lastWeekData,
      // Pre-compute combined arrays
      energyY: data.map(d => d.isLastWeek ? d.energyLastWeek : d.energyForecast),
      congestionY: data.map(d => d.isLastWeek ? d.congestionLastWeek : d.congestionForecast),
      lossY: data.map(d => d.isLastWeek ? d.lossesLastWeek : d.lossesForecast),
      lmpY: data.map(d => d.isLastWeek ? d.lmpLastWeek : d.lmpForecast),
    };
  }, [data]);

  // Create Plotly traces - combine last week and forecast into continuous lines
  const traces: any[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const traces: any[] = [];
    const { allX, lastWeekX, lastWeekData, energyY, congestionY, lossY, lmpY } = processedData;

    // Dayzer Energy - Combined continuous line
    if (lineCustomization.dayzerEnergy.visible) {
      traces.push({
        x: allX,
        y: energyY,
        name: 'Dayzer Energy',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerEnergy.color,
          width: 2,
          dash: lineCustomization.dayzerEnergy.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer Congestion - Combined continuous line
    if (lineCustomization.dayzerCongestion.visible) {
      traces.push({
        x: allX,
        y: congestionY,
        name: 'Dayzer Congestion',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerCongestion.color,
          width: 2,
          dash: lineCustomization.dayzerCongestion.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer Loss - Combined continuous line
    if (lineCustomization.dayzerLoss.visible) {
      traces.push({
        x: allX,
        y: lossY,
        name: 'Dayzer Loss',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerLoss.color,
          width: 2,
          dash: lineCustomization.dayzerLoss.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer LMP - Combined continuous line
    if (lineCustomization.dayzerLMP.visible) {
      traces.push({
        x: allX,
        y: lmpY,
        name: 'Dayzer LMP',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerLMP.color,
          width: 2,
          dash: lineCustomization.dayzerLMP.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer Energy t-1 (Last Week only)
    if (lineCustomization.dayzerEnergyT1.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.energyT1LastWeek),
        name: 'Dayzer Energy t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerEnergyT1.color,
          width: 2,
          dash: lineCustomization.dayzerEnergyT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer Congestion t-1 (Last Week only)
    if (lineCustomization.dayzerCongestionT1.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.congestionT1LastWeek),
        name: 'Dayzer Congestion t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerCongestionT1.color,
          width: 2,
          dash: lineCustomization.dayzerCongestionT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer Loss t-1 (Last Week only)
    if (lineCustomization.dayzerLossT1.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.lossesT1LastWeek),
        name: 'Dayzer Loss t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerLossT1.color,
          width: 2,
          dash: lineCustomization.dayzerLossT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // Dayzer LMP t-1 (Last Week only)
    if (lineCustomization.dayzerLMPT1.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.lmpT1LastWeek),
        name: 'Dayzer LMP t-1',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.dayzerLMPT1.color,
          width: 2,
          dash: lineCustomization.dayzerLMPT1.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // DA Energy (Last Week only)
    if (lineCustomization.daEnergy.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.daEnergyLastWeek),
        name: 'DA Energy',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.daEnergy.color,
          width: 2,
          dash: lineCustomization.daEnergy.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // DA Congestion (Last Week only)
    if (lineCustomization.daCongestion.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.daCongestionLastWeek),
        name: 'DA Congestion',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.daCongestion.color,
          width: 2,
          dash: lineCustomization.daCongestion.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // DA Loss (Last Week only)
    if (lineCustomization.daLoss.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.daLossLastWeek),
        name: 'DA Loss',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.daLoss.color,
          width: 2,
          dash: lineCustomization.daLoss.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // DA LMP (Last Week only)
    if (lineCustomization.daLMP.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.daLMPLastWeek),
        name: 'DA LMP',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.daLMP.color,
          width: 2,
          dash: lineCustomization.daLMP.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    // RT LMP (Last Week only)
    if (lineCustomization.rtLMP.visible) {
      traces.push({
        x: lastWeekX,
        y: lastWeekData.map(d => d.rtLMPLastWeek),
        name: 'RT LMP',
        type: 'scatter',
        mode: 'lines',
        line: {
          color: lineCustomization.rtLMP.color,
          width: 2,
          dash: lineCustomization.rtLMP.style
        },
        hovertemplate: '<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>'
      });
    }

    return traces;
  }, [processedData, lineCustomization]);

  // Plotly layout configuration - memoized separately from traces to prevent unnecessary re-renders
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
          text: '$/MWh',
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
      filename: 'lmp_forecast',
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-gs-sm border border-gs-gray-200 h-96 flex items-center justify-center">
        <div className="text-gs-gray-500">Loading LMP data...</div>
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
        <div className={`bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-green-500 ${showCustomization ? 'col-span-2' : ''}`} style={{ minHeight: '700px' }}>
          {/* Title and Customize Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gs-gray-900">LMP Forecast</h3>
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
                key={`lmp-chart-${currentWeekScenarioId}-${lastWeekScenarioId}`}
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
                if (lineKey === 'dayzerEnergy') lineName = 'Dayzer Energy';
                if (lineKey === 'dayzerCongestion') lineName = 'Dayzer Congestion';
                if (lineKey === 'dayzerLoss') lineName = 'Dayzer Loss';
                if (lineKey === 'dayzerLMP') lineName = 'Dayzer LMP';
                if (lineKey === 'dayzerEnergyT1') lineName = 'Dayzer Energy t-1';
                if (lineKey === 'dayzerCongestionT1') lineName = 'Dayzer Congestion t-1';
                if (lineKey === 'dayzerLossT1') lineName = 'Dayzer Loss t-1';
                if (lineKey === 'dayzerLMPT1') lineName = 'Dayzer LMP t-1';
                if (lineKey === 'daEnergy') lineName = 'DA Energy';
                if (lineKey === 'daCongestion') lineName = 'DA Congestion';
                if (lineKey === 'daLoss') lineName = 'DA Loss';
                if (lineKey === 'daLMP') lineName = 'DA LMP';
                if (lineKey === 'rtLMP') lineName = 'RT LMP';
                
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

export default CombinedLMPChart;
