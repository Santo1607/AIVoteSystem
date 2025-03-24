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
          
          <div className="max-w-md mx-auto bg-neutral-100 p-4 rounded mb-6 text-left">
            <p className="text-sm text-neutral-600">
              A confirmation has been sent to your registered email address.
              This serves as proof of your participation in the election.
            </p>
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
