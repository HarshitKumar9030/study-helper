/**
 * AI Assistant API Route
 * Handles various AI-powered study assistance requests
 */

import { NextRequest, NextResponse } from 'next/server';
import geminiAI from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!geminiAI.isAvailable()) {
      return NextResponse.json(
        { 
          error: 'AI service is currently unavailable',
          fallback: true 
        },
        { status: 503 }
      );
    }

    switch (type) {
      case 'study_assistance':
        const { question, context } = data;
        if (!question) {
          return NextResponse.json(
            { error: 'Question is required for study assistance' },
            { status: 400 }
          );
        }
        
        const studyResponse = await geminiAI.getStudyAssistance(question, context);
        return NextResponse.json({ success: true, data: studyResponse });

      case 'schedule_recommendations':
        const { subjects, totalTime, preferences } = data;
        if (!subjects || !totalTime) {
          return NextResponse.json(
            { error: 'Subjects and totalTime are required for schedule recommendations' },
            { status: 400 }
          );
        }
        
        const scheduleResponse = await geminiAI.getScheduleRecommendations(
          subjects, 
          totalTime, 
          preferences
        );
        return NextResponse.json({ success: true, data: scheduleResponse });

      case 'focus_help':
        const { situation, mood } = data;
        if (!situation) {
          return NextResponse.json(
            { error: 'Situation description is required for focus help' },
            { status: 400 }
          );
        }
        
        const focusResponse = await geminiAI.getFocusHelp(situation, mood);
        return NextResponse.json({ success: true, data: focusResponse });

      case 'pattern_analysis':
        const { studyData } = data;
        if (!studyData) {
          return NextResponse.json(
            { error: 'Study data is required for pattern analysis' },
            { status: 400 }
          );
        }
        
        const analysisResponse = await geminiAI.analyzeStudyPatterns(studyData);
        return NextResponse.json({ success: true, data: analysisResponse });

      default:
        return NextResponse.json(
          { error: 'Invalid AI request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
