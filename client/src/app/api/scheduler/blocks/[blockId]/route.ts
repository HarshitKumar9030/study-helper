import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ScheduleBlockModel } from '@/lib/models/scheduler';
import mongoose from 'mongoose';

/**
 * GET /api/scheduler/blocks/[blockId] - Get a specific schedule block
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { blockId } = await params;

    const block = await ScheduleBlockModel.findOne({
      userId,
      blockId
    }).populate('taskId', 'title description priority completed estimatedDuration').lean();

    if (!block) {
      return NextResponse.json({ error: 'Schedule block not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      block
    });
  } catch (error) {
    console.error('Schedule block fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scheduler/blocks/[blockId] - Update a specific schedule block
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { blockId } = await params;
    const body = await request.json();

    // Find the block first
    const block = await ScheduleBlockModel.findOne({ userId, blockId });
    if (!block) {
      return NextResponse.json({ error: 'Schedule block not found' }, { status: 404 });
    }

    // Update fields
    const allowedUpdates = [
      'title', 'startTime', 'endTime', 'type', 'description', 'location',
      'completed', 'priority', 'color', 'isRecurring', 'recurringPattern'
    ];

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'startTime' || field === 'endTime') {
          (block as any)[field] = new Date(body[field]);
        } else if (field === 'taskId' && body[field]) {
          (block as any)[field] = new mongoose.Types.ObjectId(body[field]);
        } else {
          (block as any)[field] = body[field];
        }
      }
    });

    // Validate time order if both times are being updated
    if (block.startTime >= block.endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check for conflicts if times are being changed
    if (body.startTime || body.endTime) {
      if (body.checkConflicts !== false) {
        const conflicts = await ScheduleBlockModel.find({
          userId,
          blockId: { $ne: blockId }, // exclude current block
          $or: [
            {
              startTime: { $lt: block.endTime },
              endTime: { $gt: block.startTime }
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
      }
    }

    await block.save();

    return NextResponse.json({
      success: true,
      block
    });
  } catch (error) {
    console.error('Schedule block update error:', error);
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
 * DELETE /api/scheduler/blocks/[blockId] - Delete a specific schedule block
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { blockId } = await params;

    const result = await ScheduleBlockModel.deleteOne({
      userId,
      blockId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Schedule block not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule block deleted successfully'
    });
  } catch (error) {
    console.error('Schedule block deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
