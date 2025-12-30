import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all policies
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { category, mandatory, status } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (mandatory === 'true') where.isMandatory = true;

    const policies = await prisma.policy.findMany({
      where,
      include: {
        certifications: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by status if provided
    let filtered = policies;
    if (status) {
      filtered = policies.filter(p => {
        const cert = p.certifications[0];
        if (!cert) return status === 'NOT_ACKNOWLEDGED';
        return cert.status === status;
      });
    }

    res.json({ policies: filtered });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single policy
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        certifications: {
          where: { userId },
          take: 1,
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    res.json({ policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Acknowledge policy
router.post('/:id/acknowledge', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const certification = await prisma.policyCertification.upsert({
      where: {
        userId_policyId: {
          userId,
          policyId: id,
        },
      },
      update: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
      create: {
        userId,
        policyId: id,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'policy_acknowledge',
        resourceType: 'policy',
        resourceId: id,
      },
    });

    res.json({ certification, message: 'Policy acknowledged' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Submit policy assessment
router.post('/:id/assessment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { answers } = req.body;

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Calculate score
    const assessment = policy.assessment as any;
    let correct = 0;
    let total = 0;

    if (assessment && assessment.questions) {
      total = assessment.questions.length;
      assessment.questions.forEach((q: any, idx: number) => {
        if (answers[idx] === q.correctAnswer) {
          correct++;
        }
      });
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 100;
    const passed = score >= (assessment?.passingScore || 70);

    const certification = await prisma.policyCertification.upsert({
      where: {
        userId_policyId: {
          userId,
          policyId: id,
        },
      },
      update: {
        status: passed ? 'ACKNOWLEDGED' : 'NOT_ACKNOWLEDGED',
        acknowledgedAt: passed ? new Date() : undefined,
        assessmentScore: score,
      },
      create: {
        userId,
        policyId: id,
        status: passed ? 'ACKNOWLEDGED' : 'NOT_ACKNOWLEDGED',
        acknowledgedAt: passed ? new Date() : undefined,
        assessmentScore: score,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'policy_assessment',
        resourceType: 'policy',
        resourceId: id,
        details: { score, passed },
      },
    });

    res.json({ certification, passed, score });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

