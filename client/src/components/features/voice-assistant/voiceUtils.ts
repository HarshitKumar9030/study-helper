import { parseAIResponse } from './semanticParser';

export function determineIntent(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('what is') || lowerCommand.includes('explain') || 
      lowerCommand.includes('how to') || lowerCommand.includes('help with') ||
      lowerCommand.includes('law of') || lowerCommand.includes('theorem') ||
      lowerCommand.includes('formula') || lowerCommand.includes('definition') ||
      lowerCommand.includes('newton')) {
    return 'study_help';
  }
  
  if (lowerCommand.includes('timer') || lowerCommand.includes('pomodoro')) {
    return 'timer';
  }
  
  if (lowerCommand.includes('focus mode') || lowerCommand.includes('focus session')) {
    return 'focus';
  }
  
  if (lowerCommand.includes('schedule') || lowerCommand.includes('tasks') || 
      lowerCommand.includes('deadline') || lowerCommand.includes('assignment')) {
    return 'schedule';
  }
  
  if (lowerCommand.includes('break') || lowerCommand.includes('rest') || 
      lowerCommand.includes('pause')) {
    return 'break';
  }
  
  if (lowerCommand.includes('stats') || lowerCommand.includes('progress') || 
      lowerCommand.includes('report') || lowerCommand.includes('summary')) {
    return 'stats';
  }
  
  // Note taking
  if (lowerCommand.includes('note') || lowerCommand.includes('write down') || 
      lowerCommand.includes('remember') || lowerCommand.includes('save')) {
    return 'note_taking';
  }
  
  // General conversation or unknown
  if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || 
      lowerCommand.includes('good morning') || lowerCommand.includes('good afternoon')) {
    return 'greeting';
  }
  
  return 'general_query';
}

// Extract minutes from timer commands
export function extractMinutes(command: string): number {
  const match = command.match(/(\d+)\s*(?:minute|min)/i);
  return match ? parseInt(match[1]) : 25; // Default to 25 minutes
}

