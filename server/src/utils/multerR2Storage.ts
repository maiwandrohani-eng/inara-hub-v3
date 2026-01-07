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
  const key = generateFileKey(type, file.originalname);
  const result = await uploadToR2(file.buffer, key, file.mimetype || 'application/octet-stream');
  return { url: result.url, key: result.key };
}

// Helper function to upload multiple files to R2
export async function uploadFilesToR2(
  files: Express.Multer.File[],
  type: string
): Promise<Array<{ url: string; key: string; originalName: string }>> {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadFileToR2(file, type);
    return {
      ...result,
      originalName: file.originalname,
    };
  });
  return Promise.all(uploadPromises);
}

