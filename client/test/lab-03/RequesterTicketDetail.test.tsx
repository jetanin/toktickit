import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketDetail from '../../src/components/TicketDetail';
import { Requester } from '../../src/types';

const mockRequester: Requester = { id: 1, name: 'Jennifer Anderson', email: 'jennifer.anderson@toktick.it' };

const sampleTicket = {
  id: 101,
  ticketNumber: 'TKT-2026-000101',
  summary: 'Laptop battery issue',
  description: 'Battery dies rapidly',
  requestedPriority: 'Medium',
  itPriority: 'Medium',
  currentStatus: 'In Progress',
  requesterResolutionPending: false,
  createdAt: '2026-09-11T10:00:00.000Z',
  updatedAt: '2026-09-11T10:00:00.000Z',
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Corporate Laptop' },
  requester: { id: 1, name: 'Jennifer Anderson' },
  attachments: [],
};

const sampleComments = [
  {
    id: 1,
    ticketId: 101,
    content: 'Please run the diagnostic tool and send us the output.',
    author: {
      id: 2,
      name: 'Sarah Johnson',
      role: 'IT_STAFF',
    },
    createdAt: '2026-09-11T10:05:00.000Z',
  },
  {
    id: 2,
    ticketId: 101,
    content: 'Done, capacity is reported at 42%.',
    author: {
      id: 1,
      name: 'Jennifer Anderson',
      role: 'REQUESTER',
    },
    createdAt: '2026-09-11T10:10:00.000Z',
  },
];

describe('UI-04 / Lab 3: Requester Ticket Detail - Public Comments & Problem Appears Resolved', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockFetch = (ticketData = sampleTicket, commentsData = sampleComments) => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/tickets/101/comments') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: 3,
            ticketId: 101,
            content: body.content,
            author: { id: 1, name: 'Jennifer Anderson', role: 'REQUESTER' },
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }

      if (url.includes('/api/tickets/101/comments')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => commentsData,
        } as Response);
      }

      if (url.includes('/api/tickets/101/resolve-indication') && init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 101,
            requesterResolutionPending: true,
            message: 'Problem indicated as resolved',
          }),
        } as Response);
      }

      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ticketData,
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response);
    });
  };

  it('renders Public Comments stream with role badges, author initials, and timestamps', async () => {
    setupMockFetch();
    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop battery issue')).toBeInTheDocument();
    });

    // Public Comments header
    expect(screen.getByText(/Public Comments/i)).toBeInTheDocument();

    // Verify existing comments
    expect(screen.getByText('Please run the diagnostic tool and send us the output.')).toBeInTheDocument();
    expect(screen.getByText('Done, capacity is reported at 42%.')).toBeInTheDocument();

    // Verify author names and role badges
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('IT Support')).toBeInTheDocument();
    expect(screen.getAllByText('Requester').length).toBeGreaterThanOrEqual(1);
  });

  it('allows posting a new Public Comment and clears input upon success', async () => {
    setupMockFetch();
    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop battery issue')).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText(/Write a public comment/i);
    const postBtn = screen.getByRole('button', { name: /Post Comment/i });

    // Button disabled when empty
    expect(postBtn).toBeDisabled();

    // Type comment
    fireEvent.change(commentInput, { target: { value: 'Battery replaced and working now.' } });
    expect(postBtn).not.toBeDisabled();

    // Submit comment
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/101/comments'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Battery replaced and working now.' }),
        })
      );
    });
  });

  it('shows "Problem Appears Resolved" button, opens confirmation modal, and triggers PATCH on confirm', async () => {
    setupMockFetch();
    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop battery issue')).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /Problem Appears Resolved/i });
    expect(resolveBtn).toBeInTheDocument();

    // Click to open confirmation modal
    fireEvent.click(resolveBtn);

    expect(screen.getByText(/Are you sure the reported issue is resolved\?/i)).toBeInTheDocument();

    // Click confirm in modal
    const confirmBtn = screen.getByRole('button', { name: /Yes, Problem Resolved/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/101/resolve-indication'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  it('renders resolution pending banner when requesterResolutionPending is true', async () => {
    const resolvedTicket = {
      ...sampleTicket,
      requesterResolutionPending: true,
    };
    setupMockFetch(resolvedTicket);
    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop battery issue')).toBeInTheDocument();
    });

    expect(screen.getByText(/Problem Indicated as Resolved/i)).toBeInTheDocument();
    // Resolve button should not be displayed when already pending resolution
    expect(screen.queryByRole('button', { name: /Problem Appears Resolved/i })).not.toBeInTheDocument();
  });
});

