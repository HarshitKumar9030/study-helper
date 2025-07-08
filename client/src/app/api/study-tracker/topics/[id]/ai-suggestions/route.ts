import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { StudyTopic } from '@/lib/models/study-tracker';

// GET /api/study-tracker/topics/[id]/ai-suggestions - Get AI suggestions for a topic
export async function GET(
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

    return NextResponse.json(topic.aiSuggestions || []);
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI suggestions' },
      { status: 500 }
    );
  }
}
