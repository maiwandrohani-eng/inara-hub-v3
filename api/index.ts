// Vercel serverless function entry point
// This wraps the Express app for Vercel serverless functions
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy load the compiled Express app
let app: any;

async function getApp() {
  if (!app) {
    try {
      console.log('[Vercel] Initializing Express app from compiled backend...');
      
      // Import the compiled Express app (built TypeScript -> JavaScript)
      // The build process compiles server/src/index.ts to server/dist/index.js
      const { default: expressApp } = await import('../server/dist/index.js');
      app = expressApp;
      
      console.log('[Vercel] Express app initialized successfully');
    } catch (error: any) {
      console.error('[Vercel] Failed to initialize Express app:', error);
      console.error('[Vercel] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }
  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Log request details for debugging
    console.log('[Vercel Handler] Request received:', {
      method: req.method,
      url: req.url,
      path: req.url?.split('?')[0],
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      hasBody: !!req.body,
      bodyType: typeof req.body,
    });

    // Handle OPTIONS preflight requests explicitly
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end();
    }

    const expressApp = await getApp();
    
    // Call the Express app as a handler
    return expressApp(req, res);
  } catch (error: any) {
    console.error('[Vercel Handler] Error occurred:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    
    // Return error response
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        code: error.code,
        name: error.name,
        stack: error.stack,
      }),
    });
  }
}
