import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyTickets from '../../src/components/MyTickets';
import { Requester } from '../../src/components/RequesterSelector';

const mockRequester: Requester = { id: 1, name: 'Alice Smith', email: 'alice@example.com' };

const sampleTickets = [
  {
    id: 101,
    ticketNumber: 'TKT-2026-000101',
    summary: 'Monitor screen flickering',
    description: 'Hardware monitor problem',
    requestedPriority: 'Medium',
    itPriority: 'High',
    currentStatus: 'New',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-11T12:00:00Z',
    category: { id: 1, name: 'Hardware' },
    requester: { id: 1, name: 'Alice Smith' },
  },
  {
    id: 102,
    ticketNumber: 'TKT-2026-000102',
    summary: 'Password reset request',
    description: 'Account access needed',
    requestedPriority: 'Low',
    itPriority: null,
    currentStatus: 'New',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
    category: { id: 2, name: 'Account and Access' },
    requester: { id: 1, name: 'Alice Smith' },
  },
];

describe('MyTickets Screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMocks = (tickets = sampleTickets, totalItems = 2, totalPages = 1) => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Hardware' },
            { id: 2, name: 'Account and Access' },
          ],
        });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: tickets,
            meta: {
              totalItems,
              totalPages,
              currentPage: 1,
              itemsPerPage: 8,
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  };

  it('renders tickets list with table and cards, showing ticket numbers, summaries, badges', async () => {
    setupMocks();

    render(<MyTickets requester={mockRequester} onViewTicket={() => {}} onCreateNew={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-000101').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Monitor screen flickering').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Password reset request').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty state ("No Ticket Found") when requester has 0 tickets', async () => {
    setupMocks([], 0, 1);

    render(<MyTickets requester={mockRequester} onViewTicket={() => {}} onCreateNew={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/no ticket found/i)).toBeInTheDocument();
      expect(screen.getByText(/you have not submitted any support tickets yet/i)).toBeInTheDocument();
    });
  });

  it('shows no-results state when search yields 0 matching tickets', async () => {
    setupMocks([], 0, 1);

    render(<MyTickets requester={mockRequester} onViewTicket={() => {}} onCreateNew={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-ticket-xyz' } });

    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/no ticket found/i)).toBeInTheDocument();
      expect(screen.getByText(/no tickets match your search or filter criteria/i)).toBeInTheDocument();
    });
  });

  it('filters tickets when search input is submitted', async () => {
    setupMocks();

    render(<MyTickets requester={mockRequester} onViewTicket={() => {}} onCreateNew={() => {}} />);
    await waitFor(() => screen.getAllByText('TKT-2026-000101'));

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Monitor' } });

    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Monitor'),
        expect.anything()
      );
    });
  });

  it('resets search and filters when "Clear Filters" is clicked', async () => {
    setupMocks();

    render(<MyTickets requester={mockRequester} onViewTicket={() => {}} onCreateNew={() => {}} />);
    await waitFor(() => screen.getAllByText('TKT-2026-000101'));

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'flickering' } });

    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(searchInput.value).toBe('');
  });

  it('handles pagination navigation and view ticket action', async () => {
    setupMocks(sampleTickets, 16, 2);

    const handleView = vi.fn();
    render(<MyTickets requester={mockRequester} onViewTicket={handleView} onCreateNew={() => {}} />);
    await waitFor(() => screen.getAllByText('TKT-2026-000101'));

    // Click view ticket button
    const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
    fireEvent.click(viewButtons[0]);
    expect(handleView).toHaveBeenCalledWith(101);

    // Next page button
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.anything()
      );
    });
  });
});

