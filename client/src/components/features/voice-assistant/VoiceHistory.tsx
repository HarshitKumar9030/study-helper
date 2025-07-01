'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  Volume2,
  Trash2,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Zap
} from 'lucide-react';
import { VoiceCommand, VoiceSettings } from './types';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Conversation History</h2>
          {voiceCommands.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {voiceCommands.length} commands
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            disabled={voiceCommands.length === 0}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* History Content */}
      <div className="border rounded-lg bg-card/50 backdrop-blur-sm">
        <ScrollArea className="h-[500px]">
          <div className="p-4">
            {voiceCommands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="font-medium mb-2">No conversations yet</h3>
                <p className="text-sm max-w-sm mx-auto">
                  Start speaking to see your voice interactions appear here. Try saying "Hello" or asking a study-related question.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {voiceCommands.map((cmd, index) => (
                  <VoiceCommandItem
                    key={cmd.id}
                    command={cmd}
                    isLast={index === voiceCommands.length - 1}
                    isSpeaking={isSpeaking}
                    onSpeakText={onSpeakText}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface VoiceCommandItemProps {
  command: VoiceCommand;
  isLast: boolean;
  isSpeaking: boolean;
  onSpeakText: (text: string) => void;
}

function VoiceCommandItem({ command, isLast, isSpeaking, onSpeakText }: VoiceCommandItemProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="relative group">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-px h-full bg-border" />
      )}
      
      <div className="flex gap-4">
        {/* Timeline dot */}
        <div className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors',
          command.successful 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
            : 'bg-red-50 border-red-200 text-red-600'
        )}>
          {command.successful ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatTime(command.timestamp)}
                </span>
                {command.confidence !== undefined && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs border', getConfidenceColor(command.confidence))}
                  >
                    {Math.round(command.confidence * 100)}%
                  </Badge>
                )}
                {command.responseTime && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {command.responseTime}ms
                  </Badge>
                )}
              </div>
            </div>

            {/* User Message */}
            <div className="bg-muted/50 rounded-lg p-3 ml-auto max-w-[80%]">
              <div className="flex items-start gap-2 mb-2">
                <Mic className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  You said
                </span>
              </div>
              <p className="text-sm">{command.command}</p>
            </div>

            {/* AI Response */}
            {command.response && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-start gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Assistant
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{command.response}</p>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSpeakText(command.response!)}
                    disabled={isSpeaking}
                    className="h-7 px-2 text-xs"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {command.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                    Error
                  </span>
                </div>
                <p className="text-sm text-red-700">{command.errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
