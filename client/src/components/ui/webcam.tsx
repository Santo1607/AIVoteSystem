import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RefreshCw } from "lucide-react";

interface WebcamProps {
  onCapture: (imageSrc: string) => void;
  width?: number;
  height?: number;
}

const Webcam = ({ onCapture, width = 640, height = 480 }: WebcamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For demo purposes, we'll use a mock webcam functionality
  const useMockCamera = true;
  const mockUserImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U2ZTZlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSI0MCIgZmlsbD0iIzk5OSIvPjxwYXRoIGQ9Ik01MCwxODAgTDUwLDE0MCBDNTAsMTAwIDc1LDkwIDEwMCw5MCBDMTMwLDkwIDE1MCwxMDAgMTUwLDE0MCBMMTUwLDE4MCI+PC9wYXRoPjwvc3ZnPg==";

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (useMockCamera) {
      // Simulate camera starting
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return;
    }
    
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = userMedia;
      }
      
      setStream(userMedia);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please check your permissions and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [useMockCamera]);

  const stopCamera = useCallback(() => {
    if (useMockCamera) return;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, useMockCamera]);

  const captureImage = useCallback(() => {
    if (useMockCamera) {
      // Use the mock user image
      onCapture(mockUserImage);
      return;
    }
    
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageDataURL = canvas.toDataURL("image/jpeg");
      onCapture(imageDataURL);
    }
  }, [onCapture, useMockCamera, mockUserImage]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full mb-4 overflow-hidden rounded-md bg-neutral-100 flex justify-center items-center" 
           style={{ height: height, maxWidth: width }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 p-4">
            <div className="text-center text-red-500">{error}</div>
          </div>
        )}
        
        {useMockCamera ? (
          <div className="flex items-center justify-center h-full w-full">
            {!isLoading && (
              <div className="text-center">
                <Camera size={64} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Camera preview not available in demo mode</p>
                <p className="text-xs text-gray-400">Click "Capture Image" to get a sample image</p>
              </div>
            )}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-auto ${(isLoading || error) ? 'invisible' : 'visible'}`}
            style={{ maxWidth: width, maxHeight: height }}
            onLoadedMetadata={() => setIsLoading(false)}
          />
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={captureImage} 
          className="gap-2"
          disabled={isLoading || !!error}
        >
          <Camera size={18} />
          Capture Image
        </Button>
        
        {error && (
          <Button 
            variant="outline" 
            onClick={startCamera}
            className="gap-2"
          >
            <RefreshCw size={18} />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default Webcam;
