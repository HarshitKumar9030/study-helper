import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFocusSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId?: string;
  title?: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  blockedSites: string[];
  blockedApps: string[];
  strictMode: boolean;
  breaks: Array<{
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    type: 'scheduled' | 'manual';
  }>;
  productivity: {
    distractionCount: number;
    sitesBlocked: number;
    appsBlocked: number;
    focusScore?: number; // 0-100
    timeSpentFocused?: number; // in minutes
    timeSpentDistracted?: number; // in minutes
  };
  tasks?: mongoose.Types.ObjectId[]; // references to ScheduleItem
  notes?: string;
  tags?: string[];
  metadata?: {
    device: string;
    platform: string;
    version: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface IFocusSettings extends Document {
  userId: mongoose.Types.ObjectId;
  defaultDuration: number; // in minutes
  defaultBreakDuration: number; // in minutes
  autoStartBreaks: boolean;
  strictMode: boolean;
  allowEmergencyBreak: boolean;
  blockedSites: string[];
  blockedApps: string[];
  whitelistedSites: string[];
  whitelistedApps: string[];
  blockingMethod: 'soft' | 'hard'; // soft = warnings, hard = complete block
  notifications: {
    sessionStart: boolean;
    sessionEnd: boolean;
    breakTime: boolean;
    blockingActive: boolean;
  };
  presets: Array<{
    name: string;
    duration: number;
    blockedSites: string[];
    blockedApps: string[];
    strictMode: boolean;
  }>;
  statistics: {
    totalSessions: number;
    totalFocusTime: number; // in minutes
    averageSessionLength: number;
    longestSession: number;
    currentStreak: number;
    longestStreak: number;
    lastSessionDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
    },
    plannedDuration: {
      type: Number,
      required: [true, 'Planned duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 8 hours'],
    },
    actualDuration: {
      type: Number,
      min: [0, 'Actual duration cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    blockedSites: [{
      type: String,
      trim: true,
    }],
    blockedApps: [{
      type: String,
      trim: true,
    }],
    strictMode: {
      type: Boolean,
      default: false,
    },
    breaks: [{
      startTime: {
        type: Date,
        required: true,
      },
      endTime: Date,
      duration: {
        type: Number,
        required: true,
        min: [1, 'Break duration must be at least 1 minute'],
      },
      type: {
        type: String,
        enum: ['scheduled', 'manual'],
        default: 'manual',
      },
    }],
    productivity: {
      distractionCount: {
        type: Number,
        default: 0,
        min: [0, 'Distraction count cannot be negative'],
      },
      sitesBlocked: {
        type: Number,
        default: 0,
        min: [0, 'Sites blocked count cannot be negative'],
      },
      appsBlocked: {
        type: Number,
        default: 0,
        min: [0, 'Apps blocked count cannot be negative'],
      },
      focusScore: {
        type: Number,
        min: [0, 'Focus score cannot be negative'],
        max: [100, 'Focus score cannot exceed 100'],
      },
      timeSpentFocused: {
        type: Number,
        default: 0,
        min: [0, 'Focus time cannot be negative'],
      },
      timeSpentDistracted: {
        type: Number,
        default: 0,
        min: [0, 'Distraction time cannot be negative'],
      },
    },
    tasks: [{
      type: Schema.Types.ObjectId,
      ref: 'ScheduleItem',
    }],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    metadata: {
      device: String,
      platform: String,
      version: String,
    },
    lastSyncedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const FocusSettingsSchema = new Schema<IFocusSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    defaultDuration: {
      type: Number,
      default: 25,
      min: [1, 'Default duration must be at least 1 minute'],
      max: [480, 'Default duration cannot exceed 8 hours'],
    },
    defaultBreakDuration: {
      type: Number,
      default: 5,
      min: [1, 'Break duration must be at least 1 minute'],
      max: [60, 'Break duration cannot exceed 1 hour'],
    },
    autoStartBreaks: {
      type: Boolean,
      default: false,
    },
    strictMode: {
      type: Boolean,
      default: false,
    },
    allowEmergencyBreak: {
      type: Boolean,
      default: true,
    },
    blockedSites: [{
      type: String,
      trim: true,
    }],
    blockedApps: [{
      type: String,
      trim: true,
    }],
    whitelistedSites: [{
      type: String,
      trim: true,
    }],
    whitelistedApps: [{
      type: String,
      trim: true,
    }],
    blockingMethod: {
      type: String,
      enum: ['soft', 'hard'],
      default: 'soft',
    },
    notifications: {
      sessionStart: {
        type: Boolean,
        default: true,
      },
      sessionEnd: {
        type: Boolean,
        default: true,
      },
      breakTime: {
        type: Boolean,
        default: true,
      },
      blockingActive: {
        type: Boolean,
        default: false,
      },
    },
    presets: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'Preset name cannot exceed 50 characters'],
      },
      duration: {
        type: Number,
        required: true,
        min: [1, 'Preset duration must be at least 1 minute'],
      },
      blockedSites: [String],
      blockedApps: [String],
      strictMode: {
        type: Boolean,
        default: false,
      },
    }],
    statistics: {
      totalSessions: {
        type: Number,
        default: 0,
        min: [0, 'Total sessions cannot be negative'],
      },
      totalFocusTime: {
        type: Number,
        default: 0,
        min: [0, 'Total focus time cannot be negative'],
      },
      averageSessionLength: {
        type: Number,
        default: 0,
        min: [0, 'Average session length cannot be negative'],
      },
      longestSession: {
        type: Number,
        default: 0,
        min: [0, 'Longest session cannot be negative'],
      },
      currentStreak: {
        type: Number,
        default: 0,
        min: [0, 'Current streak cannot be negative'],
      },
      longestStreak: {
        type: Number,
        default: 0,
        min: [0, 'Longest streak cannot be negative'],
      },
      lastSessionDate: Date,
    },
    lastSyncedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
