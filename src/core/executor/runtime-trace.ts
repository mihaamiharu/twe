import type { MockedPlaywrightPage } from './playwright-shim';
import type { Locator } from './shim.types';
import {
  PLAYWRIGHT_ACTION_METHODS,
  PLAYWRIGHT_LOCATOR_METHODS,
  PLAYWRIGHT_PAGE_METHODS,
} from './playwright-methods';

export type RuntimeTraceTarget = 'page' | 'locator';

export interface RuntimeMethodCall {
  target: RuntimeTraceTarget;
  method: string;
  actionOptions?: { force?: unknown };
  succeeded: boolean;
  error?: string;
}

export interface RuntimeAssertion {
  matcher: string;
  passed: boolean;
  error?: string;
}

export interface RuntimeExecutionTrace {
  methodCalls: RuntimeMethodCall[];
  assertions: RuntimeAssertion[];
}

/** Internal escape hatch for assertion helpers; never exposed to learner code. */
export const TRACED_PLAYWRIGHT_TARGET = Symbol('traced-playwright-target');

function getReflectProperty(value: object, property: PropertyKey): unknown {
  return Reflect.get(value, property);
}

export function unwrapTracedPlaywrightValue(value: unknown): unknown {
  if (typeof value !== 'object' && typeof value !== 'function') return value;
  if (value === null) return value;
  const target = getReflectProperty(value, TRACED_PLAYWRIGHT_TARGET);
  return target ?? value;
}

export function createRuntimeExecutionTrace(): RuntimeExecutionTrace {
  return { methodCalls: [], assertions: [] };
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

  const wrap = <T extends object>(target: T, targetType: RuntimeTraceTarget): T => {
    const cached = proxyCache.get(target);
    if (cached) return cached as T;

    const methodNames =
      targetType === 'page'
        ? PLAYWRIGHT_PAGE_METHODS
        : PLAYWRIGHT_LOCATOR_METHODS;
    const proxy = new Proxy(target, {
      get(currentTarget, property, receiver) {
        if (property === TRACED_PLAYWRIGHT_TARGET) return currentTarget;
        const value = Reflect.get(currentTarget, property, receiver);
        if (typeof property !== 'string' || !methodNames.has(property)) {
          return value;
        }
        if (typeof value !== 'function') return value;

        return (...args: unknown[]) => {
          const actionOptions = getActionOptions(property, args);
          const call: RuntimeMethodCall = {
            target: targetType,
            method: property,
            succeeded: false,
            ...(actionOptions === undefined ? {} : { actionOptions }),
          };
          trace.methodCalls.push(call);

          const settleSuccess = (result: unknown): unknown => {
            call.succeeded = true;
            if (targetType === 'page') options.onPageMethodSettled?.();
            return wrapReturnedValue(result, (target) =>
              wrap(target, 'locator'),
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
