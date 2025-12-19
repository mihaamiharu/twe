/**
 * Beginner Tier Challenges Seed Script
 * 
 * Seeds the database with Beginner tier JavaScript challenges.
 * Run with: bun run db:seed:beginner
 */

import { db } from './index';
import { challenges, testCases } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================================
// JAVASCRIPT FUNDAMENTALS CHALLENGES (10)
// ============================================================================

export const jsFundamentalsChallenges = [
    // Challenge 1: Variables & Types
    {
        slug: 'js-variables-types',
        title: 'Variables & Types',
        description: 'Learn to declare variables with let and const, and understand JavaScript data types.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 15,
        order: 101,
        instructions: `# Variables & Types

In JavaScript, variables are containers for storing data values.

## Declaring Variables

### \`const\` - Constant (Preferred)
- **Cannot be reassigned** after declaration
- Use for values that won't change

\`\`\`javascript
const username = "testuser";
const maxRetries = 3;
\`\`\`

### \`let\` - Mutable Variable
- **Can be reassigned**
- Use when the value will change

\`\`\`javascript
let attempts = 0;
attempts = attempts + 1; // OK
\`\`\`

## Data Types

| Type | Example | Use Case |
|------|---------|----------|
| String | \`"hello"\` | Text, labels, messages |
| Number | \`42\`, \`3.14\` | Counts, measurements |
| Boolean | \`true\`, \`false\` | Flags, conditions |
| Null | \`null\` | Intentional empty value |
| Undefined | \`undefined\` | Unassigned variable |

## Your Task

1. Create a constant \`testName\` with value \`"Login Test"\`
2. Create a variable \`passCount\` with value \`0\`
3. Increment \`passCount\` by 1
4. The \`result\` variable should contain the final \`passCount\` value

> **Why this matters:** Test automation uses variables to track test state, store expected values, and count results.
`,
        htmlContent: `<div class="test-runner">
  <h3>Test Runner</h3>
  <p>Running tests...</p>
</div>`,
        starterCode: `// 1. Create a constant called testName with value "Login Test"


// 2. Create a variable called passCount with value 0


// 3. Increment passCount by 1


// 4. Assign passCount to result (don't change this line)
const result = passCount;`,
        expectedOutput: '1',
        hints: [
            'Use const for testName since it won\'t change',
            'Use let for passCount since you need to increment it',
            'Increment with: passCount = passCount + 1 or passCount++',
        ],
        tags: ['javascript', 'variables', 'types', 'beginner'],
    },

    // Challenge 2: Arrays for Test Data
    {
        slug: 'js-arrays-test-data',
        title: 'Arrays for Test Data',
        description: 'Create and manipulate arrays to store test data.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 20,
        order: 102,
        instructions: `# Arrays for Test Data

Arrays store multiple values in a single variable - perfect for test data!

## Creating Arrays

\`\`\`javascript
const usernames = ["alice", "bob", "charlie"];
const testCounts = [1, 5, 10, 100];
const mixed = ["login", 3, true]; // Can mix types
\`\`\`

## Array Operations

| Operation | Syntax | Result |
|-----------|--------|--------|
| Access item | \`arr[0]\` | First element |
| Get length | \`arr.length\` | Number of items |
| Add to end | \`arr.push(item)\` | Adds item |
| Remove last | \`arr.pop()\` | Removes & returns last |
| Check includes | \`arr.includes(item)\` | true/false |

## Examples

\`\`\`javascript
const browsers = ["Chrome", "Firefox", "Safari"];

// Access elements (0-indexed!)
browsers[0];        // "Chrome"
browsers[2];        // "Safari"

// Get length
browsers.length;    // 3

// Add element
browsers.push("Edge");
// Now: ["Chrome", "Firefox", "Safari", "Edge"]
\`\`\`

## Your Task

1. Create an array \`testCredentials\` with 3 usernames: "admin", "user", "guest"
2. Add "superadmin" to the end of the array
3. Store the array length in \`result\`

> **Why this matters:** Arrays are essential for data-driven testing where you run the same test with different inputs.
`,
        htmlContent: `<div class="test-data">
  <h3>Test Data Manager</h3>
  <ul id="credentials-list"></ul>
</div>`,
        starterCode: `// 1. Create an array with 3 usernames: "admin", "user", "guest"
const testCredentials = 

// 2. Add "superadmin" to the end


// 3. Store the array length in result
const result = `,
        expectedOutput: '4',
        hints: [
            'Create array with: ["admin", "user", "guest"]',
            'Use .push() to add to the end',
            'Use .length to get the count',
        ],
        tags: ['javascript', 'arrays', 'test-data', 'beginner'],
    },

    // Challenge 3: Objects for Tests
    {
        slug: 'js-objects-for-tests',
        title: 'Objects for Tests',
        description: 'Use objects to structure test case data with properties.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 25,
        order: 103,
        instructions: `# Objects for Tests

Objects group related data together using key-value pairs - ideal for test cases!

## Creating Objects

\`\`\`javascript
const testCase = {
    name: "Valid Login",
    username: "testuser",
    password: "secret123",
    expectedResult: "success"
};
\`\`\`

## Accessing Properties

\`\`\`javascript
// Dot notation (preferred)
testCase.name;          // "Valid Login"
testCase.username;      // "testuser"

// Bracket notation (for dynamic keys)
testCase["password"];   // "secret123"
\`\`\`

## Modifying Objects

\`\`\`javascript
// Change a value
testCase.expectedResult = "failure";

// Add a new property
testCase.priority = "high";
\`\`\`

## Nested Objects

\`\`\`javascript
const apiTest = {
    endpoint: "/api/users",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer token123"
    }
};

// Access nested: 
apiTest.headers["Content-Type"]; // "application/json"
\`\`\`

## Your Task

1. Create a \`testUser\` object with:
   - \`email\`: "test@example.com"
   - \`isActive\`: true
   - \`loginCount\`: 5
2. Increment \`loginCount\` by 1
3. Store the new \`loginCount\` in \`result\`
`,
        htmlContent: `<div class="user-profile">
  <h3>User Profile</h3>
  <div id="user-info"></div>
</div>`,
        starterCode: `// 1. Create a testUser object with email, isActive, and loginCount
const testUser = {
    
};

// 2. Increment loginCount by 1


// 3. Store the loginCount in result
const result = `,
        expectedOutput: '6',
        hints: [
            'Object properties use key: value syntax, separated by commas',
            'Increment with: testUser.loginCount++ or testUser.loginCount += 1',
            'Access with: testUser.loginCount',
        ],
        tags: ['javascript', 'objects', 'test-data', 'beginner'],
    },

    // Challenge 4: If-Else Logic
    {
        slug: 'js-if-else-logic',
        title: 'If-Else Logic',
        description: 'Use conditional statements to create dynamic test flows.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 25,
        order: 104,
        instructions: `# If-Else Logic

Conditionals let your tests make decisions based on conditions.

## Basic If-Else

\`\`\`javascript
if (condition) {
    // runs if condition is true
} else {
    // runs if condition is false
}
\`\`\`

## Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| \`===\` | Equals | \`status === "passed"\` |
| \`!==\` | Not equals | \`count !== 0\` |
| \`>\` | Greater than | \`score > 80\` |
| \`<\` | Less than | \`retries < 3\` |
| \`>=\` | Greater or equal | \`attempts >= 1\` |
| \`<=\` | Less or equal | \`errors <= 5\` |

## Logical Operators

\`\`\`javascript
// AND - both must be true
if (isLoggedIn && hasPermission) { }

// OR - at least one must be true  
if (isAdmin || isModerator) { }

// NOT - inverts the condition
if (!isDisabled) { }
\`\`\`

## Example: Test Result Check

\`\`\`javascript
const score = 85;
let grade;

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}
// grade is "B"
\`\`\`

## Your Task

Write a function that returns the test status:
- If \`passCount\` equals \`totalTests\`: return "ALL_PASSED"
- Else if \`passCount\` is greater than 0: return "PARTIAL"
- Else: return "ALL_FAILED"

The variables \`passCount\` and \`totalTests\` are provided.
`,
        htmlContent: `<div class="test-status">
  <h3>Test Results</h3>
  <div id="status-display"></div>
</div>`,
        starterCode: `// Given values (don't modify)
const passCount = 5;
const totalTests = 10;

// Write your if-else logic here
let result;

if () {
    result = "ALL_PASSED";
} else if () {
    result = "PARTIAL";
} else {
    result = "ALL_FAILED";
}`,
        expectedOutput: 'PARTIAL',
        hints: [
            'First condition: passCount === totalTests',
            'Second condition: passCount > 0',
            'No condition needed for else (it catches everything else)',
        ],
        tags: ['javascript', 'conditionals', 'logic', 'beginner'],
    },

    // Challenge 5: Loops in Testing
    {
        slug: 'js-loops-testing',
        title: 'Loops in Testing',
        description: 'Iterate over test data using for and for...of loops.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 30,
        order: 105,
        instructions: `# Loops in Testing

Loops let you repeat actions - essential for running tests across multiple data sets!

## For Loop (Classic)

\`\`\`javascript
for (let i = 0; i < 5; i++) {
    console.log("Attempt:", i);
}
// Runs 5 times: 0, 1, 2, 3, 4
\`\`\`

## For...of Loop (Modern - Preferred)

\`\`\`javascript
const browsers = ["Chrome", "Firefox", "Safari"];

for (const browser of browsers) {
    console.log("Testing on:", browser);
}
\`\`\`

## For...in Loop (for Objects)

\`\`\`javascript
const testCase = { name: "Login", priority: "high" };

for (const key in testCase) {
    console.log(key, ":", testCase[key]);
}
\`\`\`

## Practical Example: Counting Passed Tests

\`\`\`javascript
const results = ["pass", "fail", "pass", "pass", "fail"];
let passCount = 0;

for (const result of results) {
    if (result === "pass") {
        passCount++;
    }
}
// passCount is 3
\`\`\`

## Your Task

Given an array of test scores, count how many scores are **80 or above** (passing).

Store the count in \`result\`.
`,
        htmlContent: `<div class="score-analyzer">
  <h3>Score Analysis</h3>
  <div id="pass-count"></div>
</div>`,
        starterCode: `// Given test scores
const scores = [95, 72, 88, 65, 91, 78, 83, 69];

// Count how many scores are 80 or above
let result = 0;

for (const score of scores) {
    // Your code here
    
}`,
        expectedOutput: '4',
        hints: [
            'Loop through each score with for...of',
            'Use an if statement to check if score >= 80',
            'Increment result when the condition is true',
        ],
        tags: ['javascript', 'loops', 'iteration', 'beginner'],
    },

    // Challenge 6: Functions Basics
    {
        slug: 'js-functions-basics',
        title: 'Functions Basics',
        description: 'Create reusable test helper functions.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 35,
        order: 106,
        instructions: `# Functions Basics

Functions are reusable blocks of code - the building blocks of test automation!

## Declaring Functions

\`\`\`javascript
function greet(name) {
    return "Hello, " + name + "!";
}

// Call the function
const message = greet("Tester"); // "Hello, Tester!"
\`\`\`

## Function Parameters

\`\`\`javascript
function calculateTotal(price, quantity) {
    return price * quantity;
}

calculateTotal(10, 3); // 30
\`\`\`

## Default Parameters

\`\`\`javascript
function retry(action, times = 3) {
    // times defaults to 3 if not provided
    for (let i = 0; i < times; i++) {
        action();
    }
}

retry(myTest);      // Runs 3 times
retry(myTest, 5);   // Runs 5 times
\`\`\`

## Test Helper Example

\`\`\`javascript
function isValidEmail(email) {
    return email.includes("@") && email.includes(".");
}

// Use in tests
isValidEmail("test@example.com"); // true
isValidEmail("invalid");           // false
\`\`\`

## Your Task

Create a function \`calculatePassRate\` that:
1. Takes two parameters: \`passed\` and \`total\`
2. Returns the pass rate as a percentage (passed / total * 100)
3. Call it with passed=7 and total=10, store in \`result\`
`,
        htmlContent: `<div class="calculator">
  <h3>Pass Rate Calculator</h3>
  <div id="rate-display"></div>
</div>`,
        starterCode: `// Create the calculatePassRate function
function calculatePassRate(passed, total) {
    // Return the percentage
    
}

// Call the function with 7 passed out of 10 total
const result = `,
        expectedOutput: '70',
        hints: [
            'Formula: (passed / total) * 100',
            'Return the result from the function',
            'Call with: calculatePassRate(7, 10)',
        ],
        tags: ['javascript', 'functions', 'helpers', 'beginner'],
    },

    // Challenge 7: Arrow Functions
    {
        slug: 'js-arrow-functions',
        title: 'Arrow Functions',
        description: 'Master the modern arrow function syntax for callbacks.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 35,
        order: 107,
        instructions: `# Arrow Functions

Arrow functions provide a shorter syntax - widely used in modern JavaScript and test frameworks!

## Traditional vs Arrow

\`\`\`javascript
// Traditional function
function add(a, b) {
    return a + b;
}

// Arrow function
const add = (a, b) => {
    return a + b;
};

// Short arrow (implicit return)
const add = (a, b) => a + b;
\`\`\`

## Arrow Function Variations

\`\`\`javascript
// No parameters
const sayHello = () => "Hello!";

// One parameter (parentheses optional)
const double = x => x * 2;
const double = (x) => x * 2;  // Also valid

// Multiple parameters (parentheses required)
const add = (a, b) => a + b;

// Multiple statements (braces + return required)
const process = (data) => {
    const cleaned = data.trim();
    return cleaned.toUpperCase();
};
\`\`\`

## Common in Test Frameworks

\`\`\`javascript
// Jest/Playwright tests use arrow functions
test('should login successfully', async () => {
    await page.click('#login');
    await expect(page).toHaveURL('/dashboard');
});

// Array callbacks
const passed = results.filter(r => r.status === 'passed');
\`\`\`

## Your Task

1. Create an arrow function \`isPositive\` that returns \`true\` if a number > 0
2. Create an arrow function \`square\` that returns a number squared
3. Use \`square\` on 8 and store in \`result\`
`,
        htmlContent: `<div class="function-demo">
  <h3>Arrow Functions</h3>
</div>`,
        starterCode: `// 1. Create isPositive arrow function (returns true if n > 0)
const isPositive = 

// 2. Create square arrow function (returns n * n)
const square = 

// 3. Use square on 8
const result = `,
        expectedOutput: '64',
        hints: [
            'isPositive: n => n > 0',
            'square: n => n * n',
            'Call with: square(8)',
        ],
        tags: ['javascript', 'arrow-functions', 'modern', 'beginner'],
    },

    // Challenge 8: Array Methods
    {
        slug: 'js-array-methods',
        title: 'Array Methods',
        description: 'Use map, filter, and find for powerful test data manipulation.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 40,
        order: 108,
        instructions: `# Array Methods

These powerful methods transform and search arrays - essential for test data handling!

## map() - Transform Every Item

\`\`\`javascript
const numbers = [1, 2, 3, 4];
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8]

const users = ["alice", "bob"];
const emails = users.map(u => u + "@test.com");
// ["alice@test.com", "bob@test.com"]
\`\`\`

## filter() - Keep Matching Items

\`\`\`javascript
const scores = [85, 92, 67, 78, 95];
const passing = scores.filter(s => s >= 80);
// [85, 92, 95]

const tests = [{name: "A", status: "pass"}, {name: "B", status: "fail"}];
const passed = tests.filter(t => t.status === "pass");
// [{name: "A", status: "pass"}]
\`\`\`

## find() - Get First Match

\`\`\`javascript
const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" }
];

const bob = users.find(u => u.name === "Bob");
// { id: 2, name: "Bob" }

const notFound = users.find(u => u.name === "Charlie");
// undefined
\`\`\`

## Chaining Methods

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6];
const result = numbers
    .filter(n => n > 2)      // [3, 4, 5, 6]
    .map(n => n * 10);       // [30, 40, 50, 60]
\`\`\`

## Your Task

Given an array of test results, use array methods to:
1. Filter only the "passed" tests
2. Get the count of passed tests
3. Store the count in \`result\`
`,
        htmlContent: `<div class="results-processor">
  <h3>Results Processor</h3>
</div>`,
        starterCode: `const testResults = [
    { name: "Login", status: "passed" },
    { name: "Signup", status: "failed" },
    { name: "Profile", status: "passed" },
    { name: "Settings", status: "passed" },
    { name: "Logout", status: "failed" }
];

// Filter to get only passed tests, then get the count
const passedTests = testResults.filter(

);

const result = passedTests.length;`,
        expectedOutput: '3',
        hints: [
            'Filter callback: test => test.status === "passed"',
            '.filter() returns a new array',
            '.length gives you the count',
        ],
        tags: ['javascript', 'array-methods', 'map', 'filter', 'beginner'],
    },

    // Challenge 9: String Methods
    {
        slug: 'js-string-methods',
        title: 'String Methods',
        description: 'Use includes, trim, and split for text assertions.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 40,
        order: 109,
        instructions: `# String Methods

String methods are crucial for validating text content in tests!

## includes() - Check for Substring

\`\`\`javascript
const message = "Login successful";
message.includes("successful");  // true
message.includes("failed");      // false
\`\`\`

## trim() - Remove Whitespace

\`\`\`javascript
const input = "  hello world  ";
input.trim();        // "hello world"
input.trimStart();   // "hello world  "
input.trimEnd();     // "  hello world"
\`\`\`

## split() - Break into Array

\`\`\`javascript
const csv = "apple,banana,cherry";
csv.split(",");  // ["apple", "banana", "cherry"]

const sentence = "Hello World";
sentence.split(" ");  // ["Hello", "World"]
\`\`\`

## Other Useful Methods

\`\`\`javascript
const text = "Hello World";

text.toLowerCase();        // "hello world"
text.toUpperCase();        // "HELLO WORLD"
text.startsWith("Hello");  // true
text.endsWith("World");    // true
text.replace("World", "Test");  // "Hello Test"
text.length;               // 11
\`\`\`

## Test Assertion Example

\`\`\`javascript
// Verify error message
const errorMsg = "  Error: Invalid email format  ";
const cleaned = errorMsg.trim();

if (cleaned.includes("Invalid email")) {
    console.log("Correct error shown!");
}
\`\`\`

## Your Task

Given an error message with extra whitespace:
1. Trim the whitespace
2. Check if it includes "failed"
3. If it does, extract just the error code (after the colon)
4. Store the error code in \`result\`
`,
        htmlContent: `<div class="error-parser">
  <h3>Error Parser</h3>
</div>`,
        starterCode: `const rawMessage = "   Error: AUTH_FAILED   ";

// 1. Trim the message
const trimmed = 

// 2 & 3. Split by ": " and get the second part (error code)
const parts = trimmed.split(": ");
const result = parts[1];`,
        expectedOutput: 'AUTH_FAILED',
        hints: [
            'Use .trim() to remove whitespace',
            'split(": ") creates ["Error", "AUTH_FAILED"]',
            'Index [1] gets "AUTH_FAILED"',
        ],
        tags: ['javascript', 'strings', 'assertions', 'beginner'],
    },

    // Challenge 10: Destructuring
    {
        slug: 'js-destructuring',
        title: 'Destructuring',
        description: 'Extract values from objects and arrays cleanly.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'javascript-fundamentals',
        xpReward: 45,
        order: 110,
        instructions: `# Destructuring

Destructuring extracts values from arrays/objects into variables - cleaner code!

## Object Destructuring

\`\`\`javascript
const user = {
    name: "Alice",
    email: "alice@test.com",
    role: "admin"
};

// Without destructuring
const name = user.name;
const email = user.email;

// With destructuring
const { name, email, role } = user;
console.log(name);  // "Alice"
\`\`\`

## Renaming Variables

\`\`\`javascript
const { name: userName, email: userEmail } = user;
console.log(userName);  // "Alice"
\`\`\`

## Default Values

\`\`\`javascript
const { name, isVerified = false } = user;
// isVerified defaults to false if not in user
\`\`\`

## Array Destructuring

\`\`\`javascript
const colors = ["red", "green", "blue"];
const [first, second, third] = colors;
console.log(first);   // "red"

// Skip items
const [, , last] = colors;
console.log(last);    // "blue"
\`\`\`

## In Function Parameters

\`\`\`javascript
// Common in test frameworks
function runTest({ name, timeout = 5000 }) {
    console.log(\`Running \${name} with \${timeout}ms timeout\`);
}

runTest({ name: "Login Test" });
\`\`\`

## Your Task

Given a test result object, use destructuring to:
1. Extract \`testName\`, \`duration\`, and \`status\`
2. Calculate the \`result\` as: duration if passed, 0 if failed
`,
        htmlContent: `<div class="test-result">
  <h3>Test Result</h3>
</div>`,
        starterCode: `const testResult = {
    testName: "API Response Time",
    duration: 250,
    status: "passed",
    timestamp: "2024-01-15T10:30:00"
};

// Destructure testName, duration, and status
const {  } = testResult;

// Calculate result: duration if passed, 0 if failed
const result = status === "passed" ? duration : 0;`,
        expectedOutput: '250',
        hints: [
            'Destructure with: const { testName, duration, status } = testResult',
            'The ternary operator checks the status',
            'Since status is "passed", result should be 250',
        ],
        tags: ['javascript', 'destructuring', 'modern', 'beginner'],
    },
];

