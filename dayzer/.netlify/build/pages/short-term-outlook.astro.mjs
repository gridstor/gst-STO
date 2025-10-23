/* empty css                                 */
import { e as createAstro, f as createComponent, n as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_W-IpgH_B.mjs';
import { M as MECOverviewChart } from '../chunks/MECOverviewChart_Ck8gcaeK.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import React, { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

function TB26Display({ tb26Data: initialData, scenarioId }) {
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [tb26Data, setTb26Data] = useState(initialData);
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    if (scenarioId === void 0) {
      setTb26Data(initialData);
      return;
    }
    const fetchTB26 = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tb26-calculation?scenarioId=${scenarioId}`);
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
  }, [scenarioId, initialData]);
  const formatTB26Value = (value) => value?.toFixed(2) || "X.XX";
  const currentMonthIndex = React.useMemo(() => {
    if (tb26Data?.dateRanges?.thisWeek) {
      const startDate = tb26Data.dateRanges.thisWeek.split(" to ")[0];
      const date = new Date(startDate);
      return date.getMonth();
    }
    return (/* @__PURE__ */ new Date()).getMonth();
  }, [tb26Data]);
  return /* @__PURE__ */ jsxs("div", { children: [
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
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/short-term-outlook/goleta",
          className: "bg-white border-l-4 border-gs-amber-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "Last Year" }),
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
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/short-term-outlook/goleta",
          className: "bg-white border-l-4 border-gs-red-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "Last Week" }),
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
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/short-term-outlook/goleta",
          className: "bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-1", children: "This Week" }),
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
    ] }),
    showRestrictions && /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-gs-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gs-gray-900 mb-2", children: "Charging Restrictions (MW)" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse", children: [
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
      ] }) })
    ] })
  ] });
}

function FundamentalsOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/week-overview?hours=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24");
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
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
    fetchData();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white border border-gs-gray-200 rounded-lg shadow-gs-sm p-6", children: /* @__PURE__ */ jsx("div", { className: "text-center text-gs-gray-500", children: "Loading fundamentals overview..." }) });
  }
  if (error || data.length === 0) {
    return null;
  }
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
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: data.map((item, index) => /* @__PURE__ */ jsxs(
    "a",
    {
      href: "/short-term-outlook/caiso-system#weekly-analysis",
      className: `bg-white border-l-4 ${getAccentColor(item.component)} rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-all duration-gs-base p-6 cursor-pointer block hover:scale-[1.02] transform`,
      children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gs-gray-900 mb-4", children: item.component }),
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
  )) }) });
}

const LocationSelector = ({
  value,
  onChange,
  locations
}) => {
  return /* @__PURE__ */ jsx("div", { className: "flex-1 max-w-xl", children: /* @__PURE__ */ jsxs(
    "select",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      className: "block w-full rounded-md border border-gray-300 py-2.5 px-4 text-base font-medium focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-sm bg-white hover:bg-gray-50 transition-colors cursor-pointer",
      "aria-label": "Select Location",
      children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "Select a location..." }),
        locations.map((loc) => /* @__PURE__ */ jsx("option", { value: loc.id, children: loc.market ? `${loc.market} - ${loc.name}` : loc.name }, loc.id))
      ]
    }
  ) });
};

const LocationSelectorWrapper = ({
  locations,
  defaultLocation = "caiso-goleta",
  onLocationChange
}) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    const caisoContent = document.getElementById("caiso-goleta-content");
    const comingSoonMessage = document.getElementById("coming-soon-message");
    if (caisoContent && comingSoonMessage) {
      if (location === "ercot-hidden-lakes") {
        caisoContent.classList.add("hidden");
        comingSoonMessage.classList.remove("hidden");
      } else {
        caisoContent.classList.remove("hidden");
        comingSoonMessage.classList.add("hidden");
      }
    }
    if (onLocationChange) {
      onLocationChange(location);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold whitespace-nowrap", children: "Select a Location" }),
    /* @__PURE__ */ jsx(
      LocationSelector,
      {
        value: selectedLocation,
        onChange: handleLocationChange,
        locations
      }
    )
  ] });
};

const $$Astro = createAstro("https://gridstordayzer.netlify.app");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const getBaseUrl = () => {
    if (Astro2.url.hostname === "gridstoranalytics.com") {
      return "https://gridstordayzer.netlify.app";
    }
    return Astro2.url.origin;
  };
  const baseUrl = getBaseUrl();
  let tb26Data;
  try {
    const response = await fetch(`${baseUrl}/api/tb26-calculation`);
    if (response.ok) {
      tb26Data = await response.json();
    } else {
      console.error("Failed to fetch TB2.6 data:", response.status);
      tb26Data = null;
    }
  } catch (error) {
    console.error("Error fetching TB2.6 data:", error);
    tb26Data = null;
  }
  let weeklyCongestionData;
  try {
    const response = await fetch(`${baseUrl}/api/weekly-congestion`);
    if (response.ok) {
      weeklyCongestionData = await response.json();
    } else {
      console.error("Failed to fetch weekly congestion data:", response.status);
      weeklyCongestionData = null;
    }
  } catch (error) {
    console.error("Error fetching weekly congestion data:", error);
    weeklyCongestionData = null;
  }
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
  (/* @__PURE__ */ new Date()).getMonth();
  (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long" });
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Short Term Outlook", "pageTitle": "Short Term Outlook", "subNavLinks": subNavLinks }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="py-12 space-y-12"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">  <div class="mb-12 bg-white border-l-4 border-indigo-600 rounded-lg shadow-md p-6"> ${renderComponent($$result2, "LocationSelectorWrapper", LocationSelectorWrapper, { "client:load": true, "locations": [
    { id: "caiso-goleta", name: "Goleta", market: "CAISO" },
    { id: "ercot-hidden-lakes", name: "Hidden Lakes", market: "ERCOT" }
  ], "defaultLocation": "caiso-goleta", "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/LocationSelectorWrapper", "client:component-export": "LocationSelectorWrapper" })} </div>  <div id="coming-soon-message" class="hidden mb-12 bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-12"> <div class="text-center"> <h2 class="text-3xl font-semibold text-gs-gray-900 mb-4">Coming Soon</h2> <p class="text-lg text-gs-gray-600">Data for ERCOT - Hidden Lakes will be available soon.</p> </div> </div>  <div id="caiso-goleta-content">  <section class="mb-12"> <div class="mb-8"> <h2 class="text-2xl font-semibold text-gs-gray-900 mb-2">Goleta TB2.6 Performance Overview</h2> <p class="text-gs-gray-600">Based on 60MW/160MWh Battery with 86% Round-Trip Efficiency, Day-Ahead Pricing</p> </div> ${renderComponent($$result2, "TB26Display", TB26Display, { "tb26Data": tb26Data, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/TB26Display", "client:component-export": "default" })} </section>  <section class="mb-12"> <div class="mb-8"> <h2 class="text-2xl font-semibold text-gs-gray-900 mb-2">System Fundamentals</h2> <p class="text-gs-gray-600">Fundamentals Comparison of Last Week's Results vs. This Week's Forecast</p> </div> ${renderComponent($$result2, "FundamentalsOverview", FundamentalsOverview, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/FundamentalsOverview", "client:component-export": "default" })} </section>  <section class="mb-12"> <div class="mb-8"> <h2 class="text-2xl font-semibold text-gs-gray-900 mb-2">Weekly Congestion</h2> <p class="text-gs-gray-600">Impactful Constraints During Top 2 and Bottom 2 Hours</p> </div> ${weeklyCongestionData ? renderTemplate`<a href="/short-term-outlook/goleta#weekly-congestion" class="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base p-6 block cursor-pointer"> <h3 class="text-lg font-semibold text-gs-gray-900 mb-6">
This Week
</h3>  <div class="space-y-3 mb-6"> <div class="flex justify-between text-sm text-gs-gray-600"> <span class="font-medium uppercase tracking-wide">Top 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-gs-sm border border-gs-gray-200 font-mono"> ${weeklyCongestionData.thisWeek.map((day) => renderTemplate`<div${addAttribute(`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`, "class")} style="width: 14.3%;"${addAttribute(`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh
Hours: ${day.topHours.hours.join(", ")}
Constraint: ${day.topHours.constraintName}`, "title")}> ${formatDateDisplay(day.date)}<br>$${formatCongestionValue(day.topHours.avgCongestion)} </div>`)} </div> </div> </div>  <div class="space-y-3"> <div class="flex justify-between text-sm text-gs-gray-600"> <span class="font-medium uppercase tracking-wide">Bottom 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-gs-sm border border-gs-gray-200 font-mono"> ${weeklyCongestionData.thisWeek.map((day) => renderTemplate`<div${addAttribute(`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`, "class")} style="width: 14.3%;"${addAttribute(`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh
Hours: ${day.bottomHours.hours.join(", ")}
Constraint: ${day.bottomHours.constraintName}`, "title")}> ${formatDateDisplay(day.date)}<br>$${formatCongestionValue(day.bottomHours.avgCongestion)} </div>`)} </div> </div> </div> </a>` : renderTemplate`<div class="bg-white border-l-4 border-gs-blue-500 rounded-lg shadow-gs-sm p-6"> <h3 class="text-lg font-semibold text-gs-gray-900 mb-4">This Week</h3> <div class="flex items-center justify-center h-24 text-gs-gray-500"> <p>Loading congestion data...</p> </div> </div>`} </section>  <section> <div class="mb-8"> <h2 class="text-2xl font-semibold text-gs-gray-900 mb-2">Marginal Energy Component</h2> <p class="text-gs-gray-600">Marginal Energy Component for Top 2 and Bottom 2 Hours</p> </div> ${renderComponent($$result2, "MECOverviewChart", MECOverviewChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/MECOverviewChart", "client:component-export": "default" })} </section> </div>  </div> </div> ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/index.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/index.astro";
const $$url = "/short-term-outlook";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
