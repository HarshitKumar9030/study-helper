'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  Trash2,
  Circle,
  Square,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface VoiceCommand {
  id: string;
  command: string;
  timestamp: Date;
  recognized: boolean;
  response?: string;
}

interface VoiceSettings {
  speechRate: number;
  speechVolume: number;
  speechVoice: string;
  enableContinuousListening: boolean;
  autoSpeak: boolean;
  language: string;
  voiceGender: 'female' | 'male' | 'neutral';
  voiceQuality: 'standard' | 'enhanced';
}

export default function VoiceAssistant() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastRecognized, setLastRecognized] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([
    {
      id: '1',
      command: 'Set timer for 25 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      recognized: true,
      response: 'Timer set for 25 minutes'
    },
    {
      id: '2',
      command: 'Start focus mode',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      recognized: true,
      response: 'Focus mode activated'
    },
    {
      id: '3',
      command: 'What\'s my schedule today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      recognized: true,
      response: 'You have 3 tasks scheduled for today'
    }
  ]);
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speechRate: 1.0,
    speechVolume: 0.8,
    speechVoice: 'default',
    enableContinuousListening: false,
    autoSpeak: true,
    language: 'en-US',
    voiceGender: 'female',
    voiceQuality: 'enhanced'
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const textToSpeakRef = useRef<HTMLTextAreaElement>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
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

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (event.results[event.results.length - 1].isFinal) {
            setLastRecognized(transcript);
            handleVoiceCommand(transcript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: 'Voice Recognition Error',
            description: `Error: ${event.error}`,
            variant: 'destructive',
          });
        };
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [voiceSettings.enableContinuousListening, voiceSettings.language]);

  const handleVoiceCommand = async (command: string) => {
    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      command: command.trim(),
      timestamp: new Date(),
      recognized: true,
    };

    // Process the command
    try {
      const response = await processVoiceCommand(command);
      newCommand.response = response;
      
      if (voiceSettings.autoSpeak && response) {
        speakText(response);
      }
    } catch (error) {
      newCommand.response = 'Sorry, I couldn\'t process that command.';
      console.error('Error processing voice command:', error);
    }

    setVoiceCommands(prev => [newCommand, ...prev.slice(0, 49)]); // Keep last 50 commands
  };

  const processVoiceCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();
    
    // Basic command processing
    if (lowerCommand.includes('timer') || lowerCommand.includes('pomodoro')) {
      const minutes = extractMinutes(lowerCommand);
      return `Timer set for ${minutes} minutes`;
    }
    
    if (lowerCommand.includes('focus mode') || lowerCommand.includes('focus session')) {
      return 'Focus mode activated. Distracting websites will be blocked.';
    }
    
    if (lowerCommand.includes('schedule') || lowerCommand.includes('tasks')) {
      return 'Checking your schedule...';
    }
    
    if (lowerCommand.includes('break') || lowerCommand.includes('rest')) {
      return 'Starting a 5-minute break. Relax and recharge!';
    }    // Send to AI assistant for complex queries
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: command,
          context: { source: 'voice_assistant' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Extract the actual message from the AI response
        if (data.success && data.data?.message) {
          return data.data.message;
        } else if (data.message) {
          return data.message;
        } else if (typeof data.data === 'string') {
          return data.data;
        } else {
          // If the response is a JSON object, extract just the message part
          const responseText = JSON.stringify(data);
          try {
            const parsed = JSON.parse(responseText);
            return parsed.message || parsed.response || 'I processed your request.';
          } catch {
            return 'I processed your request.';
          }
        }
      }
    } catch (error) {
      console.error('Error calling AI assistant:', error);
    }

    return 'I heard you, but I\'m not sure how to help with that yet.';
  };

  const extractMinutes = (command: string): number => {
    const match = command.match(/(\d+)\s*(?:minute|min)/i);
    return match ? parseInt(match[1]) : 25; // Default to 25 minutes
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: 'Voice Recognition Error',
          description: 'Unable to start voice recognition. Please check your microphone permissions.',
          variant: 'destructive',
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };
  const speakText = (text: string) => {
    if (synthRef.current && text.trim()) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.speechRate;
      utterance.volume = voiceSettings.speechVolume;
      
      // Get available voices and select best quality voice
      const voices = synthRef.current.getVoices();
      let selectedVoice = null;
      
      if (voices.length > 0) {
        // Prefer enhanced/premium voices
        const enhancedVoices = voices.filter(voice => 
          voice.name.toLowerCase().includes('enhanced') || 
          voice.name.toLowerCase().includes('premium') ||
          voice.name.toLowerCase().includes('neural')
        );
        
        // Filter by language and gender preference
        const languageVoices = (enhancedVoices.length > 0 ? enhancedVoices : voices).filter(voice => 
          voice.lang.startsWith(voiceSettings.language.split('-')[0])
        );
        
        // Filter by gender preference
        const genderVoices = languageVoices.filter(voice => {
          const name = voice.name.toLowerCase();
          if (voiceSettings.voiceGender === 'female') {
            return name.includes('female') || name.includes('woman') || 
                   name.includes('samantha') || name.includes('victoria') ||
                   name.includes('zira') || name.includes('susan');
          } else if (voiceSettings.voiceGender === 'male') {
            return name.includes('male') || name.includes('man') || 
                   name.includes('david') || name.includes('mark') ||
                   name.includes('george') || name.includes('james');
          }
          return true;
        });
        
        selectedVoice = genderVoices[0] || languageVoices[0] || voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: 'Speech Synthesis Error',
          description: 'Error occurred while speaking.',
          variant: 'destructive',
        });
      };

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const clearHistory = () => {
    setVoiceCommands([]);
    toast({
      title: 'History Cleared',
      description: 'Voice command history has been cleared.',
    });
  };

  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    'speechSynthesis' in window;

  if (!isSupported) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <MicOff className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-gray-600">Voice features are not supported in your browser.</p>
            <p className="text-sm text-gray-500">
              Please use Chrome, Edge, or Safari for voice functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Voice Controls */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {isListening ? (
                <Circle className="h-8 w-8 animate-pulse" />
              ) : (
                <Circle className="h-8 w-8" />
              )}
            </div>
            <p className="text-sm font-medium">
              {isListening ? 'Listening...' : 'Ready to listen'}
            </p>
            {isSpeaking && (
              <Badge variant="secondary" className="animate-pulse">
                Speaking...
              </Badge>
            )}
          </div>

          {/* Control Buttons */}
          <div className="space-y-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              className={`w-full ${isListening ? 'bg-red-600 hover:bg-red-700' : ''}`}
              disabled={isSpeaking}
            >
              {isListening ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>

            <Button
              onClick={isSpeaking ? stopSpeaking : () => speakText(lastRecognized || "Hello! I'm your voice assistant.")}
              variant="outline"
              className="w-full"
              disabled={isListening}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Speech
                </>
              )}
            </Button>
          </div>

          {/* Last Recognized */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Recognized:</Label>
            <Textarea
              value={lastRecognized}
              onChange={(e) => setLastRecognized(e.target.value)}
              placeholder="Your speech will appear here..."
              className="min-h-[80px] resize-none"
            />
            {lastRecognized && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => speakText(lastRecognized)}
                className="w-full"
              >
                <Volume2 className="h-3 w-3 mr-1" />
                Speak This
              </Button>
            )}
          </div>

          {/* Settings */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Voice Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Voice Settings</DialogTitle>
                <DialogDescription>
                  Customize your voice assistant preferences
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Speech Rate */}
                <div className="space-y-2">
                  <Label>Speech Rate: {voiceSettings.speechRate.toFixed(1)}x</Label>
                  <Slider
                    value={[voiceSettings.speechRate]}
                    onValueChange={([value]) => 
                      setVoiceSettings(prev => ({ ...prev, speechRate: value }))
                    }
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Speech Volume */}
                <div className="space-y-2">
                  <Label>Speech Volume: {Math.round(voiceSettings.speechVolume * 100)}%</Label>
                  <Slider
                    value={[voiceSettings.speechVolume]}
                    onValueChange={([value]) => 
                      setVoiceSettings(prev => ({ ...prev, speechVolume: value }))
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Auto Speak */}
                <div className="flex items-center justify-between">
                  <Label>Auto Speak Responses</Label>
                  <Switch
                    checked={voiceSettings.autoSpeak}
                    onCheckedChange={(checked) =>
                      setVoiceSettings(prev => ({ ...prev, autoSpeak: checked }))
                    }
                  />
                </div>

                {/* Continuous Listening */}
                <div className="flex items-center justify-between">
                  <Label>Continuous Listening</Label>
                  <Switch
                    checked={voiceSettings.enableContinuousListening}
                    onCheckedChange={(checked) =>
                      setVoiceSettings(prev => ({ ...prev, enableContinuousListening: checked }))
                    }
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Voice History */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Voice Commands History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {voiceCommands.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No voice commands yet. Start speaking to see your history!</p>
                </div>
              ) : (
                voiceCommands.map((cmd) => (
                  <div key={cmd.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={cmd.recognized ? "default" : "destructive"}>
                        {cmd.recognized ? "Recognized" : "Failed"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {cmd.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">🎙️ "{cmd.command}"</p>
                      {cmd.response && (
                        <p className="text-sm text-gray-600">🤖 {cmd.response}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => speakText(cmd.command)}
                        className="text-xs"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Repeat
                      </Button>
                      {cmd.response && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speakText(cmd.response!)}
                          className="text-xs"
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          Speak Response
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Add type declarations for Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
