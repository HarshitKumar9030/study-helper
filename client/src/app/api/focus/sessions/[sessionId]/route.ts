import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { FocusSessionModel } from '@/lib/models/focus';
import mongoose from 'mongoose';

/**
 * GET /api/focus/sessions/[sessionId] - Get a specific focus session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { sessionId } = params;

    const focusSession = await FocusSessionModel.findOne({
      userId,
      sessionId
    }).populate('tasks', 'title description priority dueDate').lean();

    if (!focusSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: focusSession
    });
  } catch (error) {
    console.error('Focus session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/focus/sessions/[sessionId] - Update a focus session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { sessionId } = params;
    const body = await request.json();

    // Find the session
    const focusSession = await FocusSessionModel.findOne({
      userId,
      sessionId
    });

    if (!focusSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update fields based on the action
    if (body.action === 'complete') {
      focusSession.status = 'completed';
      focusSession.endTime = new Date();
      focusSession.actualDuration = Math.round(
        (focusSession.endTime.getTime() - focusSession.startTime.getTime()) / (1000 * 60)
      );
      
      // Calculate focus score based on productivity metrics
      const totalTime = focusSession.actualDuration || 0;
      const distractedTime = focusSession.productivity.timeSpentDistracted || 0;
      const focusedTime = totalTime - distractedTime;
      focusSession.productivity.focusScore = totalTime > 0 
        ? Math.round((focusedTime / totalTime) * 100) 
        : 0;
        
    } else if (body.action === 'pause') {
      focusSession.status = 'paused';
      
    } else if (body.action === 'resume') {
      focusSession.status = 'active';
      
    } else if (body.action === 'cancel') {
      focusSession.status = 'cancelled';
      focusSession.endTime = new Date();
      
    } else if (body.action === 'add_break') {
      focusSession.breaks.push({
        startTime: new Date(),
        duration: body.breakDuration || 5,
        type: body.breakType || 'manual'
      });
      
    } else if (body.action === 'end_break') {
      const lastBreak = focusSession.breaks[focusSession.breaks.length - 1];
      if (lastBreak && !lastBreak.endTime) {
        lastBreak.endTime = new Date();
      }
      
    } else if (body.action === 'update_productivity') {
      if (body.productivity) {
        Object.assign(focusSession.productivity, body.productivity);
      }
      
    } else {
      // General update
      if (body.title !== undefined) focusSession.title = body.title;
      if (body.notes !== undefined) focusSession.notes = body.notes;
      if (body.tags !== undefined) focusSession.tags = body.tags;
    }

    await focusSession.save();

    return NextResponse.json({
      success: true,
      session: focusSession
    });
  } catch (error) {
    console.error('Focus session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/focus/sessions/[sessionId] - Delete a focus session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { sessionId } = params;

    const result = await FocusSessionModel.deleteOne({
      userId,
      sessionId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Focus session deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
