import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';

describe('Lab 3: Requester Regression, Ownership & Public Comments Suite', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let requester2: { id: number; email: string; role: string; name: string };
  let staffUser: { id: number; email: string; role: string; name: string };
  let category: { id: number; name: string };
  let relatedSystem: { id: number; name: string };

  let tokenReq1: string;
  let tokenReq2: string;
  let tokenStaff: string;

  let createdTicketId: number;

  beforeAll(async () => {
    // 1. Fetch seed users
    const u1 = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    const u2 = await prisma.user.findUnique({ where: { email: 'lisa.martinez@toktick.it' } });
    const s1 = await prisma.user.findUnique({ where: { email: 'sarah.it@toktick.it' } });

    expect(u1, 'Seed requester 1 should exist').toBeTruthy();
    expect(u2, 'Seed requester 2 should exist').toBeTruthy();
    expect(s1, 'Seed IT staff should exist').toBeTruthy();

    requester1 = { id: u1!.id, email: u1!.email, role: u1!.role, name: u1!.name };
    requester2 = { id: u2!.id, email: u2!.email, role: u2!.role, name: u2!.name };
    staffUser = { id: s1!.id, email: s1!.email, role: s1!.role, name: s1!.name };

    tokenReq1 = signSessionToken(requester1);
    tokenReq2 = signSessionToken(requester2);
    tokenStaff = signSessionToken(staffUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    expect(cat).toBeTruthy();
    expect(sys).toBeTruthy();

    category = { id: cat!.id, name: cat!.name };
    relatedSystem = { id: sys!.id, name: sys!.name };
  });

  describe('AC-08 / BR-03: Authenticated Ticket Creation & Ownership', () => {
    it('should create a ticket using session identity as owner', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: 'VPN disconnects frequently',
          description: 'Tunnel drops every 10 minutes when connected via home wifi.',
          requestedPriority: 'Medium',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(res.body.requesterId).toBe(requester1.id);
      expect(res.body.summary).toBe('VPN disconnects frequently');
      expect(res.body.currentStatus).toBe('New');

      createdTicketId = res.body.id;
    });

    it('AC-03: should ignore client-supplied fake requesterId in body and header', async () => {
      const fakeRequesterId = 99999;
      const res = await request(app)
        .post('/api/tickets')
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .set('X-Requester-Id', String(fakeRequesterId))
        .send({
          categoryId: category.id,
          relatedSystemId: relatedSystem.id,
          summary: 'Attempted identity spoof ticket',
          description: 'Client tries to pass fake requesterId in body and X-Requester-Id.',
          requestedPriority: 'Low',
          requesterId: fakeRequesterId,
        });

      expect(res.status).toBe(201);
      // Must be bound to authenticated requester1, NEVER fakeRequesterId
      expect(res.body.requesterId).toBe(requester1.id);
      expect(res.body.requesterId).not.toBe(fakeRequesterId);

      // Verify in database directly
      const dbTicket = await prisma.ticket.findUnique({ where: { id: res.body.id } });
      expect(dbTicket?.requesterId).toBe(requester1.id);
    });
  });

  describe('AC-08 / AC-09: Ticket Listing and Cross-Requester Isolation', () => {
    it('should return only tickets owned by the authenticated requester', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      for (const t of res.body.data) {
        expect(t.requester.id).toBe(requester1.id);
      }
    });

    it('should allow ticket owner to view ticket detail with safe requester profile', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdTicketId);
      expect(res.body.requester.id).toBe(requester1.id);
      expect(res.body.requester.passwordHash).toBeUndefined();
    });

    it('AC-09: should reject a different requester trying to access another user ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Cookie', `toktickit_session=${tokenReq2}`);

      // Must be 403 or 404
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('AC-15 / BR-04: Public Comments (Chronological, Threaded, Append-Only)', () => {
    it('should allow ticket owner to post a public comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .send({ content: 'I tried restarting my router, but the issue still persists.' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.ticketId).toBe(createdTicketId);
      expect(res.body.content).toBe('I tried restarting my router, but the issue still persists.');
      expect(res.body.author.id).toBe(requester1.id);
      expect(res.body.author.role).toBe('REQUESTER');
    });

    it('should allow IT Staff to post a public comment on the ticket', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenStaff}`)
        .send({ content: 'We are investigating the VPN gateway logs for your subnet.' });

      expect(res.status).toBe(201);
      expect(res.body.author.id).toBe(staffUser.id);
      expect(res.body.author.role).toBe('IT_STAFF');
    });

    it('should retrieve public comments in chronological order', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      const contents = res.body.map((c: any) => c.content);
      expect(contents).toContain('I tried restarting my router, but the issue still persists.');
      expect(contents).toContain('We are investigating the VPN gateway logs for your subnet.');
    });

    it('should reject empty or whitespace-only comment body with 400 Bad Request', async () => {
      const res1 = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .send({ content: '' });

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .send({ content: '     \n\t   ' });

      expect(res2.status).toBe(400);
    });

    it('should reject non-owner requester attempting to post or read comments', async () => {
      const postRes = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq2}`)
        .send({ content: 'Malicious snooping comment attempt.' });

      expect([403, 404]).toContain(postRes.status);

      const getRes = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Cookie', `toktickit_session=${tokenReq2}`);

      expect([403, 404]).toContain(getRes.status);
    });
  });

  describe('AC-17 / BR-05: Requester "Problem Appears Resolved" Indication', () => {
    it('should set requesterResolutionPending without changing status to Resolved/Closed', async () => {
      // Advance ticket to IN_PROGRESS so it matches operational state
      await prisma.ticket.update({
        where: { id: createdTicketId },
        data: { currentStatus: 'IN_PROGRESS' },
      });

      const res = await request(app)
        .patch(`/api/tickets/${createdTicketId}/resolve-indication`)
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(200);
      expect(res.body.requesterResolutionPending).toBe(true);

      // Verify in DB that status is STILL IN_PROGRESS (NOT RESOLVED, NOT CLOSED per BR-05)
      const ticket = await prisma.ticket.findUnique({ where: { id: createdTicketId } });
      expect(ticket?.requesterResolutionPending).toBe(true);
      expect(ticket?.currentStatus).toBe('IN_PROGRESS');
      expect(ticket?.currentStatus).not.toBe('RESOLVED');
      expect(ticket?.currentStatus).not.toBe('CLOSED');

      // Verify automated system comment was appended per Spec § 11.5
      const comments = await prisma.publicComment.findMany({
        where: { ticketId: createdTicketId },
        orderBy: { createdAt: 'desc' },
      });
      const hasNotice = comments.some((c) => c.content.includes('indicated that the problem appears resolved'));
      expect(hasNotice).toBe(true);
    });

    it('should reject non-owner requester attempting to indicate resolution', async () => {
      const res = await request(app)
        .patch(`/api/tickets/${createdTicketId}/resolve-indication`)
        .set('Cookie', `toktickit_session=${tokenReq2}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('AC-08 / BR-21: Attachments Lifecycle under Session Authentication', () => {
    let attachmentId: number;
    const testFilePath = path.join(__dirname, 'test-dummy.png');

    beforeAll(() => {
      fs.writeFileSync(testFilePath, 'dummy-png-content-for-test');
    });

    it('should upload an attachment under authenticated session', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/attachments`)
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .attach('attachment', testFilePath);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.originalFilename).toContain('test-dummy.png');
      attachmentId = res.body.id;
    });

    it('should download attachment file', async () => {
      const res = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(200);
    });

    it('should soft-remove attachment with required reason', async () => {
      const res = await request(app)
        .patch(`/api/attachments/${attachmentId}/remove`)
        .set('Cookie', `toktickit_session=${tokenReq1}`)
        .send({ reason: 'File contained outdated logs' });

      expect(res.status).toBe(200);

      // Subsequent download should return 400
      const dlRes = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(dlRes.status).toBe(400);
    });

    it('should reject non-owner access to attachments', async () => {
      const res = await request(app)
        .get(`/api/attachments/${attachmentId}`)
        .set('Cookie', `toktickit_session=${tokenReq2}`);

      expect([403, 404]).toContain(res.status);
    });
  });
});

