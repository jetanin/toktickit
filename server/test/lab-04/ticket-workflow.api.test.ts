import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';

describe('Lab 4: Ticket Workflow, Resolution Gate & Concurrency Control Suite', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let requester2: { id: number; email: string; role: string; name: string };
  let staff1: { id: number; email: string; role: string; name: string };
  let staff2: { id: number; email: string; role: string; name: string };
  let adminUser: { id: number; email: string; role: string; name: string };

  let tokenReq1: string;
  let tokenReq2: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let catId: number;
  let sysId: number;

  beforeAll(async () => {
    // 1. Fetch seed users
    const u1 = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    const u2 = await prisma.user.findUnique({ where: { email: 'lisa.martinez@toktick.it' } });
    const s1 = await prisma.user.findUnique({ where: { email: 'sarah.it@toktick.it' } });
    const s2 = await prisma.user.findUnique({ where: { email: 'michael.it@toktick.it' } });
    const a1 = await prisma.user.findUnique({ where: { email: 'admin@toktick.it' } });

    expect(u1).toBeTruthy();
    expect(u2).toBeTruthy();
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
    expect(a1).toBeTruthy();

    requester1 = { id: u1!.id, email: u1!.email, role: u1!.role, name: u1!.name };
    requester2 = { id: u2!.id, email: u2!.email, role: u2!.role, name: u2!.name };
    staff1 = { id: s1!.id, email: s1!.email, role: s1!.role, name: s1!.name };
    staff2 = { id: s2!.id, email: s2!.email, role: s2!.role, name: s2!.name };
    adminUser = { id: a1!.id, email: a1!.email, role: a1!.role, name: a1!.name };

    tokenReq1 = signSessionToken(requester1);
    tokenReq2 = signSessionToken(requester2);
    tokenStaff1 = signSessionToken(staff1);
    tokenStaff2 = signSessionToken(staff2);
    tokenAdmin = signSessionToken(adminUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    catId = cat!.id;
    sysId = sys!.id;
  });

  describe('1. Status Transitions (BR-09)', () => {
    it('allows permitted transition from Open to In Progress', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-FLOW-1-${Date.now()}`,
          summary: 'Testing valid status transition',
          description: 'Valid transition test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          itPriority: 'MEDIUM',
          currentStatus: 'OPEN',
          version: 1,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'In Progress', version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('In Progress');
      expect(res.body.version).toBe(2);

      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(dbTicket?.currentStatus).toBe('IN_PROGRESS');
      expect(dbTicket?.version).toBe(2);
    });

    it('rejects disallowed status transition with 400 Bad Request', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-FLOW-2-${Date.now()}`,
          summary: 'Testing disallowed status transition',
          description: 'Disallowed transition test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'LOW',
          itPriority: 'LOW',
          currentStatus: 'OPEN',
          version: 1,
        },
      });

      // Open -> Closed is not allowed per BR-09
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Closed', version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition from Open to Closed/i);
    });

    it('rejects any transition from terminal status Cancelled', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-FLOW-3-${Date.now()}`,
          summary: 'Testing cancelled terminal status',
          description: 'Terminal transition test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'LOW',
          itPriority: 'LOW',
          currentStatus: 'CANCELLED',
          version: 1,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Open', version: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition/i);
    });
  });

  describe('2. Resolution Gate Enforcement & Bypass Prevention (FR-09, BR-10, BR-11)', () => {
    it('blocks Requester from directly modifying ticket status with 403 Forbidden', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-1-${Date.now()}`,
          summary: 'Requester bypass attempt test',
          description: 'Bypass test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'IN_PROGRESS',
          version: 1,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({
          status: 'Resolved',
          resolutionSummary: 'Attempted requester self-resolution bypass',
          version: 1,
        });

      expect(res.status).toBe(403);
    });

    it('allows Requester advisory resolution indication without altering currentStatus', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-2-${Date.now()}`,
          summary: 'Requester advisory resolution test',
          description: 'Advisory test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'WAITING_FOR_REQUESTER',
          requesterResolutionPending: false,
          version: 1,
        },
      });

      // Call alias POST /api/tickets/:id/problem-resolved
      const res = await request(app)
        .post(`/api/tickets/${ticket.id}/problem-resolved`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ comment: 'Issue seems fixed on my end.' });

      expect(res.status).toBe(200);
      expect(res.body.requesterResolutionPending).toBe(true);
      expect(res.body.currentStatus).toBe('Waiting for Requester');

      // Status in DB remains unchanged (BR-11)
      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(dbTicket?.currentStatus).toBe('WAITING_FOR_REQUESTER');
      expect(dbTicket?.requesterResolutionPending).toBe(true);

      // System comment appended
      const comments = await prisma.publicComment.findMany({
        where: { ticketId: ticket.id },
      });
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].content).toContain('indicated that the problem appears resolved');
    });

    it('rejects transitioning to Resolved when ticket has 0 Actions Taken (BR-10)', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-3-${Date.now()}`,
          summary: 'Testing resolution gate without actions taken',
          description: 'Zero actions taken test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'IN_PROGRESS',
          version: 1,
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          status: 'Resolved',
          resolutionSummary: 'Everything was checked and verified.',
          version: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Cannot resolve ticket: At least one Action Taken and a non-empty resolution summary are required.'
      );
    });

    it('rejects transitioning to Resolved when resolution summary is missing even with Actions Taken', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-4-${Date.now()}`,
          summary: 'Testing resolution gate missing summary',
          description: 'Missing summary test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'IN_PROGRESS',
          version: 1,
          actionsTaken: {
            create: {
              description: 'Replaced power adapter',
              result: 'Device powers on normal',
              performedById: staff1.id,
              assigneeId: staff1.id,
            },
          },
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          status: 'Resolved',
          resolutionSummary: '   ',
          version: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Cannot resolve ticket: At least one Action Taken and a non-empty resolution summary are required.'
      );
    });

    it('successfully transitions to Resolved when ticket has >= 1 Action Taken and valid summary (BR-10)', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-GATE-5-${Date.now()}`,
          summary: 'Testing resolution gate success',
          description: 'Gate success test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'IN_PROGRESS',
          requesterResolutionPending: true,
          version: 1,
          actionsTaken: {
            create: {
              description: 'Fixed Ethernet port wiring',
              result: 'Link negotiated at 1Gbps full duplex',
              performedById: staff1.id,
              assigneeId: staff1.id,
            },
          },
        },
      });

      const summary = 'Re-crimped RJ-45 wall connector. Signal tester showed normal continuity.';
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          status: 'Resolved',
          resolutionSummary: summary,
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('Resolved');
      expect(res.body.resolutionSummary).toBe(summary);
      expect(res.body.requesterResolutionPending).toBe(false);
      expect(res.body.version).toBe(2);

      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(dbTicket?.currentStatus).toBe('RESOLVED');
      expect(dbTicket?.requesterResolutionPending).toBe(false);
      expect(dbTicket?.version).toBe(2);
    });
  });

  describe('3. Optimistic Concurrency Control (OCC) (FR-16, BR-12)', () => {
    it('rejects stale update on /status with 409 Conflict when version mismatches', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-OCC-1-${Date.now()}`,
          summary: 'OCC test ticket',
          description: 'OCC collision test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          currentStatus: 'OPEN',
          version: 1,
        },
      });

      // User 1 updates status to In Progress (version goes from 1 to 2)
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'In Progress', version: 1 });

      expect(res1.status).toBe(200);
      expect(res1.body.version).toBe(2);

      // User 2 tries to update status with stale version 1
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send({ status: 'Waiting for Requester', version: 1 });

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONCURRENCY_CONFLICT');
      expect(res2.body.currentVersion).toBe(2);

      // User 2 retries with fresh version 2
      const res3 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send({ status: 'Waiting for Requester', version: 2 });

      expect(res3.status).toBe(200);
      expect(res3.body.currentStatus).toBe('Waiting for Requester');
      expect(res3.body.version).toBe(3);
    });

    it('rejects stale update on /priority with 409 Conflict', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-OCC-2-${Date.now()}`,
          summary: 'OCC priority test ticket',
          description: 'OCC priority collision test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'LOW',
          itPriority: 'LOW',
          currentStatus: 'OPEN',
          version: 1,
        },
      });

      // Update to Medium
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/priority`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ itPriority: 'Medium', version: 1 });

      expect(res1.status).toBe(200);
      expect(res1.body.version).toBe(2);

      // Concurrent update with stale version 1
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/priority`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send({ itPriority: 'High', version: 1 });

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONCURRENCY_CONFLICT');
    });

    it('rejects stale update on /owner with 409 Conflict', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-OCC-3-${Date.now()}`,
          summary: 'OCC owner test ticket',
          description: 'OCC owner collision test',
          categoryId: catId,
          relatedSystemId: sysId,
          requesterId: requester1.id,
          requestedPriority: 'LOW',
          currentStatus: 'NEW',
          version: 1,
        },
      });

      // Staff 1 claims ticket (auto-transitions NEW -> OPEN and version 1 -> 2)
      const res1 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: staff1.id, version: 1 });

      expect(res1.status).toBe(200);
      expect(res1.body.currentStatus).toBe('Open');
      expect(res1.body.version).toBe(2);

      // Staff 2 attempts concurrent claim with stale version 1
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/owner`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send({ ticketOwnerId: staff2.id, version: 1 });

      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONCURRENCY_CONFLICT');
    });
  });
});
