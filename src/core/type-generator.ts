
export interface TypeDefinition {
  content: string;
  filePath: string;
}

/**
 * Generates TypeScript type definitions for the challenge environment.
 * This includes global variables like 'page' and 'expect', as well as
 * global classes defined in preloadModules (for POM).
 */
export function generateTypeDefinitions(
  files: Record<string, string>,
  preloadModules?: Record<string, { source: string; exports: string[] }>
): TypeDefinition[] {
  const definitions: TypeDefinition[] = [];

  // 1. Core Playwright & Test Runner Globals
  // We provide a simplified type definition for common Playwright objects
  const coreGlobals = `
    /** Options for action methods like click, fill, check, etc. */
    declare interface ActionOptions {
      /** Maximum time in milliseconds. Defaults to 2500ms. */
      timeout?: number;
      /** Bypasses actionability checks. Use with caution. */
      force?: boolean;
      /** Do not wait for the action to complete. */
      noWaitAfter?: boolean;
    }

    /** Extended options for click actions. */
    declare interface ClickOptions extends ActionOptions {
      /** Clicks at the specified position. */
      position?: { x: number; y: number };
      /** Number of clicks. Defaults to 1. */
      clickCount?: number;
      /** Delay between mousedown and mouseup in ms. */
      delay?: number;
    }

    /** Extended options for fill actions. */
    declare interface FillOptions extends ActionOptions {
      /** Focus the element before filling. */
      focus?: boolean;
    }

    declare interface LocatorFilterOptions {
      has?: Locator;
      hasText?: string | RegExp;
    }

    declare interface LocatorQueryOptions {
      exact?: boolean;
    }

    declare interface RoleQueryOptions extends LocatorQueryOptions {
      name?: string | RegExp;
      checked?: boolean;
      disabled?: boolean;
      expanded?: boolean;
      pressed?: boolean;
      selected?: boolean;
      level?: number;
      includeHidden?: boolean;
    }

    declare interface Locator {
      click(options?: ClickOptions): Promise<void>;
      dblclick(options?: ClickOptions): Promise<void>;
      fill(value: string, options?: FillOptions): Promise<void>;
      textContent(): Promise<string | null>;
      inputValue(): Promise<string>;
      isVisible(): Promise<boolean>;
      isChecked(): Promise<boolean>;
      isDisabled(): Promise<boolean>;
      isEditable(): Promise<boolean>;
      check(options?: ActionOptions): Promise<void>;
      uncheck(options?: ActionOptions): Promise<void>;
      selectOption(value: string | string[], options?: ActionOptions): Promise<void>;
      getAttribute(name: string): Promise<string | null>;
      innerHTML(): Promise<string>;
      count(): Promise<number>;
      first(): Locator;
      last(): Locator;
      nth(index: number): Locator;
      all(): Promise<Locator[]>;
      focus(options?: ActionOptions): Promise<void>;
      blur(options?: ActionOptions): Promise<void>;
      clear(options?: ActionOptions): Promise<void>;
      press(key: string, options?: ActionOptions): Promise<void>;
      hover(options?: ActionOptions): Promise<void>;
      filter(options: LocatorFilterOptions): Locator;
      waitFor(options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }): Promise<void>;
    }

    declare interface Page {
      goto(url: string): Promise<void>;
      locator(selector: string): Locator;
      getByRole(role: string, options?: RoleQueryOptions): Locator;
      getByText(text: string | RegExp, options?: LocatorQueryOptions): Locator;
      getByLabel(text: string | RegExp, options?: LocatorQueryOptions): Locator;
      getByPlaceholder(text: string | RegExp, options?: LocatorQueryOptions): Locator;
      getByTitle(text: string | RegExp, options?: LocatorQueryOptions): Locator;
      getByTestId(testId: string): Locator;
      click(selector: string, options?: ClickOptions): Promise<void>;
      fill(selector: string, value: string, options?: FillOptions): Promise<void>;
      check(selector: string, options?: ActionOptions): Promise<void>;
      uncheck(selector: string, options?: ActionOptions): Promise<void>;
      title(): Promise<string>;
      url(): string;
      waitForSelector(selector: string, options?: { state?: string; timeout?: number }): Promise<void>;
    }

    declare interface ExpectMatchers {
      readonly not: ExpectMatchers;
      toBe(expected: unknown): Promise<void>;
      toEqual(expected: unknown): Promise<void>;
      toContain(expected: unknown): Promise<void>;
      toContainText(expected: string): Promise<void>;
      toHaveText(expected: string | RegExp): Promise<void>;
      toBeVisible(): Promise<void>;
      toBeHidden(): Promise<void>;
      toHaveCount(count: number): Promise<void>;
      toHaveAttribute(name: string, value: string | RegExp): Promise<void>;
      toBeTruthy(): Promise<void>;
      toBeFalsy(): Promise<void>;
    }

    declare interface Expect {
      (actual: unknown): ExpectMatchers;
      soft(actual: unknown): ExpectMatchers;
    }

    declare interface Test {
      (name: string, callback: (fixtures: { page: Page, expect: Expect }) => Promise<void>): Promise<void>;
      step(name: string, callback: () => Promise<void>): Promise<void>;
    }

    declare const page: Page;
    declare const expect: Expect;
    declare const test: Test;
    
    // Support standard Playwright imports
    declare module '@playwright/test' {
      export const test: Test;
      export const expect: Expect;
    }
    
    // Allow top-level await by declaring it essentially as a module but without imports
    // This is a hack for Monaco's script mode
    // declare var exports: {};
  `;

  definitions.push({
    content: coreGlobals,
    filePath: 'file:///globals.d.ts'
  });

  // 2. Preloaded Modules (POM Classes)
  // We need to parse the source files to extract class signatures
  if (preloadModules) {
    let moduleDefs = '';
    const configuredClasses = new Set(
      Object.entries(preloadModules).flatMap(([moduleName, config]) => [
        moduleName,
        ...config.exports,
      ]),
    );

    Object.entries(preloadModules).forEach(([moduleName, config]) => {
      const sourcePath = config.source;
      const sourceContent = files[sourcePath];

      if (sourceContent) {
        // Extract class definition using simple regex
        // Matches: export class ClassName { ... }
        // We capture the body to extract methods
        const escapedModuleName = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // The module name is escaped above before being interpolated into this parser regex.
        // eslint-disable-next-line security/detect-non-literal-regexp
        const classRegex = new RegExp(`export\\s+class\\s+${escapedModuleName}\\s*{([\\s\\S]*?)}\\s*$`, 'g');
        const match = classRegex.exec(sourceContent);

        if (match) {
          const body = match[1];
          if (body === undefined) return;

          // Extract constructor parameters. Unknown accepts challenge inputs while
          // preventing generated declarations from promising unsupported members.
          const ctorRegex = /constructor\s*\(([^)]*)\)/;
          const ctorMatch = ctorRegex.exec(body);
          let ctorDef = 'constructor(page: unknown);';
          if (ctorMatch?.[1] !== undefined) {
            // Simple parameter handling
            ctorDef = `constructor(${ctorMatch[1].split(',').map(p => p.trim() + ': unknown').join(', ')});`;
          }

          // Extract async methods
          // async method(arg1, arg2) 
          const methodRegex = /async\s+(\w+)\s*\(([^)]*)\)/g;
          let methods = '';
          const methodMatches = Array.from(body.matchAll(methodRegex));
          methodMatches.forEach((methodMatch, index) => {
            const methodName = methodMatch[1];
            const parameterList = methodMatch[2];
            if (methodName === undefined || parameterList === undefined) return;
            const args = parameterList.split(',').filter(a => a.trim()).map(a => a.trim() + ': unknown').join(', ');
            const methodBodyStart = (methodMatch.index ?? 0) + methodMatch[0].length;
            const methodBodyEnd = methodMatches[index + 1]?.index ?? body.length;
            const methodBody = body.slice(methodBodyStart, methodBodyEnd);
            const constructedReturn = /\breturn\s+new\s+([A-Za-z_$][\w$]*)\s*\(/.exec(methodBody)?.[1];
            const returnType = constructedReturn && configuredClasses.has(constructedReturn)
              ? constructedReturn
              : /\breturn\b/.test(methodBody)
                ? 'unknown'
                : 'void';
            methods += `  ${methodName}(${args}): Promise<${returnType}>;\n`;
          });

          moduleDefs += `
            declare class ${moduleName} {
              ${ctorDef}
              ${methods}
            }
          `;
        } else {
          // A failed signature extraction must not invent callable members.
          moduleDefs += `declare const ${moduleName}: unknown;\n`;
        }
      }
    });

    if (moduleDefs) {
      definitions.push({
        content: moduleDefs,
        filePath: 'file:///pom.d.ts'
      });
    }
  }

  return definitions;
}
