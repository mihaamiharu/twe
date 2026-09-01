---
title: 'Use Just Enough JavaScript for QA Automation'
description: 'Shape test data, name small calculations, and review test logic without taking a detour into general application development.'
---

## After this lesson, you can

- make a small test-data change by choosing `const` or `let` based on whether a binding must be reassigned;
- model one test case with an object and similar cases with an array;
- write a small function that gives a QA rule or calculation a clear name;
- use conditions without allowing a test to silently skip its purpose; and
- diagnose common value errors before adding waits or retries.

## Why this matters for QA

Imagine a generated checkout test with the product name, price, and quantity copied into five different lines. A price changes, someone updates only four lines, and the test now calculates one expectation from stale data.

Or the code says, “If the product exists, run the assertion.” When the product disappears because of a defect, the assertion is skipped and the test passes.

You do not need a general JavaScript course to review these problems. You need enough code literacy to answer:

- What data does this scenario use?
- Which values may vary?
- Which calculation or decision is being made?
- Can missing data turn a real defect into a false pass?

## The mental model

Keep three responsibilities separate:

```text
Test data       describes the case
Small function names a calculation or rule
Test flow       arranges, acts, and asserts
```

The JavaScript tools in this lesson support those responsibilities:

| Tool      | QA use                                                     |
| --------- | ---------------------------------------------------------- |
| `const`   | Bind a name that should not be reassigned                  |
| `let`     | Bind a name that genuinely must be reassigned              |
| Object    | Group named facts about one case                           |
| Array     | Hold an ordered collection of similar cases                |
| Function  | Give a repeated calculation or meaningful operation a name |
| Condition | Choose a path only when variability is intentional         |

Read generated code in that order: identify the case, follow how its values are transformed, check any conditional branch, then inspect the browser assertion. A safe change should have one clear purpose and leave the evidence boundary visible.

`const` protects the binding, not every value inside an object or array. This is valid:

```js
const product = { quantity: 1 };
product.quantity = 2;
```

The `product` binding still points to the same object, while its `quantity` property changes from `1` to `2`. Prefer creating stable test data and changing it only when the scenario requires that change.

## Work through a realistic example

The risk is that the cart shows an incorrect subtotal for a known product and quantity.

Start by modelling the case:

```js
const cartCase = {
  productName: 'Mechanical Keyboard',
  unitPrice: 120,
  quantity: 2,
};
```

An object fits because these are named facts about one scenario. Next, give the calculation a name:

```js
function expectedSubtotal(unitPrice, quantity) {
  return unitPrice * quantity;
}

const subtotal = expectedSubtotal(cartCase.unitPrice, cartCase.quantity);
```

The function is small, but it expresses a real testing idea. It takes inputs and returns an output without clicking the page or changing hidden global state.

The test can now connect data to behavior:

For this scenario, assume the cart contract includes a labelled `Quantity` input and an `Update cart` action:

```ts
test('cart shows the expected subtotal', async ({ page }) => {
  await page.goto('/products');

  await page
    .getByRole('button', { name: `Add ${cartCase.productName} to cart` })
    .click();
  await page.getByLabel('Quantity').fill(String(cartCase.quantity));
  await page.getByRole('button', { name: 'Update cart' }).click();

  await expect(page.getByTestId('cart-subtotal')).toHaveText(`$${subtotal}`);
});
```

This browser snippet is illustrative. The attached Core Practice focuses on controlled JavaScript data and does not provide a runnable `/products` application.

The locator and currency format are product contracts that still need verification. JavaScript only helps keep the case and expected calculation readable; it does not prove the product rule by itself.

### Make one safe change

Suppose the requirement changes from two keyboards to three. Change the case data in one place:

```diff
-  quantity: 2,
+  quantity: 3,
```

The existing browser flow now fills `3`, and the derived `subtotal` changes with it. Do not update the expected text separately just to make the test green: run the focused test and confirm that the product displays the new value. One source of scenario data makes the change easier to review and revert.

### Similar cases belong in a collection

If the product intentionally supports several invalid quantities, an array can hold them:

```js
const invalidQuantities = [0, -1, 999];
```

