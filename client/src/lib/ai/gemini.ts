import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StudyAssistantResponse {
  message: string;
  suggestions?: string[];
  actionItems?: ActionItem[];
  confidence: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number; // in minutes
  category: 'study' | 'review' | 'break' | 'assignment';
}

export interface ScheduleRecommendation {
  timeSlot: string;
  subject: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reasoning: string;
  breaks: number; // number of breaks needed
}

// System prompts for different AI modes
const SYSTEM_PROMPTS = {
  study_assistant: `You are an intelligent study assistant for a student productivity app. Your role is to:
  1. Help students with study-related questions
  2. Provide learning strategies and techniques
  3. Suggest study schedules and break times
  4. Offer motivation and encouragement
  5. Help with time management and productivity
  
  RESPONSE FORMAT: Always respond with valid JSON containing:
  {
    "message": "Your helpful response to the student",
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "actionItems": [
      {
        "id": "unique-id",
        "title": "Action title",
        "description": "What to do",
        "priority": "low|medium|high",
        "estimatedTime": 30,
        "category": "study|review|break|assignment"
      }
    ],
    "confidence": 0.9
  }
  
  Guidelines:
  - Keep the main message clear, helpful, and encouraging
  - Include 2-4 practical suggestions when relevant
  - Add 1-3 action items for concrete next steps
  - Use appropriate priority levels and time estimates
  - Be supportive and focused on helping students learn effectively`,
    voice_assistant: `You are a helpful voice assistant for students. CRITICAL: Your responses will be spoken aloud by text-to-speech technology.

IMPORTANT RULES:
- NEVER return JSON, code blocks, markdown, or any structured format
- NEVER use backticks, curly braces, or any technical formatting
- NEVER start with "json" or wrap responses in quotes
- ONLY return natural, conversational text that sounds good when spoken
- Keep responses under 3 sentences for voice clarity
- Use simple, clear language
- Be encouraging and supportive
- Speak directly to the student

GOOD EXAMPLE: "Newton's third law states that for every action, there is an equal and opposite reaction. This means when you push on something, it pushes back on you with the same force."

BAD EXAMPLE: {"message": "Newton's third law...", "suggestions": [...]}

You help with study questions, motivation, scheduling, and academic support. 
Always respond as if you're speaking face-to-face with the student.`,
  
  scheduler: `You are a smart scheduling assistant that helps students optimize their study time. 
  Your role is to:
  1. Analyze study patterns and preferences
  2. Create personalized study schedules
  3. Balance different subjects and difficulty levels
  4. Include appropriate breaks and rest periods
  5. Consider deadlines and priorities
  
  Always provide practical, achievable schedules that promote effective learning and prevent burnout.`,
  
  focus_helper: `You are a focus and productivity coach for students. Your role is to:
  1. Help students overcome procrastination
  2. Suggest focus techniques and strategies
  3. Provide motivation during difficult study sessions
  4. Help manage distractions and maintain concentration
  5. Guide students through challenging learning moments
  
  Be supportive, understanding, and provide actionable advice that students can implement immediately.`
};

class GeminiAI {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any;
  private isInitialized = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.warn('Google AI API key not found. AI features will be limited.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async getStudyAssistance(
    question: string, 
    context?: { subject?: string; difficulty?: string; timeAvailable?: number }
  ): Promise<StudyAssistantResponse> {
    if (!this.isInitialized) {
      return this.getFallbackResponse(question);
    }

    try {
      const contextPrompt = context ? `
        Context:
        - Subject: ${context.subject || 'General'}
        - Difficulty Level: ${context.difficulty || 'Medium'}
        - Time Available: ${context.timeAvailable || 'Not specified'} minutes
      ` : '';

      const prompt = `${SYSTEM_PROMPTS.study_assistant}
      
      ${contextPrompt}
      
      Student Question: ${question}
      
      Provide a helpful response following the JSON format specified above. Make sure to include practical suggestions and actionable next steps.`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Enhanced parsing with multiple fallback strategies
      return this.parseStudyResponse(responseText, question);
      
    } catch (error) {
      console.error('Error getting study assistance:', error);
      return this.getFallbackResponse(question);
    }
  }

