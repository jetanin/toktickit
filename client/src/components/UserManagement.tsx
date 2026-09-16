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

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || 'Failed to create user.');
      }

      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreateRole('REQUESTER');
      setCreateActive(true);
      setCreatePassword('');
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

  // Safety Guard evaluations for the user currently being edited
  const isSelf = editingUser && currentUser && editingUser.id === currentUser.id;
  const activeAdminsCount = users.filter((u) => u.role === 'ADMINISTRATOR' && u.isActive).length;
  const isSoleActiveAdmin = editingUser && editingUser.role === 'ADMINISTRATOR' && editingUser.isActive && activeAdminsCount <= 1;

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
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F5F7F6', borderBottom: '2px solid #D0DDD6' }}>
                  <tr>
                    <th className="py-3 px-3 text-secondary small fw-semibold">Name</th>
                    <th className="py-3 px-3 text-secondary small fw-semibold">Email</th>
                    <th className="py-3 px-3 text-secondary small fw-semibold">Role</th>
                    <th className="py-3 px-3 text-secondary small fw-semibold">Status</th>
                    <th className="py-3 px-3 text-secondary small fw-semibold text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                      <td className="py-3 px-3">
                        <strong className="text-dark small d-block">{u.name}</strong>
                        {u.mustChangePassword && (
                          <span
                            className="badge bg-warning text-dark fw-normal"
                            style={{ fontSize: '0.68rem' }}
                          >
                            Password Change Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 small text-muted font-monospace">{u.email}</td>
                      <td className="py-3 px-3">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-3">{getStatusBadge(u.isActive)}</td>
                      <td className="py-3 px-3 text-end">
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
                    <input
                      id="createUserPassword"
                      type="password"
                      className="form-control form-control-sm"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Minimum 8 chars, mixed case, number, symbol"
                      required
                    />
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
                    <input
                      id="resetUserPassword"
                      type="password"
                      className="form-control form-control-sm"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Enter new temporary password..."
                      required
                    />
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

