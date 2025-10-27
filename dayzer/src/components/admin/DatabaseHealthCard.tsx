import React, { useState, useEffect } from 'react';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error' | 'loading';
  primary: string;
  secondary: string;
  third: string;
  latestScenario?: number;
  latestScenarioName?: string;
  lastUpdatedDatetime?: string | null;
  lastChecked?: string;
}

const DatabaseHealthCard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'loading',
    primary: 'checking',
    secondary: 'checking',
    third: 'checking'
  });

  useEffect(() => {
    // Fetch health status on mount
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/db-health');
      const data = await response.json();
      
      if (response.ok) {
        // Determine overall status
        const primaryStatus = data.databases.primary.status;
        const secondaryStatus = data.databases.secondary.status;
        const thirdStatus = data.databases.third.status;
        
        let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
        if (primaryStatus === 'error' || secondaryStatus === 'error' || thirdStatus === 'error') {
          overallStatus = 'error';
        } else if (primaryStatus === 'warning' || secondaryStatus === 'warning' || thirdStatus === 'warning') {
          overallStatus = 'warning';
        }

        setHealth({
          status: overallStatus,
          primary: primaryStatus,
          secondary: secondaryStatus,
          third: thirdStatus,
          latestScenario: data.summary.latestScenario,
          latestScenarioName: data.summary.latestScenarioName,
          lastUpdatedDatetime: data.summary.lastUpdatedDatetime,
          lastChecked: data.timestamp
        });
      } else {
        setHealth({
          status: 'error',
          primary: 'error',
          secondary: 'error',
          third: 'error'
        });
      }
    } catch (error) {
      setHealth({
        status: 'error',
        primary: 'error',
        secondary: 'error',
        third: 'error'
      });
    }
  };

  const handleClick = () => {
    window.location.href = '/admin/db-health';
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      default: return 'border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
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
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
          </div>
        );
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getStatusColor()} hover:shadow-lg transition-shadow cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
    >
      <div className="flex items-start">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Content */}
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Health</h3>
          <p className="text-gray-600 text-sm mb-3">
            Monitor database connections, data availability, and system health
          </p>
          
          {health.status !== 'loading' && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  health.primary === 'healthy' ? 'bg-green-500' :
                  health.primary === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-700">DZNode DB: <span className="font-medium capitalize">{health.primary}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  health.secondary === 'healthy' ? 'bg-green-500' :
                  health.secondary === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-700">Postgres DB: <span className="font-medium capitalize">{health.secondary}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  health.third === 'healthy' ? 'bg-green-500' :
                  health.third === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-700">Analytics DB: <span className="font-medium capitalize">{health.third}</span></span>
              </div>
              {health.latestScenario && (
                <div className="text-gray-600 mt-2">
                  Latest Scenario: <span className="font-medium">#{health.latestScenario}</span>
                </div>
              )}
              {health.lastChecked && (
                <div className="text-gray-500 text-xs mt-1">
                  Checked: {new Date(health.lastChecked).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default DatabaseHealthCard;

