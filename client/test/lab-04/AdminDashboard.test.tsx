import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import StaffDashboard from '../../src/components/StaffDashboard';

afterEach(() => vi.unstubAllGlobals());
it('UI-08: combines governance and operational metrics with navigation', async () => {
  const data = { totalActiveQueueCount: 9, unassignedCount: 3, myAssignedCount: 1,
    statusBreakdown: { New: 3, Open: 2, 'In Progress': 2, 'Waiting for Requester': 1, Reopened: 1 },
    priorityBreakdown: { Critical: 0, High: 3, Medium: 4, Low: 2 }, urgentTickets: [], recentUpdatedTickets: [],
    userGovernance: { activeUsersCount: 14, activeRequestersCount: 9, activeStaffCount: 3, activeAdminsCount: 2 } };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
  vi.stubGlobal('fetch', fetchMock);
  const onManageUsers = vi.fn(), onViewQueue = vi.fn();
  render(<StaffDashboard isAdmin onViewQueue={onViewQueue} onManageUsers={onManageUsers} onViewTicket={vi.fn()} />);
  expect(await screen.findByText('User Management Summary')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith('/api/admin/dashboard', expect.anything());
  expect(screen.getByText('14')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'View Total Active Queue tickets' }));
  expect(onViewQueue).toHaveBeenCalledWith({ status: 'Active' });
  fireEvent.click(screen.getByRole('button', { name: 'Manage All Users' }));
  expect(onManageUsers).toHaveBeenCalledOnce();
});
