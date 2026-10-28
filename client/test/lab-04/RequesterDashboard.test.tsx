import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import RequesterDashboard from '../../src/components/RequesterDashboard';

afterEach(() => vi.unstubAllGlobals());
const data = { openTicketsCount: 3, waitingForRequesterCount: 1, recentlyResolvedCount: 2, closedTicketsCount: 4, recentTickets: [] };
describe('RequesterDashboard', () => {
  it('shows personal counts, empty state and filtered navigation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    const onViewTickets = vi.fn(), onCreateNew = vi.fn();
    render(<RequesterDashboard onViewTickets={onViewTickets} onCreateNew={onCreateNew} onViewTicket={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByText('3')).toBeVisible();
    expect(screen.getByText(/no submitted support tickets/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'View Waiting for Me tickets' }));
    expect(onViewTickets).toHaveBeenCalledWith({ status: 'Waiting for Requester' });
    fireEvent.click(screen.getByRole('button', { name: 'Submit New Ticket' }));
    expect(onCreateNew).toHaveBeenCalledOnce();
  });
  it('opens recent ticket detail and refreshes data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...data, recentTickets: [{ id: 42, ticketNumber: 'TKT-42', summary: 'VPN failure', currentStatus: 'Open', itPriority: 'High', createdAt: '2026-10-01', updatedAt: '2026-10-02' }] }) });
    vi.stubGlobal('fetch', fetchMock);
    const onViewTicket = vi.fn();
    render(<RequesterDashboard onViewTickets={vi.fn()} onCreateNew={vi.fn()} onViewTicket={onViewTicket} />);
    fireEvent.click(await screen.findByRole('button', { name: 'View TKT-42' }));
    expect(onViewTicket).toHaveBeenCalledWith(42);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
  it('recovers from a failed request using Retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ok: true, json: async () => data }));
    render(<RequesterDashboard onViewTickets={vi.fn()} onCreateNew={vi.fn()} onViewTicket={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('My Open Tickets')).toBeVisible();
  });
});
