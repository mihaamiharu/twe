import { describe, expect, test } from 'bun:test';
import { generateTypeDefinitions } from '@/core/type-generator';

describe('generateTypeDefinitions', () => {
  test('emits typed challenge globals without explicit any', () => {
    const [globals] = generateTypeDefinitions({});
    if (!globals) throw new Error('Expected global type definitions');

    expect(globals.content).not.toMatch(/\bany\b/);
    expect(globals.content).toContain(
      '(actual: unknown): ExpectMatchers;',
    );
    expect(globals.content).toContain(
      'filter(options: LocatorFilterOptions): Locator;',
    );
    expect(globals.content).toContain('getByTestId(testId: string): Locator;');
    expect(globals.content).not.toContain('hasNot?:');
    expect(globals.content).not.toContain('hasNotText?:');
    expect(globals.content).not.toContain('getByTestId(text: string | RegExp)');
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

  test('preserves page-object return types from async methods', () => {
    const definitions = generateTypeDefinitions(
      {
        '/LoginPage.ts': `
          export class LoginPage {
            constructor(page) { this.page = page; }
            async goto() { await this.page.goto('/login'); }
            async login(email, password) {
              await this.page.fill('#email', email);
              return new DashboardPage(this.page);
            }
          }
        `,
        '/DashboardPage.ts': `
          export class DashboardPage {
            constructor(page) { this.page = page; }
            async goToProfile() {
              return new ProfilePage(this.page);
            }
          }
        `,
        '/ProfilePage.ts': `
          export class ProfilePage {
            constructor(page) { this.page = page; }
            async backToDashboard() {
              return new DashboardPage(this.page);
            }
            async currentName() { return this.page.locator('h1').textContent(); }
          }
        `,
      },
      {
        LoginPage: { source: '/LoginPage.ts', exports: ['LoginPage'] },
        DashboardPage: { source: '/DashboardPage.ts', exports: ['DashboardPage'] },
        ProfilePage: { source: '/ProfilePage.ts', exports: ['ProfilePage'] },
      },
    );

    const pom = definitions.find(({ filePath }) => filePath === 'file:///pom.d.ts');
    expect(pom?.content).toContain('goto(): Promise<void>;');
    expect(pom?.content).toContain(
      'login(email: unknown, password: unknown): Promise<DashboardPage>;',
    );
    expect(pom?.content).toContain('goToProfile(): Promise<ProfilePage>;');
    expect(pom?.content).toContain('backToDashboard(): Promise<DashboardPage>;');
    expect(pom?.content).toContain('currentName(): Promise<unknown>;');
  });
});