When each value represents an independent scenario, keep each result independently reported:

```ts
for (const quantity of invalidQuantities) {
  test(`rejects quantity ${quantity}`, async ({ page }) => {
    // arrange, act, and assert this one case
  });
}
```

Do not place secret values or sensitive customer data in generated test titles because titles appear in logs and reports.

### Missing and intentionally empty are different

- `undefined` commonly means a value was not provided or a lookup found nothing.
- `null` commonly represents an intentionally empty value.

The exact product meaning still belongs to the team. Do not treat the two as interchangeable just because both are “empty-ish.”

## When to use it—and when not to

Use an object when named fields make one scenario easier to review. Use an array when several values belong to the same kind of collection. Use a function when a clear name makes a rule, calculation, or setup capability easier to understand. A function can earn its place even when it is called once; repetition is not the only reason to create one.

Do not create a helper that only hides one obvious line:

```js
async function clickSave(page) {
  await page.getByRole('button', { name: 'Save' }).click();
}
```

The helper adds another place to navigate without adding domain meaning. Wait until repetition or a clear responsibility exists.

Use a condition only when the variation is part of the requirement. “If a discount exists, verify it; otherwise do nothing” may let a missing required discount pass. Prefer controlling the state or failing with a useful message.

Do not combine many data cases inside one test merely because a loop is available. Independent risks deserve independent results.

## When it fails

Suppose this code throws `Cannot read properties of undefined (reading 'unitPrice')`:

```js
const selected = products.find(
  (product) => product.name === 'Mechanical Keyboard',
);

const subtotal = selected.unitPrice * 2;
```

The error means `find()` found no matching product and returned `undefined`. It does not mean the browser needs more time unless the array itself is loaded asynchronously.

Inspect:

1. What values are actually in `products`?
2. Is the product identity spelled and cased correctly?
3. Was the expected product missing because setup failed?
4. Should the scenario fail clearly when no match exists?

Make the missing assumption explicit:

```js
if (!selected) {
  throw new Error('Expected Mechanical Keyboard in controlled test data');
}

const subtotal = selected.unitPrice * 2;
```

Retries do not repair a wrong lookup. Optional chaining such as `selected?.unitPrice` may only move the `undefined` somewhere else and make diagnosis harder.

When reviewing any JavaScript change around a test, ask:

- Which values are scenario data and which are product assumptions?
- Is `let` used because reassignment is required, or by habit?
- Does a helper name a real QA responsibility or only hide syntax?
- Can an `if` branch skip the assertion and still pass?
- Are several risks being compressed into one loop and one report entry?
- Could a lookup return `undefined`, and is that case handled honestly?
- Are secrets or personal data written to titles, logs, or source code?

Every abstraction should make the test easier to explain, not merely shorter.

## Check your understanding

Review this code:

```js
const products = [{ name: 'Wireless Mouse', unitPrice: 40 }];

const keyboard = products.find(
  (product) => product.name === 'Mechanical Keyboard',
);

if (keyboard) {
  const expected = keyboard.unitPrice * 2;
  console.log(expected);
}
```

Explain:

1. What value will `keyboard` contain?
2. Why is the condition dangerous inside a test that requires the keyboard?
3. How would you make the missing test data fail clearly?
4. Which parts are data, lookup logic, and expected calculation?

## Compare your reasoning

One reasonable answer is:

- `keyboard` will be `undefined` because no array item has that name.
- The condition skips all work when the required product is missing. If the assertion were inside it, the test could pass without checking the risk.
- Throw a specific setup error—or use an assertion appropriate to the project—before accessing `unitPrice`.
- The array contains the data, `find` performs the lookup, and `unitPrice * 2` calculates the expectation.

## Before you continue

You should now be able to shape a small QA case with arrays and objects, name one calculation with a function, and detect logic that could silently avoid an assertion.

Complete the JavaScript Core Practice rather than every syntax drill. The conditional and array-method challenges are optional follow-up when you need more practice with false-pass risks or controlled test data. In the next lesson, you will trace asynchronous operations so those values and browser actions happen in the required order.
