import { NextRequest, NextResponse } from 'next/server';
import geminiAI from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { situation, mood, distractions, currentTask, timeRemaining } = await request.json();

    if (!situation) {
      return NextResponse.json(
        { error: 'Situation description is required' },
        { status: 400 }
      );
    }

    // Build enhanced context for better focus advice
    const enhancedSituation = `
      Current situation: ${situation}
      ${mood ? `Mood/Energy level: ${mood}` : ''}
      ${distractions ? `Current distractions: ${distractions.join(', ')}` : ''}
      ${currentTask ? `Working on: ${currentTask}` : ''}
      ${timeRemaining ? `Time remaining: ${timeRemaining} minutes` : ''}
    `.trim();

    const response = await geminiAI.getFocusHelp(enhancedSituation, mood);

    // Add additional focus techniques based on mood
    let focusTechniques: string[] = [];
    if (mood === 'tired') {
      focusTechniques = [
        'Take a 5-minute walk',
        'Do some light stretching',
        'Drink water and have a healthy snack',
        'Try the 20-20-20 rule (look at something 20 feet away for 20 seconds every 20 minutes)'
      ];
    } else if (mood === 'overwhelmed') {
      focusTechniques = [
        'Break your task into smaller 5-minute chunks',
        'Use the 2-minute rule: if it takes less than 2 minutes, do it now',
        'Write down everything on your mind to clear mental space',
        'Focus on just one thing at a time'
      ];
    } else if (mood === 'distracted') {
      focusTechniques = [
        'Put your phone in airplane mode',
        'Use website blockers',
        'Try the "One Tab Rule" - only one browser tab open',
        'Set a timer for focused work bursts'
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        focusTechniques,
        recommendedBreak: timeRemaining && timeRemaining > 45 ? 
          'Consider taking a 5-10 minute break soon' : null,
        quickWins: [
          'Clear your workspace',
          'Set a 15-minute timer',
          'Identify your ONE priority task',
          'Eliminate one distraction source'
        ]
      }
    });

  } catch (error) {
    console.error('Focus Assistant API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get focus assistance',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for focus tips and techniques
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  try {
    const focusResources = {
      techniques: [
        {
          name: 'Pomodoro Technique',
          description: 'Work for 25 minutes, then take a 5-minute break',
          duration: 25,
          difficulty: 'easy'
        },
        {
          name: 'Time Blocking',
          description: 'Schedule specific time blocks for different tasks',
          duration: 60,
          difficulty: 'medium'
        },
        {
          name: 'Deep Work',
          description: 'Extended periods of focused, uninterrupted work',
          duration: 90,
          difficulty: 'hard'
        }
      ],
      distractionBlocks: [
        {
          type: 'digital',
          tools: ['Cold Turkey', 'Freedom', 'Forest App'],
          description: 'Block distracting websites and apps'
        },
        {
          type: 'environmental',
          tips: ['Clean workspace', 'Good lighting', 'Comfortable temperature'],
          description: 'Optimize your physical environment'
        },
        {
          type: 'mental',
          techniques: ['Meditation', 'Breathing exercises', 'Mental noting'],
          description: 'Train your mind to maintain focus'
        }
      ],
      motivationalTips: [
        'Start with the hardest task when your energy is highest',
        'Use the 2-minute rule for quick tasks',
        'Reward yourself after completing difficult work',
        'Remember your bigger goals and why this work matters'
      ]
    };

    if (category && focusResources[category as keyof typeof focusResources]) {
      return NextResponse.json({
        success: true,
        data: focusResources[category as keyof typeof focusResources]
      });
    }

    return NextResponse.json({
      success: true,
      data: focusResources
    });

  } catch (error) {
    console.error('Focus GET API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve focus resources' },
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
