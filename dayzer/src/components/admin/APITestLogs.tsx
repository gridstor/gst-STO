import React from 'react';
import type { TestResult } from './APIHealthCheck';

interface APITestLogsProps {
  results: TestResult[];
}

const APITestLogs: React.FC<APITestLogsProps> = ({ results }) => {
  const completedResults = results.filter(
    r => r.status !== 'pending' && r.status !== 'testing'
  );

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Success</span>;
      case 'warning':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Slow</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Error</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">Pending</span>;
    }
  };

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return 'text-gray-600';
    if (responseTime < 1000) return 'text-green-600';
    if (responseTime < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-gray-400">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          📋 Test Logs
        </h2>
        <p className="text-sm text-gray-600 mt-1">Detailed results and error messages</p>
      </div>

      <div className="p-6">
        {completedResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No test logs yet</p>
            <p className="text-sm text-gray-400 mt-1">Run tests to see detailed results</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {completedResults.map((result, index) => (
              <div
                key={`${result.endpoint}-${index}`}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' :
                  result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  result.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {result.status === 'success' && '✅'}
                        {result.status === 'warning' && '⚠️'}
                        {result.status === 'error' && '❌'}
                      </span>
                      <span className="font-medium text-gray-900">{result.name}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-mono">{result.endpoint}</span>
                      </p>
                      
                      {result.errorMessage && (
                        <p className="text-red-600 mt-1">
                          <span className="font-medium">Error:</span> {result.errorMessage}
                        </p>
                      )}
                      
                      {result.statusCode && (
                        <p className="text-gray-500 mt-1">
                          Status Code: <span className="font-mono">{result.statusCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    {result.responseTime !== undefined && (
                      <div className={`text-lg font-semibold ${getResponseTimeColor(result.responseTime)}`}>
                        {result.responseTime}ms
                      </div>
                    )}
                    {result.timestamp && (
                      <div className="text-xs text-gray-500 mt-1">
                        {result.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default APITestLogs;