FocusSessionSchema.index({ userId: 1, startTime: -1 });
FocusSessionSchema.index({ userId: 1, status: 1 });
FocusSessionSchema.index({ userId: 1, createdAt: -1 });
FocusSessionSchema.index({ userId: 1, lastSyncedAt: -1 });

FocusSettingsSchema.index({ userId: 1 });
FocusSettingsSchema.index({ userId: 1, lastSyncedAt: -1 });

// Middleware to update session statistics
FocusSessionSchema.post('save', async function(doc) {
  if (doc.status === 'completed' && doc.actualDuration) {
    try {
      const FocusSettings = mongoose.model<IFocusSettings>('FocusSettings');
      const settings = await FocusSettings.findOne({ userId: doc.userId });
      
      if (settings) {
        settings.statistics.totalSessions += 1;
        settings.statistics.totalFocusTime += doc.actualDuration;
        settings.statistics.averageSessionLength = 
          settings.statistics.totalFocusTime / settings.statistics.totalSessions;
        
        if (doc.actualDuration > settings.statistics.longestSession) {
          settings.statistics.longestSession = doc.actualDuration;
        }
        
        // Update streak logic
        const today = new Date();
        const lastSession = settings.statistics.lastSessionDate;
        
        if (lastSession) {
          const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            settings.statistics.currentStreak += 1;
          } else if (daysDiff > 1) {
            settings.statistics.currentStreak = 1;
          }
        } else {
          settings.statistics.currentStreak = 1;
        }
        
        if (settings.statistics.currentStreak > settings.statistics.longestStreak) {
          settings.statistics.longestStreak = settings.statistics.currentStreak;
        }
        
        settings.statistics.lastSessionDate = today;
        await settings.save();
      }
    } catch (error) {
      console.error('Error updating focus statistics:', error);
    }
  }
});

// Create models
export const FocusSessionModel: Model<IFocusSession> = mongoose.models.FocusSession || 
  mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);

export const FocusSettingsModel: Model<IFocusSettings> = mongoose.models.FocusSettings || 
  mongoose.model<IFocusSettings>('FocusSettings', FocusSettingsSchema);

export default {
  FocusSessionModel,
  FocusSettingsModel,
};
