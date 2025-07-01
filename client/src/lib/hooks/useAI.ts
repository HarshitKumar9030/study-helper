/**
 * AI Hooks for Study Helper
 * React hooks to interact with AI APIs
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { StudyAssistantResponse, ScheduleRecommendation, ActionItem } from '@/lib/ai/gemini';

// Types for hook responses
interface UseAIResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

interface ChatMessage {
  id: string;
  message: string;
  response: StudyAssistantResponse;
  timestamp: string;
}

interface ScheduleRequest {
  subjects: string[];
  totalTime: number;
  preferences?: {
    difficulty?: 'mixed' | 'easy_first' | 'hard_first';
    breakFrequency?: number;
    focusTime?: number;
  };
  deadlines?: Record<string, string>;
}

// Base hook for AI API calls
function useAIBase<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, setData, setLoading, setError, reset };
}

// Chat Assistant Hook
export function useChatAssistant(): UseAIResponse<StudyAssistantResponse> {
  const { data, loading, error, setData, setLoading, setError, reset } = useAIBase<StudyAssistantResponse>();

  const execute = useCallback(async (
    message: string,
    context?: {
      subject?: string;
      difficulty?: string;
      timeAvailable?: number;
    },
    conversationHistory?: Array<{ human: string; assistant: string }>
  ): Promise<StudyAssistantResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/ai/chat', {
        message,
        context,
        conversation_history: conversationHistory
      });

      const result = response.data.data;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to get AI response';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  return { data, loading, error, execute, reset };
}

// Schedule Generator Hook
export function useScheduleGenerator(): UseAIResponse<ScheduleRecommendation[]> {
  const { data, loading, error, setData, setLoading, setError, reset } = useAIBase<ScheduleRecommendation[]>();

  const execute = useCallback(async (
    request: ScheduleRequest
  ): Promise<ScheduleRecommendation[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/ai/scheduler', request);
      const result = response.data.data.recommendations;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to generate schedule';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  return { data, loading, error, execute, reset };
}

// Focus Assistant Hook
export function useFocusAssistant(): UseAIResponse<StudyAssistantResponse> {
  const { data, loading, error, setData, setLoading, setError, reset } = useAIBase<StudyAssistantResponse>();

  const execute = useCallback(async (
    situation: string,
    mood?: 'motivated' | 'tired' | 'stressed' | 'overwhelmed' | 'distracted',
    additionalContext?: {
      distractions?: string[];
      currentTask?: string;
      timeRemaining?: number;
    }
  ): Promise<StudyAssistantResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/ai/focus', {
        situation,
        mood,
        ...additionalContext
      });

      const result = response.data.data;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to get focus assistance';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  return { data, loading, error, execute, reset };
}

// Study Pattern Analysis Hook
export function useStudyAnalysis(): UseAIResponse<StudyAssistantResponse> {
  const { data, loading, error, setData, setLoading, setError, reset } = useAIBase<StudyAssistantResponse>();

  const execute = useCallback(async (
    studyData: {
      sessionsThisWeek: number;
      averageSessionLength: number;
      completedTasks: number;
      totalTasks: number;
      subjectDistribution: Record<string, number>;
      mostProductiveTime?: string;
    }
  ): Promise<StudyAssistantResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/ai', {
        type: 'pattern_analysis',
        data: { studyData }
      });

      const result = response.data.data;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to analyze study patterns';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  return { data, loading, error, execute, reset };
}

// Combined AI Assistant Hook (for general use)
export function useAIAssistant() {
  const chatAssistant = useChatAssistant();
  const scheduleGenerator = useScheduleGenerator();
  const focusAssistant = useFocusAssistant();
  const studyAnalysis = useStudyAnalysis();

  const [conversationHistory, setConversationHistory] = useState<Array<{ human: string; assistant: string }>>([]);

  // Chat with history management
  const chat = useCallback(async (
    message: string,
    context?: any
  ) => {
    const response = await chatAssistant.execute(message, context, conversationHistory);
    
    if (response) {
      setConversationHistory(prev => [
        ...prev,
        { human: message, assistant: response.message }
      ].slice(-10)); // Keep only last 10 exchanges
    }
    
    return response;
  }, [chatAssistant, conversationHistory]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    // Individual assistants
    chatAssistant: { ...chatAssistant, execute: chat },
    scheduleGenerator,
    focusAssistant,
    studyAnalysis,
    
    // Conversation management
    conversationHistory,
    clearHistory,
    
    // Global loading state
    isLoading: chatAssistant.loading || scheduleGenerator.loading || 
               focusAssistant.loading || studyAnalysis.loading,
    
    // Global error state
    hasError: !!(chatAssistant.error || scheduleGenerator.error || 
                 focusAssistant.error || studyAnalysis.error),
    
    // Reset all
    resetAll: () => {
      chatAssistant.reset();
      scheduleGenerator.reset();
      focusAssistant.reset();
      studyAnalysis.reset();
      clearHistory();
    }
  };
}

// Utility hook for getting focus resources
export function useFocusResources() {
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchResources = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      const url = category ? `/api/ai/focus?category=${category}` : '/api/ai/focus';
      const response = await axios.get(url);
      setResources(response.data.data);
    } catch (error) {
      console.error('Failed to fetch focus resources:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { resources, loading, fetchResources };
}

// Utility hook for getting schedule templates
export function useScheduleTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/scheduler?type=templates');
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Failed to fetch schedule templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { templates, loading, fetchTemplates };
}
