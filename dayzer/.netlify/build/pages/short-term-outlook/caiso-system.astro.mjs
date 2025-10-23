/* empty css                                    */
import { f as createComponent, n as renderComponent, r as renderTemplate, q as renderScript } from '../../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_W-IpgH_B.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect, useMemo } from 'react';
import { u as useScenario, S as ScenarioProvider, a as ScenarioInfo } from '../../chunks/ScenarioInfo_D_RzoEer.mjs';
import { M as MECOverviewChart } from '../../chunks/MECOverviewChart_Ck8gcaeK.mjs';
export { renderers } from '../../renderers.mjs';

function MECOverviewWrapper() {
  const { selectedScenario } = useScenario();
  if (!selectedScenario) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading MEC data..." }) });
  }
  return /* @__PURE__ */ jsx("div", { id: "mec-overview", className: "scroll-mt-6", children: /* @__PURE__ */ jsx(MECOverviewChart, { scenarioId: selectedScenario.scenarioid }) });
}

const ZoneDemandChart = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableZones, setAvailableZones] = useState([]);
  const [Plot, setPlot] = useState(null);
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
        const result = await response.json();
        if (response.ok) {
          setData(result.data);
          if (result.data.length > 0) {
            const zones = Object.keys(result.data[0]).filter(
              (key) => key !== "datetime"
            );
            setAvailableZones(zones);
          }
          setError(null);
        } else {
          setError("Failed to fetch zone demand data");
        }
      } catch (err) {
        setError("Error loading zone demand data");
        console.error("Error fetching zone demand data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const zoneColors = {
    "Pacific Gas & Electric": "#3B82F6",
    "San Diego Gas & Electric": "#EF4444",
    "Southern CA Edison": "#10B981",
    "Valley Electric Association": "#F59E0B"
  };
  const plotlyData = useMemo(() => {
    if (data.length === 0 || availableZones.length === 0) return [];
    const totals = data.map((d) => {
      return availableZones.reduce((sum, zone) => sum + (Number(d[zone]) || 0), 0);
    });
    const zoneTraces = availableZones.map((zone) => ({
      x: data.map((d) => d.datetime),
      y: data.map((d) => Number(d[zone]) || 0),
      name: zone,
      type: "scatter",
      mode: "lines",
      stackgroup: "one",
      fillcolor: zoneColors[zone] || "#6B7280",
      line: {
        width: 0.5,
        color: zoneColors[zone] || "#6B7280"
      },
      hovertemplate: "<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>"
    }));
    const totalTrace = {
      x: data.map((d) => d.datetime),
      y: totals,
      name: "Total Demand",
      type: "scatter",
      mode: "lines",
      line: {
        width: 0,
        color: "rgba(0,0,0,0)"
      },
      showlegend: false,
      hovertemplate: "<b>Total Demand</b><br>%{y:.2f} GW<br><extra></extra>"
    };
    return [...zoneTraces, totalTrace];
  }, [data, availableZones]);
  const layout = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 70 },
    xaxis: {
      title: { text: "" },
      tickformat: "%b %d",
      tickangle: 0,
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "#9CA3AF",
      spikedash: "solid",
      hoverformat: '<b style="font-size: 14px;">%b %d, %Y at %I:%M %p</b><br>'
    },
    yaxis: {
      title: {
        text: "Demand (GW)",
        font: {
          size: 14,
          color: "#4B5563",
          family: "Inter, sans-serif"
        }
      },
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      }
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "white",
      bordercolor: "#E5E7EB",
      font: {
        family: "Inter, sans-serif",
        size: 13
      },
      namelength: -1
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: {
        size: 13,
        family: "Inter, sans-serif"
      }
    },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
    font: {
      family: "Inter, sans-serif",
      size: 13,
      color: "#6B7280"
    }
  }), []);
  const config = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: "zone_demand_chart",
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-6", children: "Hourly Zone Demand" }),
    loading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart data..." }),
    error && /* @__PURE__ */ jsxs("div", { className: "text-gs-red-500", children: [
      "Error: ",
      error
    ] }),
    !Plot && !loading && !error && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart library..." }),
    !loading && !error && data.length > 0 && Plot && /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "500px" }, children: /* @__PURE__ */ jsx(
      Plot,
      {
        data: plotlyData,
        layout,
        config,
        style: { width: "100%", height: "100%" },
        useResizeHandler: true
      }
    ) }),
    !loading && !error && data.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "No zone demand data available." })
  ] });
};

