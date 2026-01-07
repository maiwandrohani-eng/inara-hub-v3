// Vercel serverless function to proxy uploads from Cloudflare R2
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const filePath = Array.isArray(path) ? path.join('/') : path;

  // Get file from Cloudflare R2
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    return res.status(500).json({ error: 'R2 configuration missing' });
  }

  try {
    // If R2_PUBLIC_URL is set, redirect to public URL
    if (R2_PUBLIC_URL) {
      const publicUrl = `${R2_PUBLIC_URL}/${filePath}`;
      return res.redirect(302, publicUrl);
    }

    // Otherwise, generate a presigned URL and redirect to it
    // This provides temporary access without exposing credentials
    // Use dynamic import with type assertion to avoid TypeScript path resolution issues
    let getPresignedUrl: any;
    try {
      // Try to import from compiled server code
      // @ts-ignore - TypeScript can't resolve this path at build time, but it works at runtime
      const r2Module = await import('../server/dist/utils/r2Storage.js');
      getPresignedUrl = r2Module.getPresignedUrl;
    } catch {
      try {
        // Fallback to source code (for development)
        // @ts-ignore - TypeScript can't resolve this path at build time, but it works at runtime
        const r2Module = await import('../server/src/utils/r2Storage.js');
        getPresignedUrl = r2Module.getPresignedUrl;
      } catch (importError: any) {
        throw new Error(`Failed to import r2Storage: ${importError.message}`);
      }
    }
    const presignedUrl = await getPresignedUrl(filePath as string, 3600); // 1 hour expiry
    return res.redirect(302, presignedUrl);
  } catch (error: any) {
    console.error('Error fetching from R2:', error);
    return res.status(500).json({ error: error.message });
  }
}

