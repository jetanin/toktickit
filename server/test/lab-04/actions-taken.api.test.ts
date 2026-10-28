import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';

describe('Lab 4: Actions Taken Foundation API Suite', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let requester2: { id: number; email: string; role: string; name: string };
  let staff1: { id: number; email: string; role: string; name: string };
  let staff2: { id: number; email: string; role: string; name: string };
  let inactiveStaff: { id: number; email: string; role: string; name: string };
  let adminUser: { id: number; email: string; role: string; name: string };

  let tokenReq1: string;
  let tokenReq2: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let testTicket1: any;
  let testTicket2: any;

  beforeAll(async () => {
    // 1. Fetch seed users
    const u1 = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
    const u2 = await prisma.user.findUnique({ where: { email: 'lisa.martinez@toktick.it' } });
    const s1 = await prisma.user.findUnique({ where: { email: 'sarah.it@toktick.it' } });
    const s2 = await prisma.user.findUnique({ where: { email: 'michael.it@toktick.it' } });
    const sInactive = await prisma.user.findUnique({ where: { email: 'kevin.it@toktick.it' } });
    const a1 = await prisma.user.findUnique({ where: { email: 'admin@toktick.it' } });

    expect(u1).toBeTruthy();
    expect(u2).toBeTruthy();
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
    expect(sInactive).toBeTruthy();
    expect(a1).toBeTruthy();

    requester1 = { id: u1!.id, email: u1!.email, role: u1!.role, name: u1!.name };
    requester2 = { id: u2!.id, email: u2!.email, role: u2!.role, name: u2!.name };
    staff1 = { id: s1!.id, email: s1!.email, role: s1!.role, name: s1!.name };
    staff2 = { id: s2!.id, email: s2!.email, role: s2!.role, name: s2!.name };
    inactiveStaff = { id: sInactive!.id, email: sInactive!.email, role: sInactive!.role, name: sInactive!.name };
    adminUser = { id: a1!.id, email: a1!.email, role: a1!.role, name: a1!.name };

    tokenReq1 = signSessionToken(requester1);
    tokenReq2 = signSessionToken(requester2);
    tokenStaff1 = signSessionToken(staff1);
    tokenStaff2 = signSessionToken(staff2);
    tokenAdmin = signSessionToken(adminUser);

    const cat = await prisma.category.findFirst({ where: { isActive: true } });
    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // Create dedicated isolated tickets for testing actions taken
    testTicket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-1`,
        requesterId: requester1.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        summary: 'Action Taken Foundation Test Ticket 1',
        description: 'Test ticket for actions taken test suite',
        requestedPriority: 'MEDIUM',
        itPriority: 'MEDIUM',
        currentStatus: 'OPEN',
      },
    });

    testTicket2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-2`,
        requesterId: requester2.id,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
        summary: 'Action Taken Foundation Test Ticket 2 (Requester 2)',
        description: 'Test ticket owned by requester 2 for isolation test',
        requestedPriority: 'LOW',
        itPriority: 'LOW',
        currentStatus: 'OPEN',
      },
    });
  });

  describe('1. Successful Creation & Auto-Attribution (API-01, API-02)', () => {
    it('API-01: creates a valid Action Taken by IT Staff with auto-attribution and default Completed status', async () => {
      const payload = {
        description: 'Tested voltage levels on power supply rails with multimeter.',
        result: '+12V rail measured 12.04V, +5V rail measured 5.01V. All rails within tolerance.',
        isFollowUpRequired: false,
        attachmentNotes: 'multimeter_reading.jpg',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeTypeOf('number');
      expect(res.body.ticketId).toBe(testTicket1.id);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.result).toBe(payload.result);
      expect(res.body.status).toBe('Completed');
      expect(res.body.isFollowUpRequired).toBe(false);
      expect(res.body.followUpNote).toBeNull();
      expect(res.body.attachmentNotes).toBe(payload.attachmentNotes);

      // Performed-by MUST be auto-attributed to authenticated user
      expect(res.body.performedById).toBe(staff1.id);
      expect(res.body.performedBy).toEqual({
        id: staff1.id,
        name: staff1.name,
        email: staff1.email,
        role: staff1.role,
      });

      // When assigneeId is omitted, defaults to caller
      expect(res.body.assigneeId).toBe(staff1.id);
      expect(res.body.assignee).toEqual({
        id: staff1.id,
        name: staff1.name,
        email: staff1.email,
        role: staff1.role,
      });
    });

    it('strictly ignores client-supplied performedById and binds authenticated user (BR-04)', async () => {
      const forgePayload = {
        performedById: 9999, // Attempt to forge another user ID
        description: 'Inspected cooling vents for dust blockage.',
        result: 'Cleaned heatsink fins with compressed air.',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send(forgePayload);

      expect(res.status).toBe(201);
      expect(res.body.performedById).toBe(staff1.id);
      expect(res.body.performedBy.id).toBe(staff1.id);
    });

    it('API-02: supports different staff members recording Actions Taken on the same ticket', async () => {
      const payloadStaff2 = {
        description: 'Second technician diagnostic and thermal paste reapplication.',
        result: 'Reapplied Arctic MX-4 thermal paste and reseated CPU cooler.',
        assigneeId: staff2.id,
        status: 'In Progress',
        isFollowUpRequired: true,
        followUpNote: 'Monitor thermal sensor temps under Cinebench 30-min torture test.',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff2}`)
        .send(payloadStaff2);

      expect(res.status).toBe(201);
      expect(res.body.performedById).toBe(staff2.id);
      expect(res.body.performedBy.name).toBe(staff2.name);
      expect(res.body.assigneeId).toBe(staff2.id);
      expect(res.body.status).toBe('In Progress');
      expect(res.body.isFollowUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe(payloadStaff2.followUpNote);
    });

    it('allows Administrator to create an Action Taken and assign to IT Staff', async () => {
      const payloadAdmin = {
        description: 'Administrator oversight and authorized warranty repair approval.',
        result: 'Warranty repair approved with vendor ticket #VN-88412.',
        assigneeId: staff1.id,
        status: 'Completed',
      };

      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(payloadAdmin);

      expect(res.status).toBe(201);
      expect(res.body.performedById).toBe(adminUser.id);
      expect(res.body.assigneeId).toBe(staff1.id);
      expect(res.body.performedBy.role).toBe('ADMINISTRATOR');
      expect(res.body.assignee.role).toBe('IT_STAFF');
    });
  });

  describe('2. Validation & Business Rules (API-03, API-04, API-05, API-06)', () => {
    it('API-03: rejects creation when isFollowUpRequired = true but followUpNote is missing or empty', async () => {
      const resMissing = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Tested RAM with MemTest86.',
          result: 'Found 2 errors on address 0x3F421.',
          isFollowUpRequired: true,
          // followUpNote omitted
        });

      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toContain('Follow-up note is required');

      const resEmpty = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Tested RAM with MemTest86.',
          result: 'Found 2 errors on address 0x3F421.',
          isFollowUpRequired: true,
          followUpNote: '   ', // empty string after trim
        });

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error).toContain('Follow-up note is required');
    });

    it('API-04: succeeds when isFollowUpRequired = true and valid followUpNote is provided', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Replaced faulty RAM stick in DIMM slot 2.',
          result: 'System booted into BIOS; 32GB total detected.',
          isFollowUpRequired: true,
          followUpNote: 'Run secondary 4-hour memory test overnight.',
        });

      expect(res.status).toBe(201);
      expect(res.body.isFollowUpRequired).toBe(true);
      expect(res.body.followUpNote).toBe('Run secondary 4-hour memory test overnight.');
    });

    it('API-05: rejects assigning Action Taken to inactive IT Staff user', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Attempting assignment to deactivated staff member.',
          result: 'Investigation.',
          assigneeId: inactiveStaff.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Target assignee must be an active IT Staff or Administrator');
    });

    it('API-06: rejects assigning Action Taken to user with role REQUESTER', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Attempting assignment to requester user.',
          result: 'Investigation.',
          assigneeId: requester1.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Target assignee must be an active IT Staff or Administrator');
    });

    it('rejects creation when description or result is missing or exceeds 1000 characters', async () => {
      const resNoDesc = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ result: 'Some result' });
      expect(resNoDesc.status).toBe(400);

      const resNoResult = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ description: 'Some description' });
      expect(resNoResult.status).toBe(400);

      const resLongDesc = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'A'.repeat(1001),
          result: 'Valid result',
        });
      expect(resLongDesc.status).toBe(400);
    });

    it('rejects invalid action status value', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Valid description',
          result: 'Valid result',
          status: 'INVALID_STATUS',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid action status');
    });

    it('returns 404 when target ticket does not exist', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/999999/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Action on non-existent ticket',
          result: 'None',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Ticket not found');
    });

    it('returns 400 when ticket ID is invalid', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/invalid-id/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          description: 'Valid description',
          result: 'Valid result',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Role-Based Access Control & Isolation (API-07, API-08, API-09)', () => {
    it('API-07: returns 403 Forbidden when Requester attempts to create Action Taken', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({
          description: 'Requester attempting staff action creation',
          result: 'Blocked',
        });

      expect(res.status).toBe(403);
    });

    it('returns 401 Unauthorized when unauthenticated user attempts to create Action Taken', async () => {
      const res = await request(app)
        .post(`/api/staff/tickets/${testTicket1.id}/actions-taken`)
        .send({
          description: 'Unauthenticated attempt',
          result: 'Blocked',
        });

      expect(res.status).toBe(401);
    });

    it('API-08: allows Requester to read Actions Taken on their OWN ticket (GET /api/tickets/:id/actions-taken)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenReq1}`);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(testTicket1.id);
      expect(res.body.ticketNumber).toBe(testTicket1.ticketNumber);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify action item format
      const action = res.body.data[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('actionDateTime');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('result');
      expect(action).toHaveProperty('status');
      expect(action).toHaveProperty('performedBy');
      expect(action.performedBy).toHaveProperty('name');
      expect(action.performedBy).toHaveProperty('role');
    });

    it('API-09: returns 403 Forbidden when Requester attempts to view Actions Taken on another requesters ticket', async () => {
      // testTicket2 is owned by requester2. requester1 should be blocked!
      const res = await request(app)
        .get(`/api/tickets/${testTicket2.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenReq1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access forbidden');
    });

    it('allows IT Staff and Administrator to view Actions Taken on any ticket', async () => {
      const resStaff = await request(app)
        .get(`/api/tickets/${testTicket2.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenStaff1}`);
      expect(resStaff.status).toBe(200);

      const resAdmin = await request(app)
        .get(`/api/tickets/${testTicket1.id}/actions-taken`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(resAdmin.status).toBe(200);
    });
  });

  describe('4. Single Item Retrieval & Update (API-10, API-10b)', () => {
    let createdActionId: number;

    beforeAll(async () => {
      const created = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket1.id,
          description: 'Bench diagnostic of storage drive.',
          result: 'SMART error detected on sector 0x88.',
          performedById: staff1.id,
          assigneeId: staff1.id,
          status: 'PENDING',
          isFollowUpRequired: true,
          followUpNote: 'Order replacement NVMe drive.',
        },
      });
      createdActionId = created.id;
    });

    it('API-10b: retrieves a single Action Taken item by ID', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicket1.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdActionId);
      expect(res.body.description).toBe('Bench diagnostic of storage drive.');
      expect(res.body.status).toBe('Pending');
      expect(res.body.performedBy.name).toBe(staff1.name);
    });

    it('API-10b returns 404 for non-existent action ID or mismatched ticket', async () => {
      const resMissing = await request(app)
        .get(`/api/staff/tickets/${testTicket1.id}/actions-taken/99999`)
        .set('Authorization', `Bearer ${tokenStaff1}`);
      expect(resMissing.status).toBe(404);

      // action exists under testTicket1, calling under testTicket2 should return 404
      const resMismatch = await request(app)
        .get(`/api/staff/tickets/${testTicket2.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenStaff1}`);
      expect(resMismatch.status).toBe(404);
    });

    it('API-10: updates Action Taken details, assignee, status, and clears follow-up', async () => {
      const updatePayload = {
        description: 'Bench diagnostic completed and NVMe replacement installed.',
        result: 'CrystalDiskMark measured 7,200 MB/s read speed. All SMART tests passed clean.',
        assigneeId: staff2.id,
        status: 'Completed',
        isFollowUpRequired: false,
        followUpNote: null,
        attachmentNotes: 'bench_score_pass.png',
      };

      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket1.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdActionId);
      expect(res.body.description).toBe(updatePayload.description);
      expect(res.body.result).toBe(updatePayload.result);
      expect(res.body.status).toBe('Completed');
      expect(res.body.assigneeId).toBe(staff2.id);
      expect(res.body.assignee.name).toBe(staff2.name);
      expect(res.body.isFollowUpRequired).toBe(false);
      expect(res.body.followUpNote).toBeNull();
      expect(res.body.attachmentNotes).toBe(updatePayload.attachmentNotes);
    });

    it('allows unassigning an action by passing assigneeId: null', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket1.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({ assigneeId: null });

      expect(res.status).toBe(200);
      expect(res.body.assigneeId).toBeNull();
      expect(res.body.assignee).toBeNull();
    });

    it('rejects update when isFollowUpRequired = true but followUpNote is cleared to empty', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket1.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenStaff1}`)
        .send({
          isFollowUpRequired: true,
          followUpNote: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Follow-up note is required');
    });

    it('returns 403 when Requester attempts to update Action Taken', async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicket1.id}/actions-taken/${createdActionId}`)
        .set('Authorization', `Bearer ${tokenReq1}`)
        .send({ description: 'Unauthorized update' });

      expect(res.status).toBe(403);
    });
  });
});
