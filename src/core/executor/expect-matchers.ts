import type { ExpectResult } from './executor.types';

/**
 * Create a simple expect function for assertions
 * Returns both the expect function and assert count getter
 */
export function createExpect(): ExpectResult {
    let assertionCount = 0;
    const testResults: Array<{ message: string; passed: boolean }> = [];

    const incrementCount = () => {
        assertionCount++;
    };
    const getAssertionCount = () => assertionCount;
    const getTestResults = () => testResults;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-return */
    const createMatchers = (actual: any, isSoft = false, isNot = false) => {
        const handleResult = (pass: boolean, message: string) => {
            incrementCount();
            // Invert if isNot is true
            const finalPass = isNot ? !pass : pass;
            const finalMessage = isNot ? `Not Error: ${message}` : message;

            if (!finalPass) {
                if (isSoft) {
                    const formattedMessage = finalMessage.includes('Expected')
                        ? `Soft Assertion Failed: ${finalMessage}`
                        : `Soft Assertion Failed: ${finalMessage} (Actual value did not match expected criteria)`;
                    console.error(formattedMessage);
                    testResults.push({ message: formattedMessage, passed: false });
                } else {
                    const formattedMessage = finalMessage.includes('Expected')
                        ? `Assertion Error: ${finalMessage}`
                        : `Assertion Error: ${finalMessage} (Actual value did not match expected criteria)`;
                    throw new Error(formattedMessage);
                }
            }
        };

        return {
            async toHaveText(expected: string | RegExp) {
                let text = '';
                if (actual && typeof actual.textContent === 'function') {
                    text = (await actual.textContent()) || '';
                } else if (actual instanceof HTMLElement) {
                    text = actual.textContent || '';
                } else {
                    text = String(actual);
                }
                const pass = expected instanceof RegExp ? expected.test(text) : text === expected;
                handleResult(pass, `Expected text "${text}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toContainText(expected: string) {
                let text = '';
                if (actual && typeof actual.textContent === 'function') {
                    text = (await actual.textContent()) || '';
                } else if (actual instanceof HTMLElement) {
                    text = actual.textContent || '';
                } else {
                    text = String(actual);
                }
                handleResult(
                    text.includes(expected),
                    `Expected text "${text}" ${isNot ? 'NOT ' : ''}to contain "${expected}"`,
                );
            },

            async toHaveValue(expected: string | RegExp) {
                let value = '';
                if (actual && typeof actual.inputValue === 'function') {
                    value = await actual.inputValue();
                } else if (
                    actual instanceof HTMLInputElement ||
                    actual instanceof HTMLTextAreaElement ||
                    actual instanceof HTMLSelectElement
                ) {
                    value = actual.value;
                }
                const pass = expected instanceof RegExp ? expected.test(value) : value === expected;
                handleResult(pass, `Expected value "${value}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toHaveAttribute(name: string, value?: string | RegExp) {
                let attrValue: string | null = null;
                if (actual && typeof actual.getAttribute === 'function') {
                    attrValue = await actual.getAttribute(name);
                } else if (actual instanceof HTMLElement) {
                    attrValue = actual.getAttribute(name);
                }

                if (attrValue === null) {
                    handleResult(false, `Expected attribute "${name}" to exist`);
                    return;
                }

                if (value !== undefined) {
                    const pass = value instanceof RegExp ? value.test(attrValue) : attrValue === value;
                    handleResult(pass, `Expected attribute "${name}" ${isNot ? 'NOT ' : ''}to have value "${value}", got "${attrValue}"`);
                } else {
                    handleResult(true, '');
                }
            },

            async toHaveCount(expected: number) {
                let count = 0;
                if (actual && typeof actual.count === 'function') {
                    count = await actual.count();
                } else if (Array.isArray(actual)) {
                    count = actual.length;
                }
                handleResult(count === expected, `Expected count ${expected}, got ${count}`);
            },

            async toBeVisible() {
                await Promise.resolve();
                let visible = false;
                if (actual && typeof actual.isVisible === 'function') {
                    visible = await actual.isVisible();
                } else if (actual instanceof HTMLElement) {
                    visible = actual.style.display !== 'none';
                }
                handleResult(visible, `Expected element ${isNot ? 'NOT ' : ''}to be visible`);
            },

            async toBeChecked() {
                await Promise.resolve();
                let checked = false;
                if (actual && typeof actual.isChecked === 'function') {
                    checked = await actual.isChecked();
                }
                handleResult(checked, `Expected element ${isNot ? 'NOT ' : ''}to be checked`);
            },

            async toBeEnabled() {
                await Promise.resolve();
                let disabled = false;
                if (actual && typeof actual.isDisabled === 'function') {
                    disabled = await actual.isDisabled();
                }
                handleResult(!disabled, `Expected element ${isNot ? 'NOT ' : ''}to be enabled`);
            },

            async toBeDisabled() {
                await Promise.resolve();
                let disabled = false;
                if (actual && typeof actual.isDisabled === 'function') {
                    disabled = await actual.isDisabled();
                }
                handleResult(disabled, `Expected element ${isNot ? 'NOT ' : ''}to be disabled`);
            },

            async toBeEditable() {
                await Promise.resolve();
                let editable = false;
                if (actual && typeof actual.isEditable === 'function') {
                    editable = await actual.isEditable();
                }
                handleResult(editable, `Expected element ${isNot ? 'NOT ' : ''}to be editable`);
            },

            async toHaveTitle(expected: string | RegExp) {
                await Promise.resolve();
                let title = '';
                if (actual && typeof actual.title === 'function') {
                    title = await actual.title();
                } else if (actual && actual.targetDocument) {
                    title = actual.targetDocument.title;
                } else if (typeof actual === 'string') {
                    title = actual;
                }
                const pass = expected instanceof RegExp ? expected.test(title) : title === expected;
                handleResult(pass, `Expected title "${title}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toHaveURL(expected: string | RegExp) {
                await Promise.resolve();
                let url = '';
                if (actual && typeof actual.url === 'function') {
                    url = actual.url();
                } else if (typeof actual === 'string') {
                    url = actual;
                }
                const pass = expected instanceof RegExp ? expected.test(url) : url === expected;
                handleResult(pass, `Expected URL "${url}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toHaveClass(expected: string | RegExp) {
                let className = '';
                if (actual && typeof actual.getAttribute === 'function') {
                    className = (await actual.getAttribute('class')) || '';
                } else if (actual instanceof HTMLElement) {
                    className = actual.className;
                }
                const pass = expected instanceof RegExp ? expected.test(className) : className === expected;
                handleResult(pass, `Expected class "${className}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toBeFocused() {
                await Promise.resolve();
                let isFocused = false;
                if (actual && typeof actual.evaluate === 'function') {
                    isFocused = await actual.evaluate((el: any) => el === el.ownerDocument.activeElement);
                } else if (actual instanceof HTMLElement) {
                    isFocused = actual === actual.ownerDocument.activeElement;
                }
                handleResult(isFocused, `Expected element ${isNot ? 'NOT ' : ''}to be focused`);
            },

            async toBeEmpty() {
                let isEmpty = false;
                if (actual && typeof actual.evaluate === 'function') {
                    isEmpty = await actual.evaluate((el: HTMLElement) => {
                        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return !(el as HTMLInputElement).value;
                        return !el.textContent;
                    });
                } else if (actual instanceof HTMLElement) {
                    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(actual.tagName)) isEmpty = !(actual as HTMLInputElement).value;
                    else isEmpty = !actual.textContent;
                }
                handleResult(isEmpty, `Expected element ${isNot ? 'NOT ' : ''}to be empty`);
            },

            async toBeHidden() {
                await Promise.resolve();
                let visible = false;
                if (actual && typeof actual.isVisible === 'function') {
                    visible = await actual.isVisible();
                } else if (actual instanceof HTMLElement) {
                    visible = actual.style.display !== 'none';
                }
                handleResult(!visible, `Expected element ${isNot ? 'NOT ' : ''}to be hidden`);
            },

            async toBe(expected: unknown) {
                await Promise.resolve();
                handleResult(actual === expected, `Expected ${expected}, got ${actual}`);
            },
            async toEqual(expected: unknown) {
                await Promise.resolve();
                handleResult(JSON.stringify(actual) === JSON.stringify(expected), `Expected equal`);
            },
        };
    };

    const expectFunc = ((actual: any) => {
        const matchers: any = createMatchers(actual, false, false);
        matchers.not = createMatchers(actual, false, true);
        return matchers;
    }) as any;

    expectFunc.soft = (actual: any) => {
        const matchers: any = createMatchers(actual, true, false);
        matchers.not = createMatchers(actual, true, true);
        return matchers;
    };

    return { expect: expectFunc, getAssertionCount, getTestResults };
}
