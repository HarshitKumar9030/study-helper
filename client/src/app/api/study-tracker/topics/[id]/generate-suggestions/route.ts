import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { StudyTopic } from '@/lib/models/study-tracker';

// POST /api/study-tracker/topics/[id]/generate-suggestions - Generate new AI suggestions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const topic = await StudyTopic.findOne({
      _id: params.id,
      userId: session.user.email
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Generate AI suggestions using HackClub Llama
    const suggestions = await generateAISuggestions(topic);

    // Update the topic with new suggestions
    const updatedTopic = await StudyTopic.findByIdAndUpdate(
      params.id,
      { 
        $set: { aiSuggestions: suggestions },
        $inc: { __v: 1 }
      },
      { new: true }
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}

async function generateAISuggestions(topic: any) {
  try {
    // Calculate current progress
    const completedCount = topic.progress?.filter((p: any) => p.status === 'completed').length || 0;
    const inProgressCount = topic.progress?.filter((p: any) => p.status === 'in-progress').length || 0;
    const needsReviewCount = topic.progress?.filter((p: any) => p.status === 'needs-review').length || 0;
    const totalCount = topic.progress?.length || 1;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    
    // Calculate time spent
    const totalTimeSpent = topic.progress?.reduce((acc: number, p: any) => acc + (p.timeSpent || 0), 0) || 0;
    const averageConfidence = topic.progress?.length > 0 
      ? topic.progress.reduce((acc: number, p: any) => acc + (p.confidence || 3), 0) / topic.progress.length 
      : 3;

    const context = {
      title: topic.title,
      subject: topic.subject,
      difficulty: topic.difficulty,
      progress: progressPercentage,
      estimatedHours: topic.estimatedHours,
      timeSpent: Math.round(totalTimeSpent / 60), // Convert to hours
      averageConfidence,
      completedCount,
      inProgressCount,
      needsReviewCount,
      totalSubtopics: totalCount,
      tags: topic.tags || []
    };

    // Create a detailed prompt for better AI suggestions
    const prompt = `Study Topic Analysis:
- Subject: ${context.subject}
- Topic: "${context.title}"
- Difficulty Level: ${context.difficulty}
- Progress: ${context.progress}% (${context.completedCount}/${context.totalSubtopics} completed)
- Time Spent: ${context.timeSpent} hours (estimated: ${context.estimatedHours} hours)
- Average Confidence: ${context.averageConfidence.toFixed(1)}/5
- In Progress: ${context.inProgressCount} subtopics
- Needs Review: ${context.needsReviewCount} subtopics
- Tags: ${context.tags.join(', ')}

Generate 4-6 personalized study suggestions. Consider the student's current progress, confidence level, and time spent. Provide actionable, specific advice.

Return ONLY a JSON array with this exact format:
[
  {
    "type": "tip|resource|practice|review|motivation",
    "content": "detailed suggestion text (50-150 words)",
    "relevanceScore": 0.8
  }
]`;

    // Call HackClub Llama API
    const response = await fetch('https://ai.hackclub.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI study assistant. Generate personalized study suggestions based on student progress and learning patterns. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No AI response received');
    }

    // Clean up the response (remove any markdown code blocks)
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse the AI response as JSON
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Create contextual fallback suggestions based on progress
      suggestions = createFallbackSuggestions(context);
    }

    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
      suggestions = [suggestions];
    }

    // Validate and format suggestions
    const formattedSuggestions = suggestions.slice(0, 6).map((suggestion: any, index: number) => ({
      _id: `suggestion-${Date.now()}-${index}`,
      type: suggestion.type || 'tip',
      content: suggestion.content || 'Continue studying consistently and review your notes regularly.',
      relevanceScore: Math.min(1.0, Math.max(0.7, suggestion.relevanceScore || 0.8)),
      createdAt: new Date(),
      isImplemented: false
    }));

    return formattedSuggestions;

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Return contextual fallback suggestions
    return createFallbackSuggestions({
      title: topic.title,
      subject: topic.subject,
      difficulty: topic.difficulty,
      progress: 0,
      estimatedHours: topic.estimatedHours,
      timeSpent: 0,
      averageConfidence: 3,
      completedCount: 0,
      inProgressCount: 0,
      needsReviewCount: 0,
      totalSubtopics: 1,
      tags: topic.tags || []
    });
  }
}

