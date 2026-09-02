import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/categories', () => {
  it('returns active categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /api/related-systems', () => {
  it('returns active related systems', async () => {
    const res = await request(app).get('/api/related-systems');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
  });
});

describe('GET /api/dev-requesters', () => {
  it('returns only active requesters', async () => {
    const res = await request(app).get('/api/dev-requesters');
    expect(res.status).toBe(200);
    expect(res.body.every((r: any) => r.isActive !== false)).toBe(true);
  });
});