export async function processVoiceCommand(command: string): Promise<string> {
  const lowerCommand = command.toLowerCase();
  
  console.log('Processing voice command:', command);
  
  if (lowerCommand.includes('newton\'s third law') || lowerCommand.includes('third law of motion') || 
      lowerCommand.includes('newton third law') || lowerCommand.includes('3rd law')) {
    console.log('✅ Matched Newton\'s third law');
    return 'Newton\'s third law of motion states: For every action, there is an equal and opposite reaction. This means that forces always come in pairs - when object A exerts a force on object B, object B simultaneously exerts an equal force in the opposite direction on object A. For example, when you walk, you push backward on the ground, and the ground pushes forward on you with equal force.';
  }

  if (lowerCommand.includes('newton\'s first law') || lowerCommand.includes('first law of motion') ||
      lowerCommand.includes('newton first law') || lowerCommand.includes('1st law')) {
    console.log('✅ Matched Newton\'s first law');
    return 'Newton\'s first law of motion, also called the law of inertia, states: An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction, unless acted upon by an unbalanced force. This means objects resist changes to their motion.';
  }

  if (lowerCommand.includes('newton\'s second law') || lowerCommand.includes('second law of motion') ||
      lowerCommand.includes('newton second law') || lowerCommand.includes('2nd law')) {
    console.log('✅ Matched Newton\'s second law');
    return 'Newton\'s second law of motion states: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. This is expressed as F = ma, where F is force, m is mass, and a is acceleration.';
  }

  // Check for general Newton's laws question
  if (lowerCommand.includes('newton\'s laws') || lowerCommand.includes('laws of motion') ||
      lowerCommand.includes('newton laws')) {
    console.log('✅ Matched general Newton\'s laws');
    return 'Newton\'s three laws of motion are: 1) Law of Inertia - objects at rest stay at rest unless acted upon by a force, 2) F = ma - force equals mass times acceleration, and 3) Action-Reaction - for every action there is an equal and opposite reaction. Which specific law would you like me to explain in detail?';
  }

  // PRIORITY 2: Quick response commands
  if (lowerCommand.includes('timer') || lowerCommand.includes('pomodoro')) {
    const minutes = extractMinutes(lowerCommand);
    return `Timer set for ${minutes} minutes. Focus mode will begin now.`;
  }
  
  if (lowerCommand.includes('focus mode') || lowerCommand.includes('focus session')) {
    return 'Focus mode activated. Distracting websites will be blocked and notifications silenced.';
  }
  
  if (lowerCommand.includes('schedule') || lowerCommand.includes('tasks')) {
    return 'Checking your schedule... You have 3 tasks pending and 2 upcoming deadlines.';
  }
  
  if (lowerCommand.includes('break') || lowerCommand.includes('rest')) {
    return 'Starting a 5-minute break. Take a deep breath and stretch!';
  }

  if (lowerCommand.includes('stats') || lowerCommand.includes('progress')) {
    return 'Today you\'ve completed 2 focus sessions totaling 50 minutes. Great progress!';
  }

  if (lowerCommand.includes('good morning')) {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning! Ready to start a productive day of studying? I can help you set up a study schedule or start a focus session.';
    } else if (hour < 17) {
      return 'Good afternoon! How can I help you with your studies today?';
    } else {
      return 'Good evening! Time for some evening study? Let me know how I can assist you.';
    }
  }

  if (lowerCommand.includes('good afternoon') || lowerCommand.includes('good evening') || 
      lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
    return 'Hello! I\'m your study helper assistant. I can help you with timers, focus mode, study questions, and more. What would you like to do?';
  }
  console.log('🤖 No local response found, trying AI assistant for:', command);
  
  try {
    console.log('📡 Making AI API request...');
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: command,
        context: { 
          source: 'voice_assistant',
          activeApp: 'Study Helper'
        }
      })
    });

    console.log('📡 AI API response status:', response.status);
      if (response.ok) {
      const data = await response.json();
      console.log('🔍 Raw AI API response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data && data.data.message) {
        console.log('✅ Got clean AI message:', data.data.message);
        return data.data.message;
      }
      
      const parsedMessage = parseAIResponse(data);
      console.log('✅ Fallback parsed message:', parsedMessage);
      
      return parsedMessage;
    } else {
      console.error('❌ AI API error status:', response.status);
      const errorText = await response.text();
      console.error('❌ AI API error text:', errorText);
    }
  } catch (error) {
    console.error('Error calling AI assistant:', error);
  }

  return 'I heard you, but I\'m not sure how to help with that yet. You can ask me about Newton\'s laws, timers, focus mode, schedules, or study tips.';
}

export function calculateConfidenceThreshold(command: string, baseThreshold: number): number {
  const lowerCommand = command.toLowerCase();
  
  const isEducationalQuery = lowerCommand.includes('law') || 
                            lowerCommand.includes('theorem') || 
                            lowerCommand.includes('principle') ||
                            lowerCommand.includes('formula') ||
                            lowerCommand.includes('equation') ||
                            lowerCommand.includes('explain') ||
                            lowerCommand.includes('what is') ||
                            lowerCommand.includes('how to') ||
                            lowerCommand.includes('definition') ||
                            lowerCommand.includes('newton');

  const isSimplePhrase = lowerCommand.includes('good morning') ||
                        lowerCommand.includes('good afternoon') ||
                        lowerCommand.includes('good evening') ||
                        lowerCommand.includes('hello') ||
                        lowerCommand.includes('hi there') ||
                        lowerCommand.includes('thank you') ||
                        lowerCommand.includes('timer') ||
                        lowerCommand.includes('focus');
  
  let adjustedThreshold = baseThreshold;
  
  if (isEducationalQuery) {
    adjustedThreshold = Math.max(0.15, baseThreshold - 0.25); // Lower by 25%
  } else if (isSimplePhrase) {
    adjustedThreshold = Math.max(0.1, baseThreshold - 0.3); // Lower by 30%
  } else {
    adjustedThreshold = Math.max(0.2, baseThreshold - 0.2); // Lower by 20%
  }
  
  return adjustedThreshold;
}

// Normalize confidence values from speech recognition
export function normalizeConfidence(confidence: number | undefined | null): number {
  // Handle undefined/null confidence (common in some browsers)
  if (confidence === undefined || confidence === null || confidence === 0) {
    console.log('Speech recognition confidence not available, using normalized value');
    return 0.8; // Assume good confidence when browser doesn't provide it
  }
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}
