import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';

describe('Lab 3: Public Comments & Internal Notes Suite (API-08, API-24, API-25, API-26)', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let requester2: { id: number; email: string; role: string; name: string };
  let staff1: { id: number; email: string; role: string; name: string };
  let adminUser: { id: number; email: string; role: string; name: string };

  let tokenReq1: string;
  let tokenReq2: string;
  let tokenStaff1: string;
  let tokenAdmin: string;

  let ticketId: number;

  beforeAll(async () => {
    // Seed users
    const u1 = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    const u2 = await prisma.user.findUnique({ where: { email: 'lisa.martinez@toktick.it' } });
    const s1 = await prisma.user.findUnique({ where: { email: 'sarah.it@toktick.it' } });
    const a1 = await prisma.user.findUnique({ where: { email: 'admin@toktick.it' } });

    expect(u1).toBeTruthy();
    expect(u2).toBeTruthy();
    expect(s1).toBeTruthy();
    expect(a1).toBeTruthy();

    requester1 = { id: u1!.id, email: u1!.email, role: u1!.role, name: u1!.name };
    requester2 = { id: u2!.id, email: u2!.email, role: u2!.role, name: u2!.name };
    staff1 = { id: s1!.id, email: s1!.email, role: s1!.role, name: s1!.name };
    adminUser = { id: a1!.id, email: a1!.email, role: a1!.role, name: a1!.name };

    tokenReq1 = signSessionToken(requester1);
    tokenReq2 = signSessionToken(requester2);
    tokenStaff1 = signSessionToken(staff1);
    tokenAdmin = signSessionToken(adminUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create test ticket owned by requester1
    const t = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-COMM-${Date.now()}`,
        summary: 'Ticket for comments and notes tests',
        description: 'Testing public comments and internal notes',
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        requesterId: requester1.id,
        ticketOwnerId: staff1.id,
        requestedPriority: 'MEDIUM',
        itPriority: 'MEDIUM',
        currentStatus: 'OPEN',
      },
    });
    ticketId = t.id;
  });

  // API-08: Requester requests Internal Notes -> 403 Forbidden without leaking note data or count
  describe('API-08: Internal Notes Confidentiality & Requester Blocking (BR-04, BR-20, AC-04)', () => {
    beforeAll(async () => {
      // Pre-seed an internal note on this ticket
      await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: staff1.id,
          content: 'Confidential investigation detail: suspected malware hash xyz',
        },
      });
    });

    it('returns 403 Forbidden when ticket owner (Requester) attempts GET /api/tickets/:id/internal-notes', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenReq1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Insufficient permissions|forbidden/i);
      // Ensure zero note content or count is leaked in the response
      expect(res.body.notes).toBeUndefined();
      expect(res.body.count).toBeUndefined();
      expect(res.text).not.toContain('malware');
      expect(res.text).not.toContain('Confidential');
    });

    it('returns 403 Forbidden when another Requester attempts GET /api/tickets/:id/internal-notes', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenReq2}`);

      expect(res.status).toBe(403);
      expect(res.body.notes).toBeUndefined();
      expect(res.text).not.toContain('malware');
    });

    it('returns 403 Forbidden when Requester attempts POST /api/tickets/:id/internal-notes', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ content: 'Requester trying to sneak an internal note' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Insufficient permissions|forbidden/i);
    });

    it('returns 401 Unauthorized for unauthenticated requests to internal notes', async () => {
      const res = await request(app).get(`/api/tickets/${ticketId}/internal-notes`);
      expect(res.status).toBe(401);
    });
  });

  // API-24: Post Public Comment
  describe('API-24: Public Comments (POST/GET /api/tickets/:id/comments)', () => {
    it('allows ticket owner (Requester) to post a public comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ content: 'I have attached the screenshot of the error dialog.' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('I have attached the screenshot of the error dialog.');
      expect(res.body.author.id).toBe(requester1.id);
      expect(res.body.author.role).toBe('REQUESTER');
    });

    it('allows IT Staff to post a public comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ content: 'Thank you. We are investigating the logs now.' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Thank you. We are investigating the logs now.');
      expect(res.body.author.id).toBe(staff1.id);
      expect(res.body.author.role).toBe('IT_STAFF');
    });

    it('allows Administrator to post a public comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ content: 'Administrative note: Escalated to Level 2.' });

      expect(res.status).toBe(201);
      expect(res.body.author.id).toBe(adminUser.id);
      expect(res.body.author.role).toBe('ADMINISTRATOR');
    });

    it('rejects cross-requester comment submission with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq2}`)
        .send({ content: 'I am another requester trying to comment.' });

      expect(res.status).toBe(403);
    });

    it('retrieves chronological public comments for ticket owner and staff', async () => {
      const resReq = await request(app)
        .get(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq1}`);

      expect(resReq.status).toBe(200);
      expect(Array.isArray(resReq.body)).toBe(true);
      expect(resReq.body.length).toBeGreaterThanOrEqual(3);

      const resStaff = await request(app)
        .get(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenStaff1}`);

      expect(resStaff.status).toBe(200);
      expect(resStaff.body.length).toBe(resReq.body.length);
    });
  });

  // API-25: IT Staff creates Internal Note
  describe('API-25: Internal Notes Operations for IT Staff & Admin (POST/GET /api/tickets/:id/internal-notes)', () => {
    it('allows IT Staff to post an internal note', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ content: 'Hardware check: GPU voltage spike confirmed.' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Hardware check: GPU voltage spike confirmed.');
      expect(res.body.author.id).toBe(staff1.id);
      expect(res.body.author.role).toBe('IT_STAFF');
      expect(res.body.createdAt).toBeTruthy();
    });

    it('allows Administrator to post an internal note', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ content: 'Admin approval granted for replacement part RMA.' });

      expect(res.status).toBe(201);
      expect(res.body.author.id).toBe(adminUser.id);
      expect(res.body.author.role).toBe('ADMINISTRATOR');
    });

    it('allows IT Staff and Admin to retrieve internal notes list', async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      const note = res.body[0];
      expect(note.id).toBeTruthy();
      expect(note.content).toBeTruthy();
      expect(note.author).toBeTruthy();
      expect(note.author.name).toBeTruthy();
      expect(note.author.role).toBeTruthy();
    });
  });

  // API-26: Empty or whitespace-only comment/note body validation
  describe('API-26: Content Validation for Comments & Notes (BR-19)', () => {
    it('rejects empty public comment with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('rejects whitespace-only public comment with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ content: '    \n\t  ' });

      expect(res.status).toBe(400);
    });

    it('rejects public comment exceeding 2000 characters with 400 Bad Request', async () => {
      const longComment = 'a'.repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ content: longComment });

      expect(res.status).toBe(400);
    });

    it('rejects empty internal note with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('rejects whitespace-only internal note with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
    });

    it('rejects internal note exceeding 2000 characters with 400 Bad Request', async () => {
      const longNote = 'b'.repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/internal-notes`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ content: longNote });

      expect(res.status).toBe(400);
    });
  });
});

