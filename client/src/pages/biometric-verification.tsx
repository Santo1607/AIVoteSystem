import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProgressSteps from "@/components/layout/progress-steps";
import Webcam from "@/components/ui/webcam";
import FingerprintScanner from "@/components/ui/fingerprint-scanner";
import { compareFaces, verifyFingerprint } from "@/lib/faceAPI";
import { apiRequest } from "@/lib/queryClient";
import { Voter } from "@shared/schema";

const BiometricVerification = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceError, setFaceError] = useState(false);
  
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [fingerprintError, setFingerprintError] = useState(false);
  
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch voter details
  const { data: sessionData } = useQuery({
    queryKey: ["/api/me"],
  });

  const { data: voter, isLoading, error } = useQuery<Voter>({
    queryKey: [`/api/voters/${sessionData?.user?.voterId}`],
    enabled: !!sessionData?.user?.voterId,
  });

  // Verify the face when captured
  useEffect(() => {
    const verifyFace = async () => {
      if (!faceImage || !voter?.profileImage) return;
      
      setIsVerifying(true);
      try {
        const result = await compareFaces(faceImage, voter.profileImage);
        if (result.isMatch && result.confidence > 0.8) {
          setFaceVerified(true);
          toast({
            title: "Face Verification Successful",
            description: `Match confidence: ${(result.confidence * 100).toFixed(2)}%`,
          });
        } else {
          setFaceError(true);
          toast({
            title: "Face Verification Failed",
            description: "Please try again or contact support.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Face verification error:", error);
        setFaceError(true);
        toast({
          title: "Face Verification Error",
          description: "An error occurred during verification.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyFace();
  }, [faceImage, voter?.profileImage, toast]);

  // Handle fingerprint scan
  const handleFingerprintScan = async (fingerprintData: string) => {
    setFingerprint(fingerprintData);
    setIsVerifying(true);
    
    try {
      const result = await verifyFingerprint(fingerprintData);
      if (result.isMatch && result.confidence > 0.8) {
        setFingerprintVerified(true);
        toast({
          title: "Fingerprint Verification Successful",
          description: `Match confidence: ${(result.confidence * 100).toFixed(2)}%`,
        });
      } else {
        setFingerprintError(true);
        toast({
          title: "Fingerprint Verification Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fingerprint verification error:", error);
      setFingerprintError(true);
      toast({
        title: "Fingerprint Verification Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit biometric verification to server
  const handleSubmitVerification = async () => {
    if (!voter || !faceImage || !fingerprint) return;
    
    setIsVerifying(true);
    
    try {
      await apiRequest("POST", "/api/verify-biometrics", {
        voterId: voter.voterId,
        faceImage,
        fingerprint,
      });
      
      toast({
        title: "Biometric Verification Complete",
        description: "You may now proceed to voting.",
      });
      
      setLocation("/voting");
    } catch (error) {
      console.error("Biometric verification submission error:", error);
      toast({
        title: "Verification Submission Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackClick = () => {
    setLocation("/personal-details");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !voter) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center text-red-500 py-8">
              <h3 className="text-lg font-medium">Error Loading Voter Details</h3>
              <p className="mt-2">Please try logging in again.</p>
              <Button className="mt-4" onClick={() => setLocation("/")}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <div className="bg-primary text-white py-4 px-6">
          <h2 className="text-xl font-medium">Biometric Verification</h2>
          <p className="text-sm text-neutral-100 mt-1">
            Step 2 of 3: Please complete biometric verification
          </p>
        </div>

        <ProgressSteps currentStep={2} totalSteps={3} completedSteps={1} />

        <CardContent className="p-6">
          <div className="mb-6 bg-neutral-100 p-4 rounded">
            <p className="text-neutral-600">
              Please complete both facial recognition and fingerprint verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Facial Recognition</h3>
              <div className="mb-4">
                <p className="text-neutral-500 text-sm mb-1">Aadhaar Number</p>
                <p className="font-medium">{voter.aadhaarNumber}</p>
              </div>

              <div className="p-4 rounded-lg mb-4 border-2 border-dashed border-primary bg-blue-50">
                {faceImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={faceImage} 
                      alt="Captured face" 
                      className="h-48 w-full object-cover mb-4 rounded-md"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFaceImage(null);
                        setFaceVerified(false);
                        setFaceError(false);
                      }}
                    >
                      Capture Again
                    </Button>
                  </div>
                ) : (
                  <Webcam onCapture={setFaceImage} />
                )}
              </div>

              {faceVerified && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center text-green-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Facial verification successful</span>
                  </div>
                </div>
              )}

              {faceError && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-center text-red-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Facial verification failed. Please try again.</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Fingerprint Verification</h3>
              <div className="mb-4">
                <p className="text-neutral-500 text-sm mb-1">Registered Fingerprint</p>
                <p className="font-medium">Right Thumb</p>
              </div>

              <div className="flex flex-col items-center">
                <FingerprintScanner 
                  onScan={handleFingerprintScan}
                  isVerified={fingerprintVerified}
                  isError={fingerprintError}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBackClick}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={!faceVerified || !fingerprintVerified || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Proceed to Voting"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricVerification;
