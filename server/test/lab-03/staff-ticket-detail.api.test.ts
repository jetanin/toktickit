import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';
import { isValidTransition, getPermittedNextStatuses } from '../../src/utils/statusTransitions';

describe('Lab 3: IT Staff Ticket Detail & Operations Suite', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let staff1: { id: number; email: string; role: string; name: string };
  let staff2: { id: number; email: string; role: string; name: string };
  let inactiveStaff: { id: number; email: string; role: string; name: string };
  let adminUser: { id: number; email: string; role: string; name: string };

  let tokenReq1: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let testCatId: number;
  let testSysId: number;

  beforeAll(async () => {
    // Seed users
    const u1 = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    const s1 = await prisma.user.findUnique({ where: { email: 'sarah.it@toktick.it' } });
    const s2 = await prisma.user.findUnique({ where: { email: 'michael.it@toktick.it' } });
    const sInactive = await prisma.user.findUnique({ where: { email: 'kevin.it@toktick.it' } });
    const a1 = await prisma.user.findUnique({ where: { email: 'admin@toktick.it' } });

    expect(u1).toBeTruthy();
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
    expect(sInactive).toBeTruthy();
    expect(a1).toBeTruthy();

    requester1 = { id: u1!.id, email: u1!.email, role: u1!.role, name: u1!.name };
    staff1 = { id: s1!.id, email: s1!.email, role: s1!.role, name: s1!.name };
    staff2 = { id: s2!.id, email: s2!.email, role: s2!.role, name: s2!.name };
    inactiveStaff = { id: sInactive!.id, email: sInactive!.email, role: sInactive!.role, name: sInactive!.name };
    adminUser = { id: a1!.id, email: a1!.email, role: a1!.role, name: a1!.name };

    tokenReq1 = signSessionToken(requester1);
    tokenStaff1 = signSessionToken(staff1);
    tokenStaff2 = signSessionToken(staff2);
    tokenAdmin = signSessionToken(adminUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    testCatId = cat!.id;
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    testSysId = sys!.id;
  });

  // UNIT-02: Status transition matrix validator
  describe('UNIT-02: Status Transition Matrix Validator', () => {
    it('permits valid transitions per BR-15', () => {
      expect(isValidTransition('NEW', 'OPEN')).toBe(true);
      expect(isValidTransition('NEW', 'IN_PROGRESS')).toBe(true);
      expect(isValidTransition('NEW', 'CANCELLED')).toBe(true);

      expect(isValidTransition('OPEN', 'IN_PROGRESS')).toBe(true);
      expect(isValidTransition('OPEN', 'WAITING_FOR_REQUESTER')).toBe(true);
      expect(isValidTransition('OPEN', 'RESOLVED')).toBe(true);
      expect(isValidTransition('OPEN', 'CANCELLED')).toBe(true);

      expect(isValidTransition('IN_PROGRESS', 'WAITING_FOR_REQUESTER')).toBe(true);
      expect(isValidTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
      expect(isValidTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);

      expect(isValidTransition('WAITING_FOR_REQUESTER', 'IN_PROGRESS')).toBe(true);
      expect(isValidTransition('WAITING_FOR_REQUESTER', 'RESOLVED')).toBe(true);
      expect(isValidTransition('WAITING_FOR_REQUESTER', 'CANCELLED')).toBe(true);

      expect(isValidTransition('RESOLVED', 'CLOSED')).toBe(true);
      expect(isValidTransition('RESOLVED', 'REOPENED')).toBe(true);

      expect(isValidTransition('CLOSED', 'REOPENED')).toBe(true);

      expect(isValidTransition('REOPENED', 'IN_PROGRESS')).toBe(true);
      expect(isValidTransition('REOPENED', 'RESOLVED')).toBe(true);
      expect(isValidTransition('REOPENED', 'CANCELLED')).toBe(true);
    });

    it('rejects illegal transitions per BR-15', () => {
      // Cannot jump from New straight to Resolved or Closed
      expect(isValidTransition('NEW', 'RESOLVED')).toBe(false);
      expect(isValidTransition('NEW', 'CLOSED')).toBe(false);
      expect(isValidTransition('NEW', 'REOPENED')).toBe(false);

      // Terminal state Cancelled cannot transition to any other status
      expect(isValidTransition('CANCELLED', 'OPEN')).toBe(false);
      expect(isValidTransition('CANCELLED', 'IN_PROGRESS')).toBe(false);
      expect(isValidTransition('CANCELLED', 'REOPENED')).toBe(false);

      // Closed cannot transition directly to Resolved or Cancelled
      expect(isValidTransition('CLOSED', 'RESOLVED')).toBe(false);
      expect(isValidTransition('CLOSED', 'CANCELLED')).toBe(false);

      // Invalid status strings return false
      expect(isValidTransition('NON_EXISTENT', 'OPEN')).toBe(false);
      expect(isValidTransition('NEW', 'INVALID_STATUS')).toBe(false);
    });

    it('handles human-readable status strings and casing correctly', () => {
      expect(isValidTransition('New', 'Open')).toBe(true);
      expect(isValidTransition('In Progress', 'Resolved')).toBe(true);
      expect(isValidTransition('Waiting for Requester', 'In Progress')).toBe(true);
      expect(isValidTransition('New', 'Resolved')).toBe(false);
    });

    it('returns permitted next statuses list correctly', () => {
      expect(getPermittedNextStatuses('New')).toEqual(['OPEN', 'IN_PROGRESS', 'CANCELLED']);
      expect(getPermittedNextStatuses('CANCELLED')).toEqual([]);
    });
  });

  // GET /api/staff/assignees
  describe('GET /api/staff/assignees', () => {
    it('returns list of active IT Staff and Administrator users', async () => {
      const res = await request(app)
        .get('/api/staff/assignees')
        .set('Authorization', `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4); // Sarah, Michael, David, Admin1, Admin2

      const roles = res.body.map((u: any) => u.role);
      expect(roles.every((r: string) => r === 'IT_STAFF' || r === 'ADMINISTRATOR')).toBe(true);

      const emails = res.body.map((u: any) => u.email);
      expect(emails).toContain('sarah.it@toktick.it');
      expect(emails).toContain('michael.it@toktick.it');
      expect(emails).toContain('admin@toktick.it');
      // Inactive user Kevin should NOT be included
      expect(emails).not.toContain('kevin.it@toktick.it');
      // Requester should NOT be included
      expect(emails).not.toContain('jennifer.anderson@toktick.it');
    });

    it('returns 403 Forbidden when accessed by a Requester', async () => {
      const res = await request(app)
        .get('/api/staff/assignees')
        .set('Authorization', `Bearer ${tokenReq1}`);

      expect(res.status).toBe(403);
    });
  });

  // API-18: IT Staff claims unassigned ticket
  describe('API-18: Claim Ticket (PATCH /api/staff/tickets/:id/owner and /assign)', () => {
    let unassignedTicketId: number;

    beforeAll(async () => {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-CLAIM-${Date.now()}`,
          summary: 'Unassigned ticket to test claim',
          description: 'Testing claim functionality',
          categoryId: testCatId,
          relatedSystemId: testSysId,
          requesterId: requester1.id,
          ticketOwnerId: null,
          requestedPriority: 'MEDIUM',
          itPriority: 'MEDIUM',
          currentStatus: 'NEW',
        },
      });
      unassignedTicketId = t.id;
    });

    it('claims unassigned ticket setting owner to caller and auto-advancing status from New to Open (BR-12)', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${unassignedTicketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({}); // Self-claim

      expect(res.status).toBe(200);
      expect(res.body.ticketOwnerId).toBe(staff1.id);
      expect(res.body.currentStatus).toBe('Open');
      expect(res.body.ticketOwner).toBeTruthy();
      expect(res.body.ticketOwner.id).toBe(staff1.id);
      expect(res.body.ticketOwner.name).toBe(staff1.name);

      // Verify in DB
      const dbTicket = await prisma.ticket.findUnique({ where: { id: unassignedTicketId } });
      expect(dbTicket!.ticketOwnerId).toBe(staff1.id);
      expect(dbTicket!.currentStatus).toBe('OPEN');
    });

    it('supports PATCH /api/staff/tickets/:id/assign alias with explicit ticketOwnerId', async () => {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ASSIGN-${Date.now()}`,
          summary: 'Ticket for assign alias test',
          description: 'Testing /assign alias',
          categoryId: testCatId,
          relatedSystemId: testSysId,
          requesterId: requester1.id,
          ticketOwnerId: null,
          requestedPriority: 'LOW',
          itPriority: 'LOW',
          currentStatus: 'NEW',
        },
      });

      const res = await request(app)
        .patch(`/api/staff/tickets/${t.id}/assign`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ticketOwnerId: adminUser.id });

      expect(res.status).toBe(200);
      expect(res.body.ticketOwnerId).toBe(adminUser.id);
      expect(res.body.currentStatus).toBe('Open');
    });

    it('allows unassigning a ticket by setting ticketOwnerId to null', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${unassignedTicketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: null });

      expect(res.status).toBe(200);
      expect(res.body.ticketOwnerId).toBeNull();
      expect(res.body.ticketOwner).toBeNull();
    });

    it('returns 403 when Requester attempts to claim or assign', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${unassignedTicketId}/owner`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ ticketOwnerId: staff1.id });

      expect(res.status).toBe(403);
    });
  });

  // API-19: Reassign ticket to another active IT Staff or Administrator user
  describe('API-19: Reassign Ticket Owner (BR-11, BR-12)', () => {
    let ticketId: number;

    beforeAll(async () => {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-REASSIGN-${Date.now()}`,
          summary: 'Ticket for reassign test',
          description: 'Testing reassign logic',
          categoryId: testCatId,
          relatedSystemId: testSysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'HIGH',
          itPriority: 'HIGH',
          currentStatus: 'OPEN',
        },
      });
      ticketId = t.id;
    });

    it('successfully reassigns ticket to another active IT Staff user', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: staff2.id });

      expect(res.status).toBe(200);
      expect(res.body.ticketOwnerId).toBe(staff2.id);
      expect(res.body.ticketOwner.name).toBe(staff2.name);
    });

    it('successfully reassigns ticket to an Administrator', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send({ ticketOwnerId: adminUser.id });

      expect(res.status).toBe(200);
      expect(res.body.ticketOwnerId).toBe(adminUser.id);
      expect(res.body.ticketOwner.name).toBe(adminUser.name);
    });

    it('rejects assigning ticket to a Requester with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: requester1.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/active IT Staff or Administrator/i);
    });

    it('rejects assigning ticket to an inactive user with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: inactiveStaff.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/active IT Staff or Administrator/i);
    });

    it('rejects assigning ticket to non-existent user with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/owner`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ ticketOwnerId: 999999 });

      expect(res.status).toBe(400);
    });
  });

  // API-20: Update IT Priority
  describe('API-20: Update IT Priority (PATCH /api/staff/tickets/:id/priority)', () => {
    let ticketId: number;

    beforeAll(async () => {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-PRIO-${Date.now()}`,
          summary: 'Ticket for priority test',
          description: 'Testing IT Priority updates',
          categoryId: testCatId,
          relatedSystemId: testSysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'LOW',
          itPriority: 'LOW',
          currentStatus: 'OPEN',
        },
      });
      ticketId = t.id;
    });

    it('updates IT Priority to Critical', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/priority`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ itPriority: 'Critical' });

      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe('Critical');

      // Verify DB
      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      expect(dbTicket!.itPriority).toBe('CRITICAL');
      // Requested Priority must remain unchanged
      expect(dbTicket!.requestedPriority).toBe('LOW');
    });

    it('updates IT Priority to High, Medium, Low', async () => {
      for (const p of ['High', 'Medium', 'Low']) {
        const res = await request(app)
          .patch(`/api/staff/tickets/${ticketId}/priority`)
          .set('Authorization', `Bearer ${tokenStaff1}`)
          .send({ itPriority: p });

        expect(res.status).toBe(200);
        expect(res.body.itPriority).toBe(p);
      }
    });

    it('rejects invalid priority with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/priority`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ itPriority: 'SuperUrgent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid priority/i);
    });

    it('returns 403 when Requester attempts to update IT Priority', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/priority`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ itPriority: 'High' });

      expect(res.status).toBe(403);
    });
  });

  // API-21 & API-22: Status Transitions & Resolution Summary
  describe('API-21 & API-22: Status Transitions (PATCH /api/staff/tickets/:id/status)', () => {
    let ticketId: number;

    beforeAll(async () => {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-STATUS-${Date.now()}`,
          summary: 'Ticket for status test',
          description: 'Testing status transitions',
          categoryId: testCatId,
          relatedSystemId: testSysId,
          requesterId: requester1.id,
          ticketOwnerId: staff1.id,
          requestedPriority: 'MEDIUM',
          itPriority: 'MEDIUM',
          currentStatus: 'OPEN',
        },
      });
      ticketId = t.id;
    });

    it('advances status from Open to In Progress', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'In Progress' });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('In Progress');
    });

    it('rejects transitioning to Resolved without resolutionSummary with 400 Bad Request (BR-16)', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Resolved' }); // missing resolutionSummary

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Resolution summary is required/i);
    });

    it('rejects transitioning to Resolved with whitespace-only resolutionSummary', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Resolved', resolutionSummary: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Resolution summary is required/i);
    });

    it('successfully transitions from In Progress to Resolved with valid resolutionSummary (API-21)', async () => {
      const summary = 'Replaced malfunctioning keyboard switch; all keys tested normal.';
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Resolved', resolutionSummary: summary });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('Resolved');
      expect(res.body.resolutionSummary).toBe(summary);

      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      expect(dbTicket!.currentStatus).toBe('RESOLVED');
      expect(dbTicket!.resolutionSummary).toBe(summary);
    });

    it('transitions from Resolved to Closed', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'Closed' });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('Closed');
    });

    it('transitions from Closed to Reopened', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Reopened' });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('Reopened');
    });

    it('rejects disallowed transition (e.g. from Reopened to Open or Closed directly) with 400 Bad Request (API-22)', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Open' }); // Reopened can only go to In Progress, Resolved, Cancelled

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition/i);
    });

    it('transitions to Cancelled (terminal state) and rejects any further transitions', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('Cancelled');

      // Attempt to move away from Cancelled
      const res2 = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ status: 'Reopened' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/Invalid status transition/i);
    });

    it('returns 403 when Requester attempts to advance status', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ status: 'In Progress' });

      expect(res.status).toBe(403);
    });
  });
});