// ============================================================================
// DOM UNDERSTANDING CHALLENGES (8)
// ============================================================================

export const domChallenges = [
    {
        slug: 'dom-queryselector-vs-all',
        title: 'querySelector vs querySelectorAll',
        description: 'Learn the difference between selecting one element vs multiple elements.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 20,
        order: 201,
        instructions: `# querySelector vs querySelectorAll

These are the two main ways to find elements in test automation!

## querySelector() - Get ONE Element
Returns **first matching element** or null.

## querySelectorAll() - Get ALL Elements  
Returns a **NodeList** of all matches.

## Your Task
1. Use querySelector to get the element with id "title"
2. Use querySelectorAll to get all elements with class "item"
3. Store the **count** of items in result
`,
        htmlContent: `<div class="shopping-list">
  <h1 id="title">My Shopping List</h1>
  <ul>
    <li class="item">Apples</li>
    <li class="item">Bananas</li>
    <li class="item">Oranges</li>
    <li class="item">Milk</li>
  </ul>
</div>`,
        starterCode: `// 1. Get the title element by ID
const titleElement = document.querySelector('#title');

// 2. Get all items by class
const items = document.querySelectorAll('.item');

// 3. Store the count of items
const result = items.length;`,
        expectedOutput: '4',
        hints: ['querySelector uses "#title" for ID', 'querySelectorAll uses ".item" for class', '.length gives the count'],
        tags: ['javascript', 'dom', 'querySelector', 'beginner'],
    },
    {
        slug: 'dom-element-properties',
        title: 'Get Element Properties',
        description: 'Extract text, values, and attributes from DOM elements.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 25,
        order: 202,
        instructions: `# Get Element Properties

Once you find an element, you need to get its data for assertions!

- textContent: Gets all text inside element
- value: Gets input field value
- getAttribute(): Gets any attribute

## Your Task
1. Get the text content of the element with class "price"
2. Get the value from the input with id "quantity"
3. Multiply price x quantity and store in result
`,
        htmlContent: `<div class="product">
  <h2>Premium Widget</h2>
  <span class="price">25</span>
  <label>Quantity: <input type="number" id="quantity" value="4" /></label>
</div>`,
        starterCode: `const priceText = document.querySelector('.price').textContent;
const quantity = document.querySelector('#quantity').value;
const result = Number(priceText) * Number(quantity);`,
        expectedOutput: '100',
        hints: ['.textContent returns a string', '.value also returns a string', 'Use Number() to convert'],
        tags: ['javascript', 'dom', 'properties', 'beginner'],
    },
    {
        slug: 'dom-check-element-state',
        title: 'Check Element State',
        description: 'Verify if elements are disabled, checked, or hidden.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 30,
        order: 203,
        instructions: `# Check Element State

Testing often requires verifying element states!

- disabled: Is the element disabled?
- checked: Is the checkbox/radio checked?

## Your Task
Count how many checkboxes are checked and store in result.
`,
        htmlContent: `<form class="preferences">
  <label><input type="checkbox" name="email" checked /> Email</label>
  <label><input type="checkbox" name="sms" /> SMS</label>
  <label><input type="checkbox" name="push" checked /> Push</label>
  <label><input type="checkbox" name="newsletter" checked /> Newsletter</label>
</form>`,
        starterCode: `const checkboxes = document.querySelectorAll('input[type="checkbox"]');
let result = 0;
for (const checkbox of checkboxes) {
    if (checkbox.checked) {
        result++;
    }
}`,
        expectedOutput: '3',
        hints: ['.checked is a boolean property', 'Loop through and count checked ones'],
        tags: ['javascript', 'dom', 'state', 'forms', 'beginner'],
    },
    {
        slug: 'dom-parent-child-navigation',
        title: 'Parent/Child Navigation',
        description: 'Traverse the DOM tree using parent, child, and sibling properties.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 35,
        order: 204,
        instructions: `# Parent/Child Navigation

Navigate the DOM tree to find related elements!

- parentElement: Direct parent
- children: All child elements
- nextElementSibling: Next sibling

## Your Task
1. Find the element with class "active"
2. Get its parent element
3. Count how many children the parent has
`,
        htmlContent: `<nav class="tabs">
  <button class="tab">Home</button>
  <button class="tab active">Products</button>
  <button class="tab">About</button>
  <button class="tab">Contact</button>
</nav>`,
        starterCode: `const activeTab = document.querySelector('.active');
const parent = activeTab.parentElement;
const result = parent.children.length;`,
        expectedOutput: '4',
        hints: ['.parentElement goes up one level', '.children returns all child elements'],
        tags: ['javascript', 'dom', 'traversal', 'beginner'],
    },
    {
        slug: 'dom-event-listeners',
        title: 'Event Listeners',
        description: 'Understanding click, input, and other DOM events.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 40,
        order: 205,
        instructions: `# Event Listeners

Events are triggered when users interact with the page.
You can simulate clicks programmatically with .click()

## Your Task
1. Get the increment button
2. Use .click() to click it three times
3. Get the counter value and store in result
`,
        htmlContent: `<div class="counter-app">
  <span id="count">0</span>
  <button id="increment" onclick="document.getElementById('count').textContent = Number(document.getElementById('count').textContent) + 1">+1</button>
</div>`,
        starterCode: `const button = document.querySelector('#increment');
button.click();
button.click();
button.click();
const result = Number(document.querySelector('#count').textContent);`,
        expectedOutput: '3',
        hints: ['.click() triggers a click event', 'Call it multiple times'],
        tags: ['javascript', 'dom', 'events', 'beginner'],
    },
    {
        slug: 'dom-form-interaction',
        title: 'Form Interaction',
        description: 'Get and set form values programmatically.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 45,
        order: 206,
        instructions: `# Form Interaction

Working with forms is essential for testing!

- Set .value for text inputs
- Set .checked for checkboxes

## Your Task
1. Set username to "testuser"
2. Set password to "secret123"
3. Concatenate username + ":" + password into result
`,
        htmlContent: `<form class="login-form">
  <input type="text" id="username" placeholder="Username" />
  <input type="password" id="password" placeholder="Password" />
  <label><input type="checkbox" id="remember" /> Remember me</label>
</form>`,
        starterCode: `document.querySelector('#username').value = 'testuser';
document.querySelector('#password').value = 'secret123';
document.querySelector('#remember').checked = true;
const username = document.querySelector('#username').value;
const password = document.querySelector('#password').value;
const result = username + ':' + password;`,
        expectedOutput: 'testuser:secret123',
        hints: ['Set .value for text inputs', 'Set .checked for checkboxes'],
        tags: ['javascript', 'dom', 'forms', 'beginner'],
    },
    {
        slug: 'dom-table-data-extraction',
        title: 'Table Data Extraction',
        description: 'Extract and parse data from HTML tables.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 50,
        order: 207,
        instructions: `# Table Data Extraction

Tables are common in web apps!

- tbody.rows: All rows in table body
- row.cells[n]: Cell at index n

## Your Task
Sum up the "Amount" column (column index 2) and store in result.
`,
        htmlContent: `<table class="orders">
  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th></tr></thead>
  <tbody>
    <tr><td>001</td><td>Alice</td><td>150</td></tr>
    <tr><td>002</td><td>Bob</td><td>200</td></tr>
    <tr><td>003</td><td>Carol</td><td>75</td></tr>
    <tr><td>004</td><td>Dave</td><td>125</td></tr>
  </tbody>
</table>`,
        starterCode: `const tbody = document.querySelector('tbody');
let result = 0;
for (const row of tbody.rows) {
    const amount = Number(row.cells[2].textContent);
    result += amount;
}`,
        expectedOutput: '550',
        hints: ['row.cells[2] is the Amount column', 'Convert to Number for math'],
        tags: ['javascript', 'dom', 'tables', 'beginner'],
    },
    {
        slug: 'dom-wait-for-element',
        title: 'Wait for Element',
        description: 'Check if elements exist or are visible in the DOM.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'dom-understanding',
        xpReward: 55,
        order: 208,
        instructions: `# Wait for Element

Checking element presence is crucial for reliable tests!

querySelector returns null if element not found.

## Your Task
Check if header, footer, and sidebar exist. Count how many exist and store in result.
`,
        htmlContent: `<div class="page">
  <header id="header">Header Content</header>
  <main id="content">Main Content</main>
  <footer id="footer">Footer Content</footer>
</div>`,
        starterCode: `const hasHeader = document.querySelector('#header') !== null;
const hasFooter = document.querySelector('#footer') !== null;
const hasSidebar = document.querySelector('#sidebar') !== null;
const result = (hasHeader ? 1 : 0) + (hasFooter ? 1 : 0) + (hasSidebar ? 1 : 0);`,
        expectedOutput: '2',
        hints: ['querySelector returns null if not found', 'Header and footer exist, sidebar does not'],
        tags: ['javascript', 'dom', 'existence', 'beginner'],
    },
];

