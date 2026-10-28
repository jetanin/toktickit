import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app, { prisma } from '../../src/app';
import { dashboardFixture } from './dashboard-fixture';

describe('PERF-01: dashboard with 550 additional tickets', () => {
  let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
  beforeAll(async () => { fixture = await dashboardFixture(); });
  afterAll(async () => { await fixture?.cleanup(); });
  it('aggregates accurately and responds in less than 500ms', async () => {
    const get = () => request(app).get('/api/staff/dashboard').auth(fixture.tokens[2]!, { type: 'bearer' });
    const baseline = (await get()).body;
    const base = await fixture.ticket({ currentStatus: 'CLOSED' });
    await prisma.ticket.createMany({ data: Array.from({ length: 550 }, (_, index) => ({
      ticketNumber: `${base.ticketNumber}-scale-${index}`, summary: 'Performance fixture', description: 'Scale',
      requesterId: base.requesterId, categoryId: base.categoryId, relatedSystemId: base.relatedSystemId,
      requestedPriority: 'MEDIUM', itPriority: index < 500 ? 'HIGH' : 'CRITICAL',
      currentStatus: index < 500 ? 'OPEN' : 'CLOSED',
    })) });
    await get(); // warm the connection, not the endpoint response
    const start = performance.now();
    const response = await get();
    const elapsed = performance.now() - start;
    expect(response.status).toBe(200);
    expect(response.body.totalActiveQueueCount).toBe(baseline.totalActiveQueueCount + 500);
    expect(response.body.unassignedCount).toBe(baseline.unassignedCount + 500);
    expect(response.body.statusBreakdown.Open).toBe(baseline.statusBreakdown.Open + 500);
    expect(response.body.priorityBreakdown.High).toBe(baseline.priorityBreakdown.High + 500);
    expect(response.body.priorityBreakdown.Critical).toBe(baseline.priorityBreakdown.Critical);
    expect(elapsed).toBeLessThan(500);
  });
});
