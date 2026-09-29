export const mapPriority = (p: string | null) => (p ? p.charAt(0) + p.slice(1).toLowerCase() : null);

export const mapStatus = (s: string) => {
  if (s === 'NEW') return 'New';
  if (s === 'OPEN') return 'Open';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'WAITING_FOR_REQUESTER') return 'Waiting for Requester';
  if (s === 'RESOLVED') return 'Resolved';
  if (s === 'CLOSED') return 'Closed';
  if (s === 'REOPENED') return 'Reopened';
  if (s === 'CANCELLED') return 'Cancelled';
  return s;
};

// Parse input status string (human-readable or raw enum) into DB TicketStatus enum value
export const parseStatus = (s: string | null | undefined): string | null => {
  if (!s || typeof s !== 'string') return null;
  const cleaned = s.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return cleaned || null;
};

// Parse input priority string (e.g. 'high', 'Medium') into DB Priority enum value
export const parsePriority = (p: string | null | undefined): string | null => {
  if (!p || typeof p !== 'string') return null;
  return p.trim().toUpperCase() || null;
};

// Format ticket for API response
export const formatTicket = (ticket: any) => {
  return {
    ...ticket,
    requestedPriority: mapPriority(ticket.requestedPriority),
    itPriority: mapPriority(ticket.itPriority),
    currentStatus: mapStatus(ticket.currentStatus),
  };
};

export const mapActionStatus = (s: string) => {
  if (s === 'PENDING') return 'Pending';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'CANCELLED') return 'Cancelled';
  return s;
};

// Parse input action status string into DB ActionStatus enum value
export const parseActionStatus = (s: string | null | undefined): string | null => {
  if (!s || typeof s !== 'string') return null;
  const cleaned = s.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(cleaned)) {
    return cleaned;
  }
  return null;
};

// Format ActionTaken for API response
export const formatActionTaken = (action: any) => {
  return {
    ...action,
    status: mapActionStatus(action.status),
  };
};


