import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { StudyTopic } from '@/lib/models/study-tracker';

// GET /api/study-tracker/topics/[id] - Get a specific topic
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

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error fetching study topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study topic' },
      { status: 500 }
    );
  }
}

// PUT /api/study-tracker/topics/[id] - Update a topic
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    await connectMongo();

    const updatedTopic = await StudyTopic.findOneAndUpdate(
      { _id: params.id, userId: session.user.email },
      { 
        ...body, 
        updatedAt: new Date() 
      },
      { new: true }
    );

    if (!updatedTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTopic);
  } catch (error) {
    console.error('Error updating study topic:', error);
    return NextResponse.json(
      { error: 'Failed to update study topic' },
      { status: 500 }
    );
  }
}

// DELETE /api/study-tracker/topics/[id] - Delete a topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const deletedTopic = await StudyTopic.findOneAndDelete({
      _id: params.id,
      userId: session.user.email
    });

    if (!deletedTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting study topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete study topic' },
      { status: 500 }
    );
  }
}

// PATCH /api/study-tracker/topics/[id] - Update progress for subtopics
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { progressUpdates } = body;
    const resolvedParams = await params;
    
    await connectMongo();

    const topic = await StudyTopic.findOne({
      _id: resolvedParams.id,
      userId: session.user.email
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Update progress for each subtopic
    if (progressUpdates && Array.isArray(progressUpdates)) {
      progressUpdates.forEach(update => {
        const progressIndex = topic.progress.findIndex(
          p => p.subtopic === update.subtopic
        );
        
        if (progressIndex !== -1) {
          // Update existing progress
          topic.progress[progressIndex] = {
            ...topic.progress[progressIndex],
            ...update,
            lastStudied: new Date(),
            updatedAt: new Date()
          };
        }
      });
    }

    topic.updatedAt = new Date();
    
    // Clean up any legacy topicId fields from embedded documents to avoid validation errors
    if (topic.progress) {
      topic.progress = topic.progress.map(p => {
        const cleanProgress = { ...p.toObject() };
        delete cleanProgress.topicId;
        return cleanProgress;
      });
    }
    
    if (topic.aiSuggestions) {
      topic.aiSuggestions = topic.aiSuggestions.map(s => {
        const cleanSuggestion = { ...s.toObject() };
        delete cleanSuggestion.topicId;
        return cleanSuggestion;
      });
    }
    
    // Use markModified to ensure progress updates are saved
    topic.markModified('progress');
    topic.markModified('aiSuggestions');
    await topic.save();

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error updating study progress:', error);
    return NextResponse.json(
      { error: 'Failed to update study progress' },
      { status: 500 }
    );
  }
}
