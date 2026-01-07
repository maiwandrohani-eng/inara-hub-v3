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
export async function uploadFilesToR2(
  files: Express.Multer.File[],
  type: string
): Promise<Array<{ url: string; key: string; originalName: string }>> {
  try {
    if (!files || files.length === 0) {
      return [];
    }
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadFileToR2(file, type);
        return {
          ...result,
          originalName: file.originalname,
        };
      } catch (error: any) {
        console.error(`Failed to upload ${file.originalname}:`, error);
        throw error; // Re-throw to be caught by Promise.all
      }
    });
    return Promise.all(uploadPromises);
  } catch (error: any) {
    console.error('Error uploading files to R2:', error);
    throw new Error(`Failed to upload files to R2: ${error.message}`);
  }
}

