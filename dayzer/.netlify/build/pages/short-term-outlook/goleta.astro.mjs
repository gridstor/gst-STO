/* empty css                                    */
import { f as createComponent, n as renderComponent, r as renderTemplate, q as renderScript } from '../../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_W-IpgH_B.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import React, { useState, useEffect, useMemo } from 'react';
import { u as useScenario, S as ScenarioProvider, a as ScenarioInfo } from '../../chunks/ScenarioInfo_D_RzoEer.mjs';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from 'recharts';
export { renderers } from '../../renderers.mjs';

function InteractiveTB26Cards({ onPeriodSelect, selectedPeriod, showRestrictions, setShowRestrictions }) {
  const { selectedScenario } = useScenario();
  const [tb26Data, setTb26Data] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "interactive-tb26-animations";
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
    if (selectedScenario === void 0 || !selectedScenario) {
      return;
    }
    const fetchTB26 = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tb26-calculation?scenarioId=${selectedScenario.scenarioid}`);
        if (response.ok) {
          const data = await response.json();
          setTb26Data(data);
        }
      } catch (error) {
        console.error("Error fetching TB2.6 data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTB26();
  }, [selectedScenario]);
  const formatTB26Value = (value) => value?.toFixed(2) || "X.XX";
  React.useMemo(() => {
    if (tb26Data?.dateRanges?.thisWeek) {
      const startDate = tb26Data.dateRanges.thisWeek.split(" to ")[0];
      const date = new Date(startDate);
      return date.getMonth();
    }
    return (/* @__PURE__ */ new Date()).getMonth();
  }, [tb26Data]);
  const handleCardClick = (period) => {
    if (selectedPeriod === period) {
      onPeriodSelect(null);
    } else {
      onPeriodSelect(period);
    }
  };
  const getCardBorder = (period) => {
    if (period === "lastYear") return "border-gs-amber-500";
    if (period === "lastWeek") return "border-gs-red-500";
    if (period === "thisWeek") return "border-gs-blue-500";
    return "border-gs-gray-300";
  };
  const getCardClasses = (period) => {
    const isSelected = selectedPeriod === period;
    const baseClasses = `bg-white border-l-4 ${getCardBorder(period)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-300 p-6 cursor-pointer`;
    if (isSelected) {
      return `${baseClasses} ring-2 ring-blue-500 ring-offset-2 animate-slideInFromRight`;
    }
    return `${baseClasses} transform hover:scale-[1.02]`;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "text-center text-gs-gray-500", children: "Loading TB2.6 data..." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full min-w-0", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setShowRestrictions(!showRestrictions),
        className: "px-4 py-2 bg-gs-gray-100 hover:bg-gs-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
        children: [
          /* @__PURE__ */ jsx(
            "svg",
            {
              className: `w-4 h-4 transition-transform ${showRestrictions ? "rotate-90" : ""}`,
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
            }
          ),
          showRestrictions ? "Hide" : "Show",
          " Charging Restrictions"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: selectedPeriod ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
      (!selectedPeriod || selectedPeriod === "lastYear") && /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleCardClick("lastYear"),
          className: getCardClasses("lastYear"),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "Last Year" }),
                selectedPeriod === "lastYear" && /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-sm font-medium", children: "Selected" })
              ] }),
              tb26Data?.dateRanges?.lastYear && /* @__PURE__ */ jsx("p", { className: "text-xs text-gs-gray-500", children: tb26Data.dateRanges.lastYear })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold text-gs-gray-900 font-mono", children: [
                "$",
                formatTB26Value(tb26Data?.lastYear?.totalTB26)
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-gs-gray-500", children: "/kW-month" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Energy" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.lastYear?.energyTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Congestion" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.lastYear?.congestionTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] })
            ] })
          ]
        }
      ),
      (!selectedPeriod || selectedPeriod === "lastWeek") && /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleCardClick("lastWeek"),
          className: getCardClasses("lastWeek"),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "Last Week" }),
                selectedPeriod === "lastWeek" && /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-sm font-medium", children: "Selected" })
              ] }),
              tb26Data?.dateRanges?.lastWeek && /* @__PURE__ */ jsx("p", { className: "text-xs text-gs-gray-500", children: tb26Data.dateRanges.lastWeek })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold text-gs-gray-900 font-mono", children: [
                "$",
                formatTB26Value(tb26Data?.lastWeek?.totalTB26)
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-gs-gray-500", children: "/kW-month" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Energy" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.lastWeek?.energyTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Congestion" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.lastWeek?.congestionTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] })
            ] })
          ]
        }
      ),
      (!selectedPeriod || selectedPeriod === "thisWeek") && /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleCardClick("thisWeek"),
          className: getCardClasses("thisWeek"),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "This Week" }),
                selectedPeriod === "thisWeek" && /* @__PURE__ */ jsx("span", { className: "text-blue-600 text-sm font-medium", children: "Selected" })
              ] }),
              tb26Data?.dateRanges?.thisWeek && /* @__PURE__ */ jsx("p", { className: "text-xs text-gs-gray-500", children: tb26Data.dateRanges.thisWeek })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold text-gs-gray-900 font-mono", children: [
                "$",
                formatTB26Value(tb26Data?.thisWeek?.totalTB26)
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-gs-gray-500", children: "/kW-month" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Energy" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.thisWeek?.energyTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-t border-gs-gray-200", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gs-gray-600 uppercase tracking-wide", children: "Congestion" }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono font-medium text-gs-gray-900", children: [
                    "$",
                    formatTB26Value(tb26Data?.thisWeek?.congestionTB26)
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-gs-gray-500", children: "/kW-month" })
                ] })
              ] })
            ] })
          ]
        }
      )
    ] })
  ] });
}

function ChargingRestrictionsTable() {
  const { selectedScenario } = useScenario();
  const [currentMonthIndex, setCurrentMonthIndex] = useState((/* @__PURE__ */ new Date()).getMonth());
  useEffect(() => {
    if (selectedScenario?.simulation_date) {
      const date = new Date(selectedScenario.simulation_date);
      setCurrentMonthIndex(date.getMonth());
    }
  }, [selectedScenario]);
  return /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gs-gray-100", children: [
      /* @__PURE__ */ jsx("th", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700", children: "Time Period" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 0 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Jan" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 1 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Feb" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 2 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Mar" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 3 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Apr" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 4 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "May" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 5 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Jun" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 6 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Jul" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 7 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Aug" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 8 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Sep" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 9 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Oct" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 10 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Nov" }),
      /* @__PURE__ */ jsx("th", { className: `border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 11 ? "border-t-2 border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "Dec" })
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      /* @__PURE__ */ jsxs("tr", { className: "bg-blue-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "1 AM - 7 AM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "39.9" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "40.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "33.9" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "29.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "37.1" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "45.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "37.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "36.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "34.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "41.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "40.1" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "42.3" })
      ] }),
      /* @__PURE__ */ jsxs("tr", { className: "bg-white", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "7 AM - 10 AM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "2.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "4.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "15.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "25.5" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "19.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "3.5" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "1.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "2.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "5.2" })
      ] }),
      /* @__PURE__ */ jsxs("tr", { className: "bg-red-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "10 AM - 7 PM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "6.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "24.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "24.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "20.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.1" })
      ] }),
      /* @__PURE__ */ jsxs("tr", { className: "bg-white", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "7 AM - 10 AM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "2.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "4.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "15.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "25.5" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "19.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "3.5" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "1.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "2.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "5.2" })
      ] }),
      /* @__PURE__ */ jsxs("tr", { className: "bg-red-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "10 AM - 7 PM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "6.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "24.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "24.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "20.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "0.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-gs-blue-500" : ""}`, children: "7.1" })
      ] }),
      /* @__PURE__ */ jsxs("tr", { className: "bg-yellow-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700", children: "7 PM - 1 AM" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "8.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "6.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "4.7" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "25.4" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "28.9" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "30.8" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "5.6" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "0.5" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "6.1" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "11.0" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "14.3" }),
        /* @__PURE__ */ jsx("td", { className: `border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? "border-l-2 border-r-2 border-b-2 border-gs-blue-500" : ""}`, children: "8.2" })
      ] })
    ] })
  ] });
}

function WeeklyCongestionWrapper() {
  const { selectedScenario } = useScenario();
  const [congestionData, setCongestionData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!selectedScenario) return;
    const fetchCongestionData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/weekly-congestion?scenarioId=${selectedScenario.scenarioid}`);
        if (response.ok) {
          const data = await response.json();
          setCongestionData(data);
        }
      } catch (error) {
        console.error("Error fetching weekly congestion:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCongestionData();
  }, [selectedScenario]);
  const formatCongestionValue = (value) => value?.toFixed(2) || "0.00";
  const getCongestionColorClass = (value) => {
    if (value >= 0) {
      if (value >= 50) return "bg-red-700 text-white";
      if (value >= 30) return "bg-red-600 text-white";
      if (value >= 15) return "bg-red-500 text-white";
      if (value >= 5) return "bg-red-400 text-white";
      if (value >= 1) return "bg-red-300 text-white";
      return "bg-red-100 text-gray-800";
    } else {
      const absValue = Math.abs(value);
      if (absValue >= 50) return "bg-blue-700 text-white";
      if (absValue >= 30) return "bg-blue-600 text-white";
      if (absValue >= 15) return "bg-blue-500 text-white";
      if (absValue >= 5) return "bg-blue-400 text-white";
      if (absValue >= 1) return "bg-blue-300 text-white";
      return "bg-blue-100 text-gray-800";
    }
  };
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border border-gray-200 rounded-xl shadow-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "text-center text-gray-500", children: "Loading congestion data..." }) });
  }
  if (!congestionData) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { id: "weekly-congestion", className: "bg-white border border-gray-200 rounded-xl shadow-sm p-6 scroll-mt-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gray-800 mb-2", children: "Weekly Congestion" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-6 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-red-500 rounded" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Positive Congestion" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-blue-400 rounded" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Negative Congestion" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-700 text-center", children: "Last Week" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between text-sm text-gray-600", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Top 2 Hours" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200", children: congestionData.lastWeek && congestionData.lastWeek.length > 0 ? congestionData.lastWeek.map((day) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`,
              style: { width: `${100 / congestionData.lastWeek.length}%` },
              title: `${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh - ${day.topHours.constraintName}`,
              children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { children: formatDateDisplay(day.date) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "$",
                  formatCongestionValue(day.topHours.avgCongestion)
                ] })
              ] })
            },
            day.date
          )) : /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm", children: "No Data" }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between text-sm text-gray-600", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Bottom 2 Hours" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200", children: congestionData.lastWeek && congestionData.lastWeek.length > 0 ? congestionData.lastWeek.map((day) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`,
              style: { width: `${100 / congestionData.lastWeek.length}%` },
              title: `${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh - ${day.bottomHours.constraintName}`,
              children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { children: formatDateDisplay(day.date) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "$",
                  formatCongestionValue(day.bottomHours.avgCongestion)
                ] })
              ] })
            },
            day.date
          )) : /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm", children: "No Data" }) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-700 text-center", children: "This Week" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between text-sm text-gray-600", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Top 2 Hours" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200", children: congestionData.thisWeek && congestionData.thisWeek.length > 0 ? congestionData.thisWeek.map((day) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`,
              style: { width: `${100 / congestionData.thisWeek.length}%` },
              title: `${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh - ${day.topHours.constraintName}`,
              children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { children: formatDateDisplay(day.date) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "$",
                  formatCongestionValue(day.topHours.avgCongestion)
                ] })
              ] })
            },
            day.date
          )) : /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm", children: "No Data" }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between text-sm text-gray-600", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Bottom 2 Hours" }) }),
          /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200", children: congestionData.thisWeek && congestionData.thisWeek.length > 0 ? congestionData.thisWeek.map((day) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`,
              style: { width: `${100 / congestionData.thisWeek.length}%` },
              title: `${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh - ${day.bottomHours.constraintName}`,
              children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { children: formatDateDisplay(day.date) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "$",
                  formatCongestionValue(day.bottomHours.avgCongestion)
                ] })
              ] })
            },
            day.date
          )) : /* @__PURE__ */ jsx("div", { className: "flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm", children: "No Data" }) }) })
        ] })
      ] })
    ] })
  ] });
}

