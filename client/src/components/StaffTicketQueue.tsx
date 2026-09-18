import React, { useState, useEffect } from 'react';
import type { AuthUser } from '../types';

export interface StaffTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: { id: number; name: string };
  requestedPriority: string;
  itPriority: string | null;
  currentStatus: string;
  requesterResolutionPending: boolean;
  requester: { id: number; name: string };
  ticketOwner: { id: number; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  page?: number;
  limit?: number;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface Props {
  currentUser: AuthUser;
  onViewTicket: (ticketId: number) => void;
  onCreateNew?: () => void;
}

const StaffTicketQueue: React.FC<Props> = ({ currentUser, onViewTicket, onCreateNew }) => {
  const [tickets, setTickets] = useState<StaffTicketItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [showTabletFilters, setShowTabletFilters] = useState(false);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assigned, setAssigned] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, []);

  const userId = currentUser ? currentUser.id : null;

  useEffect(() => {
    fetchQueueTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, submittedSearch, category, priority, status, assigned, sort, order, userId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchQueueTickets = async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
        order,
      });

      if (submittedSearch.trim()) query.append('search', submittedSearch.trim());
      if (category) query.append('category', category);
      if (priority) query.append('priority', priority);
      if (status) query.append('status', status);
      if (assigned && assigned !== 'all') query.append('assigned', assigned);

      const res = await fetch(`/api/staff/tickets?${query.toString()}`);

      if (res.status === 403) {
        setIsForbidden(true);
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Access forbidden: Insufficient permissions');
        setTickets([]);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load queue (Status: ${res.status})`);
      }

      const json = await res.json();
      setTickets(json.data || []);
      setMeta(
        json.meta || {
          totalItems: 0,
          totalPages: 1,
          currentPage: page,
          itemsPerPage: limit,
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load tickets queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setCategory('');
    setPriority('');
    setStatus('');
    setAssigned('all');
    setSort('createdAt');
    setOrder('desc');
    setPage(1);
  };

  // Badge stylings per Zen Green UI specification (ui-spec.md Section 1.2)
  const getPriorityBadge = (p: string | null) => {
    if (!p) return <span className="text-muted small">—</span>;
    const lower = p.toLowerCase();
    if (lower === 'low') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAF6EF', color: '#0B7A46', border: '1px solid #C3E6D5' }}
        >
          Low
        </span>
      );
    }
    if (lower === 'medium') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FEF8E7', color: '#8A6D00', border: '1px solid #FCEBB8' }}
        >
          Medium
        </span>
      );
    }
    if (lower === 'high') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FCE8E6', color: '#C5221F', border: '1px solid #F7BDB8' }}
        >
          High
        </span>
      );
    }
    if (lower === 'critical') {
      return (
        <span
          className="badge fw-medium px-2 py-1 text-white"
          style={{ backgroundColor: '#5A1A1A', border: '1px solid #3D1010' }}
        >
          Critical
        </span>
      );
    }
    return <span className="badge bg-secondary">{p}</span>;
  };

  const getStatusBadge = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'new') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#DEEBFF', color: '#0747A6', border: '1px solid #B3D4FF' }}
        >
          New
        </span>
      );
    }
    if (lower === 'open') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#E3FCEF', color: '#006644', border: '1px solid #ABF5D1' }}
        >
          Open
        </span>
      );
    }
    if (lower === 'in progress') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FFF0B3', color: '#172B4D', border: '1px solid #FFE380' }}
        >
          In Progress
        </span>
      );
    }
    if (lower === 'waiting for requester') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAE6FF', color: '#403294', border: '1px solid #C0B6F2' }}
        >
          Waiting for Requester
        </span>
      );
    }
    if (lower === 'resolved') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #C3E6D5' }}
        >
          Resolved
        </span>
      );
    }
    if (lower === 'closed') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#F4F5F7', color: '#42526E', border: '1px solid #DFE1E6' }}
        >
          Closed
        </span>
      );
    }
    if (lower === 'reopened') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FFEBE6', color: '#BF2600', border: '1px solid #FFBDAD' }}
        >
          Reopened
        </span>
      );
    }
    if (lower === 'cancelled') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#F4F5F7', color: '#8993A4', border: '1px solid #DFE1E6' }}
        >
          Cancelled
        </span>
      );
    }
    return <span className="badge bg-secondary">{s}</span>;
  };

  const startRecord = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.itemsPerPage + 1;
  const endRecord = Math.min(meta.totalItems, meta.currentPage * meta.itemsPerPage);

  const activeFiltersCount = [
    category,
    priority,
    status,
    assigned !== 'all' ? assigned : '',
  ].filter(Boolean).length;

  return (
    <div>
      {/* Title & Quick Action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0" style={{ color: '#006B3C' }}>
            IT Staff Ticket Queue
          </h1>
          <span className="small text-muted">Manage, triage, and investigate all incoming support requests</span>
        </div>
        {onCreateNew && (
          <button
            type="button"
            className="btn text-white fw-semibold px-3 py-2"
            style={{ backgroundColor: '#006B3C', borderColor: '#006B3C', minHeight: '44px' }}
            onClick={onCreateNew}
          >
            + Create Ticket
          </button>
        )}
      </div>

      {/* Filter and Search Card */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            {/* Search Input: Desktop col-lg-3, Tablet col-md-6, Mobile col-12 */}
            <div className="col-12 col-md-6 col-lg-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by ticket number or summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minHeight: '40px' }}
              />
            </div>

            {/* Tablet-only Collapsed "Filters" Button (768px - 991px) */}
            <div className="col-6 col-md-3 d-none d-md-block d-lg-none">
              <button
                type="button"
                className={`btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  showTabletFilters || activeFiltersCount > 0
                    ? 'btn-success text-white'
                    : 'btn-outline-secondary'
                }`}
                style={
                  showTabletFilters || activeFiltersCount > 0
                    ? { backgroundColor: '#006B3C', borderColor: '#006B3C', minHeight: '40px' }
                    : { minHeight: '40px' }
                }
                onClick={() => setShowTabletFilters(!showTabletFilters)}
                aria-expanded={showTabletFilters}
                aria-label="Filters"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
                </svg>
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span
                    className="badge bg-white text-dark rounded-pill"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Submit Button: Desktop col-lg-1, Tablet col-md-3, Mobile col-12 */}
            <div className="col-12 col-md-3 col-lg-1 d-grid">
              <button
                type="submit"
                className="btn text-white fw-semibold"
                style={{ backgroundColor: '#006B3C', borderColor: '#006B3C', minHeight: '40px' }}
              >
                Search
              </button>
            </div>

            {/* Filter Dropdowns Container:
                - On Desktop (>=992px): displayed in-line across the form row (`col-lg-3` inside `col-lg-8`)
                - On Tablet (768px-991px): collapsed into a popover/drawer panel below the main row if showTabletFilters is true, hidden if false
                - On Mobile (<768px): displayed directly in-line (`col-6` each)
            */}
            <div
              className={`col-12 col-lg-8 ${
                showTabletFilters
                  ? 'd-block mt-3 p-3 bg-light border rounded shadow-sm'
                  : 'd-block d-md-none d-lg-block'
              }`}
            >
              <div className="row g-2">
                <div className="col-6 col-md-3 col-lg-3">
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-3 col-lg-3">
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setPage(1);
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <option value="">All IT Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="col-6 col-md-3 col-lg-3">
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Requester">Waiting for Requester</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-6 col-md-3 col-lg-3">
                  <select
                    className="form-select"
                    value={assigned}
                    onChange={(e) => {
                      setAssigned(e.target.value);
                      setPage(1);
                    }}
                    style={{ minHeight: '40px' }}
                  >
                    <option value="all">All Assignments</option>
                    <option value="me">Assigned to Me</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </div>
              </div>
            </div>
          </form>

          {/* Sort Controls & Summary Count */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 mt-3 border-top">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="small text-muted">Sort:</span>
              <select
                className="form-select form-select-sm w-auto"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Last Updated</option>
                <option value="ticketNumber">Ticket Number</option>
                <option value="itPriority">IT Priority</option>
                <option value="currentStatus">Status</option>
              </select>
              <select
                className="form-select form-select-sm w-auto"
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value);
                  setPage(1);
                }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>

              <span className="small text-muted ms-2">Per Page:</span>
              <select
                id="rowsPerPageSelect"
                aria-label="Per Page"
                className="form-select form-select-sm w-auto"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span className="small text-muted">
                Showing {startRecord} to {endRecord} of {meta.totalItems} tickets
              </span>
              <button
                type="button"
                className="btn btn-link text-decoration-none p-0 small fw-semibold"
                style={{ color: '#0B7A46' }}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Forbidden, Error, Empty, or Table */}
      {loading ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="spinner-border mx-auto mb-2" role="status" style={{ color: '#006B3C' }}>
            <span className="visually-hidden">Loading queue...</span>
          </div>
          <span className="text-muted small">Loading ticket queue...</span>
        </div>
      ) : isForbidden ? (
        <div className="alert alert-danger" role="alert">
          {error || 'Access forbidden: Insufficient permissions'}
        </div>
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
          <div>{error}</div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchQueueTickets}
          >
            Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="py-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              className="text-muted mb-3 opacity-50"
              viewBox="0 0 16 16"
            >
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              <path d="M4 4.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
            </svg>
            <h5 className="fw-bold text-muted mb-1">No Tickets Found</h5>
            <p className="text-muted small mb-0">
              {submittedSearch || category || priority || status || assigned !== 'all'
                ? 'No tickets match your search or filter criteria.'
                : 'There are currently no tickets in the queue.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px / >= 992px per spec) */}
          <div className="d-none d-md-block card shadow-sm border-0 mb-3" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: '0.8rem', width: '100%' }}>
                <thead style={{ backgroundColor: '#F5F7F6', borderBottom: '1px solid #E2E8E5' }}>
                  <tr className="text-muted text-uppercase text-nowrap" style={{ fontSize: '0.72rem' }}>
                    <th className="ps-2 py-2">Ticket No.</th>
                    <th className="py-2 d-none d-lg-table-cell">Created Date</th>
                    <th className="py-2" style={{ maxWidth: '140px' }}>Summary</th>
                    <th className="py-2 d-none d-lg-table-cell">Category</th>
                    <th className="py-2 d-none d-lg-table-cell">Req. Priority</th>
                    <th className="py-2">IT Priority</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Owner</th>
                    <th className="py-2 d-none d-lg-table-cell">Last Updated</th>
                    <th className="pe-2 py-2 text-end" style={{ width: '65px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-2 py-2 fw-semibold text-nowrap">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-semibold font-monospace"
                          style={{ color: '#006B3C', fontSize: '0.8rem' }}
                          onClick={() => onViewTicket(t.id)}
                        >
                          {t.ticketNumber}
                        </button>
                        <span
                          className="d-none d-md-block d-lg-none small text-muted font-monospace"
                          style={{ fontSize: '0.72rem' }}
                        >
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2 text-muted text-nowrap d-none d-lg-table-cell">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2" style={{ maxWidth: '140px' }}>
                        <strong
                          className="d-block text-truncate"
                          style={{ maxWidth: '140px' }}
                          title={t.summary}
                        >
                          {t.summary}
                        </strong>
                        <div className="small text-muted d-flex align-items-center gap-1 flex-wrap" style={{ maxWidth: '140px' }}>
                          <span className="text-truncate" style={{ maxWidth: '80px' }} title={t.requester?.name}>
                            {t.requester?.name}
                          </span>
                          <span
                            className="d-none d-md-inline-block d-lg-none badge rounded-pill bg-light text-dark border ms-1"
                            style={{ fontSize: '0.68rem' }}
                          >
                            {t.category?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-nowrap d-none d-lg-table-cell">
                        <span className="badge rounded-pill bg-light text-dark border">
                          {t.category?.name}
                        </span>
                      </td>
                      <td className="py-2 text-nowrap d-none d-lg-table-cell">{getPriorityBadge(t.requestedPriority)}</td>
                      <td className="py-2 text-nowrap">{getPriorityBadge(t.itPriority)}</td>
                      <td className="py-2 text-nowrap">{getStatusBadge(t.currentStatus)}</td>
                      <td className="py-2 text-nowrap">
                        {t.ticketOwner ? (
                          <span className="fw-medium text-dark">{t.ticketOwner.name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2 text-muted text-nowrap d-none d-lg-table-cell">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="pe-2 py-2 text-end text-nowrap" style={{ width: '65px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success px-2 py-1 fw-medium"
                          style={{ color: '#0B7A46', borderColor: '#0B7A46', fontSize: '0.78rem' }}
                          onClick={() => onViewTicket(t.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< 768px) per ui-spec.md Section 5.3 */}
          <div className="d-md-none d-flex flex-column gap-3 mb-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                data-testid="staff-ticket-card"
                className="card shadow-sm border-0"
                style={{ backgroundColor: '#FFFFFF', cursor: 'pointer', minHeight: '44px' }}
                onClick={() => onViewTicket(t.id)}
              >
                <div className="card-body p-3">
                  {/* Card Header: Ticket Number + Status Badge */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold font-monospace" style={{ color: '#006B3C' }}>
                      {t.ticketNumber}
                    </span>
                    {getStatusBadge(t.currentStatus)}
                  </div>

                  {/* Card Body: Summary + Category + IT Priority */}
                  <h6 className="fw-bold mb-2 text-dark">{t.summary}</h6>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge rounded-pill bg-light text-dark border">
                      {t.category?.name}
                    </span>
                    <span className="small text-muted">IT Priority:</span>
                    {getPriorityBadge(t.itPriority)}
                  </div>

                  {/* Card Footer: Requester name + Owner + Last Updated */}
                  <div className="d-flex justify-content-between align-items-center small text-muted pt-2 border-top">
                    <div>
                      <div>
                        Req: <span className="text-dark fw-medium">{t.requester?.name}</span>
                      </div>
                      <div>
                        Owner:{' '}
                        {t.ticketOwner ? (
                          <span className="text-dark fw-medium">{t.ticketOwner.name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <div>Updated: {new Date(t.updatedAt).toLocaleDateString()}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success px-3 py-1 mt-1 fw-medium"
                        style={{ color: '#0B7A46', borderColor: '#0B7A46', minHeight: '44px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTicket(t.id);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-2">
              <span className="small text-muted">
                Showing page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} total tickets)
              </span>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ minHeight: '36px', minWidth: '44px' }}
                >
                  Previous
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
                          ...
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          p === meta.currentPage ? 'btn-success text-white' : 'btn-outline-secondary'
                        }`}
                        style={p === meta.currentPage ? { backgroundColor: '#006B3C', borderColor: '#006B3C' } : {}}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={meta.currentPage >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  style={{ minHeight: '36px', minWidth: '44px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffTicketQueue;

