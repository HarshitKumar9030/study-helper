import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ScheduleItemModel } from '@/lib/models/schedule';
import { ChatMessageModel, ChatSessionModel } from '@/lib/models/chat';
import { VoiceSettingsModel, VoiceCommandModel } from '@/lib/models/voice';
import { UserPreferencesModel } from '@/lib/models/preferences';
import { UserModel } from '@/lib/models/user';
import { FocusSessionModel, FocusSettingsModel } from '@/lib/models/focus';
import { TaskModel, ScheduleBlockModel, ScheduleSettingsModel } from '@/lib/models/scheduler';
import mongoose from 'mongoose';

interface SyncRequest {
  lastSyncAt?: string;
  dataTypes?: string[]; // ['schedules', 'chats', 'voice', 'focus', 'scheduler', 'preferences', 'profile']
  pushData?: {
    schedules?: any[];
    chats?: any[];
    voice?: any[];
    focus?: any[];
    scheduler?: {
      tasks?: any[];
      blocks?: any[];
      settings?: any;
    };
    preferences?: any;
    profile?: any;
  };
}

interface SyncResponse {
  success: boolean;
  data: {
    schedules?: any[];
    chats?: {
      sessions: any[];
      messages: any[];
    };
    voice?: {
      settings: any | null;
      commands: any[];
    };
    focus?: {
      sessions: any[];
      settings: any | null;
    };
    scheduler?: {
      tasks: any[];
      blocks: any[];
      settings: any | null;
    };
    preferences?: any;
    profile?: any;
  };
  conflicts?: any[];
  lastSyncAt: string;
  stats: {
    pulled: number;
    pushed: number;
    conflicts: number;
  };
}

