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
import { Plus, Edit, Trash, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Voter } from "@shared/schema";
import VoterForm from "@/components/admin/voter-form";
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
import { Badge } from "@/components/ui/badge";

const VotersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [deletingVoter, setDeletingVoter] = useState<Voter | null>(null);

  // Fetch voters
  const { data: voters, isLoading } = useQuery<Voter[]>({
    queryKey: ["/api/voters"],
  });

  // Add voter mutation
  const addMutation = useMutation({
    mutationFn: async (data: Omit<Voter, "id" | "hasVoted" | "votedFor">) => {
      const response = await apiRequest("POST", "/api/voters", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/voters"],
      });
      setIsFormOpen(false);
      
      toast({
        title: "Voter Added",
        description: "The voter has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Voter",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Update voter mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Voter) => {
      const { id, ...voterData } = data;
      const response = await apiRequest("PUT", `/api/voters/${id}`, voterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/voters"],
      });
      setIsFormOpen(false);
      setEditingVoter(null);
      
      toast({
        title: "Voter Updated",
        description: "The voter has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Voter",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete voter mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/voters/${id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/voters"],
      });
      setDeletingVoter(null);
      
      toast({
        title: "Voter Deleted",
        description: "The voter has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Voter",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddClick = () => {
    setEditingVoter(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (voter: Voter) => {
    setEditingVoter(voter);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (voter: Voter) => {
    setDeletingVoter(voter);
  };

  const handleFormSubmit = (data: Voter) => {
    if (editingVoter) {
      updateMutation.mutate({ ...data, id: editingVoter.id });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingVoter(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingVoter) {
      deleteMutation.mutate(deletingVoter.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Voters</h3>
        <Button 
          onClick={handleAddClick} 
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Voter
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
                <TableHead>Voter ID</TableHead>
                <TableHead>Aadhaar Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Voted</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                    No voters found
                  </TableCell>
                </TableRow>
              ) : (
                voters?.map((voter) => (
                  <TableRow key={voter.id} className="hover:bg-neutral-50">
                    <TableCell>{voter.voterId}</TableCell>
                    <TableCell>{voter.aadhaarNumber}</TableCell>
                    <TableCell>{voter.name}</TableCell>
                    <TableCell>{voter.age}</TableCell>
                    <TableCell>{voter.district}</TableCell>
                    <TableCell>
                      {voter.hasVoted ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-neutral-50 text-neutral-600 border-neutral-200">
                          <X className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(voter)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(voter)}
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
        <VoterForm
          voter={editingVoter}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={addMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog
        open={!!deletingVoter}
        onOpenChange={(open) => !open && setDeletingVoter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingVoter?.name}? This action cannot be undone.
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

export default VotersTab;
