import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { requireRole } from '../middleware/auth';
import type { Role } from '../../generated/prisma/client';
import { formatTicket } from '../utils/format';

const router = Router();

// Staff routes are restricted to IT_STAFF and ADMINISTRATOR
router.use(requireRole('IT_STAFF' as Role, 'ADMINISTRATOR' as Role));

// 6.1 GET /api/staff/tickets
router.get('/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      search,
      category,
      priority,
      status,
      assigned = 'all',
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum <= 0) {
      res.status(400).json({ error: 'Invalid page parameter' });
      return;
    }
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid limit parameter' });
      return;
    }
    if (order !== 'asc' && order !== 'desc') {
      res.status(400).json({ error: 'Invalid order parameter' });
      return;
    }

    const allowedSortFields = ['ticketNumber', 'createdAt', 'updatedAt', 'itPriority', 'currentStatus'];
    if (!allowedSortFields.includes(sort as string)) {
      res.status(400).json({ error: 'Invalid sort field' });
      return;
    }

    const where: any = {};

    // Search matches ticketNumber, summary, or requester.name
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { ticketNumber: { contains: s, mode: 'insensitive' } },
        { summary: { contains: s, mode: 'insensitive' } },
        { requester: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }

    // Category filter
    if (category) {
      const categoryId = parseInt(category as string, 10);
      if (!isNaN(categoryId)) {
        where.categoryId = categoryId;
      }
    }

    // Priority filter (matches itPriority per spec 6.1)
    if (priority && typeof priority === 'string') {
      where.itPriority = priority.toUpperCase();
    }

    // Status filter
    if (status && typeof status === 'string') {
      let statusMapped = status.toUpperCase().replace(/\s+/g, '_');
      where.currentStatus = statusMapped;
    }

    // Assignment filter: all, unassigned, me
    if (assigned === 'unassigned') {
      where.ticketOwnerId = null;
    } else if (assigned === 'me') {
      where.ticketOwnerId = user.id;
    }

    const totalItems = await prisma.ticket.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));

    if (pageNum > totalPages && totalItems > 0) {
      res.status(400).json({ error: 'Invalid page parameter' });
      return;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [
        { [sort as string]: order },
        { id: 'desc' },
      ],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        category: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, role: true } },
        ticketOwner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(200).json({
      data: tickets.map(formatTicket),
      meta: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    console.error('Staff queue error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
