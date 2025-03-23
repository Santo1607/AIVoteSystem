import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { scanFingerprint } from "@/lib/faceAPI";

interface FingerprintScannerProps {
  onScan: (fingerprintData: string) => void;
  isVerified?: boolean;
  isError?: boolean;
}

const FingerprintScanner = ({ 
  onScan, 
  isVerified = false, 
  isError = false 
}: FingerprintScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const fingerprintData = await scanFingerprint();
      onScan(fingerprintData);
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
          fingerprint-scanner h-48 w-48 rounded-md flex items-center justify-center mb-4 
          bg-gradient-to-b from-white to-neutral-100 shadow-md
          ${isScanning ? 'animate-pulse' : ''}
          ${isVerified ? 'border-2 border-green-500' : ''}
          ${isError ? 'border-2 border-red-500' : ''}
        `}
      >
        {isScanning ? (
          <Loader2 className="h-20 w-20 text-primary animate-spin" />
        ) : isVerified ? (
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
          : isVerified
          ? "Fingerprint verified"
          : isError
          ? "Fingerprint verification failed"
          : "Place your right thumb on the scanner"}
      </p>
      
      <Button
        onClick={handleScan}
        disabled={isScanning || isVerified}
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
    </div>
  );
};

export default FingerprintScanner;
