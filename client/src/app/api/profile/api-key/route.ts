import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';
import { randomBytes } from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
  return 'sh_' + randomBytes(32).toString('hex');
}

// GET /api/profile/api-key - Get current API key
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const user = await UserModel.findOne({ email: session.user.email }).select('apiKey apiKeyCreatedAt');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      apiKey: user.apiKey,
      createdAt: user.apiKeyCreatedAt,
    });
    
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/profile/api-key - Regenerate API key
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const newApiKey = generateApiKey();
    
    const user = await UserModel.findOneAndUpdate(
      { email: session.user.email },
      { 
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date()
      },
      { new: true }
    ).select('apiKey apiKeyCreatedAt');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      apiKey: user.apiKey,
      createdAt: user.apiKeyCreatedAt,
    });
    
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
