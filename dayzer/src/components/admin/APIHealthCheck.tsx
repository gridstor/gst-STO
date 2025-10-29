import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, RESPONSE_THRESHOLDS, getEndpointsByCategory } from '../../lib/api-test-config';
import APIStatusCard from './APIStatusCard';
import APITestLogs from './APITestLogs';
import APIErrorSummary from './APIErrorSummary';

export interface TestResult {
  endpoint: string;
  name: string;
  category: string;
  status: 'pending' | 'testing' | 'success' | 'warning' | 'error';
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
  timestamp?: Date;
}

const APIHealthCheck: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [nextAutoRun, setNextAutoRun] = useState<Date | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    // Initialize all results as pending
    const initialResults: TestResult[] = API_ENDPOINTS.map(endpoint => ({
      endpoint: endpoint.path,
      name: endpoint.name,
      category: endpoint.category,
      status: 'pending',
    }));
    setResults(initialResults);

    // Fetch a valid scenarioid to use in tests
    let validScenarioId: number | null = null;
    try {
      const scenariosResponse = await fetch('/api/available-scenarios');
      if (scenariosResponse.ok) {
        const scenarios = await scenariosResponse.json();
        if (scenarios && scenarios.length > 0) {
          validScenarioId = scenarios[0].scenarioid;
        }
      }
    } catch (error) {
      console.warn('Could not fetch valid scenario ID for tests');
    }

    // Test each endpoint sequentially and build results array
    const finalResults = [...initialResults];
    
    for (let i = 0; i < API_ENDPOINTS.length; i++) {
      const endpoint = API_ENDPOINTS[i];
      
      // Update status to testing
      finalResults[i] = { ...finalResults[i], status: 'testing' };
      setResults([...finalResults]);

      // Create test config with dynamic scenarioid if needed
      const testConfig = { ...endpoint };
      if (validScenarioId && endpoint.queryParams?.includes('scenarioid=')) {
        testConfig.queryParams = endpoint.queryParams.replace('scenarioid=1', `scenarioid=${validScenarioId}`);
      }

      // Run the test with endpoint config
      const result = await testEndpoint(endpoint.path, testConfig);
      
      // Update with result
      finalResults[i] = {
        ...finalResults[i],
        ...result,
        name: endpoint.name,
        category: endpoint.category,
        timestamp: new Date(),
      };
      setResults([...finalResults]);

      // Update progress
      setProgress(((i + 1) / API_ENDPOINTS.length) * 100);
    }

    setIsRunning(false);
    
    // Store final results in localStorage for the summary card
    try {
      localStorage.setItem('apiHealthResults', JSON.stringify({
        results: finalResults,
        timestamp: new Date().toISOString()
      }));
      console.log('API health results saved to localStorage:', finalResults.length, 'endpoints');
    } catch (error) {
      console.error('Failed to save API health results to localStorage:', error);
    }
    
    // Schedule next auto-run in 1 hour
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1);
    setNextAutoRun(nextRun);
  };

  // Auto-run tests every hour
  useEffect(() => {
    // Load previous results if they exist
    try {
      const stored = localStorage.getItem('apiHealthResults');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.results && Array.isArray(data.results)) {
          setResults(data.results);
        }
      }
    } catch (error) {
      console.error('Failed to load previous results:', error);
    }

    // Run tests immediately on mount
    runAllTests();
    
    // Set up hourly interval
    const interval = setInterval(() => {
      console.log('Auto-running API health check (hourly schedule)');
      runAllTests();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

  const testEndpoint = async (path: string, endpointConfig?: typeof API_ENDPOINTS[0]): Promise<Partial<TestResult>> => {
    const startTime = performance.now();
    
    try {
      // Build full URL with query params if provided
      const fullPath = endpointConfig?.queryParams 
        ? `${path}?${endpointConfig.queryParams}`
        : path;
      
      // Determine timeout (custom or default 5s)
      const timeout = endpointConfig?.timeout || 5000;
      
      // Determine HTTP method (POST or GET)
      const method = endpointConfig?.method || 'GET';
      
      const response = await fetch(fullPath, {
        method,
        signal: AbortSignal.timeout(timeout),
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify(endpointConfig?.requestBody || {}) : undefined,
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Determine status based on response time and status code
      // Use endpoint-specific thresholds if available, otherwise use defaults
      const thresholds = endpointConfig?.thresholds || RESPONSE_THRESHOLDS;
      
      let status: TestResult['status'] = 'success';
      if (!response.ok) {
        status = 'error';
      } else if (responseTime > thresholds.acceptable) {
        status = 'warning';
      } else if (responseTime > thresholds.good) {
        status = 'warning';
      }

      return {
        endpoint: path,
        status,
        responseTime,
        statusCode: response.status,
        errorMessage: !response.ok ? response.statusText : undefined,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        endpoint: path,
        status: 'error',
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const refresh = () => {
    runAllTests();
  };

  // Calculate statistics
  const totalTests = API_ENDPOINTS.length;
  const completedTests = results.filter(r => r.status !== 'pending' && r.status !== 'testing').length;
  const successfulTests = results.filter(r => r.status === 'success').length;
  const warningTests = results.filter(r => r.status === 'warning').length;
  const failedTests = results.filter(r => r.status === 'error').length;

  // Overall system status
  const getSystemStatus = () => {
    if (completedTests === 0) return { text: 'Unknown', color: 'gray' };
    if (failedTests === 0 && warningTests === 0) return { text: 'All Systems Operational', color: 'green' };
    if (failedTests === 0) return { text: 'Degraded Performance', color: 'yellow' };
    return { text: 'System Issues Detected', color: 'red' };
  };

  const systemStatus = getSystemStatus();
  const endpointsByCategory = getEndpointsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔍 API Health Check
            </h1>
            <p className="text-gray-600">Monitor and test all API endpoints for system health</p>
            {nextAutoRun && !isRunning && (
              <p className="text-sm text-gray-500 mt-1">
                🕐 Next auto-run: {nextAutoRun.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`inline-flex justify-center items-center gap-2 rounded-md border border-transparent px-6 py-2.5 text-sm font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            >
              🚀 {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={refresh}
              disabled={isRunning || completedTests === 0}
              className="inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Refresh
            </button>
            
            <a
              href="/admin/dev-ops"
              className="inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              ← Back to Admin
            </a>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={`rounded-lg shadow-md p-6 border ${
        completedTests === 0 ? 'bg-white border-gray-200' :
        failedTests > 0 ? 'bg-red-50 border-red-200' :
        warningTests > 0 ? 'bg-yellow-50 border-yellow-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">System Status</h2>
            {completedTests === 0 ? (
              <p className="text-gray-600">Click "Run All Tests" to check system health</p>
            ) : (
              <p className="text-gray-700 text-lg">
                {failedTests > 0 && `${failedTests} of ${totalTests} endpoints are failing`}
                {failedTests === 0 && warningTests > 0 && `${warningTests} of ${totalTests} endpoints running slow`}
                {failedTests === 0 && warningTests === 0 && `All ${totalTests} endpoints operational`}
              </p>
            )}
          </div>
          
          {completedTests > 0 && failedTests > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-red-600 text-white">
              🔴 Critical
            </span>
          )}
          {completedTests > 0 && failedTests === 0 && warningTests > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-yellow-600 text-white">
              ⚠️ Warning
            </span>
          )}
          {completedTests > 0 && failedTests === 0 && warningTests === 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-green-600 text-white">
              ✓ Healthy
            </span>
          )}
        </div>
        
        {/* Progress Bar showing completion */}
        {completedTests > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex-1 mr-4">
                <div
                  className="bg-indigo-600 h-3 transition-all duration-500"
                  style={{ width: `${(completedTests / totalTests) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                {isRunning ? `Testing ${completedTests + 1} of ${totalTests}` : `${completedTests} of ${totalTests} tested`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* API Category Cards */}
      <div className="space-y-4">
        {Array.from(endpointsByCategory.entries()).map(([category, endpoints]) => (
          <APIStatusCard
            key={category}
            category={category}
            endpoints={endpoints}
            results={results.filter(r => r.category === category)}
          />
        ))}
      </div>

      {/* Test Logs */}
      <APITestLogs results={results} />

      {/* Error Summary */}
      {failedTests > 0 && (
        <APIErrorSummary results={results.filter(r => r.status === 'error')} />
      )}
    </div>
  );
};

export default APIHealthCheck;

