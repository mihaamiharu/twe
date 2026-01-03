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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { executePlaywrightCode } from '@/lib/challenge-executor';
import { Play, Send, RotateCcw, Zap, Loader2, Target, BookOpen, AlertCircle, GripVertical } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { storage } from '@/lib/storage-adapter';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { CodeEditor } from './CodeEditor';
import { WebComponentPreview } from './WebComponentPreview';
import { TestResults, type TestResult } from './TestResults';


import { SelectorInput, type SelectorType } from './SelectorInput';

const defaultSelectorStyles = `
/* Base Layout */
body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; color: #334155; }
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

/* Utils */
.error, .error-text { color: #ef4444; font-size: 0.875rem; }
.success { color: #22c55e; }
.badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #e2e8f0; color: #475569; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.suspended { background: #fee2e2; color: #991b1b; }
`;

export type ChallengeType = 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR';

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

    testCases?: { id: string; name: string; input?: unknown; expectedOutput?: unknown }[];
    tutorial?: {
        slug: string;
        title: string;
    };
    isCompleted?: boolean;
}

export interface ChallengePlaygroundProps {
    challenge: Challenge;
    onSubmit: (data: {
        code: string;
        passed: boolean;
        testResults: TestResult[];
        executionTime?: number
    }) => void;
    userId?: string;
    className?: string;
}

