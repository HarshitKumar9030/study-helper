"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  BookOpen,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCcw as Reset,
  Timer,
  Brain,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Star,
  MessageSquare,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { IStudyTopic, IStudyProgress } from '@/lib/models/study-tracker';
import { cn } from '@/lib/utils';

interface StudyFlowChartProps {
  topics: IStudyTopic[];
  selectedTopic: IStudyTopic | null;
  onTopicSelect: (topic: IStudyTopic) => void;
  onTopicUpdate: () => void;
}

interface StudySessionDialogProps {
  subtopic: IStudyProgress;
  topic: IStudyTopic;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function StudySessionDialog({ subtopic, topic, isOpen, onClose, onUpdate }: StudySessionDialogProps) {
  const [isStudying, setIsStudying] = useState(false);
  const [studyStartTime, setStudyStartTime] = useState<Date | null>(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [confidence, setConfidence] = useState(subtopic.confidence || 3);
  const [notes, setNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [doubt, setDoubt] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [isLoadingDoubtAnswer, setIsLoadingDoubtAnswer] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  
  // Get total time including previous sessions
  const totalTimeSpent = (subtopic.timeSpent || 0) + currentSessionTime;

  const autoSaveProgress = useCallback(async (timeSpentSeconds: number) => {
    try {
      await fetch(`/api/study-tracker/topics/${topic._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressUpdates: [{
            subtopic: subtopic.subtopic,
            timeSpent: (subtopic.timeSpent || 0) + timeSpentSeconds,
            confidence,
            status: confidence >= 4 ? 'completed' : 'in-progress',
            lastStudied: new Date()
            // Don't save notes in auto-save to avoid conflicts
          }]
        })
      });
      
      // Don't call onUpdate() for auto-save to avoid unnecessary re-renders
      setLastAutoSaveTime(new Date());
    } catch (error) {
      console.error('Error auto-saving study progress:', error);
    }
  }, [topic._id, subtopic.subtopic, subtopic.timeSpent, confidence]);

  // Timer effect with auto-save
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && studyStartTime) {
      interval = setInterval(() => {
        const newTime = Math.floor((Date.now() - studyStartTime.getTime()) / 1000);
        setCurrentSessionTime(newTime);
        
        // Auto-save every 60 seconds
        if (newTime > 0 && newTime % 60 === 0) {
          autoSaveProgress(newTime);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying, studyStartTime, autoSaveProgress]);

  const fetchAISuggestions = useCallback(async () => {
    if (isLoadingSuggestions) return;
    
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me 3 specific study tips for learning "${subtopic.subtopic}" in the context of "${topic.title}" (${topic.subject}). Focus on practical, actionable advice.`,
          context: `Study session for ${subtopic.subtopic} in ${topic.title} (${topic.subject})`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('AI response data:', data); // Debug log
        
        // Handle different possible response structures
        let messageContent = '';
        if (data.data?.message) {
          messageContent = data.data.message;
        } else if (data.message) {
          messageContent = data.message;
        } else if (data.response) {
          messageContent = data.response;
        } else {
          messageContent = JSON.stringify(data);
        }
        
        const suggestions = messageContent
          .split('\n')
          .filter((line: string) => line.trim().length > 0)
          .slice(0, 3);
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiSuggestions([
        "Break down this topic into smaller, manageable concepts",
        "Practice with examples and real-world applications", 
        "Review regularly and test your understanding"
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [subtopic.subtopic, topic.title, topic.subject, isLoadingSuggestions]);

  // Load AI suggestions on mount if not already available
  useEffect(() => {
    if (isOpen && aiSuggestions.length === 0) {
      fetchAISuggestions();
    }
    
    // Reset AI suggestions when modal closes
    if (!isOpen) {
      setAiSuggestions([]);
      setDoubt('');
      setDoubtAnswer('');
      setNotes('');
    }
  }, [isOpen, aiSuggestions.length, fetchAISuggestions]);

  const handleStartStudy = () => {
    setIsStudying(true);
    setStudyStartTime(new Date());
    setCurrentSessionTime(0);
  };

  const handleStopStudy = async () => {
    if (!studyStartTime) return;
    
    setIsStudying(false);
    const timeSpentSeconds = currentSessionTime;
    
    try {
      const response = await fetch(`/api/study-tracker/topics/${topic._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressUpdates: [{
            subtopic: subtopic.subtopic,
            timeSpent: (subtopic.timeSpent || 0) + timeSpentSeconds,
            confidence,
            status: confidence >= 4 ? 'completed' : 'in-progress',
            lastStudied: new Date(),
            notes: notes.trim() ? [...(subtopic.notes || []), { text: notes.trim(), timestamp: new Date() }] : subtopic.notes
          }]
        })
      });

      if (response.ok) {
        onUpdate();
        onClose();
        // Reset notes after successful save
        setNotes('');
      } else {
        console.error('Failed to save study session');
      }
    } catch (error) {
      console.error('Error updating study session:', error);
    }
  };

  const handleAskDoubt = async () => {
    if (!doubt.trim()) return;
    
    setIsLoadingDoubtAnswer(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I'm studying "${subtopic.subtopic}" in ${topic.subject}. My question is: ${doubt}. Please provide a clear, detailed explanation.`,
          context: `Q&A session for ${subtopic.subtopic} in ${topic.title} (${topic.subject})`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Doubt response data:', data); // Debug log
        
        // Handle different possible response structures
        let messageContent = '';
        if (data.data?.message) {
          messageContent = data.data.message;
        } else if (data.message) {
          messageContent = data.message;
        } else if (data.response) {
          messageContent = data.response;
        } else {
          messageContent = JSON.stringify(data);
        }
        
        setDoubtAnswer(messageContent);
      }
    } catch (error) {
      console.error('Error getting doubt answer:', error);
      setDoubtAnswer('Sorry, I could not process your question at this time. Please try again.');
    } finally {
      setIsLoadingDoubtAnswer(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Main Study Session Dialog - Full Screen */}
      <Dialog open={isOpen && !isDoubtModalOpen} onOpenChange={onClose}>
        <DialogContent showCloseButton={false} className="!max-w-none !h-screen !w-screen !p-0 !gap-0 !m-0 !fixed !inset-0 !z-50 !translate-x-0 !translate-y-0 !top-0 !left-0 !max-h-none !rounded-none">
          <div className="h-screen w-screen flex flex-col bg-stone-50 dark:bg-stone-950">
            {/* Header */}
            <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-stone-900 dark:text-stone-100">{subtopic.subtopic}</div>
                      <div className="text-sm text-stone-600 dark:text-stone-400 font-normal">
                        {topic.title} • {topic.subject}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="h-8 w-8 p-0 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full flex">
                {/* Left Panel - Timer and Controls */}
                <div className="w-1/2 border-r border-stone-200 dark:border-stone-800 p-8 flex flex-col">
                  {/* Timer Display */}
                  <div className="text-center mb-8">
                    <div className="mb-4">
                      <div className="text-5xl font-mono font-bold text-stone-900 dark:text-stone-100 mb-2">
                        {formatTime(currentSessionTime)}
                      </div>
                      <p className="text-stone-600 dark:text-stone-400">
                        {isStudying ? 'Current session' : 'Session timer'}
                      </p>
                      {isStudying && lastAutoSaveTime && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Auto-saved at {lastAutoSaveTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Previous time info */}
                    {subtopic.timeSpent > 0 && (
                      <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-4 mb-6">
                        <div className="text-sm text-stone-600 dark:text-stone-400 mb-1">Previous study time</div>
                        <div className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                          {formatTime(subtopic.timeSpent)}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                          Total will be: {formatTime(totalTimeSpent)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center mb-8">
                    {!isStudying ? (
                      <Button onClick={handleStartStudy} size="lg" className="gap-3 px-8 py-4 text-lg">
                        <Play className="w-5 h-5" />
                        Start Study Session
                      </Button>
                    ) : (
                      <Button onClick={handleStopStudy} variant="outline" size="lg" className="gap-3 px-8 py-4 text-lg">
                        <Pause className="w-5 h-5" />
                        End Session & Save
                      </Button>
                    )}
                  </div>

                  {/* Confidence Rating */}
                  <div className="mb-8">
                    <label className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-4 block">
                      How confident do you feel about this topic?
                    </label>
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          onClick={() => setConfidence(level)}
                          className={cn(
                            "w-12 h-12 rounded-full text-lg font-semibold transition-all",
                            level <= confidence
                              ? "bg-indigo-500 text-white ring-2 ring-indigo-200 dark:ring-indigo-800"
                              : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-stone-500 mt-2 px-2">
                      <span>Not confident</span>
                      <span>Very confident</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex-1">
                    <label className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-4 block">
                      Session Notes
                    </label>
                    
                    {/* Previous notes display */}
                    {subtopic.notes && subtopic.notes.length > 0 && (
                      <div className="mb-4 max-h-24 overflow-y-auto bg-stone-50 dark:bg-stone-800 rounded-lg p-3 border border-stone-200 dark:border-stone-700">
                        <div className="text-xs text-stone-500 mb-2">Previous notes:</div>
                        {subtopic.notes.slice(-2).map((note, index) => (
                          <div key={index} className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                            <span className="text-xs text-stone-500">
                              {new Date(note.timestamp).toLocaleDateString()} - 
                            </span>
                            {" " + note.text}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Textarea
                      value={notes}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setNotes(e.target.value);
                        }
                      }}
                      placeholder="What did you learn? Key insights, questions, or reflections..."
                      className="w-full h-32 resize-none"
                    />
                    <div className="text-xs text-stone-500 mt-2">
                      {notes.length}/500 characters
                    </div>
                  </div>
                </div>

                {/* Right Panel - AI Suggestions and Doubt */}
                <div className="w-1/2 p-8 flex flex-col">
                  {/* AI Study Tips */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                          AI Study Tips
                        </h3>
                      </div>
                      {aiSuggestions.length > 0 && (
                        <Button
                          onClick={fetchAISuggestions}
                          variant="ghost"
                          size="sm"
                          disabled={isLoadingSuggestions}
                          className="text-xs"
                        >
                          Refresh
                        </Button>
                      )}
                    </div>
                    
                    {isLoadingSuggestions ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="bg-stone-100 dark:bg-stone-800 rounded-lg p-4 animate-pulse">
                            <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-stone-300 dark:bg-stone-600 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Star className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                              <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                                {suggestion}
                              </p>
                            </div>
                          </div>
                        ))}
                        {aiSuggestions.length === 0 && !isLoadingSuggestions && (
                          <div className="text-center py-4">
                            <p className="text-stone-500 text-sm mb-3">Get personalized study tips for this topic</p>
                            <Button onClick={fetchAISuggestions} variant="outline" className="w-full" size="lg">
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Get AI Study Tips
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ask Doubt Section */}
                  <div className="border-t border-stone-200 dark:border-stone-800 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        Have a Question?
                      </h3>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
                      Ask any doubt about this topic and get instant AI-powered explanations.
                    </p>
                    <Button 
                      onClick={() => setIsDoubtModalOpen(true)} 
                      variant="outline" 
                      className="w-full"
                      size="lg"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask a Question
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Doubt Modal - Full Screen */}
      <Dialog open={isDoubtModalOpen} onOpenChange={setIsDoubtModalOpen}>
        <DialogContent showCloseButton={false} className="!max-w-none !h-screen !w-screen !p-0 !gap-0 !m-0 !fixed !inset-0 !z-50 !translate-x-0 !translate-y-0 !top-0 !left-0 !max-h-none !rounded-none">
          <div className="h-screen w-screen flex flex-col bg-stone-50 dark:bg-stone-950">
            {/* Header */}
            <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-indigo-500" />
                    <div>
                      <div className="text-stone-900 dark:text-stone-100">Ask About: {subtopic.subtopic}</div>
                      <div className="text-sm text-stone-600 dark:text-stone-400 font-normal">
                        Get instant AI-powered explanations
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsDoubtModalOpen(false)}
                    className="h-8 w-8 p-0 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Question Input */}
                <div>
                  <label className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-4 block">
                    What would you like to know?
                  </label>
                  <Textarea
                    value={doubt}
                    onChange={(e) => setDoubt(e.target.value)}
                    placeholder="Type your question here... For example: 'Can you explain this concept with an example?' or 'I don't understand how this works'"
                    className="w-full h-32 text-base"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => setIsDoubtModalOpen(false)} variant="outline">
                      Back to Study Session
                    </Button>
                    <Button 
                      onClick={handleAskDoubt} 
                      disabled={!doubt.trim() || isLoadingDoubtAnswer}
                      className="gap-2"
                    >
                      {isLoadingDoubtAnswer ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Getting Answer...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          Get AI Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Answer Display */}
                {doubtAnswer && (
                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">AI Answer</h3>
                    </div>
                    <div className="prose prose-stone dark:prose-invert max-w-none">
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                        {doubtAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudyFlowChart({ topics, selectedTopic, onTopicSelect, onTopicUpdate }: StudyFlowChartProps) {
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<{ subtopic: IStudyProgress; topic: IStudyTopic } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubtopicClick = (subtopic: IStudyProgress, topic: IStudyTopic) => {
    setSelectedSubtopic({ subtopic, topic });
    setStudyDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
      case 'in-progress': return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300';
      case 'needs-review': return 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
      default: return 'border-stone-300 bg-stone-50 dark:bg-stone-900 dark:border-stone-700 text-stone-600 dark:text-stone-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'in-progress': return <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'needs-review': return <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default: return <Circle className="w-4 h-4 text-stone-400" />;
    }
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            No topics to display
          </h3>
          <p className="text-stone-600 dark:text-stone-400">
            Create some study topics to see them in flowchart view
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-stone-50 dark:bg-stone-900 rounded-lg overflow-hidden relative border border-stone-200 dark:border-stone-700">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
          className="gap-1"
        >
          <ZoomIn className="w-3 h-3" />
          Zoom In
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}
          className="gap-1"
        >
          <ZoomOut className="w-3 h-3" />
          Zoom Out
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setZoom(1); setPan({ x: 50, y: 50 }); }}
          className="gap-1"
        >
          <Reset className="w-3 h-3" />
          Reset
        </Button>
      </div>

      {/* GitHub Actions-like Workflow */}
      <div 
        ref={containerRef}
        className="h-full p-6 overflow-auto"
        style={{ minHeight: "calc(100vh - 350px)" }}
      >
        <div 
          className="transition-transform origin-top-left"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            minWidth: '100%'
          }}
        >
          {/* GitHub Actions Workflow Style */}
          <div className="space-y-8">
            {topics.map((topic, topicIndex) => (
              <div key={topic._id} className="relative">
                {/* Topic Header (Job) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: topicIndex * 0.1 }}
                  className={cn(
                    "bg-white dark:bg-stone-800 border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all",
                    selectedTopic?._id === topic._id 
                      ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800" 
                      : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                  )}
                  onClick={() => onTopicSelect(topic)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                          {topic.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {topic.subject}
                          </Badge>
                          <span className="text-xs text-stone-500">
                            {topic.estimatedHours}h estimated
                          </span>
                          <span className="text-xs text-stone-500">
                            {topic.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="text-right">
                      <div className="text-sm font-medium text-stone-600 dark:text-stone-400">
                        {topic.progress?.filter(p => p.status === 'completed').length || 0} / {topic.progress?.length || 0}
                      </div>
                      <div className="text-xs text-stone-500">completed</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <Progress 
                      value={Math.round(((topic.progress?.filter(p => p.status === 'completed').length || 0) / (topic.progress?.length || 1)) * 100)} 
                      className="h-2" 
                    />
                  </div>
                </motion.div>

                {/* Subtopic Steps */}
                {topic.progress && topic.progress.length > 0 && (
                  <div className="ml-8 mt-4 space-y-3">
                    {/* Vertical line */}
                    <div className="absolute left-[2.75rem] top-20 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-700"></div>
                    
                    {topic.progress.map((progressItem, stepIndex) => (
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: topicIndex * 0.1 + stepIndex * 0.05 }}
                        className="relative"
                      >
                        {/* Step connector */}
                        <div className="absolute -left-8 top-4 w-6 h-0.5 bg-stone-200 dark:bg-stone-700"></div>
                        <div className="absolute -left-9 top-3 w-2 h-2 bg-stone-300 dark:bg-stone-600 rounded-full"></div>
                        
                        {/* Step card */}
                        <Card 
                          className={cn(
                            "cursor-pointer hover:shadow-md transition-all border-l-4",
                            getStatusColor(progressItem.status)
                          )}
                          onClick={() => handleSubtopicClick(progressItem, topic)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {getStatusIcon(progressItem.status)}
                                <div className="flex-1">
                                  <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-1">
                                    {progressItem.subtopic}
                                  </h4>
                                  <div className="flex items-center gap-4 text-xs text-stone-500">
                                    <span className="flex items-center gap-1">
                                      <Timer className="w-3 h-3" />
                                      {Math.floor((progressItem.timeSpent || 0) / 60)}m {(progressItem.timeSpent || 0) % 60}s
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Brain className="w-3 h-3" />
                                      {progressItem.confidence || 3}/5
                                    </span>
                                    {progressItem.lastStudied && (
                                      <span>
                                        Last: {new Date(progressItem.lastStudied).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubtopicClick(progressItem, topic);
                                }}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            {progressItem.status === 'in-progress' && (
                              <div className="mt-2">
                                <Progress 
                                  value={(progressItem.confidence || 3) * 20} 
                                  className="h-1"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Session Dialog */}
      {selectedSubtopic && (
        <StudySessionDialog
          subtopic={selectedSubtopic.subtopic}
          topic={selectedSubtopic.topic}
          isOpen={studyDialogOpen}
          onClose={() => {
            setStudyDialogOpen(false);
            setSelectedSubtopic(null);
          }}
          onUpdate={onTopicUpdate}
        />
      )}
    </div>
  );
}
