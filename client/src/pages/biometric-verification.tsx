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
import { CheckCircle, AlertCircle, ChevronLeft, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const BiometricVerification = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
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

  // Mock verification for demo purposes
  const useMockVerification = true;

  // Verify the face when captured
  useEffect(() => {
    const verifyFace = async () => {
      if (!faceImage) return;
      
      setIsVerifying(true);
      
      try {
        if (useMockVerification) {
          // Simulate a delay for verification
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setFaceVerified(true);
          toast({
            title: "Face Verification Successful",
            description: "Match confidence: 96.8%",
          });
        } else {
          // Real verification logic when not in mock mode
          if (!voter?.profileImage) {
            throw new Error("Profile image not found");
          }
          
          const result = await compareFaces(faceImage, voter.profileImage);
          if (result.isMatch && result.confidence > 0.8) {
            setFaceVerified(true);
            toast({
              title: "Face Verification Successful",
              description: `Match confidence: ${(result.confidence * 100).toFixed(2)}%`,
            });
          } else {
            throw new Error("Face matching failed");
          }
        }
      } catch (error) {
        console.error("Face verification error:", error);
        setFaceError(true);
        toast({
          title: "Face Verification Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    if (faceImage && !faceVerified && !faceError) {
      verifyFace();
    }
  }, [faceImage, voter?.profileImage, toast, faceVerified, faceError, useMockVerification]);

  // Handle fingerprint scan
  const handleFingerprintScan = async (fingerprintData: string) => {
    setFingerprint(fingerprintData);
    setIsVerifying(true);
    
    try {
      if (useMockVerification) {
        // For demo purposes, always succeed
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setFingerprintVerified(true);
        toast({
          title: "Fingerprint Verification Successful",
          description: "Match confidence: 98.4%",
        });
      } else {
        const result = await verifyFingerprint(fingerprintData);
        if (result.isMatch && result.confidence > 0.8) {
          setFingerprintVerified(true);
          toast({
            title: "Fingerprint Verification Successful",
            description: `Match confidence: ${(result.confidence * 100).toFixed(2)}%`,
          });
        } else {
          throw new Error("Fingerprint matching failed");
        }
      }
    } catch (error) {
      console.error("Fingerprint verification error:", error);
      setFingerprintError(true);
      toast({
        title: "Fingerprint Verification Failed",
        description: "Please try again or contact support.",
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
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (useMockVerification) {
        // Success for demo purposes
        toast({
          title: "Biometric Verification Complete",
          description: "You may now proceed to voting.",
        });
        
        setLocation("/voting");
      } else {
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
      }
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
      <div className="max-w-3xl mx-auto p-4">
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
    <div className="max-w-3xl mx-auto p-4">
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
              Please complete both facial recognition and fingerprint verification to proceed to voting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-medium">Facial Recognition</h3>
                {faceVerified && (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                )}
              </div>
              
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
                      disabled={isVerifying}
                    >
                      Capture Again
                    </Button>
                  </div>
                ) : (
                  <Webcam 
                    onCapture={setFaceImage} 
                    width={isMobile ? 300 : 400}
                    height={isMobile ? 200 : 300}
                  />
                )}
              </div>

              {faceVerified && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Facial verification successful</span>
                  </div>
                </div>
              )}

              {faceError && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Facial verification failed. Please try again.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-medium">Fingerprint Verification</h3>
                {fingerprintVerified && (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-neutral-500 text-sm mb-1">Registered Fingerprint</p>
                <p className="font-medium">Right Thumb</p>
              </div>

              <div className="flex flex-col items-center mt-2">
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
              className="gap-2"
              disabled={isVerifying}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleSubmitVerification}
              disabled={!faceVerified || !fingerprintVerified || isVerifying}
              className="gap-2"
            >
              {isVerifying ? "Verifying..." : "Proceed to Voting"}
              {!isVerifying && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricVerification;
