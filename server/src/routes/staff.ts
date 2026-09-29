import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { requireRole } from '../middleware/auth';
import type { Role } from '../../generated/prisma/client';
import { formatTicket, parseStatus, parsePriority, mapStatus, mapPriority, formatActionTaken, parseActionStatus } from '../utils/format';
import { isValidTransition } from '../utils/statusTransitions';

const router = Router();

// Staff routes are restricted to IT_STAFF and ADMINISTRATOR
router.use(requireRole('IT_STAFF' as Role, 'ADMINISTRATOR' as Role));

// GET /api/staff/assignees - list active IT Staff & Administrator users for assignment
router.get('/assignees', async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['IT_STAFF', 'ADMINISTRATOR'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json(assignees);
  } catch (err) {
    console.error('Staff assignees error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
      const priorityMapped = parsePriority(priority);
      if (priorityMapped) where.itPriority = priorityMapped;
    }

    // Status filter
    if (status && typeof status === 'string') {
      const statusMapped = parseStatus(status);
      if (statusMapped) where.currentStatus = statusMapped;
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

// Helper for claim/reassign handler (supports both /owner and /assign)
const handleAssignOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const { ticketOwnerId, ownerId } = req.body;

    // Determine target owner:
    // If ticketOwnerId is explicitly passed as null, it means unassign.
    // If undefined in body, default to claiming for oneself (user.id).
    let targetOwnerId: number | null;
    if (ticketOwnerId === null || ownerId === null) {
      targetOwnerId = null;
    } else if (ticketOwnerId !== undefined) {
      targetOwnerId = parseInt(ticketOwnerId, 10);
    } else if (ownerId !== undefined) {
      targetOwnerId = parseInt(ownerId, 10);
    } else {
      targetOwnerId = user.id; // self-claim
    }

    if (targetOwnerId !== null && isNaN(targetOwnerId)) {
      res.status(400).json({ error: 'Invalid owner id' });
      return;
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // If assigning to a user, verify user is active and has IT_STAFF or ADMINISTRATOR role
    if (targetOwnerId !== null) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetOwnerId },
      });

      if (
        !targetUser ||
        !targetUser.isActive ||
        (targetUser.role !== 'IT_STAFF' && targetUser.role !== 'ADMINISTRATOR')
      ) {
        res.status(400).json({
          error: 'Target owner must be an active IT Staff or Administrator user',
        });
        return;
      }
    }

    // Business Behavior (BR-12):
    // If ticket status is NEW and being assigned to a user, auto-transition to OPEN
    const updateData: any = {
      ticketOwnerId: targetOwnerId,
    };
    if (targetOwnerId !== null && ticket.currentStatus === 'NEW') {
      updateData.currentStatus = 'OPEN';
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        ticketOwner: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(200).json({
      id: updated.id,
      ticketOwnerId: updated.ticketOwnerId,
      currentStatus: mapStatus(updated.currentStatus),
      ticketOwner: updated.ticketOwner,
    });
  } catch (err) {
    console.error('Assign owner error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 6.2 PATCH /api/staff/tickets/:id/owner (User prompt requirement) & /assign (api-spec.md requirement)
router.patch('/tickets/:id/owner', handleAssignOwner);
router.patch('/tickets/:id/assign', handleAssignOwner);

// 6.3 PATCH /api/staff/tickets/:id/priority
router.patch('/tickets/:id/priority', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const { itPriority, priority } = req.body;
    const rawPriority = itPriority || priority;
    const parsed = parsePriority(rawPriority);

    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!parsed || !allowedPriorities.includes(parsed)) {
      res.status(400).json({
        error: 'Invalid priority. Allowed values: Low, Medium, High, Critical',
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: parsed as any },
    });

    res.status(200).json({
      id: updated.id,
      itPriority: mapPriority(updated.itPriority),
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error('Update priority error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6.4 PATCH /api/staff/tickets/:id/status
router.patch('/tickets/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const { status, resolutionSummary } = req.body;
    if (!status || typeof status !== 'string') {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const nextParsed = parseStatus(status);
    if (!nextParsed) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Enforce BR-15 status transition matrix
    if (!isValidTransition(ticket.currentStatus, nextParsed)) {
      res.status(400).json({
        error: `Invalid status transition from ${mapStatus(ticket.currentStatus)} to ${status}`,
      });
      return;
    }

    // Enforce BR-16: Non-empty resolutionSummary required when transitioning to RESOLVED
    if (nextParsed === 'RESOLVED') {
      if (
        !resolutionSummary ||
        typeof resolutionSummary !== 'string' ||
        resolutionSummary.trim().length === 0 ||
        resolutionSummary.trim().length > 1000
      ) {
        res.status(400).json({
          error: 'Resolution summary is required when resolving a ticket (1-1000 characters)',
        });
        return;
      }
    }

    const updateData: any = {
      currentStatus: nextParsed,
    };
    if (nextParsed === 'RESOLVED' && resolutionSummary) {
      updateData.resolutionSummary = resolutionSummary.trim();
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    res.status(200).json({
      id: updated.id,
      currentStatus: mapStatus(updated.currentStatus),
      resolutionSummary: updated.resolutionSummary,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// ACTIONS TAKEN (Sprint 4)
// ==========================================

// 2.2 POST /api/staff/tickets/:id/actions-taken
router.post('/tickets/:id/actions-taken', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const {
      description,
      result,
      assigneeId,
      status,
      isFollowUpRequired,
      followUpNote,
      attachmentNotes,
      actionDateTime,
    } = req.body;

    // Validate description (1-1000 chars)
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0 ||
      description.trim().length > 1000
    ) {
      res.status(400).json({ error: 'Action description is required (1-1000 characters)' });
      return;
    }

    // Validate result (1-1000 chars)
    if (
      !result ||
      typeof result !== 'string' ||
      result.trim().length === 0 ||
      result.trim().length > 1000
    ) {
      res.status(400).json({ error: 'Action result is required (1-1000 characters)' });
      return;
    }

    // Validate assigneeId (defaults to authenticated caller)
    let finalAssigneeId = user.id;
    if (assigneeId !== undefined && assigneeId !== null) {
      const parsedAssigneeId = parseInt(assigneeId, 10);
      if (isNaN(parsedAssigneeId)) {
        res.status(400).json({ error: 'Target assignee must be an active IT Staff or Administrator user.' });
        return;
      }
      const assigneeUser = await prisma.user.findUnique({
        where: { id: parsedAssigneeId },
      });
      if (
        !assigneeUser ||
        !assigneeUser.isActive ||
        (assigneeUser.role !== 'IT_STAFF' && assigneeUser.role !== 'ADMINISTRATOR')
      ) {
        res.status(400).json({ error: 'Target assignee must be an active IT Staff or Administrator user.' });
        return;
      }
      finalAssigneeId = assigneeUser.id;
    }

    // Validate status (defaults to COMPLETED)
    let finalStatus: any = 'COMPLETED';
    if (status !== undefined && status !== null) {
      const parsedStatus = parseActionStatus(status);
      if (!parsedStatus) {
        res.status(400).json({ error: 'Invalid action status. Must be Pending, In Progress, Completed, or Cancelled.' });
        return;
      }
      finalStatus = parsedStatus;
    }

    // Validate follow-up coupling (follow-up note mandatory if follow-up required)
    const followUpFlag = Boolean(isFollowUpRequired);
    let finalFollowUpNote: string | null = null;
    if (followUpFlag) {
      if (
        !followUpNote ||
        typeof followUpNote !== 'string' ||
        followUpNote.trim().length === 0 ||
        followUpNote.trim().length > 1000
      ) {
        res.status(400).json({ error: 'Follow-up note is required when follow-up is requested.' });
        return;
      }
      finalFollowUpNote = followUpNote.trim();
    }

    // Validate attachmentNotes (max 500 chars)
    let finalAttachmentNotes: string | null = null;
    if (attachmentNotes !== undefined && attachmentNotes !== null) {
      if (typeof attachmentNotes !== 'string' || attachmentNotes.trim().length > 500) {
        res.status(400).json({ error: 'Attachment notes must not exceed 500 characters' });
        return;
      }
      finalAttachmentNotes = attachmentNotes.trim() || null;
    }

    // Validate actionDateTime
    let finalActionDateTime = new Date();
    if (actionDateTime) {
      const parsedDate = new Date(actionDateTime);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid action date/time format' });
        return;
      }
      finalActionDateTime = parsedDate;
    }

    const created = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime: finalActionDateTime,
        description: description.trim(),
        result: result.trim(),
        performedById: user.id, // Strictly auto-attributed to authenticated caller
        assigneeId: finalAssigneeId,
        status: finalStatus,
        isFollowUpRequired: followUpFlag,
        followUpNote: finalFollowUpNote,
        attachmentNotes: finalAttachmentNotes,
      },
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(formatActionTaken(created));
  } catch (err) {
    console.error('Create action taken error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2.3 GET /api/staff/tickets/:id/actions-taken/:actionId
router.get('/tickets/:id/actions-taken/:actionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const actionId = parseInt(req.params.actionId, 10);
    if (isNaN(ticketId) || isNaN(actionId)) {
      res.status(400).json({ error: 'Invalid ticket id or action id' });
      return;
    }

    const action = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!action) {
      res.status(404).json({ error: 'Action Taken not found' });
      return;
    }

    res.status(200).json(formatActionTaken(action));
  } catch (err) {
    console.error('Get single action taken error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2.4 PATCH /api/staff/tickets/:id/actions-taken/:actionId
router.patch('/tickets/:id/actions-taken/:actionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const actionId = parseInt(req.params.actionId, 10);
    if (isNaN(ticketId) || isNaN(actionId)) {
      res.status(400).json({ error: 'Invalid ticket id or action id' });
      return;
    }

    const existing = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Action Taken not found' });
      return;
    }

    const {
      description,
      result,
      assigneeId,
      status,
      isFollowUpRequired,
      followUpNote,
      attachmentNotes,
    } = req.body;

    const dataToUpdate: any = {};

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 1000) {
        res.status(400).json({ error: 'Action description must be between 1 and 1000 characters' });
        return;
      }
      dataToUpdate.description = description.trim();
    }

    if (result !== undefined) {
      if (typeof result !== 'string' || result.trim().length === 0 || result.trim().length > 1000) {
        res.status(400).json({ error: 'Action result must be between 1 and 1000 characters' });
        return;
      }
      dataToUpdate.result = result.trim();
    }

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        dataToUpdate.assigneeId = null;
      } else {
        const parsedAssigneeId = parseInt(assigneeId, 10);
        if (isNaN(parsedAssigneeId)) {
          res.status(400).json({ error: 'Target assignee must be an active IT Staff or Administrator user.' });
          return;
        }
        const assigneeUser = await prisma.user.findUnique({
          where: { id: parsedAssigneeId },
        });
        if (
          !assigneeUser ||
          !assigneeUser.isActive ||
          (assigneeUser.role !== 'IT_STAFF' && assigneeUser.role !== 'ADMINISTRATOR')
        ) {
          res.status(400).json({ error: 'Target assignee must be an active IT Staff or Administrator user.' });
          return;
        }
        dataToUpdate.assigneeId = assigneeUser.id;
      }
    }

    if (status !== undefined) {
      const parsedStatus = parseActionStatus(status);
      if (!parsedStatus) {
        res.status(400).json({ error: 'Invalid action status. Must be Pending, In Progress, Completed, or Cancelled.' });
        return;
      }
      dataToUpdate.status = parsedStatus;
    }

    // Follow-up evaluation
    const effectiveFollowUp = isFollowUpRequired !== undefined ? Boolean(isFollowUpRequired) : existing.isFollowUpRequired;
    dataToUpdate.isFollowUpRequired = effectiveFollowUp;

    if (effectiveFollowUp) {
      const newNote = followUpNote !== undefined ? followUpNote : existing.followUpNote;
      if (!newNote || typeof newNote !== 'string' || newNote.trim().length === 0 || newNote.trim().length > 1000) {
        res.status(400).json({ error: 'Follow-up note is required when follow-up is requested.' });
        return;
      }
      dataToUpdate.followUpNote = newNote.trim();
    } else {
      dataToUpdate.followUpNote = null;
    }

    if (attachmentNotes !== undefined) {
      if (attachmentNotes === null) {
        dataToUpdate.attachmentNotes = null;
      } else if (typeof attachmentNotes !== 'string' || attachmentNotes.trim().length > 500) {
        res.status(400).json({ error: 'Attachment notes must not exceed 500 characters' });
        return;
      } else {
        dataToUpdate.attachmentNotes = attachmentNotes.trim() || null;
      }
    }

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: dataToUpdate,
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(200).json(formatActionTaken(updated));
  } catch (err) {
    console.error('Update action taken error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
