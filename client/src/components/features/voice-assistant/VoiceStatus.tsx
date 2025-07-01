'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  CheckCircle,
  AlertCircle,
  Radio
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VoiceStatusProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  lastRecognized?: string;
  confidence?: number;
  className?: string;
}

export function VoiceStatus({
  isListening,
  isSpeaking,
  isProcessing,
  isConnected,
  lastRecognized,
  confidence,
  className
}: VoiceStatusProps) {
  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        icon: AlertCircle,
        text: 'Disconnected',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }
    
    if (isProcessing) {
      return {
        icon: Loader2,
        text: 'Processing...',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        animate: 'animate-spin'
      };
    }
    
    if (isSpeaking) {
      return {
        icon: Volume2,
        text: 'Speaking',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        animate: 'animate-pulse'
      };
    }
    
    if (isListening) {
      return {
        icon: Radio,
        text: 'Listening...',
        color: 'text-primary',
        bgColor: 'bg-primary/5',
        borderColor: 'border-primary/20',
        animate: 'animate-pulse'
      };
    }
    
    return {
      icon: CheckCircle,
      text: 'Ready',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all duration-300',
      statusInfo.bgColor,
      statusInfo.borderColor,
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <StatusIcon className={cn(
          'h-5 w-5',
          statusInfo.color,
          statusInfo.animate
        )} />
        <span className={cn('font-medium', statusInfo.color)}>
          {statusInfo.text}
        </span>
        
        {confidence !== undefined && (
          <Badge 
            variant="outline" 
            className={cn(
              'ml-auto text-xs',
              confidence > 0.8 ? 'text-green-600 border-green-200' :
              confidence > 0.6 ? 'text-yellow-600 border-yellow-200' :
              'text-red-600 border-red-200'
            )}
          >
            {Math.round(confidence * 100)}% confidence
          </Badge>
        )}
      </div>

      {lastRecognized && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Last Recognized
          </div>
          <div className="text-sm bg-background/50 rounded p-2 border">
            &ldquo;{lastRecognized}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
