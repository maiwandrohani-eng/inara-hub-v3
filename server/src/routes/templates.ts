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

    // Extract key from template URL
    // Handle different URL formats:
    // - /uploads/templates/... -> templates/...
    // - https://hub.inara.ngo/templates/... -> templates/...
    // - templates/... -> templates/...
    let key = template.fileUrl;
    if (key.startsWith('/uploads/')) {
      key = key.replace('/uploads/', '');
    } else if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch {
        // Invalid URL, try to extract key directly
        key = key.replace(/^https?:\/\/[^\/]+\//, '');
      }
    }
    
    console.log('📦 Extracted R2 key:', key);

    // Track download (do this before streaming to ensure it's tracked even if stream fails)
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

    // Stream file directly from R2 instead of redirecting
    // This ensures the file is downloaded properly and not HTML
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getR2Client } = await import('../utils/r2Storage.js');
      
      const s3Client = getR2Client();
      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      // Set appropriate headers
      const contentType = response.ContentType || 'application/octet-stream';
      const contentLength = response.ContentLength || 0;
      const contentDisposition = `attachment; filename="${template.title}${key.match(/\.[0-9a-z]+$/i)?.[0] || ''}"`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', contentLength.toString());
      res.setHeader('Content-Disposition', contentDisposition);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      
      // Stream the file
      if (response.Body) {
        // @ts-ignore - Body is a stream
        const stream = response.Body as any;
        return stream.pipe(res);
      } else {
        return res.status(500).json({ message: 'File body is empty' });
      }
    } catch (streamError: any) {
      console.error('❌ Error streaming template file:', streamError);
      // Fallback: try redirecting to presigned URL
      try {
        const { getPresignedUrl } = await import('../utils/r2Storage.js');
        const presignedUrl = await getPresignedUrl(key, 3600);
        return res.redirect(302, presignedUrl);
      } catch (presignError: any) {
        console.error('❌ Error generating presigned URL:', presignError);
        return res.status(500).json({ message: 'Failed to download template file' });
      }
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

