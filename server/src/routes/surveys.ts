import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { generateTestCompletionCertificate } from '../utils/testCertificateGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get surveys/assessments/tests assigned to current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, department: true, country: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    
    // Debug logging
    console.log('🔍 Fetching surveys for user:', {
      userId,
      role: user.role,
      department: user.department,
      country: user.country,
    });
    
    // Build assignment conditions
    // Note: AccessLevel enum only has: GLOBAL, COUNTRY, DEPARTMENT, ROLE
    // For user-specific assignments, we check assignedUserIds array directly
    const assignmentConditions: any[] = [
      { assignedTo: 'GLOBAL' }, // Always show GLOBAL surveys
    ];
    
    // Add country-based assignment if user has a country
    if (user.country) {
      assignmentConditions.push({
        AND: [
          { assignedTo: 'COUNTRY' },
          { assignedCountries: { has: user.country } },
        ],
      });
    }
    
    // Add department-based assignment if user has a department
    if (user.department) {
      assignmentConditions.push({
        AND: [
          { assignedTo: 'DEPARTMENT' },
          { assignedDepartments: { has: user.department } },
        ],
      });
    }
    
    // Add role-based assignment
    assignmentConditions.push({
      AND: [
        { assignedTo: 'ROLE' },
        { assignedRoles: { has: user.role } },
      ],
    });
    
    // Add user-specific assignment (check if userId is in assignedUserIds array)
    assignmentConditions.push({
      assignedUserIds: { has: userId },
    });
    
    let surveys: any[] = [];
    try {
      surveys = await prisma.survey.findMany({
        where: {
          isActive: true,
          OR: assignmentConditions,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Error fetching surveys:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ message: error.message || 'Failed to fetch surveys' });
    }

    // Get user's submissions to show status
    const submissions = await prisma.surveySubmission.findMany({
      where: { userId },
      select: {
        surveyId: true,
        status: true,
        submittedAt: true,
        percentageScore: true,
        passed: true,
        attemptNumber: true,
      },
    });

    const submissionsMap = new Map(
      submissions.map((s) => [s.surveyId, s])
    );

    const surveysWithStatus = surveys.map((survey) => {
      const submission = submissionsMap.get(survey.id);
      return {
        ...survey,
        userStatus: submission?.status || 'not_started',
        userScore: submission?.percentageScore,
        userPassed: submission?.passed,
        userAttempts: submission?.attemptNumber || 0,
        lastSubmittedAt: submission?.submittedAt,
      };
    });

    console.log('✅ Found surveys:', {
      count: surveysWithStatus.length,
      surveyIds: surveysWithStatus.map(s => s.id),
      surveyTitles: surveysWithStatus.map(s => s.title),
      assignedTo: surveysWithStatus.map(s => s.assignedTo),
    });

    res.json({ surveys: surveysWithStatus });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single survey/assessment/test
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        analytics: true,
      },
    });

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Get user's existing submissions
    const submissions = await prisma.surveySubmission.findMany({
      where: { surveyId: id, userId },
      orderBy: { attemptNumber: 'desc' },
    });

    // Check if user can take more attempts
    const canTakeMore = !survey.maxAttempts || submissions.length < survey.maxAttempts;
    const latestSubmission = submissions[0];

    res.json({
      survey,
      submissions,
      canTakeMore,
      latestSubmission,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Start a survey/assessment/test
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('🚀 Starting survey:', { surveyId: id, userId });

    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      console.error('❌ Survey not found:', id);
      return res.status(404).json({ message: 'Survey not found' });
    }

    if (!survey.isActive) {
      console.error('❌ Survey is not active:', id);
      return res.status(400).json({ message: 'This survey is not currently active.' });
    }

    // Check if user can take more attempts
    const existingSubmissions = await prisma.surveySubmission.findMany({
      where: { surveyId: id, userId },
    });

    console.log('📊 Existing submissions:', existingSubmissions.length);

    if (survey.maxAttempts && existingSubmissions.length >= survey.maxAttempts) {
      return res.status(400).json({
        message: `Maximum attempts (${survey.maxAttempts}) reached for this ${survey.type}.`,
      });
    }

    // Check if there's an in-progress submission
    const inProgress = existingSubmissions.find((s) => s.status === 'in_progress');
    if (inProgress) {
      console.log('✅ Returning existing in-progress submission');
      return res.json({ submission: inProgress });
    }

    // Create new submission
    try {
      const submission = await prisma.surveySubmission.create({
        data: {
          surveyId: id,
          userId,
          attemptNumber: existingSubmissions.length + 1,
          status: 'in_progress',
          startedAt: new Date(),
          responses: [], // Initialize with empty array for responses
        },
      });

      console.log('✅ Survey submission created:', submission.id);

      res.json({ submission });
    } catch (createError: any) {
      console.error('❌ Error creating survey submission:', createError);
      console.error('Error code:', createError.code);
      console.error('Error message:', createError.message);
      console.error('Error meta:', createError.meta);
      console.error('Full error:', JSON.stringify(createError, null, 2));
      
      // Check for specific Prisma errors
      if (createError.code === 'P2002') {
        return res.status(400).json({
          message: 'You already have an in-progress submission for this survey.',
        });
      }
      
      if (createError.code === 'P2003') {
        return res.status(400).json({
          message: 'Invalid survey or user reference.',
        });
      }
      
      res.status(500).json({
        message: 'Failed to create survey submission',
        error: process.env.NODE_ENV === 'development' ? createError.message : undefined,
      });
    }
  } catch (error: any) {
    console.error('❌ Error starting survey:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to start survey',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Submit survey/assessment/test
router.post('/:id/submit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { submissionId, responses, notes, timeSpentSeconds } = req.body;

    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    const submission = await prisma.surveySubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.userId !== userId) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status === 'submitted') {
      return res.status(400).json({ message: 'This submission has already been submitted.' });
    }

    // Calculate scores if it's an assessment or test
    let totalScore = 0;
    let maxScore = 0;
    let passed = null;

    if (survey.type === 'assessment' || survey.type === 'test') {
      const questions = survey.questions as any[];
      const responsesMap = new Map(
        (responses || []).map((r: any) => [r.questionId, r.answer])
      );

      for (const question of questions) {
        const points = question.points || 1;
        maxScore += points;

        const userAnswer = responsesMap.get(question.id);
        if (userAnswer && question.correctAnswer) {
          let isCorrect = false;

          if (question.type === 'multiple_choice' || question.type === 'yes_no') {
            isCorrect = String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
          } else if (question.type === 'checkbox') {
            const userAnswers = Array.isArray(userAnswer) ? userAnswer.sort() : [];
            const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer.sort() : [];
            isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
          } else if (question.type === 'text') {
            // Simple keyword matching for text answers
            const keywords = Array.isArray(question.correctAnswer)
              ? question.correctAnswer.map((k: string) => k.toLowerCase())
              : [String(question.correctAnswer).toLowerCase()];
            const userText = String(userAnswer).toLowerCase();
            isCorrect = keywords.some((keyword: string) => userText.includes(keyword));
          }

          if (isCorrect) {
            totalScore += points;
          }
        }
      }

      const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      passed = survey.passingScore ? percentageScore >= survey.passingScore : null;
    }

    // Update submission
    const updatedSubmission = await prisma.surveySubmission.update({
      where: { id: submissionId },
      data: {
        responses,
        totalScore: survey.type !== 'survey' ? totalScore : null,
        maxScore: survey.type !== 'survey' ? maxScore : null,
        percentageScore: survey.type !== 'survey' ? (totalScore / maxScore) * 100 : null,
        passed,
        notes,
        timeSpentSeconds,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    // Update analytics (async, don't wait)
    updateSurveyAnalytics(id).catch(console.error);

    res.json({ submission: updatedSubmission });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update survey analytics
async function updateSurveyAnalytics(surveyId: string) {
  try {
    const submissions = await prisma.surveySubmission.findMany({
      where: {
        surveyId,
        status: 'submitted',
      },
    });

    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter((s) => s.submittedAt).length;
    const averageScore =
      submissions.length > 0 && submissions[0].percentageScore !== null
        ? submissions.reduce((sum, s) => sum + (s.percentageScore || 0), 0) / submissions.length
        : null;
    const averageTimeSpent =
      submissions.length > 0 && submissions[0].timeSpentSeconds
        ? submissions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0) / submissions.length
        : null;
    const passRate =
      submissions.length > 0
        ? (submissions.filter((s) => s.passed === true).length / submissions.length) * 100
        : null;

    await prisma.surveyAnalytics.upsert({
      where: { surveyId },
      update: {
        totalSubmissions,
        completedSubmissions,
        averageScore,
        averageTimeSpent,
        passRate,
        lastCalculatedAt: new Date(),
      },
      create: {
        surveyId,
        totalSubmissions,
        completedSubmissions,
        averageScore,
        averageTimeSpent,
        passRate,
      },
    });
  } catch (error) {
    console.error('Error updating survey analytics:', error);
  }
}

// Get certificate for a completed test
router.get('/:id/certificate/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: surveyId, userId } = req.params;
    const requestingUserId = req.userId!;

    console.log('📜 Generating certificate:', { surveyId, userId, requestingUserId });

    // Users can only get their own certificate, or admins can get any
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (userId !== requestingUserId && requestingUser?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get survey and submission
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Only tests can have certificates
    if (survey.type !== 'test') {
      return res.status(400).json({ message: 'Certificates are only available for tests.' });
    }

    // Get user's submission
    const submission = await prisma.surveySubmission.findFirst({
      where: {
        surveyId,
        userId,
        status: 'submitted',
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) {
      return res.status(404).json({ message: 'No completed submission found for this test.' });
    }

    // Check if user passed (if passing score is required)
    if (survey.passingScore && submission.passed === false) {
      return res.status(400).json({ 
        message: 'You did not pass this test. Certificates are only available for passing scores.' 
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        department: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate certificate PDF
    const certificateBuffer = await generateTestCompletionCertificate(
      user,
      {
        title: survey.title,
        score: submission.totalScore || undefined,
        maxScore: submission.maxScore || undefined,
        passed: submission.passed || undefined,
      },
      submission.submittedAt || new Date()
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="INARA_Test_Certificate_${user.firstName}_${user.lastName}.pdf"`
    );

    res.send(certificateBuffer);
  } catch (error: any) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate certificate',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;

