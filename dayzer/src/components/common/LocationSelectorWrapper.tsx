import React, { useState, useEffect } from 'react';
import { LocationSelector } from './LocationSelector';

interface LocationOption {
  id: string;
  name: string;
  market?: string;
}

interface LocationSelectorWrapperProps {
  locations: LocationOption[];
  defaultLocation?: string;
  onLocationChange?: (location: string) => void;
}

export const LocationSelectorWrapper: React.FC<LocationSelectorWrapperProps> = ({
  locations,
  defaultLocation = 'caiso-goleta',
  onLocationChange
}) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    
    // Toggle content visibility
    const caisoContent = document.getElementById('caiso-goleta-content');
    const comingSoonMessage = document.getElementById('coming-soon-message');
    
    if (caisoContent && comingSoonMessage) {
      if (location === 'ercot-hidden-lakes') {
        caisoContent.classList.add('hidden');
        comingSoonMessage.classList.remove('hidden');
      } else {
        caisoContent.classList.remove('hidden');
        comingSoonMessage.classList.add('hidden');
      }
    }
    
    // Call callback if provided
    if (onLocationChange) {
      onLocationChange(location);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <h1 className="text-2xl font-bold whitespace-nowrap">Select a Location</h1>
      <LocationSelector 
        value={selectedLocation}
        onChange={handleLocationChange}
        locations={locations}
      />
    </div>
  );
};

