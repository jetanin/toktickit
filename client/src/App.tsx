import { useState, useEffect, useRef } from 'react';
import './App.css';
import Login, { type AuthUser } from './components/Login';
import ChangePassword from './components/ChangePassword';
import CreateTicket from './components/CreateTicket';
import MyTickets from './components/MyTickets';
import TicketDetail from './components/TicketDetail';
import StaffTicketQueue from './components/StaffTicketQueue';
import UserManagement from './components/UserManagement';

export type ViewType = 'MY_TICKETS' | 'CREATE_TICKET' | 'TICKET_DETAIL' | 'STAFF_QUEUE' | 'USER_MANAGEMENT';

function App() {
  const loggedOutRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('toktickit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    try {
      const saved = localStorage.getItem('toktickit_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'IT_STAFF' || parsed.role === 'ADMINISTRATOR') {
          return 'STAFF_QUEUE';
        }
      }
    } catch {}
    return 'MY_TICKETS';
  });
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check existing session
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && !loggedOutRef.current) {
          if (data?.user) {
            setCurrentUser(data.user);
            localStorage.setItem('toktickit_user', JSON.stringify(data.user));
          } else {
            setCurrentUser(null);
            localStorage.removeItem('toktickit_user');
          }
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    loggedOutRef.current = false;
    setCurrentUser(user);
    localStorage.setItem('toktickit_user', JSON.stringify(user));
    if (user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') {
      setCurrentView('STAFF_QUEUE');
    } else {
      setCurrentView('MY_TICKETS');
    }
  };

  const handleLogout = async () => {
    loggedOutRef.current = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('toktickit_user');
      localStorage.removeItem('toktickit_requester');
      setSelectedTicketId(null);
      setCurrentView('MY_TICKETS');
    }
  };

  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthCategories, setHealthCategories] = useState<Array<{ id: number; name: string }>>([]);

  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    setHealthCategories([]);
    try {
      const [healthRes, categoriesRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/categories'),
      ]);
      if (!healthRes.ok) {
        throw new Error(`Unable to connect to the server. Please try again later. Status: ${healthRes.status}`);
      }
      if (!categoriesRes.ok) {
        throw new Error(`Unable to fetch categories. Status: ${categoriesRes.status}`);
      }
      const categoriesJson = await categoriesRes.json();
      setHealthCategories(categoriesJson);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setHealthError(err.message);
      } else {
        setHealthError('Unable to connect to TokTickIT API');
      }
    } finally {
      setHealthLoading(false);
    }
  };

  const navigateTo = (view: ViewType, ticketId: number | null = null) => {
    setCurrentView(view);
    setSelectedTicketId(ticketId);
    setMobileMenuOpen(false);
  };

  // If not authenticated, render Login screen + System Diagnostics (Lab 01 Compatibility)
  if (!currentUser) {
    return (
      <div className="d-flex flex-column min-vh-100 justify-content-between" style={{ backgroundColor: '#F5F7F6' }}>
        <Login onLoginSuccess={handleLoginSuccess} />

        {/* System Diagnostics (Lab 01 Compatibility) */}
        <div className="container py-2 text-center">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none text-muted"
            onClick={checkHealth}
            disabled={healthLoading}
          >
            {healthLoading ? 'Loading...' : 'Check System'}
          </button>
          {healthError && (
            <div className="alert alert-danger py-1 px-3 m-0 mt-2 d-inline-block small" role="alert">
              Error: {healthError}
            </div>
          )}
          {healthCategories.length > 0 && (
            <ul className="list-group mt-2 d-inline-block text-start small">
              {healthCategories.map((cat) => (
                <li key={cat.id} className="list-group-item py-1 px-3">
                  {cat.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = currentUser.role === 'IT_STAFF' || currentUser.role === 'ADMINISTRATOR';
  const isAdmin = currentUser.role === 'ADMINISTRATOR';
  const canCreateTicket = currentUser.role === 'REQUESTER' || currentUser.role === 'IT_STAFF';
  const hasMyTickets = currentUser.role !== 'ADMINISTRATOR';

  const effectiveRequester = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#F5F7F6' }}>
      {/* App Header (Zen Green #006B3C) */}
      <header className="navbar navbar-expand-md navbar-dark px-3 py-2 shadow-sm" style={{ backgroundColor: '#006B3C' }}>
        <div className="container-fluid">
          <span
            className="navbar-brand fw-bold me-4"
            style={{ cursor: 'pointer', fontSize: '1.25rem' }}
            onClick={() => navigateTo(isAdmin ? 'USER_MANAGEMENT' : (isStaffOrAdmin ? 'STAFF_QUEUE' : 'MY_TICKETS'))}
          >
            TokTickIT
          </span>

          <button
            className="navbar-toggler border-0"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              {isStaffOrAdmin && (
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link btn btn-link text-decoration-none border-0 ${
                      currentView === 'STAFF_QUEUE' ? 'active fw-bold text-white' : 'text-white-50'
                    }`}
                    onClick={() => navigateTo('STAFF_QUEUE')}
                  >
                    Ticket Queue
                  </button>
                </li>
              )}
              {isAdmin && (
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link btn btn-link text-decoration-none border-0 ${
                      currentView === 'USER_MANAGEMENT' ? 'active fw-bold text-white' : 'text-white-50'
                    }`}
                    onClick={() => navigateTo('USER_MANAGEMENT')}
                  >
                    Users
                  </button>
                </li>
              )}
              {hasMyTickets && (
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link btn btn-link text-decoration-none border-0 ${
                      currentView === 'MY_TICKETS' ? 'active fw-bold text-white' : 'text-white-50'
                    }`}
                    onClick={() => navigateTo('MY_TICKETS')}
                  >
                    My Tickets
                  </button>
                </li>
              )}
              {canCreateTicket && (
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link btn btn-link text-decoration-none border-0 ${
                      currentView === 'CREATE_TICKET' ? 'active fw-bold text-white' : 'text-white-50'
                    }`}
                    onClick={() => navigateTo('CREATE_TICKET')}
                  >
                    Create Ticket
                  </button>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center flex-wrap gap-2 text-white pt-2 pt-md-0 border-top border-md-0 border-white-50">
              <strong className="small text-white me-1">{currentUser.name}</strong>
              <span className="badge rounded-pill bg-light text-dark px-2 py-1 small fw-semibold me-2">
                {currentUser.role === 'ADMINISTRATOR'
                  ? 'Administrator'
                  : currentUser.role === 'IT_STAFF'
                  ? 'IT Staff'
                  : 'Requester'}
              </span>
              <button
                type="button"
                className="btn btn-sm text-white px-2 py-1"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  fontSize: '0.8rem',
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mandatory Password Change Overlay */}
      {currentUser.mustChangePassword && (
        <ChangePassword
          onSuccess={() => {
            const updated = { ...currentUser, mustChangePassword: false };
            setCurrentUser(updated);
            localStorage.setItem('toktickit_user', JSON.stringify(updated));
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow-1 py-4 px-3 px-md-4">
        <div className="container-lg" style={{ maxWidth: '1140px' }}>
          {currentView === 'USER_MANAGEMENT' && (
            <UserManagement currentUser={currentUser} />
          )}

          {currentView === 'STAFF_QUEUE' && (
            <StaffTicketQueue
              currentUser={currentUser}
              onViewTicket={(ticketId) => navigateTo('TICKET_DETAIL', ticketId)}
              onCreateNew={canCreateTicket ? () => navigateTo('CREATE_TICKET') : undefined}
            />
          )}

          {currentView === 'MY_TICKETS' && (
            <MyTickets
              requester={effectiveRequester}
              onViewTicket={(ticketId) => navigateTo('TICKET_DETAIL', ticketId)}
              onCreateNew={() => navigateTo('CREATE_TICKET')}
            />
          )}

          {currentView === 'CREATE_TICKET' && (
            <CreateTicket
              requester={effectiveRequester}
              onCancel={() => navigateTo(isStaffOrAdmin ? 'STAFF_QUEUE' : 'MY_TICKETS')}
              onCreated={(ticketId) => navigateTo('TICKET_DETAIL', ticketId)}
            />
          )}

          {currentView === 'TICKET_DETAIL' && selectedTicketId && (
            <TicketDetail
              currentUser={currentUser}
              requester={effectiveRequester}
              ticketId={selectedTicketId}
              onBack={() => navigateTo(isStaffOrAdmin ? 'STAFF_QUEUE' : 'MY_TICKETS')}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
