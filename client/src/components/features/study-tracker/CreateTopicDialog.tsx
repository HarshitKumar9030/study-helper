"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IStudyTopic } from '@/lib/models/study-tracker';
import { cn } from '@/lib/utils';

interface CreateTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTopic: (topic: Partial<IStudyTopic>) => void;
}

export function CreateTopicDialog({ open, onOpenChange, onCreateTopic }: CreateTopicDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    estimatedHours: 1,
    tags: [] as string[],
    subtopics: [] as string[]
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentSubtopic, setCurrentSubtopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSubtopics, setIsGeneratingSubtopics] = useState(false);

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSubtopic = () => {
    if (currentSubtopic.trim() && !formData.subtopics.includes(currentSubtopic.trim())) {
      setFormData(prev => ({
        ...prev,
        subtopics: [...prev.subtopics, currentSubtopic.trim()]
      }));
      setCurrentSubtopic('');
    }
  };

  const handleRemoveSubtopic = (subtopicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subtopics: prev.subtopics.filter(subtopic => subtopic !== subtopicToRemove)
    }));
  };

  const generateSubtopics = async () => {
    if (!formData.title.trim() || !formData.subject.trim()) {
      return;
    }

    setIsGeneratingSubtopics(true);
    
    try {
      const response = await fetch('https://ai.hackclub.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an educational AI assistant. Generate a list of 4-8 specific subtopics for a given study topic. Return only a JSON array of strings, no other text.'
            },
            {
              role: 'user',
              content: `Generate subtopics for: "${formData.title}" in ${formData.subject} (${formData.difficulty} level). Return format: ["subtopic1", "subtopic2", ...]`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        let aiResponse = data.choices?.[0]?.message?.content;
        
        if (aiResponse) {
          // Clean up the response
          aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          try {
            const generatedSubtopics = JSON.parse(aiResponse);
            if (Array.isArray(generatedSubtopics)) {
              setFormData(prev => ({
                ...prev,
                subtopics: [...prev.subtopics, ...generatedSubtopics.filter(st => !prev.subtopics.includes(st))]
              }));
            }
          } catch (parseError) {
            // Fallback subtopics based on subject
            const fallbackSubtopics = getFallbackSubtopics(formData.subject, formData.title);
            setFormData(prev => ({
              ...prev,
              subtopics: [...prev.subtopics, ...fallbackSubtopics.filter(st => !prev.subtopics.includes(st))]
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error generating subtopics:', error);
      // Use fallback subtopics
      const fallbackSubtopics = getFallbackSubtopics(formData.subject, formData.title);
      setFormData(prev => ({
        ...prev,
        subtopics: [...prev.subtopics, ...fallbackSubtopics.filter(st => !prev.subtopics.includes(st))]
      }));
    } finally {
      setIsGeneratingSubtopics(false);
    }
  };

  const getFallbackSubtopics = (subject: string, title: string) => {
    const subjectLower = subject.toLowerCase();
    const titleLower = title.toLowerCase();

    if (subjectLower.includes('chemistry')) {
      return ['Basic Concepts', 'Key Reactions', 'Problem Solving', 'Real-world Applications'];
    } else if (subjectLower.includes('mathematics') || subjectLower.includes('math')) {
      return ['Fundamental Principles', 'Formulas & Equations', 'Practice Problems', 'Applications'];
    } else if (subjectLower.includes('physics')) {
      return ['Theory & Concepts', 'Laws & Principles', 'Calculations', 'Practical Examples'];
    } else if (subjectLower.includes('biology')) {
      return ['Basic Structure', 'Functions & Processes', 'Classifications', 'Examples & Case Studies'];
    } else if (subjectLower.includes('history')) {
      return ['Background & Context', 'Key Events', 'Important Figures', 'Impact & Consequences'];
    } else if (subjectLower.includes('literature')) {
      return ['Plot & Structure', 'Characters & Themes', 'Literary Devices', 'Analysis & Interpretation'];
    } else {
      return ['Introduction', 'Core Concepts', 'Key Points', 'Summary & Review'];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Create initial progress entries for each subtopic
      const initialProgress = formData.subtopics.map(subtopic => ({
        subtopic,
        status: 'not-started' as const,
        timeSpent: 0,
        confidence: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as any; // Will be properly typed when saved to database

      const topicData: Partial<IStudyTopic> = {
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim() || undefined,
        difficulty: formData.difficulty,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags,
        progress: initialProgress,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onCreateTopic(topicData);
      
      // Reset form
      setFormData({
        title: '',
        subject: '',
        description: '',
        difficulty: 'intermediate',
        estimatedHours: 1,
        tags: [],
        subtopics: []
      });
      setCurrentTag('');
      setCurrentSubtopic('');
    } catch (error) {
      console.error('Error creating topic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'History', 'Geography', 'Literature', 'Economics', 'Philosophy',
    'Psychology', 'Sociology', 'Art', 'Music', 'Language'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">Create New Study Topic</DialogTitle>
          <DialogDescription className="text-base">
            Add a new topic to track your learning progress and get AI-powered insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Topic Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chemistry Chapter 1 (Solutions)"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this topic covers..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                    setFormData(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimatedHours: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Subtopics */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Subtopics</Label>
                <Button
                  type="button"
                  onClick={generateSubtopics}
                  disabled={isGeneratingSubtopics || !formData.title.trim() || !formData.subject.trim()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className={cn("w-4 h-4", isGeneratingSubtopics && "animate-spin")} />
                  {isGeneratingSubtopics ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                Break down your topic into smaller, manageable subtopics for better progress tracking.
              </p>
              
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="e.g., Types of Solutions, Concentration Units..."
                  value={currentSubtopic}
                  onChange={(e) => setCurrentSubtopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtopic())}
                />
                <Button type="button" onClick={handleAddSubtopic} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.subtopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.subtopics.map((subtopic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge variant="secondary" className="gap-1 pr-1">
                        {subtopic}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtopic(subtopic)}
                          className="ml-1 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div>
              <Label>Tags</Label>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                Add relevant tags to help organize and search your topics.
              </p>
              
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="e.g., exam, revision, important..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge variant="outline" className="gap-1 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.subject.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Topic
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
