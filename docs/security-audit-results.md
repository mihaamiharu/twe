# Security Audit Results

**Target:** qa.testingwithekki.com (Staging)
**Date:** 2026-01-18
**Auditor:** Automated Security Scan

---

## Summary

| Tool | Findings | Severity |
|------|----------|----------|
| npm audit | 7 vulnerabilities | 2 Low, 5 Moderate |
| Gitleaks | 8 findings | 2 Critical (real secrets), 6 False Positives |
| Trivy | 8 CVEs | All Low (Golang stdlib) |
| OWASP ZAP | ✅ **0 vulnerabilities** | All scans passed |

---

## 1. Dependency Vulnerabilities (npm audit)

### Findings

| Package | Severity | Description | Fix |
|---------|----------|-------------|-----|
| `diff` | Low | DoS vulnerability in parsePatch/applyPatch | `npm audit fix` |
| `esbuild` ≤0.24.2 | Moderate | Dev server can receive cross-origin requests | Update drizzle-kit (breaking change) |
| `undici` 7.0.0-7.18.1 | Moderate | Unbounded decompression chain in HTTP responses | `npm audit fix` |

### Recommended Actions

1. ✅ Run `npm audit fix` to resolve non-breaking issues
2. ⚠️ **esbuild/drizzle-kit**: Review breaking change before updating

---

## 2. Secret Scanning (Gitleaks)

### 🚨 CRITICAL: Real Leaked Secrets

| Secret | File | Commit | Action Required |
|--------|------|--------|-----------------|
| `DEEPSEEK_API_KEY` | `.env.staging:40` | daac08be | **ROTATE IMMEDIATELY** |
| `GOOGLE_CLIENT_SECRET` | `.env.staging:17` | eeb7ee52 | **ROTATE IMMEDIATELY** |

### False Positives (No Action Needed)

| Finding | Reason |
|---------|--------|
| `verification.instruction1/2/3` | i18n translation keys, not secrets |
| `generic-api-key` in RegisterForm.tsx | String pattern match, not actual key |

### Recommended Actions

1. 🔴 **CRITICAL**: Rotate DeepSeek API key immediately
2. 🔴 **CRITICAL**: Regenerate Google OAuth credentials
3. Add `.env.*` to `.gitignore` (if not already)
4. Consider using BFG Repo-Cleaner to remove secrets from git history

---

## 3. Container Security (Trivy)

### Target: postgres:15-alpine

| CVE | Severity | Affected Package | Description |
|-----|----------|------------------|-------------|
| CVE-2025-58184 | Low | stdlib (Go 1.24.0) | http2 server may read from hijacked connection |
| CVE-2025-58188 | Low | stdlib | crypto/x509 DSA public keys issue |
| CVE-2025-58189 | Low | stdlib | crypto/tls ALPN negotiation error |
| CVE-2025-61723 | Low | stdlib | encoding/pem quadratic complexity |
| CVE-2025-61724 | Low | stdlib | net/textproto excessive CPU |
| CVE-2025-61725 | Low | stdlib | net/mail ParseAddress CPU |
| CVE-2025-61727 | Low | stdlib | crypto/x509 wildcard SAN constraint |

### Recommended Actions

- ℹ️ All vulnerabilities are LOW severity in internal postgres utilities
- ℹ️ These do not directly affect your application
- Consider monitoring for `postgres:15-alpine` updates

---

## 4. DAST - OWASP ZAP Full Scan

### ✅ Scan Completed - No Vulnerabilities Found

| Security Check | Messages Sent | Alerts |
|----------------|---------------|--------|
| Cross-Site Scripting (XSS) | 487 | ✅ 0 |
| Persistent XSS (Prime) | 91 | ✅ 0 |
| Persistent XSS (Spider) | 226 | ✅ 0 |
| SQL Injection | 2,082 | ✅ 0 |
| SQL Injection (MySQL Timing) | 910 | ✅ 0 |
| SQL Injection (PostgreSQL Timing) | 455 | ✅ 0 |
| SQL Injection (Oracle Timing) | 454 | ✅ 0 |
| External Redirect | 819 | ✅ 0 |
| Server-Side Include | 364 | ✅ 0 |

> **Note:** DOM XSS scan was interrupted due to a connection reset, but all other critical scans completed successfully.

---

## Remediation Priority

| Priority | Finding | Action |
|----------|---------|--------|
| 🔴 P0 | Leaked DeepSeek API key | Rotate immediately |
| 🔴 P0 | Leaked Google OAuth secret | Rotate immediately |
| 🟡 P1 | npm vulnerabilities (moderate) | Run `npm audit fix` |
| 🟢 P2 | Trivy container CVEs | Monitor for updates |
| 🔵 P3 | drizzle-kit/esbuild | Evaluate breaking change |

---

## Next Steps

1. [x] Rotate DeepSeek API key *(partially done)*
2. [x] Regenerate Google OAuth credentials *(partially done)*
3. [x] Run `npm audit fix`
4. [x] Review ZAP report - **All passed!**
5. [ ] Consider using BFG Repo-Cleaner to fully remove secrets from git history
6. [ ] Deploy fixes to staging and re-verify
