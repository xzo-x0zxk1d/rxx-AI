import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SavedChats } from "./SavedChats";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Bot, Code, Save, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateChatTitle = (message: string): string => {
    // Generate a title from the first message (first 50 characters)
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  const saveChat = async (chatMessages: Message[], title?: string) => {
    if (!user || chatMessages.length <= 1) return null; // Don't save if only welcome message

    setIsSaving(true);
    try {
      const realMessages = chatMessages.filter(msg => msg.id !== "welcome");
      if (realMessages.length === 0) return;

      const chatTitle = title || generateChatTitle(realMessages[0].content);
      const messagesToSave = realMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp.toISOString()
      }));

      if (currentChatId) {
        // Update existing chat
        const { error } = await supabase
          .from('chats')
          .update({ 
            messages: messagesToSave,
            title: chatTitle,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChatId);

        if (error) throw error;
      } else {
        // Create new chat
        const { data, error } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            title: chatTitle,
            messages: messagesToSave
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentChatId(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      toast({
        title: "Error",
        description: "Failed to save chat",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Auto-save after AI response
      if (finalMessages.filter(msg => msg.id !== "welcome").length >= 2) { 
        await saveChat(finalMessages);
      }

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

  const loadChat = (chat: Chat) => {
    const loadedMessages: Message[] = [
      {
        id: "welcome",
        content: "Hello! I'm RXX AI, your Roblox development assistant. I can help you with:\n\n• Luau scripting (Server Scripts, Local Scripts, Module Scripts)\n• Roblox Studio and game development\n• Roblox services and APIs\n• Remote Events and Functions\n• GUI/UI development\n• Game mechanics and optimization\n• DataStore services\n\nWhat would you like to work on today?",
        isUser: false,
        timestamp: new Date()
      },
      ...(chat.messages as any[]).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp),
      }))
    ];
    
    setMessages(loadedMessages);
    setCurrentChatId(chat.id);
  };

  const startNewChat = () => {
    setMessages([{
      id: "welcome",
      content: "Hello! I'm RXX AI, your Roblox development assistant. I can help you with:\n\n• Luau scripting (Server Scripts, Local Scripts, Module Scripts)\n• Roblox Studio and game development\n• Roblox services and APIs\n• Remote Events and Functions\n• GUI/UI development\n• Game mechanics and optimization\n• DataStore services\n\nWhat would you like to work on today?",
      isUser: false,
      timestamp: new Date()
    }]);
    setCurrentChatId(null);
  };

  const handleManualSave = async () => {
    if (messages.filter(msg => msg.id !== "welcome").length > 0) {
      await saveChat(messages);
      toast({
        title: "Success",
        description: "Chat saved successfully!",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      <div className="lg:col-span-1">
        <SavedChats 
          onSelectChat={loadChat}
          onNewChat={startNewChat}
          currentChatId={currentChatId || undefined}
        />
      </div>
      
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Bot className="h-5 w-5 text-primary" />
                <Code className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">RXX AI Assistant</CardTitle>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {messages.filter(msg => msg.id !== "welcome").length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              )}
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
      </div>
    </div>
  );
};