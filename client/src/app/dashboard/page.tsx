'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  MessageSquare,
  Mic,
  Focus,
  Settings,
  ArrowRight,
  Play,
  Users,
  Timer,
  BarChart3
} from 'lucide-react';

interface StudyStats {
  sessionsToday: number;
  totalMinutes: number;
  tasksCompleted: number;
  currentStreak: number;
  focusSessionsCompleted: number;
  averageSessionLength: number;
}

interface RecentActivity {
  id: string;
  type: 'study' | 'task' | 'quiz' | 'focus' | 'voice';
  title: string;
  duration?: number;
  score?: number;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Enhanced stats to match Python app features
  const stats: StudyStats = {
    sessionsToday: 3,
    totalMinutes: 125,
    tasksCompleted: 7,
    currentStreak: 5,
    focusSessionsCompleted: 2,
    averageSessionLength: 42
  };
  
  // Enhanced activities including new features
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'focus',
      title: 'Deep Focus Session - Mathematics',
      duration: 25,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'voice',
      title: 'Voice Command: Schedule meeting',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'study',
      title: 'Mathematics - Calculus Review',
      duration: 45,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: '4',
      type: 'task',
      title: 'Complete Physics Assignment',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '5',
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

  // Quick actions matching Python app features
  const quickActions: QuickAction[] = [
    {
      id: 'chat',
      title: 'AI Chat Assistant',
      description: 'Get instant help with your studies',
      icon: MessageSquare,
      href: '/chat',
      color: 'bg-blue-500'
    },
    {
      id: 'voice',
      title: 'Voice Assistant',
      description: 'Use voice commands for hands-free interaction',
      icon: Mic,
      href: '/voice',
      color: 'bg-green-500'
    },
    {
      id: 'focus',
      title: 'Focus Mode',
      description: 'Block distractions and boost productivity',
      icon: Focus,
      href: '/focus',
      color: 'bg-purple-500'
    },
    {
      id: 'scheduler',
      title: 'Smart Scheduler',
      description: 'Plan your study sessions intelligently',
      icon: Calendar,
      href: '/scheduler',
      color: 'bg-orange-500'
    }
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
      case 'focus': return <Focus className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'study': return 'text-blue-600';
      case 'task': return 'text-green-600';
      case 'quiz': return 'text-purple-600';
      case 'focus': return 'text-orange-600';
      case 'voice': return 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            📊 Study Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Your comprehensive learning command center</p>
        </div>        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button onClick={() => setActiveTab('chat')} variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask AI Assistant
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Focus Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.focusSessionsCompleted}</p>
                  </div>
                  <Focus className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Session</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageSessionLength}m</p>
                  </div>
                  <Timer className="h-8 w-8 text-teal-600" />
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
              <CardContent className="space-y-4">                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 ${getActivityColor(activity.type)}`}>
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
          </div>        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                          <span>Get Started</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Smart Chat Assistant</h4>
                    <p className="text-sm text-gray-600">Get instant help with homework, explanations, and study guidance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mic className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Voice Commands</h4>
                    <p className="text-sm text-gray-600">Control your study environment hands-free with voice recognition</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Smart Scheduling</h4>
                    <p className="text-sm text-gray-600">AI-driven task prioritization and study session optimization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Focus className="h-5 w-5" />
                  Productivity Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Timer className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Focus Sessions</h4>
                    <p className="text-sm text-gray-600">Pomodoro-style focus sessions with distraction blocking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Progress Tracking</h4>
                    <p className="text-sm text-gray-600">Detailed analytics and insights into your study patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-teal-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Cross-Platform Sync</h4>
                    <p className="text-sm text-gray-600">Seamless synchronization between desktop and web applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Feature Usage This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Focus className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Focus Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">12 sessions</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Voice Commands</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">18 commands</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">AI Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">34 messages</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Smart Scheduler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">8 tasks scheduled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Schedule
                </div>
                <Link href="/scheduler">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Open Scheduler
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Scheduler Available</h3>
                  <p className="text-gray-600 mb-4">
                    Use our intelligent scheduler to plan your study sessions with AI-powered recommendations.
                  </p>
                  <Link href="/scheduler">
                    <Button className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Get Started with Scheduler
                    </Button>
                  </Link>
                </div>
              </div>
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