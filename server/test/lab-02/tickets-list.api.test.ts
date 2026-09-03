import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';

describe('GET /api/tickets', () => {
  let requesterWithTickets: number;
  let requesterWithNoTickets: number;
  let categoryId: number;

  beforeAll(async () => {
    // Find or ensure two distinct active requesters
    const requesters = await prisma.developmentRequester.findMany({
      where: { isActive: true },
      take: 2,
    });
    expect(requesters.length).toBeGreaterThanOrEqual(2);

    requesterWithTickets = requesters[0].id;
    requesterWithNoTickets = requesters[1].id;

    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    categoryId = category!.id;

    // Ensure requesterWithTickets has multiple tickets
    const existingCount = await prisma.ticket.count({
      where: { requesterId: requesterWithTickets },
    });

    if (existingCount < 9) {
      for (let i = existingCount; i < 10; i++) {
        await prisma.ticket.create({
          data: {
            ticketNumber: `TKT-2026-99${String(i).padStart(4, '0')}`,
            summary: `Ticket ${i} for testing pagination and search`,
            description: `Description ${i}`,
            requestedPriority: i % 2 === 0 ? 'HIGH' : 'LOW',
            categoryId: category!.id,
            relatedSystemId: relatedSystem!.id,
            requesterId: requesterWithTickets,
            currentStatus: 'NEW',
          },
        });
      }
    }

    // Create dedicated requester with 0 tickets to ensure parallel test isolation
    const emptyRequester = await prisma.developmentRequester.create({
      data: {
        name: 'Empty Ticket Test User',
        email: `empty-test-${Date.now()}-${Math.random()}@example.com`,
        isActive: true,
      },
    });
    requesterWithNoTickets = emptyRequester.id;
  });

  it('should return 401 if X-Requester-Id is missing', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  it('should return 403 if X-Requester-Id is non-existent or inactive', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', '999999');
    expect(res.status).toBe(403);
  });

  it('should return paginated results with default limit of 8 and correct metadata', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(8);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.itemsPerPage).toBe(8);
    expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(10);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);

    // Verify format of ticket items in response
    const ticket = res.body.data[0];
    expect(ticket).toHaveProperty('id');
    expect(ticket).toHaveProperty('ticketNumber');
    expect(ticket).toHaveProperty('summary');
    expect(ticket).toHaveProperty('requestedPriority');
    expect(ticket).toHaveProperty('currentStatus');
    expect(ticket).toHaveProperty('category');
    expect(ticket).toHaveProperty('requester');
    // Priority and Status must be Title Case
    expect(['Low', 'Medium', 'High']).toContain(ticket.requestedPriority);
    expect(ticket.currentStatus).toBe('New');
  });

  it('should return the correct second page subset', async () => {
    const page1Res = await request(app)
      .get('/api/tickets?page=1&limit=8')
      .set('X-Requester-Id', String(requesterWithTickets));

    const page2Res = await request(app)
      .get('/api/tickets?page=2&limit=8')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.meta.currentPage).toBe(2);

    const page1Ids = page1Res.body.data.map((t: { id: number }) => t.id);
    const page2Ids = page2Res.body.data.map((t: { id: number }) => t.id);

    // No overlapping tickets between page 1 and page 2
    page2Ids.forEach((id: number) => {
      expect(page1Ids).not.toContain(id);
    });
  });

  it('should return empty data array and totalItems 0 for requester with 0 tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', String(requesterWithNoTickets));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.totalItems).toBe(0);
    expect(res.body.meta.totalPages).toBe(1);
    expect(res.body.meta.currentPage).toBe(1);
  });

  it('should only return tickets owned by the X-Requester-Id', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: { requester: { id: number } }) => {
      expect(ticket.requester.id).toBe(requesterWithTickets);
    });
  });

  it('should filter tickets by search query', async () => {
    const res = await request(app)
      .get('/api/tickets?search=pagination')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((ticket: { summary: string }) => {
      expect(ticket.summary.toLowerCase()).toContain('pagination');
    });
  });

  it('should filter tickets by category', async () => {
    const res = await request(app)
      .get(`/api/tickets?category=${categoryId}`)
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: { category: { id: number } }) => {
      expect(ticket.category.id).toBe(categoryId);
    });
  });

  it('should filter tickets by priority (case-insensitive in query)', async () => {
    const res = await request(app)
      .get('/api/tickets?priority=high')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: { requestedPriority: string }) => {
      expect(ticket.requestedPriority).toBe('High');
    });
  });

  it('should sort tickets correctly', async () => {
    const res = await request(app)
      .get('/api/tickets?sort=createdAt&order=asc')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(200);
    const dates = res.body.data.map((t: { createdAt: string }) => new Date(t.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
  });

  it('should return 400 for invalid page parameter (page <= 0)', async () => {
    const res = await request(app)
      .get('/api/tickets?page=-1')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid page parameter');
  });

  it('should return 400 when page exceeds totalPages', async () => {
    const res = await request(app)
      .get('/api/tickets?page=99999')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid page parameter');
  });

  it('should return 400 for invalid limit parameter (limit > 100)', async () => {
    const res = await request(app)
      .get('/api/tickets?limit=150')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid limit parameter');
  });

  it('should return 400 for invalid sort field', async () => {
    const res = await request(app)
      .get('/api/tickets?sort=unsupportedField')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid sort field');
  });

  it('should return 400 for invalid order parameter', async () => {
    const res = await request(app)
      .get('/api/tickets?order=sideways')
      .set('X-Requester-Id', String(requesterWithTickets));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid order parameter');
  });
});
