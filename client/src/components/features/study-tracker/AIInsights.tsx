"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lightbulb, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { IStudyTopic, IAISuggestion } from '@/lib/models/study-tracker';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  topic: IStudyTopic;
  onClose: () => void;
  onUpdate: () => void;
}

export function AIInsights({ topic, onClose, onUpdate }: AIInsightsProps) {
  const [aiSuggestions, setAiSuggestions] = useState<IAISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!topic._id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/study-tracker/topics/${topic._id}/ai-suggestions`);
        if (response.ok) {
          const suggestions = await response.json();
          setAiSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAISuggestions();
  }, [topic._id]);

  const generateNewSuggestions = async () => {
    if (!topic._id) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/study-tracker/topics/${topic._id}/generate-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicData: topic,
          forceRegenerate: true
        }),
      });

      if (response.ok) {
        const newSuggestions = await response.json();
        setAiSuggestions(newSuggestions);
        onUpdate();
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const markSuggestionAsImplemented = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/study-tracker/suggestions/${suggestionId}/implement`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setAiSuggestions(prev => 
          prev.map(suggestion => 
            suggestion._id === suggestionId 
              ? { ...suggestion, isImplemented: true }
              : suggestion
          )
        );
      }
    } catch (error) {
      console.error('Error marking suggestion as implemented:', error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="w-4 h-4" />;
      case 'resource': return <BookOpen className="w-4 h-4" />;
      case 'practice': return <Target className="w-4 h-4" />;
      case 'review': return <RefreshCw className="w-4 h-4" />;
      case 'motivation': return <Sparkles className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'tip': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'resource': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'practice': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'review': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'motivation': return 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/20';
      default: return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const completedProgress = topic.progress?.filter(p => p.status === 'completed').length || 0;
  const totalProgress = topic.progress?.length || 1;
  const progressPercentage = Math.round((completedProgress / totalProgress) * 100);
  
  const totalTimeSpent = topic.progress?.reduce((acc, p) => acc + (p.timeSpent || 0), 0) || 0;
  const averageConfidence = topic.progress?.length > 0 
    ? topic.progress.reduce((acc, p) => acc + (p.confidence || 3), 0) / topic.progress.length 
    : 3;

  const inProgressCount = topic.progress?.filter(p => p.status === 'in-progress').length || 0;
  const needsReviewCount = topic.progress?.filter(p => p.status === 'needs-review').length || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{topic.title}</h2>
                <p className="text-blue-100 mb-4">{topic.subject} • {topic.difficulty}</p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">Progress</span>
                    </div>
                    <p className="text-xl font-semibold">{progressPercentage}%</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Time Spent</span>
                    </div>
                    <p className="text-xl font-semibold">{Math.round(totalTimeSpent / 60)}h</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Confidence</span>
                    </div>
                    <p className="text-xl font-semibold">{averageConfidence.toFixed(1)}/5</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">AI Tips</span>
                    </div>
                    <p className="text-xl font-semibold">{aiSuggestions.length}</p>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[60vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {completedProgress}/{totalProgress} completed
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {topic.progress?.slice(0, 5).map((progress, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          {progress.subtopic}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            progress.status === 'completed' && "border-green-500 text-green-700 dark:text-green-400",
                            progress.status === 'in-progress' && "border-blue-500 text-blue-700 dark:text-blue-400",
                            progress.status === 'needs-review' && "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                            progress.status === 'not-started' && "border-neutral-300 text-neutral-600 dark:text-neutral-400"
                          )}
                        >
                          {progress.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    ))}
                    
                    {(topic.progress?.length || 0) > 5 && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                        +{(topic.progress?.length || 0) - 5} more subtopics
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Study Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Study Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{inProgressCount}</p>
                    </div>
                    
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Needs Review</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{needsReviewCount}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Study Efficiency</span>
                      <span className="text-sm font-medium">
                        {totalTimeSpent > 0 ? Math.round((completedProgress / (totalTimeSpent / 60)) * 100) : 0}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Estimated Completion</span>
                      <span className="text-sm font-medium">
                        {Math.max(0, topic.estimatedHours - Math.round(totalTimeSpent / 60))}h remaining
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Average Session</span>
                      <span className="text-sm font-medium">
                        {topic.progress?.length > 0 ? Math.round(totalTimeSpent / topic.progress.length) : 0}min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Suggestions Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Suggestions
                </h3>
                <Button
                  onClick={generateNewSuggestions}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                  {isGenerating ? 'Generating...' : 'Refresh Suggestions'}
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg h-32" />
                  ))}
                </div>
              ) : aiSuggestions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Lightbulb className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      No AI suggestions yet
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      Generate personalized suggestions based on your study progress
                    </p>
                    <Button onClick={generateNewSuggestions} disabled={isGenerating} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate Suggestions
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {aiSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={cn(
                          "transition-all hover:shadow-md",
                          suggestion.isImplemented && "opacity-75 bg-neutral-50 dark:bg-neutral-800/50"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                getSuggestionColor(suggestion.type)
                              )}>
                                {getSuggestionIcon(suggestion.type)}
                              </div>
                              <Badge variant="outline" className="text-xs capitalize">
                                {suggestion.type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-neutral-900 dark:text-neutral-100 mb-4 leading-relaxed">
                              {suggestion.content}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Relevance: {Math.round(suggestion.relevanceScore * 100)}%
                                </div>
                              </div>
                              
                              {!suggestion.isImplemented ? (
                                <Button
                                  onClick={() => markSuggestionAsImplemented(suggestion._id!)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Mark Done
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="text-xs">Implemented</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
