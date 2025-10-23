import React, { useEffect, useState } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

interface CongestionData {
  datetime: string;
  'Total Congestion': number;
  Other: number;
  [constraintName: string]: string | number;
}

interface CongestionResponse {
  scenarioid: number;
  data: CongestionData[];
  metadata: {
    constraintNames: string[];
    constraintDetails: any;
  };
}

interface ImpactfulConstraint {
  name: string;
  averageCongestionCost: number; // This will be the signed average for binding hours only
  absoluteAverage: number; // This will be used for sorting
  bindingHours: number; // Number of hours when constraint bound (non-zero)
}

interface ConstraintDetail {
  datetime: string;
  congestionCost: number;
  shiftFactor: number;
  shadowPrice: number;
}

interface ImpactfulConstraintsProps {
  // Removed constraint selection props
}

export default function ImpactfulConstraints() {
  const { selectedScenario } = useScenario();
  const [constraints, setConstraints] = useState<ImpactfulConstraint[]>([]);
  const [selectedConstraint, setSelectedConstraint] = useState<string | null>(null);
  const [constraintDetails, setConstraintDetails] = useState<ConstraintDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Initialize all hours by default
  const defaultHours = Array.from({length: 24}, (_, i) => i + 1);
  const [appliedHours, setAppliedHours] = useState<number[]>(defaultHours); // Hours currently applied to analysis
  const [pendingHours, setPendingHours] = useState<number[]>(defaultHours); // Hours selected in dropdown but not yet applied
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper function to extract hour from datetime string
  const getHourFromDatetime = (datetime: string): number => {
    const date = new Date(datetime);
    return date.getHours() === 0 ? 24 : date.getHours(); // Convert 0 to 24 for HE24
  };

  // Helper function to filter data by selected hours
  const filterDataByHours = (data: CongestionData[]): CongestionData[] => {
    return data.filter(dataPoint => {
      const hour = getHourFromDatetime(dataPoint.datetime);
      return appliedHours.includes(hour); // Use appliedHours instead of selectedHours
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
          throw new Error('Failed to fetch congestion data');
        }
        const result: CongestionResponse = await response.json();
        
        // Filter data by applied hours before processing
        const filteredData = filterDataByHours(result.data);
        
        // Process data to find most impactful constraints
        const constraintImpacts = processConstraintData(filteredData, result.metadata.constraintNames);
        setConstraints(constraintImpacts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedScenario, appliedHours]); // Depend on appliedHours instead of selectedHours

  const handleConstraintClick = async (constraintName: string) => {
    setSelectedConstraint(constraintName);
    setDetailsLoading(true);

    try {
      const response = await fetch(`/api/congestion-plot?scenarioid=${selectedScenario?.scenarioid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch constraint details');
      }
      const result: CongestionResponse = await response.json();
      
      // Filter data by applied hours before processing details
      const filteredData = filterDataByHours(result.data);
      
      // Process detailed data for the selected constraint
      const details = processConstraintDetails(filteredData, result.metadata, constraintName);
      setConstraintDetails(details);
    } catch (err) {
      console.error('Error fetching constraint details:', err);
      setConstraintDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const processConstraintDetails = (
    data: CongestionData[], 
    metadata: any, 
    constraintName: string
  ): ConstraintDetail[] => {
    const details: ConstraintDetail[] = [];

    data.forEach(dataPoint => {
      const congestionCost = Number(dataPoint[constraintName]) || 0;
      
      // Only include binding hours (where congestion > 0.001)
      if (Math.abs(congestionCost) > 0.001) {
        const constraintMetadata = metadata.constraintDetails[constraintName]?.[dataPoint.datetime];
        
        details.push({
          datetime: dataPoint.datetime,
          congestionCost: congestionCost,
          shiftFactor: constraintMetadata?.shiftFactor || 0,
          shadowPrice: constraintMetadata?.shadowprice || 0,
        });
      }
    });

    // Sort by datetime ascending (earliest to latest)
    return details.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  };

  const processConstraintData = (data: CongestionData[], constraintNames: string[]): ImpactfulConstraint[] => {
    if (!data || data.length === 0 || !constraintNames || constraintNames.length === 0) {
      return [];
    }

    // Calculate absolute totals (for ranking), signed totals (for display), and binding hours
    const constraintAbsoluteTotals: { [key: string]: number } = {};
    const constraintSignedTotals: { [key: string]: number } = {};
    const constraintBindingHours: { [key: string]: number } = {};
    
    constraintNames.forEach(constraintName => {
      constraintAbsoluteTotals[constraintName] = 0;
      constraintSignedTotals[constraintName] = 0;
      constraintBindingHours[constraintName] = 0;
    });

    // Sum absolute values, signed values, and count binding hours for each constraint
    data.forEach(dataPoint => {
      constraintNames.forEach(constraintName => {
        const congestionValue = Number(dataPoint[constraintName]) || 0;
        
        if (Math.abs(congestionValue) > 0.001) { // Consider anything above 0.001 as "binding"
          constraintAbsoluteTotals[constraintName] += Math.abs(congestionValue);
          constraintSignedTotals[constraintName] += congestionValue;
          constraintBindingHours[constraintName] += 1;
        }
      });
    });

    // Calculate averages and create result array
    const results: ImpactfulConstraint[] = constraintNames.map(constraintName => {
      const bindingHours = constraintBindingHours[constraintName];
      return {
        name: constraintName,
        averageCongestionCost: bindingHours > 0 ? constraintSignedTotals[constraintName] / bindingHours : 0, // Average when binding
        absoluteAverage: bindingHours > 0 ? constraintAbsoluteTotals[constraintName] / bindingHours : 0, // For sorting, also when binding
        bindingHours: bindingHours
      };
    });

    // Sort by highest absolute average (most impactful when binding) and take top 8
    return results
      .filter(constraint => constraint.absoluteAverage > 0.01) // Filter out very small absolute values
      .sort((a, b) => b.absoluteAverage - a.absoluteAverage)
      .slice(0, 8);
  };

  // Handle hour selection in dropdown (only affects pending hours)
  const handleHourToggle = (hour: number) => {
    setPendingHours(prev => {
      if (prev.includes(hour)) {
        return prev.filter(h => h !== hour);
      } else {
        return [...prev, hour].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllHours = () => {
    setPendingHours(Array.from({length: 24}, (_, i) => i + 1));
  };

  const handleDeselectAllHours = () => {
    setPendingHours([]);
  };

  // Apply the pending hours to the analysis
  const handleApplyHours = () => {
    setAppliedHours([...pendingHours]);
    setSelectedConstraint(null); // Reset selected constraint when applying new hours
    setConstraintDetails([]);
    setIsDropdownOpen(false);
  };

  // Check if there are pending changes
  const hasPendingChanges = JSON.stringify(pendingHours.sort()) !== JSON.stringify(appliedHours.sort());

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.hour-filter-dropdown')) {
          setIsDropdownOpen(false);
          // Reset pending hours to applied hours when closing without applying
          setPendingHours([...appliedHours]);
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
        // Reset pending hours to applied hours when closing without applying
        setPendingHours([...appliedHours]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen, appliedHours]);

  // Function to shorten constraint names for display
  const shortenConstraintName = (name: string) => {
    const parts = name.split('_');
    if (parts.length > 2) {
      // Take first 2 parts and last part, limit total length
      const shortened = `${parts[0]}_${parts[1]}...${parts[parts.length - 1]}`;
      return shortened.length > 35 ? shortened.substring(0, 35) + '...' : shortened;
    }
    return name.length > 35 ? name.substring(0, 35) + '...' : name;
  };

  // Format datetime for display
  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateTimeString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-gs-sm border border-gs-gray-200 h-full flex items-center justify-center">
        <div className="text-gs-gray-500 text-sm">Loading constraints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-gs-sm border border-gs-gray-200 h-full flex items-center justify-center">
        <div className="text-red-500 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (constraints.length === 0 && appliedHours.length > 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-gs-sm border border-gs-gray-200 h-full flex items-center justify-center">
        <div className="text-gs-gray-500 text-sm">No constraint data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-gs-sm border-l-4 border-gs-blue-500 w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gs-gray-900 mb-6">Impactful Constraints</h3>

      {/* Hour Filter Dropdown */}
      <div className="mb-4 flex-shrink-0">
        <div className="relative hour-filter-dropdown">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              // Reset pending hours to applied hours when opening dropdown
              if (!isDropdownOpen) {
                setPendingHours([...appliedHours]);
              }
            }}
            className="w-full bg-white border border-gs-gray-300 rounded-md px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-gs-gray-700">
              {appliedHours.length === 24 
                ? 'All Hours' 
                : appliedHours.length === 0 
                  ? 'No Hours Selected' 
                  : `${appliedHours.length} Hour${appliedHours.length !== 1 ? 's' : ''} Selected`}
            </span>
            {hasPendingChanges && (
              <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full" title="Pending changes"></span>
            )}
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gs-gray-300 rounded-md shadow-gs-sm max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-gs-gray-200">
                <button
                  onClick={handleSelectAllHours}
                  className="text-xs text-blue-600 hover:text-blue-800 mr-4"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllHours}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Deselect All
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1 p-2">
                {Array.from({length: 24}, (_, i) => i + 1).map(hour => (
                  <label key={hour} className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={pendingHours.includes(hour)}
                      onChange={() => handleHourToggle(hour)}
                      className="h-3 w-3 text-blue-600 rounded border-gs-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gs-gray-700">HE{hour}</span>
                  </label>
                ))}
              </div>
              {hasPendingChanges && (
                <div className="p-2 border-t border-gs-gray-200">
                  <button
                    onClick={handleApplyHours}
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm font-medium"
                  >
                    Apply ({pendingHours.length} Hour{pendingHours.length !== 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Constraints Table */}
      <div className="flex-1 min-h-0 mb-6 flex flex-col">
        {appliedHours.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gs-gray-500 text-sm">
            Please select at least one hour to view constraint analysis
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gs-gray-50 sticky top-0">
                <tr className="border-b border-gs-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gs-gray-700">Constraint Name</th>
                  <th className="text-right py-2 px-2 font-medium text-gs-gray-700">Avg Congestion ($/MWh)</th>
                  <th className="text-right py-2 px-2 font-medium text-gs-gray-700">Hours</th>
                </tr>
              </thead>
              <tbody>
                {constraints.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gs-gray-500 text-sm">
                      No constraint data available for selected hours
                    </td>
                  </tr>
                ) : (
                  constraints.map((constraint, index) => (
                    <tr 
                      key={constraint.name} 
                      className={
                        selectedConstraint === constraint.name 
                          ? 'bg-blue-50' 
                          : index % 2 === 0 ? 'bg-white' : 'bg-gs-gray-50'
                      }
                    >
                      <td 
                        className={`py-2 px-2 font-medium cursor-pointer hover:bg-blue-100 ${
                          selectedConstraint === constraint.name ? 'text-blue-600' : 'text-gs-gray-800'
                        }`}
                        title={constraint.name} // Show full name on hover
                        onClick={() => handleConstraintClick(constraint.name)}
                      >
                        {shortenConstraintName(constraint.name)}
                      </td>
                      <td className={`py-2 px-2 text-right font-mono font-medium ${
                        constraint.averageCongestionCost > 0 
                          ? 'text-green-600' // Positive = green
                          : constraint.averageCongestionCost < 0 
                          ? 'text-red-600' // Negative = red
                          : 'text-gs-gray-800' // Zero = gray
                      }`}>
                        {constraint.averageCongestionCost >= 0 ? '+' : ''}{constraint.averageCongestionCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-gs-gray-800 font-mono">
                        {constraint.bindingHours}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Table - Match congestion analysis height */}
      <div className="border-t border-gs-gray-200 pt-6 flex-shrink-0" style={{ height: '320px' }}>
        <h4 className="text-lg font-medium text-gs-gray-800 mb-4">Constraint Details</h4>
        
        <div className="overflow-x-auto" style={{ height: 'calc(100% - 40px)' }}>
          <table className="min-w-full bg-gs-gray-50 border border-gs-gray-200 rounded-lg">
            <thead className="bg-gs-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gs-gray-700 border-b">Datetime</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b">Congestion ($/MWh)</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b">Shift Factor</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gs-gray-700 border-b">Shadow Price ($/MWh)</th>
              </tr>
            </thead>
            <tbody>
              {appliedHours.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gs-gray-500 text-sm">
                    Please select at least one hour to view constraint details
                  </td>
                </tr>
              ) : !selectedConstraint ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gs-gray-500 text-sm">
                    Click on a constraint name above to view detailed information
                  </td>
                </tr>
              ) : detailsLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gs-gray-500 text-sm">
                    Loading constraint details...
                  </td>
                </tr>
              ) : constraintDetails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gs-gray-500 text-sm">
                    No binding hours found for this constraint in selected hours
                  </td>
                </tr>
              ) : (
                constraintDetails.map((detail, index) => (
                  <tr key={detail.datetime} className="hover:bg-gs-gray-100">
                    <td className="px-4 py-2 text-sm text-gs-gray-800 border-b">
                      {formatDateTime(detail.datetime)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right border-b font-mono ${
                      detail.congestionCost > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {detail.congestionCost >= 0 ? '+' : ''}${detail.congestionCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right border-b font-mono">
                      {detail.shiftFactor.toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right border-b font-mono">
                      ${detail.shadowPrice.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 