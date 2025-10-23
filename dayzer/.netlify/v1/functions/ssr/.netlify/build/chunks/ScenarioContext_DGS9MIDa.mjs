import { jsx } from 'react/jsx-runtime';
import { createContext, useContext, useState, useEffect } from 'react';

const ScenarioContext = createContext(void 0);
function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === void 0) {
    throw new Error("useScenario must be used within a ScenarioProvider");
  }
  return context;
}
function ScenarioProvider({ children }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [availableScenarios, setAvailableScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchAvailableScenarios = async () => {
      try {
        const response = await fetch("/api/available-scenarios");
        if (!response.ok) {
          throw new Error("Failed to fetch available scenarios");
        }
        const data = await response.json();
        console.log("Fetched scenarios data:", data);
        setAvailableScenarios(data.scenarios || []);
        if (data.defaultScenario) {
          console.log("Setting default scenario:", data.defaultScenario);
          setSelectedScenario(data.defaultScenario);
        } else {
          console.log("No default scenario found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Failed to fetch scenarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableScenarios();
  }, []);
  return /* @__PURE__ */ jsx(
    ScenarioContext.Provider,
    {
      value: {
        selectedScenario,
        availableScenarios,
        setSelectedScenario,
        loading,
        error
      },
      children
    }
  );
}

export { ScenarioProvider as S, useScenario as u };
