import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Candidate, insertCandidateSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Create a zod schema for form validation
const formSchema = insertCandidateSchema.extend({
  // If needed, add additional validation here
});

type FormData = z.infer<typeof formSchema>;

interface CandidateFormProps {
  candidate: Candidate | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CandidateForm = ({
  candidate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CandidateFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: candidate?.name || "",
      partyName: candidate?.partyName || "",
      partyLogo: candidate?.partyLogo || "",
      constituency: candidate?.constituency || "",
    },
  });

  const handleSubmit = (data: FormData) => {
    if (candidate) {
      onSubmit({
        ...data,
        id: candidate.id,
        votes: candidate.votes,
      });
    } else {
      onSubmit(data);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {candidate ? "Edit Candidate" : "Add New Candidate"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter candidate name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter party name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partyLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter party logo URL" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="constituency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constituency</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter constituency" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : candidate
                  ? "Save Changes"
                  : "Add Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateForm;
