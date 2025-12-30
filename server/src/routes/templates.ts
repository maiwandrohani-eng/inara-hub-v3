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

    // Get file path (fileUrl is like /uploads/template/filename.pdf)
    // Remove leading slash if present
    const cleanUrl = template.fileUrl.startsWith('/') ? template.fileUrl.slice(1) : template.fileUrl;
    const filePath = path.join(process.cwd(), 'server', 'public', cleanUrl);
    
    console.log('📂 Resolved file path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found at path:', filePath);
      return res.status(404).json({ message: 'Template file not found on server' });
    }

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

    // Get file extension for proper content type
    const ext = path.extname(template.fileUrl).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Clean filename: remove any existing extension from title, replace non-alphanumeric with underscore,
    // remove trailing underscores, then add the correct extension
    let cleanTitle = template.title.trim();
    
    console.log('📝 Original title:', cleanTitle);
    console.log('📝 File extension from URL:', ext);
    
    // Remove any existing file extension from the title (case-insensitive)
    // Check for extensions at the end of the string (with optional spaces before)
    const commonExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.ppt', '.pptx'];
    for (const extension of commonExtensions) {
      const lowerTitle = cleanTitle.toLowerCase();
      const lowerExt = extension.toLowerCase();
      if (lowerTitle.endsWith(lowerExt)) {
        cleanTitle = cleanTitle.slice(0, -extension.length).trim();
        console.log('📝 After removing extension:', cleanTitle);
        break;
      }
    }
    
    // Replace ALL non-alphanumeric characters (including parentheses, brackets, etc.) with underscore
    let fileName = cleanTitle.replace(/[^a-z0-9]/gi, '_');
    console.log('📝 After replacing non-alphanumeric:', fileName);
    
    // Remove multiple consecutive underscores
    fileName = fileName.replace(/_+/g, '_');
    console.log('📝 After removing consecutive underscores:', fileName);
    
    // Remove leading and trailing underscores (do this multiple times to be sure)
    fileName = fileName.replace(/^_+/g, ''); // Remove leading
    fileName = fileName.replace(/_+$/g, ''); // Remove trailing
    fileName = fileName.replace(/^_+/g, ''); // Remove leading again (in case first pass missed some)
    fileName = fileName.replace(/_+$/g, ''); // Remove trailing again
    console.log('📝 After removing leading/trailing underscores:', fileName);
    
    // Ensure we have a valid filename (if empty after cleaning, use a default)
    if (!fileName || fileName.length === 0) {
      fileName = 'template';
      console.log('📝 Using default filename');
    }
    
    // CRITICAL: One final check - remove ANY trailing underscores before adding extension
    fileName = fileName.replace(/_+$/, '');
    console.log('📝 Final clean before adding extension:', fileName);
    
    // Add the correct extension (without any underscore)
    fileName = fileName + ext;
    console.log('📝 After adding extension:', fileName);
    
    // Final safety check: remove any underscores that might be between the name and extension
    // This regex finds underscores immediately before the extension and removes them
    fileName = fileName.replace(/_+(\.[^.]+)$/, '$1');
    console.log('📝 Final filename after all cleaning:', fileName);

    // Set headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    console.log('✅ Sending file:', fileName, 'Content-Type:', contentType);

    // Send file with absolute path
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to send file: ' + err.message });
        }
      } else {
        console.log('✅ File sent successfully');
      }
    });
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

