import { badgeStyle } from '../utils/badges';

export interface DashboardTicket {
  id: number; ticketNumber: string; summary: string; currentStatus: string;
  itPriority: string | null; updatedAt: string; createdAt: string;
}
export interface DashboardFilters { status?: string; assigned?: string }

export function Metric({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  const context: Record<string, string> = { New: 'Awaiting triage', Open: 'Ready for work', 'In Progress': 'Active work',
    'Waiting for Requester': 'Requires user input', Reopened: 'Returned to active work', 'My Assigned': 'Assigned to me',
    'Unassigned Queue': 'Ready to claim', 'Total Active Queue': 'All active statuses', 'My Open Tickets': 'Your active requests',
    'Waiting for Me': 'Your response is needed', 'Recently Resolved': 'Updated within 30 days', 'Closed Tickets': 'Completed requests' };
  return <div className="col-12 col-md-6 col-lg-3"><div className="card h-100 shadow-sm"><div className="card-body">
    <h3 className="h6 text-muted">{label}</h3><p className="fs-2 fw-bold text-success mb-2">{value}</p>
    <p className="small text-muted">{context[label]}</p>
    {onClick && <button className="btn btn-outline-success" onClick={onClick} aria-label={`View ${label} tickets`}>View tickets</button>}
  </div></div></div>;
}

export function TicketList({ title, tickets, empty, onViewTicket }: {
  title: string; tickets: DashboardTicket[]; empty: string; onViewTicket: (id: number) => void;
}) {
  return <section className="card shadow-sm my-4"><div className="card-body">
    <h2 className="h5">{title}</h2>
    {tickets.length === 0 ? <p className="text-muted mb-0">{empty}</p> : <ul className="list-group list-group-flush">
      {tickets.map(ticket => <li key={ticket.id} className="list-group-item px-0 d-flex flex-wrap gap-3 align-items-center">
        <div className="flex-grow-1" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <strong>{ticket.ticketNumber}</strong><div>{ticket.summary}</div>
          <span className="badge me-2" style={badgeStyle(ticket.currentStatus, 'status')}>{ticket.currentStatus}</span>
          {ticket.itPriority && <span className="badge me-2" style={badgeStyle(ticket.itPriority, 'priority')}>{ticket.itPriority}</span>}
          <small className="text-muted">Updated {new Date(ticket.updatedAt).toLocaleString()} · Created {new Date(ticket.createdAt).toLocaleString()}</small>
        </div>
        <button className="btn btn-outline-success" onClick={() => onViewTicket(ticket.id)} aria-label={`View ${ticket.ticketNumber}`}>View Details</button>
      </li>)}
    </ul>}
  </div></section>;
}
