import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { UserPreferencesModel, FocusSessionModel } from '@/lib/models/preferences';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'preferences' or 'focus-sessions'
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lastSyncedAt = searchParams.get('lastSyncedAt');

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'preferences' || !type) {
      // Fetch user preferences
      const preferences = await UserPreferencesModel
        .findOne({ userId })
        .lean();

      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = new UserPreferencesModel({
          userId,
          theme: 'auto',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            desktop: true,
            sound: true,
            taskReminders: true,
            dailySummary: false,
            weeklyReport: true,
          },
          study: {
            defaultFocusTime: 25,
            defaultBreakTime: 5,
            preferredDifficulty: 'mixed',
            studyMethod: 'pomodoro',
            subjects: [],
            goals: {
              dailyStudyTime: 120,
              weeklyStudyTime: 840,
              monthlyStudyTime: 3600,
            },
          },
          focus: {
            enabled: true,
            blockedSites: [
              'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
              'tiktok.com', 'snapchat.com', 'reddit.com', 'twitch.tv'
            ],
            blockedApps: [],
            allowBreaks: true,
            strictMode: false,
            whitelistedSites: [],
          },
          ai: {
            responseStyle: 'conversational',
            autoSuggestions: true,
            contextAware: true,
            learningMode: true,
            confidenceThreshold: 0.7,
          },
          sync: {
            autoSync: true,
            syncInterval: 5,
            lastSyncAt: new Date(),
            conflicts: [],
          },
          privacy: {
            shareUsageData: false,
            shareErrorLogs: true,
            allowTelemetry: false,
          },
        });

        const savedPreferences = await defaultPreferences.save();
        
        return NextResponse.json({
          success: true,
          data: {
            preferences: savedPreferences,
            sync: {
              timestamp: new Date().toISOString(),
              created: true
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          preferences,
          sync: {
            timestamp: new Date().toISOString(),
            created: false
          }
        }
      });

    } else if (type === 'focus-sessions') {
      // Fetch focus sessions
      const query: any = { userId };
      
      if (status) query.status = status;
      if (lastSyncedAt) {
        query.lastSyncedAt = { $gt: new Date(lastSyncedAt) };
      }
      
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }

      const focusSessions = await FocusSessionModel
        .find(query)
        .populate('tasks', 'title subject priority status')
        .sort({ startTime: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await FocusSessionModel.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: {
          sessions: focusSessions,
          pagination: {
            total,
            limit,
            offset,
            hasMore: total > offset + limit
          },
          sync: {
            timestamp: new Date().toISOString(),
            totalItems: focusSessions.length
          }
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "preferences" or "focus-sessions"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch settings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'focus-session') {
      // Create focus session
      const focusSession = new FocusSessionModel({
        ...data,
        userId,
        lastSyncedAt: new Date()
      });

      const savedSession = await focusSession.save();

      return NextResponse.json({
        success: true,
        data: { session: savedSession }
      });

    } else if (type === 'focus-sessions') {
      // Create multiple focus sessions
      const { sessions } = data;

      if (!Array.isArray(sessions)) {
        return NextResponse.json(
          { error: 'Sessions must be an array' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];

      for (const sessionData of sessions) {
        try {
          const focusSession = new FocusSessionModel({
            ...sessionData,
            userId,
            lastSyncedAt: new Date()
          });

          const savedSession = await focusSession.save();
          results.push(savedSession);
        } catch (error) {
          errors.push({
            session: sessionData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          created: results,
          errors,
          count: results.length
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "focus-session" or "focus-sessions"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Settings Create API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create settings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'preferences') {
      // Update user preferences
      const updatedPreferences = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { 
          ...data, 
          userId, 
          lastSyncedAt: new Date() 
        },
        { 
          new: true, 
          upsert: true, 
          runValidators: true 
        }
      );

      return NextResponse.json({
        success: true,
        data: { preferences: updatedPreferences }
      });

    } else if (type === 'focus-session') {
      // Update focus session
      if (!data._id) {
        return NextResponse.json(
          { error: 'Session ID is required for updates' },
          { status: 400 }
        );
      }

      const updatedSession = await FocusSessionModel.findOneAndUpdate(
        { 
          _id: data._id, 
          userId 
        },
        { 
          ...data, 
          lastSyncedAt: new Date() 
        },
        { new: true, runValidators: true }
      );

      if (!updatedSession) {
        return NextResponse.json(
          { error: 'Focus session not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { session: updatedSession }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "preferences" or "focus-session"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Settings Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update settings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const olderThan = searchParams.get('olderThan'); // ISO date string

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'focus-sessions') {
      let result;

      if (id) {
        // Delete specific session
        result = await FocusSessionModel.deleteOne({
          _id: id,
          userId
        });
      } else if (olderThan) {
        // Delete sessions older than specified date
        result = await FocusSessionModel.deleteMany({
          userId,
          startTime: { $lt: new Date(olderThan) }
        });
      } else {
        return NextResponse.json(
          { error: 'Either id or olderThan parameter is required' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.deletedCount
        }
      });

    } else if (type === 'preferences') {
      return NextResponse.json(
        { error: 'Preferences cannot be deleted, only updated' },
        { status: 400 }
      );

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "focus-sessions"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Settings Delete API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete settings data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
