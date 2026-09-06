import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';

describe('POST /api/tickets', () => {
  it('should create a ticket and return 201 with generated ticketNumber and status New', async () => {
    // Find an active requester, active category, and active related system
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    expect(requester).toBeTruthy();
    expect(category).toBeTruthy();
    expect(relatedSystem).toBeTruthy();

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'Network is slow in building A',
        description: 'Experiencing severe packet loss and high latency.',
        requestedPriority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('ticketNumber');
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.summary).toBe('Network is slow in building A');
    expect(res.body.description).toBe('Experiencing severe packet loss and high latency.');
    expect(res.body.requestedPriority).toBe('High');
    expect(res.body.currentStatus).toBe('New');
    expect(res.body.requesterId).toBe(requester!.id);
  });

  it('should return 400 if summary exceeds 100 characters', async () => {
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'A'.repeat(101),
        description: 'Test description',
        requestedPriority: 'Medium',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if description exceeds 1000 characters', async () => {
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'Valid summary',
        description: 'D'.repeat(1001),
        requestedPriority: 'Medium',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if relatedSystemId is missing', async () => {
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        categoryId: category!.id,
        summary: 'Valid summary',
        description: 'Valid description',
        requestedPriority: 'Low',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if categoryId is missing', async () => {
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        relatedSystemId: relatedSystem!.id,
        summary: 'Valid summary',
        description: 'Valid description',
        requestedPriority: 'Low',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if requestedPriority is invalid', async () => {
    const requester = await prisma.developmentRequester.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requester!.id))
      .send({
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'Valid summary',
        description: 'Valid description',
        requestedPriority: 'Urgent', // Invalid
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 if X-Requester-Id header is missing', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test ticket',
        description: 'Test description',
        requestedPriority: 'Medium',
      });

    expect(res.status).toBe(401);
  });

  it('should return 403 if requester does not exist', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', '999999')
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: 'Test ticket',
        description: 'Test description',
        requestedPriority: 'Medium',
      });

    expect(res.status).toBe(403);
  });

  it('should return 403 if requester is inactive', async () => {
    const inactiveRequester = await prisma.developmentRequester.findFirst({
      where: { isActive: false },
    });

    if (inactiveRequester) {
      const res = await request(app)
        .post('/api/tickets')
        .set('X-Requester-Id', String(inactiveRequester.id))
        .send({
          categoryId: 1,
          relatedSystemId: 1,
          summary: 'Test ticket',
          description: 'Test description',
          requestedPriority: 'Medium',
        });

      expect(res.status).toBe(403);
    }
  });
});
