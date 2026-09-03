import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';

describe('Reference Data Endpoints (Active Records Only)', () => {
  describe('GET /api/dev-requesters', () => {
    it('returns 200 and an array of only active development requesters', async () => {
      const res = await request(app).get('/api/dev-requesters');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify all returned records have isActive === true
      res.body.forEach((requester: { id: number; name: string; email: string; isActive: boolean }) => {
        expect(requester).toHaveProperty('id');
        expect(requester).toHaveProperty('name');
        expect(requester).toHaveProperty('email');
        expect(requester.isActive).toBe(true);
      });
    });

    it('does not return any inactive requesters', async () => {
      // Find an inactive requester from DB if one exists, or query DB directly to compare
      const inactiveInDb = await prisma.developmentRequester.findFirst({
        where: { isActive: false },
      });

      const res = await request(app).get('/api/dev-requesters');
      expect(res.status).toBe(200);

      if (inactiveInDb) {
        const ids = res.body.map((r: { id: number }) => r.id);
        expect(ids).not.toContain(inactiveInDb.id);
      }
    });
  });

  describe('GET /api/related-systems', () => {
    it('returns 200 and only active related systems with id and name', async () => {
      const res = await request(app).get('/api/related-systems');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      res.body.forEach((system: { id: number; name: string }) => {
        expect(system).toHaveProperty('id');
        expect(system).toHaveProperty('name');
      });

      // Verify none of the inactive ones from DB are included
      const inactiveSystems = await prisma.relatedSystem.findMany({
        where: { isActive: false },
      });
      const returnedIds = res.body.map((s: { id: number }) => s.id);
      inactiveSystems.forEach((inactive) => {
        expect(returnedIds).not.toContain(inactive.id);
      });
    });
  });

  describe('GET /api/categories', () => {
    it('returns 200 and only active categories with id and name', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      res.body.forEach((category: { id: number; name: string }) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
      });

      // Verify none of the inactive ones from DB are included
      const inactiveCategories = await prisma.category.findMany({
        where: { isActive: false },
      });
      const returnedIds = res.body.map((c: { id: number }) => c.id);
      inactiveCategories.forEach((inactive) => {
        expect(returnedIds).not.toContain(inactive.id);
      });
    });
  });
});

