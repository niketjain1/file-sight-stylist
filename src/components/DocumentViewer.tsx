import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentChunk, Grounding } from "@/services/documentService";

interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  pageCount: number;
  chunks?: DocumentChunk[];
  isProcessing?: boolean;
  processingError?: string | null;
  highlightedChunkId?: string;
  onChunkClick?: (chunkId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentName,
  pageCount,
  chunks = [],
  isProcessing = false,
  processingError = null,
  highlightedChunkId,
  onChunkClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoverChunkId, setHoverChunkId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const viewerRef = React.useRef<HTMLDivElement>(null);

  // Update current page when highlightedChunkId changes
  useEffect(() => {
    if (highlightedChunkId && chunks) {
      const selectedChunk = chunks.find(
        (chunk) => chunk.chunk_id === highlightedChunkId
      );
      if (selectedChunk?.grounding && selectedChunk.grounding.length > 0) {
        // Set the page to the first grounding's page (adding 1 since API uses 0-indexing)
        const newPage = selectedChunk.grounding[0].page + 1;
        if (newPage >= 1 && newPage <= pageCount) {
          setCurrentPage(newPage);
        }
      }
    }
  }, [highlightedChunkId, chunks, pageCount]);

  // Handle fullscreen toggling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  const getChunksForCurrentPage = () => {
    // API uses 0-indexed pages, UI uses 1-indexed
    const apiPageIndex = currentPage - 1;

    return chunks.filter(
      (chunk) =>
        chunk.grounding && chunk.grounding.some((g) => g.page === apiPageIndex)
    );
  };

  // Get the current page URL if it's a multi-page document
  const getCurrentPageUrl = () => {
    return documentUrl;
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      viewerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Get figure numbers for each chunk
  const getFigureNumber = (chunkId: string, chunkType: string): string => {
    if (chunkType.toLowerCase() !== "figure") {
      return "";
    }

    // Find all figure chunks and determine this one's position
    const figureChunks = chunks.filter(
      (c) => c.chunk_type.toLowerCase() === "figure"
    );
    const figureIndex = figureChunks.findIndex((c) => c.chunk_id === chunkId);

    if (figureIndex >= 0) {
      return `Figure ${figureIndex + 1}`;
    }

    return "";
  };

  const renderPageOverlay = () => {
    const currentChunks = getChunksForCurrentPage();
    // API uses 0-indexed pages, UI uses 1-indexed
    const apiPageIndex = currentPage - 1;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {currentChunks.map(
          (chunk, chunkIndex) =>
            chunk.grounding &&
            chunk.grounding
              .filter((g) => g.page === apiPageIndex)
              .map((grounding, gIndex) => {
                const figureNumber = getFigureNumber(
                  chunk.chunk_id,
                  chunk.chunk_type
                );

                return (
                  <div
                    key={`${chunk.chunk_id}-${gIndex}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChunkClick?.(chunk.chunk_id);
                    }}
                    onMouseEnter={() => setHoverChunkId(chunk.chunk_id)}
                    onMouseLeave={() => setHoverChunkId(null)}
                    className={cn(
                      "absolute border-2 rounded-sm pointer-events-auto cursor-pointer transition-all",
                      highlightedChunkId === chunk.chunk_id
                        ? "border-primary bg-primary/20 shadow-lg"
                        : hoverChunkId === chunk.chunk_id
                        ? "border-green-500 bg-green-500/20"
                        : "border-green-400/60 hover:border-primary hover:bg-primary/5"
                    )}
                    style={{
                      left: `${grounding.box.l * 100}%`,
                      top: `${grounding.box.t * 100}%`,
                      width: `${(grounding.box.r - grounding.box.l) * 100}%`,
                      height: `${(grounding.box.b - grounding.box.t) * 100}%`,
                      zIndex: highlightedChunkId === chunk.chunk_id ? 10 : 5,
                    }}
                  >
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 rounded-sm pointer-events-none">
                      {figureNumber || `${chunkIndex + 1}-${chunk.chunk_type}`}
                    </div>

                    {(highlightedChunkId === chunk.chunk_id ||
                      hoverChunkId === chunk.chunk_id) && (
                      <div className="absolute bottom-full left-0 mb-1 p-2 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap">
                        {figureNumber
                          ? figureNumber + ": "
                          : `${chunkIndex + 1}-${chunk.chunk_type}: `}
                        {chunk.text.length > 30
                          ? `${chunk.text.substring(0, 30)}...`
                          : chunk.text}
                      </div>
                    )}
                  </div>
                );
              })
        )}
      </div>
    );
  };

  return (
    <div ref={viewerRef} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-1 bg-background/80 rounded-md border px-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isProcessing}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage} / {pageCount || 1}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage === pageCount || isProcessing || pageCount <= 1
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={isProcessing || zoomLevel <= 0.5}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-16 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={isProcessing || zoomLevel >= 3}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullScreen}
            disabled={isProcessing}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative flex-grow overflow-auto bg-muted/30 flex items-center justify-center p-0">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary border-r-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-primary/60 border-l-transparent animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium text-xl">Extracting</h3>
              <p className="text-muted-foreground">
                We're processing your document with high accuracy. <br />
                Once ready, chat and extract insights seamlessly!
              </p>
            </div>
          </div>
        ) : processingError ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium text-xl">Processing Error</h3>
              <p className="text-muted-foreground">
                {processingError}
                <br />
                Please try again or upload a different document.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full overflow-auto p-4">
            <div
              className="relative inline-block max-w-full max-h-full transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {documentUrl && (
                <img
                  src={documentUrl}
                  alt={`${documentName} - Page ${currentPage}`}
                  className="object-contain"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              )}
              {renderPageOverlay()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
