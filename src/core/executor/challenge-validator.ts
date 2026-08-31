import type {
  ChallengeValidationDefinition,
  LocatorFilterEvidenceDefinition,
  LocatorEvidenceDefinition,
  LocatorTargetEvidenceDefinition,
  RequiredEvidenceSequenceStep,
  TypeScriptEvidenceDefinition,
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

function locatorFilterEvidenceMatches(
  actual: LocatorFilterEvidenceDefinition,
  expected: LocatorFilterEvidenceDefinition,
): boolean {
  if (expected.hasText !== undefined && actual.hasText !== expected.hasText) {
    return false;
  }
  return locatorTargetEvidenceMatches(actual.has, expected.has);
}

function locatorTargetEvidenceMatches(
  actual: LocatorTargetEvidenceDefinition | undefined,
  expected: LocatorTargetEvidenceDefinition | undefined,
): boolean {
  if (expected === undefined) return true;
  if (actual === undefined || actual.method !== expected.method) return false;
  if (expected.value !== undefined && actual.value !== expected.value) return false;
  if (expected.name !== undefined && actual.name !== expected.name) return false;
  if (expected.exact !== undefined && actual.exact !== expected.exact) {
    return false;
  }
  if (expected.filters === undefined) return true;
  if (actual.filters?.length !== expected.filters.length) return false;
  return expected.filters.every((filter, index) => {
    const actualFilter = actual.filters?.[index];
    return (
      actualFilter !== undefined &&
      locatorFilterEvidenceMatches(actualFilter, filter)
    );
  });
}

function locatorEvidenceMatches(
  actual: LocatorEvidenceDefinition | undefined,
  expected: LocatorEvidenceDefinition | undefined,
): boolean {
  if (!locatorTargetEvidenceMatches(actual, expected)) return false;
  if (expected?.scope === undefined) return true;
  return locatorTargetEvidenceMatches(actual?.scope, expected.scope);
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
      (expected.arguments === undefined ||
        JSON.stringify(event.assertion.arguments) ===
          JSON.stringify(expected.arguments)) &&
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

function normalizeTypeAnnotation(annotation: string): string {
  return annotation.replace(/\s+/g, '').replaceAll("'", '"');
}

function typeScriptEvidenceKey(
  evidence: TypeScriptEvidenceDefinition,
): string {
  switch (evidence.type) {
    case 'inferred-variable':
      return `inferred-variable:${evidence.name}`;
    case 'variable-type':
      return `variable-type:${evidence.name}:${normalizeTypeAnnotation(evidence.annotation)}`;
    case 'interface-property':
      return `interface-property:${evidence.interface}:${evidence.property}${evidence.optional ? '?' : ''}:${normalizeTypeAnnotation(evidence.annotation)}`;
    case 'function-parameter':
      return `function-parameter:${evidence.function}:${evidence.parameter}${evidence.optional ? '?' : ''}:${normalizeTypeAnnotation(evidence.annotation)}`;
    case 'function-return':
      return `function-return:${evidence.function}:${normalizeTypeAnnotation(evidence.annotation)}`;
    case 'operator':
      return `operator:${evidence.operator}`;
  }
}

function typeScriptEvidenceLabel(
  evidence: TypeScriptEvidenceDefinition,
): string {
  switch (evidence.type) {
    case 'inferred-variable':
      return `${evidence.name} inferred`;
    case 'variable-type':
      return `${evidence.name}: ${evidence.annotation}`;
    case 'interface-property':
      return `${evidence.interface}.${evidence.property}${evidence.optional ? '?' : ''}: ${evidence.annotation}`;
    case 'function-parameter':
      return `${evidence.function}(${evidence.parameter}${evidence.optional ? '?' : ''}: ${evidence.annotation})`;
    case 'function-return':
      return `${evidence.function}(): ${evidence.annotation}`;
    case 'operator':
      return evidence.operator === 'nullish-coalescing'
        ? 'nullish coalescing (??)'
        : 'strict undefined check (!== undefined)';
  }
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
  const calledFunctions = new Set(source?.calledFunctions ?? []);
  const memberCalls = new Set(source?.memberCalls ?? []);
  const asyncFunctions = new Set(source?.asyncFunctions ?? []);
  const awaitedFunctionCalls = new Set(source?.awaitedFunctionCalls ?? []);
  const awaitedMemberCalls = new Set(source?.awaitedMemberCalls ?? []);
  const awaitedPromiseAllFunctionCalls = new Set(
    source?.awaitedPromiseAllFunctionCalls ?? [],
  );
  const constBindings = new Set(source?.constBindings ?? []);
  const typeScriptEvidence = new Set(source?.typeScriptEvidence ?? []);
  const missingFunctionCalls = (validation.requiredFunctionCalls ?? [])
    .filter((name) => !calledFunctions.has(name))
    .map((name) => `${name}()`);
  const missingMemberCalls = (validation.requiredMemberCalls ?? [])
    .filter((name) => !memberCalls.has(name))
    .map((name) => `.${name}()`);
  const missingAsyncFunctions = (validation.requiredAsyncFunctions ?? [])
    .filter((name) => !asyncFunctions.has(name))
    .map((name) => `async function ${name}`);
  const missingAwaitedFunctionCalls = (
    validation.requiredAwaitedFunctionCalls ?? []
  )
    .filter((name) => !awaitedFunctionCalls.has(name))
    .map((name) => `await ${name}()`);
  const missingAwaitedMemberCalls = (
    validation.requiredAwaitedMemberCalls ?? []
  )
    .filter((name) => !awaitedMemberCalls.has(name))
    .map((name) => `await ${name}()`);
  const missingPromiseAllFunctionCalls = (
    validation.requiredPromiseAllFunctionCalls ?? []
  )
    .filter((name) => !awaitedPromiseAllFunctionCalls.has(name))
    .map((name) => `${name}() inside awaited Promise.all()`);
  const missingConstBindings = (validation.requiredConstBindings ?? [])
    .filter((name) => !constBindings.has(name))
    .map((name) => `const ${name}`);
  const missingTypeScriptEvidence = (
    validation.requiredTypeScriptEvidence ?? []
  )
    .filter((evidence) => !typeScriptEvidence.has(typeScriptEvidenceKey(evidence)))
    .map(typeScriptEvidenceLabel);
  const minimumConditionalBranches =
    validation.minimumConditionalBranches ?? 0;
  const missingConditionalEvidence =
    (source?.conditionalBranchCount ?? 0) < minimumConditionalBranches
      ? [`if/else (${minimumConditionalBranches} branches)`]
      : [];
  const minimumTryCatchBlocks = validation.minimumTryCatchBlocks ?? 0;
  const missingTryCatchEvidence =
    (source?.tryCatchCount ?? 0) < minimumTryCatchBlocks
      ? [`try/catch (${minimumTryCatchBlocks})`]
      : [];
  const missingSequenceSteps = findMissingEvidenceSequenceSteps(
    trace?.events,
    validation.requiredEvidenceSequence,
  );
  if (
    missingAssertions.length > 0 ||
    missingMethods.length > 0 ||
    missingFunctionCalls.length > 0 ||
    missingMemberCalls.length > 0 ||
    missingAsyncFunctions.length > 0 ||
    missingAwaitedFunctionCalls.length > 0 ||
    missingAwaitedMemberCalls.length > 0 ||
    missingPromiseAllFunctionCalls.length > 0 ||
    missingConstBindings.length > 0 ||
    missingTypeScriptEvidence.length > 0 ||
    missingConditionalEvidence.length > 0 ||
    missingTryCatchEvidence.length > 0 ||
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
            ...missingFunctionCalls,
            ...missingMemberCalls,
            ...missingAsyncFunctions,
            ...missingAwaitedFunctionCalls,
            ...missingAwaitedMemberCalls,
            ...missingPromiseAllFunctionCalls,
            ...missingConstBindings,
            ...missingTypeScriptEvidence,
            ...missingConditionalEvidence,
            ...missingTryCatchEvidence,
            ...missingSequenceSteps,
          ]),
        ],
      },
    };
  }

  return { passed: execution.status === 'PASSED' };
}
