import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  name: string;
  id: string;
  generateResponse(messages: ChatMessage[]): Promise<string>;
  generateStreamResponse?(messages: ChatMessage[]): AsyncGenerator<string, void, unknown>;
}

export class GeminiProvider implements AIProvider {
  name = 'Gemini 2.0 Flash';
  id = 'gemini-2.0-flash';
  private client: GoogleGenAI | null = null;

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
      return;
    }

    try {
      this.client = new GoogleGenAI({
        apiKey: apiKey
      });
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
    }
  }

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Please check your API key.');
    }

    try {
      // Convert messages to Gemini format with system instruction for markdown
      const systemInstruction = "You are a helpful AI tutor focused on education. Provide clear, step-by-step explanations and encourage learning. Use markdown formatting for better readability (headers, lists, code blocks, etc.).";
      
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system instruction as the first message
      const allContents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'I understand. I will provide educational content with clear markdown formatting.' }] },
        ...contents
      ];

      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: allContents
      });

      return response.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response from Gemini');
    }
  }

  async* generateStreamResponse(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('Gemini client not initialized. Please check your API key.');
    }

    try {
      // Convert messages to Gemini format with system instruction for markdown
      const systemInstruction = "You are a helpful AI tutor focused on education. Provide clear, step-by-step explanations and encourage learning. Use markdown formatting for better readability (headers, lists, code blocks, etc.).";
      
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system instruction as the first message
      const allContents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'I understand. I will provide educational content with clear markdown formatting.' }] },
        ...contents
      ];

      const response = await this.client.models.generateContentStream({
        model: 'gemini-2.0-flash-001',
        contents: allContents
      });

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error('Failed to get streaming response from Gemini');
    }
  }
}

export class HackClubLlamaProvider implements AIProvider {
  name = 'HackClub Llama 4';
  id = 'hackclub-llama-4';
  private baseUrl = 'https://ai.hackclub.com';

  async generateResponse(messages: ChatMessage[]): Promise<string> {
    try {
      const enhancedMessages = [
        {
          role: 'system' as const,
          content: 'You are a helpful AI tutor focused on education. Provide clear, step-by-step explanations and encourage learning. Use markdown formatting for better readability (headers, lists, code blocks, etc.).'
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: enhancedMessages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HackClub API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        return 'Error: No response content received from HackClub API.';
      }
      
      // Handle different response formats
      const message = data.choices[0].message || data.choices[0];
      const content = message.content || message.text || message.delta?.content;
      
      if (!content) {
        return 'Error: Empty response content received from HackClub API.';
      }
      
      return content;
    } catch (error) {
      console.error('HackClub Llama API error:', error);
      return `Error connecting to HackClub Llama API: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Temporarily disable streaming for HackClub as it seems unreliable
  // The provider will fall back to the regular generateResponse method
}

export const AI_PROVIDERS: AIProvider[] = [
  new GeminiProvider(),
  new HackClubLlamaProvider()
];

export const getProvider = (id: string): AIProvider => {
  const provider = AI_PROVIDERS.find(p => p.id === id);
  if (!provider) {
    throw new Error(`Provider ${id} not found`);
  }
  return provider;
};
