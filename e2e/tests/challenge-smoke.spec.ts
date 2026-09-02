import { expect, test } from '@playwright/test';

test.describe('Challenge smoke', () => {
  test('loads and executes a selector challenge without a session', async ({
    page,
  }) => {
    await page.goto('/en/practice/css-selector-101-id-class');
    await page.waitForLoadState('networkidle');

    const xpathButton = page.getByRole('button', {
      name: 'XPath',
      exact: true,
    });
    await expect(xpathButton).toBeVisible({ timeout: 20_000 });
    await xpathButton.click();
    await expect(page.getByPlaceholder(/Enter XPath/i)).toBeVisible();

    await page.getByRole('button', { name: 'CSS', exact: true }).click();
    const selectorInput = page.getByPlaceholder(/Enter CSS selector/i);
    await selectorInput.fill('#login-btn');
    await page.getByRole('button', { name: 'Test Selector' }).click();

    await expect(page.getByText(/Correct/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('executes the Cart Playwright flow in the isolated runner', async ({
    page,
  }) => {
    await page.goto('/en/practice/pw-first-test');

    const editor = page.locator('.monaco-editor').first();
    await editor.waitFor({ state: 'visible', timeout: 20_000 });

    const solution = `import { test, expect } from '@playwright/test';

test('customer can open the cart', async ({ page }) => {
  await page.goto('/app/products.html');

  await page.getByRole('link', { name: 'Cart' }).click();

  await expect(
    page.getByRole('heading', { name: 'Your cart' }),
  ).toBeVisible();
});`;

    await editor.locator('.view-lines').click();
    await page.evaluate((value) => {
      const amdRequire = window.require;
      if (!amdRequire) throw new Error('Monaco AMD loader is not available.');

      return new Promise<void>((resolve, reject) => {
        amdRequire(
          ['vs/editor/editor.main'],
          (loaded) => {
            const monaco = 'm' in loaded ? loaded.m : loaded;
            const editorElement = document.querySelector('.monaco-editor');
            const monacoEditor = monaco.editor
              .getEditors()
              .find((candidate) => candidate.getDomNode() === editorElement);
            if (!monacoEditor) {
              reject(new Error('Rendered Monaco editor is not available.'));
              return;
            }
            monacoEditor.setValue(value);
            resolve();
          },
          reject,
        );
      });
    }, solution);

    const runButton = page.getByRole('button', { name: 'Run' });
    await runButton.click();
    await expect(runButton).toHaveAttribute('aria-busy', 'false', {
      timeout: 20_000,
    });
    await expect(page.getByText('✓ PASSED', { exact: true })).toBeVisible({
      timeout: 20_000,
    });
  });

  test('resets a multi-file editor after confirmation', async ({ page }) => {
    await page.goto('/en/practice/pw-first-test');

    const editor = page.locator('.monaco-editor').first();
    await editor.waitFor({ state: 'visible', timeout: 20_000 });
    await editor.locator('.view-lines').click();
    await page.evaluate(() => {
      const amdRequire = window.require;
      if (!amdRequire) throw new Error('Monaco AMD loader is not available.');

      return new Promise<void>((resolve, reject) => {
        amdRequire(
          ['vs/editor/editor.main'],
          (loaded) => {
            const monaco = 'm' in loaded ? loaded.m : loaded;
            const editorElement = document.querySelector('.monaco-editor');
            const monacoEditor = monaco.editor
              .getEditors()
              .find((candidate) => candidate.getDomNode() === editorElement);
            if (!monacoEditor) {
              reject(new Error('Rendered Monaco editor is not available.'));
              return;
            }
            monacoEditor.setValue('// RESET_SENTINEL');
            resolve();
          },
          reject,
        );
      });
    });

    await expect(editor.locator('.view-lines')).toContainText(
      'RESET_SENTINEL',
    );

    await page.getByRole('button', { name: 'Reset Code' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reset Challenge?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Reset', exact: true }).click();

    await expect(editor.locator('.view-lines')).toContainText('// TODO 1');
    await expect(editor.locator('.view-lines')).not.toContainText(
      'RESET_SENTINEL',
    );
  });
});
