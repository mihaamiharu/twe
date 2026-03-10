import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PlaygroundHeader } from '@/components/challenges/playground/PlaygroundHeader';

// Mock dependencies


mock.module('lucide-react', () => ({
    Play: () => <svg data-testid="play-icon" />,
    Send: () => <svg data-testid="send-icon" />,
    BookOpen: () => <svg data-testid="book-icon" />,
    Lightbulb: () => <svg data-testid="lightbulb-icon" />,
    Zap: () => <svg data-testid="zap-icon" />,
    Loader2: () => <svg data-testid="loader-icon" />,
    ChevronLeft: () => <svg data-testid="left-icon" />,
    ChevronRight: () => <svg data-testid="right-icon" />,
}));

mock.module('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
    TooltipProvider: ({ children }: any) => <>{children}</>,
}));

describe('PlaygroundHeader', () => {
    const mockOnRunCode = mock(() => Promise.resolve());
    const mockOnOpenHintDialog = mock();
    const mockOnSubmit = mock();

    beforeEach(() => {
        mockOnRunCode.mockClear();
        mockOnOpenHintDialog.mockClear();
        mockOnSubmit.mockClear();
    });

    afterEach(cleanup);

    const mockProps = {
        challenge: {
            id: '1',
            title: 'Test Challenge',
            slug: 'test',
            description: 'desc',
            type: 'JAVASCRIPT',
            difficulty: 'EASY',
            hints: ['Hint 1'],
        } as any,
        locale: 'en',
        userId: 'user1',
        isMobile: false,
        isCodeChallenge: true,
        isRunning: false,
        hasPassed: false,
        hintUsed: false,
        isHintPending: false,
        revealedHintsCount: 0,
        setRevealedHintsCount: () => {},
        onRunCode: mockOnRunCode,
        onOpenHintDialog: mockOnOpenHintDialog,
        onSubmit: mockOnSubmit,
    };

    it('should render challenge title', () => {
        render(<PlaygroundHeader {...mockProps} />);
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should call onRunCode when run button clicked (mobile only)', () => {
        render(<PlaygroundHeader {...mockProps} isMobile={true} />);

        // In mobile, button has no text, but has Play icon.
        // Ensure we pick the right button (not previous/next which have chevrons)
        const playIcon = screen.getByTestId('play-icon');
        const runBtn = playIcon.closest('button');

        expect(runBtn).toBeTruthy();
        fireEvent.click(runBtn!);

        expect(mockProps.onRunCode).toHaveBeenCalled();
    });

    it('should disable run button when running (mobile only)', () => {
        render(<PlaygroundHeader {...mockProps} isMobile={true} isRunning={true} />);

        const loaderIcon = screen.getByTestId('loader-icon');
        const runBtn = loaderIcon.closest('button');

        expect(runBtn).toHaveProperty('disabled', true);
    });

    it('should show submit button when passed', () => {
        render(<PlaygroundHeader {...mockProps} hasPassed={true} />);

        // Submit button has text based on mock t
        const submitBtnSpan = screen.getByText('common:actions.submit');
        const submitBtn = submitBtnSpan.closest('button');

        expect(submitBtn).toBeTruthy();
        fireEvent.click(submitBtn!);

        expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should render hint button', () => {
        render(<PlaygroundHeader {...mockProps} revealedHintsCount={1} />);

        // Text: challenges:hints.button
        const hintBtnSpan = screen.getByText('challenges:hints.button');
        const hintBtn = hintBtnSpan.closest('button');

        fireEvent.click(hintBtn!);
        expect(mockProps.onOpenHintDialog).toHaveBeenCalled();
    });
});
