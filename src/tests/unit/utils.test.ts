import { describe, test, expect } from 'bun:test';
import { cn } from '../../lib/utils';

describe('Utils', () => {
    describe('cn', () => {
        test('should merge class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        test('should handle conditional classes', () => {
            expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
        });

        test('should handle arrays of classes', () => {
            expect(cn(['class1', 'class2'])).toBe('class1 class2');
        });

        test('should handle objects of classes', () => {
            expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
        });

        test('should resolve tailwind conflicts', () => {
            // tailwind-merge should keep the last one
            expect(cn('p-2 p-4')).toBe('p-4');
            expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
        });

        test('should handle complex combinations', () => {
            const isActive = true;
            expect(cn(
                'base-class',
                isActive ? 'active' : 'inactive',
                'p-2',
                'p-4' // conflict
            )).toBe('base-class active p-4');
        });
    });
});
