import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ScheduleItemModel } from '@/lib/models/schedule';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const subject = searchParams.get('subject');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lastSyncedAt = searchParams.get('lastSyncedAt');

    // Build query
    const query: any = { userId: new mongoose.Types.ObjectId(session.user.id) };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (subject) query.subject = subject;
    if (lastSyncedAt) {
      query.lastSyncedAt = { $gt: new Date(lastSyncedAt) };
    }
    
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const scheduleItems = await ScheduleItemModel
      .find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await ScheduleItemModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        items: scheduleItems,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit
        },
        sync: {
          timestamp: new Date().toISOString(),
          totalItems: scheduleItems.length
        }
      }
    });

  } catch (error) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch schedule items',
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
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    await connectMongo();

    const results = [];
    const errors = [];

    for (const itemData of items) {
      try {
        const scheduleItem = new ScheduleItemModel({
          ...itemData,
          userId: new mongoose.Types.ObjectId(session.user.id),
          lastSyncedAt: new Date()
        });

        const savedItem = await scheduleItem.save();
        results.push(savedItem);
      } catch (error) {
        errors.push({
          item: itemData,
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

  } catch (error) {
    console.error('Schedule Create API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create schedule items',
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
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    await connectMongo();

    const results = [];
    const errors = [];

    for (const itemData of items) {
      try {
        if (!itemData._id) {
          throw new Error('Item ID is required for updates');
        }

        const updatedItem = await ScheduleItemModel.findOneAndUpdate(
          { 
            _id: itemData._id, 
            userId: new mongoose.Types.ObjectId(session.user.id) 
          },
          { 
            ...itemData, 
            lastSyncedAt: new Date() 
          },
          { new: true, runValidators: true }
        );

        if (!updatedItem) {
          throw new Error('Schedule item not found or unauthorized');
        }

        results.push(updatedItem);
      } catch (error) {
        errors.push({
          item: itemData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: results,
        errors,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Schedule Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update schedule items',
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
    const id = searchParams.get('id');
    const ids = searchParams.get('ids')?.split(',');

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Either id or ids parameter is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    let result;
    if (id) {
      result = await ScheduleItemModel.deleteOne({
        _id: id,
        userId: new mongoose.Types.ObjectId(session.user.id)
      });
    } else if (ids) {
      result = await ScheduleItemModel.deleteMany({
        _id: { $in: ids },
        userId: new mongoose.Types.ObjectId(session.user.id)
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: result?.deletedCount || 0
      }
    });

  } catch (error) {
    console.error('Schedule Delete API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete schedule items',
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
