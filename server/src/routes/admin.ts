import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { detectCategory, detectCategoryFromPath, detectResourceType } from '../utils/categoryDetector.js';
// Lazy import to avoid module loading issues - will import dynamically when needed
import { buildCourseFromDocument, buildCourseFromText } from '../utils/academyCourseBuilder.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'server', 'public', 'uploads');
// Only create directories in development (not in Vercel/serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let type = 'library';
    if (req.body.type) {
      type = req.body.type;
    } else if (req.path?.includes('academy')) {
      type = 'academy';
    } else if (req.path?.includes('orientation')) {
      type = 'orientation';
    }
        const typeDir = path.join(uploadsDir, type);
        // Only create directories in development (not in Vercel/serverless)
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
          if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true });
          }
        }
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for large documents
});

// All admin routes require ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Work Systems Management
router.get('/work-systems', async (req: AuthRequest, res) => {
  try {
    const systems = await prisma.workSystem.findMany({
      include: {
        accessRules: true,
        _count: {
          select: { userAccess: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    res.json({ systems });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/work-systems', async (req: AuthRequest, res) => {
  try {
    const { name, url, description, icon, order } = req.body;

    const system = await prisma.workSystem.create({
      data: {
        name,
        url,
        description,
        icon,
        order: order || 0,
      },
    });

    res.status(201).json({ system });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/work-systems/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, icon, order, isActive } = req.body;

    const system = await prisma.workSystem.update({
      where: { id },
      data: {
        name,
        url,
        description,
        icon,
        order,
        isActive,
      },
    });

    res.json({ system });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/work-systems/:id/access-rules', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rules = await prisma.workSystemAccessRule.findMany({
      where: { workSystemId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ rules });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/work-systems/:id/access-rules', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      requiredTrainingIds,
      requiredPolicyIds,
      allowedRoles,
      allowedDepartments,
      allowedCountries,
    } = req.body;

    const rule = await prisma.workSystemAccessRule.create({
      data: {
        workSystemId: id,
        requiredTrainingIds: requiredTrainingIds || [],
        requiredPolicyIds: requiredPolicyIds || [],
        allowedRoles: allowedRoles || [],
        allowedDepartments: allowedDepartments || [],
        allowedCountries: allowedCountries || [],
      },
    });

    res.status(201).json({ rule });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/work-systems/:id/access-rules/:ruleId', async (req: AuthRequest, res) => {
  try {
    const { ruleId } = req.params;
    await prisma.workSystemAccessRule.delete({
      where: { id: ruleId },
    });
    res.json({ message: 'Access rule deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Training Management
router.get('/trainings', async (req: AuthRequest, res) => {
  try {
    const trainings = await prisma.training.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ trainings });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Upload course resources (PDFs, books, modules)
router.post('/academy/courses/:id/resources', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const { titles, descriptions, resourceTypes } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const titlesArray = titles ? JSON.parse(titles) : [];
    const descriptionsArray = descriptions ? JSON.parse(descriptions || '[]') : [];
    const typesArray = resourceTypes ? JSON.parse(resourceTypes) : [];

    const resources = await Promise.all(
      files.map(async (file, index) => {
        const resource = await prisma.courseResource.create({
          data: {
            trainingId: id,
            title: titlesArray[index] || file.originalname.replace(/\.[^/.]+$/, ''),
            description: descriptionsArray[index] || null,
            fileUrl: `/uploads/academy/resources/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: path.extname(file.originalname).substring(1).toLowerCase(),
            resourceType: typesArray[index] || 'module',
            order: index,
          },
        });
        return resource;
      })
    );

    res.status(201).json({
      resources,
      message: `Successfully uploaded ${resources.length} resource(s)`,
    });
  } catch (error: any) {
    console.error('Resource upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete course resource
router.delete('/academy/courses/:id/resources/:resourceId', async (req: AuthRequest, res) => {
  try {
    const { resourceId } = req.params;
    await prisma.courseResource.delete({
      where: { id: resourceId },
    });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Upload course with auto-conversion (INARA Academy)
router.post('/academy/upload-course', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const {
      courseType,
      courseDuration,
      isMandatory,
      category,
      validityPeriod,
      assignedTo,
      assignedRoles,
      assignedDepartments,
      assignedCountries,
    } = req.body;

    console.log('📚 Building course from document:', file.filename);

    // Build course structure from document
    const courseStructure = await buildCourseFromDocument(file.path, courseType || 'PROFESSIONAL_COURSE');

    // Create training record
    const training = await prisma.training.create({
      data: {
        title: courseStructure.title,
        description: courseStructure.description,
        content: JSON.stringify(courseStructure), // Required field - store course structure as JSON
        objectives: courseStructure.objectives,
        courseType: courseType || 'PROFESSIONAL_COURSE',
        courseDuration: courseDuration || 'SHORT_TERM',
        isMandatory: isMandatory === 'true' || isMandatory === true,
        isOptional: !(isMandatory === 'true' || isMandatory === true),
        category: category || undefined,
        validityPeriod: validityPeriod ? parseInt(validityPeriod) : null,
        assignedTo: assignedTo || 'GLOBAL',
        assignedRoles: assignedRoles ? JSON.parse(assignedRoles) : [],
        assignedDepartments: assignedDepartments ? JSON.parse(assignedDepartments) : [],
        assignedCountries: assignedCountries ? JSON.parse(assignedCountries) : [],
        sourceFileUrl: `/uploads/academy/${file.filename}`,
        autoGenerated: true,
        passingScore: courseStructure.finalExam.passingScore,
        quiz: courseStructure.finalExam,
        duration: courseStructure.lessons.length * 15, // Estimate: 15 min per lesson
        sections: {}, // Required Json field
        tags: [], // Required String[] field
      },
    });

    // Create lessons and slides
    for (const lessonData of courseStructure.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          trainingId: training.id,
          title: lessonData.title,
          order: lessonData.order,
          content: lessonData.content,
        },
      });

      for (const slideData of lessonData.slides) {
        const slide = await prisma.slide.create({
          data: {
            lessonId: lesson.id,
            title: slideData.title,
            content: slideData.content,
            order: slideData.order,
            slideType: slideData.slideType || 'content',
            mediaUrl: slideData.mediaUrl,
          },
        });

        // Create micro quiz if available
        if ((slideData as any).microQuiz) {
          const microQuiz = (slideData as any).microQuiz;
          await prisma.microQuiz.create({
            data: {
              slideId: slide.id,
              title: microQuiz.question || 'Quick Check',
              questions: [microQuiz], // Store as array for consistency
              passingScore: 70,
              isRequired: true,
            },
          });
        }
      }
    }

    console.log('✅ Course created successfully:', training.id);

    res.status(201).json({
      training,
      message: `Course "${courseStructure.title}" created successfully with ${courseStructure.lessons.length} lessons`,
    });
  } catch (error: any) {
    console.error('❌ Course upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate course from pasted text (INARA Academy)
router.post('/academy/generate-from-text', async (req: AuthRequest, res) => {
  try {
    const {
      textContent,
      courseType,
      courseDuration,
      isMandatory,
      category,
      validityPeriod,
      assignedTo,
      assignedRoles,
      assignedDepartments,
      assignedCountries,
    } = req.body;

    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ message: 'Text content is required' });
    }

    // Check word count
    const wordCount = textContent.trim().split(/\s+/).length;
    if (wordCount > 100000) {
      return res.status(400).json({ 
        message: `Text content exceeds maximum of 100,000 words (current: ${wordCount} words)` 
      });
    }

    console.log('📚 Building course from text content:', wordCount, 'words');

    // Build course structure from text
    const courseStructure = await buildCourseFromText(textContent, courseType || 'PROFESSIONAL_COURSE');

    // Create training record
    const training = await prisma.training.create({
      data: {
        title: courseStructure.title,
        description: courseStructure.description,
        content: JSON.stringify(courseStructure), // Required field - store course structure as JSON
        objectives: courseStructure.objectives,
        courseType: courseType || 'PROFESSIONAL_COURSE',
        courseDuration: courseDuration || 'SHORT_TERM',
        isMandatory: isMandatory === true || isMandatory === 'true',
        isOptional: !(isMandatory === true || isMandatory === 'true'),
        category: category || undefined,
        validityPeriod: validityPeriod ? parseInt(validityPeriod) : null,
        assignedTo: assignedTo || 'GLOBAL',
        assignedRoles: assignedRoles ? JSON.parse(assignedRoles || '[]') : [],
        assignedDepartments: assignedDepartments ? JSON.parse(assignedDepartments || '[]') : [],
        assignedCountries: assignedCountries ? JSON.parse(assignedCountries || '[]') : [],
        autoGenerated: true,
        passingScore: courseStructure.finalExam.passingScore,
        quiz: courseStructure.finalExam,
        duration: courseStructure.lessons.length * 15, // Estimate: 15 min per lesson
        sections: {}, // Required Json field
        tags: [], // Required String[] field
      },
    });

    // Create lessons and slides
    for (const lessonData of courseStructure.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          trainingId: training.id,
          title: lessonData.title,
          order: lessonData.order,
          content: lessonData.content,
        },
      });

      for (const slideData of lessonData.slides) {
        const slide = await prisma.slide.create({
          data: {
            lessonId: lesson.id,
            title: slideData.title,
            content: slideData.content,
            order: slideData.order,
            slideType: slideData.slideType || 'content',
            mediaUrl: slideData.mediaUrl,
          },
        });

        // Create micro quiz if available
        if ((slideData as any).microQuiz) {
          const microQuiz = (slideData as any).microQuiz;
          await prisma.microQuiz.create({
            data: {
              slideId: slide.id,
              title: microQuiz.question || 'Quick Check',
              questions: [microQuiz], // Store as array for consistency
              passingScore: 70,
              isRequired: true,
            },
          });
        }
      }
    }

    console.log('✅ Course created successfully from text:', training.id);

    res.status(201).json({
      training,
      message: `Course "${courseStructure.title}" created successfully with ${courseStructure.lessons.length} lessons from ${wordCount} words`,
    });
  } catch (error: any) {
    console.error('❌ Course generation from text error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Manual course creation (with lessons, slides, quizzes)
router.post('/academy/create-manual', async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      content,
      objectives,
      duration,
      passingScore,
      quiz,
      isMandatory,
      isOptional,
      category,
      subcategory,
      tags,
      sections,
      validityPeriod,
      courseType,
      courseDuration,
      lessons,
      finalExam,
    } = req.body;

    if (!title || !lessons || lessons.length === 0) {
      return res.status(400).json({ message: 'Title and at least one lesson are required' });
    }

    // Create training record
    const training = await prisma.training.create({
      data: {
        title,
        description: description || null,
        content: content || JSON.stringify({ lessons, finalExam }),
        objectives: objectives || [],
        duration: duration || 30,
        passingScore: passingScore || finalExam?.passingScore || 70,
        quiz: finalExam || quiz || { questions: [], passingScore: 70 },
        isMandatory: isMandatory || false,
        isOptional: isOptional !== undefined ? isOptional : !isMandatory,
        category: category || undefined,
        subcategory: subcategory || undefined,
        tags: tags || [],
        sections: sections || {},
        validityPeriod: validityPeriod ? parseInt(validityPeriod) : null,
        courseType: courseType || 'PROFESSIONAL_COURSE',
        courseDuration: courseDuration || 'SHORT_TERM',
        autoGenerated: false,
      },
    });

    // Create lessons and slides
    for (const lessonData of lessons) {
      if (!lessonData.title || !lessonData.slides || lessonData.slides.length === 0) {
        continue; // Skip invalid lessons
      }

      const lesson = await prisma.lesson.create({
        data: {
          trainingId: training.id,
          title: lessonData.title,
          content: lessonData.content || null,
          order: lessonData.order || 0,
        },
      });

      // Create slides for this lesson
      for (const slideData of lessonData.slides) {
        if (!slideData.title || !slideData.content) {
          continue; // Skip invalid slides
        }

        const slide = await prisma.slide.create({
          data: {
            lessonId: lesson.id,
            title: slideData.title,
            content: slideData.content,
            order: slideData.order || 0,
            slideType: slideData.slideType || 'content',
            mediaUrl: slideData.mediaUrl || null,
          },
        });

        // Create micro quiz if provided
        if (slideData.microQuiz && slideData.microQuiz.question) {
          await prisma.microQuiz.create({
            data: {
              slideId: slide.id,
              title: slideData.microQuiz.question,
              questions: [{
                question: slideData.microQuiz.question,
                options: slideData.microQuiz.options || ['', '', '', ''],
                correctAnswer: slideData.microQuiz.correctAnswer || 0,
                explanation: slideData.microQuiz.explanation || null,
              }],
              passingScore: 70,
              isRequired: true,
            },
          });
        }
      }
    }

    console.log('✅ Manual course created successfully:', training.id);

    res.status(201).json({
      training,
      message: `Course "${title}" created successfully with ${lessons.length} lesson(s)`,
    });
  } catch (error: any) {
    console.error('❌ Manual course creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/trainings', async (req: AuthRequest, res) => {
  try {
    const training = await prisma.training.create({
      data: req.body,
    });

    res.status(201).json({ training });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/trainings/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.training.delete({
      where: { id },
    });
    res.json({ message: 'Training deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/trainings/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const training = await prisma.training.update({
      where: { id },
      data: req.body,
    });

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Policy Management
router.get('/policies', async (req: AuthRequest, res) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ policies });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/policies', async (req: AuthRequest, res) => {
  try {
    const policy = await prisma.policy.create({
      data: req.body,
    });

    res.status(201).json({ policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/policies/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.policy.delete({
      where: { id },
    });
    res.json({ message: 'Policy deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/policies/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.policy.findUnique({ where: { id } });
    
    if (!existing) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Archive old version
    await prisma.policyVersion.create({
      data: {
        policyId: id,
        version: existing.version,
        content: existing.complete,
        effectiveDate: existing.effectiveDate,
      },
    });

    // Update policy with new version
    const policy = await prisma.policy.update({
      where: { id },
      data: {
        ...req.body,
        version: existing.version + 1,
      },
    });

    // Reset certifications for updated policy
    await prisma.policyCertification.updateMany({
      where: { policyId: id },
      data: {
        status: 'NOT_ACKNOWLEDGED',
        acknowledgedAt: null,
      },
    });

    res.json({ policy });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Library Management
router.get('/library', async (req: AuthRequest, res) => {
  try {
    const resources = await prisma.libraryResource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/library', async (req: AuthRequest, res) => {
  try {
    const resource = await prisma.libraryResource.create({
      data: req.body,
    });

    res.status(201).json({ resource });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/library/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.libraryResource.delete({
      where: { id },
    });
    res.json({ message: 'Library resource deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Template Management
router.get('/templates', async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/templates', async (req: AuthRequest, res) => {
  try {
    const template = await prisma.template.create({
      data: req.body,
    });

    res.status(201).json({ template });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/templates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.template.delete({
      where: { id },
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Import Endpoints
router.post('/library/bulk-import', upload.array('files', 50), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get folder paths from request body (multer parses form fields)
    // paths come as an array from FormData
    const paths = Array.isArray(req.body.paths) ? req.body.paths : 
                  typeof req.body.paths === 'string' ? [req.body.paths] : 
                  [];

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const folderPath = paths[i] || '';
      
      try {
        const fileName = file.originalname;
        const title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        
        // Use folder path for categorization if available, otherwise fall back to filename
        let categoryMatch;
        if (folderPath) {
          // Extract folder path (remove filename)
          const pathParts = folderPath.split('/');
          if (pathParts.length > 1) {
            const folderOnly = pathParts.slice(0, -1).join('/');
            categoryMatch = detectCategoryFromPath(folderOnly, 'library');
          } else {
            categoryMatch = detectCategory(fileName, 'library');
          }
        } else {
          categoryMatch = detectCategory(fileName, 'library');
        }
        
        const resourceType = detectResourceType(fileName);
        const fileUrl = `/uploads/library/${file.filename}`;
        
        // Ensure the file is moved to the correct location
        const targetDir = path.join(uploadsDir, 'library');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const targetPath = path.join(targetDir, file.filename);
        if (file.path !== targetPath && fs.existsSync(file.path)) {
          fs.renameSync(file.path, targetPath);
        }

        const resource = await prisma.libraryResource.create({
          data: {
            title,
            description: `Imported from ${fileName}`,
            fileUrl,
            resourceType,
            category: categoryMatch.category || null,
            subcategory: categoryMatch.subcategory || null,
            tags: [],
            isActive: true,
          },
        });

        results.push({
          fileName,
          success: true,
          resourceId: resource.id,
          category: categoryMatch.category,
          subcategory: categoryMatch.subcategory,
        });
      } catch (error: any) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/policies/bulk-import', upload.array('files', 50), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get folder paths from request body
    const paths = Array.isArray(req.body.paths) ? req.body.paths : 
                  req.body.paths ? [req.body.paths] : [];

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const folderPath = paths[i] || '';
      
      try {
        const fileName = file.originalname;
        const title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        
        // Use folder path for categorization if available, otherwise fall back to filename
        let categoryMatch;
        if (folderPath) {
          // Extract folder path (remove filename)
          const pathParts = folderPath.split('/');
          if (pathParts.length > 1) {
            const folderOnly = pathParts.slice(0, -1).join('/');
            categoryMatch = detectCategoryFromPath(folderOnly, 'policy');
          } else {
            categoryMatch = detectCategory(fileName, 'policy');
          }
        } else {
          categoryMatch = detectCategory(fileName, 'policy');
        }
        
        const fileUrl = `/uploads/policy/${file.filename}`;
        
        // Ensure the file is moved to the correct location
        const targetDir = path.join(uploadsDir, 'policy');
        // Only create directories in development (not in Vercel/serverless)
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
        }
        const targetPath = path.join(targetDir, file.filename);
        if (file.path !== targetPath && fs.existsSync(file.path)) {
          fs.renameSync(file.path, targetPath);
        }

        // Read file content if it's a text file (for brief/complete)
        let brief = `Policy: ${title}`;
        let complete = `Full policy content for ${title}. Please review and update.`;

        if (file.mimetype?.includes('text') || file.mimetype?.includes('pdf')) {
          // For PDFs, we'll just use the file URL
          brief = `Policy document: ${title}. Please review the attached file.`;
          complete = `See attached policy document: ${title}`;
        }

        const policy = await prisma.policy.create({
          data: {
            title,
            brief,
            complete,
            assessment: { questions: [], passingScore: 70 },
            version: 1,
            effectiveDate: new Date(),
            category: categoryMatch.category || null,
            subcategory: categoryMatch.subcategory || null,
            tags: [],
            isMandatory: false,
            isActive: true,
          },
        });

        results.push({
          fileName,
          success: true,
          policyId: policy.id,
          category: categoryMatch.category,
          subcategory: categoryMatch.subcategory,
        });
      } catch (error: any) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/templates/bulk-import', upload.array('files', 50), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get folder paths from request body
    const paths = Array.isArray(req.body.paths) ? req.body.paths : 
                  req.body.paths ? [req.body.paths] : [];

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const folderPath = paths[i] || '';
      
      try {
        const fileName = file.originalname;
        const title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        
        // Use folder path for categorization if available, otherwise fall back to filename
        let categoryMatch;
        if (folderPath) {
          // Extract folder path (remove filename)
          const pathParts = folderPath.split('/');
          if (pathParts.length > 1) {
            const folderOnly = pathParts.slice(0, -1).join('/');
            categoryMatch = detectCategoryFromPath(folderOnly, 'template');
          } else {
            categoryMatch = detectCategory(fileName, 'template');
          }
        } else {
          categoryMatch = detectCategory(fileName, 'template');
        }
        
        const fileUrl = `/uploads/template/${file.filename}`;
        
        // Ensure the file is moved to the correct location
        const targetDir = path.join(uploadsDir, 'template');
        // Only create directories in development (not in Vercel/serverless)
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
        }
        const targetPath = path.join(targetDir, file.filename);
        if (file.path !== targetPath && fs.existsSync(file.path)) {
          fs.renameSync(file.path, targetPath);
        }

        const template = await prisma.template.create({
          data: {
            title,
            description: `Template imported from ${fileName}`,
            fileUrl,
            category: categoryMatch.category || null,
            subcategory: categoryMatch.subcategory || null,
            tags: [],
            version: 1,
            approvalStatus: 'approved',
            isActive: true,
          },
        });

        results.push({
          fileName,
          success: true,
          templateId: template.id,
          category: categoryMatch.category,
          subcategory: categoryMatch.subcategory,
        });
      } catch (error: any) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// User Management
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsapp: true,
        role: true,
        department: true,
        country: true,
        city: true,
        address: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, whatsapp, role, department, country, city, address, clearance, isActive, password } = req.body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department === null ? undefined : department;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (clearance !== undefined) updateData.clearance = clearance;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        country: true,
        clearance: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Survey/Assessment/Test Management
router.get('/surveys', async (req: AuthRequest, res) => {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        analytics: true,
        _count: {
          select: { submissions: true },
        },
      },
    });
    res.json({ surveys });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/surveys', async (req: AuthRequest, res) => {
  try {
    const { category, tags, ...surveyData } = req.body;
    
    // Ensure category is properly formatted
    const formattedCategory = category ? String(category).trim() : null;
    
    // Ensure tags is an array
    const formattedTags = Array.isArray(tags) ? tags.filter(t => t && String(t).trim()) : [];
    
    // Ensure isActive is set (default to true if not provided)
    const isActive = surveyData.isActive !== undefined ? surveyData.isActive : true;
    
    // Ensure assignedTo has a default value
    const assignedTo = surveyData.assignedTo || 'GLOBAL';
    
    const survey = await prisma.survey.create({
      data: {
        ...surveyData,
        isActive,
        assignedTo,
        category: formattedCategory,
        tags: formattedTags,
        createdBy: req.userId,
      },
    });

    console.log('✅ Survey created:', {
      id: survey.id,
      title: survey.title,
      category: survey.category,
      tags: survey.tags,
    });

    res.status(201).json({ survey });
  } catch (error: any) {
    console.error('❌ Error creating survey:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/surveys/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const survey = await prisma.survey.update({
      where: { id },
      data: req.body,
    });

    res.json({ survey });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/surveys/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.survey.delete({
      where: { id },
    });

    res.json({ message: 'Survey deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/surveys/:id/submissions', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const submissions = await prisma.surveySubmission.findMany({
      where: { surveyId: id },
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
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Upload document and generate test
router.post('/surveys/upload-document', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📤 File received:', {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    });

    const fileName = file.originalname;
    const title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const fileUrl = `/uploads/surveys/${file.filename}`;

    // Detect category from filename
    const categoryMatch = detectCategory(fileName, 'policy');
    const detectedCategory = categoryMatch.category || 'General';
    
    // Generate questions using AI from PDF content
    let questions: any[] = [];
    let extractedText = '';
    // Question count will be calculated automatically based on content length (10-30)

    try {
      // Only process PDF files for now
      const isPDF = file.mimetype === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      
      if (isPDF) {
        // The file is already saved by multer, so the path should be where multer saved it
        // Multer saves to: uploadsDir/type/filename
        // Since we set type='surveys' in the form, it should be in uploadsDir/surveys/filename
        // But multer might save it differently, let's check the actual file location
        const possiblePaths = [
          path.join(uploadsDir, 'surveys', file.filename),
          path.join(uploadsDir, file.filename),
          file.path, // Use multer's saved path directly
        ];
        
        let pdfPath = '';
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            pdfPath = possiblePath;
            break;
          }
        }
        
        if (!pdfPath) {
          // Try to use multer's path property
          pdfPath = file.path || path.join(uploadsDir, 'surveys', file.filename);
          console.log('⚠️ File path not verified, using:', pdfPath);
        }
        
        // Verify file exists
        if (!fs.existsSync(pdfPath)) {
          console.error('❌ File not found. Tried paths:', possiblePaths);
          throw new Error(`PDF file not found. Please check server logs for details.`);
        }

        console.log('🤖 Generating AI-powered questions from PDF...');
        console.log('📁 PDF path:', pdfPath);
        
        // Lazy import to avoid module loading issues
        const { generateQuestionsFromPDF } = await import('../utils/aiQuestionGenerator.js');
        const result = await generateQuestionsFromPDF(pdfPath); // Auto-calculate question count
        questions = result.questions;
        extractedText = result.extractedText;
        
        console.log('✅ AI questions generated:', {
          count: questions.length,
          firstQuestion: questions[0]?.question?.substring(0, 100),
        });
      } else {
        // For non-PDF files, generate template questions
        console.log('⚠️ Non-PDF file, generating template questions...');
        const baseId = Date.now();
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            id: `q-${baseId}-${i}`,
            type: 'multiple_choice',
            question: `Question ${i + 1}: Based on the document "${title}", which of the following best describes a key concept or principle?`,
            required: true,
            options: [
              'A key principle that ensures effective implementation',
              'A guideline that promotes best practices',
              'A standard that maintains quality',
              'A requirement that ensures compliance',
            ],
            correctAnswer: 'A key principle that ensures effective implementation',
            points: 1,
            order: i + 1,
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error generating questions:', error);
      console.error('Error stack:', error.stack);
      
      // Fallback to template questions if AI generation fails
      console.log('🔄 Falling back to template questions...');
      const baseId = Date.now();
      for (let i = 0; i < numQuestions; i++) {
        questions.push({
          id: `q-${baseId}-${i}`,
          type: 'multiple_choice',
          question: `Question ${i + 1}: Based on the document "${title}", which of the following best describes a key concept?`,
          required: true,
          options: [
            'A key principle that ensures effective implementation',
            'A guideline that promotes best practices',
            'A standard that maintains quality',
            'A requirement that ensures compliance',
          ],
          correctAnswer: 'A key principle that ensures effective implementation',
          points: 1,
          order: i + 1,
        });
      }
    }

    console.log('📄 Document upload response:', {
      title,
      category: detectedCategory,
      questionsCount: questions.length,
      firstQuestion: questions[0]?.question?.substring(0, 100),
    });

    res.json({
      title,
      fileUrl,
      category: detectedCategory,
      questions,
      extractedText,
      message: `Document uploaded successfully. ${questions.length} questions generated. Please review and update them.`,
    });
  } catch (error: any) {
    console.error('❌ Upload endpoint error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to process document',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Generate questions from pasted text
router.post('/surveys/generate-from-text', async (req: AuthRequest, res) => {
  try {
    const { text, numQuestions } = req.body; // numQuestions is optional, will be auto-calculated

    if (!text || typeof text !== 'string' || text.trim().length < 100) {
      return res.status(400).json({ 
        message: 'Text content is required and must be at least 100 characters long.' 
      });
    }

    console.log('📝 Generating questions from pasted text, length:', text.length);

    // Use the AI question generator with the pasted text
    const { generateQuestionsWithAI } = await import('../utils/aiQuestionGenerator.js');
    const questions = await generateQuestionsWithAI(text, numQuestions);

    // Detect category from text content
    const categoryMatch = detectCategory(text.substring(0, 200), 'policy');
    const detectedCategory = categoryMatch.category || 'General';

    console.log('✅ Questions generated from text:', {
      count: questions.length,
      category: detectedCategory,
    });

    res.json({
      title: 'Test from Document Content',
      category: detectedCategory,
      questions,
      message: `Successfully generated ${questions.length} questions from the pasted content.`,
    });
  } catch (error: any) {
    console.error('❌ Error generating questions from text:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate questions from text',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// INARA Academy - Track Management (Diploma/Leadership Tracks)

// Get all tracks
router.get('/academy/tracks', async (req: AuthRequest, res) => {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            courseType: true,
            isActive: true,
            trackOrder: true,
          },
          orderBy: { trackOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tracks });
  } catch (error: any) {
    console.error('Get tracks error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create track
router.post('/academy/tracks', async (req: AuthRequest, res) => {
  try {
    const { name, description, type, courses } = req.body;

    if (!name || !type || !courses || courses.length === 0) {
      return res.status(400).json({ message: 'Name, type, and at least one course are required' });
    }

    // Create track
    const track = await prisma.track.create({
      data: {
        name,
        description: description || null,
        type,
      },
    });

    // Assign courses to track with order
    await Promise.all(
      courses.map((courseId: string, index: number) =>
        prisma.training.update({
          where: { id: courseId },
          data: {
            trackId: track.id,
            trackOrder: index,
          },
        })
      )
    );

    const updatedTrack = await prisma.track.findUnique({
      where: { id: track.id },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            courseType: true,
            isActive: true,
            trackOrder: true,
          },
          orderBy: { trackOrder: 'asc' },
        },
      },
    });

    res.status(201).json({ track: updatedTrack, message: 'Track created successfully' });
  } catch (error: any) {
    console.error('Create track error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update track
router.put('/academy/tracks/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, courses } = req.body;

    // First, remove all courses from this track
    await prisma.training.updateMany({
      where: { trackId: id },
      data: { trackId: null, trackOrder: null },
    });

    // Update track
    const track = await prisma.track.update({
      where: { id },
      data: {
        name,
        description: description || null,
        type,
      },
    });

    // Assign new courses to track with order
    if (courses && courses.length > 0) {
      await Promise.all(
        courses.map((courseId: string, index: number) =>
          prisma.training.update({
            where: { id: courseId },
            data: {
              trackId: track.id,
              trackOrder: index,
            },
          })
        )
      );
    }

    const updatedTrack = await prisma.track.findUnique({
      where: { id: track.id },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            courseType: true,
            isActive: true,
            trackOrder: true,
          },
          orderBy: { trackOrder: 'asc' },
        },
      },
    });

    res.json({ track: updatedTrack, message: 'Track updated successfully' });
  } catch (error: any) {
    console.error('Update track error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete track
router.delete('/academy/tracks/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Remove all courses from this track first
    await prisma.training.updateMany({
      where: { trackId: id },
      data: { trackId: null, trackOrder: null },
    });

    // Delete track
    await prisma.track.delete({
      where: { id },
    });

    res.json({ message: 'Track deleted successfully' });
  } catch (error: any) {
    console.error('Delete track error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========== ORIENTATION MANAGEMENT ==========

// Get all orientations
router.get('/orientations', async (req: AuthRequest, res) => {
  try {
    const orientations = await prisma.orientation.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            completions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orientations });
  } catch (error: any) {
    console.error('Get orientations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single orientation
router.get('/orientations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orientation = await prisma.orientation.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!orientation) {
      return res.status(404).json({ message: 'Orientation not found' });
    }

    res.json({ orientation });
  } catch (error: any) {
    console.error('Get orientation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create orientation
router.post('/orientations', async (req: AuthRequest, res) => {
  try {
    const { title, content, sections, pdfFiles, isActive } = req.body;

    // Get the latest version
    const latestOrientation = await prisma.orientation.findFirst({
      orderBy: { version: 'desc' },
    });
    const nextVersion = latestOrientation ? latestOrientation.version + 1 : 1;

    const orientation = await prisma.orientation.create({
      data: {
        title,
        content: content || '',
        sections: sections || {},
        pdfFiles: pdfFiles || null,
        isActive: isActive !== undefined ? isActive : true,
        version: nextVersion,
      },
    });

    res.status(201).json({ orientation });
  } catch (error: any) {
    console.error('Create orientation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update orientation
router.put('/orientations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, sections, pdfFiles, isActive } = req.body;

    const orientation = await prisma.orientation.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(sections && { sections }),
        ...(pdfFiles !== undefined && { pdfFiles }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ orientation });
  } catch (error: any) {
    console.error('Update orientation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete orientation
router.delete('/orientations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if there are completions
    const completions = await prisma.orientationCompletion.count({
      where: { orientationId: id },
    });

    if (completions > 0) {
      return res.status(400).json({
        message: `Cannot delete orientation with ${completions} completion(s). Deactivate it instead.`,
      });
    }

    await prisma.orientation.delete({
      where: { id },
    });

    res.json({ message: 'Orientation deleted successfully' });
  } catch (error: any) {
    console.error('Delete orientation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create orientation step
router.post('/orientations/:id/steps', upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { stepNumber, title, description, content, policyId, questions, isRequired, order } = req.body;

    // Get the next step number if not provided
    let finalStepNumber = stepNumber;
    if (!finalStepNumber) {
      const lastStep = await prisma.orientationStep.findFirst({
        where: { orientationId: id },
        orderBy: { stepNumber: 'desc' },
      });
      finalStepNumber = lastStep ? lastStep.stepNumber + 1 : 1;
    }

    // Handle PDF upload
    let pdfUrl = null;
    if (req.file) {
      pdfUrl = `/uploads/orientation/${req.file.filename}`;
    }

    // Parse questions if provided as string
    let parsedQuestions = null;
    if (questions) {
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      } catch {
        parsedQuestions = questions;
      }
    }

    const step = await prisma.orientationStep.create({
      data: {
        orientationId: id,
        stepNumber: finalStepNumber,
        title,
        description: description || null,
        content: content || null,
        pdfUrl: pdfUrl || null,
        policyId: policyId || null,
        questions: parsedQuestions || null,
        isRequired: isRequired !== undefined ? isRequired : true,
        order: order !== undefined ? order : finalStepNumber - 1,
      },
    });

    res.status(201).json({ step });
  } catch (error: any) {
    console.error('Create orientation step error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update orientation step
router.put('/orientations/:id/steps/:stepId', upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    const { id, stepId } = req.params;
    const { stepNumber, title, description, content, policyId, questions, isRequired, order, removePdf } = req.body;

    // Handle PDF upload or removal
    let pdfUrl = undefined;
    if (req.file) {
      pdfUrl = `/uploads/orientation/${req.file.filename}`;
    } else if (removePdf === 'true') {
      pdfUrl = null;
    }

    // Parse questions if provided as string
    let parsedQuestions = undefined;
    if (questions !== undefined) {
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      } catch {
        parsedQuestions = questions;
      }
    }

    const step = await prisma.orientationStep.update({
      where: { id: stepId },
      data: {
        ...(stepNumber && { stepNumber: parseInt(stepNumber) }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(policyId !== undefined && { policyId: policyId || null }),
        ...(parsedQuestions !== undefined && { questions: parsedQuestions }),
        ...(isRequired !== undefined && { isRequired }),
        ...(order !== undefined && { order: parseInt(order) }),
      },
    });

    res.json({ step });
  } catch (error: any) {
    console.error('Update orientation step error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete orientation step
router.delete('/orientations/:id/steps/:stepId', async (req: AuthRequest, res) => {
  try {
    const { stepId } = req.params;

    await prisma.orientationStep.delete({
      where: { id: stepId },
    });

    res.json({ message: 'Step deleted successfully' });
  } catch (error: any) {
    console.error('Delete orientation step error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload orientation resource/document
router.post('/orientations/:id/resources', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get current orientation to update pdfFiles
    const orientation = await prisma.orientation.findUnique({
      where: { id },
    });

    if (!orientation) {
      return res.status(404).json({ message: 'Orientation not found' });
    }

    // Prepare file metadata
    const uploadedFiles = files.map((file) => ({
      url: `/uploads/orientation/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    // Merge with existing pdfFiles
    const existingFiles = orientation.pdfFiles ? (orientation.pdfFiles as any[]) : [];
    const updatedFiles = [...existingFiles, ...uploadedFiles];

    // Update orientation with new files
    await prisma.orientation.update({
      where: { id },
      data: {
        pdfFiles: updatedFiles,
      },
    });

    res.json({ files: uploadedFiles, message: 'Files uploaded successfully' });
  } catch (error: any) {
    console.error('Upload orientation resources error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete orientation resource
router.delete('/orientations/:id/resources', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { filename } = req.body;

    const orientation = await prisma.orientation.findUnique({
      where: { id },
    });

    if (!orientation) {
      return res.status(404).json({ message: 'Orientation not found' });
    }

    // Remove file from pdfFiles array
    const existingFiles = orientation.pdfFiles ? (orientation.pdfFiles as any[]) : [];
    const updatedFiles = existingFiles.filter((file: any) => file.filename !== filename);

    // Also delete from file system
    if (filename) {
      const filePath = path.join(uploadsDir, 'orientation', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.orientation.update({
      where: { id },
      data: {
        pdfFiles: updatedFiles,
      },
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('Delete orientation resource error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

