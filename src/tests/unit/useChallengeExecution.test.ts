import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useChallengeExecution } from '@/components/challenges/playground/use-challenge-execution';
import * as executor from '@/core/executor';
import * as storage from '@/lib/storage-adapter';

// Mock dependencies
mock.module('@/core/executor', () => ({
    executePlaywrightCode: mock(),
}));

mock.module('@/core/executor/module-preloader', () => ({
    generatePreloadCode: () => '',
}));

mock.module('@/lib/storage-adapter', () => ({
    storage: {
        removeItem: mock(() => Promise.resolve()),
    },
}));


mock.module('sonner', () => ({
    toast: {
        error: mock(),
    },
}));


describe('useChallengeExecution', () => {
    const mockState = {
        code: 'console.log("hello")',
        selector: '',
        selectorType: 'css',
        fileContents: {},
        testResults: [],
        setTestResults: mock(),
        setConsoleLogs: mock(),
        setIsRunning: mock(),
        setHasPassed: mock(),
        setActiveTab: mock(),
        setCurrentVfsPath: mock(),
        previewValidation: null,
        setPreviewValidation: mock(),
        setCode: mock(),
        setSelector: mock(),
        setSelectorType: mock(),
        setResetCount: mock(),
        setIsResetConfirmOpen: mock(),
        setHintContent: mock(),
        setIsHintDialogOpen: mock(),
        setHintUsed: mock(),
        t: (k: string) => k,
        locale: 'en',
        isRunning: false,
        hasPassed: false,
        isCodeChallenge: true,
        isSelectorChallenge: false,
    };

    const mockProps = {
        challenge: {
            id: '1',
            slug: 'test',
            type: 'JAVASCRIPT',
            testCases: [{ expectedOutput: 'hello' }],
            category: 'basics',
            starterCode: 'console.log("start")'
        },
        onSubmit: mock(),
        userId: 'user1',
    };

    const mockIframe = { current: null };

    beforeEach(() => {

    });

    it('should run code successfully', async () => {
        (executor.executePlaywrightCode as any).mockResolvedValue({
            status: 'PASSED',
            output: 'Success',
            returnValue: 'hello',
            executionTime: 100,
            logs: []
        });

        const { result } = renderHook(() => useChallengeExecution(mockState as any, mockProps as any, mockIframe));

        await act(async () => {
            await result.current.handleRunCode();
        });

        expect(mockState.setIsRunning).toHaveBeenCalledWith(true);
        expect(mockState.setHasPassed).toHaveBeenCalledWith(true);
        expect(mockState.setTestResults).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ passed: true })
        ]));
    });

    it('should handle execution failure', async () => {
        (executor.executePlaywrightCode as any).mockResolvedValue({
            status: 'FAILED',
            error: 'Syntax Error',
            executionTime: 0,
        });

        const { result } = renderHook(() => useChallengeExecution(mockState as any, mockProps as any, mockIframe));

        await act(async () => {
            await result.current.handleRunCode();
        });

        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
        expect(mockState.setTestResults).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ passed: false, error: 'Syntax Error' })
        ]));
    });

    it('should validate value mismatch for JS challenge', async () => {
        (executor.executePlaywrightCode as any).mockResolvedValue({
            status: 'PASSED',
            returnValue: 'wrong',
            executionTime: 100,
        });

        const { result } = renderHook(() => useChallengeExecution(mockState as any, mockProps as any, mockIframe));

        await act(async () => {
            await result.current.handleRunCode();
        });

        // Should fail because logic checks return value vs expected
        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
    });

    it('should submit results if passed', () => {
        const { result } = renderHook(() => useChallengeExecution(
            { ...mockState, hasPassed: true } as any,
            mockProps as any,
            mockIframe
        ));

        act(() => {
            result.current.handleSubmit();
        });

        expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should validate selectors', () => {
        const selectorChallenge = { ...mockProps.challenge, type: 'CSS_SELECTOR', targetSelector: '.target' };
        const selectorState = { ...mockState, isCodeChallenge: false, isSelectorChallenge: true, selector: '.target' };

        const { result } = renderHook(() => useChallengeExecution(selectorState as any, { ...mockProps, challenge: selectorChallenge } as any, mockIframe));

        act(() => {
            result.current.handleValidateSelector();
        });

        expect(mockState.setHasPassed).toHaveBeenCalledWith(true);
    });
    it('should reset state on confirmReset', async () => {
        const { result } = renderHook(() => useChallengeExecution(mockState as any, mockProps as any, mockIframe));

        await act(async () => {
            await result.current.confirmReset();
        });

        // Check cleanup
        expect(storage.storage.removeItem).toHaveBeenCalled();
        expect(mockState.setCode).toHaveBeenCalledWith(expect.any(String)); // starterCode
        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
        expect(mockState.setTestResults).toHaveBeenCalledWith([]);
        expect(mockState.setIsResetConfirmOpen).toHaveBeenCalledWith(false);
    });

    it('should update file content on file change', () => {
        const fileState = {
            ...mockState,
            fileContents: { '/test.spec.ts': '' },
            setFileContents: mock(),
            challenge: { ...mockProps.challenge, editableFiles: ['/test.spec.ts'] }
        };

        const { result } = renderHook(() => useChallengeExecution(fileState as any, mockProps as any, mockIframe));

        act(() => {
            result.current.handleFileChange('/test.spec.ts', 'new content');
        });

        expect(fileState.setFileContents).toHaveBeenCalledWith(expect.objectContaining({
            '/test.spec.ts': 'new content'
        }));
        // Main file update also updates 'code' state
        expect(mockState.setCode).toHaveBeenCalledWith('new content');
    });
});
