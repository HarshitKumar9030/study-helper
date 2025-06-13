import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ScheduleBlockModel } from '@/lib/models/scheduler';
import mongoose from 'mongoose';

/**
 * GET /api/scheduler/blocks - Get user's schedule blocks
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const completed = searchParams.get('completed');

    // Build query filter
    const filter: any = { userId };
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (completed !== null) {
      filter.completed = completed === 'true';
    }

    const blocks = await ScheduleBlockModel.find(filter)
      .sort({ startTime: 1 })
      .populate('taskId', 'title priority completed')
      .lean();

    return NextResponse.json({
      success: true,
      blocks
    });
  } catch (error) {
    console.error('Schedule blocks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler/blocks - Create a new schedule block
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

    // Validate required fields
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    // Validate time order
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check for conflicts (optional - can be disabled for flexibility)
    if (body.checkConflicts !== false) {
      const conflicts = await ScheduleBlockModel.find({
        userId,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Schedule conflict detected',
            conflicts: conflicts.map(c => ({
              title: c.title,
              startTime: c.startTime,
              endTime: c.endTime
            }))
          },
          { status: 409 }
        );
      }
    }    // Calculate duration if not provided
    const duration = body.duration || Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Generate unique block ID
    const blockId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const block = new ScheduleBlockModel({
      userId,
      blockId,
      title: body.title,
      startTime,
      endTime,
      duration,
      type: body.type || 'other',
      description: body.description,
      location: body.location,
      taskId: body.taskId ? new mongoose.Types.ObjectId(body.taskId) : undefined,
      isRecurring: body.isRecurring || false,
      recurringPattern: body.recurringPattern,
      color: body.color,
      priority: body.priority || 'medium',
      completed: body.completed || false
    });

    await block.save();

    return NextResponse.json({
      success: true,
      block
    });
  } catch (error) {
    console.error('Schedule block creation error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scheduler/blocks - Bulk update schedule blocks
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

    if (!body.blockIds || !Array.isArray(body.blockIds)) {
      return NextResponse.json(
        { error: 'blockIds array is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.type !== undefined) updates.type = body.type;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.color !== undefined) updates.color = body.color;

    updates.updatedAt = new Date();

    const result = await ScheduleBlockModel.updateMany(
      { 
        userId,
        blockId: { $in: body.blockIds }
      },
      { $set: updates }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk schedule block update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
