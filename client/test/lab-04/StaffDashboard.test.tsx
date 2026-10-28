import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import StaffDashboard from '../../src/components/StaffDashboard';

afterEach(() => vi.unstubAllGlobals());
const data = { totalActiveQueueCount: 8, unassignedCount: 2, myAssignedCount: 3,
  statusBreakdown: { New: 2, Open: 1, 'In Progress': 3, 'Waiting for Requester': 1, Reopened: 1 },
  priorityBreakdown: { Critical: 1, High: 2, Medium: 3, Low: 0 }, urgentTickets: [], recentUpdatedTickets: [] };
describe('StaffDashboard', () => {
  it('renders queue metrics, empty lists and assignment/status drill-downs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
    const onViewQueue = vi.fn();
    render(<StaffDashboard onViewQueue={onViewQueue} onViewTicket={vi.fn()} />);
    expect(await screen.findByText('Total Active Queue')).toBeVisible();
    expect(screen.getByText('8')).toBeVisible();
    expect(screen.getByText(/No urgent or critical/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'View New tickets' }));
    expect(onViewQueue).toHaveBeenLastCalledWith({ status: 'New' });
    fireEvent.click(screen.getByRole('button', { name: 'View My Assigned tickets' }));
    expect(onViewQueue).toHaveBeenLastCalledWith({ assigned: 'me' });
    fireEvent.click(screen.getByRole('button', { name: 'View Unassigned Queue tickets' }));
    expect(onViewQueue).toHaveBeenLastCalledWith({ assigned: 'unassigned' });
    expect(screen.queryByText('User Management Summary')).not.toBeInTheDocument();
  });
  it('opens urgent tickets and recovers from an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValue({ ok: true, json: async () => ({ ...data, urgentTickets: [{ id: 5, ticketNumber: 'TKT-5', summary: 'Switch outage', currentStatus: 'New', itPriority: 'Critical', createdAt: '2026-10-01', updatedAt: '2026-10-02' }] }) }));
    const onViewTicket = vi.fn();
    render(<StaffDashboard onViewQueue={vi.fn()} onViewTicket={onViewTicket} />);
    expect(await screen.findByRole('alert')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    fireEvent.click(await screen.findByRole('button', { name: 'View TKT-5' }));
    expect(onViewTicket).toHaveBeenCalledWith(5);
  });
  it('uses the admin API and renders governance with user management navigation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...data, userGovernance: { activeUsersCount: 23, activeRequestersCount: 17, activeStaffCount: 4, activeAdminsCount: 2 } }) });
    vi.stubGlobal('fetch', fetchMock);
    const onManageUsers = vi.fn();
    render(<StaffDashboard isAdmin onViewQueue={vi.fn()} onViewTicket={vi.fn()} onManageUsers={onManageUsers} />);
    expect(await screen.findByText('User Management Summary')).toBeVisible();
    expect(screen.getByText('23')).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/dashboard', expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Manage All Users' }));
    expect(onManageUsers).toHaveBeenCalledOnce();
  });
});
