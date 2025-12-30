/**
 * ChallengePlayground - Main challenge solving interface
 * 
 * Features:
 * - Split layout (description | code editor | results)
 * - Challenge description and instructions
 * - Code editor with Monaco
 * - Test results display
 * - Run/Submit buttons
 * - Responsive tabs on mobile
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { executePlaywrightCode } from '@/lib/challenge-executor';
import { Play, Send, RotateCcw, Zap, Loader2, Target, BookOpen, AlertCircle } from 'lucide-react';
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

import { CodeEditor } from './CodeEditor';
import { WebComponentPreview } from './WebComponentPreview';
import { TestResults, type TestResult } from './TestResults';

import { SelectorInput, type SelectorType } from './SelectorInput';

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
                // eslint-disable-next-line eqeqeq
                if (actual != expectedValue && String(actual) !== String(expectedValue)) {
                    validationPassed = false;
                    outputMessage = `Expected: ${JSON.stringify(expectedValue)}, Got: ${JSON.stringify(actual)}`;
                    result.status = 'FAILED';
                } else {
                    outputMessage = `Correct! Result is ${actual}`;
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
                    handleRunCode();
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
            <div className="border-b-2 border-black bg-card px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-foreground">{challenge.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="font-bold border border-black/10">{challenge.difficulty}</Badge>
                            <Badge variant="outline" className="font-bold border-black/20">{challenge.type.replace('_', ' ')}</Badge>
                            <span className="text-accent flex items-center gap-1 font-bold">
                                <Zap className="h-3 w-3 fill-current" />
                                {challenge.xp} XP
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {challenge.tutorial && (
                        <Link to="/tutorials/$slug" params={{ slug: challenge.tutorial.slug }}>
                            <Button variant="ghost" size="sm" className="hidden md:flex font-bold text-muted-foreground hover:text-foreground">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Tutorial
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleReset} className="font-bold text-muted-foreground hover:text-destructive">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!hasPassed}
                        className={cn(
                            "font-bold border-2 border-black hard-shadow-sm transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                            hasPassed
                                ? "bg-green-500 hover:bg-green-600 text-black"
                                : "bg-muted opacity-50 cursor-not-allowed"
                        )}
                        title="Submit Solution (Cmd/Ctrl + Shift + Enter)"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Persistent Goal Bar - Compact */}
            <div className="bg-brand-teal/5 border-b-2 border-black px-4 py-2 shrink-0">
                <div className="flex items-center gap-3 max-w-5xl mx-auto">
                    <div className="bg-brand-teal/20 p-1 rounded-md shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black">
                        <Target className="h-3.5 w-3.5 text-black" />
                    </div>
                    <p className="text-sm font-bold text-foreground/90 leading-tight">
                        <span className="text-brand-teal mr-2">GOAL:</span>
                        {challenge.description}
                    </p>
                </div>
            </div>

            {/* Main content - Split layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black overflow-hidden">
                {/* Left Panel - Instructions & Preview */}
                <div className="flex flex-col overflow-hidden bg-muted/5">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <div className="px-4 pt-3 shrink-0">
                            <TabsList className="w-full justify-start h-10 bg-muted/50 p-1 border-2 border-black rounded-lg">
                                <TabsTrigger value="instructions" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-sm transition-all">Instructions</TabsTrigger>
                                {challenge.htmlContent && (
                                    <TabsTrigger value="preview" className="flex-1 font-bold data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-sm transition-all">Target Preview</TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent
                            value="instructions"
                            className="flex-1 overflow-auto p-6 focus-visible:ring-0"
                        >
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:border-2 prose-pre:border-black prose-pre:hard-shadow-sm">
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
                                    userSelector={isSelectorChallenge ? selector : undefined}
                                    selectorType={selectorType}
                                    targetSelector={challenge.targetSelector as string}
                                    targetSelectorType={challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'}
                                    onValidationChange={handlePreviewValidation}
                                    className="flex-1 border-2 border-black rounded-xl hard-shadow-sm bg-white"
                                    showControls={true}
                                    height="100%"
                                    iframeRef={previewIframeRef}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Right Panel - Editor & Results */}
                <div className="flex flex-col overflow-hidden bg-white dark:bg-slate-950">
                    <div className="flex-1 p-6 overflow-auto flex flex-col gap-8">
                        {/* Selector Input for selector challenges */}
                        {isSelectorChallenge && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90 italic">
                                        <div className="h-6 w-6 rounded-full bg-brand-teal/20 flex items-center justify-center text-xs font-bold text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">1</div>
                                        Step 1: Capture the Element
                                    </h3>
                                    <Card className="border-2 border-black rounded-xl hard-shadow-sm overflow-hidden bg-muted/5">
                                        <CardContent className="p-4 space-y-4">
                                            <SelectorInput
                                                value={selector}
                                                onChange={handleSelectorChange}
                                                onValidate={handleValidateSelector}
                                                defaultType={selectorType}
                                                allowTypeChange={true}
                                            />
                                            <div className="flex justify-end pt-2 border-t border-black/5">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleValidateSelector}
                                                    disabled={isRunning || !selector}
                                                    className="w-full sm:w-auto font-bold border-2 border-black hard-shadow-sm bg-brand-teal hover:bg-brand-teal/90 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                                >
                                                    {isRunning ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Play className="h-4 w-4 mr-2" />
                                                    )}
                                                    Test Selector
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Code Editor for code challenges */}
                        {isCodeChallenge && (
                            <div className="flex-1 flex flex-col gap-3 min-h-[350px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90 italic">
                                        <div className="h-6 w-6 rounded-full bg-brand-teal/20 flex items-center justify-center text-xs font-bold text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">1</div>
                                        Step 1: Write your Strategy
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full border border-transparent hover:border-destructive/20"
                                        onClick={handleReset}
                                        title="Reset to starter code"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="flex-1 min-h-0 border-2 border-black rounded-xl hard-shadow-sm overflow-hidden bg-slate-900">
                                    <CodeEditor
                                        initialCode={challenge.starterCode}
                                        language="javascript"
                                        onChange={setCode}
                                        onRun={handleRunCode}
                                        storageKey={userId ? `challenge-${challenge.id}-${userId}` : `challenge-${challenge.id}`}
                                        height="100%"
                                        className="h-full border-0 rounded-none shadow-none"
                                        key={`${challenge.id}-${resetCount}`} // Force re-mount on change or reset
                                    />
                                </div>
                            </div>
                        )}

                        {/* Test Results */}
                        <div className={cn("flex flex-col gap-3", !isCodeChallenge && "flex-1")}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90 italic">
                                    <div className="h-6 w-6 rounded-full bg-brand-teal/20 flex items-center justify-center text-xs font-bold text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">2</div>
                                    Step 2: Execution & Feedback
                                </h3>
                                {isCodeChallenge && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleRunCode}
                                        disabled={isRunning}
                                        className="font-bold border-2 border-black hard-shadow-sm bg-brand-teal hover:bg-brand-teal/90 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                        title="Run Code (Cmd/Ctrl + Enter)"
                                    >
                                        {isRunning ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Play className="h-4 w-4 mr-2" />
                                        )}
                                        Run Logic
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1">
                                <TestResults results={testResults} isRunning={isRunning} className="border-2 border-black rounded-xl hard-shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
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
                            onClick={confirmReset}
                            className="shadow-sm"
                        >
                            Yes, Reset Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default ChallengePlayground;
