// Vercel serverless function entry point
// This wraps the Express app for Vercel serverless functions
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the Express app
// Note: We need to import the built version or use a dynamic import
let app: any;

async function getApp() {
  if (!app) {
    try {
      // Ensure Prisma Client is available
      // In Vercel, Prisma Client should be generated during build
      console.log('Initializing Express app...');
      
      // Dynamic import to handle ES modules
      const module = await import('../server/src/index.js');
      app = module.default;
      
      console.log('Express app initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Express app:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error: any) {
    console.error('Vercel handler error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    
    // Return detailed error in response for debugging
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
