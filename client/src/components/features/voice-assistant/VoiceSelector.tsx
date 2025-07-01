'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Volume2, 
  Play, 
  Pause, 
  Check,
  Filter,
  Globe,
  User,
  Sparkles
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';

interface Voice {
  name: string;
  lang: string;
  gender: 'female' | 'male' | 'neutral';
  quality: 'standard' | 'enhanced' | 'premium';
  region: string;
  voiceURI: string;
  localService: boolean;
  default: boolean;
}

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceURI: string) => void;
  onTestVoice?: (voiceURI: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  onTestVoice,
  disabled = false 
}: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log('Loading voices:', availableVoices.length, availableVoices);
        
        const processedVoices: Voice[] = availableVoices.map(voice => {
          // Extract gender from voice name (heuristic)
          const name = voice.name.toLowerCase();
          let gender: 'female' | 'male' | 'neutral' = 'neutral';
          
          if (name.includes('female') || name.includes('woman') || 
              name.includes('anna') || name.includes('emma') || name.includes('sara') ||
              name.includes('victoria') || name.includes('zoe') || name.includes('ava') ||
              name.includes('samantha') || name.includes('alice') || name.includes('karen') ||
              name.includes('susan') || name.includes('allison') || name.includes('kathy')) {
            gender = 'female';
          } else if (name.includes('male') || name.includes('man') || 
                     name.includes('daniel') || name.includes('alex') || name.includes('thomas') ||
                     name.includes('fred') || name.includes('jorge') || name.includes('aaron') ||
                     name.includes('david') || name.includes('mark') || name.includes('tom') ||
                     name.includes('oliver') || name.includes('arthur') || name.includes('albert')) {
            gender = 'male';
          }

          // Determine quality based on voice characteristics
          let quality: 'standard' | 'enhanced' | 'premium' = 'standard';
          if (voice.localService) {
            quality = name.includes('premium') || name.includes('enhanced') || 
                     name.includes('neural') || name.includes('wavenet') || 
                     name.includes('natural') || name.includes('compact') ? 'premium' : 'enhanced';
          }

          // Extract region from language code
          const region = voice.lang.includes('-') ? 
            voice.lang.split('-')[1].toUpperCase() : 
            voice.lang.toUpperCase();

          return {
            name: voice.name,
            lang: voice.lang,
            gender,
            quality,
            region,
            voiceURI: voice.voiceURI,
            localService: voice.localService,
            default: voice.default
          };
        });

        console.log('Processed voices:', processedVoices.length, processedVoices);
        setVoices(processedVoices);
      }
    };

    // Load voices immediately
    loadVoices();

    // Also load when voices change (some browsers load them asynchronously)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // Force reload voices for Chrome and other browsers that load asynchronously
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length === 0) {
          loadVoices();
        }
      }, 100);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Filter voices based on search and filters
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           voice.lang.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           voice.region.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGender = genderFilter === 'all' || voice.gender === genderFilter;
      const matchesQuality = qualityFilter === 'all' || voice.quality === qualityFilter;
      const matchesLanguage = languageFilter === 'all' || voice.lang.startsWith(languageFilter);

      return matchesSearch && matchesGender && matchesQuality && matchesLanguage;
    });
  }, [voices, searchQuery, genderFilter, qualityFilter, languageFilter]);

  // Get unique languages for filter
  const uniqueLanguages = useMemo(() => {
    const langs = new Set(voices.map(v => v.lang.split('-')[0]));
    return Array.from(langs).sort();
  }, [voices]);

  // Get currently selected voice details
  const currentVoice = voices.find(v => v.voiceURI === selectedVoice);

  // Test voice function
  const handleTestVoice = async (voiceURI: string) => {
    if (testingVoice || !onTestVoice) return;
    
    setTestingVoice(voiceURI);
    
    try {
      await onTestVoice(voiceURI);
      // Wait a bit for the speech to finish
      setTimeout(() => setTestingVoice(null), 2000);
    } catch (error) {
      setTestingVoice(null);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'enhanced': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'female': return '♀';
      case 'male': return '♂';
      default: return '⚬';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start text-left h-auto p-3 hover:bg-accent/50 transition-colors"
          disabled={disabled}
        >
          <div className="flex items-center gap-3 w-full">
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {currentVoice?.name || 'Select Voice'}
              </div>
              {currentVoice && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={`text-xs ${getQualityColor(currentVoice.quality)}`}>
                    {currentVoice.quality}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getGenderIcon(currentVoice.gender)} {currentVoice.region}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Choose Voice
          </DialogTitle>
          <DialogDescription>
            Select a voice for text-to-speech. Higher quality voices provide better clarity.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            <Input
              placeholder="Search voices by name, language, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="female">♀ Female</SelectItem>
                    <SelectItem value="male">♂ Male</SelectItem>
                    <SelectItem value="neutral">⚬ Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quality</Label>
                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Language</Label>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueLanguages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Results</Label>
                <div className="h-9 flex items-center px-3 text-sm bg-muted rounded-md">
                  {filteredVoices.length} voices
                </div>
              </div>
            </div>
          </div>

          {/* Voice List */}
          <ScrollArea className="h-[450px] w-full border rounded-lg">
            <div className="p-3">
              {voices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Volume2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">Loading voices...</p>
                  <p className="text-sm">Please wait while we load available voices from your system.</p>
                </div>
              ) : filteredVoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No voices match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria or filters above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredVoices.map((voice) => (
                    <div 
                      key={voice.voiceURI}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm',
                        selectedVoice === voice.voiceURI 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-border/60'
                      )}
                      onClick={() => onVoiceChange(voice.voiceURI)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm truncate">{voice.name}</h4>
                            {selectedVoice === voice.voiceURI && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            {voice.default && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">Default</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="secondary" 
                              className={cn('text-xs px-2 py-0.5', getQualityColor(voice.quality))}
                            >
                              {voice.quality}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getGenderIcon(voice.gender)} {voice.gender}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {voice.lang}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {voice.localService && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Local
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {voice.region}
                            </span>
                          </div>
                        </div>

                        {onTestVoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestVoice(voice.voiceURI);
                            }}
                            disabled={testingVoice !== null}
                          >
                            {testingVoice === voice.voiceURI ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
