import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';

describe('GET /api/tickets/:id (Ownership & Details)', () => {
  let requesterA: number;
  let requesterB: number;
  let ticketAId: number;

  beforeAll(async () => {
    const requesters = await prisma.developmentRequester.findMany({
      where: { isActive: true },
      take: 2,
    });
    expect(requesters.length).toBeGreaterThanOrEqual(2);

    requesterA = requesters[0].id;
    requesterB = requesters[1].id;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create a ticket for requesterA with an attachment
    const ticketA = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Math.floor(Math.random() * 900000) + 100000}`,
        summary: 'Secret ticket for Requester A',
        description: 'Only Requester A should see this',
        requestedPriority: 'MEDIUM',
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        requesterId: requesterA,
        currentStatus: 'NEW',
        attachments: {
          create: {
            originalFilename: 'confidential.pdf',
            storagePath: `secret-${Date.now()}-${Math.random()}.pdf`,
            mimeType: 'application/pdf',
            size: 2048,
          },
        },
      },
    });

    ticketAId = ticketA.id;
  });

  it('should return 401 if X-Requester-Id is missing', async () => {
    const res = await request(app).get(`/api/tickets/${ticketAId}`);
    expect(res.status).toBe(401);
  });

  it('should return 404 if ticket does not exist', async () => {
    const res = await request(app)
      .get('/api/tickets/9999999')
      .set('X-Requester-Id', String(requesterA));
    expect(res.status).toBe(404);
  });

  it('should return 403 if ticket is owned by a different requester (enforce backend ownership)', async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set('X-Requester-Id', String(requesterB)); // Requester B accessing Requester A's ticket

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should return 200 and full ticket details when accessed by the ticket owner', async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketAId}`)
      .set('X-Requester-Id', String(requesterA));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketAId);
    expect(res.body.summary).toBe('Secret ticket for Requester A');
    expect(res.body.description).toBe('Only Requester A should see this');
    expect(res.body.requestedPriority).toBe('Medium');
    expect(res.body.currentStatus).toBe('New');
    expect(res.body.category).toHaveProperty('id');
    expect(res.body.category).toHaveProperty('name');
    expect(res.body.relatedSystem).toHaveProperty('id');
    expect(res.body.relatedSystem).toHaveProperty('name');
    expect(res.body.requester).toHaveProperty('id', requesterA);
    expect(Array.isArray(res.body.attachments)).toBe(true);
    expect(res.body.attachments.length).toBeGreaterThan(0);

    // Verify storagePath is NOT leaked to the client
    res.body.attachments.forEach((att: any) => {
      expect(att).toHaveProperty('id');
      expect(att).toHaveProperty('originalFilename');
      expect(att).toHaveProperty('size');
      expect(att).toHaveProperty('mimeType');
      expect(att).not.toHaveProperty('storagePath');
    });
  });

  it('should return 400 for invalid ticket id param', async () => {
    const res = await request(app)
      .get('/api/tickets/not-a-number')
      .set('X-Requester-Id', String(requesterA));
    expect(res.status).toBe(400);
  });
});
