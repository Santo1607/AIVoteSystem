import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Voter, insertVoterSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Webcam from "@/components/ui/webcam";
import FingerprintScanner from "@/components/ui/fingerprint-scanner";
import { Camera, Fingerprint, Save, ArrowLeft } from "lucide-react";
import { scanFingerprint } from "@/lib/faceAPI";
import { useIsMobile } from "@/hooks/use-mobile";

// Create a zod schema for form validation
const formSchema = insertVoterSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

interface VoterFormProps {
  voter: Voter | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const VoterForm = ({
  voter,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VoterFormProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("personal");
  const [profileImage, setProfileImage] = useState<string | null>(voter?.profileImage || null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);
  const [tabCompletionStatus, setTabCompletionStatus] = useState({
    personal: false,
    biometric: false,
    security: false
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voterId: voter?.voterId || "",
      aadhaarNumber: voter?.aadhaarNumber || "",
      name: voter?.name || "",
      password: voter?.password || "",
      confirmPassword: voter?.password || "",
      dob: voter?.dob || "",
      age: voter?.age || undefined,
      email: voter?.email || "",
      gender: voter?.gender || "",
      address: voter?.address || "",
      state: voter?.state || "",
      district: voter?.district || "",
      pincode: voter?.pincode || "",
      maritalStatus: voter?.maritalStatus || "",
      profileImage: voter?.profileImage || "",
    },
  });

  // Update form field for profile image when captured from webcam
  const handleImageCapture = (imageSrc: string) => {
    setProfileImage(imageSrc);
    form.setValue("profileImage", imageSrc);
  };

  // Handle fingerprint scan
  const handleFingerprintScan = async (fingerprintData: string) => {
    setFingerprintData(fingerprintData);
  };

  // Validate tab completion
  const validateTabCompletion = (tabName: string) => {
    if (tabName === "personal") {
      const requiredFields = ["voterId", "aadhaarNumber", "name", "dob", "age", "gender", "address", "district"];
      const isComplete = requiredFields.every(field => {
        const value = form.getValues(field as any);
        return value !== undefined && value !== "";
      });
      setTabCompletionStatus(prev => ({ ...prev, personal: isComplete }));
      return isComplete;
    }
    
    if (tabName === "biometric") {
      const hasBiometrics = !!profileImage && !!fingerprintData;
      setTabCompletionStatus(prev => ({ ...prev, biometric: hasBiometrics }));
      return hasBiometrics;
    }
    
    if (tabName === "security") {
      const securityFields = ["password", "confirmPassword"];
      const isComplete = securityFields.every(field => {
        const value = form.getValues(field as any);
        return value !== undefined && value !== "";
      });
      setTabCompletionStatus(prev => ({ ...prev, security: isComplete }));
      return isComplete;
    }
    
    return false;
  };

  // Handle tab change
  const handleTabChange = (tabName: string) => {
    // Validate current tab before changing
    validateTabCompletion(activeTab);
    setActiveTab(tabName);
  };

  const handleSubmit = (data: FormData) => {
    // Make sure biometric data is included
    if (!profileImage) {
      form.setError("profileImage", { 
        type: "manual", 
        message: "Profile image is required" 
      });
      setActiveTab("biometric");
      return;
    }

    // Ensure password fields match
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match"
      });
      setActiveTab("security");
      return;
    }

    // Remove the confirmPassword field before submission
    const { confirmPassword, ...submissionData } = data;
    
    if (voter) {
      onSubmit({
        ...submissionData,
        id: voter.id,
        hasVoted: voter.hasVoted,
        votedFor: voter.votedFor,
        profileImage: profileImage || submissionData.profileImage
      });
    } else {
      onSubmit({
        ...submissionData,
        profileImage: profileImage || submissionData.profileImage
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={`${isMobile ? 'w-full max-w-full h-full max-h-full p-4 rounded-none' : 'sm:max-w-[700px] max-h-[90vh]'} overflow-y-auto`}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">
            {voter ? "Edit Voter" : "Add New Voter"}
          </DialogTitle>
          <DialogDescription>
            Complete all sections to register a voter
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="personal" className="relative">
              Personal Details
              {tabCompletionStatus.personal && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-green-500">
                  <span className="sr-only">Completed</span>
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="biometric" className="relative">
              Biometrics
              {tabCompletionStatus.biometric && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-green-500">
                  <span className="sr-only">Completed</span>
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="relative">
              Security
              {tabCompletionStatus.security && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-green-500">
                  <span className="sr-only">Completed</span>
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <TabsContent value="personal" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="voterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voter ID <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter voter ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Aadhaar number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth (DD/MM/YYYY) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DD/MM/YYYY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            placeholder="Enter age"
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter PIN code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (validateTabCompletion("personal")) {
                        setActiveTab("biometric");
                      }
                    }}
                  >
                    Next: Biometrics
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="biometric" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="flex items-center mb-3 w-full">
                        <Camera className="h-5 w-5 text-primary mr-2" />
                        <h3 className="text-lg font-medium">Profile Photo</h3>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="w-full">
                        <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-blue-50 mt-4">
                          {profileImage ? (
                            <div className="flex flex-col items-center">
                              <img 
                                src={profileImage} 
                                alt="Profile" 
                                className="h-48 w-full object-cover mb-4 rounded-md"
                              />
                              <Button 
                                variant="outline" 
                                onClick={() => setProfileImage(null)}
                              >
                                Capture Again
                              </Button>
                            </div>
                          ) : (
                            <Webcam 
                              onCapture={handleImageCapture} 
                              width={isMobile ? 300 : 400}
                              height={isMobile ? 200 : 300}
                            />
                          )}
                        </div>
                        {form.formState.errors.profileImage && (
                          <p className="text-sm text-red-500 mt-2">{form.formState.errors.profileImage.message}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="flex items-center mb-3 w-full">
                        <Fingerprint className="h-5 w-5 text-primary mr-2" />
                        <h3 className="text-lg font-medium">Fingerprint</h3>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="w-full flex flex-col items-center mt-4">
                        <p className="text-sm text-neutral-600 mb-4">Scan the voter's right thumb fingerprint</p>
                        <FingerprintScanner 
                          onScan={handleFingerprintScan} 
                          isVerified={!!fingerprintData}
                        />
                        {!fingerprintData && (
                          <p className="text-xs text-neutral-500 mt-4">
                            Press the fingerprint icon to simulate a scan
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} type="hidden" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("personal")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (!profileImage) {
                        form.setError("profileImage", { 
                          type: "manual", 
                          message: "Profile image is required" 
                        });
                        return;
                      }
                      
                      if (!fingerprintData) {
                        return;
                      }
                      
                      validateTabCompletion("biometric");
                      setActiveTab("security");
                    }}
                    disabled={!profileImage || !fingerprintData}
                  >
                    Next: Security
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 mt-0">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium mb-4">Security Credentials</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Enter password or DOB (DD/MM/YYYY)" 
                              />
                            </FormControl>
                            <FormDescription>
                              Can be the same as date of birth for easier authentication
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Confirm password" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("biometric")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting
                      ? "Saving..."
                      : voter
                      ? "Save Changes"
                      : "Register Voter"}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VoterForm;
