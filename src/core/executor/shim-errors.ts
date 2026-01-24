/**
 * Shim Error Factory
 * 
 * Generates consistent, descriptive error messages for the Playwright shim.
 * Modeled after real Playwright error patterns.
 */

/**
 * All possible error types thrown by the shim
 */
export type ShimErrorType =
    | 'element_not_found'
    | 'element_not_visible'
    | 'element_not_interactive'
    | 'element_detached'
    | 'element_disabled'
    | 'strict_mode_violation'
    | 'timeout'
    | 'assertion_failed'
    | 'invalid_element_type';

/**
 * Options for creating a shim error
 */
export interface ShimErrorOptions {
    /** The CSS selector or locator description */
    selector?: string;
    /** The action being performed (e.g., 'click', 'fill') */
    action?: string;
    /** Expected value for assertions */
    expected?: unknown;
    /** Actual value for assertions */
    actual?: unknown;
    /** Timeout value in milliseconds */
    timeout?: number;
    /** The actual element type found (e.g., 'div' instead of 'checkbox') */
    elementType?: string;
    /** Number of elements matched (for strict mode violations) */
    matchCount?: number;
    /** Additional context or hints */
    hint?: string;
}

/**
 * Error message templates for each error type
 */
const ERROR_TEMPLATES: Record<ShimErrorType, (opts: ShimErrorOptions) => string> = {
    element_not_found: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Element not found.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }${opts.hint ? `\n${opts.hint}` : ''}`,

    element_not_visible: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Element is hidden.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }${opts.hint ? `\n${opts.hint}` : ''}`,

    element_not_interactive: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Element is not interactable.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }${opts.hint ? `\n${opts.hint}` : ''}`,

    element_detached: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Element was detached from the DOM during action.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }${opts.hint ? `\n${opts.hint}` : '\nThis usually happens when the page navigates or the element is dynamically removed.'}`,

    element_disabled: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Element is disabled.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }${opts.hint ? `\n${opts.hint}` : ''}`,

    strict_mode_violation: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Strict mode violation: ` +
        `selector '${opts.selector || 'unknown'}' resolved to ${opts.matchCount || 'multiple'} elements.` +
        `\nUse .nth(), .first(), .last(), or a more specific selector.`,

    timeout: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Timeout ${opts.timeout || 'unknown'}ms exceeded` +
        `${opts.selector ? ` waiting for selector '${opts.selector}'` : ''}` +
        `${opts.hint ? ` ${opts.hint}` : ''}`,

    assertion_failed: (opts) => {
        const expected = typeof opts.expected === 'string' ? `"${opts.expected}"` : String(opts.expected);
        const actual = typeof opts.actual === 'string' ? `"${opts.actual}"` : String(opts.actual);
        return `${opts.action ? `expect(locator).${opts.action}: ` : ''}` +
            `Expected ${expected} but got ${actual}.` +
            `${opts.selector ? ` Selector: '${opts.selector}'` : ''}`;
    },

    invalid_element_type: (opts) =>
        `${opts.action ? `locator.${opts.action}: ` : ''}Error: Expected ${opts.hint || 'specific element type'
        } but got '${opts.elementType || 'unknown'}'.${opts.selector ? ` Selector: '${opts.selector}'` : ''
        }`,
};

/**
 * Creates a standardized error with a descriptive message
 * 
 * @example
 * throw createShimError('element_not_found', { 
 *   selector: '#submit-btn', 
 *   action: 'click' 
 * });
 * // => "locator.click: Error: Element not found. Selector: '#submit-btn'"
 */
export function createShimError(
    type: ShimErrorType,
    options: ShimErrorOptions = {}
): Error {
    const template = ERROR_TEMPLATES[type];
    const message = template(options);

    const error = new Error(message);
    error.name = `PlaywrightShimError`;

    // Attach metadata for programmatic access
    (error as any).type = type;
    (error as any).selector = options.selector;
    (error as any).action = options.action;

    return error;
}

/**
 * Type guard to check if an error is a ShimError
 */
export function isShimError(error: unknown): error is Error & { type: ShimErrorType } {
    return error instanceof Error && 'type' in error;
}
