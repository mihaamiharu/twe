/**
 * Selector Validator
 * 
 * Validates CSS selectors and XPath expressions for the selector challenges.
 * Provides utilities for testing selectors against HTML content.
 */

export type SelectorType = 'css' | 'xpath';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    matchCount?: number;
}

export interface SelectorTestResult {
    isCorrect: boolean;
    userMatchCount: number;
    expectedMatchCount: number;
    feedback: string;
}

/**
 * Validate a CSS selector syntax
 */
export function validateCSSSelector(selector: string): ValidationResult {
    if (!selector || selector.trim() === '') {
        return { isValid: false, error: 'Selector cannot be empty' };
    }

    try {
        // Use a temporary document to test the selector
        if (typeof document !== 'undefined') {
            document.createElement('div').querySelector(selector);
        } else {
            // Simple regex validation for server-side
            // This catches obvious errors but isn't comprehensive
            const invalidPatterns = [
                /^[^a-zA-Z#.[*]/, // Must start with valid character
                /\[\s*$/, // Unclosed bracket
                /\(\s*$/, // Unclosed parenthesis
                /^##/, // Double hash
                /^\.\./,  // Double dot at start
                /\s{2,}(?![+~>])/, // Multiple spaces not followed by combinator
            ];

            for (const pattern of invalidPatterns) {
                if (pattern.test(selector)) {
                    return { isValid: false, error: 'Invalid CSS selector syntax' };
                }
            }
        }
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Invalid CSS selector'
        };
    }
}

/**
 * Validate an XPath expression syntax
 */
export function validateXPath(xpath: string): ValidationResult {
    if (!xpath || xpath.trim() === '') {
        return { isValid: false, error: 'XPath cannot be empty' };
    }

    try {
        if (typeof document !== 'undefined') {
            // Try to evaluate the XPath
            document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
        } else {
            // Simple validation for server-side
            const invalidPatterns = [
                /^\s*$/, // Empty or whitespace only
                /\[(?![^\]]*\])/, // Unclosed bracket
                /^[^/]/, // Must start with /
            ];

            for (const pattern of invalidPatterns) {
                if (pattern.test(xpath)) {
                    return { isValid: false, error: 'Invalid XPath syntax' };
                }
            }

            // Check for balanced brackets and parentheses
            const openBrackets = (xpath.match(/\[/g) || []).length;
            const closeBrackets = (xpath.match(/\]/g) || []).length;
            const openParens = (xpath.match(/\(/g) || []).length;
            const closeParens = (xpath.match(/\)/g) || []).length;

            if (openBrackets !== closeBrackets) {
                return { isValid: false, error: 'Unbalanced brackets in XPath' };
            }
            if (openParens !== closeParens) {
                return { isValid: false, error: 'Unbalanced parentheses in XPath' };
            }
        }
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Invalid XPath expression'
        };
    }
}

/**
 * Validate a selector based on its type
 */
export function validateSelector(
    selector: string,
    type: SelectorType
): ValidationResult {
    return type === 'css'
        ? validateCSSSelector(selector)
        : validateXPath(selector);
}

/**
 * Test a CSS selector against an HTML element/document
 */
export function testCSSSelector(
    selector: string,
    container: Element | Document
): { matches: Element[]; count: number } {
    try {
        const matches = Array.from(container.querySelectorAll(selector));
        return { matches, count: matches.length };
    } catch {
        return { matches: [], count: 0 };
    }
}

/**
 * Test an XPath expression against an HTML document
 */
export function testXPath(
    xpath: string,
    container: Document | Element
): { matches: Node[]; count: number } {
    try {
        const doc = container instanceof Document ? container : container.ownerDocument;
        if (!doc) return { matches: [], count: 0 };

        const result = doc.evaluate(
            xpath,
            container,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );

        const matches: Node[] = [];
        for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i);
            if (node) matches.push(node);
        }

        return { matches, count: matches.length };
    } catch {
        return { matches: [], count: 0 };
    }
}

/**
 * Test a selector and compare against expected result
 */
