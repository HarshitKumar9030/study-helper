'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VoiceSettings } from './types';

interface VoiceSettingsDialogProps {
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
}

export function VoiceSettingsDialog({ settings, onSettingsChange }: VoiceSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const updateSetting = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Don't render interactive content until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <Settings className="h-4 w-4 mr-2" />
        Voice Settings
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Voice Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voice Assistant Settings</DialogTitle>
          <DialogDescription>
            Configure your voice assistant preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Speech Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Speech Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Speech Rate</Label>
                  <span className="text-sm text-muted-foreground">{settings.speechRate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[settings.speechRate]}
                  onValueChange={([value]) => updateSetting('speechRate', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Speech Volume</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(settings.speechVolume * 100)}%</span>
                </div>
                <Slider
                  value={[settings.speechVolume]}
                  onValueChange={([value]) => updateSetting('speechVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto Speak Responses</Label>
                  <p className="text-xs text-muted-foreground">Automatically read AI responses aloud</p>
                </div>
                <Switch
                  checked={settings.autoSpeak}
                  onCheckedChange={(checked) => updateSetting('autoSpeak', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Recognition Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recognition Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="it-IT">Italian</SelectItem>
                    <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                    <SelectItem value="ko-KR">Korean</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Continuous Listening</Label>
                  <p className="text-xs text-muted-foreground">Keep listening after each command</p>
                </div>
                <Switch
                  checked={settings.enableContinuousListening}
                  onCheckedChange={(checked) => updateSetting('enableContinuousListening', checked)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Confidence Threshold</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(settings.confidenceThreshold * 100)}%</span>
                </div>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={([value]) => updateSetting('confidenceThreshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Interface Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Interface</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Listening Animation</Label>
                <Select value={settings.listeningAnimation} onValueChange={(value: 'pulse' | 'wave' | 'ripple' | 'bars') => updateSetting('listeningAnimation', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pulse">Pulse</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="ripple">Ripple</SelectItem>
                    <SelectItem value="bars">Bars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Theme Aware</Label>
                  <p className="text-xs text-muted-foreground">Adapt colors to current theme</p>
                </div>
                <Switch
                  checked={settings.themeAware}
                  onCheckedChange={(checked) => updateSetting('themeAware', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Advanced Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Wake Word Sensitivity</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(settings.wakeWordSensitivity * 100)}%</span>
                </div>
                <Slider
                  value={[settings.wakeWordSensitivity]}
                  onValueChange={([value]) => updateSetting('wakeWordSensitivity', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Noise Reduction</Label>
                  <p className="text-xs text-muted-foreground">Filter background noise</p>
                </div>
                <Switch
                  checked={settings.noiseReduction}
                  onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto Transcription</Label>
                  <p className="text-xs text-muted-foreground">Automatic speech-to-text conversion</p>
                </div>
                <Switch
                  checked={settings.autoTranscription}
                  onCheckedChange={(checked) => updateSetting('autoTranscription', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
