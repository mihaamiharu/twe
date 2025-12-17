# JavaScript Fundamentals for QA Engineers

Master the JavaScript essentials you need for test automation.

## Why JavaScript for QA?

Modern test automation frameworks like **Playwright**, **Cypress**, and **WebDriverIO** are built on JavaScript/TypeScript. Understanding core JavaScript concepts will:

- Make you **more effective** at writing tests
- Help you **debug failures** faster
- Enable you to create **reusable test utilities**
- Prepare you for **advanced automation patterns**

> **Pro Tip**: You don't need to be a JavaScript expert. Focus on the fundamentals that matter for testing.

---

## Variables: Storing Test Data

### const vs let

```javascript
// Use const for values that won't change
const maxRetries = 3;
const baseUrl = "https://app.example.com";

// Use let for values that will change
let loginAttempts = 0;
loginAttempts++; // Now 1
```

### Best Practice for Testing

```javascript
// ✅ Good: Clear, descriptive names
const expectedTitle = "Dashboard";
const testUserEmail = "test@example.com";
let currentPageUrl;

// ❌ Avoid: Vague names
const x = "Dashboard";
const email = "test@example.com";
```

---

## Data Types: What You'll Use Most

| Type | Example | Common Use in Testing |
|------|---------|----------------------|
| String | `"Login"` | Page text, selectors |
| Number | `5000` | Timeouts, counts |
| Boolean | `true` | Feature flags, assertions |
| Array | `["Chrome", "Firefox"]` | Test data sets |
| Object | `{user: "admin", pass: "123"}` | Test configurations |

### Type Checking

```javascript
const timeout = 5000;
typeof timeout;  // "number"

const isEnabled = true;
typeof isEnabled;  // "boolean"
```

---

## Arrays: Managing Test Data

Arrays are essential for **data-driven testing**.

### Creating Test Data Arrays

```javascript
const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
const testUsers = [
    { name: "admin", role: "admin" },
    { name: "guest", role: "viewer" }
];
```

### Essential Array Operations

```javascript
const browsers = ["Chrome", "Firefox"];

// Add item
browsers.push("Safari");     // ["Chrome", "Firefox", "Safari"]

// Access by index
browsers[0];                 // "Chrome"

// Loop through
for (const browser of browsers) {
    console.log(`Testing on ${browser}`);
}

// Check if exists
browsers.includes("Chrome"); // true
```

---

## Objects: Structuring Test Cases

Objects group related data—perfect for test configurations.

### Test Case Object

```javascript
const loginTest = {
    name: "Valid Login",
    username: "testuser",
    password: "secret123",
    expectedUrl: "/dashboard",
    timeout: 5000
};

// Access properties
console.log(loginTest.name);     // "Valid Login"
console.log(loginTest.timeout);  // 5000
```

### Nested Objects

```javascript
const testConfig = {
    environment: "staging",
    credentials: {
        admin: { user: "admin", pass: "admin123" },
        regular: { user: "user", pass: "user123" }
    }
};

// Access nested
testConfig.credentials.admin.user;  // "admin"
```

---

## Conditionals: Test Logic

### Basic If-Else

```javascript
const testResult = "passed";

if (testResult === "passed") {
    console.log("✅ Test passed!");
} else if (testResult === "skipped") {
    console.log("⏭️ Test skipped");
} else {
    console.log("❌ Test failed");
}
```

### Common Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `===` | Equals | `status === "passed"` |
| `!==` | Not equals | `errors !== 0` |
| `>` | Greater than | `retries > 3` |
| `>=` | Greater or equal | `score >= 80` |

### Ternary Operator (Short If-Else)

```javascript
const status = isPassed ? "PASS" : "FAIL";
const message = count === 0 ? "No tests" : `${count} tests`;
```

---

## Loops: Iterating Test Data

### For...of Loop (Preferred)

```javascript
const testCases = ["login", "signup", "checkout"];

for (const testCase of testCases) {
    console.log(`Running: ${testCase}`);
}
```

### Counting Results

