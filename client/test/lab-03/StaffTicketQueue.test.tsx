import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StaffTicketQueue from '../../src/components/StaffTicketQueue';
import { AuthUser } from '../../src/types';

const mockStaffUser: AuthUser = {
  id: 2,
  name: 'Sarah Johnson',
  email: 'sarah.it@toktick.it',
  role: 'IT_STAFF',
};

const sampleStaffTickets = [
  {
    id: 101,
    ticketNumber: 'TKT-2026-000101',
    summary: 'Laptop battery drains quickly',
    requestedPriority: 'Medium',
    itPriority: 'High',
    currentStatus: 'Open',
    createdAt: '2026-09-11T10:00:00Z',
    updatedAt: '2026-09-11T10:30:00Z',
    category: { id: 1, name: 'Hardware' },
    requester: { id: 1, name: 'Jennifer Anderson' },
    ticketOwner: { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it' },
  },
  {
    id: 102,
    ticketNumber: 'TKT-2026-000102',
    summary: 'Cannot connect to corporate VPN',
    requestedPriority: 'High',
    itPriority: 'Critical',
    currentStatus: 'New',
    createdAt: '2026-09-11T11:00:00Z',
    updatedAt: '2026-09-11T11:00:00Z',
    category: { id: 3, name: 'Network' },
    requester: { id: 3, name: 'Lisa Martinez' },
    ticketOwner: null, // Unassigned
  },
];

describe('StaffTicketQueue Screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMocks = (
    tickets = sampleStaffTickets,
    totalItems = 2,
    totalPages = 1,
    status = 200,
    errorMessage = ''
  ) => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, name: 'Hardware' },
            { id: 2, name: 'Software' },
            { id: 3, name: 'Network' },
          ],
        });
      }
      if (url.includes('/api/staff/tickets')) {
        if (status === 403) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ error: 'Access forbidden: Insufficient permissions' }),
          });
        }
        if (status >= 400) {
          return Promise.resolve({
            ok: false,
            status,
            json: async () => ({ error: errorMessage || 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: tickets,
            meta: {
              page: 1,
              limit: 10,
              totalItems,
              totalPages,
              currentPage: 1,
              itemsPerPage: 10,
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  };

  it('renders staff ticket queue table with all required columns and ticket data', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-000101').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Laptop battery drains quickly').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cannot connect to corporate VPN').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sarah Johnson').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/unassigned/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jennifer Anderson').length).toBeGreaterThanOrEqual(1);
    });

    // Check table headers
    expect(screen.getByRole('columnheader', { name: 'Ticket No.' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Created Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Req. Priority' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'IT Priority' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Owner' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Last Updated' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders mobile card representation for small screens', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-000101').length).toBeGreaterThanOrEqual(1);
    });

    // Verify mobile elements exist
    const cards = screen.getAllByTestId('staff-ticket-card');
    expect(cards.length).toBe(2);
  });

  it('handles search input and submits query', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-000101').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'battery' } });

    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=battery'));
    });
  });

  it('handles category filter selection', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('category=1'));
    });
  });

  it('handles IT Priority filter selection', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All IT Priorities')).toBeInTheDocument();
    });

    const prioritySelect = screen.getByDisplayValue('All IT Priorities');
    fireEvent.change(prioritySelect, { target: { value: 'Critical' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('priority=Critical'));
    });
  });

  it('handles Status filter selection', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'Open' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=Open'));
    });
  });

  it('handles Assignment filter (Assigned to Me, Unassigned)', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Assignments')).toBeInTheDocument();
    });

    const assignedSelect = screen.getByDisplayValue('All Assignments');
    fireEvent.change(assignedSelect, { target: { value: 'me' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('assigned=me'));
    });

    fireEvent.change(assignedSelect, { target: { value: 'unassigned' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('assigned=unassigned'));
    });
  });

  it('handles clear filters button', async () => {
    setupMocks();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by ticket number or summary/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'temporary' } });

    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('invokes onViewTicket when View button is clicked', async () => {
    setupMocks();
    const onViewTicket = vi.fn();

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={onViewTicket} />);

    await waitFor(() => {
      expect(screen.getAllByText('View').length).toBeGreaterThanOrEqual(1);
    });

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    expect(onViewTicket).toHaveBeenCalledWith(101);
  });

  it('shows empty queue state when total items is 0 without search filter', async () => {
    setupMocks([], 0, 1);

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching queue tickets', () => {
    // Mock a fetch that remains pending
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    expect(screen.getByText(/loading ticket queue.../i)).toBeInTheDocument();
  });

  it('shows no-results state when search filter yields 0 matching tickets', async () => {
    setupMocks([], 0, 1);

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by ticket number or summary/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent keyword' } });

    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/no tickets match your search or filter criteria/i)).toBeInTheDocument();
    });
  });

  it('shows failure alert when server returns 500 error', async () => {
    setupMocks([], 0, 1, 500, 'Internal Server Error');

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('shows 403 Forbidden alert when non-staff attempts queue access', async () => {
    setupMocks([], 0, 1, 403);

    render(<StaffTicketQueue currentUser={mockStaffUser} onViewTicket={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/access forbidden: insufficient permissions/i)).toBeInTheDocument();
    });
  });
});
