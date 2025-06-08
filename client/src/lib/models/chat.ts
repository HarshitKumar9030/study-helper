import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messageId: string;
  type: 'user' | 'assistant';
  content: string;
  metadata?: {
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeAvailable?: number;
    suggestions?: string[];
    actionItems?: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedTime?: number;
      category: 'study' | 'review' | 'break' | 'assignment';
    }>;
    confidence?: number;
    responseTime?: number;
  };
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  title?: string;
  subject?: string;
  messageCount: number;
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
  totalTokens?: number;
  summary?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    messageId: {
      type: String,
      required: [true, 'Message ID is required'],
      unique: true,
    },
    type: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, 'Message type is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    metadata: {
      subject: {
        type: String,
        trim: true,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
      },
      timeAvailable: {
        type: Number,
        min: [1, 'Time available must be at least 1 minute'],
      },
      suggestions: [{
        type: String,
        trim: true,
      }],
      actionItems: [{
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        estimatedTime: {
          type: Number,
          min: [1, 'Estimated time must be at least 1 minute'],
        },
        category: {
          type: String,
          enum: ['study', 'review', 'break', 'assignment'],
          required: true,
        },
      }],
      confidence: {
        type: Number,
        min: [0, 'Confidence must be between 0 and 1'],
        max: [1, 'Confidence must be between 0 and 1'],
      },
      responseTime: {
        type: Number,
        min: [0, 'Response time cannot be negative'],
      },
    },
    tokens: {
      input: {
        type: Number,
        min: [0, 'Token count cannot be negative'],
      },
      output: {
        type: Number,
        min: [0, 'Token count cannot be negative'],
      },
      total: {
        type: Number,
        min: [0, 'Token count cannot be negative'],
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

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    messageCount: {
      type: Number,
      default: 0,
      min: [0, 'Message count cannot be negative'],
    },
    startedAt: {
      type: Date,
      required: [true, 'Started at is required'],
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      required: [true, 'Last message at is required'],
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    totalTokens: {
      type: Number,
      default: 0,
      min: [0, 'Total tokens cannot be negative'],
    },
    summary: {
      type: String,
      maxlength: [1000, 'Summary cannot exceed 1000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
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
ChatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
ChatMessageSchema.index({ userId: 1, type: 1 });
ChatSessionSchema.index({ userId: 1, startedAt: -1 });
ChatSessionSchema.index({ userId: 1, subject: 1 });

// Pre-save middleware to update lastSyncedAt
ChatMessageSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

ChatSessionSchema.pre('save', function(next) {
  this.lastSyncedAt = new Date();
  next();
});

export const ChatMessageModel: Model<IChatMessage> = 
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export const ChatSessionModel: Model<IChatSession> = 
  mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
