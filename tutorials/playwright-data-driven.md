# Data-Driven Testing

Multiply your test coverage without duplicating your code.

## The Mental Model: The Cookie Cutter

Think of a standard test as a specific cookie: "Chocolate Chip".
Think of Data-Driven Testing (DDT) as a **Cookie Cutter**.

* **The Dough**: Your Data Source (JSON, CSV, Array).
* **The Cutter**: Your Test Logic.
* **The Result**: 50 distinct cookies (Tests), each with different toppings (Inputs).

You write the logic **once**. You run it **infinite** times.

---

## The Strategy: "Generate, Don't Iterate"

There are two ways to do DDT. One is great. One is terrible.

### ❌ The "Iterate" Anti-Pattern (Bad)

Putting the loop *inside* the test.

```javascript
test('Process all users', async ({ page }) => {
  for (const user of users) {
     // If User #30 fails, the test stops.
     // You never know if User #31-#50 would have passed.
     await process(user);
  }
});
```

### ✅ The "Generate" Pattern (Good)

Putting the loop *outside* the test.

```javascript
for (const user of users) {
  test(`Process user: ${user.name}`, async ({ page }) => {
     // If User #30 fails, it's just one failed test.
     // User #31-#50 still run perfectly.
     await process(user);
  });
}
```

**The Rule**: Always generate separate tests. It gives you better reporting, parallelism, and isolation.

---

## The Real World Case: The RBAC Matrix

**The Scenario**:
You are testing a CMS with 3 roles: `Admin`, `Editor`, `Viewer`.
You need to verify who can see the "Delete" button.

**The Matrix**:

* Admin: ✅ Visible
* Editor: ❌ Hidden
* Viewer: ❌ Hidden

**The Logic**:

```javascript
const testData = [
  { role: 'Admin', shouldSeeDelete: true },
  { role: 'Editor', shouldSeeDelete: false },
  { role: 'Viewer', shouldSeeDelete: false },
];

for (const data of testData) {
  test(`Role ${data.role} delete visibility`, async ({ page }) => {
     await loginAs(page, data.role);
     const deleteBtn = page.getByRole('button', { name: 'Delete' });
     
     if (data.shouldSeeDelete) {
       await expect(deleteBtn).toBeVisible();
     } else {
       await expect(deleteBtn).toBeHidden();
     }
  });
}
```

---

## The Traps

### Trap #1: The Hidden Data

**The crime**: `test('Should work', ...)` inside a loop.
**The result**: You get 50 tests named "Should work". One fails. Which one? You have no idea.
**The Fix**: Always inject data into the test title.
`test(Login with ${email} ...)`

### Trap #2: The Network Dependency

**The crime**: Fetching test data from an API *at the top of your test file*.

```javascript
// ❌ Don't do this
const data = await fetch('https://api.my-app.com/users'); // Top-level await
```

**The problem**: This runs *before* Playwright sharding. It blocks everything. It might fail before tests even start.
**The Fix**: Hardcode critical data (JSON) or use a "Setup" project to fetch data *once* and save it to a local JSON file.

---

## Quick Reference

### JSON Source

```javascript
import users from './data/users.json';

for (const user of users) {
  test(`User ${user.id}`, async ({ page }) => { ... });
}
```

### CSV Source

```javascript
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const records = parse(fs.readFileSync('data.csv'), { columns: true });

for (const record of records) { ... }
```

---

## Ready to Practice?

Fire up the factory:

1. [Parameterized Tests](/challenges/pw-parameterized-tests) - The basics.
2. [JSON Data Loader](/challenges/pw-test-data-json) - Loading complex objects.
3. [Dynamic Generation](/challenges/pw-dynamic-data) - Using Faker to generate unique data.
