import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { scanFingerprint } from "@/lib/faceAPI";

interface FingerprintScannerProps {
  onScan: (fingerprintData: string) => void;
  isVerified?: boolean;
  isError?: boolean;
  autoScan?: boolean;
}

const FingerprintScanner = ({ 
  onScan, 
  isVerified = false, 
  isError = false,
  autoScan = false 
}: FingerprintScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isScanComplete, setIsScanComplete] = useState(isVerified);
  
  // Always simulate a successful fingerprint scan for demo purposes
  const simulatedFingerprintData = `fingerprint-data-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  // Auto-scan on mount if requested
  useEffect(() => {
    if (autoScan && !isVerified && !isScanComplete) {
      handleScan();
    }
  }, [autoScan, isVerified, isScanComplete]);

  const handleScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulate a scanner delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use our simulated fingerprint data
      onScan(simulatedFingerprintData);
      setIsScanComplete(true);
    } catch (error) {
      console.error("Fingerprint scan error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          fingerprint-scanner cursor-pointer h-48 w-48 rounded-md flex items-center justify-center mb-4 
          bg-gradient-to-b from-white to-neutral-100 shadow-md
          ${isScanning ? 'animate-pulse border-2 border-blue-500' : ''}
          ${isVerified || isScanComplete ? 'border-2 border-green-500' : ''}
          ${isError ? 'border-2 border-red-500' : 'border border-gray-300 hover:border-primary'}
        `}
        onClick={() => !isScanning && !isVerified && !isScanComplete && handleScan()}
      >
        {isScanning ? (
          <Loader2 className="h-20 w-20 text-primary animate-spin" />
        ) : isVerified || isScanComplete ? (
          <CheckCircle className="h-20 w-20 text-green-500" />
        ) : isError ? (
          <XCircle className="h-20 w-20 text-red-500" />
        ) : (
          <Fingerprint className="h-20 w-20 text-primary" />
        )}
      </div>
      
      <p className="text-sm text-neutral-600 mb-3 text-center">
        {isScanning
          ? "Scanning fingerprint..."
          : isVerified || isScanComplete
          ? "Fingerprint verified"
          : isError
          ? "Fingerprint verification failed"
          : "Click to scan fingerprint or use the button below"}
      </p>
      
      <Button
        onClick={handleScan}
        disabled={isScanning || isVerified || isScanComplete}
        className="gap-2"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Fingerprint className="h-4 w-4" />
            Scan Fingerprint
          </>
        )}
      </Button>
      
      {(isVerified || isScanComplete) && (
        <Button 
          variant="outline" 
          onClick={() => setIsScanComplete(false)} 
          className="mt-2"
        >
          Reset
        </Button>
      )}
    </div>
  );
};

export default FingerprintScanner;
