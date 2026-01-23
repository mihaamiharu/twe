import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ChallengePlaygroundProps,
  usePlaygroundState,
  useChallengeExecution,
  PlaygroundHeader,
  PlaygroundGoalBar,
  PlaygroundMobileLayout,
  PlaygroundDesktopLayout,
  ResetConfirmDialog,
  HintConfirmDialog,
  HintDisplayPanel,
  LoadingOverlay,
  PracticeModeBanner
} from './playground';

/**
 * ChallengePlayground - Main challenge solving interface
 * 
 * Refactored in 2026 for improved maintainability.
 * This component acts as an orchestrator that composes smaller components
 * and delegates logic to custom hooks.
 */
export function ChallengePlayground(props: ChallengePlaygroundProps) {
  const { challenge, className } = props;

  // Initialize state and execution logic
  const state = usePlaygroundState(props);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const execution = useChallengeExecution(state, props, previewIframeRef);

  const {
    handleRunCode,
    handleValidateSelector,
    handleSubmit,
    confirmReset,
    hintMutation,
  } = execution;

  // Fallback: If layout isn't ready after 5 seconds, force it.
  // This prevents infinite loading if the editor fails to report ready.
  useEffect(() => {
    if (!state.isLayoutReady && state.isCodeChallenge) {
      const timer = setTimeout(() => {
        console.warn('[ChallengePlayground] Layout load timeout - forcing ready state');
        state.setIsLayoutReady(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.isLayoutReady, state.isCodeChallenge]);

  // Keyboard Shortcuts (Cmd/Ctrl + Enter to run, + Shift + Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run: Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (state.isCodeChallenge && !state.isRunning) {
          void handleRunCode();
        } else if (state.isSelectorChallenge && state.selector) {
          handleValidateSelector();
        }
      }

      // Submit: Cmd/Ctrl + Shift + Enter
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (state.hasPassed) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleRunCode,
    handleValidateSelector,
    handleSubmit,
    state.isCodeChallenge,
    state.isSelectorChallenge,
    state.isRunning,
    state.selector,
    state.hasPassed,
  ]);

  return (
    <div className={cn('relative flex flex-col h-full bg-background animate-fade-in', className)}>
      {/* Practice Mode Banner */}
      {challenge.isCompleted && <PracticeModeBanner />}

      {/* Header with Nav and Buttons */}
      <PlaygroundHeader
        challenge={challenge}
        locale={state.locale}
        userId={props.userId}
        isMobile={state.isMobile}
        isCodeChallenge={state.isCodeChallenge}
        isRunning={state.isRunning}
        hasPassed={state.hasPassed}
        hintUsed={state.hintUsed}
        isHintPending={hintMutation.isPending}
        onRunCode={() => void handleRunCode()}
        onOpenHintDialog={() => state.setIsHintDialogOpen(true)}
        onSubmit={handleSubmit}
      />

      {/* Persistent Goal Bar */}
      <PlaygroundGoalBar description={challenge.description} />

      {/* Main content - uses Skeleton until ready */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={cn(
            "w-full h-full transition-opacity duration-300",
            state.isLayoutReady ? "opacity-100" : "opacity-0 invisible"
          )}
        >
          {state.isMobile ? (
            <PlaygroundMobileLayout
              challenge={challenge}
              state={state}
              execution={execution}
              previewIframeRef={previewIframeRef}
            />
          ) : (
            <PlaygroundDesktopLayout
              challenge={challenge}
              state={state}
              execution={execution}
              previewIframeRef={previewIframeRef}
              userId={props.userId}
            />
          )}
        </div>

        {/* Loading Overlay (Fade out when ready) */}
        {!state.isLayoutReady && <LoadingOverlay />}
      </div>

      {/* Dialogs & Popups */}
      <ResetConfirmDialog
        open={state.isResetConfirmOpen}
        onOpenChange={state.setIsResetConfirmOpen}
        onConfirm={() => void confirmReset()}
      />

      <HintConfirmDialog
        open={state.isHintDialogOpen}
        onOpenChange={state.setIsHintDialogOpen}
        onConfirm={() => hintMutation.mutate()}
        isPending={hintMutation.isPending}
      />

      {state.hintContent && (
        <HintDisplayPanel
          content={state.hintContent}
          onClose={() => state.setHintContent(null)}
        />
      )}
    </div>
  );
}

export default ChallengePlayground;
