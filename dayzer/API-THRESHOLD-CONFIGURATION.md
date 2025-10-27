# API Health Check - Custom Threshold Configuration

## Philosophy
Each endpoint has **individualized thresholds** based on its actual complexity and expected performance.

---

## 🔧 Core APIs (3 endpoints)

### Simple Database Queries
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/available-scenarios` | < 500ms | < 1500ms | Simple Prisma query with filtering |
| `/api/available-scenario-dates` | < 500ms | < 1500ms | Simple Prisma query |

### External API Integration
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/yes-energy-test` | < 2000ms | < 5000ms | External API call + HTML parsing |

---

## 📊 Forecast Data APIs (11 endpoints)

### Standard Forecast Queries
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/lmp-forecast` | < 1000ms | < 3000ms | DB query with joins |
| `/api/lmp-last-week-forecast` | < 1000ms | < 3000ms | DB query with joins |
| `/api/weather-forecast` | < 1000ms | < 3000ms | Medium complexity |
| `/api/weather-last-week-forecast` | < 1000ms | < 3000ms | Medium complexity |
| `/api/zone-demand` | < 1000ms | < 2500ms | Simple query with ordering |
| `/api/zone-lmp` | < 1000ms | < 2500ms | Similar to zone-demand |

### Multi-Source Queries
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/load-net-load-forecast` | < 1500ms | < 3500ms | Multiple table queries |
| `/api/combined-load-forecast` | < 1500ms | < 3500ms | Multiple data sources |
| `/api/supply-stack` | < 1500ms | < 3500ms | Aggregation heavy |

### Secondary Database Queries
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/renewables-last-week-forecast` | < 2000ms | < 4000ms | Secondary DB query |

### Known Slow Queries
| Endpoint | Good | Acceptable | Timeout | Rationale |
|----------|------|------------|---------|-----------|
| `/api/renewables-forecast` | < 3000ms | < 8000ms | 10s | Complex query, known to be slow |

---

## 📈 Analysis & Comparison APIs (11 endpoints)

### Weekly Comparisons
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/week-overview` | < 2000ms | < 4000ms | Weekly aggregations |
| `/api/weekly-lmp-comparison` | < 2000ms | < 4000ms | Week comparison queries |
| `/api/weekly-load-comparison` | < 2000ms | < 4000ms | Week comparison queries |
| `/api/weekly-congestion` | < 2000ms | < 4500ms | Complex congestion analysis |
| `/api/mec-overview` | < 2000ms | < 4500ms | Complex aggregations across weeks |

### Battery Calculations
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/tb26-calculation` | < 2500ms | < 5000ms | Heavy calculations with charging restrictions |
| `/api/tb26-lmp-comparison` | < 2000ms | < 4000ms | Multi-table comparison |

### Frequency Analysis
| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/peak-hours-frequency` | < 1500ms | < 3000ms | Frequency calculations |
| `/api/bottom-hours-frequency` | < 1500ms | < 3000ms | Frequency calculations |

### Complex External API Operations
| Endpoint | Good | Acceptable | Timeout | Rationale |
|----------|------|------------|---------|-----------|
| `/api/likeday-analysis` | < 5000ms | < 12000ms | 15s | External YES Energy API + similarity calculations |
| `/api/likeday-secondary` | < 3000ms | < 6000ms | - | External YES Energy API calls for similar days |

---

## 🎯 Congestion & Constraint APIs (3 endpoints)

| Endpoint | Good | Acceptable | Rationale |
|----------|------|------------|-----------|
| `/api/congestion-plot` | < 1500ms | < 3500ms | Binding constraint queries |
| `/api/lmp-components` | < 1500ms | < 3000ms | Component breakdown calculations |
| `/api/net-load-with-caiso` | < 2000ms | < 4000ms | Two database sources (primary + secondary) |

---

## Threshold Philosophy by Complexity

### ⚡ Fast (< 1s good)
- Simple single-table queries
- Basic lookups without joins
- Cached or indexed queries

### 🏃 Medium (1-2s good)
- Multi-table joins
- Aggregations over moderate datasets
- Secondary database queries

### 🚶 Slow (2-3s good)
- Complex aggregations
- Weekly comparisons
- Multi-source data combination

### 🐢 Very Slow (3-5s good)
- Heavy calculations (TB26)
- External API calls
- Large dataset processing

### 🦥 Extremely Slow (5-12s good)
- External API + heavy calculations (likeday)
- Multiple external API calls
- Similarity algorithms on large datasets

---

## Result

**All 28 endpoints** now have **realistic, individualized thresholds** based on their actual complexity and performance characteristics. This provides accurate health status without false warnings for APIs that are naturally slower due to their complexity.

