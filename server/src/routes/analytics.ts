import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// People Analytics
router.get('/people', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    // Top visitors
    const topVisitors = await prisma.activityLog.groupBy({
      by: ['userId'],
      where: {
        action: { in: ['login', 'access_system'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const visitorDetails = await Promise.all(
      topVisitors.map(async (v) => {
        const user = await prisma.user.findUnique({
          where: { id: v.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            country: true,
          },
        });
        return { ...user, visitCount: v._count.id };
      })
    );

    // Top learners
    const topLearners = await prisma.trainingCompletion.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
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
    });

    const learnerStats = topLearners.reduce((acc: any, tc) => {
      const userId = tc.userId;
      if (!acc[userId]) {
        acc[userId] = { user: tc.user, count: 0 };
      }
      acc[userId].count++;
      return acc;
    }, {});

    const topLearnersList = Object.values(learnerStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Top readers
    const topReaders = await prisma.libraryAccess.groupBy({
      by: ['userId'],
      where: {
        accessedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    const readerDetails = await Promise.all(
      topReaders.map(async (r) => {
        const user = await prisma.user.findUnique({
          where: { id: r.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            country: true,
          },
        });
        return { ...user, readCount: r._count.id };
      })
    );

    res.json({
      topVisitors: visitorDetails,
      topLearners: topLearnersList,
      topReaders: readerDetails,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Per-Tab Analytics
router.get('/tab/:tabName', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { tabName } = req.params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    switch (tabName) {
      case 'training': {
        // Top learners (training completions)
        const topLearners = await prisma.trainingCompletion.groupBy({
          by: ['userId'],
          where: {
            status: 'COMPLETED',
            completedAt: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        const learnerDetails = await Promise.all(
          topLearners.map(async (l) => {
            const user = await prisma.user.findUnique({
              where: { id: l.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            return { ...user, completionCount: l._count.id };
          })
        );

        res.json({ topLearners: learnerDetails });
        break;
      }

      case 'library': {
        // Top readers
        const topReaders = await prisma.libraryAccess.groupBy({
          by: ['userId'],
          where: { accessedAt: { gte: thirtyDaysAgo } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        const readerDetails = await Promise.all(
          topReaders.map(async (r) => {
            const user = await prisma.user.findUnique({
              where: { id: r.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            return { ...user, readCount: r._count.id };
          })
        );

        res.json({ topReaders: readerDetails });
        break;
      }

      case 'policies': {
        // Top policy certifiers
        const topCertifiers = await prisma.policyCertification.groupBy({
          by: ['userId'],
          where: {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: { gte: thirtyDaysAgo },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        const certifierDetails = await Promise.all(
          topCertifiers.map(async (c) => {
            const user = await prisma.user.findUnique({
              where: { id: c.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            return { ...user, certificationCount: c._count.id };
          })
        );

        res.json({ topCertifiers: certifierDetails });
        break;
      }

      case 'market': {
        // Top contributors (submissions)
        const topContributors = await prisma.marketSubmission.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: thirtyDaysAgo } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        const contributorDetails = await Promise.all(
          topContributors.map(async (c) => {
            const user = await prisma.user.findUnique({
              where: { id: c.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            const submissions = await prisma.marketSubmission.findMany({
              where: { userId: c.userId },
              select: { bonusAwarded: true, bonusAmount: true },
            });
            const totalBonus = submissions.reduce((sum, s) => sum + (s.bonusAmount || 0), 0);
            return { ...user, submissionCount: c._count.id, totalBonus };
          })
        );

        res.json({ topContributors: contributorDetails });
        break;
      }

      case 'templates': {
        // Top template users (downloaders)
        const topUsers = await prisma.templateDownload.groupBy({
          by: ['userId'],
          where: { downloadedAt: { gte: thirtyDaysAgo } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        const userDetails = await Promise.all(
          topUsers.map(async (u) => {
            const user = await prisma.user.findUnique({
              where: { id: u.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            return { ...user, downloadCount: u._count.id };
          })
        );

        res.json({ topUsers: userDetails });
        break;
      }

      case 'work': {
        // Top system users
        const topUsers = await prisma.workSystemAccess.groupBy({
          by: ['userId'],
          where: { lastAccessed: { gte: thirtyDaysAgo } },
          _sum: { accessCount: true },
          orderBy: { _sum: { accessCount: 'desc' } },
          take: 10,
        });

        const userDetails = await Promise.all(
          topUsers.map(async (u) => {
            const user = await prisma.user.findUnique({
              where: { id: u.userId },
              select: { id: true, firstName: true, lastName: true, email: true, department: true, country: true },
            });
            return { ...user, accessCount: u._sum.accessCount || 0 };
          })
        );

        res.json({ topUsers: userDetails });
        break;
      }

      default:
        res.status(400).json({ message: 'Invalid tab name' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Compliance Analytics
router.get('/compliance', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { country, department } = req.query;

    const where: any = {};
    if (country) where.country = country;
    if (department) where.department = department;

    // Training completion rates
    const allUsers = await prisma.user.findMany({ where });
    const mandatoryTrainings = await prisma.training.findMany({
      where: { isMandatory: true, isActive: true },
    });

    const trainingStats = await Promise.all(
      mandatoryTrainings.map(async (training) => {
        const completions = await prisma.trainingCompletion.findMany({
          where: {
            trainingId: training.id,
            status: 'COMPLETED',
            userId: where.id ? undefined : { in: allUsers.map(u => u.id) },
          },
        });

        return {
          trainingId: training.id,
          trainingTitle: training.title,
          totalUsers: allUsers.length,
          completed: completions.length,
          completionRate: allUsers.length > 0 ? (completions.length / allUsers.length) * 100 : 0,
        };
      })
    );

    // Policy certification rates
    const mandatoryPolicies = await prisma.policy.findMany({
      where: { isMandatory: true, isActive: true },
    });

    const policyStats = await Promise.all(
      mandatoryPolicies.map(async (policy) => {
        const certifications = await prisma.policyCertification.findMany({
          where: {
            policyId: policy.id,
            status: 'ACKNOWLEDGED',
            userId: where.id ? undefined : { in: allUsers.map(u => u.id) },
          },
        });

        return {
          policyId: policy.id,
          policyTitle: policy.title,
          totalUsers: allUsers.length,
          certified: certifications.length,
          certificationRate: allUsers.length > 0 ? (certifications.length / allUsers.length) * 100 : 0,
        };
      })
    );

    // Overdue items
    const overdueTrainings = await prisma.trainingCompletion.findMany({
      where: {
        status: { in: ['EXPIRED', 'OVERDUE'] },
        userId: where.id ? undefined : { in: allUsers.map(u => u.id) },
      },
      include: {
        training: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const overduePolicies = await prisma.policyCertification.findMany({
      where: {
        status: { in: ['EXPIRED', 'OVERDUE'] },
        userId: where.id ? undefined : { in: allUsers.map(u => u.id) },
      },
      include: {
        policy: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json({
      trainingStats,
      policyStats,
      overdueTrainings,
      overduePolicies,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// System Usage Analytics
router.get('/system-usage', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const systems = await prisma.workSystem.findMany({
      include: {
        _count: {
          select: { userAccess: true },
        },
        userAccess: {
          select: {
            accessCount: true,
            lastAccessed: true,
          },
        },
      },
    });

    const systemStats = systems.map((system) => {
      const totalAccess = system.userAccess.reduce((sum, acc) => sum + acc.accessCount, 0);
      const uniqueUsers = system.userAccess.length;
      const lastAccess = system.userAccess
        .map(a => a.lastAccessed)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return {
        systemId: system.id,
        systemName: system.name,
        totalAccess,
        uniqueUsers,
        lastAccess,
      };
    });

    // Access denied events
    const accessDenied = await prisma.activityLog.findMany({
      where: {
        action: 'access_denied',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      systemStats,
      accessDenied,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Overview Analytics
router.get('/overview', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    const dateFilter = getDateFilter(range as string);

    // Total users
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastLogin: {
          gte: dateFilter,
        },
      },
    });

    // Training completions
    const trainingCompletions = await prisma.trainingCompletion.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: dateFilter,
        },
      },
    });

    const totalTrainings = await prisma.training.count({ where: { isActive: true } });
    const trainingCompletionRate = totalUsers > 0 ? (trainingCompletions / (totalUsers * totalTrainings)) * 100 : 0;

    // Policy certifications
    const policyCertifications = await prisma.policyCertification.count({
      where: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: {
          gte: dateFilter,
        },
      },
    });

    const totalPolicies = await prisma.policy.count({ where: { isActive: true } });
    const policyCertificationRate = totalUsers > 0 ? (policyCertifications / (totalUsers * totalPolicies)) * 100 : 0;

    // Engagement score (simplified)
    const loginCount = await prisma.activityLog.count({
      where: {
        action: 'login',
        createdAt: {
          gte: dateFilter,
        },
      },
    });
    const engagementScore = totalUsers > 0 ? Math.min((loginCount / totalUsers) * 10, 100) : 0;

    res.json({
      metrics: {
        totalUsers,
        activeUsers,
        trainingCompletions,
        trainingCompletionRate: Math.round(trainingCompletionRate * 100) / 100,
        policyCertifications,
        policyCertificationRate: Math.round(policyCertificationRate * 100) / 100,
        engagementScore: Math.round(engagementScore * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Users Analytics
router.get('/users', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    const dateFilter = getDateFilter(range as string);

    // New users
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: dateFilter,
        },
      },
    });

    // Active users
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastLogin: {
          gte: dateFilter,
        },
      },
    });

    // Retention (users who logged in both in current and previous period)
    const previousPeriodStart = new Date(dateFilter.getTime() - (dateFilter.getTime() - new Date(dateFilter.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()));
    const previousPeriodUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: previousPeriodStart,
          lt: dateFilter,
        },
      },
      select: { id: true },
    });

    const currentPeriodUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: dateFilter,
        },
      },
      select: { id: true },
    });

    const retainedUsers = previousPeriodUsers.filter(u => currentPeriodUsers.some(cu => cu.id === u.id)).length;
    const retentionRate = previousPeriodUsers.length > 0 ? (retainedUsers / previousPeriodUsers.length) * 100 : 0;

    // Average session time (simplified - using activity logs)
    const sessions = await prisma.activityLog.findMany({
      where: {
        action: 'login',
        createdAt: {
          gte: dateFilter,
        },
      },
      select: { createdAt: true },
    });

    // Top performers (users with most training completions)
    const topPerformers = await prisma.trainingCompletion.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: dateFilter,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const performersWithDetails = await Promise.all(
      topPerformers.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        return { ...user, score: p._count.id };
      })
    );

    res.json({
      growth: {
        newUsers,
        activeUsers,
        retentionRate: Math.round(retentionRate * 100) / 100,
        avgSessionTime: 0, // Would need more detailed tracking
      },
      topPerformers: performersWithDetails,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Content Analytics
router.get('/content', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    const dateFilter = getDateFilter(range as string);

    // Most viewed library resource
    const mostViewed = await prisma.libraryAccess.groupBy({
      by: ['resourceId'],
      where: {
        accessedAt: {
          gte: dateFilter,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    let mostViewedResource = null;
    if (mostViewed.length > 0) {
      const resource = await prisma.libraryResource.findUnique({
        where: { id: mostViewed[0].resourceId },
        select: { id: true, title: true },
      });
      mostViewedResource = { ...resource, views: mostViewed[0]._count.id };
    }

    // Most downloaded template
    const mostDownloaded = await prisma.templateDownload.groupBy({
      by: ['templateId'],
      where: {
        downloadedAt: {
          gte: dateFilter,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    let mostDownloadedResource = null;
    if (mostDownloaded.length > 0) {
      const template = await prisma.template.findUnique({
        where: { id: mostDownloaded[0].templateId },
        select: { id: true, title: true },
      });
      mostDownloadedResource = { ...template, downloads: mostDownloaded[0]._count.id };
    }

    // Most commented (training or policy)
    const mostCommented = await prisma.comment.groupBy({
      by: ['resourceType', 'resourceId'],
      where: {
        createdAt: {
          gte: dateFilter,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    let mostCommentedResource = null;
    if (mostCommented.length > 0) {
      const comment = mostCommented[0];
      if (comment.resourceType === 'training') {
        const training = await prisma.training.findUnique({
          where: { id: comment.resourceId },
          select: { id: true, title: true },
        });
        mostCommentedResource = { ...training, comments: comment._count.id };
      } else if (comment.resourceType === 'policy') {
        const policy = await prisma.policy.findUnique({
          where: { id: comment.resourceId },
          select: { id: true, title: true },
        });
        mostCommentedResource = { ...policy, comments: comment._count.id };
      }
    }

    res.json({
      mostViewed: mostViewedResource || { title: 'N/A', views: 0 },
      mostDownloaded: mostDownloadedResource || { title: 'N/A', downloads: 0 },
      mostCommented: mostCommentedResource || { title: 'N/A', comments: 0 },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Engagement Analytics
router.get('/engagement', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { range = '30d' } = req.query;
    const dateFilter = getDateFilter(range as string);

    // Daily active users (last 24 hours)
    const dailyActive = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Weekly active users (last 7 days)
    const weeklyActive = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Average time (simplified - would need session tracking)
    const avgTime = 0;

    // Bounce rate (users who logged in once and never came back)
    const singleLoginUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: dateFilter,
        },
      },
      include: {
        activityLogs: {
          where: {
            action: 'login',
            createdAt: {
              gte: dateFilter,
            },
          },
        },
      },
    });

    const bouncedUsers = singleLoginUsers.filter(u => u.activityLogs.length === 1).length;
    const bounceRate = singleLoginUsers.length > 0 ? (bouncedUsers / singleLoginUsers.length) * 100 : 0;

    res.json({
      dailyActive,
      weeklyActive,
      avgTime,
      bounceRate: Math.round(bounceRate * 100) / 100,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to get date filter based on range
function getDateFilter(range: string): Date {
  const now = Date.now();
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0); // Beginning of time
  }
}

export default router;
