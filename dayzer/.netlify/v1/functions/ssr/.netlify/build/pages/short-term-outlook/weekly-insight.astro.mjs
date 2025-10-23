/* empty css                                    */
import { f as createComponent, n as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_W-IpgH_B.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceArea } from 'recharts';
export { renderers } from '../../renderers.mjs';

function SectionHeader({ title, description }) {
  return /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600 text-base max-w-3xl mx-auto", children: description })
  ] });
}

function LoadForecastAccuracy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHours, setSelectedHours] = useState([17, 18, 19, 20]);
  const [pendingHours, setPendingHours] = useState([17, 18, 19, 20]);
  const [copying, setCopying] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState("dayzerLoad");
  const [selectedActuals, setSelectedActuals] = useState("rtLoad");
  const forecastOptions = [
    { value: "dayzerLoad", label: "Dayzer Load" },
    { value: "dayzerNetLoad", label: "Dayzer Net Load" },
    { value: "dayzerLoadT1", label: "Dayzer Load t-1" },
    { value: "dayzerNetLoadT1", label: "Dayzer Net Load t-1" },
    { value: "caisoLoad", label: "CAISO Load" },
    { value: "caisoNetLoad", label: "CAISO Net Load" },
    { value: "caisoLoad7D", label: "CAISO Load 7D" }
  ];
  const actualsOptions = [
    { value: "rtLoad", label: "RT Load" },
    { value: "rtNetLoad", label: "RT Net Load" },
    { value: "daLoad", label: "DA Load" },
    { value: "daNetLoad", label: "DA Net Load" }
  ];
  const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1);
  const fetchAccuracyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const lastWeekScenario = urlParams.get("lastWeekScenario");
      console.log("Fetching load forecast accuracy data with scenario:", lastWeekScenario);
      const apiUrl = lastWeekScenario ? `/api/load-forecast-accuracy?scenarioId=${lastWeekScenario}` : "/api/load-forecast-accuracy";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedHours,
          forecast: selectedForecast,
          actuals: selectedActuals
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Accuracy API error:", errorText);
        throw new Error(`Failed to fetch accuracy data: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log("Load forecast accuracy data:", result);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error("Invalid accuracy data received");
      }
    } catch (err) {
      console.error("Load forecast accuracy error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch accuracy data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScenarioChange = (event) => {
      console.log("LoadForecastAccuracy received scenario change:", event.detail);
      if (selectedHours.length > 0) {
        fetchAccuracyData();
      }
    };
    window.addEventListener("scenarioChanged", handleScenarioChange);
    return () => {
      window.removeEventListener("scenarioChanged", handleScenarioChange);
    };
  }, [selectedHours, selectedForecast, selectedActuals]);
  useEffect(() => {
    if (selectedHours.length > 0) {
      fetchAccuracyData();
    }
  }, [selectedHours, selectedForecast, selectedActuals]);
  const toggleHour = (hour) => {
    setPendingHours(
      (prev) => prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };
  const applyHourSelection = () => {
    setSelectedHours([...pendingHours]);
  };
  const selectAllHours = () => {
    setPendingHours([...hourOptions]);
  };
  const selectPeakHours = () => {
    setPendingHours([17, 18, 19, 20]);
  };
  const clearHours = () => {
    setPendingHours([]);
  };
  const copyAccuracySectionAsImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const accuracySection = document.querySelector(".load-forecast-accuracy-screenshot");
      if (!accuracySection) {
        console.error("Accuracy section not found");
        setCopying(false);
        return;
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(accuracySection, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("Load forecast accuracy section copied to clipboard");
          } catch (err) {
            console.error("Failed to copy to clipboard:", err);
          }
        }
        setCopying(false);
      }, "image/png");
    } catch (error2) {
      console.error("Error capturing accuracy section:", error2);
      setCopying(false);
    }
  };
  const formatError = (value, isPercentage = false) => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toLocaleString("en-US")} MW`;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading forecast accuracy data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-red-500 mb-2", children: "Error loading accuracy data" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: error })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-700 mb-3", children: "Forecast vs Actuals Comparison:" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-600 mb-2", children: "Forecast Source:" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: selectedForecast,
              onChange: (e) => setSelectedForecast(e.target.value),
              className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              children: forecastOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-600 mb-2", children: "Actuals Source:" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: selectedActuals,
              onChange: (e) => setSelectedActuals(e.target.value),
              className: "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              children: actualsOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-700", children: "Select Hours for Analysis:" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: selectAllHours,
              className: "bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors",
              children: "All Hours"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: selectPeakHours,
              className: "bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors",
              children: "Peak Hours (17-20)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: clearHours,
              className: "bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors",
              children: "Clear All"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-12 gap-1 mb-4", children: hourOptions.map((hour) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => toggleHour(hour),
          className: `h-8 text-xs font-medium rounded transition-colors ${pendingHours.includes(hour) ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`,
          children: hour
        },
        hour
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
          "Selected: ",
          pendingHours.length > 0 ? pendingHours.join(", ") : "None"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: applyHourSelection,
            disabled: pendingHours.length === 0,
            className: "bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors",
            children: "Apply Selection"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "load-forecast-accuracy-screenshot bg-white rounded-lg shadow-lg border border-gray-200 p-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: copyAccuracySectionAsImage,
          disabled: copying,
          className: "bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
          children: copying ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
              /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
            ] }),
            "Copying..."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" }) }),
            "Copy Accuracy"
          ] })
        }
      ) }),
      data && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6 w-full max-w-md", children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-lg font-semibold text-blue-800 mb-4 text-center", children: [
            forecastOptions.find((f) => f.value === selectedForecast)?.label,
            " vs ",
            actualsOptions.find((a) => a.value === selectedActuals)?.label
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-blue-700 font-medium", children: "MAE:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-800", children: data[selectedForecast] ? formatError(data[selectedForecast].mae) : "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-blue-700 font-medium", children: "RMSE:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-800", children: data[selectedForecast] ? formatError(data[selectedForecast].rmse) : "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-blue-700 font-medium", children: "MAPE:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-800", children: data[selectedForecast] ? formatError(data[selectedForecast].mape, true) : "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-blue-700 font-medium", children: "Bias:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-800", children: data[selectedForecast] ? formatError(data[selectedForecast].bias) : "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-2 border-t border-blue-200", children: [
              /* @__PURE__ */ jsx("span", { className: "text-blue-700 font-medium", children: "Data Points:" }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-blue-800", children: data[selectedForecast] ? data[selectedForecast].dataPoints : "N/A" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-medium text-gray-700", children: "Hourly Forecast Errors" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
              forecastOptions.find((f) => f.value === selectedForecast)?.label,
              " vs ",
              actualsOptions.find((a) => a.value === selectedActuals)?.label,
              " - Absolute error over time for selected hours"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-80", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            LineChart,
            {
              data: data.timeSeriesErrors,
              margin: { top: 20, right: 30, left: 60, bottom: 40 },
              children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb", horizontal: true, vertical: true }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "datetime",
                    tickFormatter: (value, index) => {
                      const date = new Date(value);
                      if (index % 24 === 0) {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        });
                      }
                      return "";
                    },
                    stroke: "#6b7280",
                    fontSize: 12,
                    height: 40
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    stroke: "#6b7280",
                    fontSize: 12,
                    tickFormatter: (value) => `${value.toLocaleString("en-US")} MW`,
                    label: { value: "Absolute Error (MW)", angle: -90, position: "insideLeft" }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    labelFormatter: (value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      });
                    },
                    formatter: (value, name) => [
                      `${Math.abs(value).toLocaleString("en-US")} MW`,
                      name.replace("Error", " Error")
                    ],
                    contentStyle: {
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px"
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: `${selectedForecast}Error`,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    dot: false,
                    name: `${forecastOptions.find((f) => f.value === selectedForecast)?.label} Error`
                  }
                )
              ]
            }
          ) }) })
        ] })
      ] })
    ] })
  ] });
}

function CombinedLoadChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState(5e4);
  const [yAxisMin, setYAxisMin] = useState(-1e4);
  const [viewMode, setViewMode] = useState("full");
  const [showAccuracy, setShowAccuracy] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState(null);
  const colorOptions = [
    "#3b82f6",
    // Blue
    "#ef4444",
    // Red  
    "#22c55e",
    // Green
    "#f59e0b",
    // Amber
    "#8b5cf6",
    // Violet
    "#ec4899",
    // Pink
    "#06b6d4",
    // Cyan
    "#84cc16",
    // Lime
    "#f97316",
    // Orange
    "#6366f1",
    // Indigo
    "#14b8a6",
    // Teal
    "#f43f5e",
    // Rose
    "#a855f7",
    // Purple
    "#eab308",
    // Yellow
    "#6b7280",
    // Gray
    "#1f2937"
    // Dark Gray
  ];
  const styleOptions = [
    { value: "solid", label: "Solid", dashArray: "" },
    { value: "dashed", label: "Dashed", dashArray: "5 5" },
    { value: "dotted", label: "Dotted", dashArray: "2 2" }
  ];
  const [visibleLines, setVisibleLines] = useState({
    dayzerLoad: true,
    dayzerNetLoad: true,
    dayzerLoadT1: false,
    // New t-1 load line
    dayzerNetLoadT1: false,
    // New t-1 net load line
    caisoLoad: true,
    caisoNetLoad: true,
    caisoLoad7D: false,
    // New CAISO Load 7D line
    rtLoad: true,
    rtNetLoad: true
  });
  const [lineCustomization, setLineCustomization] = useState({
    dayzerLoad: { color: "#ef4444", style: "solid" },
    // Red
    dayzerNetLoad: { color: "#f97316", style: "solid" },
    // Orange
    dayzerLoadT1: { color: "#b91c1c", style: "solid" },
    // Dark Red
    dayzerNetLoadT1: { color: "#c2410c", style: "solid" },
    // Dark Orange
    caisoLoad: { color: "#3b82f6", style: "solid" },
    // Blue
    caisoNetLoad: { color: "#22c55e", style: "solid" },
    // Green
    caisoLoad7D: { color: "#1e40af", style: "solid" },
    // Dark Blue
    rtLoad: { color: "#8b5cf6", style: "solid" },
    // Violet
    rtNetLoad: { color: "#ec4899", style: "solid" }
    // Pink
  });
  const toggleLine = (lineKey) => {
    const newVisibleLines = {
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    };
    setVisibleLines(newVisibleLines);
    if (data.length > 0) {
      const visibleValues = [];
      data.forEach((point) => {
        if (newVisibleLines.dayzerLoad) {
          if (point.dayzerLoadLastWeek) visibleValues.push(point.dayzerLoadLastWeek);
          if (point.dayzerLoadForecast) visibleValues.push(point.dayzerLoadForecast);
        }
        if (newVisibleLines.dayzerNetLoad) {
          if (point.dayzerNetLoadLastWeek) visibleValues.push(point.dayzerNetLoadLastWeek);
          if (point.dayzerNetLoadForecast) visibleValues.push(point.dayzerNetLoadForecast);
        }
        if (newVisibleLines.dayzerLoadT1) {
          if (point.dayzerLoadT1LastWeek) visibleValues.push(point.dayzerLoadT1LastWeek);
        }
        if (newVisibleLines.dayzerNetLoadT1) {
          if (point.dayzerNetLoadT1LastWeek) visibleValues.push(point.dayzerNetLoadT1LastWeek);
        }
        if (newVisibleLines.caisoLoad) {
          if (point.caisoLoadLastWeek) visibleValues.push(point.caisoLoadLastWeek);
          if (point.caisoLoadForecast) visibleValues.push(point.caisoLoadForecast);
        }
        if (newVisibleLines.caisoNetLoad) {
          if (point.caisoNetLoadLastWeek) visibleValues.push(point.caisoNetLoadLastWeek);
          if (point.caisoNetLoadForecast) visibleValues.push(point.caisoNetLoadForecast);
        }
        if (newVisibleLines.caisoLoad7D) {
          if (point.caisoLoad7DLastWeek) visibleValues.push(point.caisoLoad7DLastWeek);
          if (point.caisoLoad7DForecast) visibleValues.push(point.caisoLoad7DForecast);
        }
        if (newVisibleLines.rtLoad) {
          if (point.rtLoadLastWeek) visibleValues.push(point.rtLoadLastWeek);
        }
        if (newVisibleLines.rtNetLoad) {
          if (point.rtNetLoadLastWeek) visibleValues.push(point.rtNetLoadLastWeek);
        }
      });
      if (visibleValues.length > 0) {
        const min = Math.min(...visibleValues);
        const max = Math.max(...visibleValues);
        const padding = (max - min) * 0.1;
        setYAxisMin(Math.floor(min - padding));
        setYAxisMax(Math.ceil(max + padding));
      }
    }
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching with scenarios:", { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });
      const forecastUrl = currentWeekScenarioId ? `/api/load-net-load-forecast?scenarioId=${currentWeekScenarioId}` : "/api/load-net-load-forecast";
      const lastWeekUrl = lastWeekScenarioId ? `/api/load-last-week-forecast?scenarioId=${lastWeekScenarioId}` : "/api/load-last-week-forecast";
      console.log("API URLs:", { forecastUrl, lastWeekUrl });
      console.log("Fetching load forecast and last week data separately...");
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);
      console.log("API Response status:", {
        forecast: forecastResponse.status,
        lastWeek: lastWeekResponse.status
      });
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        console.error("Forecast API error:", errorText);
        throw new Error(`Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }
      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        console.error("Last Week API error:", errorText);
        throw new Error(`Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }
      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();
      console.log("Forecast data points:", forecastData.data?.length || 0);
      console.log("Last week data points:", lastWeekData.data?.length || 0);
      const combinedData = [];
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            dayzerLoadLastWeek: point.dayzerLoad,
            dayzerNetLoadLastWeek: point.dayzerNetLoad,
            dayzerLoadT1LastWeek: point.dayzerLoadT1 || 0,
            // t-1 data from API
            dayzerNetLoadT1LastWeek: point.dayzerNetLoadT1 || 0,
            // t-1 data from API
            caisoLoadLastWeek: point.caisoLoad,
            caisoNetLoadLastWeek: point.caisoNetLoad,
            caisoLoad7DLastWeek: point.caisoLoad7D,
            // CAISO Load 7D last week data
            rtLoadLastWeek: point.rtLoad,
            rtNetLoadLastWeek: point.rtNetLoad
          });
        });
      }
      if (forecastData.data) {
        forecastData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            dayzerLoadForecast: point.dayzerLoad,
            dayzerNetLoadForecast: point.dayzerNetLoad,
            caisoLoadForecast: point.caisoLoad,
            caisoNetLoadForecast: point.caisoNetLoad,
            caisoLoad7DForecast: point.caisoLoad7D
          });
        });
      }
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));
      console.log("Combined data points:", combinedData.length);
      if (combinedData.length > 0) {
        console.log("Sample combined data point:", combinedData[0]);
        console.log("Data keys in first point:", Object.keys(combinedData[0]));
      }
      setData(combinedData);
      if (combinedData.length > 0) {
        const allValues = [];
        combinedData.forEach((point) => {
          if (visibleLines.dayzerLoad) {
            if (point.dayzerLoadLastWeek) allValues.push(point.dayzerLoadLastWeek);
            if (point.dayzerLoadForecast) allValues.push(point.dayzerLoadForecast);
          }
          if (visibleLines.dayzerNetLoad) {
            if (point.dayzerNetLoadLastWeek) allValues.push(point.dayzerNetLoadLastWeek);
            if (point.dayzerNetLoadForecast) allValues.push(point.dayzerNetLoadForecast);
          }
          if (visibleLines.dayzerLoadT1 && point.dayzerLoadT1LastWeek) allValues.push(point.dayzerLoadT1LastWeek);
          if (visibleLines.dayzerNetLoadT1 && point.dayzerNetLoadT1LastWeek) allValues.push(point.dayzerNetLoadT1LastWeek);
          if (visibleLines.caisoLoad) {
            if (point.caisoLoadLastWeek) allValues.push(point.caisoLoadLastWeek);
            if (point.caisoLoadForecast) allValues.push(point.caisoLoadForecast);
          }
          if (visibleLines.caisoNetLoad) {
            if (point.caisoNetLoadLastWeek) allValues.push(point.caisoNetLoadLastWeek);
            if (point.caisoNetLoadForecast) allValues.push(point.caisoNetLoadForecast);
          }
          if (visibleLines.caisoLoad7D) {
            if (point.caisoLoad7DLastWeek) allValues.push(point.caisoLoad7DLastWeek);
            if (point.caisoLoad7DForecast) allValues.push(point.caisoLoad7DForecast);
          }
          if (visibleLines.rtLoad && point.rtLoadLastWeek) allValues.push(point.rtLoadLastWeek);
          if (visibleLines.rtNetLoad && point.rtNetLoadLastWeek) allValues.push(point.rtNetLoadLastWeek);
        });
        if (allValues.length > 0) {
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const padding = (max - min) * 0.1;
          setYAxisMin(Math.floor(min - padding));
          setYAxisMax(Math.ceil(max + padding));
          console.log("Load chart auto-scaled Y-axis:", { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
        }
      }
      setMetadata({
        lastWeekScenario: lastWeekData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        forecastScenario: forecastData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        lastWeekDateRange: lastWeekData.metadata?.dateRange || { start: "", end: "" },
        forecastDateRange: forecastData.metadata?.dateRange || { start: "", end: "" },
        dataPoints: {
          lastWeek: lastWeekData.data?.length || 0,
          forecast: forecastData.data?.length || 0,
          combined: combinedData.length
        }
      });
    } catch (err) {
      console.error("Combined load API error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch combined load data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScenarioChange = (event) => {
      console.log("CombinedLoadChart received scenario change:", event.detail);
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
    };
    window.addEventListener("scenarioChanged", handleScenarioChange);
    return () => {
      window.removeEventListener("scenarioChanged", handleScenarioChange);
    };
  }, []);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);
  const copyChartAsImage = async () => {
    setCopying(true);
    try {
      const chartContainer = document.querySelector(".combined-load-chart-container .recharts-wrapper");
      if (!chartContainer) {
        throw new Error("Combined load chart not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const chartSection = chartContainer.closest(".bg-white.p-6.rounded-lg.shadow-lg.border.border-gray-200");
      if (!chartSection) {
        throw new Error("Chart section not found");
      }
      const canvas = await html2canvas(chartSection, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            setCopying(false);
          } catch (clipboardError) {
            console.error("Failed to copy to clipboard:", clipboardError);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "combined-load-chart.png";
            link.click();
            URL.revokeObjectURL(url);
            setCopying(false);
          }
        }
      }, "image/png");
    } catch (error2) {
      console.error("Error capturing chart:", error2);
      setCopying(false);
      alert('Failed to copy chart. Please try right-clicking and selecting "Copy image" instead.');
    }
  };
  const copyLegendAsImage = async () => {
    setCopyingLegend(true);
    try {
      const legendContainer = document.querySelector(".bg-gray-50 .grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6");
      if (!legendContainer) {
        throw new Error("Legend not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(legendContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            setCopyingLegend(false);
          } catch (clipboardError) {
            console.error("Failed to copy legend to clipboard:", clipboardError);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "combined-load-legend.png";
            link.click();
            URL.revokeObjectURL(url);
            setCopyingLegend(false);
          }
        }
      }, "image/png");
    } catch (error2) {
      console.error("Error capturing legend:", error2);
      setCopyingLegend(false);
      alert('Failed to copy legend. Please try right-clicking and selecting "Copy image" instead.');
    }
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const datetime = new Date(label);
      const dateStr = datetime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const timeStr = datetime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 border border-gray-300 rounded shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium mb-2", children: `${dateStr} at ${timeStr}` }),
        payload.map((entry, index) => /* @__PURE__ */ jsx("p", { style: { color: entry.color }, className: "text-sm", children: `${entry.name}: ${entry.value?.toLocaleString() || 0} MW` }, index))
      ] });
    }
    return null;
  };
  const formatXAxisTick = (tickItem) => {
    const date = new Date(tickItem);
    const hour = date.getHours();
    if (hour === 0) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
    }
    return "";
  };
  const formatYAxisTick = (value) => {
    return `${value.toLocaleString()}`;
  };
  const calculateYAxisTicks = (min, max) => {
    const roundedMin = Math.floor(min / 5e3) * 5e3;
    const roundedMax = Math.ceil(max / 5e3) * 5e3;
    const ticks = [];
    for (let tick = roundedMin; tick <= roundedMax; tick += 5e3) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };
  const lastWeekEndIndex = data.findIndex((d) => !d.isLastWeek);
  const lastWeekEndDate = lastWeekEndIndex > 0 ? data[lastWeekEndIndex - 1]?.datetime : null;
  const forecastStartDate = lastWeekEndIndex >= 0 ? data[lastWeekEndIndex]?.datetime : null;
  const filteredData = data.filter((d) => {
    if (viewMode === "full") return true;
    if (viewMode === "lastWeek") return d.isLastWeek;
    if (viewMode === "forecast") return !d.isLastWeek;
    return true;
  });
  const showGreyBackground = viewMode === "full" || viewMode === "lastWeek";
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading combined load data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-red-500 mb-2", children: "Error loading combined load data" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: error })
    ] }) });
  }
  if (!data || data.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "No combined load data available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowAccuracy(!showAccuracy),
          className: `px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${showAccuracy ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
          children: [
            /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }),
            showAccuracy ? "Hide" : "Show",
            " Load Forecast Accuracy"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyChartAsImage,
            disabled: copying,
            className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors",
            children: copying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
              "Copy Chart"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyLegendAsImage,
            disabled: copyingLegend,
            className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors",
            children: copyingLegend ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
              "Copy Legend"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "View:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex rounded-lg border border-gray-300 overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("full"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "full" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Full"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("lastWeek"),
                className: `px-3 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${viewMode === "lastWeek" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Last Week"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("forecast"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "forecast" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Forecast"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Min:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "-20000",
              max: "10000",
              step: "5000",
              value: yAxisMin,
              onChange: (e) => setYAxisMin(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            yAxisMin.toLocaleString(),
            " MW"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Max:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "30000",
              max: "80000",
              step: "5000",
              value: yAxisMax,
              onChange: (e) => setYAxisMax(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            yAxisMax.toLocaleString(),
            " MW"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-gray-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCustomization(!showCustomization),
              className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors",
              children: [
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: `w-4 h-4 transition-transform ${showCustomization ? "rotate-90" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                  }
                ),
                "Customize Lines"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setVisibleLines({
                dayzerLoad: false,
                dayzerNetLoad: false,
                dayzerLoadT1: false,
                dayzerNetLoadT1: false,
                caisoLoad: false,
                caisoNetLoad: false,
                caisoLoad7D: false,
                rtLoad: false,
                rtNetLoad: false
              }),
              className: "px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors",
              children: "Remove All"
            }
          )
        ] }),
        showCustomization && /* @__PURE__ */ jsx("div", { className: "load-toggle-lines-section grid grid-cols-1 gap-2", children: Object.entries(visibleLines).map(([lineKey, isVisible]) => {
          const customization = lineCustomization[lineKey];
          let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          if (lineKey === "dayzerLoad") lineName = "Dayzer Load";
          if (lineKey === "dayzerNetLoad") lineName = "Dayzer Net Load";
          if (lineKey === "dayzerLoadT1") lineName = "Dayzer Load t-1";
          if (lineKey === "dayzerNetLoadT1") lineName = "Dayzer Net Load t-1";
          if (lineKey === "caisoLoad") lineName = "CAISO DA Load";
          if (lineKey === "caisoNetLoad") lineName = "CAISO Net Load";
          if (lineKey === "caisoLoad7D") lineName = "CAISO 7D Load";
          if (lineKey === "rtLoad") lineName = "RT Load";
          if (lineKey === "rtNetLoad") lineName = "RT Net Load";
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-md p-3 bg-white shadow-sm",
              style: {
                border: `2px ${customization.style === "solid" ? "solid" : customization.style === "dashed" ? "dashed" : "dotted"} ${isVisible ? customization.color : "#d1d5db"}`
              },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[160px]", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isVisible,
                      onChange: () => toggleLine(lineKey),
                      className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-700", children: lineName })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      value: customization.style,
                      onChange: (e) => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], style: e.target.value }
                      })),
                      className: "text-sm border border-gray-300 rounded px-3 py-1 w-24",
                      children: styleOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: colorOptions.map((color) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], color }
                      })),
                      className: `w-4 h-4 rounded border ${customization.color === color ? "border-gray-800 border-2" : "border-gray-300"}`,
                      style: { backgroundColor: color },
                      title: color
                    },
                    color
                  )) })
                ] })
              ] })
            },
            lineKey
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "combined-load-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800", children: "Load Forecast" }) }),
      /* @__PURE__ */ jsx("div", { className: "h-[500px] relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
        LineChart,
        {
          data: filteredData,
          margin: { top: 20, right: 20, left: 80, bottom: 20 },
          children: [
            /* @__PURE__ */ jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                stroke: "#e5e7eb",
                horizontal: true,
                vertical: true
              }
            ),
            showGreyBackground && lastWeekEndDate && forecastStartDate && /* @__PURE__ */ jsx(
              ReferenceArea,
              {
                x1: filteredData[0]?.datetime,
                x2: lastWeekEndDate,
                fill: "#e5e7eb",
                fillOpacity: 0.5
              }
            ),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "datetime",
                tickFormatter: formatXAxisTick,
                stroke: "#6b7280",
                fontSize: 12,
                height: 40,
                interval: 23,
                axisLine: true,
                tickLine: true
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                stroke: "#6b7280",
                fontSize: 12,
                tickFormatter: formatYAxisTick,
                domain: [yAxisMin, yAxisMax],
                ticks: calculateYAxisTicks(yAxisMin, yAxisMax),
                label: {
                  value: "Load (MW)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -50,
                  style: { textAnchor: "middle" }
                },
                axisLine: true,
                tickLine: true,
                width: 30
              }
            ),
            /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: () => 0,
                stroke: "#000000",
                strokeWidth: 1,
                dot: false,
                name: "",
                connectNulls: true
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerLoadLastWeek",
                stroke: lineCustomization.dayzerLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerLoad.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Load Forecast",
                connectNulls: false,
                hide: !visibleLines.dayzerLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerLoadForecast",
                stroke: lineCustomization.dayzerLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerLoad.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Load Forecast",
                connectNulls: false,
                hide: !visibleLines.dayzerLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerNetLoadLastWeek",
                stroke: lineCustomization.dayzerNetLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerNetLoad.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Net Load Forecast",
                connectNulls: false,
                hide: !visibleLines.dayzerNetLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerNetLoadForecast",
                stroke: lineCustomization.dayzerNetLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerNetLoad.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Net Load Forecast",
                connectNulls: false,
                hide: !visibleLines.dayzerNetLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerLoadT1LastWeek",
                stroke: lineCustomization.dayzerLoadT1.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerLoadT1.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Load t-1",
                connectNulls: false,
                hide: !visibleLines.dayzerLoadT1
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "dayzerNetLoadT1LastWeek",
                stroke: lineCustomization.dayzerNetLoadT1.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerNetLoadT1.style)?.dashArray || "",
                dot: false,
                name: "Dayzer Net Load t-1",
                connectNulls: false,
                hide: !visibleLines.dayzerNetLoadT1
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoLoadLastWeek",
                stroke: lineCustomization.caisoLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoLoad.style)?.dashArray || "",
                dot: false,
                name: "CAISO DA Load Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoLoadForecast",
                stroke: lineCustomization.caisoLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoLoad.style)?.dashArray || "",
                dot: false,
                name: "CAISO DA Load Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoLoad7DLastWeek",
                stroke: lineCustomization.caisoLoad7D.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoLoad7D.style)?.dashArray || "",
                dot: false,
                name: "CAISO Load 7D Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoLoad7D
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoLoad7DForecast",
                stroke: lineCustomization.caisoLoad7D.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoLoad7D.style)?.dashArray || "",
                dot: false,
                name: "CAISO Load 7D Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoLoad7D
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoNetLoadLastWeek",
                stroke: lineCustomization.caisoNetLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoNetLoad.style)?.dashArray || "",
                dot: false,
                name: "CAISO DA Net Load Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoNetLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "stepAfter",
                dataKey: "caisoNetLoadForecast",
                stroke: lineCustomization.caisoNetLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoNetLoad.style)?.dashArray || "",
                dot: false,
                name: "CAISO DA Net Load Forecast",
                connectNulls: false,
                hide: !visibleLines.caisoNetLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: "rtLoadLastWeek",
                stroke: lineCustomization.rtLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.rtLoad.style)?.dashArray || "",
                dot: false,
                name: "RT Load Actuals",
                connectNulls: false,
                hide: !visibleLines.rtLoad
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: "rtNetLoadLastWeek",
                stroke: lineCustomization.rtNetLoad.color,
                strokeWidth: 2,
                strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.rtNetLoad.style)?.dashArray || "",
                dot: false,
                name: "RT Net Load Actuals",
                connectNulls: false,
                hide: !visibleLines.rtNetLoad
              }
            )
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: Object.entries(visibleLines).filter(([_, isVisible]) => isVisible).map(([lineKey, _]) => {
        const customization = lineCustomization[lineKey];
        let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        if (lineKey === "dayzerLoad") lineName = "Dayzer Load";
        if (lineKey === "dayzerNetLoad") lineName = "Dayzer Net Load";
        if (lineKey === "dayzerLoadT1") lineName = "Dayzer Load t-1";
        if (lineKey === "dayzerNetLoadT1") lineName = "Dayzer Net Load t-1";
        if (lineKey === "caisoLoad") lineName = "CAISO Load";
        if (lineKey === "caisoNetLoad") lineName = "CAISO Net Load";
        if (lineKey === "caisoLoad7D") lineName = "CAISO Load 7D";
        if (lineKey === "rtLoad") lineName = "RT Load";
        if (lineKey === "rtNetLoad") lineName = "RT Net Load";
        const dashArray = styleOptions.find((s) => s.value === customization.style)?.dashArray || "";
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("svg", { width: "35", height: "4", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
            "line",
            {
              x1: "0",
              y1: "2",
              x2: "35",
              y2: "2",
              stroke: customization.color,
              strokeWidth: "3",
              strokeDasharray: dashArray
            }
          ) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 font-medium", children: lineName })
        ] }, lineKey);
      }) }) }) })
    ] }),
    showAccuracy && /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-8 border-t border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800 mb-2", children: "Load Forecast Accuracy" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Error metrics comparing forecasts vs actual RT data" })
      ] }),
      /* @__PURE__ */ jsx(LoadForecastAccuracy, {})
    ] })
  ] });
}

function RenewableForecastAccuracy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHours, setSelectedHours] = useState([12, 13, 14, 15, 16]);
  const [pendingHours, setPendingHours] = useState([12, 13, 14, 15, 16]);
  const [copying, setCopying] = useState(false);
  const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1);
  useEffect(() => {
    const fetchAccuracyData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching renewable forecast accuracy data...");
        const response = await fetch("/api/renewable-forecast-accuracy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            selectedHours
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Renewable accuracy API error:", errorText);
          throw new Error(`Failed to fetch renewable accuracy data: ${response.status} ${errorText}`);
        }
        const jsonData = await response.json();
        console.log("Received renewable accuracy data:", jsonData);
        setData(jsonData.data);
      } catch (err) {
        console.error("Renewable accuracy API error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch renewable accuracy data");
      } finally {
        setLoading(false);
      }
    };
    if (selectedHours.length > 0) {
      fetchAccuracyData();
    }
  }, [selectedHours]);
  const handleHourToggle = (hour) => {
    setPendingHours(
      (prev) => prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };
  const applyHourSelection = () => {
    setSelectedHours([...pendingHours]);
  };
  const selectAllHours = () => {
    setPendingHours([...hourOptions]);
  };
  const clearHours = () => {
    setPendingHours([]);
  };
  const copyAccuracyAsImage = async () => {
    setCopying(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const accuracySection = document.querySelector(".renewable-accuracy-container");
      if (!accuracySection) {
        throw new Error("Renewable accuracy section not found");
      }
      const canvas = await html2canvas(accuracySection, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            setCopying(false);
          } catch (clipboardError) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "renewable-forecast-accuracy.png";
            link.click();
            URL.revokeObjectURL(url);
            setCopying(false);
          }
        }
      }, "image/png");
    } catch (error2) {
      console.error("Error capturing renewable accuracy section:", error2);
      setCopying(false);
    }
  };
  const formatError = (value, isPercentage = false) => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toLocaleString("en-US")} MW`;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading renewable forecast accuracy data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-red-500 mb-2", children: "Error loading renewable accuracy data" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: error })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-700", children: "Select Hours for Renewable Analysis:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: selectAllHours,
                className: "bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors",
                children: "All Hours"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: clearHours,
                className: "bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-600 transition-colors",
                children: "Clear"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-12 gap-2 mb-3", children: hourOptions.map((hour) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleHourToggle(hour),
            className: `p-2 text-xs rounded border font-medium transition-colors ${pendingHours.includes(hour) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`,
            children: hour
          },
          hour
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
            "Pending: ",
            pendingHours.length > 0 ? pendingHours.join(", ") : "None",
            " | Applied: ",
            selectedHours.length > 0 ? selectedHours.join(", ") : "None"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: applyHourSelection,
              disabled: JSON.stringify(pendingHours) === JSON.stringify(selectedHours) || pendingHours.length === 0,
              className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm",
              children: "Apply"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
          "Analyzing ",
          selectedHours.length,
          " hour(s) for renewable forecast accuracy"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyAccuracyAsImage,
            disabled: copying,
            className: "bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium text-sm flex items-center gap-2",
            children: copying ? "Copying..." : "Copy Renewable Accuracy"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "renewable-accuracy-container bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800", children: "Renewable Forecast Accuracy" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [
          "Error metrics for hours: ",
          selectedHours.join(", ")
        ] })
      ] }),
      data && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-blue-800 mb-3", children: "Dayzer Wind" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-700", children: "MAE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-blue-800", children: formatError(data.dayzerWind.mae) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-700", children: "RMSE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-blue-800", children: formatError(data.dayzerWind.rmse) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-700", children: "MAPE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-blue-800", children: formatError(data.dayzerWind.mape, true) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-700", children: "Bias:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-blue-800", children: formatError(data.dayzerWind.bias) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-yellow-800 mb-3", children: "Dayzer Solar" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-yellow-700", children: "MAE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-yellow-800", children: formatError(data.dayzerSolar.mae) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-yellow-700", children: "RMSE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-yellow-800", children: formatError(data.dayzerSolar.rmse) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-yellow-700", children: "MAPE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-yellow-800", children: formatError(data.dayzerSolar.mape, true) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-yellow-700", children: "Bias:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-yellow-800", children: formatError(data.dayzerSolar.bias) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-teal-50 border border-teal-200 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-teal-800 mb-3", children: "CAISO Wind" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-teal-700", children: "MAE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-teal-800", children: formatError(data.caisoWind.mae) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-teal-700", children: "RMSE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-teal-800", children: formatError(data.caisoWind.rmse) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-teal-700", children: "MAPE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-teal-800", children: formatError(data.caisoWind.mape, true) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-teal-700", children: "Bias:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-teal-800", children: formatError(data.caisoWind.bias) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-orange-800 mb-3", children: "CAISO Solar" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-orange-700", children: "MAE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-orange-800", children: formatError(data.caisoSolar.mae) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-orange-700", children: "RMSE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-orange-800", children: formatError(data.caisoSolar.rmse) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-orange-700", children: "MAPE:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-orange-800", children: formatError(data.caisoSolar.mape, true) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-orange-700", children: "Bias:" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-orange-800", children: formatError(data.caisoSolar.bias) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-medium text-gray-700", children: "Hourly Renewable Forecast Errors" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Absolute error over time for selected hours" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-80", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            LineChart,
            {
              data: data.timeSeriesErrors,
              margin: { top: 20, right: 30, left: 60, bottom: 40 },
              children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb", horizontal: true, vertical: true }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "datetime",
                    tickFormatter: (value, index) => {
                      const date = new Date(value);
                      const dateString = date.toISOString().split("T")[0];
                      const isFirstOccurrenceOfDay = data.timeSeriesErrors.findIndex((point) => {
                        const pointDate = new Date(point.datetime);
                        return pointDate.toISOString().split("T")[0] === dateString;
                      }) === index;
                      if (isFirstOccurrenceOfDay) {
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }
                      return "";
                    },
                    stroke: "#6b7280",
                    fontSize: 12,
                    height: 40,
                    interval: 0
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    stroke: "#6b7280",
                    fontSize: 12,
                    tickFormatter: (value) => value.toLocaleString("en-US"),
                    label: {
                      value: "Absolute Error (MW)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -40,
                      style: { textAnchor: "middle" }
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    formatter: (value, name) => [
                      `${Math.abs(value).toLocaleString("en-US")} MW`,
                      name
                    ],
                    labelFormatter: (datetime) => {
                      const date = new Date(datetime);
                      return date.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      });
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "dayzerWindError",
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    dot: false,
                    name: "Dayzer Wind Error"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "dayzerSolarError",
                    stroke: "#eab308",
                    strokeWidth: 2,
                    dot: false,
                    name: "Dayzer Solar Error"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "caisoWindError",
                    stroke: "#14b8a6",
                    strokeWidth: 2,
                    dot: false,
                    name: "CAISO Wind Error"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "caisoSolarError",
                    stroke: "#f97316",
                    strokeWidth: 2,
                    dot: false,
                    name: "CAISO Solar Error"
                  }
                )
              ]
            }
          ) }) })
        ] })
      ] })
    ] })
  ] });
}

function CombinedRenewablesChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState(2e4);
  const [yAxisMin, setYAxisMin] = useState(0);
  const [viewMode, setViewMode] = useState("full");
  const [showAccuracy, setShowAccuracy] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState(null);
  const colorOptions = [
    "#3b82f6",
    // Blue
    "#ef4444",
    // Red  
    "#22c55e",
    // Green
    "#f59e0b",
    // Amber
    "#8b5cf6",
    // Violet
    "#ec4899",
    // Pink
    "#06b6d4",
    // Cyan
    "#84cc16",
    // Lime
    "#f97316",
    // Orange
    "#6366f1",
    // Indigo
    "#14b8a6",
    // Teal
    "#f43f5e",
    // Rose
    "#a855f7",
    // Purple
    "#eab308",
    // Yellow
    "#6b7280",
    // Gray
    "#1f2937"
    // Dark Gray
  ];
  const styleOptions = [
    { value: "solid", label: "Solid", dashArray: "" },
    { value: "dashed", label: "Dashed", dashArray: "5 5" },
    { value: "dotted", label: "Dotted", dashArray: "2 2" }
  ];
  const [visibleLines, setVisibleLines] = useState({
    dayzerWind: true,
    dayzerSolar: true,
    dayzerWindT1: false,
    dayzerSolarT1: false,
    caisoWind: true,
    caisoSolar: true,
    rtWind: true,
    rtSolar: true
  });
  const [lineCustomization, setLineCustomization] = useState({
    dayzerWind: { color: "#ef4444", style: "solid" },
    // Red
    dayzerSolar: { color: "#f97316", style: "solid" },
    // Orange
    dayzerWindT1: { color: "#b91c1c", style: "solid" },
    // Dark Red
    dayzerSolarT1: { color: "#c2410c", style: "solid" },
    // Dark Orange
    caisoWind: { color: "#3b82f6", style: "solid" },
    // Blue
    caisoSolar: { color: "#22c55e", style: "solid" },
    // Green
    rtWind: { color: "#8b5cf6", style: "solid" },
    // Violet
    rtSolar: { color: "#ec4899", style: "solid" }
    // Pink
  });
  const toggleLine = (lineKey) => {
    const newVisibleLines = {
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    };
    setVisibleLines(newVisibleLines);
    if (data.length > 0) {
      const visibleValues = [];
      data.forEach((point) => {
        if (newVisibleLines.dayzerWind) {
          if (point.dayzerWindLastWeek) visibleValues.push(point.dayzerWindLastWeek);
          if (point.dayzerWindForecast) visibleValues.push(point.dayzerWindForecast);
        }
        if (newVisibleLines.dayzerSolar) {
          if (point.dayzerSolarLastWeek) visibleValues.push(point.dayzerSolarLastWeek);
          if (point.dayzerSolarForecast) visibleValues.push(point.dayzerSolarForecast);
        }
        if (newVisibleLines.dayzerWindT1) {
          if (point.dayzerWindT1LastWeek) visibleValues.push(point.dayzerWindT1LastWeek);
        }
        if (newVisibleLines.dayzerSolarT1) {
          if (point.dayzerSolarT1LastWeek) visibleValues.push(point.dayzerSolarT1LastWeek);
        }
        if (newVisibleLines.caisoWind) {
          if (point.caisoWindLastWeek) visibleValues.push(point.caisoWindLastWeek);
          if (point.caisoWindForecast) visibleValues.push(point.caisoWindForecast);
        }
        if (newVisibleLines.caisoSolar) {
          if (point.caisoSolarLastWeek) visibleValues.push(point.caisoSolarLastWeek);
          if (point.caisoSolarForecast) visibleValues.push(point.caisoSolarForecast);
        }
        if (newVisibleLines.rtWind) {
          if (point.rtWindLastWeek) visibleValues.push(point.rtWindLastWeek);
        }
        if (newVisibleLines.rtSolar) {
          if (point.rtSolarLastWeek) visibleValues.push(point.rtSolarLastWeek);
        }
      });
      if (visibleValues.length > 0) {
        const min = Math.min(...visibleValues);
        const max = Math.max(...visibleValues);
        const padding = (max - min) * 0.1;
        setYAxisMin(Math.floor(min - padding));
        setYAxisMax(Math.ceil(max + padding));
      }
    }
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching renewables with scenarios:", { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });
      const forecastUrl = currentWeekScenarioId ? `/api/renewables-forecast?scenarioId=${currentWeekScenarioId}` : "/api/renewables-forecast";
      const lastWeekUrl = lastWeekScenarioId ? `/api/renewables-last-week-forecast?scenarioId=${lastWeekScenarioId}` : "/api/renewables-last-week-forecast";
      console.log("Renewables API URLs:", { forecastUrl, lastWeekUrl });
      console.log("Fetching renewables forecast and last week data separately...");
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
      console.log("Renewables Forecast data:", forecastData);
      console.log("Renewables Last week data:", lastWeekData);
      const combinedData = [];
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point) => {
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
            rtSolarLastWeek: point.rtSolar
          });
        });
      }
      if (forecastData.data) {
        forecastData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            dayzerWindForecast: point.dayzerWind,
            dayzerSolarForecast: point.dayzerSolar,
            caisoWindForecast: point.caisoWind,
            caisoSolarForecast: point.caisoSolar
          });
        });
      }
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));
      console.log("Combined renewables data points:", combinedData.length);
      if (combinedData.length > 0) {
        console.log("Sample combined renewables data point:", combinedData[0]);
        console.log("Data keys in first point:", Object.keys(combinedData[0]));
      }
      setData(combinedData);
      if (combinedData.length > 0) {
        const allValues = [];
        combinedData.forEach((point) => {
          if (visibleLines.dayzerWind) {
            if (point.dayzerWindLastWeek) allValues.push(point.dayzerWindLastWeek);
            if (point.dayzerWindForecast) allValues.push(point.dayzerWindForecast);
          }
          if (visibleLines.dayzerSolar) {
            if (point.dayzerSolarLastWeek) allValues.push(point.dayzerSolarLastWeek);
            if (point.dayzerSolarForecast) allValues.push(point.dayzerSolarForecast);
          }
          if (visibleLines.dayzerWindT1 && point.dayzerWindT1LastWeek) allValues.push(point.dayzerWindT1LastWeek);
          if (visibleLines.dayzerSolarT1 && point.dayzerSolarT1LastWeek) allValues.push(point.dayzerSolarT1LastWeek);
          if (visibleLines.caisoWind) {
            if (point.caisoWindLastWeek) allValues.push(point.caisoWindLastWeek);
            if (point.caisoWindForecast) allValues.push(point.caisoWindForecast);
          }
          if (visibleLines.caisoSolar) {
            if (point.caisoSolarLastWeek) allValues.push(point.caisoSolarLastWeek);
            if (point.caisoSolarForecast) allValues.push(point.caisoSolarForecast);
          }
          if (visibleLines.rtWind && point.rtWindLastWeek) allValues.push(point.rtWindLastWeek);
          if (visibleLines.rtSolar && point.rtSolarLastWeek) allValues.push(point.rtSolarLastWeek);
        });
        if (allValues.length > 0) {
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const padding = (max - min) * 0.1;
          setYAxisMin(Math.floor(min - padding));
          setYAxisMax(Math.ceil(max + padding));
          console.log("Renewables chart auto-scaled Y-axis:", { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
        }
      }
      setMetadata({
        lastWeekScenario: lastWeekData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        forecastScenario: forecastData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        lastWeekDateRange: lastWeekData.metadata?.dateRange || { start: "", end: "" },
        forecastDateRange: forecastData.metadata?.dateRange || { start: "", end: "" },
        dataPoints: {
          lastWeek: lastWeekData.data?.length || 0,
          forecast: forecastData.data?.length || 0,
          combined: combinedData.length
        }
      });
    } catch (err) {
      console.error("Combined renewables data error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch combined renewables data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScenarioChange = (event) => {
      console.log("Renewables chart received scenario change:", event.detail);
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
    };
    window.addEventListener("scenarioChanged", handleScenarioChange);
    return () => window.removeEventListener("scenarioChanged", handleScenarioChange);
  }, []);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);
  const copyChartAsImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const chartContainer = document.querySelector(".combined-renewables-chart-container");
      if (!chartContainer) {
        throw new Error("Chart container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("Renewables chart copied to clipboard");
          } catch (err) {
            console.error("Failed to copy renewables chart to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying renewables chart:", error2);
    } finally {
      setCopying(false);
    }
  };
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);
    try {
      const toggleContainer = document.querySelector(".renewables-toggle-lines-section");
      if (!toggleContainer) {
        throw new Error("Toggle lines container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(toggleContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("Renewables legend copied to clipboard");
          } catch (err) {
            console.error("Failed to copy renewables legend to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying renewables legend:", error2);
    } finally {
      setCopyingLegend(false);
    }
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const datetime = new Date(label);
      const formattedDate = datetime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const formattedTime = datetime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-300 rounded shadow-lg", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-800 mb-2", children: [
          formattedDate,
          " at ",
          formattedTime
        ] }),
        payload.filter((entry) => entry.value !== null && entry.value !== void 0).map((entry, index) => /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
          entry.name,
          ": ",
          entry.value.toLocaleString(),
          " MW"
        ] }, index))
      ] });
    }
    return null;
  };
  const formatYAxisTick = (value) => {
    return `${value.toLocaleString()}`;
  };
  const generateYAxisTicks = () => {
    const roundedMin = Math.floor(yAxisMin / 5e3) * 5e3;
    const roundedMax = Math.ceil(yAxisMax / 5e3) * 5e3;
    const ticks = [];
    for (let tick = roundedMin; tick <= roundedMax; tick += 5e3) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };
  const lastWeekEndIndex = data.findIndex((d) => !d.isLastWeek);
  const lastWeekEndDate = lastWeekEndIndex > 0 ? data[lastWeekEndIndex - 1]?.datetime : null;
  const forecastStartDate = lastWeekEndIndex >= 0 ? data[lastWeekEndIndex]?.datetime : null;
  const filteredData = data.filter((d) => {
    if (viewMode === "full") return true;
    if (viewMode === "lastWeek") return d.isLastWeek;
    if (viewMode === "forecast") return !d.isLastWeek;
    return true;
  });
  const showGreyBackground = viewMode === "full" || viewMode === "lastWeek";
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading combined renewables data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error loading combined renewables data: ",
      error
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowAccuracy(!showAccuracy),
          className: "px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }),
            showAccuracy ? "Hide" : "Show",
            " Renewable Forecast Accuracy"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyChartAsImage,
            disabled: copying,
            className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" }) }),
              "Copy Chart"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyLegendAsImage,
            disabled: copyingLegend,
            className: "px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copyingLegend ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
              "Copy Legend"
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "View:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex rounded-lg border border-gray-300 overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("full"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "full" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Full"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("lastWeek"),
                className: `px-3 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${viewMode === "lastWeek" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Last Week"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("forecast"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "forecast" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Forecast"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Min:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "-5000",
              max: "15000",
              step: "1000",
              value: yAxisMin,
              onChange: (e) => setYAxisMin(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            yAxisMin.toLocaleString(),
            " MW"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Max:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "10000",
              max: "40000",
              step: "1000",
              value: yAxisMax,
              onChange: (e) => setYAxisMax(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            yAxisMax.toLocaleString(),
            " MW"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-gray-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCustomization(!showCustomization),
              className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors",
              children: [
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: `w-4 h-4 transition-transform ${showCustomization ? "rotate-90" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                  }
                ),
                "Customize Lines"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setVisibleLines({
                dayzerWind: false,
                dayzerSolar: false,
                dayzerWindT1: false,
                dayzerSolarT1: false,
                caisoWind: false,
                caisoSolar: false,
                rtWind: false,
                rtSolar: false
              }),
              className: "px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors",
              children: "Remove All"
            }
          )
        ] }),
        showCustomization && /* @__PURE__ */ jsx("div", { className: "renewables-toggle-lines-section grid grid-cols-1 gap-2", children: Object.entries(visibleLines).map(([lineKey, isVisible]) => {
          const customization = lineCustomization[lineKey];
          let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          if (lineKey === "dayzerWind") lineName = "Dayzer Wind";
          if (lineKey === "dayzerSolar") lineName = "Dayzer Solar";
          if (lineKey === "dayzerWindT1") lineName = "Dayzer Wind t-1";
          if (lineKey === "dayzerSolarT1") lineName = "Dayzer Solar t-1";
          if (lineKey === "caisoWind") lineName = "CAISO Wind";
          if (lineKey === "caisoSolar") lineName = "CAISO Solar";
          if (lineKey === "rtWind") lineName = "RT Wind";
          if (lineKey === "rtSolar") lineName = "RT Solar";
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-md p-3 bg-white shadow-sm",
              style: {
                border: `2px ${customization.style === "solid" ? "solid" : customization.style === "dashed" ? "dashed" : "dotted"} ${isVisible ? customization.color : "#d1d5db"}`
              },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[160px]", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isVisible,
                      onChange: () => toggleLine(lineKey),
                      className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-700", children: lineName })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      value: customization.style,
                      onChange: (e) => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], style: e.target.value }
                      })),
                      className: "text-sm border border-gray-300 rounded px-3 py-1 w-24",
                      children: styleOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: colorOptions.map((color) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], color }
                      })),
                      className: `w-4 h-4 rounded border ${customization.color === color ? "border-gray-800 border-2" : "border-gray-300"}`,
                      style: { backgroundColor: color },
                      title: color
                    },
                    color
                  )) })
                ] })
              ] })
            },
            lineKey
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "combined-renewables-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800", children: "Renewables Forecast" }) }),
      /* @__PURE__ */ jsx("div", { className: "h-[500px] relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: filteredData, margin: { top: 20, right: 30, left: 20, bottom: 60 }, children: [
        /* @__PURE__ */ jsx(
          CartesianGrid,
          {
            strokeDasharray: "3 3",
            stroke: "#e5e7eb",
            horizontal: true,
            vertical: true
          }
        ),
        showGreyBackground && lastWeekEndDate && forecastStartDate && /* @__PURE__ */ jsx(
          ReferenceArea,
          {
            x1: filteredData[0]?.datetime,
            x2: lastWeekEndDate,
            fill: "#e5e7eb",
            fillOpacity: 0.5
          }
        ),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "datetime",
            tickFormatter: (tickItem) => {
              const date = new Date(tickItem);
              const hour = date.getHours();
              if (hour === 0) {
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                });
              }
              return "";
            },
            stroke: "#6b7280",
            fontSize: 12,
            height: 40,
            interval: 23,
            axisLine: true,
            tickLine: true
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            stroke: "#6b7280",
            fontSize: 12,
            tickFormatter: formatYAxisTick,
            domain: [yAxisMin, yAxisMax],
            ticks: generateYAxisTicks(),
            label: { value: "Generation (MW)", angle: -90, position: "insideLeft" }
          }
        ),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerWindLastWeek",
            stroke: lineCustomization.dayzerWind.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerWind.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Wind Forecast",
            connectNulls: false,
            hide: !visibleLines.dayzerWind
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerWindForecast",
            stroke: lineCustomization.dayzerWind.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerWind.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Wind Forecast",
            connectNulls: false,
            hide: !visibleLines.dayzerWind
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerWindT1LastWeek",
            stroke: lineCustomization.dayzerWindT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerWindT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Wind t-1",
            connectNulls: false,
            hide: !visibleLines.dayzerWindT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerSolarLastWeek",
            stroke: lineCustomization.dayzerSolar.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerSolar.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Solar Forecast",
            connectNulls: false,
            hide: !visibleLines.dayzerSolar
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerSolarForecast",
            stroke: lineCustomization.dayzerSolar.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerSolar.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Solar Forecast",
            connectNulls: false,
            hide: !visibleLines.dayzerSolar
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "dayzerSolarT1LastWeek",
            stroke: lineCustomization.dayzerSolarT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.dayzerSolarT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Solar t-1",
            connectNulls: false,
            hide: !visibleLines.dayzerSolarT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "caisoWindLastWeek",
            stroke: lineCustomization.caisoWind.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoWind.style)?.dashArray || "",
            dot: false,
            name: "CAISO Wind Forecast",
            connectNulls: false,
            hide: !visibleLines.caisoWind
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "caisoWindForecast",
            stroke: lineCustomization.caisoWind.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoWind.style)?.dashArray || "",
            dot: false,
            name: "CAISO Wind Forecast",
            connectNulls: false,
            hide: !visibleLines.caisoWind
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "caisoSolarLastWeek",
            stroke: lineCustomization.caisoSolar.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoSolar.style)?.dashArray || "",
            dot: false,
            name: "CAISO Solar Forecast",
            connectNulls: false,
            hide: !visibleLines.caisoSolar
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "caisoSolarForecast",
            stroke: lineCustomization.caisoSolar.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.caisoSolar.style)?.dashArray || "",
            dot: false,
            name: "CAISO Solar Forecast",
            connectNulls: false,
            hide: !visibleLines.caisoSolar
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "rtWindLastWeek",
            stroke: lineCustomization.rtWind.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.rtWind.style)?.dashArray || "",
            dot: false,
            name: "RT Wind Actuals",
            connectNulls: false,
            hide: !visibleLines.rtWind
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "rtSolarLastWeek",
            stroke: lineCustomization.rtSolar.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.rtSolar.style)?.dashArray || "",
            dot: false,
            name: "RT Solar Actuals",
            connectNulls: false,
            hide: !visibleLines.rtSolar
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: Object.entries(visibleLines).filter(([_, isVisible]) => isVisible).map(([lineKey, _]) => {
        const customization = lineCustomization[lineKey];
        let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        if (lineKey === "dayzerWind") lineName = "Dayzer Wind";
        if (lineKey === "dayzerSolar") lineName = "Dayzer Solar";
        if (lineKey === "dayzerWindT1") lineName = "Dayzer Wind t-1";
        if (lineKey === "dayzerSolarT1") lineName = "Dayzer Solar t-1";
        if (lineKey === "caisoWind") lineName = "CAISO Wind";
        if (lineKey === "caisoSolar") lineName = "CAISO Solar";
        if (lineKey === "rtWind") lineName = "RT Wind";
        if (lineKey === "rtSolar") lineName = "RT Solar";
        const dashArray = styleOptions.find((s) => s.value === customization.style)?.dashArray || "";
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("svg", { width: "35", height: "4", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
            "line",
            {
              x1: "0",
              y1: "2",
              x2: "35",
              y2: "2",
              stroke: customization.color,
              strokeWidth: "3",
              strokeDasharray: dashArray
            }
          ) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 font-medium", children: lineName })
        ] }, lineKey);
      }) }) }) })
    ] }),
    showAccuracy && /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-gray-200", children: /* @__PURE__ */ jsx(RenewableForecastAccuracy, {}) })
  ] });
}

function CombinedLMPChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [yAxisMax, setYAxisMax] = useState(100);
  const [yAxisMin, setYAxisMin] = useState(-20);
  const [viewMode, setViewMode] = useState("full");
  const [showCustomization, setShowCustomization] = useState(false);
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState(null);
  const colorOptions = [
    "#3b82f6",
    // Blue
    "#ef4444",
    // Red  
    "#22c55e",
    // Green
    "#f59e0b",
    // Amber
    "#8b5cf6",
    // Violet
    "#ec4899",
    // Pink
    "#06b6d4",
    // Cyan
    "#84cc16",
    // Lime
    "#f97316",
    // Orange
    "#6366f1",
    // Indigo
    "#14b8a6",
    // Teal
    "#f43f5e",
    // Rose
    "#a855f7",
    // Purple
    "#eab308",
    // Yellow
    "#6b7280",
    // Gray
    "#1f2937"
    // Dark Gray
  ];
  const styleOptions = [
    { value: "solid", label: "Solid", dashArray: "" },
    { value: "dashed", label: "Dashed", dashArray: "5 5" },
    { value: "dotted", label: "Dotted", dashArray: "2 2" }
  ];
  const [visibleLines, setVisibleLines] = useState({
    energy: true,
    congestion: true,
    losses: true,
    lmp: true,
    energyT1: false,
    // New t-1 energy line
    congestionT1: false,
    // New t-1 congestion line
    lossesT1: false,
    // New t-1 losses line
    lmpT1: false,
    // New t-1 total LMP line
    // DA LMP components
    daLMP: false,
    daCongestion: false,
    daEnergy: false,
    daLoss: false,
    rtLMP: true
  });
  const [lineCustomization, setLineCustomization] = useState({
    energy: { color: "#3b82f6", style: "solid" },
    // Blue
    congestion: { color: "#ef4444", style: "solid" },
    // Red
    losses: { color: "#22c55e", style: "solid" },
    // Green
    lmp: { color: "#f59e0b", style: "solid" },
    // Amber
    energyT1: { color: "#1d4ed8", style: "solid" },
    // Dark Blue
    congestionT1: { color: "#b91c1c", style: "solid" },
    // Dark Red
    lossesT1: { color: "#15803d", style: "solid" },
    // Dark Green
    lmpT1: { color: "#d97706", style: "solid" },
    // Dark Amber
    // DA LMP components
    daLMP: { color: "#8b5cf6", style: "dashed" },
    // Violet, dashed
    daCongestion: { color: "#ec4899", style: "dashed" },
    // Pink, dashed
    daEnergy: { color: "#06b6d4", style: "dashed" },
    // Cyan, dashed
    daLoss: { color: "#84cc16", style: "dashed" },
    // Lime, dashed
    rtLMP: { color: "#6b7280", style: "solid" }
    // Gray
  });
  const toggleLine = (lineKey) => {
    const newVisibleLines = {
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    };
    setVisibleLines(newVisibleLines);
    if (data.length > 0) {
      const visibleValues = [];
      data.forEach((point) => {
        if (newVisibleLines.energy) {
          if (point.energyLastWeek) visibleValues.push(point.energyLastWeek);
          if (point.energyForecast) visibleValues.push(point.energyForecast);
        }
        if (newVisibleLines.congestion) {
          if (point.congestionLastWeek) visibleValues.push(point.congestionLastWeek);
          if (point.congestionForecast) visibleValues.push(point.congestionForecast);
        }
        if (newVisibleLines.losses) {
          if (point.lossesLastWeek) visibleValues.push(point.lossesLastWeek);
          if (point.lossesForecast) visibleValues.push(point.lossesForecast);
        }
        if (newVisibleLines.lmp) {
          if (point.lmpLastWeek) visibleValues.push(point.lmpLastWeek);
          if (point.lmpForecast) visibleValues.push(point.lmpForecast);
        }
        if (newVisibleLines.energyT1) {
          if (point.energyT1LastWeek) visibleValues.push(point.energyT1LastWeek);
        }
        if (newVisibleLines.congestionT1) {
          if (point.congestionT1LastWeek) visibleValues.push(point.congestionT1LastWeek);
        }
        if (newVisibleLines.lossesT1) {
          if (point.lossesT1LastWeek) visibleValues.push(point.lossesT1LastWeek);
        }
        if (newVisibleLines.lmpT1) {
          if (point.lmpT1LastWeek) visibleValues.push(point.lmpT1LastWeek);
        }
        if (newVisibleLines.daLMP) {
          if (point.daLMPLastWeek) visibleValues.push(point.daLMPLastWeek);
        }
        if (newVisibleLines.daCongestion) {
          if (point.daCongestionLastWeek) visibleValues.push(point.daCongestionLastWeek);
        }
        if (newVisibleLines.daEnergy) {
          if (point.daEnergyLastWeek) visibleValues.push(point.daEnergyLastWeek);
        }
        if (newVisibleLines.daLoss) {
          if (point.daLossLastWeek) visibleValues.push(point.daLossLastWeek);
        }
        if (newVisibleLines.rtLMP) {
          if (point.rtLMPLastWeek) visibleValues.push(point.rtLMPLastWeek);
        }
      });
      if (visibleValues.length > 0) {
        const min = Math.min(...visibleValues);
        const max = Math.max(...visibleValues);
        const padding = (max - min) * 0.1;
        setYAxisMin(Math.floor(min - padding));
        setYAxisMax(Math.ceil(max + padding));
      }
    }
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching LMP with scenarios:", { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });
      const forecastUrl = currentWeekScenarioId ? `/api/lmp-forecast?scenarioId=${currentWeekScenarioId}` : "/api/lmp-forecast";
      const lastWeekUrl = lastWeekScenarioId ? `/api/lmp-last-week-forecast?scenarioId=${lastWeekScenarioId}` : "/api/lmp-last-week-forecast";
      console.log("LMP API URLs:", { forecastUrl, lastWeekUrl });
      console.log("Fetching LMP forecast and last week data separately...");
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
      console.log("LMP Forecast data:", forecastData);
      console.log("LMP Last week data:", lastWeekData);
      const combinedData = [];
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point) => {
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
            rtLMPLastWeek: point.rtLMP
          });
        });
      }
      if (forecastData.data) {
        forecastData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            energyForecast: point.energy,
            congestionForecast: point.congestion,
            lossesForecast: point.losses,
            lmpForecast: point.lmp
          });
        });
      }
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));
      console.log("Combined LMP data points:", combinedData.length);
      if (combinedData.length > 0) {
        console.log("Sample combined LMP data point:", combinedData[0]);
        console.log("Data keys in first point:", Object.keys(combinedData[0]));
      }
      setData(combinedData);
      if (combinedData.length > 0) {
        const allValues = [];
        combinedData.forEach((point) => {
          if (visibleLines.energy) {
            if (point.energyLastWeek) allValues.push(point.energyLastWeek);
            if (point.energyForecast) allValues.push(point.energyForecast);
          }
          if (visibleLines.congestion) {
            if (point.congestionLastWeek) allValues.push(point.congestionLastWeek);
            if (point.congestionForecast) allValues.push(point.congestionForecast);
          }
          if (visibleLines.losses) {
            if (point.lossesLastWeek) allValues.push(point.lossesLastWeek);
            if (point.lossesForecast) allValues.push(point.lossesForecast);
          }
          if (visibleLines.lmp) {
            if (point.lmpLastWeek) allValues.push(point.lmpLastWeek);
            if (point.lmpForecast) allValues.push(point.lmpForecast);
          }
          if (visibleLines.energyT1 && point.energyT1LastWeek) allValues.push(point.energyT1LastWeek);
          if (visibleLines.congestionT1 && point.congestionT1LastWeek) allValues.push(point.congestionT1LastWeek);
          if (visibleLines.lossesT1 && point.lossesT1LastWeek) allValues.push(point.lossesT1LastWeek);
          if (visibleLines.lmpT1 && point.lmpT1LastWeek) allValues.push(point.lmpT1LastWeek);
          if (visibleLines.daLMP && point.daLMPLastWeek) allValues.push(point.daLMPLastWeek);
          if (visibleLines.daCongestion && point.daCongestionLastWeek) allValues.push(point.daCongestionLastWeek);
          if (visibleLines.daEnergy && point.daEnergyLastWeek) allValues.push(point.daEnergyLastWeek);
          if (visibleLines.daLoss && point.daLossLastWeek) allValues.push(point.daLossLastWeek);
          if (visibleLines.rtLMP && point.rtLMPLastWeek) allValues.push(point.rtLMPLastWeek);
        });
        if (allValues.length > 0) {
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const padding = (max - min) * 0.1;
          setYAxisMin(Math.floor(min - padding));
          setYAxisMax(Math.ceil(max + padding));
          console.log("LMP chart auto-scaled Y-axis:", { min, max, yAxisMin: Math.floor(min - padding), yAxisMax: Math.ceil(max + padding) });
        }
      }
      setMetadata({
        lastWeekScenario: lastWeekData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        forecastScenario: forecastData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        lastWeekDateRange: lastWeekData.metadata?.dateRange || { start: "", end: "" },
        forecastDateRange: forecastData.metadata?.dateRange || { start: "", end: "" },
        dataPoints: {
          lastWeek: lastWeekData.data?.length || 0,
          forecast: forecastData.data?.length || 0,
          combined: combinedData.length
        }
      });
    } catch (err) {
      console.error("Combined LMP data error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch combined LMP data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScenarioChange = (event) => {
      console.log("LMP chart received scenario change:", event.detail);
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
    };
    window.addEventListener("scenarioChanged", handleScenarioChange);
    return () => window.removeEventListener("scenarioChanged", handleScenarioChange);
  }, []);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);
  const copyChartAsImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const chartContainer = document.querySelector(".combined-lmp-chart-container");
      if (!chartContainer) {
        throw new Error("Chart container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("LMP chart copied to clipboard");
          } catch (err) {
            console.error("Failed to copy LMP chart to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying LMP chart:", error2);
    } finally {
      setCopying(false);
    }
  };
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);
    try {
      const toggleContainer = document.querySelector(".lmp-toggle-lines-section");
      if (!toggleContainer) {
        throw new Error("Toggle lines container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(toggleContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("LMP legend copied to clipboard");
          } catch (err) {
            console.error("Failed to copy LMP legend to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying LMP legend:", error2);
    } finally {
      setCopyingLegend(false);
    }
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const datetime = new Date(label);
      const formattedDate = datetime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const formattedTime = datetime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-300 rounded shadow-lg", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-800 mb-2", children: [
          formattedDate,
          " at ",
          formattedTime
        ] }),
        payload.filter((entry) => entry.value !== null && entry.value !== void 0 && entry.name !== "Zero Line").map((entry, index) => /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
          entry.name,
          ": $",
          entry.value.toFixed(2),
          "/MWh"
        ] }, index))
      ] });
    }
    return null;
  };
  const lastWeekEndIndex = data.findIndex((d) => !d.isLastWeek);
  const lastWeekEndDate = lastWeekEndIndex > 0 ? data[lastWeekEndIndex - 1]?.datetime : null;
  const forecastStartDate = lastWeekEndIndex >= 0 ? data[lastWeekEndIndex]?.datetime : null;
  const filteredData = data.filter((d) => {
    if (viewMode === "full") return true;
    if (viewMode === "lastWeek") return d.isLastWeek;
    if (viewMode === "forecast") return !d.isLastWeek;
    return true;
  });
  const showGreyBackground = viewMode === "full" || viewMode === "lastWeek";
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading combined LMP data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error loading combined LMP data: ",
      error
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyChartAsImage,
            disabled: copying,
            className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" }) }),
              "Copy Chart"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyLegendAsImage,
            disabled: copyingLegend,
            className: "px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copyingLegend ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
              "Copy Legend"
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "View:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex rounded-lg border border-gray-300 overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("full"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "full" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Full"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("lastWeek"),
                className: `px-3 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${viewMode === "lastWeek" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Last Week"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("forecast"),
                className: `px-3 py-1 text-xs font-medium transition-colors ${viewMode === "forecast" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Forecast"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Min:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "-100",
              max: "50",
              step: "10",
              value: yAxisMin,
              onChange: (e) => setYAxisMin(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            "$",
            yAxisMin,
            "/MWh"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Y-Axis Max:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "50",
              max: "300",
              step: "10",
              value: yAxisMax,
              onChange: (e) => setYAxisMax(parseInt(e.target.value)),
              className: "w-32"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 min-w-[80px]", children: [
            "$",
            yAxisMax,
            "/MWh"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-gray-300", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCustomization(!showCustomization),
              className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors",
              children: [
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: `w-4 h-4 transition-transform ${showCustomization ? "rotate-90" : ""}`,
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                  }
                ),
                "Customize Lines"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setVisibleLines({
                energy: false,
                congestion: false,
                losses: false,
                lmp: false,
                energyT1: false,
                congestionT1: false,
                lossesT1: false,
                lmpT1: false,
                daLMP: false,
                daCongestion: false,
                daEnergy: false,
                daLoss: false,
                rtLMP: false
              }),
              className: "px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-lg transition-colors",
              children: "Remove All"
            }
          )
        ] }),
        showCustomization && /* @__PURE__ */ jsx("div", { className: "lmp-toggle-lines-section grid grid-cols-1 gap-2", children: Object.entries(visibleLines).map(([lineKey, isVisible]) => {
          const customization = lineCustomization[lineKey];
          let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          if (lineKey === "energy") lineName = "Dayzer Energy";
          if (lineKey === "congestion") lineName = "Dayzer Congestion";
          if (lineKey === "losses") lineName = "Dayzer Loss";
          if (lineKey === "lmp") lineName = "Dayzer LMP";
          if (lineKey === "energyT1") lineName = "Dayzer Energy t-1";
          if (lineKey === "congestionT1") lineName = "Dayzer Congestion t-1";
          if (lineKey === "lossesT1") lineName = "Dayzer Loss t-1";
          if (lineKey === "lmpT1") lineName = "Dayzer LMP t-1";
          if (lineKey === "daLMP") lineName = "DA LMP";
          if (lineKey === "daCongestion") lineName = "DA Congestion";
          if (lineKey === "daEnergy") lineName = "DA Energy";
          if (lineKey === "daLoss") lineName = "DA Loss";
          if (lineKey === "rtLMP") lineName = "RT LMP";
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-md p-3 bg-white shadow-sm",
              style: {
                border: `2px ${customization.style === "solid" ? "solid" : customization.style === "dashed" ? "dashed" : "dotted"} ${isVisible ? customization.color : "#d1d5db"}`
              },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[160px]", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isVisible,
                      onChange: () => toggleLine(lineKey),
                      className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-700", children: lineName })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      value: customization.style,
                      onChange: (e) => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], style: e.target.value }
                      })),
                      className: "text-sm border border-gray-300 rounded px-3 py-1 w-24",
                      children: styleOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: colorOptions.map((color) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], color }
                      })),
                      className: `w-4 h-4 rounded border ${customization.color === color ? "border-gray-800 border-2" : "border-gray-300"}`,
                      style: { backgroundColor: color },
                      title: color
                    },
                    color
                  )) })
                ] })
              ] })
            },
            lineKey
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "combined-lmp-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800", children: "LMP Forecast" }) }),
      /* @__PURE__ */ jsx("div", { className: "h-[500px] relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: filteredData, margin: { top: 20, right: 30, left: 20, bottom: 60 }, children: [
        /* @__PURE__ */ jsx(
          CartesianGrid,
          {
            strokeDasharray: "3 3",
            stroke: "#e5e7eb",
            horizontal: true,
            vertical: true
          }
        ),
        showGreyBackground && lastWeekEndDate && forecastStartDate && /* @__PURE__ */ jsx(
          ReferenceArea,
          {
            x1: filteredData[0]?.datetime,
            x2: lastWeekEndDate,
            fill: "#e5e7eb",
            fillOpacity: 0.5
          }
        ),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "datetime",
            tickFormatter: (tickItem) => {
              const date = new Date(tickItem);
              const hour = date.getHours();
              if (hour === 0) {
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                });
              }
              return "";
            },
            stroke: "#6b7280",
            fontSize: 12,
            height: 40,
            interval: 23,
            axisLine: true,
            tickLine: true
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            stroke: "#6b7280",
            fontSize: 12,
            domain: [yAxisMin, yAxisMax],
            ticks: (() => {
              const roundedMin = Math.floor(yAxisMin / 5) * 5;
              const roundedMax = Math.ceil(yAxisMax / 5) * 5;
              const ticks = [];
              for (let tick = roundedMin; tick <= roundedMax; tick += 5) {
                ticks.push(tick);
              }
              return ticks;
            })(),
            label: { value: "$/MWh", angle: -90, position: "insideLeft" }
          }
        ),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: () => 0,
            stroke: "#000000",
            strokeWidth: 1,
            dot: false,
            connectNulls: true,
            name: "Zero Line"
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "energyLastWeek",
            stroke: lineCustomization.energy.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.energy.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Energy",
            connectNulls: false,
            hide: !visibleLines.energy
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "energyForecast",
            stroke: lineCustomization.energy.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.energy.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Energy",
            connectNulls: false,
            hide: !visibleLines.energy
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "energyT1LastWeek",
            stroke: lineCustomization.energyT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.energyT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Energy t-1",
            connectNulls: false,
            hide: !visibleLines.energyT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "congestionLastWeek",
            stroke: lineCustomization.congestion.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.congestion.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Congestion",
            connectNulls: false,
            hide: !visibleLines.congestion
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "congestionForecast",
            stroke: lineCustomization.congestion.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.congestion.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Congestion",
            connectNulls: false,
            hide: !visibleLines.congestion
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "congestionT1LastWeek",
            stroke: lineCustomization.congestionT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.congestionT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Congestion t-1",
            connectNulls: false,
            hide: !visibleLines.congestionT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lossesLastWeek",
            stroke: lineCustomization.losses.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.losses.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Loss",
            connectNulls: false,
            hide: !visibleLines.losses
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lossesForecast",
            stroke: lineCustomization.losses.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.losses.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Loss",
            connectNulls: false,
            hide: !visibleLines.losses
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lossesT1LastWeek",
            stroke: lineCustomization.lossesT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.lossesT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer Loss t-1",
            connectNulls: false,
            hide: !visibleLines.lossesT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lmpLastWeek",
            stroke: lineCustomization.lmp.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.lmp.style)?.dashArray || "",
            dot: false,
            name: "Dayzer LMP",
            connectNulls: false,
            hide: !visibleLines.lmp
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lmpForecast",
            stroke: lineCustomization.lmp.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.lmp.style)?.dashArray || "",
            dot: false,
            name: "Dayzer LMP",
            connectNulls: false,
            hide: !visibleLines.lmp
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "lmpT1LastWeek",
            stroke: lineCustomization.lmpT1.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.lmpT1.style)?.dashArray || "",
            dot: false,
            name: "Dayzer LMP t-1",
            connectNulls: false,
            hide: !visibleLines.lmpT1
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "daEnergyLastWeek",
            stroke: lineCustomization.daEnergy.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.daEnergy.style)?.dashArray || "",
            dot: false,
            name: "DA Energy",
            connectNulls: false,
            hide: !visibleLines.daEnergy
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "daCongestionLastWeek",
            stroke: lineCustomization.daCongestion.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.daCongestion.style)?.dashArray || "",
            dot: false,
            name: "DA Congestion",
            connectNulls: false,
            hide: !visibleLines.daCongestion
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "daLossLastWeek",
            stroke: lineCustomization.daLoss.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.daLoss.style)?.dashArray || "",
            dot: false,
            name: "DA Loss",
            connectNulls: false,
            hide: !visibleLines.daLoss
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "daLMPLastWeek",
            stroke: lineCustomization.daLMP.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.daLMP.style)?.dashArray || "",
            dot: false,
            name: "DA LMP",
            connectNulls: false,
            hide: !visibleLines.daLMP
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "stepAfter",
            dataKey: "rtLMPLastWeek",
            stroke: lineCustomization.rtLMP.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.rtLMP.style)?.dashArray || "",
            dot: false,
            name: "RT LMP",
            connectNulls: false,
            hide: !visibleLines.rtLMP
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: Object.entries(visibleLines).filter(([_, isVisible]) => isVisible).map(([lineKey, _]) => {
        const customization = lineCustomization[lineKey];
        let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        if (lineKey === "energy") lineName = "Dayzer Energy";
        if (lineKey === "congestion") lineName = "Dayzer Congestion";
        if (lineKey === "losses") lineName = "Dayzer Loss";
        if (lineKey === "lmp") lineName = "Dayzer LMP";
        if (lineKey === "energyT1") lineName = "Dayzer Energy t-1";
        if (lineKey === "congestionT1") lineName = "Dayzer Congestion t-1";
        if (lineKey === "lossesT1") lineName = "Dayzer Loss t-1";
        if (lineKey === "lmpT1") lineName = "Dayzer LMP t-1";
        if (lineKey === "daLMP") lineName = "DA LMP";
        if (lineKey === "daCongestion") lineName = "DA Congestion";
        if (lineKey === "daEnergy") lineName = "DA Energy";
        if (lineKey === "daLoss") lineName = "DA Loss";
        if (lineKey === "rtLMP") lineName = "RT LMP";
        const dashArray = styleOptions.find((s) => s.value === customization.style)?.dashArray || "";
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("svg", { width: "35", height: "4", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
            "line",
            {
              x1: "0",
              y1: "2",
              x2: "35",
              y2: "2",
              stroke: customization.color,
              strokeWidth: "3",
              strokeDasharray: dashArray
            }
          ) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 font-medium", children: lineName })
        ] }, lineKey);
      }) }) }) })
    ] })
  ] });
}

function CombinedWeatherChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyingLegend, setCopyingLegend] = useState(false);
  const [tempYAxisMax, setTempYAxisMax] = useState(100);
  const [tempYAxisMin, setTempYAxisMin] = useState(30);
  const [degreeYAxisMax, setDegreeYAxisMax] = useState(50);
  const [degreeYAxisMin, setDegreeYAxisMin] = useState(0);
  const [viewMode, setViewMode] = useState("full");
  const [showCustomization, setShowCustomization] = useState(false);
  const [currentWeekScenarioId, setCurrentWeekScenarioId] = useState(null);
  const [lastWeekScenarioId, setLastWeekScenarioId] = useState(null);
  const colorOptions = [
    "#3b82f6",
    // Blue
    "#ef4444",
    // Red  
    "#22c55e",
    // Green
    "#f59e0b",
    // Amber
    "#8b5cf6",
    // Violet
    "#ec4899",
    // Pink
    "#06b6d4",
    // Cyan
    "#84cc16",
    // Lime
    "#f97316",
    // Orange
    "#6366f1",
    // Indigo
    "#14b8a6",
    // Teal
    "#f43f5e",
    // Rose
    "#a855f7",
    // Purple
    "#eab308",
    // Yellow
    "#6b7280",
    // Gray
    "#1f2937"
    // Dark Gray
  ];
  const styleOptions = [
    { value: "solid", label: "Solid", dashArray: "" },
    { value: "dashed", label: "Dashed", dashArray: "5 5" },
    { value: "dotted", label: "Dotted", dashArray: "2 2" }
  ];
  const [visibleLines, setVisibleLines] = useState({
    temperatureForecast: true,
    temperatureActual: true,
    temperatureNormal: true,
    hdd: true,
    cdd: true
  });
  const [lineCustomization, setLineCustomization] = useState({
    temperatureForecast: { color: "#3b82f6", style: "solid" },
    // Blue
    temperatureActual: { color: "#ef4444", style: "solid" },
    // Red
    temperatureNormal: { color: "#22c55e", style: "solid" },
    // Green
    hdd: { color: "#8b5cf6", style: "solid" },
    // Violet
    cdd: { color: "#f59e0b", style: "solid" }
    // Amber
  });
  const toggleLine = (lineKey) => {
    const newVisibleLines = {
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    };
    setVisibleLines(newVisibleLines);
    if (data.length > 0) {
      const tempValues = [];
      if (newVisibleLines.temperatureForecast) {
        data.forEach((point) => {
          if (point.temperatureForecastLastWeek) tempValues.push(point.temperatureForecastLastWeek);
          if (point.temperatureForecastForecast) tempValues.push(point.temperatureForecastForecast);
        });
      }
      if (newVisibleLines.temperatureActual) {
        data.forEach((point) => {
          if (point.temperatureActualLastWeek) tempValues.push(point.temperatureActualLastWeek);
        });
      }
      if (newVisibleLines.temperatureNormal) {
        data.forEach((point) => {
          if (point.temperatureNormalLastWeek) tempValues.push(point.temperatureNormalLastWeek);
        });
      }
      const degreeValues = [];
      if (newVisibleLines.hdd) {
        data.forEach((point) => {
          if (point.hddLastWeek) degreeValues.push(point.hddLastWeek);
        });
      }
      if (newVisibleLines.cdd) {
        data.forEach((point) => {
          if (point.cddLastWeek) degreeValues.push(point.cddLastWeek);
        });
      }
      if (tempValues.length > 0) {
        const tempMin = Math.min(...tempValues);
        const tempMax = Math.max(...tempValues);
        const tempPadding = (tempMax - tempMin) * 0.1;
        setTempYAxisMin(Math.floor(tempMin - tempPadding));
        setTempYAxisMax(Math.ceil(tempMax + tempPadding));
      }
      if (degreeValues.length > 0) {
        const degreeMin = Math.min(...degreeValues);
        const degreeMax = Math.max(...degreeValues);
        const degreePadding = (degreeMax - degreeMin) * 0.1;
        setDegreeYAxisMin(Math.floor(degreeMin - degreePadding));
        setDegreeYAxisMax(Math.ceil(degreeMax + degreePadding));
      }
    }
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching weather with scenarios:", { currentWeekScenario: currentWeekScenarioId, lastWeekScenario: lastWeekScenarioId });
      const forecastUrl = currentWeekScenarioId ? `/api/weather-forecast?scenarioId=${currentWeekScenarioId}` : "/api/weather-forecast";
      const lastWeekUrl = lastWeekScenarioId ? `/api/weather-last-week-forecast?scenarioId=${lastWeekScenarioId}` : "/api/weather-last-week-forecast";
      console.log("Weather API URLs:", { forecastUrl, lastWeekUrl });
      console.log("Fetching weather forecast and last week data separately...");
      const [forecastResponse, lastWeekResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(lastWeekUrl)
      ]);
      console.log("Weather forecast response status:", forecastResponse.status);
      console.log("Weather last week response status:", lastWeekResponse.status);
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        throw new Error(`Weather Forecast API failed: ${forecastResponse.status} - ${errorText}`);
      }
      if (!lastWeekResponse.ok) {
        const errorText = await lastWeekResponse.text();
        throw new Error(`Weather Last Week API failed: ${lastWeekResponse.status} - ${errorText}`);
      }
      const forecastData = await forecastResponse.json();
      const lastWeekData = await lastWeekResponse.json();
      console.log("Weather Forecast data:", forecastData);
      console.log("Weather Last week data:", lastWeekData);
      console.log("Weather Forecast data points:", forecastData.data?.length || 0);
      console.log("Weather Last week data points:", lastWeekData.data?.length || 0);
      const combinedData = [];
      if (lastWeekData.data) {
        lastWeekData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: true,
            temperatureForecastLastWeek: point.temperatureForecast,
            temperatureActualLastWeek: point.temperatureActual,
            temperatureNormalLastWeek: point.temperatureNormal,
            hddLastWeek: point.hdd,
            cddLastWeek: point.cdd
          });
        });
      }
      if (forecastData.data) {
        forecastData.data.forEach((point) => {
          combinedData.push({
            datetime: point.datetime,
            isLastWeek: false,
            temperatureForecastForecast: point.temperatureForecast
          });
        });
      }
      combinedData.sort((a, b) => a.datetime.localeCompare(b.datetime));
      console.log("Combined weather data points:", combinedData.length);
      if (combinedData.length > 0) {
        console.log("Sample combined weather data point:", combinedData[0]);
        console.log("Data keys in first point:", Object.keys(combinedData[0]));
      }
      if (combinedData.length > 0) {
        const tempValues = combinedData.flatMap((point) => [
          point.temperatureActualLastWeek,
          point.temperatureNormalLastWeek,
          point.temperatureForecastForecast
        ].filter((v) => v !== null && v !== void 0));
        const degreeValues = combinedData.flatMap((point) => [
          point.hddLastWeek,
          point.cddLastWeek
        ].filter((v) => v !== null && v !== void 0));
        if (tempValues.length > 0) {
          const tempMin = Math.min(...tempValues);
          const tempMax = Math.max(...tempValues);
          const tempPadding = (tempMax - tempMin) * 0.1;
          setTempYAxisMin(Math.floor(tempMin - tempPadding));
          setTempYAxisMax(Math.ceil(tempMax + tempPadding));
        }
        if (degreeValues.length > 0) {
          const degreeMin = Math.min(...degreeValues);
          const degreeMax = Math.max(...degreeValues);
          const degreePadding = (degreeMax - degreeMin) * 0.1;
          setDegreeYAxisMin(Math.floor(degreeMin - degreePadding));
          setDegreeYAxisMax(Math.ceil(degreeMax + degreePadding));
        }
      }
      setData(combinedData);
      if (combinedData.length > 0) {
        const tempValues = [];
        const degreeValues = [];
        combinedData.forEach((point) => {
          if (visibleLines.temperatureForecast && point.temperatureForecastLastWeek) tempValues.push(point.temperatureForecastLastWeek);
          if (visibleLines.temperatureForecast && point.temperatureForecastForecast) tempValues.push(point.temperatureForecastForecast);
          if (visibleLines.temperatureActual && point.temperatureActualLastWeek) tempValues.push(point.temperatureActualLastWeek);
          if (visibleLines.temperatureNormal && point.temperatureNormalLastWeek) tempValues.push(point.temperatureNormalLastWeek);
          if (visibleLines.hdd && point.hddLastWeek) degreeValues.push(point.hddLastWeek);
          if (visibleLines.cdd && point.cddLastWeek) degreeValues.push(point.cddLastWeek);
        });
        if (tempValues.length > 0) {
          const min = Math.min(...tempValues);
          const max = Math.max(...tempValues);
          const padding = (max - min) * 0.1;
          setTempYAxisMin(Math.floor(min - padding));
          setTempYAxisMax(Math.ceil(max + padding));
          console.log("Weather chart auto-scaled Temperature Y-axis:", { min, max, tempYAxisMin: Math.floor(min - padding), tempYAxisMax: Math.ceil(max + padding) });
        }
        if (degreeValues.length > 0) {
          const min = Math.min(...degreeValues);
          const max = Math.max(...degreeValues);
          const padding = (max - min) * 0.1;
          setDegreeYAxisMin(Math.floor(min - padding));
          setDegreeYAxisMax(Math.ceil(max + padding));
          console.log("Weather chart auto-scaled Degree Days Y-axis:", { min, max, degreeYAxisMin: Math.floor(min - padding), degreeYAxisMax: Math.ceil(max + padding) });
        }
      }
      setMetadata({
        lastWeekScenario: lastWeekData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        forecastScenario: forecastData.metadata?.scenario || { scenarioid: 0, scenarioname: "Unknown" },
        lastWeekDateRange: lastWeekData.metadata?.dateRange || { start: "", end: "" },
        forecastDateRange: forecastData.metadata?.dateRange || { start: "", end: "" },
        dataPoints: {
          lastWeek: lastWeekData.data?.length || 0,
          forecast: forecastData.data?.length || 0,
          combined: combinedData.length
        }
      });
    } catch (err) {
      console.error("Combined weather data error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch combined weather data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    const handleScenarioChange = (event) => {
      console.log("Weather chart received scenario change:", event.detail);
      if (event.detail.currentWeekScenario) {
        setCurrentWeekScenarioId(event.detail.currentWeekScenario.toString());
      }
      if (event.detail.lastWeekScenario) {
        setLastWeekScenarioId(event.detail.lastWeekScenario.toString());
      }
    };
    window.addEventListener("scenarioChanged", handleScenarioChange);
    return () => window.removeEventListener("scenarioChanged", handleScenarioChange);
  }, []);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (currentWeekScenarioId || lastWeekScenarioId) {
      fetchData();
    }
  }, [currentWeekScenarioId, lastWeekScenarioId]);
  const copyChartAsImage = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const chartContainer = document.querySelector(".combined-weather-chart-container");
      if (!chartContainer) {
        throw new Error("Chart container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("Weather chart copied to clipboard");
          } catch (err) {
            console.error("Failed to copy weather chart to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying weather chart:", error2);
    } finally {
      setCopying(false);
    }
  };
  const copyLegendAsImage = async () => {
    if (copyingLegend) return;
    setCopyingLegend(true);
    try {
      const toggleContainer = document.querySelector(".weather-toggle-lines-section");
      if (!toggleContainer) {
        throw new Error("Toggle lines container not found");
      }
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(toggleContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            console.log("Weather legend copied to clipboard");
          } catch (err) {
            console.error("Failed to copy weather legend to clipboard:", err);
          }
        }
      });
    } catch (error2) {
      console.error("Error copying weather legend:", error2);
    } finally {
      setCopyingLegend(false);
    }
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const datetime = new Date(label);
      const formattedDate = datetime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const formattedTime = datetime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 border border-gray-300 rounded shadow-lg", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-800 mb-2", children: [
          formattedDate,
          " at ",
          formattedTime
        ] }),
        payload.filter((entry) => entry.value !== null && entry.value !== void 0).map((entry, index) => {
          const unit = entry.dataKey.includes("temperature") ? "°F" : entry.dataKey.includes("hdd") || entry.dataKey.includes("cdd") ? " degree-days" : "";
          return /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
            entry.name,
            ": ",
            entry.value.toFixed(1),
            unit
          ] }, index);
        })
      ] });
    }
    return null;
  };
  const formatXAxisTick = (tickItem) => {
    const date = new Date(tickItem);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };
  const formatTempYAxisTick = (value) => {
    return `${value}°F`;
  };
  const formatDegreeYAxisTick = (value) => {
    return `${value}`;
  };
  const generateTempYAxisTicks = () => {
    const min = Math.floor(tempYAxisMin / 5) * 5;
    const max = Math.ceil(tempYAxisMax / 5) * 5;
    const ticks = [];
    for (let tick = min; tick <= max; tick += 5) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };
  const generateDegreeYAxisTicks = () => {
    const min = Math.floor(degreeYAxisMin / 5) * 5;
    const max = Math.ceil(degreeYAxisMax / 5) * 5;
    const ticks = [];
    for (let tick = min; tick <= max; tick += 5) {
      ticks.push(tick);
    }
    return ticks.sort((a, b) => a - b);
  };
  const lastWeekEndIndex = data.findIndex((d) => !d.isLastWeek);
  const lastWeekEndDate = lastWeekEndIndex > 0 ? data[lastWeekEndIndex - 1]?.datetime : null;
  const forecastStartDate = lastWeekEndIndex >= 0 ? data[lastWeekEndIndex]?.datetime : null;
  const filteredData = data.filter((d) => {
    if (viewMode === "full") return true;
    if (viewMode === "lastWeek") return d.isLastWeek;
    if (viewMode === "forecast") return !d.isLastWeek;
    return true;
  });
  const showGreyBackground = viewMode === "full" || viewMode === "lastWeek";
  console.log("Grey background debug:");
  console.log("- lastWeekEndIndex:", lastWeekEndIndex);
  console.log("- lastWeekEndDate:", lastWeekEndDate);
  console.log("- forecastStartDate:", forecastStartDate);
  console.log("- showGreyBackground:", showGreyBackground);
  console.log("- filteredData length:", filteredData.length);
  if (filteredData.length > 0) {
    console.log("- first filtered data:", filteredData[0]?.datetime);
  }
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading combined weather data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-96 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error loading combined weather data: ",
      error
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyChartAsImage,
            disabled: copying,
            className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copying ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h8a2 2 0 002 2v8a2 2 0 002 2z" }) }),
              "Copy Chart"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyLegendAsImage,
            disabled: copyingLegend,
            className: "px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
            children: copyingLegend ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
              ] }),
              "Copying..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
              "Copy Legend"
            ] })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-5 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "View:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex rounded-lg border border-gray-300 overflow-hidden", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("full"),
                className: `px-2 py-1 text-xs font-medium transition-colors ${viewMode === "full" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Full"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("lastWeek"),
                className: `px-2 py-1 text-xs font-medium transition-colors border-l border-r border-gray-300 ${viewMode === "lastWeek" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Last Week"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewMode("forecast"),
                className: `px-2 py-1 text-xs font-medium transition-colors ${viewMode === "forecast" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`,
                children: "Forecast"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Temp Min:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "0",
              max: "80",
              step: "5",
              value: tempYAxisMin,
              onChange: (e) => setTempYAxisMin(parseInt(e.target.value)),
              className: "w-20"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-600", children: [
            tempYAxisMin,
            "°F"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Temp Max:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "70",
              max: "120",
              step: "5",
              value: tempYAxisMax,
              onChange: (e) => setTempYAxisMax(parseInt(e.target.value)),
              className: "w-20"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-600", children: [
            tempYAxisMax,
            "°F"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "DD Min:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "0",
              max: "20",
              step: "1",
              value: degreeYAxisMin,
              onChange: (e) => setDegreeYAxisMin(parseInt(e.target.value)),
              className: "w-20"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-600", children: degreeYAxisMin })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "DD Max:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "20",
              max: "100",
              step: "5",
              value: degreeYAxisMax,
              onChange: (e) => setDegreeYAxisMax(parseInt(e.target.value)),
              className: "w-20"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-600", children: degreeYAxisMax })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-gray-300", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-start mb-3", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowCustomization(!showCustomization),
            className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors",
            children: [
              /* @__PURE__ */ jsx(
                "svg",
                {
                  className: `w-4 h-4 transition-transform ${showCustomization ? "rotate-90" : ""}`,
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                }
              ),
              "Customize Lines"
            ]
          }
        ) }),
        showCustomization && /* @__PURE__ */ jsx("div", { className: "weather-toggle-lines-section grid grid-cols-1 gap-2", children: Object.entries(visibleLines).map(([lineKey, isVisible]) => {
          const customization = lineCustomization[lineKey];
          let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          if (lineKey === "hdd") lineName = "HDD";
          if (lineKey === "cdd") lineName = "CDD";
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-md p-3 bg-white shadow-sm",
              style: {
                border: `2px ${customization.style === "solid" ? "solid" : customization.style === "dashed" ? "dashed" : "dotted"} ${isVisible ? customization.color : "#d1d5db"}`
              },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[160px]", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isVisible,
                      onChange: () => toggleLine(lineKey),
                      className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-700", children: lineName })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      value: customization.style,
                      onChange: (e) => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], style: e.target.value }
                      })),
                      className: "text-sm border border-gray-300 rounded px-3 py-1 w-24",
                      children: styleOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: colorOptions.map((color) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setLineCustomization((prev) => ({
                        ...prev,
                        [lineKey]: { ...prev[lineKey], color }
                      })),
                      className: `w-4 h-4 rounded border ${customization.color === color ? "border-gray-800 border-2" : "border-gray-300"}`,
                      style: { backgroundColor: color },
                      title: color
                    },
                    color
                  )) })
                ] })
              ] })
            },
            lineKey
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "combined-weather-chart-container bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center mb-4", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800", children: "Weather Forecast" }) }),
      /* @__PURE__ */ jsx("div", { className: "h-[500px] relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: filteredData, margin: { top: 20, right: 60, left: 20, bottom: 60 }, children: [
        /* @__PURE__ */ jsx(
          CartesianGrid,
          {
            strokeDasharray: "3 3",
            stroke: "#e5e7eb",
            horizontal: true,
            vertical: true
          }
        ),
        showGreyBackground && lastWeekEndDate && forecastStartDate && /* @__PURE__ */ jsx(
          ReferenceArea,
          {
            x1: filteredData[0]?.datetime,
            x2: lastWeekEndDate,
            fill: "#e5e7eb",
            fillOpacity: 0.5
          }
        ),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "datetime",
            tickFormatter: formatXAxisTick,
            stroke: "#6b7280",
            fontSize: 12,
            height: 40,
            interval: 23,
            axisLine: true,
            tickLine: true
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            yAxisId: "temperature",
            stroke: "#6b7280",
            fontSize: 12,
            tickFormatter: formatTempYAxisTick,
            domain: [tempYAxisMin, tempYAxisMax],
            ticks: generateTempYAxisTicks(),
            label: { value: "Temperature (°F)", angle: -90, position: "insideLeft" }
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            yAxisId: "degreeDays",
            orientation: "right",
            stroke: "#6b7280",
            fontSize: 12,
            tickFormatter: formatDegreeYAxisTick,
            domain: [degreeYAxisMin, degreeYAxisMax],
            ticks: generateDegreeYAxisTicks(),
            label: { value: "Degree Days", angle: 90, position: "insideRight" }
          }
        ),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "temperature",
            type: "stepAfter",
            dataKey: "temperatureForecastLastWeek",
            stroke: lineCustomization.temperatureForecast.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.temperatureForecast.style)?.dashArray || "",
            dot: false,
            name: "Temperature Forecast",
            connectNulls: false,
            hide: !visibleLines.temperatureForecast
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "temperature",
            type: "stepAfter",
            dataKey: "temperatureForecastForecast",
            stroke: lineCustomization.temperatureForecast.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.temperatureForecast.style)?.dashArray || "",
            dot: false,
            name: "Temperature Forecast",
            connectNulls: false,
            hide: !visibleLines.temperatureForecast
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "temperature",
            type: "stepAfter",
            dataKey: "temperatureActualLastWeek",
            stroke: lineCustomization.temperatureActual.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.temperatureActual.style)?.dashArray || "",
            dot: false,
            name: "Temperature Actual",
            connectNulls: false,
            hide: !visibleLines.temperatureActual
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "temperature",
            type: "stepAfter",
            dataKey: "temperatureNormalLastWeek",
            stroke: lineCustomization.temperatureNormal.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.temperatureNormal.style)?.dashArray || "",
            dot: false,
            name: "Normal Temperature",
            connectNulls: false,
            hide: !visibleLines.temperatureNormal
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "degreeDays",
            type: "stepAfter",
            dataKey: "hddLastWeek",
            stroke: lineCustomization.hdd.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.hdd.style)?.dashArray || "",
            dot: false,
            name: "HDD",
            connectNulls: false,
            hide: !visibleLines.hdd
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            yAxisId: "degreeDays",
            type: "stepAfter",
            dataKey: "cddLastWeek",
            stroke: lineCustomization.cdd.color,
            strokeWidth: 2,
            strokeDasharray: styleOptions.find((s) => s.value === lineCustomization.cdd.style)?.dashArray || "",
            dot: false,
            name: "CDD",
            connectNulls: false,
            hide: !visibleLines.cdd
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: Object.entries(visibleLines).filter(([_, isVisible]) => isVisible).map(([lineKey, _]) => {
        const customization = lineCustomization[lineKey];
        let lineName = lineKey.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        if (lineKey === "temperatureForecast") lineName = "Temperature Forecast";
        if (lineKey === "temperatureActual") lineName = "Temperature Actual";
        if (lineKey === "temperatureNormal") lineName = "Normal Temperature";
        if (lineKey === "hdd") lineName = "HDD";
        if (lineKey === "cdd") lineName = "CDD";
        const dashArray = styleOptions.find((s) => s.value === customization.style)?.dashArray || "";
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("svg", { width: "35", height: "4", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
            "line",
            {
              x1: "0",
              y1: "2",
              x2: "35",
              y2: "2",
              stroke: customization.color,
              strokeWidth: "3",
              strokeDasharray: dashArray
            }
          ) }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 font-medium", children: lineName })
        ] }, lineKey);
      }) }) }) })
    ] })
  ] });
}

