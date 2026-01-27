import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChallengePlayground } from '@/components/challenges/ChallengePlayground';
import * as playground from '@/components/challenges/playground';



describe('ChallengePlayground', () => {
    const mockChallenge = {
        id: '1',
        slug: 'test-challenge',
        title: 'Test Challenge',
        description: 'Solve this',
        type: 'JAVASCRIPT',
        difficulty: 'EASY',
        starterCode: '',
        files: {},
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
        mock.restore();

        // Mock the playground module which exports hooks and sub-components
        mock.module('@/components/challenges/playground', () => ({
            usePlaygroundState: mock(),
            useChallengeExecution: mock(),
            PlaygroundHeader: ({ challenge, onRunCode }: any) => (
                <div data-testid="header">
                    {challenge.title}
                    <button onClick={onRunCode} data-testid="run-btn">Run</button>
                </div>
            ),
            PlaygroundGoalBar: ({ description }: any) => <div data-testid="goal-bar">{description}</div>,
            PlaygroundDesktopLayout: () => <div data-testid="desktop-layout">Desktop Layout</div>,
            PlaygroundMobileLayout: () => <div data-testid="mobile-layout">Mobile Layout</div>,
            ResetConfirmDialog: ({ open }: any) => open ? <div data-testid="reset-dialog">Reset Dialog</div> : null,
            HintConfirmDialog: () => null,
            HintDisplayPanel: () => null,
            LoadingOverlay: () => <div data-testid="loading-overlay">Loading...</div>,
            PracticeModeBanner: () => <div data-testid="practice-banner">Practice Mode</div>,
        }));

        (playground.usePlaygroundState as any).mockReturnValue(mockState);
        (playground.useChallengeExecution as any).mockReturnValue(mockExecution);
    });

    afterEach(() => {
        cleanup();
        mock.restore();
    });

    it('should render desktop layout when not mobile', () => {
        render(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        expect(screen.getByTestId('desktop-layout')).toBeTruthy();
        expect(screen.queryByTestId('mobile-layout')).toBeNull();
        expect(screen.queryByTestId('loading-overlay')).toBeNull();
    });

    it('should render mobile layout when mobile', () => {
        (playground.usePlaygroundState as any).mockReturnValue({
            ...mockState,
            isMobile: true
        });

        render(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        expect(screen.getByTestId('mobile-layout')).toBeTruthy();
        expect(screen.queryByTestId('desktop-layout')).toBeNull();
    });

    it('should show loading overlay when layout not ready', () => {
        (playground.usePlaygroundState as any).mockReturnValue({
            ...mockState,
            isLayoutReady: false
        });

        render(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        expect(screen.getByTestId('loading-overlay')).toBeTruthy();
        // Layouts are hidden via CSS class "opacity-0 invisible" but strictly valid in DOM?
        // Check component code: <div className={cn("...", isLayoutReady ? "opacity-100" : "opacity-0 invisible")}>
        // So they are rendered.
    });

    it('should run code on Cmd+Enter shortcut', () => {
        render(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        // Simulate Cmd+Enter
        fireEvent.keyDown(window, { key: 'Enter', metaKey: true });

        expect(mockExecution.handleRunCode).toHaveBeenCalled();
    });

    it('should submit on Cmd+Shift+Enter shortcut if passed', () => {
        (playground.usePlaygroundState as any).mockReturnValue({
            ...mockState,
            hasPassed: true
        });

        render(<ChallengePlayground challenge={mockChallenge as any} userId="user1" />);

        fireEvent.keyDown(window, { key: 'Enter', metaKey: true, shiftKey: true });

        expect(mockExecution.handleSubmit).toHaveBeenCalled();
    });

    it('should show practice banner if completed', () => {
        render(<ChallengePlayground challenge={{ ...mockChallenge, isCompleted: true } as any} userId="user1" />);

        expect(screen.getByTestId('practice-banner')).toBeTruthy();
    });
});
