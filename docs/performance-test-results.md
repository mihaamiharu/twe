# Performance Test Results

**Target:** qa.testingwithekki.com  
**Date:** 2026-01-18  
**Duration:** 5 minutes  
**Max VUs:** 75 concurrent users

---

## Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Response Time (p95) | **462ms** | < 500ms | ✅ PASSED |
| Throughput | **36 req/s** | > 50 req/s | ⚠️ BELOW TARGET |
| Error Rate | **11.79%** | < 1% | ❌ FAILED |

---

## Detailed Metrics

### Response Times

| Metric | Value |
|--------|-------|
| Average | 157ms |
| Median | 107ms |
| p90 | 308ms |
| p95 | **462ms** |
| Max | 1.87s |

### Custom Metrics

| Flow | Avg | Median | p95 |
|------|-----|--------|-----|
| Tutorial pages | 174ms | 118ms | 502ms |
| Challenge pages | 367ms | 301ms | 864ms |

### Throughput

| Metric | Value |
|--------|-------|
| Total Requests | 10,907 |
| Total Iterations | 3,349 |
| Requests/second | 36 |
| Iterations/second | 11 |
| Data Received | 480 MB |

---

## Check Results

| Check | Pass Rate | Status |
|-------|-----------|--------|
| Homepage status 200 | ✅ 100% | PASS |
| Tutorial list status 200 | ✅ 100% | PASS |
| Tutorial page loads | ✅ 100% | PASS |
| **Login successful** | ❌ **6%** | **FAIL** |
| Challenge list status 200 | ✅ 100% | PASS |
| Challenge page loads | ✅ 100% | PASS |

---

## Analysis

### ✅ What's Working Well

1. **Response times are good** - p95 at 462ms is within target
2. **Public pages are stable** - All tutorial and homepage requests succeeded
3. **Challenge pages work** - When authenticated, challenge pages load correctly

### ❌ Issues Found

1. **Login Endpoint Failing (94% failure rate)**
   - Only 84 out of 1,371 login attempts succeeded
   - Likely cause: Rate limiting, session handling, or auth endpoint overload
   - Impact: Authenticated user flows can't complete

2. **Throughput Below Target**
   - Achieved 36 req/s vs target of 50 req/s
   - May be related to login failures slowing down iterations

---

## Recommendations

### High Priority

1. **Investigate Login Endpoint**
   - Check server logs for `/api/auth/sign-in/email` errors
   - Possible rate limiting on BetterAuth
   - Consider session pooling or pre-authenticated tokens for load tests

### Medium Priority

1. **Optimize Challenge Pages**
   - p95 at 864ms is higher than tutorials (502ms)
   - Review database queries for challenge detail page

### Optional

1. **Re-run with Fixed Auth**
   - Once login is fixed, re-run to get accurate throughput numbers
   - Consider pre-creating session cookies for load testing

---

## VPS Performance

With 2 cores / 4GB RAM, the server handled:

- **75 concurrent users** without crashing
- **36 requests/second** sustained
- **462ms p95 response time**

The VPS appears adequately sized for the current load profile.
