
import { useState } from 'react';
import { Button } from "@/components/ui/button";

interface QRScannerMockProps {
  onScan?: (result: string) => void;
  className?: string;
}

const QRScannerMock = ({ onScan, className }: QRScannerMockProps) => {
  const [scanning, setScanning] = useState(false);
  
  const mockScan = () => {
    setScanning(true);
    
    // Simulate a scan after 2 seconds
    setTimeout(() => {
      setScanning(false);
      const mockBikeId = `B00${Math.floor(Math.random() * 10) + 1}`;
      if (onScan) {
        onScan(mockBikeId);
      }
    }, 2000);
  };
  
  return (
    <div className={`qr-scanner-container ${className || ''}`}>
      <div className="scanner-grid" />
      {scanning && <div className="scanner-line" />}
      
      <div className="absolute inset-0 flex items-center justify-center flex-col space-y-4">
        {scanning ? (
          <p className="text-greenprimary font-medium animate-pulse">Scanning...</p>
        ) : (
          <>
            <p className="text-graydark font-medium text-center px-4">
              Scan a bike QR code to check-in/out
            </p>
            <Button 
              variant="default" 
              className="bg-greenprimary hover:bg-greenprimary/80 text-white"
              onClick={mockScan}
            >
              Simulate Scan
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRScannerMock;
