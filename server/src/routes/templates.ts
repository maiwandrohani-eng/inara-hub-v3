import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import * as path from 'path';
import * as fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, search } = req.query;

    const where: any = { isActive: true, approvalStatus: 'approved' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { lastUpdated: 'desc' },
      include: {
        _count: {
          select: { downloads: true },
        },
      },
    });

    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Download template file (MUST come before /:id route)
router.get('/:id/download', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('📥 Download request for template:', id);

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      console.error('❌ Template not found:', id);
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.fileUrl) {
      console.error('❌ Template has no fileUrl:', id);
      return res.status(404).json({ message: 'Template file not available' });
    }

    console.log('📁 Template fileUrl:', template.fileUrl);

    // Get presigned URL from R2 or redirect to public URL
    const { getPresignedUrl } = await import('../utils/r2Storage.js');
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    
    // Extract key from template URL
    const key = template.fileUrl.replace(/^\/uploads\//, '').replace(/^https?:\/\/[^\/]+\//, '');
    
    // Track download
    try {
      await prisma.templateDownload.create({
        data: {
          userId,
          templateId: id,
        },
      });
    } catch (dbError: any) {
      // Log but don't fail the download if tracking fails
      console.warn('⚠️ Failed to track download:', dbError.message);
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'template_download',
          resourceType: 'template',
          resourceId: id,
        },
      });
    } catch (logError: any) {
      // Log but don't fail the download if logging fails
      console.warn('⚠️ Failed to log activity:', logError.message);
    }

    // Redirect to R2 file
    if (R2_PUBLIC_URL) {
      // Redirect to public URL
      return res.redirect(302, `${R2_PUBLIC_URL}/${key}`);
    } else {
      // Generate presigned URL
      const presignedUrl = await getPresignedUrl(key, 3600); // 1 hour expiry
      return res.redirect(302, presignedUrl);
    }
  } catch (error: any) {
    console.error('❌ Error downloading template:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || 'Failed to download template' });
    }
  }
});

// Get single template (MUST come after /:id/download route)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get most used templates
router.get('/analytics/most-used', authenticate, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true, approvalStatus: 'approved' },
      include: {
        _count: {
          select: { downloads: true },
        },
      },
      orderBy: {
        downloads: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

