# Performance Testing Plan

**Target:** qa.testingwithekki.com  
**Tool:** k6  
**Date:** 2026-01-18

---

## Test Objectives

1. **Baseline Metrics** – Establish response times and throughput under normal conditions
2. **Load Testing** – Test with 50-75 concurrent virtual users

---

## Test Scenarios

### Scenario 1: Public Tutorial Flow (Unauthenticated)

1. Homepage (`/en`)
2. Tutorial List (`/en/tutorials`)
3. View Tutorial (`/en/tutorials/{slug}`)

### Scenario 2: Challenge Flow (Authenticated)

1. Homepage (`/en`)
2. Login (POST to auth endpoint)
3. Challenge List (`/en/challenges`)
4. View Challenge (`/en/challenges/{slug}`)

---

## VPS Specs & Targets

| Spec | Value |
|------|-------|
| CPU | 2 cores |
| RAM | 4GB |
| **Target VUs** | 50-75 concurrent |
| **Target Response** | < 500ms (p95) |

---

## Execution Stages

| Stage | Duration | Virtual Users | Purpose |
|-------|----------|---------------|---------|
| Ramp-up | 30s | 0 → 25 | Gradual warm-up |
| Baseline | 1m | 25 | Establish baseline |
| Load | 2m | 25 → 50 | Normal load |
| Peak | 1m | 50 → 75 | Peak traffic |
| Cool-down | 30s | 75 → 0 | Graceful end |

**Total Duration:** ~5 minutes

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Response Time (p95) | < 500ms |
| Error Rate | < 1% |
| Throughput | > 50 req/s |

---

## How to Run

```bash
# Install k6 (if not already)
brew install k6

# Run the test
k6 run scripts/performance/load-test.js

# Run with HTML report
k6 run --out json=results.json scripts/performance/load-test.js
```
