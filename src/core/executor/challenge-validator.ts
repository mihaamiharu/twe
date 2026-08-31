import type {
  ChallengeValidationDefinition,
  LocatorEvidenceDefinition,
  RequiredEvidenceSequenceStep,
} from '@/lib/content.types';
import type { ExecutionResult } from './executor.types';
import type { RuntimeTraceEvent } from './runtime-trace';

export type ChallengeValidationFailureKind =
  | 'missing-required-evidence'
  | 'forbidden-method'
  | 'structural-locator'
  | 'forced-action'
  | 'direct-dom-access'
  | 'swallowed-error'
  | 'failed-assertion'
  | 'failed-action'
  | 'source-analysis-unavailable';

export interface ChallengeValidationFailure {
  kind: ChallengeValidationFailureKind;
  methods?: string[];
  details?: string[];
}

export interface ChallengeValidationDecision {
  passed: boolean;
  failure?: ChallengeValidationFailure;
}

function hasTruthyForce(value: unknown): boolean {
  return Boolean(value);
}

function locatorEvidenceMatches(
  actual: LocatorEvidenceDefinition | undefined,
  expected: LocatorEvidenceDefinition | undefined,
): boolean {
  if (expected === undefined) return true;
  if (actual === undefined || actual.method !== expected.method) return false;
  if (expected.value !== undefined && actual.value !== expected.value) return false;
  return expected.name === undefined || actual.name === expected.name;
}

function evidenceEventMatches(
  event: RuntimeTraceEvent,
  expected: RequiredEvidenceSequenceStep,
): boolean {
  if (expected.type === 'assertion') {
    return (
      event.type === 'assertion' &&
      event.assertion.passed &&
      event.assertion.matcher === expected.matcher &&
      locatorEvidenceMatches(event.assertion.locator, expected.locator)
    );
  }

  if (event.type !== 'method') return false;
  const call = event.call;
  return (
    call.succeeded &&
    call.method === expected.method &&
    (expected.target === undefined || call.target === expected.target) &&
    (expected.arguments === undefined ||
      JSON.stringify(call.arguments) === JSON.stringify(expected.arguments)) &&
    locatorEvidenceMatches(call.locator, expected.locator)
  );
}

function evidenceStepLabel(step: RequiredEvidenceSequenceStep): string {
  return step.type === 'assertion' ? step.matcher : step.method;
}

