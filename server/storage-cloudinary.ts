/**
 * Cloudinary Storage Integration - QIVO Mining
 * 
 * Integração com Cloudinary para armazenamento gratuito de arquivos
 * - 25 GB de storage gratuito
 * - URLs públicas automáticas
 * - CDN global
 */

import { v2 as cloudinary } from 'cloudinary';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

let isConfigured = false;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

export function initCloudinary() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('⚠️  Cloudinary not configured (missing credentials)');
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
  console.log('✅ Cloudinary configured:', CLOUDINARY_CLOUD_NAME);
  return true;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getResourceType(contentType: string): 'image' | 'video' | 'raw' | 'auto' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'raw'; // PDFs, documents, etc.
}

function normalizeKey(relKey: string): string {
  // Remove leading slashes and normalize path
  return relKey.replace(/^\/+/, '').replace(/\\/g, '/');
}

// ============================================================================
// UPLOAD
// ============================================================================

export async function cloudinaryUpload(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string; publicId: string }> {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured');
  }

  const key = normalizeKey(relKey);
  const resourceType = getResourceType(contentType);
  
  // Convert data to base64 for upload
  const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  const base64Data = `data:${contentType};base64,${buffer.toString('base64')}`;

  // Extract folder and filename from key
  const parts = key.split('/');
  const filename = parts.pop() || 'file';
  const folder = parts.join('/') || 'qivo-mining';

  // Remove extension from filename for public_id
  const publicIdName = filename.replace(/\.[^/.]+$/, '');
  const publicId = folder ? `${folder}/${publicIdName}` : publicIdName;

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      public_id: publicId,
      resource_type: resourceType,
      folder: folder || undefined,
      overwrite: true,
      invalidate: true,
    });

    console.log('✅ Uploaded to Cloudinary:', result.secure_url);

    return {
      key,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
}

// ============================================================================
// DOWNLOAD
// ============================================================================

export async function cloudinaryGetUrl(
  publicId: string
): Promise<string> {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured');
  }

  // Generate secure URL
  const url = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'raw',
  });

  return url;
}

// ============================================================================
// DELETE
// ============================================================================

export async function cloudinaryDelete(
  publicId: string
): Promise<boolean> {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured');
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      invalidate: true,
    });

    console.log('✅ Deleted from Cloudinary:', publicId);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    return false;
  }
}

// ============================================================================
// STATUS
// ============================================================================

export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

export function getCloudinaryStatus() {
  return {
    configured: isConfigured,
    cloudName: CLOUDINARY_CLOUD_NAME || 'not set',
    hasApiKey: !!CLOUDINARY_API_KEY,
    hasApiSecret: !!CLOUDINARY_API_SECRET,
  };
}

