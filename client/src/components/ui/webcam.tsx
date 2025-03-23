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

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
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
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const captureImage = useCallback(() => {
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
  }, [onCapture]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md mb-4 overflow-hidden rounded-md bg-neutral-100">
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
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-auto ${(isLoading || error) ? 'invisible' : 'visible'}`}
          style={{ maxWidth: width, maxHeight: height }}
          onLoadedMetadata={() => setIsLoading(false)}
        />
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
