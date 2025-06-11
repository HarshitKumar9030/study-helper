"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings,
  Mic,
  Focus,
  Palette,
  Bell,
  Shield,
  Database,
  Volume2,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from "lucide-react";

interface SettingsConfig {
  general: {
    autoSave: boolean;
    autoSaveInterval: number;
    notifications: boolean;
    soundEnabled: boolean;
    startupBehavior: 'dashboard' | 'lastPage' | 'scheduler';
  };
  voice: {
    enabled: boolean;
    speechRate: number;
    speechVolume: number;
    voice: string;
    language: string;
    wakeWord: string;
    continuousListening: boolean;
  };
  focus: {
    defaultSessionLength: number;
    breakLength: number;
    strictMode: boolean;
    websiteBlocking: boolean;
    notificationBlocking: boolean;
    allowBreaks: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    colorScheme: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    animations: boolean;
  };
  sync: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    lastSync: string | null;
  };
}

const defaultSettings: SettingsConfig = {
  general: {
    autoSave: true,
    autoSaveInterval: 5,
    notifications: true,
    soundEnabled: true,
    startupBehavior: 'dashboard'
  },
  voice: {
    enabled: true,
    speechRate: 1.0,
    speechVolume: 0.8,
    voice: 'default',
    language: 'en-US',
    wakeWord: 'hey study',
    continuousListening: false
  },
  focus: {
    defaultSessionLength: 25,
    breakLength: 5,
    strictMode: false,
    websiteBlocking: true,
    notificationBlocking: true,
    allowBreaks: true
  },
  appearance: {
    theme: 'system',
    colorScheme: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true
  },
  sync: {
    enabled: true,
    autoSync: true,
    syncInterval: 15,
    lastSync: null
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('study-helper-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('study-helper-settings', JSON.stringify(settings));
      
      // Here you would also sync with the backend
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) });
      
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Settings reset to defaults');
  };

  const updateSetting = (section: keyof SettingsConfig, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'study-helper-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Settings exported successfully!');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
        toast.success('Settings imported successfully!');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Customize your Study Helper experience
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button
                onClick={resetSettings}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            )}
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <Settings className="h-4 w-4" />
                <span className="font-medium">You have unsaved changes</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">⚙️ General</TabsTrigger>
            <TabsTrigger value="voice">🎤 Voice</TabsTrigger>
            <TabsTrigger value="focus">🎯 Focus</TabsTrigger>
            <TabsTrigger value="appearance">🎨 Appearance</TabsTrigger>
            <TabsTrigger value="sync">🔄 Sync</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application Settings
                </CardTitle>
                <CardDescription>
                  Configure general application behavior and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-save</Label>
                    <p className="text-sm text-gray-600">
                      Automatically save your work
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.autoSave}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'autoSave', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Auto-save interval</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.general.autoSaveInterval]}
                      onValueChange={([value]) => 
                        updateSetting('general', 'autoSaveInterval', value)
                      }
                      max={60}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {settings.general.autoSaveInterval} minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.notifications}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sound effects</Label>
                    <p className="text-sm text-gray-600">
                      Play sounds for actions and notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.soundEnabled}
                    onCheckedChange={(checked) => 
                      updateSetting('general', 'soundEnabled', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Startup behavior</Label>
                  <Select
                    value={settings.general.startupBehavior}
                    onValueChange={(value) => 
                      updateSetting('general', 'startupBehavior', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="lastPage">Last opened page</SelectItem>
                      <SelectItem value="scheduler">Scheduler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Button onClick={exportSettings} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Settings
                    </Button>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button asChild variant="outline" className="flex items-center gap-2">
                      <label htmlFor="import-settings">
                        <Upload className="h-4 w-4" />
                        Import Settings
                      </label>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-red-600">Danger Zone</Label>
                    <p className="text-sm text-gray-600">
                      Clear all application data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (confirm('This will clear all your data. Are you sure?')) {
                        localStorage.clear();
                        toast.success('All data cleared');
                        window.location.reload();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Settings */}
          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice Recognition
                </CardTitle>
                <CardDescription>
                  Configure speech recognition and voice commands
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Voice commands</Label>
                    <p className="text-sm text-gray-600">
                      Enable voice command recognition
                    </p>
                  </div>
                  <Switch
                    checked={settings.voice.enabled}
                    onCheckedChange={(checked) => 
                      updateSetting('voice', 'enabled', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wake word</Label>
                  <Input
                    value={settings.voice.wakeWord}
                    onChange={(e) => updateSetting('voice', 'wakeWord', e.target.value)}
                    placeholder="hey study"
                  />
                  <p className="text-xs text-gray-500">
                    Say this phrase to activate voice commands
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.voice.language}
                    onValueChange={(value) => updateSetting('voice', 'language', value)}
                  >
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Continuous listening</Label>
                    <p className="text-sm text-gray-600">
                      Keep listening for commands without wake word
                    </p>
                  </div>
                  <Switch
                    checked={settings.voice.continuousListening}
                    onCheckedChange={(checked) => 
                      updateSetting('voice', 'continuousListening', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Text-to-Speech
                </CardTitle>
                <CardDescription>
                  Configure voice output settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Speech rate</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.voice.speechRate]}
                      onValueChange={([value]) => 
                        updateSetting('voice', 'speechRate', value)
                      }
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {settings.voice.speechRate}x
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Speech volume</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.voice.speechVolume]}
                      onValueChange={([value]) => 
                        updateSetting('voice', 'speechVolume', value)
                      }
                      max={1}
                      min={0}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {Math.round(settings.voice.speechVolume * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Focus Mode Settings */}
          <TabsContent value="focus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Focus className="h-5 w-5" />
                  Focus Sessions
                </CardTitle>
                <CardDescription>
                  Configure focus mode behavior and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default session length</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.focus.defaultSessionLength]}
                      onValueChange={([value]) => 
                        updateSetting('focus', 'defaultSessionLength', value)
                      }
                      max={120}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {settings.focus.defaultSessionLength} minutes
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Break length</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.focus.breakLength]}
                      onValueChange={([value]) => 
                        updateSetting('focus', 'breakLength', value)
                      }
                      max={30}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {settings.focus.breakLength} minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Strict mode</Label>
                    <p className="text-sm text-gray-600">
                      Prevent session modifications once started
                    </p>
                  </div>
                  <Switch
                    checked={settings.focus.strictMode}
                    onCheckedChange={(checked) => 
                      updateSetting('focus', 'strictMode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Website blocking</Label>
                    <p className="text-sm text-gray-600">
                      Block distracting websites during sessions
                    </p>
                  </div>
                  <Switch
                    checked={settings.focus.websiteBlocking}
                    onCheckedChange={(checked) => 
                      updateSetting('focus', 'websiteBlocking', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notification blocking</Label>
                    <p className="text-sm text-gray-600">
                      Block all notifications during focus sessions
                    </p>
                  </div>
                  <Switch
                    checked={settings.focus.notificationBlocking}
                    onCheckedChange={(checked) => 
                      updateSetting('focus', 'notificationBlocking', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow breaks</Label>
                    <p className="text-sm text-gray-600">
                      Allow manual breaks during sessions
                    </p>
                  </div>
                  <Switch
                    checked={settings.focus.allowBreaks}
                    onCheckedChange={(checked) => 
                      updateSetting('focus', 'allowBreaks', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Display
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value) => 
                      updateSetting('appearance', 'theme', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font size</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value) => 
                      updateSetting('appearance', 'fontSize', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compact mode</Label>
                    <p className="text-sm text-gray-600">
                      Use less spacing for a more compact interface
                    </p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => 
                      updateSetting('appearance', 'compactMode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Animations</Label>
                    <p className="text-sm text-gray-600">
                      Enable smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.appearance.animations}
                    onCheckedChange={(checked) => 
                      updateSetting('appearance', 'animations', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Settings */}
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Data Synchronization
                </CardTitle>
                <CardDescription>
                  Sync your data across devices and platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable sync</Label>
                    <p className="text-sm text-gray-600">
                      Synchronize data with cloud storage
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync.enabled}
                    onCheckedChange={(checked) => 
                      updateSetting('sync', 'enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-sync</Label>
                    <p className="text-sm text-gray-600">
                      Automatically sync changes in the background
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync.autoSync}
                    onCheckedChange={(checked) => 
                      updateSetting('sync', 'autoSync', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sync interval</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.sync.syncInterval]}
                      onValueChange={([value]) => 
                        updateSetting('sync', 'syncInterval', value)
                      }
                      max={60}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="min-w-0 text-sm text-gray-600">
                      {settings.sync.syncInterval} minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sync status</Label>
                    <p className="text-sm text-gray-600">
                      {settings.sync.lastSync 
                        ? `Last synced: ${new Date(settings.sync.lastSync).toLocaleString()}`
                        : 'Never synced'
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateSetting('sync', 'lastSync', new Date().toISOString());
                      toast.success('Sync completed!');
                    }}
                  >
                    Sync Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
