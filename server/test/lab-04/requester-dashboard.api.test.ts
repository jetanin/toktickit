import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { dashboardFixture } from './dashboard-fixture';

describe('Requester dashboard API', () => {
  let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
  beforeAll(async () => { fixture = await dashboardFixture(); });
  afterAll(async () => { vi.restoreAllMocks(); await fixture?.cleanup(); });
  it('requires a session and rejects staff/admin and the legacy identity header', async () => {
    expect((await request(app).get('/api/requester/dashboard')).status).toBe(401);
    expect((await request(app).get('/api/requester/dashboard').set('X-Requester-Id', String(fixture.users[0]!.id))).status).toBe(401);
    for (const index of [2, 3]) expect((await request(app).get('/api/requester/dashboard').auth(fixture.tokens[index]!, { type: 'bearer' })).status).toBe(403);
  });
  it('returns zeros and an empty recent list for a new requester', async () => {
    const res = await request(app).get('/api/requester/dashboard').auth(fixture.tokens[0]!, { type: 'bearer' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ openTicketsCount: 0, waitingForRequesterCount: 0, recentlyResolvedCount: 0, closedTicketsCount: 0, recentTickets: [] });
  });
  it('counts all five active statuses, isolates the caller, and includes the exact 30-day boundary', async () => {
    const now = Date.now();
    const boundary = now - 30 * 86400000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    for (const currentStatus of ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED', 'CLOSED', 'CANCELLED'] as const) await fixture.ticket({ currentStatus });
    await fixture.ticket({ currentStatus: 'RESOLVED', updatedAt: new Date(boundary) });
    await fixture.ticket({ currentStatus: 'RESOLVED', updatedAt: new Date(boundary - 1) });
    await fixture.ticket({ requesterId: fixture.users[1]!.id, currentStatus: 'WAITING_FOR_REQUESTER', summary: 'Private other requester' });
    const res = await request(app).get('/api/requester/dashboard').auth(fixture.tokens[0]!, { type: 'bearer' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ openTicketsCount: 5, waitingForRequesterCount: 1, recentlyResolvedCount: 1, closedTicketsCount: 1 });
    expect(res.body.recentTickets).toHaveLength(5);
    expect(res.body.recentTickets.every((t: { summary: string }) => t.summary !== 'Private other requester')).toBe(true);
    const dates = res.body.recentTickets.map((t: { updatedAt: string }) => t.updatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(res.body.recentTickets[0]).not.toHaveProperty('description');
    vi.restoreAllMocks();
  });
});
