/**
 * S3 Storage Service - QIVO Mining
 * 
 * Features:
 * - Generate presigned URLs for uploads (AWS SDK v3)
 * - Tenant-based folder structure: tenants/{TENANT_ID}/
 * - Auto-detect AWS credentials
 * - Support for multiple file types
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_BUCKET = process.env.S3_BUCKET || process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const IS_MOCK = !S3_BUCKET || !AWS_ACCESS_KEY || !AWS_SECRET_KEY;

// S3 Client (AWS SDK v3)
let s3Client: S3Client | null = null;

if (!IS_MOCK) {
  try {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY!,
        secretAccessKey: AWS_SECRET_KEY!,
      },
    });
    console.log('✅ S3 Service: Initialized with AWS SDK v3');
  } catch (error) {
    console.error('❌ S3 Service: Failed to initialize:', error);
    s3Client = null;
  }
} else {
  console.log('⚠️  S3 Service: Running in mock mode (credentials not configured)');
}

/**
 * Generate presigned URL for upload
 */
export async function generatePresignedUploadURL(params: {
  tenantId: string;
  fileName: string;
  fileType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{
  uploadUrl: string;
  fileUrl: string;
  key: string;
  mock: boolean;
}> {
  const { tenantId, fileName, fileType, folder = 'uploads', expiresIn = 3600 } = params;
  
  // Generate S3 key with tenant isolation
  const key = `tenants/${tenantId}/${folder}/${Date.now()}_${fileName}`;
  
  if (IS_MOCK || !s3Client) {
    console.log('🔧 Mock: S3 presigned URL');
    return {
      uploadUrl: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK`,
      fileUrl: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${key}`,
      key,
      mock: true,
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
      mock: false,
    };
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for download
 */
export async function generatePresignedDownloadURL(params: {
  key: string;
  expiresIn?: number;
}): Promise<{
  downloadUrl: string;
  mock: boolean;
}> {
  const { key, expiresIn = 3600 } = params;

  if (IS_MOCK || !s3Client) {
    console.log('🔧 Mock: S3 presigned download URL');
    return {
      downloadUrl: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK`,
      mock: true,
    };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      downloadUrl,
      mock: false,
    };
  } catch (error) {
    console.error('S3 presigned download URL error:', error);
    throw error;
  }
}

/**
 * Upload file directly to S3
 */
export async function uploadFile(params: {
  tenantId: string;
  fileName: string;
  fileBuffer: Buffer;
  fileType: string;
  folder?: string;
  metadata?: Record<string, string>;
}): Promise<{
  fileUrl: string;
  key: string;
  mock: boolean;
}> {
  const { tenantId, fileName, fileBuffer, fileType, folder = 'uploads', metadata = {} } = params;
  
  // Generate S3 key with tenant isolation
  const key = `tenants/${tenantId}/${folder}/${Date.now()}_${fileName}`;

  if (IS_MOCK || !s3Client) {
    console.log('🔧 Mock: S3 upload');
    return {
      fileUrl: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${key}`,
      key,
      mock: true,
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      Metadata: metadata,
    });

    await s3Client.send(command);

    const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

    return {
      fileUrl,
      key,
      mock: false,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<{
  success: boolean;
  mock: boolean;
}> {
  if (IS_MOCK || !s3Client) {
    console.log('🔧 Mock: S3 delete');
    return {
      success: true,
      mock: true,
    };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
      mock: false,
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}

/**
 * List files in tenant folder
 */
export async function listFiles(params: {
  tenantId: string;
  folder?: string;
  maxKeys?: number;
}): Promise<{
  files: Array<{
    key: string;
    size: number;
    lastModified: Date;
    url: string;
  }>;
  mock: boolean;
}> {
  const { tenantId, folder = 'uploads', maxKeys = 100 } = params;
  
  const prefix = `tenants/${tenantId}/${folder}/`;

  if (IS_MOCK || !s3Client) {
    console.log('🔧 Mock: S3 list');
    return {
      files: [
        {
          key: `${prefix}example1.pdf`,
          size: 1024000,
          lastModified: new Date(),
          url: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${prefix}example1.pdf`,
        },
        {
          key: `${prefix}example2.pdf`,
          size: 2048000,
          lastModified: new Date(),
          url: `https://${S3_BUCKET || 'qivo-mining'}.s3.${S3_REGION}.amazonaws.com/${prefix}example2.pdf`,
        },
      ],
      mock: true,
    };
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((item) => ({
      key: item.Key!,
      size: item.Size!,
      lastModified: item.LastModified!,
      url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${item.Key}`,
    }));

    return {
      files,
      mock: false,
    };
  } catch (error) {
    console.error('S3 list error:', error);
    throw error;
  }
}

/**
 * Get S3 service status
 */
export function getS3Status() {
  return {
    enabled: !IS_MOCK && !!s3Client,
    mock: IS_MOCK,
    bucket: S3_BUCKET || 'qivo-mining',
    region: S3_REGION,
    hasCredentials: !!AWS_ACCESS_KEY && !!AWS_SECRET_KEY,
  };
}
