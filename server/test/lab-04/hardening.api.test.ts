import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { dashboardFixture } from './dashboard-fixture';

describe('Lab 4 hardening: atomic OCC and action validation', () => {
  let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
  beforeAll(async () => { fixture = await dashboardFixture(); });
  afterAll(async () => { await fixture?.cleanup(); });
  const patch = (id: number, operation: string, data: object) => request(app).patch(`/api/staff/tickets/${id}/${operation}`)
    .auth(fixture.tokens[2]!, { type: 'bearer' }).send(data);
  it.each(['priority', 'owner', 'status'])('commits only one simultaneous %s mutation', async operation => {
    const ticket = await fixture.ticket({ currentStatus: 'OPEN' });
    const data = operation === 'priority' ? { itPriority: 'High' } : operation === 'owner' ? { ticketOwnerId: fixture.users[2]!.id } : { status: 'In Progress' };
    const results = await Promise.all([patch(ticket.id, operation, { ...data, version: 1 }), patch(ticket.id, operation, { ...data, version: 1 })]);
    expect(results.map(r => r.status).sort()).toEqual([200, 409]);
    expect(results.find(r => r.status === 409)!.body).toMatchObject({ code: 'CONCURRENCY_CONFLICT', currentVersion: 2, updatedAt: expect.any(String) });
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).version).toBe(2);
  });
  it('accepts current timestamp/If-Match fallback and rejects stale tokens', async () => {
    const ticket = await fixture.ticket();
    expect((await patch(ticket.id, 'priority', { itPriority: 'High', updatedAt: ticket.updatedAt.toISOString() })).status).toBe(200);
    expect((await patch(ticket.id, 'priority', { itPriority: 'Low', updatedAt: ticket.updatedAt.toISOString() })).status).toBe(409);
    expect((await request(app).patch(`/api/staff/tickets/${ticket.id}/priority`).auth(fixture.tokens[2]!, { type: 'bearer' }).set('If-Match', '"2"').send({ itPriority: 'Critical' })).status).toBe(200);
    expect((await request(app).patch(`/api/staff/tickets/${ticket.id}/priority`).auth(fixture.tokens[2]!, { type: 'bearer' }).set('If-Match', '"2"').send({ itPriority: 'Low' })).status).toBe(409);
  });
  it('versions action writes, saves edited dates and preserves immutable attribution', async () => {
    const ticket = await fixture.ticket();
    const created = await request(app).post(`/api/staff/tickets/${ticket.id}/actions-taken`).auth(fixture.tokens[2]!, { type: 'bearer' })
      .send({ description: 'Inspect', result: 'Passed', version: 1, performedById: fixture.users[3]!.id });
    expect(created.status).toBe(201);
    expect(created.body.performedById).toBe(fixture.users[2]!.id);
    const date = '2026-10-01T10:00:00.000Z';
    const url = `actions-taken/${created.body.id}`;
    expect((await patch(ticket.id, url, { result: 'Stale', version: 1 })).status).toBe(409);
    const edited = await patch(ticket.id, url, { result: 'Rechecked', actionDateTime: date, performedById: fixture.users[3]!.id, version: 2 });
    expect(edited.status).toBe(200);
    expect(edited.body.actionDateTime).toBe(date);
    expect(edited.body.performedById).toBe(fixture.users[2]!.id);
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).version).toBe(3);
    expect((await patch(ticket.id, url, { isFollowUpRequired: 'false' })).status).toBe(400);
    expect((await patch(ticket.id, url, { actionDateTime: 123 })).status).toBe(400);
  });
  it('does not treat a legacy identity header as an administrator or staff session', async () => {
    for (const index of [2, 3]) {
      const res = await request(app).get('/api/tickets').set('X-Requester-Id', String(fixture.users[index]!.id));
      expect(res.status).toBe(403);
    }
  });
  it('returns canonical requester IDs in the legacy selector without authentication data', async () => {
    const response = await request(app).get('/api/dev-requesters');
    expect(response.status).toBe(200);
    const ids = response.body.map((user: { id: number }) => user.id);
    expect(ids).toContain(fixture.users[0]!.id);
    expect(ids).not.toContain(fixture.users[2]!.id);
    expect(ids).not.toContain(fixture.users[3]!.id);
    expect(response.body.every((user: object) => !('passwordHash' in user))).toBe(true);
    const list = await request(app).get('/api/tickets').set('X-Requester-Id', String(fixture.users[0]!.id));
    expect(list.status).toBe(200);
  });
  it('returns sanitized 400 responses for missing and malformed action payloads', async () => {
    const ticket = await fixture.ticket();
    const url = `/api/staff/tickets/${ticket.id}/actions-taken`;
    const empty = await request(app).post(url).auth(fixture.tokens[2]!, { type: 'bearer' });
    expect(empty.status).toBe(400);
    const malformed = await request(app).post(url).auth(fixture.tokens[2]!, { type: 'bearer' }).type('json').send('{ invalid');
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: 'Invalid JSON request body' });
    expect(malformed.text).not.toMatch(/SyntaxError|stack|node_modules/);
  });
  it('keeps advisory indication Requester-only, even when a staff user created the ticket', async () => {
    const ticket = await fixture.ticket({ requesterId: fixture.users[2]!.id });
    const response = await request(app).post(`/api/tickets/${ticket.id}/problem-resolved`)
      .auth(fixture.tokens[2]!, { type: 'bearer' }).send({});
    expect(response.status).toBe(403);
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).requesterResolutionPending).toBe(false);
  });
  it('applies the same active/recently resolved scope in dashboard drill-down lists', async () => {
    await fixture.ticket({ currentStatus: 'OPEN' });
    await fixture.ticket({ currentStatus: 'WAITING_FOR_REQUESTER' });
    await fixture.ticket({ currentStatus: 'RESOLVED', updatedAt: new Date(Date.now() - 31 * 86400000) });
    const recent = await fixture.ticket({ currentStatus: 'RESOLVED' });
    const personal = await request(app).get('/api/tickets?status=Recently+Resolved').auth(fixture.tokens[0]!, { type: 'bearer' });
    expect(personal.status).toBe(200);
    expect(personal.body.data.map((t: { id: number }) => t.id)).toContain(recent.id);
    expect(personal.body.data.every((t: { currentStatus: string; updatedAt: string }) => t.currentStatus === 'Resolved' && Date.parse(t.updatedAt) >= Date.now() - 30 * 86400000)).toBe(true);
    const active = await request(app).get('/api/staff/tickets?status=Active').auth(fixture.tokens[2]!, { type: 'bearer' });
    expect(active.status).toBe(200);
    expect(active.body.data.every((t: { currentStatus: string }) => !['Resolved', 'Closed', 'Cancelled'].includes(t.currentStatus))).toBe(true);
  });
});