const NetLoadChart = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Plot, setPlot] = useState(null);
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
        const result = await response.json();
        if (response.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError("Failed to fetch net load data");
        }
      } catch (err) {
        setError("Error loading net load data");
        console.error("Error fetching net load data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];
    const traces = [
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.totalDemand),
        name: "Total Demand",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#3B82F6",
          width: 2
        },
        hovertemplate: "<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.netLoad),
        name: "Net Load",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#EF4444",
          width: 2
        },
        hovertemplate: "<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.caisoNetLoad),
        name: "CAISO Net Load",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#F59E0B",
          width: 2,
          dash: "dash"
        },
        connectgaps: false,
        hovertemplate: "<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.renewableGeneration),
        name: "Renewable Generation",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#10B981",
          width: 2
        },
        hovertemplate: "<b>%{fullData.name}</b><br>%{y:.2f} GW<br><extra></extra>"
      }
    ];
    return traces;
  }, [data]);
  const layout = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 70 },
    xaxis: {
      title: { text: "" },
      tickformat: "%b %d",
      tickangle: 0,
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "#9CA3AF",
      spikedash: "solid",
      hoverformat: '<b style="font-size: 14px;">%b %d, %Y at %I:%M %p</b><br>'
    },
    yaxis: {
      title: {
        text: "Load (GW)",
        font: {
          size: 14,
          color: "#4B5563",
          family: "Inter, sans-serif"
        }
      },
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      }
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "white",
      bordercolor: "#E5E7EB",
      font: {
        family: "Inter, sans-serif",
        size: 13
      },
      namelength: -1
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: {
        size: 13,
        family: "Inter, sans-serif"
      }
    },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
    font: {
      family: "Inter, sans-serif",
      size: 13,
      color: "#6B7280"
    }
  }), []);
  const config = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: "net_load_chart",
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-purple-500 rounded-lg shadow-gs-sm p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-6", children: "Net Load" }),
    loading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart data..." }),
    error && /* @__PURE__ */ jsxs("div", { className: "text-gs-red-500", children: [
      "Error: ",
      error
    ] }),
    !Plot && !loading && !error && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart library..." }),
    !loading && !error && data.length > 0 && Plot && /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "500px" }, children: /* @__PURE__ */ jsx(
      Plot,
      {
        data: plotlyData,
        layout,
        config,
        style: { width: "100%", height: "100%" },
        useResizeHandler: true
      }
    ) }),
    !loading && !error && data.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "No net load data available." })
  ] });
};

