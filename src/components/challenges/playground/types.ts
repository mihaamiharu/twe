import { UseMutationResult } from '@tanstack/react-query';
import { TestResult } from '../test-results';
import { LogEntry } from '../console-output';

export type ChallengeType =
    | 'JAVASCRIPT'
    | 'TYPESCRIPT'
    | 'PLAYWRIGHT'
    | 'CSS_SELECTOR'
    | 'XPATH_SELECTOR'
    | 'SELECTOR';

export interface AIHintResponse {
    success: boolean;
    hint?: string;
    error?: string;
    xpPenaltyWarning?: string;
}

export interface Challenge {
    id: string;
    slug: string;
    title: string;
    description: string;
    type: ChallengeType;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    xp: number;
    instructions: string;
    hints?: string[];
    starterCode: string;
    htmlContent?: string;
    targetSelector?: string | string[];
    files?: Record<string, string>; // VFS: multi-page content for E2E challenges
    editableFiles?: string[]; // Which files user can edit
    preloadModules?: Record<string, {
        exports: string[];
        source: string;
    }>;

    testCases?: {
        id: string;
        name: string;
        input?: unknown;
        expectedOutput?: unknown;
    }[];
    expectedState?: {
        selector: string;
        visible?: boolean;
        hidden?: boolean;
        containsText?: string;
        count?: number;
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
    initialHintContent?: string | null;
}

export interface PlaygroundState {
    // State
    code: string;
    setCode: (code: string) => void;
    selector: string;
    setSelector: (selector: string) => void;
    selectorType: 'css' | 'xpath';
    setSelectorType: (type: 'css' | 'xpath') => void;
    fileContents: Record<string, string>;
    setFileContents: (contents: Record<string, string>) => void;
    selectedFile: string;
    setSelectedFile: (file: string) => void;
    openFiles: string[];
    setOpenFiles: (files: string[]) => void;
    resetCount: number;
    setResetCount: (count: (prev: number) => number) => void;
    isResetConfirmOpen: boolean;
    setIsResetConfirmOpen: (open: boolean) => void;
    isHintDialogOpen: boolean;
    setIsHintDialogOpen: (open: boolean) => void;
    hintContent: string | null;
    setHintContent: (content: string | null) => void;
    storedHint: string | null;
    setStoredHint: (content: string | null) => void;
    hintUsed: boolean;
    setHintUsed: (used: boolean) => void;
    isMobile: boolean;
    isLayoutReady: boolean;
    setIsLayoutReady: (ready: boolean) => void;
    testResults: TestResult[];
    setTestResults: (results: TestResult[]) => void;
    consoleLogs: LogEntry[];
    setConsoleLogs: (logs: LogEntry[]) => void;
    resultsTab: 'results' | 'console';
    setResultsTab: (tab: 'results' | 'console') => void;
    isRunning: boolean;
    setIsRunning: (running: boolean) => void;
    hasPassed: boolean;
    setHasPassed: (passed: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    previewValidation: { isValid: boolean; matchCount: number } | null;
    setPreviewValidation: (validation: { isValid: boolean; matchCount: number } | null) => void;
    currentVfsPath: string;
    setCurrentVfsPath: (path: string) => void;
    revealedHintsCount: number;
    setRevealedHintsCount: (count: number) => void;

    // Derived
    isCodeChallenge: boolean;
    isSelectorChallenge: boolean;
    extraLibs?: {
        content: string;
        filePath: string;
    }[];
    locale: string;
    t: (key: string, ...args: unknown[]) => string; // Flexible t function type
}

export interface PlaygroundExecution {
    handleRunCode: () => Promise<void>;
    handleValidateSelector: () => void;
    handleReset: () => void;
    confirmReset: () => Promise<void>;
    handleSubmit: () => void;
    handleSelectorChange: (selector: string, type: 'css' | 'xpath') => void;
    handleFileChange: (path: string, newCode: string) => void;
    handleSelectFile: (path: string) => void;
    handleCloseFile: (path: string) => void;
    handlePreviewValidation: (validation: { isValid: boolean; matchCount: number } | null) => void;
    hintMutation: UseMutationResult<AIHintResponse, Error, void, unknown>;
}
