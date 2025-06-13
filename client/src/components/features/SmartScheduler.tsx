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
  suggestedDate: Date;
  duration: number;
  reasoning: string;
}

interface ScheduleBlock {
  _id?: string;
  taskId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: "task" | "break" | "meeting" | "study" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  completed: boolean;
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [schedulingInProgress, setSchedulingInProgress] = useState(
    new Set<string>()
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"tasks" | "schedule">("tasks");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const fetchTasks = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/scheduler/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }      const data = await response.json();
      console.log("Debug - Raw tasks data from API:", data);
      
      const tasksWithDates = data.tasks.map((task: any) => ({
        ...task,
        id: task._id, // Ensure id is set to _id
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
      }));
      
      console.log("Debug - Processed tasks:", tasksWithDates);
      setTasks(tasksWithDates);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const fetchScheduleBlocks = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/scheduler/blocks");
      if (!response.ok) {
        throw new Error("Failed to fetch schedule blocks");
      }
      const data = await response.json();
      const blocksWithDates = data.blocks.map((block: any) => ({
        ...block,
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
      }));
      setScheduleBlocks(blocksWithDates);
    } catch (error) {
      console.error("Error fetching schedule blocks:", error);
      // Don't show error toast as this might be expected if blocks API doesn't exist yet
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
  const createScheduleBlock = useCallback(
    async (suggestion: ScheduleSuggestion, skipConflictCheck = false) => {
      if (!session?.user) return false;

      try {
        const endTime = new Date(
          suggestion.suggestedDate.getTime() + suggestion.duration * 60000
        );        const blockData = {
          taskId: suggestion.task._id || suggestion.task.id, // Use _id (MongoDB ObjectId) for taskId
          title: suggestion.task.title,
          startTime: suggestion.suggestedDate,
          endTime: endTime,
          duration: suggestion.duration,
          type: "task",
          priority: suggestion.task.priority,
          completed: false,
          checkConflicts: !skipConflictCheck, // Allow disabling conflict check
        };

        // Debug logging to track undefined values
        console.log("Debug - Creating schedule block with data:", {
          taskId: blockData.taskId,
          originalTask: suggestion.task,
          hasTaskId: !!blockData.taskId,
          taskIdType: typeof blockData.taskId
        });

        if (!blockData.taskId) {
          console.error("Task ID is undefined:", {
            taskId: suggestion.task._id,
            id: suggestion.task.id,
            task: suggestion.task
          });
          throw new Error("Task ID is missing - cannot create schedule block");
        }

        const response = await fetch("/api/scheduler/blocks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(blockData),
        });
        if (!response.ok) {
          if (response.status === 409) {
            // Handle conflicts gracefully
            try {
              const errorData = await response.json();
              console.warn("Schedule conflict detected:", {
                task: suggestion.task.title,
                suggestedTime: suggestion.suggestedTime,
                conflicts: errorData.conflicts,
              });
              toast.warning(
                `Schedule conflict for "${suggestion.task.title}". Try a different time slot.`
              );
            } catch (jsonError) {
              console.warn("Failed to parse 409 error response");
              toast.warning(
                `Schedule conflict for "${suggestion.task.title}". Try a different time slot.`
              );
            }
            return false;
          }

          let errorMessage = "Failed to create schedule block";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error("API Error:", {
              status: response.status,
              error: errorData,
              task: suggestion.task.title,
              requestData: blockData,
            });
          } catch (jsonError) {
            console.error("API Error (failed to parse response):", {
              status: response.status,
              statusText: response.statusText,
              task: suggestion.task.title,
              requestData: blockData,
            });
          }

          throw new Error(errorMessage);
        }

        return true;
      } catch (error) {
        console.error("Error creating schedule block:", error);
        if (error instanceof Error && error.message.includes("conflict")) {
          toast.warning(
            `"${suggestion.task.title}" conflicts with existing schedule`
          );
        } else {
          toast.error(`Failed to schedule "${suggestion.task.title}"`);
        }
        return false;
      }
    },
    [session?.user]
  );  const scheduleTask = async (suggestion: ScheduleSuggestion) => {
    const taskId = suggestion.task._id || suggestion.task.id;
    
    console.log("Debug - scheduleTask called with:", {
      taskId,
      task: suggestion.task,
      suggestion
    });
    
    if (!taskId) {
      console.error("No valid task ID found");
      toast.error("Invalid task - no ID found");
      return;
    }

    // Prevent duplicate scheduling attempts
    if (schedulingInProgress.has(taskId)) {
      toast.info("Task is already being scheduled...");
      return;
    }

    setSchedulingInProgress((prev) => new Set(prev).add(taskId));

    try {
      const success = await createScheduleBlock(suggestion);
      if (success) {
        toast.success(
          `Scheduled "${suggestion.task.title}" for ${suggestion.suggestedTime}`
        );
        // Remove the suggestion from the list
        setSuggestions((prev) =>
          prev.filter(
            (s) =>
              s.task._id !== suggestion.task._id &&
              s.task.id !== suggestion.task.id
          )
        );
        // Refresh schedule blocks to show the new block
        fetchScheduleBlocks();
      }
    } finally {
      setSchedulingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };
  const scheduleAllSuggestions = async () => {
    if (suggestions.length === 0) return;

    setLoading(true);
    let successCount = 0;
    const failed: ScheduleSuggestion[] = [];

    // Process suggestions sequentially to avoid race conditions
    for (const suggestion of suggestions) {
      const success = await createScheduleBlock(suggestion);
      if (success) {
        successCount++;
        // Remove successful suggestions from state immediately
        setSuggestions((prev) =>
          prev.filter(
            (s) =>
              s.task._id !== suggestion.task._id &&
              s.task.id !== suggestion.task.id
          )
        );
        // Small delay to prevent rapid API calls
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        failed.push(suggestion);
      }
    }

    setLoading(false);

    if (successCount === suggestions.length) {
      toast.success(`Successfully scheduled all ${successCount} tasks!`);
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (successCount > 0) {
      toast.success(
        `Scheduled ${successCount} out of ${suggestions.length} tasks`
      );
      if (failed.length > 0) {
        toast.info(
          `${failed.length} tasks had scheduling conflicts. Try adjusting their times manually.`
        );
      }
    } else {
      toast.error(
        "Unable to schedule any tasks due to conflicts. Try generating new suggestions or manual scheduling."
      );
    }

    // Refresh schedule blocks to show the new blocks
    fetchScheduleBlocks();
  };
  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
  }, []);
  useEffect(() => {
    if (session?.user) {
      fetchTasks();
      fetchScheduleBlocks();
    }
  }, [session?.user, fetchTasks, fetchScheduleBlocks]);

  // Cleanup scheduling progress on unmount
  useEffect(() => {
    return () => {
      setSchedulingInProgress(new Set());
    };
  }, []);
  const handleAddTask = async (taskData: any) => {
    const createdTask = await createTask(taskData);
    if (createdTask) {
      setTasks((prev) => [...prev, createdTask]);
      setIsAddTaskOpen(false);
      toast.success("Task added successfully!");
    }
  };
  const toggleTaskComplete = async (taskId: string) => {
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
    const endDate = showAllUpcoming
      ? addDays(today, 365)
      : addDays(today, days); // Show all tasks for a year if "View All" is clicked

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

  const getScheduleBlocksForDate = (date: Date) => {
    return scheduleBlocks.filter((block) => isSameDay(block.startTime, date));
  };

  const getScheduleForDate = (date: Date) => {
    const tasksForDate = getTasksForDate(date);
    const blocksForDate = getScheduleBlocksForDate(date);

    return {
      tasks: tasksForDate,
      blocks: blocksForDate.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      totalScheduledTime: blocksForDate.reduce(
        (total, block) => total + block.duration,
        0
      ),
    };
  };  const generateSmartSuggestions = () => {
    const pendingTasks = tasks.filter((task) => !task.completed);
    
    console.log("Debug - All tasks:", tasks);
    console.log("Debug - Pending tasks:", pendingTasks);
    
    if (pendingTasks.length === 0) {
      toast.info("No pending tasks to schedule");
      return;
    }

    // Sort by priority and due date with urgency score
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const now = new Date();

      // Calculate urgency score based on due date proximity
      const getUrgencyScore = (task: Task) => {
        const daysUntilDue = Math.ceil(
          (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const priorityScore = priorityOrder[task.priority];

        if (daysUntilDue <= 1) return priorityScore + 10; // Very urgent
        if (daysUntilDue <= 3) return priorityScore + 5; // Urgent
        if (daysUntilDue <= 7) return priorityScore + 2; // Soon
        return priorityScore; // Normal
      };

      return getUrgencyScore(b) - getUrgencyScore(a);
    });

    const newSuggestions: ScheduleSuggestion[] = [];
    let currentTime = new Date();

    // Start scheduling from next available slot (if current time is past work hours, start tomorrow)
    const now = new Date();
    const workStartHour = 9;
    const workEndHour = 18;

    if (now.getHours() >= workEndHour) {
      // Start tomorrow
      currentTime = addDays(now, 1);
      currentTime.setHours(workStartHour, 0, 0, 0);
    } else if (now.getHours() < workStartHour) {
      // Start today at work hours
      currentTime.setHours(workStartHour, 0, 0, 0);
    } else {
      // Start from current time, rounded to next 15-minute interval
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      currentTime.setMinutes(minutes, 0, 0);
      if (minutes >= 60) {
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      }
    }
    sortedTasks.slice(0, 8).forEach((task, index) => {
      const duration = task.estimatedDuration || 30;

      // Skip weekends for work tasks
      while (currentTime.getDay() === 0 || currentTime.getDay() === 6) {
        currentTime = addDays(currentTime, 1);
        currentTime.setHours(workStartHour, 0, 0, 0);
      }

      // Helper function to check if a time slot conflicts with existing blocks
      const hasConflict = (startTime: Date, duration: number) => {
        const endTime = new Date(startTime.getTime() + duration * 60000);
        return scheduleBlocks.some((block) => {
          const blockStart = new Date(block.startTime);
          const blockEnd = new Date(block.endTime);
          return startTime < blockEnd && endTime > blockStart;
        });
      };

      // Helper function to find next available time slot
      const findNextAvailableSlot = (startTime: Date, duration: number) => {
        let attempts = 0;
        let searchTime = new Date(startTime);

        while (attempts < 50) {
          // Prevent infinite loop
          if (!hasConflict(searchTime, duration)) {
            // Check if slot fits within work hours
            const taskEndTime = new Date(
              searchTime.getTime() + duration * 60000
            );
            if (taskEndTime.getHours() <= workEndHour) {
              return searchTime;
            }
          }

          // Move to next 15-minute slot
          searchTime = new Date(searchTime.getTime() + 15 * 60000);

          // If past work hours, move to next day
          if (searchTime.getHours() >= workEndHour) {
            searchTime = addDays(searchTime, 1);
            searchTime.setHours(workStartHour, 0, 0, 0);

            // Skip weekends
            while (searchTime.getDay() === 0 || searchTime.getDay() === 6) {
              searchTime = addDays(searchTime, 1);
              searchTime.setHours(workStartHour, 0, 0, 0);
            }
          }

          attempts++;
        }

        return searchTime; // Return last attempt if no perfect slot found
      };

      // Find next available slot that doesn't conflict
      const availableTime = findNextAvailableSlot(currentTime, duration);

      const daysUntilDue = Math.ceil(
        (task.dueDate.getTime() - availableTime.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      let reasoning = `Priority: ${task.priority}`;

      if (daysUntilDue <= 1) {
        reasoning += `, ⚠️ Due ${daysUntilDue === 0 ? "today" : "tomorrow"}`;
      } else if (daysUntilDue <= 7) {
        reasoning += `, Due in ${daysUntilDue} days`;
      } else {
        reasoning += `, Due ${format(task.dueDate, "MMM dd")}`;
      }      const suggestion: ScheduleSuggestion = {
        task,
        suggestedTime: format(availableTime, "MMM dd, HH:mm"),
        suggestedDate: new Date(availableTime),
        duration,
        reasoning,
      };

      console.log("Debug - Created suggestion:", {
        suggestion,
        taskId: task._id,
        taskIdExists: !!task._id
      });

      newSuggestions.push(suggestion);

      // Update current time to after this suggested slot (plus break time)
      currentTime = new Date(availableTime.getTime() + (duration + 15) * 60000);
    });

    setSuggestions(newSuggestions);
    setShowSuggestions(true);
    toast.success(
      `Generated ${newSuggestions.length} smart scheduling suggestions!`
    );
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
          <h3 className="text-lg font-medium text-foreground">
            Authentication Required
          </h3>
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
        </div>{" "}
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border p-1">
            <Button
              variant={viewMode === "tasks" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tasks")}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={viewMode === "schedule" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("schedule")}
              className="flex items-center gap-1"
            >
              <CalendarIcon className="h-4 w-4" />
              Schedule
            </Button>
          </div>

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {" "}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>{" "}
      {/* Smart Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Schedule Suggestions
              <Badge variant="outline" className="ml-2">
                {suggestions.length} tasks
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={scheduleAllSuggestions}
                disabled={loading}
                className="flex items-center gap-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="h-4 w-4" />
                )}
                Schedule All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
              >
                Dismiss
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.task._id || suggestion.task.id}-${index}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {suggestion.task.title}
                      </h4>
                      <Badge
                        className={priorityColors[suggestion.task.priority]}
                      >
                        {priorityIcons[suggestion.task.priority]}{" "}
                        {suggestion.task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.reasoning}
                    </p>
                    {suggestion.task.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {suggestion.suggestedTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.duration} minutes
                      </div>
                    </div>{" "}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => scheduleTask(suggestion)}
                      disabled={
                        loading ||
                        schedulingInProgress.has(
                          suggestion.task._id || suggestion.task.id || ""
                        )
                      }
                      className="flex items-center gap-1"
                    >
                      {schedulingInProgress.has(
                        suggestion.task._id || suggestion.task.id || ""
                      ) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="h-3 w-3" />
                          Schedule
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Smart Scheduling Tips:</strong> Tasks are scheduled
                based on priority, due dates, and optimal work hours (9 AM - 6
                PM, weekdays only). Higher priority and closer due dates get
                earlier time slots.
              </p>
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
            </CardHeader>{" "}
            <CardContent>
              {mounted && (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              )}{" "}
              <Separator className="my-4" />
              <div className="space-y-3">
                <h4 className="font-medium">
                  {selectedDate
                    ? format(selectedDate, "MMM dd")
                    : "selected date"}
                </h4>

                {selectedDate && (
                  <div className="space-y-2">
                    {(() => {
                      const daySchedule = getScheduleForDate(selectedDate);
                      return (
                        <>
                          {/* Schedule Blocks */}
                          {daySchedule.blocks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                📅 Scheduled ({daySchedule.totalScheduledTime}m
                                total)
                              </p>
                              <ScrollArea className="h-24">
                                {daySchedule.blocks.map((block) => (
                                  <div
                                    key={block._id}
                                    className="flex items-center gap-2 py-1 text-xs"
                                  >
                                    {" "}
                                    <Badge
                                      className={priorityColors[block.priority]}
                                    >
                                      {priorityIcons[block.priority]}
                                    </Badge>
                                    <span className="flex-1 truncate">
                                      {format(block.startTime, "HH:mm")} -{" "}
                                      {block.title}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {block.duration}m
                                    </span>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          )}

                          {/* Due Tasks */}
                          {daySchedule.tasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                📋 Due Tasks
                              </p>
                              <ScrollArea className="h-24">
                                {daySchedule.tasks.map((task) => (
                                  <div
                                    key={task._id || task.id}
                                    className="flex items-center gap-2 py-1"
                                  >
                                    {" "}
                                    <Badge
                                      className={priorityColors[task.priority]}
                                    >
                                      {priorityIcons[task.priority]}
                                    </Badge>
                                    <span
                                      className={`text-sm flex-1 truncate ${
                                        task.completed
                                          ? "line-through text-muted-foreground"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                          )}

                          {daySchedule.blocks.length === 0 &&
                            daySchedule.tasks.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No tasks or schedule for this date
                              </p>
                            )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>{" "}
        {/* Right Panel - Task Lists or Schedule View */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === "tasks" ? (
            <>
              {/* Today's Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
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
                    <ScrollArea className="h-64">
                      {getTodayTasks().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No tasks scheduled for today</p>
                          <p className="text-sm">Add a task to get started!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getTodayTasks().map((task) => (
                            <div
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
                                  <Badge
                                    className={priorityColors[task.priority]}
                                  >
                                    {priorityIcons[task.priority]}{" "}
                                    {task.priority}
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
                                  onClick={() =>
                                    deleteTask(task._id || task.id!)
                                  }
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
                {" "}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Tasks</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                    >
                      {showAllUpcoming ? "Show Less" : "View All"}
                    </Button>
                  </CardTitle>
                </CardHeader>{" "}
                <CardContent>
                  <ScrollArea className={showAllUpcoming ? "h-96" : "h-64"}>
                    {getUpcomingTasks().length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No upcoming tasks</p>
                        <p className="text-sm">You&apos;re all caught up!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getUpcomingTasks()
                          .slice(0, showAllUpcoming ? undefined : 5)
                          .map((task) => (
                            <div
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
                                <h4 className="font-medium text-foreground">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={priorityColors[task.priority]}
                                  >
                                    {priorityIcons[task.priority]}{" "}
                                    {task.priority}
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
                                  onClick={() =>
                                    deleteTask(task._id || task.id!)
                                  }
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        {!showAllUpcoming && getUpcomingTasks().length > 5 && (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            {getUpcomingTasks().length - 5} more tasks...
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-auto p-1 text-xs"
                              onClick={() => setShowAllUpcoming(true)}
                            >
                              Show All
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Schedule View */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Daily Schedule</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedDate
                      ? format(selectedDate, "EEEE, MMMM dd, yyyy")
                      : format(new Date(), "EEEE, MMMM dd, yyyy")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {(() => {
                    const scheduleDate = selectedDate || new Date();
                    const daySchedule = getScheduleForDate(scheduleDate);

                    if (daySchedule.blocks.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No scheduled blocks for this day</p>
                          <p className="text-sm">
                            Use Smart Schedule to create a schedule!
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {/* Time slots from 9 AM to 6 PM */}
                        {Array.from({ length: 10 }, (_, i) => {
                          const hour = 9 + i;
                          const timeSlot = new Date(scheduleDate);
                          timeSlot.setHours(hour, 0, 0, 0);

                          const blocksInSlot = daySchedule.blocks.filter(
                            (block) => block.startTime.getHours() === hour
                          );

                          return (
                            <div key={hour} className="flex gap-4 items-start">
                              <div className="w-16 text-sm text-muted-foreground font-mono">
                                {format(timeSlot, "HH:mm")}
                              </div>
                              <div className="flex-1">
                                {blocksInSlot.length > 0 ? (
                                  blocksInSlot.map((block) => (
                                    <div
                                      key={block._id}
                                      className="p-3 rounded-lg border border-border bg-accent/30 mb-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-foreground">
                                          {block.title}
                                        </h4>
                                        <Badge
                                          className={
                                            priorityColors[block.priority]
                                          }
                                        >
                                          {priorityIcons[block.priority]}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {format(block.startTime, "HH:mm")} -{" "}
                                        {format(block.endTime, "HH:mm")} (
                                        {block.duration}m)
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="h-12 border-l-2 border-dashed border-muted-foreground/30 ml-2" />
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            📊 <strong>Schedule Summary:</strong>{" "}
                            {daySchedule.blocks.length} blocks,{" "}
                            {daySchedule.totalScheduledTime} minutes total
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
