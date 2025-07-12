'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudyFlowChart } from '@/components/features/study-tracker/StudyFlowChart';
import { CreateTopicDialog } from '@/components/features/study-tracker/CreateTopicDialog';
import { IStudyTopic } from '@/lib/models/study-tracker';
import { 
  BookOpen, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  Mic,
  ArrowRight,
  Users,
  Timer,
  BarChart3,
  Sun,
  Moon,
  Activity,
  Award,
  Star,
  Flame,
  Plus,
  AlertTriangle,
  ChevronRight,
  User,
  Settings,
  BrainCircuit
} from 'lucide-react';

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
}

interface RecentActivity {
  id: string;
  type: 'chat' | 'voice';
  title: string;
  description?: string;
  timestamp: Date;
  successful?: boolean;
  messageCount?: number;
  subject?: string;
}

interface Task {
  _id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completed: boolean;
  estimatedDuration?: number;
}

interface ScheduleBlock {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0
  });  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleBlock[]>([]);  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [allActivities, setAllActivities] = useState<RecentActivity[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  // Study tracker states
  const [studyTopics, setStudyTopics] = useState<IStudyTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<IStudyTopic | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch tasks
      const tasksResponse = await fetch('/api/scheduler/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const tasks = tasksData.tasks || [];
        
        // Calculate task statistics
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: Task) => t.completed).length,
          overdueTasks: tasks.filter((t: Task) => !t.completed && new Date(t.dueDate) < new Date()).length,
          pendingTasks: tasks.filter((t: Task) => !t.completed).length
        };
        setTaskStats(stats);
        
        // Get recent tasks (upcoming due soon)
        const upcoming = tasks
          .filter((t: Task) => !t.completed)
          .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5);
        setRecentTasks(upcoming);
      }

      // Fetch today's schedule blocks
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const blocksResponse = await fetch(`/api/scheduler/blocks?startDate=${startOfDay}&endDate=${endOfDay}`);
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        setTodaySchedule(blocksData.blocks || []);
      }

      // Fetch recent chat sessions and voice commands for activity
      const activities: RecentActivity[] = [];
      
      try {
        // Fetch recent chat sessions
        const chatResponse = await fetch('/api/sync/chat?limit=10');
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          if (chatData.sessions) {
            chatData.sessions.forEach((session: any) => {
              activities.push({
                id: session._id || session.sessionId,
                type: 'chat',
                title: session.subject ? `Chat: ${session.subject}` : 'AI Chat Session',
                description: session.messageCount ? `${session.messageCount} messages` : undefined,
                timestamp: new Date(session.lastMessageAt || session.updatedAt),
                messageCount: session.messageCount,
                subject: session.subject
              });
            });
          }
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      }

      try {
        // Fetch recent voice commands
        const voiceResponse = await fetch('/api/sync/voice?type=commands&limit=10');
        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json();
          if (voiceData.data?.commands) {
            voiceData.data.commands.forEach((command: any) => {
              activities.push({
                id: command._id || `voice_${command.executedAt}`,
                type: 'voice',
                title: command.command || 'Voice Command',
                description: command.transcription || undefined,
                timestamp: new Date(command.executedAt),
                successful: command.successful
              });
            });
          }
        }
      } catch (error) {
        console.error('Error fetching voice commands:', error);
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAllActivities(activities);
      setRecentActivities(activities.slice(0, 5));

      // Fetch study tracker topics
      try {
        const studyResponse = await fetch('/api/study-tracker/topics');
        if (studyResponse.ok) {
          const topics = await studyResponse.json();
          setStudyTopics(topics);
        }
      } catch (error) {
        console.error('Error fetching study topics:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);  useEffect(() => {
    if (session?.user && mounted) {
      fetchDashboardData();
    }
  }, [session, mounted, fetchDashboardData]);

  const quickActions = [
    {
      id: 'chat',
      title: 'AI Chat Assistant',
      description: 'Get instant help with your studies',
      icon: MessageSquare,
      href: '/chat',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'voice',
      title: 'Voice Assistant',
      description: 'Use voice commands for hands-free interaction',
      icon: Mic,
      href: '/voice',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'scheduler',
      title: 'Smart Scheduler',
      description: 'Plan your study sessions intelligently',
      icon: Calendar,
      href: '/scheduler',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your account and preferences',
      icon: User,
      href: '/profile',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'chat': return 'text-blue-600 dark:text-blue-400';
      case 'voice': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!mounted) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              Study Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}! Your learning journey continues
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
            <Link href="/chat">
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                <BrainCircuit className="h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="study-tracker">Study Tracker</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold">{taskStats.totalTasks}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{taskStats.completedTasks}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">{taskStats.pendingTasks}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{taskStats.overdueTasks}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Progress */}
            {taskStats.totalTasks > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Task Completion</span>
                      <span>{Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)}%</span>
                    </div>
                    <Progress value={(taskStats.completedTasks / taskStats.totalTasks) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Upcoming Tasks
                    </div>
                    <Link href="/scheduler">
                      <Button variant="ghost" size="sm">
                        View All <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recentTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming tasks</p>
                      <p className="text-sm">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTasks.map((task) => (
                        <div key={task._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{task.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                              {task.estimatedDuration && ` • ${task.estimatedDuration}m`}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today&apos;s Schedule
                    </div>
                    <Link href="/scheduler">
                      <Button variant="ghost" size="sm">
                        View All <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : todaySchedule.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No schedule for today</p>
                      <Link href="/scheduler">
                        <Button variant="outline" size="sm" className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Schedule
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {todaySchedule.map((block) => (
                          <div key={block._id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground">
                              {new Date(block.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{block.title}</h4>
                              <p className="text-xs text-muted-foreground">{block.duration}m</p>
                            </div>
                            <Badge className={getPriorityColor(block.priority)}>
                              {block.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </div>
                  {allActivities.length > 5 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="flex items-center gap-2"
                    >
                      {showAllActivities ? 'Show Less' : 'View All'}
                      <ChevronRight className={`h-4 w-4 transition-transform ${showAllActivities ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (showAllActivities ? allActivities : recentActivities).length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                    <p className="text-muted-foreground mb-4">
                      Start using chat or voice features to see your activity here.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Link href="/chat">
                        <Button size="sm" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Start Chatting
                        </Button>
                      </Link>
                      <Link href="/voice">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Try Voice
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className={showAllActivities ? "h-80" : "h-auto"}>
                    <div className="space-y-4">
                      {(showAllActivities ? allActivities : recentActivities).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className={`flex-shrink-0 mt-0.5 ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {activity.timestamp.toLocaleString()}
                              </p>
                              {activity.type === 'voice' && activity.successful !== undefined && (
                                <Badge variant={activity.successful ? "default" : "destructive"} className="text-xs">
                                  {activity.successful ? "Success" : "Failed"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="study-tracker" className="space-y-6">
            {/* Study Tracker Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6 text-emerald-600" />
                  Study Tracker
                </h2>
                <p className="text-muted-foreground">
                  Track your learning progress with AI-powered insights
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
                <Link href="/study-tracker">
                  <Button variant="outline" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Full View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Study Topics Overview */}
            {studyTopics.length > 0 ? (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Topics</p>
                          <p className="text-xl font-bold">{studyTopics.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-xl font-bold">
                            {studyTopics.reduce((acc, topic) => 
                              acc + (topic.progress?.filter(p => p.status === 'completed').length || 0), 0
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hours Studied</p>
                          <p className="text-xl font-bold">
                            {Math.round(studyTopics.reduce((acc, topic) => 
                              acc + (topic.progress?.reduce((progAcc, prog) => 
                                progAcc + (prog.timeSpent || 0), 0) || 0), 0
                            ) / 3600 * 10) / 10}h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Study Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Study Topics
                    </CardTitle>
                    <CardDescription>
                      Your latest study progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studyTopics.slice(0, 3).map((topic) => {
                        const completedCount = topic.progress?.filter(p => p.status === 'completed').length || 0;
                        const totalCount = topic.progress?.length || 1;
                        const progressPercent = Math.round((completedCount / totalCount) * 100);
                        
                        return (
                          <div key={topic._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{topic.title}</h4>
                                <Badge variant="secondary" className="text-xs">{topic.subject}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{completedCount}/{totalCount} completed</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {topic.estimatedHours}h estimated
                                </span>
                              </div>
                              <Progress value={progressPercent} className="h-2 mt-2" />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedTopic(topic)}
                              className="ml-4"
                            >
                              View
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Study Flowchart - Compact Version */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Study Progress Overview
                    </CardTitle>
                    <CardDescription>
                      Interactive flowchart of your study topics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-muted/30 rounded-lg overflow-hidden">
                      <StudyFlowChart
                        topics={studyTopics.slice(0, 2)} // Show only first 2 topics for dashboard
                        selectedTopic={selectedTopic}
                        onTopicSelect={setSelectedTopic}
                        onTopicUpdate={() => {
                          // Refresh study topics
                          fetch('/api/study-tracker/topics')
                            .then(res => res.json())
                            .then(topics => setStudyTopics(topics))
                            .catch(console.error);
                        }}
                      />
                    </div>
                    {studyTopics.length > 2 && (
                      <div className="mt-4 text-center">
                        <Link href="/study-tracker">
                          <Button variant="outline" size="sm">
                            View All {studyTopics.length} Topics
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Empty State */
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start Your Study Journey</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create your first study topic to begin tracking your learning progress with AI-powered insights.
                    </p>
                  </div>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Topic
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Create Topic Dialog */}
            <CreateTopicDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreateTopic={async (topicData) => {
                try {
                  const response = await fetch('/api/study-tracker/topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(topicData)
                  });
                  if (response.ok) {
                    // Refresh study topics
                    const refreshResponse = await fetch('/api/study-tracker/topics');
                    if (refreshResponse.ok) {
                      const topics = await refreshResponse.json();
                      setStudyTopics(topics);
                    }
                    setIsCreateDialogOpen(false);
                  }
                } catch (error) {
                  console.error('Error creating topic:', error);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link key={action.id} href={action.href}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                          <div className="flex items-center text-sm text-primary group-hover:text-primary/80">
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
                    <BrainCircuit className="h-5 w-5" />
                    AI-Powered Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Smart Chat Assistant</h4>
                      <p className="text-sm text-muted-foreground">Get instant help with homework, explanations, and study guidance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mic className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Voice Commands</h4>
                      <p className="text-sm text-muted-foreground">Control your study environment hands-free with voice recognition</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Smart Scheduling</h4>
                      <p className="text-sm text-muted-foreground">AI-driven task prioritization and study session optimization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Productivity Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Task Management</h4>
                      <p className="text-sm text-muted-foreground">Organize and track your study tasks with smart prioritization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Progress Tracking</h4>
                      <p className="text-sm text-muted-foreground">Monitor your study progress with detailed analytics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-teal-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Profile Management</h4>
                      <p className="text-sm text-muted-foreground">Customize your learning experience and track achievements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
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
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Schedule for Today</h3>
                    <p className="text-muted-foreground mb-4">
                      Use our intelligent scheduler to plan your study sessions with AI-powered recommendations.
                    </p>
                    <Link href="/scheduler">
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Schedule
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedule.map((block) => (
                      <div key={block._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-mono text-muted-foreground">
                            {new Date(block.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(block.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div>
                            <h4 className="font-medium">{block.title}</h4>
                            <p className="text-sm text-muted-foreground">{block.duration} minutes</p>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(block.priority)}>
                          {block.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
