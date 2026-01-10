// INARA Academy Routes
// Handles course enrollment, progress tracking, and certification

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { generateAcademyCertificate, generateCertificateNumber } from '../utils/academyCertificateGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all available courses for user
router.get('/courses', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const courses = await prisma.training.findMany({
      where: {
        isActive: true,
        OR: [
          { assignedTo: 'GLOBAL' },
          { assignedRoles: { has: user?.role } },
          { assignedDepartments: user?.department ? { has: user.department } : undefined },
          { assignedCountries: user?.country ? { has: user.country } : undefined },
        ],
      },
      include: {
        lessons: {
          include: {
            slides: {
              include: {
                microQuiz: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        completions: {
          where: { userId },
          take: 1,
        },
        track: true,
        resources: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ courses });
  } catch (error: any) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single course with full structure
router.get('/courses/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const course = await prisma.training.findUnique({
      where: { id },
      include: {
        lessons: {
          include: {
            slides: {
              include: {
                microQuiz: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        completions: {
          where: { userId },
          take: 1,
        },
        track: true,
        resources: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get final exam from quiz field (legacy) or create from lessons
    const finalExam = course.quiz
      ? {
          questions: Array.isArray(course.quiz)
            ? course.quiz
            : (course.quiz as any).questions || [],
          passingScore: course.passingScore,
        }
      : null;

    res.json({ course: { ...course, finalExam } });
  } catch (error: any) {
    console.error('Get course error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start/Enroll in course
router.post('/courses/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Get or create completion record
    let completion = await prisma.trainingCompletion.findUnique({
      where: { userId_trainingId: { userId, trainingId: id } },
    });

    if (!completion) {
      completion = await prisma.trainingCompletion.create({
        data: {
          userId,
          trainingId: id,
          status: 'IN_PROGRESS',
          progress: 0,
        },
      });
    } else if (completion.status === 'NOT_STARTED') {
      completion = await prisma.trainingCompletion.update({
        where: { id: completion.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    res.json({ completion });
  } catch (error: any) {
    console.error('Start course error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update progress
router.post('/courses/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { progress, lessonIndex, slideIndex } = req.body;

    await prisma.trainingCompletion.updateMany({
      where: {
        userId,
        trainingId: id,
      },
      data: {
        progress: Math.min(progress || 0, 100),
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Complete course and generate certificate
router.post('/courses/:id/complete', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { finalExamAnswers, score, passed } = req.body;

    const course = await prisma.training.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!passed || score < course.passingScore) {
      return res.status(400).json({
        message: `You scored ${score}%. You need ${course.passingScore}% to pass.`,
        passed: false,
        score,
      });
    }

    // Update completion
    const completion = await prisma.trainingCompletion.update({
      where: { userId_trainingId: { userId, trainingId: id } },
      data: {
        status: 'COMPLETED',
        progress: 100,
        score,
        completedAt: new Date(),
        expiresAt: course.validityPeriod
          ? new Date(Date.now() + course.validityPeriod * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    // Generate certificate number and dates
    const certificateNumber = generateCertificateNumber(id, userId);
    const completionDate = new Date();
    const expiryDate = course.validityPeriod
      ? new Date(completionDate.getTime() + course.validityPeriod * 24 * 60 * 60 * 1000)
      : undefined;

    // Create or update certificate record (upsert in case of retake)
    // Store certificate data only - HTML rendering happens on frontend
    const certificate = await prisma.certificate.upsert({
      where: {
        userId_trainingId: {
          userId,
          trainingId: id,
        },
      },
      create: {
        trainingId: id,
        userId,
        certificateNumber,
        fullName: `${user.firstName} ${user.lastName}`,
        courseTitle: course.title,
        completionDate,
        expiryDate,
        score,
        passingScore: course.passingScore,
        passed: true,
        certificateUrl: '', // No PDF file - rendered as HTML on frontend
        signedBy: 'INARA Academy Director',
        signatureDate: new Date(),
      },
      update: {
        certificateNumber,
        fullName: `${user.firstName} ${user.lastName}`,
        courseTitle: course.title,
        completionDate,
        expiryDate,
        score,
        passingScore: course.passingScore,
        passed: true,
        certificateUrl: '', // No PDF file - rendered as HTML on frontend
        signedBy: 'INARA Academy Director',
        signatureDate: new Date(),
        isRecertified: true,
      },
    });

    // Update completion (no certificate URL needed - displayed on frontend)
    await prisma.trainingCompletion.update({
      where: { id: completion.id },
      data: { certificateUrl: certificate.certificateNumber },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'course_completed',
        resourceType: 'training',
        resourceId: id,
        details: { score, certificateNumber },
      },
    });

    res.json({
      success: true,
      passed: true,
      score,
      certificate: certificate,
      message: 'Congratulations! Course completed successfully.',
    });
  } catch (error: any) {
    console.error('Complete course error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user certificates
router.get('/certificates', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            courseType: true,
          },
        },
      },
      orderBy: { completionDate: 'desc' },
    });

    res.json({ certificates });
  } catch (error: any) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download certificate
router.get('/certificates/:id/download', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        training: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get presigned URL from R2 or redirect to public URL
    const { getPresignedUrl } = await import('../utils/r2Storage.js');
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    
    // Extract key from certificate URL
    const key = certificate.certificateUrl.replace(/^\/uploads\//, '').replace(/^https?:\/\/[^\/]+\//, '');
    
    if (R2_PUBLIC_URL) {
      // Redirect to public URL
      return res.redirect(302, `${R2_PUBLIC_URL}/${key}`);
    } else {
      // Generate presigned URL
      const presignedUrl = await getPresignedUrl(key, 3600); // 1 hour expiry
      return res.redirect(302, presignedUrl);
    }
  } catch (error: any) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// INARA Academy Analytics - Compliance Dashboard
router.get('/analytics/compliance', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { country, department } = req.query;

    // Get all users (filtered by country/department if specified)
    const where: any = { isActive: true };
    if (country) where.country = country;
    if (department) where.department = department;

    const users = await prisma.user.findMany({ where });
    const userIds = users.map(u => u.id);

    // Get all mandatory courses
    const mandatoryCourses = await prisma.training.findMany({
      where: {
        isMandatory: true,
        isActive: true,
      },
    });

    // Calculate completion rates by course
    const courseStats = await Promise.all(
      mandatoryCourses.map(async (course) => {
        const completions = await prisma.trainingCompletion.findMany({
          where: {
            trainingId: course.id,
            userId: { in: userIds },
            status: 'COMPLETED',
          },
        });

        const inProgress = await prisma.trainingCompletion.findMany({
          where: {
            trainingId: course.id,
            userId: { in: userIds },
            status: 'IN_PROGRESS',
          },
        });

        const expired = await prisma.certificate.findMany({
          where: {
            trainingId: course.id,
            userId: { in: userIds },
            expiryDate: { lte: new Date() },
          },
        });

        const expiringSoon = await prisma.certificate.findMany({
          where: {
            trainingId: course.id,
            userId: { in: userIds },
            expiryDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            },
          },
        });

        return {
          courseId: course.id,
          courseTitle: course.title,
          courseType: course.courseType,
          totalUsers: users.length,
          completed: completions.length,
          inProgress: inProgress.length,
          notStarted: users.length - completions.length - inProgress.length,
          expired: expired.length,
          expiringSoon: expiringSoon.length,
          completionRate: users.length > 0 ? (completions.length / users.length) * 100 : 0,
        };
      })
    );

    // Calculate by country
    const countryStats = await Promise.all(
      (await prisma.user.groupBy({
        by: ['country'],
        where: { isActive: true, country: { not: null } },
        _count: { id: true },
      })).map(async (countryGroup) => {
        const countryUsers = await prisma.user.findMany({
          where: { country: countryGroup.country, isActive: true },
        });
        const countryUserIds = countryUsers.map(u => u.id);

        const completions = await prisma.trainingCompletion.findMany({
          where: {
            userId: { in: countryUserIds },
            status: 'COMPLETED',
            training: { isMandatory: true },
          },
        });

        const totalMandatory = mandatoryCourses.length * countryUsers.length;
        const completionRate = totalMandatory > 0 ? (completions.length / totalMandatory) * 100 : 0;

        return {
          country: countryGroup.country,
          totalUsers: countryUsers.length,
          totalCompletions: completions.length,
          completionRate,
        };
      })
    );

    // Calculate by department
    const departmentStats = await Promise.all(
      (await prisma.user.groupBy({
        by: ['department'],
        where: { isActive: true, department: { not: null } },
        _count: { id: true },
      })).map(async (deptGroup) => {
        const deptUsers = await prisma.user.findMany({
          where: { department: deptGroup.department, isActive: true },
        });
        const deptUserIds = deptUsers.map(u => u.id);

        const completions = await prisma.trainingCompletion.findMany({
          where: {
            userId: { in: deptUserIds },
            status: 'COMPLETED',
            training: { isMandatory: true },
          },
        });

        const totalMandatory = mandatoryCourses.length * deptUsers.length;
        const completionRate = totalMandatory > 0 ? (completions.length / totalMandatory) * 100 : 0;

        return {
          department: deptGroup.department,
          totalUsers: deptUsers.length,
          totalCompletions: completions.length,
          completionRate,
        };
      })
    );

    // Training gaps (users missing mandatory trainings)
    const trainingGaps = await Promise.all(
      users.map(async (user) => {
        const userCompletions = await prisma.trainingCompletion.findMany({
          where: {
            userId: user.id,
            trainingId: { in: mandatoryCourses.map(c => c.id) },
            status: 'COMPLETED',
          },
        });

        const missing = mandatoryCourses.filter(
          c => !userCompletions.some(uc => uc.trainingId === c.id)
        );

        return {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          department: user.department,
          country: user.country,
          missingCount: missing.length,
          missingCourses: missing.map(c => c.title),
        };
      })
    );

    res.json({
      courseStats,
      countryStats,
      departmentStats,
      trainingGaps: trainingGaps.filter(tg => tg.missingCount > 0),
      summary: {
        totalUsers: users.length,
        totalMandatoryCourses: mandatoryCourses.length,
        overallCompletionRate: courseStats.length > 0
          ? courseStats.reduce((sum, cs) => sum + cs.completionRate, 0) / courseStats.length
          : 0,
        totalExpired: courseStats.reduce((sum, cs) => sum + cs.expired, 0),
        totalExpiringSoon: courseStats.reduce((sum, cs) => sum + cs.expiringSoon, 0),
      },
    });
  } catch (error: any) {
    console.error('Academy analytics error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get course resources
router.get('/courses/:id/resources', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const resources = await prisma.courseResource.findMany({
      where: {
        trainingId: id,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
    res.json({ resources });
  } catch (error: any) {
    console.error('Get course resources error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download course resource
router.get('/courses/:id/resources/:resourceId/download', authenticate, async (req: AuthRequest, res) => {
  try {
    const { resourceId } = req.params;
    const resource = await prisma.courseResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Get presigned URL from R2 or redirect to public URL
    const { getPresignedUrl } = await import('../utils/r2Storage.js');
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    
    // Extract key from resource URL
    let key = resource.fileUrl.replace(/^\/uploads\//, '').replace(/^https?:\/\/[^\/]+\//, '');
    
    // Ensure inara-data prefix for R2 (files stored at inara-data/{type}/... in R2)
    if (!key.startsWith('inara-data/')) {
      key = `inara-data/${key}`;
    }
    
    if (R2_PUBLIC_URL) {
      // Redirect to public URL
      return res.redirect(302, `${R2_PUBLIC_URL}/${key}`);
    } else {
      // Generate presigned URL
      const presignedUrl = await getPresignedUrl(key, 3600); // 1 hour expiry
      return res.redirect(302, presignedUrl);
    }
  } catch (error: any) {
    console.error('Download resource error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
