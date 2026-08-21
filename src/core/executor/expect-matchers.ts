import type {
    ExpectFunction,
    ExpectMatchers,
    ExpectResult,
} from './executor.types';

function getMethod(
    value: unknown,
    name: string,
): ((...args: unknown[]) => unknown) | undefined {
    if (
        (typeof value !== 'object' && typeof value !== 'function') ||
        value === null
    ) {
        return undefined;
    }
    const method: unknown = Reflect.get(value, name);
    if (typeof method !== 'function') return undefined;
    return (...args: unknown[]) => {
        const result: unknown = Reflect.apply(method, value, args);
        return result;
    };
}

function getProperty(value: unknown, name: string): unknown {
    if (
        (typeof value !== 'object' && typeof value !== 'function') ||
        value === null
    ) {
        return undefined;
    }
    return Reflect.get(value, name);
}

function stringifyText(value: unknown): string {
    if (!value) return '';
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint' ||
        typeof value === 'boolean' ||
        typeof value === 'symbol'
    ) {
        return String(value);
    }

    const toString = getMethod(value, 'toString');
    if (!toString) return '';
    const result = toString();
    return typeof result === 'string' ? result : '';
}

/**
 * Create a simple expect function for assertions
 * Returns both the expect function and assert count getter
 */
export function createExpect(options?: { timeout?: number; deadline?: number }): ExpectResult {
    let assertionCount = 0;
    const testResults: Array<{ message: string; passed: boolean }> = [];
    const defaultTimeout = options?.timeout ?? 5000;
    const globalDeadline = options?.deadline;

    const incrementCount = () => {
        assertionCount++;
        console.log(`[Expect] Assertion count incremented to ${assertionCount}`);
    };
    const getAssertionCount = () => assertionCount;
    const getTestResults = () => testResults;

    const createMatchers = (
        actual: unknown,
        isSoft = false,
        isNot = false,
    ): Omit<ExpectMatchers, 'not'> => {
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
            options?: { timeout?: number; deadline?: number }
        ) => {
            const timeout = options?.timeout ?? defaultTimeout;
            const pollDeadline = options?.deadline ?? globalDeadline;
            const startTime = Date.now();
            let lastResult: { pass: boolean; message: string } | null = null;

            while (Date.now() - startTime < timeout) {
                // If we have a global or specific deadline, don't exceed it
                if (pollDeadline && Date.now() >= pollDeadline) {
                    break;
                }
                try {
                    const result = await assertion();
                    // Invert if isNot is true to determine if we should stop polling
                    const finalPass = isNot ? !result.pass : result.pass;
                    if (finalPass) {
                        // Pass the raw result to handleResult, it will invert it again properly
                        handleResult(result.pass, result.message);
                        return;
                    }
                    lastResult = result;
                } catch (e) {
                    // Ignore transient errors during polling (e.g. element detached)
                    lastResult = { pass: false, message: e instanceof Error ? e.message : String(e) };
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Timeout reached, fail with last result
            if (!lastResult) {
                try {
                    lastResult = await assertion();
                } catch (e) {
                    lastResult = { pass: false, message: e instanceof Error ? e.message : String(e) };
                }
            }
            handleResult(lastResult.pass, lastResult.message);
        };

        return {
            async toHaveText(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let text = '';
                    try {
                        const textContent = getMethod(actual, 'textContent');
                        if (textContent) {
                            const result = await textContent();
                            text = typeof result === 'string' ? result : '';
                        } else if (actual instanceof HTMLElement) {
                            text = actual.textContent || '';
                        } else {
                            text = stringifyText(actual);
                        }
                    } catch {
                        // Element might be missing
                        text = '';
                    }

                    const pass = expected instanceof RegExp ? expected.test(text) : text === expected;
                    return {
                        pass,
                        message: `Expected text "${text}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toContainText(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let text = '';
                    try {
                        const textContent = getMethod(actual, 'textContent');
                        if (textContent) {
                            const result = await textContent();
                            text = typeof result === 'string' ? result : '';
                        } else if (actual instanceof HTMLElement) {
                            text = actual.textContent || '';
                        } else {
                            text = stringifyText(actual);
                        }
                    } catch {
                        text = '';
                    }

                    // Handle RegExp for toContainText (uncommon but possible)
                    if (expected instanceof RegExp) {
                        return {
                            pass: expected.test(text),
                            message: `Expected text "${text}" ${isNot ? 'NOT ' : ''}to contain regex "${expected}"`
                        };
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
                    try {
                        const inputValue = getMethod(actual, 'inputValue');
                        if (inputValue) {
                            const result = await inputValue();
                            value = typeof result === 'string' ? result : '';
                        } else if (
                            actual instanceof HTMLInputElement ||
                            actual instanceof HTMLTextAreaElement ||
                            actual instanceof HTMLSelectElement ||
                            actual instanceof HTMLButtonElement
                        ) {
                            value = actual.value || '';
                        }
                    } catch {
                        value = '';
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
                    try {
                        const getAttribute = getMethod(actual, 'getAttribute');
                        if (getAttribute) {
                            const result = await getAttribute(name);
                            attrValue = typeof result === 'string' ? result : null;
                        } else if (actual instanceof HTMLElement) {
                            attrValue = actual.getAttribute(name);
                        }
                    } catch {
                        attrValue = null;
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
                    const countMethod = getMethod(actual, 'count');
                    if (countMethod) {
                        const result = await countMethod();
                        count = typeof result === 'number' ? result : 0;
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
                    const isVisible = getMethod(actual, 'isVisible');
                    if (isVisible) {
                        visible = Boolean(await isVisible());
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
                    const isChecked = getMethod(actual, 'isChecked');
                    if (isChecked) {
                        checked = Boolean(await isChecked());
                    } else if (actual instanceof HTMLInputElement) {
                        checked = actual.checked;
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
                    const isDisabled = getMethod(actual, 'isDisabled');
                    if (isDisabled) {
                        disabled = Boolean(await isDisabled());
                    } else if (
                        actual instanceof HTMLButtonElement ||
                        actual instanceof HTMLInputElement ||
                        actual instanceof HTMLSelectElement ||
                        actual instanceof HTMLTextAreaElement
                    ) {
                        disabled = actual.disabled;
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
                    const isDisabled = getMethod(actual, 'isDisabled');
                    if (isDisabled) {
                        disabled = Boolean(await isDisabled());
                    } else if (
                        actual instanceof HTMLButtonElement ||
                        actual instanceof HTMLInputElement ||
                        actual instanceof HTMLSelectElement ||
                        actual instanceof HTMLTextAreaElement
                    ) {
                        disabled = actual.disabled;
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
                    const isEditable = getMethod(actual, 'isEditable');
                    if (isEditable) {
                        editable = Boolean(await isEditable());
                    } else if (actual instanceof HTMLInputElement || actual instanceof HTMLTextAreaElement) {
                        editable = !actual.readOnly && !actual.disabled;
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
                    const titleMethod = getMethod(actual, 'title');
                    if (titleMethod) {
                        const result = await titleMethod();
                        title = typeof result === 'string' ? result : '';
                    } else {
                        const targetDocument = getProperty(actual, 'targetDocument');
                        if (targetDocument instanceof Document) {
                            title = targetDocument.title;
                        } else if (typeof actual === 'string') {
                            title = actual;
                        }
                    }
                    const pass = expected instanceof RegExp ? expected.test(title) : title === expected;
                    return {
                        pass,
                        message: `Expected title "${title}" ${isNot ? 'NOT ' : ''}to match "${expected}"`
                    };
                }, options);
            },

            async toHaveURL(expected: string | RegExp, options?: { timeout?: number }) {
                await poll(() => {
                    let url = '';
                    const urlMethod = getMethod(actual, 'url');
                    if (urlMethod) {
                        const result = urlMethod();
                        url = typeof result === 'string' ? result : '';
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
                    const getAttribute = getMethod(actual, 'getAttribute');
                    if (getAttribute) {
                        const result = await getAttribute('class');
                        className = typeof result === 'string' ? result : '';
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

            async toHaveCSS(name: string, value: string | RegExp, options?: { timeout?: number }) {
                await poll(async () => {
                    let cssValue = '';
                    const evaluate = getMethod(actual, 'evaluate');
                    if (evaluate) {
                        const result = await evaluate((el: HTMLElement, name: string) => {
                            return window.getComputedStyle(el).getPropertyValue(name);
                        }, name);
                        cssValue = typeof result === 'string' ? result : '';
                    } else if (actual instanceof HTMLElement) {
                        cssValue = window.getComputedStyle(actual).getPropertyValue(name);
                    }
                    const pass = value instanceof RegExp ? value.test(cssValue) : cssValue === value;
                    return {
                        pass,
                        message: `Expected CSS property "${name}" to be "${value}", got "${cssValue}"`
                    };
                }, options);
            },

            async toHaveJSProperty(name: string, value: unknown, options?: { timeout?: number }) {
                await poll(async () => {
                    let propValue: unknown;
                    const evaluate = getMethod(actual, 'evaluate');
                    if (evaluate) {
                        propValue = await evaluate(
                            (element: unknown, propertyName: string) =>
                                getProperty(element, propertyName),
                            name,
                        );
                    } else if (actual) {
                        propValue = getProperty(actual, name);
                    }
                    const pass = JSON.stringify(propValue) === JSON.stringify(value);
                    return {
                        pass,
                        message: `Expected JS property "${name}" to be ${JSON.stringify(value)}, got ${JSON.stringify(propValue)}`
                    };
                }, options);
            },

            async toBeFocused(options?: { timeout?: number }) {
                await poll(async () => {
                    let isFocused = false;
                    const evaluate = getMethod(actual, 'evaluate');
                    if (evaluate) {
                        isFocused = Boolean(await evaluate(
                            (element: HTMLElement) =>
                                element === element.ownerDocument.activeElement,
                        ));
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
                    const evaluate = getMethod(actual, 'evaluate');
                    if (evaluate) {
                        isEmpty = Boolean(await evaluate((el: HTMLElement) => {
                            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return !(el as HTMLInputElement).value;
                            return !el.textContent;
                        }));
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
                    const isVisible = getMethod(actual, 'isVisible');
                    if (isVisible) {
                        visible = Boolean(await isVisible());
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
                handleResult(!!actual, `Expected value ${isNot ? 'NOT ' : ''}to be truthy, got ${String(actual)}`);
            },

            async toBeFalsy() {
                await Promise.resolve();
                handleResult(!actual, `Expected value ${isNot ? 'NOT ' : ''}to be falsy, got ${String(actual)}`);
            },

            async toBeNull() {
                await Promise.resolve();
                handleResult(actual === null, `Expected value ${isNot ? 'NOT ' : ''}to be null, got ${String(actual)}`);
            },

            async toBeUndefined() {
                await Promise.resolve();
                handleResult(actual === undefined, `Expected value ${isNot ? 'NOT ' : ''}to be undefined, got ${String(actual)}`);
            },

            async toBeDefined() {
                await Promise.resolve();
                handleResult(actual !== undefined, `Expected value ${isNot ? 'NOT ' : ''}to be defined`);
            },

            async toBeGreaterThan(expected: number) {
                await Promise.resolve();
                handleResult(typeof actual === 'number' && actual > expected, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to be greater than ${expected}`);
            },

            async toBeGreaterThanOrEqual(expected: number) {
                await Promise.resolve();
                handleResult(typeof actual === 'number' && actual >= expected, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to be greater than or equal to ${expected}`);
            },

            async toBeLessThan(expected: number) {
                await Promise.resolve();
                handleResult(typeof actual === 'number' && actual < expected, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to be less than ${expected}`);
            },

            async toBeLessThanOrEqual(expected: number) {
                await Promise.resolve();
                handleResult(typeof actual === 'number' && actual <= expected, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to be less than or equal to ${expected}`);
            },

            async toBeCloseTo(expected: number, precision = 2) {
                await Promise.resolve();
                const pass = typeof actual === 'number' && Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
                handleResult(pass, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to be close to ${expected} with precision ${precision}`);
            },

            async toContain(expected: unknown) {
                await Promise.resolve();
                let pass = false;
                if (typeof actual === 'string' && typeof expected === 'string') {
                    pass = actual.includes(expected);
                } else if (Array.isArray(actual)) {
                    pass = actual.includes(expected);
                } else if (actual instanceof Set || actual instanceof Map) {
                    pass = actual.has(expected);
                }
                handleResult(pass, `Expected ${String(actual)} ${isNot ? 'NOT ' : ''}to contain ${String(expected)}`);
            },

            async toHaveLength(expected: number) {
                await Promise.resolve();
                let length = 0;
                if (typeof actual === 'string' || Array.isArray(actual)) {
                    length = actual.length;
                } else if (actual instanceof Set || actual instanceof Map) {
                    length = actual.size;
                } else {
                    const lengthValue = getProperty(actual, 'length');
                    const sizeValue = getProperty(actual, 'size');
                    length = typeof lengthValue === 'number'
                        ? lengthValue
                        : typeof sizeValue === 'number'
                            ? sizeValue
                            : 0;
                }
                handleResult(length === expected, `Expected length ${expected}, got ${length}`);
            },

            async toMatch(expected: string | RegExp) {
                await Promise.resolve();
                const pass = expected instanceof RegExp ? expected.test(String(actual)) : String(actual).includes(expected);
                handleResult(pass, `Expected "${String(actual)}" ${isNot ? 'NOT ' : ''}to match "${expected}"`);
            },

            async toHaveProperty(path: string, value?: unknown) {
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
                    current = Reflect.get(current, part);
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
                handleResult(actual === expected, `Expected ${String(expected)}, got ${String(actual)}`);
            },
            async toEqual(expected: unknown) {
                await Promise.resolve();
                handleResult(JSON.stringify(actual) === JSON.stringify(expected), `Expected equal`);
            },
        };
    };

    const createExpectation = (
        actual: unknown,
        isSoft: boolean,
    ): ExpectMatchers => ({
        ...createMatchers(actual, isSoft, false),
        not: createMatchers(actual, isSoft, true),
    });

    const expectFunc: ExpectFunction = (actual) =>
        createExpectation(actual, false);

    expectFunc.soft = (actual) => createExpectation(actual, true);

    return { expect: expectFunc, getAssertionCount, getTestResults };
}
