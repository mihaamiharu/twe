import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import type { ExecutionResult } from '@/core/executor/executor.types';

const passedExecution = (
  overrides: Partial<ExecutionResult> = {},
): ExecutionResult => ({
  status: 'PASSED',
  output: 'ok',
  executionTime: 1,
  ...overrides,
});

describe('challenge execution validator', () => {
  it('requires executed evidence only when the policy opts in', () => {
    const validation = {
      requiredMethods: ['getByRole'],
      requiredAssertions: ['toHaveText'],
      policy: { requireExecutedEvidence: true },
    };

    const decision = validateChallengeExecution(
      passedExecution({
        sourceAnalysis: {
          calledMethods: ['getByRole', 'toHaveText'],
          forbiddenMethods: [],
          structuralLocatorCalls: 0,
          forcedActions: [],
          directDomAccesses: [],
          swallowedErrorCount: 0,
          strictViolations: [],
        },
        runtimeTrace: { methodCalls: [], assertions: [] },
      }),
      validation,
    );

    expect(decision.passed).toBe(false);
    expect(decision.failure).toEqual({
      kind: 'missing-required-evidence',
      methods: ['toHaveText', 'getByRole'],
    });
  });

  it('rejects structural locators and runtime force values', () => {
    const validation = {
      policy: {
        forbidStructuralLocators: true,
        forbidForcedActions: true,
      },
    };
    const base = {
      sourceAnalysis: {
        calledMethods: [],
        forbiddenMethods: [],
        structuralLocatorCalls: 1,
        forcedActions: [],
        directDomAccesses: [],
        swallowedErrorCount: 0,
        strictViolations: [],
      },
      runtimeTrace: {
        methodCalls: [
          {
            target: 'locator' as const,
            method: 'click',
            actionOptions: { force: true },
            succeeded: true,
          },
        ],
        assertions: [],
      },
    };

    expect(validateChallengeExecution(passedExecution(base), validation).failure).toEqual({
      kind: 'structural-locator',
    });

    expect(
      validateChallengeExecution(
        passedExecution({
          sourceAnalysis: {
            ...base.sourceAnalysis,
            structuralLocatorCalls: 0,
          },
          runtimeTrace: base.runtimeTrace,
        }),
        validation,
      ).failure,
    ).toEqual({ kind: 'forced-action' });
  });

  it('rejects failures that were caught and suppressed', () => {
    const decision = validateChallengeExecution(
      passedExecution({
        runtimeTrace: {
          methodCalls: [
            {
              target: 'locator',
              method: 'click',
              succeeded: false,
              error: 'Element not found',
            },
          ],
          assertions: [
            { matcher: 'toHaveText', passed: false, error: 'Assertion Error' },
          ],
        },
      }),
      {
        policy: {
          requireExecutedEvidence: true,
          forbidSwallowedErrors: true,
        },
      },
    );

    expect(decision.failure).toEqual({
      kind: 'failed-assertion',
      methods: ['toHaveText'],
      details: ['Assertion Error'],
    });
  });

  it('only rejects failed runtime evidence for the explicit strict policy', () => {
    const execution = passedExecution({
      sourceAnalysis: {
        calledMethods: ['click'],
        forbiddenMethods: [],
        structuralLocatorCalls: 0,
        forcedActions: [],
        directDomAccesses: [],
        swallowedErrorCount: 0,
        strictViolations: [],
      },
      runtimeTrace: {
        methodCalls: [
          {
            target: 'locator',
            method: 'click',
            succeeded: false,
            error: 'Element not found',
          },
        ],
        assertions: [],
      },
    });

    expect(
      validateChallengeExecution(execution, {
        requiredMethods: ['click'],
        policy: {},
      }),
    ).toEqual({ passed: true });
    expect(
      validateChallengeExecution(execution, {
        requiredMethods: ['click'],
        policy: { forbidSwallowedErrors: true },
      }),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'failed-action',
        methods: ['click'],
        details: ['Element not found'],
      },
    });
  });

  it('requires configured runtime evidence to occur in order', () => {
    const gotoCall = {
      target: 'page' as const,
      method: 'goto',
      arguments: ['/app/products.html'],
      succeeded: true,
    };
    const clickCall = {
      target: 'locator' as const,
      method: 'click',
      locator: { method: 'getByRole', value: 'link', name: 'Cart' },
      succeeded: true,
    };
    const assertion = {
      matcher: 'toBeVisible',
      arguments: ['Your cart'],
      locator: {
        method: 'getByRole',
        value: 'heading',
        name: 'Your cart',
      },
      passed: true,
    };
    const validation = {
      requiredEvidenceSequence: [
        {
          type: 'method' as const,
          method: 'goto',
          target: 'page' as const,
          arguments: ['/app/products.html'],
        },
        {
          type: 'method' as const,
          method: 'click',
          target: 'locator' as const,
          locator: { method: 'getByRole', value: 'link', name: 'Cart' },
        },
        {
          type: 'assertion' as const,
          matcher: 'toBeVisible',
          arguments: ['Your cart'],
          locator: {
            method: 'getByRole',
            value: 'heading',
            name: 'Your cart',
          },
        },
      ],
    };

    const inOrder = passedExecution({
      runtimeTrace: {
        methodCalls: [gotoCall, clickCall],
        assertions: [assertion],
        events: [
          { type: 'method', call: gotoCall },
          { type: 'method', call: clickCall },
          { type: 'assertion', assertion },
        ],
      },
    });
    const assertionBeforeClick = passedExecution({
      runtimeTrace: {
        methodCalls: [gotoCall, clickCall],
        assertions: [assertion],
        events: [
          { type: 'method', call: gotoCall },
          { type: 'assertion', assertion },
          { type: 'method', call: clickCall },
        ],
      },
    });
    const wrongAssertionArgument = passedExecution({
      runtimeTrace: {
        methodCalls: [gotoCall, clickCall],
        assertions: [{ ...assertion, arguments: ['Cart'] }],
        events: [
          { type: 'method', call: gotoCall },
          { type: 'method', call: clickCall },
          {
            type: 'assertion',
            assertion: { ...assertion, arguments: ['Cart'] },
          },
        ],
      },
    });

    expect(validateChallengeExecution(inOrder, validation)).toEqual({
      passed: true,
    });
    expect(
      validateChallengeExecution(assertionBeforeClick, validation),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['toBeVisible'],
      },
    });
    expect(
      validateChallengeExecution(wrongAssertionArgument, validation),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['toBeVisible'],
      },
    });
  });

  it('distinguishes exact text locator evidence', () => {
    const assertion = {
      matcher: 'toBeVisible',
      locator: { method: 'getByText', value: 'Order complete' },
      passed: true,
    };
    const execution = passedExecution({
      runtimeTrace: {
        methodCalls: [],
        assertions: [assertion],
        events: [{ type: 'assertion', assertion }],
      },
    });

    expect(
      validateChallengeExecution(execution, {
        requiredEvidenceSequence: [
          {
            type: 'assertion',
            matcher: 'toBeVisible',
            locator: {
              method: 'getByText',
              value: 'Order complete',
              exact: true,
            },
          },
        ],
      }),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['toBeVisible'],
      },
    });
  });

  it('requires configured JavaScript source evidence', () => {
    const validation = {
      requiredFunctionCalls: ['classifyRun'],
      requiredMemberCalls: ['map', 'join'],
      requiredConstBindings: ['testRuns', 'statuses', 'result'],
      minimumConditionalBranches: 3,
    };
    const sourceAnalysis = {
      calledMethods: [],
      calledFunctions: ['classifyRun'],
      memberCalls: ['map', 'join'],
      constBindings: ['testRuns', 'statuses', 'result'],
      conditionalBranchCount: 3,
      forbiddenMethods: [],
      structuralLocatorCalls: 0,
      forcedActions: [],
      directDomAccesses: [],
      swallowedErrorCount: 0,
      strictViolations: [],
    };

    expect(
      validateChallengeExecution(
        passedExecution({ sourceAnalysis }),
        validation,
      ),
    ).toEqual({ passed: true });
    expect(
      validateChallengeExecution(
        passedExecution({
          sourceAnalysis: {
            ...sourceAnalysis,
            calledFunctions: [],
            memberCalls: [],
            constBindings: ['result'],
            conditionalBranchCount: 1,
          },
        }),
        validation,
      ),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: [
          'classifyRun()',
          '.map()',
          '.join()',
          'const testRuns',
          'const statuses',
          'if/else (3 branches)',
        ],
      },
    });
  });

  it('requires configured asynchronous source evidence', () => {
    const validation = {
      requiredAsyncFunctions: ['prepareFixture'],
      requiredAwaitedFunctionCalls: ['loadFixture', 'prepareFixture'],
      requiredAwaitedMemberCalls: ['Promise.all'],
      requiredPromiseAllFunctionCalls: ['prepareFixture', 'loadAccount'],
      minimumTryCatchBlocks: 1,
    };
    const sourceAnalysis = {
      calledMethods: [],
      asyncFunctions: ['prepareFixture'],
      awaitedFunctionCalls: ['loadFixture', 'prepareFixture'],
      awaitedMemberCalls: ['Promise.all'],
      awaitedPromiseAllFunctionCalls: ['prepareFixture', 'loadAccount'],
      tryCatchCount: 1,
      forbiddenMethods: [],
      structuralLocatorCalls: 0,
      forcedActions: [],
      directDomAccesses: [],
      swallowedErrorCount: 1,
      strictViolations: [],
    };

    expect(
      validateChallengeExecution(
        passedExecution({ sourceAnalysis }),
        validation,
      ),
    ).toEqual({ passed: true });
    expect(
      validateChallengeExecution(
        passedExecution({
          sourceAnalysis: {
            ...sourceAnalysis,
            asyncFunctions: [],
            awaitedFunctionCalls: [],
            awaitedMemberCalls: [],
            awaitedPromiseAllFunctionCalls: [],
            tryCatchCount: 0,
          },
        }),
        validation,
      ),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: [
          'async function prepareFixture',
          'await loadFixture()',
          'await prepareFixture()',
          'await Promise.all()',
          'prepareFixture() inside awaited Promise.all()',
          'loadAccount() inside awaited Promise.all()',
          'try/catch (1)',
        ],
      },
    });
  });

  it('requires configured TypeScript source structure', () => {
    const validation = {
      requiredTypeScriptEvidence: [
        { type: 'inferred-variable' as const, name: 'testId' },
        {
          type: 'interface-property' as const,
          interface: 'AppConfig',
          property: 'retryLimit',
          annotation: 'number',
          optional: true,
        },
        {
          type: 'function-parameter' as const,
          function: 'createUser',
          parameter: 'role',
          annotation: '"admin" | "guest"',
          optional: true,
        },
        {
          type: 'operator' as const,
          operator: 'nullish-coalescing' as const,
        },
      ],
    };
    const sourceAnalysis = {
      calledMethods: [],
      typeScriptEvidence: [
        'inferred-variable:testId',
        'interface-property:AppConfig:retryLimit?:number',
        'function-parameter:createUser:role?:"admin"|"guest"',
        'operator:nullish-coalescing',
      ],
      forbiddenMethods: [],
      structuralLocatorCalls: 0,
      forcedActions: [],
      directDomAccesses: [],
      swallowedErrorCount: 0,
      strictViolations: [],
    };

    expect(
      validateChallengeExecution(
        passedExecution({ sourceAnalysis }),
        validation,
      ),
    ).toEqual({ passed: true });
    expect(
      validateChallengeExecution(
        passedExecution({
          sourceAnalysis: {
            ...sourceAnalysis,
            typeScriptEvidence: [],
          },
        }),
        validation,
      ),
    ).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: [
          'testId inferred',
          'AppConfig.retryLimit?: number',
          'createUser(role?: "admin" | "guest")',
          'nullish coalescing (??)',
        ],
      },
    });
  });
});
