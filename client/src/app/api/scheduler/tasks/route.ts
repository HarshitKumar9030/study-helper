import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { TaskModel } from '@/lib/models/scheduler';
import mongoose, { Model } from 'mongoose';

/**
 * GET /api/scheduler/tasks - Get user's tasks
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
    const limit = parseInt(searchParams.get('limit') || '100');
    const completed = searchParams.get('completed');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tags = searchParams.get('tags');

    // Build query filter
    const filter: any = { userId };
    
    if (completed !== null) {
      filter.completed = completed === 'true';
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (tags) {
      filter.tags = { $in: tags.split(',') };
    }
    
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }    const tasks = await TaskModel.find(filter)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Get task statistics manually
    const totalTasks = await TaskModel.countDocuments({ userId });
    const completedTasks = await TaskModel.countDocuments({ userId, completed: true });
    const overdueTasks = await TaskModel.countDocuments({ 
      userId, 
      completed: false, 
      dueDate: { $lt: new Date() } 
    });

    const stats = {
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingTasks: totalTasks - completedTasks
    };    return NextResponse.json({
      success: true,
      tasks,
      stats
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler/tasks - Create a new task
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
    if (!body.title || !body.dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // Generate unique task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task = new TaskModel({
      userId,
      taskId,
      title: body.title,
      description: body.description,
      dueDate: new Date(body.dueDate),
      priority: body.priority || 'medium',
      estimatedDuration: body.estimatedDuration || 30,
      tags: body.tags || [],
      category: body.category,
      subtasks: body.subtasks || [],
      reminders: body.reminders || []
    });

    await task.save();

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Task creation error:', error);
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
 * PUT /api/scheduler/tasks - Bulk update tasks
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

    if (!body.taskIds || !Array.isArray(body.taskIds)) {
      return NextResponse.json(
        { error: 'taskIds array is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;

    updates.updatedAt = new Date();
    
    if (body.completed) {
      updates.completedAt = new Date();
    }

    const result = await TaskModel.updateMany(
      { 
        userId,
        taskId: { $in: body.taskIds }
      },
      { $set: updates }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Define interface for static methods
