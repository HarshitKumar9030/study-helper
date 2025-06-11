'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  Volume2,
  Trash2,
  Brain,
  Circle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { VoiceCommand, VoiceSettings } from './types';

interface VoiceHistoryProps {
  voiceCommands: VoiceCommand[];
  voiceSettings: VoiceSettings;
  isSyncing: boolean;
  isSpeaking: boolean;
  theme?: string;
  onSyncData: () => void;
  onClearHistory: () => void;
  onSpeakText: (text: string) => void;
}

export function VoiceHistory({
  voiceCommands,
  voiceSettings,
  isSyncing,
  isSpeaking,
  theme,
  onSyncData,
  onClearHistory,
  onSpeakText
}: VoiceHistoryProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Voice Commands History
          {voiceCommands.length > 0 && (
            <Badge variant="outline">{voiceCommands.length}</Badge>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncData}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {voiceCommands.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No voice commands yet. Start speaking to see your history!</p>
                <p className="text-sm mt-2 opacity-75">
                  Try saying: &quot;Set timer for 25 minutes&quot; or &quot;Start focus mode&quot;
                </p>
              </div>
            ) : (
              voiceCommands.map((cmd) => (
                <VoiceCommandItem
                  key={cmd.id}
                  command={cmd}
                  voiceSettings={voiceSettings}
                  theme={theme}
                  isSpeaking={isSpeaking}
                  onSpeakText={onSpeakText}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface VoiceCommandItemProps {
  command: VoiceCommand;
  voiceSettings: VoiceSettings;
  theme?: string;
  isSpeaking: boolean;
  onSpeakText: (text: string) => void;
}

function VoiceCommandItem({ command, voiceSettings, theme, isSpeaking, onSpeakText }: VoiceCommandItemProps) {
  return (
    <div className={`p-4 border rounded-lg space-y-3 ${
      voiceSettings.themeAware 
        ? (theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50')
        : 'border-gray-200 bg-gray-50/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={command.successful ? "default" : "destructive"}>
            {command.successful ? "Success" : "Failed"}
          </Badge>
          {command.confidence && (
            <Badge variant="outline" className="text-xs">
              {Math.round(command.confidence * 100)}% confidence
            </Badge>
          )}
          {command.intent && (
            <Badge variant="secondary" className="text-xs">
              {command.intent}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {command.responseTime && (
            <span>{command.responseTime}ms</span>
          )}
          <span>{command.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Mic className="h-4 w-4 mt-0.5 text-blue-500" />
          <p className="text-sm font-medium">{command.command}</p>
        </div>
        {command.response && (
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 mt-0.5 text-green-500" />
            <p className="text-sm text-gray-600 dark:text-gray-300">{command.response}</p>
          </div>
        )}
        {command.errorMessage && (
          <div className="flex items-start gap-2">
            <Circle className="h-4 w-4 mt-0.5 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{command.errorMessage}</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSpeakText(command.command)}
          className="text-xs"
          disabled={isSpeaking}
        >
          <Volume2 className="h-3 w-3 mr-1" />
          Repeat
        </Button>
        {command.response && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSpeakText(command.response!)}
            className="text-xs"
            disabled={isSpeaking}
          >
            <Volume2 className="h-3 w-3 mr-1" />
            Speak Response
          </Button>
        )}
      </div>
    </div>
  );
}
