'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogBody,
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
  
  const updateSetting = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Voice Settings
        </Button>
      </DialogTrigger>      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Voice Assistant Settings</DialogTitle>
          <DialogDescription>
            Configure your voice assistant preferences and behavior.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Basic Speech Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Speech Settings</h3>
              
              <div className="space-y-2">
                <Label>Speech Rate: {settings.speechRate.toFixed(1)}x</Label>
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
                <Label>Speech Volume: {Math.round(settings.speechVolume * 100)}%</Label>
                <Slider
                  value={[settings.speechVolume]}
                  onValueChange={([value]) => updateSetting('speechVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Quality</Label>
                <Select value={settings.voiceQuality} onValueChange={(value: 'standard' | 'enhanced' | 'premium') => updateSetting('voiceQuality', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voice Gender</Label>
                <Select value={settings.voiceGender} onValueChange={(value: 'female' | 'male' | 'neutral') => updateSetting('voiceGender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto Speak Responses</Label>
                <Switch
                  checked={settings.autoSpeak}
                  onCheckedChange={(checked) => updateSetting('autoSpeak', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Basic Recognition Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recognition Settings</h3>
              
              <div className="space-y-2">
                <Label>Language</Label>
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

              <div className="flex items-center justify-between">
                <Label>Continuous Listening</Label>
                <Switch
                  checked={settings.enableContinuousListening}
                  onCheckedChange={(checked) => updateSetting('enableContinuousListening', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* UI Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interface</h3>
              
              <div className="space-y-2">
                <Label>Listening Animation</Label>
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

              <div className="flex items-center justify-between">
                <Label>Theme Aware</Label>
                <Switch
                  checked={settings.themeAware}
                  onCheckedChange={(checked) => updateSetting('themeAware', checked)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6 mt-6">
            {/* Advanced Recognition Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Advanced Settings</h3>
              </div>
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                ⚠️ <strong>Warning:</strong> These settings affect recognition accuracy. Only modify if you understand their impact.
              </div>
              
              <div className="space-y-2">
                <Label>
                  Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
                  <span className="text-xs text-muted-foreground ml-2">
                    (Lower = more sensitive, Higher = more accurate)
                  </span>
                </Label>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={([value]) => updateSetting('confidenceThreshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Wake Word Sensitivity: {Math.round(settings.wakeWordSensitivity * 100)}%
                  <span className="text-xs text-muted-foreground ml-2">
                    (How easily wake words are detected)
                  </span>
                </Label>
                <Slider
                  value={[settings.wakeWordSensitivity]}
                  onValueChange={([value]) => updateSetting('wakeWordSensitivity', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Noise Reduction</Label>
                  <p className="text-xs text-muted-foreground">Filter background noise</p>
                </div>
                <Switch
                  checked={settings.noiseReduction}
                  onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Transcription</Label>
                  <p className="text-xs text-muted-foreground">Automatic speech-to-text conversion</p>
                </div>
                <Switch
                  checked={settings.autoTranscription}
                  onCheckedChange={(checked) => updateSetting('autoTranscription', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Voice Quality Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Voice Quality</h3>
              
              <div className="space-y-2">
                <Label>Voice Quality</Label>
                <Select value={settings.voiceQuality} onValueChange={(value: 'standard' | 'enhanced') => updateSetting('voiceQuality', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>            </TabsContent>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
