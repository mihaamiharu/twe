import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { TechnicalSurface } from '@/components/cozy-quest';
import { WebComponentPreview } from '../web-component-preview';
import { EditorPanel } from './editor-panel';
import { SelectorPanel } from './selector-panel';
import { ResultsPanel } from './results-panel';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import type { Challenge, PlaygroundState } from './types';
import type { SelectorType } from '../selector-input';

interface PlaygroundDesktopLayoutProps {
  challenge: Challenge;
  state: PlaygroundState;
  execution: any;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  userId?: string;
}

export function PlaygroundDesktopLayout({
  challenge,
  state,
  execution,
  previewIframeRef,
  userId,
}: PlaygroundDesktopLayoutProps) {
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

  return (
    <PanelGroup direction="horizontal" autoSaveId={`challenge-layout-v1`}>
      {/* Left Panel: Instructions & Preview */}
      <Panel defaultSize={40} minSize={20} className="flex flex-col bg-muted/5">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pt-4 pb-2 shrink-0">
            <TabsList className="w-full justify-start h-10 bg-muted/50 p-1 border border-border rounded-lg">
              <TabsTrigger value="instructions" className="flex-1">
                {t('challenges:playground.instructions')}
              </TabsTrigger>
              {hasHtml && (
                <TabsTrigger value="preview" className="flex-1">
                  {t('challenges:playground.preview')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent
            value="instructions"
            className="flex-1 overflow-auto p-6 focus-visible:ring-0"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-border">
              <MarkdownRenderer
                content={challenge.instructions}
                variant="challenge"
              />
            </div>
          </TabsContent>

          {hasHtml && (
            <TabsContent
              value="preview"
              className="flex-1 overflow-hidden p-4 focus-visible:ring-0 flex flex-col"
            >
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
                userSelector={isSelectorChallenge ? selector : undefined}
                selectorType={selectorType as SelectorType}
                targetSelector={challenge.targetSelector as string}
                targetSelectorType={
                  challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
                }
                onValidationChange={handlePreviewValidation}
                className="flex-1 border border-border rounded-xl bg-white shadow-sm"
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
      </Panel>

      <PanelResizeHandle
        aria-label={t('challenges:playground.resizePanels')}
        className="relative z-10 -mx-1.5 flex w-3 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-primary/5 focus:outline-none focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-border group-hover:bg-primary/50 transition-colors" />
        <div className="h-8 w-4 bg-background border border-border rounded-md flex items-center justify-center shadow-sm z-20 group-hover:border-primary group-hover:shadow-md transition-all scale-90 group-hover:scale-100">
          <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </PanelResizeHandle>

      {/* Right Panel: Editor & Results */}
      <Panel minSize={30} className="flex flex-col bg-background relative z-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isCodeChallenge ? (
            <TechnicalSurface className="m-3 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <EditorPanel
                challenge={challenge}
                state={state}
                userId={userId}
                isMobile={false}
                onRunCode={handleRunCode}
                onReset={handleReset}
                onFileChange={handleFileChange}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
                onCodeChange={(code) => state.setCode(code)}
                onReady={() => state.setIsLayoutReady(true)}
              />
            </TechnicalSurface>
          ) : (
            <TechnicalSurface className="m-3 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <SelectorPanel
                challenge={challenge}
                state={state}
                onSelectorChange={handleSelectorChange}
                onValidate={handleValidateSelector}
              />
            </TechnicalSurface>
          )}
        </div>

        {isCodeChallenge && (
          <TechnicalSurface className="m-3 mt-0 h-[40%] shrink-0 overflow-hidden p-0">
            <ResultsPanel
              challenge={challenge}
              state={state}
              onRunCode={handleRunCode}
            />
          </TechnicalSurface>
        )}
      </Panel>
    </PanelGroup>
  );
}
