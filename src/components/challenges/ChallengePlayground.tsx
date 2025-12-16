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

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { executePlaywrightCode } from '@/lib/challenge-executor';
import { Play, Send, RotateCcw, Zap, Loader2 } from 'lucide-react';

import { CodeEditor } from './CodeEditor';
import { WebComponentPreview } from './WebComponentPreview';
import { TestResults, type TestResult } from './TestResults';
import { Hints, type Hint } from './Hints';
import { SelectorInput, type SelectorType, type SelectorValidationResult } from './SelectorInput';

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
    testCases?: { id: string; name: string }[];
}

export interface ChallengePlaygroundProps {
    challenge: Challenge;
    onSubmit: (code: string, passed: boolean) => void;
    className?: string;
}

export function ChallengePlayground({ challenge, onSubmit, className }: ChallengePlaygroundProps) {
    const [code, setCode] = useState(challenge.starterCode);
    const [selector, setSelector] = useState('');
    const [selectorType] = useState<SelectorType>(
        challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
    );
    const [selectorValidation, setSelectorValidation] = useState<SelectorValidationResult | undefined>();
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());
    const [isRunning, setIsRunning] = useState(false);
    const [hasPassed, setHasPassed] = useState(false);
    const [activeTab, setActiveTab] = useState('instructions');

    const isCodeChallenge = challenge.type === 'JAVASCRIPT' || challenge.type === 'PLAYWRIGHT';
    const isSelectorChallenge = challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR';

    // Run code for Playwright/JS challenges
    const handleRunCode = useCallback(async () => {
        if (!isCodeChallenge || !challenge.htmlContent) return;

        setIsRunning(true);
        setTestResults([]);

        try {
            const result = await executePlaywrightCode(code, challenge.htmlContent, {
                timeout: 10000,
            });

            const testResult: TestResult = {
                id: 'main',
                name: 'Code Execution',
                passed: result.status === 'PASSED',
                error: result.error,
                executionTime: result.executionTime,
            };

            setTestResults([testResult]);
            setHasPassed(result.status === 'PASSED');
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
    }, [code, challenge.htmlContent, isCodeChallenge]);

    // Validate selector for CSS/XPath challenges
    const handleValidateSelector = useCallback(() => {
        if (!isSelectorChallenge || !challenge.targetSelector) return;

        const targetSelectors = Array.isArray(challenge.targetSelector)
            ? challenge.targetSelector
            : [challenge.targetSelector];

        // Check if user's selector matches any valid selector
        const isValid = targetSelectors.includes(selector);

        setSelectorValidation({
            valid: isValid,
            matchCount: isValid ? 1 : 0,
            error: isValid ? undefined : 'Selector does not match the target element',
        });

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
    }, [selector, challenge.targetSelector, isSelectorChallenge]);

    // Reset to starter code
    const handleReset = useCallback(() => {
        setCode(challenge.starterCode);
        setSelector('');
        setSelectorValidation(undefined);
        setTestResults([]);
        setHasPassed(false);
    }, [challenge.starterCode]);

    // Reveal a hint
    const handleRevealHint = useCallback((hintId: string) => {
        setRevealedHints((prev) => new Set([...prev, hintId]));
    }, []);

    // Submit solution
    const handleSubmit = useCallback(() => {
        const submissionCode = isCodeChallenge ? code : selector;
        onSubmit(submissionCode, hasPassed);
    }, [code, selector, hasPassed, onSubmit, isCodeChallenge]);

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
                <div>
                    <h1 className="font-semibold text-lg">{challenge.title}</h1>
                    <div className="flex items-center gap-2 text-sm mt-1">
                        <Badge variant="secondary">{challenge.difficulty}</Badge>
                        <Badge variant="outline">{challenge.type.replace('_', ' ')}</Badge>
                        <span className="text-accent flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {challenge.xp} XP
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={isCodeChallenge ? handleRunCode : handleValidateSelector}
                        disabled={isRunning}
                    >
                        {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        {isCodeChallenge ? 'Run' : 'Validate'}
                    </Button>
                    <Button size="sm" onClick={handleSubmit} disabled={!hasPassed}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Main content - Split layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
                {/* Left Panel - Instructions & Preview */}
                <div className="flex flex-col overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col"
                    >
                        <TabsList className="mx-4 mt-4">
                            <TabsTrigger value="instructions">Instructions</TabsTrigger>
                            {challenge.htmlContent && (
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent
                            value="instructions"
                            className="flex-1 overflow-auto p-4 mt-0"
                        >
                            <Card className="glass-card">
                                <CardContent className="p-6">
                                    <MarkdownRenderer content={challenge.instructions} />
                                </CardContent>
                            </Card>

                            {/* Hints */}
                            {challenge.hints.length > 0 && (
                                <div className="mt-4">
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
                                className="flex-1 overflow-auto p-4 mt-0"
                            >
                                <WebComponentPreview
                                    htmlContent={challenge.htmlContent}
                                    userSelector={isSelectorChallenge ? selector : undefined}
                                    selectorType={selectorType}
                                    className="h-full min-h-[300px]"
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Right Panel - Editor & Results */}
                <div className="flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 overflow-auto">
                        {/* Code Editor for code challenges */}
                        {isCodeChallenge && (
                            <CodeEditor
                                initialCode={challenge.starterCode}
                                language="javascript"
                                onChange={setCode}
                                onRun={handleRunCode}
                                storageKey={`challenge-${challenge.id}`}
                                height="300px"
                                className="mb-4"
                            />
                        )}

                        {/* Selector Input for selector challenges */}
                        {isSelectorChallenge && (
                            <Card className="glass-card mb-4">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm">Enter Selector</CardTitle>
                                </CardHeader>
                                <CardContent className="py-3">
                                    <SelectorInput
                                        value={selector}
                                        onChange={(value) => setSelector(value)}
                                        onValidate={handleValidateSelector}
                                        defaultType={selectorType}
                                        showValidation={true}
                                        validationResult={selectorValidation ? {
                                            isCorrect: selectorValidation.valid ?? false,
                                            feedback: selectorValidation.error ?? 'Valid selector'
                                        } : undefined}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Test Results */}
                        <TestResults results={testResults} isRunning={isRunning} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChallengePlayground;
