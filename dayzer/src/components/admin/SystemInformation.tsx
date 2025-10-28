import React, { useState, useEffect } from 'react';

interface SystemInfo {
  environment: {
    nodeEnv: string;
    isProduction: boolean;
    platform: string;
    nodeVersion: string;
  };
  deployment: {
    platform: string;
    context: string | null;
    buildId: string | null;
    deployUrl: string | null;
    gitCommitSha: string | null;
    gitBranch: string | null;
    deployedAt: string;
  };
}

const SystemInformation: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/system-info');
      const data = await response.json();
      
      if (response.ok) {
        setSystemInfo(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch system info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
    
    // Refresh every 30 seconds to update uptime
    const interval = setInterval(fetchSystemInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
        <div className="text-center text-gray-500">Loading system information...</div>
      </div>
    );
  }

  if (error || !systemInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <div className="text-red-600">Failed to load system information</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Environment</h4>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            systemInfo.environment.isProduction 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {systemInfo.environment.isProduction ? '🟢 Production' : '🟡 Development'}
          </span>
          <p className="text-xs text-gray-500 mt-2">Node {systemInfo.environment.nodeVersion}</p>
        </div>

        {/* Deployment */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Deployment</h4>
          <p className="text-lg font-semibold text-gray-900">{systemInfo.deployment.platform}</p>
          {systemInfo.deployment.gitCommitSha && (
            <p className="text-xs text-gray-600 font-mono mt-1">
              {systemInfo.deployment.gitBranch}: {systemInfo.deployment.gitCommitSha}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(systemInfo.deployment.deployedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemInformation;

