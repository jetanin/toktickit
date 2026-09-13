import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';

describe('Lab 3: IT Staff Ticket Queue Suite (GET /api/staff/tickets)', () => {
  let requester1: { id: number; email: string; role: string; name: string };
  let requester2: { id: number; email: string; role: string; name: string };
  let staff1: { id: number; email: string; role: string; name: string };
  let staff2: { id: number; email: string; role: string; name: string };
  let adminUser: { id: number; email: string; role: string; name: string };

  let tokenReq1: string;
  let tokenStaff1: string;
  let tokenStaff2: string;
  let tokenAdmin: string;

  let testCat1Id: number;
  let testCat2Id: number;
  let testSysId: number;

  let ticket1Id: number;
  let ticket2Id: number;
  let ticket3Id: number;

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
    tokenStaff1 = signSessionToken(staff1);
    tokenStaff2 = signSessionToken(staff2);
    tokenAdmin = signSessionToken(adminUser);

    const cats = await prisma.category.findMany({ where: { isActive: true }, take: 2 });
    testCat1Id = cats[0]!.id;
    testCat2Id = cats[1]!.id;

    const sys = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    testSysId = sys!.id;

    // Create distinctive test tickets for staff queue testing
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}01`,
        requesterId: requester1.id,
        ticketOwnerId: staff1.id,
        categoryId: testCat1Id,
        relatedSystemId: testSysId,
        summary: 'Alpha Staff Queue Test Summary Unique',
        description: 'First test ticket for staff queue assertions',
        requestedPriority: 'LOW',
        itPriority: 'HIGH',
        currentStatus: 'OPEN',
      },
    });
    ticket1Id = t1.id;

    const t2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}02`,
        requesterId: requester2.id,
        ticketOwnerId: null, // unassigned
        categoryId: testCat2Id,
        relatedSystemId: testSysId,
        summary: 'Beta Unassigned Issue Unique',
        description: 'Second test ticket without assigned owner',
        requestedPriority: 'MEDIUM',
        itPriority: 'LOW',
        currentStatus: 'NEW',
      },
    });
    ticket2Id = t2.id;

    const t3 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}03`,
        requesterId: requester2.id,
        ticketOwnerId: staff2.id,
        categoryId: testCat1Id,
        relatedSystemId: testSysId,
        summary: 'Gamma Assigned to Michael Specialist',
        description: 'Third test ticket assigned to staff2',
        requestedPriority: 'HIGH',
        itPriority: 'CRITICAL',
        currentStatus: 'IN_PROGRESS',
      },
    });
    ticket3Id = t3.id;
  });

  describe('1. Role-Based Access Control (RBAC)', () => {
    it('should return 401 Unauthorized when no session token is provided', async () => {
      const res = await request(app).get('/api/staff/tickets');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when accessed by a REQUESTER', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenReq1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Access forbidden/i);
    });

    it('should return 200 OK when accessed by IT_STAFF', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 200 OK when accessed by ADMINISTRATOR', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('2. Global Visibility across Requesters & Response Structure', () => {
    it('should return tickets created by multiple different requesters', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ticketIds = res.body.data.map((t: any) => t.id);
      expect(ticketIds).toContain(ticket1Id);
      expect(ticketIds).toContain(ticket2Id);
      expect(ticketIds).toContain(ticket3Id);

      // Verify response shape
      const sample = res.body.data.find((t: any) => t.id === ticket1Id);
      expect(sample).toHaveProperty('ticketNumber');
      expect(sample).toHaveProperty('summary');
      expect(sample).toHaveProperty('category');
      expect(sample.category).toHaveProperty('id');
      expect(sample.category).toHaveProperty('name');
      expect(sample).toHaveProperty('requester');
      expect(sample.requester).toHaveProperty('id');
      expect(sample.requester).toHaveProperty('name');
      expect(sample).toHaveProperty('requestedPriority', 'Low');
      expect(sample).toHaveProperty('itPriority', 'High');
      expect(sample).toHaveProperty('currentStatus', 'Open');
      expect(sample).toHaveProperty('requesterResolutionPending');
      expect(sample).toHaveProperty('createdAt');
      expect(sample).toHaveProperty('updatedAt');
      expect(sample).toHaveProperty('ticketOwner');
      expect(sample.ticketOwner.id).toBe(staff1.id);
      expect(sample.ticketOwner.name).toBe(staff1.name);

      // Verify pagination meta
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('totalItems');
      expect(res.body.meta).toHaveProperty('totalPages');
    });
  });

  describe('3. Text Search', () => {
    it('should search by ticketNumber partial match', async () => {
      const sample = await prisma.ticket.findUnique({ where: { id: ticket1Id } });
      const partialNumber = sample!.ticketNumber.slice(-5);

      const res = await request(app)
        .get(`/api/staff/tickets?search=${partialNumber}`)
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
    });

    it('should search by summary partial match', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?search=Alpha Staff Queue')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
      expect(ids).not.toContain(ticket2Id);
    });

    it('should search by requester name partial match', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?search=${encodeURIComponent(requester1.name.slice(0, 5))}`)
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
    });

    it('should return empty list when search yields no matches', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?search=XYZ_NON_EXISTENT_STRING_12345')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.totalItems).toBe(0);
    });
  });

  describe('4. Multi-Criteria Filtering', () => {
    it('should filter by category', async () => {
      const res = await request(app)
        .get(`/api/staff/tickets?category=${testCat2Id}`)
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket2Id);
      expect(ids).not.toContain(ticket1Id);
    });

    it('should filter by priority (based on itPriority)', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?priority=Critical')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket3Id);
      expect(ids).not.toContain(ticket1Id);
      expect(ids).not.toContain(ticket2Id);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?status=Open')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
      expect(ids).not.toContain(ticket2Id);
    });

    it('should filter by assigned=me (tickets owned by current staff user)', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?assigned=me')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
      expect(ids).not.toContain(ticket2Id); // ticket 2 is unassigned
      expect(ids).not.toContain(ticket3Id); // ticket 3 is assigned to staff 2
      res.body.data.forEach((t: any) => {
        expect(t.ticketOwner?.id).toBe(staff1.id);
      });
    });

    it('should filter by assigned=unassigned (tickets with null owner)', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?assigned=unassigned')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket2Id);
      expect(ids).not.toContain(ticket1Id);
      expect(ids).not.toContain(ticket3Id);
      res.body.data.forEach((t: any) => {
        expect(t.ticketOwner).toBeNull();
      });
    });

    it('should return all tickets when assigned=all', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?assigned=all')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain(ticket1Id);
      expect(ids).toContain(ticket2Id);
      expect(ids).toContain(ticket3Id);
    });
  });

  describe('5. Sorting & Pagination', () => {
    it('should default to sorting by createdAt desc', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      for (let i = 0; i < data.length - 1; i++) {
        const current = new Date(data[i].createdAt).getTime();
        const next = new Date(data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should sort by ticketNumber asc', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?sort=ticketNumber&order=asc')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      for (let i = 0; i < data.length - 1; i++) {
        expect(data[i].ticketNumber <= data[i + 1].ticketNumber).toBe(true);
      }
    });

    it('should paginate results with limit 10 as default', async () => {
      const res = await request(app)
        .get('/api/staff/tickets')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should support limit parameter (e.g. limit=25)', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?limit=25')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(25);
    });

    it('should reject invalid sort field with 400', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?sort=invalid_field')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(400);
    });

    it('should reject invalid order parameter with 400', async () => {
      const res = await request(app)
        .get('/api/staff/tickets?order=random')
        .set('Cookie', `toktickit_session=${tokenStaff1}`);

      expect(res.status).toBe(400);
    });
  });
});
