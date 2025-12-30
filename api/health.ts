// Simple health check endpoint to test serverless function
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test Prisma Client availability
    let prismaAvailable = false;
    let dbConnected = false;
    let errorMessage = null;

    try {
      // Import Prisma Client from server node_modules (where it's generated)
      let PrismaClient;
      try {
        // Try server node_modules first (where Prisma generates it)
        const serverModule = await import('../server/node_modules/@prisma/client');
        PrismaClient = serverModule.PrismaClient;
      } catch (e) {
        // Fallback: try root node_modules
        const module = await import('@prisma/client');
        PrismaClient = module.PrismaClient;
      }
      
      const prisma = new PrismaClient();
      prismaAvailable = true;
      
      // Try to connect to database
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      
      await prisma.$disconnect();
    } catch (error: any) {
      errorMessage = error.message;
      console.error('Health check error:', error);
      console.error('Error stack:', error.stack);
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      prismaAvailable,
      dbConnected,
      error: errorMessage,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

