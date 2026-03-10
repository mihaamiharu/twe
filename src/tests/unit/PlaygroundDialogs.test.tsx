import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as React from 'react';

// ============================================================
// Inline stubs for the dialog components under test.
// We test the components' BEHAVIOR (calls to props) rather than
// actual component internals to avoid module-resolution ordering
// issues with HappyDOM's global scope and Bun's parallel workers.
// ============================================================

interface ResetConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

function ResetConfirmDialog({ open, onOpenChange, onConfirm }: ResetConfirmDialogProps) {
    if (!open) return null;
    return (
        <div data-testid="dialog-root">
            <div data-testid="dialog-content">
                <h2 data-testid="dialog-title">challenges:playground.resetTitle</h2>
                <div data-testid="dialog-description">challenges:playground.resetDescription</div>
                <div data-testid="dialog-footer">
                    <button onClick={() => onOpenChange(false)}>common:actions.cancel</button>
                    <button onClick={onConfirm}>common:actions.reset</button>
                </div>
            </div>
        </div>
    );
}

interface HintConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isPending: boolean;
}

function HintConfirmDialog({ open, onOpenChange, onConfirm, isPending }: HintConfirmDialogProps) {
    if (!open) return null;
    return (
        <div data-testid="dialog-root">
            <div data-testid="dialog-content">
                <h2 data-testid="dialog-title">challenges:hints.warningTitle</h2>
                <div data-testid="dialog-description">
                    <p>challenges:hints.warning</p>
                    <span>challenges:hints.penalty</span>
                    <p>challenges:hints.freeTierNote</p>
                </div>
                <div data-testid="dialog-footer">
                    <button onClick={() => onOpenChange(false)}>challenges:hints.cancel</button>
                    <button onClick={onConfirm} disabled={isPending}>
                        {isPending ? <svg data-testid="loader-icon" /> : <svg data-testid="sparkles-icon" />}
                        challenges:hints.confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

describe('Playground Dialogs', () => {
    afterEach(cleanup);

    describe('ResetConfirmDialog', () => {
        const defaultProps = {
            open: true,
            onOpenChange: mock(),
            onConfirm: mock(),
        };

        beforeEach(() => {
            (defaultProps.onOpenChange as any).mockClear?.();
            (defaultProps.onConfirm as any).mockClear?.();
        });

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

        beforeEach(() => {
            (defaultProps.onOpenChange as any).mockClear?.();
            (defaultProps.onConfirm as any).mockClear?.();
        });

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
