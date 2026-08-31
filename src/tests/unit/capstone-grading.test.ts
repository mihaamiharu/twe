import { describe, expect, it } from 'bun:test';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import type {
  ChallengeValidationDefinition,
  ExpectedStateRule,
} from '@/lib/content.types';

const files = {
  '/index.html': '<a href="/app/checkout.html">Checkout</a>',
  '/app/checkout.html':
    "<main><h1>Checkout</h1><form id='checkout-form'><label for='quantity'>Quantity</label><input id='quantity' name='quantity' type='number' value='1'><button type='submit'>Place order</button></form><p role='alert' hidden></p><section id='confirmation' role='status' hidden></section></main><script>document.getElementById('checkout-form').addEventListener('submit',(event)=>{event.preventDefault();const quantity=Number(document.getElementById('quantity').value);const alert=document.querySelector('[role=alert]');const confirmation=document.getElementById('confirmation');if(quantity<1){alert.hidden=false;alert.style.display='';alert.textContent='Quantity must be at least 1';confirmation.hidden=true;return;}alert.hidden=true;alert.style.display='none';confirmation.hidden=false;confirmation.textContent='Order confirmed: '+quantity+' items';});</script>",
};

const expectedState: ExpectedStateRule[] = [
  {
    selector: '#confirmation',
    visible: true,
    containsText: '2 items',
  },
  { selector: '[role=alert]', hidden: true },
];

const interactionSequence: NonNullable<
  ChallengeValidationDefinition['interactionSequence']
> = {
  event: 'submit',
  selector: '#checkout-form',
  steps: [
    {
      inputSelector: '#quantity',
      inputValue: '0',
      expectedState: [
        {
          selector: '[role=alert]',
          visible: true,
          containsText: 'Quantity must be at least 1',
        },
        { selector: '#confirmation', hidden: true },
      ],
    },
    {
      inputSelector: '#quantity',
      inputValue: '2',
      expectedState: [
        { selector: '[role=alert]', hidden: true },
        {
          selector: '#confirmation',
          visible: true,
          containsText: '2 items',
        },
      ],
    },
  ],
};

const capstoneValidation: ChallengeValidationDefinition = {
  requiredAssertions: ['toHaveText', 'toBeHidden', 'toBeVisible', 'toContainText'],
  requiredMethods: ['getByLabel', 'getByRole', 'fill', 'click'],
  forbiddenMethods: ['waitForTimeout', 'textContent', 'toBeTruthy', 'evaluate'],
  policy: {
    requireExecutedEvidence: true,
    forbidStructuralLocators: true,
    forbidForcedActions: true,
    forbidDirectDomAccess: true,
    forbidSwallowedErrors: true,
  },
  interactionSequence,
};

async function runCode(
  code: string,
  options: {
    includeExpectedState?: boolean;
    includeInteractionSequence?: boolean;
    validation?: ChallengeValidationDefinition;
  } = {},
) {
  const validation = options.validation ?? capstoneValidation;
  const result = await executePlaywrightCode(code, files['/index.html'], {
    timeout: 4_000,
    files,
    strictMode: true,
    validation,
    ...(options.includeExpectedState === true ? { expectedState } : {}),
    ...(options.includeInteractionSequence === true
      ? { interactionSequence }
      : {}),
  });

  return { result, decision: validateChallengeExecution(result, validation) };
}