function ScenarioDatePicker({ onDateChange } = {}) {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(/* @__PURE__ */ new Date());
  useEffect(() => {
    console.log("📅 DATE PICKER COMPONENT MOUNTED");
    const fetchAvailableDates = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("📅 DATE PICKER: Fetching available dates...");
        const response = await fetch("/api/available-scenario-dates");
        if (!response.ok) {
          throw new Error(`Failed to fetch available dates: ${response.status}`);
        }
        const data = await response.json();
        console.log("Available dates received:", data);
        console.log("Available dates count:", data.availableDates?.length || 0);
        setAvailableDates(data.availableDates || []);
        const defaultDate = data.defaultDate || data.availableDates[0]?.date;
        if (defaultDate) {
          setSelectedDate(defaultDate);
          handleDateSelection(defaultDate, data.availableDates);
        }
      } catch (err) {
        console.error("Error fetching available dates:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch available dates");
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        setSelectedDate(today);
        if (onDateChange) {
          onDateChange(today, 0, null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableDates();
  }, []);
  const handleDateSelection = (dateStr, dates = availableDates) => {
    const futureWeekScenario = dates.find((d) => d.date === dateStr);
    if (!futureWeekScenario) return;
    const selectedDate2 = new Date(dateStr);
    const pastWeekDate = new Date(selectedDate2);
    pastWeekDate.setDate(selectedDate2.getDate() - 7);
    const pastWeekDateStr = pastWeekDate.toISOString().split("T")[0];
    const pastWeekScenario = dates.find((d) => d.date === pastWeekDateStr);
    console.log(`SELECTED: ${dateStr} → Future: ${futureWeekScenario.scenarioid}, Past: ${pastWeekScenario?.scenarioid || "None"}`);
    setSelectedDate(dateStr);
    setIsCalendarOpen(false);
    window.dispatchEvent(new CustomEvent("scenarioChanged", {
      detail: {
        selectedDate: dateStr,
        currentWeekScenario: futureWeekScenario.scenarioid,
        lastWeekScenario: pastWeekScenario?.scenarioid || null
      }
    }));
    if (onDateChange) {
      onDateChange(
        dateStr,
        futureWeekScenario.scenarioid,
        pastWeekScenario?.scenarioid || null
      );
    }
  };
  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek2 = firstDay.getDay();
    const grid = [];
    for (let i = 0; i < startDayOfWeek2; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split("T")[0];
      const currentDate = new Date(dateStr);
      const cutoffDate = /* @__PURE__ */ new Date("2025-09-16");
      const isAfterCutoff = currentDate > cutoffDate;
      const scenarioForDate = availableDates.find((d) => d.date === dateStr);
      if (scenarioForDate && isAfterCutoff) {
        grid.push(scenarioForDate);
      } else {
        grid.push({ dayNumber: day });
      }
    }
    return { grid, startDayOfWeek: startDayOfWeek2 };
  };
  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: "Loading available dates..." }) }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-red-600 font-medium mb-1", children: "Error loading scenario dates" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-red-500", children: error })
    ] }) });
  }
  const { grid: calendarGrid} = generateCalendarGrid();
  const selectedScenario = availableDates.find((d) => d.date === selectedDate);
  const currentMonthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
    selectedScenario && /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Forecast Scenario ID:" }),
        " ",
        selectedScenario.scenarioid
      ] }),
      selectedScenario.hasPreviousWeek && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Historical Scenario ID:" }),
        " ",
        availableDates.find((d) => {
          const selectedDate2 = new Date(selectedScenario.date);
          const pastWeekDate = new Date(selectedDate2);
          pastWeekDate.setDate(selectedDate2.getDate() - 7);
          return d.date === pastWeekDate.toISOString().split("T")[0];
        })?.scenarioid || "N/A"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600 mb-1", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Simulation Date:" }) }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            console.log("📅 CALENDAR BUTTON CLICKED");
            setIsCalendarOpen(!isCalendarOpen);
          },
          className: "bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center gap-2",
          children: [
            selectedDate ? formatDisplayDate(selectedDate) : "Select Date",
            /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) })
          ]
        }
      ),
      isCalendarOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-[280px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigateMonth("prev"),
              className: "text-gray-500 hover:text-gray-700 p-1",
              children: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
            }
          ),
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-700", children: currentMonthName }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => navigateMonth("next"),
                className: "text-gray-500 hover:text-gray-700 p-1",
                children: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsCalendarOpen(false),
                className: "text-gray-500 hover:text-gray-700 text-xs ml-2",
                children: "Close"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 text-center p-1 font-medium", children: day }, day)) }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1", children: calendarGrid.map((dateObj, index) => /* @__PURE__ */ jsx("div", { className: "aspect-square", children: dateObj && "date" in dateObj ? (
            // Selectable date with scenario
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDateSelection(dateObj.date),
                className: `w-full h-full text-xs rounded text-center transition-colors ${selectedDate === dateObj.date ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-blue-100"}`,
                children: new Date(dateObj.date).getDate()
              }
            )
          ) : dateObj && "dayNumber" in dateObj ? (
            // Non-selectable date (greyed out)
            /* @__PURE__ */ jsx("div", { className: "w-full h-full text-xs text-gray-300 text-center p-2 cursor-not-allowed", children: dateObj.dayNumber })
          ) : (
            // Empty cell (before month starts)
            /* @__PURE__ */ jsx("div", { className: "w-full h-full" })
          ) }, index)) })
        ] })
      ] })
    ] }),
    isCalendarOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40",
        onClick: () => setIsCalendarOpen(false)
      }
    )
  ] });
}