const metricMap = {
  "Total Demand": "totalDemand",
  "Net Load": "netLoad",
  "Renewable Generation": "renewableGeneration"
};
const metricLabels = {
  "totalDemand": "Total Demand",
  "netLoad": "Net Load",
  "renewableGeneration": "Renewable Generation"
};
function InteractiveFundamentalsCards() {
  const { selectedScenario } = useScenario();
  const [cardsData, setCardsData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartMetadata, setChartMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [Plot, setPlot] = useState(null);
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "interactive-fundamentals-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInFromRight {
          animation: slideInFromRight 0.4s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  useEffect(() => {
    const fetchCardsData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/week-overview?hours=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24");
        if (response.ok) {
          const result = await response.json();
          setCardsData(result.data || []);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching fundamentals overview:", err);
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchCardsData();
  }, []);
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedScenario || !selectedMetric) {
        return;
      }
      setChartLoading(true);
      try {
        const response = await fetch(`/api/weekly-load-comparison?scenarioid=${selectedScenario.scenarioid}&metric=${selectedMetric}`);
        const result = await response.json();
        if (response.ok) {
          setChartData(result.data);
          setChartMetadata(result.metadata);
        } else {
          console.error("Failed to fetch chart data");
        }
      } catch (err) {
        console.error("Error loading chart data:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, [selectedScenario, selectedMetric]);
  const handleCardClick = (component) => {
    const metric = metricMap[component];
    if (metric === selectedMetric) {
      setSelectedMetric(null);
    } else {
      setSelectedMetric(metric);
    }
  };
  const plotlyData = useMemo(() => {
    if (chartData.length === 0) return [];
    const traces = [
      {
        x: chartData.map((d) => d.datetime),
        y: chartData.map((d) => d.thisWeekValue),
        name: "Forecast Week",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#000000",
          width: 2
        },
        hovertemplate: "<b>%{fullData.name}</b><br>%{x|%b %d, %Y at %I:%M %p}<br>%{y:.2f} GW<br><extra></extra>"
      },
      {
        x: chartData.map((d) => d.datetime),
        y: chartData.map((d) => d.lastWeekValue),
        name: "Last Week",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#EF4444",
          width: 2,
          dash: "dash"
        },
        customdata: chartData.map((d) => {
          const date = new Date(d.datetime);
          const lastWeekDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1e3);
          return lastWeekDate.toISOString();
        }),
        connectgaps: false,
        hovertemplate: "<b>%{fullData.name}</b><br>%{customdata|%b %d, %Y at %I:%M %p}<br>%{y:.2f} GW<extra></extra>"
      }
    ];
    return traces;
  }, [chartData]);
  const layout = useMemo(() => {
    if (!selectedMetric) return {};
    const tickvals = [];
    const ticktext = [];
    if (chartData.length > 0) {
      const seenDates = /* @__PURE__ */ new Set();
      chartData.forEach((d) => {
        const date = new Date(d.datetime);
        const dateKey = date.toDateString();
        if (!seenDates.has(dateKey)) {
          seenDates.add(dateKey);
          tickvals.push(d.datetime);
          ticktext.push(date.toLocaleDateString("en-US", { weekday: "short" }));
        }
      });
    }
    return {
      autosize: true,
      margin: { l: 80, r: 40, t: 20, b: 60 },
      xaxis: {
        title: { text: "" },
        tickvals,
        ticktext,
        tickangle: 0,
        showgrid: true,
        gridcolor: "#E5E7EB",
        zeroline: false,
        showline: true,
        linecolor: "#6B7280",
        linewidth: 1,
        ticks: "outside",
        ticklen: 5,
        tickwidth: 1,
        tickcolor: "#6B7280",
        tickfont: {
          size: 13,
          family: "Inter, sans-serif",
          color: "#6B7280"
        },
        showspikes: true,
        spikemode: "across",
        spikethickness: 1,
        spikecolor: "#9CA3AF",
        spikedash: "solid",
        hoverformat: " "
      },
      yaxis: {
        title: {
          text: `${metricLabels[selectedMetric]} (GW)`,
          font: {
            size: 14,
            color: "#4B5563",
            family: "Inter, sans-serif"
          }
        },
        showgrid: true,
        gridcolor: "#E5E7EB",
        zeroline: false,
        showline: true,
        linecolor: "#6B7280",
        linewidth: 1,
        ticks: "outside",
        ticklen: 5,
        tickwidth: 1,
        tickcolor: "#6B7280",
        tickfont: {
          size: 13,
          family: "Inter, sans-serif",
          color: "#6B7280"
        }
      },
      hovermode: "x unified",
      hoverlabel: {
        bgcolor: "white",
        bordercolor: "#E5E7EB",
        font: {
          family: "Inter, sans-serif",
          size: 13
        },
        namelength: -1
      },
      hoverdistance: 20,
      legend: {
        orientation: "h",
        yanchor: "bottom",
        y: 1.02,
        xanchor: "left",
        x: 0,
        font: {
          size: 13,
          family: "Inter, sans-serif"
        }
      },
      plot_bgcolor: "white",
      paper_bgcolor: "white",
      font: {
        family: "Inter, sans-serif",
        size: 13,
        color: "#6B7280"
      }
    };
  }, [selectedMetric, chartData]);
  const config = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: "weekly_comparison_chart",
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);
  const getTrendIcon = (trend) => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };
  const getTrendColor = (trend) => {
    if (trend === "up") return "text-gs-green-600";
    if (trend === "down") return "text-gs-red-600";
    return "text-gs-gray-600";
  };
  const getAccentColor = (component) => {
    if (component === "Total Demand") return "border-gs-gray-700";
    if (component === "Net Load") return "border-gs-purple-500";
    if (component === "Renewable Generation") return "border-gs-green-500";
    return "border-gs-purple-500";
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "text-center text-gs-gray-500", children: "Loading fundamentals overview..." }) });
  }
  if (error || cardsData.length === 0) {
    return null;
  }
  const selectedCardData = selectedMetric ? cardsData.find((item) => metricMap[item.component] === selectedMetric) : null;
  return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: selectedMetric && selectedCardData ? (
    // Two-column layout: Selected card on left, chart on right
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleCardClick(selectedCardData.component),
          className: `bg-white border-l-4 ${getAccentColor(selectedCardData.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer ring-2 ring-blue-500 ring-offset-2 animate-slideInFromRight`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900", children: selectedCardData.component }),
              /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-sm font-medium", children: "Selected" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `text-xl font-bold mb-6 font-mono ${getTrendColor(selectedCardData.trend)}`, children: [
              getTrendIcon(selectedCardData.trend),
              " ",
              Math.abs(selectedCardData.percentageChange).toFixed(1),
              "% ",
              selectedCardData.trend === "up" ? "Higher" : selectedCardData.trend === "down" ? "Lower" : "Flat"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Average" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.lastWeekAvg.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.thisWeekAvg.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                    selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg >= 0 ? "+" : "",
                    (selectedCardData.thisWeekAvg - selectedCardData.lastWeekAvg).toFixed(1),
                    " GW"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Maximum" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.lastWeekMax.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.thisWeekMax.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${selectedCardData.thisWeekMax - selectedCardData.lastWeekMax >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                    selectedCardData.thisWeekMax - selectedCardData.lastWeekMax >= 0 ? "+" : "",
                    (selectedCardData.thisWeekMax - selectedCardData.lastWeekMax).toFixed(1),
                    " GW"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Minimum" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.lastWeekMin.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: selectedCardData.thisWeekMin.toFixed(1) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                  /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${selectedCardData.thisWeekMin - selectedCardData.lastWeekMin >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                    selectedCardData.thisWeekMin - selectedCardData.lastWeekMin >= 0 ? "+" : "",
                    (selectedCardData.thisWeekMin - selectedCardData.lastWeekMin).toFixed(1),
                    " GW"
                  ] })
                ] })
              ] })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 flex", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6 flex-1 flex flex-col transition-all duration-300 animate-slideInFromRight", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gs-gray-900", children: [
            "Weekly Comparison: ",
            metricLabels[selectedMetric]
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setSelectedMetric(null);
              },
              className: "px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors",
              children: "Close Chart"
            }
          )
        ] }),
        chartLoading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart data..." }),
        !Plot && !chartLoading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart library..." }),
        !chartLoading && chartData.length > 0 && Plot && /* @__PURE__ */ jsx("div", { className: "flex-1", style: { width: "100%", minHeight: "0" }, children: /* @__PURE__ */ jsx(
          Plot,
          {
            data: plotlyData,
            layout,
            config,
            style: { width: "100%", height: "100%" },
            useResizeHandler: true
          }
        ) }),
        !chartLoading && chartData.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "No chart data available." })
      ] }) })
    ] })
  ) : (
    // Three-column layout: All cards visible when nothing is selected
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ease-in-out", children: cardsData.map((item, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => handleCardClick(item.component),
        className: `bg-white border-l-4 ${getAccentColor(item.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer transform hover:scale-[1.02]`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900", children: item.component }) }),
          /* @__PURE__ */ jsxs("div", { className: `text-xl font-bold mb-6 font-mono ${getTrendColor(item.trend)}`, children: [
            getTrendIcon(item.trend),
            " ",
            Math.abs(item.percentageChange).toFixed(1),
            "% ",
            item.trend === "up" ? "Higher" : item.trend === "down" ? "Lower" : "Flat"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Average" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.lastWeekAvg.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.thisWeekAvg.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${item.thisWeekAvg - item.lastWeekAvg >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                  item.thisWeekAvg - item.lastWeekAvg >= 0 ? "+" : "",
                  (item.thisWeekAvg - item.lastWeekAvg).toFixed(1),
                  " GW"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Maximum" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.lastWeekMax.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.thisWeekMax.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${item.thisWeekMax - item.lastWeekMax >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                  item.thisWeekMax - item.lastWeekMax >= 0 ? "+" : "",
                  (item.thisWeekMax - item.lastWeekMax).toFixed(1),
                  " GW"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gs-gray-50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium", children: "Weekly Minimum" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.lastWeekMin.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsx("div", { className: "text-gs-gray-400 text-lg", children: "→" }),
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gs-gray-900 font-mono", children: item.thisWeekMin.toFixed(1) }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "GW" }),
                /* @__PURE__ */ jsxs("div", { className: `text-xs font-medium font-mono ml-auto ${item.thisWeekMin - item.lastWeekMin >= 0 ? "text-gs-green-600" : "text-gs-red-600"}`, children: [
                  item.thisWeekMin - item.lastWeekMin >= 0 ? "+" : "",
                  (item.thisWeekMin - item.lastWeekMin).toFixed(1),
                  " GW"
                ] })
              ] })
            ] })
          ] })
        ]
      },
      index
    )) })
  ) });
}

