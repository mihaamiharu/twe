---
title: "API Testing Fundamentals"
description: "Learn to test APIs directly with Playwright's request API."
---

# API Testing Fundamentals

Learn to test APIs directly with Playwright's request API.

## Why API Testing?

- **Speed**: API tests run 10-100x faster than UI tests
- **Stability**: No browser rendering = fewer flaky tests  
- **Coverage**: Test business logic without UI dependency
- **Setup**: Create test data quickly for UI tests

---

## REST API Basics

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Read data | Fetch user profile |
| POST | Create data | Register new user |
| PUT | Update data | Change password |
| DELETE | Remove data | Delete account |

### Request Anatomy

```javascript
const response = await request.post('/api/users', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  data: {
    name: 'Test User',
    email: 'test@example.com'
  }
});
```

### Response Anatomy

```javascript
// Status code (200, 201, 400, 404, 500...)
response.status()

// Response body as JSON
const data = await response.json()

// Response headers
response.headers()
```

---

## Status Codes to Know

| Code | Meaning | When You See It |
|------|---------|-----------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/bad auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource missing |
| 500 | Server Error | Backend bug |

---

## Playwright Request API

### Setup in Tests

```javascript
import { test, expect } from '@playwright/test';

test('API test example', async ({ request }) => {
  // 'request' is automatically available
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
});
```

### GET Request

```javascript
// Simple GET
const response = await request.get('/api/users');
expect(response.status()).toBe(200);

const users = await response.json();
expect(users.length).toBeGreaterThan(0);
```

### POST Request

```javascript
// Create resource
const response = await request.post('/api/users', {
  data: {
    name: 'Alice',
    email: 'alice@test.com'
  }
});

expect(response.status()).toBe(201);
const user = await response.json();
expect(user.id).toBeDefined();
```

### With Authentication

```javascript
// Login to get token
const loginRes = await request.post('/api/login', {
  data: { email: 'admin@test.com', password: 'secret' }
});
const { token } = await loginRes.json();

// Use token in subsequent requests
const profileRes = await request.get('/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Response Assertions

### Status Code

```javascript
expect(response.status()).toBe(200);
expect(response.ok()).toBeTruthy(); // 2xx status
```

### Response Body

```javascript
const data = await response.json();

// Check structure
expect(data).toHaveProperty('id');
expect(data.name).toBe('Alice');

// Check array
expect(data.items).toHaveLength(5);
expect(data.items[0]).toMatchObject({
  type: 'product',
  price: expect.any(Number)
});
```

### Headers

```javascript
expect(response.headers()['content-type']).toContain('application/json');
```

---

## Real World Pattern: API + UI

```javascript
test('User can see their orders', async ({ page, request }) => {
  // 1. API: Create test data (fast!)
  await request.post('/api/orders', {
    data: { userId: 'test-user', product: 'Widget', quantity: 2 }
  });
  
  // 2. API: Login and get session
  const loginRes = await request.post('/api/login', {
    data: { email: 'test@qa.com', password: 'pass' }
  });
  
  // 3. UI: Verify display (what we actually test)
  await page.goto('/orders');
  await expect(page.locator('.order-item')).toContainText('Widget');
});
```

---

## Quick Reference

| Action | Code |
|--------|------|
| GET request | `await request.get(url)` |
| POST with JSON | `await request.post(url, { data: {...} })` |
| With headers | `await request.get(url, { headers: {...} })` |
| Check status | `expect(response.status()).toBe(200)` |
| Parse JSON | `await response.json()` |
| Check OK (2xx) | `expect(response.ok()).toBeTruthy()` |

---
