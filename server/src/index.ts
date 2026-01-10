import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import workRoutes from './routes/work.js';
import trainingRoutes from './routes/training.js';
import orientationRoutes from './routes/orientation.js';
import policyRoutes from './routes/policies.js';
import libraryRoutes from './routes/library.js';
import marketRoutes from './routes/market.js';
import templateRoutes from './routes/templates.js';
import botRoutes from './routes/bot.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import configRoutes from './routes/config.js';
import notificationRoutes from './routes/notifications.js';
import bookmarkRoutes from './routes/bookmarks.js';
import commentRoutes from './routes/comments.js';
import searchRoutes from './routes/search.js';
import preferenceRoutes from './routes/preferences.js';
import calendarRoutes from './routes/calendar.js';
import achievementRoutes from './routes/achievements.js';
import activityRoutes from './routes/activity.js';
import newsRoutes from './routes/news.js';
import suggestionRoutes from './routes/suggestions.js';
import surveyRoutes from './routes/surveys.js';
import academyRoutes from './routes/academy.js';
import setupRoutes from './routes/setup.js';

// Load environment variables (Vercel provides these automatically)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  dotenv.config();
}

const app = express();
const prisma = new PrismaClient();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  const errorMsg = `❌ Missing required environment variables: ${missingEnvVars.join(', ')}`;
  console.error(errorMsg);
  console.error('Please set these variables in your .env file or environment.');
  
  // In Vercel, log but don't exit - let requests reveal the error
  if (process.env.VERCEL) {
    console.error('⚠️ Running on Vercel without required env vars - requests will fail');
  } else {
    process.exit(1);
  }
}

// Validate R2 configuration (required for file uploads)
const r2Vars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
const missingR2Vars = r2Vars.filter(varName => !process.env[varName]);
if (missingR2Vars.length > 0) {
  console.warn('⚠️ Missing R2 storage variables:', missingR2Vars.join(', '));
  console.warn('File uploads will be disabled. To enable file uploads, set all R2 variables.');
}

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '';
const corsOptions = {
  origin: corsOrigin
    ? corsOrigin.split(',').map(origin => origin.trim())
    : true, // Allow all origins (Vercel handles security at platform level)
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
};

if (process.env.NODE_ENV === 'production' && !corsOrigin) {
  console.warn('⚠️ CORS_ORIGIN not set in production. Allowing all origins (Vercel handles security).');
  console.warn('For better security, set CORS_ORIGIN to: https://hub.inara.ngo,https://inara-hub-v3.vercel.app');
}

// Middleware
app.use(cors(corsOptions));
// Increase body size limits for large text content (up to 100,000 words)
app.use(express.json({ limit: '10mb' })); // 10MB for JSON (text paste)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // 10MB for URL-encoded

// Serve static files from R2 (via proxy) or local uploads (development)
// In production on Vercel, files are served from R2 via /api/uploads route
if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'public', 'uploads')));
}

// Handle OPTIONS preflight requests explicitly (for file uploads)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// IMPORTANT: File upload routes MUST come BEFORE the main route handlers
// so they don't get caught by the route mounting below
// Uploads route - proxy to R2 (handles /api/uploads/*)
app.get('/api/uploads/*', async (req, res) => {
  try {
    // Extract the path after /api/uploads/
    let filePath = req.path;
    if (filePath.startsWith('/api/uploads/')) {
      filePath = filePath.replace('/api/uploads/', '');
    }
    
    if (!filePath || filePath === '/api/uploads' || filePath === '/api/uploads/') {
      return res.status(400).json({ error: 'File path required' });
    }

    console.log('[Uploads Route] Request received:', {
      originalPath: req.path,
      extractedPath: filePath,
      method: req.method,
    });

    // Get R2 configuration
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error('[Uploads Route] R2 configuration missing');
      return res.status(500).json({ error: 'R2 configuration missing' });
    }

    // Import getPresignedUrl
    const { getPresignedUrl } = await import('./utils/r2Storage.js');
    
    console.log('[Uploads Route] Generating presigned URL for:', filePath);
    // Generate presigned URL and redirect
    const presignedUrl = await getPresignedUrl(filePath, 3600); // 1 hour expiry
    console.log('[Uploads Route] Presigned URL generated, redirecting...');
    
    return res.redirect(302, presignedUrl);
  } catch (error: any) {
    console.error('[Uploads Route] Error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
    });
    return res.status(500).json({ error: error.message || 'Failed to get file' });
  }
});

// GENERIC FILE PROXY - Handles ALL file requests to R2
// This must come BEFORE route handlers to intercept file requests
// Uses /api/uploads/* for ALL file types (universal approach)
app.get('/api/uploads/*', genericFileProxy);

