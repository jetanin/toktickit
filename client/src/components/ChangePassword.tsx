import React, { useState } from 'react';

interface ChangePasswordProps {
  onSuccess: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live checklist criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(newPassword);
  const isDifferentFromCurrent = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    currentPassword.length > 0 &&
    (currentPassword.length === 0 || isDifferentFromCurrent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 1050,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="card shadow border-0 w-100" style={{ maxWidth: '520px', borderRadius: '12px' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <span className="badge rounded-pill bg-warning text-dark px-3 py-2 mb-2 fw-semibold">
              Action Required
            </span>
            <h3 className="fw-bold" style={{ color: '#006B3C' }}>
              Change Your Password
            </h3>
            <p className="text-muted small mb-0">
              For security reasons, you must set a new secure password before continuing.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Current Password */}
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label small fw-semibold text-secondary">
                Current Password
              </label>
              <div className="input-group">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Hide current password visibility' : 'Show current password visibility'}
                  tabIndex={-1}
                >
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label small fw-semibold text-secondary">
                New Password
              </label>
              <div className="input-group">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Hide new password visibility' : 'Show new password visibility'}
                  tabIndex={-1}
                >
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label small fw-semibold text-secondary">
                Confirm New Password
              </label>
              <div className="input-group">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide confirm password visibility' : 'Show confirm password visibility'}
                  tabIndex={-1}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Live Complexity Checklist */}
            <div className="p-3 mb-4 rounded bg-light border">
              <div className="small fw-semibold text-secondary mb-2">Password Requirements:</div>
              <ul className="list-unstyled mb-0 small">
                <li className={`d-flex align-items-center mb-1 ${hasMinLength ? 'text-success fw-medium' : 'text-muted'}`}>
                  <span className="me-2">{hasMinLength ? '✓' : '○'}</span>
                  At least 8 characters
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasUppercase ? 'text-success fw-medium' : 'text-muted'}`}>
                  <span className="me-2">{hasUppercase ? '✓' : '○'}</span>
                  At least one uppercase letter (A-Z)
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasLowercase ? 'text-success fw-medium' : 'text-muted'}`}>
                  <span className="me-2">{hasLowercase ? '✓' : '○'}</span>
                  At least one lowercase letter (a-z)
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasNumber ? 'text-success fw-medium' : 'text-muted'}`}>
                  <span className="me-2">{hasNumber ? '✓' : '○'}</span>
                  At least one numeric digit (0-9)
                </li>
                <li className={`d-flex align-items-center mb-1 ${hasSpecial ? 'text-success fw-medium' : 'text-muted'}`}>
                  <span className="me-2">{hasSpecial ? '✓' : '○'}</span>
                  At least one special character (!@#$%^&*...)
                </li>
                {newPassword.length > 0 && currentPassword.length > 0 && (
                  <li className={`d-flex align-items-center mb-1 ${isDifferentFromCurrent ? 'text-success fw-medium' : 'text-danger'}`}>
                    <span className="me-2">{isDifferentFromCurrent ? '✓' : '✗'}</span>
                    Different from current password
                  </li>
                )}
                {confirmPassword.length > 0 && (
                  <li className={`d-flex align-items-center ${passwordsMatch ? 'text-success fw-medium' : 'text-danger'}`}>
                    <span className="me-2">{passwordsMatch ? '✓' : '✗'}</span>
                    Passwords match
                  </li>
                )}
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn text-white w-100 py-2 fw-semibold"
              style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Updating password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
