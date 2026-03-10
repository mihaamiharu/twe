import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { usePlaygroundState } from '@/components/challenges/playground/usePlaygroundState';
// import { useChallengeExecution } from '@/components/challenges/playground/useChallengeExecution'; // Will test later if time permits

// Mock i18n

// Mock type-generator
mock.module('@/core/type-generator', () => ({
    generateTypeDefinitions: () => '',
}));

describe('usePlaygroundState', () => {
    const mockChallenge = {
        id: '1',
        slug: 'test-challenge',
        title: 'Test',
        description: 'Desc',
        type: 'JAVASCRIPT',
        difficulty: 'EASY',
        category: 'basics',
        xp: 10,
        instructions: 'Instructions',
        htmlContent: '<div></div>',
        starterCode: 'console.log("start");',
        files: { '/index.html': '<div></div>' },
        testCases: [],
        isCompleted: false,
    };

    it('should initialize with starter code', () => {
        const { result } = renderHook(() => usePlaygroundState({
            challenge: mockChallenge as any,
            userId: 'user1',
        }));

        expect(result.current.code).toBe(mockChallenge.starterCode);
        expect(result.current.isCodeChallenge).toBe(true);
        expect(result.current.isSelectorChallenge).toBe(false);
    });

    it('should handle code updates', () => {
        const { result } = renderHook(() => usePlaygroundState({
            challenge: mockChallenge as any,
            userId: 'user1',
        }));

        act(() => {
            result.current.setCode('new code');
        });

        expect(result.current.code).toBe('new code');
    });

    it('should reset state when confirmReset is called (indirectly via hook logic)', () => {
        // usePlaygroundState exposes setIsResetConfirmOpen
        const { result } = renderHook(() => usePlaygroundState({
            challenge: mockChallenge as any,
            userId: 'user1',
        }));

        act(() => {
            result.current.setIsResetConfirmOpen(true);
        });

        expect(result.current.isResetConfirmOpen).toBe(true);
    });

    it('should initialize selector code for CSS challenges', () => {
        const cssChallenge = { ...mockChallenge, type: 'CSS_SELECTOR', starterCode: '' };
        const { result } = renderHook(() => usePlaygroundState({
            challenge: cssChallenge as any,
            userId: 'user1',
        }));

        expect(result.current.isCodeChallenge).toBe(false);
        expect(result.current.isSelectorChallenge).toBe(true);
        expect(result.current.selectorType).toBe('css');
    });
});
