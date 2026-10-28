import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { dashboardFixture } from './dashboard-fixture';

describe('Staff and administrator dashboard APIs', () => {
  let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
  beforeAll(async () => { fixture = await dashboardFixture(); });
  afterAll(async () => { await fixture?.cleanup(); });
  const get = (path: string, index: number) => request(app).get(`/api/${path}/dashboard`).auth(fixture.tokens[index]!, { type: 'bearer' });
  it('enforces authentication and role boundaries', async () => {
    expect((await request(app).get('/api/staff/dashboard')).status).toBe(401);
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
    expect((await get('staff', 0)).status).toBe(403);
    expect((await get('admin', 0)).status).toBe(403);
    expect((await get('admin', 2)).status).toBe(403);
    expect((await get('staff', 3)).status).toBe(200);
  });
  it('counts active queue and ownership, excludes terminal tickets and sorts urgent Critical before High', async () => {
    const baseline = (await get('staff', 2)).body;
    const old = new Date('2000-01-01T00:00:00Z');
    const high = await fixture.ticket({ currentStatus: 'OPEN', itPriority: 'HIGH', createdAt: old });
    const critical = await fixture.ticket({ currentStatus: 'REOPENED', itPriority: 'CRITICAL', ticketOwnerId: fixture.users[2]!.id, createdAt: old });
    await fixture.ticket({ currentStatus: 'CLOSED', itPriority: 'CRITICAL', ticketOwnerId: fixture.users[2]!.id, createdAt: old });
    const res = await get('staff', 2);
    expect(res.status).toBe(200);
    expect(res.body.totalActiveQueueCount).toBe(baseline.totalActiveQueueCount + 2);
    expect(res.body.unassignedCount).toBe(baseline.unassignedCount + 1);
    expect(res.body.myAssignedCount).toBe(baseline.myAssignedCount + 1);
    expect(res.body.statusBreakdown.Open).toBe(baseline.statusBreakdown.Open + 1);
    expect(res.body.statusBreakdown.Reopened).toBe(baseline.statusBreakdown.Reopened + 1);
    expect(res.body.priorityBreakdown.Critical).toBe(baseline.priorityBreakdown.Critical + 1);
    expect(res.body.priorityBreakdown.High).toBe(baseline.priorityBreakdown.High + 1);
    expect(res.body.urgentTickets.length).toBeLessThanOrEqual(5);
    expect(res.body.urgentTickets[0].id).toBe(critical.id);
    const expected = await prisma.ticket.findMany({ where: { currentStatus: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'] }, itPriority: { in: ['CRITICAL', 'HIGH'] } }, orderBy: [{ itPriority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }], take: 5 });
    expect(res.body.urgentTickets.map((t: { id: number }) => t.id)).toEqual(expected.map(t => t.id));
    expect(res.body.recentUpdatedTickets).toHaveLength(5);
    expect(res.body).not.toHaveProperty('userGovernance');
    expect(high.id).not.toBe(critical.id);
  });
  it('adds accurate active user governance only for administrators', async () => {
    const res = await get('admin', 3);
    expect(res.status).toBe(200);
    const users = await prisma.user.findMany({ where: { isActive: true } });
    expect(res.body.userGovernance).toEqual({
      activeUsersCount: users.length, activeRequestersCount: users.filter(u => u.role === 'REQUESTER').length,
      activeStaffCount: users.filter(u => u.role === 'IT_STAFF').length, activeAdminsCount: users.filter(u => u.role === 'ADMINISTRATOR').length,
    });
    expect(res.body.totalActiveQueueCount).toBe((await get('staff', 3)).body.totalActiveQueueCount);
  });
});
