'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  RefreshCw
} from 'lucide-react';
import { VoiceSettings } from './types';
import { ListeningAnimation } from './ListeningAnimation';
import { VoiceSettingsDialog } from './VoiceSettingsDialog';

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
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Controls
          {isProcessing && (
            <Badge variant="outline" className="animate-pulse">
              Processing...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listening Animation */}
        {isListening && (
          <div className="text-center space-y-3">
            <ListeningAnimation animation={voiceSettings.listeningAnimation} theme={theme} />
            <Badge variant="secondary" className="animate-pulse">
              Listening...
            </Badge>
          </div>
        )}

        {/* Voice Control Buttons */}
        <div className="space-y-3">
          <Button
            onClick={isListening ? onStopListening : onStartListening}
            className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>

          <Button
            onClick={isSpeaking ? onStopSpeaking : () => onSpeakText(lastRecognized)}
            variant="outline"
            className="w-full"
            disabled={!lastRecognized || isProcessing}
          >
            {isSpeaking ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Speaking
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Speak Text
              </>
            )}
          </Button>

          <Button
            onClick={onSyncData}
            variant="outline"
            className="w-full"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Data
          </Button>
        </div>

        {/* Last Recognized Text */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Last Recognized:</Label>
          <Textarea
            ref={textToSpeakRef}
            value={lastRecognized}
            onChange={(e) => onLastRecognizedChange(e.target.value)}
            placeholder="Your speech will appear here..."
            className="min-h-[80px] resize-none"
          />
          {lastRecognized && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSpeakText(lastRecognized)}
              disabled={isSpeaking}
            >
              <Volume2 className="h-3 w-3 mr-1" />
              Speak
            </Button>
          )}
        </div>

        {/* Settings Dialog */}
        <VoiceSettingsDialog
          settings={voiceSettings}
          onSettingsChange={onSettingsChange}
        />
      </CardContent>
    </Card>
  );
}
