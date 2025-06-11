import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ChatMessageModel, ChatSessionModel } from '@/lib/models/chat';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type'); // 'messages' or 'sessions'
    const subject = searchParams.get('subject');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lastSyncedAt = searchParams.get('lastSyncedAt');

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (type === 'sessions' || !sessionId) {
      // Fetch chat sessions
      const query: any = { userId };
      
      if (subject) query.subject = subject;
      if (lastSyncedAt) {
        query.lastSyncedAt = { $gt: new Date(lastSyncedAt) };
      }
      
      if (startDate || endDate) {
        query.startedAt = {};
        if (startDate) query.startedAt.$gte = new Date(startDate);
        if (endDate) query.startedAt.$lte = new Date(endDate);
      }

      const sessions = await ChatSessionModel
        .find(query)
        .sort({ startedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await ChatSessionModel.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          pagination: {
            total,
            limit,
            offset,
            hasMore: total > offset + limit
          },
          sync: {
            timestamp: new Date().toISOString(),
            totalItems: sessions.length
          }
        }
      });
    } else {
      // Fetch messages for a specific session
      const query: any = { userId, sessionId };
      
      if (lastSyncedAt) {
        query.lastSyncedAt = { $gt: new Date(lastSyncedAt) };
      }

      const messages = await ChatMessageModel
        .find(query)
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await ChatMessageModel.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: {
          messages,
          sessionId,
          pagination: {
            total,
            limit,
            offset,
            hasMore: total > offset + limit
          },
          sync: {
            timestamp: new Date().toISOString(),
            totalItems: messages.length
          }
        }
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat data',
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

    if (type === 'session') {
      // Create or update chat session
      const sessionData = {
        ...data,
        userId,
        lastSyncedAt: new Date()
      };

      let chatSession;
      if (data.sessionId) {
        // Update existing session
        chatSession = await ChatSessionModel.findOneAndUpdate(
          { sessionId: data.sessionId, userId },
          sessionData,
          { new: true, upsert: true, runValidators: true }
        );
      } else {
        // Create new session
        chatSession = new ChatSessionModel(sessionData);
        await chatSession.save();
      }

      return NextResponse.json({
        success: true,
        data: { session: chatSession }
      });

    } else if (type === 'messages') {
      // Create multiple messages
      const { sessionId, messages } = data;

      if (!sessionId || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'SessionId and messages array are required' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];

      for (const messageData of messages) {
        try {
          const chatMessage = new ChatMessageModel({
            ...messageData,
            userId,
            sessionId,
            lastSyncedAt: new Date()
          });

          const savedMessage = await chatMessage.save();
          results.push(savedMessage);

          // Update session message count and last message time
          await ChatSessionModel.findOneAndUpdate(
            { sessionId, userId },
            { 
              $inc: { messageCount: 1 },
              lastMessageAt: new Date(),
              lastSyncedAt: new Date()
            }
          );

        } catch (error) {
          errors.push({
            message: messageData,
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
        { error: 'Invalid type. Must be "session" or "messages"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Chat Create API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create chat data',
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

    if (type === 'session') {
      // Update chat session
      const updatedSession = await ChatSessionModel.findOneAndUpdate(
        { 
          sessionId: data.sessionId, 
          userId 
        },
        { 
          ...data, 
          lastSyncedAt: new Date() 
        },
        { new: true, runValidators: true }
      );

      if (!updatedSession) {
        return NextResponse.json(
          { error: 'Chat session not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { session: updatedSession }
      });

    } else if (type === 'message') {
      // Update single message
      const updatedMessage = await ChatMessageModel.findOneAndUpdate(
        { 
          messageId: data.messageId, 
          userId 
        },
        { 
          ...data, 
          lastSyncedAt: new Date() 
        },
        { new: true, runValidators: true }
      );

      if (!updatedMessage) {
        return NextResponse.json(
          { error: 'Chat message not found or unauthorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { message: updatedMessage }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "session" or "message"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Chat Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update chat data',
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
    const sessionId = searchParams.get('sessionId');
    const messageId = searchParams.get('messageId');

    if (!sessionId && !messageId) {
      return NextResponse.json(
        { error: 'Either sessionId or messageId is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (sessionId) {
      // Delete entire session and all its messages
      const sessionResult = await ChatSessionModel.deleteOne({
        sessionId,
        userId
      });

      const messagesResult = await ChatMessageModel.deleteMany({
        sessionId,
        userId
      });

      return NextResponse.json({
        success: true,
        data: {
          deletedSession: sessionResult.deletedCount > 0,
          deletedMessages: messagesResult.deletedCount
        }
      });

    } else if (messageId) {
      // Delete single message
      const result = await ChatMessageModel.deleteOne({
        messageId,
        userId
      });

      return NextResponse.json({
        success: true,
        data: {
          deleted: result.deletedCount > 0
        }
      });
    }

  } catch (error) {
    console.error('Chat Delete API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete chat data',
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
