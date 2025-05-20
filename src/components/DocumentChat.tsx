import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";
import { ChatResponse, DocumentResponse } from "@/services/documentService";

interface DocumentChatProps {
  documentData: DocumentResponse;
  onSendChatMessage: (
    message: string,
    documentData: DocumentResponse
  ) => Promise<ChatResponse>;
  initialSuggestedQuestions?: string[];
  isLoadingQuestions?: boolean;
}

const DocumentChat: React.FC<DocumentChatProps> = ({
  documentData,
  onSendChatMessage,
  initialSuggestedQuestions = [
    "What information is contained in this document?",
    "Can you summarize the main points?",
    "What are the key details in this document?",
  ],
  isLoadingQuestions = false,
}) => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestions
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // Update suggested questions if they change externally
    if (initialSuggestedQuestions && initialSuggestedQuestions.length > 0) {
      setSuggestedQuestions(initialSuggestedQuestions);
    }
  }, [initialSuggestedQuestions]);

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
      // Call the API to get response, passing document data
      const response = await onSendChatMessage(userMessage, documentData);

      // Add assistant response to chat
      if (response && response.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.message },
        ]);

        // Update suggested questions if available
        if (
          response.suggestedQuestions &&
          response.suggestedQuestions.length > 0
        ) {
          setSuggestedQuestions(response.suggestedQuestions);
        }
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
    // Auto-send the suggested question
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsSendingMessage(true);

    onSendChatMessage(question, documentData)
      .then((response) => {
        if (response && response.message) {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: response.message },
          ]);

          // Update suggested questions if available
          if (
            response.suggestedQuestions &&
            response.suggestedQuestions.length > 0
          ) {
            setSuggestedQuestions(response.suggestedQuestions);
          }
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
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-auto p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="bg-muted/50 rounded-full p-6 mb-4">
              <MessageSquare className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-medium mb-2">Chat with Document</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Ask questions about the document content. The AI will find answers
              from forms, reports, figures and highlight the exact sources.
            </p>

            <div className="w-full max-w-md space-y-3">
              <h4 className="text-sm font-medium mb-2">Suggested questions</h4>
              {isLoadingQuestions ? (
                // Spinner loader for loading questions
                <div className="flex flex-col items-center py-6 space-y-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Generating questions...
                  </p>
                </div>
              ) : (
                suggestedQuestions.map((question, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors text-sm"
                  >
                    {question}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "px-4 py-2 rounded-lg max-w-[80%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              )}
            >
              {msg.role === "assistant" ? (
                <Markdown content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          ))
        )}
        {isSendingMessage && (
          <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
            <div className="flex space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-300"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border shrink-0">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage();
              }
            }}
            placeholder="Type your question about the document..."
            disabled={isSendingMessage}
            className="flex-1"
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!chatMessage.trim() || isSendingMessage}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentChat;
