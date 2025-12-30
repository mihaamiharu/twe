# Security Testing Guide

This project employs a multi-layered security testing strategy to ensure code quality, infrastructure safety, and data protection.

## 1. Static Application Security Testing (SAST)

We use `eslint-plugin-security` to statically analyze the source code for insecure patterns (e.g., `eval()`, unsafe regex).

**How to run:**

```bash
bun run lint
```

*Look for errors prefixed with `security/`.*

## 2. Software Composition Analysis (SCA)

We audit dependencies for known vulnerabilities.

**How to run:**

```bash
npm audit
```

*If critical vulnerabilities are found, run `npm audit fix` or update the specific dependency.*

## 3. Secret Scanning

We use **Gitleaks** to detect hardcoded secrets (API keys, passwords) in the repository.

**How to run (via Podman/Docker):**

```bash
podman run -v $(pwd):/path zricethezav/gitleaks:latest detect --source="/path" -v
```

*(Ensure you have Podman or Docker installed).*

## 4. Container Security

We use **Trivy** to scan our container images for OS-level vulnerabilities.

**How to run (via Podman/Docker):**

```bash
# Scan the specific image used such as postgres
podman run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(pwd):/input aquasec/trivy image postgres:16
```

*(You may need to pull the image first).*

## 5. Dynamic Application Security Testing (DAST)

We use **OWASP ZAP** (and optionally **Nuclei**) to scan the running application for vulnerabilities like XSS, SQLi, and missing headers.

**Prerequisites:**

1. Ensure the app is running: `bun run dev` (<http://localhost:3000>)
2. Ensure Podman/Docker is installed.

**How to run OWASP ZAP Baseline Scan:**

```bash
./scripts/security/run-zap.sh
```

**How to run Nuclei (Optional):**

```bash
# Requires nuclei binary installed
nuclei -u http://localhost:3000
```
