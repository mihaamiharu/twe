import { expect, test, describe } from 'bun:test';
import { validateExpectedState } from '@/core/executor/dom-validator';

// GlobalRegistrator is already registered in bun-preload.ts

describe('DOM Validator', () => {
    test('should validate count', () => {
        document.body.innerHTML = '<div></div><div></div>';
        const rules = [
            { selector: 'div', count: 2 }
        ];
        expect(validateExpectedState(document, rules)).toEqual({ passed: true });
        
        const failRules = [
            { selector: 'div', count: 1 }
        ];
        expect(validateExpectedState(document, failRules).passed).toBe(false);
    });

    test('should validate visibility', () => {
        document.body.innerHTML = '<div></div>';
        expect(validateExpectedState(document, [{ selector: 'div', visible: true }])).toEqual({ passed: true });
        expect(validateExpectedState(document, [{ selector: 'span', visible: true }]).passed).toBe(false);
        
        expect(validateExpectedState(document, [{ selector: 'span', hidden: true }])).toEqual({ passed: true });
        expect(validateExpectedState(document, [{ selector: 'div', hidden: true }]).passed).toBe(false);
    });

    test('should validate text content', () => {
        document.body.innerHTML = '<div>Hello World</div>';
        expect(validateExpectedState(document, [{ selector: 'div', containsText: 'Hello' }])).toEqual({ passed: true });
        expect(validateExpectedState(document, [{ selector: 'div', containsText: 'Goodbye' }]).passed).toBe(false);
    });

    test('should validate attributes', () => {
        document.body.innerHTML = '<div class="test" data-id="123"></div>';
        expect(validateExpectedState(document, [{ selector: 'div', hasAttribute: { name: 'class', value: 'test' } }])).toEqual({ passed: true });
        expect(validateExpectedState(document, [{ selector: 'div', hasAttribute: { name: 'data-id', value: /123/ } }])).toEqual({ passed: true });
        expect(validateExpectedState(document, [{ selector: 'div', hasAttribute: { name: 'id' } }]).passed).toBe(false);
        expect(validateExpectedState(document, [{ selector: 'div', hasAttribute: { name: 'class', value: 'wrong' } }]).passed).toBe(false);
    });
});
