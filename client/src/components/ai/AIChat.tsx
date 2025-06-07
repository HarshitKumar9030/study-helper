'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  CheckCircle2,
  Clock,
  Brain
} from 'lucide-react';
import { useAIAssistant } from '@/lib/hooks/useAI';
import type { ActionItem } from '@/lib/ai/gemini';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  actionItems?: ActionItem[];
  timestamp: Date;
}

interface AIChatProps {
  className?: string;
  placeholder?: string;
  initialMessage?: string;
}

export default function AIChat({ 
  className = '', 
  placeholder = "Ask me anything about studying...",
  initialMessage 
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState({
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeAvailable: 30
  });
  
  const { chatAssistant } = useAIAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send initial message if provided - using useCallback to stabilize function
  const sendInitialMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages([userMessage]);

    try {
      const response = await chatAssistant.execute(message.trim(), context);
      
      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.message || 'I received your message but couldn\'t generate a proper response.',
          suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          actionItems: Array.isArray(response.actionItems) ? response.actionItems : [],
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Initial message error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your initial message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [chatAssistant, context]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      sendInitialMessage(initialMessage);
    }
  }, [initialMessage, messages.length, sendInitialMessage]);  const handleSendMessage = useCallback(async (messageText: string = input) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await chatAssistant.execute(messageText.trim(), context);
      
      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.message || 'I received your message but couldn\'t generate a proper response.',
          suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          actionItems: Array.isArray(response.actionItems) ? response.actionItems : [],
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [input, chatAssistant, context]);
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const getPriorityColor = useCallback((priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Study Assistant
          <Badge variant="secondary" className="ml-auto">
            {messages.length > 0 ? 'Active' : 'Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Ready to help with your studies!</p>
                <p className="text-sm">Ask me about study techniques, scheduling, or any academic topic.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {message.type === 'user' ? 
                      <User className="h-4 w-4 text-white" /> : 
                      <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex flex-col gap-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Lightbulb className="h-3 w-3" />
                          Suggestions:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Items */}
                    {message.actionItems && message.actionItems.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 w-full">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Action Items:
                        </div>
                        {message.actionItems.map((item) => (
                          <Card key={item.id} className="p-2 border border-gray-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-xs font-medium">{item.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                {item.estimatedTime && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {item.estimatedTime}m
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {chatAssistant.loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        {/* Input Area */}
        <div className="p-4 space-y-3">
          {/* Context Controls */}
          <div className="flex gap-2 text-xs">
            <select 
              value={context.subject} 
              onChange={(e) => setContext(prev => ({ ...prev, subject: e.target.value }))}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">Subject (Optional)</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="English">English</option>
              <option value="Programming">Programming</option>
            </select>
            
            <select 
              value={context.difficulty} 
              onChange={(e) => setContext(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            
            <input
              type="number"
              value={context.timeAvailable}
              onChange={(e) => setContext(prev => ({ ...prev, timeAvailable: parseInt(e.target.value) || 30 }))}
              placeholder="Time (min)"
              className="px-2 py-1 border rounded text-xs w-20"
              min="5"
              max="240"
            />
          </div>
          
          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={chatAssistant.loading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || chatAssistant.loading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Error Display */}
          {chatAssistant.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {chatAssistant.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
