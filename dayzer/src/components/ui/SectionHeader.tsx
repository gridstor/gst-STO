/**
 * SectionHeader Component
 * 
 * Consistent section titles and descriptions for GridStor dashboards
 */

import React from 'react';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional description text */
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-semibold text-gs-gray-900 mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-gs-gray-600 text-base max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}


