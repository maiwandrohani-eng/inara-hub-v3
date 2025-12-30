import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all library resources
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { type, category, search, tags } = req.query;

    const where: any = { isActive: true };
    if (type) where.resourceType = type;
    if (category) where.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.libraryResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single resource
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const resource = await prisma.libraryResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Track access
    await prisma.libraryAccess.create({
      data: {
        userId,
        resourceId: id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'library_access',
        resourceType: 'library',
        resourceId: id,
      },
    });

    res.json({ resource });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get recommended resources (based on role/department)
router.get('/recommended/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const where: any = { isActive: true };
    
    // Recommend based on department
    if (user.department) {
      where.tags = { has: user.department };
    }

    const resources = await prisma.libraryResource.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

