import React, { useState, useEffect } from 'react';
import { API_CATEGORIES } from '../../lib/api-test-config';

interface CategoryStatus {
  [key: string]: 'healthy' | 'warning' | 'error' | 'pending';
}

interface APIHealthSummary {
  categoryStatus: CategoryStatus;
  lastChecked: string | null;
  overallStatus: 'healthy' | 'warning' | 'error' | 'loading';
}

const APIHealthCard: React.FC = () => {
  const [summary, setSummary] = useState<APIHealthSummary>({
    categoryStatus: {},
    lastChecked: null,
    overallStatus: 'loading'
  });

  useEffect(() => {
    // Load last test results from localStorage
    const loadStoredResults = () => {
      try {
        const stored = localStorage.getItem('apiHealthResults');
        if (stored) {
          const data = JSON.parse(stored);
          
          // Calculate category statuses
          const categoryStatus: CategoryStatus = {};
          Object.values(API_CATEGORIES).forEach(category => {
            const categoryResults = data.results?.filter((r: any) => r.category === category) || [];
            if (categoryResults.length === 0) {
              categoryStatus[category] = 'pending';
            } else {
              const hasErrors = categoryResults.some((r: any) => r.status === 'error');
              const hasWarnings = categoryResults.some((r: any) => r.status === 'warning');
              categoryStatus[category] = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
            }
          });

          // Determine overall status
          const statuses = Object.values(categoryStatus);
          const overallStatus = statuses.includes('error') ? 'error' 
            : statuses.includes('warning') ? 'warning'
            : statuses.includes('pending') ? 'loading'
            : 'healthy';

          setSummary({
            categoryStatus,
            lastChecked: data.timestamp || null,
            overallStatus
          });
        }
      } catch (error) {
        console.error('Failed to load API health results:', error);
      }
    };

    loadStoredResults();
    
    // Re-check every 30 seconds in case tests are running
    const interval = setInterval(loadStoredResults, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    window.location.href = '/admin/api-health';
  };

  const getStatusColor = () => {
    switch (summary.overallStatus) {
      case 'healthy': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      default: return 'border-blue-500';
    }
  };

  const getStatusIcon = () => {
    switch (summary.overallStatus) {
      case 'healthy':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
        );
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getStatusColor()} hover:shadow-lg transition-shadow cursor-pointer w-full text-left`}
    >
      <div className="flex items-start">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Content */}
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">API Health Check</h3>
          <p className="text-gray-600 text-sm mb-3">
            Monitor API endpoints, response times, and system status
          </p>
          
          {Object.keys(summary.categoryStatus).length > 0 && (
            <div className="space-y-1 text-sm">
              {Object.entries(summary.categoryStatus).map(([category, status]) => (
                <div key={category} className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    status === 'healthy' ? 'bg-green-500' :
                    status === 'warning' ? 'bg-yellow-500' :
                    status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-gray-700">{category}: <span className="font-medium capitalize">{status}</span></span>
                </div>
              ))}
              {summary.lastChecked && (
                <div className="text-gray-500 text-xs mt-2">
                  Checked: {new Date(summary.lastChecked).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default APIHealthCard;

