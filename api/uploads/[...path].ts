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

    // Otherwise, fetch from R2 and proxy
    const s3Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `${s3Endpoint}/${R2_BUCKET_NAME}/${filePath}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `AWS ${R2_ACCESS_KEY_ID}:${await generateSignature(req.method || 'GET', filePath)}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'File not found' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('Error fetching from R2:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Simplified signature generation (for basic use)
async function generateSignature(method: string, path: string): Promise<string> {
  // In production, use proper AWS signature v4
  // For now, return a placeholder - you may want to use a library like @aws-sdk/s3-request-presigner
  return '';
}

