import { useTranslation } from 'react-i18next';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { omitUndefined } from '@/lib/omit-undefined';
import { CodeEditor } from '../code-editor';
import { FileExplorer } from '../file-explorer';
import { MultiTabEditor } from '../multi-tab-editor';
import type { Challenge, PlaygroundState } from './types';

interface EditorPanelProps {
  challenge: Challenge;
  state: PlaygroundState;
  userId?: string;
  isMobile: boolean;
  onRunCode: () => void;
  onReset: () => void;
  onFileChange: (path: string, newCode: string) => void;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onCodeChange: (code: string) => void;
  onReady: () => void;
}

export function EditorPanel({
  challenge,
  state,
  userId,
  isMobile,
  onRunCode,
  onReset,
  onFileChange,
  onSelectFile,
  onCloseFile,
  onCodeChange,
  onReady,
}: EditorPanelProps) {
  const { t } = useTranslation(['challenges']);
  const { fileContents, selectedFile, openFiles, resetCount, extraLibs } =
    state;

  const isMultiFile =
    challenge.files && Object.keys(challenge.files).length > 1;

  return (
    <div className="workspace-panel flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-workspace-border bg-workspace-panel shrink-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-workspace-muted flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-orange"></div>
            {t('challenges:playground.editor')}
          </h3>
          {isMobile && challenge.targetSelector && (
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 py-0 font-mono bg-brand-orange/10 text-brand-orange border-brand-orange/30 truncate max-w-[200px]"
              >
                <Search className="h-2.5 w-2.5 mr-1" />
                {challenge.targetSelector}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-workspace-muted hover:text-brand-error"
            onClick={onReset}
            title={t('challenges:playground.resetCode')}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {isMultiFile ? (
          <div className="flex h-full">
            {!isMobile && (
              <FileExplorer
                files={challenge.files!}
                {...omitUndefined({
                  editableFiles: challenge.editableFiles,
                })}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                className="w-60 shrink-0 border-r border-border"
              />
            )}
            <MultiTabEditor
              files={fileContents}
              {...omitUndefined({
                editableFiles: challenge.editableFiles,
              })}
              selectedFile={selectedFile}
              openFiles={openFiles}
              onSelectFile={onSelectFile}
              onCloseFile={onCloseFile}
              onCodeChange={onFileChange}
              onRun={onRunCode}
              onReady={onReady}
              storageKeyPrefix={
                userId
                  ? `challenge-${challenge.id}-${userId}`
                  : `challenge-${challenge.id}`
              }
              className="flex-1"
              {...omitUndefined({ extraLibs })}
            />
          </div>
        ) : (
          <CodeEditor
            initialCode={challenge.starterCode}
            language={
              challenge.type === 'TYPESCRIPT' ? 'typescript' : 'javascript'
            }
            onChange={onCodeChange}
            onRun={onRunCode}
            onReady={onReady}
            storageKey={
              userId
                ? `challenge-${challenge.id}-${userId}`
                : `challenge-${challenge.id}`
            }
            height="100%"
            className="h-full"
            key={`${challenge.id}-${resetCount}`}
            {...omitUndefined({ extraLibs })}
          />
        )}
      </div>
    </div>
  );
}
