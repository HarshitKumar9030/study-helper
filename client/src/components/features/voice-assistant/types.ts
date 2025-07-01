// Types for Voice Assistant components

export interface VoiceCommand {
  id: string;
  command: string;
  transcription: string;
  confidence: number;
  timestamp: Date;
  recognized: boolean;
  response?: string;
  intent?: string;
  successful: boolean;
  responseTime?: number;
  errorMessage?: string;
  context?: {
    activeApp?: string;
    focusMode?: boolean;
    currentTask?: string;
  };
}

export interface VoiceSettings {
  speechRate: number;
  speechVolume: number;
  speechVoice: string; // Voice URI for selected voice
  enableContinuousListening: boolean;
  autoSpeak: boolean;
  language: string;
  voiceGender: 'female' | 'male' | 'neutral';
  voiceQuality: 'standard' | 'enhanced' | 'premium';
  wakeWordSensitivity: number;
  noiseReduction: boolean;
  autoTranscription: boolean;
  confidenceThreshold: number;
  activationKeyword: string;
  listeningAnimation: 'pulse' | 'wave' | 'ripple' | 'bars';
  themeAware: boolean;
}

export interface VoiceAssistantState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isSyncing: boolean;
  lastRecognized: string;
  voiceCommands: VoiceCommand[];
  voiceSettings: VoiceSettings;
}
