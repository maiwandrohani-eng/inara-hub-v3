// Test endpoint to check Prisma Client generation
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Check 1: Try to find Prisma Client in server/node_modules
    try {
      const serverPrismaPath = path.join(process.cwd(), 'server', 'node_modules', '@prisma', 'client');
      const { stdout } = await execAsync(`test -d "${serverPrismaPath}" && echo "exists" || echo "not found"`);
      results.checks.serverNodeModules = stdout.trim() === 'exists' ? 'exists' : 'not found';
    } catch (e: any) {
      results.checks.serverNodeModules = `error: ${e.message}`;
    }

    // Check 2: Try to import Prisma Client
    let importResult = 'not attempted';
    try {
      const { PrismaClient } = await import('../server/node_modules/@prisma/client');
      importResult = PrismaClient ? 'success' : 'failed';
      results.checks.importFromServer = importResult;
    } catch (e: any) {
      results.checks.importFromServer = `error: ${e.message}`;
    }

    // Check 3: Try root node_modules
    try {
      const { PrismaClient } = await import('@prisma/client');
      results.checks.importFromRoot = PrismaClient ? 'success' : 'failed';
    } catch (e: any) {
      results.checks.importFromRoot = `error: ${e.message}`;
    }

    // Check 4: Try to run prisma generate
    try {
      const { stdout, stderr } = await execAsync('cd server && npx prisma generate', {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || '' },
      });
      results.checks.generateCommand = {
        success: true,
        stdout: stdout.substring(0, 200),
        stderr: stderr.substring(0, 200),
      };
    } catch (e: any) {
      results.checks.generateCommand = {
        success: false,
        error: e.message,
      };
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}

