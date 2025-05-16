
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onViewAPIClick?: () => void;
  onPricingClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onViewAPIClick, onPricingClick }) => {
  return (
    <header className="bg-background border-b border-border px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="font-bold text-xl">Document Extraction</h1>
      </div>
      <div className="flex space-x-4">
        <Button 
          variant="default" 
          onClick={onViewAPIClick}
        >
          View API
        </Button>
        <Button
          variant="outline"
          onClick={onPricingClick}
        >
          Pricing Options
        </Button>
      </div>
    </header>
  );
};

export default Header;
