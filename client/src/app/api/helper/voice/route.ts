import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Voice assistant endpoint for helper application
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

    const { command, context } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // Process voice command with AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
You are a helpful study assistant. The user said: "${command}"

Context: ${context || 'No additional context provided'}

Provide a helpful response. If this is a study-related command, provide actionable advice. If it's about scheduling, suggest time management strategies. Keep responses concise and friendly.

Response:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Log the interaction
    console.log(`Voice command from ${user.email}: ${command}`);

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
      user: user.name,
    });
    
  } catch (error) {
    console.error('Error processing voice command:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check voice assistant status
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
      status: 'Voice assistant is ready',
      user: user.name,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error checking voice assistant status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
