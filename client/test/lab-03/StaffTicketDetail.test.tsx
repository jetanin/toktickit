import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketDetail from '../../src/components/TicketDetail';

const mockStaffUser = {
  id: 2,
  name: 'Sarah Johnson',
  email: 'sarah.it@toktick.it',
  role: 'IT_STAFF',
};

const mockRequesterUser = {
  id: 1,
  name: 'Jennifer Anderson',
  email: 'jennifer.anderson@toktick.it',
  role: 'REQUESTER',
};

const sampleTicket = {
  id: 101,
  ticketNumber: 'TKT-2026-000101',
  summary: 'Laptop battery drains quickly',
  description: 'Battery dies within 45 mins',
  requestedPriority: 'Medium',
  itPriority: 'Medium',
  currentStatus: 'Open',
  ticketOwnerId: null,
  ticketOwner: null,
  resolutionSummary: null,
  requesterResolutionPending: false,
  createdAt: '2026-09-11T10:00:00.000Z',
  updatedAt: '2026-09-11T10:00:00.000Z',
  category: { id: 1, name: 'Hardware' },
  relatedSystem: { id: 1, name: 'Corporate Laptop' },
  requester: { id: 1, name: 'Jennifer Anderson' },
  attachments: [],
};

const sampleAssignees = [
  { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
  { id: 3, name: 'Michael Chen', email: 'michael.it@toktick.it', role: 'IT_STAFF' },
  { id: 4, name: 'Alex Admin', email: 'admin@toktick.it', role: 'ADMINISTRATOR' },
];

const sampleComments = [
  {
    id: 1,
    ticketId: 101,
    content: 'Initial diagnosis requested.',
    author: { id: 2, name: 'Sarah Johnson', role: 'IT_STAFF' },
    createdAt: '2026-09-11T10:05:00.000Z',
  },
];

const sampleInternalNotes = [
  {
    id: 1,
    ticketId: 101,
    content: 'Suspected battery firmware issue; ordered replacement unit.',
    author: { id: 2, name: 'Sarah Johnson', role: 'IT_STAFF' },
    createdAt: '2026-09-11T10:06:00.000Z',
  },
];

describe('UI-05 & UI-06 / Lab 3: Staff Ticket Detail Operations & Internal Notes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockFetch = (overrides?: {
    ticket?: any;
    assignees?: any[];
    comments?: any[];
    notes?: any[];
  }) => {
    const ticketData = overrides?.ticket || sampleTicket;
    const assigneesData = overrides?.assignees || sampleAssignees;
    const commentsData = overrides?.comments || sampleComments;
    const notesData = overrides?.notes || sampleInternalNotes;

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      // Assignees lookup
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => assigneesData,
        } as Response);
      }

      // Claim / assign owner
      if (url.includes('/api/staff/tickets/101/owner') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 101,
            ticketOwnerId: body.ticketOwnerId,
            currentStatus: 'Open',
            ticketOwner: assigneesData.find((a) => a.id === body.ticketOwnerId) || null,
          }),
        } as Response);
      }

      // IT Priority update
      if (url.includes('/api/staff/tickets/101/priority') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 101,
            itPriority: body.itPriority,
            updatedAt: new Date().toISOString(),
          }),
        } as Response);
      }

      // Status transition update
      if (url.includes('/api/staff/tickets/101/status') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 101,
            currentStatus: body.status,
            resolutionSummary: body.resolutionSummary || null,
            updatedAt: new Date().toISOString(),
          }),
        } as Response);
      }

      // Internal notes POST
      if (url.includes('/api/tickets/101/internal-notes') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: 2,
            ticketId: 101,
            content: body.content,
            author: { id: mockStaffUser.id, name: mockStaffUser.name, role: mockStaffUser.role },
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }

      // Internal notes GET
      if (url.includes('/api/tickets/101/internal-notes')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => notesData,
        } as Response);
      }

      // Public comments GET
      if (url.includes('/api/tickets/101/comments')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => commentsData,
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

  // UI-05: IT Staff Operational Controls
  describe('UI-05: Operational Controls (Owner, IT Priority, Status & Resolution Summary)', () => {
    it('renders operational controls for IT Staff (Ticket Owner dropdown, Claim button, IT Priority, Status dropdown)', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Laptop battery drains quickly')).toBeInTheDocument();
      });

      // 1. Ticket Owner control
      expect(screen.getByLabelText(/ticket owner/i)).toBeInTheDocument();
      // Ticket is unassigned, so Claim button should be visible
      expect(screen.getByRole('button', { name: /^claim$/i })).toBeInTheDocument();

      // 2. IT Priority control (select dropdown for staff)
      expect(screen.getByLabelText(/it priority/i)).toBeInTheDocument();

      // 3. Status control (select dropdown and Save Status button)
      expect(screen.getByLabelText(/ticket status/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save status/i })).toBeInTheDocument();
    });

    it('claims unassigned ticket when clicking Claim button', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^claim$/i })).toBeInTheDocument();
      });

      const claimBtn = screen.getByRole('button', { name: /^claim$/i });
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/staff/tickets/101/owner'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ ticketOwnerId: mockStaffUser.id }),
          })
        );
      });
    });

    it('updates IT Priority when selecting a new priority', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/it priority/i)).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText(/it priority/i);
      fireEvent.change(prioritySelect, { target: { value: 'Critical' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/staff/tickets/101/priority'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ itPriority: 'Critical' }),
          })
        );
      });
    });

    it('limits status dropdown to permitted transitions per BR-15 and shows resolution summary input when selecting Resolved', async () => {
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

      // Status 'Open' permits: 'In Progress', 'Waiting for Requester', 'Resolved', 'Cancelled'
      const options = Array.from(statusSelect.options).map((opt) => opt.value);
      expect(options).toContain('In Progress');
      expect(options).toContain('Waiting for Requester');
      expect(options).toContain('Resolved');
      expect(options).toContain('Cancelled');
      // Should NOT permit jumping to Closed or Reopened directly from Open
      expect(options).not.toContain('Closed');
      expect(options).not.toContain('Reopened');

      // Selecting 'Resolved' prompts for Resolution Summary
      fireEvent.change(statusSelect, { target: { value: 'Resolved' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/resolution summary/i)).toBeInTheDocument();
      });

      // Attempt to save status without summary shows validation message
      const saveStatusBtn = screen.getByRole('button', { name: /save status/i });
      fireEvent.click(saveStatusBtn);

      await waitFor(() => {
        expect(screen.getByText(/resolution summary is required when resolving a ticket/i)).toBeInTheDocument();
      });

      // Fill resolution summary and save
      const summaryTextarea = screen.getByLabelText(/resolution summary/i);
      fireEvent.change(summaryTextarea, {
        target: { value: 'Replaced battery with new OEM battery unit.' },
      });

      fireEvent.click(saveStatusBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/staff/tickets/101/status'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
              status: 'Resolved',
              resolutionSummary: 'Replaced battery with new OEM battery unit.',
            }),
          })
        );
      });
    });
  });

  // UI-06: Public Comments vs Internal Notes Tabs & Visual Distinction
  describe('UI-06: Tabbed Communication Panel & Amber Internal Notes Styling', () => {
    it('renders tabs for Public Comments, Internal Notes, Attachments, and disabled Service Actions', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /public comments/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /internal notes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /attachments/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /service actions/i })).toBeInTheDocument();
      });

      // Service Actions tab is disabled for Lab 3 per ui-spec.md
      const actionsTab = screen.getByRole('button', { name: /service actions/i });
      expect(actionsTab).toBeDisabled();
    });

    it('switches to Internal Notes tab and displays distinct amber styling banner and notes', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /internal notes/i })).toBeInTheDocument();
      });

      // Click on Internal Notes tab
      fireEvent.click(screen.getByRole('button', { name: /internal notes/i }));

      // Amber banner must be visible with explicit non-leak warning per ui-spec.md
      await waitFor(() => {
        expect(screen.getByText(/internal it note - not visible to requester/i)).toBeInTheDocument();
        expect(screen.getByText(/suspected battery firmware issue/i)).toBeInTheDocument();
      });

      // Add Internal Note
      const noteInput = screen.getByPlaceholderText(/write confidential internal note/i);
      fireEvent.change(noteInput, { target: { value: 'Hardware vendor contacted for RMA.' } });

      const postNoteBtn = screen.getByRole('button', { name: /post internal note/i });
      fireEvent.click(postNoteBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/tickets/101/internal-notes'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Hardware vendor contacted for RMA.' }),
          })
        );
      });
    });

    it('strictly hides Internal Notes tab and private content when viewed by a Requester (AC-04)', async () => {
      setupMockFetch();

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

      // Internal Notes tab and content must NOT exist anywhere in Requester DOM
      expect(screen.queryByRole('button', { name: /internal notes/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/internal it note/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/suspected battery firmware issue/i)).not.toBeInTheDocument();
      // Operational controls must NOT exist for Requester
      expect(screen.queryByLabelText(/ticket owner/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^claim$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save status/i })).not.toBeInTheDocument();
    });
  });
});
