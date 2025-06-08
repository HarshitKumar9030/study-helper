import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVoiceSettings extends Document {
  userId: mongoose.Types.ObjectId;
  enabled: boolean;
  volume: number;
  rate: number;
  voice?: string;
  language: string;
  activationKeyword: string;
  wakeWordSensitivity: number;
  noiseReduction: boolean;
  autoTranscription: boolean;
  confidenceThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface IVoiceCommand extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId?: string;
  command: string;
  transcription: string;
  confidence: number;
  intent?: string;
  response?: string;
  executedAt: Date;
  responseTime?: number;
  successful: boolean;
  errorMessage?: string;
  context?: {
    activeApp?: string;
    focusMode?: boolean;
    currentTask?: string;
  };
  createdAt: Date;
  lastSyncedAt?: Date;
}

const VoiceSettingsSchema = new Schema<IVoiceSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    volume: {
      type: Number,
      min: [0, 'Volume must be between 0 and 1'],
      max: [1, 'Volume must be between 0 and 1'],
      default: 0.8,
    },
    rate: {
      type: Number,
      min: [50, 'Rate must be between 50 and 300'],
      max: [300, 'Rate must be between 50 and 300'],
      default: 150,
    },
    voice: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'en-US',
    },
    activationKeyword: {
      type: String,
      required: [true, 'Activation keyword is required'],
      default: 'hey study helper',
      trim: true,
      lowercase: true,
    },
    wakeWordSensitivity: {
      type: Number,
      min: [0, 'Wake word sensitivity must be between 0 and 1'],
      max: [1, 'Wake word sensitivity must be between 0 and 1'],
      default: 0.7,
    },
    noiseReduction: {
      type: Boolean,
      default: true,
    },
    autoTranscription: {
      type: Boolean,
      default: true,
    },
    confidenceThreshold: {
      type: Number,
      min: [0, 'Confidence threshold must be between 0 and 1'],
      max: [1, 'Confidence threshold must be between 0 and 1'],
      default: 0.6,
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

const VoiceCommandSchema = new Schema<IVoiceCommand>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      index: true,
    },
    command: {
      type: String,
      required: [true, 'Command is required'],
      trim: true,
      maxlength: [500, 'Command cannot exceed 500 characters'],
    },
    transcription: {
      type: String,
      required: [true, 'Transcription is required'],
      trim: true,
      maxlength: [1000, 'Transcription cannot exceed 1000 characters'],
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence is required'],
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
    },
    intent: {
      type: String,
      trim: true,
      maxlength: [100, 'Intent cannot exceed 100 characters'],
    },
    response: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters'],
    },
    executedAt: {
      type: Date,
      required: [true, 'Executed at is required'],
      default: Date.now,
      index: true,
    },
    responseTime: {
      type: Number,
      min: [0, 'Response time cannot be negative'],
    },
    successful: {
      type: Boolean,
      required: [true, 'Successful status is required'],
      default: true,
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Error message cannot exceed 500 characters'],
    },
    context: {
      activeApp: {
        type: String,
        trim: true,
      },
      focusMode: {
        type: Boolean,
      },
      currentTask: {
        type: String,
        trim: true,
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

// Indexes for performance
VoiceCommandSchema.index({ userId: 1, executedAt: -1 });
VoiceCommandSchema.index({ userId: 1, successful: 1 });
VoiceCommandSchema.index({ userId: 1, intent: 1 });

// Pre-save middleware to update lastSyncedAt
VoiceSettingsSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

VoiceCommandSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

export const VoiceSettingsModel: Model<IVoiceSettings> = 
  mongoose.models.VoiceSettings || mongoose.model<IVoiceSettings>('VoiceSettings', VoiceSettingsSchema);

export const VoiceCommandModel: Model<IVoiceCommand> = 
  mongoose.models.VoiceCommand || mongoose.model<IVoiceCommand>('VoiceCommand', VoiceCommandSchema);
