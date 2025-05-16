
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar, { FileItem } from '@/components/Sidebar';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentContent from '@/components/DocumentContent';
import { processDocument, DocumentChunk, DocumentResponse } from '@/services/documentService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const Document = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { file, fileItem, fileObjectUrl } = location.state || {};
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentResponse | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | undefined>(undefined);

  // Sample example files data
  const exampleFiles: FileItem[] = [
    { id: 'invoice', name: 'Invoice', type: 'Tables, Multi-column' },
    { id: 'lab-report', name: 'Lab Report', type: 'Medical, Images' },
    { id: 'loan-form', name: 'Loan Form', type: 'Forms, Checkboxes' },
    { id: 'performance-charts', name: 'Performance Charts', type: 'Charts, Reading Order' }
  ];

  useEffect(() => {
    // If there's no file data in the location state, redirect to the upload page
    if (!file || !fileItem || !fileObjectUrl) {
      navigate('/');
      return;
    }

    // Add the uploaded file to the files array
    setFiles([fileItem]);
    setSelectedFile(fileItem);

    // Process the uploaded document
    const processUploadedDocument = async () => {
      setIsProcessing(true);
      try {
        // In a real application, this would call the actual API
        // For this demo, we'll simulate the API response with a delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to process the document with the API
        // Commented out as this is just a frontend demo
        // const response = await processDocument(file);
        
        // Simulate API response
        const mockResponse: DocumentResponse = {
          markdown: "# Document Analysis\n\nThis is a simulated document analysis with extracted text.",
          chunks: [
            {
              chunk_id: "chunk-1",
              chunk_type: "title",
              text: "SDP 50,000-12/12",
              grounding: [
                { box: { l: 0.1, t: 0.1, r: 0.5, b: 0.15 }, page: 0 }
              ]
            },
            {
              chunk_id: "chunk-2",
              chunk_type: "page_header",
              text: "प्रपत्र सं./Form No. 5074/3510",
              grounding: [
                { box: { l: 0.2, t: 0.2, r: 0.7, b: 0.25 }, page: 0 }
              ]
            },
            {
              chunk_id: "chunk-3",
              chunk_type: "text",
              text: "LIFE INSURANCE CORPORATION OF INDIA",
              grounding: [
                { box: { l: 0.15, t: 0.3, r: 0.85, b: 0.35 }, page: 0 }
              ]
            },
            {
              chunk_id: "chunk-4",
              chunk_type: "text",
              text: "Application for Surrender /Discounted Value",
              grounding: [
                { box: { l: 0.1, t: 0.4, r: 0.9, b: 0.45 }, page: 0 }
              ]
            },
            {
              chunk_id: "chunk-5",
              chunk_type: "form",
              text: "स्थान / Place: Visakhapatnam\nदिनांक / Date: 25/10/2020",
              grounding: [
                { box: { l: 0.2, t: 0.5, r: 0.8, b: 0.6 }, page: 0 }
              ]
            }
          ]
        };
        
        setDocumentData(mockResponse);
        toast.success('Document processed successfully');
      } catch (error) {
        console.error('Error processing document:', error);
        toast.error('Failed to process document. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    processUploadedDocument();
  }, [file, fileItem, fileObjectUrl, navigate]);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    // In a real application, this would trigger processing of the selected file
  };

  const handleChunkSelect = (chunkId: string) => {
    setSelectedChunkId(chunkId);
  };

  const handleBackClick = () => {
    navigate('/');
  };

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
            <div className="border-r border-border overflow-hidden">
              <DocumentViewer
                documentUrl={fileObjectUrl}
                documentName={selectedFile?.name || ''}
                pageCount={1} // For demo purposes
                chunks={documentData?.chunks || []}
                isProcessing={isProcessing}
                highlightedChunkId={selectedChunkId}
                onChunkClick={handleChunkSelect}
              />
            </div>
            
            {/* Document content */}
            <DocumentContent
              chunks={documentData?.chunks || []}
              markdown={documentData?.markdown || ''}
              isProcessing={isProcessing}
              selectedChunkId={selectedChunkId}
              onChunkSelect={handleChunkSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Document;
