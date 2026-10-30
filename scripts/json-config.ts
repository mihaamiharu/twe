/* eslint-disable security/detect-non-literal-fs-filename -- Called only by offline tools with repository/build config paths. */
import { readFile } from 'node:fs/promises';
import { parse, type ParseError } from 'jsonc-parser';

export async function readJsonConfig(path: string): Promise<unknown> {
  const errors: ParseError[] = [];
  const value: unknown = parse(await readFile(path, 'utf8'), errors, {
    allowTrailingComma: true,
  });
  if (errors.length) throw new Error('Invalid JSON/JSONC configuration.');
  return value;
}
