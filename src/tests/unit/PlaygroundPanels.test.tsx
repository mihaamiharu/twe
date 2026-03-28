import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EditorPanel } from '@/components/challenges/playground/editor-panel';
import { SelectorPanel } from '@/components/challenges/playground/selector-panel';
import { ResultsPanel } from '@/components/challenges/playground/results-panel';

// Mock dependencies
mock.module('@/components/challenges/code-editor', () => ({
    CodeEditor: ({ initialCode, onChange }: any) => (
        <textarea
            data-testid="code-editor"
            defaultValue={initialCode}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

mock.module('@/components/challenges/file-explorer', () => ({
    FileExplorer: () => <div data-testid="file-explorer">File Explorer</div>,
}));

mock.module('@/components/challenges/multi-tab-editor', () => ({
    MultiTabEditor: () => <div data-testid="multi-tab-editor">Multi Tab Editor</div>,
}));

mock.module('@/components/challenges/selector-input', () => ({
    SelectorInput: ({ value, onChange, onValidate, defaultType }: any) => (
        <div data-testid="selector-input">
            <input
                data-testid="input-field"
                value={value}
                onChange={(e) => onChange(e.target.value, defaultType)}
            />
            <button data-testid="validate-btn" onClick={onValidate}>Validate</button>
        </div>
    ),
}));

mock.module('@/components/challenges/test-results', () => ({
    TestResults: ({ results }: any) => (
        <div data-testid="test-results">
            {results.map((r: any) => (
                <div key={r.id} data-testid={`result-${r.id}`}>{r.name}: {r.passed ? 'PASS' : 'FAIL'}</div>
            ))}
        </div>
    ),
}));

mock.module('@/components/challenges/console-output', () => ({
    ConsoleOutput: () => <div data-testid="console-output">Console Output</div>,
}));

// Mock i18n

describe('Playground Panels', () => {
    afterEach(cleanup);

    const mockChallenge = {
        id: '1',
        slug: 'test',
        title: 'Test',
        type: 'JAVASCRIPT',
        starterCode: 'console.log("hello")',
        files: { '/index.js': 'console.log("hello")' },
        editableFiles: ['/index.js'],
    };

    const mockState: any = {
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
    };

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
                    challenge={singleFileChallenge as any}
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
                    challenge={multiFileChallenge as any}
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
            const selectorState = { ...mockState, selector: '.test' };

            render(
                <SelectorPanel
                    challenge={mockChallenge as any}
                    state={selectorState}
                    onSelectorChange={mockHandlers.onSelectorChange}
                    onValidate={mockHandlers.onValidate}
                />
            );

            expect(screen.getByTestId('selector-input')).toBeTruthy();
            expect(screen.getByDisplayValue('.test')).toBeTruthy();
        });

        it('should show success indication when passed', () => {
            const passedState = { ...mockState, hasPassed: true, testResults: [{ passed: true }] };

            render(
                <SelectorPanel
                    challenge={mockChallenge as any}
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
            const resultState = {
                ...mockState,
                testResults: [{ id: '1', name: 'Test 1', passed: true }]
            };

            render(
                <ResultsPanel
                    challenge={mockChallenge as any}
                    state={resultState}
                    onRunCode={mockHandlers.onRunCode}
                />
            );

            expect(screen.getByTestId('test-results')).toBeTruthy();
            expect(screen.getByText('Test 1: PASS')).toBeTruthy();
        });

        it('should show console output in console tab', () => {
            const consoleState = { ...mockState, resultsTab: 'console' };

            render(
                <ResultsPanel
                    challenge={mockChallenge as any}
                    state={consoleState}
                    onRunCode={mockHandlers.onRunCode}
                />
            );

            expect(screen.getByTestId('console-output')).toBeTruthy();
        });
    });
});
