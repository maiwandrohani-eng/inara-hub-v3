import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get calendar events
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end ? new Date(end as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Get user-specific and global events
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { userId },
          {
            assignedTo: 'GLOBAL',
          },
          {
            assignedRoles: { has: user?.role },
          },
          {
            assignedDepartments: user?.department ? { has: user.department } : undefined,
          },
          {
            assignedCountries: user?.country ? { has: user.country } : undefined,
          },
        ],
        startDate: { gte: startDate, lte: endDate },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

