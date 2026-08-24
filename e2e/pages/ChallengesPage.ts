import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type MonacoEditor = {
  getDomNode(): HTMLElement | null;
  getValue(): string;
  setValue(nextValue: string): void;
};

type MonacoApi = {
  editor: { getEditors(): MonacoEditor[] };
};

type LoadedMonaco = MonacoApi | { m: MonacoApi };

type AMDRequire = (
  modules: string[],
  onLoad: (module: LoadedMonaco) => void,
  onError: (error: unknown) => void,
) => void;

declare global {
  interface Window {
    require?: AMDRequire;
  }
}

export class ChallengesPage extends BasePage {
  readonly runButton: Locator;
  readonly submitButton: Locator;
  readonly editor: Locator;
  readonly selectorInput: Locator;
  readonly testSelectorButton: Locator;
  readonly hideCompletedToggle: Locator;

  constructor(page: Page) {
    super(page);
    this.runButton = page.getByRole('button', { name: 'Run' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.editor = page.locator('.monaco-editor').first();
    this.selectorInput = page.locator('input[type="text"]'); // Specific enough for now in that context
    this.testSelectorButton = page.getByRole('button', {
      name: 'Test Selector',
    });
    this.hideCompletedToggle = page.getByRole('switch', {
      name: /Hide (Completed|Done)|Show Completed|Tampilkan Selesai|Sembunyikan Selesai/i,
    });

    // Debug console logs from the page (including iframes)
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[PAGE ${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
  }

  async gotoList(locale: string = 'en') {
    await this.goto(`/${locale}/practice`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoChallenge(slug: string, locale: string = 'en') {
    await this.goto(`/${locale}/practice/${slug}`);
  }

  async solveChallenge(codeOrSelector: string, slug?: string) {
    // Wait for page to be ready and loading to disappear if possible
    await this.page.waitForLoadState('domcontentloaded');

    // Detect if it is a selector challenge
    // Use slug if available, otherwise check visibility (which might be flaky if loading)
    let isSelectorChallenge = false;

    if (slug) {
      isSelectorChallenge =
        slug.startsWith('css-') ||
        slug.startsWith('xpath-') ||
        slug.startsWith('selector-');
    } else {
      try {
        // Wait for either editor or selector input
        await Promise.race([
          this.editor.waitFor({ state: 'visible', timeout: 5000 }),
          this.selectorInput.waitFor({ state: 'visible', timeout: 5000 }),
        ]);
        isSelectorChallenge = await this.selectorInput.isVisible();
      } catch {
        // Fallback
      }
    }

    if (isSelectorChallenge) {
      await this.page.waitForLoadState('networkidle');
      const isXPath =
        codeOrSelector.startsWith('//') || Boolean(slug?.includes('xpath'));
      const selectorInput = this.page.getByPlaceholder(
        isXPath ? /Enter XPath/i : /Enter CSS selector/i,
      );
      await this.selectorInput.first().waitFor({
        state: 'visible',
        timeout: 10000,
      });

      // Changing selector type preserves the value but changes the input's
      // placeholder, so select the desired type before filling it.
      if (!(await selectorInput.isVisible())) {
        await this.page
          .getByRole('button', { name: isXPath ? 'XPath' : 'CSS', exact: true })
          .click();
      }
      await selectorInput.waitFor({ state: 'visible', timeout: 10000 });
      // The challenge state resets once after hydration. Keep the input and
      // React state aligned before relying on the product's disabled state.
      await expect
        .poll(async () => {
          if ((await selectorInput.inputValue()) !== codeOrSelector) {
            await selectorInput.fill('');
            await selectorInput.pressSequentially(codeOrSelector);
          }
          return selectorInput.inputValue();
        })
        .toBe(codeOrSelector);
      await expect(this.testSelectorButton).toBeEnabled();

      await this.testSelectorButton.click();
    } else {
      // Code Challenge
      // Wait for editor container to be stable
      await this.editor.waitFor({ state: 'visible', timeout: 10000 });

      // Monaco's visible area
      const viewLines = this.editor.locator('.view-lines');
      await viewLines.waitFor();
      const solution = codeOrSelector.trim();

      // Resolve the same AMD Monaco instance that owns the rendered editor.
      // This updates the editor through its public API and avoids
      // OS-specific modifier or clipboard shortcuts entirely.
      await viewLines.click();
      await this.page.evaluate((value) => {
        const amdRequire = window.require;
        if (!amdRequire) throw new Error('Monaco AMD loader is not available.');

        return new Promise<void>((resolve, reject) => {
          amdRequire(
            ['vs/editor/editor.main'],
            (loaded) => {
              const monaco = 'm' in loaded ? loaded.m : loaded;
              const editorElement = document.querySelector('.monaco-editor');
              const editor = monaco.editor
                .getEditors()
                .find((candidate) => candidate.getDomNode() === editorElement);
              if (!editor) {
                reject(
                  new Error(
                    'Rendered Monaco editor instance is not available.',
                  ),
                );
                return;
              }
              editor.setValue(value);
              resolve();
            },
            reject,
          );
        });
      }, solution);
      await expect
        .poll(() =>
          this.page.evaluate(() => {
            const amdRequire = window.require;
            if (!amdRequire) return '';
            return new Promise<string>((resolve, reject) => {
              amdRequire(
                ['vs/editor/editor.main'],
                (loaded) => {
                  const monaco = 'm' in loaded ? loaded.m : loaded;
                  const editorElement =
                    document.querySelector('.monaco-editor');
                  const editor = monaco.editor
                    .getEditors()
                    .find(
                      (candidate) => candidate.getDomNode() === editorElement,
                    );
                  resolve(editor?.getValue() ?? '');
                },
                reject,
              );
            });
          }),
        )
        .toBe(solution);

      // Run
      await this.runButton.click();
    }

    // Wait for validation success
    // "Correct" badge might be in results or toast, but Submit button becoming enabled is the ultimate proof.
    // We verify Submit button first.
    await expect(this.submitButton).toBeEnabled({ timeout: 20000 });

    // Submit
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    await this.submitButton.click();

    await expect(this.page.getByRole('dialog')).toContainText(
      /Challenge Complete!/i,
      {
        timeout: 20000,
      },
    );
  }
}
