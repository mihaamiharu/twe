import type { ExpectResult } from './executor.types';

/**
 * Create a simple expect function for assertions
 * Returns both the expect function and assert count getter
 */
/**
 * Create a simple expect function for assertions
 * Returns both the expect function and assert count getter
 */
export function createExpect(options?: { timeout?: number }): ExpectResult {
    let assertionCount = 0;
    const testResults: Array<{ message: string; passed: boolean }> = [];
    const defaultTimeout = options?.timeout ?? 5000;

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

        /**
         * Web-first assertions helper that polls until passing or timeout.
         */
        const poll = async (
            assertion: () => Promise<{ pass: boolean; message: string }> | { pass: boolean; message: string },
            options?: { timeout?: number }
        ) => {
            const timeout = options?.timeout ?? defaultTimeout;
            const startTime = Date.now();
            let lastResult: { pass: boolean; message: string } | null = null;

            while (Date.now() - startTime < timeout) {
                const result = await assertion();
                // Invert if isNot is true
                const finalPass = isNot ? !result.pass : result.pass;
                if (finalPass) {
                    handleResult(true, result.message);
                    return;
                }
                lastResult = result;
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Timeout reached, fail with last result
            const finalResult = lastResult || await assertion();
            handleResult(isNot ? !finalResult.pass : finalResult.pass, finalResult.message);
        };

        return {
            async toHaveText(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let text = '';
                    if (actual && typeof actual.textContent === 'function') {
                        text = (await actual.textContent()) || '';
                    } else if (actual instanceof HTMLElement) {
                        text = actual.textContent || '';
                    } else {
                        text = String(actual);
                    }
                    const pass = expected instanceof RegExp ? expected.test(text) : text === expected;
                    return {
                        pass,
                        message: `Expected text "${text}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toContainText(expected: string, options?: { timeout?: number }) {
                await poll(async () => {
                    let text = '';
                    if (actual && typeof actual.textContent === 'function') {
                        text = (await actual.textContent()) || '';
                    } else if (actual instanceof HTMLElement) {
                        text = actual.textContent || '';
                    } else {
                        text = String(actual);
                    }
                    return {
                        pass: text.includes(expected),
                        message: `Expected text "${text}" ${isNot ? 'NOT ' : ''}to contain "${expected}"`
                    };
                }, options);
            },

            async toHaveValue(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
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
                    return {
                        pass,
                        message: `Expected value "${value}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toHaveAttribute(name: string, value?: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let attrValue: string | null = null;
                    if (actual && typeof actual.getAttribute === 'function') {
                        attrValue = await actual.getAttribute(name);
                    } else if (actual instanceof HTMLElement) {
                        attrValue = actual.getAttribute(name);
                    }

                    if (attrValue === null) {
                        return { pass: false, message: `Expected attribute "${name}" to exist` };
                    }

                    if (value !== undefined) {
                        const pass = value instanceof RegExp ? value.test(attrValue) : attrValue === value;
                        return {
                            pass,
                            message: `Expected attribute "${name}" ${isNot ? 'NOT ' : ''}to have value "${value}", got "${attrValue}"`
                        };
                    }
                    return { pass: true, message: '' };
                }, options);
            },

            async toHaveCount(expected: number, options?: { timeout?: number }) {
                await poll(async () => {
                    let count = 0;
                    if (actual && typeof actual.count === 'function') {
                        count = await actual.count();
                    } else if (Array.isArray(actual)) {
                        count = actual.length;
                    }
                    return {
                        pass: count === expected,
                        message: `Expected count ${expected}, got ${count}`
                    };
                }, options);
            },

            async toBeVisible(options?: { timeout?: number }) {
                await poll(async () => {
                    let visible = false;
                    if (actual && typeof actual.isVisible === 'function') {
                        visible = await actual.isVisible();
                    } else if (actual instanceof HTMLElement) {
                        visible = actual.style.display !== 'none';
                    }
                    return {
                        pass: visible,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be visible`
                    };
                }, options);
            },

            async toBeChecked(options?: { timeout?: number }) {
                await poll(async () => {
                    let checked = false;
                    if (actual && typeof actual.isChecked === 'function') {
                        checked = await actual.isChecked();
                    }
                    return {
                        pass: checked,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be checked`
                    };
                }, options);
            },

            async toBeEnabled(options?: { timeout?: number }) {
                await poll(async () => {
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    return {
                        pass: !disabled,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be enabled`
                    };
                }, options);
            },

            async toBeDisabled(options?: { timeout?: number }) {
                await poll(async () => {
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    return {
                        pass: disabled,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be disabled`
                    };
                }, options);
            },

            async toBeEditable(options?: { timeout?: number }) {
                await poll(async () => {
                    let editable = false;
                    if (actual && typeof actual.isEditable === 'function') {
                        editable = await actual.isEditable();
                    }
                    return {
                        pass: editable,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be editable`
                    };
                }, options);
            },

            async toHaveTitle(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let title = '';
                    if (actual && typeof actual.title === 'function') {
                        title = await actual.title();
                    } else if (actual && actual.targetDocument) {
                        title = actual.targetDocument.title;
                    } else if (typeof actual === 'string') {
                        title = actual;
                    }
                    const pass = expected instanceof RegExp ? expected.test(title) : title === expected;
                    return {
                        pass,
                        message: `Expected title "${title}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toHaveURL(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let url = '';
                    if (actual && typeof actual.url === 'function') {
                        url = actual.url();
                    } else if (typeof actual === 'string') {
                        url = actual;
                    }
                    const pass = expected instanceof RegExp ? expected.test(url) : url === expected;
                    return {
                        pass,
                        message: `Expected URL "${url}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toHaveClass(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let className = '';
                    if (actual && typeof actual.getAttribute === 'function') {
                        className = (await actual.getAttribute('class')) || '';
                    } else if (actual instanceof HTMLElement) {
                        className = actual.className;
                    }
                    const pass = expected instanceof RegExp ? expected.test(className) : className === expected;
                    return {
                        pass,
                        message: `Expected class "${className}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toBeFocused(options?: { timeout?: number }) {
                await poll(async () => {
                    let isFocused = false;
                    if (actual && typeof actual.evaluate === 'function') {
                        isFocused = await actual.evaluate((el: any) => el === el.ownerDocument.activeElement);
                    } else if (actual instanceof HTMLElement) {
                        isFocused = actual === actual.ownerDocument.activeElement;
                    }
                    return {
                        pass: isFocused,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be focused`
                    };
                }, options);
            },

            async toBeEmpty(options?: { timeout?: number }) {
                await poll(async () => {
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
                    return {
                        pass: isEmpty,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be empty`
                    };
                }, options);
            },

            async toBeHidden(options?: { timeout?: number }) {
                await poll(async () => {
                    let visible = false;
                    if (actual && typeof actual.isVisible === 'function') {
                        visible = await actual.isVisible();
                    } else if (actual instanceof HTMLElement) {
                        visible = actual.style.display !== 'none';
                    }
                    return {
                        pass: !visible,
                        message: `Expected element ${isNot ? 'NOT ' : ''}to be hidden`
                    };
                }, options);
            },

            async toBeTruthy() {
                await Promise.resolve();
                handleResult(!!actual, `Expected value ${isNot ? 'NOT ' : ''}to be truthy, got ${actual}`);
            },

            async toBeFalsy() {
                await Promise.resolve();
                handleResult(!actual, `Expected value ${isNot ? 'NOT ' : ''}to be falsy, got ${actual}`);
            },

            async toBeNull() {
                await Promise.resolve();
                handleResult(actual === null, `Expected value ${isNot ? 'NOT ' : ''}to be null, got ${actual}`);
            },

            async toBeUndefined() {
                await Promise.resolve();
                handleResult(actual === undefined, `Expected value ${isNot ? 'NOT ' : ''}to be undefined, got ${actual}`);
            },

            async toBeDefined() {
                await Promise.resolve();
                handleResult(actual !== undefined, `Expected value ${isNot ? 'NOT ' : ''}to be defined`);
            },

            async toBeGreaterThan(expected: number) {
                await Promise.resolve();
                handleResult(actual > expected, `Expected ${actual} ${isNot ? 'NOT ' : ''}to be greater than ${expected}`);
            },

            async toBeGreaterThanOrEqual(expected: number) {
                await Promise.resolve();
                handleResult(actual >= expected, `Expected ${actual} ${isNot ? 'NOT ' : ''}to be greater than or equal to ${expected}`);
            },

            async toBeLessThan(expected: number) {
                await Promise.resolve();
                handleResult(actual < expected, `Expected ${actual} ${isNot ? 'NOT ' : ''}to be less than ${expected}`);
            },

            async toBeLessThanOrEqual(expected: number) {
                await Promise.resolve();
                handleResult(actual <= expected, `Expected ${actual} ${isNot ? 'NOT ' : ''}to be less than or equal to ${expected}`);
            },

            async toBeCloseTo(expected: number, precision = 2) {
                await Promise.resolve();
                const pass = Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
                handleResult(pass, `Expected ${actual} ${isNot ? 'NOT ' : ''}to be close to ${expected} with precision ${precision}`);
            },

            async toContain(expected: any) {
                await Promise.resolve();
                let pass = false;
                if (Array.isArray(actual) || typeof actual === 'string') {
                    pass = actual.includes(expected);
                } else if (actual instanceof Set || actual instanceof Map) {
                    pass = actual.has(expected);
                }
                handleResult(pass, `Expected ${actual} ${isNot ? 'NOT ' : ''}to contain ${expected}`);
            },

            async toHaveLength(expected: number) {
                await Promise.resolve();
                const length = actual?.length ?? (actual?.size ?? 0);
                handleResult(length === expected, `Expected length ${expected}, got ${length}`);
            },

            async toMatch(expected: string | RegExp) {
                await Promise.resolve();
                const pass = expected instanceof RegExp ? expected.test(String(actual)) : String(actual).includes(expected);
                handleResult(pass, `Expected "${actual}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toHaveProperty(path: string, value?: any) {
                await Promise.resolve();
                // Simple dot-notation path resolver
                const parts = path.split('.');
                let current = actual;
                let found = true;
                for (const part of parts) {
                    if (current === null || current === undefined || typeof current !== 'object' || !(part in current)) {
                        found = false;
                        break;
                    }
                    current = current[part];
                }

                if (!found) {
                    handleResult(false, `Property "${path}" not found`);
                    return;
                }

                if (value !== undefined) {
                    const pass = JSON.stringify(current) === JSON.stringify(value);
                    handleResult(pass, `Expected property "${path}" to equal ${JSON.stringify(value)}, got ${JSON.stringify(current)}`);
                } else {
                    handleResult(true, `Property "${path}" exists`);
                }
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
