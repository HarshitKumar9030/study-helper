import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { FocusSettingsModel } from '@/lib/models/focus';
import mongoose from 'mongoose';

/**
 * GET /api/focus/settings - Get user's focus settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    let settings = await FocusSettingsModel.findOne({ userId }).lean();

    // Create default settings if none exist
    if (!settings) {
      const defaultSettings = new FocusSettingsModel({
        userId,
        defaultDuration: 25,
        defaultBreakDuration: 5,
        autoStartBreaks: false,
        strictMode: false,
        allowEmergencyBreak: true,
        blockedSites: [
          'facebook.com',
          'twitter.com',
          'instagram.com',
          'tiktok.com',
          'youtube.com',
          'reddit.com'
        ],
        blockedApps: [],
        whitelistedSites: [
          'localhost',
          'study-helper.com'
        ],
        whitelistedApps: [],
        blockingMethod: 'soft',
        notifications: {
          sessionStart: true,
          sessionEnd: true,
          breakTime: true,
          blockingActive: false
        },
        presets: [
          {
            name: 'Quick Focus',
            duration: 15,
            blockedSites: ['facebook.com', 'twitter.com'],
            blockedApps: [],
            strictMode: false
          },
          {
            name: 'Deep Work',
            duration: 45,
            blockedSites: [
              'facebook.com', 'twitter.com', 'instagram.com', 
              'tiktok.com', 'youtube.com', 'reddit.com'
            ],
            blockedApps: [],
            strictMode: true
          },
          {
            name: 'Study Session',
            duration: 90,
            blockedSites: [
              'facebook.com', 'twitter.com', 'instagram.com', 
              'tiktok.com', 'youtube.com', 'reddit.com',
              'netflix.com', 'twitch.tv'
            ],
            blockedApps: [],
            strictMode: true
          }
        ],
        statistics: {
          totalSessions: 0,
          totalFocusTime: 0,
          averageSessionLength: 0,
          longestSession: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      });

      settings = await defaultSettings.save();
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Focus settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/focus/settings - Update focus settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();

    // Validate input
    if (body.defaultDuration && (body.defaultDuration < 1 || body.defaultDuration > 480)) {
      return NextResponse.json(
        { error: 'Default duration must be between 1 and 480 minutes' },
        { status: 400 }
      );
    }

    if (body.defaultBreakDuration && (body.defaultBreakDuration < 1 || body.defaultBreakDuration > 60)) {
      return NextResponse.json(
        { error: 'Break duration must be between 1 and 60 minutes' },
        { status: 400 }
      );
    }

    const updatedSettings = await FocusSettingsModel.findOneAndUpdate(
      { userId },
      { 
        ...body, 
        userId,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).lean();

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Focus settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/focus/settings/preset - Add a new preset
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();

    if (!body.name || !body.duration) {
      return NextResponse.json(
        { error: 'Preset name and duration are required' },
        { status: 400 }
      );
    }

    const settings = await FocusSettingsModel.findOne({ userId });
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const newPreset = {
      name: body.name,
      duration: body.duration,
      blockedSites: body.blockedSites || [],
      blockedApps: body.blockedApps || [],
      strictMode: body.strictMode || false
    };

    settings.presets.push(newPreset);
    await settings.save();

    return NextResponse.json({
      success: true,
      preset: newPreset,
      settings
    });
  } catch (error) {
    console.error('Focus preset creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
