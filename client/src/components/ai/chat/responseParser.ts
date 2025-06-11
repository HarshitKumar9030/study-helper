// Enhanced response parser for AI chat messages
// Handles various response formats and ensures proper parsing

import type { StudyAssistantResponse } from '@/lib/ai/gemini';

export interface ParsedResponse {
  message: string;
  suggestions: string[];
  actionItems: any[];
  confidence: number;
}

/**
 * Advanced parser that handles multiple AI response formats
 */
export function parseAIResponse(rawResponse: any): ParsedResponse {
  // If already properly structured
  if (isValidResponse(rawResponse)) {
    return {
      message: rawResponse.message || '',
      suggestions: Array.isArray(rawResponse.suggestions) ? rawResponse.suggestions : [],
      actionItems: Array.isArray(rawResponse.actionItems) ? rawResponse.actionItems : [],
      confidence: typeof rawResponse.confidence === 'number' ? rawResponse.confidence : 0.8
    };
  }

  // If response is a string, try to parse as JSON first
  if (typeof rawResponse === 'string') {
    return parseStringResponse(rawResponse);
  }

  // Fallback for unexpected formats
  return {
    message: String(rawResponse) || 'I received your message but had trouble formatting my response.',
    suggestions: [],
    actionItems: [],
    confidence: 0.5
  };
}

/**
 * Parse string responses that might be JSON or plain text
 */
function parseStringResponse(response: string): ParsedResponse {
  const cleaned = response.trim();
  
  // Try to parse as JSON first
  if (looksLikeJSON(cleaned)) {
    try {
      const parsed = JSON.parse(cleaned);
      if (isValidResponse(parsed)) {
        return {
          message: parsed.message || '',
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
    }
  }

  // Try to extract JSON from mixed content
  const jsonMatch = extractJSONFromText(cleaned);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch);
      if (isValidResponse(parsed)) {
        return {
          message: parsed.message || '',
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8
        };
      }
    } catch (error) {
      console.warn('Failed to parse extracted JSON:', error);
    }
  }

  // If it contains structured markers, try to parse sections
  if (hasStructuredMarkers(cleaned)) {
    return parseStructuredText(cleaned);
  }

  // Plain text response
  return {
    message: cleaned,
    suggestions: extractSuggestions(cleaned),
    actionItems: [],
    confidence: 0.7
  };
}

/**
 * Check if response looks like JSON
 */
function looksLikeJSON(text: string): boolean {
  const trimmed = text.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

/**
 * Extract JSON from text that might have other content
 */
function extractJSONFromText(text: string): string | null {
  // Look for JSON blocks with various delimiters
  const patterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/i,
    /```\s*(\{[\s\S]*?\})\s*```/i,
    /(\{[\s\S]*?\})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if text has structured markers like headings or lists
 */
function hasStructuredMarkers(text: string): boolean {
  return /^(##|#|\*\*|\d+\.|\-|\*)/m.test(text) ||
         text.includes('Suggestions:') ||
         text.includes('Action Items:') ||
         text.includes('Next Steps:');
}

/**
 * Parse structured text format
 */
function parseStructuredText(text: string): ParsedResponse {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  let message = '';
  const suggestions: string[] = [];
  const actionItems: any[] = [];
  
  let currentSection = 'message';
  let currentActionItem: any = null;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('suggestion') || line.startsWith('Tips:')) {
      currentSection = 'suggestions';
      continue;
    }
    
    if (line.toLowerCase().includes('action') || line.toLowerCase().includes('next steps')) {
      currentSection = 'actions';
      continue;
    }
    
    if (currentSection === 'message' && !line.startsWith('-') && !line.startsWith('*') && !line.match(/^\d+\./)) {
      message += (message ? ' ' : '') + line;
    } else if (currentSection === 'suggestions' && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
      const suggestion = line.replace(/^[-*\d.]\s*/, '').trim();
      if (suggestion) suggestions.push(suggestion);
    } else if (currentSection === 'actions') {
      if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
        const action = line.replace(/^[-*\d.]\s*/, '').trim();
        if (action) {
          actionItems.push({
            id: `action-${actionItems.length + 1}`,
            title: action.split(':')[0] || action,
            description: action.split(':')[1]?.trim() || action,
            priority: 'medium' as const,
            category: 'study' as const
          });
        }
      }
    }
  }
  
  return {
    message: message || text,
    suggestions,
    actionItems,
    confidence: 0.8
  };
}

/**
 * Extract simple suggestions from plain text
 */
function extractSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  
  // Look for common suggestion patterns
  const patterns = [
    /try\s+([^.!?]+)/gi,
    /consider\s+([^.!?]+)/gi,
    /you\s+could\s+([^.!?]+)/gi,
    /i\s+recommend\s+([^.!?]+)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const suggestion = match[1].trim();
        if (suggestion.length > 10 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      }
    }
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

/**
 * Validate response structure
 */
function isValidResponse(obj: any): obj is StudyAssistantResponse {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.message === 'string' &&
         obj.message.length > 0;
}

/**
 * Clean response text from common formatting issues
 */
export function cleanResponseText(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/\s*```$/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .trim();
}

/**
 * Format action items with proper structure
 */
export function formatActionItems(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  
  return items.map((item, index) => ({
    id: item.id || `action-${index + 1}`,
    title: item.title || `Action ${index + 1}`,
    description: item.description || item.title || '',
    priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
    estimatedTime: typeof item.estimatedTime === 'number' ? item.estimatedTime : undefined,
    category: ['study', 'review', 'break', 'assignment'].includes(item.category) ? item.category : 'study',
    completed: Boolean(item.completed)
  }));
}
