import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user bookmarks
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { folder, resourceType } = req.query;

    const where: any = { userId };
    if (folder) where.folder = folder;
    if (resourceType) where.resourceType = resourceType;

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookmarks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create bookmark
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { resourceType, resourceId, folder, notes } = req.body;

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        resourceType,
        resourceId,
        folder,
        notes,
      },
    });

    res.status(201).json({ bookmark });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Already bookmarked' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Update bookmark
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { folder, notes } = req.body;

    const bookmark = await prisma.bookmark.update({
      where: { id, userId },
      data: { folder, notes },
    });

    res.json({ bookmark });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete bookmark
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.bookmark.delete({
      where: { id, userId },
    });

    res.json({ message: 'Bookmark removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

