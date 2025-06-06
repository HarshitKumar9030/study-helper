import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface Avatar {
  url?: string;
  publicId?: string;
}


export function getAvatarUrl(avatar: Avatar | null | undefined, fallbackUrl?: string): string {
  if (!avatar) return fallbackUrl || '';
  
  if (avatar.publicId) {
    try {
      return getOptimizedImageUrl(avatar.publicId, 'w_200,h_200,c_fill,f_auto,q_auto,g_face');
    } catch (error) {
      console.warn('Failed to generate optimized URL, falling back to direct URL:', error);
    }
  }
  
 return avatar.url || fallbackUrl || '';
}


export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


export function notifyAvatarUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('avatarUpdated'));
  }
}
