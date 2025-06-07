import { NextRequest, NextResponse } from 'next/server';
import geminiAI from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversation_history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context if history is provided
    let fullPrompt = message;
    if (conversation_history && conversation_history.length > 0) {
      const historyContext = conversation_history
        .slice(-5) // Keep last 5 exchanges for context
        .map((item: any) => `Human: ${item.human}\nAssistant: ${item.assistant}`)
        .join('\n\n');
      
      fullPrompt = `Previous conversation:\n${historyContext}\n\nCurrent question: ${message}`;
    }

    const response = await geminiAI.getStudyAssistance(fullPrompt, context);

    return NextResponse.json({
      success: true,
      data: {
        message: response.message,
        suggestions: response.suggestions,
        actionItems: response.actionItems,
        confidence: response.confidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat Assistant API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
