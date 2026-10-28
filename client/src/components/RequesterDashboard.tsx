import { Metric, TicketList } from './DashboardShared';
import { useDashboard } from '../hooks/useDashboard';
import type { DashboardFilters, DashboardTicket } from './DashboardShared';

export interface RequesterDashboardData {
  openTicketsCount: number; waitingForRequesterCount: number; recentlyResolvedCount: number;
  closedTicketsCount: number; recentTickets: DashboardTicket[];
}
interface Props {
  onViewTicket: (id: number) => void;
  onViewTickets: (filters: DashboardFilters) => void;
  onCreateNew: () => void;
}
export default function RequesterDashboard({ onViewTicket, onViewTickets, onCreateNew }: Props) {
  const { data, loading, error, refresh } = useDashboard<RequesterDashboardData>('/api/requester/dashboard');
  return <section className="dashboard" aria-label="Requester dashboard">
    <div className="d-flex flex-wrap justify-content-between gap-2 mb-4"><h1 className="h3">Requester Dashboard</h1>
      <button className="btn btn-outline-success" onClick={refresh} disabled={loading}>Refresh</button></div>
    {loading && <p role="status">Loading dashboard…</p>}
    {error && <div role="alert" className="alert alert-danger">{error} <button className="btn btn-outline-danger" onClick={refresh}>Retry</button></div>}
    {!loading && !error && data && <>
      <div className="row g-3">
        <Metric label="My Open Tickets" value={data.openTicketsCount} onClick={() => onViewTickets({ status: 'Active' })} />
        <Metric label="Waiting for Me" value={data.waitingForRequesterCount} onClick={() => onViewTickets({ status: 'Waiting for Requester' })} />
        <Metric label="Recently Resolved" value={data.recentlyResolvedCount} onClick={() => onViewTickets({ status: 'Recently Resolved' })} />
        <Metric label="Closed Tickets" value={data.closedTicketsCount} onClick={() => onViewTickets({ status: 'Closed' })} />
      </div>
      <p className="small text-muted mt-2">Recently Resolved: resolved tickets updated within the last 30 days.</p>
      <TicketList title="My Recent Tickets" tickets={data.recentTickets} onViewTicket={onViewTicket} empty="You currently have no submitted support tickets. Click 'Submit New Ticket' to create one." />
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-success" onClick={onCreateNew}>Submit New Ticket</button>
        <button className="btn btn-outline-success" onClick={() => onViewTickets({})}>View All My Tickets</button></div>
    </>}
  </section>;
}
