import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    department?: string;
    country?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        country: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department ? String(user.department) : undefined,
      country: user.country || undefined,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Enhanced debugging
    console.log('[Authorization] Middleware called:', {
      path: req.path,
      method: req.method,
      hasUser: !!req.user,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      requiredRoles: roles,
    });

    if (!req.user) {
      console.error('[Authorization] No user object found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Debug: Log role comparison with detailed type checking
    const userRole = req.user.role;
    const roleMatch = roles.includes(userRole);
    
    // Additional check: compare string values (in case of type mismatch)
    const roleMatchString = roles.some(r => String(r) === String(userRole));
    
    console.log('[Authorization] Role check:', {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: userRole,
      userRoleString: String(userRole),
      userRoleType: typeof userRole,
      requiredRoles: roles,
      requiredRolesStrings: roles.map(r => String(r)),
      requiredRolesTypes: roles.map(r => typeof r),
      roleMatch,
      roleMatchString,
      path: req.path,
      method: req.method,
    });

    if (!roleMatch && !roleMatchString) {
      console.error('[Authorization] Access denied:', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: userRole,
        userRoleString: String(userRole),
        userRoleType: typeof userRole,
        requiredRoles: roles,
        requiredRolesStrings: roles.map(r => String(r)),
        roleMatch,
        roleMatchString,
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: userRole,
        userRoleType: typeof userRole,
        userId: req.user.id,
        userEmail: req.user.email,
        detail: `This action requires one of the following roles: ${roles.join(', ')}. Your current role is: ${userRole} (type: ${typeof userRole})`
      });
    }

    console.log('[Authorization] Access granted');
    next();
  };
};

