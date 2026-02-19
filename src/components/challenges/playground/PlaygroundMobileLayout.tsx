import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { WebComponentPreview } from '../WebComponentPreview';
import { EditorPanel } from './EditorPanel';
import { SelectorPanel } from './SelectorPanel';
import { ResultsPanel } from './ResultsPanel';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import type { Challenge, PlaygroundState } from './types';
import type { SelectorType } from '../SelectorInput';

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
        isSelectorChallenge
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

    return (
        <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Instructions/Preview Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-10 bg-muted/50 p-1 border border-border rounded-lg">
                    <TabsTrigger value="instructions" className="flex-1 text-xs">
                        {t('challenges:playground.instructions')}
                    </TabsTrigger>
                    {hasHtml && (
                        <TabsTrigger value="preview" className="flex-1 text-xs">
                            {t('challenges:playground.preview')}
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="instructions" className="mt-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={challenge.instructions} />
                    </div>
                </TabsContent>
                {hasHtml && (
                    <TabsContent value="preview" className="mt-3 h-[300px]">
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
                            className="bg-white rounded-lg border h-full"
                            showControls={true}
                            height="100%"
                            iframeRef={previewIframeRef}
                            files={challenge.files}
                            currentPath={currentVfsPath}
                            onNavigate={(path) => setCurrentVfsPath(path)}
                        />
                    </TabsContent>
                )}
            </Tabs>

            {/* Logic Panel */}
            {isCodeChallenge && (
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
            )}

            {isSelectorChallenge && (
                <SelectorPanel
                    challenge={challenge}
                    state={state}
                    onSelectorChange={handleSelectorChange}
                    onValidate={handleValidateSelector}
                />
            )}

            {/* Results & Console for code challenges */}
            {isCodeChallenge && (
                <div className="border border-border rounded-lg overflow-hidden shrink-0 h-[300px]">
                    <ResultsPanel
                        challenge={challenge}
                        state={state}
                        onRunCode={handleRunCode}
                    />
                </div>
            )}
        </div>
    );
}
