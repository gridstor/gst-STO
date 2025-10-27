import React, { useState } from 'react';
import type { APIEndpoint } from '../../lib/api-test-config';
import type { TestResult } from './APIHealthCheck';

interface APIStatusCardProps {
  category: string;
  endpoints: APIEndpoint[];
  results: TestResult[];
}

const APIStatusCard: React.FC<APIStatusCardProps> = ({ category, endpoints, results }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCount = endpoints.length;
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;
  const testingCount = results.filter(r => r.status === 'testing').length;

  const getStatusColor = () => {
    if (errorCount > 0) return 'red';
    if (warningCount > 0) return 'yellow';
    if (successCount === totalCount) return 'green';
    return 'gray';
  };

  const statusColor = getStatusColor();

  const getStatusIcon = () => {
    if (testingCount > 0) {
      return (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
      );
    }
    if (errorCount > 0) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    if (warningCount > 0) {
      return (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (successCount === totalCount) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${
      statusColor === 'green' ? 'border-green-500' :
      statusColor === 'yellow' ? 'border-yellow-500' :
      statusColor === 'red' ? 'border-red-500' :
      'border-gray-300'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {endpoints.find(e => e.critical) 
                  ? 'Essential system endpoints'
                  : 'Supporting endpoints'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {pendingCount === 0 && testingCount === 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {successCount > 0 && <span className="text-green-600">✅ {successCount}</span>}
                  {warningCount > 0 && <span className="text-yellow-600 ml-2">⚠️ {warningCount}</span>}
                  {errorCount > 0 && <span className="text-red-600 ml-2">❌ {errorCount}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {successCount + warningCount + errorCount} / {totalCount} tested
                </div>
              </div>
            )}
            
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="space-y-2">
            {endpoints.map((endpoint) => {
              const result = results.find(r => r.endpoint === endpoint.path);
              return (
                <div
                  key={endpoint.path}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{endpoint.name}</div>
                    <div className="text-xs text-gray-500">{endpoint.path}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {result?.responseTime !== undefined && (
                      <span className="text-xs text-gray-600">
                        {result.responseTime}ms
                      </span>
                    )}
                    
                    <span className="text-lg">
                      {result?.status === 'pending' && '⏳'}
                      {result?.status === 'testing' && '🔄'}
                      {result?.status === 'success' && '✅'}
                      {result?.status === 'warning' && '⚠️'}
                      {result?.status === 'error' && '❌'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIStatusCard;

