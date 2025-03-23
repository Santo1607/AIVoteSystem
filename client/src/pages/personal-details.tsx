import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProgressSteps from "@/components/layout/progress-steps";
import { Label } from "@/components/ui/label";
import { Voter } from "@shared/schema";

const PersonalDetails = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Fetch voter details
  const { data: sessionData } = useQuery({
    queryKey: ["/api/me"],
  });

  const { data: voter, isLoading, error } = useQuery<Voter>({
    queryKey: [`/api/voters/${sessionData?.user?.voterId}`],
    enabled: !!sessionData?.user?.voterId,
  });

  const handleProceed = () => {
    if (!isConfirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm your details first",
        variant: "destructive",
      });
      return;
    }

    if (voter?.hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already cast your vote in this election.",
        variant: "destructive",
      });
      return;
    }
    
    setLocation("/biometric-verification");
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
          <h2 className="text-xl font-medium">Personal Details Verification</h2>
          <p className="text-sm text-neutral-100 mt-1">
            Step 1 of 3: Please verify your personal information
          </p>
        </div>

        <ProgressSteps currentStep={1} totalSteps={3} />

        <CardContent className="p-6">
          <div className="mb-6 bg-neutral-100 p-4 rounded">
            <p className="text-neutral-600">
              Please review your personal details below and confirm they are correct.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-neutral-500 text-sm mb-1">Voter ID</p>
              <p className="font-medium">{voter.voterId}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Full Name</p>
              <p className="font-medium">{voter.name}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Date of Birth</p>
              <p className="font-medium">{voter.dob}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Age</p>
              <p className="font-medium">{voter.age}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Email ID</p>
              <p className="font-medium">{voter.email}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Gender</p>
              <p className="font-medium">{voter.gender}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-neutral-500 text-sm mb-1">Address</p>
              <p className="font-medium">{voter.address}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">State</p>
              <p className="font-medium">{voter.state}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">District</p>
              <p className="font-medium">{voter.district}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">PIN Code</p>
              <p className="font-medium">{voter.pincode}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Marital Status</p>
              <p className="font-medium">{voter.maritalStatus}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-sm mb-1">Aadhaar Number</p>
              <p className="font-medium">{voter.aadhaarNumber}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center">
            <Checkbox
              id="confirmDetails"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              className="mr-3"
            />
            <Label
              htmlFor="confirmDetails"
              className="text-sm cursor-pointer"
            >
              I confirm that all the above details are correct
            </Label>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleProceed}
              disabled={!isConfirmed}
              className="px-6 py-3"
            >
              Proceed to Biometric Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetails;
