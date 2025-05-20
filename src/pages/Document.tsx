import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar, { FileItem } from "@/components/Sidebar";
import DocumentViewer from "@/components/DocumentViewer";
import DocumentContent from "@/components/DocumentContent";
import {
  processDocument,
  parseDocument,
  chatWithDocument,
  DocumentChunk,
  DocumentResponse,
  ChatResponse,
} from "@/services/documentService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const Document = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    file,
    fileItem,
    fileObjectUrl,
    isDemo = false,
    demoType = "",
  } = location.state || {};

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentResponse | null>(
    null
  );
  const [selectedChunkId, setSelectedChunkId] = useState<string | undefined>(
    undefined
  );
  const [documentId, setDocumentId] = useState<string>("");
  const [isChatActive, setIsChatActive] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);

  // Sample example files data
  const exampleFiles: FileItem[] = [
    { id: "invoice", name: "Invoice", type: "Tables, Multi-column" },
    { id: "lab-report", name: "Lab Report", type: "Medical, Images" },
    { id: "loan-form", name: "Loan Form", type: "Forms, Checkboxes" },
    {
      id: "performance-charts",
      name: "Performance Charts",
      type: "Charts, Reading Order",
    },
  ];

  useEffect(() => {
    // If there's no file data in the location state, redirect to the upload page
    if (!file || !fileItem || !fileObjectUrl) {
      navigate("/");
      return;
    }

    // Add the uploaded file to the files array
    setFiles([fileItem]);
    setSelectedFile(fileItem);

    // Process the uploaded document
    const processUploadedDocument = async () => {
      setIsProcessing(true);
      setProcessingError(null);
      try {
        // Call the actual API to process the document, passing demo flags if needed
        const response = await processDocument(file, null, isDemo, demoType);
        console.log("Document processing response:", response);

        // Set the document data from the API response
        setDocumentData(response.data);

        // If the API returns a document ID, store it for future operations
        if (response.data.documentId) {
          setDocumentId(response.data.documentId);
        }

        // Set page count - use 1 as default if not provided
        const calculatedPageCount =
          response.data.pageCount ||
          (response.data.chunks && response.data.chunks.length > 0
            ? Math.max(
                ...response.data.chunks
                  .filter(
                    (chunk) => chunk.grounding && chunk.grounding.length > 0
                  )
                  .flatMap((chunk) =>
                    chunk.grounding
                      ? chunk.grounding.map((g) => g.page + 1)
                      : [0]
                  ),
                1
              )
            : 1);

        setPageCount(calculatedPageCount);

        // Check for any errors in the response
        if (response.errors && response.errors.length > 0) {
          const errorMessages = response.errors
            .map((err) => `Page ${err.page_num}: ${err.error}`)
            .join(", ");
          toast.warning(
            `Document processed with some issues: ${errorMessages}`
          );
        } else {
          toast.success("Document processed successfully");
        }
      } catch (error) {
        console.error("Error processing document:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process document. Please try again.";
        toast.error(errorMessage);
        setProcessingError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    processUploadedDocument();
  }, [file, fileItem, fileObjectUrl, navigate, isDemo, demoType]);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    // In a real application, this would trigger processing of the selected file
  };

  const handleChunkSelect = (chunkId: string) => {
    setSelectedChunkId(chunkId);

    // Find the selected chunk to auto-scroll to it in the content view
    const selectedChunk = documentData?.chunks.find(
      (c) => c.chunk_id === chunkId
    );
    if (
      selectedChunk &&
      selectedChunk.grounding &&
      selectedChunk.grounding.length > 0
    ) {
      // If the chunk has grounding info, set the current page to the page of the first grounding
      const page = selectedChunk.grounding[0].page;
      if (page >= 0 && page < pageCount) {
        // Update current page if needed
        // This would need to be implemented in DocumentViewer
      }
    }
  };

  const handleBackClick = () => {
    // Clean up object URLs before navigating away
    if (fileObjectUrl) {
      URL.revokeObjectURL(fileObjectUrl);
    }
    navigate("/");
  };

  const handleParseDocument = async () => {
    if (!documentId) {
      toast.error("No document ID available. Please process a document first.");
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    try {
      const response = await parseDocument(documentId);
      console.log("Document parsing response:", response);

      setDocumentData(response.data);

      // Update page count if available
      if (response.data.pageCount) {
        setPageCount(response.data.pageCount);
      }

      toast.success("Document parsed successfully");
    } catch (error) {
      console.error("Error parsing document:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to parse document. Please try again.";
      toast.error(errorMessage);
      setProcessingError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatWithDocument = async () => {
    if (!documentId) {
      toast.error("No document ID available. Please process a document first.");
      return;
    }

    // Toggle chat mode
    setIsChatActive(!isChatActive);

    if (!isChatActive) {
      toast.success(
        "Chat mode activated. You can now ask questions about the document."
      );
    }
  };

  const handleSendChatMessage = async (
    message: string,
    docData: DocumentResponse
  ): Promise<ChatResponse> => {
    if (!docData) {
      toast.error(
        "No document data available. Please process a document first."
      );
      return { message: "", error: "No document data available" };
    }

    try {
      const response = await chatWithDocument(docData, message);
      console.log("Chat response:", response);
      return response;
    } catch (error) {
      console.error("Error chatting with document:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to chat with document. Please try again.";
      toast.error(errorMessage);
      return { message: "", error: errorMessage };
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (fileObjectUrl) {
        URL.revokeObjectURL(fileObjectUrl);
      }
    };
  }, [fileObjectUrl]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          exampleFiles={exampleFiles}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <div className="p-2 border-b border-border">
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            {/* Document viewer */}
            <div className="border-r border-border overflow-hidden flex flex-col">
              {fileObjectUrl && (
                <DocumentViewer
                  documentUrl={fileObjectUrl}
                  documentName={selectedFile?.name || "Document"}
                  pageCount={pageCount}
                  chunks={documentData?.chunks || []}
                  isProcessing={isProcessing}
                  processingError={processingError}
                  highlightedChunkId={selectedChunkId}
                  onChunkClick={handleChunkSelect}
                />
              )}
            </div>

            {/* Document content */}
            <div className="overflow-auto flex flex-col">
              <DocumentContent
                chunks={documentData?.chunks || []}
                markdown={documentData?.markdown || ""}
                isProcessing={isProcessing}
                selectedChunkId={selectedChunkId}
                onChunkSelect={handleChunkSelect}
                onParseDocument={handleParseDocument}
                onChatWithDocument={handleChatWithDocument}
                onSendChatMessage={handleSendChatMessage}
                isChatActive={isChatActive}
                processingError={processingError}
                documentId={documentId}
                documentData={
                  documentData || { markdown: "", chunks: [], pageCount: 1 }
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Document;
