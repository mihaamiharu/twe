import i18n from '@/lib/i18n';
import type {
  Challenge,
  ChallengePlaygroundProps,
  PlaygroundState,
} from '@/components/challenges/playground/types';

const noop = () => undefined;

export function createChallenge(
  overrides: Partial<Challenge> = {},
): Challenge {
  return {
    id: 'challenge-1',
    slug: 'test-challenge',
    title: 'Test Challenge',
    description: 'Solve this challenge',
    type: 'JAVASCRIPT',
    difficulty: 'Easy',
    xp: 10,
    instructions: 'Instructions',
    starterCode: 'console.log("hello");',
    ...overrides,
  };
}

export function createPlaygroundProps(
  overrides: Partial<ChallengePlaygroundProps> = {},
): ChallengePlaygroundProps {
  return {
    challenge: createChallenge(),
    ...overrides,
  };
}

export function createPlaygroundState(
  overrides: Partial<PlaygroundState> = {},
): PlaygroundState {
  return {
    code: 'console.log("hello");',
    setCode: noop,
    selector: '',
    setSelector: noop,
    selectorType: 'css',
    setSelectorType: noop,
    fileContents: {},
    setFileContents: noop,
    selectedFile: '',
    setSelectedFile: noop,
    openFiles: [],
    setOpenFiles: noop,
    resetCount: 0,
    setResetCount: noop,
    isResetConfirmOpen: false,
    setIsResetConfirmOpen: noop,
    isHintDialogOpen: false,
    setIsHintDialogOpen: noop,
    hintContent: null,
    setHintContent: noop,
    storedHint: null,
    setStoredHint: noop,
    hintUsed: false,
    setHintUsed: noop,
    isMobile: false,
    isLayoutReady: true,
    setIsLayoutReady: noop,
    testResults: [],
    setTestResults: noop,
    consoleLogs: [],
    setConsoleLogs: noop,
    resultsTab: 'results',
    setResultsTab: noop,
    isRunning: false,
    setIsRunning: noop,
    hasPassed: false,
    setHasPassed: noop,
    activeTab: 'instructions',
    setActiveTab: noop,
    previewValidation: null,
    setPreviewValidation: noop,
    currentVfsPath: '/index.html',
    setCurrentVfsPath: noop,
    revealedHintsCount: 0,
    setRevealedHintsCount: noop,
    isCodeChallenge: true,
    isSelectorChallenge: false,
    locale: 'en',
    t: i18n.getFixedT('en'),
    ...overrides,
  };
}