  /**
   * Enhanced response parser with multiple strategies
   */
  private parseStudyResponse(responseText: string, originalQuestion: string): StudyAssistantResponse {
    // Strategy 1: Try direct JSON parsing
    try {
      const parsed = JSON.parse(responseText);
      if (this.isValidStudyResponse(parsed)) {
        return this.sanitizeResponse(parsed);
      }
    } catch (e) {
      // Continue to next strategy
    }

    // Strategy 2: Extract JSON from markdown code blocks
    const jsonBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1]);
        if (this.isValidStudyResponse(parsed)) {
          return this.sanitizeResponse(parsed);
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 3: Find JSON object in text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (this.isValidStudyResponse(parsed)) {
          return this.sanitizeResponse(parsed);
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 4: Extract structured content from plain text
    return this.parseUnstructuredResponse(responseText, originalQuestion);
  }

  /**
   * Validate if response has required structure
   */
  private isValidStudyResponse(obj: any): boolean {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.message === 'string' && 
           obj.message.length > 0;
  }

  /**
   * Sanitize and normalize response structure
   */
  private sanitizeResponse(response: any): StudyAssistantResponse {
    return {
      message: String(response.message || '').trim(),      suggestions: Array.isArray(response.suggestions) 
        ? response.suggestions.filter((s: any) => typeof s === 'string' && s.length > 0).slice(0, 5)
        : [],
      actionItems: Array.isArray(response.actionItems) 
        ? response.actionItems.map(this.sanitizeActionItem).slice(0, 5)
        : [],
      confidence: typeof response.confidence === 'number' 
        ? Math.max(0, Math.min(1, response.confidence))
        : 0.8
    };
  }

  /**
   * Sanitize individual action items
   */
  private sanitizeActionItem(item: any, index: number): ActionItem {
    return {
      id: String(item.id || `action-${index + 1}`),
      title: String(item.title || `Action ${index + 1}`).slice(0, 100),
      description: String(item.description || item.title || '').slice(0, 300),
      priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
      estimatedTime: typeof item.estimatedTime === 'number' && item.estimatedTime > 0 
        ? Math.min(240, item.estimatedTime) 
        : undefined,
      category: ['study', 'review', 'break', 'assignment'].includes(item.category) 
        ? item.category 
        : 'study'
    };
  }

  /**
   * Parse unstructured text response
   */
  private parseUnstructuredResponse(text: string, originalQuestion: string): StudyAssistantResponse {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    let message = '';
    const suggestions: string[] = [];
    const actionItems: ActionItem[] = [];
    
    let currentSection = 'message';
    
    for (const line of lines) {
      // Detect section headers
      if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('tips:') || line.toLowerCase().includes('recommendations:')) {
        currentSection = 'suggestions';
        continue;
      }
      
      if (line.toLowerCase().includes('action') || line.toLowerCase().includes('next steps') || line.toLowerCase().includes('to do:')) {
        currentSection = 'actions';
        continue;
      }
      
      // Process content based on current section
      if (currentSection === 'message' && !line.match(/^[-*•]\s/) && !line.match(/^\d+\./)) {
        message += (message ? ' ' : '') + line;
      } else if (currentSection === 'suggestions' && (line.match(/^[-*•]\s/) || line.match(/^\d+\./))) {
        const suggestion = line.replace(/^[-*•\d.]\s*/, '').trim();
        if (suggestion && suggestions.length < 5) {
          suggestions.push(suggestion);
        }
      } else if (currentSection === 'actions' && (line.match(/^[-*•]\s/) || line.match(/^\d+\./))) {
        const action = line.replace(/^[-*•\d.]\s*/, '').trim();
        if (action && actionItems.length < 5) {
          actionItems.push({
            id: `action-${actionItems.length + 1}`,
            title: action.split(':')[0] || action,
            description: action.split(':').slice(1).join(':').trim() || action,
            priority: 'medium' as const,
            category: 'study' as const,
            estimatedTime: this.estimateTimeFromText(action)
          });
        }
      }
    }
    
    return {
      message: message || text.slice(0, 500),
      suggestions,
      actionItems,
      confidence: 0.7
    };
  }

  /**
   * Estimate time from action text
   */
  private estimateTimeFromText(text: string): number | undefined {
    const timeMatch = text.match(/(\d+)\s*(min|minute|hour|hr)/i);
    if (timeMatch) {
      const num = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      return unit.startsWith('h') ? num * 60 : num;
    }
    
    // Default estimates based on action type
    if (text.toLowerCase().includes('review') || text.toLowerCase().includes('read')) {
      return 15;
    }
    if (text.toLowerCase().includes('practice') || text.toLowerCase().includes('exercise')) {
      return 30;
    }
    if (text.toLowerCase().includes('study') || text.toLowerCase().includes('learn')) {
      return 45;
    }
    
    return undefined;
  }
  /**
   * Get voice assistance - returns plain text suitable for speech synthesis
   */
  async getVoiceAssistance(
    question: string, 
    context?: { subject?: string; difficulty?: string; timeAvailable?: number }
  ): Promise<StudyAssistantResponse> {
    if (!this.isInitialized) {
      return this.getFallbackVoiceResponse(question);
    }

    try {
      const contextPrompt = context ? `
        Context:
        - Subject: ${context.subject || 'General'}
        - Difficulty Level: ${context.difficulty || 'Medium'}
        - Time Available: ${context.timeAvailable || 'Not specified'} minutes
      ` : '';      const prompt = `${SYSTEM_PROMPTS.voice_assistant}
      
      ${contextPrompt}
      
      Student Question: ${question}
      
      IMPORTANT: Respond with ONLY plain text that can be spoken aloud. 
      DO NOT use JSON, markdown, code blocks, or any formatting.
      DO NOT start with backticks, curly braces, or "json".
      
      Just give a direct, helpful answer in natural speech:`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean any potential formatting artifacts
      let cleanResponse = responseText.trim();
      
      // Remove any JSON-like artifacts that might appear
      cleanResponse = cleanResponse.replace(/^```json\s*/gi, '');
      cleanResponse = cleanResponse.replace(/\s*```$/g, '');
      cleanResponse = cleanResponse.replace(/^\{.*?"message"\s*:\s*"/gi, '');
      cleanResponse = cleanResponse.replace(/",?\s*"suggestions".*\}$/gi, '');
      cleanResponse = cleanResponse.replace(/^["']|["']$/g, ''); // Remove quotes
      
      // If it still looks like JSON, extract just the message
      if (cleanResponse.includes('"message"') || cleanResponse.startsWith('{')) {
        try {
          const jsonMatch = cleanResponse.match(/"message"\s*:\s*"([^"]+)"/);
          if (jsonMatch) {
            cleanResponse = jsonMatch[1];
          }
        } catch (e) {
          // If JSON parsing fails, use fallback
          cleanResponse = 'I can help you with that. Could you please rephrase your question?';
        }
      }
      
      // Final cleanup
      cleanResponse = cleanResponse.replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
      
      return {
        message: cleanResponse,
        suggestions: [], // Voice responses don't include suggestions
        actionItems: [], // Voice responses don't include action items
        confidence: 0.9 // High confidence since this is optimized for voice
      };
    } catch (error) {
      console.error('Error getting voice assistance:', error);
      return this.getFallbackVoiceResponse(question);
    }
  }


  async getScheduleRecommendations(
    subjects: string[],
    totalTime: number, 
    preferences?: {
      difficulty?: 'mixed' | 'easy_first' | 'hard_first';
      breakFrequency?: number; 
      focusTime?: number; 
    }
  ): Promise<ScheduleRecommendation[]> {
    if (!this.isInitialized) {
      return this.getFallbackSchedule(subjects, totalTime);
    }

    try {
      const prompt = `${SYSTEM_PROMPTS.scheduler}
      
      Create a study schedule with these parameters:
      - Subjects: ${subjects.join(', ')}
      - Total available time: ${totalTime} minutes
      - Preferences: ${JSON.stringify(preferences || {})}
      
      Please create an optimal study schedule that:
      1. Balances all subjects appropriately
      2. Includes proper breaks (every 25-50 minutes)
      3. Considers difficulty levels and mental fatigue
      4. Uses evidence-based learning techniques
      
      Return as JSON array of schedule items with:
      - timeSlot: string (e.g., "09:00-09:25")
      - subject: string
      - duration: number (minutes)
      - difficulty: 'easy' | 'medium' | 'hard'
      - reasoning: string (why this timing/order)
      - breaks: number (number of short breaks in this session)`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        return JSON.parse(responseText);
      } catch {
        return this.getFallbackSchedule(subjects, totalTime);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      return this.getFallbackSchedule(subjects, totalTime);
    }
  }

  /**
   * Get focus and motivation help
   */
  async getFocusHelp(
    situation: string,
    mood?: 'motivated' | 'tired' | 'stressed' | 'overwhelmed' | 'distracted'
  ): Promise<StudyAssistantResponse> {
    if (!this.isInitialized) {
      return this.getFallbackFocusHelp(situation);
    }

    try {
      const prompt = `${SYSTEM_PROMPTS.focus_helper}
      
      Student's current situation: ${situation}
      Current mood/state: ${mood || 'not specified'}
      
      Provide focused advice to help them get back on track with their studies.
      Include practical techniques they can use right now.
      
      Format as JSON with message, suggestions, and actionItems.`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        const parsed = JSON.parse(responseText);
        return {
          message: parsed.message || responseText,
          suggestions: parsed.suggestions || [],
          actionItems: parsed.actionItems || [],
          confidence: parsed.confidence || 0.8
        };
      } catch {
        return {
          message: responseText,
          suggestions: [],
          actionItems: [],
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('Error getting focus help:', error);
      return this.getFallbackFocusHelp(situation);
    }
  }

  async analyzeStudyPatterns(
    studyData: {
      sessionsThisWeek: number;
      averageSessionLength: number;
      completedTasks: number;
      totalTasks: number;
      subjectDistribution: Record<string, number>;
      mostProductiveTime?: string;
    }
  ): Promise<StudyAssistantResponse> {
    if (!this.isInitialized) {
      return this.getFallbackAnalysis(studyData);
    }

    try {
      const prompt = `${SYSTEM_PROMPTS.study_assistant}
      
      Analyze this student's study patterns and provide insights:
      
      Study Data:
      - Study sessions this week: ${studyData.sessionsThisWeek}
      - Average session length: ${studyData.averageSessionLength} minutes
      - Task completion rate: ${studyData.completedTasks}/${studyData.totalTasks}
      - Subject time distribution: ${JSON.stringify(studyData.subjectDistribution)}
      - Most productive time: ${studyData.mostProductiveTime || 'Unknown'}
      
      Provide:
      1. Analysis of their current study habits
      2. Specific recommendations for improvement
      3. Actionable steps they can take this week
      
      Format as JSON with detailed insights and practical suggestions.`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        const parsed = JSON.parse(responseText);
        return {
          message: parsed.message || responseText,
          suggestions: parsed.suggestions || [],
          actionItems: parsed.actionItems || [],
          confidence: parsed.confidence || 0.8
        };
      } catch {
        return {
          message: responseText,
          suggestions: [],
          actionItems: [],
          confidence: 0.7
        };
      }
    } catch (error) {
      console.error('Error analyzing study patterns:', error);
      return this.getFallbackAnalysis(studyData);
    }
  }
  // Fallback responses when AI is not available
  private getFallbackResponse(question: string): StudyAssistantResponse {
    return {
      message: "I'm currently unable to provide AI-powered assistance. Here are some general study tips: Take regular breaks, use active recall techniques, and break complex topics into smaller chunks.",
      suggestions: [
        "Try the Pomodoro Technique (25 min study + 5 min break)",
        "Use flashcards for memorization",
        "Teach concepts to others to reinforce learning",
        "Create a distraction-free study environment"
      ],
      actionItems: [],
      confidence: 0.5
    };
  }

  private getFallbackVoiceResponse(question: string): StudyAssistantResponse {
    // Simple voice-friendly responses based on common questions
    let message = "I'm having trouble connecting right now, but I'm here to help with your studies.";
    
    if (question.toLowerCase().includes('schedule')) {
      message = "Try using the Pomodoro technique: study for 25 minutes, then take a 5 minute break. This helps maintain focus and prevents burnout.";
    } else if (question.toLowerCase().includes('motivation') || question.toLowerCase().includes('tired')) {
      message = "Remember why you started studying. Take a short break, drink some water, and start with just one small task. You've got this!";
    } else if (question.toLowerCase().includes('physics') || question.toLowerCase().includes('newton')) {
      message = "Physics can be challenging but it's all about understanding the patterns. Try breaking down problems step by step and practice with real world examples.";
    }
    
    return {
      message,
      suggestions: [],
      actionItems: [],
      confidence: 0.6
    };
  }

  private getFallbackSchedule(subjects: string[], totalTime: number): ScheduleRecommendation[] {
    const timePerSubject = Math.floor(totalTime / subjects.length);
    const recommendations: ScheduleRecommendation[] = [];
    
    subjects.forEach((subject, index) => {
      const startTime = index * timePerSubject;
      recommendations.push({
        timeSlot: `${String(Math.floor(startTime / 60)).padStart(2, '0')}:${String(startTime % 60).padStart(2, '0')}-${String(Math.floor((startTime + timePerSubject) / 60)).padStart(2, '0')}:${String((startTime + timePerSubject) % 60).padStart(2, '0')}`,
        subject,
        duration: timePerSubject,
        difficulty: 'medium',
        reasoning: 'Equal time allocation for balanced learning',
        breaks: Math.floor(timePerSubject / 25)
      });
    });
    
    return recommendations;
  }

  private getFallbackFocusHelp(situation: string): StudyAssistantResponse {
    return {
      message: "Here are some focus techniques that can help: Remove distractions, set a timer for focused work sessions, and remember your goals. Take a deep breath and start with just 5 minutes of focused work.",
      suggestions: [
        "Put your phone in another room",
        "Use website blockers for distracting sites",
        "Set a timer for short, focused bursts",
        "Reward yourself after completing tasks"
      ],
      actionItems: [
        {
          id: 'focus-1',
          title: 'Clear your workspace',
          description: 'Remove any distracting items from your study area',
          priority: 'high',
          estimatedTime: 5,
          category: 'study'
        }
      ],
      confidence: 0.6
    };
  }

  private getFallbackAnalysis(studyData: any): StudyAssistantResponse {
    const completionRate = (studyData.completedTasks / studyData.totalTasks) * 100;
    
    return {
      message: `Based on your data: You've completed ${completionRate.toFixed(1)}% of your tasks this week. ${completionRate > 70 ? 'Great job!' : 'There\'s room for improvement.'} Consider adjusting your study schedule and techniques.`,
      suggestions: [
        "Try to maintain consistent study sessions",
        "Focus on completing smaller, manageable tasks",
        "Review your most productive times and schedule accordingly"
      ],
      actionItems: [],
      confidence: 0.6
    };
  }
}

// Singleton instance
const geminiAI = new GeminiAI();

export default geminiAI;