const ZoneLMPChart = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Plot, setPlot] = useState(null);
  useEffect(() => {
    import('react-plotly.js').then((module) => {
      setPlot(() => module.default);
    });
  }, []);
  useEffect(() => {
    const fetchZones = async () => {
      if (!selectedScenario) {
        return;
      }
      try {
        const response = await fetch(`/api/zone-lmp?scenarioid=${selectedScenario.scenarioid}`);
        const result = await response.json();
        if (response.ok) {
          setZones(result.zones);
        } else {
          console.error("Failed to fetch zones");
        }
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };
    fetchZones();
  }, [selectedScenario]);
  useEffect(() => {
    if (zones.length > 0 && selectedZone === null) {
      const sceZone = zones.find((zone) => zone.name === "Southern CA Edison");
      if (sceZone) {
        setSelectedZone(sceZone.id);
      }
    }
  }, [zones, selectedZone]);
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
        const result = await response.json();
        if (response.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError("Failed to fetch LMP data");
        }
      } catch (err) {
        setError("Error loading LMP data");
        console.error("Error fetching LMP data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario, selectedZone]);
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];
    const traces = [
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.energy),
        name: "Energy",
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        fillcolor: "#3B82F6",
        line: {
          width: 0.5,
          color: "#3B82F6"
        },
        hovertemplate: "<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.congestion),
        name: "Congestion",
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        fillcolor: "#EF4444",
        line: {
          width: 0.5,
          color: "#EF4444"
        },
        hovertemplate: "<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.losses),
        name: "Losses",
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        fillcolor: "#F59E0B",
        line: {
          width: 0.5,
          color: "#F59E0B"
        },
        hovertemplate: "<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>"
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.totalLMP),
        name: "Total LMP",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#000000",
          width: 2
        },
        hovertemplate: "<b>%{fullData.name}</b><br>$%{y:.2f}/MWh<br><extra></extra>"
      }
    ];
    return traces;
  }, [data]);
  const layout = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 70 },
    xaxis: {
      title: { text: "" },
      tickformat: "%b %d",
      tickangle: 0,
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "#9CA3AF",
      spikedash: "solid",
      hoverformat: '<b style="font-size: 14px;">%b %d, %Y at %I:%M %p</b><br>'
    },
    yaxis: {
      title: {
        text: "$/MWh",
        font: {
          size: 14,
          color: "#4B5563",
          family: "Inter, sans-serif"
        }
      },
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      }
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "white",
      bordercolor: "#E5E7EB",
      font: {
        family: "Inter, sans-serif",
        size: 13
      },
      namelength: -1
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
      font: {
        size: 13,
        family: "Inter, sans-serif"
      }
    },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
    font: {
      family: "Inter, sans-serif",
      size: 13,
      color: "#6B7280"
    }
  }), []);
  const config = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: "zone_lmp_chart",
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-green-500 rounded-lg shadow-gs-sm p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900", children: "Zone LMP Components" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "zone-select", className: "text-sm font-medium text-gray-700", children: "Select Zone:" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "zone-select",
            value: selectedZone || "",
            onChange: (e) => setSelectedZone(e.target.value ? parseInt(e.target.value) : null),
            className: "border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "-- Select a Zone --" }),
              zones.map((zone) => /* @__PURE__ */ jsx("option", { value: zone.id, children: zone.name }, zone.id))
            ]
          }
        )
      ] })
    ] }),
    loading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart data..." }),
    error && /* @__PURE__ */ jsxs("div", { className: "text-gs-red-500", children: [
      "Error: ",
      error
    ] }),
    !Plot && !loading && !error && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart library..." }),
    !loading && !error && selectedZone && data.length > 0 && Plot && /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "500px" }, children: /* @__PURE__ */ jsx(
      Plot,
      {
        data: plotlyData,
        layout,
        config,
        style: { width: "100%", height: "100%" },
        useResizeHandler: true
      }
    ) }),
    !loading && !error && selectedZone && data.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "No data available for the selected zone." }),
    !loading && !error && !selectedZone && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Please select a zone to view LMP data." })
  ] });
};

