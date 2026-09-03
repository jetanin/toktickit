import { useState, useEffect } from 'react';
import './App.css';
import RequesterSelector, { type Requester } from './components/RequesterSelector';
import CreateTicket from './components/CreateTicket';
import MyTickets from './components/MyTickets';
import TicketDetail from './components/TicketDetail';

export type ViewType = 'MY_TICKETS' | 'CREATE_TICKET' | 'TICKET_DETAIL';

function App() {
  const [requester, setRequester] = useState<Requester | null>(() => {
    try {
      const saved = localStorage.getItem('toktickit_requester');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState<ViewType>('MY_TICKETS');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectRequester = (selected: Requester) => {
    setRequester(selected);
    localStorage.setItem('toktickit_requester', JSON.stringify(selected));
    setCurrentView('MY_TICKETS');
  };

  const handleChangeRequester = () => {
    setRequester(null);
    localStorage.removeItem('toktickit_requester');
    setSelectedTicketId(null);
    setCurrentView('MY_TICKETS');
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

  if (!requester) {
    return (
      <div className="d-flex flex-column min-vh-100 justify-content-between" style={{ backgroundColor: '#F5F7F6' }}>
        <RequesterSelector onSelect={handleSelectRequester} />
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

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#F5F7F6' }}>
      {/* App Header (Zen Green #006B3C) */}
      <header className="navbar navbar-expand-md navbar-dark px-3 py-2 shadow-sm" style={{ backgroundColor: '#006B3C' }}>
        <div className="container-fluid">
          <span
            className="navbar-brand fw-bold me-4"
            style={{ cursor: 'pointer', fontSize: '1.25rem' }}
            onClick={() => navigateTo('MY_TICKETS')}
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
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn btn-link text-decoration-none border-0 ${
                    currentView === 'MY_TICKETS' || currentView === 'TICKET_DETAIL' ? 'active fw-bold text-white' : 'text-white-50'
                  }`}
                  onClick={() => navigateTo('MY_TICKETS')}
                >
                  My Tickets
                </button>
              </li>
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
            </ul>

            <div className="d-flex align-items-center flex-wrap gap-2 text-white pt-2 pt-md-0 border-top border-md-0 border-white-50">
              <span className="small text-white-50">Requester:</span>
              <strong className="small text-white me-2">{requester.name}</strong>
              <button
                type="button"
                className="btn btn-sm text-white px-2 py-1"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  fontSize: '0.8rem',
                }}
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1 py-4 px-3 px-md-4">
        <div className="container-lg" style={{ maxWidth: '1140px' }}>
          {currentView === 'MY_TICKETS' && (
            <MyTickets
              requester={requester}
              onViewTicket={(ticketId) => navigateTo('TICKET_DETAIL', ticketId)}
              onCreateNew={() => navigateTo('CREATE_TICKET')}
            />
          )}

          {currentView === 'CREATE_TICKET' && (
            <CreateTicket
              requester={requester}
              onCancel={() => navigateTo('MY_TICKETS')}
              onCreated={(ticketId) => navigateTo('TICKET_DETAIL', ticketId)}
            />
          )}

          {currentView === 'TICKET_DETAIL' && selectedTicketId && (
            <TicketDetail
              requester={requester}
              ticketId={selectedTicketId}
              onBack={() => navigateTo('MY_TICKETS')}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
