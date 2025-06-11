import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  tags: string[];
  subtasks: Array<{
    title: string;
    completed: boolean;
    createdAt: Date;
  }>;
  reminders: Array<{
    time: Date;
    type: 'notification' | 'email';
    sent: boolean;
  }>;
  category?: string;
  progress?: number; // 0-100
  dependencies?: mongoose.Types.ObjectId[]; // other task IDs this depends on
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  lastSyncedAt?: Date;
}

export interface IScheduleBlock extends Document {
  userId: mongoose.Types.ObjectId;
  blockId?: string;
  taskId?: mongoose.Types.ObjectId;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: 'task' | 'break' | 'meeting' | 'study' | 'other';
  description?: string;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every N days/weeks/months
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    endDate?: Date;
  };
  color?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface IScheduleSettings extends Document {
  userId: mongoose.Types.ObjectId;
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  workingDays: number[]; // 0-6, Sunday = 0
  defaultTaskDuration: number; // in minutes
  breakDuration: number; // in minutes
  breakFrequency: number; // every N minutes
  autoSchedule: boolean;
  bufferTime: number; // minutes between tasks
  focusTimeBlocks: Array<{
    name: string;
    start: string; // HH:MM
    end: string; // HH:MM
    days: number[]; // 0-6
  }>;
  categories: Array<{
    name: string;
    color: string;
    defaultDuration: number;
  }>;
  notifications: {
    taskReminders: boolean;
    scheduleUpdates: boolean;
    dailySummary: boolean;
    reminderTime: number; // minutes before
  };
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  taskId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  dueDate: { type: Date, required: true, index: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium',
    index: true
  },
  completed: { type: Boolean, default: false, index: true },
  estimatedDuration: { type: Number, min: 1, max: 1440 }, // max 24 hours
  actualDuration: { type: Number, min: 0 },
  tags: [{ type: String, trim: true, maxlength: 50 }],
  subtasks: [{
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  reminders: [{
    time: { type: Date, required: true },
    type: { type: String, enum: ['notification', 'email'], default: 'notification' },
    sent: { type: Boolean, default: false }
  }],
  category: { type: String, trim: true, maxlength: 50 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  lastSyncedAt: { type: Date }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const ScheduleBlockSchema = new Schema<IScheduleBlock>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  blockId: { type: String, unique: true, sparse: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  duration: { type: Number, required: true, min: 1 },
  type: { 
    type: String, 
    enum: ['task', 'break', 'meeting', 'study', 'other'], 
    default: 'task',
    index: true
  },
  description: { type: String, trim: true, maxlength: 500 },
  location: { type: String, trim: true, maxlength: 200 },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    interval: { type: Number, min: 1, max: 365 },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    endDate: { type: Date }
  },
  color: { type: String, trim: true, maxlength: 7 }, // hex color
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium'
  },
  completed: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const ScheduleSettingsSchema = new Schema<IScheduleSettings>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  workingHours: {
    start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
  },
  workingDays: [{ type: Number, min: 0, max: 6 }],
  defaultTaskDuration: { type: Number, min: 5, max: 480, default: 30 },
  breakDuration: { type: Number, min: 1, max: 60, default: 5 },
  breakFrequency: { type: Number, min: 15, max: 480, default: 60 },
  autoSchedule: { type: Boolean, default: true },
  bufferTime: { type: Number, min: 0, max: 60, default: 5 },
  focusTimeBlocks: [{
    name: { type: String, required: true, trim: true, maxlength: 50 },
    start: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    end: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    days: [{ type: Number, min: 0, max: 6 }]
  }],
  categories: [{
    name: { type: String, required: true, trim: true, maxlength: 50 },
    color: { type: String, required: true, trim: true, maxlength: 7 },
    defaultDuration: { type: Number, min: 5, max: 480, default: 30 }
  }],
  notifications: {
    taskReminders: { type: Boolean, default: true },
    scheduleUpdates: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
    reminderTime: { type: Number, min: 1, max: 1440, default: 15 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for better performance
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, completed: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });

ScheduleBlockSchema.index({ userId: 1, startTime: 1, endTime: 1 });
ScheduleBlockSchema.index({ userId: 1, type: 1 });
ScheduleBlockSchema.index({ userId: 1, completed: 1 });

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

ScheduleBlockSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Calculate duration from start and end times
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  next();
});

// Static methods for analytics
TaskSchema.statics.getTaskStats = async function(userId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: ['$completed', 1, 0] } },
        overdueTasks: {
          $sum: {
            $cond: [
              { $and: [{ $lt: ['$dueDate', new Date()] }, { $eq: ['$completed', false] }] },
              1,
              0
            ]
          }
        },
        avgEstimatedDuration: { $avg: '$estimatedDuration' },
        totalEstimatedTime: { $sum: '$estimatedDuration' }
      }
    }
  ]);
};

// Export models
export const TaskModel: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export const ScheduleBlockModel: Model<IScheduleBlock> = mongoose.models.ScheduleBlock || mongoose.model<IScheduleBlock>('ScheduleBlock', ScheduleBlockSchema);
export const ScheduleSettingsModel: Model<IScheduleSettings> = mongoose.models.ScheduleSettings || mongoose.model<IScheduleSettings>('ScheduleSettings', ScheduleSettingsSchema);
