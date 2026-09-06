import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketDetail from '../../src/components/TicketDetail';
import { Requester } from '../../src/components/RequesterSelector';

const mockRequester: Requester = { id: 1, name: 'Alice Smith', email: 'alice@example.com' };

const sampleTicketWithAttachments = {
  id: 101,
  ticketNumber: 'TKT-2026-000101',
  summary: 'VPN disconnects constantly',
  description: 'Every 15 minutes the connection drops with error code 800.',
  requestedPriority: 'High',
  itPriority: 'High',
  currentStatus: 'New',
  createdAt: '2026-02-01T09:00:00Z',
  updatedAt: '2026-02-01T09:00:00Z',
  category: { id: 1, name: 'Network' },
  relatedSystem: { id: 2, name: 'VPN' },
  requester: { id: 1, name: 'Alice Smith' },
  attachments: [
    {
      id: 501,
      originalFilename: 'vpn-error.png',
      size: 204800,
      mimeType: 'image/png',
      removedAt: null,
      removalReason: null,
      createdAt: '2026-02-01T09:05:00Z',
    },
    {
      id: 502,
      originalFilename: 'old-screenshot.png',
      size: 102400,
      mimeType: 'image/png',
      removedAt: '2026-02-01T10:00:00Z',
      removalReason: 'Wrong file uploaded',
      createdAt: '2026-02-01T09:06:00Z',
    },
  ],
};

describe('TicketDetail Screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupTicketMock = (ticket = sampleTicketWithAttachments) => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({
          ok: true,
          json: async () => ticket,
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  };

  it('renders read-only ticket details and header fields correctly', async () => {
    setupTicketMock();

    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText(/TKT-2026-000101/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('VPN disconnects constantly')).toBeInTheDocument();
      expect(screen.getByText(/every 15 minutes the connection drops/i)).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();
      expect(screen.getByText('VPN')).toBeInTheDocument();
    });
  });

  it('renders active attachments with download and remove actions, and removed attachments as blocked with reason', async () => {
    setupTicketMock();

    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('vpn-error.png')).toBeInTheDocument();
      expect(screen.getByText('old-screenshot.png')).toBeInTheDocument();
    });

    // Active attachment should have Download and Remove actions
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument();

    // Removed attachment should display reason and no download button
    expect(screen.getByText(/wrong file uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/removed/i)).toBeInTheDocument();
  });

  it('opens confirmation modal and soft-removes attachment with selected reason', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({
          ok: true,
          json: async () => sampleTicketWithAttachments,
        });
      }
      if (url.includes('/api/attachments/501/remove') && init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Attachment removed successfully', id: 501 }),
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);
    await waitFor(() => screen.getByText('vpn-error.png'));

    // Click Remove on active attachment
    const removeBtn = screen.getByRole('button', { name: /^remove$/i });
    fireEvent.click(removeBtn);

    // Modal opens with reasons dropdown including "อื่นๆ (โปรดระบุ)"
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /remove attachment/i })).toBeInTheDocument();
      expect(screen.getByText(/อื่นๆ \(โปรดระบุ\)/i)).toBeInTheDocument();
    });

    // Select "อื่นๆ (โปรดระบุ)" and fill custom reason
    const reasonSelect = screen.getByLabelText(/reason for removal/i);
    fireEvent.change(reasonSelect, { target: { value: 'อื่นๆ (โปรดระบุ)' } });

    const customInput = screen.getByPlaceholderText(/specify reason/i);
    fireEvent.change(customInput, { target: { value: 'Sensitive info accidentally included' } });

    // Confirm removal
    const confirmBtn = screen.getByRole('button', { name: /confirm remove/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/attachments/501/remove'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Sensitive info accidentally included' }),
        })
      );
    });
  });

  it('triggers download for active attachment', async () => {
    setupTicketMock();
    const mockBlob = new Blob(['dummy'], { type: 'image/png' });
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/tickets/101')) {
        return Promise.resolve({ ok: true, json: async () => sampleTicketWithAttachments });
      }
      if (url.includes('/api/attachments/501/download')) {
        return Promise.resolve({ ok: true, blob: async () => mockBlob });
      }
      return Promise.reject(new Error('Unknown'));
    });

    // Mock window.URL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');

    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);
    await waitFor(() => screen.getByText('vpn-error.png'));

    const downloadBtn = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/attachments/501/download'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Requester-Id': '1' }),
        })
      );
    });
  });

  it('renders status and priority badges with correct Zen Green colors across states', async () => {
    const customTicket = {
      ...sampleTicketWithAttachments,
      currentStatus: 'In Progress',
      requestedPriority: 'Medium',
      itPriority: 'Low',
    };
    setupTicketMock(customTicket);

    render(<TicketDetail requester={mockRequester} ticketId={101} onBack={() => {}} />);

    await waitFor(() => {
      const statusBadge = screen.getByText('In Progress');
      expect(statusBadge).toHaveStyle({
        backgroundColor: '#EAF6EF',
        color: '#006B3C',
      });

      const reqPriorityBadge = screen.getByText('Medium');
      expect(reqPriorityBadge).toHaveStyle({
        backgroundColor: '#FFF4E5',
        color: '#B25E00',
      });

      const itPriorityBadge = screen.getByText('Low');
      expect(itPriorityBadge).toHaveStyle({
        backgroundColor: '#EAF6EF',
        color: '#006B3C',
      });
    });
  });
});
