import React from "react";
import { FileText } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="bg-background border-b border-border px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="font-bold text-xl">Document Extraction</h1>
      </div>
    </header>
  );
};

export default Header;
