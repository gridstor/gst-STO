/* empty css                                    */
import { f as createComponent, n as renderComponent, r as renderTemplate } from '../../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_W-IpgH_B.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { C as CalendarPicker } from '../../chunks/CalendarPicker_DFP8XzJ9.mjs';
export { renderers } from '../../renderers.mjs';

const LikedayAnalysis = () => {
  const [referenceMode, setReferenceMode] = useState("historical");
  const [availableScenarios, setAvailableScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [referenceDate, setReferenceDate] = useState(() => {
    const yesterday = /* @__PURE__ */ new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState(() => {
    const today = /* @__PURE__ */ new Date();
    return today.toISOString().split("T")[0];
  });
  const [matchVariable, setMatchVariable] = useState("RT LMP");
  const [topN, setTopN] = useState(5);
  const [euclideanWeight, setEuclideanWeight] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [secondaryVariable, setSecondaryVariable] = useState("");
  const [secondaryData, setSecondaryData] = useState(null);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [visibleLines, setVisibleLines] = useState({
    reference: true
  });
  const [secondaryVisibleLines, setSecondaryVisibleLines] = useState({
    reference: true
  });
  const allVariables = [
    "RT Load",
    "RT Net Load",
    "RT LMP",
    "RT Energy",
    "RT Congestion",
    "DA LMP",
    "DA Load",
    "DA Net Load"
  ];
  const matchVariableOptions = referenceMode === "forecast" ? ["DA LMP", "DA Load", "DA Net Load"] : allVariables;
  const secondaryVariableOptions = allVariables;
  useEffect(() => {
    if (!matchVariableOptions.includes(matchVariable)) {
      setMatchVariable(matchVariableOptions[0] || "RT Load");
    }
  }, [referenceMode]);
  useEffect(() => {
    const fetchScenarios = async () => {
      if (referenceMode !== "forecast") return;
      setScenarioLoading(true);
      try {
        const response = await fetch("/api/available-scenarios");
        if (response.ok) {
          const data = await response.json();
          setAvailableScenarios(data.scenarios || []);
          if (data.defaultScenario) {
            setSelectedScenario(data.defaultScenario);
          }
        }
      } catch (err) {
        console.error("Error fetching scenarios:", err);
      } finally {
        setScenarioLoading(false);
      }
    };
    fetchScenarios();
  }, [referenceMode]);
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!selectedScenario || referenceMode !== "forecast") return;
      try {
        const simulationDate = new Date(selectedScenario.simulation_date);
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(simulationDate);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().split("T")[0]);
        }
        setAvailableDates(dates);
        if (dates.length > 0) {
          setReferenceDate(dates[0]);
        }
      } catch (err) {
        console.error("Error setting available dates:", err);
      }
    };
    fetchAvailableDates();
  }, [selectedScenario, referenceMode]);
  const handleModeToggle = (mode) => {
    setReferenceMode(mode);
    setError(null);
    setResults(null);
    if (mode === "historical") {
      const yesterday = /* @__PURE__ */ new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setReferenceDate(yesterday.toISOString().split("T")[0]);
    }
  };
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
      setShowCalendar(false);
    }
  };
  const getAvailableDates = () => {
    return availableScenarios.map((scenario) => scenario.simulation_date);
  };
  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      if (referenceMode === "forecast") {
        if (!selectedScenario) {
          setError("Please select a scenario for forecast analysis");
          return;
        }
        if (!referenceDate) {
          setError("Please select a forecast reference date");
          return;
        }
      }
      setProgress("Fetching data...");
      const requestBody = {
        referenceDate,
        startDate,
        endDate,
        matchVariable,
        topN,
        euclideanWeight,
        referenceMode,
        // Include scenario info for forecast mode
        ...referenceMode === "forecast" && {
          scenarioId: selectedScenario?.scenarioid,
          scenarioName: selectedScenario?.scenarioname
        }
      };
      const response = await fetch("/api/likeday-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        let errorMessage = `Analysis failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      setProgress("Analyzing patterns...");
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response format from server");
      }
      setProgress("Generating visualizations...");
      setResults(data);
      const initialVisibleLines = { reference: true };
      data.similarityScores.forEach((score) => {
        initialVisibleLines[score.day] = true;
      });
      setVisibleLines(initialVisibleLines);
      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };
  const handleSecondaryAnalysis = async () => {
    if (!results || !secondaryVariable) return;
    setSecondaryLoading(true);
    setError(null);
    try {
      setProgress("Fetching secondary variable data...");
      const requestBody = {
        referenceDate,
        referenceMode,
        matchVariable: secondaryVariable,
        // Use secondary variable as match variable
        topSimilarDays: results.similarityScores.slice(0, topN).map((score) => score.day),
        ...referenceMode === "forecast" && {
          scenarioId: selectedScenario?.scenarioid,
          scenarioName: selectedScenario?.scenarioname
        }
      };
      const response = await fetch("/api/likeday-secondary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        let errorMessage = `Secondary analysis failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response format from server");
      }
      setSecondaryData(data);
      const initialSecondaryVisibleLines = { reference: true };
      results?.similarityScores.forEach((score) => {
        initialSecondaryVisibleLines[score.day] = true;
      });
      setSecondaryVisibleLines(initialSecondaryVisibleLines);
      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Secondary analysis failed");
      setProgress("");
    } finally {
      setSecondaryLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const getVariableUnit = (variable) => {
    if (variable.includes("LMP") || variable.includes("Energy") || variable.includes("Congestion")) {
      return "$/MWh";
    } else if (variable.includes("Load")) {
      return "MW";
    } else {
      return "Value";
    }
  };
  const processChartDataForSecondaryVariable = (variable, data) => {
    if (!data || !data.chartData) return [];
    const referenceData = data.chartData?.[variable]?.[referenceDate];
    if (!referenceData) return [];
    const chartData = [];
    for (let hour = 1; hour <= 24; hour++) {
      const hourData = { hour };
      const refPoint = referenceData.find((point) => point.HOURENDING === hour);
      if (refPoint) {
        const variableKey = Object.keys(refPoint).find((key) => {
          const keyUpper = key.toUpperCase();
          const varUpper = variable.toUpperCase();
          if (varUpper.includes("RT LOAD") && !varUpper.includes("NET")) {
            return keyUpper.includes("RTLOAD") && !keyUpper.includes("NET");
          } else if (varUpper.includes("RT NET LOAD")) {
            return keyUpper.includes("RTLOAD_NET") || keyUpper.includes("NET_OF_RENEWABLES");
          } else if (varUpper.includes("RT LMP")) {
            return keyUpper.includes("RTLMP");
          } else if (varUpper.includes("RT ENERGY")) {
            return keyUpper.includes("RTENERGY");
          } else if (varUpper.includes("RT CONGESTION")) {
            return keyUpper.includes("RTCONG");
          } else if (varUpper.includes("DA LMP")) {
            return keyUpper.includes("DALMP");
          } else if (varUpper.includes("DA LOAD") && !varUpper.includes("NET")) {
            return keyUpper.includes("DA_DEMAND_FORECAST") || keyUpper.includes("DADEMANDFORECAST");
          } else if (varUpper.includes("DA NET LOAD")) {
            return keyUpper.includes("DA NET DEMAND FC") || keyUpper.includes("DANETDEMANDFC");
          }
          return keyUpper.includes(varUpper.replace(/\s+/g, "")) || keyUpper.includes(varUpper.replace(/\s+/g, "_"));
        });
        if (variableKey) {
          hourData[`reference_${variable.replace(/\s+/g, "_")}`] = refPoint[variableKey];
        }
      }
      results.similarityScores.slice(0, topN).forEach((score, index) => {
        const similarDayData = data.chartData?.[variable]?.[score.day];
        if (similarDayData) {
          const simPoint = similarDayData.find((point) => point.HOURENDING === hour);
          if (simPoint) {
            const variableKey = Object.keys(simPoint).find((key) => {
              const keyUpper = key.toUpperCase();
              const varUpper = variable.toUpperCase();
              if (varUpper.includes("RT LOAD") && !varUpper.includes("NET")) {
                return keyUpper.includes("RTLOAD") && !keyUpper.includes("NET");
              } else if (varUpper.includes("RT NET LOAD")) {
                return keyUpper.includes("RTLOAD_NET") || keyUpper.includes("NET_OF_RENEWABLES");
              } else if (varUpper.includes("RT LMP")) {
                return keyUpper.includes("RTLMP");
              } else if (varUpper.includes("RT ENERGY")) {
                return keyUpper.includes("RTENERGY");
              } else if (varUpper.includes("RT CONGESTION")) {
                return keyUpper.includes("RTCONG");
              } else if (varUpper.includes("DA LMP")) {
                return keyUpper.includes("DALMP");
              } else if (varUpper.includes("DA LOAD") && !varUpper.includes("NET")) {
                return keyUpper.includes("DA_DEMAND_FORECAST") || keyUpper.includes("DADEMANDFORECAST");
              } else if (varUpper.includes("DA NET LOAD")) {
                return keyUpper.includes("DA NET DEMAND FC") || keyUpper.includes("DANETDEMANDFC");
              }
              return keyUpper.includes(varUpper.replace(/\s+/g, "")) || keyUpper.includes(varUpper.replace(/\s+/g, "_"));
            });
            if (variableKey) {
              hourData[`${score.day}_${variable.replace(/\s+/g, "_")}`] = simPoint[variableKey];
            }
          }
        }
      });
      chartData.push(hourData);
    }
    return chartData;
  };
  const processChartDataForVariable = (variable) => {
    if (!results || !results.chartData) return [];
    const referenceData = results.chartData?.[variable]?.[results.referenceDate];
    if (!referenceData) return [];
    console.log(`🔍 Processing chart data for variable: ${variable}`);
    console.log("🔍 Reference data sample:", referenceData.slice(0, 2));
    const chartData = [];
    for (let hour = 1; hour <= 24; hour++) {
      const hourData = { hour };
      const refPoint = referenceData.find((point) => point.HOURENDING === hour);
      if (refPoint) {
        const variableKey = Object.keys(refPoint).find((key) => {
          const keyUpper = key.toUpperCase();
          const varUpper = variable.toUpperCase();
          if (varUpper.includes("RT LOAD") && !varUpper.includes("NET")) {
            return keyUpper.includes("RTLOAD") && !keyUpper.includes("NET");
          } else if (varUpper.includes("RT NET LOAD")) {
            return keyUpper.includes("RTLOAD_NET") || keyUpper.includes("NET_OF_RENEWABLES");
          } else if (varUpper.includes("RT LMP")) {
            return keyUpper.includes("RTLMP");
          } else if (varUpper.includes("RT ENERGY")) {
            return keyUpper.includes("RTENERGY");
          } else if (varUpper.includes("RT CONGESTION")) {
            return keyUpper.includes("RTCONG");
          } else if (varUpper.includes("DA LMP")) {
            return keyUpper.includes("DALMP");
          } else if (varUpper.includes("DA LOAD") && !varUpper.includes("NET")) {
            return keyUpper.includes("DA_DEMAND_FORECAST") || keyUpper.includes("DADEMANDFORECAST");
          } else if (varUpper.includes("DA NET LOAD")) {
            return keyUpper.includes("DA NET DEMAND FC") || keyUpper.includes("DANETDEMANDFC");
          }
          return keyUpper.includes(varUpper.replace(/\s+/g, "")) || keyUpper.includes(varUpper.replace(/\s+/g, "_"));
        });
        if (variableKey) {
          hourData[`reference_${variable.replace(/\s+/g, "_")}`] = refPoint[variableKey];
          console.log(`🔍 Hour ${hour}: Found reference key "${variableKey}" = ${refPoint[variableKey]}`);
        } else {
          console.log(`⚠️ Hour ${hour}: No variable key found for ${variable}. Available keys:`, Object.keys(refPoint));
        }
      }
      results.similarityScores.slice(0, topN).forEach((score, index) => {
        const similarDayData = results.chartData?.[variable]?.[score.day];
        if (similarDayData) {
          const simPoint = similarDayData.find((point) => point.HOURENDING === hour);
          if (simPoint) {
            const variableKey = Object.keys(simPoint).find((key) => {
              const keyUpper = key.toUpperCase();
              const varUpper = variable.toUpperCase();
              if (varUpper.includes("RT LOAD") && !varUpper.includes("NET")) {
                return keyUpper.includes("RTLOAD") && !keyUpper.includes("NET");
              } else if (varUpper.includes("RT NET LOAD")) {
                return keyUpper.includes("RTLOAD_NET") || keyUpper.includes("NET_OF_RENEWABLES");
              } else if (varUpper.includes("RT LMP")) {
                return keyUpper.includes("RTLMP");
              } else if (varUpper.includes("RT ENERGY")) {
                return keyUpper.includes("RTENERGY");
              } else if (varUpper.includes("RT CONGESTION")) {
                return keyUpper.includes("RTCONG");
              } else if (varUpper.includes("DA LMP")) {
                return keyUpper.includes("DALMP");
              } else if (varUpper.includes("DA LOAD") && !varUpper.includes("NET")) {
                return keyUpper.includes("DA_DEMAND_FORECAST") || keyUpper.includes("DADEMANDFORECAST");
              } else if (varUpper.includes("DA NET LOAD")) {
                return keyUpper.includes("DA NET DEMAND FC") || keyUpper.includes("DANETDEMANDFC");
              }
              return keyUpper.includes(varUpper.replace(/\s+/g, "")) || keyUpper.includes(varUpper.replace(/\s+/g, "_"));
            });
            if (variableKey) {
              hourData[`${score.day}_${variable.replace(/\s+/g, "_")}`] = simPoint[variableKey];
            }
          }
        }
      });
      chartData.push(hourData);
    }
    console.log(`🔍 Final chart data for ${variable}:`, chartData.slice(0, 3));
    return chartData;
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-6", children: "Likeday Parameters" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reference Mode" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${referenceMode === "historical" ? "text-gray-900" : "text-gray-500"}`, children: "Historical" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleModeToggle(referenceMode === "historical" ? "forecast" : "historical"),
                className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${referenceMode === "forecast" ? "bg-blue-600" : "bg-gray-300"}`,
                children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${referenceMode === "forecast" ? "translate-x-6" : "translate-x-1"}`
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${referenceMode === "forecast" ? "text-gray-900" : "text-gray-500"}`, children: "Forecast" })
          ] })
        ] }),
        referenceMode === "forecast" && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          scenarioLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: "Loading scenarios..." }) }) : availableScenarios.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-4", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-red-500", children: "No scenarios available" }) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Scenario ID" }),
              /* @__PURE__ */ jsx("div", { className: "w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-900 font-medium", children: selectedScenario?.scenarioid || "--" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Simulation Date" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowCalendar(!showCalendar),
                  className: "w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: selectedScenario ? formatDisplayDate(selectedScenario.simulation_date) : "Select Date" }),
                    /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) })
                  ]
                }
              ),
              showCalendar && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 mt-2 z-50", children: /* @__PURE__ */ jsx(
                CalendarPicker,
                {
                  availableDates: getAvailableDates(),
                  selectedDate: selectedScenario?.simulation_date || "",
                  onDateSelect: handleDateSelect,
                  onClose: () => setShowCalendar(false)
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Forecast Reference Date" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: referenceDate,
                  onChange: (e) => setReferenceDate(e.target.value),
                  className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  disabled: !selectedScenario || availableDates.length === 0,
                  children: availableDates.length === 0 ? /* @__PURE__ */ jsx("option", { value: "", children: "No dates available" }) : availableDates.map((date) => /* @__PURE__ */ jsx("option", { value: date, children: new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  }) }, date))
                }
              )
            ] })
          ] }),
          showCalendar && /* @__PURE__ */ jsx(
            "div",
            {
              className: "fixed inset-0 z-40",
              onClick: () => setShowCalendar(false)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
          referenceMode === "historical" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reference Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: referenceDate,
                onChange: (e) => setReferenceDate(e.target.value),
                max: new Date(Date.now() - 864e5).toISOString().split("T")[0],
                className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Historical Start Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Historical End Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                max: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Match Variable" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: matchVariable,
                onChange: (e) => setMatchVariable(e.target.value),
                className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                children: matchVariableOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option }, option))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Top N Similar Days" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: topN,
                onChange: (e) => setTopN(parseInt(e.target.value)),
                min: "1",
                max: "20",
                className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
              "Euclidean Weight: ",
              euclideanWeight.toFixed(2)
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: "0",
                max: "1",
                step: "0.1",
                value: euclideanWeight,
                onChange: (e) => setEuclideanWeight(parseFloat(e.target.value)),
                className: "w-full"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-gray-500 mt-1", children: [
              /* @__PURE__ */ jsx("span", { children: "Shape" }),
              /* @__PURE__ */ jsx("span", { children: "Magnitude" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleAnalysis,
          disabled: loading || referenceMode === "forecast" && !selectedScenario,
          className: "bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium",
          children: loading ? "Analyzing..." : "Run Likeday Analysis"
        }
      ) }),
      progress && /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-blue-600", children: progress }),
      error && /* @__PURE__ */ jsxs("div", { className: "mt-4 text-sm text-red-600", children: [
        "Error: ",
        error
      ] })
    ] }),
    debugInfo && /* @__PURE__ */ jsxs("div", { className: "bg-yellow-50 p-6 rounded-lg border border-yellow-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Debug Information" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Requested URL:" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all", children: debugInfo.requestedUrl })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Date Range:" }),
          " ",
          debugInfo.requestedDateRange
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Total Records:" }),
          " ",
          debugInfo.totalRecords
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Unique Days Found:" }),
          " ",
          debugInfo.uniqueDays.length,
          /* @__PURE__ */ jsx("div", { className: "mt-2 max-h-32 overflow-y-auto bg-gray-100 p-2 rounded", children: debugInfo.uniqueDays.join(", ") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Sample Data:" }),
          /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-40 overflow-y-auto bg-gray-100 p-2 rounded text-xs", children: JSON.stringify(debugInfo.sampleData, null, 2) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Date Format Examples:" }),
          /* @__PURE__ */ jsx("pre", { className: "mt-2 bg-gray-100 p-2 rounded text-xs", children: JSON.stringify(debugInfo.dateTimeFormat, null, 2) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Similarity Scores" }),
      results ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Rank" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Euclidean Distance" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Cosine Distance" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Combined Score" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: results.similarityScores.map((score, index) => /* @__PURE__ */ jsxs("tr", { className: index % 2 === 0 ? "bg-white" : "bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: score.rank }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(score.day) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: score.euclidean.toFixed(2) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: score.cosine.toFixed(4) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: score.combined_score.toFixed(4) })
        ] }, score.day)) })
      ] }) }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-gray-500", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-gray-900", children: "Run Analysis to See Results" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Similarity scores for the most similar historical days will appear here." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: results ? results.matchVariable : "Variable Comparison" }),
      results ? (() => {
        const chartData = processChartDataForVariable(results.matchVariable);
        if (chartData.length === 0) {
          return /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-gray-500", children: "No chart data available for the selected parameters." });
        }
        const generateBlueGradient = (count) => {
          const colors = [];
          for (let i = 0; i < count; i++) {
            const ratio = i / Math.max(count - 1, 1);
            const r = Math.floor(30 + 150 * ratio);
            const g = Math.floor(60 + 150 * ratio);
            const b = Math.floor(120 + 135 * ratio);
            colors.push(`rgb(${r}, ${g}, ${b})`);
          }
          return colors;
        };
        const blueColors = generateBlueGradient(results.topN);
        const yAxisLabel = getVariableUnit(results.matchVariable);
        const toggleLine = (lineKey) => {
          setVisibleLines((prev) => ({
            ...prev,
            [lineKey]: !prev[lineKey]
          }));
        };
        const formatTooltip = (value, name) => {
          if (name === "Reference") {
            return [`${value?.toFixed(2)} ${yAxisLabel}`, `Reference (${formatDate(results.referenceDate)})`];
          } else if (name.startsWith("Day ")) {
            const index = parseInt(name.split(" ")[1]) - 1;
            const similarDay = results.similarityScores[index];
            return [`${value?.toFixed(2)} ${yAxisLabel}`, `${similarDay.rank} (${formatDate(similarDay.day)})`];
          }
          return [`${value?.toFixed(2)} ${yAxisLabel}`, name];
        };
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleLine("reference"),
                className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${visibleLines.reference ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`,
                children: [
                  "Reference (",
                  formatDate(results.referenceDate),
                  ")"
                ]
              }
            ),
            results.similarityScores.slice(0, topN).map((score, index) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleLine(score.day),
                className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${visibleLines[score.day] ? "text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`,
                style: {
                  backgroundColor: visibleLines[score.day] ? blueColors[index] : void 0
                },
                children: [
                  "#",
                  score.rank,
                  " (",
                  formatDate(score.day),
                  ")"
                ]
              },
              score.day
            ))
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "h-96", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: chartData, margin: { top: 40, right: 30, left: 40, bottom: 80 }, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "hour",
                type: "number",
                domain: [1, 24],
                ticks: [1, 4, 8, 12, 16, 20, 24],
                label: { value: "Hour", position: "bottom", offset: 0 }
              }
            ),
            /* @__PURE__ */ jsx(YAxis, { label: { value: yAxisLabel, angle: -90, position: "insideLeft" } }),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                formatter: formatTooltip,
                labelFormatter: (hour) => `Hour ${hour}`,
                contentStyle: {
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              Legend,
              {
                verticalAlign: "bottom",
                wrapperStyle: { paddingTop: "20px" }
              }
            ),
            /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: `reference_${results.matchVariable.replace(/\s+/g, "_")}`,
                stroke: "#EF4444",
                strokeWidth: 3,
                dot: false,
                name: "Reference",
                connectNulls: false,
                hide: !visibleLines.reference
              }
            ),
            results.similarityScores.slice(0, topN).map((score, index) => /* @__PURE__ */ jsx(
              Line,
              {
                type: "monotone",
                dataKey: `${score.day}_${results.matchVariable.replace(/\s+/g, "_")}`,
                stroke: blueColors[index],
                strokeWidth: 2,
                dot: false,
                name: `${score.rank} (${formatDate(score.day)})`,
                connectNulls: false,
                hide: !visibleLines[score.day]
              },
              score.day
            ))
          ] }) }) })
        ] });
      })() : /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-gray-500", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-gray-900", children: "Run Analysis to See Chart" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Reference date vs similar historical days comparison will appear here." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg border border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Secondary Variable Comparison" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-48", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Compare Variable" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: secondaryVariable,
                onChange: (e) => {
                  setSecondaryVariable(e.target.value);
                  setSecondaryData(null);
                },
                disabled: !results,
                className: `w-full p-2 border border-gray-300 rounded-md text-sm ${!results ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"}`,
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select variable..." }),
                  secondaryVariableOptions.filter((variable) => variable !== matchVariable).map((variable) => /* @__PURE__ */ jsx("option", { value: variable, children: variable }, variable))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSecondaryAnalysis,
              disabled: !results || !secondaryVariable || secondaryLoading,
              className: "bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm",
              children: secondaryLoading ? "Loading..." : "Compare"
            }
          )
        ] })
      ] }),
      results && secondaryVariable && secondaryData ? /* @__PURE__ */ jsx("div", { className: "h-96", children: (() => {
        const chartData = processChartDataForSecondaryVariable(secondaryVariable, secondaryData);
        const generateBlueGradient = (count) => {
          const colors = [];
          for (let i = 0; i < count; i++) {
            const ratio = i / Math.max(count - 1, 1);
            const r = Math.floor(30 + 150 * ratio);
            const g = Math.floor(60 + 150 * ratio);
            const b = Math.floor(120 + 135 * ratio);
            colors.push(`rgb(${r}, ${g}, ${b})`);
          }
          return colors;
        };
        const blueColors = generateBlueGradient(topN);
        const toggleSecondaryLine = (lineKey) => {
          setSecondaryVisibleLines((prev) => ({
            ...prev,
            [lineKey]: !prev[lineKey]
          }));
        };
        console.log("🔍 Secondary chart data:", chartData.length, "points");
        if (chartData.length > 0) {
          console.log("🔍 First hour keys:", Object.keys(chartData[0]));
          console.log("🔍 First hour data:", chartData[0]);
        }
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleSecondaryLine("reference"),
                className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${secondaryVisibleLines.reference ? "bg-red-500 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`,
                children: [
                  "Reference (",
                  formatDate(referenceDate),
                  ")"
                ]
              }
            ),
            results.similarityScores.slice(0, topN).map((score, index) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleSecondaryLine(score.day),
                className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${secondaryVisibleLines[score.day] ? "text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`,
                style: {
                  backgroundColor: secondaryVisibleLines[score.day] ? blueColors[index] : void 0
                },
                children: [
                  "#",
                  score.rank,
                  " (",
                  formatDate(score.day),
                  ")"
                ]
              },
              score.day
            ))
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "h-96", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            LineChart,
            {
              data: chartData,
              margin: { top: 20, right: 30, left: 60, bottom: 80 },
              children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "hour",
                    domain: [1, 24],
                    type: "number",
                    ticks: [1, 4, 8, 12, 16, 20, 24],
                    tick: { fontSize: 12 },
                    label: { value: "Hour", position: "bottom", offset: 0 }
                  }
                ),
                /* @__PURE__ */ jsx(
                  YAxis,
                  {
                    tick: { fontSize: 12 },
                    label: {
                      value: `${secondaryVariable} (${getVariableUnit(secondaryVariable)})`,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" }
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    formatter: (value, name) => [
                      typeof value === "number" ? value.toFixed(2) : value,
                      name
                    ],
                    labelFormatter: (hour) => `Hour ${hour}`
                  }
                ),
                /* @__PURE__ */ jsx(
                  Legend,
                  {
                    wrapperStyle: { paddingTop: "20px" },
                    verticalAlign: "bottom"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: `reference_${secondaryVariable.replace(/\s+/g, "_")}`,
                    stroke: "#EF4444",
                    strokeWidth: 3,
                    dot: false,
                    name: "Reference",
                    hide: !secondaryVisibleLines.reference
                  }
                ),
                (() => {
                  const generateBlueGradient2 = (count) => {
                    const colors = [];
                    for (let i = 0; i < count; i++) {
                      const ratio = i / Math.max(count - 1, 1);
                      const r = Math.floor(30 + 150 * ratio);
                      const g = Math.floor(60 + 150 * ratio);
                      const b = Math.floor(120 + 135 * ratio);
                      colors.push(`rgb(${r}, ${g}, ${b})`);
                    }
                    return colors;
                  };
                  const blueColors2 = generateBlueGradient2(topN);
                  return results.similarityScores.slice(0, topN).map((score, index) => /* @__PURE__ */ jsx(
                    Line,
                    {
                      type: "monotone",
                      dataKey: `${score.day}_${secondaryVariable.replace(/\s+/g, "_")}`,
                      stroke: blueColors2[index],
                      strokeWidth: 2,
                      dot: false,
                      name: `${score.rank} (${formatDate(score.day)})`,
                      hide: !secondaryVisibleLines[score.day]
                    },
                    score.day
                  ));
                })()
              ]
            }
          ) }) })
        ] });
      })() }) : /* @__PURE__ */ jsx("div", { className: "h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-gray-400", children: [
        /* @__PURE__ */ jsx("svg", { className: "mx-auto h-12 w-12 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-medium mb-2", children: "Secondary Variable Comparison" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: !results ? "Run analysis first, then select a variable and click Compare" : !secondaryVariable ? "Select a variable from the dropdown and click Compare" : "Click the Compare button to load this variable's data" })
      ] }) })
    ] })
  ] });
};

function LikedayPage() {
  return /* @__PURE__ */ jsx("div", { className: "py-12 space-y-12", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx(LikedayAnalysis, {}) }) }) });
}

const $$Likeday = createComponent(($$result, $$props, $$slots) => {
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Likeday Tool", "pageTitle": "Short Term Outlook", "subNavLinks": subNavLinks }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "LikedayPage", LikedayPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/LikedayPage", "client:component-export": "default" })} ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/likeday.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/short-term-outlook/likeday.astro";
const $$url = "/short-term-outlook/likeday";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Likeday,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
