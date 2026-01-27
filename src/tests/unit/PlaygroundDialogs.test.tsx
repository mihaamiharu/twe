import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ResetConfirmDialog } from '@/components/challenges/playground/ResetConfirmDialog';
import { HintConfirmDialog } from '@/components/challenges/playground/HintConfirmDialog';

// Mock dependencies
mock.module('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

mock.module('lucide-react', () => ({
    AlertCircle: () => <svg data-testid="alert-icon" />,
    Lightbulb: () => <svg data-testid="lightbulb-icon" />,
    Loader2: () => <svg data-testid="loader-icon" />,
    Sparkles: () => <svg data-testid="sparkles-icon" />,
}));

// Mock Dialog components to render content immediately if open
mock.module('@/components/ui/dialog', () => ({
    Dialog: ({ open, children }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
    DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
    DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

describe('Playground Dialogs', () => {
    afterEach(cleanup);

    describe('ResetConfirmDialog', () => {
        const defaultProps = {
            open: true,
            onOpenChange: mock(),
            onConfirm: mock(),
        };

        it('should render when open', () => {
            render(<ResetConfirmDialog {...defaultProps} />);
            expect(screen.getByTestId('dialog-root')).toBeTruthy();
            expect(screen.getByText('challenges:playground.resetTitle')).toBeTruthy();
        });

        it('should not render when closed', () => {
            render(<ResetConfirmDialog {...defaultProps} open={false} />);
            expect(screen.queryByTestId('dialog-root')).toBeNull();
        });

        it('should call onConfirm when reset button clicked', () => {
            render(<ResetConfirmDialog {...defaultProps} />);

            const resetBtn = screen.getByText('common:actions.reset');
            fireEvent.click(resetBtn);

            expect(defaultProps.onConfirm).toHaveBeenCalled();
        });

        it('should call onOpenChange(false) when cancelled', () => {
            render(<ResetConfirmDialog {...defaultProps} />);

            const cancelBtn = screen.getByText('common:actions.cancel');
            fireEvent.click(cancelBtn);

            expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe('HintConfirmDialog', () => {
        const defaultProps = {
            open: true,
            onOpenChange: mock(),
            onConfirm: mock(),
            isPending: false,
        };

        it('should render warning info', () => {
            render(<HintConfirmDialog {...defaultProps} />);

            expect(screen.getByText('challenges:hints.warningTitle')).toBeTruthy();
            expect(screen.getByText('challenges:hints.penalty')).toBeTruthy();
        });

        it('should show loader when pending', () => {
            render(<HintConfirmDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('loader-icon')).toBeTruthy();
            const confirmBtn = screen.getByTestId('loader-icon').closest('button');
            expect(confirmBtn).toHaveProperty('disabled', true);
        });

        it('should call onConfirm when confirmed', () => {
            render(<HintConfirmDialog {...defaultProps} />);

            const confirmBtn = screen.getByText('challenges:hints.confirm');
            fireEvent.click(confirmBtn);

            expect(defaultProps.onConfirm).toHaveBeenCalled();
        });
    });
});