const SupplyStackChart = () => {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableFuels, setAvailableFuels] = useState([]);
  const [Plot, setPlot] = useState(null);
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
        const result = await response.json();
        if (response.ok) {
          setData(result.data);
          if (result.data.length > 0) {
            const fuels = Object.keys(result.data[0]).filter(
              (key) => key !== "datetime" && key !== "Total Generation"
            );
            setAvailableFuels(fuels);
          }
          setError(null);
        } else {
          setError("Failed to fetch supply stack data");
        }
      } catch (err) {
        setError("Error loading supply stack data");
        console.error("Error fetching supply stack data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const fuelColors = {
    "Solar": "#FCD34D",
    // Light Yellow - bright renewable
    "Wind": "#34D399",
    // Light Green - renewable energy
    "Hydro": "#60A5FA",
    // Light Blue - water energy
    "Natural Gas": "#F97316",
    // Orange - distinct from yellow/red
    "Fuel Oil": "#7C2D12",
    // Dark Brown - earth tone fossil
    "Nuclear": "#8B5CF6",
    // Purple - distinct tech color
    "Battery": "#EC4899",
    // Pink - energy storage
    "Geothermal": "#047857",
    // Dark Green - earth energy
    "Other": "#6B7280"
    // Gray - neutral
  };
  const plotlyData = useMemo(() => {
    if (data.length === 0) return [];
    const traces = [];
    availableFuels.forEach((fuel) => {
      traces.push({
        x: data.map((d) => d.datetime),
        y: data.map((d) => Number(d[fuel]) || 0),
        name: fuel,
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        fillcolor: fuelColors[fuel] || "#6B7280",
        line: {
          width: 0.5,
          color: fuelColors[fuel] || "#6B7280"
        },
        hovertemplate: '<b>%{fullData.name}</b><br><span style="line-height: 0.8;">%{y:.2f} GW</span><extra></extra>'
      });
    });
    traces.push({
      x: data.map((d) => d.datetime),
      y: data.map((d) => Number(d["Total Generation"]) || 0),
      name: "Total Generation",
      type: "scatter",
      mode: "lines",
      line: {
        color: "#000000",
        width: 2
      },
      hovertemplate: '<b>%{fullData.name}</b><br><span style="line-height: 0.8;">%{y:.2f} GW</span><extra></extra>'
    });
    return traces;
  }, [data, availableFuels, fuelColors]);
  const layout = useMemo(() => ({
    height: 500,
    margin: { l: 80, r: 40, t: 40, b: 90 },
    xaxis: {
      title: { text: "" },
      tickformat: "%b %d",
      tickangle: 0,
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "#9CA3AF",
      spikedash: "solid",
      hoverformat: '<b style="font-size: 14px;">%b %d, %Y at %I:%M %p</b><br>'
    },
    yaxis: {
      title: {
        text: "Generation (GW)",
        font: {
          size: 14,
          color: "#4B5563",
          family: "Inter, sans-serif"
        }
      },
      showgrid: true,
      gridcolor: "#E5E7EB",
      zeroline: false,
      showline: true,
      linecolor: "#6B7280",
      linewidth: 1,
      ticks: "outside",
      ticklen: 5,
      tickwidth: 1,
      tickcolor: "#6B7280",
      tickfont: {
        size: 13,
        family: "Inter, sans-serif",
        color: "#6B7280"
      }
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "white",
      bordercolor: "#E5E7EB",
      font: {
        family: "Inter, sans-serif",
        size: 13
      },
      namelength: -1,
      align: "left"
    },
    hoverdistance: 20,
    legend: {
      orientation: "h",
      yanchor: "top",
      y: -0.15,
      xanchor: "center",
      x: 0.5,
      font: {
        size: 13,
        family: "Inter, sans-serif"
      }
    },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
    font: {
      family: "Inter, sans-serif",
      size: 13,
      color: "#6B7280"
    }
  }), []);
  const config = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
    displaylogo: false,
    responsive: true,
    toImageButtonOptions: {
      format: "png",
      filename: "supply_stack_chart",
      height: 600,
      width: 1200,
      scale: 2
    }
  }), []);
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-6", children: "Hourly Supply Stack" }),
    loading && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart data..." }),
    error && /* @__PURE__ */ jsxs("div", { className: "text-gs-red-500", children: [
      "Error: ",
      error
    ] }),
    !Plot && !loading && !error && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart library..." }),
    !loading && !error && data.length > 0 && Plot && /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "500px" }, children: /* @__PURE__ */ jsx(
      Plot,
      {
        data: plotlyData,
        layout,
        config,
        style: { width: "100%", height: "100%" },
        useResizeHandler: true
      }
    ) }),
    !loading && !error && data.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "No supply stack data available." })
  ] });
};

