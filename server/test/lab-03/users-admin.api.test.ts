import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';
import bcrypt from 'bcryptjs';

describe('API-27 to API-33 / Lab 3: Administrator User Management & Safety Guards', () => {
  let admin1: any;
  let admin2: any;
  let staff1: any;
  let requester1: any;

  let tokenAdmin1: string;
  let tokenAdmin2: string;
  let tokenStaff1: string;
  let tokenReq1: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create Admin 1 (acting admin)
    admin1 = await prisma.user.create({
      data: {
        name: `Admin One ${Date.now()}`,
        email: `admin1.${Date.now()}@toktick.it`,
        passwordHash,
        role: 'ADMINISTRATOR',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Create Admin 2 (second admin to test sole admin guard)
    admin2 = await prisma.user.create({
      data: {
        name: `Admin Two ${Date.now()}`,
        email: `admin2.${Date.now()}@toktick.it`,
        passwordHash,
        role: 'ADMINISTRATOR',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Create IT Staff
    staff1 = await prisma.user.create({
      data: {
        name: `Staff One ${Date.now()}`,
        email: `staff1.${Date.now()}@toktick.it`,
        passwordHash,
        role: 'IT_STAFF',
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Create Requester
    requester1 = await prisma.user.create({
      data: {
        name: `Requester One ${Date.now()}`,
        email: `requester1.${Date.now()}@toktick.it`,
        passwordHash,
        role: 'REQUESTER',
        isActive: true,
        mustChangePassword: false,
      },
    });

    tokenAdmin1 = signSessionToken({ id: admin1.id, email: admin1.email, role: admin1.role });
    tokenAdmin2 = signSessionToken({ id: admin2.id, email: admin2.email, role: admin2.role });
    tokenStaff1 = signSessionToken({ id: staff1.id, email: staff1.email, role: staff1.role });
    tokenReq1 = signSessionToken({ id: requester1.id, email: requester1.email, role: requester1.role });
  });

  afterAll(async () => {
    // Cleanup users created during test if needed
    await prisma.user.deleteMany({
      where: {
        id: { in: [admin1.id, admin2.id, staff1.id, requester1.id] },
      },
    }).catch(() => {});
  });

  // Access Control Checks: Non-Administrators receive 403 / 401
  describe('RBAC Authorization Guards (FR-07, BR-10)', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('rejects IT Staff with 403 Forbidden on GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenStaff1}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/forbidden|insufficient permissions/i);
    });

    it('rejects Requester with 403 Forbidden on GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenReq1}`);
      expect(res.status).toBe(403);
    });

    it('rejects IT Staff and Requester with 403 Forbidden on POST /api/admin/users', async () => {
      const resStaff = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ name: 'Hacker', email: 'hack@toktick.it', role: 'ADMINISTRATOR' });
      expect(resStaff.status).toBe(403);

      const resReq = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ name: 'Hacker', email: 'hack@toktick.it', role: 'ADMINISTRATOR' });
      expect(resReq.status).toBe(403);
    });

    it('rejects IT Staff and Requester with 403 Forbidden on PATCH /api/admin/users/:id', async () => {
      const resStaff = await request(app)
        .patch(`/api/admin/users/${requester1.id}`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ role: 'ADMINISTRATOR' });
      expect(resStaff.status).toBe(403);

      const resReq = await request(app)
        .patch(`/api/admin/users/${staff1.id}`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ role: 'ADMINISTRATOR' });
      expect(resReq.status).toBe(403);
    });

    it('rejects IT Staff and Requester with 403 Forbidden on reset-password', async () => {
      const resStaff = await request(app)
        .post(`/api/admin/users/${requester1.id}/reset-password`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ initialPassword: 'NewPass123!@#' });
      expect(resStaff.status).toBe(403);

      const resReq = await request(app)
        .post(`/api/admin/users/${staff1.id}/reset-password`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ initialPassword: 'NewPass123!@#' });
      expect(resReq.status).toBe(403);
    });
  });

  // API-27: GET /api/admin/users
  describe('API-27: List Users (GET /api/admin/users)', () => {
    it('returns full list of users with safe fields and no passwordHash', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenAdmin1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);

      const first = res.body[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('email');
      expect(first).toHaveProperty('role');
      expect(first).toHaveProperty('isActive');
      expect(first).toHaveProperty('mustChangePassword');
      expect(first).toHaveProperty('createdAt');
      // Critical security check: passwordHash must never be exposed
      expect(first.passwordHash).toBeUndefined();
      expect(res.text).not.toContain('passwordHash');
    });

    it('supports keyword search filtering by name or email', async () => {
      const res = await request(app)
        .get(`/api/admin/users?search=${encodeURIComponent(staff1.name)}`)
        .set('Authorization', `Bearer ${tokenAdmin1}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.every((u: any) =>
        u.name.toLowerCase().includes(staff1.name.toLowerCase()) ||
        u.email.toLowerCase().includes(staff1.name.toLowerCase())
      )).toBe(true);
    });

    it('supports optional role filter', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=ADMINISTRATOR')
        .set('Authorization', `Bearer ${tokenAdmin1}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body.every((u: any) => u.role === 'ADMINISTRATOR')).toBe(true);
    });
  });

  // API-28 & API-29: POST /api/admin/users
  describe('API-28 & API-29: Create User (POST /api/admin/users)', () => {
    it('creates a new user with one role, initial password, and mustChangePassword = true', async () => {
      const email = `created.${Date.now()}@toktick.it`;
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          name: 'Alex Thompson',
          email,
          role: 'REQUESTER',
          isActive: true,
          initialPassword: 'TempPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeTruthy();
      expect(res.body.name).toBe('Alex Thompson');
      expect(res.body.email).toBe(email);
      expect(res.body.role).toBe('REQUESTER');
      expect(res.body.isActive).toBe(true);
      expect(res.body.mustChangePassword).toBe(true);
      expect(res.body.passwordHash).toBeUndefined();

      // Verify in DB
      const dbUser = await prisma.user.findUnique({ where: { id: res.body.id } });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.mustChangePassword).toBe(true);
      const passMatch = await bcrypt.compare('TempPassword123!', dbUser!.passwordHash);
      expect(passMatch).toBe(true);

      // Cleanup
      await prisma.user.delete({ where: { id: res.body.id } }).catch(() => {});
    });

    it('rejects duplicate email with 409 Conflict (API-29, BR-22)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          name: 'Duplicate User',
          email: admin1.email, // already exists
          role: 'IT_STAFF',
          initialPassword: 'TempPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered|already exists|duplicate/i);
    });

    it('rejects initial password failing complexity rules with 400 Bad Request (BR-06)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          name: 'Weak Password User',
          email: `weak.${Date.now()}@toktick.it`,
          role: 'IT_STAFF',
          initialPassword: 'simple', // < 8 chars, missing complexity
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    it('rejects invalid role with 400 Bad Request (BR-09)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          name: 'Invalid Role User',
          email: `invalidrole.${Date.now()}@toktick.it`,
          role: 'SUPERUSER', // Not permitted
          initialPassword: 'TempPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/role/i);
    });
  });

  // API-30, API-32, API-33: PATCH /api/admin/users/:id
  describe('API-30, API-32, API-33: Update User & Safety Guards (PATCH /api/admin/users/:id)', () => {
    let testUser: any;

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      testUser = await prisma.user.create({
        data: {
          name: `Editable User ${Date.now()}`,
          email: `editable.${Date.now()}@toktick.it`,
          passwordHash,
          role: 'REQUESTER',
          isActive: true,
        },
      });
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    });

    it('successfully updates user profile, role, and active status (API-30, FR-23)', async () => {
      const updatedName = `Updated User ${Date.now()}`;
      const res = await request(app)
        .patch(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          name: updatedName,
          role: 'IT_STAFF',
          isActive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testUser.id);
      expect(res.body.name).toBe(updatedName);
      expect(res.body.role).toBe('IT_STAFF');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('rejects updating email to an existing email with 409 Conflict', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          email: admin1.email, // Collision with admin1
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered|already exists|duplicate/i);
    });

    it('rejects self-deactivation with 400 Bad Request (API-32, BR-24)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${admin1.id}`)
        .set('Authorization', `Bearer ${tokenAdmin1}`) // admin1 deactivating own account
        .send({
          isActive: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot deactivate your own account/i);
    });

    it('rejects deactivation or demotion of the last active Administrator with 400 Bad Request (API-33, BR-25)', async () => {
      // Find all other active administrators in DB
      const otherAdmins = await prisma.user.findMany({
        where: {
          role: 'ADMINISTRATOR',
          isActive: true,
          id: { not: admin1.id },
        },
        select: { id: true },
      });

      // Temporarily deactivate all other active admins so admin1 is the SOLE active Administrator
      await prisma.user.updateMany({
        where: { id: { in: otherAdmins.map((a) => a.id) } },
        data: { isActive: false },
      });

      try {
        // Try to demote admin1's role to REQUESTER
        const resDemote = await request(app)
          .patch(`/api/admin/users/${admin1.id}`)
          .set('Authorization', `Bearer ${tokenAdmin1}`)
          .send({
            role: 'REQUESTER',
          });

        expect(resDemote.status).toBe(400);
        expect(resDemote.body.error).toMatch(/last active Administrator/i);

        // Verify admin1 remains an active Administrator in DB
        const dbAdmin = await prisma.user.findUnique({ where: { id: admin1.id } });
        expect(dbAdmin!.role).toBe('ADMINISTRATOR');
        expect(dbAdmin!.isActive).toBe(true);
      } finally {
        // Restore all other administrators' active state
        await prisma.user.updateMany({
          where: { id: { in: otherAdmins.map((a) => a.id) } },
          data: { isActive: true },
        });
      }
    });
  });

  // API-31: Password Reset (PATCH /api/admin/users/:id/reset-password & POST alias)
  describe('API-31: Password Reset (PATCH & POST /api/admin/users/:id/reset-password)', () => {
    let targetUser: any;

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('OldPassword123!', 10);
      targetUser = await prisma.user.create({
        data: {
          name: `Reset User ${Date.now()}`,
          email: `resetuser.${Date.now()}@toktick.it`,
          passwordHash,
          role: 'REQUESTER',
          isActive: true,
          mustChangePassword: false,
        },
      });
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: targetUser.id } }).catch(() => {});
    });

    it('successfully resets password using PATCH, updates hash and forces mustChangePassword = true (API-31, BR-26)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser.id}/reset-password`)
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          initialPassword: 'NewTempPass@2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.mustChangePassword).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
      expect(dbUser!.mustChangePassword).toBe(true);
      const isMatch = await bcrypt.compare('NewTempPass@2026!', dbUser!.passwordHash);
      expect(isMatch).toBe(true);
    });

    it('also supports POST alias per api-spec.md Section 8.4', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUser.id}/reset-password`)
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          initialPassword: 'AnotherTempPass@2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.mustChangePassword).toBe(true);
    });

    it('rejects weak initial password on reset with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser.id}/reset-password`)
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          initialPassword: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/password/i);
    });

    it('returns 404 Not Found for non-existent user ID', async () => {
      const res = await request(app)
        .patch('/api/admin/users/999999/reset-password')
        .set('Authorization', `Bearer ${tokenAdmin1}`)
        .send({
          initialPassword: 'NewTempPass@2026!',
        });

      expect(res.status).toBe(404);
    });
  });
});
