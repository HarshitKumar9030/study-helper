import mongoose from 'mongoose';

// Study Topic Schema
export interface IStudyTopic {
  _id?: string;
  title: string;
  subject: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  progress: IStudyProgress[];
  aiSuggestions?: IAISuggestion[];
}

// Study Progress Schema
export interface IStudyProgress {
  _id?: string;
  subtopic: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'needs-review';
  timeSpent: number; // in minutes
  notes?: { text: string; timestamp: Date }[];
  confidence: number; // 1-5 scale
  completedAt?: Date;
  lastStudied?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// AI Suggestion Schema
export interface IAISuggestion {
  _id?: string;
  type: 'tip' | 'resource' | 'practice' | 'review' | 'motivation';
  content: string;
  relevanceScore: number;
  createdAt: Date;
  isImplemented: boolean;
}

// Mongoose Schemas
const StudyProgressSchema = new mongoose.Schema({
  // topicId not needed for embedded documents
  subtopic: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['not-started', 'in-progress', 'completed', 'needs-review'],
    default: 'not-started'
  },
  timeSpent: { type: Number, default: 0 },
  notes: [{ 
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  confidence: { type: Number, min: 1, max: 5, default: 3 },
  completedAt: { type: Date },
  lastStudied: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AISuggestionSchema = new mongoose.Schema({
  // topicId not needed for embedded documents
  type: { 
    type: String, 
    enum: ['tip', 'resource', 'practice', 'review', 'motivation'],
    required: true 
  },
  content: { type: String, required: true },
  relevanceScore: { type: Number, min: 0, max: 1, default: 0.8 },
  createdAt: { type: Date, default: Date.now },
  isImplemented: { type: Boolean, default: false }
});

const StudyTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String },
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  estimatedHours: { type: Number, required: true },
  tags: [{ type: String }],
  userId: { type: String, required: true },
  progress: [StudyProgressSchema],
  aiSuggestions: [AISuggestionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
StudyTopicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const StudyTopic = mongoose.models.StudyTopic || mongoose.model<IStudyTopic>('StudyTopic', StudyTopicSchema);
export const StudyProgress = mongoose.models.StudyProgress || mongoose.model<IStudyProgress>('StudyProgress', StudyProgressSchema);
export const AISuggestion = mongoose.models.AISuggestion || mongoose.model<IAISuggestion>('AISuggestion', AISuggestionSchema);
