'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  Square,
  Play,
  Pause,
  Loader2,
  RefreshCw,
  Radio,
  Zap
} from 'lucide-react';
import { VoiceSettings } from './types';
import { ListeningAnimation } from './ListeningAnimation';
import { VoiceStatus } from './VoiceStatus';
import { VoiceSelector } from './VoiceSelector';
import { VoiceSettingsDialog } from './VoiceSettingsDialog';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isSyncing: boolean;
  lastRecognized: string;
  voiceSettings: VoiceSettings;
  theme?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onSyncData: () => void;
  onLastRecognizedChange: (value: string) => void;
  onSettingsChange: (settings: VoiceSettings) => void;
  textToSpeakRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function VoiceControls({
  isListening,
  isSpeaking,
  isProcessing,
  isSyncing,
  lastRecognized,
  voiceSettings,
  theme,
  onStartListening,
  onStopListening,
  onSpeakText,
  onStopSpeaking,
  onSyncData,
  onLastRecognizedChange,
  onSettingsChange,
  textToSpeakRef
}: VoiceControlsProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [confidence, setConfidence] = useState<number>();

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setAvailableVoices(window.speechSynthesis.getVoices());
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Test voice function
  const handleTestVoice = async (voiceURI: string) => {
    return new Promise<void>((resolve) => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('Hello! This is a test of this voice.');
        const voice = availableVoices.find(v => v.voiceURI === voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
        utterance.rate = voiceSettings.speechRate;
        utterance.volume = voiceSettings.speechVolume;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  // Handle voice selection
  const handleVoiceChange = (voiceURI: string) => {
    onSettingsChange({
      ...voiceSettings,
      speechVoice: voiceURI
    });
  };

  const isActive = isListening || isSpeaking || isProcessing;

  return (
    <div className="space-y-6">
      {/* Voice Status */}
      <VoiceStatus
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        isConnected={true}
        lastRecognized={lastRecognized}
        confidence={confidence}
      />

      {/* Central Listening Animation */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <ListeningAnimation
            isListening={isListening}
            size="xl"
            variant={voiceSettings.listeningAnimation as any}
            className="mb-4"
          />
          
          {/* Quick Action Ring */}
          <div className={cn(
            'absolute inset-0 rounded-full transition-all duration-300',
            isActive ? 'scale-125 opacity-100' : 'scale-100 opacity-60'
          )}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
          </div>
        </div>

        {/* Main Control Button */}
        <Button
          onClick={isListening ? onStopListening : onStartListening}
          size="lg"
          className={cn(
            'h-14 px-8 text-base font-medium transition-all duration-300 shadow-lg',
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
          )}
          disabled={isProcessing}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5 mr-3" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-3" />
              Start Listening
            </>
          )}
        </Button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={isSpeaking ? onStopSpeaking : () => onSpeakText(lastRecognized)}
            variant="outline"
            size="sm"
            disabled={!lastRecognized || isProcessing}
            className="transition-all duration-200 hover:scale-105"
          >
            {isSpeaking ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Voice Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Voice Selection</Label>
        </div>
        
        <VoiceSelector
          selectedVoice={voiceSettings.speechVoice}
          onVoiceChange={handleVoiceChange}
          onTestVoice={handleTestVoice}
          disabled={isProcessing}
        />
      </div>

      <Separator />

      {/* Text Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Speech Input</Label>
          {lastRecognized && (
            <Badge variant="outline" className="text-xs">
              {lastRecognized.length} chars
            </Badge>
          )}
        </div>
        
        <Textarea
          ref={textToSpeakRef}
          value={lastRecognized}
          onChange={(e) => onLastRecognizedChange(e.target.value)}
          placeholder="Your speech will appear here, or type to test voice output..."
          className="min-h-[100px] resize-none transition-all duration-200 focus:shadow-sm"
        />
        
        {lastRecognized && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onLastRecognizedChange('')}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Settings */}
      <VoiceSettingsDialog
        settings={voiceSettings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
}
