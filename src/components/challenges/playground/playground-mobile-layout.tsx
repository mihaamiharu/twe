import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen, Code2, Eye, Folder, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { omitUndefined } from '@/lib/omit-undefined';
import { cn } from '@/lib/utils';
import { WebComponentPreview } from '../web-component-preview';
import { EditorPanel } from './editor-panel';
import { SelectorPanel } from './selector-panel';
import { ResultsPanel } from './results-panel';
import { FileExplorer } from '../file-explorer';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import type { Challenge, PlaygroundState } from './types';
import type { SelectorType } from '../selector-input';
import type { ChallengeExecution } from './use-challenge-execution';

interface PlaygroundMobileLayoutProps {
  challenge: Challenge;
  state: PlaygroundState;
  execution: ChallengeExecution;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
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
  const activeMode =
    activeTab === 'preview' || activeTab === 'code'
      ? activeTab
      : 'instructions';

  return (
    <div className="workspace-panel flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
      <Tabs
        value={activeMode}
        onValueChange={setActiveTab}
        className="flex flex-1 min-h-0 flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-workspace-border px-3 py-2">
          <TabsList className="grid h-auto min-h-11 w-full grid-cols-3 gap-1 rounded-md border border-workspace-border bg-workspace-elevated p-1">
            <TabsTrigger
              value="instructions"
              className="min-h-10 gap-1.5 rounded-sm px-2 text-xs text-workspace-muted data-[state=active]:bg-workspace-panel data-[state=active]:text-workspace-text"
            >
              <Info className="h-3.5 w-3.5" />
              {t('challenges:playground.instructions')}
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="min-h-10 gap-1.5 rounded-sm px-2 text-xs text-workspace-muted data-[state=active]:bg-workspace-panel data-[state=active]:text-workspace-text"
            >
              <Eye className="h-3.5 w-3.5" />
              {t('challenges:playground.preview')}
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="min-h-10 gap-1.5 rounded-sm px-2 text-xs text-workspace-muted data-[state=active]:bg-workspace-panel data-[state=active]:text-workspace-text"
            >
              <Code2 className="h-3.5 w-3.5" />
              {t('challenges:playground.editor')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TabsContent
            value="instructions"
            forceMount
            className="m-0 min-h-0 flex-1 overflow-y-auto p-4 focus-visible:ring-0 data-[state=inactive]:hidden"
          >
            <div className="flex items-center gap-2 border-b border-workspace-border pb-3 text-xs font-medium uppercase tracking-[0.12em] text-workspace-muted">
              <BookOpen className="h-4 w-4 text-brand-orange" />
              {t('challenges:playground.instructions')}
            </div>
            <div className="prose prose-sm mt-4 max-w-none prose-headings:text-workspace-text prose-p:text-workspace-text prose-li:text-workspace-text prose-pre:border prose-pre:border-workspace-border">
              <MarkdownRenderer content={challenge.instructions} />
            </div>
          </TabsContent>

          <TabsContent
            value="preview"
            forceMount
            className="m-0 min-h-0 flex-1 overflow-hidden p-3 focus-visible:ring-0 data-[state=inactive]:hidden"
          >
            {hasHtml ? (
              <div className="flex h-full min-h-0 flex-col">
                <WebComponentPreview
                  htmlContent={
                    challenge.files
                      ? challenge.files[currentVfsPath] ||
                        challenge.files['/index.html'] ||
                        '<div></div>'
                      : challenge.htmlContent || '<div></div>'
                  }
                  cssContent={
                    challenge.category?.startsWith('e2e')
                      ? e2eSelectorStyles
                      : defaultSelectorStyles
                  }
                  {...omitUndefined({
                    userSelector: isSelectorChallenge ? selector : undefined,
                  })}
                  selectorType={selectorType as SelectorType}
                  targetSelector={challenge.targetSelector as string}
                  targetSelectorType={
                    challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
                  }
                  onValidationChange={handlePreviewValidation}
                  className="h-full min-h-0 border border-workspace-border rounded-md"
                  showControls={true}
                  height="100%"
                  iframeRef={previewIframeRef}
                  {...omitUndefined({ files: challenge.files })}
                  currentPath={currentVfsPath}
                  onNavigate={(path) => setCurrentVfsPath(path)}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-workspace-muted">
                No visual preview available for this challenge type.
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="code"
            forceMount
            className={cn(
              'm-0 flex min-h-0 flex-1 flex-col overflow-hidden focus-visible:ring-0 data-[state=inactive]:hidden',
              isCodeChallenge && 'technical-surface',
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-workspace-border bg-workspace-panel px-3 py-2">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-workspace-muted">
                <Code2 className="h-4 w-4 text-brand-orange" />
                {t('challenges:playground.editor')}
              </span>
              <div className="flex items-center gap-1.5">
                {challenge.files && Object.keys(challenge.files).length > 1 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md border-workspace-border text-workspace-muted hover:text-workspace-text"
                      >
                        <Folder className="h-4 w-4" />
                        <span className="sr-only">
                          {t('challenges:playground.files')}
                        </span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="h-[70vh] rounded-t-xl border-workspace-border bg-workspace-panel p-0 text-workspace-text"
                    >
                      <div className="mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-workspace-border" />
                      <div className="border-b border-workspace-border px-5 py-3 text-sm font-medium">
                        {t('challenges:playground.files')}
                      </div>
                      <div className="h-[calc(70vh-4rem)] overflow-hidden p-2">
                        <FileExplorer
                          files={challenge.files}
                          {...omitUndefined({
                            editableFiles: challenge.editableFiles,
                          })}
                          selectedFile={currentVfsPath}
                          onSelectFile={handleSelectFile}
                          className="border-none bg-transparent"
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
                <Button
                  size="sm"
                  onClick={
                    isCodeChallenge
                      ? () => void handleRunCode()
                      : handleValidateSelector
                  }
                  disabled={
                    state.isRunning || (isSelectorChallenge && !state.selector)
                  }
                  className="min-h-9 rounded-md bg-brand-orange px-3 text-sm font-medium text-workspace-background hover:bg-brand-orange/90"
                >
                  {state.isRunning ? 'RUNNING…' : t('common:actions.run')}
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {isSelectorChallenge ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <SelectorPanel
                    challenge={challenge}
                    state={state}
                    onSelectorChange={handleSelectorChange}
                    onValidate={handleValidateSelector}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <EditorPanel
                    challenge={challenge}
                    state={state}
                    isMobile={true}
                    onRunCode={() => void handleRunCode()}
                    onReset={handleReset}
                    onFileChange={handleFileChange}
                    onSelectFile={handleSelectFile}
                    onCloseFile={handleCloseFile}
                    onCodeChange={(code) => state.setCode(code)}
                    onReady={() => state.setIsLayoutReady(true)}
                  />
                </div>
              )}
            </div>

            {(isCodeChallenge || isSelectorChallenge) && (
              <div className="human-results-surface h-[min(38vh,280px)] min-h-[180px] shrink-0 border-t border-workspace-border">
                <ResultsPanel
                  challenge={challenge}
                  state={state}
                  onRunCode={
                    isCodeChallenge
                      ? () => void handleRunCode()
                      : handleValidateSelector
                  }
                />
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
