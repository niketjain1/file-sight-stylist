
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';
import { FileItem } from '@/components/Sidebar';

const exampleFiles: { name: string; type: string }[] = [
  { name: 'Invoice', type: 'Tables, Multi-column' },
  { name: 'Lab Report', type: 'Medical, Images' },
  { name: 'Loan Form', type: 'Forms, Checkboxes' },
  { name: 'Performance Charts', type: 'Charts, Reading Order' }
];

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Create file object URL for preview
      const fileObjectUrl = URL.createObjectURL(file);
      
      // Simulate processing delay (in a real app, this would be the API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create file item to pass to document page
      const fileItem: FileItem = {
        id: 'uploaded-doc-' + Date.now(),
        name: file.name,
        type: file.type,
        thumbnail: fileObjectUrl
      };
      
      // Redirect to the document viewer page with file data
      navigate('/document', { 
        state: { 
          file,
          fileItem,
          fileObjectUrl 
        } 
      });
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 py-10 flex flex-col flex-1">
          <h2 className="text-2xl font-bold text-center mb-6">
            Agentic Document Extraction
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Extract structured information from visually complex documents with text, tables, pictures, charts, and other information.
            The API returns the extracted data in a hierarchical format and pinpoints the exact location of each element.
          </p>
          
          <div className="flex-1 flex items-center justify-center">
            <FileUploader 
              onFileUpload={handleFileUpload} 
              isUploading={isUploading}
            />
          </div>
          
          <div className="mt-16">
            <h3 className="font-medium text-lg mb-6 text-center">Example files</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {exampleFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <h4 className="font-medium">{file.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {file.type.split(',').map((tag, i) => (
                      <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
