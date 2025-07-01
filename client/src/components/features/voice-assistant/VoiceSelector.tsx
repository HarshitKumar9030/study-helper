'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Volume2, Play } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  onTestVoice?: (voice: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  onTestVoice,
  disabled = false 
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          setIsLoading(false);
          
          if (!selectedVoice && availableVoices.length > 0) {
            const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
            onVoiceChange(defaultVoice.voiceURI);
          }
        }
      }
    };

    loadVoices();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(() => {
        const retryVoices = window.speechSynthesis?.getVoices();
        if (retryVoices && retryVoices.length > 0) {
          setVoices(retryVoices);
          setIsLoading(false);
          
          if (!selectedVoice) {
            const defaultVoice = retryVoices.find(v => v.default) || retryVoices[0];
            onVoiceChange(defaultVoice.voiceURI);
          }
        }
      }, delay)
    );

    // Final timeout to stop loading state
    const finalTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finalTimeout);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [mounted, selectedVoice, onVoiceChange]);

  if (!mounted || (isLoading && voices.length === 0)) {
    return (
      <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          Loading available voices...
        </div>
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg border">
        <div className="text-sm text-muted-foreground">
          No voices available. Please check your browser settings.
        </div>
      </div>
    );
  }

  const selectedVoiceObj = voices.find(voice => voice.voiceURI === selectedVoice);
  const displayName = selectedVoiceObj?.name || 'Select Voice';

  const handleTestVoice = () => {
    if (onTestVoice && selectedVoice) {
      onTestVoice(selectedVoice);
    } else if (selectedVoice) {
      // Fallback test function if no onTestVoice provided
      testVoiceDirectly(selectedVoice);
    }
  };

  const testVoiceDirectly = (voiceURI: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance('Hello! This is how this voice sounds.');
      
      // Get fresh voices list
      const currentVoices = window.speechSynthesis.getVoices();
      const voice = currentVoices.find(v => v.voiceURI === voiceURI);
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        console.log('Testing voice:', voice.name, voice.lang);
      } else {
        console.warn('Voice not found for testing:', voiceURI);
      }
      
      utterance.rate = 1.0;
      utterance.volume = 0.8;
      
      // Small delay to ensure previous speech is cancelled
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  return (
    <div className="space-y-3">
      <Select 
        value={selectedVoice} 
        onValueChange={onVoiceChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Choose a voice">
              {displayName}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {voices.map((voice) => (
            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
              <div className="flex flex-col">
                <span className="font-medium">{voice.name}</span>
                <span className="text-xs text-muted-foreground">
                  {voice.lang} {voice.localService ? '(Local)' : '(Remote)'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onTestVoice && selectedVoice && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestVoice}
          disabled={disabled}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Test Voice
        </Button>
      )}
    </div>
  );
}
