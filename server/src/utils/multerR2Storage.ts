// Multer storage that uploads directly to R2 instead of filesystem
import multer from 'multer';
import { uploadToR2, generateFileKey } from './r2Storage.js';

// Memory storage - files are kept in memory and then uploaded to R2
const memoryStorage = multer.memoryStorage();

// Create multer instance with memory storage
export const multerR2 = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Helper function to upload a file buffer to R2
export async function uploadFileToR2(
  file: Express.Multer.File,
  type: string
): Promise<{ url: string; key: string }> {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file: missing buffer');
    }
    const key = generateFileKey(type, file.originalname);
    const result = await uploadToR2(file.buffer, key, file.mimetype || 'application/octet-stream');
    return { url: result.url, key: result.key };
  } catch (error: any) {
    console.error(`Error uploading file ${file?.originalname} to R2:`, error);
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
}

// Helper function to upload multiple files to R2
// Returns results with success/error status for each file (doesn't fail fast)
export async function uploadFilesToR2(
  files: Express.Multer.File[],
  type: string
): Promise<Array<{ url?: string; key?: string; originalName: string; success: boolean; error?: string }>> {
  try {
    if (!files || files.length === 0) {
      return [];
    }
    
    // Use Promise.allSettled instead of Promise.all to handle individual failures gracefully
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadFileToR2(file, type);
        return {
          success: true,
          url: result.url,
          key: result.key,
          originalName: file.originalname,
        };
      } catch (error: any) {
        console.error(`Failed to upload ${file.originalname} to R2:`, error);
        return {
          success: false,
          originalName: file.originalname,
          error: error.message || 'Upload failed',
        };
      }
    });
    
    const results = await Promise.allSettled(uploadPromises);
    
    // Extract values from settled promises
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // This shouldn't happen since we catch errors in the promise, but handle it just in case
        return {
          success: false,
          originalName: 'unknown',
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  } catch (error: any) {
    console.error('Error in uploadFilesToR2:', error);
    // Return error results for all files
    return files.map((file) => ({
      success: false,
      originalName: file.originalname,
      error: error.message || 'Failed to upload files to R2',
    }));
  }
}

