/**
 * MarketCard Component
 * 
 * The main data display card with customizable sections and accent colors.
 * From the GridStor Design System.
 */

import React from 'react';
import { MetricBox } from './MetricBox';

export type AccentColor = 'blue' | 'red' | 'green' | 'purple' | 'gray';

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
}

export interface Summary {
  label: string;
  value: string | number;
  unit?: string;
}

export interface Highlight {
  leftLabel: string;
  leftValue: string | number;
  rightLabel: string;
  rightValue: string | number;
}

export interface MarketCardProps {
  /** Card title (required) */
  marketName: string;
  /** Optional category badge */
  badge?: string;
  /** Left border color */
  accentColor: AccentColor;
  /** Last updated timestamp */
  timestamp?: string;
  /** Year-over-year percentage change (shows +/- indicator) */
  yoyChange?: number;
  /** Array of metric objects (2x2 grid) */
  metrics: Metric[];
  /** Full-width highlighted metric */
  highlightedMetric?: Metric;
  /** Left summary metric */
  summaryLeft?: Summary;
  /** Right summary metric */
  summaryRight?: Summary;
  /** Bottom 2-column highlight box */
  finalHighlight?: Highlight;
}

const accentColors: Record<AccentColor, string> = {
  blue: '#3B82F6',
  red: '#EF4444',
  green: '#10B981',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

export function MarketCard({
  marketName,
  badge,
  accentColor,
  timestamp,
  yoyChange,
  metrics,
  highlightedMetric,
  summaryLeft,
  summaryRight,
  finalHighlight,
}: MarketCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-gs-sm hover:shadow-gs-lg transition-shadow duration-gs-base overflow-hidden"
      style={{
        borderLeft: `4px solid ${accentColors[accentColor]}`,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gs-gray-900 m-0">
              {marketName}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gs-gray-100 text-gs-gray-700 rounded">
                {badge}
              </span>
            )}
          </div>
          {yoyChange !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                yoyChange >= 0 ? 'text-gs-green-600' : 'text-gs-red-600'
              }`}
            >
              {yoyChange >= 0 ? '↑' : '↓'}
              <span className="font-mono">{Math.abs(yoyChange)}%</span>
            </div>
          )}
        </div>

        {timestamp && (
          <div className="text-xs text-gs-gray-500 mb-4">
            Updated: {timestamp}
          </div>
        )}

        {/* Metrics Grid (2x2) */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {metrics.map((metric, index) => (
              <MetricBox
                key={index}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
                variant={metric.variant}
              />
            ))}
          </div>
        )}

        {/* Highlighted Metric */}
        {highlightedMetric && (
          <div className="mb-4">
            <MetricBox
              label={highlightedMetric.label}
              value={highlightedMetric.value}
              unit={highlightedMetric.unit}
              variant={highlightedMetric.variant}
            />
          </div>
        )}

        {/* Summary Section */}
        {(summaryLeft || summaryRight) && (
          <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gs-gray-200">
            {summaryLeft && (
              <div>
                <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-1">
                  {summaryLeft.label}
                </div>
                <div className="text-xl font-bold text-gs-gray-900 font-mono">
                  {summaryLeft.value}
                </div>
                {summaryLeft.unit && (
                  <div className="text-xs text-gs-gray-500">
                    {summaryLeft.unit}
                  </div>
                )}
              </div>
            )}
            {summaryRight && (
              <div>
                <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-1">
                  {summaryRight.label}
                </div>
                <div className="text-xl font-bold text-gs-gray-900 font-mono">
                  {summaryRight.value}
                </div>
                {summaryRight.unit && (
                  <div className="text-xs text-gs-gray-500">
                    {summaryRight.unit}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Final Highlight */}
        {finalHighlight && (
          <div className="grid grid-cols-2 gap-4 bg-gs-gray-50 rounded-lg p-4">
            <div>
              <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-1">
                {finalHighlight.leftLabel}
              </div>
              <div className="text-lg font-bold text-gs-gray-900 font-mono">
                {finalHighlight.leftValue}
              </div>
            </div>
            <div>
              <div className="text-xs text-gs-gray-600 uppercase tracking-wide mb-1">
                {finalHighlight.rightLabel}
              </div>
              <div className="text-lg font-bold text-gs-gray-900 font-mono">
                {finalHighlight.rightValue}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




