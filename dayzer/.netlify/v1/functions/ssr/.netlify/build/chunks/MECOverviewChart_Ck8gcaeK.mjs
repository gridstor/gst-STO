import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

function MECOverviewChart({ scenarioId } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching MCE overview data...");
        const apiUrl = scenarioId ? `${window.location.origin}/api/mec-overview?scenarioId=${scenarioId}` : `${window.location.origin}/api/mec-overview`;
        const response = await fetch(apiUrl);
        console.log("Response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`Failed to fetch MCE overview data: ${response.status} ${errorText}`);
        }
        const jsonData = await response.json();
        console.log("Received data:", jsonData);
        setData(jsonData.data);
      } catch (err) {
        console.error("API error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch MCE data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [scenarioId]);
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const topData = payload.find((p) => p.dataKey === "topHoursMEC");
      const bottomData = payload.find((p) => p.dataKey === "bottomHoursMEC");
      const dataPoint = data.find((d) => d.date === label);
      if (!dataPoint) return null;
      return /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 border border-gray-300 rounded shadow-lg max-w-sm text-left", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium mb-3", children: `Date: ${label}` }),
        topData && dataPoint.topHours && dataPoint.topHours.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-red-600 font-medium mb-2", children: [
            "Top 2 Hours: (Hour ",
            dataPoint.topHours.join(" & "),
            ") - $",
            topData.value.toFixed(2),
            "/MWh"
          ] }),
          dataPoint.topHoursDetails && dataPoint.topHoursDetails.map((unit, index) => /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700 ml-2", children: [
            "(",
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: unit.unittype }),
            ") ",
            unit.unitname
          ] }, index))
        ] }),
        bottomData && dataPoint.bottomHours && dataPoint.bottomHours.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-blue-600 font-medium mb-2", children: [
            "Bottom 2 Hours: (Hour ",
            dataPoint.bottomHours.join(" & "),
            ") - $",
            bottomData.value.toFixed(2),
            "/MWh"
          ] }),
          dataPoint.bottomHoursDetails && dataPoint.bottomHoursDetails.map((unit, index) => /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700 ml-2", children: [
            "(",
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: unit.unittype }),
            ") ",
            unit.unitname
          ] }, index))
        ] })
      ] });
    }
    return null;
  };
  const formatXAxisTick = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-80 text-gs-gray-500", children: /* @__PURE__ */ jsx("p", { children: "Loading MEC overview..." }) }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-80 text-gs-red-500", children: /* @__PURE__ */ jsxs("p", { children: [
      "Error: ",
      error
    ] }) }) });
  }
  const thisWeekData = data.filter((d) => !d.isLastWeek);
  const allValues = thisWeekData.flatMap((d) => [d.topHoursMEC, d.bottomHoursMEC]);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxValue - minValue) * 0.1;
  const yAxisDomain = [
    Math.max(0, Math.floor(minValue - padding)),
    Math.ceil(maxValue + padding)
  ];
  const generateYAxisTicks = () => {
    const ticks = [];
    const [minDomain, maxDomain] = yAxisDomain;
    const startTick = Math.floor(minDomain / 10) * 10;
    const endTick = Math.ceil(maxDomain / 10) * 10;
    for (let tick = startTick; tick <= endTick; tick += 10) {
      ticks.push(tick);
    }
    return ticks;
  };
  const yAxisTicks = generateYAxisTicks();
  const ChartContent = () => /* @__PURE__ */ jsx("div", { className: "w-full h-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 400, children: /* @__PURE__ */ jsxs(LineChart, { data: thisWeekData, margin: { top: 20, right: 20, left: 20, bottom: 20 }, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
    /* @__PURE__ */ jsx(
      XAxis,
      {
        dataKey: "date",
        tickFormatter: formatXAxisTick,
        stroke: "#6b7280",
        fontSize: 12
      }
    ),
    /* @__PURE__ */ jsx(
      YAxis,
      {
        domain: yAxisDomain,
        stroke: "#6b7280",
        fontSize: 12,
        tickFormatter: (value) => `$${value}`,
        ticks: yAxisTicks,
        label: {
          value: "$/MWh",
          angle: -90,
          position: "insideLeft",
          style: {
            textAnchor: "middle",
            fill: "#4B5563",
            fontSize: 12,
            fontWeight: 600
          }
        }
      }
    ),
    /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
    /* @__PURE__ */ jsx(
      Line,
      {
        type: "monotone",
        dataKey: "topHoursMEC",
        stroke: "#dc2626",
        strokeWidth: 2,
        dot: { fill: "#dc2626", strokeWidth: 2, r: 4 },
        activeDot: { r: 6 },
        name: "Top 2 Hours"
      }
    ),
    /* @__PURE__ */ jsx(
      Line,
      {
        type: "monotone",
        dataKey: "bottomHoursMEC",
        stroke: "#2563eb",
        strokeWidth: 2,
        dot: { fill: "#2563eb", strokeWidth: 2, r: 4 },
        activeDot: { r: 6 },
        name: "Bottom 2 Hours"
      }
    )
  ] }) }) });
  if (scenarioId === void 0) {
    return /* @__PURE__ */ jsxs(
      "a",
      {
        href: "/short-term-outlook/caiso-system#mec-overview",
        className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900", children: "This Week" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-0.5 bg-gs-red-600" }),
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600", children: "Top 2 Hours" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-0.5 bg-gs-blue-600" }),
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600", children: "Bottom 2 Hours" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(ChartContent, {})
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900", children: "This Week" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-0.5 bg-gs-red-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600", children: "Top 2 Hours" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-0.5 bg-gs-blue-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600", children: "Bottom 2 Hours" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ChartContent, {})
  ] });
}

export { MECOverviewChart as M };
