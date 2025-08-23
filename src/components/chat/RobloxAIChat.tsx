import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Code } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const RobloxAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm RXX AI, your Roblox development assistant. I can help you with:\n\n• Luau scripting (Server Scripts, Local Scripts, Module Scripts)\n• Roblox Studio and game development\n• Roblox services and APIs\n• Remote Events and Functions\n• GUI/UI development\n• Game mechanics and optimization\n• DataStore services\n\nWhat would you like to work on today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.id !== "welcome") // Exclude welcome message from context
        .map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('roblox-ai-chat', {
        body: {
          message: content,
          messages: conversationHistory
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Bot className="h-5 w-5 text-primary" />
            <Code className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">RXX AI - Roblox Development Assistant</CardTitle>
        </div>
        <div className="ml-auto">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
              Thinking...
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
          </div>
        </ScrollArea>
        
        <ChatInput 
          onSendMessage={sendMessage} 
          isLoading={isLoading}
          placeholder="Ask me about Roblox scripting, Studio, services, or any development question..."
        />
      </CardContent>
    </Card>
  );
};