import type { ExpectedStateRule } from '@/lib/content.types';

function isElementVisible(element: Element): boolean {
    let current: Element | null = element;

    while (current) {
        if (current.hasAttribute('hidden')) return false;

        const style =
            current.ownerDocument.defaultView?.getComputedStyle(current);
        if (
            style?.display === 'none' ||
            style?.visibility === 'hidden' ||
            style?.visibility === 'collapse'
        ) {
            return false;
        }

        current = current.parentElement;
    }

    return true;
}

/**
 * Validate expected DOM state after code execution
 */
export function validateExpectedState(
    doc: Document,
    rules: ExpectedStateRule[],
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

        const visibleElements = Array.from(elements).filter(isElementVisible);

        // Check visible (at least one matching element is rendered)
        if (rule.visible && visibleElements.length === 0) {
            return {
                passed: false,
                error: `Expected '${rule.selector}' to be visible, but no visible match was found`,
            };
        }

        // A hidden expectation passes when the element is absent or every
        // matching element is hidden, matching Playwright's assertion model.
        if (rule.hidden && visibleElements.length > 0) {
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
            if (!el) continue;
            const attrValue = el.getAttribute(rule.hasAttribute.name);
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
