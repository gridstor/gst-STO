import React, { useState } from 'react';
import type { TestResult } from './APIHealthCheck';

interface APIErrorSummaryProps {
  results: TestResult[];
}

const APIErrorSummary: React.FC<APIErrorSummaryProps> = ({ results }) => {
  const [copied, setCopied] = useState(false);

  const generateErrorSummary = () => {
    const timestamp = new Date().toLocaleString();
    let summary = `API Health Check Error Summary\n`;
    summary += `Generated: ${timestamp}\n`;
    summary += `Total Errors: ${results.length}\n`;
    summary += `\n${'='.repeat(60)}\n\n`;

    results.forEach((result, index) => {
      summary += `${index + 1}. ${result.name}\n`;
      summary += `   Endpoint: ${result.endpoint}\n`;
      summary += `   Status: ${result.status.toUpperCase()}\n`;
      if (result.statusCode) {
        summary += `   Status Code: ${result.statusCode}\n`;
      }
      if (result.responseTime) {
        summary += `   Response Time: ${result.responseTime}ms\n`;
      }
      if (result.errorMessage) {
        summary += `   Error: ${result.errorMessage}\n`;
      }
      summary += `\n`;
    });

    return summary;
  };

  const copyToClipboard = async () => {
    const summary = generateErrorSummary();
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🚨 Error Summary
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Copy this summary to share with developers
            </p>
          </div>
          
          <button
            onClick={copyToClipboard}
            className={`inline-flex justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              copied
                ? 'bg-green-100 text-green-700 focus:ring-green-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Errors
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
            {generateErrorSummary()}
          </pre>
        </div>

        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-indigo-700">
                <strong>Tip:</strong> Share this error summary with your development team for faster debugging. 
                It includes all failed endpoints, error messages, and response times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIErrorSummary;

