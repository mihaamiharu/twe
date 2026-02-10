import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { executePlaywrightCode } from '@/core/executor';
import { generatePreloadCode } from '@/core/executor/module-preloader';
import { storage } from '@/lib/storage-adapter';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import { INJECTED_SCRIPTS, HIGHLIGHT_STYLES } from '../preview/constants';
import type {
    ChallengePlaygroundProps,
    PlaygroundState
} from './types';
import type { TestResult } from '../TestResults';
import type { SelectorType } from '../SelectorInput';

export function useChallengeExecution(
    state: PlaygroundState,
    props: ChallengePlaygroundProps,
    previewIframeRef: React.RefObject<HTMLIFrameElement | null>
) {
    const { challenge, onSubmit, userId } = props;
    const {
        code,
        selector,
        selectorType,
        fileContents,
        testResults,
        setTestResults,
        setConsoleLogs,
        setIsRunning,
        setHasPassed,
        setActiveTab,
        setCurrentVfsPath,
        previewValidation,
        setPreviewValidation,
        setCode,
        setSelector,
        setSelectorType,
        setResetCount,
        setIsResetConfirmOpen,
        setHintContent,
        setIsHintDialogOpen,
        setHintUsed,
        t,
        locale,
        isRunning,
        hasPassed,
        isCodeChallenge,
        isSelectorChallenge
    } = state;

    // Run code for Playwright/JS challenges
    const handleRunCode = useCallback(async () => {
        const needsHtmlRun =
            (challenge.htmlContent || challenge.files) && challenge.type !== 'JAVASCRIPT';

        if (!isCodeChallenge) return;

        // Initial path is set by usePlaygroundState. We don't reset it here
        // to avoid blank previews for challenges starting on /app/ or other paths.

        if (needsHtmlRun) {
            setActiveTab('preview');
        }

        setIsRunning(true);
        setTestResults([]);
        setConsoleLogs([]);

        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
            let codeToRun = code;
            if (
                challenge.type === 'JAVASCRIPT' ||
                challenge.type === 'TYPESCRIPT' ||
                challenge.type === 'PLAYWRIGHT'
            ) {
                codeToRun += '\nif (typeof result !== "undefined") return result;';
            }

            const initialHtml = challenge.files
                ? challenge.files['/index.html'] || '<div></div>'
                : challenge.htmlContent || '<div></div>';

            let preloadCode = '';
            if (challenge.preloadModules) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                preloadCode = generatePreloadCode({
                    modules: challenge.preloadModules,
                    files: challenge.files || {}
                });
            }

            const result = await executePlaywrightCode(
                preloadCode + '\n' + codeToRun,
                initialHtml,
                {
                    timeout: 10000,
                    existingIframe: previewIframeRef.current || undefined,
                    strictMode: challenge.type === 'PLAYWRIGHT',
                    cssContent: (challenge.category?.startsWith('e2e')) ? e2eSelectorStyles : defaultSelectorStyles,
                    files: challenge.files,
                    onNavigate: (path) => setCurrentVfsPath(path),
                    expectedState: challenge.expectedState,
                    isTypeScript: challenge.type === 'TYPESCRIPT',
                },
            );

            let validationPassed = result.status === 'PASSED';
            let outputMessage = result.output;

            const hasExpectedState = (challenge.expectedState?.length ?? 0) > 0;
            const isAssertionChallenge = [
                'playwright-assertions',
                'page-object-model',
                'playwright-pom',
                'playwright-data-driven',
                'playwright-infrastructure',
                'playwright-integration-patterns',
                'playwright-navigation',
                'playwright-locators',
                'e2e-pom',
                'e2e-integration',
            ].includes(challenge.category ?? '');

            if (
                isAssertionChallenge &&
                !hasExpectedState &&
                result.status === 'PASSED'
            ) {
                const assertionCount = result.assertionCount ?? 0;
                if (assertionCount === 0) {
                    validationPassed = false;
                    outputMessage =
                        "No assertions were called. Write assertions like: await expect(locator).toHaveText('...');";
                    result.status = 'FAILED';
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    outputMessage = t('challenges:playground.correct');
                }
            }
            else if (
                isCodeChallenge &&
                !isAssertionChallenge &&
                challenge.testCases?.length &&
                result.status === 'PASSED'
            ) {
                const expected = challenge.testCases[0].expectedOutput;
                const actual = result.returnValue;

                let expectedValue = expected;
                if (expected && typeof expected === 'object' && 'value' in expected) {
                    expectedValue = (expected as { value: unknown }).value;
                }

                if (
                    actual != expectedValue &&
                    String(actual) !== String(expectedValue)
                ) {
                    validationPassed = false;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    outputMessage =
                        actual === undefined
                            ? t('challenges:playground.jsUndefined')
                            : t('challenges:playground.jsMismatch');
                    result.status = 'FAILED';
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    outputMessage = `${t('challenges:playground.correct')} Result is ${String(actual)}`;
                }
            }

            const testResult: TestResult = {
                id: 'main',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                name: t('challenges:playground.results'),
                passed: validationPassed,
                error: !validationPassed ? result.error || outputMessage : undefined,
                executionTime: result.executionTime,
            };

            setTestResults([testResult]);
            setHasPassed(validationPassed);

            if (result.logs) {
                setConsoleLogs(
                    result.logs.map((log) => ({
                        type: log.type as 'log' | 'warn' | 'error',
                        message: log.message,
                    })),
                );
            }
        } catch (error) {
            setTestResults([
                {
                    id: 'error',
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    name: t('challenges:playground.executionError'),
                    passed: false,
                    error:
                        error instanceof Error ? error.message : t('common:messages.error'),
                },
            ]);
            setHasPassed(false);
        } finally {
            setIsRunning(false);

            // Re-inject inspector scripts after execution
            // This is necessary because executePlaywrightCode overwrites the iframe content
            const iframe = previewIframeRef.current;
            if (iframe?.contentDocument) {
                const doc = iframe.contentDocument;

                // Re-inject styles if not present
                if (!doc.querySelector('style[data-twe-inspector]')) {
                    const style = doc.createElement('style');
                    style.setAttribute('data-twe-inspector', 'true');
                    style.textContent = HIGHLIGHT_STYLES;
                    doc.head?.appendChild(style);
                }

                // Re-inject scripts
                if (!doc.querySelector('script[data-twe-inspector]')) {
                    const script = doc.createElement('script');
                    script.setAttribute('data-twe-inspector', 'true');
                    script.textContent = INJECTED_SCRIPTS;
                    doc.body?.appendChild(script);
                }
            }
        }
    }, [
        code,
        challenge,
        isCodeChallenge,
        previewIframeRef,
        setCurrentVfsPath,
        setActiveTab,
        setIsRunning,
        setTestResults,
        setConsoleLogs,
        setHasPassed,
        t
    ]);

    // AI Hint mutation
    const hintMutation = useMutation({
        mutationFn: async () => {
            const { getAIHint } = await import('@/server/ai.fn');

            let currentCode = isCodeChallenge ? code : selector;

            // For multi-file challenges (POM), bundle all files into the user attempt
            if (isCodeChallenge && challenge.files && fileContents) {
                currentCode = Object.entries(fileContents)
                    .map(([path, content]) => `// File: ${path}\n${content}`)
                    .join('\n\n');
            }

            return getAIHint({
                data: {
                    challengeSlug: challenge.slug,
                    userAttempt: currentCode || undefined,
                    locale,
                },
            });
        },
        onSuccess: (result) => {
            setIsHintDialogOpen(false);

            if (result.success && result.hint) {
                setHintContent(result.hint);
                state.setStoredHint(result.hint);
                setHintUsed(true);
            } else if (!result.success && result.error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                toast.error(t('challenges:hints.errorTitle', 'Hint Generation Failed'), {
                    description: result.error,
                });
            }
        },
        onError: (error) => {
            console.error('[AI Hint] Error:', error);
            setIsHintDialogOpen(false);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            toast.error(t('challenges:hints.errorTitle', 'Error'), {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                description: t('challenges:hints.errorGeneric', 'Something went wrong. Please try again.'),
            });
        },
    });

    const handlePreviewValidation = useCallback(
        (result: { isValid: boolean; matchCount: number }) => {
            setPreviewValidation(result);
        },
        [setPreviewValidation],
    );

    const handleValidateSelector = useCallback(() => {
        if (!isSelectorChallenge || !challenge.targetSelector) return;

        let isValid = false;
        if (previewValidation) {
            isValid = previewValidation.isValid;
        } else {
            const targetSelectors = Array.isArray(challenge.targetSelector)
                ? challenge.targetSelector
                : [challenge.targetSelector];
            isValid = targetSelectors.includes(selector);
        }

        setHasPassed(isValid);

        if (isValid) {
            setTestResults([
                {
                    id: 'selector',
                    name: 'Selector Validation',
                    passed: true,
                },
            ]);
        } else {
            setTestResults([
                {
                    id: 'selector',
                    name: 'Selector Validation',
                    passed: false,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    error: t('challenges:playground.selectorMismatch'),
                },
            ]);
        }
    }, [
        selector,
        challenge.targetSelector,
        isSelectorChallenge,
        previewValidation,
        setHasPassed,
        setTestResults,
        t
    ]);

    const handleReset = useCallback(() => {
        setIsResetConfirmOpen(true);
    }, [setIsResetConfirmOpen]);

    const confirmReset = useCallback(async () => {
        const storageKey = userId
            ? `challenge-${challenge.id}-${userId}`
            : `challenge-${challenge.id}`;

        await storage.removeItem(storageKey);

        setCode(challenge.starterCode);
        setSelector('');
        setTestResults([]);
        setHasPassed(false);
        setPreviewValidation(null);
        setResetCount((prev) => prev + 1);
        setIsResetConfirmOpen(false);
    }, [challenge, userId, setCode, setSelector, setTestResults, setHasPassed, setPreviewValidation, setResetCount, setIsResetConfirmOpen]);

    const handleSubmit = useCallback(() => {
        const submissionCode = isCodeChallenge
            ? (challenge.files ? JSON.stringify(fileContents) : code)
            : selector;
        const totalExecutionTime = testResults.reduce(
            (acc, r) => acc + (r.executionTime || 0),
            0,
        );

        onSubmit({
            code: submissionCode,
            passed: hasPassed,
            testResults,
            executionTime: totalExecutionTime,
        });
    }, [code, selector, hasPassed, onSubmit, isCodeChallenge, testResults, challenge.files, fileContents]);

    const handleSelectorChange = useCallback(
        (value: string, type: SelectorType) => {
            setSelector(value);
            setSelectorType(type);
        },
        [setSelector, setSelectorType],
    );

    const handleFileChange = useCallback((path: string, newCode: string) => {
        state.setFileContents({
            ...state.fileContents,
            [path]: newCode
        });

        const mainFile = challenge.editableFiles?.[0] || '/test.spec.ts';
        if (path === mainFile) {
            setCode(newCode);
        }
    }, [challenge.editableFiles, state.fileContents, state.setFileContents, setCode]);

    const handleSelectFile = useCallback((path: string) => {
        state.setSelectedFile(path);
        if (!state.openFiles.includes(path)) {
            state.setOpenFiles([...state.openFiles, path]);
        }
    }, [state.openFiles, state.setOpenFiles, state.setSelectedFile]);

    const handleCloseFile = useCallback((path: string) => {
        const newOpenFiles = state.openFiles.filter(p => p !== path);
        state.setOpenFiles(newOpenFiles);
        if (state.selectedFile === path) {
            if (newOpenFiles.length > 0) {
                state.setSelectedFile(newOpenFiles[newOpenFiles.length - 1]);
            }
        }
    }, [state.openFiles, state.setOpenFiles, state.selectedFile, state.setSelectedFile]);

    return {
        handleRunCode,
        handleValidateSelector,
        handleReset,
        confirmReset,
        handleSubmit,
        handleSelectorChange,
        handleFileChange,
        handleSelectFile,
        handleCloseFile,
        handlePreviewValidation,
        hintMutation,
    };
}
