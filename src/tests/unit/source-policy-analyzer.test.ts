import { describe, expect, it } from 'bun:test';
import { analyzeSourcePolicy } from '@/core/executor/source-policy-analyzer';

describe('source policy analyzer', () => {
  it('resolves member, bracket, destructured, aliased, and bound calls', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        const { evaluate: runEvaluate } = page;
        const getByRole = page.getByRole.bind(page);
        const locate = page['locator'];
        await runEvaluate(() => true);
        await getByRole('button', { name: 'Save' });
        await locate('main > button');
      `,
      { strictMode: false },
    );

    expect(analysis.parserError).toBeUndefined();
    expect(analysis.calledMethods).toContain('evaluate');
    expect(analysis.calledMethods).toContain('getByRole');
    expect(analysis.calledMethods).toContain('locator');
    expect(analysis.structuralLocatorCalls).toBe(1);
  });

  it('detects truthy forced options but allows force: false', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        const force = true;
        const options = { force };
        await page.getByRole('button').click(options);
        await page.getByRole('button').click({ force: false });
        await page.getByRole('button').click({ force: Boolean(1) });
        await page.getByRole('button').click({ ['force']: true });
      `,
      { strictMode: false },
    );

    expect(analysis.forcedActions).toHaveLength(3);
    expect(analysis.forcedActions.map((action) => action.value)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('ignores forbidden names in comments and strings', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        // page.locator('main > form'); page.evaluate(() => document.body);
        const note = "click({ force: true }); waitForTimeout(1000)";
        await page.getByRole('button').click();
      `,
      {
        validation: {
          forbiddenMethods: ['locator', 'evaluate', 'waitForTimeout'],
        },
        strictMode: false,
      },
    );

    expect(noteIsUsed(analysis.calledMethods, 'click')).toBe(true);
    expect(analysis.forbiddenMethods).toEqual([]);
    expect(analysis.structuralLocatorCalls).toBe(0);
    expect(analysis.directDomAccesses).toEqual([]);
  });

  it('records forbidden generated method declarations even when unused', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        class UiActions {
          async fillField() {}
          async clickButton() {}
        }
      `,
      {
        validation: { forbiddenMethods: ['fillField', 'clickButton'] },
      },
    );

    expect(analysis.forbiddenMethods).toEqual(['fillField', 'clickButton']);
  });

  it('does not treat unrelated object methods as Playwright evidence', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        const helper = { locator: () => undefined, evaluate: () => undefined };
        helper.locator();
        helper.evaluate();
        const helperEvaluate = helper.evaluate;
        helperEvaluate();
        await expect('actual').toHaveText('actual');
      `,
      {
        validation: { forbiddenMethods: ['locator', 'evaluate'] },
        strictMode: false,
      },
    );

    expect(analysis.forbiddenMethods).toEqual([]);
    expect(analysis.structuralLocatorCalls).toBe(0);
    expect(analysis.calledMethods).toContain('toHaveText');
  });

  it('records configured browser DOM methods without trusting unrelated helpers', async () => {
    const validation = {
      requiredMethods: ['querySelector', 'querySelectorAll'],
    };
    const analysis = await analyzeSourcePolicy(
      `
        document.querySelector('button[type="submit"]');
        globalThis.document.querySelectorAll('[required]');
        const helper = { querySelector: () => undefined };
        helper.querySelector('not-browser-evidence');
      `,
      { validation, strictMode: false },
    );
    const helperOnly = await analyzeSourcePolicy(
      `
        const helper = {
          querySelector: () => undefined,
          querySelectorAll: () => [],
        };
        helper.querySelector('button');
        helper.querySelectorAll('[required]');
      `,
      { validation, strictMode: false },
    );

    expect(analysis.calledMethods).toContain('querySelector');
    expect(analysis.calledMethods).toContain('querySelectorAll');
    expect(helperOnly.calledMethods).not.toContain('querySelector');
    expect(helperOnly.calledMethods).not.toContain('querySelectorAll');
  });

  it('records JavaScript data-flow evidence for practice grading', async () => {
    const analysis = await analyzeSourcePolicy(`
      const testRuns = [
        { passCount: 2, totalTests: 2 },
        { passCount: 1, totalTests: 2 },
        { passCount: 0, totalTests: 2 },
      ];

      function classifyRun(run) {
        if (run.passCount === run.totalTests) {
          return 'ALL_PASSED';
        } else if (run.passCount > 0) {
          return 'PARTIAL';
        } else {
          return 'ALL_FAILED';
        }
      }

      const statuses = testRuns.map((run) => classifyRun(run));
      const result = statuses.join(' | ');
    `);

    expect(analysis.calledFunctions).toContain('classifyRun');
    expect(analysis.memberCalls).toEqual(['map', 'join']);
    expect(analysis.constBindings).toEqual(['testRuns', 'statuses', 'result']);
    expect(analysis.conditionalBranchCount).toBe(3);
  });

  it('records async functions, awaited calls, and try/catch evidence', async () => {
    const analysis = await analyzeSourcePolicy(`
      const loadFixture = () => Promise.resolve({ id: 'FIX-1' });
      const loadAccount = () => Promise.resolve({ email: 'qa@example.com' });

      async function prepareFixture() {
        try {
          return await loadFixture();
        } catch (error) {
          return { id: 'fallback' };
        }
      }

      const runSetup = async () => {
        const [fixture, account] = await Promise.all([
          prepareFixture(),
          loadAccount(),
        ]);
        return { fixture, account };
      };

      const result = await runSetup();
    `);

    expect(analysis.asyncFunctions).toEqual(['prepareFixture', 'runSetup']);
    expect(analysis.awaitedFunctionCalls).toEqual(['loadFixture', 'runSetup']);
    expect(analysis.awaitedMemberCalls).toEqual(['Promise.all']);
    expect(analysis.awaitedPromiseAllFunctionCalls).toEqual([
      'prepareFixture',
      'loadAccount',
    ]);
    expect(analysis.tryCatchCount).toBe(1);
  });

  it('records awaited helper call counts and Playwright method ownership', async () => {
    const analysis = await analyzeSourcePolicy(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await submitLogin(page, { username: 'testuser', password: 'password123' });
      });
    `);

    expect(analysis.awaitedFunctionCallCounts).toEqual({ submitLogin: 2 });
    const expectedCalls = [
      { method: 'getByLabel', function: 'submitLogin' },
      { method: 'fill', function: 'submitLogin' },
      { method: 'getByRole', function: 'submitLogin' },
      { method: 'click', function: 'submitLogin' },
      { method: 'goto' },
      { method: 'toHaveText' },
    ];
    for (const call of expectedCalls) {
      expect(analysis.scopedMethodCalls).toContainEqual(call);
    }
  });

  it('records TypeScript structure without claiming semantic checking', async () => {
    const analysis = await analyzeSourcePolicy(`
      interface AppConfig {
        apiUrl: string;
        retryLimit?: number;
      }

      const testId = 'TC-001';
      const config: AppConfig = { apiUrl: 'https://api.test', retryLimit: 0 };

      function createUser(
        id: number,
        role?: 'admin' | 'guest',
      ): string {
        return role ?? \`user-\${id}\`;
      }

      const result =
        config.retryLimit !== undefined ? config.retryLimit : -1;
    `);

    const expectedEvidence = [
      'interface-property:AppConfig:apiUrl:string',
      'interface-property:AppConfig:retryLimit?:number',
      'inferred-variable:testId',
      'variable-type:config:AppConfig',
      'function-parameter:createUser:id:number',
      'function-parameter:createUser:role?:"admin"|"guest"',
      'function-return:createUser:string',
      'operator:nullish-coalescing',
      'operator:strict-undefined-check',
    ];
    for (const evidence of expectedEvidence) {
      expect(analysis.typeScriptEvidence).toContain(evidence);
    }
  });

  it('finds direct DOM access and swallowed catch blocks as source findings', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        try {
          await page.getByRole('button').click();
        } catch {
          console.log('ignore');
        }
        const doc = globalThis['document'];
        doc.querySelector('#status');
        document.body;
        window.localStorage;
      `,
      { strictMode: false },
    );

    expect(analysis.swallowedErrorCount).toBe(1);
    expect(analysis.directDomAccesses).toContain('document');
    expect(analysis.directDomAccesses).toContain('window');
    expect(analysis.directDomAccesses).toContain('globalThis');
  });

  it('requires direct unconditional propagation for catches', async () => {
    const fakeThrow = await analyzeSourcePolicy(
      `
        try {
          await page.getByRole('button').click();
        } catch (error) {
          if (false) throw error;
          function unusedPropagation() { throw error; }
        }
      `,
      { strictMode: false },
    );
    const propagated = await analyzeSourcePolicy(
      `
        try {
          await page.getByRole('button').click();
        } catch (error) {
          throw error;
        }
      `,
      { strictMode: false },
    );

    expect(fakeThrow.swallowedErrorCount).toBe(1);
    expect(propagated.swallowedErrorCount).toBe(0);
  });

  it('detects ignored promise catches on Playwright actions', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        await page.getByRole('button').click().catch(() => console.log('ignore'));
      `,
      { strictMode: false },
    );

    expect(analysis.swallowedErrorCount).toBe(1);
  });

  it('accepts promise catches that directly propagate a rejection', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        await page.getByRole('button').click().catch(() => Promise.reject(new Error('retry')));
        await page.getByRole('button')['click']().catch(() => { throw new Error('retry'); });
      `,
      { strictMode: false },
    );

    expect(analysis.swallowedErrorCount).toBe(0);
  });

  it('resolves statically known computed method aliases', async () => {
    const analysis = await analyzeSourcePolicy(
      `
        const locatorMethod = 'locator';
        if (false) page[locatorMethod]('main > button');
        const evaluateMethod = 'evaluate';
        if (false) page[evaluateMethod](() => true);
      `,
      {
        validation: { forbiddenMethods: ['evaluate'] },
        strictMode: false,
      },
    );

    expect(analysis.structuralLocatorCalls).toBe(1);
    expect(analysis.forbiddenMethods).toEqual(['evaluate']);
  });
});

function noteIsUsed(methods: string[], method: string): boolean {
  return methods.includes(method);
}
