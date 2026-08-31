import type { MockedPlaywrightPage } from './playwright-shim';
import type { Locator } from './shim.types';
import type {
  LocatorEvidenceDefinition,
  LocatorFilterEvidenceDefinition,
  LocatorTargetEvidenceDefinition,
} from '@/lib/content.types';
import {
  PLAYWRIGHT_ACTION_METHODS,
  PLAYWRIGHT_LOCATOR_METHODS,
  PLAYWRIGHT_LOCATOR_RETURNING_METHODS,
  PLAYWRIGHT_PAGE_METHODS,
} from './playwright-methods';

export type RuntimeTraceTarget = 'page' | 'locator';

export interface RuntimeMethodCall {
  target: RuntimeTraceTarget;
  method: string;
  arguments?: string[];
  locator?: LocatorEvidenceDefinition;
  actionOptions?: { force?: unknown };
  succeeded: boolean;
  error?: string;
}

export interface RuntimeAssertion {
  matcher: string;
  arguments?: string[];
  locator?: LocatorEvidenceDefinition;
  passed: boolean;
  error?: string;
}

export type RuntimeTraceEvent =
  | { type: 'method'; call: RuntimeMethodCall }
  | { type: 'assertion'; assertion: RuntimeAssertion };

export interface RuntimeExecutionTrace {
  methodCalls: RuntimeMethodCall[];
  assertions: RuntimeAssertion[];
  events?: RuntimeTraceEvent[];
}

/** Internal escape hatch for assertion helpers; never exposed to learner code. */
export const TRACED_PLAYWRIGHT_TARGET = Symbol('traced-playwright-target');
export const TRACED_PLAYWRIGHT_LOCATOR_EVIDENCE = Symbol(
  'traced-playwright-locator-evidence',
);

function getReflectProperty(value: object, property: PropertyKey): unknown {
  return Reflect.get(value, property);
}

export function unwrapTracedPlaywrightValue(value: unknown): unknown {
  if (typeof value !== 'object' && typeof value !== 'function') return value;
  if (value === null) return value;
  const target = getReflectProperty(value, TRACED_PLAYWRIGHT_TARGET);
  return target ?? value;
}

export function getTracedLocatorEvidence(
  value: unknown,
): LocatorEvidenceDefinition | undefined {
  if (typeof value !== 'object' && typeof value !== 'function') return undefined;
  if (value === null) return undefined;
  const evidence = getReflectProperty(
    value,
    TRACED_PLAYWRIGHT_LOCATOR_EVIDENCE,
  );
  return isLocatorEvidence(evidence) ? evidence : undefined;
}

export function createRuntimeExecutionTrace(): RuntimeExecutionTrace {
  return { methodCalls: [], assertions: [], events: [] };
}

export function recordRuntimeAssertion(
  trace: RuntimeExecutionTrace,
  assertion: RuntimeAssertion,
): void {
  trace.assertions.push(assertion);
  trace.events?.push({ type: 'assertion', assertion });
}

function formatRuntimeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof Reflect.get(value, 'then') === 'function'
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLocatorEvidence(value: unknown): value is LocatorEvidenceDefinition {
  return isObject(value) && typeof value['method'] === 'string';
}

function getStringArguments(args: unknown[]): string[] | undefined {
  const stringArguments = args.filter(
    (argument): argument is string => typeof argument === 'string',
  );
  return stringArguments.length > 0 ? stringArguments : undefined;
}

function toTargetEvidence(
  evidence: LocatorEvidenceDefinition,
): LocatorTargetEvidenceDefinition {
  return {
    method: evidence.method,
    ...(evidence.value === undefined ? {} : { value: evidence.value }),
    ...(evidence.name === undefined ? {} : { name: evidence.name }),
    ...(evidence.exact === undefined ? {} : { exact: evidence.exact }),
    ...(evidence.filters === undefined ? {} : { filters: evidence.filters }),
  };
}

function getFilterEvidence(
  args: unknown[],
): LocatorFilterEvidenceDefinition | undefined {
  const options = isObject(args[0]) ? args[0] : undefined;
  if (options === undefined) return undefined;

  const hasText =
    typeof options['hasText'] === 'string' ? options['hasText'] : undefined;
  const hasLocator = getTracedLocatorEvidence(options['has']);
  if (hasText === undefined && hasLocator === undefined) return undefined;

  return {
    ...(hasText === undefined ? {} : { hasText }),
    ...(hasLocator === undefined
      ? {}
      : { has: toTargetEvidence(hasLocator) }),
  };
}

