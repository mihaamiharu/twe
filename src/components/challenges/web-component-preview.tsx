import { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  type WebComponentPreviewProps,
  usePreviewState,
  PreviewHeader,
  PreviewFooter,
  IframeContainer
} from './preview';

/**
 * WebComponentPreview - Visual preview for selector challenges
 * 
 * Refactored in 2026 for improved maintainability.
 * This component orchestrates the sandboxed iframe preview, 
 * element inspection, and selector highlighting.
 */
export function WebComponentPreview(props: WebComponentPreviewProps) {
  const {
    htmlContent,
    showControls = true,
    className,
    iframeRef: externalIframeRef,
    files,
    currentPath,
    targetElementId,
  } = props;

  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;

  // Delegate logic to custom hook
  const {
    zoom,
    hoveredElement,
    viewMode,
    setViewMode,
    isFullscreen,
    setIsFullscreen,
    handleZoomIn,
    handleZoomOut,
  } = usePreviewState(props, iframeRef);

  return (
    <div
      className={cn(
        'flex flex-col bg-background rounded-lg overflow-hidden border border-border/50 shadow-sm relative',
        isFullscreen && 'fixed inset-4 z-50 border-2 shadow-2xl',
        className,
      )}
    >
      {/* Browser Window Frame with Toolbar */}
      <PreviewHeader
        currentPath={currentPath}
        files={files}
        targetElementId={targetElementId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        zoom={zoom}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        showControls={showControls}
      />

      {/* Main Preview/Source View Area */}
      <IframeContainer
        iframeRef={iframeRef}
        viewMode={viewMode}
        zoom={zoom}
        htmlContent={htmlContent}
      />

      {/* Status Bar / Inspector Footer */}
      {viewMode === 'preview' && (
        <PreviewFooter
          hoveredElement={hoveredElement}
          zoom={zoom}
        />
      )}

      {/* Fullscreen Overlay Backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}

export default WebComponentPreview;
