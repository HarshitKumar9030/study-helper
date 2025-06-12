import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { VoiceSettingsModel, VoiceCommandModel } from '@/lib/models/voice';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'settings' or 'commands'
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const successful = searchParams.get('successful');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lastSyncedAt = searchParams.get('lastSyncedAt');

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'settings' || !type) {
      // Fetch voice settings
      const settings = await VoiceSettingsModel
        .findOne({ userId })
        .lean();      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = new VoiceSettingsModel({
          userId,
          enabled: true,
          volume: 0.8,
          rate: 150,
          language: 'en-US',
          activationKeyword: 'hey study helper',
          wakeWordSensitivity: 0.7,
          noiseReduction: true,
          autoTranscription: true,
          confidenceThreshold: 0.4  // Lowered to match frontend
        });

        const savedSettings = await defaultSettings.save();
        
        return NextResponse.json({
          success: true,
          data: {
            settings: savedSettings,
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
          settings,
          sync: {
            timestamp: new Date().toISOString(),
            created: false
          }
        }
      });

    } else if (type === 'commands') {
      // Fetch voice commands
      const query: any = { userId };
      
      if (sessionId) query.sessionId = sessionId;
      if (successful !== null && successful !== undefined) {
        query.successful = successful === 'true';
      }
      if (lastSyncedAt) {
        query.lastSyncedAt = { $gt: new Date(lastSyncedAt) };
      }
      
      if (startDate || endDate) {
        query.executedAt = {};
        if (startDate) query.executedAt.$gte = new Date(startDate);
        if (endDate) query.executedAt.$lte = new Date(endDate);
      }

      const commands = await VoiceCommandModel
        .find(query)
        .sort({ executedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await VoiceCommandModel.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: {
          commands,
          pagination: {
            total,
            limit,
            offset,
            hasMore: total > offset + limit
          },
          sync: {
            timestamp: new Date().toISOString(),
            totalItems: commands.length
          }
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "settings" or "commands"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch voice data',
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

    if (type === 'commands') {
      // Create voice commands
      const { commands } = data;

      if (!Array.isArray(commands)) {
        return NextResponse.json(
          { error: 'Commands must be an array' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];

      for (const commandData of commands) {
        try {
          const voiceCommand = new VoiceCommandModel({
            ...commandData,
            userId,
            lastSyncedAt: new Date()
          });

          const savedCommand = await voiceCommand.save();
          results.push(savedCommand);
        } catch (error) {
          errors.push({
            command: commandData,
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
        { error: 'Invalid type. Only "commands" creation is supported' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Voice Create API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create voice data',
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

    if (type === 'settings') {
      // Update voice settings
      const updatedSettings = await VoiceSettingsModel.findOneAndUpdate(
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
        data: { settings: updatedSettings }
      });

    } else if (type === 'command') {
      // Update single voice command
      if (!data._id) {
        return NextResponse.json(
          { error: 'Command ID is required for updates' },
          { status: 400 }
        );
      }

      const updatedCommand = await VoiceCommandModel.findOneAndUpdate(
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

      if (!updatedCommand) {
        return NextResponse.json(
          { error: 'Voice command not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { command: updatedCommand }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "settings" or "command"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Voice Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update voice data',
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
    const sessionId = searchParams.get('sessionId');
    const olderThan = searchParams.get('olderThan'); // ISO date string

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'commands') {
      let result;

      if (id) {
        // Delete specific command
        result = await VoiceCommandModel.deleteOne({
          _id: id,
          userId
        });
      } else if (sessionId) {
        // Delete all commands for a session
        result = await VoiceCommandModel.deleteMany({
          sessionId,
          userId
        });
      } else if (olderThan) {
        // Delete commands older than specified date
        result = await VoiceCommandModel.deleteMany({
          userId,
          executedAt: { $lt: new Date(olderThan) }
        });
      } else {
        return NextResponse.json(
          { error: 'Either id, sessionId, or olderThan parameter is required' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.deletedCount
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Only "commands" deletion is supported' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Voice Delete API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete voice data',
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
