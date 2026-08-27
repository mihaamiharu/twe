import type { MockedPlaywrightPage } from './playwright-shim';
import type { Locator } from './shim.types';

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

const PAGE_METHOD_NAMES = new Set([
  'on',
  'route',
  'unroute',
  'goto',
  'url',
  'reload',
  'goBack',
  'goForward',
  'evaluate',
  'click',
  'dblclick',
  'focus',
  'dispatchEvent',
  'fill',
  'check',
  'isChecked',
  'isDisabled',
  'isEditable',
  'inputValue',
  'getAttribute',
  'selectOption',
  'setInputFiles',
  'dragAndDrop',
  'uncheck',
  'textContent',
  'waitForSelector',
  'title',
  'waitForLoadState',
  'waitForFunction',
  'waitForResponse',
  'waitForTimeout',
  'screenshot',
  'video',
  'context',
  'hover',
  'press',
  'frameLocator',
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByAltText',
  'getByTitle',
  'getByTestId',
  'locator',
  'innerHTML',
  'isElementVisible',
  'count',
]);

const LOCATOR_METHOD_NAMES = new Set([
  'allAttributes',
  'boundingBox',
  'click',
  'dblclick',
  'fill',
  'textContent',
  'inputValue',
  'isVisible',
  'isChecked',
  'isDisabled',
  'isEditable',
  'check',
  'uncheck',
  'selectOption',
  'getAttribute',
  'innerHTML',
  'count',
  'first',
  'last',
  'nth',
  'focus',
  'blur',
  'clear',
  'dispatchEvent',
  'setInputFiles',
  'dragTo',
  'dragAndDrop',
  'press',
  'evaluate',
  'locator',
  'filter',
  'all',
  'allTextContents',
  'elementHandles',
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByAltText',
  'getByTitle',
  'getByTestId',
  'hover',
  'waitFor',
]);

const ACTION_METHOD_NAMES = new Set([
  'click',
  'dblclick',
  'fill',
  'check',
  'uncheck',
  'selectOption',
  'focus',
  'blur',
  'clear',
  'dispatchEvent',
  'setInputFiles',
  'dragTo',
  'dragAndDrop',
  'press',
  'hover',
  'waitFor',
]);

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
  if (!ACTION_METHOD_NAMES.has(method)) return undefined;
  const candidate = args.at(-1);
  if (!isObject(candidate) || !('force' in candidate)) return undefined;
  return { force: candidate['force'] };
}

function isLocatorLike(value: unknown): value is Locator {
  if (!isObject(value) && typeof value !== 'function') return false;
  return [...LOCATOR_METHOD_NAMES].some(
    (method) => typeof Reflect.get(value, method) === 'function',
  );
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
      targetType === 'page' ? PAGE_METHOD_NAMES : LOCATOR_METHOD_NAMES;
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
            if (isLocatorLike(result)) return wrap(result, 'locator');
            return result;
          };
          const settleFailure = (error: unknown): never => {
            call.succeeded = false;
            call.error = formatRuntimeError(error);
            throw error;
          };

          try {
            const result: unknown = Reflect.apply(value, currentTarget, args);
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