/**
 * Master sync endpoint that handles all user data synchronization
 * between the Next.js app and Python desktop application
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const body: SyncRequest = await request.json();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const lastSyncAt = body.lastSyncAt ? new Date(body.lastSyncAt) : new Date(0);
    const currentTime = new Date();
    
    const dataTypes = body.dataTypes || ['schedules', 'chats', 'voice', 'focus', 'scheduler', 'preferences', 'profile'];
    const syncResponse: SyncResponse = {
      success: true,
      data: {},
      conflicts: [],
      lastSyncAt: currentTime.toISOString(),
      stats: { pulled: 0, pushed: 0, conflicts: 0 }
    };

    // Handle pulling updated data from server
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'schedules':
          syncResponse.data.schedules = await pullSchedules(userId, lastSyncAt);
          syncResponse.stats.pulled += syncResponse.data.schedules?.length || 0;
          break;
        case 'chats':
          const chatsData = await pullChats(userId, lastSyncAt);
          syncResponse.data.chats = chatsData;
          syncResponse.stats.pulled += (chatsData.sessions?.length || 0) + (chatsData.messages?.length || 0);
          break;
        case 'voice':
          const voiceData = await pullVoiceData(userId, lastSyncAt);
          syncResponse.data.voice = voiceData;
          syncResponse.stats.pulled += (voiceData.commands?.length || 0) + (voiceData.settings ? 1 : 0);
          break;
        case 'focus':
          const focusData = await pullFocusData(userId, lastSyncAt);
          syncResponse.data.focus = focusData;
          syncResponse.stats.pulled += (focusData.sessions?.length || 0) + (focusData.settings ? 1 : 0);
          break;
        case 'scheduler':
          const schedulerData = await pullSchedulerData(userId, lastSyncAt);
          syncResponse.data.scheduler = schedulerData;
          syncResponse.stats.pulled += (schedulerData.tasks?.length || 0) + (schedulerData.blocks?.length || 0) + (schedulerData.settings ? 1 : 0);
          break;
        case 'preferences':
          syncResponse.data.preferences = await pullPreferences(userId, lastSyncAt);
          if (syncResponse.data.preferences) syncResponse.stats.pulled += 1;
          break;
        case 'profile':
          syncResponse.data.profile = await pullProfile(userId, lastSyncAt);
          if (syncResponse.data.profile) syncResponse.stats.pulled += 1;
          break;
      }
    }

    // Handle pushing data from client to server
    if (body.pushData) {
      if (body.pushData.schedules) {
        const result = await pushSchedules(userId, body.pushData.schedules, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.chats) {
        const result = await pushChats(userId, body.pushData.chats, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.voice) {
        const result = await pushVoiceData(userId, body.pushData.voice, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.focus) {
        const result = await pushFocusData(userId, body.pushData.focus, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.scheduler) {
        const result = await pushSchedulerData(userId, body.pushData.scheduler, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.preferences) {
        const result = await pushPreferences(userId, body.pushData.preferences, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }

      if (body.pushData.profile) {
        const result = await pushProfile(userId, body.pushData.profile, currentTime);
        syncResponse.stats.pushed += result.pushed;
        syncResponse.stats.conflicts += result.conflicts;
        if (result.conflictDetails?.length) {
          syncResponse.conflicts?.push(...result.conflictDetails);
        }
      }
    }

    return NextResponse.json(syncResponse);
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions for pulling data
async function pullSchedules(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  return await ScheduleItemModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ updatedAt: -1 }).limit(100).lean();
}

async function pullChats(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  const sessions = await ChatSessionModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ lastMessageAt: -1 }).limit(50).lean();

  const messages = await ChatMessageModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ createdAt: -1 }).limit(200).lean();
  
  return { sessions, messages };
}

async function pullFocusData(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  const sessions = await FocusSessionModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ startTime: -1 }).limit(100).lean();

  const settings = await FocusSettingsModel.findOne({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).lean();

  return { sessions, settings };
}

async function pullVoiceData(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  const settings = await VoiceSettingsModel.findOne({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).lean();

  const commands = await VoiceCommandModel.find({
    userId,
    $or: [
      { createdAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ createdAt: -1 }).limit(100).lean();

  return { settings, commands };
}

async function pullSchedulerData(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  const tasks = await TaskModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ updatedAt: -1 }).limit(200).lean();

  const blocks = await ScheduleBlockModel.find({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).sort({ startTime: -1 }).limit(100).lean();

  const settings = await ScheduleSettingsModel.findOne({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).lean();

  return { tasks, blocks, settings };
}

async function pullPreferences(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  return await UserPreferencesModel.findOne({
    userId,
    $or: [
      { updatedAt: { $gt: lastSyncAt } },
      { lastSyncedAt: { $gt: lastSyncAt } }
    ]
  }).lean();
}

async function pullProfile(userId: mongoose.Types.ObjectId, lastSyncAt: Date) {
  return await UserModel.findOne({
    _id: userId,
    updatedAt: { $gt: lastSyncAt }
  }).select('name email image avatar bio updatedAt').lean();
}

// Helper functions for pushing data
async function pushSchedules(userId: mongoose.Types.ObjectId, schedules: any[], currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  for (const schedule of schedules) {
    try {
      const existing = await ScheduleItemModel.findOne({
        userId,
        $or: [
          { _id: schedule._id },
          { title: schedule.title, dueDate: schedule.dueDate }
        ]
      });

      if (existing && existing.updatedAt > new Date(schedule.updatedAt)) {
        conflicts++;
        conflictDetails.push({
          type: 'schedule',
          id: schedule._id,
          serverData: existing,
          clientData: schedule
        });
      } else {
        await ScheduleItemModel.findOneAndUpdate(
          { _id: schedule._id || new mongoose.Types.ObjectId() },
          { ...schedule, userId, lastSyncedAt: currentTime },
          { upsert: true, new: true }
        );
        pushed++;
      }
    } catch (error) {
      console.error('Error pushing schedule:', error);
    }
  }

  return { pushed, conflicts, conflictDetails };
}

async function pushChats(userId: mongoose.Types.ObjectId, chats: any[], currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  for (const chat of chats) {
    try {
      if (chat.type === 'session') {
        const existing = await ChatSessionModel.findOne({
          userId,
          sessionId: chat.sessionId
        });

        if (existing && existing.updatedAt > new Date(chat.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'chat_session',
            id: chat.sessionId,
            serverData: existing,
            clientData: chat
          });
        } else {
          await ChatSessionModel.findOneAndUpdate(
            { sessionId: chat.sessionId },
            { ...chat, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      } else if (chat.type === 'message') {
        const existing = await ChatMessageModel.findOne({
          userId,
          messageId: chat.messageId
        });

        if (existing && existing.updatedAt > new Date(chat.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'chat_message',
            id: chat.messageId,
            serverData: existing,
            clientData: chat
          });
        } else {
          await ChatMessageModel.findOneAndUpdate(
            { messageId: chat.messageId },
            { ...chat, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      }
    } catch (error) {
      console.error('Error pushing chat:', error);
    }
  }

  return { pushed, conflicts, conflictDetails };
}

async function pushVoiceData(userId: mongoose.Types.ObjectId, voiceData: any[], currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  for (const item of voiceData) {
    try {
      if (item.type === 'settings') {
        const existing = await VoiceSettingsModel.findOne({ userId });

        if (existing && existing.updatedAt > new Date(item.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'voice_settings',
            id: userId.toString(),
            serverData: existing,
            clientData: item
          });
        } else {
          await VoiceSettingsModel.findOneAndUpdate(
            { userId },
            { ...item, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      } else if (item.type === 'command') {
        await VoiceCommandModel.create({
          ...item,
          userId,
          lastSyncedAt: currentTime
        });
        pushed++;
      }
    } catch (error) {
      console.error('Error pushing voice data:', error);
    }
  }
  return { pushed, conflicts, conflictDetails };
}

async function pushFocusData(userId: mongoose.Types.ObjectId, focusData: any[], currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  for (const item of focusData) {
    try {
      if (item.type === 'session') {
        const existing = await FocusSessionModel.findOne({
          userId,
          sessionId: item.sessionId
        });

        if (existing && existing.updatedAt > new Date(item.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'focus_session',
            id: item.sessionId,
            serverData: existing,
            clientData: item
          });
        } else {
          await FocusSessionModel.findOneAndUpdate(
            { sessionId: item.sessionId },
            { ...item, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      } else if (item.type === 'settings') {
        const existing = await FocusSettingsModel.findOne({ userId });

        if (existing && existing.updatedAt > new Date(item.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'focus_settings',
            id: userId.toString(),
            serverData: existing,
            clientData: item
          });
        } else {
          await FocusSettingsModel.findOneAndUpdate(
            { userId },
            { ...item, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      }
    } catch (error) {
      console.error('Error pushing focus data:', error);
    }
  }

  return { pushed, conflicts, conflictDetails };
}

async function pushSchedulerData(userId: mongoose.Types.ObjectId, schedulerData: any, currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  try {
    // Push tasks
    if (schedulerData.tasks) {
      for (const task of schedulerData.tasks) {
        const existing = await TaskModel.findOne({
          userId,
          $or: [
            { _id: task._id },
            { title: task.title, createdAt: task.createdAt }
          ]
        });

        if (existing && existing.updatedAt > new Date(task.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'task',
            id: task._id,
            serverData: existing,
            clientData: task
          });
        } else {
          await TaskModel.findOneAndUpdate(
            { _id: task._id || new mongoose.Types.ObjectId() },
            { ...task, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      }
    }

    // Push schedule blocks
    if (schedulerData.blocks) {
      for (const block of schedulerData.blocks) {
        const existing = await ScheduleBlockModel.findOne({
          userId,
          $or: [
            { _id: block._id },
            { taskId: block.taskId, startTime: block.startTime }
          ]
        });

        if (existing && existing.updatedAt > new Date(block.updatedAt)) {
          conflicts++;
          conflictDetails.push({
            type: 'schedule_block',
            id: block._id,
            serverData: existing,
            clientData: block
          });
        } else {
          await ScheduleBlockModel.findOneAndUpdate(
            { _id: block._id || new mongoose.Types.ObjectId() },
            { ...block, userId, lastSyncedAt: currentTime },
            { upsert: true, new: true }
          );
          pushed++;
        }
      }
    }

    // Push settings
    if (schedulerData.settings) {
      const existing = await ScheduleSettingsModel.findOne({ userId });

      if (existing && existing.updatedAt > new Date(schedulerData.settings.updatedAt)) {
        conflicts++;
        conflictDetails.push({
          type: 'schedule_settings',
          id: userId.toString(),
          serverData: existing,
          clientData: schedulerData.settings
        });
      } else {
        await ScheduleSettingsModel.findOneAndUpdate(
          { userId },
          { ...schedulerData.settings, userId, lastSyncedAt: currentTime },
          { upsert: true, new: true }
        );
        pushed++;
      }
    }
  } catch (error) {
    console.error('Error pushing scheduler data:', error);
  }

  return { pushed, conflicts, conflictDetails };
}

async function pushPreferences(userId: mongoose.Types.ObjectId, preferences: any, currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  try {
    const existing = await UserPreferencesModel.findOne({ userId });

    if (existing && existing.updatedAt > new Date(preferences.updatedAt)) {
      conflicts++;
      conflictDetails.push({
        type: 'preferences',
        id: userId.toString(),
        serverData: existing,
        clientData: preferences
      });
    } else {
      await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { ...preferences, userId, lastSyncedAt: currentTime },
        { upsert: true, new: true }
      );
      pushed++;
    }
  } catch (error) {
    console.error('Error pushing preferences:', error);
  }

  return { pushed, conflicts, conflictDetails };
}

async function pushProfile(userId: mongoose.Types.ObjectId, profile: any, currentTime: Date) {
  let pushed = 0;
  let conflicts = 0;
  const conflictDetails: any[] = [];

  try {
    const existing = await UserModel.findById(userId);

    if (existing && existing.updatedAt > new Date(profile.updatedAt)) {
      conflicts++;
      conflictDetails.push({
        type: 'profile',
        id: userId.toString(),
        serverData: existing,
        clientData: profile
      });
    } else {
      await UserModel.findByIdAndUpdate(
        userId,
        { 
          name: profile.name,
          bio: profile.bio,
          updatedAt: currentTime
        },
        { new: true }
      );
      pushed++;
    }
  } catch (error) {
    console.error('Error pushing profile:', error);
  }

  return { pushed, conflicts, conflictDetails };
}

/**
 * Get sync status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const [
      scheduleCount,
      chatSessionCount,
      chatMessageCount,
      voiceCommandCount,
      focusSessionCount,
      taskCount,
      scheduleBlockCount,
      preferences,
      lastScheduleSync,
      lastChatSync,
      lastVoiceSync,
      lastFocusSync,
      lastSchedulerSync
    ] = await Promise.all([
      ScheduleItemModel.countDocuments({ userId }),
      ChatSessionModel.countDocuments({ userId }),
      ChatMessageModel.countDocuments({ userId }),
      VoiceCommandModel.countDocuments({ userId }),
      FocusSessionModel.countDocuments({ userId }),
      TaskModel.countDocuments({ userId }),
      ScheduleBlockModel.countDocuments({ userId }),
      UserPreferencesModel.findOne({ userId }),
      ScheduleItemModel.findOne({ userId }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
      ChatMessageModel.findOne({ userId }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
      VoiceCommandModel.findOne({ userId }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
      FocusSessionModel.findOne({ userId }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
      TaskModel.findOne({ userId }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt')
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        schedules: scheduleCount,
        chatSessions: chatSessionCount,
        chatMessages: chatMessageCount,
        voiceCommands: voiceCommandCount,
        focusSessions: focusSessionCount,
        tasks: taskCount,
        scheduleBlocks: scheduleBlockCount,
        lastSync: {
          schedules: lastScheduleSync?.lastSyncedAt,
          chats: lastChatSync?.lastSyncedAt,
          voice: lastVoiceSync?.lastSyncedAt,
          focus: lastFocusSync?.lastSyncedAt,
          scheduler: lastSchedulerSync?.lastSyncedAt,
          preferences: preferences?.lastSyncedAt
        },
        autoSync: preferences?.sync?.autoSync || false,
        syncInterval: preferences?.sync?.syncInterval || 30
      }
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
