import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '../CodeEditor';
import { FileExplorer } from '../FileExplorer';
import { MultiTabEditor } from '../MultiTabEditor';
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
    const {
        fileContents,
        selectedFile,
        openFiles,
        resetCount,
        extraLibs,
        isLayoutReady
    } = state;

    const isMultiFile = challenge.files && Object.keys(challenge.files).length > 1;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/5 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    {t('challenges:playground.editor')}
                    {challenge.files && challenge.editableFiles && (
                        <span className="text-[10px] lowercase text-muted-foreground/60 italic">
                            — editing {challenge.editableFiles[0].split('/').pop()}
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
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
                                editableFiles={challenge.editableFiles}
                                selectedFile={selectedFile}
                                onSelectFile={onSelectFile}
                                className="w-44 shrink-0 border-r border-border"
                            />
                        )}
                        <MultiTabEditor
                            files={fileContents}
                            editableFiles={challenge.editableFiles}
                            selectedFile={selectedFile}
                            openFiles={openFiles}
                            onSelectFile={onSelectFile}
                            onCloseFile={onCloseFile}
                            onCodeChange={onFileChange}
                            onRun={onRunCode}
                            onReady={onReady}
                            storageKeyPrefix={userId ? `challenge-${challenge.id}-${userId}` : `challenge-${challenge.id}`}
                            className="flex-1"
                            extraLibs={extraLibs}
                        />
                    </div>
                ) : (
                    <CodeEditor
                        initialCode={challenge.starterCode}
                        language={challenge.type === 'TYPESCRIPT' ? 'typescript' : 'javascript'}
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
                        extraLibs={extraLibs}
                    />
                )}
            </div>
        </div>
    );
}
