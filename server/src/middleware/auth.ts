import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { verifySessionToken, COOKIE_NAME } from '../utils/auth';
import { User, Role } from '../../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
        });

        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
    next();
  } catch (err) {
    console.error('authenticateSession error:', err);
    next();
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      next();
      return;
    }

    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
}

export function gatePasswordChange(req: Request, res: Response, next: NextFunction): void {
  if (req.user && req.user.mustChangePassword) {
    const allowedPrefixes = [
      '/api/auth/change-password',
      '/api/auth/me',
      '/api/auth/logout',
    ];

    const currentPath = req.originalUrl || req.path;
    const isAllowed = allowedPrefixes.some((p) => currentPath.startsWith(p));

    if (!isAllowed) {
      res.status(403).json({
        error: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
      return;
    }
  }

  next();
}

