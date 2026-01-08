import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { multerR2, uploadFilesToR2 } from '../utils/multerR2Storage.js';

const router = express.Router();
const prisma = new PrismaClient();

// Use R2-based multer
const marketUpload = multerR2;

// Submit idea
router.post('/submit', authenticate, marketUpload.array('attachments', 10), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const files = req.files as Express.Multer.File[];
    
    // Get form fields from req.body
    const {
      fullName,
      jobTitle,
      countryOffice,
      department,
      email,
      phone,
      whatsapp,
      title,
      ideaType,
      problemNeed,
      proposedSolution,
      beneficiaries,
      estimatedImpact,
      estimatedCost,
      fundingPotential,
      urgency,
      leadershipInterest,
      declarationConfirmed,
    } = req.body;

    // Handle beneficiaries array (can come as array or comma-separated string)
    let beneficiariesArray: string[] = [];
    if (Array.isArray(beneficiaries)) {
      beneficiariesArray = beneficiaries;
    } else if (typeof beneficiaries === 'string') {
      // Handle if sent as JSON string or comma-separated
      try {
        beneficiariesArray = JSON.parse(beneficiaries);
      } catch {
        beneficiariesArray = beneficiaries.split(',').map((b: string) => b.trim()).filter(Boolean);
      }
    }

    // Process uploaded files - upload to R2
    const attachmentUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadedFiles = await uploadFilesToR2(files, 'market');
      uploadedFiles.forEach((uploadedFile) => {
        if (uploadedFile.success && uploadedFile.url) {
          attachmentUrls.push(uploadedFile.url);
        }
      });
    }

    const submission = await prisma.marketSubmission.create({
      data: {
        userId,
        // SECTION 1 - Staff Information
        fullName: fullName || undefined,
        jobTitle: jobTitle || undefined,
        countryOffice: countryOffice || undefined,
        department: department || undefined,
        email: email || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        // SECTION 2 - Idea Title
        title,
        // SECTION 3 - Idea Type
        ideaType: ideaType || undefined,
        // SECTION 4 - Problem / Need Identified
        problemNeed: problemNeed || undefined,
        // SECTION 5 - Proposed Solution
        proposedSolution: proposedSolution || undefined,
        // SECTION 6 - Beneficiaries
        beneficiaries: beneficiariesArray,
        // SECTION 7 - Estimated Impact
        estimatedImpact: estimatedImpact || undefined,
        // SECTION 8 - Estimated Cost
        estimatedCost: estimatedCost || undefined,
        // SECTION 9 - Funding Potential
        fundingPotential: fundingPotential || undefined,
        // SECTION 10 - Urgency
        urgency: urgency || undefined,
        // SECTION 11 - Leadership Interest
        leadershipInterest: leadershipInterest || undefined,
        // SECTION 12 - Attachments
        attachments: attachmentUrls,
        // SECTION 13 - Declaration
        declarationConfirmed: declarationConfirmed === 'true' || declarationConfirmed === true,
        // Status
        status: 'NEW',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'market_submit',
        resourceType: 'market',
        resourceId: submission.id,
      },
    });

    res.status(201).json({ submission, message: 'Innovation & Improvement Proposal submitted successfully' });
  } catch (error: any) {
    console.error('Market submission error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get my submissions
router.get('/my-submissions', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const submissions = await prisma.marketSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all submissions (reviewers only)
router.get('/all', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const submissions = await prisma.marketSubmission.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Review submission
router.post('/:id/review', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { 
      status, 
      reviewScore, 
      internalNotes, 
      bonusApproved, 
      bonusAmount,
      assignedReviewer 
    } = req.body;

    const updateData: any = {
      status,
      reviewerId: userId,
      reviewedAt: new Date(),
    };

    if (reviewScore !== undefined && reviewScore !== null && reviewScore !== '') {
      updateData.reviewScore = parseInt(reviewScore);
    }
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }
    if (assignedReviewer !== undefined) {
      updateData.assignedReviewer = assignedReviewer;
    }
    if (bonusApproved === true || bonusApproved === 'Yes' || bonusApproved === 'true') {
      updateData.bonusApproved = true;
      if (bonusAmount) {
        updateData.bonusAmount = parseFloat(bonusAmount);
      }
    } else {
      updateData.bonusApproved = false;
      updateData.bonusAmount = null;
    }

    const submission = await prisma.marketSubmission.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'market_review',
        resourceType: 'market',
        resourceId: id,
        details: { status, reviewScore: updateData.reviewScore },
      },
    });

    res.json({ submission, message: 'Review submitted successfully' });
  } catch (error: any) {
    console.error('Market review error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete submission (admin only)
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.marketSubmission.delete({
      where: { id },
    });
    res.json({ message: 'Market submission deleted successfully' });
  } catch (error: any) {
    console.error('Delete market submission error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Export submissions (for reports)
router.get('/export', authenticate, authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD), async (req: AuthRequest, res) => {
  try {
    const { status, format } = req.query;
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const submissions = await prisma.marketSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'ID', 'Title', 'Idea Type', 'Full Name', 'Email', 'Department', 'Country',
        'Status', 'Review Score', 'Bonus Approved', 'Bonus Amount', 'Created At'
      ];
      const csvRows = submissions.map((s) => [
        s.id,
        s.title,
        s.ideaType || '',
        s.fullName || `${s.user.firstName} ${s.user.lastName}`,
        s.email || s.user.email,
        s.department || s.user.department || '',
        s.countryOffice || s.user.country || '',
        s.status,
        s.reviewScore || '',
        s.bonusApproved ? 'Yes' : 'No',
        s.bonusAmount || '',
        s.createdAt.toISOString(),
      ]);

      const csv = [csvHeaders, ...csvRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="market-submissions-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({ submissions });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

