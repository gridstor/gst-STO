import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { u as useScenario } from './ScenarioContext_DGS9MIDa.mjs';
import { C as CalendarPicker } from './CalendarPicker_DFP8XzJ9.mjs';

function ScenarioInfo({ className = "" }) {
  const { selectedScenario, availableScenarios, setSelectedScenario, loading, error } = useScenario();
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  useEffect(() => {
    if (!selectedScenario) return;
    fetch(`/api/zone-demand?scenarioid=${selectedScenario.scenarioid}`).then((res) => res.json()).then((data) => {
      if (data.dateRange) {
        setDateRange(data.dateRange);
      }
    }).catch((err) => console.error("Error fetching date range:", err));
  }, [selectedScenario]);
  const formatDisplayDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };
  const handleDateSelect = (selectedDate) => {
    const matchingScenario = availableScenarios.find(
      (scenario) => scenario.simulation_date === selectedDate
    );
    if (matchingScenario) {
      setSelectedScenario(matchingScenario);
    }
  };
  const getAvailableDates = () => {
    const dates = availableScenarios.map((scenario) => scenario.simulation_date);
    console.log("ScenarioInfo - Available scenarios:", availableScenarios);
    console.log("ScenarioInfo - Extracted dates:", dates);
    return dates;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: `w-full p-6 ${className}`, children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gs-gray-500", children: "Loading scenario info..." }) });
  }
  if (error || !selectedScenario) {
    return /* @__PURE__ */ jsx("div", { className: `w-full p-6 ${className}`, children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gs-red-500", children: error || "No scenario available" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: `w-full relative p-6 ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-wrap gap-x-8 gap-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 relative", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gs-gray-600", children: "Simulation Date:" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowCalendar(!showCalendar),
            className: "text-sm font-semibold text-gs-gray-900 hover:text-gs-blue-600 cursor-pointer underline decoration-dotted underline-offset-2 flex items-center gap-1 transition-colors font-mono",
            children: [
              /* @__PURE__ */ jsx("span", { children: formatDisplayDate(selectedScenario.simulation_date) }),
              /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) })
            ]
          }
        ),
        showCalendar && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 mt-2 z-50", children: /* @__PURE__ */ jsx(
          CalendarPicker,
          {
            availableDates: getAvailableDates(),
            selectedDate: selectedScenario.simulation_date,
            onDateSelect: handleDateSelect,
            onClose: () => setShowCalendar(false)
          }
        ) })
      ] }),
      dateRange && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gs-gray-600", children: "Date Range:" }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold text-gs-gray-900 font-mono", children: [
          formatDisplayDate(dateRange.start),
          " - ",
          formatDisplayDate(dateRange.end)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gs-gray-600", children: "Dayzer Scenario ID:" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gs-blue-600 font-mono", children: selectedScenario.scenarioid })
      ] })
    ] }),
    showCalendar && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40",
        onClick: () => setShowCalendar(false)
      }
    )
  ] });
}

export { ScenarioInfo as S };
