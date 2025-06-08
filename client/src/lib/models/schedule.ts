import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduleItem extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subject?: string;
  dueDate?: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  tags?: string[];
  reminder?: {
    enabled: boolean;
    time: Date;
    notified: boolean;
  };
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  lastSyncedAt?: Date;
}

const ScheduleItemSchema = new Schema<IScheduleItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    dueDate: {
      type: Date,
      index: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration cannot exceed 24 hours'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      time: {
        type: Date,
      },
      notified: {
        type: Boolean,
        default: false,
      },
    },
    recurrence: {
      type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      interval: {
        type: Number,
        min: [1, 'Interval must be at least 1'],
      },
      endDate: {
        type: Date,
      },
    },
    completedAt: {
      type: Date,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ScheduleItemSchema.index({ userId: 1, status: 1 });
ScheduleItemSchema.index({ userId: 1, dueDate: 1 });
ScheduleItemSchema.index({ userId: 1, priority: 1 });
ScheduleItemSchema.index({ userId: 1, subject: 1 });

// Virtual for checking if task is overdue
ScheduleItemSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Pre-save middleware to update lastSyncedAt
ScheduleItemSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

export const ScheduleItemModel: Model<IScheduleItem> = 
  mongoose.models.ScheduleItem || mongoose.model<IScheduleItem>('ScheduleItem', ScheduleItemSchema);
