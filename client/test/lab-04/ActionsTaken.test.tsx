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
    attachmentNotes: 'multimeter_reading.jpg',
    createdAt: '2026-09-18T14:35:00.000Z',
    updatedAt: '2026-09-18T14:35:00.000Z',
  },
  {
    id: 2,
    ticketId: 101,
    actionDateTime: '2026-09-18T16:15:00.000Z',
    description: 'Applied OS kernel security patch and rebooted.',
    result: 'Kernel panic resolved; reboot required after testing.',
    performedById: 3,
    performedBy: { id: 3, name: 'Michael Chen', email: 'michael.it@toktick.it', role: 'IT_STAFF' },
    assigneeId: 3,
    assignee: { id: 3, name: 'Michael Chen', email: 'michael.it@toktick.it', role: 'IT_STAFF' },
    status: 'In Progress',
    isFollowUpRequired: true,
    followUpNote: 'Monitor crash dump logs after user compile workloads.',
    attachmentNotes: null,
    createdAt: '2026-09-18T16:20:00.000Z',
    updatedAt: '2026-09-18T16:20:00.000Z',
  },
];

describe('Lab 4 / UI-07: Actions Taken Component Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockFetch = (overrides?: {
    ticket?: any;
    assignees?: any[];
    actions?: ActionTakenItem[];
  }) => {
    const ticketData = overrides?.ticket || sampleTicket;
    const assigneesData = overrides?.assignees || sampleAssignees;
    const actionsData = overrides?.actions !== undefined ? overrides.actions : sampleActionsTaken;

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      // Actions taken collection (GET)
      if (url.includes('/api/tickets/101/actions-taken') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ticketId: 101, ticketNumber: 'TKT-2026-000101', data: actionsData }),
        } as Response);
      }

      // Actions taken creation (POST)
      if (url.includes('/api/staff/tickets/101/actions-taken') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const created: ActionTakenItem = {
          id: 99,
          ticketId: 101,
          actionDateTime: body.actionDateTime || new Date().toISOString(),
          description: body.description,
          result: body.result,
          performedById: 2,
          performedBy: { id: 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
          assigneeId: body.assigneeId || 2,
          assignee: { id: body.assigneeId || 2, name: 'Sarah Johnson', email: 'sarah.it@toktick.it', role: 'IT_STAFF' },
          status: body.status || 'Completed',
          isFollowUpRequired: Boolean(body.isFollowUpRequired),
          followUpNote: body.followUpNote || null,
          attachmentNotes: body.attachmentNotes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => created,
        } as Response);
      }

      // Actions taken update (PATCH)
      if (url.includes('/api/staff/tickets/101/actions-taken/') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        const updated: ActionTakenItem = {
          ...actionsData[0],
          ...body,
          updatedAt: new Date().toISOString(),
        };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => updated,
        } as Response);
      }

      // Assignees lookup
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => assigneesData,
        } as Response);
      }

      // Comments & Notes
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

      // Ticket detail
      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ticketData,
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled mock for URL: ${url}`));
    });
  };

  describe('1. List Rendering', () => {
    it('renders the Actions Taken section with count, descriptions, results, and performers', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      // Section header with count and subtitle
      await waitFor(() => {
        expect(screen.getByText(/ACTIONS TAKEN \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Work performed, technical interventions, and follow-up activities/i)).toBeInTheDocument();
      });

      // Actions taken list content
      expect(screen.getAllByText('Replaced RAM module with 16GB stock.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Passed memtest cleanly without errors.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Applied OS kernel security patch and rebooted.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Kernel panic resolved; reboot required after testing.').length).toBeGreaterThan(0);

      // Performers & Assignees chips
      expect(screen.getAllByText(/By: Sarah Johnson/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/By: Michael Chen/i).length).toBeGreaterThan(0);

      // Status Badges
      expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);

      // Follow-Up Status: Item 1 has false, Item 2 has true + note
      expect(screen.getAllByText('Follow-Up Req.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Monitor crash dump logs after user compile workloads.').length).toBeGreaterThan(0);

      // Attachment Notes
      expect(screen.getAllByText(/multimeter_reading\.jpg/i).length).toBeGreaterThan(0);
    });

    it('renders empty state message when ticket has zero Actions Taken', async () => {
      setupMockFetch({ actions: [] });

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/ACTIONS TAKEN \(0\)/i)).toBeInTheDocument();
        expect(screen.getByText(/No actions taken recorded yet for this ticket/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Create Mode & Validation (IT Staff / Administrator)', () => {
    it('renders + Add Action Taken button for IT Staff and opens create modal with auto-captured Performed By', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ Add Action Taken/i })).toBeInTheDocument();
      });

      // Click + Add Action Taken
      fireEvent.click(screen.getByRole('button', { name: /\+ Add Action Taken/i }));

      // Modal appears
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Record Action Taken' })).toBeInTheDocument();

      // Performed By is auto-captured with current staff user name & role (disabled/readOnly)
      const performedByInput = screen.getByLabelText(/Performed By \(Auto-captured\)/i);
      expect(performedByInput).toBeInTheDocument();
      expect(performedByInput).toHaveValue('Sarah Johnson (IT Staff)');
      expect(performedByInput).toBeDisabled();

      // Cancel closes modal
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('validates description and result as mandatory fields', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ Add Action Taken/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /\+ Add Action Taken/i }));

      // Attempt to save empty form
      fireEvent.click(screen.getByRole('button', { name: 'Save Action Taken' }));
      expect(screen.getByText(/Action description is required/i)).toBeInTheDocument();

      // Enter description, leave result empty
      const descInput = screen.getByPlaceholderText(/Describe the work performed/i);
      fireEvent.change(descInput, { target: { value: 'Inspected power supply' } });

      fireEvent.click(screen.getByRole('button', { name: 'Save Action Taken' }));
      expect(screen.getByText(/Action result is required/i)).toBeInTheDocument();
    });

    it('enforces follow-up note as conditionally required only when Follow-Up Required is checked', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ Add Action Taken/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /\+ Add Action Taken/i }));

      // Fill description and result
      fireEvent.change(screen.getByPlaceholderText(/Describe the work performed/i), {
        target: { value: 'Replaced power connector on motherboard' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Describe the result or outcome/i), {
        target: { value: 'Bench power-on test successful' },
      });

      // Follow-Up is unchecked initially: follow-up note input is NOT rendered
      expect(screen.queryByPlaceholderText(/Enter required follow-up details/i)).not.toBeInTheDocument();

      // Check Follow-Up Required toggle
      const followUpToggle = screen.getByRole('switch', { name: /Follow-Up Required/i });
      fireEvent.click(followUpToggle);

      // Now follow-up note input appears!
      const followUpInput = screen.getByPlaceholderText(/Enter required follow-up details/i);
      expect(followUpInput).toBeInTheDocument();

      // Attempt to save without entering follow-up note: must show error
      fireEvent.click(screen.getByRole('button', { name: 'Save Action Taken' }));
      expect(screen.getByText(/Follow-up note is required when follow-up is requested/i)).toBeInTheDocument();

      // Enter follow-up note
      fireEvent.change(followUpInput, {
        target: { value: 'Conduct secondary stress test under full CPU load for 2 hours' },
      });

      // Now submission succeeds!
      fireEvent.click(screen.getByRole('button', { name: 'Save Action Taken' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify POST call was dispatched with correct payload
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/staff/tickets/101/actions-taken',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"isFollowUpRequired":true'),
        })
      );
    });
  });

  describe('3. Edit Mode (IT Staff / Administrator)', () => {
    it('opens Edit modal pre-populated with existing action details and submits PATCH', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockStaffUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBeGreaterThan(0);
      });

      // Click Edit on the first item
      fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

      // Edit modal opens with pre-populated values
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Action Taken' })).toBeInTheDocument();

      const descInput = screen.getByDisplayValue('Replaced RAM module with 16GB stock.');
      expect(descInput).toBeInTheDocument();

      const resultInput = screen.getByDisplayValue('Passed memtest cleanly without errors.');
      expect(resultInput).toBeInTheDocument();

      // Update description
      fireEvent.change(descInput, {
        target: { value: 'Replaced RAM module with 32GB high-performance kit.' },
      });

      // Submit update
      fireEvent.click(screen.getByRole('button', { name: 'Update Action Taken' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify PATCH was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/staff/tickets/101/actions-taken/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Replaced RAM module with 32GB high-performance kit.'),
        })
      );
    });
  });

  describe('4. Requester Read-Only View', () => {
    it('renders Actions Taken list in read-only form for Requester without Add or Edit buttons', async () => {
      setupMockFetch();

      render(
        <TicketDetail
          currentUser={mockRequesterUser}
          ticketId={101}
          onBack={() => {}}
        />
      );

      // Actions Taken section is rendered
      await waitFor(() => {
        expect(screen.getByText(/ACTIONS TAKEN \(2\)/i)).toBeInTheDocument();
      });

      // Content is visible
      expect(screen.getAllByText('Replaced RAM module with 16GB stock.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Passed memtest cleanly without errors.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Follow-Up Req.').length).toBeGreaterThan(0);

      // + Add Action Taken button is NOT in the DOM for Requester
      expect(screen.queryByRole('button', { name: /\+ Add Action Taken/i })).not.toBeInTheDocument();

      // Edit buttons are NOT in the DOM for Requester
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });
  });
});
