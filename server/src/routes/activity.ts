import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get activity feed
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, resourceType } = req.query;

    const where: any = {};
    if (resourceType) {
      where.resourceType = resourceType;
    }

    // Get user's own activities and platform-wide activities
    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ activities });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

