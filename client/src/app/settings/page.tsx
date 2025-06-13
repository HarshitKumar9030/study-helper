"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Download, 
  Terminal, 
  Shield, 
  Info,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

interface ApiKeyData {
  apiKey: string;
  createdAt: string;
}

const SettingsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const hasInitialized = useRef(false); // Use ref to prevent re-renders
  
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);  useEffect(() => {
    if (!session || hasInitialized.current) {
      if (!session) {
        router.push('/auth/signin');
      }
      return;
    }
    
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/profile/api-key');
        if (response.ok) {
          const data = await response.json();
          setApiKeyData(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load API key',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load API key',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        hasInitialized.current = true;
      }
    };
    
    fetchApiKey();
  }, [session, router, toast]);
  const generateNewApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/profile/api-key', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeyData(data);
        toast({
          title: 'Success',
          description: 'New API key generated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate new API key',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate new API key',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const maskedApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 6) + '•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your API key and voice assistant integration settings.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Your API key allows the Study Helper voice assistant to authenticate with our services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current API Key */}
              <div className="space-y-3">
                <Label htmlFor="api-key">Current API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyData?.apiKey || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKeyData?.apiKey || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {apiKeyData?.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(apiKeyData.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Regenerate API Key */}
              <div className="space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>                    <strong>Important:</strong> Regenerating your API key will invalidate the current key. 
                    You&apos;ll need to update any applications using the old key.
                  </AlertDescription>
                </Alert>
                
                <Button
                  variant="destructive"
                  onClick={generateNewApiKey}
                  disabled={isGenerating}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Generate New API Key
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Voice Assistant Helper
              </CardTitle>
              <CardDescription>
                Download and configure the desktop voice assistant helper application.
              </CardDescription>
            </CardHeader>            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Download functionality is temporarily disabled. Please check back later or build from source.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Windows */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Windows
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Desktop application for Windows 10/11
                      </p>
                      <Badge variant="secondary">Installer & Scripts</Badge>
                    </div>                    <Button 
                      className="flex items-center gap-2"
                      disabled
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/download/voice-assistant?platform=windows');
                          const data = await response.json();
                          
                          alert(`Download Instructions for Windows:\n\n${data.instructions.join('\n')}\n\nSetup Guide:\n${data.setupGuide}`);
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to get download information',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  {/* macOS */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        macOS
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Desktop application for macOS 10.15+
                      </p>
                      <Badge variant="secondary">Universal Binary</Badge>
                    </div>                    <Button 
                      className="flex items-center gap-2"
                      disabled
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/download/voice-assistant?platform=macos');
                          const data = await response.json();
                          alert(`Download Instructions for macOS:\n\n${data.instructions.join('\n')}\n\nSetup Guide:\n${data.setupGuide}`);
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to get download information',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  {/* Linux */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Linux
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Compatible with Ubuntu, Debian, Fedora
                      </p>
                      <Badge variant="secondary">AppImage & Scripts</Badge>
                    </div>                    <Button 
                      className="flex items-center gap-2"
                      disabled
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/api/download/voice-assistant?platform=linux';
                        link.download = 'study-helper-voice-assistant-linux.zip';
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  {/* Source Code */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Source Code
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Build from source or contribute
                      </p>
                      <Badge variant="outline">GitHub</Badge>
                    </div>
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open('https://github.com/harshitkumar9030/study-helper', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Setup Instructions */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Setup Instructions
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Download and Install</p>
                      <p className="text-sm text-muted-foreground">
                        Download the application for your operating system and follow the installation instructions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Configure API Key</p>
                      <p className="text-sm text-muted-foreground">
                        Copy your API key above and paste it into the application settings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Start Voice Assistant</p>
                      <p className="text-sm text-muted-foreground">
                        Launch the application and start using voice commands to control your study sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* API Usage Examples */}
              <div className="space-y-4">
                <h3 className="font-semibold">API Usage Examples</h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Authentication Header:</p>
                    <code className="text-xs bg-background p-2 rounded border block">
                      X-API-Key: {showApiKey ? apiKeyData?.apiKey : maskedApiKey(apiKeyData?.apiKey || '')}
                    </code>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Process Voice Command:</p>
                    <code className="text-xs bg-background p-2 rounded border block">
                      PUT /api/voice-assistant
                      <br />
                      {`{ "command": "explain newton's laws", "options": { "confidence": 0.9 } }`}
                    </code>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Sync Voice Data:</p>
                    <code className="text-xs bg-background p-2 rounded border block">
                      GET /api/voice-assistant?type=commands&limit=20
                    </code>
                  </div>
                </div>
              </div>

              {/* Documentation Link */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <div className="space-y-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Need help?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Check out our comprehensive API documentation and integration guides.
                  </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