```javascript
const results = ["pass", "fail", "pass", "pass"];
let passCount = 0;

for (const result of results) {
    if (result === "pass") {
        passCount++;
    }
}
console.log(`Passed: ${passCount}/${results.length}`);
```

---

## Functions: Reusable Test Helpers

### Basic Function

```javascript
function calculatePassRate(passed, total) {
    return (passed / total) * 100;
}

calculatePassRate(8, 10);  // 80
```

### Arrow Functions (Modern Syntax)

```javascript
// Traditional
function isValid(email) {
    return email.includes("@");
}

// Arrow (shorter)
const isValid = (email) => email.includes("@");

// Even shorter for one parameter
const isValid = email => email.includes("@");
```

### Default Parameters

```javascript
function waitForElement(selector, timeout = 5000) {
    // timeout defaults to 5000 if not provided
}

waitForElement("#login");        // Uses 5000
waitForElement("#login", 10000); // Uses 10000
```

---

## Array Methods: Powerful Data Manipulation

These three methods are **game-changers** for test data.

### filter() - Select Matching Items

```javascript
const tests = [
    { name: "Login", status: "passed" },
    { name: "Signup", status: "failed" },
    { name: "Profile", status: "passed" }
];

const failed = tests.filter(t => t.status === "failed");
// [{ name: "Signup", status: "failed" }]
```

### map() - Transform Items

```javascript
const users = ["alice", "bob", "charlie"];
const emails = users.map(u => `${u}@test.com`);
// ["alice@test.com", "bob@test.com", "charlie@test.com"]
```

### find() - Get First Match

```javascript
const config = tests.find(t => t.name === "Login");
// { name: "Login", status: "passed" }
```

---

## String Methods: Text Assertions

Essential for validating page content.

### includes() - Check for Text

```javascript
const message = "Login successful";
message.includes("successful");  // true
message.includes("failed");      // false
```

### trim() - Clean Whitespace

```javascript
const rawText = "   Hello World   ";
rawText.trim();  // "Hello World"
```

### split() - Break Into Parts

```javascript
const errorCode = "ERROR: AUTH_FAILED";
const parts = errorCode.split(": ");
parts[1];  // "AUTH_FAILED"
```

---

## Destructuring: Clean Extraction

### Object Destructuring

```javascript
const testResult = {
    name: "Login Test",
    duration: 1500,
    status: "passed"
};

// Instead of:
const name = testResult.name;
const status = testResult.status;

// Use destructuring:
const { name, status, duration } = testResult;
```

### In Function Parameters

```javascript
function logResult({ name, status }) {
    console.log(`${name}: ${status}`);
}

logResult(testResult);  // "Login Test: passed"
```

---

## Quick Reference

| Concept | Syntax | Example |
|---------|--------|---------|
| Constant | `const x = value` | `const MAX = 10` |
| Variable | `let x = value` | `let count = 0` |
| Array | `[item1, item2]` | `["a", "b"]` |
| Object | `{key: value}` | `{name: "test"}` |
| Arrow Function | `x => expression` | `n => n * 2` |
| Filter | `arr.filter(fn)` | `arr.filter(x => x > 0)` |
| Map | `arr.map(fn)` | `arr.map(x => x * 2)` |
| Destructure | `const {a, b} = obj` | `const {name} = user` |

---

## Practice Challenges

Ready to apply what you learned? Try these challenges:

1. [Variables & Types](/challenges/js-variables-types)
2. [Arrays for Test Data](/challenges/js-arrays-test-data)
3. [Objects for Tests](/challenges/js-objects-for-tests)
4. [If-Else Logic](/challenges/js-if-else-logic)
5. [Functions Basics](/challenges/js-functions-basics)
6. [Array Methods](/challenges/js-array-methods)

---

## Next Steps

- Practice the challenges to solidify your understanding
- Move on to [DOM Manipulation for Testing](/tutorials/dom-manipulation-for-testing) (coming soon)
- Explore [Async/Await Basics](/tutorials/async-await-basics) (coming soon)
