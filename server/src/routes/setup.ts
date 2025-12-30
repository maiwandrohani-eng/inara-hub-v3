// One-time database setup endpoint
// This should be called once after deployment to initialize the database
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup endpoint - should be protected by a secret token
router.post('/setup', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple secret check (you should use a strong secret)
    const setupSecret = process.env.SETUP_SECRET || 'inara-setup-2024';
    if (secret !== setupSecret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔧 Starting database setup...');

    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    try {
      await execAsync('npx prisma generate', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
      });
      console.log('✅ Prisma Client generated');
    } catch (error: any) {
      console.error('⚠️ Prisma generate warning:', error.message);
    }

    // Step 2: Push schema to database
    console.log('📊 Pushing database schema...');
    try {
      await execAsync('npx prisma db push --accept-data-loss', {
        cwd: path.join(__dirname, '../..'),
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
      });
      console.log('✅ Database schema pushed');
    } catch (error: any) {
      console.error('❌ Database push failed:', error.message);
      return res.status(500).json({ 
        message: 'Database setup failed',
        error: error.message 
      });
    }

    // Step 3: Seed database
    console.log('🌱 Seeding database...');
    try {
      // Import and run seed
      const seedModule = await import('../seed.js');
      if (seedModule.seedDatabase) {
        await seedModule.seedDatabase();
      } else {
        // Fallback: run seed script directly
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync('npx tsx src/seed.ts', {
          cwd: path.join(__dirname, '../..'),
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
        });
      }
      console.log('✅ Database seeded');
    } catch (error: any) {
      console.error('❌ Seeding failed:', error.message);
      return res.status(500).json({ 
        message: 'Database seeding failed',
        error: error.message 
      });
    }

    res.json({ 
      message: 'Database setup completed successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Setup error:', error);
    res.status(500).json({ 
      message: 'Setup failed',
      error: error.message 
    });
  }
});

// Health check that also checks database connection
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if users table exists and has data
    const userCount = await prisma.user.count();
    
    res.json({ 
      status: 'ok',
      database: 'connected',
      users: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

