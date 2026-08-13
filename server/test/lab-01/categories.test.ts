import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock PrismaClient and PrismaPg adapter to run tests without requiring a live database
vi.mock('../../generated/prisma/client', () => {
  return {
    PrismaClient: class {
      category = {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, name: 'Account and Access' },
          { id: 2, name: 'Hardware' },
          { id: 3, name: 'Software' },
          { id: 4, name: 'Network' },
        ]),
      };
    },
  };
});

vi.mock('@prisma/adapter-pg', () => {
  return {
    PrismaPg: class {
      constructor() {}
    },
  };
});

import app from '../../src/app';

describe('GET /api/categories', () => {
  it('should return 200 OK and an array of categories', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);
  });

  it('should return categories with id and name properties', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({
      id: 1,
      name: 'Account and Access',
    });
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });
});
