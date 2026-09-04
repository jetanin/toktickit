import React, { useState, useEffect } from 'react';
import type { Requester } from './RequesterSelector';

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  requestedPriority: string;
  itPriority: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  requester: { id: number; name: string };
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface Props {
  requester: Requester;
  onViewTicket: (ticketId: number) => void;
  onCreateNew?: () => void;
}

const MyTickets: React.FC<Props> = ({ requester, onViewTicket, onCreateNew }) => {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 8,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, submittedSearch, category, priority, status, sort, order, requester.id]);

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

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '8',
        sort,
        order,
      });

      if (submittedSearch.trim()) query.append('search', submittedSearch.trim());
      if (category) query.append('category', category);
      if (priority) query.append('priority', priority);
      if (status) query.append('status', status);

      const res = await fetch(`/api/tickets?${query.toString()}`, {
        headers: {
          'X-Requester-Id': String(requester.id),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load tickets (Status: ${res.status})`);
      }

      const json = await res.json();
      setTickets(json.data || []);
      setMeta(
        json.meta || {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 8,
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load tickets.');
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
    setSort('updatedAt');
    setOrder('desc');
    setPage(1);
  };

  // Badge stylings per Zen Green UI specification (ui-spec.md Section 9)
  const getPriorityBadge = (p: string | null) => {
    if (!p) return <span className="text-muted small">—</span>;
    const lower = p.toLowerCase();
    if (lower === 'low') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #BFE4D1' }}
        >
          Low
        </span>
      );
    }
    if (lower === 'medium') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FFF4E5', color: '#B25E00', border: '1px solid #FFE2B3' }}
        >
          Medium
        </span>
      );
    }
    if (lower === 'high') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FDECEB', color: '#9C1A1A', border: '1px solid #F8BEBC' }}
        >
          High
        </span>
      );
    }
    return <span className="badge bg-secondary">{p}</span>;
  };

  const getStatusBadge = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'new' || lower === 'open') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#E8F1FA', color: '#105696', border: '1px solid #BDD8F0' }}
        >
          {s}
        </span>
      );
    }
    if (lower === 'in progress') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #BFE4D1' }}
        >
          In Progress
        </span>
      );
    }
    if (lower === 'pending') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#FFF4E5', color: '#B25E00', border: '1px solid #FFE2B3' }}
        >
          Pending
        </span>
      );
    }
    if (lower === 'resolved') {
      return (
        <span
          className="badge fw-medium px-2 py-1"
          style={{ backgroundColor: '#EAF6EF', color: '#0B7A46', border: '1px solid #BFE4D1' }}
        >
          Resolved
        </span>
      );
    }
    return <span className="badge bg-secondary">{s}</span>;
  };

  return (
    <div>
      {/* Title & Quick Action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0" style={{ color: '#006B3C' }}>
            My Tickets
          </h1>
          <span className="small text-muted">Track and manage your submitted support requests</span>
        </div>
        {onCreateNew && (
          <button
            type="button"
            className="btn text-white fw-semibold px-3 py-2"
            style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
            onClick={onCreateNew}
          >
            + Create Ticket
          </button>
        )}
      </div>

      {/* Filter and Search Card */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2">
            <div className="col-12 col-md-6 col-lg-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search ticket number, summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <select
                className="form-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-grid">
              <button
                type="submit"
                className="btn text-white fw-semibold"
                style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort Controls & Clear Filters */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 mt-3 border-top">
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Sort:</span>
              <select
                className="form-select form-select-sm w-auto"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Created Date</option>
                <option value="ticketNumber">Ticket Number</option>
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
            </div>

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

      {/* Main Content: Loading, Error, Empty, or Tickets */}
      {loading ? (
        <div className="card shadow-sm border-0 py-5 text-center" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="spinner-border mx-auto mb-2" role="status" style={{ color: '#006B3C' }}>
            <span className="visually-hidden">Loading tickets...</span>
          </div>
          <span className="text-muted small">Loading your tickets...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
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
            <h5 className="fw-bold text-muted mb-1">No Ticket Found</h5>
            <p className="text-muted small mb-0">
              {submittedSearch || category || priority || status
                ? 'No tickets match your search or filter criteria.'
                : 'You have not submitted any support tickets yet.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table (>= 768px) */}
          <div className="d-none d-md-block card shadow-sm border-0 mb-3" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: '#F5F7F6', borderBottom: '1px solid #E2E8E5' }}>
                  <tr className="text-muted text-uppercase text-nowrap" style={{ fontSize: '0.75rem' }}>
                    <th className="ps-3 py-2">Ticket No.</th>
                    <th className="py-2 d-none d-lg-table-cell">Created Date</th>
                    <th className="py-2">Summary</th>
                    <th className="py-2 d-none d-lg-table-cell">Category</th>
                    <th className="py-2">Req. Priority</th>
                    <th className="py-2">IT Priority</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 d-none d-lg-table-cell">Requester</th>
                    <th className="py-2">Last Updated</th>
                    <th className="pe-3 py-2 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-3 py-2 fw-semibold text-muted text-nowrap">{t.ticketNumber}</td>
                      <td className="py-2 text-muted text-nowrap d-none d-lg-table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <strong className="d-block text-truncate" style={{ maxWidth: '160px' }}>
                          {t.summary}
                        </strong>
                      </td>
                      <td className="py-2 text-nowrap d-none d-lg-table-cell">{t.category?.name}</td>
                      <td className="py-2 text-nowrap">{getPriorityBadge(t.requestedPriority)}</td>
                      <td className="py-2 text-nowrap">{getPriorityBadge(t.itPriority)}</td>
                      <td className="py-2 text-nowrap">{getStatusBadge(t.currentStatus)}</td>
                      <td className="py-2 text-muted text-nowrap d-none d-lg-table-cell">{t.requester?.name}</td>
                      <td className="py-2 text-muted text-nowrap">{new Date(t.updatedAt).toLocaleDateString()}</td>
                      <td className="pe-3 py-2 text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success px-2 py-0"
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

          {/* Mobile Card View (< 768px) per ui-spec.md Section 5 */}
          <div className="d-md-none d-flex flex-column gap-3 mb-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card shadow-sm border-0"
                style={{ backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                onClick={() => onViewTicket(t.id)}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted fw-semibold">{t.ticketNumber}</span>
                    {getStatusBadge(t.currentStatus)}
                  </div>

                  <h6 className="fw-bold mb-2 text-dark">{t.summary}</h6>

                  <div className="d-flex justify-content-between align-items-center small text-muted pt-2 border-top">
                    <div>
                      <span>IT Priority: </span>
                      {getPriorityBadge(t.itPriority)}
                    </div>
                    <div className="text-end">
                      <div>Updated: {new Date(t.updatedAt).toLocaleDateString()}</div>
                      <div className="fw-semibold">{t.requester?.name}</div>
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
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={meta.currentPage >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
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

export default MyTickets;
