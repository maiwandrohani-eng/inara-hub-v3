import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get comments for a resource
router.get('/:resourceType/:resourceId', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        resourceType,
        resourceId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        replies: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create comment
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { resourceType, resourceId, content, parentId } = req.body;

    const comment = await prisma.comment.create({
      data: {
        userId,
        resourceType,
        resourceId,
        content,
        parentId,
      },
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
    });

    res.status(201).json({ comment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update comment
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.update({
      where: { id, userId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
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
    });

    res.json({ comment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment || comment.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.json({ message: 'Comment deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

