import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { dashboardFixture } from './dashboard-fixture';

describe('MIGR-01: legacy ticket compatibility', () => {
  let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
  beforeAll(async () => { fixture = await dashboardFixture(); });
  afterAll(async () => { await fixture?.cleanup(); });
  it('defaults version, exposes empty actions, includes legacy tickets in dashboards and enforces the gate', async () => {
    const ticket = await fixture.ticket({ currentStatus: 'OPEN' });
    expect(ticket.version).toBe(1);
    const get = (url: string, index: number) => request(app).get(url).auth(fixture.tokens[index]!, { type: 'bearer' });
    const detail = await get(`/api/tickets/${ticket.id}`, 0);
    expect(detail.status).toBe(200);
    expect(detail.body.version).toBe(1);
    expect((await get(`/api/tickets/${ticket.id}/actions-taken`, 0)).body.data).toEqual([]);
    const personal = await get('/api/requester/dashboard', 0);
    expect(personal.body.openTicketsCount).toBe(1);
    expect(personal.body.recentTickets[0].id).toBe(ticket.id);
    const staff = await get('/api/staff/dashboard', 2);
    expect(staff.body.recentUpdatedTickets.some((t: { id: number }) => t.id === ticket.id)).toBe(true);
    const resolution = await request(app).patch(`/api/staff/tickets/${ticket.id}/status`)
      .auth(fixture.tokens[2]!, { type: 'bearer' }).send({ status: 'Resolved', resolutionSummary: 'Legacy without actions', version: 1 });
    expect(resolution.status).toBe(400);
  });
});
