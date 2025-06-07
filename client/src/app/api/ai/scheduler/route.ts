import { NextRequest, NextResponse } from 'next/server';
import geminiAI from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { 
      subjects, 
      totalTime, 
      preferences, 
      deadlines, 
      currentSchedule 
    } = await request.json();

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: 'Subjects array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!totalTime || totalTime <= 0) {
      return NextResponse.json(
        { error: 'Total time must be a positive number (in minutes)' },
        { status: 400 }
      );
    }

    // Enhance preferences with deadline information
    const enhancedPreferences = {
      ...preferences,
      deadlines: deadlines || {},
      currentSchedule: currentSchedule || []
    };

    const recommendations = await geminiAI.getScheduleRecommendations(
      subjects,
      totalTime,
      enhancedPreferences
    );

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalTime,
        subjects,
        generatedAt: new Date().toISOString(),
        metadata: {
          totalSessions: recommendations.length,
          totalBreaks: recommendations.reduce((sum, rec) => sum + rec.breaks, 0),
          difficultyDistribution: recommendations.reduce((acc, rec) => {
            acc[rec.difficulty] = (acc[rec.difficulty] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });

  } catch (error) {
    console.error('Scheduler API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve schedule templates or suggestions
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  try {
    if (type === 'templates') {
      // Return predefined schedule templates
      const templates = [
        {
          id: 'pomodoro',
          name: 'Pomodoro Technique',
          description: '25-minute focused sessions with 5-minute breaks',
          sessionLength: 25,
          shortBreak: 5,
          longBreak: 15,
          sessionsBeforeLongBreak: 4
        },
        {
          id: 'deep_work',
          name: 'Deep Work Sessions',
          description: '90-minute intensive study sessions',
          sessionLength: 90,
          shortBreak: 20,
          longBreak: 60,
          sessionsBeforeLongBreak: 2
        },
        {
          id: 'spaced_repetition',
          name: 'Spaced Repetition',
          description: 'Review schedule based on forgetting curve',
          intervals: [1, 3, 7, 14, 30], // days
          sessionLength: 30,
          reviewPercentage: 0.3
        }
      ];

      return NextResponse.json({
        success: true,
        data: templates
      });
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Scheduler GET API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scheduler data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
