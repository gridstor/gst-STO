import React from 'react';

interface LocationOption {
  id: string;
  name: string;
  market?: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  locations: LocationOption[];
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  locations
}) => {
  return (
    <div className="flex-1 max-w-xl">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-gray-300 py-2.5 px-4 text-base font-medium focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-sm bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="Select Location"
      >
        <option value="">Select a location...</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>
            {loc.market ? `${loc.market} - ${loc.name}` : loc.name}
          </option>
        ))}
      </select>
    </div>
  );
};

