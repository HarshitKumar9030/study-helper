'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  messageId: string;
  sessionId: string;
  type: 'user' | 'assistant';
  content: string;
  metadata?: {
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeAvailable?: number;
    suggestions?: string[];
    actionItems?: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedTime?: number;
      category: 'study' | 'review' | 'break' | 'assignment';
    }>;
    confidence?: number;
    responseTime?: number;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  title?: string;
  subject?: string;
  messageCount: number;
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
  summary?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UseChatSessionReturn {
  // Current session state
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  
  // Session management
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createSession: (subject?: string, title?: string) => Promise<ChatSession | null>;
  loadSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message management
  addMessage: (content: string, type: 'user' | 'assistant', metadata?: ChatMessage['metadata']) => Promise<ChatMessage | null>;
  sendMessage: (content: string, context?: any) => Promise<ChatMessage | null>;
  
  // Utility functions
  fetchSessions: () => Promise<void>;
  clearCurrentSession: () => void;
  isActive: boolean;
}

export function useChatSession(): UseChatSessionReturn {
  const { data: session } = useSession();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = !!currentSession && !currentSession.endedAt;

  // Fetch all sessions for the user
  const fetchSessions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/sync/chat?type=sessions&limit=50');
      setSessions(response.data.data.sessions || []);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Create a new chat session
  const createSession = useCallback(async (subject?: string, title?: string): Promise<ChatSession | null> => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const sessionId = uuidv4();
      const sessionData = {
        sessionId,
        title: title || `Chat Session - ${new Date().toLocaleDateString()}`,
        subject,
        messageCount: 0,
        startedAt: new Date(),
        lastMessageAt: new Date(),
      };

      const response = await axios.post('/api/sync/chat', {
        type: 'session',
        data: sessionData
      });

      const newSession = response.data.data.session;
      setCurrentSession(newSession);
      setMessages([]);
      
      // Add to sessions list
      setSessions(prev => [newSession, ...prev]);
      
      return newSession;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to create session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load an existing session and its messages
  const loadSession = useCallback(async (sessionId: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load session info
      const sessionResponse = await axios.get(`/api/sync/chat?type=sessions&sessionId=${sessionId}`);
      const sessionData = sessionResponse.data.data.sessions?.[0];

      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Load messages for this session
      const messagesResponse = await axios.get(`/api/sync/chat?sessionId=${sessionId}&type=messages&limit=100`);
      const sessionMessages = messagesResponse.data.data.messages || [];

      setCurrentSession(sessionData);
      setMessages(sessionMessages.map((msg: any) => ({
        ...msg,
        id: msg._id || msg.messageId,
        timestamp: new Date(msg.createdAt)
      })));

    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // End the current session
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      await axios.put('/api/sync/chat', {
        type: 'session',
        data: {
          ...currentSession,
          endedAt: new Date()
        }
      });

      setCurrentSession(prev => prev ? { ...prev, endedAt: new Date() } : null);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/sync/chat?sessionId=${sessionId}`);
      
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      
      if (currentSession?.sessionId === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  }, [currentSession?.sessionId]);

  // Add a message to the current session
  const addMessage = useCallback(async (
    content: string, 
    type: 'user' | 'assistant', 
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage | null> => {
    if (!currentSession || !session?.user?.id) {
      setError('No active session or user not authenticated');
      return null;
    }

    try {
      const messageId = uuidv4();
      const messageData = {
        messageId,
        sessionId: currentSession.sessionId,
        type,
        content,
        metadata,
      };

      const response = await axios.post('/api/sync/chat', {
        type: 'messages',
        data: {
          sessionId: currentSession.sessionId,
          messages: [messageData]
        }
      });

      const savedMessage = response.data.data.created?.[0];
      if (savedMessage) {
        const chatMessage: ChatMessage = {
          ...savedMessage,
          id: savedMessage._id || savedMessage.messageId,
          timestamp: new Date(savedMessage.createdAt)
        };

        setMessages(prev => [...prev, chatMessage]);
        
        // Update session's last message time
        setCurrentSession(prev => prev ? {
          ...prev,
          lastMessageAt: new Date(),
          messageCount: prev.messageCount + 1
        } : null);

        return chatMessage;
      }

      return null;
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to add message');
      return null;
    }
  }, [currentSession, session?.user?.id]);

  // Send a message and get AI response
  const sendMessage = useCallback(async (content: string, context?: any): Promise<ChatMessage | null> => {
    if (!currentSession) {
      setError('No active session');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Add user message
      const userMessage = await addMessage(content, 'user');
      if (!userMessage) return null;

      // Get AI response
      const aiResponse = await axios.post('/api/ai/chat', {
        message: content,
        context,
        conversation_history: messages.slice(-10).map(msg => ({
          human: msg.type === 'user' ? msg.content : '',
          assistant: msg.type === 'assistant' ? msg.content : ''
        })).filter(item => item.human || item.assistant)
      });

      const aiData = aiResponse.data.data;
      
      // Add AI response message
      const assistantMessage = await addMessage(aiData.message, 'assistant', {
        suggestions: aiData.suggestions,
        actionItems: aiData.actionItems,
        confidence: aiData.confidence,
        responseTime: aiData.responseTime,
        ...context
      });

      return assistantMessage;

    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to send message');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSession, messages, addMessage]);

  // Clear current session without saving
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
    setError(null);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchSessions();
    }
  }, [session?.user?.id, fetchSessions]);

  return {
    currentSession,
    messages,
    sessions,
    loading,
    error,
    createSession,
    loadSession,
    endSession,
    deleteSession,
    addMessage,
    sendMessage,
    fetchSessions,
    clearCurrentSession,
    isActive
  };
}