function PricingChart() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/lmp-components?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pricing data");
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const formatYAxisTick = (value) => {
    return Math.round(value).toString();
  };
  const formatDateTick = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };
  const formatTooltipLabel = (label) => {
    const date = new Date(label);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })} at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })}`;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-white rounded-lg shadow-lg p-6 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading pricing data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-white rounded-lg shadow-lg p-6 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error: ",
      error
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-6", children: "LMP Breakdown" }),
    /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "500px" }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(ComposedChart, { data, margin: { top: 20, right: 30, left: 30, bottom: 25 }, children: [
      /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB", opacity: 0.5 }),
      /* @__PURE__ */ jsx(
        XAxis,
        {
          dataKey: "datetime",
          tickFormatter: formatDateTick,
          tick: { fontSize: 11 },
          tickLine: false,
          interval: 23,
          height: 50
        }
      ),
      /* @__PURE__ */ jsx(
        YAxis,
        {
          label: {
            value: "$/MWh",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" }
          },
          domain: [
            (dataMin) => Math.floor(dataMin / 20) * 20,
            (dataMax) => Math.ceil(dataMax / 20) * 20
          ],
          tickFormatter: formatYAxisTick,
          ticks: (() => {
            if (data.length === 0) return [];
            const allValues = data.flatMap((d) => [d.Energy, d.Congestion, d.Loss, d.LMP]);
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const tickMin = Math.floor(min / 20) * 20;
            const tickMax = Math.ceil(max / 20) * 20;
            const ticks = [];
            for (let i = tickMin; i <= tickMax; i += 20) {
              ticks.push(i);
            }
            return ticks;
          })()
        }
      ),
      /* @__PURE__ */ jsx(
        Tooltip,
        {
          labelFormatter: formatTooltipLabel,
          formatter: (value, name) => [
            `$${Number(value).toFixed(2)}/MWh`,
            name
          ]
        }
      ),
      /* @__PURE__ */ jsx(Legend, {}),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          dataKey: "Energy",
          stackId: "1",
          stroke: "#3B82F6",
          fill: "#3B82F6",
          fillOpacity: 0.6,
          name: "Energy"
        }
      ),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          dataKey: "Congestion",
          stackId: "1",
          stroke: "#EF4444",
          fill: "#EF4444",
          fillOpacity: 0.6,
          name: "Congestion"
        }
      ),
      /* @__PURE__ */ jsx(
        Area,
        {
          type: "monotone",
          dataKey: "Loss",
          stackId: "1",
          stroke: "#F59E0B",
          fill: "#F59E0B",
          fillOpacity: 0.6,
          name: "Losses"
        }
      ),
      /* @__PURE__ */ jsx(
        Line,
        {
          type: "monotone",
          dataKey: "LMP",
          stroke: "#000000",
          strokeWidth: 2,
          dot: false,
          name: "LMP"
        }
      )
    ] }) }) })
  ] });
}

const generateColors = (count) => {
  const distinctColors = [
    "#FF6B6B",
    // Red
    "#4ECDC4",
    // Teal
    "#45B7D1",
    // Blue
    "#FFA726",
    // Orange
    "#66BB6A",
    // Green
    "#AB47BC",
    // Purple
    "#FF7043",
    // Deep Orange
    "#26A69A",
    // Cyan
    "#42A5F5",
    // Light Blue
    "#FFCA28",
    // Amber
    "#EF5350",
    // Red variant
    "#29B6F6",
    // Light Blue variant
    "#9CCC65",
    // Light Green
    "#EC407A",
    // Pink
    "#78909C",
    // Blue Grey
    "#FDD835",
    // Yellow
    "#8D6E63",
    // Brown
    "#D4E157",
    // Lime
    "#FF8A65",
    // Deep Orange variant
    "#81C784"
    // Green variant
  ];
  if (count <= distinctColors.length) {
    return distinctColors.slice(0, count);
  }
  const additionalColors = [];
  for (let i = distinctColors.length; i < count; i++) {
    const hue = i * 137.508 % 360;
    const saturation = 70 + i % 3 * 10;
    const lightness = 45 + i % 4 * 10;
    additionalColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return [...distinctColors, ...additionalColors];
};
function CongestionChart() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredData, setHoveredData] = useState(null);
  const [pinnedData, setPinnedData] = useState(null);
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
          throw new Error("Failed to fetch congestion data");
        }
        const result = await response.json();
        setData(result.data);
        setMetadata(result.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const formatYAxisTick = (value) => {
    return Math.round(value).toString();
  };
  const formatDateTick = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };
  const formatTooltipLabel = (label) => {
    const date = new Date(label);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })} at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })}`;
  };
  const CustomTooltipContent = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    if (active && payload[0]?.payload && !pinnedData) {
      setHoveredData(payload[0].payload);
    }
    const nonZeroPayload = payload.filter((entry) => {
      const value = Number(entry.value);
      return Math.abs(value) >= 0.01;
    });
    if (nonZeroPayload.length === 0) {
      return null;
    }
    const totalCongestionEntry = nonZeroPayload.find((entry) => entry.name === "Total Congestion");
    const constraintEntries = nonZeroPayload.filter((entry) => entry.name !== "Total Congestion");
    const sortedConstraints = constraintEntries.sort((a, b) => {
      return Number(b.value) - Number(a.value);
    });
    const sortedPayload = [...sortedConstraints];
    if (totalCongestionEntry) {
      sortedPayload.push(totalCongestionEntry);
    }
    return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-300 rounded-lg shadow-lg p-3", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-800 mb-2", children: formatTooltipLabel(label) }),
      sortedPayload.map((entry, index) => {
        const value = Number(entry.value);
        const name = entry.name;
        if (name === "Total Congestion") {
          return /* @__PURE__ */ jsxs("p", { style: { color: "#000000" }, className: "text-sm border-t border-gray-200 pt-1 mt-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              name,
              ":"
            ] }),
            " $",
            value.toFixed(2),
            "/MWh"
          ] }, index);
        }
        if (name === "Other") {
          return /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              name,
              ":"
            ] }),
            " $",
            value.toFixed(2),
            "/MWh"
          ] }, index);
        }
        const originalName = displayConstraints.find(
          (constraint) => shortenConstraintName(constraint) === name
        );
        const datetime = payload[0]?.payload?.datetime;
        if (metadata && datetime && originalName && metadata.constraintDetails[originalName] && metadata.constraintDetails[originalName][datetime]) {
          const details = metadata.constraintDetails[originalName][datetime];
          return /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              name,
              ":"
            ] }),
            " $",
            value.toFixed(2),
            "/MWh",
            /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
              " (SF: ",
              details.shiftFactor.toFixed(3),
              ", SP: $",
              details.shadowprice.toFixed(2),
              ")"
            ] })
          ] }, index);
        }
        return /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            name,
            ":"
          ] }),
          " $",
          value.toFixed(2),
          "/MWh"
        ] }, index);
      })
    ] });
  };
  const handleMouseLeave = () => {
    if (!pinnedData) {
      setHoveredData(null);
    }
  };
  const handleChartClick = (event) => {
    if (event && event.activePayload && event.activePayload.length > 0) {
      const clickedData = event.activePayload[0].payload;
      if (pinnedData && pinnedData.datetime === clickedData.datetime) {
        setPinnedData(null);
      } else {
        setPinnedData(clickedData);
        setHoveredData(null);
      }
    } else {
      setPinnedData(null);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-white rounded-lg shadow-lg p-6 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading congestion data..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-white rounded-lg shadow-lg p-6 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error: ",
      error
    ] }) });
  }
  if (!metadata) {
    return /* @__PURE__ */ jsx("div", { className: "w-full h-96 bg-white rounded-lg shadow-lg p-6 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "No congestion data available" }) });
  }
  const allConstraints = [...metadata.constraintNames || [], "Other"];
  const displayConstraints = allConstraints;
  const shortenConstraintName = (name) => {
    if (name === "Other" || name === "Total Congestion") return name;
    const parts = name.split("_");
    if (parts.length > 2) {
      const shortened = `${parts[0]}_${parts[1]}...${parts[parts.length - 1]}`;
      return shortened.length > 25 ? shortened.substring(0, 25) + "..." : shortened;
    }
    return name.length > 25 ? name.substring(0, 25) + "..." : name;
  };
  const colors = generateColors(displayConstraints.length);
  if (data.length === 0 || displayConstraints.length <= 1) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-6", children: "Congestion Analysis" }),
      /* @__PURE__ */ jsx("div", { className: "w-full h-96 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "No constraint data available for the selected period" }) })
    ] });
  }
  const chartData = data;
  const getTableData = () => {
    const activeData = pinnedData || hoveredData;
    if (!activeData || !metadata) return [];
    const datetime = activeData.datetime;
    const tableRows = [];
    for (const constraintName of displayConstraints) {
      const value = Number(activeData[constraintName]) || 0;
      if (Math.abs(value) >= 0.01) {
        const details = metadata.constraintDetails[constraintName]?.[datetime];
        tableRows.push({
          name: constraintName,
          value,
          shiftFactor: details?.shiftFactor || null,
          shadowPrice: details?.shadowprice || null
        });
      }
    }
    tableRows.sort((a, b) => b.value - a.value);
    const totalCongestion = Number(activeData["Total Congestion"]) || 0;
    if (totalCongestion !== 0) {
      tableRows.push({
        name: "Total Congestion",
        value: totalCongestion,
        shiftFactor: null,
        shadowPrice: null
      });
    }
    return tableRows;
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-6", children: "Congestion Analysis" }),
    /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "600px" }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(
      ComposedChart,
      {
        data: chartData,
        margin: { top: 20, right: 30, left: 30, bottom: 25 },
        onMouseLeave: handleMouseLeave,
        onClick: handleChartClick,
        children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB", opacity: 0.5 }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "datetime",
              tickFormatter: formatDateTick,
              tick: { fontSize: 11 },
              tickLine: false,
              interval: 23,
              height: 50
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              label: {
                value: "$/MWh",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" }
              },
              domain: [
                (dataMin) => Math.floor(dataMin / 10) * 10,
                (dataMax) => Math.ceil(dataMax / 10) * 10
              ],
              tickFormatter: formatYAxisTick,
              interval: 0,
              ticks: (() => {
                if (chartData.length === 0) return [];
                const allValues = chartData.flatMap((d) => [
                  d["Total Congestion"],
                  ...displayConstraints.map((constraint) => Number(d[constraint]) || 0)
                ]);
                const min = Math.min(...allValues);
                const max = Math.max(...allValues);
                const tickMin = Math.floor(min / 10) * 10;
                const tickMax = Math.ceil(max / 10) * 10;
                const ticks = [];
                for (let i = tickMin; i <= tickMax; i += 10) {
                  ticks.push(i);
                }
                return ticks;
              })()
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              content: CustomTooltipContent
            }
          ),
          displayConstraints.map((constraintName, index) => /* @__PURE__ */ jsx(
            Area,
            {
              type: "monotone",
              dataKey: constraintName,
              stackId: "1",
              stroke: "none",
              fill: colors[index],
              fillOpacity: 0.85,
              name: shortenConstraintName(constraintName)
            },
            constraintName
          )),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "Total Congestion",
              stroke: "#000000",
              strokeWidth: 2,
              dot: false,
              name: "Total Congestion"
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t pt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-800", children: pinnedData ? `Constraint Details - ${formatTooltipLabel(pinnedData.datetime)} (Pinned)` : hoveredData ? `Constraint Details - ${formatTooltipLabel(hoveredData.datetime)}` : "Constraint Details" }),
        pinnedData && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPinnedData(null),
            className: "px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors",
            children: "Unpin"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto h-80", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full bg-gray-50 border border-gray-200 rounded-lg", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-100", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left text-sm font-medium text-gray-700 border-b", children: "Constraint Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Congestion ($/MWh)" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Shift Factor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Shadow Price ($/MWh)" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: pinnedData || hoveredData ? getTableData().map((row, index) => /* @__PURE__ */ jsxs("tr", { className: `${row.name === "Total Congestion" ? "border-t-2 border-gray-400 bg-blue-50" : "hover:bg-gray-100"}`, children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-sm text-gray-800 border-b", children: row.name }),
          /* @__PURE__ */ jsxs("td", { className: `px-4 py-2 text-sm text-right border-b font-mono ${row.value > 0 ? "text-green-600" : row.value < 0 ? "text-red-600" : "text-gray-800"}`, children: [
            row.value >= 0 ? "+" : "",
            "$",
            row.value.toFixed(2)
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-sm text-gray-600 text-right border-b", children: row.shiftFactor !== null ? row.shiftFactor.toFixed(3) : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-sm text-gray-600 text-right border-b", children: row.shadowPrice !== null ? `$${row.shadowPrice.toFixed(2)}` : "—" })
        ] }, index)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-500 text-sm", children: "Hover over the chart to view constraint details, or click to pin data for a specific time period" }) }) })
      ] }) })
    ] })
  ] });
}

