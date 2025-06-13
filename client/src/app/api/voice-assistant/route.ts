import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';
import { VoiceSettingsModel, VoiceCommandModel } from '@/lib/models/voice';

// Middleware to verify API key
async function verifyApiKey(request: NextRequest): Promise<{ user: any; error?: string }> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return { user: null, error: 'API key required' };
  }
  
  try {
    await connectMongo();
    const user = await UserModel.findOne({ apiKey }).select('_id name email role');
    
    if (!user) {
      return { user: null, error: 'Invalid API key' };
    }
    
    return { user: { id: (user._id as any).toString(), name: user.name, email: user.email, role: user.role } };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

// GET - Get voice settings and commands
export async function GET(request: NextRequest) {
  const { user, error } = await verifyApiKey(request);
  
  if (error || !user) {
    return NextResponse.json(
      { error: error || 'Authentication failed' },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'settings') {
      const settings = await VoiceSettingsModel.findOne({ userId: user.id });
      return NextResponse.json({
        success: true,
        settings: settings || {},
      });
    }
    
    if (type === 'commands') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const commands = await VoiceCommandModel.find({ userId: user.id })
        .sort({ executedAt: -1 })
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        commands: commands || [],
      });
    }
    
    // Return both if no specific type requested
    const [settings, commands] = await Promise.all([
      VoiceSettingsModel.findOne({ userId: user.id }),
      VoiceCommandModel.find({ userId: user.id }).sort({ executedAt: -1 }).limit(20)
    ]);
    
    return NextResponse.json({
      success: true,
      settings: settings || {},
      commands: commands || [],
    });
    
  } catch (error) {
    console.error('Voice data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve voice data' },
      { status: 500 }
    );
  }
}

// POST - Save voice command or settings
export async function POST(request: NextRequest) {
  const { user, error } = await verifyApiKey(request);
  
  if (error || !user) {
    return NextResponse.json(
      { error: error || 'Authentication failed' },
      { status: 401 }
    );
  }
  
  try {
    const { type, data } = await request.json();
    
    if (type === 'commands') {
      const { commands } = data;
      
      if (!Array.isArray(commands)) {
        return NextResponse.json(
          { error: 'Commands must be an array' },
          { status: 400 }
        );
      }
      
      // Save commands
      const voiceCommands = commands.map(cmd => ({
        ...cmd,
        userId: user.id,
        executedAt: cmd.executedAt || new Date(),
      }));
      
      await VoiceCommandModel.insertMany(voiceCommands);
      
      return NextResponse.json({
        success: true,
        message: `Saved ${commands.length} voice commands`,
      });
    }
    
    if (type === 'settings') {
      const { settings } = data;
      
      await VoiceSettingsModel.findOneAndUpdate(
        { userId: user.id },
        { ...settings, userId: user.id },
        { upsert: true, new: true }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Voice settings saved successfully',
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid type specified' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Voice data save error:', error);
    return NextResponse.json(
      { error: 'Failed to save voice data' },
      { status: 500 }
    );
  }
}

// Process voice command via API
export async function PUT(request: NextRequest) {
  const { user, error } = await verifyApiKey(request);
  
  if (error || !user) {
    return NextResponse.json(
      { error: error || 'Authentication failed' },
      { status: 401 }
    );
  }
  
  try {
    const { command, options = {} } = await request.json();
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }
    
    // Process the voice command through AI
    const aiResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: command,
        context: 'voice_assistant',
        userId: user.id,
      }),
    });
    
    const aiResult = await aiResponse.json();
    
    // Save the command
    const voiceCommand = new VoiceCommandModel({
      userId: user.id,
      sessionId: options.sessionId || Date.now().toString(),
      command: command,
      transcription: command,
      confidence: options.confidence || 1.0,
      intent: options.intent || 'general_query',
      response: aiResult.message || 'No response available',
      executedAt: new Date(),
      successful: !!aiResult.message,
      responseTime: options.responseTime || 0,
      context: options.context || {},
    });
    
    await voiceCommand.save();
    
    return NextResponse.json({
      success: true,
      response: aiResult.message || 'No response available',
      commandId: voiceCommand._id,
      timestamp: voiceCommand.executedAt,
    });
    
  } catch (error) {
    console.error('Voice command processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
}
