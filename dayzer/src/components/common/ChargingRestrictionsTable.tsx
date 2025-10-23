import React, { useEffect, useState } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';

export default function ChargingRestrictionsTable() {
  const { selectedScenario } = useScenario();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());

  // Get current month from scenario's simulation date
  useEffect(() => {
    if (selectedScenario?.simulation_date) {
      const date = new Date(selectedScenario.simulation_date);
      setCurrentMonthIndex(date.getMonth());
    }
  }, [selectedScenario]);

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gs-gray-100">
          <th className="border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700">Time Period</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 0 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jan</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 1 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Feb</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 2 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Mar</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 3 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Apr</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 4 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>May</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 5 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jun</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 6 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Jul</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 7 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Aug</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 8 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Sep</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 9 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Oct</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 10 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Nov</th>
          <th className={`border border-gs-gray-300 px-4 py-3 text-sm font-semibold text-gs-gray-700 ${currentMonthIndex === 11 ? 'border-t-2 border-l-2 border-r-2 border-gs-blue-500' : ''}`}>Dec</th>
        </tr>
      </thead>
      <tbody>
        {/* Row 1: 1 AM - 7 AM */}
        <tr className="bg-blue-50">
          <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">1 AM - 7 AM</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>39.9</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>40.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>33.9</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>29.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>37.1</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>45.3</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>37.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>36.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>34.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>41.3</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>40.1</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>42.3</td>
        </tr>
        
        {/* Row 2: 7 AM - 10 AM */}
        <tr className="bg-white">
          <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">7 AM - 10 AM</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>2.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>4.7</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>15.3</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>25.5</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>19.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>3.5</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>1.7</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>2.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>5.2</td>
        </tr>
        
        {/* Row 3: 10 AM - 7 PM */}
        <tr className="bg-red-50">
          <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">10 AM - 7 PM</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>6.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.7</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>24.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>24.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>20.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono bg-red-200 ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>0.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>11.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-gs-blue-500' : ''}`}>7.1</td>
        </tr>
        
        {/* Row 4: 7 PM - 1 AM */}
        <tr className="bg-yellow-50">
          <td className="border border-gs-gray-300 px-4 py-3 text-sm font-medium text-gs-gray-700">7 PM - 1 AM</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 0 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>8.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 1 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>6.3</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 2 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>4.7</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 3 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>25.4</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 4 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>28.9</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 5 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>30.8</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 6 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>5.6</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 7 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>0.5</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 8 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>6.1</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 9 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>11.0</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 10 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>14.3</td>
          <td className={`border border-gs-gray-300 px-4 py-3 text-sm text-center font-mono ${currentMonthIndex === 11 ? 'border-l-2 border-r-2 border-b-2 border-gs-blue-500' : ''}`}>8.2</td>
        </tr>
      </tbody>
    </table>
  );
}
