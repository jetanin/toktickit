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

// Format ticket for API response
export const formatTicket = (ticket: any) => {
  return {
    ...ticket,
    requestedPriority: mapPriority(ticket.requestedPriority),
    itPriority: mapPriority(ticket.itPriority),
    currentStatus: mapStatus(ticket.currentStatus),
  };
};

