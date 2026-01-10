# TestingWithEkki API Documentation

Welcome to the TestingWithEkki API documentation.

## API Reference

For the interactive API documentation, visit:

- **Swagger UI**: [/docs/api](/docs/api) - Interactive API explorer
- **OpenAPI Spec**: [/openapi.json](/openapi.json) - Raw OpenAPI 3.0 specification

## Overview

The TestingWithEkki API is organized around REST. It accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes.

## Base URL

| Environment | URL                           |
| ----------- | ----------------------------- |
| Development | `http://localhost:3000`       |
| Production  | `https://testingwithekki.com` |

## Authentication

The API uses cookie-based session authentication powered by [BetterAuth](https://better-auth.com).

### Session Cookie

After successful login, a session cookie (`better_auth.session`) is set automatically. This cookie is sent with subsequent requests for authentication.

### Auth Endpoints

| Method | Endpoint                   | Description          |
| ------ | -------------------------- | -------------------- |
| POST   | `/api/auth/sign-up/email`  | Register with email  |
| POST   | `/api/auth/sign-in/email`  | Login with email     |
| POST   | `/api/auth/sign-in/social` | OAuth login (Google) |
| POST   | `/api/auth/sign-out`       | Sign out             |
| GET    | `/api/auth/get-session`    | Get current session  |

## Endpoints

### Challenges

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/challenges`       | List all challenges   |
| GET    | `/api/challenges/:slug` | Get challenge details |
| POST   | `/api/submissions`      | Submit solution       |

### Users

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/users/me`              | Get current user profile |
| PATCH  | `/api/users/me`              | Update user profile      |
| GET    | `/api/users/me/achievements` | Get user achievements    |

### Gamification

| Method | Endpoint            | Description           |
| ------ | ------------------- | --------------------- |
| GET    | `/api/leaderboard`  | Get leaderboard       |
| GET    | `/api/achievements` | List all achievements |

## Error Handling

The API returns standard HTTP status codes:

| Code | Description                  |
| ---- | ---------------------------- |
| 200  | Success                      |
| 400  | Bad Request - Invalid input  |
| 401  | Unauthorized - Not logged in |
| 403  | Forbidden - No permission    |
| 404  | Not Found                    |
| 429  | Rate Limited                 |
| 500  | Server Error                 |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "statusCode": 400
}
```

## Rate Limiting

API requests are rate limited to:

- **100 requests/minute** for authenticated users
- **20 requests/minute** for unauthenticated users

## Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Get challenges

```bash
curl http://localhost:3000/api/challenges?type=PLAYWRIGHT&difficulty=EASY
```

### Submit a solution

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Cookie: better_auth.session=..." \
  -d '{
    "challengeSlug": "click-the-button",
    "code": "await page.click(\"#submit-btn\");",
    "testResults": [{"passed": true}],
    "executionTime": 150
  }'
```

## SDKs & Tools

- **TypeScript**: Use with `fetch` or any HTTP client
- **Swagger**: Import `/openapi.json` into Postman or Insomnia
