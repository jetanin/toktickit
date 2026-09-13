import React, { useState } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  mustChangePassword: boolean;
}

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div className="card shadow-sm border-0 w-100" style={{ maxWidth: '440px', borderRadius: '12px' }}>
        <div className="card-body p-4 p-sm-5">
          {/* Brand Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: '#006B3C', letterSpacing: '-0.5px' }}>
              TokTickIT
            </h2>
            <p className="text-muted small mb-0">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold text-secondary">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@toktick.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label small fw-semibold text-secondary">
                Password
              </label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn text-white w-100 py-2 fw-semibold"
              style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
