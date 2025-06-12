import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { TaskModel } from '@/lib/models/scheduler';
import mongoose from 'mongoose';

/**
 * GET /api/scheduler/tasks/[taskId] - Get a specific task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { taskId } = params;

    const task = await TaskModel.findOne({
      userId,
      taskId
    }).populate('dependencies', 'title completed dueDate').lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scheduler/tasks/[taskId] - Update a specific task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { taskId } = params;
    const body = await request.json();

    // Find the task first
    const task = await TaskModel.findOne({ userId, taskId });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'dueDate', 'priority', 'completed', 
      'estimatedDuration', 'actualDuration', 'tags', 'category', 
      'progress', 'subtasks', 'reminders'
    ];

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'dueDate') {
          task[field] = new Date(body[field]);
        } else {
          (task as any)[field] = body[field];
        }
      }
    });

    // Handle completion
    if (body.completed !== undefined) {
      task.completed = body.completed;
      if (body.completed && !task.completedAt) {
        task.completedAt = new Date();
      } else if (!body.completed) {
        task.completedAt = undefined;
      }
    }

    // Handle subtask updates
    if (body.action === 'add_subtask' && body.subtask) {
      task.subtasks.push({
        title: body.subtask.title,
        completed: false,
        createdAt: new Date()
      });
    } else if (body.action === 'update_subtask' && body.subtaskIndex !== undefined) {
      const subtask = task.subtasks[body.subtaskIndex];
      if (subtask) {
        if (body.subtask.title !== undefined) subtask.title = body.subtask.title;
        if (body.subtask.completed !== undefined) subtask.completed = body.subtask.completed;
      }
    } else if (body.action === 'remove_subtask' && body.subtaskIndex !== undefined) {
      task.subtasks.splice(body.subtaskIndex, 1);
    }

    // Handle reminder updates
    if (body.action === 'add_reminder' && body.reminder) {
      task.reminders.push({
        time: new Date(body.reminder.time),
        type: body.reminder.type || 'notification',
        sent: false
      });
    } else if (body.action === 'remove_reminder' && body.reminderIndex !== undefined) {
      task.reminders.splice(body.reminderIndex, 1);
    }

    await task.save();

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task update error:', error);
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
 * DELETE /api/scheduler/tasks/[taskId] - Delete a specific task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { taskId } = params;

    const result = await TaskModel.deleteOne({
      userId,
      taskId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
