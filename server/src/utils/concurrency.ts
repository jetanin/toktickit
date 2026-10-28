import type { Request, Response } from 'express';
import type { Ticket } from '../../generated/prisma/client';
import { prisma } from '../app';
import { formatTicket } from './format';

export function sendConflict(res: Response, ticket: Ticket) {
  res.status(409).json({
    error: 'Conflict: Ticket has been modified by another user. Please refresh and review latest changes.',
    code: 'CONCURRENCY_CONFLICT', currentVersion: ticket.version, version: ticket.version,
    updatedAt: ticket.updatedAt, ticket: formatTicket(ticket),
  });
}

export function checkConcurrency(req: Request, res: Response, ticket: Ticket): boolean {
  const version = req.body?.version;
  const ifMatch = req.header('If-Match')?.replace(/^"|"$/g, '');
  const timestamp = req.body?.updatedAt;
  let stale = false;
  if (version !== undefined) {
    stale = typeof version !== 'number' || !Number.isInteger(version) || version !== ticket.version;
  } else if (timestamp !== undefined) {
    stale = typeof timestamp !== 'string' || new Date(timestamp).getTime() !== ticket.updatedAt.getTime();
  } else if (ifMatch !== undefined) {
    stale = ifMatch !== String(ticket.version) && new Date(ifMatch).getTime() !== ticket.updatedAt.getTime();
  }
  if (stale) sendConflict(res, ticket);
  return !stale;
}

// The write also predicates on the version read by the handler. A race after
// validation becomes P2025 rather than overwriting a concurrent change.
export async function handleConcurrentWrite(error: unknown, req: Request, res: Response): Promise<boolean> {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'P2025') return false;
  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (ticket) sendConflict(res, ticket);
  else res.status(404).json({ error: 'Ticket not found' });
  return true;
}
