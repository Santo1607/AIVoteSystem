import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

interface LoginPageProps {
  onLogin: (sessionData: any) => void;
}

// Define a combined schema for a unified login form
const unifiedLoginSchema = z.object({
  identifier: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
});

type UnifiedLoginData = z.infer<typeof unifiedLoginSchema>;

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);

  // Unified login form
  const form = useForm<UnifiedLoginData>({
    resolver: zodResolver(unifiedLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Handle unified login
  const handleLogin = async (data: UnifiedLoginData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // First try admin login
      try {
        const adminResponse = await apiRequest("POST", "/api/auth/admin/login", {
          username: data.identifier, 
          password: data.password
        });
        
        const adminResult = await adminResponse.json();
        
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the Admin Dashboard",
        });
        
        onLogin({
          type: "admin",
          user: adminResult.admin,
        });
        
        setLocation("/admin");
        return; // Exit if admin login was successful
      } catch (adminError) {
        // If admin login fails, try voter login
        try {
          const voterResponse = await apiRequest("POST", "/api/auth/voter/login", {
            voterId: data.identifier,
            password: data.password
          });
          
          const voterResult = await voterResponse.json();
          
          toast({
            title: "Login Successful",
            description: "Welcome to the AI Voting System",
          });
          
          onLogin({
            type: "voter",
            user: voterResult.voter,
          });
          
          setLocation("/personal-details");
        } catch (voterError) {
          // Both login attempts failed
          throw new Error("Invalid login credentials");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "Invalid credentials");
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
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary text-white py-4">
          <h2 className="text-xl font-medium text-center">AI Voting System</h2>
          <p className="text-xs text-center mt-1 text-white/80">Please login with your credentials</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md flex items-start text-sm mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}
            
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Voter ID or Admin Username" 
                        {...field}
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Password or Date of Birth (DD/MM/YYYY)" 
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              
              <p className="text-sm text-neutral-500 text-center pt-2">
                Admin: Use admin/admin123<br />
                Voter: Use ABCD1234567/15/08/1985
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
