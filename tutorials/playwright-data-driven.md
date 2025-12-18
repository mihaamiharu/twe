# Data-Driven Testing

Run tests with external data for comprehensive coverage.

---

## Parameterized Tests

```javascript
const testCases = [
    { a: 2, b: 3, expected: 5 },
    { a: 10, b: 5, expected: 15 },
];

for (const { a, b, expected } of testCases) {
    await page.fill('#num1', String(a));
    await page.fill('#num2', String(b));
    await page.click('#add');
    // Verify result === expected
}
```

---

## JSON Data

```javascript
// users.json
[
    { "name": "Alice", "email": "alice@test.com" },
    { "name": "Bob", "email": "bob@test.com" }
]

// In test
const users = require('./users.json');
for (const user of users) {
    await testWithUser(user);
}
```

---

## CSV Data

```javascript
const csv = `name,role
Alice,Admin
Bob,Editor`;

const rows = csv.split('\n').slice(1);
const data = rows.map(row => {
    const [name, role] = row.split(',');
    return { name, role };
});
```

---

## Dynamic Data (Faker)

```javascript
import { faker } from '@faker-js/faker';

const user = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
};
```

---

## Environment Config

```javascript
const config = {
    dev: { url: 'localhost', user: 'dev@test.com' },
    staging: { url: 'staging.app.com', user: 'qa@test.com' },
    prod: { url: 'app.com', user: 'prod@test.com' }
};

const env = process.env.TEST_ENV || 'dev';
const { url, user } = config[env];
```

---

## Practice Challenges

1. [Parameterized Tests](/challenges/pw-parameterized-tests)
2. [Test Data from JSON](/challenges/pw-test-data-json)
3. [CSV Test Data](/challenges/pw-csv-test-data)
4. [Dynamic Data Generation](/challenges/pw-dynamic-data)
5. [Environment-Based Data](/challenges/pw-environment-data)
