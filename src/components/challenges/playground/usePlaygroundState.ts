import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generateTypeDefinitions } from '@/core/type-generator';
import type {
    ChallengePlaygroundProps,
    PlaygroundState
} from './types';
import type { TestResult } from '../TestResults';
import type { LogEntry } from '../ConsoleOutput';

export function usePlaygroundState({
    challenge,
    hintUsed: initialHintUsed = false,
    initialHintContent,
}: ChallengePlaygroundProps): PlaygroundState {
    const { t, i18n } = useTranslation(['challenges', 'common']);
    const locale = i18n.language;

    const [code, setCode] = useState(challenge.starterCode);
    const [selector, setSelector] = useState('');

    // Multi-file state
    const [fileContents, setFileContents] = useState<Record<string, string>>(challenge.files || {});
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [openFiles, setOpenFiles] = useState<string[]>([]);

    const [resetCount, setResetCount] = useState(0);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    // AI Hint state
    const [isHintDialogOpen, setIsHintDialogOpen] = useState(false);
    const [hintContent, setHintContent] = useState<string | null>(null);
    const [storedHint, setStoredHint] = useState<string | null>(initialHintContent || null);
    const [hintUsed, setHintUsed] = useState(initialHintUsed);

    const [selectorType, setSelectorType] = useState<'css' | 'xpath'>(
        challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css',
    );

    const [revealedHintsCount, setRevealedHintsCount] = useState(0);

    // Layout state
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Layout readiness state
    const isCodeChallenge =
        challenge.type === 'JAVASCRIPT' ||
        challenge.type === 'TYPESCRIPT' ||
        challenge.type === 'PLAYWRIGHT';
    const isSelectorChallenge =
        challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR';

    // Generate type definitions for the editor
    const extraLibs = useMemo(() => {
        if (!challenge.files) return undefined;
        return generateTypeDefinitions(challenge.files, challenge.preloadModules);
    }, [challenge.files, challenge.preloadModules]);

    const [isLayoutReady, setIsLayoutReady] = useState(!isCodeChallenge);


    // Reset layout readiness when challenge ID changes
    const [prevChallengeId, setPrevChallengeId] = useState(challenge.id);
    if (challenge.id !== prevChallengeId) {
        setPrevChallengeId(challenge.id);
        setIsLayoutReady(!isCodeChallenge);
    }

    // Initialization/Reset effect when challenge changes
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
        setRevealedHintsCount(0);

        if (challenge.files) {
            setFileContents({ ...challenge.files });
            const editable = challenge.editableFiles || [Object.keys(challenge.files)[0]];
            setOpenFiles([...editable]);
            setSelectedFile(editable[0]);
        } else {
            setFileContents({});
            setOpenFiles([]);
            setSelectedFile('');
        }
    }, [challenge.id]); // Minimize dependencies to avoid redundant resets

    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
    const [resultsTab, setResultsTab] = useState<'results' | 'console'>('results');

    const [isRunning, setIsRunning] = useState(false);
    const [hasPassed, setHasPassed] = useState(false);

    const [activeTab, setActiveTab] = useState('instructions');

    const [previewValidation, setPreviewValidation] = useState<{
        isValid: boolean;
        matchCount: number;
    } | null>(null);

    const [currentVfsPath, setCurrentVfsPath] = useState<string>('/index.html');

    // Initialization effect for VFS path
    useEffect(() => {
        if (challenge.files) {
            const paths = Object.keys(challenge.files);
            if (paths.includes('/app/index.html')) {
                setCurrentVfsPath('/app/index.html');
            } else if (paths.includes('/index.html')) {
                setCurrentVfsPath('/index.html');
            } else if (paths.length > 0) {
                const htmlFile = paths.find(p => p.endsWith('.html'));
                setCurrentVfsPath(htmlFile || paths[0]);
            }
        } else {
            setCurrentVfsPath('/index.html');
        }
    }, [challenge.id]);

    return {
        code,
        setCode,
        selector,
        setSelector,
        selectorType,
        setSelectorType,
        fileContents,
        setFileContents,
        selectedFile,
        setSelectedFile,
        openFiles,
        setOpenFiles,
        resetCount,
        setResetCount,
        isResetConfirmOpen,
        setIsResetConfirmOpen,
        isHintDialogOpen,
        setIsHintDialogOpen,
        hintContent,
        setHintContent,
        storedHint,
        setStoredHint,
        hintUsed,
        setHintUsed,
        isMobile,
        isLayoutReady,
        setIsLayoutReady,
        testResults,
        setTestResults,
        consoleLogs,
        setConsoleLogs,
        resultsTab,
        setResultsTab,
        isRunning,
        setIsRunning,
        hasPassed,
        setHasPassed,
        activeTab,
        setActiveTab,
        previewValidation,
        setPreviewValidation,
        currentVfsPath,
        setCurrentVfsPath,
        revealedHintsCount,
        setRevealedHintsCount,
        isCodeChallenge,
        isSelectorChallenge,
        extraLibs,
        locale,
        t,
    };
}
