import { parseStatus } from './format';

// BR-15 Status Transition Matrix
// Key: Current Status (Prisma TicketStatus enum string)
// Value: Array of permitted next statuses
export const PERMITTED_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  CANCELLED: [],
};

/**
 * Check if a status transition is valid according to BR-15.
 * Accepts either DB enum format ('NEW', 'IN_PROGRESS') or human-readable ('New', 'In Progress').
 */
export function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  const current = parseStatus(currentStatus);
  const next = parseStatus(nextStatus);

  if (!current || !next) {
    return false;
  }

  const allowedNext = PERMITTED_STATUS_TRANSITIONS[current] || [];
  return allowedNext.includes(next);
}

/**
 * Get the permitted next statuses from the current status according to BR-15.
 */
export function getPermittedNextStatuses(currentStatus: string): string[] {
  const current = parseStatus(currentStatus);
  if (!current) {
    return [];
  }
  return PERMITTED_STATUS_TRANSITIONS[current] || [];
}

