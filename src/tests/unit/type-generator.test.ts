import { describe, expect, test } from 'bun:test';
import { generateTypeDefinitions } from '@/core/type-generator';

describe('generateTypeDefinitions', () => {
  test('emits typed challenge globals without explicit any', () => {
    const [globals] = generateTypeDefinitions({});

    expect(globals.content).not.toMatch(/\bany\b/);
    expect(globals.content).toContain(
      '(actual: unknown): ExpectMatchers;',
    );
    expect(globals.content).toContain(
      'filter(options: LocatorFilterOptions): Locator;',
    );
  });

  test('uses safe parameter and fallback types for preloaded modules', () => {
    const definitions = generateTypeDefinitions(
      {
        '/LoginPage.ts': `
          export class LoginPage {
            constructor(page) {}
            async login(email, password) {}
          }
        `,
        '/unparsed.ts': 'export const value = 1;',
      },
      {
        LoginPage: { source: '/LoginPage.ts', exports: ['LoginPage'] },
        Unparsed: { source: '/unparsed.ts', exports: ['Unparsed'] },
      },
    );

    const pom = definitions.find(({ filePath }) => filePath === 'file:///pom.d.ts');
    expect(pom?.content).not.toMatch(/\bany\b/);
    expect(pom?.content).toContain('constructor(page: unknown);');
    expect(pom?.content).toContain(
      'login(email: unknown, password: unknown): Promise<void>;',
    );
    expect(pom?.content).toContain('declare const Unparsed: unknown;');
  });
});
