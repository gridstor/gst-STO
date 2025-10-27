import React from 'react';

const SystemInformation: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Environment */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Environment</h4>
          <p className="text-2xl font-bold text-gray-900">Production</p>
        </div>

        {/* Deployment Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Deployment Status</h4>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg 
                className="w-4 h-4 mr-1.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              Active
            </span>
          </div>
        </div>

        {/* Last Check */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Last Check</h4>
          <p className="text-2xl font-bold text-gray-900">Just now</p>
        </div>
      </div>
      
      {/* Placeholder for future functionality */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Additional system metrics and diagnostics will be displayed here
        </p>
      </div>
    </div>
  );
};

export default SystemInformation;

