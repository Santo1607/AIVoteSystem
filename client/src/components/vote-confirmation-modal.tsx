import { Candidate } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoteConfirmationModalProps {
  candidate: Candidate;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VoteConfirmationModal = ({
  candidate,
  onConfirm,
  onCancel,
  isLoading = false,
}: VoteConfirmationModalProps) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Confirm Your Vote</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-6">You are about to cast your vote for:</p>
          
          <div className="flex items-center p-4 border rounded-lg mb-6">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center mr-3">
              <img
                src={candidate.partyLogo}
                alt={`${candidate.partyName} logo`}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-medium">{candidate.name}</h4>
              <p className="text-sm text-neutral-600">{candidate.partyName}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded mb-6 text-neutral-700 text-sm">
            <p>Your vote is final and cannot be changed after confirmation.</p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Cast Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoteConfirmationModal;
