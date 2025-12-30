// Vercel serverless function entry point
// This wraps the Express app for Vercel serverless functions
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the Express app
// Note: We need to import the built version or use a dynamic import
let app: any;

async function getApp() {
  if (!app) {
    // Dynamic import to handle ES modules
    const module = await import('../server/src/index.js');
    app = module.default;
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  return expressApp(req, res);
}
