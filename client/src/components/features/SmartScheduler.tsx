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
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import TaskModal from "./TaskModal";
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
  Loader2,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  isToday,
  isSameDay,
} from "date-fns";

interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: "low" | "medium" | "high" | "urgent";
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
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300",
};

const priorityIcons = {
  low: "🔵",
  medium: "🟡",
  high: "🟠",
  urgent: "🔴",
};

export default function SmartScheduler() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/scheduler/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      const tasksWithDates = data.tasks.map((task: any) => ({
        ...task,
        id: task._id,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
      }));
      setTasks(tasksWithDates);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const createTask = useCallback(
    async (taskData: any) => {
      if (!session?.user) return null;

      try {
        const response = await fetch("/api/scheduler/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const data = await response.json();
        return {
          ...data.task,
          id: data.task._id,
          dueDate: new Date(data.task.dueDate),
          createdAt: new Date(data.task.createdAt),
        };
      } catch (error) {
        console.error("Error creating task:", error);
        toast.error("Failed to create task");
        return null;
      }
    },
    [session?.user]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: any) => {
      if (!session?.user) return null;

      try {
        const response = await fetch(`/api/scheduler/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        const data = await response.json();
        return {
          ...data.task,
          id: data.task._id,
          dueDate: new Date(data.task.dueDate),
          createdAt: new Date(data.task.createdAt),
        };
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("Failed to update task");
        return null;
      }
    },
    [session?.user]
  );

  const deleteTaskFromAPI = useCallback(
    async (taskId: string) => {
      if (!session?.user) return false;

      try {
        const response = await fetch(`/api/scheduler/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete task");
        }

        return true;
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
        return false;
      }
    },
    [session?.user]
  );
  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
    }
  }, [session?.user, fetchTasks]);
  const handleAddTask = async (taskData: any) => {
    const createdTask = await createTask(taskData);
    if (createdTask) {
      setTasks((prev) => [...prev, createdTask]);
      setIsAddTaskOpen(false);
      toast.success("Task added successfully!");
    }
  };const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => (t.id || t._id) === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    try {
      // Use the correct ID for the API call - prefer _id over id
      const apiTaskId = task._id || task.id;
      if (!apiTaskId) {
        toast.error("Invalid task ID");
        return;
      }

      // Optimistically update the UI first
      const optimisticUpdate = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      };

      setTasks((prev) =>
        prev.map((t) => {
          const currentId = t.id || t._id;
          return currentId === taskId ? optimisticUpdate : t;
        })
      );

      // Then make the API call
      const updatedTask = await updateTask(apiTaskId, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      });

      if (updatedTask) {
        // Update with the actual response from server
        setTasks((prev) =>
          prev.map((t) => {
            const currentId = t.id || t._id;
            const targetId = updatedTask.id || updatedTask._id;
            return currentId === targetId ? updatedTask : t;
          })
        );
        toast.success(
          task.completed ? "Task marked as incomplete" : "Task completed! 🎉"
        );
      } else {
        // Revert the optimistic update if API call failed
        setTasks((prev) =>
          prev.map((t) => {
            const currentId = t.id || t._id;
            return currentId === taskId ? task : t;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Revert the optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          const currentId = t.id || t._id;
          return currentId === taskId ? task : t;
        })
      );
      toast.error("Failed to update task");
    }
  };
  const deleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      
      // Find the task to get the correct ID
      const task = tasks.find((t) => (t.id || t._id) === taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const apiTaskId = task._id || task.id;
      if (!apiTaskId) {
        toast.error("Invalid task ID");
        return;
      }

      const success = await deleteTaskFromAPI(apiTaskId);
      if (success) {
        setTasks((prev) => prev.filter((t) => (t.id || t._id) !== taskId));
        toast.success("Task deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setLoading(false);
    }
  };
  const getTodayTasks = () => {
    return tasks.filter((task) => isToday(task.dueDate));
  };

  const getUpcomingTasks = (days = 7) => {
    const today = new Date();
    const endDate = addDays(today, days);

    return tasks
      .filter(
        (task) =>
          !task.completed && task.dueDate > today && task.dueDate <= endDate
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => isSameDay(task.dueDate, date));
  };

  const generateSmartSuggestions = () => {
    const pendingTasks = tasks.filter((task) => !task.completed);
    if (pendingTasks.length === 0) {
      toast.info("No pending tasks to schedule");
      return;
    }

    // Sort by priority and due date
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
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
        suggestedTime: format(currentTime, "HH:mm"),
        duration,
        reasoning: `Priority: ${task.priority}, Due: ${format(
          task.dueDate,
          "MMM dd"
        )}`,
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
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(
      (task) => !task.completed && task.dueDate < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }
  if (!session?.user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Authentication Required</h3>
          <p className="text-muted-foreground">
            Please sign in to access the Smart Scheduler
          </p>
        </div>
      </div>
    );
  }

  const stats = getProductivityStats();
  return (
    <div className="h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            📅 Smart Scheduler
          </h1>
          <p className="text-muted-foreground mt-1">
            Intelligent task scheduling with adaptive learning
          </p>
        </div><div className="flex gap-2">
          <Button
            onClick={generateSmartSuggestions}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Brain className="h-4 w-4" />
            Smart Schedule
          </Button>
          
          <Button 
            className="flex items-center gap-2" 
            disabled={loading}
            onClick={() => setIsAddTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>

          <TaskModal
            isOpen={isAddTaskOpen}
            onClose={() => setIsAddTaskOpen(false)}
            onSubmit={handleAddTask}
            loading={loading}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </div>

      {/* Productivity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
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
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.overdue}
                  </p>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
            >
              Dismiss
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{suggestion.task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{suggestion.suggestedTime}</Badge>
                    <Badge variant="outline">{suggestion.duration}m</Badge>
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
            </CardHeader>            <CardContent>
              {mounted && (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              )}
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium">
                  Tasks for{" "}
                  {selectedDate
                    ? format(selectedDate, "MMM dd")
                    : "selected date"}
                </h4>                <ScrollArea className="h-32">
                  {selectedDate &&
                  getTasksForDate(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tasks for this date
                    </p>
                  ) : (
                    selectedDate &&
                    getTasksForDate(selectedDate).map((task) => (
                      <div
                        key={task._id || task.id}
                        className="flex items-center gap-2 py-1"
                      >
                        <Badge className={priorityColors[task.priority]}>
                          {priorityIcons[task.priority]}
                        </Badge>
                        <span
                          className={`text-sm ${
                            task.completed ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
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
            <CardHeader>              <CardTitle className="flex items-center justify-between">
                <span>Today&apos;s Schedule</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM dd, yyyy")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-64">                  {getTodayTasks().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks scheduled for today</p>
                      <p className="text-sm">Add a task to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getTodayTasks().map((task) => (                        <div
                          key={task._id || task.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card"
                        >
                          <button
                            onClick={() => toggleTaskComplete(task._id || task.id!)}
                            className="flex-shrink-0 hover:scale-110 transition-transform"
                            disabled={loading}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium ${
                                task.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {task.description}
                              </p>
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
                                <Badge variant="outline">{task.category}</Badge>
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
            <CardContent>              <ScrollArea className="h-64">
                {getUpcomingTasks().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming tasks</p>
                    <p className="text-sm">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingTasks().map((task) => (                      <div
                        key={task._id || task.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors bg-card"
                      >
                        <button
                          onClick={() =>
                            toggleTaskComplete(task._id || task.id!)
                          }
                          className="flex-shrink-0 hover:scale-110 transition-transform"
                          disabled={loading}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={priorityColors[task.priority]}>
                              {priorityIcons[task.priority]} {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              Due {format(task.dueDate, "MMM dd")}
                            </Badge>
                            {task.estimatedDuration && (
                              <Badge variant="outline">
                                {task.estimatedDuration}m
                              </Badge>
                            )}
                            {task.category && (
                              <Badge variant="outline">{task.category}</Badge>
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
