import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all trainings (with user progress)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { category, mandatory, status } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (mandatory === 'true') where.isMandatory = true;

    const trainings = await prisma.training.findMany({
      where,
      include: {
        completions: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by status if provided
    let filtered = trainings;
    if (status) {
      filtered = trainings.filter(t => {
        const completion = t.completions[0];
        if (!completion) return status === 'NOT_STARTED';
        return completion.status === status;
      });
    }

    res.json({ trainings: filtered });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single training
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        completions: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Start/Update training progress
router.post('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { progress, section } = req.body;

    const completion = await prisma.trainingCompletion.upsert({
      where: {
        userId_trainingId: {
          userId,
          trainingId: id,
        },
      },
      update: {
        progress: Math.min(progress || 0, 100),
        status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        ...(progress === 100 && { completedAt: new Date() }),
      },
      create: {
        userId,
        trainingId: id,
        progress: progress || 0,
        status: 'IN_PROGRESS',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'training_progress',
        resourceType: 'training',
        resourceId: id,
        details: { progress, section },
      },
    });

    res.json({ completion });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Submit quiz/assessment
router.post('/:id/quiz', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { answers } = req.body;

    const training = await prisma.training.findUnique({
      where: { id },
    });

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    // Calculate score (simplified - in production, implement proper scoring)
    const quiz = training.quiz as any;
    let correct = 0;
    let total = 0;

    if (quiz && quiz.questions) {
      total = quiz.questions.length;
      quiz.questions.forEach((q: any, idx: number) => {
        if (answers[idx] === q.correctAnswer) {
          correct++;
        }
      });
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= training.passingScore;

    // Update completion
    const completion = await prisma.trainingCompletion.upsert({
      where: {
        userId_trainingId: {
          userId,
          trainingId: id,
        },
      },
      update: {
        score,
        status: passed ? 'COMPLETED' : 'IN_PROGRESS',
        progress: 100,
        completedAt: passed ? new Date() : undefined,
        ...(training.validityPeriod && {
          expiresAt: new Date(Date.now() + training.validityPeriod * 24 * 60 * 60 * 1000),
        }),
      },
      create: {
        userId,
        trainingId: id,
        score,
        status: passed ? 'COMPLETED' : 'IN_PROGRESS',
        progress: 100,
        completedAt: passed ? new Date() : undefined,
        ...(training.validityPeriod && {
          expiresAt: new Date(Date.now() + training.validityPeriod * 24 * 60 * 60 * 1000),
        }),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'training_quiz_submit',
        resourceType: 'training',
        resourceId: id,
        details: { score, passed },
      },
    });

    res.json({ completion, passed, score });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get training paths
router.get('/paths/all', authenticate, async (req: AuthRequest, res) => {
  try {
    const paths = await prisma.trainingPath.findMany({
      where: { isActive: true },
      include: {
        trainings: {
          where: { isActive: true },
        },
      },
    });

    res.json({ paths });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

