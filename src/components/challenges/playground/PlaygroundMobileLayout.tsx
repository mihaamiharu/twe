import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen, Play, Search, Code2, Info, CheckCircle2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { WebComponentPreview } from '../WebComponentPreview';
import { EditorPanel } from './EditorPanel';
import { SelectorPanel } from './SelectorPanel';
import { ResultsPanel } from './ResultsPanel';
import { FileExplorer } from '../FileExplorer';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import type { Challenge, PlaygroundState } from './types';
import type { SelectorType } from '../SelectorInput';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface PlaygroundMobileLayoutProps {
    challenge: Challenge;
    state: PlaygroundState;
    execution: any; // Result from useChallengeExecution hook
    previewIframeRef: React.RefObject<HTMLIFrameElement>;
}

export function PlaygroundMobileLayout({
    challenge,
    state,
    execution,
    previewIframeRef,
}: PlaygroundMobileLayoutProps) {
    const { t } = useTranslation(['challenges']);
    const {
        activeTab,
        setActiveTab,
        currentVfsPath,
        setCurrentVfsPath,
        selector,
        selectorType,
        isCodeChallenge,
        isSelectorChallenge,
        testResults,
        isRunning
    } = state;

    const {
        handleRunCode,
        handleValidateSelector,
        handleReset,
        handleSelectorChange,
        handleFileChange,
        handleSelectFile,
        handleCloseFile,
        handlePreviewValidation,
    } = execution;

    const hasHtml = !!(challenge.htmlContent || challenge.files);
    const [isResultsSheetOpen, setIsResultsSheetOpen] = useState(false);
    const [isFileExplorerSheetOpen, setIsFileExplorerSheetOpen] = useState(false);

    // Auto-open results sheet when code finishes running or results update
    useEffect(() => {
        if (!isRunning && testResults.length > 0) {
            setIsResultsSheetOpen(true);
        }
    }, [isRunning, testResults.length]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-background">
            <Tabs
                value={activeTab === 'instructions' || activeTab === 'results' ? 'workspace' : activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Simplified Mobile Controls */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3 shrink-0 border-b">
                    <TabsList className="h-9 bg-muted/50 p-1 border border-border rounded-lg flex-1 grid grid-cols-2">
                        <TabsTrigger value="workspace" className="text-xs gap-2">
                            <Code2 className="h-3.5 w-3.5" />
                            Workspace
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs gap-2">
                            <Search className="h-3.5 w-3.5" />
                            Visual
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-1.5">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                                    <BookOpen className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-6 pb-6 pt-2 flex flex-col">
                                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 shrink-0" />
                                <SheetHeader className="mb-4 shrink-0">
                                    <SheetTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        {t('challenges:playground.instructions')}
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-10 scrollbar-thin">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <MarkdownRenderer content={challenge.instructions} />
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {challenge.files && Object.keys(challenge.files).length > 1 && (
                            <Sheet open={isFileExplorerSheetOpen} onOpenChange={setIsFileExplorerSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                                        <Folder className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0 overflow-hidden flex flex-col">
                                    <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-2 mb-2 shrink-0" />
                                    <div className="px-6 py-2 border-b">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Folder className="h-5 w-5 text-primary" />
                                            {t('challenges:playground.files')}
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-hidden p-2">
                                        <FileExplorer
                                            files={challenge.files}
                                            editableFiles={challenge.editableFiles}
                                            selectedFile={currentVfsPath}
                                            onSelectFile={(path) => {
                                                handleSelectFile(path);
                                                setIsFileExplorerSheetOpen(false);
                                            }}
                                            className="border-none bg-transparent"
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}

                        {(isCodeChallenge || isSelectorChallenge) && (
                            <Sheet open={isResultsSheetOpen} onOpenChange={setIsResultsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg relative">
                                        <Play className="h-4 w-4" />
                                        {testResults.length > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0 overflow-hidden flex flex-col">
                                    <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-2 mb-2" />
                                    <div className="px-6 py-2 border-b flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            {t('challenges:playground.results')}
                                        </h3>
                                        <Button size="sm" onClick={() => { handleRunCode(); setIsResultsSheetOpen(false); }} className="gap-2 h-8 px-3">
                                            <Play className="h-3.5 w-3.5" />
                                            Re-run
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4 bg-muted/5">
                                        <ResultsPanel
                                            challenge={challenge}
                                            state={state}
                                            onRunCode={handleRunCode}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>

                {/* Tab Contents with Flex Layout to avoid truncation */}
                <div className="flex-1 flex flex-col min-h-0">
                    <TabsContent value="workspace" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0">
                            {isSelectorChallenge && (
                                <div className="px-4 py-2 border-b bg-muted/5 shrink-0">
                                    <SelectorPanel
                                        challenge={challenge}
                                        state={state}
                                        onSelectorChange={handleSelectorChange}
                                        onValidate={handleValidateSelector}
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <EditorPanel
                                    challenge={challenge}
                                    state={state}
                                    isMobile={true}
                                    onRunCode={handleRunCode}
                                    onReset={handleReset}
                                    onFileChange={handleFileChange}
                                    onSelectFile={handleSelectFile}
                                    onCloseFile={handleCloseFile}
                                    onCodeChange={(code) => state.setCode(code)}
                                    onReady={() => state.setIsLayoutReady(true)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden overflow-hidden">
                        {hasHtml ? (
                            <div className="flex-1 flex flex-col p-4 min-h-0">
                                <div className="flex-1 min-h-0 rounded-xl overflow-hidden border shadow-inner">
                                    <WebComponentPreview
                                        htmlContent={
                                            challenge.files
                                                ? challenge.files[currentVfsPath] || challenge.files['/index.html'] || '<div></div>'
                                                : challenge.htmlContent || '<div></div>'
                                        }
                                        cssContent={
                                            challenge.category?.startsWith('e2e')
                                                ? e2eSelectorStyles
                                                : defaultSelectorStyles
                                        }
                                        userSelector={isSelectorChallenge ? selector : undefined}
                                        selectorType={selectorType as SelectorType}
                                        targetSelector={challenge.targetSelector as string}
                                        targetSelectorType={
                                            challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
                                        }
                                        onValidationChange={handlePreviewValidation}
                                        className="h-full border-0"
                                        showControls={true}
                                        height="100%"
                                        iframeRef={previewIframeRef}
                                        files={challenge.files}
                                        currentPath={currentVfsPath}
                                        onNavigate={(path) => setCurrentVfsPath(path)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground italic">
                                No visual preview available for this challenge type.
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
