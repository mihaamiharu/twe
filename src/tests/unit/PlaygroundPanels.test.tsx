import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { EditorPanel } from '@/components/challenges/playground/editor-panel';
import { SelectorPanel } from '@/components/challenges/playground/selector-panel';
import { ResultsPanel } from '@/components/challenges/playground/results-panel';
import type { TestResult } from '@/components/challenges/test-results';
import {
    createChallenge,
    createPlaygroundState,
} from '@/tests/fixtures/playground';

interface CodeEditorMockProps {
    initialCode: string;
    onChange: (value: string) => void;
}

interface SelectorInputMockProps {
    value: string;
    onChange: (value: string, type: 'css' | 'xpath') => void;
    onValidate: () => void;
    defaultType: 'css' | 'xpath';
}

// Mock dependencies
void mock.module(
'@/components/challenges/code-editor', () => ({
    CodeEditor: ({ initialCode, onChange }: CodeEditorMockProps) => (
        <textarea
            data-testid="code-editor"
            defaultValue={initialCode}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

void mock.module(
'@/components/challenges/file-explorer', () => ({
    FileExplorer: () => <div data-testid="file-explorer">File Explorer</div>,
}));

void mock.module(
'@/components/challenges/multi-tab-editor', () => ({
    MultiTabEditor: () => <div data-testid="multi-tab-editor">Multi Tab Editor</div>,
}));

void mock.module(
'@/components/challenges/selector-input', () => ({
    SelectorInput: ({ value, onChange, onValidate, defaultType }: SelectorInputMockProps) => (
        <div data-testid="selector-input">
            <input
                data-testid="input-field"
                value={value}
                onChange={(event) => onChange(event.target.value, defaultType)}
            />
            <button data-testid="validate-btn" onClick={onValidate}>Validate</button>
        </div>
    ),
}));

void mock.module(
'@/components/challenges/test-results', () => ({
    TestResults: ({ results }: { results: TestResult[] }) => (
        <div data-testid="test-results">
            {results.map((r) => (
                <div key={r.id} data-testid={`result-${r.id}`}>{r.name}: {r.passed ? 'PASS' : 'FAIL'}</div>
            ))}
        </div>
    ),
}));

void mock.module(
'@/components/challenges/console-output', () => ({
    ConsoleOutput: () => <div data-testid="console-output">Console Output</div>,
}));

// Mock i18n

describe('Playground Panels', () => {
    afterEach(cleanup);

    const mockChallenge = createChallenge({
        slug: 'test',
        title: 'Test',
        starterCode: 'console.log("hello")',
        files: { '/index.js': 'console.log("hello")' },
        editableFiles: ['/index.js'],
    });

    const mockState = createPlaygroundState({
        code: 'console.log("hello")',
        setCode: mock(),
        selector: '',
        selectorType: 'css',
        fileContents: { '/index.js': 'console.log("hello")' },
        selectedFile: '/index.js',
        openFiles: ['/index.js'],
        resetCount: 0,
        isLayoutReady: true,
        testResults: [],
        consoleLogs: [],
        resultsTab: 'results',
        setResultsTab: mock(),
        setConsoleLogs: mock(),
        isRunning: false,
        hasPassed: false,
    });

    const mockHandlers = {
        onRunCode: mock(),
        onReset: mock(),
        onFileChange: mock(),
        onSelectFile: mock(),
        onCloseFile: mock(),
        onCodeChange: mock(),
        onReady: mock(),
        onSelectorChange: mock(),
        onValidate: mock(),
    };

    describe('EditorPanel', () => {
        it('should render single file editor', () => {
            // Modify challenge to be single file logic (no files prop or single file without MultiTab?)
            // The logic in EditorPanel checks: isMultiFile = challenge.files && Object.keys(challenge.files).length > 1;
            // Let's force single file mode
            const singleFileChallenge = { ...mockChallenge, files: { '/index.js': 'content' } }; // length 1

            render(
                <EditorPanel
                    challenge={singleFileChallenge}
                    state={mockState}
                    isMobile={false}
                    {...mockHandlers}
                />
            );

            expect(screen.getByTestId('code-editor')).toBeTruthy();
        });

        it('should render multi tab editor for multiple files', () => {
            const multiFileChallenge = {
                ...mockChallenge,
                files: { '/a.js': 'a', '/b.js': 'b' }
            };

            render(
                <EditorPanel
                    challenge={multiFileChallenge}
                    state={mockState}
                    isMobile={false}
                    {...mockHandlers}
                />
            );

            expect(screen.getByTestId('multi-tab-editor')).toBeTruthy();
        });
    });

    describe('SelectorPanel', () => {
        it('should render selector input', () => {
            const selectorState = createPlaygroundState({ ...mockState, selector: '.test' });

            render(
                <SelectorPanel
                    challenge={mockChallenge}
                    state={selectorState}
                    onSelectorChange={mockHandlers.onSelectorChange}
                    onValidate={mockHandlers.onValidate}
                />
            );

            expect(screen.getByTestId('selector-input')).toBeTruthy();
            expect(screen.getByDisplayValue('.test')).toBeTruthy();
        });

        it('should show success indication when passed', () => {
            const passedState = createPlaygroundState({
                ...mockState,
                hasPassed: true,
                testResults: [{ id: 'selector', name: 'Selector', passed: true }],
            });

            render(
                <SelectorPanel
                    challenge={mockChallenge}
                    state={passedState}
                    onSelectorChange={mockHandlers.onSelectorChange}
                    onValidate={mockHandlers.onValidate}
                />
            );

            expect(screen.getByText('challenges:playground.correct')).toBeTruthy();
        });
    });

    describe('ResultsPanel', () => {
        it('should show test results by default', () => {
            const resultState = createPlaygroundState({
                ...mockState,
                testResults: [{ id: '1', name: 'Test 1', passed: true }]
            });

            render(
                <ResultsPanel
                    challenge={mockChallenge}
                    state={resultState}
                    onRunCode={mockHandlers.onRunCode}
                />
            );

            expect(screen.getByTestId('test-results')).toBeTruthy();
            expect(screen.getByText('Test 1: PASS')).toBeTruthy();
        });

        it('should show console output in console tab', () => {
            const consoleState = createPlaygroundState({ ...mockState, resultsTab: 'console' });

            render(
                <ResultsPanel
                    challenge={mockChallenge}
                    state={consoleState}
                    onRunCode={mockHandlers.onRunCode}
                />
            );

            expect(screen.getByTestId('console-output')).toBeTruthy();
        });
    });
});
