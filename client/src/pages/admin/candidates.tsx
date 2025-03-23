import { useState } from "react";
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Edit, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Candidate } from "@shared/schema";
import CandidateForm from "@/components/admin/candidate-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CandidatesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);

  // Fetch candidates
  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  // Add candidate mutation
  const addMutation = useMutation({
    mutationFn: async (data: Omit<Candidate, "id" | "votes">) => {
      const response = await apiRequest("POST", "/api/candidates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/candidates"],
      });
      setIsFormOpen(false);
      
      toast({
        title: "Candidate Added",
        description: "The candidate has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Candidate",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Update candidate mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Candidate) => {
      const { id, ...candidateData } = data;
      const response = await apiRequest("PUT", `/api/candidates/${id}`, candidateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/candidates"],
      });
      setIsFormOpen(false);
      setEditingCandidate(null);
      
      toast({
        title: "Candidate Updated",
        description: "The candidate has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Candidate",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete candidate mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/candidates/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/candidates"],
      });
      setDeletingCandidate(null);
      
      toast({
        title: "Candidate Deleted",
        description: "The candidate has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Candidate",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddClick = () => {
    setEditingCandidate(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (candidate: Candidate) => {
    setDeletingCandidate(candidate);
  };

  const handleFormSubmit = (data: Candidate) => {
    if (editingCandidate) {
      updateMutation.mutate({ ...data, id: editingCandidate.id });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCandidate(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingCandidate) {
      deleteMutation.mutate(deletingCandidate.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Candidates</h3>
        <Button 
          onClick={handleAddClick} 
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Candidate
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="w-16">S.No</TableHead>
                <TableHead className="w-20">Party Logo</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Constituency</TableHead>
                <TableHead className="w-24">Votes</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                candidates?.map((candidate, index) => (
                  <TableRow key={candidate.id} className="hover:bg-neutral-50">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
                        <img
                          src={candidate.partyLogo}
                          alt={`${candidate.partyName} logo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{candidate.partyName}</TableCell>
                    <TableCell>{candidate.name}</TableCell>
                    <TableCell>{candidate.constituency}</TableCell>
                    <TableCell>{candidate.votes}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(candidate)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(candidate)}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {isFormOpen && (
        <CandidateForm
          candidate={editingCandidate}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={addMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog
        open={!!deletingCandidate}
        onOpenChange={(open) => !open && setDeletingCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCandidate?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CandidatesTab;