describe('checkout capstone grading', () => {
  it('passes the canonical solution with ordered submits and final DOM proof', async () => {
    const { result, decision } = await runCode(
      `
        await page.goto('/app/checkout.html');
        const quantity = page.getByLabel('Quantity');
        const placeOrder = page.getByRole('button', { name: 'Place order' });
        const alert = page.getByRole('alert');

        await quantity.fill('0');
        await placeOrder.click();
        await expect(alert).toHaveText('Quantity must be at least 1');

        await quantity.fill('2');
        await placeOrder.click();
        await expect(alert).toBeHidden();

        const confirmation = page.getByRole('status');
        await expect(confirmation).toBeVisible();
        await expect(confirmation).toContainText('2 items');
      `,
      { includeExpectedState: true, includeInteractionSequence: true },
    );

    expect(result.status).toBe('PASSED');
    expect(decision).toEqual({ passed: true });
  });

  it('rejects actual structural locator use even when semantic locators also run', async () => {
    const { result, decision } = await runCode(`
      await page.goto('/app/checkout.html');
      await page.getByRole('button', { name: 'Place order' }).click();
      await page.locator('main > form > button').click();
    `);

    expect(result.status).toBe('PASSED');
    expect(result.sourceAnalysis?.structuralLocatorCalls).toBeGreaterThan(0);
    expect(result.runtimeTrace?.methodCalls.map((call) => call.method)).toContain(
      'locator',
    );
    expect(decision).toEqual({
      passed: false,
      failure: { kind: 'structural-locator' },
    });
  });

  it('rejects an ignored Playwright action catch at executor-plus-validator level', async () => {
    const { result, decision } = await runCode(`
      await page.goto('/app/checkout.html');
      await page.getByRole('button', { name: 'Missing' }).click().catch(() => console.log('ignore'));
    `);

    expect(result.status).toBe('PASSED');
    expect(result.sourceAnalysis?.swallowedErrorCount).toBeGreaterThan(0);
    expect(result.runtimeTrace?.methodCalls.some((call) => !call.succeeded)).toBe(true);
    expect(decision.passed).toBe(false);
  });

  it('rejects conditional and nested fake throws in an ordinary catch', async () => {
    const { result, decision } = await runCode(`
      await page.goto('/app/checkout.html');
      try {
        await page.getByRole('button', { name: 'Place order' }).click();
      } catch (error) {
        if (false) throw error;
        function unusedPropagation() { throw error; }
      }
    `);

    expect(result.status).toBe('PASSED');
    expect(result.sourceAnalysis?.swallowedErrorCount).toBe(1);
    expect(decision).toEqual({
      passed: false,
      failure: { kind: 'swallowed-error' },
    });
  });

  it('rejects computed locator and evaluate aliases even in dead code', async () => {
    const { result, decision } = await runCode(`
      await page.goto('/app/checkout.html');
      const locatorMethod = 'locator';
      if (false) page[locatorMethod]('main > button');
      const evaluateMethod = 'evaluate';
      if (false) page[evaluateMethod](() => true);
    `);

    expect(result.status).toBe('PASSED');
    expect(result.sourceAnalysis?.structuralLocatorCalls).toBe(1);
    expect(result.sourceAnalysis?.forbiddenMethods).toContain('evaluate');
    expect(decision).toEqual({
      passed: false,
      failure: { kind: 'forbidden-method', methods: ['evaluate'] },
    });
  });

  it('does not accept required calls that only occur in dead code', async () => {
    const validation: ChallengeValidationDefinition = {
      requiredMethods: ['getByRole'],
      requiredAssertions: ['toBeVisible'],
      policy: { requireExecutedEvidence: true },
    };
    const { result, decision } = await runCode(
      `
        await page.goto('/app/checkout.html');
        if (false) {
          await page.getByRole('status').click();
          await expect(page.getByRole('status')).toBeVisible();
        }
      `,
      { validation },
    );

    expect(result.status).toBe('PASSED');
    const calledMethods = result.sourceAnalysis?.calledMethods ?? [];
    expect(calledMethods).toContain('getByRole');
    expect(calledMethods).toContain('click');
    expect(calledMethods).toContain('toBeVisible');
    expect(result.runtimeTrace?.methodCalls.map((call) => call.method)).toEqual([
      'goto',
    ]);
    expect(decision).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['toBeVisible', 'getByRole'],
      },
    });
  });

  it('rejects truthy force variants but permits force: false', async () => {
    const forceValidation: ChallengeValidationDefinition = {
      requiredMethods: ['getByRole', 'click'],
      policy: { requireExecutedEvidence: true, forbidForcedActions: true },
    };
    const literal = await runCode(
      `
        await page.goto('/app/checkout.html');
        await page.getByRole('button', { name: 'Place order' }).click({ force: true });
      `,
      { validation: forceValidation },
    );
    const shorthand = await runCode(
      `
        await page.goto('/app/checkout.html');
        const force = true;
        const options = { force };
        await page.getByRole('button', { name: 'Place order' }).click(options);
      `,
      { validation: forceValidation },
    );
    const allowed = await runCode(
      `
        await page.goto('/app/checkout.html');
        const force = false;
        await page.getByRole('button', { name: 'Place order' }).click({ force });
      `,
      { validation: forceValidation },
    );

    expect(literal.result.status).toBe('PASSED');
    expect(literal.decision.failure).toEqual({ kind: 'forced-action' });
    expect(shorthand.decision.failure).toEqual({ kind: 'forced-action' });
    expect(allowed.result.status).toBe('PASSED');
    expect(allowed.decision).toEqual({ passed: true });
  });

  it('continues rejecting wrong submit order through interaction validation', async () => {
    const { result, decision } = await runCode(
      `
        await page.goto('/app/checkout.html');
        const quantity = page.getByLabel('Quantity');
        const placeOrder = page.getByRole('button', { name: 'Place order' });
        await quantity.fill('2');
        await placeOrder.click();
        await quantity.fill('0');
        await placeOrder.click();
      `,
      { includeInteractionSequence: true },
    );

    expect(result.status).toBe('FAILED');
    expect(result.output).toContain('Interaction Sequence Validation Failed');
    expect(decision.passed).toBe(false);
  });

  it('continues rejecting a submit with the wrong input and resulting state', async () => {
    const { result, decision } = await runCode(
      `
        await page.goto('/app/checkout.html');
        await page.getByRole('button', { name: 'Place order' }).click();
      `,
      { includeInteractionSequence: true },
    );

    expect(result.status).toBe('FAILED');
    expect(result.output).toContain('Interaction Sequence Validation Failed');
    expect(decision.passed).toBe(false);
  });
});
