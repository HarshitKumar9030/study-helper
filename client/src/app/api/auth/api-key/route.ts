import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';
import { randomBytes } from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
  return 'sh_' + randomBytes(32).toString('hex');
}

// GET - Retrieve current API key
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectMongo();
    
    const user = await UserModel.findById(session.user.id).select('apiKey apiKeyCreatedAt');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      apiKey: user.apiKey,
      createdAt: user.apiKeyCreatedAt,
    });
    
  } catch (error) {
    console.error('API key retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve API key' },
      { status: 500 }
    );
  }
}

// POST - Generate new API key
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectMongo();
    
    const newApiKey = generateApiKey();
    
    const user = await UserModel.findByIdAndUpdate(
      session.user.id,
      {
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date(),
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
      success: true,
      apiKey: user.apiKey,
      createdAt: user.apiKeyCreatedAt,
      message: 'New API key generated successfully',
    });
    
  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}

// Verify API key (for external applications)
export async function PUT(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 400 }
      );
    }
    
    await connectMongo();
    
    const user = await UserModel.findOne({ apiKey }).select('_id name email role');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key', valid: false },
        { status: 401 }
      );
    }
      return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error) {
    console.error('API key verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify API key', valid: false },
      { status: 500 }
    );
  }
}
