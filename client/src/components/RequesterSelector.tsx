import React, { useEffect, useState } from 'react';

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive?: boolean;
}

interface Props {
  onSelect: (requester: Requester) => void;
}

const RequesterSelector: React.FC<Props> = ({ onSelect }) => {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const fetchRequesters = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/dev-requesters');
      if (!res.ok) throw new Error('Failed to fetch requesters');
      const data = await res.json();
      setRequesters(data);
      if (data.length > 0) {
        setSelectedId(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequesters();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F5F7F6' }}>
        <div className="spinner-border text-success" role="status" style={{ color: '#006B3C' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F5F7F6' }}>
        <div className="card shadow-sm text-center p-4" style={{ maxWidth: '420px', width: '100%' }}>
          <div className="alert alert-danger mb-3">
            Unable to load requesters. Please try again.
          </div>
          <button
            className="btn text-white w-100"
            style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
            onClick={fetchRequesters}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (requesters.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F5F7F6' }}>
        <div className="card shadow-sm text-center p-4" style={{ maxWidth: '450px', width: '100%' }}>
          <p className="text-muted mb-0">No active requesters available. Please contact the IT administrator.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const req = requesters.find((r) => r.id.toString() === selectedId);
    if (req) {
      onSelect(req);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#F5F7F6' }}>
      <div className="card shadow-sm" style={{ maxWidth: '480px', width: '100%', border: '1px solid #E2E8E5' }}>
        <div className="card-header border-0 text-center pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
          <h2 className="h4 fw-bold mb-1" style={{ color: '#006B3C' }}>Development Requester</h2>
          <div
            className="alert py-1 px-3 d-inline-block small mb-0"
            style={{ backgroundColor: '#EAF6EF', color: '#0B7A46', border: '1px solid #BFE4D1' }}
          >
            Testing Only / Identity Simulation (Not Authentication)
          </div>
        </div>

        <div className="card-body px-4 py-3">
          <p className="text-muted small text-center mb-3">
            Select an active development requester identity to simulate multi-user ownership and permissions.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="requesterSelect" className="form-label small fw-semibold text-muted">
                Active Requesters
              </label>
              <select
                id="requesterSelect"
                className="form-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                {requesters.map((r) => (
                  <option key={r.id} value={r.id.toString()}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="d-grid mt-4">
              <button
                type="submit"
                className="btn text-white py-2 fw-semibold"
                style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                disabled={!selectedId}
              >
                Continue to Portal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequesterSelector;

