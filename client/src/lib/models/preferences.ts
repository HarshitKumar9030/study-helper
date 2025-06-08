import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    taskReminders: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
  };
  study: {
    defaultFocusTime: number; // in minutes
    defaultBreakTime: number; // in minutes
    preferredDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    studyMethod: 'pomodoro' | 'timeblocking' | 'flexible';
    subjects: string[];
    goals: {
      dailyStudyTime: number; // in minutes
      weeklyStudyTime: number; // in minutes
      monthlyStudyTime: number; // in minutes
    };
  };
  focus: {
    enabled: boolean;
    blockedSites: string[];
    blockedApps: string[];
    allowBreaks: boolean;
    strictMode: boolean;
    whitelistedSites: string[];
  };
  ai: {
    responseStyle: 'concise' | 'detailed' | 'conversational';
    autoSuggestions: boolean;
    contextAware: boolean;
    learningMode: boolean;
    confidenceThreshold: number;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number; // in minutes
    lastSyncAt: Date;
    conflicts: Array<{
      type: string;
      data: any;
      timestamp: Date;
      resolved: boolean;
    }>;
  };
  privacy: {
    shareUsageData: boolean;
    shareErrorLogs: boolean;
    allowTelemetry: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface IFocusSession extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  blockedSites: string[];
  blockedApps: string[];
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
  };
  tasks?: mongoose.Types.ObjectId[]; // references to ScheduleItem
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'en',
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'UTC',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      desktop: {
        type: Boolean,
        default: true,
      },
      sound: {
        type: Boolean,
        default: true,
      },
      taskReminders: {
        type: Boolean,
        default: true,
      },
      dailySummary: {
        type: Boolean,
        default: false,
      },
      weeklyReport: {
        type: Boolean,
        default: true,
      },
    },
    study: {
      defaultFocusTime: {
        type: Number,
        min: [5, 'Focus time must be at least 5 minutes'],
        max: [240, 'Focus time cannot exceed 4 hours'],
        default: 25,
      },
      defaultBreakTime: {
        type: Number,
        min: [1, 'Break time must be at least 1 minute'],
        max: [60, 'Break time cannot exceed 1 hour'],
        default: 5,
      },
      preferredDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'mixed',
      },
      studyMethod: {
        type: String,
        enum: ['pomodoro', 'timeblocking', 'flexible'],
        default: 'pomodoro',
      },
      subjects: [{
        type: String,
        trim: true,
        maxlength: [100, 'Subject name cannot exceed 100 characters'],
      }],
      goals: {
        dailyStudyTime: {
          type: Number,
          min: [0, 'Daily study time cannot be negative'],
          default: 120, // 2 hours
        },
        weeklyStudyTime: {
          type: Number,
          min: [0, 'Weekly study time cannot be negative'],
          default: 840, // 14 hours
        },
        monthlyStudyTime: {
          type: Number,
          min: [0, 'Monthly study time cannot be negative'],
          default: 3600, // 60 hours
        },
      },
    },
    focus: {
      enabled: {
        type: Boolean,
        default: true,
      },
      blockedSites: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
      blockedApps: [{
        type: String,
        trim: true,
      }],
      allowBreaks: {
        type: Boolean,
        default: true,
      },
      strictMode: {
        type: Boolean,
        default: false,
      },
      whitelistedSites: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
    },
    ai: {
      responseStyle: {
        type: String,
        enum: ['concise', 'detailed', 'conversational'],
        default: 'conversational',
      },
      autoSuggestions: {
        type: Boolean,
        default: true,
      },
      contextAware: {
        type: Boolean,
        default: true,
      },
      learningMode: {
        type: Boolean,
        default: true,
      },
      confidenceThreshold: {
        type: Number,
        min: [0, 'Confidence threshold must be between 0 and 1'],
        max: [1, 'Confidence threshold must be between 0 and 1'],
        default: 0.7,
      },
    },
    sync: {
      autoSync: {
        type: Boolean,
        default: true,
      },
      syncInterval: {
        type: Number,
        min: [1, 'Sync interval must be at least 1 minute'],
        max: [1440, 'Sync interval cannot exceed 24 hours'],
        default: 5,
      },
      lastSyncAt: {
        type: Date,
        default: Date.now,
      },
      conflicts: [{
        type: {
          type: String,
          required: true,
        },
        data: {
          type: Schema.Types.Mixed,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      }],
    },
    privacy: {
      shareUsageData: {
        type: Boolean,
        default: false,
      },
      shareErrorLogs: {
        type: Boolean,
        default: true,
      },
      allowTelemetry: {
        type: Boolean,
        default: false,
      },
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

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      index: true,
    },
    plannedDuration: {
      type: Number,
      required: [true, 'Planned duration is required'],
      min: [1, 'Planned duration must be at least 1 minute'],
    },
    actualDuration: {
      type: Number,
      min: [0, 'Actual duration cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      required: [true, 'Status is required'],
      default: 'active',
      index: true,
    },
    blockedSites: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    blockedApps: [{
      type: String,
      trim: true,
    }],
    breaks: [{
      startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
      },
      duration: {
        type: Number,
        required: true,
        min: [0, 'Break duration cannot be negative'],
      },
      type: {
        type: String,
        enum: ['scheduled', 'manual'],
        required: true,
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
        min: [0, 'Focus score must be between 0 and 100'],
        max: [100, 'Focus score must be between 0 and 100'],
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
FocusSessionSchema.index({ userId: 1, startTime: -1 });
FocusSessionSchema.index({ userId: 1, status: 1 });

// Pre-save middleware to update lastSyncedAt and calculate actual duration
UserPreferencesSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

FocusSessionSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  
  // Calculate actual duration if session is completed
  if (this.status === 'completed' && this.endTime && !this.actualDuration) {
    this.actualDuration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  
  next();
});

export const UserPreferencesModel: Model<IUserPreferences> = 
  mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export const FocusSessionModel: Model<IFocusSession> = 
  mongoose.models.FocusSession || mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);
