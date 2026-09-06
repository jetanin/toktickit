import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import path from 'path';
import fs from 'fs';

// Helpers to create test files
const getValidPngFile = () => {
  const filePath = path.join(__dirname, 'test-valid.png');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'dummy-png-content');
  }
  return filePath;
};

const getInvalidExeFile = () => {
  const filePath = path.join(__dirname, 'test-invalid.exe');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'MZ-dummy-binary');
  }
  return filePath;
};

describe('Attachment Endpoints', () => {
  let requester1: number;
  let requester2: number;
  let ticketIdReq1: number;
  let ticketIdReq2: number;

  beforeAll(async () => {
    const requesters = await prisma.developmentRequester.findMany({
      where: { isActive: true },
      take: 2,
    });
    expect(requesters.length).toBeGreaterThanOrEqual(2);
    requester1 = requesters[0].id;
    requester2 = requesters[1].id;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Ticket for Requester 1
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Math.floor(Math.random() * 900000) + 100000}`,
        summary: 'Ticket for attachment tests',
        description: 'Testing attachments upload, download, and removal',
        requestedPriority: 'LOW',
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        requesterId: requester1,
        currentStatus: 'NEW',
      },
    });
    ticketIdReq1 = t1.id;

    // Ticket for Requester 2
    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Math.floor(Math.random() * 900000) + 100000}`,
        summary: 'Requester 2 ticket',
        description: 'Belongs to requester 2',
        requestedPriority: 'LOW',
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        requesterId: requester2,
        currentStatus: 'NEW',
      },
    });
    ticketIdReq2 = t2.id;
  });

  let uploadedAttachmentId: number;

  it('should upload a valid attachment and return 201 with metadata (no storagePath leaked)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester1))
      .attach('attachment', getValidPngFile());

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.originalFilename).toBe('test-valid.png');
    expect(res.body).toHaveProperty('size');
    expect(res.body).toHaveProperty('mimeType', 'image/png');
    expect(res.body).not.toHaveProperty('storagePath');

    uploadedAttachmentId = res.body.id;
  });

  it('should return 400 if attachment file is missing in multipart request', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester1));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if attachment is an invalid file type (e.g. .exe)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester1))
      .attach('attachment', getInvalidExeFile());

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 if attachment exceeds 5MB limit', async () => {
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    const res = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester1))
      .attach('attachment', largeBuffer, 'large-file.png');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 403 if attempting to upload attachment to another requester ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester2)) // Requester 2 trying to upload to Requester 1's ticket
      .attach('attachment', getValidPngFile());

    expect(res.status).toBe(403);
  });

  it('should return 400 when attempting to exceed 5 active attachments on a single ticket', async () => {
    // Current active count is 1. Upload 4 more to reach 5 active.
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post(`/api/tickets/${ticketIdReq1}/attachments`)
        .set('X-Requester-Id', String(requester1))
        .attach('attachment', getValidPngFile());
      expect(res.status).toBe(201);
    }

    // The 6th attachment must be rejected with 400
    const overflowRes = await request(app)
      .post(`/api/tickets/${ticketIdReq1}/attachments`)
      .set('X-Requester-Id', String(requester1))
      .attach('attachment', getValidPngFile());

    expect(overflowRes.status).toBe(400);
    expect(overflowRes.body.error).toMatch(/maximum/i);
  });

  it('should retrieve attachment metadata via GET /api/attachments/:id', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}`)
      .set('X-Requester-Id', String(requester1));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: uploadedAttachmentId,
      originalFilename: 'test-valid.png',
      size: expect.any(Number),
      mimeType: 'image/png',
    });
    expect(res.body).not.toHaveProperty('storagePath');
  });

  it('should return 403 when getting metadata of an attachment belonging to another requester', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}`)
      .set('X-Requester-Id', String(requester2));

    expect(res.status).toBe(403);
  });

  it('should download active attachment via GET /api/attachments/:id/download', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}/download`)
      .set('X-Requester-Id', String(requester1));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['content-disposition']).toContain('test-valid.png');
  });

  it('should return 403 when downloading attachment belonging to another requester', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}/download`)
      .set('X-Requester-Id', String(requester2));

    expect(res.status).toBe(403);
  });

  it('should soft-remove an attachment via PATCH /api/attachments/:id/remove and return 200', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${uploadedAttachmentId}/remove`)
      .set('X-Requester-Id', String(requester1))
      .send({ reason: 'Uploaded wrong document' });

    expect(res.status).toBe(200);

    // Verify in database: row is NOT deleted, removedAt is set, removalReason is saved
    const record = await prisma.attachment.findUnique({
      where: { id: uploadedAttachmentId },
    });
    expect(record).not.toBeNull();
    expect(record!.removedAt).not.toBeNull();
    expect(record!.removalReason).toBe('Uploaded wrong document');
  });

  it('should return 400 when removing without a reason', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${uploadedAttachmentId}/remove`)
      .set('X-Requester-Id', String(requester1))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 403 when removing attachment of another requester', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${uploadedAttachmentId}/remove`)
      .set('X-Requester-Id', String(requester2))
      .send({ reason: 'Malicious attempt' });

    expect(res.status).toBe(403);
  });

  it('should block download of a soft-removed attachment (return 400)', async () => {
    const res = await request(app)
      .get(`/api/attachments/${uploadedAttachmentId}/download`)
      .set('X-Requester-Id', String(requester1));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/removed/i);
  });
});
