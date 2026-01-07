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
if (!process.env.VERCEL) {
  dotenv.config();
}

const app = express();
const prisma = new PrismaClient();

// Validate required environment variables (only exit in non-Vercel environments)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  // Don't exit in Vercel - let the request fail gracefully
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

// Warn about missing R2 configuration (not fatal, but important)
if (process.env.VERCEL) {
  const r2Vars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missingR2Vars = r2Vars.filter(varName => !process.env[varName]);
  if (missingR2Vars.length > 0) {
    console.warn('⚠️ Missing R2 configuration variables:', missingR2Vars.join(', '));
    console.warn('File uploads and serving may not work correctly without R2 configuration.');
  }
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production' 
      ? false // Deny all in production if not configured
      : true, // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200
};

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// R2 connectivity test (admin only)
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
      console.error('Prisma test error:', error);
    }

    res.json({
      status: 'ok',
      prismaAvailable,
      dbConnected,
      userCount,
      error: errorMessage,
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
