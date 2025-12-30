import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all configurations by type (public endpoint for sign-up forms)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const configs = await prisma.systemConfig.findMany({
      where: { type, isActive: true },
      orderBy: { order: 'asc' },
    });
    res.json({ configs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all configurations (admin only)
router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });
    res.json({ configs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create configuration (admin only)
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { type, key, value, description, order, metadata } = req.body;

    // Check if configuration already exists
    const existing = await prisma.systemConfig.findUnique({
      where: {
        type_key: {
          type,
          key,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ 
        message: `Configuration with type "${type}" and key "${key}" already exists. Use update instead.` 
      });
    }

    const config = await prisma.systemConfig.create({
      data: {
        type,
        key,
        value,
        description,
        order: order || 0,
        metadata: metadata || {},
      },
    });

    res.status(201).json({ config });
  } catch (error: any) {
    // Handle unique constraint error more gracefully
    if (error.code === 'P2002' && error.meta?.target?.includes('type') && error.meta?.target?.includes('key')) {
      return res.status(400).json({ 
        message: `Configuration with type "${req.body.type}" and key "${req.body.key}" already exists. Use update instead.` 
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update configuration (admin only)
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { key, value, description, order, isActive, metadata } = req.body;

    const config = await prisma.systemConfig.update({
      where: { id },
      data: {
        key,
        value,
        description,
        order,
        isActive,
        metadata,
      },
    });

    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete configuration (admin only)
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.systemConfig.delete({
      where: { id },
    });
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

