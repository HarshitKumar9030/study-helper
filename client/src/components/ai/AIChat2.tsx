'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle,
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  CheckCircle2,
  Clock,
  Brain,
  History,
  Sparkles,
  Trash2,
  Copy,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import { useAIAssistant } from '@/lib/hooks/useAI';
import type { ActionItem } from '@/lib/ai/gemini';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  actionItems?: ActionItem[];
  timestamp: Date;
  sessionId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
  context?: {
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeAvailable?: number;
  };
}

interface ModernAIChatProps {
  className?: string;
  placeholder?: string;
  initialMessage?: string;
  showHistory?: boolean;
  maxHeight?: string;
}

export default function AIChat({ 
  className = '', 
  placeholder = "Ask me anything about studying...",
  initialMessage,
  showHistory = true,
  maxHeight = "calc(100vh - 200px)"
}: ModernAIChatProps) {
  const { data: session } = useSession();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState({
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeAvailable: 30
  });
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const { chatAssistant } = useAIAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Focus input
  useEffect(() => {
    if (activeTab === 'chat') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  // Load sessions from localStorage
  useEffect(() => {
    if (session?.user) {
      const savedSessions = localStorage.getItem(`chat-sessions-${session.user.email}`);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          const sessionsWithDates = parsed.map((s: any) => ({
            ...s,
            lastUpdated: new Date(s.lastUpdated),
            messages: s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
          setSessions(sessionsWithDates);
            // Load the most recent session
          if (sessionsWithDates.length > 0 && !currentSession) {
            setCurrentSession(sessionsWithDates[0]);
            const sessionContext = sessionsWithDates[0].context;
            if (sessionContext) {
              setContext({
                subject: sessionContext.subject || '',
                difficulty: sessionContext.difficulty || 'medium',
                timeAvailable: sessionContext.timeAvailable || 30
              });
            }
          }
        } catch (error) {
          console.error('Failed to load chat sessions:', error);
        }
      }
    }
  }, [session?.user, currentSession, context]);

  // Save sessions to localStorage
  const saveSessions = useCallback((updatedSessions: ChatSession[]) => {
    if (session?.user) {
      localStorage.setItem(`chat-sessions-${session.user.email}`, JSON.stringify(updatedSessions));
    }
  }, [session?.user]);

  // Create new session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date(),
      context: { ...context }
    };
    
    setCurrentSession(newSession);
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  }, [context, sessions, saveSessions]);

  // Update session
  const updateCurrentSession = useCallback((updates: Partial<ChatSession>) => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      ...updates,
      lastUpdated: new Date()
    };
    
    setCurrentSession(updatedSession);
    
    const updatedSessions = sessions.map(s => 
      s.id === currentSession.id ? updatedSession : s
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  }, [currentSession, sessions, saveSessions]);

  // Generate session title from first message
  const generateSessionTitle = useCallback((firstMessage: string) => {
    const words = firstMessage.trim().split(' ').slice(0, 4);
    return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
  }, []);

  // Send message
  const handleSendMessage = useCallback(async (messageText: string = input) => {
    if (!messageText.trim()) return;

    // Create session if none exists
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      sessionToUse = {
        id: Date.now().toString(),
        title: generateSessionTitle(messageText),
        messages: [],
        lastUpdated: new Date(),
        context: { ...context }
      };
      setCurrentSession(sessionToUse);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
      sessionId: sessionToUse.id
    };

    // Update session with user message
    const messagesWithUser = [...(sessionToUse.messages || []), userMessage];
    updateCurrentSession({
      messages: messagesWithUser,
      title: sessionToUse.messages.length === 0 ? generateSessionTitle(messageText) : sessionToUse.title
    });

    setInput('');
    setIsTyping(true);

    try {
      const response = await chatAssistant.execute(messageText.trim(), context);
      
      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.message || 'I received your message but couldn&apos;t generate a proper response.',
          suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          actionItems: Array.isArray(response.actionItems) ? response.actionItems : [],
          timestamp: new Date(),
          sessionId: sessionToUse.id
        };
        
        updateCurrentSession({
          messages: [...messagesWithUser, assistantMessage]
        });
        
        toast.success('Response generated!');
      } else {
        throw new Error('No response received');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date(),
        sessionId: sessionToUse.id
      };
      
      updateCurrentSession({
        messages: [...messagesWithUser, errorMessage]
      });
      
      toast.error('Failed to get response');
    } finally {
      setIsTyping(false);
    }
  }, [input, currentSession, context, chatAssistant, updateCurrentSession, generateSessionTitle]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Copy message
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard!');
  }, []);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(updatedSessions[0] || null);
    }
    
    toast.success('Chat session deleted');  }, [sessions, currentSession, saveSessions]);

  // Load session
  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    const sessionContext = session.context;
    if (sessionContext) {
      setContext({
        subject: sessionContext.subject || '',
        difficulty: sessionContext.difficulty || 'medium',
        timeAvailable: sessionContext.timeAvailable || 30
      });
    }
    setActiveTab('chat');
  }, []);

  // Export chat
  const exportChat = useCallback(() => {
    if (!currentSession) return;
    
    const exportData = {
      title: currentSession.title,
      messages: currentSession.messages,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully!');
  }, [currentSession]);

  // Format timestamp
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Format date for session list
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  const getPriorityColor = useCallback((priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  }, []);

  if (!session?.user) {
    return (
      <Card className={`flex items-center justify-center h-96 ${className}`}>
        <CardContent className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Sign in Required</h3>
          <p className="text-muted-foreground">Please sign in to use the AI chat assistant</p>
        </CardContent>
      </Card>
    );
  }  return (
    <div className={`flex bg-background rounded-lg border border-border overflow-hidden ${className}`} style={{ height: maxHeight }}>
      {/* Sidebar - Chat History */}
      {showHistory && (
        <div className="w-80 border-r border-border bg-muted/50 flex flex-col h-full">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                Chat History
              </h3>
              <Button
                onClick={createNewSession}
                size="sm"
                className="h-8 w-8"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2 min-h-0">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group hover:bg-accent/50 ${
                    currentSession?.id === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => loadSession(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.lastUpdated)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.messages.length} messages
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Chat With AI</h2>
              <Badge variant="secondary" className="ml-2">
                {chatAssistant.loading ? 'Thinking...' : 'Ready'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {currentSession && (
                <Button
                  onClick={exportChat}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2 flex-shrink-0">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0 overflow-hidden">
              <div className="p-4">
                <div className="space-y-6 pb-4">
                {(!currentSession?.messages || currentSession.messages.length === 0) && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary/60" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Welcome to your Chat With AI!
                      </h3>                      <p className="text-muted-foreground mb-6">
                        I&apos;m here to help with study techniques, scheduling, explanations, and academic guidance.
                      </p>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {[
                        "Help me create a study schedule for finals",
                        "Explain photosynthesis in simple terms", 
                        "What are the best note-taking methods?",
                        "How can I improve my focus while studying?"
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="p-4 h-auto text-left justify-start"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          <div className="flex items-start gap-3">
                            <Lightbulb className="h-4 w-4 mt-0.5 text-primary" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentSession?.messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-4 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' ? 'bg-primary' : 'bg-secondary'
                      }`}>
                        {message.type === 'user' ? 
                          <User className="h-4 w-4 text-primary-foreground" /> : 
                          <Bot className="h-4 w-4 text-secondary-foreground" />
                        }
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex flex-col gap-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`group relative px-4 py-3 rounded-2xl max-w-none ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card border border-border text-card-foreground'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          
                          {/* Copy button */}
                          <Button
                            onClick={() => copyMessage(message.content)}
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2 w-full">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Lightbulb className="h-3 w-3" />
                              Follow-up suggestions:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs"
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
                          <div className="flex flex-col gap-3 mt-3 w-full">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3" />
                              Recommended actions:
                            </div>
                            {message.actionItems.map((item) => (
                              <Card key={item.id} className="p-3 bg-muted/50">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className={getPriorityColor(item.priority)}>
                                      {item.priority}
                                    </Badge>
                                    {item.estimatedTime && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-card border border-border rounded-2xl p-4 max-w-xs">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  <div ref={messagesEndRef} />
                </div>
              </div>            </ScrollArea>
            
            <Separator className="flex-shrink-0" />
            
            {/* Input Area */}
            <div className="p-4 space-y-3 bg-card flex-shrink-0">
              {/* Context Controls */}
              <div className="flex gap-2 text-xs">
                <select 
                  value={context.subject} 
                  onChange={(e) => setContext(prev => ({ ...prev, subject: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground"
                >
                  <option value="">Subject (Optional)</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="English">English</option>
                  <option value="Programming">Programming</option>
                  <option value="Language Learning">Language Learning</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                </select>
                
                <select 
                  value={context.difficulty} 
                  onChange={(e) => setContext(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground"
                >
                  <option value="easy">Beginner</option>
                  <option value="medium">Intermediate</option>
                  <option value="hard">Advanced</option>
                </select>
                
                <input
                  type="number"
                  value={context.timeAvailable}
                  onChange={(e) => setContext(prev => ({ ...prev, timeAvailable: parseInt(e.target.value) || 30 }))}
                  placeholder="Time (min)"
                  className="px-3 py-2 border border-border rounded-lg text-xs w-24 bg-background text-foreground"
                  min="5"
                  max="240"
                />
              </div>
              
              {/* Message Input */}
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={chatAssistant.loading || isTyping}
                  className="flex-1 bg-background"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || chatAssistant.loading || isTyping}
                  className="px-6"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Error Display */}
              {chatAssistant.error && (
                <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  Error: {chatAssistant.error}
                </div>
              )}
            </div>
          </TabsContent>          <TabsContent value="settings" className="flex-1 p-6 min-h-0 overflow-auto">
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Chat Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Default Subject</label>
                    <select 
                      value={context.subject} 
                      onChange={(e) => setContext(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="">None</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="History">History</option>
                      <option value="English">English</option>
                      <option value="Programming">Programming</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Default Difficulty</label>
                    <select 
                      value={context.difficulty} 
                      onChange={(e) => setContext(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="easy">Beginner</option>
                      <option value="medium">Intermediate</option>
                      <option value="hard">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Default Time Available (minutes)</label>
                    <input
                      type="number"
                      value={context.timeAvailable}
                      onChange={(e) => setContext(prev => ({ ...prev, timeAvailable: parseInt(e.target.value) || 30 }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      min="5"
                      max="240"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Data Management</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (sessions.length > 0) {
                        const exportData = { sessions, exportedAt: new Date().toISOString() };
                        const dataStr = JSON.stringify(exportData, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'all-chat-sessions.json';
                        link.click();
                        URL.revokeObjectURL(url);
                        toast.success('All sessions exported!');
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Chats
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
                        setSessions([]);
                        setCurrentSession(null);
                        if (session?.user) {
                          localStorage.removeItem(`chat-sessions-${session.user.email}`);
                        }
                        toast.success('All chat history cleared');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All History
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
