/**
 * Invoke code created for the browser challenge sandbox.
 *
 * `Function` and iframe `eval` are inherently dynamic and return untyped
 * values. Keeping the invocation here makes that runtime boundary explicit:
 * callers receive `unknown` and must narrow it before use.
 */
export function invokeDynamicFunction(
  fn: CallableFunction,
  thisArg: unknown,
  args: unknown[],
): unknown {
  const result: unknown = Reflect.apply(fn, thisArg, args);
  return result;
}
