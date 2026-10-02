import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketDetail, { ActionTakenItem } from '../../src/components/TicketDetail';

const mockStaffUser = {
  id: 2,
  name: 'Sarah Johnson',
  email: 'sarah.it@toktick.it',
  role: 'IT_STAFF',
};

const sampleTicket = {
  id: 101,
  ticketNumber: 'TKT-2026-000101',
  summary: 'Laptop battery drains quickly',
  description: 'Battery dies within 45 mins',
  requestedPriority: 'Medium',
  itPriority: 'Medium',
  currentStatus: 'Open',
  ticketOwnerId: 2,
  ticketOwner: { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
  resolutionSummary: null,
  requesterResolutionPending: false,
  version: 1,
  createdAt: '2026-09-11T10:00:00.000Z',
  updatedAt: '2026-09-11T10:00:00.000Z',
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Corporate Laptop' },
  requester: { id: 1, name: 'Jennifer Anderson' },
  attachments: [],
};

const sampleActionsTaken: ActionTakenItem[] = [
  {
    id: 1,
    ticketId: 101,
    actionDateTime: '2026-09-18T14:30:00.000Z',
    description: 'Replaced RAM module with 16GB stock.',
    result: 'Passed memtest cleanly without errors.',
    performedById: 2,
    performedBy: { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
    assigneeId: 2,
    assignee: { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
    status: 'Completed',
    isFollowUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: '2026-09-18T14:35:00.000Z',
    updatedAt: '2026-09-18T14:35:00.000Z',
  },
];

describe('Lab 4 / UI-08: Ticket Workflow, Resolution Gate & Concurrency Control', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockFetch = (overrides?: {
    ticket?: any;
    actions?: ActionTakenItem[];
    statusPatchResponse?: { ok: boolean; status: number; body?: any };
  }) => {
    const ticketData = overrides?.ticket || sampleTicket;
    const actionsData = overrides?.actions !== undefined ? overrides.actions : sampleActionsTaken;

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.includes('/api/tickets/101/actions-taken')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => actionsData,
        } as Response);
      }

      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
          ],
        } as Response);
      }

      if (url.includes('/api/tickets/101/comments')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);
      }

      if (url.includes('/api/tickets/101/internal-notes')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);
      }

      if (url.includes('/api/tickets/101/attachments')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);
      }

      // Status patch
      if (url.includes('/api/staff/tickets/101/status') && method === 'PATCH') {
        if (overrides?.statusPatchResponse) {
          return Promise.resolve({
            ok: overrides.statusPatchResponse.ok,
            status: overrides.statusPatchResponse.status,
            json: async () => overrides.statusPatchResponse?.body || {},
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ...ticketData,
            currentStatus: 'Resolved',
            version: (ticketData.version || 1) + 1,
          }),
        } as Response);
      }

      // Priority patch
      if (url.includes('/api/staff/tickets/101/priority') && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...ticketData, itPriority: 'High', version: 2 }),
        } as Response);
      }

      // Owner patch
      if (url.includes('/api/staff/tickets/101/owner') && method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...ticketData, ticketOwnerId: 2, version: 2 }),
        } as Response);
      }

      // Ticket detail GET
      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ticketData,
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled fetch: ${method} ${url}`));
    });
  };

  it('displays only permitted next statuses in status dropdown per BR-09 matrix', async () => {
    setupMockFetch();

    render(
      <TicketDetail
        currentUser={mockStaffUser}
        ticketId={101}
        onBack={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/ticket status/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/ticket status/i) as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    // From Open: permitted are In Progress, Waiting for Requester, Resolved, Cancelled
    expect(options).toContain('In Progress');
    expect(options).toContain('Waiting for Requester');
    expect(options).toContain('Resolved');
    expect(options).toContain('Cancelled');

    // Closed and Reopened should NOT be options from Open
    expect(options).not.toContain('Closed');
    expect(options).not.toContain('Reopened');
  });

  it('hides operational status controls completely for Requester role', async () => {
    setupMockFetch();

    const mockRequesterUser = {
      id: 1,
      name: 'Jennifer Anderson',
      email: 'jennifer.anderson@toktick.it',
      role: 'REQUESTER',
    };

    render(
      <TicketDetail
        currentUser={mockRequesterUser}
        ticketId={101}
        onBack={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();
    });

    // Operational status controls should NOT be rendered for Requester
    expect(screen.queryByLabelText(/ticket status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save status/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ticket owner/i)).not.toBeInTheDocument();
  });

  it('launches Resolution Gate Modal with warning and disabled submit when ticket has 0 Actions Taken', async () => {
    // Ticket with zero actions taken
    setupMockFetch({ actions: [] });

    render(
      <TicketDetail
        currentUser={mockStaffUser}
        ticketId={101}
        onBack={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/ticket status/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/ticket status/i);
    fireEvent.change(statusSelect, { target: { value: 'Resolved' } });

    // Resolution Gate Modal should launch
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resolve ticket TKT-2026-000101/i })).toBeInTheDocument();
    });

    // Warning callout should appear per ui-spec.md Section 3.5 B
    expect(screen.getByTestId('resolution-gate-warning')).toBeInTheDocument();
    expect(screen.getByText(/Cannot Resolve Ticket/i)).toBeInTheDocument();
    expect(
      screen.getByText(/At least one Action Taken must be recorded before this ticket can be resolved/i)
    ).toBeInTheDocument();

    // Confirm Resolution button must be disabled
    const confirmBtn = screen.getByRole('button', { name: /confirm resolution/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('allows resolution in modal when ticket has >= 1 Actions Taken and provides version', async () => {
    // Ticket with 1 action taken
    setupMockFetch();

    render(
      <TicketDetail
        currentUser={mockStaffUser}
        ticketId={101}
        onBack={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/ticket status/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/ticket status/i);
    fireEvent.change(statusSelect, { target: { value: 'Resolved' } });

    // Resolution Gate Modal launches
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resolve ticket TKT-2026-000101/i })).toBeInTheDocument();
    });

    // Warning callout must NOT be shown
    expect(screen.queryByTestId('resolution-gate-warning')).not.toBeInTheDocument();

    // Fill Resolution Summary
    const summaryInput = screen.getByLabelText(/resolution summary/i);
    fireEvent.change(summaryInput, {
      target: { value: 'RAM swapped and validated with memory tests.' },
    });

    // Character counter renders
    expect(screen.getByText(/\/1000 characters/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirm resolution/i });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/staff/tickets/101/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: 'Resolved',
            resolutionSummary: 'RAM swapped and validated with memory tests.',
            version: 1,
          }),
        })
      );
    });
  });

  it('displays concurrency conflict banner and reloads fresh data when server returns 409 Conflict', async () => {
    // Setup fetch to simulate 409 Concurrency Conflict on status update
    setupMockFetch({
      statusPatchResponse: {
        ok: false,
        status: 409,
        body: {
          error: 'Ticket has been modified by another user',
          code: 'CONCURRENCY_CONFLICT',
          currentVersion: 2,
        },
      },
    });

    render(
      <TicketDetail
        currentUser={mockStaffUser}
        ticketId={101}
        onBack={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/ticket status/i)).toBeInTheDocument();
    });

    // Advance status to In Progress
    const statusSelect = screen.getByLabelText(/ticket status/i);
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });

    const saveStatusBtn = screen.getByRole('button', { name: /save status/i });
    fireEvent.click(saveStatusBtn);

    // Concurrency conflict banner appears per ui-spec.md Section 3.5 C
    await waitFor(() => {
      expect(screen.getByTestId('concurrency-conflict-banner')).toBeInTheDocument();
      expect(screen.getByText(/Ticket Modified by Another User/i)).toBeInTheDocument();
      expect(
        screen.getByText(/This ticket was updated by another team member while you were editing/i)
      ).toBeInTheDocument();
    });

    // Verify fetchTicketDetail was called to refresh data
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tickets/101')
    );
  });
});
