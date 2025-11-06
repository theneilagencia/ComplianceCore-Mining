import { Storage } from '@google-cloud/storage';

const GCS_BUCKET = process.env.GCS_BUCKET || 'qivo-mining-uploads';
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'qivo-mining-prod';

// Inicializar cliente GCS
const storage = new Storage({
  projectId: PROJECT_ID,
});

const bucket = storage.bucket(GCS_BUCKET);

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  key?: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  uploadUrl?: string;
  fileUrl?: string;
  key?: string;
  error?: string;
}

/**
 * Gera URL assinada para upload direto do cliente
 */
export async function generateSignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<SignedUrlResult> {
  try {
    const key = `uploads/${Date.now()}-${fileName}`;
    const file = bucket.file(key);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn * 1000,
      contentType,
    });

    const fileUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${key}`;

    return {
      success: true,
      uploadUrl,
      fileUrl,
      key,
    };
  } catch (error) {
    console.error('Error generating signed upload URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload de arquivo via buffer
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const key = `uploads/${Date.now()}-${fileName}`;
    const file = bucket.file(key);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Tornar arquivo público
    await file.makePublic();

    const fileUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${key}`;

    return {
      success: true,
      fileUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deletar arquivo
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const file = bucket.file(key);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Listar arquivos
 */
export async function listFiles(prefix: string = 'uploads/'): Promise<any[]> {
  try {
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => ({
      key: file.name,
      url: `https://storage.googleapis.com/${GCS_BUCKET}/${file.name}`,
      size: file.metadata.size,
      lastModified: file.metadata.updated,
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Obter informações do bucket
 */
export async function getBucketInfo() {
  try {
    const [metadata] = await bucket.getMetadata();
    return {
      bucket: GCS_BUCKET,
      location: metadata.location,
      storageClass: metadata.storageClass,
      created: metadata.timeCreated,
    };
  } catch (error) {
    console.error('Error getting bucket info:', error);
    return {
      bucket: GCS_BUCKET,
      error: 'Failed to get bucket info',
    };
  }
}
