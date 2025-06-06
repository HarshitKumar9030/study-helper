import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  url: string;
  secure_url: string;
}

export interface ImageUploadOptions {
  folder?: string;
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  transformation?: object[];
}

export const uploadImage = async (
  file: string | Buffer,
  options: ImageUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const defaultOptions = {
    folder: 'study-helper',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  try {
    // Convert Buffer to base64 data URL if needed
    let uploadData: string;
    if (Buffer.isBuffer(file)) {
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`;
    } else {
      uploadData = file;
    }

    const result = await cloudinary.uploader.upload(uploadData, uploadOptions);
    return result as CloudinaryUploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string => {
  const { width = 400, height = 400, quality = 'auto', format = 'auto' } = options;
  
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', gravity: 'face' },
      { quality: quality === 'auto' ? 'auto' : quality },
      { fetch_format: format === 'auto' ? 'auto' : format }
    ]
  });
};