// ============================================================================
// ASYNC/AWAIT BASICS CHALLENGES (5)
// ============================================================================

export const asyncChallenges = [
    {
        slug: 'async-understanding-promises',
        title: 'Understanding Promises',
        description: 'Learn what Promises are and how they represent future values.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'async-await-basics',
        xpReward: 35,
        order: 301,
        instructions: `# Understanding Promises

Promises represent a value that may not be available yet.

## Promise States
- **Pending**: Initial state, not yet fulfilled or rejected
- **Fulfilled**: Operation completed successfully
- **Rejected**: Operation failed

## Creating a Promise

\`\`\`javascript
const promise = new Promise((resolve, reject) => {
    // Async operation
    if (success) {
        resolve(value);  // Fulfilled
    } else {
        reject(error);   // Rejected
    }
});
\`\`\`

## Using .then() and .catch()

\`\`\`javascript
promise
    .then(value => console.log(value))
    .catch(error => console.log(error));
\`\`\`

## Your Task
Create a Promise that resolves with the value 42 after execution.
Store the resolved value in result.
`,
        htmlContent: `<div class="promise-demo">
  <h3>Promise Demo</h3>
</div>`,
        starterCode: `// Create a promise that resolves with 42
const myPromise = new Promise((resolve, reject) => {
    resolve(42);
});

// Get the value from the promise
let result;
myPromise.then(value => {
    result = value;
});`,
        expectedOutput: '42',
        hints: ['Use resolve(42) inside the Promise', '.then() receives the resolved value'],
        tags: ['javascript', 'async', 'promises', 'beginner'],
    },
    {
        slug: 'async-await-basics',
        title: 'Async/Await Basics',
        description: 'Write cleaner async code using async/await syntax.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'async-await-basics',
        xpReward: 40,
        order: 302,
        instructions: `# Async/Await Basics

async/await makes async code look synchronous!

## Async Function

\`\`\`javascript
async function fetchData() {
    const data = await somePromise;
    return data;
}
\`\`\`

## Key Rules
- **async** keyword before function makes it return a Promise
- **await** pauses execution until Promise resolves
- Can only use await inside async functions

## Arrow Function Syntax

\`\`\`javascript
const fetchData = async () => {
    const data = await somePromise;
    return data;
};
\`\`\`

## Your Task
Create an async function that awaits a promise and returns double the value.
`,
        htmlContent: `<div class="async-demo">
  <h3>Async/Await</h3>
</div>`,
        starterCode: `// Helper: returns a promise that resolves to 21
const getValue = () => Promise.resolve(21);

// Create async function that returns double the value
async function doubleValue() {
    const value = await getValue();
    return value * 2;
}

// Call the function and get result
const result = await doubleValue();`,
        expectedOutput: '42',
        hints: ['await pauses until Promise resolves', 'Return the doubled value from the function'],
        tags: ['javascript', 'async', 'await', 'beginner'],
    },
    {
        slug: 'async-error-handling',
        title: 'Async Error Handling',
        description: 'Handle errors in async code with try/catch.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'async-await-basics',
        xpReward: 45,
        order: 303,
        instructions: `# Async Error Handling

Always handle errors in async code!

## Try/Catch with Async/Await

\`\`\`javascript
async function fetchData() {
    try {
        const data = await riskyOperation();
        return data;
    } catch (error) {
        console.log('Error:', error.message);
        return null;
    }
}
\`\`\`

## Promise Rejection

\`\`\`javascript
// This promise will reject
const failingPromise = Promise.reject(new Error('Failed!'));

// Handle with catch
failingPromise.catch(err => console.log(err.message));
\`\`\`

## Your Task
Create a function that handles a rejected promise and returns a fallback value.
`,
        htmlContent: `<div class="error-demo">
  <h3>Error Handling</h3>
</div>`,
        starterCode: `// This promise rejects with an error
const riskyOperation = () => Promise.reject(new Error('Network failed'));

// Handle the error and return 'fallback' instead
async function safeOperation() {
    try {
        const data = await riskyOperation();
        return data;
    } catch (error) {
        return 'fallback';
    }
}

const result = await safeOperation();`,
        expectedOutput: 'fallback',
        hints: ['Use try/catch around await', 'Return fallback value in catch block'],
        tags: ['javascript', 'async', 'error-handling', 'beginner'],
    },
    {
        slug: 'async-parallel-execution',
        title: 'Parallel Async Operations',
        description: 'Run multiple async operations in parallel with Promise.all.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'async-await-basics',
        xpReward: 50,
        order: 304,
        instructions: `# Parallel Async Operations

Run multiple operations at once for better performance!

## Promise.all()

Waits for ALL promises to resolve:

\`\`\`javascript
const [a, b, c] = await Promise.all([
    fetchA(),
    fetchB(),
    fetchC()
]);
\`\`\`

## Promise.race()

Returns first promise to settle:

\`\`\`javascript
const fastest = await Promise.race([
    slowOperation(),
    fastOperation()
]);
\`\`\`

## Sequential vs Parallel

\`\`\`javascript
// Sequential (slow) - 3 seconds total
const a = await fetch1();  // 1 sec
const b = await fetch2();  // 1 sec
const c = await fetch3();  // 1 sec

// Parallel (fast) - 1 second total
const [a, b, c] = await Promise.all([
    fetch1(), fetch2(), fetch3()
]);
\`\`\`

## Your Task
Sum the results of three parallel async operations.
`,
        htmlContent: `<div class="parallel-demo">
  <h3>Parallel Execution</h3>
</div>`,
        starterCode: `// Three async operations returning numbers
const getA = () => Promise.resolve(10);
const getB = () => Promise.resolve(20);
const getC = () => Promise.resolve(12);

// Run all in parallel and sum the results
const [a, b, c] = await Promise.all([getA(), getB(), getC()]);
const result = a + b + c;`,
        expectedOutput: '42',
        hints: ['Promise.all takes an array of promises', 'Destructure the results array'],
        tags: ['javascript', 'async', 'parallel', 'promise-all', 'beginner'],
    },
    {
        slug: 'async-testing-patterns',
        title: 'Async Testing Patterns',
        description: 'Apply async/await in common test automation scenarios.',
        type: 'JAVASCRIPT' as const,
        difficulty: 'EASY' as const,
        category: 'async-await-basics',
        xpReward: 55,
        order: 305,
        instructions: `# Async Testing Patterns

Common patterns used in test automation!

## Waiting for Element

\`\`\`javascript
async function waitForElement(selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector);
        if (el) return el;
        await delay(100);
    }
    throw new Error('Element not found');
}
\`\`\`

## Retry Pattern

\`\`\`javascript
async function retry(fn, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === attempts - 1) throw e;
        }
    }
}
\`\`\`

## Your Task
Create a retry function that attempts an operation 3 times before giving up.
Count how many attempts were made.
`,
        htmlContent: `<div class="patterns-demo">
  <h3>Testing Patterns</h3>
</div>`,
        starterCode: `let attempts = 0;

// Simulates a flaky operation (fails first 2 times)
const flakyOperation = () => {
    attempts++;
    if (attempts < 3) {
        return Promise.reject(new Error('Flaky!'));
    }
    return Promise.resolve('success');
};

// Retry logic
async function retry(fn, maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === maxAttempts - 1) throw e;
        }
    }
}

await retry(flakyOperation);
const result = attempts;`,
        expectedOutput: '3',
        hints: ['Loop through attempts', 'Try each attempt, catch errors', 'Return on success, throw on final failure'],
        tags: ['javascript', 'async', 'testing', 'retry', 'beginner'],
    },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================


async function seedBeginnerChallenges() {
    console.log('🌱 Seeding Beginner tier challenges...\n');

    try {
        // Combine all challenges
        const allChallenges = [...jsFundamentalsChallenges, ...domChallenges, ...asyncChallenges];

        console.log('🔍 Checking for existing challenges...');
        const slugs = allChallenges.map(c => c.slug);
        const existing = await db.select({ slug: challenges.slug })
            .from(challenges)
            .where(inArray(challenges.slug, slugs));

        if (existing.length > 0) {
            console.log(`   Found ${existing.length} existing challenges, updating...`);

            for (const slug of existing.map(e => e.slug)) {
                const challenge = await db.select().from(challenges).where(eq(challenges.slug, slug));
                if (challenge[0]) {
                    await db.delete(testCases).where(eq(testCases.challengeId, challenge[0].id));
                }
            }
            await db.delete(challenges).where(inArray(challenges.slug, slugs));
        }

        console.log('\n📘 Creating JavaScript Fundamentals challenges...');
        for (const challenge of jsFundamentalsChallenges) {
            const [inserted] = await db.insert(challenges).values({
                slug: challenge.slug,
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                difficulty: challenge.difficulty,
                category: challenge.category,
                xpReward: challenge.xpReward,
                order: challenge.order,
                instructions: challenge.instructions,
                htmlContent: challenge.htmlContent,
                starterCode: challenge.starterCode,
                hints: challenge.hints,
                tags: challenge.tags,
                isPublished: true,
                completionCount: 0,
            }).returning();

            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: 'Code should produce the expected output',
                input: { code: challenge.starterCode },
                expectedOutput: { value: challenge.expectedOutput },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order - 100}. ${challenge.title} (${challenge.xpReward} XP)`);
        }

        console.log('\n🌐 Creating DOM Understanding challenges...');
        for (const challenge of domChallenges) {
            const [inserted] = await db.insert(challenges).values({
                slug: challenge.slug,
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                difficulty: challenge.difficulty,
                category: challenge.category,
                xpReward: challenge.xpReward,
                order: challenge.order,
                instructions: challenge.instructions,
                htmlContent: challenge.htmlContent,
                starterCode: challenge.starterCode,
                hints: challenge.hints,
                tags: challenge.tags,
                isPublished: true,
                completionCount: 0,
            }).returning();

            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: 'Code should produce the expected output',
                input: { code: challenge.starterCode },
                expectedOutput: { value: challenge.expectedOutput },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order - 200}. ${challenge.title} (${challenge.xpReward} XP)`);
        }

        console.log('\n⏳ Creating Async/Await challenges...');
        for (const challenge of asyncChallenges) {
            const [inserted] = await db.insert(challenges).values({
                slug: challenge.slug,
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                difficulty: challenge.difficulty,
                category: challenge.category,
                xpReward: challenge.xpReward,
                order: challenge.order,
                instructions: challenge.instructions,
                htmlContent: challenge.htmlContent,
                starterCode: challenge.starterCode,
                hints: challenge.hints,
                tags: challenge.tags,
                isPublished: true,
                completionCount: 0,
            }).returning();

            await db.insert(testCases).values({
                challengeId: inserted.id,
                description: 'Code should produce the expected output',
                input: { code: challenge.starterCode },
                expectedOutput: { value: challenge.expectedOutput },
                isHidden: false,
                order: 1,
            });

            console.log(`   ✅ ${challenge.order - 300}. ${challenge.title} (${challenge.xpReward} XP)`);
        }

        const jsXP = jsFundamentalsChallenges.reduce((sum, c) => sum + c.xpReward, 0);
        const domXP = domChallenges.reduce((sum, c) => sum + c.xpReward, 0);
        const asyncXP = asyncChallenges.reduce((sum, c) => sum + c.xpReward, 0);

        console.log('\n' + '='.repeat(50));
        console.log('✨ Beginner tier seeding complete!');
        console.log('='.repeat(50));
        console.log('📊 Summary:');
        console.log(`   • JavaScript Fundamentals: ${jsFundamentalsChallenges.length} challenges (${jsXP} XP)`);
        console.log(`   • DOM Understanding: ${domChallenges.length} challenges (${domXP} XP)`);
        console.log(`   • Async/Await Basics: ${asyncChallenges.length} challenges (${asyncXP} XP)`);
        console.log(`   • Total: ${allChallenges.length} challenges (${jsXP + domXP + asyncXP} XP)`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Run the seed function if executed directly
if (import.meta.main) {
    seedBeginnerChallenges()
        .then(() => {
            console.log('\n🎉 Database seeded successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Failed to seed database:', error);
            process.exit(1);
        });
}