export function ChallengePlayground({ challenge, onSubmit, userId, className }: ChallengePlaygroundProps) {
    const [code, setCode] = useState(challenge.starterCode);
    const [selector, setSelector] = useState('');
    const [resetCount, setResetCount] = useState(0);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const [selectorType, setSelectorType] = useState<SelectorType>(
        challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
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
    }, [challenge.id, challenge.starterCode, challenge.type]);

    const [testResults, setTestResults] = useState<TestResult[]>([]);

    const [isRunning, setIsRunning] = useState(false);
    const [hasPassed, setHasPassed] = useState(false);

    const [activeTab, setActiveTab] = useState('instructions');

    const isCodeChallenge = challenge.type === 'JAVASCRIPT' || challenge.type === 'PLAYWRIGHT';
    const isSelectorChallenge = challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR';

    // State to store real-time validation result from preview
    const [previewValidation, setPreviewValidation] = useState<{ isValid: boolean; matchCount: number } | null>(null);

    // Ref for the preview iframe (used for in-tab code execution)
    const previewIframeRef = useRef<HTMLIFrameElement>(null);

    // Run code for Playwright/JS challenges - now executes in the preview tab
    const handleRunCode = useCallback(async () => {
        // Validation for JS challenges that just need logical execution
        const needsHtmlRun = challenge.htmlContent && challenge.type !== 'JAVASCRIPT';

        if (!isCodeChallenge) return;

        // Switch to preview tab to show execution ONLY if needed (e.g. Playwright)
        if (needsHtmlRun) {
            setActiveTab('preview');
        }

        setIsRunning(true);
        setTestResults([]);
        setIsRunning(true);
        setTestResults([]);

        // Small delay to ensure tab switch completes
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Modify code to return result if it's a JS challenge
            let codeToRun = code;
            if (challenge.type === 'JAVASCRIPT' && !code.includes('return ')) {
                codeToRun += '\nlet __result__; try { __result__ = result; } catch(e) {}; return __result__;';
            }

            const result = await executePlaywrightCode(codeToRun, challenge.htmlContent || '<div></div>', {
                timeout: 10000,
                existingIframe: previewIframeRef.current || undefined,
            });



            // If we have test cases (especially for JS fundamentals), allow validation against return value
            let validationPassed = result.status === 'PASSED';
            let outputMessage = result.output;

            if (challenge.type === 'JAVASCRIPT' && challenge.testCases?.length && result.status === 'PASSED') {
                const expected = challenge.testCases[0].expectedOutput;
                const actual = result.returnValue;

                // Normalize expected output (handle {value: "1"} vs "1")
                let expectedValue = expected;
                if (expected && typeof expected === 'object' && 'value' in expected) {
                    expectedValue = (expected as { value: unknown }).value;
                }

                // Loose equality check for convenience (string '1' == number 1)
                if (actual != expectedValue && String(actual) !== String(expectedValue)) {
                    validationPassed = false;
                    // Don't reveal expected value to prevent cheating
                    outputMessage = actual === undefined
                        ? 'Your result is undefined. Make sure you assign a value to `result`.'
                        : 'Your result doesn\'t match the expected output. Check your logic and try again.';
                    result.status = 'FAILED';
                } else {
                    outputMessage = `Correct! Result is ${String(actual)}`;
                }
            }

            const testResult: TestResult = {
                id: 'main',
                name: 'Code Execution',
                passed: validationPassed,
                error: !validationPassed ? (result.error || outputMessage) : undefined,
                executionTime: result.executionTime,
            };

            setTestResults([testResult]);
            setHasPassed(validationPassed);

        } catch (error) {
            setTestResults([
                {
                    id: 'error',
                    name: 'Execution Error',
                    passed: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            ]);
            setHasPassed(false);
        } finally {
            setIsRunning(false);
        }
    }, [code, challenge.htmlContent, isCodeChallenge, challenge.type, challenge.testCases]);

    // Handle real-time validation updates from preview
    const handlePreviewValidation = useCallback((result: { isValid: boolean; matchCount: number }) => {
        setPreviewValidation(result);

        // Optional: Update UI validation state in real-time if desired, 
        // but for now we stick to "Test Selector" button workflow
    }, []);

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
                    error: 'Your selector does not select the correct element(s)',
                },
            ]);
        }
    }, [selector, challenge.targetSelector, isSelectorChallenge, previewValidation]);

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
        setResetCount(prev => prev + 1);
        setIsResetConfirmOpen(false);
    }, [challenge.id, challenge.starterCode, userId]);



    // Submit solution
    const handleSubmit = useCallback(() => {
        const submissionCode = isCodeChallenge ? code : selector;
        const totalExecutionTime = testResults.reduce((acc, r) => acc + (r.executionTime || 0), 0);

        onSubmit({
            code: submissionCode,
            passed: hasPassed,
            testResults,
            executionTime: totalExecutionTime
        });
    }, [code, selector, hasPassed, onSubmit, isCodeChallenge, testResults]);

    // Handle selector changes
    const handleSelectorChange = useCallback((value: string, type: SelectorType) => {
        setSelector(value);
        setSelectorType(type);
    }, []);

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
    }, [handleRunCode, handleValidateSelector, handleSubmit, handleReset, isCodeChallenge, isSelectorChallenge, isRunning, selector, hasPassed]);

    // Mobile fallback layout (Stack)
    const mobileLayout = (
        <div className="flex-1 overflow-auto p-4 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
                    {challenge.htmlContent && <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>}
                </TabsList>
                <TabsContent value="instructions" className="mt-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={challenge.instructions} />
                    </div>
                </TabsContent>
                <TabsContent value="preview" className="mt-4 h-[400px]">
                    {challenge.htmlContent && (
                        <WebComponentPreview
                            htmlContent={challenge.htmlContent}
                            userSelector={isSelectorChallenge ? selector : undefined}
                            selectorType={selectorType}
                            targetSelector={challenge.targetSelector as string}
                            targetSelectorType={challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'}
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
                        storageKey={userId ? `challenge-${challenge.id}-${userId}` : `challenge-${challenge.id}`}
                        height="100%"
                        className="h-full"
                        key={`${challenge.id}-${resetCount}`}
                    />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold">Execution</h3>
                    {isCodeChallenge && (
                        <Button size="sm" onClick={() => void handleRunCode()} disabled={isRunning}>
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                            Run
                        </Button>
                    )}
                </div>

                {isCodeChallenge && (
                    <div className="border-t border-border pt-4">
                        <h3 className="font-bold mb-2">Test Results</h3>
                        <TestResults results={testResults} isRunning={isRunning} />
                    </div>
                )}
            </div>
        </div>
    );

    // Desktop Panel Layout
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
                            <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
                            {challenge.htmlContent && (
                                <TabsTrigger value="preview" className="flex-1">Target Preview</TabsTrigger>
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
                                cssContent={isSelectorChallenge ? defaultSelectorStyles : undefined}
                                userSelector={isSelectorChallenge ? selector : undefined}
                                selectorType={selectorType}
                                targetSelector={challenge.targetSelector as string}
                                targetSelectorType={challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'}
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

            <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-brand-teal transition-colors focus:outline-none focus:bg-brand-teal flex items-center justify-center group relative z-10">
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
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
                                    Editor
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={handleReset}
                                        title="Reset Code"
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
                                    storageKey={userId ? `challenge-${challenge.id}-${userId}` : `challenge-${challenge.id}`}
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
                                        <div className="h-6 w-6 rounded-full bg-brand-teal flex items-center justify-center text-xs font-bold text-black border-2 border-border hard-shadow-sm">1</div>
                                        Step 1: Capture the Element
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
                                                    Test Selector
                                                </Button>

                                                {/* Inline validation badge */}
                                                {testResults.length > 0 && (
                                                    <div className={cn(
                                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                                                        hasPassed
                                                            ? "bg-green-500/10 text-green-600 border border-green-500/30"
                                                            : "bg-red-500/10 text-red-600 border border-red-500/30"
                                                    )}>
                                                        {hasPassed ? (
                                                            <><Zap className="h-4 w-4 fill-current" /> Correct!</>
                                                        ) : (
                                                            <><AlertCircle className="h-4 w-4 shrink-0" /> {testResults[0]?.error || 'Selector does not match the target element'}</>
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

                {/* Bottom: Results - Only for code challenges */}
                {isCodeChallenge && (
                    <div className="h-[40%] flex flex-col shrink-0 border-t border-border bg-white dark:bg-slate-950">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/10 shrink-0">
                            <h3 className="text-sm font-bold text-muted-foreground">Test Results</h3>

                            <Button
                                size="sm"
                                onClick={() => void handleRunCode()}
                                disabled={isRunning}
                                className="h-7 text-xs font-bold bg-brand-teal text-black hover:bg-brand-teal/90"
                            >
                                {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                Run
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 pt-2">
                            <TestResults results={testResults} isRunning={isRunning} className="border-0 shadow-none bg-transparent" />
                        </div>
                    </div>
                )}
            </Panel>
        </PanelGroup >
    );

    return (
        <div className={cn('flex flex-col h-full bg-background animate-fade-in', className)}>
            {/* Completion Banner */}
            {challenge.isCompleted && (
                <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center justify-center gap-2 text-green-600 text-sm font-medium animate-in slide-in-from-top-2">
                    <Zap className="h-4 w-4 fill-current" />
                    You have already completed this challenge! Feel free to practice again.
                </div>
            )}

            {/* Header */}
            <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-foreground">{challenge.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="font-bold border border-border/50">{challenge.difficulty}</Badge>
                            <Badge variant="outline" className="font-bold border-border/50 bg-background">{challenge.type.replace('_', ' ')}</Badge>
                            <span className="text-accent flex items-center gap-1 font-bold">
                                <Zap className="h-3 w-3 fill-current" />
                                {challenge.xp} XP
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Mobile Run Button */}
                    {isMobile && isCodeChallenge && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRunCode()}
                            disabled={isRunning}
                            className="font-bold border-brand-teal text-brand-teal-dark hover:bg-brand-teal/10"
                        >
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                    )}

                    {challenge.tutorial && (
                        <Link to="/tutorials/$slug" params={{ slug: challenge.tutorial.slug }}>
                            <Button variant="ghost" size="sm" className="hidden md:flex font-bold text-muted-foreground hover:text-foreground">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Tutorial
                            </Button>
                        </Link>
                    )}

                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!hasPassed}
                        className={cn(
                            "font-bold border border-border transition-all",
                            hasPassed
                                ? "bg-green-500 hover:bg-green-600 text-black"
                                : "bg-muted text-muted-foreground disabled:opacity-100 cursor-not-allowed"
                        )}
                        title="Submit Solution (Cmd/Ctrl + Shift + Enter)"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Persistent Goal Bar - Compact */}
            <div className="bg-brand-teal/5 border-b border-border px-4 py-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-teal/20 p-1 rounded-md shrink-0 border border-brand-teal/30">
                        <Target className="h-3.5 w-3.5 text-brand-teal-dark" />
                    </div>
                    <p className="text-sm font-bold text-foreground/90 leading-tight">
                        <span className="text-brand-teal mr-2">GOAL:</span>
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
                            <DialogTitle>Reset Solution?</DialogTitle>
                        </div>
                        <DialogDescription>
                            This will permanently delete your current progress and restore the challenge to its original state. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsResetConfirmOpen(false)}
                            className="hover:bg-accent"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void confirmReset()}
                            className="shadow-sm"
                        >
                            Yes, Reset Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ChallengePlayground;
