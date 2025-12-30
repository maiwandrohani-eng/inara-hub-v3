// Vercel serverless function entry point
// This proxies to the Express app in server/src/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/index.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
