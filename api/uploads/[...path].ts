// Vercel serverless function to proxy uploads from Cloudflare R2
import { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // If R2_PUBLIC_URL is set, use presigned URL to avoid Vercel rewrite issues
    // Presigned URLs point directly to R2, bypassing Vercel
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
        // If import fails, fetch directly from R2
        console.log('Falling back to direct R2 fetch');
        const R2_ENDPOINT = process.env.R2_ENDPOINT;
        const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint,
          credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
          },
        });

        const command = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filePath as string,
        });

        const response = await s3Client.send(command);
        
        // Set appropriate headers
        const contentType = response.ContentType || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', response.ContentLength || 0);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Stream the file
        if (response.Body) {
          // @ts-ignore - Body is a stream
          const stream = response.Body as any;
          return stream.pipe(res);
        }
        
        return res.status(500).json({ error: 'No file body' });
      }
    }
    
    // Generate presigned URL and redirect to it
    // Presigned URLs point directly to R2, bypassing Vercel rewrites
    const presignedUrl = await getPresignedUrl(filePath as string, 3600); // 1 hour expiry
    return res.redirect(302, presignedUrl);
  } catch (error: any) {
    console.error('Error fetching from R2:', error);
    return res.status(500).json({ error: error.message });
  }
}

