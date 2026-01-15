/**
 * ChallengePlayground - Main challenge solving interface
 *
 * Features:
 * - Resizable Split layout (description | code editor | results)
 * - Console Output for debugging
 * - Challenge description and instructions
 * - Code editor with Monaco
 * - Test results display
 * - Run/Submit buttons
 * - Responsive design
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { executePlaywrightCode } from '@/core/executor';
import {
  Play,
  Send,
  RotateCcw,
  Zap,
  Loader2,
  Target,
  BookOpen,
  Lightbulb,
  Sparkles,
  AlertCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { storage } from '@/lib/storage-adapter';
import { localeSlugParams, LocaleRoutes } from '@/lib/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { CodeEditor } from './CodeEditor';
import { WebComponentPreview } from './WebComponentPreview';
import { TestResults, type TestResult } from './TestResults';
import { ConsoleOutput, type LogEntry } from './ConsoleOutput';

import { SelectorInput, type SelectorType } from './SelectorInput';

const defaultSelectorStyles = `
/* Base Layout */
body { font-family: 'Outfit', system-ui, sans-serif; background: #f8fafc; color: #334155; }
h1, h2, h3, h4 { color: #0f172a; margin-top: 0; }

/* Components */
.card, .profile-card, .welcome-card, .login-wrapper, article {
  background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 1.5rem;
}

/* Forms */
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { 
  padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%;
  font-size: 0.9rem; transition: border-color 0.2s;
}
input:focus { outline: none; border-color: #3b82f6; ring: 2px solid rgba(59,130,246,0.1); }
label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: #475569; }

/* Buttons */
button, .btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 500; font-size: 0.9rem;
  cursor: pointer; transition: all 0.2s; border: 1px solid #cbd5e1;            
  background-color: #f1f5f9; color: #334155;
}
button:hover, .btn:hover { background-color: #e2e8f0; border-color: #94a3b8; }
button.primary, .btn.primary, button[type="submit"] {
  background-color: #0f172a; color: white; border-color: #0f172a;
}
button.primary:hover, .btn.primary:hover, button[type="submit"]:hover {
  background-color: #1e293b; border-color: #1e293b;
}

/* Nav */
nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem; margin: -16px -16px 1.5rem -16px; }
nav ul { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }
nav a { text-decoration: none; color: #64748b; font-weight: 500; }
nav a:hover { color: #0f172a; }

/* Message Banners */
.msg {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  font-weight: 500;
}
.msg.error {
  background-color: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}
.msg.success {
  background-color: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

/* Utils */
.error, .error-text { color: #ef4444; font-size: 0.875rem; }
.success { color: #22c55e; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #e2e8f0; color: #475569; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.suspended { background: #fee2e2; color: #991b1b; }
`;

export type ChallengeType =
  | 'JAVASCRIPT'
  | 'PLAYWRIGHT'
  | 'CSS_SELECTOR'
  | 'XPATH_SELECTOR';

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xp: number;
  instructions: string;
  starterCode: string;
  htmlContent?: string;
  targetSelector?: string | string[];

  testCases?: {
    id: string;
    name: string;
    input?: unknown;
    expectedOutput?: unknown;
  }[];
  category?: string;
  tutorial?: {
    slug: string;
    title: string;
  };
  isCompleted?: boolean;
  nextChallenge?: {
    slug: string;
    title: string;
  };
  prevChallenge?: {
    slug: string;
    title: string;
  };
}

export interface ChallengePlaygroundProps {
  challenge: Challenge;
  onSubmit: (data: {
    code: string;
    passed: boolean;
    testResults: TestResult[];
    executionTime?: number;
  }) => void;
  userId?: string;
  className?: string;
  hintUsed?: boolean; // Whether user has already used hint for this challenge
}

export function ChallengePlayground({
  challenge,
  onSubmit,
  userId,
  className,
  hintUsed: initialHintUsed = false,
}: ChallengePlaygroundProps) {
  const { t, i18n } = useTranslation(['challenges', 'common']);
  const locale = i18n.language;

  const [code, setCode] = useState(challenge.starterCode);
  const [selector, setSelector] = useState('');
  const [resetCount, setResetCount] = useState(0);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // AI Hint state
  const [isHintDialogOpen, setIsHintDialogOpen] = useState(false);
  const [hintContent, setHintContent] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(initialHintUsed);

  // AI Hint mutation
  const hintMutation = useMutation({
    mutationFn: async () => {
      const { getAIHint } = await import('@/server/ai.fn');
      const currentCode = isCodeChallenge ? code : selector;
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
        setHintUsed(true);
      } else if (!result.success && result.error) {
        toast.error(t('challenges:hints.errorTitle', 'Hint Generation Failed'), {
          description: result.error,
        });
      }
    },
    onError: (error) => {
      console.error('[AI Hint] Error:', error);
      setIsHintDialogOpen(false);
      toast.error(t('challenges:hints.errorTitle', 'Error'), {
        description: t('challenges:hints.errorGeneric', 'Something went wrong. Please try again.'),
      });
    },
  });

  const [selectorType, setSelectorType] = useState<SelectorType>(
    challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css',
  );

  // Layout state
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset state when challenge changes
  useEffect(() => {
    setCode(challenge.starterCode);
    setSelector('');
    setSelectorType(challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css');
    setTestResults([]);
    setHasPassed(false);
    setIsRunning(false);
    setActiveTab('instructions');
    setPreviewValidation(null);
    setHintContent(null);
    setHintUsed(initialHintUsed);
  }, [challenge.id, challenge.starterCode, challenge.type, initialHintUsed]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [resultsTab, setResultsTab] = useState<'results' | 'console'>(
    'results',
  );

  const [isRunning, setIsRunning] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  const [activeTab, setActiveTab] = useState('instructions');

  const isCodeChallenge =
    challenge.type === 'JAVASCRIPT' || challenge.type === 'PLAYWRIGHT';
  const isSelectorChallenge =
    challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR';

  // State to store real-time validation result from preview
  const [previewValidation, setPreviewValidation] = useState<{
    isValid: boolean;
    matchCount: number;
  } | null>(null);

  // Ref for the preview iframe (used for in-tab code execution)
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Run code for Playwright/JS challenges - now executes in the preview tab
  const handleRunCode = useCallback(async () => {
    // Validation for JS challenges that just need logical execution
    const needsHtmlRun =
      challenge.htmlContent && challenge.type !== 'JAVASCRIPT';

    if (!isCodeChallenge) return;

    // Switch to preview tab to show execution ONLY if needed (e.g. Playwright)
    if (needsHtmlRun) {
      setActiveTab('preview');
    }

    setIsRunning(true);
    setTestResults([]);
    setConsoleLogs([]);

    // Small delay to ensure tab switch completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Modify code to return result if it's a JS challenge
      let codeToRun = code;
      if (challenge.type === 'JAVASCRIPT' || challenge.type === 'PLAYWRIGHT') {
        // Append a safe conditional return for 'result'
        // This works even if user has nested return statements in functions
        codeToRun += '\nif (typeof result !== "undefined") return result;';
      }

      const result = await executePlaywrightCode(
        codeToRun,
        challenge.htmlContent || '<div></div>',
        {
          timeout: 10000,
          existingIframe: previewIframeRef.current || undefined,
          strictMode: challenge.type === 'PLAYWRIGHT',
        },
      );

      // If we have test cases (especially for JS fundamentals), allow validation against return value
      let validationPassed = result.status === 'PASSED';
      let outputMessage = result.output;

      const isCodeType =
        challenge.type === 'JAVASCRIPT' || challenge.type === 'PLAYWRIGHT';
      const isAssertionChallenge =
        challenge.category === 'playwright-assertions';

      // Special handling for assertion challenges: validate based on assertion success + count
      if (isAssertionChallenge && result.status === 'PASSED') {
        const assertionCount = result.assertionCount ?? 0;
        if (assertionCount === 0) {
          validationPassed = false;
          outputMessage =
            "No assertions were called. Write assertions like: await expect(locator).toHaveText('...');";
          result.status = 'FAILED';
        } else {
          outputMessage = t('challenges:playground.correct');
        }
      }
      // Standard code challenges: compare return value against expected output
      else if (
        isCodeType &&
        !isAssertionChallenge &&
        challenge.testCases?.length &&
        result.status === 'PASSED'
      ) {
        const expected = challenge.testCases[0].expectedOutput;
        const actual = result.returnValue;

        // Normalize expected output (handle {value: "1"} vs "1")
        let expectedValue = expected;
        if (expected && typeof expected === 'object' && 'value' in expected) {
          expectedValue = (expected as { value: unknown }).value;
        }

        // Loose equality check for convenience (string '1' == number 1)
        if (
          actual != expectedValue &&
          String(actual) !== String(expectedValue)
        ) {
          validationPassed = false;
          // Don't reveal expected value to prevent cheating
          outputMessage =
            actual === undefined
              ? t('challenges:playground.jsUndefined')
              : t('challenges:playground.jsMismatch');
          result.status = 'FAILED';
        } else {
          outputMessage = `${t('challenges:playground.correct')} Result is ${String(actual)}`;
        }
      }

      const testResult: TestResult = {
        id: 'main',
        name: t('challenges:playground.results'),
        passed: validationPassed,
        error: !validationPassed ? result.error || outputMessage : undefined,
        executionTime: result.executionTime,
      };

      setTestResults([testResult]);
      setHasPassed(validationPassed);

      // Capture console logs from execution
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
          name: t('challenges:playground.executionError'),
          passed: false,
          error:
            error instanceof Error ? error.message : t('common:messages.error'),
        },
      ]);
      setHasPassed(false);
    } finally {
      setIsRunning(false);
    }
  }, [
    code,
    challenge.htmlContent,
    isCodeChallenge,
    challenge.type,
    challenge.testCases,
  ]);

  // Handle real-time validation updates from preview
  const handlePreviewValidation = useCallback(
    (result: { isValid: boolean; matchCount: number }) => {
      setPreviewValidation(result);

      // Optional: Update UI validation state in real-time if desired,
      // but for now we stick to "Test Selector" button workflow
    },
    [],
  );

  // Validate selector for CSS/XPath challenges
  const handleValidateSelector = useCallback(() => {
    if (!isSelectorChallenge || !challenge.targetSelector) return;

    // Use the DOM-based validation result if available
    let isValid = false;
    if (previewValidation) {
      isValid = previewValidation.isValid;
    } else {
      // Fallback to string comparison (legacy behavior)
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
          error: t('challenges:playground.selectorMismatch'),
        },
      ]);
    }
  }, [
    selector,
    challenge.targetSelector,
    isSelectorChallenge,
    previewValidation,
  ]);

  // Reset to starter code - show confirmation first
  const handleReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  // Perform the actual reset
  const confirmReset = useCallback(async () => {
    const storageKey = userId
      ? `challenge-${challenge.id}-${userId}`
      : `challenge-${challenge.id}`;

    // Clear persistence
    await storage.removeItem(storageKey);

    // Reset state
    setCode(challenge.starterCode);
    setSelector('');
    setTestResults([]);
    setHasPassed(false);
    setPreviewValidation(null);

    // Force re-mount of code editor to pick up reset code
    setResetCount((prev) => prev + 1);
    setIsResetConfirmOpen(false);
  }, [challenge.id, challenge.starterCode, userId]);

  // Submit solution
  const handleSubmit = useCallback(() => {
    const submissionCode = isCodeChallenge ? code : selector;
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
  }, [code, selector, hasPassed, onSubmit, isCodeChallenge, testResults]);

  // Handle selector changes
  const handleSelectorChange = useCallback(
    (value: string, type: SelectorType) => {
      setSelector(value);
      setSelectorType(type);
    },
    [],
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run Code: Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (isCodeChallenge && !isRunning) {
          void handleRunCode();
        } else if (isSelectorChallenge && selector) {
          handleValidateSelector();
        }
      }

      // Submit: Cmd/Ctrl + Shift + Enter
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (hasPassed) {
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
    isCodeChallenge,
    isSelectorChallenge,
    isRunning,
    selector,
    hasPassed,
  ]);

  // Mobile fallback layout (Stack)
  const mobileLayout = (
    <div className="flex-1 overflow-auto p-4 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="instructions" className="flex-1">
            {t('challenges:playground.instructions')}
          </TabsTrigger>
          {challenge.htmlContent && (
            <TabsTrigger value="preview" className="flex-1">
              {t('challenges:playground.preview')}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="instructions" className="mt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={challenge.instructions} />
          </div>
        </TabsContent>
        <TabsContent
          value="preview"
          className="mt-4 h-[400px]"
        >
          {challenge.htmlContent && (
            <WebComponentPreview
              htmlContent={challenge.htmlContent}
              cssContent={defaultSelectorStyles}
              userSelector={isSelectorChallenge ? selector : undefined}
              selectorType={selectorType}
              targetSelector={challenge.targetSelector as string}
              targetSelectorType={
                challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
              }
              onValidationChange={handlePreviewValidation}
              className="bg-white rounded-lg border h-full"
              showControls={true}
              height="100%"
              iframeRef={previewIframeRef}
            />
          )}
        </TabsContent>
      </Tabs>

      {isCodeChallenge && (
        <div className="h-[400px] border border-border rounded-lg overflow-hidden">
          <CodeEditor
            initialCode={challenge.starterCode}
            language="javascript"
            onChange={setCode}
            onRun={() => void handleRunCode()}
            storageKey={
              userId
                ? `challenge-${challenge.id}-${userId}`
                : `challenge-${challenge.id}`
            }
            height="100%"
            className="h-full"
            key={`${challenge.id}-${resetCount}`}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t('challenges:playground.results')}</h3>
          {isCodeChallenge && (
            <Button
              size="sm"
              onClick={() => void handleRunCode()}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {t('common:actions.run')}
            </Button>
          )}
        </div>

        {isCodeChallenge && (
          <div className="border-t border-border pt-4">
            <h3 className="font-bold mb-2">
              {t('challenges:playground.results')}
            </h3>
            <TestResults
              results={testResults}
              isRunning={isRunning}
              challengeType={challenge.type}
            />
          </div>
        )}
      </div>
    </div>
  );

  const desktopLayout = (
    <PanelGroup direction="horizontal" autoSaveId={`challenge-layout-v1`}>
      {/* Left Panel: Instructions & Preview */}
      <Panel defaultSize={40} minSize={20} className="flex flex-col bg-muted/5">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pt-4 pb-2 shrink-0">
            <TabsList className="w-full justify-start h-10 bg-muted/50 p-1 border border-border rounded-lg">
              <TabsTrigger value="instructions" className="flex-1">
                {t('challenges:playground.instructions')}
              </TabsTrigger>
              {challenge.htmlContent && (
                <TabsTrigger value="preview" className="flex-1">
                  {t('challenges:playground.preview')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent
            value="instructions"
            className="flex-1 overflow-auto p-6 focus-visible:ring-0"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-border">
              <MarkdownRenderer content={challenge.instructions} />
            </div>
          </TabsContent>

          {challenge.htmlContent && (
            <TabsContent
              value="preview"
              className="flex-1 overflow-hidden p-4 focus-visible:ring-0 flex flex-col"
            >
              <WebComponentPreview
                htmlContent={challenge.htmlContent}
                cssContent={defaultSelectorStyles}
                userSelector={isSelectorChallenge ? selector : undefined}
                selectorType={selectorType}
                targetSelector={challenge.targetSelector as string}
                targetSelectorType={
                  challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
                }
                onValidationChange={handlePreviewValidation}
                className="flex-1 border border-border rounded-xl bg-white shadow-sm"
                showControls={true}
                height="100%"
                iframeRef={previewIframeRef}
              />
            </TabsContent>
          )}
        </Tabs>
      </Panel>

      <PanelResizeHandle className="w-3 bg-transparent hover:bg-primary/5 transition-colors focus:outline-none flex items-center justify-center group relative z-10 -mx-1.5 cursor-col-resize">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-border group-hover:bg-primary/50 transition-colors" />
        <div className="h-8 w-4 bg-background border border-border rounded-md flex items-center justify-center shadow-sm z-20 group-hover:border-primary group-hover:shadow-md transition-all scale-90 group-hover:scale-100">
          <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </PanelResizeHandle>

      {/* Right Panel: Editor & Results */}
      <Panel minSize={30} className="flex flex-col bg-background relative z-0">
        {/* Top: Editor */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isCodeChallenge ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/5 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  {t('challenges:playground.editor')}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={handleReset}
                    title={t('challenges:playground.resetCode')}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <CodeEditor
                  initialCode={challenge.starterCode}
                  language="javascript"
                  onChange={setCode}
                  onRun={() => void handleRunCode()}
                  storageKey={
                    userId
                      ? `challenge-${challenge.id}-${userId}`
                      : `challenge-${challenge.id}`
                  }
                  height="100%"
                  className="h-full border-b border-border"
                  key={`${challenge.id}-${resetCount}`}
                />
              </div>
            </div>
          ) : (
            /* Selector Input for CSS challenges */
            <div className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90 italic">
                    <div className="h-6 w-6 rounded-full bg-brand-teal flex items-center justify-center text-xs font-bold text-black border-2 border-border hard-shadow-sm">
                      1
                    </div>
                    {t('challenges:playground.step1')}
                  </h3>
                  <Card className="border border-border rounded-xl shadow-sm overflow-hidden bg-muted/5">
                    <CardContent className="p-4 space-y-4">
                      <SelectorInput
                        value={selector}
                        onChange={handleSelectorChange}
                        onValidate={handleValidateSelector}
                        defaultType={selectorType}
                        allowTypeChange={true}
                      />
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleValidateSelector}
                          disabled={isRunning || !selector}
                          className="font-bold border border-border bg-brand-teal hover:bg-brand-teal/90 text-black dark:text-black transition-all"
                        >
                          {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          {t('challenges:playground.testSelector')}
                        </Button>

                        {/* Inline validation badge */}
                        {testResults.length > 0 && (
                          <div
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                              hasPassed
                                ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                : 'bg-red-500/10 text-red-600 border border-red-500/30',
                            )}
                          >
                            {hasPassed ? (
                              <>
                                <Zap className="h-4 w-4 fill-current" />{' '}
                                {t('challenges:playground.correct')}
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 shrink-0" />{' '}
                                {testResults[0]?.error ||
                                  t('challenges:playground.selectorMismatch')}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Results & Console - Only for code challenges */}
        {isCodeChallenge && (
          <div className="h-[40%] flex flex-col shrink-0 border-t border-border bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/10 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setResultsTab('results')}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                    resultsTab === 'results'
                      ? 'bg-brand-teal/20 text-brand-teal-dark'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {t('challenges:playground.results')}
                </button>
                <button
                  onClick={() => setResultsTab('console')}
                  className={cn(
                    'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                    resultsTab === 'console'
                      ? 'bg-brand-teal/20 text-brand-teal-dark'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {t('challenges:playground.console')}
                  {consoleLogs.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-muted rounded-full">
                      {consoleLogs.length}
                    </span>
                  )}
                </button>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => void handleRunCode()}
                      disabled={isRunning}
                      className="h-7 text-xs font-bold bg-brand-teal text-black hover:bg-brand-teal/90"
                    >
                      {isRunning ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      {t('common:actions.run')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('common:actions.runTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 overflow-auto">
              {resultsTab === 'results' ? (
                <div className="p-4 pt-2">
                  <TestResults
                    results={testResults}
                    isRunning={isRunning}
                    challengeType={challenge.type}
                    className="border-0 shadow-none bg-transparent"
                  />
                </div>
              ) : (
                <ConsoleOutput
                  logs={consoleLogs}
                  onClear={() => setConsoleLogs([])}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
      </Panel>
    </PanelGroup>
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background animate-fade-in',
        className,
      )}
    >
      {/* Practice Mode Banner */}
      {challenge.isCompleted && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center justify-center gap-2 text-blue-600 text-sm font-medium animate-in slide-in-from-top-2">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300">
            {t('challenges:practice.badge')}
          </Badge>
          <Zap className="h-4 w-4 fill-current" />
          {t('challenges:playground.alreadyCompleted')}
        </div>
      )}


      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-bold text-xl tracking-tight text-foreground">
              {challenge.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Badge
                variant="secondary"
                className="font-bold border border-border/50"
              >
                {t(
                  `challenges:difficulty.${challenge.difficulty.toUpperCase()}`,
                )}
              </Badge>
              <Badge
                variant="outline"
                className="font-bold border-border/50 bg-background"
              >
                {t(
                  `challenges:types.${challenge.type?.toLowerCase() || 'unknown'}`,
                )}
              </Badge>
              <span className="text-accent flex items-center gap-1 font-bold">
                <Zap className="h-3 w-3 fill-current" />
                {challenge.xp} XP
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Navigation Buttons */}
          <div className="flex items-center mr-2 bg-muted/30 rounded-lg p-0.5 border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              disabled={!challenge.prevChallenge}
              onClick={() => {
                if (challenge.prevChallenge) {
                  window.location.href = `/${locale}/challenges/${challenge.prevChallenge.slug}`;
                }
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={challenge.prevChallenge ? t('common:actions.previous') : undefined}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              disabled={!challenge.nextChallenge}
              onClick={() => {
                if (challenge.nextChallenge) {
                  window.location.href = `/${locale}/challenges/${challenge.nextChallenge.slug}`;
                }
              }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={challenge.nextChallenge ? t('common:actions.next') : undefined}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Run Button */}
          {isMobile && isCodeChallenge && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRunCode()}
              disabled={isRunning}
              className="font-bold border-brand-teal text-brand-teal-dark hover:bg-brand-teal/10"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}

          {challenge.tutorial && (
            <Link
              to={LocaleRoutes.tutorialDetail}
              params={localeSlugParams(locale, challenge.tutorial.slug)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex font-bold text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t('common:navigation.tutorials')}
              </Button>
            </Link>
          )}

          {/* AI Hint Button (Temporarily Disabled) */}
          {false && !challenge.isCompleted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (hintUsed || !userId) ? null : setIsHintDialogOpen(true)}
                    disabled={hintMutation.isPending || !userId}
                    className={cn(
                      'font-bold border transition-all',
                      hintUsed || !userId
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-600/60 cursor-default opacity-80'
                        : 'border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500',
                    )}
                  >
                    {hintMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    {hintUsed ? t('challenges:hints.used') : t('challenges:hints.button')}
                    {!hintUsed && (
                      <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-700 text-xs">
                        {t('challenges:hints.penalty')}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!userId
                    ? t('challenges:hints.loginRequired')
                    : hintUsed
                      ? t('challenges:hints.alreadyUsed')
                      : t('challenges:hints.warning')
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!hasPassed}
                  className={cn(
                    'font-bold border border-border transition-all',
                    hasPassed
                      ? 'bg-green-500 hover:bg-green-600 text-black'
                      : 'bg-muted text-muted-foreground disabled:opacity-100 cursor-not-allowed',
                  )}
                  title={!hasPassed ? t('common:actions.submit') : undefined}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('common:actions.submit')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Submit solution (⌘/Ctrl + Shift + Enter)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Persistent Goal Bar - Compact */}
      <div className="bg-brand-teal/5 border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand-teal/20 p-1 rounded-md shrink-0 border border-brand-teal/30">
            <Target className="h-3.5 w-3.5 text-brand-teal-dark" />
          </div>
          <p className="text-sm font-bold text-foreground/90 leading-tight">
            <span className="text-brand-teal mr-2">
              {t('challenges:playground.goal')}
            </span>
            {challenge.description}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? mobileLayout : desktopLayout}
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-destructive/10 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>{t('challenges:playground.resetTitle')}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription>
            {t('challenges:playground.resetDescription')}
          </DialogDescription>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsResetConfirmOpen(false)}
              className="hover:bg-accent"
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmReset()}
              className="shadow-sm"
            >
              {t('common:actions.reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Hint Confirmation Dialog */}
      <Dialog open={isHintDialogOpen} onOpenChange={setIsHintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500/10 p-2 rounded-full">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle>{t('challenges:hints.warningTitle')}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="space-y-3" asChild>
            <div className="text-muted-foreground text-sm space-y-3">
              <p>{t('challenges:hints.warning')}</p>
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm font-medium text-amber-700">
                  {t('challenges:hints.penalty')}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border/50">
                {t('challenges:hints.freeTierNote')}
              </p>
            </div>
          </DialogDescription>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsHintDialogOpen(false)}
              className="hover:bg-accent"
            >
              {t('challenges:hints.cancel')}
            </Button>
            <Button
              onClick={() => hintMutation.mutate()}
              disabled={hintMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              {hintMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t('challenges:hints.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Hint Display Panel (floating) */}
      {hintContent && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
          <Card className="border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/95 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/20 p-1.5 rounded-full shrink-0 mt-0.5">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                      {t('challenges:hints.title')}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHintContent(null)}
                      className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-500/20"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed markdown-prose">
                    <ReactMarkdown
                      components={{
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const content = String(children).replace(/\n$/, '');
                          const isInline = !match && !content.includes('\n');
                          return (
                            <code
                              className={cn(
                                'font-mono text-xs rounded px-1 py-0.5',
                                isInline
                                  ? 'bg-amber-600/10 text-amber-800 dark:text-amber-200'
                                  : 'block bg-black/80 text-white p-2 my-2 rounded-md overflow-x-auto',
                                className
                              )}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      }}
                    >
                      {hintContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ChallengePlayground;
