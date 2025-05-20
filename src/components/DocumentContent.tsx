import React, { useRef, useEffect, useState } from "react";
import {
  DocumentChunk,
  ChatResponse,
  getSuggestedQuestions,
  DocumentResponse,
} from "@/services/documentService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  AlertCircle,
  FileDown,
  MessageSquare,
  FileText,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import DocumentChat from "@/components/DocumentChat";

interface DocumentContentProps {
  chunks: DocumentChunk[];
  markdown: string;
  isProcessing: boolean;
  selectedChunkId?: string;
  onChunkSelect: (chunkId: string) => void;
  onParseDocument?: () => void;
  onChatWithDocument?: () => void;
  onSendChatMessage?: (
    message: string,
    documentData: DocumentResponse
  ) => Promise<ChatResponse>;
  isChatActive?: boolean;
  processingError?: string | null;
  documentId?: string;
  documentData: DocumentResponse;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  chunks,
  markdown,
  isProcessing,
  selectedChunkId,
  onChunkSelect,
  onParseDocument,
  onChatWithDocument,
  onSendChatMessage,
  isChatActive = false,
  processingError = null,
  documentId,
  documentData,
}) => {
  const selectedChunkRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("parsed");
  const [viewMode, setViewMode] = useState<"blocks" | "combined">("blocks");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What information is included in this document?",
    "What is the main topic of this document?",
    "Can you summarize the key details?",
  ]);

  useEffect(() => {
    if (selectedChunkId && selectedChunkRef.current) {
      selectedChunkRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedChunkId]);

  useEffect(() => {
    if (isChatActive) {
      setActiveTab("chat");
      // Load suggested questions when chat becomes active
      if (documentData) {
        loadSuggestedQuestions();
      }
    } else {
      setActiveTab("parsed");
    }
  }, [isChatActive, documentData]);

  const loadSuggestedQuestions = async () => {
    if (!documentData) return;

    try {
      const questions = await getSuggestedQuestions(documentData);
      if (questions && questions.length > 0) {
        setSuggestedQuestions(questions);
      }
    } catch (error) {
      console.error("Error loading suggested questions:", error);
      // Keep the default questions if there's an error
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy text"));
  };

  const downloadAsText = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Processing document...
        </div>
      );
    }

    if (processingError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="font-medium text-xl mb-2">Processing Error</h3>
          <p className="text-muted-foreground mb-4">{processingError}</p>
          <p className="text-sm">
            Try uploading a different document or check your connection.
          </p>
        </div>
      );
    }

    if (chunks.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No content extracted. Try parsing the document.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === "blocks" ? "default" : "outline"}
              onClick={() => setViewMode("blocks")}
            >
              <Layers className="h-4 w-4 mr-1" />
              Content Blocks
            </Button>
            <Button
              size="sm"
              variant={viewMode === "combined" ? "default" : "outline"}
              onClick={() => setViewMode("combined")}
            >
              <FileText className="h-4 w-4 mr-1" />
              Combined View
            </Button>
          </div>
          {markdown && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAsText(markdown, "document-extraction.md")}
            >
              <FileDown className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>

        {viewMode === "combined" && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Markdown content={markdown} />
          </div>
        )}

        {viewMode === "blocks" && (
          <div className="space-y-4">
            {chunks.map((chunk, index) => (
              <div
                key={chunk.chunk_id}
                ref={
                  selectedChunkId === chunk.chunk_id ? selectedChunkRef : null
                }
                className={cn(
                  "p-3 rounded-md border cursor-pointer transition-all",
                  selectedChunkId === chunk.chunk_id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => onChunkSelect(chunk.chunk_id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {chunk.chunk_type === "figure"
                      ? `Figure ${index + 1}`
                      : `${index + 1} - ${chunk.chunk_type}`}
                  </span>
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
                <div className="whitespace-pre-wrap break-words mt-3">
                  <Markdown content={chunk.text} />
                </div>
                {chunk.grounding && chunk.grounding.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Located on page {chunk.grounding[0].page + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border shrink-0">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <Button
            variant={activeTab === "parsed" ? "default" : "outline"}
            className="flex items-center flex-1"
            onClick={() => {
              setActiveTab("parsed");
              if (isChatActive && onChatWithDocument) {
                onChatWithDocument();
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Document Content
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            className="flex items-center flex-1"
            onClick={() => {
              setActiveTab("chat");
              if (!isChatActive && onChatWithDocument) {
                onChatWithDocument();
              }
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
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

      <div className="flex-1 overflow-auto">
        {activeTab === "parsed" ? (
          <div className="h-full p-4 overflow-auto">{renderContent()}</div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            {onSendChatMessage && documentData && (
              <DocumentChat
                documentData={documentData}
                onSendChatMessage={onSendChatMessage}
                initialSuggestedQuestions={suggestedQuestions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentContent;
