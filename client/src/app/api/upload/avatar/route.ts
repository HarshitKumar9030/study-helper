import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary-server';
import connectMongo from '@/lib/mongodb';
import { UserModel } from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );    }

    await connectMongo();
    
    // Get current user
    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }    // Delete old avatar if exists
    if (user.avatar?.publicId) {
      try {
        await deleteImage(user.avatar.publicId);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload new avatar
    const uploadResult = await uploadImage(buffer, { 
      folder: 'study-helper/avatars' 
    });    // Update user with new avatar
    user.avatar = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
    
    // Also update the image field for NextAuth compatibility
    user.image = uploadResult.secure_url;
    await user.save();    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar,
      image: user.image, // Include this for session updates
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );    }

    await connectMongo();
    
    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }    // Delete avatar from Cloudinary
    if (user.avatar?.publicId) {
      await deleteImage(user.avatar.publicId);
    }    // Remove avatar from user
    user.avatar = undefined;
    user.image = undefined; // Also clear the image field for NextAuth
    await user.save();

    return NextResponse.json({
      message: 'Avatar deleted successfully',
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        image: null,
        avatar: null
      }
    });

  } catch (error) {
    console.error('Avatar deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