export function testSelectorAgainstTarget(
    userSelector: string,
    selectorType: SelectorType,
    container: Element | Document,
    expectedSelector: string | string[],
    targetElementId?: string
): SelectorTestResult {
    // First validate the user's selector
    const validation = validateSelector(userSelector, selectorType);
    if (!validation.isValid) {
        return {
            isCorrect: false,
            userMatchCount: 0,
            expectedMatchCount: 0,
            feedback: validation.error || 'Invalid selector syntax',
        };
    }

    // Get expected selectors as array
    const expectedSelectors = Array.isArray(expectedSelector)
        ? expectedSelector
        : [expectedSelector];

    // Get user's matched elements
    let userMatches: Element[] | Node[] = [];
    let userCount = 0;

    if (selectorType === 'css') {
        const result = testCSSSelector(userSelector, container);
        userMatches = result.matches;
        userCount = result.count;
    } else {
        const doc = container instanceof Document ? container : container.ownerDocument;
        if (doc) {
            const result = testXPath(userSelector, container);
            userMatches = result.matches;
            userCount = result.count;
        }
    }

    // If target element ID provided, check if it matches
    if (targetElementId) {
        const targetElement = (container instanceof Document ? container : container.ownerDocument)
            ?.getElementById(targetElementId);

        if (targetElement) {
            const matchesTarget = userMatches.some(
                match => match === targetElement || (match as Element).id === targetElementId
            );

            if (userCount === 0) {
                return {
                    isCorrect: false,
                    userMatchCount: 0,
                    expectedMatchCount: 1,
                    feedback: 'Your selector did not match any elements. Try a different approach.',
                };
            }

            if (!matchesTarget) {
                return {
                    isCorrect: false,
                    userMatchCount: userCount,
                    expectedMatchCount: 1,
                    feedback: `Your selector matched ${userCount} element(s), but not the target element.`,
                };
            }

            if (userCount > 1) {
                return {
                    isCorrect: false,
                    userMatchCount: userCount,
                    expectedMatchCount: 1,
                    feedback: `Your selector matches ${userCount} elements. Make it more specific to match only the target.`,
                };
            }

            return {
                isCorrect: true,
                userMatchCount: 1,
                expectedMatchCount: 1,
                feedback: 'Perfect! Your selector uniquely identifies the target element.',
            };
        }
    }

    // Compare with expected selectors
    for (const expected of expectedSelectors) {
        let expectedMatches: Element[] | Node[] = [];

        if (selectorType === 'css') {
            expectedMatches = testCSSSelector(expected, container).matches;
        } else {
            const doc = container instanceof Document ? container : container.ownerDocument;
            if (doc) {
                expectedMatches = testXPath(expected, container).matches;
            }
        }

        // Check if user's matches are the same as expected
        if (userCount === expectedMatches.length) {
            const allMatch = userMatches.every(match =>
                expectedMatches.some(exp => exp === match)
            );

            if (allMatch) {
                return {
                    isCorrect: true,
                    userMatchCount: userCount,
                    expectedMatchCount: expectedMatches.length,
                    feedback: 'Correct! Your selector matches the expected elements.',
                };
            }
        }
    }

    // Get expected count for feedback
    let expectedCount = 0;
    if (selectorType === 'css') {
        expectedCount = testCSSSelector(expectedSelectors[0], container).count;
    } else {
        const doc = container instanceof Document ? container : container.ownerDocument;
        if (doc) {
            expectedCount = testXPath(expectedSelectors[0], container).count;
        }
    }

    if (userCount === 0) {
        return {
            isCorrect: false,
            userMatchCount: 0,
            expectedMatchCount: expectedCount,
            feedback: 'Your selector did not match any elements.',
        };
    }

    if (userCount !== expectedCount) {
        return {
            isCorrect: false,
            userMatchCount: userCount,
            expectedMatchCount: expectedCount,
            feedback: `Your selector matched ${userCount} element(s), but should match ${expectedCount}.`,
        };
    }

    return {
        isCorrect: false,
        userMatchCount: userCount,
        expectedMatchCount: expectedCount,
        feedback: 'Your selector matches a different set of elements than expected.',
    };
}

/**
 * Generate hints for common selector mistakes
 */
export function generateSelectorHint(
    userSelector: string,
    selectorType: SelectorType,
    matchCount: number,
    expectedCount: number
): string[] {
    const hints: string[] = [];

    if (matchCount === 0) {
        if (selectorType === 'css') {
            hints.push('Check for typos in class names or IDs');
            hints.push('Try using browser DevTools to inspect the element');
            if (!userSelector.includes('.') && !userSelector.includes('#')) {
                hints.push('Consider using a class (.) or ID (#) selector');
            }
        } else {
            hints.push('Make sure your XPath starts with // or /');
            hints.push('Check that element names are lowercase');
            hints.push('Verify attribute names and values are correct');
        }
    } else if (matchCount > expectedCount) {
        hints.push('Your selector is too broad - try to be more specific');
        if (selectorType === 'css') {
            hints.push('Add more specificity with classes, IDs, or attribute selectors');
            hints.push('Use child (>) or descendant selectors to narrow down');
        } else {
            hints.push('Add predicates like [1] or [@attribute="value"]');
            hints.push('Use more specific path expressions');
        }
    } else if (matchCount < expectedCount) {
        hints.push('Your selector is too specific - try a broader approach');
    }

    return hints;
}
