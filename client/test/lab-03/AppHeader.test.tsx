import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../src/App';

describe('UI-03: Authenticated App Shell Header & Mandatory Password Change Gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('displays user name, role badge, and working logout button when authenticated', async () => {
    const mockUser = {
      id: 1,
      name: 'Sarah Jenkins',
      email: 'sarah.it@toktick.it',
      role: 'IT_STAFF',
      mustChangePassword: false,
    };

    localStorage.setItem('toktickit_user', JSON.stringify(mockUser));

    let loggedIn = true;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/logout')) {
        loggedIn = false;
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Logged out successfully' }),
        });
      }
      if (url.includes('/api/auth/me')) {
        if (loggedIn) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: mockUser }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });
      }
      if (url.includes('/api/tickets')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ tickets: [], pagination: { total: 0 } }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<App />);

    // Verify user name and IT Staff badge in header
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('IT Staff')).toBeInTheDocument();

    // Verify logout button exists
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    expect(logoutBtn).toBeInTheDocument();

    // Click logout
    fireEvent.click(logoutBtn);

    // Wait for logout API call
    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls.map((c: any) => [c[0], c[1]?.method]);
      expect(calls).toContainEqual(['/api/auth/logout', 'POST']);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('renders ChangePassword overlay when user has mustChangePassword = true', async () => {
    const mockUser = {
      id: 2,
      name: 'Alex Thompson',
      email: 'alex.thompson@toktick.it',
      role: 'REQUESTER',
      mustChangePassword: true,
    };

    localStorage.setItem('toktickit_user', JSON.stringify(mockUser));

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: mockUser }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<App />);

    // Change password overlay should be visible
    expect(screen.getByRole('heading', { name: /change your password/i })).toBeInTheDocument();
    expect(screen.getByText(/action required/i)).toBeInTheDocument();
  });

  it('renders role-specific navigation for ADMINISTRATOR without My Tickets or Create Ticket', async () => {
    const mockAdmin = {
      id: 99,
      name: 'Admin User',
      email: 'admin@toktick.it',
      role: 'ADMINISTRATOR',
      mustChangePassword: false,
    };

    localStorage.setItem('toktickit_user', JSON.stringify(mockAdmin));

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: mockAdmin }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [], meta: { totalItems: 0 } }) });
    });

    render(<App />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    // Administrator sees Ticket Queue
    expect(screen.getByRole('button', { name: /ticket queue/i })).toBeInTheDocument();

    // Administrator does NOT see My Tickets or Create Ticket
    expect(screen.queryByRole('button', { name: /my tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create ticket/i })).not.toBeInTheDocument();
  });
});
