import React, { useState, useEffect } from 'react';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Props {
  currentUser?: { id: number; name: string; email: string; role: string } | null;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Pagination state (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // System-wide active admins count (from X-Active-Admins-Count header or computed)
  const [systemActiveAdminsCount, setSystemActiveAdminsCount] = useState<number>(2);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);

  // Create Form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>('REQUESTER');
  const [createActive, setCreateActive] = useState(true);
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR'>('REQUESTER');
  const [editActive, setEditActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Form state
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (roleFilter !== 'ALL') {
        params.append('role', roleFilter);
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/users${query}`);

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access forbidden: Administrator privileges required.');
        }
        throw new Error(`Failed to load users (Status: ${res.status})`);
      }

      // Check for system-wide active admins count header
      const headerCount = res.headers?.get?.('X-Active-Admins-Count');
      const data = await res.json();
      const userList = Array.isArray(data) ? data : [];
      setUsers(userList);

      if (headerCount !== null && headerCount !== undefined && !isNaN(parseInt(headerCount, 10))) {
        setSystemActiveAdminsCount(parseInt(headerCount, 10));
      } else {
        const count = userList.filter((u: AdminUser) => u.role === 'ADMINISTRATOR' && u.isActive).length;
        setSystemActiveAdminsCount(count);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = users.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Create User Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          role: createRole,
          isActive: createActive,
          initialPassword: createPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || 'This email address is already in use');
        }
        throw new Error(data.error || 'Failed to create user.');
      }

      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreateRole('REQUESTER');
      setCreateActive(true);
      setCreatePassword('');
      setShowCreatePassword(false);
      setCurrentPage(1);
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditActive(user.isActive);
    setEditError(null);
  };

  // Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          isActive: editActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || 'This email address is already in use');
        }
        throw new Error(data.error || 'Failed to update user.');
      }

      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const openResetModal = (user: AdminUser) => {
    setResettingUser(user);
    setResetPassword('');
    setShowResetPassword(false);
    setResetError(null);
    setResetSuccess(null);
  };

  // Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    setResetSubmitting(true);
    setResetError(null);

    try {
      const res = await fetch(`/api/admin/users/${resettingUser.id}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialPassword: resetPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setResetSuccess(`New initial password successfully set for ${resettingUser.name}.`);
      setResetPassword('');
      setShowResetPassword(false);
      setTimeout(() => {
        setResettingUser(null);
        setResetSuccess(null);
      }, 1500);
      await fetchUsers();
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Effective current user resolution (from props or localStorage)
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('toktickit_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const effectiveCurrentUser = currentUser || storedUser;
  const currentAdminId = effectiveCurrentUser?.id != null ? Number(effectiveCurrentUser.id) : null;
  const currentAdminEmail = effectiveCurrentUser?.email?.trim().toLowerCase() || null;

  // Self check: strictly matches logged-in administrator by ID or email
  const isSelf = Boolean(
    editingUser && (
      (currentAdminId !== null && Number(editingUser.id) === currentAdminId) ||
      (currentAdminEmail !== null && editingUser.email?.trim().toLowerCase() === currentAdminEmail)
    )
  );

  // System-wide active administrator count (use systemActiveAdminsCount if search/filter applied or unfiltered length)
  const isFiltered = Boolean(searchTerm.trim() || roleFilter !== 'ALL');
  const effectiveActiveAdminsCount = (!isFiltered && users.length > 0)
    ? users.filter((u) => u.role === 'ADMINISTRATOR' && u.isActive).length
    : systemActiveAdminsCount;

  // Sole active admin protection: ONLY fires if target is an active Administrator AND is the last active one across the system
  const isSoleActiveAdmin = Boolean(
    editingUser &&
    editingUser.role === 'ADMINISTRATOR' &&
    editingUser.isActive &&
    effectiveActiveAdminsCount <= 1
  );

  // Zen Green Theme Token Badges
  const getRoleBadge = (role: string) => {
    if (role === 'ADMINISTRATOR') {
      return (
        <span
          className="badge px-2 py-1 fw-medium"
          style={{ backgroundColor: '#F3E8FD', color: '#6929C4', border: '1px solid #D4BBFF' }}
        >
          Administrator
        </span>
      );
    }
    if (role === 'IT_STAFF') {
      return (
        <span
          className="badge px-2 py-1 fw-medium"
          style={{ backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #C3E6D5' }}
        >
          IT Staff
        </span>
      );
    }
    return (
      <span
        className="badge px-2 py-1 fw-medium"
        style={{ backgroundColor: '#E8F4FD', color: '#1B6CA8', border: '1px solid #B8DCF8' }}
      >
        Requester
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span
          className="badge px-2 py-1 fw-medium"
          style={{ backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #C3E6D5' }}
        >
          Active
        </span>
      );
    }
    return (
      <span
        className="badge px-2 py-1 fw-medium"
        style={{ backgroundColor: '#FCE8E6', color: '#C5221F', border: '1px solid #F7BDB8' }}
      >
        Inactive
      </span>
    );
  };

  return (
    <div className="container py-4">
      {/* Top Toolbar (Section 5.5) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: '#006B3C' }}>
            Users
          </h1>
          <p className="text-muted small mb-0">
            Administrator user provisioning, role governance, and account activation.
          </p>
        </div>

        <button
          type="button"
          className="btn text-white fw-semibold px-3 py-2 d-flex align-items-center gap-2"
          style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
          onClick={() => {
            setShowCreateModal(true);
            setCreateError(null);
          }}
        >
          <span>+</span> Create User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search users"
                />
                <button
                  type="submit"
                  className="btn btn-outline-secondary"
                  disabled={loading}
                >
                  Search
                </button>
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                      // Refetch without search
                      setTimeout(() => {
                        const params = new URLSearchParams();
                        if (roleFilter !== 'ALL') params.append('role', roleFilter);
                        fetch(`/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`)
                          .then((r) => r.json())
                          .then((data) => setUsers(Array.isArray(data) ? data : []));
                      }, 0);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 ms-auto">
              <label htmlFor="roleFilterSelect" className="small text-muted text-nowrap mb-0">
                Filter by Role:
              </label>
              <select
                id="roleFilterSelect"
                aria-label="Filter by Role"
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="REQUESTER">Requester</option>
                <option value="IT_STAFF">IT Staff</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* Feedback States: Error Banner */}
      {error && (
        <div className="alert alert-danger py-3 mb-4 shadow-sm" role="alert">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <div className="spinner-border mb-2" role="status" style={{ color: '#006B3C' }}>
                <span className="visually-hidden">Loading users...</span>
              </div>
              <div className="text-muted small">Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="py-5 text-center text-muted">
              <p className="mb-0">No users found.</p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View (>= 768px) */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead style={{ backgroundColor: '#F5F7F6', borderBottom: '2px solid #D0DDD6' }}>
                    <tr>
                      <th className="py-3 px-3 text-secondary small fw-semibold" style={{ width: '22%' }}>Name</th>
                      <th className="py-3 px-3 text-secondary small fw-semibold" style={{ width: '26%' }}>Email</th>
                      <th className="py-3 px-3 text-secondary small fw-semibold" style={{ width: '15%' }}>Role</th>
                      <th className="py-3 px-3 text-secondary small fw-semibold" style={{ width: '12%' }}>Status</th>
                      <th className="py-3 px-3 text-secondary small fw-semibold text-end" style={{ width: '25%', minWidth: '175px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                        <td className="py-3 px-3">
                          <strong className="text-dark small d-block text-truncate" title={u.name}>{u.name}</strong>
                          {u.mustChangePassword && (
                            <span
                              className="badge bg-warning text-dark fw-normal"
                              style={{ fontSize: '0.68rem' }}
                            >
                              Password Change Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 small text-muted font-monospace text-truncate" title={u.email}>{u.email}</td>
                        <td className="py-3 px-3 text-nowrap">{getRoleBadge(u.role)}</td>
                        <td className="py-3 px-3 text-nowrap">{getStatusBadge(u.isActive)}</td>
                        <td className="py-3 px-3 text-end text-nowrap">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary px-2 py-1"
                              onClick={() => openEditModal(u)}
                              aria-label={`Edit ${u.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary px-2 py-1"
                              onClick={() => openResetModal(u)}
                              aria-label={`Reset password for ${u.name}`}
                            >
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< 768px) */}
              <div className="d-md-none d-flex flex-column gap-3 p-3" data-testid="user-cards-mobile">
                {paginatedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="card border shadow-sm"
                    style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}
                    data-testid="user-card-item"
                  >
                    <div className="card-body p-3">
                      {/* Top Row: Name + Badges */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="text-dark d-block text-truncate" style={{ fontSize: '0.95rem' }} title={u.name}>
                            {u.name}
                          </strong>
                          <span
                            className="small text-muted font-monospace text-truncate d-block mt-1"
                            style={{ fontSize: '0.8rem' }}
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                          {getStatusBadge(u.isActive)}
                          {getRoleBadge(u.role)}
                        </div>
                      </div>

                      {u.mustChangePassword && (
                        <div className="mb-2">
                          <span
                            className="badge bg-warning text-dark fw-normal"
                            style={{ fontSize: '0.7rem' }}
                          >
                            Password Change Pending
                          </span>
                        </div>
                      )}

                      {/* Action Buttons: Full touch targets (>= 44px) */}
                      <div className="pt-2 mt-2 border-top d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center fw-medium"
                          style={{ minHeight: '44px' }}
                          onClick={() => openEditModal(u)}
                          aria-label={`Edit ${u.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center fw-medium"
                          style={{ minHeight: '44px' }}
                          onClick={() => openResetModal(u)}
                          aria-label={`Reset password for ${u.name}`}
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls (10 items per page) */}
          {!loading && users.length > 0 && (
            <div className="card-footer bg-white border-top py-3 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="small text-muted">
                Showing {startIndex + 1} to {endIndex} of {totalItems} users{totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}
              </span>
              {totalPages > 1 && (
                <div className="btn-group" role="navigation" aria-label="Pagination">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{ minHeight: '36px', minWidth: '44px' }}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
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
                            p === currentPage ? 'btn-success text-white' : 'btn-outline-secondary'
                          }`}
                          style={p === currentPage ? { backgroundColor: '#006B3C', borderColor: '#006B3C' } : {}}
                          onClick={() => setCurrentPage(p)}
                          aria-current={p === currentPage ? 'page' : undefined}
                          aria-label={`Page ${p}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{ minHeight: '36px', minWidth: '44px' }}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header border-bottom py-3">
                  <h2 className="modal-title h5 fw-bold mb-0" style={{ color: '#006B3C' }}>
                    Create New User
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createSubmitting}
                  />
                </div>

                <div className="modal-body p-4">
                  {createError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {createError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="createUserName" className="form-label small fw-semibold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="createUserName"
                      type="text"
                      className="form-control form-control-sm"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="createUserEmail" className="form-label small fw-semibold text-dark">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      id="createUserEmail"
                      type="email"
                      className="form-control form-control-sm"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="createUserRole" className="form-label small fw-semibold text-dark">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      id="createUserRole"
                      aria-label="Role"
                      className="form-select form-select-sm"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      id="createUserActive"
                      type="checkbox"
                      className="form-check-input"
                      checked={createActive}
                      onChange={(e) => setCreateActive(e.target.checked)}
                      role="switch"
                    />
                    <label htmlFor="createUserActive" className="form-check-label small fw-semibold text-dark">
                      Active Account
                    </label>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="createUserPassword" className="form-label small fw-semibold text-dark">
                      Initial Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <input
                        id="createUserPassword"
                        type={showCreatePassword ? 'text' : 'password'}
                        className="form-control form-control-sm"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="Minimum 8 chars, mixed case, number, symbol"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showCreatePassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                          </svg>
                        )}
                        <span className="ms-1 small">{showCreatePassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="form-text small text-muted" style={{ fontSize: '0.75rem' }}>
                      User will be required to change this password on their first login (BR-02).
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header border-bottom py-3">
                  <h2 className="modal-title h5 fw-bold mb-0" style={{ color: '#006B3C' }}>
                    Edit User Details
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setEditingUser(null)}
                    disabled={editSubmitting}
                  />
                </div>

                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="editUserName" className="form-label small fw-semibold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="editUserName"
                      type="text"
                      className="form-control form-control-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editUserEmail" className="form-label small fw-semibold text-dark">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      id="editUserEmail"
                      type="email"
                      className="form-control form-control-sm"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editUserRole" className="form-label small fw-semibold text-dark">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      id="editUserRole"
                      aria-label="Role"
                      className="form-select form-select-sm"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      disabled={Boolean(isSoleActiveAdmin)}
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                    {isSoleActiveAdmin && (
                      <div className="form-text text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                        Role modification locked: This is the sole active Administrator account (BR-25).
                      </div>
                    )}
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      id="editUserActive"
                      type="checkbox"
                      className="form-check-input"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      role="switch"
                      disabled={Boolean(isSelf || isSoleActiveAdmin)}
                    />
                    <label htmlFor="editUserActive" className="form-check-label small fw-semibold text-dark">
                      Active Account
                    </label>
                    {isSelf && (
                      <div className="form-text text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                        Deactivation disabled: You cannot deactivate your own account (BR-24).
                      </div>
                    )}
                    {!isSelf && isSoleActiveAdmin && (
                      <div className="form-text text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                        Deactivation disabled: Cannot deactivate the last active Administrator (BR-25).
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingUser(null)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleResetSubmit}>
                <div className="modal-header border-bottom py-3">
                  <h2 className="modal-title h5 fw-bold mb-0" style={{ color: '#006B3C' }}>
                    Reset Password
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setResettingUser(null)}
                    disabled={resetSubmitting}
                  />
                </div>

                <div className="modal-body p-4">
                  {resetError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {resetError}
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="alert alert-success py-2 small mb-3" role="alert">
                      {resetSuccess}
                    </div>
                  )}

                  <p className="small text-muted mb-3">
                    Set a new initial password for <strong className="text-dark">{resettingUser.name}</strong> ({resettingUser.email}).
                  </p>

                  <div className="mb-3">
                    <label htmlFor="resetUserPassword" className="form-label small fw-semibold text-dark">
                      New Initial Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <input
                        id="resetUserPassword"
                        type={showResetPassword ? 'text' : 'password'}
                        className="form-control form-control-sm"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Enter new temporary password..."
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showResetPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                          </svg>
                        )}
                        <span className="ms-1 small">{showResetPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="form-text small text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                      <strong>Warning:</strong> The user will be required to change this password on their next login (BR-26).
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setResettingUser(null)}
                    disabled={resetSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                    disabled={resetSubmitting || !resetPassword}
                  >
                    {resetSubmitting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

