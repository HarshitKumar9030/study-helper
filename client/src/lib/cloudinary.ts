export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}

export const uploadToCloudinaryClient = async (
  file: File,
  folder: string = 'study-helper/avatars'
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'study_helper_uploads'); // You'll need to create this preset in Cloudinary
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  return response.json();
};

export const getOptimizedImageUrl = (
  publicIdOrUrl: string,
  transformations: string = 'w_400,h_400,c_fill,f_auto,q_auto'
): string => {
  if (!publicIdOrUrl) return '';
  
  // If it's already a full Cloudinary URL, we need to insert transformations
  if (publicIdOrUrl.includes('res.cloudinary.com')) {
    // Check if it already has transformations
    const hasTransformations = publicIdOrUrl.includes('w_') || publicIdOrUrl.includes('h_') || publicIdOrUrl.includes('c_');
    
    if (hasTransformations) {
      // Replace existing transformations with new ones
      return publicIdOrUrl.replace(/\/[^/]*w_[^/]*\//, `/${transformations}/`);
    } else {
      // Insert transformations into the URL
      return publicIdOrUrl.replace('/upload/', `/upload/${transformations}/`);
    }
  }
  
  // If it's just a public ID, build the URL normally
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicIdOrUrl}`;
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete image from Cloudinary');
  }
};