function findMissingEvidenceSequenceSteps(
  events: RuntimeTraceEvent[] | undefined,
  expected: RequiredEvidenceSequenceStep[] | undefined,
): string[] {
  if (!expected || expected.length === 0) return [];

  let eventIndex = 0;
  for (let stepIndex = 0; stepIndex < expected.length; stepIndex += 1) {
    const step = expected[stepIndex];
    if (!step) continue;

    let matched = false;
    while (eventIndex < (events?.length ?? 0)) {
      const event = events?.[eventIndex];
      eventIndex += 1;
      if (event && evidenceEventMatches(event, step)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return expected.slice(stepIndex).map(evidenceStepLabel);
    }
  }

  return [];
}

/**
 * Pure grading decision for source-policy and runtime-evidence findings.
 * Execution, localization, and React state orchestration live elsewhere.
 */
export function validateChallengeExecution(
  execution: ExecutionResult,
  validation: ChallengeValidationDefinition | undefined,
): ChallengeValidationDecision {
  if (!validation) return { passed: execution.status === 'PASSED' };

  const source = execution.sourceAnalysis;
  const trace = execution.runtimeTrace;
  const sourceMethods = new Set(source?.calledMethods ?? []);
  const runtimeMethods = new Set(
    trace?.methodCalls.map((call) => call.method) ?? [],
  );
  const observedMethods = validation.policy?.requireExecutedEvidence
    ? runtimeMethods
    : sourceMethods;
  const observedAssertions = new Set(
    validation.policy?.requireExecutedEvidence
      ? trace?.assertions.map((assertion) => assertion.matcher) ?? []
      : source?.calledMethods.filter((method) => method.startsWith('to')) ?? [],
  );

  if (
    validation.policy?.requireExecutedEvidence &&
    source?.parserError !== undefined
  ) {
    return {
      passed: false,
      failure: {
        kind: 'source-analysis-unavailable',
        details: [source.parserError],
      },
    };
  }

  const enforceRuntimeFailures =
    validation.policy?.requireExecutedEvidence === true ||
    validation.policy?.forbidSwallowedErrors === true;
  if (enforceRuntimeFailures) {
    const failedAssertion = trace?.assertions.find(
      (assertion) => !assertion.passed,
    );
    if (failedAssertion) {
      const details = failedAssertion.error
        ? [failedAssertion.error]
        : undefined;
      return {
        passed: false,
        failure: {
          kind: 'failed-assertion',
          methods: [failedAssertion.matcher],
          ...(details === undefined ? {} : { details }),
        },
      };
    }

    const failedAction =
      trace?.methodCalls.find(
        (call) => !call.succeeded && call.target !== 'page',
      ) ?? trace?.methodCalls.find((call) => !call.succeeded);
    if (failedAction) {
      const details = failedAction.error ? [failedAction.error] : undefined;
      return {
        passed: false,
        failure: {
          kind: 'failed-action',
          methods: [failedAction.method],
          ...(details === undefined ? {} : { details }),
        },
      };
    }
  }

  const forbiddenMethods = (validation.forbiddenMethods ?? []).filter(
    (method) => source?.forbiddenMethods.includes(method) || runtimeMethods.has(method),
  );
  if (forbiddenMethods.length > 0) {
    return {
      passed: false,
      failure: { kind: 'forbidden-method', methods: forbiddenMethods },
    };
  }

  const policy = validation.policy;
  if (
    policy?.forbidStructuralLocators &&
    ((source?.structuralLocatorCalls ?? 0) > 0 || runtimeMethods.has('locator'))
  ) {
    return {
      passed: false,
      failure: { kind: 'structural-locator' },
    };
  }

  if (
    policy?.forbidForcedActions &&
    (source?.forcedActions.some((action) => hasTruthyForce(action.value)) ||
      trace?.methodCalls.some((call) => hasTruthyForce(call.actionOptions?.force)))
  ) {
    return {
      passed: false,
      failure: { kind: 'forced-action' },
    };
  }

  if (policy?.forbidDirectDomAccess && (source?.directDomAccesses.length ?? 0) > 0) {
    return {
      passed: false,
      failure: {
        kind: 'direct-dom-access',
        ...(source === undefined
          ? {}
          : { methods: source.directDomAccesses }),
      },
    };
  }

  if (policy?.forbidSwallowedErrors && (source?.swallowedErrorCount ?? 0) > 0) {
    return {
      passed: false,
      failure: { kind: 'swallowed-error' },
    };
  }

  // Preserve the executor's concrete syntax/action/DOM failure once policy
  // findings have had a chance to provide a more actionable capstone message.
  // Missing required evidence is only meaningful for an otherwise successful
  // execution and must not hide the original execution error.
  if (execution.status !== 'PASSED') return { passed: false };

  const missingAssertions = (validation.requiredAssertions ?? []).filter(
    (assertion) => !observedAssertions.has(assertion),
  );
  const missingMethods = (validation.requiredMethods ?? []).filter(
    (method) => !observedMethods.has(method),
  );
  const missingSequenceSteps = findMissingEvidenceSequenceSteps(
    trace?.events,
    validation.requiredEvidenceSequence,
  );
  if (
    missingAssertions.length > 0 ||
    missingMethods.length > 0 ||
    missingSequenceSteps.length > 0
  ) {
    return {
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: [
          ...new Set([
            ...missingAssertions,
            ...missingMethods,
            ...missingSequenceSteps,
          ]),
        ],
      },
    };
  }

  return { passed: execution.status === 'PASSED' };
}