const WeeklyLMPComparison = React.memo(function WeeklyLMPComparison() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
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
      setError(null);
      try {
        const response = await fetch(`/api/weekly-lmp-comparison?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch weekly LMP comparison data");
        }
        const result = await response.json();
        setData(result.data);
        setMetadata(result.metadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const traces = useMemo(() => {
    if (!data || data.length === 0) return [];
    const customdata = data.map((d) => {
      const forecastDate = new Date(d.datetime);
      const lastWeekDate = new Date(forecastDate.getTime() - 7 * 24 * 60 * 60 * 1e3);
      return {
        forecastDatetime: forecastDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) + " at " + forecastDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
        lastWeekDatetime: lastWeekDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) + " at " + lastWeekDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
      };
    });
    return [
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.thisWeekLMP),
        customdata: customdata.map((c) => [c.forecastDatetime, c.lastWeekDatetime]),
        name: "Forecast Week",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#000000",
          width: 2
        },
        connectgaps: false,
        hovertemplate: '<b style="font-size: 13px;">Forecast Week</b><br><span style="color: #6B7280; font-size: 11px;">%{customdata[0]}</span><br><b style="font-size: 13px;">$%{y:.2f}/MWh</b><extra></extra>'
      },
      {
        x: data.map((d) => d.datetime),
        y: data.map((d) => d.lastWeekLMP),
        customdata: customdata.map((c) => [c.forecastDatetime, c.lastWeekDatetime]),
        name: "Last Week",
        type: "scatter",
        mode: "lines",
        line: {
          color: "#EF4444",
          width: 2,
          dash: "dash"
        },
        connectgaps: false,
        hovertemplate: '<br><b style="font-size: 13px;">Last Week</b><br><span style="color: #6B7280; font-size: 11px;">%{customdata[1]}</span><br><b style="font-size: 13px;">$%{y:.2f}/MWh</b><extra></extra>'
      }
    ];
  }, [data]);
  const layout = useMemo(() => ({
    autosize: true,
    margin: { l: 60, r: 40, t: 50, b: 60 },
    xaxis: {
      title: { text: "" },
      tickformat: "%a",
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
        size: 11,
        family: "Inter, sans-serif",
        color: "#6B7280"
      },
      showspikes: true,
      spikemode: "across",
      spikethickness: 1,
      spikecolor: "#9CA3AF",
      spikedash: "solid",
      hoverformat: ""
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
        size: 12,
        color: "#1F2937"
      },
      namelength: -1,
      align: "left"
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
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"],
    toImageButtonOptions: {
      format: "png",
      filename: "weekly_lmp_comparison",
      height: 600,
      width: 1200,
      scale: 2
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full", style: { height: "350px" }, children: /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading LMP comparison..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full", style: { height: "350px" }, children: /* @__PURE__ */ jsxs("div", { className: "text-gs-red-500", children: [
      "Error: ",
      error
    ] }) });
  }
  if (!Plot) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex items-center justify-center w-full", style: { height: "350px" }, children: /* @__PURE__ */ jsx("div", { className: "text-gs-gray-500", children: "Loading chart..." }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 flex flex-col w-full", style: { height: "350px" }, children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-4", children: "LMP Comparison: This Week vs Last Week" }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 w-full", children: /* @__PURE__ */ jsx(
      Plot,
      {
        data: traces,
        layout,
        config,
        style: { width: "100%", height: "100%" },
        useResizeHandler: true
      }
    ) })
  ] });
});

function PeakHoursHeatmap() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/peak-hours-frequency?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch peak hours frequency data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const getFrequencyColor = (frequency) => {
    if (frequency === 0) return "#FFFFFF";
    const lightness = 100 - frequency * 12;
    return `hsl(210, 100%, ${lightness}%)`;
  };
  const getTextColor = (frequency) => {
    return frequency >= 4 ? "#FFFFFF" : "#374151";
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "Loading peak hours..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500 text-sm", children: [
      "Error: ",
      error
    ] }) });
  }
  if (!data) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "No data available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-md font-semibold text-gray-800 mb-3", children: "Peak Hours Frequency" }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 mb-3", children: /* @__PURE__ */ jsx("div", { children: "Frequency of Highest Priced 3 Hours" }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse text-xs", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "w-16 text-left py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-100", children: "Week" }),
        Array.from({ length: 24 }, (_, i) => i + 1).map((he) => /* @__PURE__ */ jsx("th", { className: "text-center py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-100 min-w-[24px]", children: he }, he))
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        /* @__PURE__ */ jsxs("tr", { style: { height: "32px" }, children: [
          /* @__PURE__ */ jsx("td", { className: "py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs align-middle", style: { height: "32px" }, children: "Forecast" }),
          data.forecastWeekFrequency.map((frequency, index) => /* @__PURE__ */ jsx(
            "td",
            {
              className: "text-center py-1 px-1 border border-gray-300 min-w-[24px] font-medium align-middle",
              style: {
                backgroundColor: getFrequencyColor(frequency),
                color: getTextColor(frequency),
                height: "32px"
              },
              title: `HE${index + 1}: ${frequency} times in top-3`,
              children: frequency
            },
            index
          ))
        ] }),
        /* @__PURE__ */ jsxs("tr", { style: { height: "32px" }, children: [
          /* @__PURE__ */ jsx("td", { className: "py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs align-middle", style: { height: "32px" }, children: "Prior" }),
          data.lastWeekFrequency.map((frequency, index) => /* @__PURE__ */ jsx(
            "td",
            {
              className: "text-center py-1 px-1 border border-gray-300 min-w-[24px] font-medium align-middle",
              style: {
                backgroundColor: getFrequencyColor(frequency),
                color: getTextColor(frequency),
                height: "32px"
              },
              title: `HE${index + 1}: ${frequency} times in top-3`,
              children: frequency
            },
            index
          ))
        ] })
      ] })
    ] }) })
  ] });
}

function BottomHoursHeatmap() {
  const { selectedScenario } = useScenario();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedScenario) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/bottom-hours-frequency?scenarioid=${selectedScenario.scenarioid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch bottom hours frequency data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario]);
  const getFrequencyColor = (frequency) => {
    if (frequency === 0) return "#FFFFFF";
    const lightness = 100 - frequency * 12;
    return `hsl(210, 100%, ${lightness}%)`;
  };
  const getTextColor = (frequency) => {
    return frequency >= 4 ? "#FFFFFF" : "#374151";
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "Loading bottom hours..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500 text-sm", children: [
      "Error: ",
      error
    ] }) });
  }
  if (!data) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "No data available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-md font-semibold text-gray-800 mb-3", children: "Bottom Hours Frequency" }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 mb-3", children: /* @__PURE__ */ jsx("div", { children: "Frequency of Lowest Priced 3 Hours" }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse text-xs", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "w-16 text-left py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-100", children: "Week" }),
        Array.from({ length: 24 }, (_, i) => i + 1).map((he) => /* @__PURE__ */ jsx("th", { className: "text-center py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-100 min-w-[24px]", children: he }, he))
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        /* @__PURE__ */ jsxs("tr", { style: { height: "32px" }, children: [
          /* @__PURE__ */ jsx("td", { className: "py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs align-middle", style: { height: "32px" }, children: "Forecast" }),
          data.forecastWeekFrequency.map((frequency, index) => /* @__PURE__ */ jsx(
            "td",
            {
              className: "text-center py-1 px-1 border border-gray-300 min-w-[24px] font-medium align-middle",
              style: {
                backgroundColor: getFrequencyColor(frequency),
                color: getTextColor(frequency),
                height: "32px"
              },
              title: `HE${index + 1}: ${frequency} times in bottom-3`,
              children: frequency
            },
            index
          ))
        ] }),
        /* @__PURE__ */ jsxs("tr", { style: { height: "32px" }, children: [
          /* @__PURE__ */ jsx("td", { className: "py-1 px-1 font-medium text-gray-700 border border-gray-300 bg-gray-50 text-xs align-middle", style: { height: "32px" }, children: "Prior" }),
          data.lastWeekFrequency.map((frequency, index) => /* @__PURE__ */ jsx(
            "td",
            {
              className: "text-center py-1 px-1 border border-gray-300 min-w-[24px] font-medium align-middle",
              style: {
                backgroundColor: getFrequencyColor(frequency),
                color: getTextColor(frequency),
                height: "32px"
              },
              title: `HE${index + 1}: ${frequency} times in bottom-3`,
              children: frequency
            },
            index
          ))
        ] })
      ] })
    ] }) })
  ] });
}

function ImpactfulConstraints() {
  const { selectedScenario } = useScenario();
  const [constraints, setConstraints] = useState([]);
  const [selectedConstraint, setSelectedConstraint] = useState(null);
  const [constraintDetails, setConstraintDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const defaultHours = Array.from({ length: 24 }, (_, i) => i + 1);
  const [appliedHours, setAppliedHours] = useState(defaultHours);
  const [pendingHours, setPendingHours] = useState(defaultHours);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const getHourFromDatetime = (datetime) => {
    const date = new Date(datetime);
    return date.getHours() === 0 ? 24 : date.getHours();
  };
  const filterDataByHours = (data) => {
    return data.filter((dataPoint) => {
      const hour = getHourFromDatetime(dataPoint.datetime);
      return appliedHours.includes(hour);
    });
  };
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
          throw new Error("Failed to fetch congestion data");
        }
        const result = await response.json();
        const filteredData = filterDataByHours(result.data);
        const constraintImpacts = processConstraintData(filteredData, result.metadata.constraintNames);
        setConstraints(constraintImpacts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedScenario, appliedHours]);
  const handleConstraintClick = async (constraintName) => {
    setSelectedConstraint(constraintName);
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/congestion-plot?scenarioid=${selectedScenario?.scenarioid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch constraint details");
      }
      const result = await response.json();
      const filteredData = filterDataByHours(result.data);
      const details = processConstraintDetails(filteredData, result.metadata, constraintName);
      setConstraintDetails(details);
    } catch (err) {
      console.error("Error fetching constraint details:", err);
      setConstraintDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };
  const processConstraintDetails = (data, metadata, constraintName) => {
    const details = [];
    data.forEach((dataPoint) => {
      const congestionCost = Number(dataPoint[constraintName]) || 0;
      if (Math.abs(congestionCost) > 1e-3) {
        const constraintMetadata = metadata.constraintDetails[constraintName]?.[dataPoint.datetime];
        details.push({
          datetime: dataPoint.datetime,
          congestionCost,
          shiftFactor: constraintMetadata?.shiftFactor || 0,
          shadowPrice: constraintMetadata?.shadowprice || 0
        });
      }
    });
    return details.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  };
  const processConstraintData = (data, constraintNames) => {
    if (!data || data.length === 0 || !constraintNames || constraintNames.length === 0) {
      return [];
    }
    const constraintAbsoluteTotals = {};
    const constraintSignedTotals = {};
    const constraintBindingHours = {};
    constraintNames.forEach((constraintName) => {
      constraintAbsoluteTotals[constraintName] = 0;
      constraintSignedTotals[constraintName] = 0;
      constraintBindingHours[constraintName] = 0;
    });
    data.forEach((dataPoint) => {
      constraintNames.forEach((constraintName) => {
        const congestionValue = Number(dataPoint[constraintName]) || 0;
        if (Math.abs(congestionValue) > 1e-3) {
          constraintAbsoluteTotals[constraintName] += Math.abs(congestionValue);
          constraintSignedTotals[constraintName] += congestionValue;
          constraintBindingHours[constraintName] += 1;
        }
      });
    });
    const results = constraintNames.map((constraintName) => {
      const bindingHours = constraintBindingHours[constraintName];
      return {
        name: constraintName,
        averageCongestionCost: bindingHours > 0 ? constraintSignedTotals[constraintName] / bindingHours : 0,
        // Average when binding
        absoluteAverage: bindingHours > 0 ? constraintAbsoluteTotals[constraintName] / bindingHours : 0,
        // For sorting, also when binding
        bindingHours
      };
    });
    return results.filter((constraint) => constraint.absoluteAverage > 0.01).sort((a, b) => b.absoluteAverage - a.absoluteAverage).slice(0, 8);
  };
  const handleHourToggle = (hour) => {
    setPendingHours((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour);
      } else {
        return [...prev, hour].sort((a, b) => a - b);
      }
    });
  };
  const handleSelectAllHours = () => {
    setPendingHours(Array.from({ length: 24 }, (_, i) => i + 1));
  };
  const handleDeselectAllHours = () => {
    setPendingHours([]);
  };
  const handleApplyHours = () => {
    setAppliedHours([...pendingHours]);
    setSelectedConstraint(null);
    setConstraintDetails([]);
    setIsDropdownOpen(false);
  };
  const hasPendingChanges = JSON.stringify(pendingHours.sort()) !== JSON.stringify(appliedHours.sort());
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen) {
        const target = event.target;
        if (!target.closest(".hour-filter-dropdown")) {
          setIsDropdownOpen(false);
          setPendingHours([...appliedHours]);
        }
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
        setPendingHours([...appliedHours]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isDropdownOpen, appliedHours]);
  const shortenConstraintName = (name) => {
    const parts = name.split("_");
    if (parts.length > 2) {
      const shortened = `${parts[0]}_${parts[1]}...${parts[parts.length - 1]}`;
      return shortened.length > 35 ? shortened.substring(0, 35) + "..." : shortened;
    }
    return name.length > 35 ? name.substring(0, 35) + "..." : name;
  };
  const formatDateTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " " + date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return dateTimeString;
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "Loading constraints..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500 text-sm", children: [
      "Error: ",
      error
    ] }) });
  }
  if (constraints.length === 0 && appliedHours.length > 0) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: "No constraint data available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-800 mb-6", children: "Impactful Constraints" }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 mb-3", children: /* @__PURE__ */ jsx("div", { children: "Defined as having the most influence on Goleta LMP when binding" }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "relative hour-filter-dropdown", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setIsDropdownOpen(!isDropdownOpen);
            if (!isDropdownOpen) {
              setPendingHours([...appliedHours]);
            }
          },
          className: "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-700", children: appliedHours.length === 24 ? "All Hours" : appliedHours.length === 0 ? "No Hours Selected" : `${appliedHours.length} Hour${appliedHours.length !== 1 ? "s" : ""} Selected` }),
            hasPendingChanges && /* @__PURE__ */ jsx("span", { className: "ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full", title: "Pending changes" }),
            /* @__PURE__ */ jsx("span", { className: "absolute inset-y-0 right-0 flex items-center pr-2", children: /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-gray-400", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })
          ]
        }
      ),
      isDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-2 border-b border-gray-200", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSelectAllHours,
              className: "text-xs text-blue-600 hover:text-blue-800 mr-4",
              children: "Select All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleDeselectAllHours,
              className: "text-xs text-blue-600 hover:text-blue-800",
              children: "Deselect All"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-1 p-2", children: Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-1 text-xs", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: pendingHours.includes(hour),
              onChange: () => handleHourToggle(hour),
              className: "h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-gray-700", children: [
            "HE",
            hour
          ] })
        ] }, hour)) }),
        hasPendingChanges && /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-gray-200", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleApplyHours,
            className: "w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm font-medium",
            children: [
              "Apply (",
              pendingHours.length,
              " Hour",
              pendingHours.length !== 1 ? "s" : "",
              ")"
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { style: { height: "520px" }, className: "mb-6 flex flex-col", children: appliedHours.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-gray-500 text-sm", children: "Please select at least one hour to view constraint analysis" }) : /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 sticky top-0", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("th", { className: "text-left py-2 px-2 font-medium text-gray-700", children: "Constraint Name" }),
        /* @__PURE__ */ jsx("th", { className: "text-right py-2 px-2 font-medium text-gray-700", children: "Avg Congestion ($/MWh)" }),
        /* @__PURE__ */ jsx("th", { className: "text-right py-2 px-2 font-medium text-gray-700", children: "Hours" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: constraints.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "text-center py-8 text-gray-500 text-sm", children: "No constraint data available for selected hours" }) }) : constraints.map((constraint, index) => /* @__PURE__ */ jsxs(
        "tr",
        {
          className: selectedConstraint === constraint.name ? "bg-blue-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50",
          children: [
            /* @__PURE__ */ jsx(
              "td",
              {
                className: `py-2 px-2 font-medium cursor-pointer hover:bg-blue-100 ${selectedConstraint === constraint.name ? "text-blue-600" : "text-gray-800"}`,
                title: constraint.name,
                onClick: () => handleConstraintClick(constraint.name),
                children: shortenConstraintName(constraint.name)
              }
            ),
            /* @__PURE__ */ jsxs("td", { className: `py-2 px-2 text-right font-mono font-medium ${constraint.averageCongestionCost > 0 ? "text-green-600" : constraint.averageCongestionCost < 0 ? "text-red-600" : "text-gray-800"}`, children: [
              constraint.averageCongestionCost >= 0 ? "+" : "",
              constraint.averageCongestionCost.toFixed(2)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right text-gray-800 font-mono", children: constraint.bindingHours })
          ]
        },
        constraint.name
      )) })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t pt-6", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-lg font-medium text-gray-800 mb-4", children: "Constraint Details" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto h-80", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full bg-gray-50 border border-gray-200 rounded-lg", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-100", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left text-sm font-medium text-gray-700 border-b", children: "Datetime" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Congestion ($/MWh)" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Shift Factor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-sm font-medium text-gray-700 border-b", children: "Shadow Price ($/MWh)" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: appliedHours.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-500 text-sm", children: "Please select at least one hour to view constraint details" }) }) : !selectedConstraint ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-500 text-sm", children: "Click on a constraint name above to view detailed information" }) }) : detailsLoading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-500 text-sm", children: "Loading constraint details..." }) }) : constraintDetails.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-8 text-center text-gray-500 text-sm", children: "No binding hours found for this constraint in selected hours" }) }) : constraintDetails.map((detail, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-100", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-sm text-gray-800 border-b", children: formatDateTime(detail.datetime) }),
          /* @__PURE__ */ jsxs("td", { className: `px-4 py-2 text-sm text-right border-b font-mono ${detail.congestionCost > 0 ? "text-green-600" : "text-red-600"}`, children: [
            detail.congestionCost >= 0 ? "+" : "",
            "$",
            detail.congestionCost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-sm text-gray-600 text-right border-b font-mono", children: detail.shiftFactor.toFixed(4) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 text-sm text-gray-600 text-right border-b font-mono", children: [
            "$",
            detail.shadowPrice.toFixed(2)
          ] })
        ] }, detail.datetime)) })
      ] }) })
    ] })
  ] });
}

function GoleteaPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showRestrictions, setShowRestrictions] = useState(false);
  return /* @__PURE__ */ jsx(ScenarioProvider, { children: /* @__PURE__ */ jsx("div", { className: "py-12 space-y-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gs-gray-900 mb-2", children: "Goleta" }),
      /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: "Local market price analysis and congestion insights" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm", children: /* @__PURE__ */ jsx(ScenarioInfo, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-12", children: [
      /* @__PURE__ */ jsxs("section", { id: "tb26-analysis", className: "mb-12 scroll-mt-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-gs-gray-900 mb-2", children: "Goleta TB2.6 Performance Overview" }),
          /* @__PURE__ */ jsx("p", { className: "text-gs-gray-600", children: selectedPeriod ? "Click on a card to view LMP comparison chart" : "Based on 60MW/160MWh Battery with 86% Round-Trip Efficiency, Day-Ahead Pricing" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: selectedPeriod ? "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" : "", children: [
          /* @__PURE__ */ jsx("div", { className: selectedPeriod ? "lg:col-span-1 min-w-0" : "", children: /* @__PURE__ */ jsx(
            InteractiveTB26Cards,
            {
              onPeriodSelect: setSelectedPeriod,
              selectedPeriod,
              showRestrictions,
              setShowRestrictions
            }
          ) }),
          selectedPeriod && /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 min-w-0", children: /* @__PURE__ */ jsx(WeeklyLMPComparison, {}) })
        ] })
      ] }),
      showRestrictions && /* @__PURE__ */ jsx("section", { className: "mb-12", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-gs-sm border border-gs-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gs-gray-900 mb-2", children: "Charging Restrictions (MW)" }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsx(ChargingRestrictionsTable, {}) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(PricingChart, {}) }),
          /* @__PURE__ */ jsx("div", { className: "col-span-1", children: /* @__PURE__ */ jsx(WeeklyLMPComparison, {}) })
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(PeakHoursHeatmap, {}) }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(BottomHoursHeatmap, {}) }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(WeeklyCongestionWrapper, {}) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(CongestionChart, {}) }),
          /* @__PURE__ */ jsx("div", { className: "col-span-1", children: /* @__PURE__ */ jsx(ImpactfulConstraints, {}) })
        ] })
      ] })
    ] })
  ] }) }) });
}

const $$Goleta = createComponent(($$result, $$props, $$slots) => {
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Goleta Node", "pageTitle": "Short Term Outlook", "subNavLinks": subNavLinks }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "GoleteaPage", GoleteaPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/GoleteaPage", "client:component-export": "default" })} ${renderScript($$result2, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/goleta.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/goleta.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/goleta.astro";
const $$url = "/short-term-outlook/goleta";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Goleta,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
