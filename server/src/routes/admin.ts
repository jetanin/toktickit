import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { requireAuth, requireRole } from '../middleware/auth';
import { validatePasswordComplexity } from '../utils/auth';
import { Role } from '../../generated/prisma/client';

const router = Router();

// Restrict entire router to Administrator role only (FR-06, FR-07, BR-10)
router.use(requireAuth);
router.use(requireRole('ADMINISTRATOR'));

const VALID_ROLES: Role[] = ['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'];

// 8.1 GET /api/admin/users
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;

    const where: any = {};

    if (role && typeof role === 'string' && VALID_ROLES.includes(role as Role)) {
      where.role = role as Role;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const activeAdminsCount = await prisma.user.count({
      where: {
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    });
    res.setHeader('X-Active-Admins-Count', activeAdminsCount.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Active-Admins-Count');

    res.status(200).json(users);
  } catch (err) {
    console.error('List admin users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8.2 POST /api/admin/users
router.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, isActive = true, initialPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      res.status(400).json({ error: 'Name is required and must not exceed 100 characters' });
      return;
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0 || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }

    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({
        error: 'Invalid role. Must be one of: REQUESTER, IT_STAFF, ADMINISTRATOR',
      });
      return;
    }

    if (!initialPassword || typeof initialPassword !== 'string') {
      res.status(400).json({ error: 'Initial password is required' });
      return;
    }

    // Password complexity check (BR-06)
    const validation = validatePasswordComplexity(initialPassword);
    if (!validation.isValid) {
      res.status(400).json({
        error: 'Initial password does not meet complexity requirements',
        details: validation.errors,
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness (BR-22, API-29)
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      res.status(409).json({ error: 'This email address is already in use (already registered)' });
      return;
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        isActive: Boolean(isActive),
        mustChangePassword: true, // Mandated by BR-02 & FR-22
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8.4 Reset Password Handler (Supporting both PATCH and POST per discrepancy analysis)
const handleResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { initialPassword } = req.body;
    if (!initialPassword || typeof initialPassword !== 'string') {
      res.status(400).json({ error: 'Initial password is required' });
      return;
    }

    // Password complexity check (BR-06)
    const validation = validatePasswordComplexity(initialPassword);
    if (!validation.isValid) {
      res.status(400).json({
        error: 'Initial password does not meet complexity requirements',
        details: validation.errors,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true, // Forces password change on next login (BR-26, API-31)
      },
    });

    res.status(200).json({
      message: 'Initial password set successfully',
      userId,
      mustChangePassword: true,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

router.patch('/users/:id/reset-password', handleResetPassword);
router.post('/users/:id/reset-password', handleResetPassword);

// 8.3 PATCH /api/admin/users/:id
router.patch('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { name, email, role, isActive } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
        res.status(400).json({ error: 'Name must not be empty or exceed 100 characters' });
        return;
      }
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        res.status(400).json({
          error: 'Invalid role. Must be one of: REQUESTER, IT_STAFF, ADMINISTRATOR',
        });
        return;
      }
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim().length === 0 || !email.includes('@')) {
        res.status(400).json({ error: 'A valid email address is required' });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const dup = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: userId },
          },
        });
        if (dup) {
          res.status(409).json({ error: 'This email address is already in use (already registered)' });
          return;
        }
      }
    }

    // Safety Guard 1: Self-Deactivation Guard (BR-24, API-32)
    if (targetUser.id === req.user!.id && isActive === false) {
      res.status(400).json({ error: 'Cannot deactivate your own account' });
      return;
    }

    // Safety Guard 2: Sole Active Administrator Protection (BR-25, API-33)
    if (targetUser.role === 'ADMINISTRATOR' && targetUser.isActive) {
      const willDeactivate = isActive === false;
      const willDemote = role && role !== 'ADMINISTRATOR';

      if (willDeactivate || willDemote) {
        const otherActiveAdmins = await prisma.user.count({
          where: {
            role: 'ADMINISTRATOR',
            isActive: true,
            id: { not: targetUser.id },
          },
        });

        if (otherActiveAdmins === 0) {
          res.status(400).json({
            error: 'Cannot deactivate or demote the last active Administrator',
          });
          return;
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
