import React, { useRef, useEffect, useState } from "react";
import {
  DocumentChunk,
  ChatResponse,
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
  Send,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import DocumentChat from "@/components/DocumentChat";
import { Input } from "@/components/ui/input";

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
  suggestedQuestions?: string[];
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
  suggestedQuestions = [],
}) => {
  const selectedChunkRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("parsed");
  const [viewMode, setViewMode] = useState<"blocks" | "combined">("blocks");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyingChunks, setCopyingChunks] = useState<Record<string, boolean>>(
    {}
  );

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
    } else {
      setActiveTab("parsed");
    }
  }, [isChatActive, documentData]);

  useEffect(() => {
    // Scroll to bottom of chat when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // When chat becomes active or document data changes, stop the loading
    if (isChatActive || chatMessages.length > 0) {
      setIsGeneratingQuestions(false);
    }
  }, [isChatActive, documentData, chatMessages.length]);

  const copyToClipboard = (text: string, chunkId?: string) => {
    // More comprehensive markdown cleaning for plain text
    const plainText = text
      // Remove markdown headings, bold, italic, strikethrough, code, links, and images
      .replace(/[#*_~`[\]()]/g, "")
      // Handle markdown links by keeping only the text part
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Convert markdown lists to plain text with proper spacing
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Handle tables by preserving the text but removing table formatting
      .replace(/\|/g, " ")
      // Remove code blocks and their language specifiers
      .replace(/```[\s\S]*?```/g, "")
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (chunkId) {
      setCopyingChunks((prev) => ({ ...prev, [chunkId]: true }));
    } else {
      setIsCopying(true);
    }

    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        toast.success("Copied to clipboard!");
        if (chunkId) {
          setTimeout(() => {
            setCopyingChunks((prev) => ({ ...prev, [chunkId]: false }));
          }, 2000);
        } else {
          setTimeout(() => setIsCopying(false), 2000);
        }
      })
      .catch(() => {
        toast.error("Failed to copy text");
        if (chunkId) {
          setCopyingChunks((prev) => ({ ...prev, [chunkId]: false }));
        } else {
          setIsCopying(false);
        }
      });
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

  const handleChatButtonClick = () => {
    if (onChatWithDocument) {
      setIsGeneratingQuestions(true);
      onChatWithDocument();
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !onSendChatMessage) return;

    // Add user message to chat
    const userMessage = chatMessage.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatMessage("");
    setIsSendingMessage(true);

    try {
      // Call the API to get response
      const response = await onSendChatMessage(userMessage, documentData);

      // Add assistant response to chat
      if (response && response.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);
      } else if (response && response.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${response.error}` },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process that request.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSuggestedQuestionClick = (question: string) => {
    setChatMessage(question);
    // Optionally auto-send the question
    if (onSendChatMessage) {
      setChatMessages((prev) => [...prev, { role: "user", content: question }]);
      setChatMessage("");
      setIsSendingMessage(true);

      onSendChatMessage(question, documentData)
        .then((response) => {
          if (response && response.message) {
            setChatMessages((prev) => [
              ...prev,
              { role: "assistant", content: response.message },
            ]);
          } else if (response && response.error) {
            setChatMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Error: ${response.error}` },
            ]);
          }
        })
        .catch((error) => {
          console.error("Error sending suggested question:", error);
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "An error occurred. Please try again.",
            },
          ]);
        })
        .finally(() => {
          setIsSendingMessage(false);
        });
    }
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
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  chunk.chunk_type === "table" && "overflow-auto"
                )}
                onClick={() => onChunkSelect(chunk.chunk_id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {chunk.chunk_type === "figure"
                      ? `Figure ${index + 1}`
                      : chunk.chunk_type === "table" 
                        ? `Table ${index + 1}`
                        : `${index + 1} - ${chunk.chunk_type}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(chunk.text, chunk.chunk_id);
                    }}
                    disabled={copyingChunks[chunk.chunk_id]}
                  >
                    {copyingChunks[chunk.chunk_id] ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className={cn(
                  "whitespace-pre-wrap break-words mt-3", 
                  chunk.chunk_type === "table" && "min-w-[30rem]"
                )}>
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
                setIsGeneratingQuestions(true);
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
          disabled={isProcessing || !markdown || isCopying}
        >
          {isCopying ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
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
                isLoadingQuestions={isGeneratingQuestions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentContent;
