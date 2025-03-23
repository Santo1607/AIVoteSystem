import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

// Pages
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PersonalDetails from "@/pages/personal-details";
import BiometricVerification from "@/pages/biometric-verification";
import Voting from "@/pages/voting";
import ThankYou from "@/pages/thank-you";
import AdminDashboard from "@/pages/admin/dashboard";
import Header from "@/components/layout/header";
import { apiRequest } from "./lib/queryClient";

interface User {
  id: number;
  name?: string;
  voterId?: string;
  username?: string;
}

interface SessionData {
  type: "voter" | "admin";
  user: User;
}

function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", undefined);
      setSession(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-neutral-100">
        <Header 
          user={session?.user} 
          userType={session?.type}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-8">
          {!isLoading && (
            <Switch>
              <Route path="/" component={() => {
                if (!session) return <LoginPage onLogin={setSession} />;
                if (session.type === "admin") return <AdminDashboard />;
                return <PersonalDetails />; 
              }} />
              
              {/* Voter Routes - Protected */}
              {session?.type === "voter" && (
                <>
                  <Route path="/personal-details" component={PersonalDetails} />
                  <Route path="/biometric-verification" component={BiometricVerification} />
                  <Route path="/voting" component={Voting} />
                  <Route path="/thank-you" component={ThankYou} />
                </>
              )}
              
              {/* Admin Routes - Protected */}
              {session?.type === "admin" && (
                <>
                  <Route path="/admin" component={AdminDashboard} />
                  <Route path="/admin/:tab" component={AdminDashboard} />
                </>
              )}
              
              {/* Fallback */}
              <Route component={NotFound} />
            </Switch>
          )}
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
