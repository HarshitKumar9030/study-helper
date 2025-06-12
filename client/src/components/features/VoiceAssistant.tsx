'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { VoiceCommand, VoiceSettings } from './voice-assistant/types';
import { VoiceControls } from './voice-assistant/VoiceControls';
import { VoiceHistory } from './voice-assistant/VoiceHistory';
import { useVoiceData } from './voice-assistant/useVoiceData';
import { 
  determineIntent, 
  processVoiceCommand, 
  calculateConfidenceThreshold,
  normalizeConfidence
} from './voice-assistant/voiceUtils';

export default function VoiceAssistant() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { isSyncing, loadVoiceData, saveVoiceCommand, saveVoiceSettings } = useVoiceData();
  
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speechRate: 1.0,
    speechVolume: 0.8,
    speechVoice: 'default',
    enableContinuousListening: false,
    autoSpeak: true,
    language: 'en-US',
    voiceGender: 'female',
    voiceQuality: 'enhanced',
    wakeWordSensitivity: 0.7,
    noiseReduction: true,
    autoTranscription: true,
    confidenceThreshold: 0.4, // Lowered from 0.6 to 0.4 for better recognition
    activationKeyword: 'hey study helper',
    listeningAnimation: 'wave',
    themeAware: true
  });  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const textToSpeakRef = useRef<HTMLTextAreaElement | null>(null);

  // Speech synthesis
  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.speechRate;
      utterance.volume = voiceSettings.speechVolume;
      utterance.lang = voiceSettings.language;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceSettings.speechRate, voiceSettings.speechVolume, voiceSettings.language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Handle voice command processing
  const handleVoiceCommand = useCallback(async (command: string, confidence: number = 1.0) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const startTime = Date.now();
    
    // Normalize confidence value
    const normalizedConfidence = normalizeConfidence(confidence);
    
    // Calculate adjusted threshold
    const adjustedThreshold = calculateConfidenceThreshold(command, voiceSettings.confidenceThreshold);
    
    console.log('Voice recognition debug:', { 
      command,
      originalConfidence: confidence,
      normalizedConfidence,
      baseThreshold: voiceSettings.confidenceThreshold,
      adjustedThreshold,
      willAccept: normalizedConfidence >= adjustedThreshold
    });
    
    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      command: command.trim(),
      transcription: command.trim(),
      confidence: normalizedConfidence,
      timestamp: new Date(),
      recognized: normalizedConfidence >= adjustedThreshold,
      successful: false,
      responseTime: 0
    };    // Calculate confidence percentages for consistent use
    const confidencePercent = Math.round(normalizedConfidence * 100);
    const thresholdPercent = Math.round(adjustedThreshold * 100);

    try {
      if (newCommand.recognized) {
        const response = await processVoiceCommand(command);
        newCommand.response = response;
        newCommand.successful = true;
        
        // Determine intent from the command
        newCommand.intent = determineIntent(command);
        
        if (voiceSettings.autoSpeak && response) {
          speakText(response);
        }
      } else {        
        newCommand.errorMessage = `Low confidence recognition (${confidencePercent}% < ${thresholdPercent}%)`;
        newCommand.response = `I heard "${command}" but I'm not confident about it (${confidencePercent}% confidence). Could you try speaking more clearly?`;
        
        if (voiceSettings.autoSpeak && !newCommand.successful) {
          speakText(newCommand.response);
        }
      }
    } catch (error) {
      newCommand.response = 'Sorry, I couldn\'t process that command.';
      newCommand.successful = false;
      newCommand.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing voice command:', error);
    }    newCommand.responseTime = Date.now() - startTime;
    setVoiceCommands(prev => [newCommand, ...prev.slice(0, 49)]); // Keep last 50 commands
    
    // Save to backend with error handling
    try {
      await saveVoiceCommand(newCommand);
    } catch (error) {
      console.error('Failed to save voice command to backend:', error);
      // Don't block the UI if backend sync fails
    }
    setIsProcessing(false);
  }, [isProcessing, voiceSettings, saveVoiceCommand, speakText]);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = voiceSettings.enableContinuousListening;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = voiceSettings.language;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          const confidence = event.results[event.results.length - 1][0].confidence;
          
          console.log('Speech recognition result:', { transcript, confidence });
          
          setLastRecognized(transcript);
          
          if (event.results[event.results.length - 1].isFinal) {
            handleVoiceCommand(transcript, confidence);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please allow microphone access to use voice commands.",
              variant: "destructive",
            });
          }
        };

        synthRef.current = window.speechSynthesis;
      } else {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive",
        });
      }
    }
  }, [voiceSettings.enableContinuousListening, voiceSettings.language, handleVoiceCommand, toast]);

  // Voice control functions
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const syncData = useCallback(() => {
    loadVoiceData(setVoiceSettings, setVoiceCommands);
  }, [loadVoiceData]);  const clearHistory = useCallback(() => {
    console.log('🗑️ Clear history called - before:', voiceCommands.length);
    setVoiceCommands([]);
    console.log('🗑️ Clear history called - after clearing state, new length should be 0');
    
    // Force a re-render by updating a timestamp
    toast({
      title: "History Cleared",
      description: `Cleared ${voiceCommands.length} voice commands from history.`,
    });
  }, [toast, voiceCommands.length]);

  const handleSettingsChange = useCallback((newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  }, [saveVoiceSettings]);  // Load data on component mount - only once
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        console.log('🔄 Loading voice data on mount...');
        try {
          await loadVoiceData(setVoiceSettings, setVoiceCommands);
          console.log('✅ Voice data loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load voice data:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      console.log('🧹 VoiceAssistant component unmounting');
    };
  }, []); // Empty dependency array to prevent infinite loops

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <VoiceControls
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        isSyncing={isSyncing}
        lastRecognized={lastRecognized}
        voiceSettings={voiceSettings}
        theme={theme}
        onStartListening={startListening}
        onStopListening={stopListening}
        onSpeakText={speakText}
        onStopSpeaking={stopSpeaking}
        onSyncData={syncData}
        onLastRecognizedChange={setLastRecognized}
        onSettingsChange={handleSettingsChange}
        textToSpeakRef={textToSpeakRef}
      />

      <VoiceHistory
        voiceCommands={voiceCommands}
        voiceSettings={voiceSettings}
        isSyncing={isSyncing}
        isSpeaking={isSpeaking}
        theme={theme}
        onSyncData={syncData}
        onClearHistory={clearHistory}
        onSpeakText={speakText}
      />
    </div>
  );
}
