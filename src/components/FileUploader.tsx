import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  maxPages?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  isUploading = false,
  acceptedFileTypes = ".jpeg,.jpg,.png,.pdf",
  maxFileSize = 250 * 1024 * 1024, // 250MB
  maxPages = 50,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    // Check file type
    const fileType = file.type;
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    const validImageTypes = ["image/jpeg", "image/jpg", "image/png"];
    const validPdfType = "application/pdf";

    if (!validImageTypes.includes(fileType) && fileType !== validPdfType) {
      toast.error("Invalid file type. Please upload JPEG, PNG, or PDF.");
      return false;
    }

    // Check file size
    if (file.size > maxFileSize) {
      toast.error(
        `File size exceeds the maximum limit of ${
          maxFileSize / (1024 * 1024)
        }MB.`
      );
      return false;
    }

    // Additional validation for PDF file (check pages would be done on server)
    if (fileType === validPdfType) {
      // We can't check the number of pages client-side without additional libraries
      // The server will need to validate this
      toast.info(`Note: PDFs must have ${maxPages} pages or fewer.`);
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-6 w-full max-w-xl mx-auto transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          isUploading
            ? "opacity-70 pointer-events-none"
            : "hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className="h-10 w-10 text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-medium text-xl">Upload</h3>
          <p className="text-muted-foreground">JPEG, PNG, PDF</p>
          <p className="text-sm text-muted-foreground">
            Max file size: {maxFileSize / (1024 * 1024)}MB
            <br />
            Max file pages: {maxPages}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleChange}
          className="hidden"
        />

        <Button
          onClick={handleClick}
          disabled={isUploading}
          className="relative"
        >
          {isUploading ? (
            <>
              <span className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-r-transparent rounded-full animate-spin" />
              </span>
              <span className="opacity-0">Select File</span>
            </>
          ) : (
            "Select File"
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
