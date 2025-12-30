// Cloudflare R2 Storage Utility
// Replaces local file storage with R2

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for R2 (R2 is S3-compatible)
const getR2Endpoint = () => {
  if (process.env.R2_ENDPOINT) {
    return process.env.R2_ENDPOINT;
  }
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  throw new Error('R2_ENDPOINT or R2_ACCOUNT_ID must be set');
};

const r2Client = new S3Client({
  region: 'auto',
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

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
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);

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
    console.error('Error uploading to R2:', error);
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
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
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
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
  return `${type}/${timestamp}-${random}.${ext}`;
}

