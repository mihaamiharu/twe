import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useChallengeExecution } from '@/components/challenges/playground/use-challenge-execution';
import * as executor from '@/core/executor';
import * as storage from '@/lib/storage-adapter';
import {
    createChallenge,
    createPlaygroundProps,
    createPlaygroundState,
} from '@/tests/fixtures/playground';

describe('useChallengeExecution', () => {
    beforeEach(() => {
        void mock.module(
            '@/core/executor/module-preloader', () => ({
                generatePreloadCode: () => '',
            })
        );

        void mock.module(
            '@/lib/storage-adapter', () => ({
                storage: {
                    getItem: mock(() => Promise.resolve(null)),
                    setItem: mock(() => Promise.resolve()),
                    removeItem: mock(() => Promise.resolve()),
                    clear: mock(() => Promise.resolve()),
                },
            })
        );

        void mock.module(
            'sonner', () => ({
                toast: {
                    error: mock(),
                },
            })
        );
    });

    afterEach(() => {
        mock.restore();
    });
    const mockState = createPlaygroundState({
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
        locale: 'en',
        isRunning: false,
        hasPassed: false,
        isCodeChallenge: true,
        isSelectorChallenge: false,
    });

    const mockProps = createPlaygroundProps({
        challenge: createChallenge({
            id: '1',
            slug: 'test',
            testCases: [{ id: 'case-1', name: 'returns greeting', expectedOutput: 'hello' }],
            category: 'basics',
            starterCode: 'console.log("start")'
        }),
        onSubmit: mock(),
        userId: 'user1',
    });

    const mockIframe = { current: null };

    beforeEach(() => {

    });

    it('should run code successfully', async () => {
        spyOn(executor, 'executePlaywrightCode').mockResolvedValue({
            status: 'PASSED',
            output: 'Success',
            returnValue: 'hello',
            executionTime: 100,
            logs: []
        });

        const { result } = renderHook(() => useChallengeExecution(mockState, mockProps, mockIframe));

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
        spyOn(executor, 'executePlaywrightCode').mockResolvedValue({
            status: 'FAILED',
            output: 'Syntax Error',
            error: 'Syntax Error',
            executionTime: 0,
        });

        const { result } = renderHook(() => useChallengeExecution(mockState, mockProps, mockIframe));

        await act(async () => {
            await result.current.handleRunCode();
        });

        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
        expect(mockState.setTestResults).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ passed: false, error: 'Syntax Error' })
        ]));
    });

    it('should validate value mismatch for JS challenge', async () => {
        spyOn(executor, 'executePlaywrightCode').mockResolvedValue({
            status: 'PASSED',
            output: 'Success',
            returnValue: 'wrong',
            executionTime: 100,
        });

        const { result } = renderHook(() => useChallengeExecution(mockState, mockProps, mockIframe));

        await act(async () => {
            await result.current.handleRunCode();
        });

        // Should fail because logic checks return value vs expected
        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
    });

    it('should submit results if passed', () => {
        const { result } = renderHook(() => useChallengeExecution(
            createPlaygroundState({ ...mockState, hasPassed: true }),
            mockProps,
            mockIframe
        ));

        act(() => {
            result.current.handleSubmit();
        });

        expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should validate selectors', () => {
        const selectorChallenge = createChallenge({
            ...mockProps.challenge,
            type: 'CSS_SELECTOR',
            targetSelector: '.target',
        });
        const selectorState = createPlaygroundState({
            ...mockState,
            isCodeChallenge: false,
            isSelectorChallenge: true,
            selector: '.target',
        });

        const { result } = renderHook(() => useChallengeExecution(
            selectorState,
            createPlaygroundProps({ ...mockProps, challenge: selectorChallenge }),
            mockIframe,
        ));

        act(() => {
            result.current.handleValidateSelector();
        });

        expect(mockState.setHasPassed).toHaveBeenCalledWith(true);
    });
    it('should reset state on confirmReset', async () => {
        const { result } = renderHook(() => useChallengeExecution(mockState, mockProps, mockIframe));

        await act(async () => {
            await result.current.confirmReset();
        });

        // Check cleanup
        // The storage adapter method is intentionally inspected as a mock in this test.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(storage.storage.removeItem).toHaveBeenCalled();
        expect(mockState.setCode).toHaveBeenCalledWith(expect.any(String)); // starterCode
        expect(mockState.setHasPassed).toHaveBeenCalledWith(false);
        expect(mockState.setTestResults).toHaveBeenCalledWith([]);
        expect(mockState.setIsResetConfirmOpen).toHaveBeenCalledWith(false);
    });

    it('should update file content on file change', () => {
        const fileState = createPlaygroundState({
            ...mockState,
            fileContents: { '/test.spec.ts': '' },
            setFileContents: mock(),
        });
        const fileProps = createPlaygroundProps({
            ...mockProps,
            challenge: createChallenge({
                ...mockProps.challenge,
                editableFiles: ['/test.spec.ts'],
            }),
        });

        const { result } = renderHook(() => useChallengeExecution(fileState, fileProps, mockIframe));

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
