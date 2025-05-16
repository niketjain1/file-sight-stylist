
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentChunk, Grounding } from '@/services/documentService';

interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  pageCount: number;
  chunks?: DocumentChunk[];
  isProcessing?: boolean;
  highlightedChunkId?: string;
  onChunkClick?: (chunkId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentName,
  pageCount,
  chunks = [],
  isProcessing = false,
  highlightedChunkId,
  onChunkClick
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };
  
  const getChunksForCurrentPage = () => {
    return chunks.filter(chunk => 
      chunk.grounding && 
      chunk.grounding.some(g => g.page === currentPage - 1)
    );
  };

  const renderPageOverlay = () => {
    const currentChunks = getChunksForCurrentPage();
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {currentChunks.map((chunk) => (
          chunk.grounding && chunk.grounding
            .filter(g => g.page === currentPage - 1)
            .map((grounding, gIndex) => (
              <div
                key={`${chunk.chunk_id}-${gIndex}`}
                onClick={() => onChunkClick?.(chunk.chunk_id)}
                className={cn(
                  "absolute border-2 rounded-sm pointer-events-auto cursor-pointer transition-all",
                  highlightedChunkId === chunk.chunk_id 
                    ? "border-primary bg-primary/10" 
                    : "border-green-400/60 hover:border-primary hover:bg-primary/5"
                )}
                style={{
                  left: `${grounding.box.l * 100}%`,
                  top: `${grounding.box.t * 100}%`,
                  width: `${(grounding.box.r - grounding.box.l) * 100}%`,
                  height: `${(grounding.box.b - grounding.box.t) * 100}%`,
                }}
              />
            ))
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-1">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isProcessing}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentPage} / {pageCount}
          </span>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount || isProcessing}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
      </div>
      
      <div className="relative flex-grow overflow-hidden bg-muted/30 flex items-center justify-center">
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
                We're processing your document with high accuracy. <br/>
                Once ready, chat and extract insights seamlessly!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-2xl aspect-[3/4]">
              <img
                src={documentUrl}
                alt={documentName}
                className="w-full h-full object-contain border rounded-md shadow"
              />
              {renderPageOverlay()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
