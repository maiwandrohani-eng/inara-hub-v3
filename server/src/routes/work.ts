import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all work systems
router.get('/systems', authenticate, async (req: AuthRequest, res) => {
  try {
    const systems = await prisma.workSystem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        accessRules: {
          where: { isActive: true },
        },
      },
    });

    res.json({ systems });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Check access to a work system
router.get('/systems/:id/access', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const system = await prisma.workSystem.findUnique({
      where: { id },
      include: {
        accessRules: {
          where: { isActive: true },
        },
      },
    });

    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainingCompletions: {
          where: {
            status: 'COMPLETED',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        policyCertifications: {
          where: {
            status: 'ACKNOWLEDGED',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access rules
    const blockers: string[] = [];
    let hasAccess = true;

    for (const rule of system.accessRules) {
      // Check role
      if (rule.allowedRoles.length > 0 && !rule.allowedRoles.includes(user.role)) {
        blockers.push(`Role restriction: ${user.role} not allowed`);
        hasAccess = false;
        continue;
      }

      // Check department
      if (rule.allowedDepartments.length > 0 && user.department && !rule.allowedDepartments.includes(user.department)) {
        blockers.push(`Department restriction: ${user.department} not allowed`);
        hasAccess = false;
        continue;
      }

      // Check country
      if (rule.allowedCountries.length > 0 && user.country && !rule.allowedCountries.includes(user.country)) {
        blockers.push(`Country restriction: ${user.country} not allowed`);
        hasAccess = false;
        continue;
      }

      // Check required trainings
      if (rule.requiredTrainingIds.length > 0) {
        const completedTrainingIds = user.trainingCompletions.map(tc => tc.trainingId);
        const missingTrainings = rule.requiredTrainingIds.filter(
          tid => !completedTrainingIds.includes(tid)
        );
        if (missingTrainings.length > 0) {
          const trainings = await prisma.training.findMany({
            where: { id: { in: missingTrainings } },
            select: { title: true },
          });
          blockers.push(`Missing required trainings: ${trainings.map(t => t.title).join(', ')}`);
          hasAccess = false;
        }
      }

      // Check required policies
      if (rule.requiredPolicyIds.length > 0) {
        const certifiedPolicyIds = user.policyCertifications.map(pc => pc.policyId);
        const missingPolicies = rule.requiredPolicyIds.filter(
          pid => !certifiedPolicyIds.includes(pid)
        );
        if (missingPolicies.length > 0) {
          const policies = await prisma.policy.findMany({
            where: { id: { in: missingPolicies } },
            select: { title: true },
          });
          blockers.push(`Missing required policy certifications: ${policies.map(p => p.title).join(', ')}`);
          hasAccess = false;
        }
      }
    }

    if (hasAccess) {
      // Grant access
      await prisma.workSystemAccess.upsert({
        where: {
          userId_workSystemId: {
            userId,
            workSystemId: id,
          },
        },
        update: {
          lastAccessed: new Date(),
          accessCount: { increment: 1 },
        },
        create: {
          userId,
          workSystemId: id,
          lastAccessed: new Date(),
          accessCount: 1,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'access_system',
          resourceType: 'work_system',
          resourceId: id,
          details: { systemName: system.name },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    res.json({
      hasAccess,
      system: hasAccess ? system : { ...system, url: null }, // Hide URL if no access
      blockers,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Access a work system (opens URL) - redirects to system URL
router.post('/systems/:id/access', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const system = await prisma.workSystem.findUnique({
      where: { id },
      include: {
        accessRules: {
          where: { isActive: true },
        },
      },
    });

    if (!system) {
      return res.status(404).json({ message: 'System not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainingCompletions: {
          where: {
            status: 'COMPLETED',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        policyCertifications: {
          where: {
            status: 'ACKNOWLEDGED',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access rules
    const blockers: string[] = [];
    let hasAccess = true;

    for (const rule of system.accessRules) {
      if (rule.allowedRoles.length > 0 && !rule.allowedRoles.includes(user.role)) {
        blockers.push(`Role restriction: ${user.role} not allowed`);
        hasAccess = false;
        continue;
      }

      if (rule.allowedDepartments.length > 0 && user.department && !rule.allowedDepartments.includes(user.department)) {
        blockers.push(`Department restriction: ${user.department} not allowed`);
        hasAccess = false;
        continue;
      }

      if (rule.allowedCountries.length > 0 && user.country && !rule.allowedCountries.includes(user.country)) {
        blockers.push(`Country restriction: ${user.country} not allowed`);
        hasAccess = false;
        continue;
      }

      if (rule.requiredTrainingIds.length > 0) {
        const completedTrainingIds = user.trainingCompletions.map(tc => tc.trainingId);
        const missingTrainings = rule.requiredTrainingIds.filter(
          tid => !completedTrainingIds.includes(tid)
        );
        if (missingTrainings.length > 0) {
          const trainings = await prisma.training.findMany({
            where: { id: { in: missingTrainings } },
            select: { title: true },
          });
          blockers.push(`Missing required trainings: ${trainings.map(t => t.title).join(', ')}`);
          hasAccess = false;
        }
      }

      if (rule.requiredPolicyIds.length > 0) {
        const certifiedPolicyIds = user.policyCertifications.map(pc => pc.policyId);
        const missingPolicies = rule.requiredPolicyIds.filter(
          pid => !certifiedPolicyIds.includes(pid)
        );
        if (missingPolicies.length > 0) {
          const policies = await prisma.policy.findMany({
            where: { id: { in: missingPolicies } },
            select: { title: true },
          });
          blockers.push(`Missing required policy certifications: ${policies.map(p => p.title).join(', ')}`);
          hasAccess = false;
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied', blockers });
    }

    // Grant access
    await prisma.workSystemAccess.upsert({
      where: {
        userId_workSystemId: {
          userId,
          workSystemId: id,
        },
      },
      update: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
      create: {
        userId,
        workSystemId: id,
        lastAccessed: new Date(),
        accessCount: 1,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'access_system',
        resourceType: 'work_system',
        resourceId: id,
        details: { systemName: system.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ url: system.url, message: 'Access granted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

