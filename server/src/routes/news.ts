import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { notifyNewsPublished } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active news (public for authenticated users)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { priority, limit } = req.query;
    const where: any = {
      isActive: true,
      publishedAt: { lte: new Date() },
    };

    if (priority) {
      where.priority = priority;
    }

    const news = await prisma.news.findMany({
      where,
      include: {
        _count: {
          select: { confirmations: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
    });

    // Check if current user has confirmed each news
    const userId = req.user!.id;
    const userConfirmations = await prisma.newsConfirmation.findMany({
      where: { userId },
      select: { newsId: true },
    });
    const confirmedNewsIds = new Set(userConfirmations.map((c) => c.newsId));

    const newsWithStatus = news.map((item) => ({
      ...item,
      isConfirmed: confirmedNewsIds.has(item.id),
      confirmationCount: item._count.confirmations,
    }));

    res.json({ news: newsWithStatus });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single news item
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        confirmations: {
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
        },
        _count: {
          select: { confirmations: true },
        },
      },
    });

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    const userConfirmation = await prisma.newsConfirmation.findUnique({
      where: {
        newsId_userId: {
          newsId: id,
          userId,
        },
      },
    });

    res.json({
      news: {
        ...news,
        isConfirmed: !!userConfirmation,
        confirmationCount: news._count.confirmations,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm news (mark as seen)
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if news exists
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Create or update confirmation
    const confirmation = await prisma.newsConfirmation.upsert({
      where: {
        newsId_userId: {
          newsId: id,
          userId,
        },
      },
      update: {
        confirmedAt: new Date(),
      },
      create: {
        newsId: id,
        userId,
      },
    });

    res.json({ confirmation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD));

// Create news
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, summary, priority, expiresAt, publishedAt } = req.body;

    const news = await prisma.news.create({
      data: {
        title,
        content,
        summary,
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        createdBy: userId,
      },
    });

    // Send notifications to all active users
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const user of activeUsers) {
      await notifyNewsPublished(user.id, news.id, news.title);
    }

    res.status(201).json({ news });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update news
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, priority, isActive, expiresAt, publishedAt } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
    });

    res.json({ news });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete news
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.news.delete({ where: { id } });
    res.json({ message: 'News deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get confirmation status for a news item (admin only)
router.get('/:id/confirmations', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        confirmations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                country: true,
              },
            },
          },
          orderBy: { confirmedAt: 'desc' },
        },
      },
    });

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        country: true,
      },
    });

    const confirmedUserIds = new Set(news.confirmations.map((c) => c.userId));
    const confirmed = news.confirmations.map((c) => c.user);
    const notConfirmed = allUsers.filter((u) => !confirmedUserIds.has(u.id));

    res.json({
      confirmed,
      notConfirmed,
      totalUsers: allUsers.length,
      confirmedCount: confirmed.length,
      notConfirmedCount: notConfirmed.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

