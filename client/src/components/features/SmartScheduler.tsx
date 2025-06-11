"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  Brain,
  Target,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, isToday, isSameDay } from "date-fns";

interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  createdAt: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  tags?: string[];
  category?: string;
  progress?: number;
}

interface ScheduleSuggestion {
  task: Task;
  suggestedTime: string;
  duration: number;
  reasoning: string;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const priorityIcons = {
  low: "🔵",
  medium: "🟡", 
  high: "🟠",
  urgent: "🔴"
};

export default function SmartScheduler() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task['priority'],
    estimatedDuration: 30,
    tags: "",
    category: ""
  });
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // API Functions
  const fetchTasks = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/scheduler/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      const tasksWithDates = data.tasks.map((task: any) => ({
        ...task,
        id: task._id,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt)
      }));
      setTasks(tasksWithDates);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const createTask = useCallback(async (taskData: any) => {
    if (!session?.user) return null;
    
    try {
      const response = await fetch('/api/scheduler/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      const data = await response.json();
      return {
        ...data.task,
        id: data.task._id,
        dueDate: new Date(data.task.dueDate),
        createdAt: new Date(data.task.createdAt)
      };
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
  }, [session?.user]);

  const updateTask = useCallback(async (taskId: string, updates: any) => {
    if (!session?.user) return null;
    
    try {
      const response = await fetch(`/api/scheduler/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const data = await response.json();
      return {
        ...data.task,
        id: data.task._id,
        dueDate: new Date(data.task.dueDate),
        createdAt: new Date(data.task.createdAt)
      };
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return null;
    }
  }, [session?.user]);

  const deleteTaskFromAPI = useCallback(async (taskId: string) => {
    if (!session?.user) return false;
    
    try {
      const response = await fetch(`/api/scheduler/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
    }
  }, [session?.user, fetchTasks]);

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a due date");
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description,
      dueDate: selectedDate,
      priority: newTask.priority,
      completed: false,
      estimatedDuration: newTask.estimatedDuration,
      tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()) : [],
      category: newTask.category || undefined
    };

    const createdTask = await createTask(taskData);
    if (createdTask) {
      setTasks(prev => [...prev, createdTask]);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        estimatedDuration: 30,
        tags: "",
        category: ""
      });
      setIsAddTaskOpen(false);
      toast.success("Task added successfully!");
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => (t.id || t._id) === taskId);
    if (!task) return;

    const updatedTask = await updateTask(taskId, { 
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : null
    });
    
    if (updatedTask) {
      setTasks(prev => prev.map(t => 
        (t.id || t._id) === taskId ? updatedTask : t
      ));
      toast.success(task.completed ? "Task marked as incomplete" : "Task completed! 🎉");
    }
  };

  const deleteTask = async (taskId: string) => {
    const success = await deleteTaskFromAPI(taskId);
    if (success) {
      setTasks(prev => prev.filter(t => (t.id || t._id) !== taskId));
      toast.success("Task deleted");
    }
  };

  const getTodayTasks = () => {
    return tasks.filter(task => isToday(task.dueDate) && !task.completed);
  };

  const getUpcomingTasks = (days = 7) => {
    const today = new Date();
    const endDate = addDays(today, days);
    
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate > today && 
      task.dueDate <= endDate
    ).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.dueDate, date));
  };

  const generateSmartSuggestions = () => {
    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length === 0) {
      toast.info("No pending tasks to schedule");
      return;
    }

    // Sort by priority and due date
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    const newSuggestions: ScheduleSuggestion[] = [];
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

    sortedTasks.slice(0, 5).forEach((task) => {
      const duration = task.estimatedDuration || 30;
      const suggestion: ScheduleSuggestion = {
        task,
        suggestedTime: format(currentTime, 'HH:mm'),
        duration,
        reasoning: `Priority: ${task.priority}, Due: ${format(task.dueDate, 'MMM dd')}`
      };

      newSuggestions.push(suggestion);
      currentTime = addDays(currentTime, 0);
      currentTime.setMinutes(currentTime.getMinutes() + duration + 15); // Add break
    });

    setSuggestions(newSuggestions);
    setShowSuggestions(true);
    toast.success("Smart schedule generated!");
  };

  const getProductivityStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => 
      !task.completed && task.dueDate < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  if (!session?.user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to access the Smart Scheduler</p>
        </div>
      </div>
    );
  }

  const stats = getProductivityStats();

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📅 Smart Scheduler
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent task scheduling with adaptive learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateSmartSuggestions}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Brain className="h-4 w-4" />
            Smart Schedule
          </Button>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" disabled={loading}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>
                  Create a new task with smart scheduling suggestions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Enter task title..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Task description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: Task['priority']) =>
                        setNewTask({...newTask, priority: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🔵 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="urgent">🔴 Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newTask.estimatedDuration}
                      onChange={(e) => setNewTask({...newTask, estimatedDuration: parseInt(e.target.value) || 30})}
                      min={5}
                      max={480}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      value={newTask.category}
                      onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                      placeholder="e.g., Study, Work, Personal"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({...newTask, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={addTask}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Productivity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Schedule Suggestions
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
              Dismiss
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.task.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {suggestion.suggestedTime}
                    </Badge>
                    <Badge variant="outline">
                      {suggestion.duration}m
                    </Badge>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Calendar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calendar</span>
                <Button
                  onClick={() => setSelectedDate(new Date())}
                  variant="outline"
                  size="sm"
                >
                  Today
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium">Tasks for {selectedDate ? format(selectedDate, 'MMM dd') : 'selected date'}</h4>
                <ScrollArea className="h-32">
                  {selectedDate && getTasksForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks for this date</p>
                  ) : (                    selectedDate && getTasksForDate(selectedDate).map((task) => (
                      <div key={task._id || task.id} className="flex items-center gap-2 py-1">
                        <Badge className={priorityColors[task.priority]}>
                          {priorityIcons[task.priority]}
                        </Badge>
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Task Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today&apos;s Schedule</span>
                <span className="text-sm font-normal text-gray-500">
                  {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-64">
                  {getTodayTasks().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks scheduled for today</p>
                      <p className="text-sm">Add a task to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getTodayTasks().map((task) => (
                        <div key={task._id || task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <button
                            onClick={() => toggleTaskComplete(task._id || task.id!)}
                            className="flex-shrink-0"
                            disabled={loading}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 truncate">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={priorityColors[task.priority]}>
                                {priorityIcons[task.priority]} {task.priority}
                              </Badge>
                              {task.estimatedDuration && (
                                <Badge variant="outline">
                                  {task.estimatedDuration}m
                                </Badge>
                              )}
                              {task.category && (
                                <Badge variant="outline">
                                  {task.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTask(task)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task._id || task.id!)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Upcoming Tasks</span>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {getUpcomingTasks().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming tasks</p>
                    <p className="text-sm">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingTasks().map((task) => (
                      <div key={task._id || task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <button
                          onClick={() => toggleTaskComplete(task._id || task.id!)}
                          className="flex-shrink-0"
                          disabled={loading}
                        >
                          <Circle className="h-5 w-5 text-gray-400" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 truncate">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={priorityColors[task.priority]}>
                              {priorityIcons[task.priority]} {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              Due {format(task.dueDate, 'MMM dd')}
                            </Badge>
                            {task.estimatedDuration && (
                              <Badge variant="outline">
                                {task.estimatedDuration}m
                              </Badge>
                            )}
                            {task.category && (
                              <Badge variant="outline">
                                {task.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTask(task)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTask(task._id || task.id!)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
