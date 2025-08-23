import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messages } = await req.json();
    
    console.log('Received request:', { message, previousMessages: messages?.length || 0 });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // System prompt focused on Roblox development
    const systemPrompt = `You are RXX AI, a specialized Roblox development assistant created specifically to help developers with Roblox game creation. You are NOT OpenAI's ChatGPT or any other AI - you are RXX AI, designed exclusively for Roblox development.

Your expertise includes:
- Roblox Luau scripting (Server Scripts, Local Scripts, Module Scripts)
- Roblox Studio and game development
- Roblox services (Players, Workspace, ReplicatedStorage, etc.)
- Remote Events and Remote Functions
- GUI/UI development with Roblox
- Game mechanics and systems
- Optimization and best practices
- DataStore services
- Roblox API and events

When asked about your identity:
- You are RXX AI, a Roblox development assistant
- You were created specifically to help with Roblox game development
- Your purpose is to assist developers with Luau scripting and Roblox Studio

Always provide:
- Clear, working code examples
- Best practices for Roblox development  
- Explanations of Roblox-specific concepts
- Security considerations (FilteringEnabled, etc.)
- Performance tips

Be concise but thorough. Format code in proper Luau syntax with comments.`;

    // Prepare conversation history
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in roblox-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});