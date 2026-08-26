---
title: 'Configuration, Projects, Environments, and Secrets'
description: 'Keep tests portable while making browser, environment, timeout, and artifact policy explicit.'
---

## Configuration describes the test system

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

Test code should express behavior. Configuration should express runner policy and environment differences.

## Projects are intentional variants

A project can represent a browser engine, viewport/device profile, authenticated role, or environment-specific setup. Avoid multiplying every dimension blindly; the Cartesian product can make CI slow without adding proportional risk coverage.

Choose variants from supported users and product risk. A Chromium smoke suite on every change plus broader scheduled coverage may be more useful than running every scenario everywhere.

## Timeout layers have different meanings

- test timeout limits the whole test including fixtures;
- assertion timeout limits retrying `expect` calls;
- action/navigation timeouts can be configured separately.

Increasing all timeouts globally makes real hangs expensive and does not repair wrong conditions. Change a timeout only with evidence that the operation is legitimately slower.

## Environment values and secrets

Validate required values early:

```ts
const testPassword = process.env.TEST_PASSWORD;
if (!testPassword) throw new Error('TEST_PASSWORD is required');
```

Use local ignored environment files and CI secret storage. Never commit credentials, authenticated storage state, production tokens, or customer data. Avoid printing secrets in test titles, logs, traces, and screenshots.

## Configuration review

Document:

- supported browser/device coverage and why;
- environment URL and test-data ownership;
- artifact retention;
- retries and their purpose;
- concurrency limits;
- commands for type checking and tests.

Configuration is executable policy. Review it with the same care as test code.
