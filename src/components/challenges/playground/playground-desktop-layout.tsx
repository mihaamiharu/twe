import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { omitUndefined } from '@/lib/omit-undefined';
import { WebComponentPreview } from '../web-component-preview';
import { EditorPanel } from './editor-panel';
import { SelectorPanel } from './selector-panel';
import { ResultsPanel } from './results-panel';
import { defaultSelectorStyles, e2eSelectorStyles } from './constants';
import type { Challenge, PlaygroundState } from './types';
import type { SelectorType } from '../selector-input';
import type { ChallengeExecution } from './use-challenge-execution';

interface PlaygroundDesktopLayoutProps {
  challenge: Challenge;
  state: PlaygroundState;
  execution: ChallengeExecution;
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
    <PanelGroup
      direction="horizontal"
      autoSaveId={`challenge-layout-v1`}
      className="bg-workspace-background"
    >
      {/* Left Panel: Instructions & Preview */}
      <Panel
        defaultSize={40}
        minSize={20}
        className="workspace-panel flex flex-col"
      >
        <Tabs
          value={activeTab === 'preview' ? 'preview' : 'instructions'}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pt-3 pb-2 shrink-0">
            <TabsList className="w-full justify-start h-10 bg-workspace-elevated p-1 border border-workspace-border rounded-md">
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
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-workspace-border prose-headings:text-workspace-text prose-p:text-workspace-text prose-li:text-workspace-text">
              <MarkdownRenderer content={challenge.instructions} />
            </div>
          </TabsContent>

          {hasHtml && (
            <TabsContent
              value="preview"
              forceMount
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
                {...omitUndefined({
                  userSelector: isSelectorChallenge ? selector : undefined,
                })}
                selectorType={selectorType as SelectorType}
                targetSelector={challenge.targetSelector as string}
                targetSelectorType={
                  challenge.type === 'XPATH_SELECTOR' ? 'xpath' : 'css'
                }
                onValidationChange={handlePreviewValidation}
                className="flex-1 border border-workspace-border rounded-md bg-white shadow-none"
                showControls={true}
                height="100%"
                iframeRef={previewIframeRef}
                {...omitUndefined({ files: challenge.files })}
                currentPath={currentVfsPath}
                onNavigate={(path) => setCurrentVfsPath(path)}
              />
            </TabsContent>
          )}
        </Tabs>
      </Panel>

      <PanelResizeHandle className="motion-hover-grip-group w-3 bg-transparent hover:bg-brand-orange/5 transition-colors focus:outline-none flex items-center justify-center group relative z-10 -mx-1.5 cursor-col-resize">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-workspace-border group-hover:bg-brand-orange transition-colors" />
        <div className="motion-hover-grip h-8 w-4 bg-workspace-elevated border border-workspace-border rounded-md flex items-center justify-center shadow-none z-20 group-hover:border-brand-orange">
          <GripVertical className="h-3 w-3 text-workspace-muted group-hover:text-brand-orange transition-colors" />
        </div>
      </PanelResizeHandle>

      {/* Right Panel: Editor & Results */}
      <Panel
        minSize={30}
        className="workspace-panel flex flex-col relative z-0"
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isCodeChallenge ? (
            <div className="technical-surface min-h-0 flex-1">
              <EditorPanel
                challenge={challenge}
                state={state}
                {...omitUndefined({ userId })}
                isMobile={false}
                onRunCode={() => {
                  void handleRunCode();
                }}
                onReset={handleReset}
                onFileChange={handleFileChange}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
                onCodeChange={(code) => state.setCode(code)}
                onReady={() => state.setIsLayoutReady(true)}
              />
            </div>
          ) : (
            <SelectorPanel
              challenge={challenge}
              state={state}
              onSelectorChange={handleSelectorChange}
              onValidate={handleValidateSelector}
            />
          )}
        </div>

        {isCodeChallenge && (
          <div className="h-[40%] min-h-[180px] flex flex-col shrink-0 border-t border-workspace-border">
            <ResultsPanel
              challenge={challenge}
              state={state}
              onRunCode={() => {
                void handleRunCode();
              }}
            />
          </div>
        )}
      </Panel>
    </PanelGroup>
  );
}
