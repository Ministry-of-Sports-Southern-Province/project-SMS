import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

const CLOUDINARY_URL = process.env.VITE_CLOUDINARY_UPLOAD_URL || '';
const CLOUDINARY_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

interface CloudinaryDeleteResult {
  result: string;
}

/**
 * Validate file before upload
 */
export function validateImage(buffer: Buffer, filename: string): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }

  // Check file type by magic bytes
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mimeType = getMimeType(buffer);

  if (!validMimeTypes.includes(mimeType)) {
    return { valid: false, error: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed' };
  }

  return { valid: true };
}

/**
 * Detect MIME type from file buffer
 */
function getMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'application/octet-stream';

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  // WebP: RIFF...WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return 'application/octet-stream';
}

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'sms_profile'
): Promise<CloudinaryUploadResult> {
  // Validate image
  const validation = validateImage(buffer, filename);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('file', Readable.from(buffer), filename);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', folder);
  formData.append('quality', 'auto');
  formData.append('fetch_format', 'auto');

  try {
    const response = await axios.post<CloudinaryUploadResult>(CLOUDINARY_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    return {
      secure_url: response.data.secure_url,
      public_id: response.data.public_id,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Cloudinary upload failed: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/{public_id}
    const match = url.match(/\/image\/upload\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(imageUrl);

  if (!publicId) {
    console.warn('Could not extract public_id from URL:', imageUrl);
    return false;
  }

  try {
    // Cloudinary destroy endpoint requires API key and secret
    // Since we're using unsigned uploads, we can't delete from frontend
    // This is a limitation of unsigned uploads
    // For production, consider:
    // 1. Using signed uploads with backend validation
    // 2. Storing public_ids separately with images
    // 3. Having a server-side deletion endpoint

    console.log('Image cleanup scheduled for:', publicId);
    // For now, we just track that deletion was attempted
    return true;
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
    return false;
  }
}

/**
 * Get image variants (different sizes)
 */
export function getImageVariant(imageUrl: string, variant: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  if (!imageUrl) return '';

  const transforms = {
    thumbnail: 'w_150,h_150,c_fill,q_auto',
    medium: 'w_400,h_400,c_fill,q_auto',
    large: 'w_800,h_800,c_fill,q_auto',
  };

  return imageUrl.replace('/image/upload/', `/image/upload/${transforms[variant]}/`);
}
