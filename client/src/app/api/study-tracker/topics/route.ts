import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { StudyTopic } from '@/lib/models/study-tracker';

// GET /api/study-tracker/topics - Get all topics for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const topics = await StudyTopic.find({ 
      userId: session.user.email 
    }).sort({ updatedAt: -1 });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching study topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study topics' },
      { status: 500 }
    );
  }
}

// POST /api/study-tracker/topics - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      subject,
      description,
      difficulty,
      estimatedHours,
      tags,
      progress
    } = body;

    if (!title || !subject) {
      return NextResponse.json(
        { error: 'Title and subject are required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const newTopic = new StudyTopic({
      title,
      subject,
      description,
      difficulty: difficulty || 'intermediate',
      estimatedHours: estimatedHours || 1,
      tags: tags || [],
      userId: session.user.email,
      progress: [], // Create empty progress array initially
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedTopic = await newTopic.save();

    // Now add progress items with the correct topicId if any were provided
    if (progress && progress.length > 0) {
      const progressWithTopicId = progress.map((p: any) => ({
        ...p,
        topicId: savedTopic._id
      }));
      
      savedTopic.progress = progressWithTopicId;
      await savedTopic.save();
    }

    // Generate initial AI suggestions for the new topic
    try {
      await generateAISuggestions(savedTopic);
    } catch (aiError) {
      console.error('Error generating AI suggestions:', aiError);
      // Don't fail the topic creation if AI suggestions fail
    }

    return NextResponse.json(savedTopic, { status: 201 });
  } catch (error) {
    console.error('Error creating study topic:', error);
    return NextResponse.json(
      { error: 'Failed to create study topic' },
      { status: 500 }
    );
  }
}

// Helper function to generate AI suggestions
async function generateAISuggestions(topic: any) {
  try {
    // Get study context
    const completedCount = topic.progress?.filter((p: any) => p.status === 'completed').length || 0;
    const totalCount = topic.progress?.length || 1;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    
    const context = {
      title: topic.title,
      subject: topic.subject,
      difficulty: topic.difficulty,
      progress: progressPercentage,
      estimatedHours: topic.estimatedHours,
      tags: topic.tags
    };

    // Call HackClub Llama API for suggestions
    const response = await fetch('https://ai.hackclub.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an AI study assistant. Generate 4-6 helpful, specific suggestions for a student studying this topic. Return a JSON array of suggestions, each with:
            - type: one of ["tip", "resource", "practice", "review", "motivation"]
            - content: detailed, actionable suggestion (50-150 words)
            - relevanceScore: number between 0.7-1.0
            
            Focus on practical, personalized advice based on the subject, difficulty, and current progress.`
          },
          {
            role: 'user',
            content: `Study Topic: ${context.title}
Subject: ${context.subject}
Difficulty: ${context.difficulty}
Progress: ${context.progress}%
Estimated Hours: ${context.estimatedHours}
Tags: ${context.tags.join(', ')}

Please provide specific study suggestions for this topic.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No AI response received');
    }

    // Try to parse the AI response as JSON
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, create fallback suggestions
      suggestions = [
        {
          type: 'tip',
          content: `For ${context.subject}, start with the fundamental concepts in "${context.title}". Break down complex topics into smaller, manageable chunks and use active recall techniques.`,
          relevanceScore: 0.8
        },
        {
          type: 'practice',
          content: `Practice problems are essential for mastering ${context.subject}. Look for exercises related to "${context.title}" and solve them step by step.`,
          relevanceScore: 0.8
        },
        {
          type: 'resource',
          content: `Find additional resources like textbooks, online tutorials, or educational videos specifically about "${context.title}" to supplement your learning.`,
          relevanceScore: 0.7
        }
      ];
    }

    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
      suggestions = [suggestions];
    }

    // Save suggestions to the topic
    const aiSuggestions = suggestions.map((suggestion: any) => ({
      type: suggestion.type || 'tip',
      content: suggestion.content || 'Study consistently and review regularly.',
      relevanceScore: suggestion.relevanceScore || 0.8,
      createdAt: new Date(),
      isImplemented: false
    }));

    await StudyTopic.findByIdAndUpdate(topic._id, {
      $set: { aiSuggestions },
      $inc: { __v: 1 }
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    // Create fallback suggestions
    const fallbackSuggestions = [
      {
        type: 'tip',
        content: `Break down "${topic.title}" into smaller, manageable sections. Focus on understanding one concept at a time before moving to the next.`,
        relevanceScore: 0.8,
        createdAt: new Date(),
        isImplemented: false
      },
      {
        type: 'practice',
        content: `Practice regularly with problems related to ${topic.subject}. The more you practice, the better you'll understand the concepts.`,
        relevanceScore: 0.8,
        createdAt: new Date(),
        isImplemented: false
      }
    ];

    await StudyTopic.findByIdAndUpdate(topic._id, {
      $set: { aiSuggestions: fallbackSuggestions },
      $inc: { __v: 1 }
    });
  }
}
