import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@/lib/cloudinary-server';

export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    await deleteImage(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
