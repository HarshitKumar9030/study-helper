import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { FocusSessionModel, FocusSettingsModel } from '@/lib/models/focus';
import mongoose from 'mongoose';

/**
 * GET /api/focus/sessions - Get user's focus sessions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filter
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const sessions = await FocusSessionModel.find(filter)
      .sort({ startTime: -1 })
      .limit(limit)
      .populate('tasks', 'title description')
      .lean();

    // Get session statistics
    const stats = await FocusSessionModel.aggregate([
      { $match: { userId } },
      { $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalFocusTime: { 
          $sum: { $ifNull: ['$actualDuration', 0] }
        },
        averageDuration: {
          $avg: { $ifNull: ['$actualDuration', 0] }
        }
      }}
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      stats: stats[0] || {
        totalSessions: 0,
        completedSessions: 0,
        totalFocusTime: 0,
        averageDuration: 0
      }
    });
  } catch (error) {
    console.error('Focus sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/focus/sessions - Create a new focus session
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

    // Generate unique session ID
    const sessionId = `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const focusSession = new FocusSessionModel({
      userId,
      sessionId,
      title: body.title,
      startTime: new Date(),
      plannedDuration: body.plannedDuration || 25,
      status: 'active',
      blockedSites: body.blockedSites || [],
      blockedApps: body.blockedApps || [],
      strictMode: body.strictMode || false,
      breaks: [],
      productivity: {
        distractionCount: 0,
        sitesBlocked: 0,
        appsBlocked: 0,
        timeSpentFocused: 0,
        timeSpentDistracted: 0
      },
      tasks: body.taskIds || [],
      notes: body.notes,
      tags: body.tags || [],
      metadata: {
        device: request.headers.get('user-agent') || 'web',
        platform: 'web',
        version: '1.0.0'
      }
    });

    await focusSession.save();

    return NextResponse.json({
      success: true,
      session: focusSession
    });
  } catch (error) {
    console.error('Focus session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
