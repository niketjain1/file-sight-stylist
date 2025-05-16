
import React, { useRef, useEffect } from 'react';
import { DocumentChunk } from '@/services/documentService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentContentProps {
  chunks: DocumentChunk[];
  markdown: string;
  isProcessing: boolean;
  selectedChunkId?: string;
  onChunkSelect: (chunkId: string) => void;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  chunks,
  markdown,
  isProcessing,
  selectedChunkId,
  onChunkSelect
}) => {
  const selectedChunkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChunkId && selectedChunkRef.current) {
      selectedChunkRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedChunkId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy text'));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="text-sm"
            disabled={isProcessing}
          >
            Parse Document
          </Button>
          <Button 
            variant="outline"
            className="text-sm"
            disabled={isProcessing}
          >
            Chat with Document
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => copyToClipboard(markdown)}
          disabled={isProcessing || !markdown}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="markdown" className="flex flex-col flex-1">
        <div className="flex justify-between items-center px-4 border-b border-border">
          <TabsList className="bg-transparent">
            <TabsTrigger value="markdown" className="data-[state=active]:bg-muted">Markdown</TabsTrigger>
            <TabsTrigger value="json" className="data-[state=active]:bg-muted">JSON</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="markdown" className="m-0 p-4 h-full">
            {isProcessing ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Processing document...
              </div>
            ) : (
              <div className="space-y-4">
                {chunks.map((chunk, index) => (
                  <div
                    key={chunk.chunk_id}
                    ref={selectedChunkId === chunk.chunk_id ? selectedChunkRef : null}
                    className={cn(
                      "p-3 rounded-md border cursor-pointer transition-all",
                      selectedChunkId === chunk.chunk_id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => onChunkSelect(chunk.chunk_id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-muted-foreground">{index + 1} - {chunk.chunk_type}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(chunk.text);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{chunk.text}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="json" className="m-0 p-4">
            <pre className="whitespace-pre-wrap break-words text-sm">
              {JSON.stringify({ chunks }, null, 2)}
            </pre>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DocumentContent;
