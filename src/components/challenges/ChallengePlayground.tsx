/**
 * ChallengePlayground - Main challenge solving interface
 * 
 * Features:
 * - Split layout (description | code editor | results)
 * - Challenge description and instructions
 * - Code editor with Monaco
 * - Test results display
 * - Hints system
 * - Run/Submit buttons
 * - Responsive tabs on mobile
 */

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { executePlaywrightCode } from '@/lib/challenge-executor';
import { Play, Send, RotateCcw, Zap, Loader2, Target } from 'lucide-react';

import { CodeEditor } from './CodeEditor';
import { WebComponentPreview } from './WebComponentPreview';
import { TestResults, type TestResult } from './TestResults';
import { Hints, type Hint } from './Hints';
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
    hints: Hint[];
    testCases?: { id: string; name: string; input?: unknown; expectedOutput?: unknown }[];
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

    const [selectorType, setSelectorType] = useState<SelectorType>(
        challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
    );

    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());
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

    // Reset to starter code
    const handleReset = useCallback(() => {
        setCode(challenge.starterCode);
        setSelector('');

        setTestResults([]);
        setHasPassed(false);
        setPreviewValidation(null);
    }, [challenge.starterCode]);

    // Reveal a hint
    const handleRevealHint = useCallback((hintId: string) => {
        setRevealedHints((prev) => new Set([...prev, hintId]));
    }, []);

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

    return (
        <div className={cn('flex flex-col h-full bg-background animate-fade-in', className)}>
            {/* Header */}
            <div className="border-b border-border bg-card/50 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="font-semibold text-lg leading-none">{challenge.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                            <Badge variant="secondary" className="font-normal">{challenge.difficulty}</Badge>
                            <Badge variant="outline" className="font-normal">{challenge.type.replace('_', ' ')}</Badge>
                            <span className="text-accent flex items-center gap-1 font-medium">
                                <Zap className="h-3 w-3" />
                                {challenge.xp} XP
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground btn-animate">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!hasPassed}
                        className={cn(
                            "shadow-md transition-all btn-animate",
                            hasPassed
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Solution
                    </Button>
                </div>
            </div>

            {/* Persistent Goal Bar */}
            <div className="bg-muted/30 border-b border-border px-4 py-3 shrink-0">
                <div className="flex items-start gap-3 max-w-4xl">
                    <div className="bg-primary/20 p-1.5 rounded-md mt-0.5 shadow-sm">
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Goal</span>
                        <p className="text-sm font-medium text-foreground/90 leading-snug">{challenge.description}</p>
                    </div>
                </div>
            </div>

            {/* Main content - Split layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
                {/* Left Panel - Instructions & Preview */}
                <div className="flex flex-col overflow-hidden bg-muted/5">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <div className="px-4 pt-3 shrink-0">
                            <TabsList className="w-full justify-start h-9 bg-muted/50 p-1">
                                <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
                                {challenge.htmlContent && (
                                    <TabsTrigger value="preview" className="flex-1">Target Preview</TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent
                            value="instructions"
                            className="flex-1 overflow-auto p-4 focus-visible:ring-0"
                        >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownRenderer content={challenge.instructions} />
                            </div>

                            {/* Hints */}
                            {challenge.hints.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-border">
                                    <h3 className="text-sm font-semibold mb-3">Need Help?</h3>
                                    <Hints
                                        hints={challenge.hints}
                                        revealedHints={revealedHints}
                                        onRevealHint={handleRevealHint}
                                    />
                                </div>
                            )}
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
                                    className="flex-1 shadow-sm"
                                    showControls={true}
                                    height="100%"
                                    iframeRef={previewIframeRef}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Right Panel - Editor & Results */}
                <div className="flex flex-col overflow-hidden bg-background">
                    <div className="flex-1 p-4 overflow-auto flex flex-col gap-6">
                        {/* Selector Input for selector challenges */}
                        {isSelectorChallenge && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-primary/20">1</div>
                                        Enter Selector
                                    </h3>
                                    <Card className="border-border shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <SelectorInput
                                                value={selector}
                                                onChange={handleSelectorChange}
                                                onValidate={handleValidateSelector}
                                                defaultType={selectorType}
                                                allowTypeChange={true}
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={handleValidateSelector}
                                                    disabled={isRunning || !selector}
                                                    className="w-full sm:w-auto btn-animate"
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
                            <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-primary/20">1</div>
                                    Solution Code
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <CodeEditor
                                        initialCode={challenge.starterCode}
                                        language="javascript"
                                        onChange={setCode}
                                        onRun={handleRunCode}
                                        storageKey={userId ? `challenge-${challenge.id}-${userId}` : `challenge-${challenge.id}`}
                                        height="100%"
                                        className="h-full border rounded-md overflow-hidden shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Test Results */}
                        <div className={cn("flex flex-col gap-2", !isCodeChallenge && "flex-1")}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-primary/20">2</div>
                                    Live Results
                                </h3>
                                {isCodeChallenge && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleRunCode}
                                        disabled={isRunning}
                                        className="btn-animate relative z-10"
                                    >
                                        {isRunning ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Play className="h-4 w-4 mr-2" />
                                        )}
                                        Run Code
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1">
                                <TestResults results={testResults} isRunning={isRunning} />
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default ChallengePlayground;