async function genericFileProxy(req: express.Request, res: express.Response) {
  try {
    // Extract the path after /api/uploads/
    let filePath = req.path;
    if (filePath.startsWith('/api/uploads/')) {
      filePath = filePath.replace('/api/uploads/', '');
    } else if (filePath.startsWith('/api/')) {
      filePath = filePath.replace('/api/', '');
    }
    
    // Clean up any leading 'uploads/' prefix if present
    if (filePath.startsWith('uploads/')) {
      filePath = filePath.replace('uploads/', '');
    }
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    console.log('[Generic File Proxy] Request received:', {
      originalPath: req.path,
      extractedPath: filePath,
      method: req.method,
    });

    // Get R2 configuration
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error('[Generic File Proxy] R2 configuration missing');
      return res.status(500).json({ error: 'R2 configuration missing' });
    }

    // Import getPresignedUrl
    const { getPresignedUrl } = await import('./utils/r2Storage.js');
    
    // Ensure the key has inara-data prefix (files stored at inara-data/{type}/... in R2)
    let presignKey = filePath;
    if (!presignKey.startsWith('inara-data/')) {
      presignKey = `inara-data/${presignKey}`;
    }
    
    console.log('[Generic File Proxy] Generating presigned URL for:', presignKey);
    // Generate presigned URL and redirect
    const presignedUrl = await getPresignedUrl(presignKey, 3600); // 1 hour expiry
    console.log('[Generic File Proxy] Presigned URL generated, redirecting...');
    
    // Add CORS headers before redirecting to R2
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.redirect(302, presignedUrl);
  } catch (error: any) {
    console.error('[Generic File Proxy] Error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
    });
    return res.status(500).json({ error: error.message || 'Failed to get file' });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '0b06be8' });
});

// R2 connectivity test (public endpoint for debugging)
app.get('/api/test-r2', async (req, res) => {
  try {
    const { uploadToR2 } = await import('./utils/r2Storage.js');
    
    // Test upload with a small test file
    const testContent = Buffer.from('R2 connectivity test');
    const testKey = `test/${Date.now()}-test.txt`;
    
    try {
      const result = await uploadToR2(testContent, testKey, 'text/plain');
      
      // Try to delete the test file
      try {
        const { deleteFromR2 } = await import('./utils/r2Storage.js');
        await deleteFromR2(testKey);
      } catch (deleteError: any) {
        console.warn('Failed to delete test file:', deleteError.message);
      }
      
      res.json({
        status: 'success',
        message: 'R2 connection successful',
        testKey,
        uploadedUrl: result.url,
        config: {
          hasAccountId: !!process.env.R2_ACCOUNT_ID,
          hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
          hasBucket: !!process.env.R2_BUCKET_NAME,
          bucketName: process.env.R2_BUCKET_NAME,
          endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : 'not set'),
        },
      });
    } catch (uploadError: any) {
      res.status(500).json({
        status: 'error',
        message: 'R2 upload failed',
        error: uploadError.message,
        errorCode: uploadError.Code || uploadError.code,
        config: {
          hasAccountId: !!process.env.R2_ACCOUNT_ID,
          hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
          hasBucket: !!process.env.R2_BUCKET_NAME,
          bucketName: process.env.R2_BUCKET_NAME,
          endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : 'not set'),
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test R2',
      error: error.message,
    });
  }
});

// Test Prisma in Express context
app.get('/api/test-prisma-express', async (req, res) => {
  try {
    let prismaAvailable = false;
    let dbConnected = false;
    let errorMessage = null;
    let userCount = 0;
    let dbErrorCode = null;

    try {
      // Try to use Prisma from the Express app context
      const { PrismaClient } = await import('@prisma/client');
      const testPrisma = new PrismaClient();
      prismaAvailable = true;
      
      // Try to connect to database
      await testPrisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      
      // Try to query users
      userCount = await testPrisma.user.count();
      
      await testPrisma.$disconnect();
    } catch (error: any) {
      errorMessage = error.message;
      dbErrorCode = error.code;
      console.error('Prisma test error:', error);
    }

    res.json({
      status: 'ok',
      prismaAvailable,
      dbConnected,
      userCount,
      error: errorMessage,
      errorCode: dbErrorCode,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    });
  }
});

// Login diagnostic endpoint (public for debugging)
app.get('/api/auth/diagnostic', async (req, res) => {
  try {
    const { email } = req.query;
    
    const diagnostics: any = {
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'not set',
      },
      database: {
        connected: false,
        error: null,
        errorCode: null,
      },
      user: null,
    };

    // Test database connection
    try {
      const { PrismaClient } = await import('@prisma/client');
      const testPrisma = new PrismaClient();
      
      await testPrisma.$queryRaw`SELECT 1`;
      diagnostics.database.connected = true;
      
      // If email provided, check user
      if (email && typeof email === 'string') {
        try {
          const user = await testPrisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              isActive: true,
              role: true,
              firstName: true,
              lastName: true,
            },
          });
          diagnostics.user = user;
        } catch (userError: any) {
          diagnostics.user = { error: userError.message };
        }
      }
      
      await testPrisma.$disconnect();
    } catch (dbError: any) {
      diagnostics.database.error = dbError.message;
      diagnostics.database.errorCode = dbError.code;
    }

    res.json(diagnostics);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/work', workRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/orientation', orientationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/setup', setupRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Vercel serverless function handler
export default app;

// For local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 INARA Platform Server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