function getReturnedLocatorEvidence(
  method: string,
  args: unknown[],
  current: LocatorEvidenceDefinition | undefined,
): LocatorEvidenceDefinition | undefined {
  if (!PLAYWRIGHT_LOCATOR_RETURNING_METHODS.has(method)) return current;
  if (method === 'first' || method === 'last' || method === 'nth') return current;
  if (method === 'filter') {
    if (current === undefined) return undefined;
    const filter = getFilterEvidence(args);
    if (filter === undefined) return current;
    return {
      ...current,
      filters: [...(current.filters ?? []), filter],
    };
  }

  const value = typeof args[0] === 'string' ? args[0] : undefined;
  const options = isObject(args[1]) ? args[1] : undefined;
  const name = typeof options?.['name'] === 'string' ? options['name'] : undefined;
  const exact =
    typeof options?.['exact'] === 'boolean' ? options['exact'] : undefined;

  return {
    method,
    ...(value === undefined ? {} : { value }),
    ...(name === undefined ? {} : { name }),
    ...(exact === undefined ? {} : { exact }),
    ...(current === undefined ? {} : { scope: toTargetEvidence(current) }),
  };
}

function getActionOptions(
  method: string,
  args: unknown[],
): { force?: unknown } | undefined {
  if (!PLAYWRIGHT_ACTION_METHODS.has(method)) return undefined;
  const candidate = args.at(-1);
  if (!isObject(candidate) || !('force' in candidate)) return undefined;
  return { force: candidate['force'] };
}

function isLocatorLike(value: unknown): value is Locator {
  if (!isObject(value) && typeof value !== 'function') return false;
  return [...PLAYWRIGHT_LOCATOR_METHODS].some(
    (method) => typeof Reflect.get(value, method) === 'function',
  );
}

function wrapReturnedValue(
  value: unknown,
  wrap: (target: object) => object,
): unknown {
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    return items.map((item) => (isLocatorLike(item) ? wrap(item) : item));
  }
  return isLocatorLike(value) ? wrap(value) : value;
}

function unwrapArgument(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unwrapArgument);
  return unwrapTracedPlaywrightValue(value);
}

/**
 * Wrap only the learner-facing page and locator objects. The shim itself keeps
 * using its raw objects internally, so calls such as page.getByTestId() ->
 * page.locator() do not create false learner evidence.
 */
export function createTracedPlaywrightPage(
  page: MockedPlaywrightPage,
  trace: RuntimeExecutionTrace,
  options: { onPageMethodSettled?: () => void } = {},
): MockedPlaywrightPage {
  const proxyCache = new WeakMap<object, object>();

  const wrap = <T extends object>(
    target: T,
    targetType: RuntimeTraceTarget,
    locatorEvidence?: LocatorEvidenceDefinition,
  ): T => {
    const cached = proxyCache.get(target);
    if (cached) return cached as T;

    const methodNames =
      targetType === 'page'
        ? PLAYWRIGHT_PAGE_METHODS
        : PLAYWRIGHT_LOCATOR_METHODS;
    const proxy = new Proxy(target, {
      get(currentTarget, property, receiver) {
        if (property === TRACED_PLAYWRIGHT_TARGET) return currentTarget;
        if (property === TRACED_PLAYWRIGHT_LOCATOR_EVIDENCE) {
          return locatorEvidence;
        }
        const value = Reflect.get(currentTarget, property, receiver);
        if (typeof property !== 'string' || !methodNames.has(property)) {
          return value;
        }
        if (typeof value !== 'function') return value;

        return (...args: unknown[]) => {
          const actionOptions = getActionOptions(property, args);
          const stringArguments = getStringArguments(args);
          const call: RuntimeMethodCall = {
            target: targetType,
            method: property,
            succeeded: false,
            ...(stringArguments === undefined
              ? {}
              : { arguments: stringArguments }),
            ...(targetType !== 'locator' || locatorEvidence === undefined
              ? {}
              : { locator: locatorEvidence }),
            ...(actionOptions === undefined ? {} : { actionOptions }),
          };
          trace.methodCalls.push(call);
          trace.events?.push({ type: 'method', call });

          const settleSuccess = (result: unknown): unknown => {
            call.succeeded = true;
            if (targetType === 'page') options.onPageMethodSettled?.();
            const returnedLocatorEvidence = getReturnedLocatorEvidence(
              property,
              args,
              locatorEvidence,
            );
            return wrapReturnedValue(result, (target) =>
              wrap(target, 'locator', returnedLocatorEvidence),
            );
          };
          const settleFailure = (error: unknown): never => {
            call.succeeded = false;
            call.error = formatRuntimeError(error);
            throw error;
          };

          try {
            const rawArgs = args.map(unwrapArgument);
            const result: unknown = Reflect.apply(value, currentTarget, rawArgs);
            if (isPromiseLike(result)) {
              return result.then(settleSuccess, settleFailure);
            }
            return settleSuccess(result);
          } catch (error) {
            return settleFailure(error);
          }
        };
      },
    });
    proxyCache.set(target, proxy);
    return proxy;
  };

  return wrap(page, 'page');
}
