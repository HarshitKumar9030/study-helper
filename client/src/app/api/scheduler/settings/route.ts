import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ScheduleSettingsModel } from '@/lib/models/scheduler';
import mongoose from 'mongoose';

/**
 * GET /api/scheduler/settings - Get user's scheduler settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    let settings = await ScheduleSettingsModel.findOne({ userId }).lean();

    // Create default settings if none exist
    if (!settings) {
      const defaultSettings = new ScheduleSettingsModel({
        userId,
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        defaultTaskDuration: 30,
        breakDuration: 5,
        breakFrequency: 60,
        autoSchedule: true,
        bufferTime: 5,
        focusTimeBlocks: [
          {
            name: 'Morning Focus',
            start: '09:00',
            end: '11:00',
            days: [1, 2, 3, 4, 5]
          },
          {
            name: 'Afternoon Focus',
            start: '14:00',
            end: '16:00',
            days: [1, 2, 3, 4, 5]
          }
        ],
        categories: [
          {
            name: 'Work',
            color: '#3B82F6',
            defaultDuration: 45
          },
          {
            name: 'Study',
            color: '#10B981',
            defaultDuration: 60
          },
          {
            name: 'Personal',
            color: '#F59E0B',
            defaultDuration: 30
          },
          {
            name: 'Health',
            color: '#EF4444',
            defaultDuration: 30
          }
        ],
        notifications: {
          taskReminders: true,
          scheduleUpdates: true,
          dailySummary: false,
          reminderTime: 15
        }
      });

      const savedSettings = await defaultSettings.save();
      settings = savedSettings.toObject();
    }

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Scheduler settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scheduler/settings - Update scheduler settings
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

    // Validate working hours format
    if (body.workingHours) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (body.workingHours.start && !timeRegex.test(body.workingHours.start)) {
        return NextResponse.json(
          { error: 'Invalid start time format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (body.workingHours.end && !timeRegex.test(body.workingHours.end)) {
        return NextResponse.json(
          { error: 'Invalid end time format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    // Validate working days
    if (body.workingDays && Array.isArray(body.workingDays)) {
      const validDays = body.workingDays.every((day: any) => 
        typeof day === 'number' && day >= 0 && day <= 6
      );
      if (!validDays) {
        return NextResponse.json(
          { error: 'Invalid working days. Use numbers 0-6 (Sunday=0)' },
          { status: 400 }
        );
      }
    }

    // Validate duration fields
    const durationFields = ['defaultTaskDuration', 'breakDuration', 'breakFrequency', 'bufferTime'];
    for (const field of durationFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'number' || body[field] < 0) {
          return NextResponse.json(
            { error: `${field} must be a positive number` },
            { status: 400 }
          );
        }
      }
    }

    const updatedSettings = await ScheduleSettingsModel.findOneAndUpdate(
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
    console.error('Scheduler settings update error:', error);
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
 * POST /api/scheduler/settings/category - Add a new category
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

    if (!body.name || !body.color) {
      return NextResponse.json(
        { error: 'Category name and color are required' },
        { status: 400 }
      );
    }

    // Validate color format (hex color)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(body.color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex format like #FF5733' },
        { status: 400 }
      );
    }

    const settings = await ScheduleSettingsModel.findOne({ userId });
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Check if category already exists
    const existingCategory = settings.categories.find(cat => cat.name === body.name);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    const newCategory = {
      name: body.name,
      color: body.color,
      defaultDuration: body.defaultDuration || 30
    };

    settings.categories.push(newCategory);
    await settings.save();

    return NextResponse.json({
      success: true,
      category: newCategory,
      settings
    });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
