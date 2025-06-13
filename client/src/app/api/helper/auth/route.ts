import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';

// Validate API key and return user info
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const user = await UserModel.findOne({ apiKey }).select('_id email name');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
    
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint for the helper
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const user = await UserModel.findOne({ apiKey }).select('_id email name');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const { action, data } = await request.json();

    // Log helper activity
    console.log(`Voice helper action from ${user.email}: ${action}`, data);

    return NextResponse.json({
      success: true,
      message: 'Action received',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error processing helper request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
