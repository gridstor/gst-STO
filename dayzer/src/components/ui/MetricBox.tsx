/**
 * MetricBox Component
 * 
 * Individual metric display with label, value, and unit
 */

import React from 'react';

export interface MetricBoxProps {
  /** Metric label (displayed uppercase) */
  label: string;
  /** Numeric or text value */
  value: string | number;
  /** Optional unit display */
  unit?: string;
  /** Background variant */
  variant?: 'neutral' | 'success' | 'warning' | 'info';
}

const variantStyles: Record<string, string> = {
  neutral: 'bg-gs-gray-50',
  success: 'bg-gs-green-50',
  warning: 'bg-gs-yellow-50',
  info: 'bg-gs-blue-50',
};

export function MetricBox({ label, value, unit, variant = 'neutral' }: MetricBoxProps) {
  return (
    <div className={`${variantStyles[variant]} rounded-lg p-4`}>
      <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-2 font-medium">
        {label}
      </div>
      <div className="text-2xl font-bold text-gs-gray-900 font-mono">
        {value}
      </div>
      {unit && (
        <div className="text-xs text-gs-gray-500 mt-1">
          {unit}
        </div>
      )}
    </div>
  );
}

