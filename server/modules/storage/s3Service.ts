/**
 * S3 Storage Service - QIVO Mining
 * 
 * Features:
 * - Generate presigned URLs for uploads
 * - Tenant-based folder structure: tenants/{TENANT_ID}/
 * - Auto-detect AWS credentials or use mock
 * - Support for multiple file types
 */

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const IS_MOCK = !S3_BUCKET || !AWS_ACCESS_KEY || !AWS_SECRET_KEY;

// Mock S3 if credentials not available
let s3Client: any;

if (!IS_MOCK) {
  try {
    const AWS = require('aws-sdk');
    s3Client = new AWS.S3({
      region: S3_REGION,
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
    });
    console.log('✅ S3 initialized with real credentials');
  } catch (error) {
    console.warn('⚠️ AWS SDK not installed, using mock');
    s3Client = null;
  }
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
    const uploadUrl = await s3Client.getSignedUrlPromise('putObject', {
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
      Expires: expiresIn,
    });

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
    const downloadUrl = await s3Client.getSignedUrlPromise('getObject', {
      Bucket: S3_BUCKET,
      Key: key,
      Expires: expiresIn,
    });

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
    await s3Client.putObject({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      Metadata: metadata,
    }).promise();

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
    await s3Client.deleteObject({
      Bucket: S3_BUCKET,
      Key: key,
    }).promise();

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
    const response = await s3Client.listObjectsV2({
      Bucket: S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }).promise();

    const files = (response.Contents || []).map((item: any) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
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