function CAISOFundamentalsPage() {
  return /* @__PURE__ */ jsx(ScenarioProvider, { children: /* @__PURE__ */ jsx("div", { className: "py-12 space-y-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gs-gray-900 mb-2", children: "CAISO System" }),
      /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "System-wide fundamentals forecast of load, net load, and generation" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm", children: /* @__PURE__ */ jsx(ScenarioInfo, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsxs("section", { id: "weekly-analysis", className: "mb-12 scroll-mt-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Weekly Fundamentals Comparison" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "Click on a card to view weekly comparison chart" })
        ] }),
        /* @__PURE__ */ jsx(InteractiveFundamentalsCards, {})
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Fundamentals Forecast" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "System load, net load, and renewables generation forecast" })
        ] }),
        /* @__PURE__ */ jsx(NetLoadChart, {})
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Generation Mix" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "Hourly generation by fuel type" })
        ] }),
        /* @__PURE__ */ jsx(SupplyStackChart, {})
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Total Demand by Zone" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "Hourly demand forecast across CAISO zones" })
        ] }),
        /* @__PURE__ */ jsx(ZoneDemandChart, {})
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Locational Marginal Pricing" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "LMP forecast by zone" })
        ] }),
        /* @__PURE__ */ jsx(ZoneLMPChart, {})
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Marginal Energy Component" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "Marginal Energy Component for Top 2 and Bottom 2 Hours" })
        ] }),
        /* @__PURE__ */ jsx(MECOverviewWrapper, {})
      ] })
    ] })
  ] }) }) });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const subNavLinks = [
    {
      label: "CAISO Forecast",
      dropdown: [
        { label: "CAISO System", href: "/short-term-outlook/caiso-system", description: "System-wide fundamentals and forecasts" },
        { label: "Goleta", href: "/short-term-outlook/goleta", description: "Location-specific pricing and congestion analysis" }
      ]
    },
    { label: "Weekly Insight", href: "/short-term-outlook/weekly-insight" },
    { label: "Likeday Tool", href: "/short-term-outlook/likeday" }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "CAISO System", "pageTitle": "Short Term Outlook", "subNavLinks": subNavLinks }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "CAISOFundamentalsPage", CAISOFundamentalsPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/CAISOFundamentalsPage", "client:component-export": "default" })} ${renderScript($$result2, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/caiso-system/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/caiso-system/index.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/caiso-system/index.astro";
const $$url = "/short-term-outlook/caiso-system";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
