import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Create Prisma Client instance with error handling
let prisma: PrismaClient;
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  console.log('✅ Prisma Client created in auth routes');
} catch (error: any) {
  console.error('❌ Failed to create Prisma Client in auth routes:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  throw error;
}

// Public Sign-up (creates pending user, requires admin approval)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, whatsapp, role, department, country, city, address } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Validate password strength
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with isActive: false (pending approval)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        whatsapp,
        role: role || 'STAFF',
        department,
        country,
        city,
        address,
        isActive: false, // Pending admin approval
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        country: true,
        phone: true,
        isActive: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'signup',
        details: { email: user.email, status: 'pending_approval' },
      },
    });

    res.status(201).json({
      message: 'Account created successfully! Your account is pending admin approval. You will be notified once approved.',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Register (Admin only - creates active user immediately)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, whatsapp, role, department, country, city, address } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        whatsapp,
        role: role || 'STAFF',
        department,
        country,
        city,
        address,
        isActive: true, // Admin-created users are active immediately
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        country: true,
        phone: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'register',
        details: { email: user.email },
      },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt for:', email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      console.log('Login failed: User not found or inactive');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log activity (don't fail if this fails)
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    console.log('Login successful for:', email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        country: user.country,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // Return error details in production for debugging (remove sensitive info later)
    res.status(500).json({ 
      message: error.message || 'Login failed',
      error: error.message,
      code: error.code,
      name: error.name,
      // Only include stack in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        country: true,
        clearance: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