function createFallbackSuggestions(context: any) {
  const suggestions = [];

  // Progress-based suggestions
  if (context.progress < 25) {
    suggestions.push({
      _id: `fallback-${Date.now()}-1`,
      type: 'tip',
      content: `You're just getting started with "${context.title}". Break down the material into smaller chunks and focus on understanding the fundamental concepts before moving to advanced topics. Set a consistent study schedule to build momentum.`,
      relevanceScore: 0.9,
      createdAt: new Date(),
      isImplemented: false
    });
  } else if (context.progress < 75) {
    suggestions.push({
      _id: `fallback-${Date.now()}-1`,
      type: 'review',
      content: `You're making good progress on "${context.title}". Take time to review the concepts you've already learned to strengthen your understanding. Consider creating summary notes or teaching the material to someone else.`,
      relevanceScore: 0.9,
      createdAt: new Date(),
      isImplemented: false
    });
  } else {
    suggestions.push({
      _id: `fallback-${Date.now()}-1`,
      type: 'practice',
      content: `You're almost done with "${context.title}"! Focus on practicing more challenging problems and applications. Look for real-world examples that connect to what you've learned.`,
      relevanceScore: 0.9,
      createdAt: new Date(),
      isImplemented: false
    });
  }

  // Confidence-based suggestions
  if (context.averageConfidence < 3) {
    suggestions.push({
      _id: `fallback-${Date.now()}-2`,
      type: 'resource',
      content: `Your confidence seems low in some areas of ${context.subject}. Try finding additional resources like video tutorials, practice exercises, or study groups to reinforce your understanding. Don't hesitate to ask for help when needed.`,
      relevanceScore: 0.8,
      createdAt: new Date(),
      isImplemented: false
    });
  } else if (context.averageConfidence > 4) {
    suggestions.push({
      _id: `fallback-${Date.now()}-2`,
      type: 'practice',
      content: `You're showing high confidence in ${context.subject}! Challenge yourself with more advanced problems or try explaining concepts to others. Consider exploring related topics that build on "${context.title}".`,
      relevanceScore: 0.8,
      createdAt: new Date(),
      isImplemented: false
    });
  }

  // Difficulty-based suggestions
  if (context.difficulty === 'advanced') {
    suggestions.push({
      _id: `fallback-${Date.now()}-3`,
      type: 'tip',
      content: `Since "${context.title}" is advanced-level material, make sure you have a solid grasp of prerequisite concepts. Use multiple sources and don't rush through the material. Quality understanding is more important than speed.`,
      relevanceScore: 0.8,
      createdAt: new Date(),
      isImplemented: false
    });
  }

  // Time management suggestions
  if (context.timeSpent > context.estimatedHours * 1.5) {
    suggestions.push({
      _id: `fallback-${Date.now()}-4`,
      type: 'tip',
      content: `You've spent more time than estimated on "${context.title}". Consider adjusting your study strategy - try active learning techniques like summarizing, questioning, or teaching concepts aloud to improve efficiency.`,
      relevanceScore: 0.8,
      createdAt: new Date(),
      isImplemented: false
    });
  }

  // Motivation suggestion
  suggestions.push({
    _id: `fallback-${Date.now()}-5`,
    type: 'motivation',
    content: `Keep up the great work with your ${context.subject} studies! Remember that learning is a process, and every step forward builds your knowledge. Celebrate your progress and stay consistent with your efforts.`,
    relevanceScore: 0.7,
    createdAt: new Date(),
    isImplemented: false
  });

  return suggestions.slice(0, 4); // Return up to 4 suggestions
}
