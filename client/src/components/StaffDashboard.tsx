import { Metric, TicketList } from './DashboardShared';
import { useDashboard } from '../hooks/useDashboard';
import type { DashboardFilters, DashboardTicket } from './DashboardShared';

export interface StaffDashboardData {
  totalActiveQueueCount: number; unassignedCount: number; myAssignedCount: number;
  statusBreakdown: Record<string, number>; priorityBreakdown: Record<string, number>;
  urgentTickets: DashboardTicket[]; recentUpdatedTickets: DashboardTicket[];
  userGovernance?: { activeUsersCount: number; activeRequestersCount: number; activeStaffCount: number; activeAdminsCount: number };
}
interface Props {
  isAdmin?: boolean; onViewTicket: (id: number) => void;
  onViewQueue: (filters: DashboardFilters) => void; onManageUsers?: () => void; onCreateNew?: () => void;
}
export default function StaffDashboard({ isAdmin = false, onViewTicket, onViewQueue, onManageUsers, onCreateNew }: Props) {
  const { data, loading, error, refresh } = useDashboard<StaffDashboardData>(isAdmin ? '/api/admin/dashboard' : '/api/staff/dashboard');
  return <section className="dashboard" aria-label={isAdmin ? 'Administrator dashboard' : 'Staff dashboard'}>
    <div className="d-flex flex-wrap justify-content-between gap-2 mb-4"><h1 className="h3">{isAdmin ? 'Administrator' : 'IT Staff'} Dashboard</h1>
      <button className="btn btn-outline-success" onClick={refresh} disabled={loading}>Refresh</button></div>
    {loading && <p role="status">Loading dashboard…</p>}
    {error && <div role="alert" className="alert alert-danger">{error} <button className="btn btn-outline-danger" onClick={refresh}>Retry</button></div>}
    {!loading && !error && data && <>
      <div className="row g-3">
        {Object.entries(data.statusBreakdown).map(([status, count]) => <Metric key={status} label={status} value={count} onClick={() => onViewQueue({ status })} />)}
        <Metric label="My Assigned" value={data.myAssignedCount} onClick={() => onViewQueue({ assigned: 'me' })} />
        <Metric label="Unassigned Queue" value={data.unassignedCount} onClick={() => onViewQueue({ assigned: 'unassigned' })} />
        <Metric label="Total Active Queue" value={data.totalActiveQueueCount} onClick={() => onViewQueue({ status: 'Active' })} />
      </div>
      <div className="row g-4"><div className="col-12 col-lg-8">
      <TicketList title="Recent Updated Tickets" tickets={data.recentUpdatedTickets} onViewTicket={onViewTicket} empty="No recent tickets in queue." />
      </div><aside className="col-12 col-lg-4" aria-label="Queue overview">
      <section className="card shadow-sm mt-4"><div className="card-body"><h2 className="h5">Quick Actions</h2>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-success" onClick={() => onViewQueue({ assigned: 'me' })}>My Queue</button>
          <button className="btn btn-outline-success" onClick={() => onViewQueue({ assigned: 'unassigned' })}>Unassigned Queue ({data.unassignedCount})</button>
        </div>
      </div></section>
      <section className="card shadow-sm mt-4"><div className="card-body"><h2 className="h5">Priority Breakdown</h2>
        <dl className="d-flex flex-wrap gap-4 mb-0">{Object.entries(data.priorityBreakdown).map(([priority, count]) => <div key={priority}><dt>{priority}</dt><dd>{count}</dd></div>)}</dl>
      </div></section>
      <TicketList title="Urgent Tickets" tickets={data.urgentTickets} onViewTicket={onViewTicket} empty="No urgent or critical tickets requiring immediate attention." />
      </aside></div>
      {isAdmin && data.userGovernance && <section className="card shadow-sm mb-4"><div className="card-body"><h2 className="h5">User Management Summary</h2>
        <dl className="d-flex flex-wrap gap-4">
          <div><dt>Active Users</dt><dd>{data.userGovernance.activeUsersCount}</dd></div>
          <div><dt>Requesters</dt><dd>{data.userGovernance.activeRequestersCount}</dd></div>
          <div><dt>IT Staff</dt><dd>{data.userGovernance.activeStaffCount}</dd></div>
          <div><dt>Administrators</dt><dd>{data.userGovernance.activeAdminsCount}</dd></div>
        </dl><button className="btn btn-outline-success" onClick={onManageUsers}>Manage All Users</button>
      </div></section>}
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-outline-success" onClick={() => onViewQueue({})}>Search Tickets</button>
        {onCreateNew && <button className="btn btn-success" onClick={onCreateNew}>Create Ticket</button>}</div>
    </>}
  </section>;
}
