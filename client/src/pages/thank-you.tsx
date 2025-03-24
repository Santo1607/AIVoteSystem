import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Vote, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

const ThankYou = () => {
  const [, setLocation] = useLocation();

  const handleFinish = () => {
    setLocation("/");
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-lg">
        <div className="bg-green-600 text-white py-4 px-6">
          <h2 className="text-xl font-medium">Vote Successful</h2>
        </div>
        
        <CardContent className="p-6 text-center">
          <div className="bg-green-50 text-green-600 p-4 inline-block rounded-full mb-4">
            <Vote className="h-16 w-16" />
          </div>
          <h3 className="text-2xl font-medium mb-2">Thank You for Voting!</h3>
          <p className="text-neutral-600 mb-6">
            Your vote has been successfully recorded.
          </p>
          
          <div className="max-w-md mx-auto p-0 rounded mb-6 text-left">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-t flex items-center">
              <ShieldCheck className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-700">Blockchain Security</h4>
                <p className="text-sm text-blue-600">
                  Your vote has been securely recorded on the blockchain
                </p>
              </div>
            </div>
            
            <div className="border border-t-0 border-neutral-200 p-4 rounded-b">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-start">
                  <Lock className="h-4 w-4 text-neutral-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-neutral-600">
                    Your vote is encrypted and tamper-proof
                  </p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-neutral-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-neutral-600">
                    Blockchain technology prevents vote manipulation and ensures integrity
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-neutral-100 p-3 rounded text-sm text-neutral-600">
              A confirmation has been sent to your registered email address.
              This serves as proof of your participation in the election.
            </div>
          </div>
          
          <Button onClick={handleFinish} className="px-6 py-2">
            Finish
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;
