'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import AIChat from '@/components/ai/AIChat';
import { 
  BookOpen, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  Brain,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

interface StudyStats {
  sessionsToday: number;
  totalMinutes: number;
  tasksCompleted: number;
  currentStreak: number;
}

interface RecentActivity {
  id: string;
  type: 'study' | 'task' | 'quiz';
  title: string;
  duration?: number;
  score?: number;
  timestamp: Date;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data - replace with real data from your backend
  const stats: StudyStats = {
    sessionsToday: 3,
    totalMinutes: 125,
    tasksCompleted: 7,
    currentStreak: 5
  };
  
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'study',
      title: 'Mathematics - Calculus Review',
      duration: 45,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'task',
      title: 'Complete Physics Assignment',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'quiz',
      title: 'History Quiz - World War II',
      score: 85,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  const upcomingTasks = [
    { id: '1', title: 'Chemistry Lab Report', due: 'Today, 6:00 PM', priority: 'high' },
    { id: '2', title: 'Read Chapter 5 - Biology', due: 'Tomorrow', priority: 'medium' },
    { id: '3', title: 'Math Practice Problems', due: 'This Weekend', priority: 'low' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="h-4 w-4" />;
      case 'task': return <CheckCircle2 className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your progress and stay focused on your goals</p>
        </div>
        <Button onClick={() => setActiveTab('chat')} variant="outline" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Ask AI Assistant
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.sessionsToday}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Study Time</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMinutes}m</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasks Done</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tasksCompleted}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {activity.duration && <span>• {activity.duration}m</span>}
                        {activity.score && <span>• {activity.score}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{task.due}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Schedule functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Study Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Daily Goal Progress</span>
                  <span>125/180 minutes</span>
                </div>
                <Progress value={69} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Weekly Tasks</span>
                  <span>7/10 completed</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Monthly Streak</span>
                  <span>5/30 days</span>
                </div>
                <Progress value={17} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Chat */}
            <div className="lg:col-span-2">
              <AIChat 
                className="h-[600px]"
                initialMessage="Hi! I'm ready to help you with your studies. What would you like to work on today?"
              />
            </div>
            
            {/* AI Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    // This would trigger the AI chat with a specific prompt
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Get Study Tips
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan My Day
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Explain Concept
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}