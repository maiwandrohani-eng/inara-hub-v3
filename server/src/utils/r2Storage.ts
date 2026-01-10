// Cloudflare R2 Storage Utility
// Replaces local file storage with R2

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for R2 (R2 is S3-compatible)
const getR2Endpoint = () => {
  if (process.env.R2_ENDPOINT) {
    // Ensure endpoint doesn't have trailing slash
    return process.env.R2_ENDPOINT.replace(/\/$/, '');
  }
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  throw new Error('R2_ENDPOINT or R2_ACCOUNT_ID must be set');
};

// Validate R2 configuration
const validateR2Config = () => {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);
  }
};

// Initialize R2 client with validation
let r2Client: S3Client | null = null;

export const getR2Client = (): S3Client => {
  if (!r2Client) {
    validateR2Config();
    const endpoint = getR2Endpoint();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    
    console.log('🔧 Initializing R2 client:', {
      endpoint,
      bucket: process.env.R2_BUCKET_NAME,
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
      accessKeyPrefix: accessKeyId?.substring(0, 8) + '...',
    });

    r2Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: false, // R2 uses virtual-hosted-style URLs
      // AWS SDK v3 uses SigV4 by default, which is required by R2
    });
  }
  return r2Client;
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'inara-uploads';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: public R2 URL

export interface UploadResult {
  url: string;
  key: string;
  publicUrl?: string;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME!;
    
    console.log('📤 Uploading to R2:', {
      bucket: bucketName,
      key,
      size: file.length,
      contentType,
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await client.send(command);

    console.log('✅ Successfully uploaded to R2:', key);

    // Generate URLs
    const url = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : `/uploads/${key}`;

    return {
      url,
      key,
      publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : undefined,
    };
  } catch (error: any) {
    console.error('❌ Error uploading to R2:', {
      message: error.message,
      code: error.Code || error.code,
      name: error.name,
      requestId: error.$metadata?.requestId,
      bucket: process.env.R2_BUCKET_NAME,
      endpoint: getR2Endpoint(),
      hasCredentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    });
    
    // Provide more helpful error messages
    if (error.name === 'AccessDenied' || error.Code === 'AccessDenied' || error.message?.includes('Access Denied')) {
      throw new Error(`R2 Access Denied: Check that your R2 credentials have write permissions for bucket "${process.env.R2_BUCKET_NAME}". Verify R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are correct.`);
    }
    
    throw new Error(`Failed to upload to R2: ${error.message || error.Code || 'Unknown error'}`);
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME!;
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error: any) {
    console.error('Error deleting from R2:', error);
    throw new Error(`Failed to delete from R2: ${error.message}`);
  }
}

/**
 * Get a presigned URL for temporary access
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    // Create a separate client for presigned URLs with path-style addressing
    // This ensures the signature matches correctly
    validateR2Config();
    const endpoint = getR2Endpoint();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    const bucketName = process.env.R2_BUCKET_NAME!;
    
    // Use path-style for presigned URLs to avoid signature issues
    const presignClient = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true, // Use path-style for presigned URLs
    });
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(presignClient, command, { expiresIn });
    
    console.log('✅ Generated presigned URL for:', key);
    return presignedUrl;
  } catch (error: any) {
    console.error('❌ Error generating presigned URL:', {
      message: error.message,
      key,
      endpoint: getR2Endpoint(),
      bucket: process.env.R2_BUCKET_NAME,
      hasCredentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    });
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Generate a file key (path) for R2
 */
export function generateFileKey(type: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = filename.split('.').pop() || '';
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  // All files stored under /inara-data/ prefix in R2 bucket
  return `inara-data/${type}/${timestamp}-${random}.${ext}`;
}

