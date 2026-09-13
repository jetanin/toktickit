import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { validatePasswordComplexity, signSessionToken, verifySessionToken } from '../../src/utils/auth';

describe('Lab 3: Authentication & Session Management Suite', () => {
  beforeAll(async () => {
    // Ensure test database has active seed users
    const requester = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    expect(requester, 'Seed user jennifer.anderson@toktick.it should exist').toBeTruthy();
  });

  describe('UNIT-01: Password Complexity Validator Boundaries (BR-06, AC-06)', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordComplexity('Ab1!xyz');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords missing an uppercase letter', () => {
      const result = validatePasswordComplexity('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords missing a lowercase letter', () => {
      const result = validatePasswordComplexity('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords missing a number', () => {
      const result = validatePasswordComplexity('PasswordSpecial!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one numeric digit');
    });

    it('should reject passwords missing a special character', () => {
      const result = validatePasswordComplexity('Password1234');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept valid passwords satisfying all complexity rules', () => {
      const result = validatePasswordComplexity('NewSecurePassword456!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('UNIT-03: Session Token and Cookie Helpers', () => {
    it('should generate a verifiable signed token with id, email, and role', () => {
      const payload = { id: 1, email: 'jennifer.anderson@toktick.it', role: 'REQUESTER' };
      const token = signSessionToken(payload);
      expect(token).toBeTruthy();

      const decoded = verifySessionToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded!.id).toBe(payload.id);
      expect(decoded!.email).toBe(payload.email);
      expect(decoded!.role).toBe(payload.role);
    });

    it('should return null when verifying a tampered token', () => {
      const token = signSessionToken({ id: 1, email: 'jennifer.anderson@toktick.it', role: 'REQUESTER' });
      const tampered = token.slice(0, -4) + 'abcd';
      const decoded = verifySessionToken(tampered);
      expect(decoded).toBeNull();
    });
  });

  describe('API-01: Valid Login (POST /api/auth/login)', () => {
    it('should authenticate active user with valid credentials, set cookie, and return safe user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jennifer.anderson@toktick.it',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('jennifer.anderson@toktick.it');
      expect(res.body.user.role).toBe('REQUESTER');
      expect(res.body.user.name).toBe('Jennifer Anderson');
      expect(res.body.user.mustChangePassword).toBe(false);
      expect(res.body.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = (cookies as string[]).find((c) => c.startsWith('toktickit_session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');
    });

    it('should return 400 Bad Request if email or password is missing', async () => {
      const res1 = await request(app).post('/api/auth/login').send({ email: 'jennifer.anderson@toktick.it' });
      expect(res1.status).toBe(400);

      const res2 = await request(app).post('/api/auth/login').send({ password: 'Password123!' });
      expect(res2.status).toBe(400);
    });
  });

  describe('API-02: Invalid Password & Non-Existent Email (BR-01, AC-05)', () => {
    it('should return generic 401 Unauthorized for invalid password without leaking account existence', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jennifer.anderson@toktick.it',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });

    it('should return identical generic 401 Unauthorized for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.ghost@toktick.it',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });
  });

  describe('API-03: Inactive User Login Attempt (BR-01, AC-05)', () => {
    it('should return generic 401 Unauthorized for inactive account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'robert.wilson@toktick.it',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });
  });

  describe('API-09: Retrieve Authenticated Profile (GET /api/auth/me)', () => {
    it('should return safe profile of currently authenticated user with session cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jennifer.anderson@toktick.it',
          password: 'Password123!',
        });

      const sessionCookie = loginRes.headers['set-cookie'];

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('jennifer.anderson@toktick.it');
      expect(meRes.body.user.name).toBe('Jennifer Anderson');
      expect(meRes.body.user.role).toBe('REQUESTER');
      expect(meRes.body.user.passwordHash).toBeUndefined();
    });

    it('should return safe profile when Bearer token header is provided', async () => {
      const user = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
      const token = signSessionToken({ id: user!.id, email: user!.email, role: user!.role });
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('jennifer.anderson@toktick.it');
    });

    it('should return 401 Unauthorized if unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('API-04: Mandatory Password Change Gate (BR-02, AC-02)', () => {
    it('should block operational endpoints with 403 PASSWORD_CHANGE_REQUIRED when mustChangePassword = true', async () => {
      // Alex Thompson has mustChangePassword = true in seed
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.mustChangePassword).toBe(true);
      const sessionCookie = loginRes.headers['set-cookie'];

      // Accessing /api/auth/me should succeed
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);
      expect(meRes.status).toBe(200);

      // Accessing normal operational endpoint /api/categories must be blocked by gate
      const opRes = await request(app)
        .get('/api/categories')
        .set('Cookie', sessionCookie);

      expect(opRes.status).toBe(403);
      expect(opRes.body).toEqual({
        error: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    });
  });

  describe('API-05 & API-06: Change Password (POST /api/auth/change-password)', () => {
    it('should reject when new password does not meet complexity rules', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'short',
          confirmPassword: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject when new password is identical to current password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/different|identical/i);
    });

    it('should reject when newPassword and confirmPassword do not match', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewValidPassword123!',
          confirmPassword: 'MismatchedPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/match/i);
    });

    it('should reject when current password is incorrect', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'WrongCurrentPassword999!',
          newPassword: 'NewValidPassword123!',
          confirmPassword: 'NewValidPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/incorrect|invalid/i);
    });

    it('should successfully change password, update hash, and clear mustChangePassword', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewAlexPassword2026!',
          confirmPassword: 'NewAlexPassword2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Password changed successfully',
        mustChangePassword: false,
      });

      // Verify DB state
      const updatedUser = await prisma.user.findUnique({ where: { email: 'alex.thompson@toktick.it' } });
      expect(updatedUser!.mustChangePassword).toBe(false);

      // Verify can now login with new password
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.thompson@toktick.it',
          password: 'NewAlexPassword2026!',
        });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.user.mustChangePassword).toBe(false);

      // Restore password for test idempotency
      const restoreRes = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', newLoginRes.headers['set-cookie'])
        .send({
          currentPassword: 'NewAlexPassword2026!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        });
      expect(restoreRes.status).toBe(200);
      // Re-set mustChangePassword = true for seed consistency
      await prisma.user.update({
        where: { email: 'alex.thompson@toktick.it' },
        data: { mustChangePassword: true },
      });
    });
  });

  describe('API-07: Logout (POST /api/auth/logout)', () => {
    it('should clear session cookie and reject subsequent requests', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jennifer.anderson@toktick.it',
          password: 'Password123!',
        });
      const sessionCookie = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body).toEqual({ message: 'Logged out successfully' });

      // Cookie should be cleared
      const clearedCookies = logoutRes.headers['set-cookie'];
      expect(clearedCookies).toBeDefined();
      const clearedSession = (clearedCookies as string[]).find((c) => c.startsWith('toktickit_session='));
      expect(clearedSession).toBeDefined();
      expect(clearedSession).toMatch(/Max-Age=0|Expires=/);

      // Subsequent call to /api/auth/me without active session returns 401
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', clearedCookies);
      expect(meRes.status).toBe(401);
    });
  });
});
