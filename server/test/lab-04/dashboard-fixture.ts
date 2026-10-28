import { prisma } from '../../src/app';
import { signSessionToken } from '../../src/utils/auth';
import type { Prisma, Role } from '../../generated/prisma/client';

export async function dashboardFixture() {
  const suffix = `dashboard-${crypto.randomUUID()}`;
  const users = await Promise.all((['REQUESTER', 'REQUESTER', 'IT_STAFF', 'ADMINISTRATOR'] as Role[]).map((role, i) =>
    prisma.user.create({ data: { name: `${suffix}-${i}`, email: `${suffix}-${i}@example.test`, passwordHash: 'unused', role } })));
  const category = await prisma.category.create({ data: { name: suffix } });
  const system = await prisma.relatedSystem.create({ data: { name: suffix } });
  const tokens = users.map(signSessionToken);
  let sequence = 0;
  return {
    users, tokens,
    ticket: (data: Partial<Prisma.TicketUncheckedCreateInput> = {}) => prisma.ticket.create({ data: {
      ticketNumber: `${suffix}-${sequence++}`, summary: 'Dashboard fixture', description: 'Test',
      requestedPriority: 'MEDIUM', requesterId: users[0]!.id, categoryId: category.id, relatedSystemId: system.id, ...data,
    } }),
    cleanup: async () => {
      await prisma.ticket.deleteMany({ where: { categoryId: category.id } });
      await prisma.category.delete({ where: { id: category.id } });
      await prisma.relatedSystem.delete({ where: { id: system.id } });
      await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } });
    },
  };
}
