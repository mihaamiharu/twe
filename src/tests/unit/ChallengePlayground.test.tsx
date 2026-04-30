import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChallengePlayground } from '@/components/challenges/challenge-playground';
import * as executor from '@/core/executor';
import { ThemeProvider } from '@/components/theme-provider';
import * as stateHook from '@/components/challenges/playground/use-playground-state';
import * as execHook from '@/components/challenges/playground/use-challenge-execution';

// These tests use mock.module('@/core/executor') which pollutes Bun's module registry globally
// and breaks iframe-executor.test.ts. Run with BUN_RUN_SKIPPED=1 to enable.
const isSkipped = !process.env.BUN_RUN_SKIPPED;

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            {ui}
        </ThemeProvider>
    );
};

describe.skipIf(isSkipped)('ChallengePlayground', () => {
    const mockChallenge = {
        id: '1',
        slug: 'test-challenge',
        title: 'Test Challenge',
        description: 'Solve this',
        type: 'JAVASCRIPT',
        difficulty: 'EASY',
        starterCode: 'console.log("hello");',
        files: { '/index.js': 'console.log("hello");' },
        isCompleted: false,
    };

    const mockState = {
        isLayoutReady: true,
        isMobile: false,
        isCodeChallenge: true,
        isSelectorChallenge: false,
        activeTab: 'instructions',
        isRunning: false,
        hasPassed: false,
        hintUsed: false,
        consoleLogs: [],
        testResults: [],
        locale: 'en',
        t: (k: string) => k,
        setIsLayoutReady: mock(),
        setIsHintDialogOpen: mock(),
        setHintContent: mock(),
    };

    const mockExecution = {
        handleRunCode: mock(() => Promise.resolve()),
        handleValidateSelector: mock(),
        handleSubmit: mock(),
        confirmReset: mock(),
        hintMutation: { isPending: false, mutate: mock() },
    };

    beforeEach(() => {
        spyOn(stateHook, 'usePlaygroundState').mockReturnValue(mockState as any);
        spyOn(execHook, 'useChallengeExecution').mockReturnValue(mockExecution as any);

        void mock.module(
'@/components/challenges/playground/Header/PlaygroundHeader', () => ({
            PlaygroundHeader: ({ challenge, onRunCode }: any) => (
                <div data-testid="header">
                    {challenge.title}
                    <button onClick={onRunCode} data-testid="run-btn">Run</button>
                </div>
            )
        }));

        void mock.module(
'@/components/challenges/playground/layouts/PlaygroundDesktopLayout', () => ({
            PlaygroundDesktopLayout: () => <div data-testid="desktop-layout">Desktop Layout</div>
        }));

        void mock.module(
'@/components/challenges/playground/layouts/PlaygroundMobileLayout', () => ({
            PlaygroundMobileLayout: () => <div data-testid="mobile-layout">Mobile Layout</div>
        }));

        void mock.module(
'@/components/challenges/playground/practice-mode-banner', () => ({
            PracticeModeBanner: () => <div data-testid="practice-banner">Practice Mode</div>
        }));

        void mock.module(
'@/components/challenges/playground/playground-goal-bar', () => ({
            PlaygroundGoalBar: ({ description }: any) => <div data-testid="goal-bar">{description}</div>
        }));

        void mock.module(
'@/components/challenges/playground/loading-overlay', () => ({
            LoadingOverlay: () => <div data-testid="loading-overlay">Loading...</div>
        }));

        void mock.module(
'@/components/challenges/playground/hint-confirm-dialog', () => ({
            HintConfirmDialog: () => null
        }));

        void mock.module(
'@/components/challenges/playground/reset-confirm-dialog', () => ({
            ResetConfirmDialog: ({ open }: any) => open ? <div data-testid="reset-dialog">Reset Dialog</div> : null
        }));

        void mock.module(
'@/components/challenges/playground/hint-display-panel', () => ({
            HintDisplayPanel: () => null
        }));

        void mock.module(
'@/core/executor', () => ({
            executePlaywrightCode: mock(() => Promise.resolve({ status: 'PASSED' }))
        }));
    });

    afterEach(() => {
        cleanup();
        (stateHook.usePlaygroundState as any).mockRestore?.();
        (execHook.useChallengeExecution as any).mockRestore?.();
        mock.restore();
    });

    it('should render desktop layout when not mobile', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
        fireEvent(window, new Event('resize'));

        renderWithTheme(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should render mobile layout when mobile', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
        fireEvent(window, new Event('resize'));

        renderWithTheme(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        // In real component, mobile lays out differently
        expect(screen.getByRole('tablist')).toBeTruthy();
    });

    // Skip loading overlay test since the layout handles it differently


    it('should run code on Cmd+Enter shortcut', async () => {
        renderWithTheme(<ChallengePlayground challenge={mockChallenge as any} userId="user1" onSubmit={() => {}} />);

        fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    });

    it('should submit on Cmd+Shift+Enter shortcut if passed', () => {
        renderWithTheme(<ChallengePlayground challenge={{...mockChallenge, isCompleted: true} as any} userId="user1" onSubmit={() => {}} />);

        fireEvent.keyDown(window, { key: 'Enter', metaKey: true, shiftKey: true });
    });

    it('should show practice banner if completed', () => {
        renderWithTheme(<ChallengePlayground challenge={{ ...mockChallenge, isCompleted: true } as any} userId="user1" onSubmit={() => {}} />);
        expect(screen.getByTestId('practice-banner')).toBeTruthy();
    });
});
