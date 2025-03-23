import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProgressSteps from "@/components/layout/progress-steps";
import { apiRequest } from "@/lib/queryClient";
import { Voter, Candidate } from "@shared/schema";
import CandidateCard from "@/components/candidate-card";
import VoteConfirmationModal from "@/components/vote-confirmation-modal";
import { AlertTriangle } from "lucide-react";

const Voting = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Fetch voter details
  const { data: sessionData } = useQuery({
    queryKey: ["/api/me"],
  });

  const { data: voter, isLoading: voterLoading } = useQuery<Voter>({
    queryKey: [`/api/voters/${sessionData?.user?.voterId}`],
    enabled: !!sessionData?.user?.voterId,
  });

  // Fetch candidates
  const { data: candidates, isLoading: candidatesLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  // Cast vote mutation
  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!voter || !selectedCandidate) return;
      
      const response = await apiRequest("POST", "/api/vote", {
        voterId: voter.voterId,
        candidateId: selectedCandidate.id,
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/voters/${voter?.voterId}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/candidates"],
      });
      
      toast({
        title: "Vote Cast Successfully",
        description: "Thank you for participating in the election.",
      });
      
      setLocation("/thank-you");
    },
    onError: (error) => {
      toast({
        title: "Failed to Cast Vote",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleConfirmVote = () => {
    if (!selectedCandidate) {
      toast({
        title: "No Selection",
        description: "Please select a candidate first",
        variant: "destructive",
      });
      return;
    }
    
    setIsConfirmationOpen(true);
  };

  const handleVoteSubmit = () => {
    voteMutation.mutate();
    setIsConfirmationOpen(false);
  };

  const handleBackClick = () => {
    setLocation("/biometric-verification");
  };

  if (voterLoading || candidatesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!voter || !candidates) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center text-red-500 py-8">
              <h3 className="text-lg font-medium">Error Loading Data</h3>
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

  if (voter.hasVoted) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h3 className="text-xl font-medium text-primary">You've Already Voted</h3>
              <p className="mt-2 text-neutral-600">
                Our records show that you have already cast your vote in this election.
              </p>
              <Button className="mt-6" onClick={() => setLocation("/thank-you")}>
                View Confirmation
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
          <h2 className="text-xl font-medium">Cast Your Vote</h2>
          <p className="text-sm text-neutral-100 mt-1">
            Step 3 of 3: Select your candidate
          </p>
        </div>

        <ProgressSteps currentStep={3} totalSteps={3} completedSteps={2} />

        <CardContent className="p-6">
          <div className="mb-6 bg-yellow-50 border border-yellow-300 p-4 rounded flex items-start">
            <AlertTriangle className="text-yellow-500 mr-2 h-5 w-5 mt-0.5" />
            <p className="text-neutral-700">
              Your vote is confidential. Please select your candidate carefully. You can vote only once.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Available Candidates</h3>
            <p className="text-neutral-600 mb-4">
              Select one candidate by clicking on their card
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidate?.id === candidate.id}
                  onSelect={() => handleCandidateSelect(candidate)}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={handleBackClick}>
              Back
            </Button>
            <Button 
              onClick={handleConfirmVote}
              disabled={!selectedCandidate || voteMutation.isPending}
            >
              {voteMutation.isPending ? "Processing..." : "Confirm Vote"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isConfirmationOpen && selectedCandidate && (
        <VoteConfirmationModal
          candidate={selectedCandidate}
          onConfirm={handleVoteSubmit}
          onCancel={() => setIsConfirmationOpen(false)}
          isLoading={voteMutation.isPending}
        />
      )}
    </div>
  );
};

export default Voting;
