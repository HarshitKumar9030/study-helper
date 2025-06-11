'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Plus,
  X,
  Clock,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FocusSession {
  sessionId?: string;
  title?: string;
  duration: number; // in minutes
  breakDuration: number; // in minutes
  strictMode: boolean;
  blockedSites: string[];
  startTime?: Date;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining?: number; // in seconds
  productivity?: {
    distractionCount: number;
    sitesBlocked: number;
    appsBlocked: number;
    focusScore?: number;
  };
}

interface FocusSettings {
  defaultDuration: number;
  defaultBreakDuration: number;
  strictMode: boolean;
  blockedSites: string[];
  presets: Array<{
    name: string;
    duration: number;
    blockedSites: string[];
    strictMode: boolean;
  }>;
  statistics: {
    totalSessions: number;
    totalFocusTime: number;
    averageSessionLength: number;
    currentStreak: number;
  };
}

interface FocusModeProps {
  className?: string;
}

export default function FocusMode({ className = '' }: FocusModeProps) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [session, setSession] = useState<FocusSession>({
    duration: 25,
    breakDuration: 5,
    strictMode: false,
    blockedSites: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'],
    isActive: false,
    isPaused: false
  });
  
  const [settings, setSettings] = useState<FocusSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSite, setNewSite] = useState('');
  const [showBlockedSites, setShowBlockedSites] = useState(true);
  const [timeDisplay, setTimeDisplay] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  // Load focus settings from API
  useEffect(() => {
    loadFocusSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFocusSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
          setSession(prev => ({
            ...prev,
            duration: data.settings.defaultDuration,
            breakDuration: data.settings.defaultBreakDuration,
            strictMode: data.settings.strictMode,
            blockedSites: data.settings.blockedSites
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load focus settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load focus settings',
        variant: 'destructive'
      });
    }
  };

  const createFocusSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/focus/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: session.title || `Focus Session - ${new Date().toLocaleTimeString()}`,
          plannedDuration: session.duration,
          blockedSites: session.blockedSites,
          strictMode: session.strictMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSession(prev => ({
            ...prev,
            sessionId: data.session.sessionId,
            startTime: new Date(data.session.startTime),
            timeRemaining: session.duration * 60,
            isActive: true,
            isPaused: false,
            productivity: data.session.productivity
          }));
          
          toast({
            title: 'Focus Session Started',
            description: `${session.duration} minute session has begun`
          });
        }
      }
    } catch (error) {
      console.error('Failed to create focus session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start focus session',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFocusSession = async (action: string, data?: any) => {
    if (!session.sessionId) return;

    try {
      const response = await fetch(`/api/focus/sessions/${session.sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.session;
        }
      }
    } catch (error) {
      console.error('Failed to update focus session:', error);
    }
  };

  const updateFocusSettings = async (newSettings: Partial<FocusSettings>) => {
    try {
      const response = await fetch('/api/focus/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to update focus settings:', error);
      return false;
    }
  };
  // Handle session completion
  const handleSessionComplete = useCallback(async () => {
    unblockSites();
    
    // Update the session in the backend
    if (session.sessionId) {
      await updateFocusSession('complete');
    }
    
    toast({
      title: "🎉 Session completed!",
      description: `Great job! You've completed your ${session.duration}-minute focus session. Time for a ${session.breakDuration}-minute break!`,
    });

    // Reload settings to get updated statistics
    await loadFocusSettings();
  }, [session.sessionId, session.duration, session.breakDuration, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update timer display
  useEffect(() => {
    if (session.isActive && !session.isPaused && session.timeRemaining !== undefined) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          const newTimeRemaining = Math.max(0, (prev.timeRemaining || 0) - 1);
          
          if (newTimeRemaining === 0) {
            // Session completed
            handleSessionComplete();
            return { ...prev, timeRemaining: 0, isActive: false };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.isActive, session.isPaused, handleSessionComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update time display and progress
  useEffect(() => {
    if (session.timeRemaining !== undefined) {
      setTimeDisplay(formatTime(session.timeRemaining));
      const totalTime = session.duration * 60;
      const elapsed = totalTime - session.timeRemaining;
      setProgress((elapsed / totalTime) * 100);
    } else {
      setTimeDisplay(formatTime(session.duration * 60));
      setProgress(0);
    }
  }, [session.timeRemaining, session.duration]);
  const handleStartSession = async () => {
    await createFocusSession();
    blockSites();
  };
  const handlePauseSession = async () => {
    const newPausedState = !session.isPaused;
    
    // Update session in backend
    if (session.sessionId) {
      await updateFocusSession(newPausedState ? 'pause' : 'resume');
    }

    setSession(prev => ({
      ...prev,
      isPaused: newPausedState
    }));

    toast({
      title: newPausedState ? "Session paused" : "Session resumed",
      description: newPausedState ? "Take a breather, but don't lose momentum!" : "Back to focused work!",
    });
  };
  const handleStopSession = async () => {
    // Update session in backend
    if (session.sessionId) {
      await updateFocusSession('cancel');
    }

    setSession(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeRemaining: undefined,
      startTime: undefined
    }));

    unblockSites();
    
    toast({
      title: "Session ended",
      description: "You've successfully ended your focus session.",
    });
  };

  const handleResetSession = () => {
    if (session.isActive) {
      handleStopSession();
    }
    
    setSession(prev => ({
      ...prev,
      timeRemaining: undefined
    }));
    
    setProgress(0);
    setTimeDisplay(formatTime(session.duration * 60));  };

  const blockSites = () => {
    // In a real implementation, this would integrate with:
    // - Browser extensions (Chrome/Firefox)
    // - System hosts file (with proper permissions)
    // - Router-level blocking
    // - Third-party blocking services
    
    console.log('Blocking sites:', session.blockedSites);
    
    // For demo purposes, we'll just show a toast
    toast({
      title: "Sites blocked",
      description: `${session.blockedSites.length} distracting sites are now blocked.`,
    });
  };

  const unblockSites = () => {
    console.log('Unblocking sites:', session.blockedSites);
    
    toast({
      title: "Sites unblocked",
      description: "All blocked sites are now accessible again.",
    });
  };
  const addBlockedSite = () => {
    if (!newSite.trim()) return;
    
    // Clean up the URL
    const cleanSite = newSite.trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    
    if (!session.blockedSites.includes(cleanSite)) {
      setSession(prev => ({
        ...prev,
        blockedSites: [...prev.blockedSites, cleanSite]
      }));
      
      setNewSite('');
      
      toast({
        title: "Site blocked",
        description: `${cleanSite} has been added to your blocked sites list.`,
      });
    }
  };

  const removeBlockedSite = (site: string) => {
    setSession(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(s => s !== site)
    }));
    
    toast({
      title: "Site unblocked",
      description: `${site} has been removed from your blocked sites list.`,
    });
  };

  const addPresetSites = (type: 'social' | 'entertainment') => {
    const presets = {
      social: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'snapchat.com', 'linkedin.com'],
      entertainment: ['youtube.com', 'netflix.com', 'hulu.com', 'disney.com', 'twitch.tv', 'reddit.com']
    };
    
    const newSites = presets[type].filter(site => !session.blockedSites.includes(site));
    
    if (newSites.length > 0) {
      setSession(prev => ({
        ...prev,
        blockedSites: [...prev.blockedSites, ...newSites]
      }));
      
      toast({
        title: `${type === 'social' ? 'Social Media' : 'Entertainment'} sites blocked`,
        description: `Added ${newSites.length} ${type} sites to your blocked list.`,
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Focus Mode</h1>
          <p className="text-gray-600">Block distractions and stay focused on your goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Focus Timer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer Display */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-mono font-bold text-orange-500">
                {timeDisplay}
              </div>
              <Progress value={progress} className="w-full h-3" />
              {session.isActive && (
                <Badge variant={session.isPaused ? "secondary" : "default"}>
                  {session.isPaused ? "Paused" : "Active"}
                </Badge>
              )}
            </div>

            {/* Session Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="480"
                    value={session.duration}
                    onChange={(e) => setSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 25 }))}
                    disabled={session.isActive}
                  />
                </div>
                <div>
                  <Label htmlFor="break">Break (minutes)</Label>
                  <Input
                    id="break"
                    type="number"
                    min="1"
                    max="60"
                    value={session.breakDuration}
                    onChange={(e) => setSession(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 5 }))}
                    disabled={session.isActive}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="strict-mode">Strict mode (harder to disable)</Label>
                <Switch
                  id="strict-mode"
                  checked={session.strictMode}
                  onCheckedChange={(checked) => setSession(prev => ({ ...prev, strictMode: checked }))}
                  disabled={session.isActive}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-3">
              {!session.isActive ? (
                <Button 
                  onClick={handleStartSession} 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Focus Session
                </Button>
              ) : (
                <Button 
                  onClick={handleStopSession} 
                  variant="destructive" 
                  className="w-full"
                  size="lg"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop Session
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handlePauseSession}
                  variant="outline"
                  disabled={!session.isActive}
                >
                  {session.isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleResetSession}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Status */}
            {session.isActive && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-orange-800">
                    Focus mode is active - {session.blockedSites.length} sites blocked
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked Sites Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Blocked Sites</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockedSites(!showBlockedSites)}
              >
                {showBlockedSites ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Site */}
            <div className="flex space-x-2">
              <Input
                placeholder="Enter website (e.g., facebook.com)"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addBlockedSite()}
                disabled={session.isActive && session.strictMode}
              />
              <Button 
                onClick={addBlockedSite}
                disabled={session.isActive && session.strictMode}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Quick presets:</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPresetSites('social')}
                  disabled={session.isActive && session.strictMode}
                >
                  Social Media
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPresetSites('entertainment')}
                  disabled={session.isActive && session.strictMode}
                >
                  Entertainment
                </Button>
              </div>
            </div>

            <Separator />

            {/* Blocked Sites List */}
            {showBlockedSites && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <Label>Blocked sites ({session.blockedSites.length}):</Label>
                {session.blockedSites.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No sites blocked yet</p>
                ) : (
                  <div className="space-y-2">
                    {session.blockedSites.map((site, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">{site}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlockedSite(site)}
                          disabled={session.isActive && session.strictMode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {session.strictMode && session.isActive && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Strict mode:</strong> Sites list cannot be modified during an active session.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>      {/* Session Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Session Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {settings?.statistics?.totalSessions || 0}
              </div>
              <div className="text-sm text-blue-600">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {settings?.statistics?.totalFocusTime || 0}
              </div>
              <div className="text-sm text-green-600">Minutes Focused</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {settings?.statistics?.currentStreak || 0}
              </div>
              <div className="text-sm text-purple-600">Day Streak</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {settings?.statistics?.averageSessionLength || 0}
              </div>
              <div className="text-sm text-orange-600">Avg Length (min)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
