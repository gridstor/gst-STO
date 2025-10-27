/**
 * API Health Check Configuration
 * Defines all API endpoints to be tested with their metadata
 */

export interface APIEndpoint {
  path: string;
  name: string;
  category: string;
  critical: boolean;
  description?: string;
  method?: 'GET' | 'POST';
  queryParams?: string;
  timeout?: number; // Custom timeout in ms
  requestBody?: Record<string, any>; // Request body for POST requests
  thresholds?: {
    good: number;      // Green if response time < this
    acceptable: number; // Yellow if response time < this, Red if above
  };
}

export const API_CATEGORIES = {
  CORE: '🔧 Core APIs',
  FORECAST: '📊 Forecast Data APIs',
  ANALYSIS: '📈 Analysis & Comparison APIs',
  CONGESTION: '🎯 Congestion & Constraint APIs',
} as const;

export const API_ENDPOINTS: APIEndpoint[] = [
  // Core APIs (3) - Simple lookups and external API tests
  {
    path: '/api/available-scenarios',
    name: 'Available Scenarios',
    category: API_CATEGORIES.CORE,
    critical: true,
    description: 'Get list of available scenario IDs',
    timeout: 6000,
    thresholds: { good: 500, acceptable: 1500 }, // Simple DB query with filtering
  },
  {
    path: '/api/available-scenario-dates',
    name: 'Scenario Dates',
    category: API_CATEGORIES.CORE,
    critical: true,
    description: 'Get scenario date ranges',
    timeout: 6000,
    thresholds: { good: 500, acceptable: 1500 }, // Simple DB query
  },
  {
    path: '/api/yes-energy-test',
    name: 'YES Energy Test',
    category: API_CATEGORIES.CORE,
    critical: false,
    description: 'External API integration test',
    timeout: 6000,
    thresholds: { good: 2000, acceptable: 5000 }, // External API call + HTML parsing
  },

  // Forecast Data APIs (11) - Database queries with aggregations
  {
    path: '/api/lmp-forecast',
    name: 'LMP Forecast',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Day-ahead LMP forecasts',
    timeout: 7000, // +1s buffer
    thresholds: { good: 4000, acceptable: 6000 }, // DB query with joins (+3s)
  },
  {
    path: '/api/lmp-last-week-forecast',
    name: 'LMP Last Week',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Historical LMP data',
    timeout: 7000, // +1s buffer
    thresholds: { good: 4000, acceptable: 6000 }, // DB query with joins (+3s)
  },
  {
    path: '/api/load-net-load-forecast',
    name: 'Load & Net Load',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Load and net load forecasts',
    timeout: 7500, // +1s buffer
    thresholds: { good: 4500, acceptable: 6500 }, // Multiple table queries (+3s)
  },
  {
    path: '/api/combined-load-forecast',
    name: 'Combined Load',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Combined load data',
    timeout: 11000, // Complex query with multiple data sources, needs more time (+1s)
    thresholds: { good: 5000, acceptable: 8000 }, // Multiple data sources (+3s)
  },
  {
    path: '/api/weather-forecast',
    name: 'Weather Forecast',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Weather predictions',
    timeout: 7000, // +1s buffer
    thresholds: { good: 4000, acceptable: 6000 }, // Medium complexity (+3s)
  },
  {
    path: '/api/weather-last-week-forecast',
    name: 'Weather Last Week',
    category: API_CATEGORIES.FORECAST,
    critical: false,
    description: 'Historical weather',
    timeout: 7000, // +1s buffer
    thresholds: { good: 4000, acceptable: 6000 }, // Medium complexity (+3s)
  },
  {
    path: '/api/renewables-forecast',
    name: 'Renewables Forecast',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Renewable generation forecasts',
    timeout: 11000, // Slow query, needs more time (+1s)
    thresholds: { good: 8500, acceptable: 11000 }, // Complex query, known to be slow
  },
  {
    path: '/api/renewables-last-week-forecast',
    name: 'Renewables Last Week',
    category: API_CATEGORIES.FORECAST,
    critical: false,
    description: 'Historical renewables',
    timeout: 8000, // +1s buffer
    thresholds: { good: 5000, acceptable: 7000 }, // Secondary DB query (+3s)
  },
  {
    path: '/api/supply-stack',
    name: 'Supply Stack',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Supply stack data',
    timeout: 11000, // Aggregation heavy, needs more time (+1s)
    thresholds: { good: 5000, acceptable: 8000 }, // Aggregation heavy (+3s)
  },
  {
    path: '/api/zone-demand',
    name: 'Zone Demand',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Zone demand data',
    timeout: 6500, // +1s buffer
    thresholds: { good: 4000, acceptable: 5500 }, // Simple query with ordering (+3s)
  },
  {
    path: '/api/zone-lmp',
    name: 'Zone LMP',
    category: API_CATEGORIES.FORECAST,
    critical: true,
    description: 'Zone LMP data',
    timeout: 6500, // +1s buffer
    thresholds: { good: 4000, acceptable: 5500 }, // Similar to zone-demand (+3s)
  },

  // Analysis & Comparison APIs (11) - Complex calculations and aggregations
  {
    path: '/api/tb26-calculation',
    name: 'TB26 Calculation',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Two/four-hour battery calculations',
    timeout: 6000, // +1s buffer
    thresholds: { good: 2500, acceptable: 5000 }, // Heavy calculations with charging restrictions
  },
  {
    path: '/api/tb26-lmp-comparison',
    name: 'TB26 vs LMP',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'TB26 vs LMP comparison',
    queryParams: 'scenarioid=1', // Requires scenarioid parameter
    timeout: 5000, // +1s buffer
    thresholds: { good: 2000, acceptable: 4000 }, // Multi-table comparison
  },
  {
    path: '/api/mec-overview',
    name: 'MEC Overview',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Most Economic Constraint overview',
    timeout: 5500, // +1s buffer
    thresholds: { good: 2000, acceptable: 4500 }, // Complex aggregations across weeks
  },
  {
    path: '/api/week-overview',
    name: 'Week Overview',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Weekly market overview',
    timeout: 5000, // +1s buffer
    thresholds: { good: 2500, acceptable: 4000 }, // Weekly aggregations
  },
  {
    path: '/api/weekly-lmp-comparison',
    name: 'Weekly LMP Comparison',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Week-over-week LMP comparison',
    timeout: 5000, // +1s buffer
    thresholds: { good: 2000, acceptable: 4000 }, // Week comparison queries
  },
  {
    path: '/api/weekly-load-comparison',
    name: 'Weekly Load Comparison',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Week-over-week load comparison',
    timeout: 5000, // +1s buffer
    thresholds: { good: 2000, acceptable: 4000 }, // Week comparison queries
  },
  {
    path: '/api/weekly-congestion',
    name: 'Weekly Congestion',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Weekly congestion analysis',
    timeout: 5500, // +1s buffer
    thresholds: { good: 2000, acceptable: 4500 }, // Complex congestion analysis
  },
  {
    path: '/api/likeday-analysis',
    name: 'Likeday Analysis',
    category: API_CATEGORIES.ANALYSIS,
    critical: true,
    description: 'Similar day analysis',
    method: 'POST',
    timeout: 16000, // Complex analysis with external API calls (+1s)
    thresholds: { good: 6000, acceptable: 12000 }, // External API + similarity calculations
    requestBody: {
      referenceMode: 'historical',
      referenceDate: '2024-06-15',
      startDate: '2024-06-01',  // 1-month range instead of 2 years
      endDate: '2024-06-30',
      matchVariable: 'RT Load',
      topN: 3,  // Reduced from 5 to 3 for faster testing
      euclideanWeight: 0.5,
    },
  },
  {
    path: '/api/peak-hours-frequency',
    name: 'Peak Hours',
    category: API_CATEGORIES.ANALYSIS,
    critical: false,
    description: 'Peak hour analysis',
    timeout: 4000, // +1s buffer
    thresholds: { good: 1500, acceptable: 3000 }, // Frequency calculations
  },
  {
    path: '/api/bottom-hours-frequency',
    name: 'Bottom Hours',
    category: API_CATEGORIES.ANALYSIS,
    critical: false,
    description: 'Bottom hour analysis',
    timeout: 4000, // +1s buffer
    thresholds: { good: 1500, acceptable: 3000 }, // Frequency calculations
  },
  {
    path: '/api/likeday-secondary',
    name: 'Likeday Secondary',
    category: API_CATEGORIES.ANALYSIS,
    critical: false,
    description: 'Secondary likeday data',
    method: 'POST',
    timeout: 7000, // +1s buffer
    thresholds: { good: 3000, acceptable: 6000 }, // External YES Energy API calls
    requestBody: {
      referenceMode: 'historical',
      referenceDate: '2024-01-01',
      matchVariable: 'RT Load',
      topSimilarDays: ['2024-01-02'],
    },
  },

  // Congestion & Constraint APIs (3) - Constraint analysis and multi-source data
  {
    path: '/api/congestion-plot',
    name: 'Congestion Plot',
    category: API_CATEGORIES.CONGESTION,
    critical: true,
    description: 'Congestion visualization data',
    timeout: 4500, // +1s buffer
    thresholds: { good: 1500, acceptable: 3500 }, // Binding constraint queries
  },
  {
    path: '/api/lmp-components',
    name: 'LMP Components',
    category: API_CATEGORIES.CONGESTION,
    critical: true,
    description: 'LMP component breakdown',
    timeout: 4000, // +1s buffer
    thresholds: { good: 1500, acceptable: 3000 }, // Component breakdown calculations
  },
  {
    path: '/api/net-load-with-caiso',
    name: 'Net Load with CAISO',
    category: API_CATEGORIES.CONGESTION,
    critical: true,
    description: 'Net load with CAISO data',
    timeout: 5000, // +1s buffer
    thresholds: { good: 2000, acceptable: 4000 }, // Two database sources (primary + secondary)
  },

];

// Default response time thresholds (in milliseconds)
// Individual endpoints may override these with custom thresholds
export const RESPONSE_THRESHOLDS = {
  good: 2000,      // < 2s = green (default for most APIs)
  acceptable: 4000, // 2-4s = yellow (default for most APIs)
  // > 4s = red
};

// Group endpoints by category
export function getEndpointsByCategory() {
  const grouped = new Map<string, APIEndpoint[]>();
  
  API_ENDPOINTS.forEach(endpoint => {
    const existing = grouped.get(endpoint.category) || [];
    grouped.set(endpoint.category, [...existing, endpoint]);
  });
  
  return grouped;
}

