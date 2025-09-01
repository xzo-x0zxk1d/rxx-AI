import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { RobloxAIChat } from '@/components/chat/RobloxAIChat';
import { Loader2, LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Optional authentication - users can use the app without signing in

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show auth options for non-authenticated users

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
              RXX AI
            </h1>
            <p className="text-sm text-muted-foreground">Roblox Development Assistant</p>
          </div>
          {user ? (
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <RobloxAIChat />
      </main>
    </div>
  );
};

export default Index;
