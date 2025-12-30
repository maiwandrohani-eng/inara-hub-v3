import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user preferences
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update user preferences
router.put('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const data = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

