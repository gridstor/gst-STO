import React, { useState, useEffect } from 'react';

interface TableStatus {
  rows: number;
  status: 'healthy' | 'warning' | 'error';
  lastUpdate?: string;
  description?: string;
}

interface DatabaseStatus {
  status: 'healthy' | 'warning' | 'error';
  connected: boolean;
  latency: number;
  tables: Record<string, TableStatus>;
  scenariosCount?: number;
  latestScenario?: number;
  dateRange?: { start: string; end: string } | null;
  lastUpdated?: string;
  dataFreshness?: string;
  latestDate?: string | null;
  error?: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  totalLatency: number;
  databases: {
    primary: DatabaseStatus;
    secondary: DatabaseStatus;
    third: DatabaseStatus;
  };
  summary: {
    totalScenarios: number;
    latestScenario?: number;
    latestScenarioName?: string;
    dataDateRange?: { start: string; end: string } | null;
    lastUpdatedDatetime?: string | null;
  };
  recommendations: string[];
}

const DatabaseHealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedPrimary, setExpandedPrimary] = useState(true);
  const [expandedSecondary, setExpandedSecondary] = useState(true);
  const [expandedThird, setExpandedThird] = useState(true);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/db-health');
      const data = await response.json();
      
      if (response.ok) {
        setHealthData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch health data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">❌ Health Check Failed</h2>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchHealthData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗄️ Database Health Check
          </h1>
          <p className="text-gray-600">Monitor database connections, data availability, and system health</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '🔄 Auto-refresh OFF'}
          </button>
          
          <button
            onClick={fetchHealthData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh Now'}
          </button>

          <a
            href="/admin/dev-ops"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to Admin
          </a>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg shadow-md p-6 border ${
        healthData.status === 'healthy' ? 'bg-green-50 border-green-200' :
        healthData.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {getStatusIcon(healthData.status)} System Status
            </h2>
            <p className="text-xs text-gray-500">
              Health check performed: {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-sm text-gray-600">Latest Scenario</div>
              <div className="text-2xl font-bold text-gray-900">#{healthData.summary.latestScenario}</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Updated</div>
              {healthData.summary.lastUpdatedDatetime ? (
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(healthData.summary.lastUpdatedDatetime).toLocaleDateString()}
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-500">Unknown</div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Response Time</div>
              <div className="text-lg font-semibold text-gray-900">{healthData.totalLatency}ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DZNode Database */}
        <div className={`bg-white rounded-lg shadow-md border-l-4 ${
          healthData.databases.primary.status === 'healthy' ? 'border-green-500' :
          healthData.databases.primary.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {getStatusIcon(healthData.databases.primary.status)} DZNode Database
              </h3>
              <div className="text-sm text-gray-600">
                <span className={`font-semibold ${
                  healthData.databases.primary.latency < 100 ? 'text-green-600' :
                  healthData.databases.primary.latency < 500 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {healthData.databases.primary.latency}ms
                </span>
              </div>
            </div>

             {healthData.databases.primary.connected ? (
              <>
                <div className="mb-4 text-sm pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{healthData.databases.primary.status}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total Scenarios:</span>
                    <span className="font-semibold">{healthData.databases.primary.scenariosCount}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Showing Data For:</span>
                    <span className="font-semibold">Scenario #{healthData.summary.latestScenario}</span>
                  </div>
                  {healthData.databases.primary.dateRange && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date Range:</span>
                      <span className="font-semibold">
                        {healthData.databases.primary.dateRange.start} → {healthData.databases.primary.dateRange.end}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedPrimary(!expandedPrimary)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 flex items-center"
                >
                  {expandedPrimary ? '▼' : '▶'} Table Row Counts ({Object.keys(healthData.databases.primary.tables).length} tables)
                </button>

                {expandedPrimary && (
                  <div className="space-y-2 mt-2">
                    {Object.entries(healthData.databases.primary.tables).map(([tableName, tableData]) => (
                      <div key={tableName} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-900 font-semibold truncate flex-shrink min-w-0">{tableName}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600 whitespace-nowrap">{tableData.rows.toLocaleString()} rows</span>
                            <span>{getStatusIcon(tableData.status)}</span>
                          </div>
                        </div>
                        {tableData.description && (
                          <div className="text-xs text-gray-500">{tableData.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <p className="font-semibold">Connection Failed</p>
                <p className="text-sm mt-1">{healthData.databases.primary.error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Postgres Database */}
        <div className={`bg-white rounded-lg shadow-md border-l-4 ${
          healthData.databases.secondary.status === 'healthy' ? 'border-green-500' :
          healthData.databases.secondary.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {getStatusIcon(healthData.databases.secondary.status)} Postgres Database
              </h3>
              <div className="text-sm text-gray-600">
                <span className={`font-semibold ${
                  healthData.databases.secondary.latency < 100 ? 'text-green-600' :
                  healthData.databases.secondary.latency < 500 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {healthData.databases.secondary.latency}ms
                </span>
              </div>
            </div>

             {healthData.databases.secondary.connected ? (
              <>
                <div className="mb-4 text-sm pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{healthData.databases.secondary.status}</span>
                  </div>
                  {healthData.databases.secondary.latestDate && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Latest Date:</span>
                      <span className="font-semibold">{healthData.databases.secondary.latestDate}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Showing Data For:</span>
                    <span className="font-semibold">Last 7 Days</span>
                  </div>
                  {healthData.databases.secondary.dateRange && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date Range:</span>
                      <span className="font-semibold">
                        {healthData.databases.secondary.dateRange.start} → {healthData.databases.secondary.dateRange.end}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedSecondary(!expandedSecondary)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 flex items-center"
                >
                  {expandedSecondary ? '▼' : '▶'} Table Row Counts ({Object.keys(healthData.databases.secondary.tables).length} tables)
                </button>

                {expandedSecondary && (
                  <div className="space-y-2 mt-2">
                    {Object.entries(healthData.databases.secondary.tables).map(([tableName, tableData]) => (
                      <div key={tableName} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-900 font-semibold truncate flex-shrink min-w-0">{tableName}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600 whitespace-nowrap">{tableData.rows.toLocaleString()} rows</span>
                            <span>{getStatusIcon(tableData.status)}</span>
                          </div>
                        </div>
                        {tableData.description && (
                          <div className="text-xs text-gray-500">{tableData.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <p className="font-semibold">Connection Failed</p>
                <p className="text-sm mt-1">{healthData.databases.secondary.error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Database */}
        <div className={`bg-white rounded-lg shadow-md border-l-4 ${
          healthData.databases.third.status === 'healthy' ? 'border-green-500' :
          healthData.databases.third.status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {getStatusIcon(healthData.databases.third.status)} Analytics Database
              </h3>
              <div className="text-sm text-gray-600">
                <span className={`font-semibold ${
                  healthData.databases.third.latency < 100 ? 'text-green-600' :
                  healthData.databases.third.latency < 500 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {healthData.databases.third.latency}ms
                </span>
              </div>
            </div>

             {healthData.databases.third.connected ? (
              <>
                <div className="mb-4 text-sm pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{healthData.databases.third.status}</span>
                  </div>
                  {healthData.databases.third.latestDate && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Latest Date:</span>
                      <span className="font-semibold">{healthData.databases.third.latestDate}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Showing Data For:</span>
                    <span className="font-semibold">Last 7 Days</span>
                  </div>
                  {healthData.databases.third.dateRange && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date Range:</span>
                      <span className="font-semibold">
                        {healthData.databases.third.dateRange.start} → {healthData.databases.third.dateRange.end}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedThird(!expandedThird)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 flex items-center"
                >
                  {expandedThird ? '▼' : '▶'} Table Row Counts ({Object.keys(healthData.databases.third.tables).length} tables)
                </button>

                {expandedThird && (
                  <div className="space-y-2 mt-2">
                    {Object.entries(healthData.databases.third.tables).map(([tableName, tableData]) => (
                      <div key={tableName} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-900 font-semibold truncate flex-shrink min-w-0">{tableName}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600 whitespace-nowrap">{tableData.rows.toLocaleString()} rows</span>
                            <span>{getStatusIcon(tableData.status)}</span>
                          </div>
                        </div>
                        {tableData.description && (
                          <div className="text-xs text-gray-500">{tableData.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-yellow-600">
                <p className="font-semibold">Not Configured</p>
                <p className="text-sm mt-1">{healthData.databases.third.error || 'DATABASE_URL_THIRD not set in .env'}</p>
                <p className="text-xs text-gray-600 mt-2">Weather forecast features will be unavailable</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DatabaseHealthCheck;

