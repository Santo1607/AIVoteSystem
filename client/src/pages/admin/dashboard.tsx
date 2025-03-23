import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useRoute } from "wouter";
import CandidatesTab from "./candidates";
import VotersTab from "./voters";
import ResultsTab from "./results";

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:tab");
  const activeTab = params?.tab || "candidates";

  const handleTabChange = (tab: string) => {
    setLocation(`/admin/${tab}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="shadow-lg">
        <div className="bg-primary text-white py-4 px-6">
          <h2 className="text-xl font-medium">Admin Dashboard</h2>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-white px-6 border-b rounded-none">
            <TabsTrigger 
              value="candidates" 
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Candidates
            </TabsTrigger>
            <TabsTrigger 
              value="voters" 
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Voters
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="candidates" className="mt-0">
            <CandidatesTab />
          </TabsContent>
          
          <TabsContent value="voters" className="mt-0">
            <VotersTab />
          </TabsContent>
          
          <TabsContent value="results" className="mt-0">
            <ResultsTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminDashboard;
