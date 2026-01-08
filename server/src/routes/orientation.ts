import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { generateOrientationCertificate } from '../utils/certificateGenerator.js';
import { getPresignedUrl } from '../utils/r2Storage.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get orientation with steps and progress
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const orientation = await prisma.orientation.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Process steps to convert PDF URLs to accessible URLs and ensure questions are parsed
    if (orientation?.steps) {
      const processedSteps = await Promise.all(
        orientation.steps.map(async (step: any) => {
          let pdfUrl = step.pdfUrl;
          
          // Convert PDF URL to accessible URL
          if (pdfUrl) {
            // If it's already a full URL, use it as-is
            if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
              // Already a full URL, keep it
            } 
            // If it's a relative path starting with /uploads/, convert to API endpoint or get presigned URL
            else if (pdfUrl.startsWith('/uploads/')) {
              // Extract the key (remove /uploads/ prefix)
              const key = pdfUrl.replace(/^\/uploads\//, '');
              try {
                // Try to get presigned URL for R2
                pdfUrl = await getPresignedUrl(key, 3600); // 1 hour expiry
              } catch (error: any) {
                console.error('Error generating presigned URL for step PDF:', error);
                // Fallback to API endpoint
                pdfUrl = `/api/uploads/${key}`;
              }
            }
            // If it's just a key (like orientation/...), get presigned URL
            else if (pdfUrl.includes('/') && !pdfUrl.startsWith('/')) {
              try {
                pdfUrl = await getPresignedUrl(pdfUrl, 3600);
              } catch (error: any) {
                console.error('Error generating presigned URL for step PDF:', error);
                // Fallback: try API endpoint
                pdfUrl = `/api/uploads/${pdfUrl}`;
              }
            }
            // Otherwise, assume it's a relative path and convert to API endpoint
            else {
              pdfUrl = `/api${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`;
            }
          }
          
          // Ensure questions are parsed (Prisma should handle this, but ensure it's an array)
          let questions = step.questions;
          if (questions) {
            // If it's a string, parse it
            if (typeof questions === 'string') {
              try {
                questions = JSON.parse(questions);
              } catch (e) {
                console.error('Error parsing questions for step:', step.id, e);
                questions = null;
              }
            }
            // If it's an object with a questions property, extract it
            if (questions && typeof questions === 'object' && !Array.isArray(questions)) {
              if (questions.questions && Array.isArray(questions.questions)) {
                questions = questions.questions;
              } else if (questions.questions === null || questions.questions === undefined) {
                questions = null;
              }
            }
            // Ensure it's an array or null
            if (questions && !Array.isArray(questions)) {
              questions = null;
            }
          }
          
          return {
            ...step,
            pdfUrl,
            questions: questions || null,
          };
        })
      );
      
      orientation.steps = processedSteps;
    }

    // Get all active policies with their briefs and certifications for orientation
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        brief: true,
        category: true,
        subcategory: true,
        isMandatory: true,
        effectiveDate: true,
        createdAt: true,
        certifications: {
          where: { userId },
          select: {
            status: true,
            acknowledgedAt: true,
          },
        },
      },
      orderBy: [
        { isMandatory: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Get user's step confirmations
    const stepConfirmations = await prisma.orientationStepConfirmation.findMany({
      where: { userId },
      select: {
        stepId: true,
        confirmedAt: true,
      },
    });

    const confirmedStepIds = new Set(stepConfirmations.map(sc => sc.stepId));

    // Get completion status
    const completion = await prisma.orientationCompletion.findUnique({
      where: { userId },
    });

    res.json({
      orientation,
      policies,
      stepConfirmations: confirmedStepIds,
      completed: !!completion,
      completionDate: completion?.completedAt,
      certificateUrl: completion?.certificateUrl,
      checklistData: completion?.checklistData,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm a step with responses
router.post('/steps/:stepId/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { stepId } = req.params;
    const { notes, responses } = req.body;

    const step = await prisma.orientationStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }

    // Validate that all required questions are answered and check answers
    const answerValidation: any[] = [];
    if (step.questions && Array.isArray(step.questions)) {
      const requiredQuestions = (step.questions as any[]).filter((q: any) => q.required !== false);
      const providedResponses = responses || [];
      const responseMap = new Map(providedResponses.map((r: any) => [r.questionId, r.answer]));
      
      if (requiredQuestions.length > 0) {
        const answeredQuestionIds = new Set(providedResponses.map((r: any) => r.questionId));
        const missingQuestions = requiredQuestions.filter((q: any) => !answeredQuestionIds.has(q.id));
        
        if (missingQuestions.length > 0) {
          return res.status(400).json({ 
            message: 'Please answer all required questions',
            missingQuestions: missingQuestions.map((q: any) => q.question || q.id)
          });
        }
      }

      // Validate answers and provide feedback
      (step.questions as any[]).forEach((question: any) => {
        const userAnswer = responseMap.get(question.id);
        if (userAnswer !== undefined && question.correctAnswer !== undefined) {
          let isCorrect = false;
          
          if (question.type === 'multiple_choice') {
            isCorrect = userAnswer === question.correctAnswer;
          } else if (question.type === 'checkbox') {
            const userAnswers = Array.isArray(userAnswer) ? userAnswer.sort() : [];
            const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer.sort() : [];
            isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
          } else if (question.type === 'text') {
            // For text answers, check if the answer contains key concepts (fuzzy matching)
            const userText = (userAnswer as string).toLowerCase();
            const correctText = (question.correctAnswer as string).toLowerCase();
            // Simple keyword matching - consider correct if contains main concepts
            const keyWords = correctText.split(' ').filter(w => w.length > 4);
            isCorrect = keyWords.length > 0 && keyWords.some(word => userText.includes(word));
          }

          answerValidation.push({
            questionId: question.id,
            isCorrect,
            correctAnswer: question.correctAnswer,
            userAnswer: userAnswer,
          });
        }
      });
      
      // Check if all required questions are answered correctly
      const requiredQuestionsForValidation = (step.questions as any[]).filter((q: any) => q.required !== false);
      const incorrectAnswers = answerValidation.filter(
        (validation: any) => !validation.isCorrect && requiredQuestionsForValidation.some((q: any) => q.id === validation.questionId)
      );
      
      if (incorrectAnswers.length > 0) {
        return res.status(400).json({ 
          message: 'Please answer all questions correctly before proceeding to the next step.',
          answerValidation,
          allCorrect: false,
          incorrectCount: incorrectAnswers.length,
          totalQuestions: requiredQuestions.length
        });
      }
    }

    const confirmation = await prisma.orientationStepConfirmation.upsert({
      where: {
        userId_stepId: {
          userId,
          stepId,
        },
      },
      update: {
        confirmedAt: new Date(),
        notes: notes || undefined,
        responses: responses ? responses : undefined,
      },
      create: {
        userId,
        stepId,
        confirmedAt: new Date(),
        notes: notes || undefined,
        responses: responses ? responses : undefined,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'orientation_step_confirm',
        resourceType: 'orientation',
        resourceId: step.orientationId,
        details: { stepId, stepNumber: step.stepNumber, hasResponses: !!responses },
      },
    });

    res.json({ 
      confirmation, 
      message: 'Step confirmed successfully',
      answerValidation: answerValidation.length > 0 ? answerValidation : undefined,
      allCorrect: answerValidation.length === 0 || answerValidation.every((v: any) => v.isCorrect),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Complete orientation (with checklist data and certificate data)
router.post('/complete', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { score, checklistData, certificateData } = req.body;

    const orientation = await prisma.orientation.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
      include: {
        steps: {
          where: { isRequired: true },
        },
      },
    });

    if (!orientation) {
      return res.status(404).json({ message: 'Orientation not found' });
    }

    // Check if all required steps are confirmed
    const requiredStepIds = orientation.steps.map(s => s.id);
    const confirmations = await prisma.orientationStepConfirmation.findMany({
      where: {
        userId,
        stepId: { in: requiredStepIds },
      },
    });

    const confirmedStepIds = new Set(confirmations.map(c => c.stepId));
    const allRequiredConfirmed = requiredStepIds.every(id => confirmedStepIds.has(id));

    if (!allRequiredConfirmed) {
      return res.status(400).json({ 
        message: 'Please complete all required steps before finishing orientation' 
      });
    }

    // Get user for certificate
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

    const completionDate = new Date();
    
    // Certificate URL - will be generated on-demand when requested
    // Use Vercel URL if available, otherwise fallback
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.API_BASE_URL || process.env.R2_PUBLIC_URL || 'http://localhost:5000';
    const certificateUrl = `${baseUrl}/api/orientation/certificate/${userId}`;

    // Generate certificate immediately if certificate data is provided
    let certificateGenerated = false;
    if (certificateData && certificateData.passportId) {
      try {
        const userDataForCertificate = {
          ...user,
          passportId: certificateData.passportId || undefined,
          country: certificateData.country || user.country || undefined,
          department: certificateData.department || user.department || undefined,
          role: certificateData.role || user.role || undefined,
        };

        // Generate certificate PDF
        console.log('📜 Generating certificate during completion for user:', userId);
        const certificateBuffer = await generateOrientationCertificate(
          userDataForCertificate,
          completionDate
        );

        if (!certificateBuffer || certificateBuffer.length === 0) {
          throw new Error('Certificate buffer is empty');
        }

        console.log('✅ Certificate generated, size:', certificateBuffer.length, 'bytes');

        // Upload certificate to R2 for permanent storage
        try {
          const { uploadToR2, generateFileKey } = await import('../utils/r2Storage.js');
          const certificateKey = generateFileKey('certificates', `orientation_${userId}_${Date.now()}.pdf`);
          await uploadToR2(certificateBuffer, certificateKey, 'application/pdf');
          
          // Update certificate URL to point to R2
          const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
          const finalCertificateUrl = R2_PUBLIC_URL 
            ? `${R2_PUBLIC_URL}/${certificateKey}`
            : `/api/uploads/${certificateKey}`;
          
          certificateGenerated = true;
          console.log('✅ Certificate generated and uploaded to R2:', certificateKey);
        } catch (uploadError: any) {
          console.warn('⚠️ Failed to upload certificate to R2, but certificate was generated:', uploadError.message);
          console.warn('⚠️ Certificate will be generated on-demand instead');
          // Continue with on-demand generation
        }
      } catch (certError: any) {
        console.error('❌ Error generating certificate during completion:', {
          message: certError.message,
          stack: certError.stack,
          name: certError.name,
          code: certError.code,
          userId: userId,
        });
        // Don't fail the completion if certificate generation fails
        // Certificate can still be generated on-demand later
      }
    }

    const completion = await prisma.orientationCompletion.upsert({
      where: { userId },
      update: {
        completedAt: completionDate,
        score,
        checklistData: checklistData || undefined,
        certificateUrl,
      },
      create: {
        userId,
        orientationId: orientation.id,
        completedAt: completionDate,
        score,
        checklistData: checklistData || undefined,
        certificateUrl,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'orientation_complete',
        resourceType: 'orientation',
        resourceId: orientation.id,
        details: { score, checklistData },
      },
    });

    res.json({ 
      completion, 
      certificateUrl,
      message: 'Orientation completed successfully! Your certificate is ready.' 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Generate certificate PDF
router.get('/certificate/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId!;

    // Users can only get their own certificate, or admins can get any
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (userId !== requestingUserId && requestingUser?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const completion = await prisma.orientationCompletion.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            country: true,
            department: true,
            role: true,
          },
        },
        orientation: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!completion) {
      return res.status(404).json({ message: 'Orientation not completed' });
    }

    // Get additional certificate data from query parameters
    const { passportId, country, department, role } = req.query;

    // Prepare user data for certificate (use query params if provided, otherwise use user data)
    const userData = {
      firstName: completion.user.firstName || 'User',
      lastName: completion.user.lastName || '',
      email: completion.user.email || '',
      passportId: (passportId as string) || undefined,
      country: (country as string) || completion.user.country || undefined,
      department: (department as string) || completion.user.department || undefined,
      role: (role as string) || completion.user.role || undefined,
    };
    
    // Validate required fields
    if (!userData.firstName || !userData.lastName) {
      return res.status(400).json({ 
        message: 'User first name and last name are required for certificate generation' 
      });
    }

    // Generate certificate PDF
    try {
      console.log('📜 Generating certificate for user:', userId, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passportId: userData.passportId,
        country: userData.country,
        department: userData.department,
      });

      const certificateBuffer = await generateOrientationCertificate(
        userData,
        completion.completedAt
      );

      if (!certificateBuffer || certificateBuffer.length === 0) {
        throw new Error('Certificate buffer is empty');
      }

      console.log('✅ Certificate generated successfully, size:', certificateBuffer.length, 'bytes');

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="INARA_Orientation_Certificate_${completion.user.firstName}_${completion.user.lastName}.pdf"`
      );
      res.setHeader('Content-Length', certificateBuffer.length.toString());

      res.send(certificateBuffer);
    } catch (genError: any) {
      console.error('❌ Certificate generation error:', {
        message: genError.message,
        stack: genError.stack,
        name: genError.name,
        code: genError.code,
        userId: userId,
      });
      
      // Provide more detailed error message
      const errorMessage = genError.message || 'Failed to generate certificate';
      const isPdfKitError = errorMessage.includes('PDFDocument') || errorMessage.includes('pdfkit');
      
      res.status(500).json({ 
        message: isPdfKitError 
          ? 'PDF generation library error. Please contact support.'
          : errorMessage,
        error: process.env.NODE_ENV === 'development' ? genError.stack : undefined,
      });
    }
  } catch (error: any) {
    console.error('Certificate endpoint error:', error);
    res.status(500).json({ message: error.message || 'An error occurred while processing your request.' });
  }
});

export default router;
