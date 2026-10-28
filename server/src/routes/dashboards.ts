import { Router } from 'express';
import { prisma } from '../app';
import { requireRole } from '../middleware/auth';
import { formatTicket, mapStatus, mapPriority } from '../utils/format';
import type { TicketStatus } from '../../generated/prisma/client';

const router = Router();
const active: TicketStatus[] = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'];
const ticketSelect = {
  id: true, ticketNumber: true, summary: true, currentStatus: true,
  itPriority: true, createdAt: true, updatedAt: true,
  ticketOwner: { select: { id: true, name: true } },
} as const;

router.get('/requester/dashboard', requireRole('REQUESTER'), async (req, res) => {
  const where = { requesterId: req.user!.id };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [openTicketsCount, waitingForRequesterCount, recentlyResolvedCount, closedTicketsCount, recentTickets] = await prisma.$transaction([
    prisma.ticket.count({ where: { ...where, currentStatus: { in: active } } }),
    prisma.ticket.count({ where: { ...where, currentStatus: 'WAITING_FOR_REQUESTER' } }),
    prisma.ticket.count({ where: { ...where, currentStatus: 'RESOLVED', updatedAt: { gte: since } } }),
    prisma.ticket.count({ where: { ...where, currentStatus: 'CLOSED' } }),
    prisma.ticket.findMany({ where, select: ticketSelect, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 5 }),
  ], { isolationLevel: 'RepeatableRead' });
  res.json({ openTicketsCount, waitingForRequesterCount, recentlyResolvedCount, closedTicketsCount, recentTickets: recentTickets.map(formatTicket) });
});

router.get(['/staff/dashboard', '/admin/dashboard'], requireRole('IT_STAFF', 'ADMINISTRATOR'), async (req, res) => {
  const isAdminDashboard = req.path === '/admin/dashboard';
  if (isAdminDashboard && req.user!.role !== 'ADMINISTRATOR') {
    res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
    return;
  }
  const data = await prisma.$transaction(async (tx) => {
    const where = { currentStatus: { in: active } };
    const statusGroups = await tx.ticket.groupBy({ by: ['currentStatus'], where, _count: true });
    const priorityGroups = await tx.ticket.groupBy({ by: ['itPriority'], where, _count: true });
    const statusBreakdown = Object.fromEntries(active.map(s => [mapStatus(s), 0]));
    const priorityBreakdown = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const group of statusGroups) statusBreakdown[mapStatus(group.currentStatus)] = group._count;
    for (const group of priorityGroups) {
      if (group.itPriority) priorityBreakdown[mapPriority(group.itPriority) as keyof typeof priorityBreakdown] = group._count;
    }
    const unassignedCount = await tx.ticket.count({ where: { ...where, ticketOwnerId: null } });
    const myAssignedCount = await tx.ticket.count({ where: { ...where, ticketOwnerId: req.user!.id } });
    const urgentTickets = await tx.ticket.findMany({
      where: { ...where, itPriority: { in: ['CRITICAL', 'HIGH'] } }, select: ticketSelect,
      orderBy: [{ itPriority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }], take: 5,
    });
    const recentUpdatedTickets = await tx.ticket.findMany({ select: ticketSelect, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 5 });
    const result = {
      totalActiveQueueCount: Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0),
      unassignedCount, myAssignedCount, statusBreakdown, priorityBreakdown,
      urgentTickets: urgentTickets.map(formatTicket), recentUpdatedTickets: recentUpdatedTickets.map(formatTicket),
    };
    if (!isAdminDashboard) return result;
    const groups = await tx.user.groupBy({ by: ['role'], where: { isActive: true }, _count: true });
    const count = (role: string) => groups.find(g => g.role === role)?._count ?? 0;
    return { ...result, userGovernance: {
      activeUsersCount: groups.reduce((sum, g) => sum + g._count, 0),
      activeRequestersCount: count('REQUESTER'), activeStaffCount: count('IT_STAFF'), activeAdminsCount: count('ADMINISTRATOR'),
    } };
  }, { isolationLevel: 'RepeatableRead' });
  res.json(data);
});

router.use((error: unknown, _req: import('express').Request, res: import('express').Response, _next: import('express').NextFunction) => {
  console.error('Dashboard error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default router;
