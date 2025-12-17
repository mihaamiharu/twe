# Async/Await Basics for Testing

Master asynchronous JavaScript for test automation.

## Why Async Matters

Modern web apps are asynchronous. Page loads, API calls, and animations all happen over time. Understanding async JavaScript is essential for:

- Waiting for elements to appear
- Handling API responses
- Implementing retry logic
- Running tests in parallel

---

## Promises: The Foundation

A Promise represents a value that may not be available yet.

```javascript
// Promise states: pending → fulfilled OR rejected
const promise = new Promise((resolve, reject) => {
    if (success) {
        resolve(value);   // Fulfilled
    } else {
        reject(error);    // Rejected
    }
});

// Consuming a promise
promise
    .then(value => console.log(value))
    .catch(error => console.error(error));
```

---

## Async/Await Syntax

Makes async code look synchronous!

```javascript
// Traditional Promise chain
getData()
    .then(data => process(data))
    .then(result => save(result));

// With async/await
async function doWork() {
    const data = await getData();
    const result = await process(data);
    await save(result);
}
```

### Key Rules

- `async` keyword makes a function return a Promise
- `await` pauses until the Promise resolves
- Can only use `await` inside `async` functions

---

## Error Handling

Always handle errors in async code!

```javascript
async function fetchData() {
    try {
        const data = await riskyOperation();
        return data;
    } catch (error) {
        console.log('Error:', error.message);
        return null;  // Fallback value
    }
}
```

---

## Parallel Execution

Run multiple operations at once for better performance.

```javascript
// Sequential (slow) - 3 seconds total
const a = await fetch1();  // 1 sec
const b = await fetch2();  // 1 sec
const c = await fetch3();  // 1 sec

// Parallel (fast) - 1 second total
const [a, b, c] = await Promise.all([
    fetch1(),
    fetch2(),
    fetch3()
]);
```

---

## Testing Patterns

### Retry Pattern

```javascript
async function retry(fn, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === attempts - 1) throw e;
        }
    }
}
```

### Wait for Condition

```javascript
async function waitFor(condition, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await condition()) return true;
        await delay(100);
    }
    return false;
}
```

---

## Quick Reference

| Pattern | Code |
|---------|------|
| Create Promise | `new Promise((resolve, reject) => {})` |
| Async function | `async function name() {}` |
| Wait for Promise | `await promise` |
| Handle error | `try { } catch (e) { }` |
| Parallel | `Promise.all([p1, p2, p3])` |
| Race | `Promise.race([p1, p2])` |

---

## Practice Challenges

1. [Understanding Promises](/challenges/async-understanding-promises)
2. [Async/Await Basics](/challenges/async-await-basics)
3. [Async Error Handling](/challenges/async-error-handling)
4. [Parallel Async Operations](/challenges/async-parallel-execution)
5. [Async Testing Patterns](/challenges/async-testing-patterns)

---

## Next Steps

You've completed the Beginner tier! You now have a solid foundation in:
- JavaScript Fundamentals
- DOM Manipulation
- Async/Await

Ready to move on to **Playwright automation** challenges!
