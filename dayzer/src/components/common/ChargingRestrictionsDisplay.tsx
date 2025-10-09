import React from 'react';

interface ChargingRestrictionsDisplayProps {
  restrictions?: number[];
  month?: string;
}

export default function ChargingRestrictionsDisplay({ 
  restrictions = [11.0, 41.3, 41.3, 41.3, 41.3, 41.3, 41.3, 11.0, 11.0, 11.0, 
                  0, 0, 0, 0, 0, 0, 0, 0, 0, 11.0, 11.0, 11.0, 11.0, 11.0],
  month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}: ChargingRestrictionsDisplayProps) {
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Charging Restrictions</h3>
        <p className="text-sm text-gray-600 mt-1">{month}</p>
      </div>

      {/* Restrictions Text Display */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-700 font-mono leading-relaxed text-center">
          {restrictions.map((limit, index) => `${limit.toFixed(1)}`).join(', ')}
        </p>
      </div>

      {/* Explanation */}
      <div className="mt-4 text-center text-xs text-gray-600">
        <p>24 hourly values (Hour Beginning 0-23) representing maximum charging capacity (MW) for each hour</p>
      </div>
    </div>
  );
}