const $$WeeklyInsight = createComponent(($$result, $$props, $$slots) => {
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Weekly Insight", "pageTitle": "Short Term Outlook", "subNavLinks": subNavLinks }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="py-12 space-y-12"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <!-- Page Title --> ${renderComponent($$result2, "SectionHeader", SectionHeader, { "title": "Market Operations Outlook", "description": "Weekly forecast analysis and historical comparisons", "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/ui/SectionHeader", "client:component-export": "SectionHeader" })} <!-- Scenario Date Picker --> ${renderComponent($$result2, "ScenarioDatePicker", ScenarioDatePicker, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/ScenarioDatePicker.tsx", "client:component-export": "default" })} <div class="space-y-8"> <!-- Pricing Section Header --> <div class="flex items-center mb-6"> <div class="w-1 h-8 bg-gs-green-600 rounded-r mr-4"></div> <h2 class="text-3xl font-semibold text-gs-gray-900">Pricing</h2> </div> <!-- LMP Forecast Section --> <div class="bg-white border-l-4 border-gs-green-500 rounded-lg shadow-gs-sm p-8"> <!-- Combined LMP Forecast and Last Week --> <div class="space-y-6"> ${renderComponent($$result2, "CombinedLMPChart", CombinedLMPChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/CombinedLMPChart.tsx", "client:component-export": "default" })} </div> </div> <!-- Fundamentals Section Header --> <div class="flex items-center mb-6"> <div class="w-1 h-8 bg-gs-blue-600 rounded-r mr-4"></div> <h2 class="text-3xl font-semibold text-gs-gray-900">Fundamentals</h2> </div> <!-- Load Forecast Section --> <div class="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-8"> <!-- Combined Load Forecast and Last Week --> <div class="space-y-6"> ${renderComponent($$result2, "CombinedLoadChart", CombinedLoadChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/CombinedLoadChart.tsx", "client:component-export": "default" })} </div> </div> <!-- Renewables Forecast Section --> <div class="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-8"> <!-- Combined Renewables Forecast and Last Week --> <div class="space-y-6"> ${renderComponent($$result2, "CombinedRenewablesChart", CombinedRenewablesChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/CombinedRenewablesChart.tsx", "client:component-export": "default" })} </div> </div> <!-- Weather Section Header --> <div class="flex items-center mb-6"> <div class="w-1 h-8 bg-gs-amber-500 rounded-r mr-4"></div> <h2 class="text-3xl font-semibold text-gs-gray-900">Weather</h2> </div> <!-- Weather Section Content --> <div class="bg-white border-l-4 border-gs-amber-500 rounded-lg shadow-gs-sm p-8"> <!-- Combined Weather Forecast and Last Week --> <div class="space-y-6"> ${renderComponent($$result2, "CombinedWeatherChart", CombinedWeatherChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/CombinedWeatherChart.tsx", "client:component-export": "default" })} </div> </div> </div> </div> </div> ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/weekly-insight.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/weekly-insight.astro";
const $$url = "/short-term-outlook/weekly-insight";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$WeeklyInsight,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
