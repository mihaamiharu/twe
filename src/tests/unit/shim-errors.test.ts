import { describe, expect, it } from 'bun:test';
import { createShimError, isShimError, type ShimErrorType } from '@/core/executor/shim-errors';

describe('createShimError', () => {
    it('should create error with element_not_found type', () => {
        const error = createShimError('element_not_found', {
            selector: '#submit-btn',
            action: 'click'
        });

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('PlaywrightShimError');
        expect(error.message).toContain('locator.click');
        expect(error.message).toContain('Element not found');
        expect(error.message).toContain('#submit-btn');
    });

    it('should create error with element_not_visible type', () => {
        const error = createShimError('element_not_visible', {
            selector: '.hidden-button',
            action: 'click'
        });

        expect(error.message).toContain('Element is hidden');
        expect(error.message).toContain('.hidden-button');
    });

    it('should create error with strict_mode_violation type', () => {
        const error = createShimError('strict_mode_violation', {
            selector: 'button',
            matchCount: 5
        });

        expect(error.message).toContain('Strict mode violation');
        expect(error.message).toContain('5 elements');
        expect(error.message).toContain('.nth()');
    });

    it('should create error with timeout type', () => {
        const error = createShimError('timeout', {
            selector: '#loading',
            timeout: 5000,
            action: 'waitForSelector'
        });

        expect(error.message).toContain('5000ms exceeded');
        expect(error.message).toContain('#loading');
    });

    it('should create error with invalid_element_type type', () => {
        const error = createShimError('invalid_element_type', {
            selector: '#not-a-checkbox',
            action: 'check',
            elementType: 'div',
            hint: 'checkbox or radio'
        });

        expect(error.message).toContain('Expected checkbox or radio');
        expect(error.message).toContain("got 'div'");
    });

    it('should create error with element_detached type', () => {
        const error = createShimError('element_detached', {
            action: 'click'
        });

        expect(error.message).toContain('detached from the DOM');
        expect(error.message).toContain('dynamically removed');
    });

    it('should create error with element_disabled type', () => {
        const error = createShimError('element_disabled', {
            selector: '#disabled-btn',
            action: 'click'
        });

        expect(error.message).toContain('Element is disabled');
    });

    it('should create error with assertion_failed type', () => {
        const error = createShimError('assertion_failed', {
            action: 'toHaveText',
            expected: 'Submit',
            actual: 'Cancel',
            selector: 'button'
        });

        expect(error.message).toContain('Expected "Submit"');
        expect(error.message).toContain('got "Cancel"');
    });

    it('should attach metadata to error for programmatic access', () => {
        const error = createShimError('element_not_found', {
            selector: '#my-element',
            action: 'fill'
        });

        expect((error as any).type).toBe('element_not_found');
        expect((error as any).selector).toBe('#my-element');
        expect((error as any).action).toBe('fill');
    });

    it('should work without any options', () => {
        const error = createShimError('element_not_found');

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Element not found');
    });
});

describe('isShimError', () => {
    it('should return true for ShimError', () => {
        const error = createShimError('element_not_found');
        expect(isShimError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
        const error = new Error('Regular error');
        expect(isShimError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
        expect(isShimError('string')).toBe(false);
        expect(isShimError(null)).toBe(false);
        expect(isShimError(undefined)).toBe(false);
        expect(isShimError({})).toBe(false);
    });
});
