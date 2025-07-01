'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VoiceCommand, VoiceSettings } from './types';

export function useVoiceData() {
  const [isSyncing, setIsSyncing] = useState(false);
  const sessionIdRef = useRef<string>(Date.now().toString());
  const loadingRef = useRef<boolean>(false);

  // Load voice settings and commands from backend
  const loadVoiceData = useCallback(async (
    setVoiceSettings: (setter: (prev: VoiceSettings) => VoiceSettings) => void,
    setVoiceCommands: (commands: VoiceCommand[]) => void
  ) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('🔄 Voice data loading already in progress, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      setIsSyncing(true);
      
      console.log('🔄 Starting voice data load...');
      
      // Load settings
      const settingsResponse = await fetch('/api/sync/voice?type=settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('📥 Settings response:', settingsData);
        
        if (settingsData.success && settingsData.data?.settings) {
          const backendSettings = settingsData.data.settings;
          setVoiceSettings(prev => ({
            ...prev,
            speechVolume: backendSettings.volume || prev.speechVolume,
            speechRate: backendSettings.rate ? backendSettings.rate / 150 : prev.speechRate,
            language: backendSettings.language || prev.language,
            wakeWordSensitivity: backendSettings.wakeWordSensitivity || prev.wakeWordSensitivity,
            noiseReduction: backendSettings.noiseReduction ?? prev.noiseReduction,
            autoTranscription: backendSettings.autoTranscription ?? prev.autoTranscription,
            confidenceThreshold: backendSettings.confidenceThreshold || prev.confidenceThreshold,
            activationKeyword: backendSettings.activationKeyword || prev.activationKeyword,
          }));
        }
      }

      // Load command history
      const commandsResponse = await fetch('/api/sync/voice?type=commands&limit=20');
      if (commandsResponse.ok) {
        const commandsData = await commandsResponse.json();
        console.log('📥 Commands response:', commandsData);
        
        if (commandsData.success && commandsData.data?.commands) {
          const backendCommands = commandsData.data.commands.map((cmd: any) => ({
            id: cmd._id,
            command: cmd.command,
            transcription: cmd.transcription,
            confidence: cmd.confidence,
            timestamp: new Date(cmd.executedAt),
            recognized: cmd.successful,
            response: cmd.response,
            intent: cmd.intent,
            successful: cmd.successful,
            responseTime: cmd.responseTime,
            errorMessage: cmd.errorMessage,
            context: cmd.context
          }));
          setVoiceCommands(backendCommands);
        }
      }
      
      console.log('✅ Voice data load completed');
    } catch (error) {
      console.error('❌ Error loading voice data:', error);
    } finally {
      loadingRef.current = false;
      setIsSyncing(false);
    }
  }, []); // Stable callback with no dependencies
  // Save voice command to backend
  const saveVoiceCommand = useCallback(async (command: VoiceCommand) => {
    try {
      const commandData = {
        sessionId: sessionIdRef.current,
        command: command.command,
        transcription: command.transcription,
        confidence: command.confidence,
        intent: command.intent,
        response: command.response,
        executedAt: command.timestamp,
        responseTime: command.responseTime,
        successful: command.successful,
        errorMessage: command.errorMessage,
        context: command.context
      };

      const response = await fetch('/api/sync/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'commands',
          data: { commands: [commandData] }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save command');
      }
    } catch (error) {
      console.error('Error saving voice command:', error);
      // Don't throw the error to prevent UI blocking
    }
  }, []);
  // Save voice settings to backend
  const saveVoiceSettings = useCallback(async (settings: VoiceSettings) => {
    try {
      const settingsData = {
        enabled: true,
        volume: settings.speechVolume,
        rate: Math.round(settings.speechRate * 150),
        voice: settings.speechVoice,
        language: settings.language,
        activationKeyword: settings.activationKeyword,
        wakeWordSensitivity: settings.wakeWordSensitivity,
        noiseReduction: settings.noiseReduction,
        autoTranscription: settings.autoTranscription,
        confidenceThreshold: settings.confidenceThreshold
      };

      const response = await fetch('/api/sync/voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'settings',
          data: settingsData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
      // Don't throw the error to prevent UI blocking
    }
  }, []);

  return {
    isSyncing,
    loadVoiceData,
    saveVoiceCommand,
    saveVoiceSettings
  };
}
