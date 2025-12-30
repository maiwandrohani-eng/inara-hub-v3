import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Global search
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { q, types, category, limit = 20 } = req.query;

    if (!q || (q as string).trim().length === 0) {
      return res.json({ results: [], total: 0 });
    }

    const query = (q as string).toLowerCase();
    const searchTypes = types ? (types as string).split(',') : ['training', 'policy', 'library', 'template'];
    const results: any[] = [];

    // Search trainings
    if (searchTypes.includes('training')) {
      const trainings = await prisma.training.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
        },
      });
      results.push(...trainings.map(t => ({ ...t, type: 'training' })));
    }

    // Search policies
    if (searchTypes.includes('policy')) {
      const policies = await prisma.policy.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { brief: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          brief: true,
          category: true,
          tags: true,
        },
      });
      results.push(...policies.map(p => ({ ...p, description: p.brief, type: 'policy' })));
    }

    // Search library
    if (searchTypes.includes('library')) {
      const library = await prisma.libraryResource.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          description: true,
          resourceType: true,
          category: true,
          tags: true,
        },
      });
      results.push(...library.map(l => ({ ...l, type: 'library' })));
    }

    // Search templates
    if (searchTypes.includes('template')) {
      const templates = await prisma.template.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
        },
      });
      results.push(...templates.map(t => ({ ...t, type: 'template' })));
    }

    // Save search history
    if (userId) {
      await prisma.searchHistory.create({
        data: {
          userId,
          query: q as string,
          filters: { types: searchTypes, category },
          resultCount: results.length,
        },
      });
    }

    res.json({ results, total: results.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get search history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

