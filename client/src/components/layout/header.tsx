import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface User {
  id: number;
  name?: string;
  voterId?: string;
  username?: string;
}

interface HeaderProps {
  user?: User;
  userType?: "voter" | "admin";
  onLogout: () => void;
}

const Header = ({ user, userType, onLogout }: HeaderProps) => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-medium">AI Voting System</h1>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {userType === "admin" 
                ? `Admin: ${user.username}` 
                : user.name}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="text-white border-white hover:bg-primary/90 hover:text-white flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div>
            <Button 
              variant="outline" 
              size="sm"
              className="text-white border-white hover:bg-primary/90 hover:text-white"
              disabled
            >
              Login
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
