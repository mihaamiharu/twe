import type { ExpectedStateRule } from '@/lib/content.types';

/**
 * Validate expected DOM state after code execution
 */
export function validateExpectedState(
    doc: Document,
    rules: ExpectedStateRule[]
): { passed: boolean; error?: string } {
    for (const rule of rules) {
        const elements = doc.querySelectorAll(rule.selector);

        // Check count
        if (rule.count !== undefined && elements.length !== rule.count) {
            return {
                passed: false,
                error: `Expected ${rule.count} element(s) for '${rule.selector}', found ${elements.length}`,
            };
        }

        // Check visible (at least one element exists)
        if (rule.visible && elements.length === 0) {
            return {
                passed: false,
                error: `Expected '${rule.selector}' to be visible, but it was not found`,
            };
        }

        // Check hidden (no elements)
        if (rule.hidden && elements.length > 0) {
            return {
                passed: false,
                error: `Expected '${rule.selector}' to be hidden, but it was visible`,
            };
        }

        // Check containsText
        if (rule.containsText && elements.length > 0) {
            const text = elements[0]?.textContent || '';
            if (!text.includes(rule.containsText)) {
                return {
                    passed: false,
                    error: `Expected '${rule.selector}' to contain "${rule.containsText}", but got "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
                };
            }
        }

        // Check hasAttribute
        if (rule.hasAttribute && elements.length > 0) {
            const el = elements[0];
            const attrValue = el?.getAttribute(rule.hasAttribute.name);
            if (attrValue === null) {
                return {
                    passed: false,
                    error: `Expected '${rule.selector}' to have attribute '${rule.hasAttribute.name}'`,
                };
            }
            if (rule.hasAttribute.value !== undefined) {
                const expectedVal = rule.hasAttribute.value;
                if (expectedVal instanceof RegExp) {
                    if (!expectedVal.test(attrValue)) {
                        return {
                            passed: false,
                            error: `Expected '${rule.selector}' attribute '${rule.hasAttribute.name}' to match ${expectedVal}`,
                        };
                    }
                } else if (attrValue !== expectedVal) {
                    return {
                        passed: false,
                        error: `Expected '${rule.selector}' attribute '${rule.hasAttribute.name}' to be "${expectedVal}", got "${attrValue}"`,
                    };
                }
            }
        }
    }

    return { passed: true };
}
