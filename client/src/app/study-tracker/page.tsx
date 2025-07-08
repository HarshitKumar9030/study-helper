"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Target, TrendingUp, Lightbulb, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StudyFlowChart } from '@/components/features/study-tracker/StudyFlowChart';
import { CreateTopicDialog } from '@/components/features/study-tracker/CreateTopicDialog';
import { AIInsights } from '@/components/features/study-tracker/AIInsights';
import { IStudyTopic } from '@/lib/models/study-tracker';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export default function StudyTrackerPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [studyTopics, setStudyTopics] = useState<IStudyTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<IStudyTopic | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchStudyTopics = async () => {
      try {
        const response = await fetch('/api/study-tracker/topics');
        if (response.ok) {
          const topics = await response.json();
          setStudyTopics(topics);
        }
      } catch (error) {
        console.error('Error fetching study topics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyTopics();
  }, [session?.user]);

  const refetchTopics = useCallback(async () => {
    try {
      const response = await fetch('/api/study-tracker/topics');
      if (response.ok) {
        const topics = await response.json();
        setStudyTopics(topics);
      }
    } catch (error) {
      console.error('Error fetching study topics:', error);
      toast({
        title: "Error",
        description: "Failed to load study topics",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleCreateTopic = async (topicData: Partial<IStudyTopic>) => {
    try {
      const response = await fetch('/api/study-tracker/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicData),
      });

      if (response.ok) {
        const newTopic = await response.json();
        setStudyTopics([...studyTopics, newTopic]);
        toast({
          title: "Success",
          description: "Study topic created successfully!"
        });
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "Error",
        description: "Failed to create study topic",
        variant: "destructive"
      });
    }
  };

  const filteredTopics = studyTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || topic.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = [...new Set(studyTopics.map(topic => topic.subject))];

  const totalProgress = studyTopics.length > 0 
    ? Math.round((studyTopics.reduce((acc, topic) => {
        const completedProgress = topic.progress?.filter(p => p.status === 'completed').length || 0;
        const totalProgress = topic.progress?.length || 1;
        return acc + (completedProgress / totalProgress);
      }, 0) / studyTopics.length) * 100)
    : 0;

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            You need to be signed in to access the study tracker.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Study Tracker
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Track your learning progress and get AI-powered insights
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Topic
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Topics</p>
                    <p className="text-xl font-semibold">{studyTopics.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Overall Progress</p>
                    <p className="text-xl font-semibold">{totalProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Time Spent</p>
                    <p className="text-xl font-semibold">
                      {Math.round(studyTopics.reduce((acc, topic) => 
                        acc + (topic.progress?.reduce((progressAcc, p) => progressAcc + (p.timeSpent || 0), 0) || 0), 0
                      ) / 60)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Subjects</p>
                    <p className="text-xl font-semibold">{subjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Topic
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-stone-600 dark:text-stone-400">
                  Loading study topics...
                </div>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    No study topics yet
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 mb-4">
                    Create your first study topic to start tracking your progress
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Topic
                  </Button>
                </div>
              </div>
            ) : (
              <StudyFlowChart
                topics={filteredTopics}
                selectedTopic={selectedTopic}
                onTopicSelect={setSelectedTopic}
                onTopicUpdate={refetchTopics}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Topic Dialog */}
      <CreateTopicDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTopic={handleCreateTopic}
      />

      {/* AI Insights Panel */}
      {selectedTopic && (
        <AIInsights
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onUpdate={refetchTopics}
        />
      )}
    </div>
  );
}
