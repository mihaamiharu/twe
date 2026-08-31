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
});
