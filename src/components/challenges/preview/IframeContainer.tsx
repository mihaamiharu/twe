import { CodeEditor } from '../CodeEditor';
import type { ViewMode } from './types';

interface IframeContainerProps {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    viewMode: ViewMode;
    zoom: number;
    htmlContent: string;
}

export function IframeContainer({
    iframeRef,
    viewMode,
    zoom,
    htmlContent,
}: IframeContainerProps) {
    return (
        <div className="flex-1 relative overflow-hidden bg-white/50 dark:bg-black/20">
            {/* Zoomable Iframe Wrapper */}
            <div
                className="w-full h-full overflow-auto"
                style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    width: `${100 * (100 / zoom)}%`,
                    height: `${100 * (100 / zoom)}%`,
                    display: viewMode === 'preview' ? 'block' : 'none',
                }}
            >
                <iframe
                    ref={iframeRef}
                    className="w-full h-full border-none bg-white"
                    title="Challenge Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />
            </div>

            {/* Source View Fallback */}
            {viewMode === 'source' && (
                <div className="absolute inset-0">
                    <CodeEditor
                        initialCode={htmlContent}
                        language="html"
                        readOnly={true}
                        height="100%"
                        className="border-none rounded-none h-full"
                        showMinimap={false}
                    />
                </div>
            )}
        </div>
    );
}
