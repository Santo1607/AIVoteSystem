import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginVoter, LoginAdmin, loginVoterSchema, loginAdminSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

interface LoginPageProps {
  onLogin: (sessionData: any) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"voter" | "admin">("voter");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Voter form
  const voterForm = useForm<LoginVoter>({
    resolver: zodResolver(loginVoterSchema),
    defaultValues: {
      voterId: "",
      password: "",
    },
  });

  // Admin form
  const adminForm = useForm<LoginAdmin>({
    resolver: zodResolver(loginAdminSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle voter login
  const handleVoterLogin = async (data: LoginVoter) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/voter/login", data);
      const result = await response.json();
      
      toast({
        title: "Login Successful",
        description: "Welcome to the AI Voting System",
      });
      
      onLogin({
        type: "voter",
        user: result.voter,
      });
      
      setLocation("/personal-details");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin login
  const handleAdminLogin = async (data: LoginAdmin) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/admin/login", data);
      const result = await response.json();
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the Admin Dashboard",
      });
      
      onLogin({
        type: "admin",
        user: result.admin,
      });
      
      setLocation("/admin");
    } catch (error) {
      console.error("Admin login error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary text-white py-4">
          <h2 className="text-xl font-medium">Login</h2>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs 
            defaultValue="voter" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "voter" | "admin")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="voter">Voter Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="voter">
              <Form {...voterForm}>
                <form onSubmit={voterForm.handleSubmit(handleVoterLogin)} className="space-y-4">
                  <FormField
                    control={voterForm.control}
                    name="voterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voter ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your Voter ID" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={voterForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password / Date of Birth (DD/MM/YYYY)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your Password or DOB" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="admin">
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(handleAdminLogin)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter admin username" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter admin password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Admin Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
