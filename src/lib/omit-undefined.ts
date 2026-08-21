type RequiredDefinedProperties<Properties extends object> = {
  [Key in keyof Properties as undefined extends Properties[Key]
    ? never
    : Key]: Properties[Key];
};

type OptionalDefinedProperties<Properties extends object> = {
  [Key in keyof Properties as undefined extends Properties[Key]
    ? Key
    : never]?: Exclude<Properties[Key], undefined>;
};

export type DefinedProperties<Properties extends object> =
  RequiredDefinedProperties<Properties> &
    OptionalDefinedProperties<Properties>;

/**
 * Builds an exact-optional property bag by removing own enumerable properties
 * whose value is undefined. Falsy values and null are intentionally preserved.
 */
export function omitUndefined<Properties extends object>(
  properties: Properties,
): DefinedProperties<Properties>;
export function omitUndefined(properties: object): object {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
}
