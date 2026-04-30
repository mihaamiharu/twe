import { describe, it, expect } from 'bun:test';
import { transformChallengeResponse } from '@/lib/transform-challenge-response';

describe('transformChallengeResponse', () => {
    const mockServerData = {
        id: '1',
        slug: 'test-challenge',
        title: 'Test Challenge',
        description: 'A test challenge',
        instructions: 'Do something',
        type: 'JAVASCRIPT',
        difficulty: 'EASY' as const,
        category: 'js-fundamentals',
        xpReward: 10,
        order: 1,
        starterCode: 'const x = 1;',
        hints: ['Hint 1'],
        completionCount: 5,
        testCases: [
            {
                id: 'tc1',
                description: 'Test case 1',
                input: { selector: '#test' },
                expectedOutput: true,
            },
        ],
        hiddenTestCaseCount: 2,
        userProgress: null,
        nextChallenge: null,
        prevChallenge: null,
    };

    it('should transform server response to challenge shape', () => {
        const result = transformChallengeResponse(mockServerData, mockServerData.testCases);

        expect(result).not.toBeNull();
        expect(result!.id).toBe('1');
        expect(result!.slug).toBe('test-challenge');
        expect(result!.title).toBe('Test Challenge');
        expect(result!.difficulty).toBe('Easy');
        expect(result!.xp).toBe(10);
        expect(result!.starterCode).toBe('const x = 1;');
        expect(result!.targetSelector).toBe('#test');
        expect(result!.isCompleted).toBe(false);
    });

    it('should map difficulty levels correctly', () => {
        const easy = transformChallengeResponse(
            { ...mockServerData, difficulty: 'EASY' },
            [],
        );
        expect(easy!.difficulty).toBe('Easy');

        const medium = transformChallengeResponse(
            { ...mockServerData, difficulty: 'MEDIUM' },
            [],
        );
        expect(medium!.difficulty).toBe('Medium');

        const hard = transformChallengeResponse(
            { ...mockServerData, difficulty: 'HARD' },
            [],
        );
        expect(hard!.difficulty).toBe('Hard');
    });

    it('should return null when data is null', () => {
        const result = transformChallengeResponse(null, []);
        expect(result).toBeNull();
    });

    it('should return null when data is undefined', () => {
        const result = transformChallengeResponse(undefined, []);
        expect(result).toBeNull();
    });

    it('should extract targetSelector from xpath when selector is missing', () => {
        const testCases = [
            {
                id: 'tc1',
                description: 'Test',
                input: { xpath: '//div[@id="test"]' },
                expectedOutput: true,
            },
        ];
        const result = transformChallengeResponse(mockServerData, testCases);
        expect(result!.targetSelector).toBe('//div[@id="test"]');
    });

    it('should return empty string when no test cases', () => {
        const result = transformChallengeResponse(mockServerData, []);
        expect(result!.targetSelector).toBe('');
    });

    it('should mark challenge as completed when userProgress indicates so', () => {
        const data = {
            ...mockServerData,
            userProgress: {
                isCompleted: true,
                attempts: 3,
                lastAccessedAt: new Date(),
                usedHint: false,
            },
        };
        const result = transformChallengeResponse(data, mockServerData.testCases);
        expect(result!.isCompleted).toBe(true);
    });

    it('should transform testCases to expected shape', () => {
        const result = transformChallengeResponse(mockServerData, mockServerData.testCases);
        expect(result!.testCases).toHaveLength(1);
        expect(result!.testCases[0]).toEqual({
            id: 'tc1',
            name: 'Test case 1',
            input: { selector: '#test' },
            expectedOutput: true,
        });
    });

    it('should include optional fields when present', () => {
        const data = {
            ...mockServerData,
            htmlContent: '<div>test</div>',
            files: { 'index.js': 'console.log(1)' },
            editableFiles: ['index.js'],
            tutorial: { slug: 'tutorial-1', title: 'Tutorial' },
            nextChallenge: { slug: 'next', title: 'Next' },
            prevChallenge: { slug: 'prev', title: 'Prev' },
        };
        const result = transformChallengeResponse(data, mockServerData.testCases);
        expect(result!.htmlContent).toBe('<div>test</div>');
        expect(result!.files).toEqual({ 'index.js': 'console.log(1)' });
        expect(result!.editableFiles).toEqual(['index.js']);
        expect(result!.tutorial).toEqual({ slug: 'tutorial-1', title: 'Tutorial' });
        expect(result!.nextChallenge).toEqual({ slug: 'next', title: 'Next' });
        expect(result!.prevChallenge).toEqual({ slug: 'prev', title: 'Prev' });
    });
});
