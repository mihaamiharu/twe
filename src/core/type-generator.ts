
/**
 * Generates TypeScript type definitions for the challenge environment.
 * This includes global variables like 'page' and 'expect', as well as
 * global classes defined in preloadModules (for POM).
 */
export function generateTypeDefinitions(
    files: Record<string, string>,
    preloadModules?: Record<string, { source: string; exports: string[] }>
): { content: string; filePath: string }[] {
    const definitions: { content: string; filePath: string }[] = [];

    // 1. Core Playwright & Test Runner Globals
    // We provide a simplified type definition for common Playwright objects
    const coreGlobals = `
    declare interface Locator {
      click(options?: any): Promise<void>;
      fill(value: string, options?: any): Promise<void>;
      textContent(): Promise<string | null>;
      isVisible(): Promise<boolean>;
      getAttribute(name: string): Promise<string | null>;
      count(): Promise<number>;
      first(): Locator;
      last(): Locator;
      nth(index: number): Locator;
      all(): Promise<Locator[]>;
      filter(options: any): Locator;
      waitFor(options?: any): Promise<void>;
    }

    declare interface Page {
      goto(url: string): Promise<void>;
      locator(selector: string): Locator;
      getByRole(role: string, options?: any): Locator;
      getByText(text: string, options?: any): Locator;
      getByLabel(text: string, options?: any): Locator;
      getByPlaceholder(text: string, options?: any): Locator;
      getByTitle(text: string, options?: any): Locator;
      getByTestId(text: string, options?: any): Locator;
      title(): Promise<string>;
      url(): string;
    }

    declare interface Expect {
      (actual: any): any;
      not: Expect;
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toContain(expected: any): void;
      toContainText(expected: string): Promise<void>;
      toHaveText(expected: string): Promise<void>;
      toBeVisible(): Promise<void>;
      toBeHidden(): Promise<void>;
      toHaveCount(count: number): Promise<void>;
      toHaveAttribute(name: string, value: string): Promise<void>;
      toBeTruthy(): void;
      toBeFalsy(): void;
    }

    declare const page: Page;
    declare const expect: Expect;
    
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

        Object.entries(preloadModules).forEach(([moduleName, config]) => {
            const sourcePath = config.source;
            const sourceContent = files[sourcePath];

            if (sourceContent) {
                // Extract class definition using simple regex
                // Matches: export class ClassName { ... }
                // We capture the body to extract methods
                const classRegex = new RegExp(`export\\s+class\\s+${moduleName}\\s*{([\\s\\S]*?)}\\s*$`, 'gm');
                const match = classRegex.exec(sourceContent);

                if (match) {
                    const body = match[1];

                    // Extract constructor
                    // constructor(page) -> constructor(page: any)
                    const ctorRegex = /constructor\s*\(([^)]*)\)/;
                    const ctorMatch = ctorRegex.exec(body);
                    let ctorDef = 'constructor(page: any);'; // Default fallback
                    if (ctorMatch) {
                        // Simple parameter handling
                        ctorDef = `constructor(${ctorMatch[1].split(',').map(p => p.trim() + ': any').join(', ')});`;
                    }

                    // Extract async methods
                    // async method(arg1, arg2) 
                    const methodRegex = /async\s+(\w+)\s*\(([^)]*)\)/g;
                    let methods = '';
                    let methodMatch;
                    while ((methodMatch = methodRegex.exec(body)) !== null) {
                        const methodName = methodMatch[1];
                        const args = methodMatch[2].split(',').filter(a => a.trim()).map(a => a.trim() + ': any').join(', ');
                        methods += `  ${methodName}(${args}): Promise<void>;\n`; // Assume void return for actions usually
                    }

                    // Also allow any other property lookup for now to be safe
                    // [key: string]: any; 

                    moduleDefs += `
            declare class ${moduleName} {
              ${ctorDef}
              ${methods}
            }
          `;
                } else {
                    // Fallback if regex fails - declare check as any
                    moduleDefs += `declare const ${moduleName}: any;\n`;
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
