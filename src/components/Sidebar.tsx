
import React from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
}

interface SidebarProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  exampleFiles?: FileItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  exampleFiles = [],
}) => {
  return (
    <div className="w-64 bg-secondary/30 border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-medium text-lg">File selection</h2>
      </div>

      <div className="overflow-y-auto flex-1">
        {files.length > 0 ? (
          <div className="p-4 space-y-4">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "p-2 rounded-md cursor-pointer border hover:bg-primary/10",
                  selectedFile?.id === file.id 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent"
                )}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center space-x-2">
                  {file.thumbnail ? (
                    <img 
                      src={file.thumbnail} 
                      alt={file.name} 
                      className="w-20 h-28 object-cover rounded-sm border" 
                    />
                  ) : (
                    <div className="w-20 h-28 bg-muted rounded-sm border flex items-center justify-center">
                      {selectedFile?.id === file.id ? 
                        <FolderOpen className="h-8 w-8 text-muted-foreground" /> : 
                        <Folder className="h-8 w-8 text-muted-foreground" />
                      }
                    </div>
                  )}
                  <span className="text-sm truncate">{file.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {exampleFiles.length > 0 && (
          <div className="p-4">
            <h3 className="font-medium mb-3 text-muted-foreground">Example files</h3>
            <div className="space-y-4">
              {exampleFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2 rounded-md cursor-pointer border border-transparent hover:bg-primary/10"
                  onClick={() => onFileSelect(file)}
                >
                  <div>
                    <h4 className="font-medium">{file.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {file.type.split(',').map((tag, index) => (
                        <span key={index} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
