import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { StudyTopic } from '@/lib/models/study-tracker';

// PATCH /api/study-tracker/suggestions/[id]/implement - Mark suggestion as implemented
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    // Find the topic that contains this suggestion
    const topic = await StudyTopic.findOne({
      userId: session.user.email,
      'aiSuggestions._id': id
    });

    if (!topic) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Update the specific suggestion
    const updatedTopic = await StudyTopic.findOneAndUpdate(
      { 
        userId: session.user.email,
        'aiSuggestions._id': id 
      },
      { 
        $set: { 'aiSuggestions.$.isImplemented': true },
        $inc: { __v: 1 }
      },
      { new: true }
    );

    return NextResponse.json({ message: 'Suggestion marked as implemented' });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}
