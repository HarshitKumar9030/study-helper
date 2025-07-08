"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IStudyTopic } from '@/lib/models/study-tracker';
import { cn } from '@/lib/utils';

interface StudyTopicCardProps {
  topic: IStudyTopic;
  onClick: () => void;
  onUpdate: () => void;
}

export function StudyTopicCard({ topic, onClick, onUpdate }: StudyTopicCardProps) {
  const [isStudying, setIsStudying] = useState(false);
  const [studyStartTime, setStudyStartTime] = useState<Date | null>(null);

  const completedProgress = topic.progress?.filter(p => p.status === 'completed').length || 0;
  const totalProgress = topic.progress?.length || 1;
  const progressPercentage = Math.round((completedProgress / totalProgress) * 100);
  
  const totalTimeSpent = topic.progress?.reduce((acc, p) => acc + (p.timeSpent || 0), 0) || 0;
  const averageConfidence = topic.progress?.length > 0 
    ? topic.progress.reduce((acc, p) => acc + (p.confidence || 3), 0) / topic.progress.length 
    : 3;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800';
      case 'intermediate': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800';
      case 'advanced': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getProgressStatus = () => {
    if (progressPercentage === 100) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
    if (progressPercentage >= 50) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' };
    if (progressPercentage > 0) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
    return { color: 'text-slate-400', bg: 'bg-slate-300' };
  };

  const getLastStudiedInfo = () => {
    if (!topic.progress || topic.progress.length === 0) return null;
    
    const recentProgress = topic.progress
      .filter(p => p.lastStudied)
      .sort((a, b) => new Date(b.lastStudied!).getTime() - new Date(a.lastStudied!).getTime())[0];
    
    if (!recentProgress) return null;
    
    const daysSince = Math.floor((Date.now() - new Date(recentProgress.lastStudied!).getTime()) / (1000 * 60 * 60 * 24));
    return { subtopic: recentProgress.subtopic, daysSince };
  };

  const progressStatus = getProgressStatus();
  const lastStudied = getLastStudiedInfo();

  const handleStartStudy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStudying(true);
    setStudyStartTime(new Date());
  };

  const handleStopStudy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (studyStartTime) {
      const timeSpent = Math.round((new Date().getTime() - studyStartTime.getTime()) / 1000 / 60);
      // Here you would typically save the study session
      console.log(`Studied for ${timeSpent} minutes`);
    }
    setIsStudying(false);
    setStudyStartTime(null);
  };

  const handleDeleteTopic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this topic?')) {
      try {
        const response = await fetch(`/api/study-tracker/topics/${topic._id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting topic:', error);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >        <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg border-2 bg-white dark:bg-slate-800",
          isStudying 
            ? "border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800" 
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {topic.title}
              </CardTitle>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {topic.subject}
                </Badge>
                <Badge className={cn("text-xs border", getDifficultyColor(topic.difficulty))}>
                  {topic.difficulty}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Topic
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDeleteTopic}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Topic
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {topic.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {topic.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enhanced Progress Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium", progressStatus.color)}>
                  {completedProgress}/{totalProgress}
                </span>
                <span className="text-xs text-slate-500">
                  ({progressPercentage}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div
                className={cn("h-2.5 rounded-full transition-all duration-300", progressStatus.bg)}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Subtopic Insights */}
          {topic.progress && topic.progress.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Subtopic Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                {topic.progress.slice(0, 4).map((progress, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      progress.status === 'completed' ? 'bg-emerald-500' :
                      progress.status === 'in-progress' ? 'bg-blue-500' :
                      progress.status === 'needs-review' ? 'bg-amber-500' : 'bg-slate-300'
                    )} />
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">
                      {progress.subtopic}
                    </span>
                  </div>
                ))}
                {topic.progress.length > 4 && (
                  <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <span className="text-xs text-slate-500">
                      +{topic.progress.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Time Spent</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(totalTimeSpent / 60)}h {totalTimeSpent % 60}m
              </p>
            </div>
            
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Avg Confidence</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {averageConfidence.toFixed(1)}/5
              </p>
            </div>
            
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Estimated</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {topic.estimatedHours}h
              </p>
            </div>
          </div>

          {/* Last Studied Info */}
          {lastStudied && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Last studied: <span className="font-medium">{lastStudied.subtopic}</span>
                  {lastStudied.daysSince === 0 ? ' today' : 
                   lastStudied.daysSince === 1 ? ' yesterday' : 
                   ` ${lastStudied.daysSince} days ago`}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topic.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                  {tag}
                </Badge>
              ))}
              {topic.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                  +{topic.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Study Action Button */}
          <div className="pt-2">
            {!isStudying ? (
              <Button 
                onClick={handleStartStudy}
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                size="sm"
              >
                <Play className="w-4 h-4" />
                Start Studying
              </Button>
            ) : (
              <Button 
                onClick={handleStopStudy}
                variant="outline"
                className="w-full gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                size="sm"
              >
                <Pause className="w-4 h-4" />
                Stop Studying ({Math.round((new Date().getTime() - (studyStartTime?.getTime() || 0)) / 1000 / 60)}m)
              </Button>
            )}
          </div>

          {/* AI Suggestions Indicator */}
          {topic.aiSuggestions && topic.aiSuggestions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>{topic.aiSuggestions.length} AI suggestions available</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
