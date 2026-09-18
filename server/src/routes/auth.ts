import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import {
  validatePasswordComplexity,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from '../utils/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Prevent account enumeration: return identical generic 401 for unknown email or inactive account
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setSessionCookie(res, token);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req: Request, res: Response): void => {
  clearSessionCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = req.user!;
  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'Current password, new password, and confirmation are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match' });
      return;
    }

    if (newPassword === currentPassword) {
      res.status(400).json({ error: 'New password must be different from current password' });
      return;
    }

    const validation = validatePasswordComplexity(newPassword);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errors.join(', ') });
      return;
    }

    const user = req.user!;
    const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    res.status(200).json({
      message: 'Password changed successfully',
      mustChangePassword: false,
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

