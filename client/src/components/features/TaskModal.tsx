"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Tag, Folder, AlertCircle, Plus } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  loading: boolean;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}

const SimpleTaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  selectedDate,
  setSelectedDate,
}) => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    estimatedDuration: 30,
    tags: "",
    category: "",
  });

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        estimatedDuration: 30,
        tags: "",
        category: "",
      });
      if (setSelectedDate) {
        setSelectedDate(new Date());
      }
    }
  }, [isOpen, setSelectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (!selectedDate) {
      alert("Please select a due date");
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      dueDate: selectedDate,
      priority: formData.priority,
      completed: false,
      estimatedDuration: formData.estimatedDuration,
      tags: formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim())
        : [],
      category: formData.category || undefined,
    };

    onSubmit(taskData);
  };

  // Don't render on server side to prevent hydration issues
  if (!mounted || !isOpen) return null;
  const priorityConfig = {
    low: { color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    medium: { color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
    high: { color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    urgent: { color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
        {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden transform transition-all border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create New Task</h2>
                <p className="text-blue-100 text-sm">Add a new task to your schedule</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">            {/* Title */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-foreground">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground bg-background text-foreground"
                placeholder="What needs to be done?"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-foreground">
                <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground resize-none bg-background text-foreground"
                placeholder="Add more details about this task..."
                rows={3}
              />
            </div>

            {/* Priority & Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">              {/* Priority */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                  Priority Level
                </label>
                <div className="space-y-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                    <label
                      key={priority}
                      className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 ${
                        formData.priority === priority
                          ? `${priorityConfig[priority].bg} ${priorityConfig[priority].border}`
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`w-3 h-3 rounded-full ${priorityConfig[priority].color} mr-3`} />
                      <span className={`font-medium capitalize ${
                        formData.priority === priority 
                          ? priorityConfig[priority].text 
                          : 'text-foreground'
                      }`}>
                        {priority}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-foreground">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-3 pr-16 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
                      min={5}
                      max={480}
                      placeholder="30"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      min
                    </span>
                  </div>
                </div>

                {/* Quick duration buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData({ ...formData, estimatedDuration: duration })}                      className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                        formData.estimatedDuration === duration
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {duration}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category & Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground bg-background text-foreground"
                  placeholder="e.g., Study, Work, Personal"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground bg-background text-foreground"
                  placeholder="math, exam, important"
                />
              </div>
            </div>            {/* Due Date */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-foreground">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                Due Date
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value + 'T00:00:00');
                    setSelectedDate(newDate);
                  }}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                {selectedDate && (
                  <div className="flex items-center px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <Calendar className="w-4 h-4 text-primary mr-2" />
                    <span className="text-primary text-sm font-medium">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>        {/* Footer */}
        <div className="border-t border-border px-6 py-4 bg-muted/50">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-border text-foreground rounded-xl hover:bg-accent transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim() || !selectedDate}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTaskModal;
