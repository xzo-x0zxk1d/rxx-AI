import { RobloxAIChat } from "@/components/chat/RobloxAIChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">RXX AI</h1>
          <p className="text-xl text-muted-foreground">Your Expert Roblox Development Assistant</p>
        </div>
        <RobloxAIChat />
      </div>
    </div>
  );
};

export default Index;
