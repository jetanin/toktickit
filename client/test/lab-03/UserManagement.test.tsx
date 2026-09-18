import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement, { type AdminUser } from '../../src/components/UserManagement';

describe('UI-07 & UI-08: Administrator User Management & Safety Guards', () => {
  const mockCurrentUser = {
    id: 1,
    name: 'Master Admin',
    email: 'admin@toktick.it',
    role: 'ADMINISTRATOR',
  };

  const mockUsers: AdminUser[] = [
    {
      id: 1,
      name: 'Master Admin',
      email: 'admin@toktick.it',
      role: 'ADMINISTRATOR',
      isActive: true,
      mustChangePassword: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Secondary Admin',
      email: 'admin2@toktick.it',
      role: 'ADMINISTRATOR',
      isActive: true,
      mustChangePassword: false,
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 3,
      name: 'Sarah Staff',
      email: 'sarah.it@toktick.it',
      role: 'IT_STAFF',
      isActive: true,
      mustChangePassword: false,
      createdAt: '2026-01-03T00:00:00Z',
    },
    {
      id: 4,
      name: 'Alex Requester',
      email: 'alex@toktick.it',
      role: 'REQUESTER',
      isActive: false,
      mustChangePassword: true,
      createdAt: '2026-01-04T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders user management interface with title, toolbar, and user table', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(<UserManagement currentUser={mockCurrentUser} />);

    // Header & Toolbar
    expect(screen.getByRole('heading', { level: 1, name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Create User/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search users by name or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by role/i)).toBeInTheDocument();

    // Table Content
    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Secondary Admin').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sarah Staff').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Alex Requester').length).toBeGreaterThanOrEqual(1);
    });

    // Role Badges & Status Badges
    expect(screen.getAllByText('Administrator').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('IT Staff').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Requester').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Password Change Pending').length).toBeGreaterThanOrEqual(1);
  });

  it('supports searching users by name or email', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('search=Sarah')) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockUsers[2]],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText(/search users by name or email/i);
    const searchBtn = screen.getByRole('button', { name: /^search$/i });

    fireEvent.change(searchInput, { target: { value: 'Sarah' } });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: any) => c[0]);
      expect(calls.some((u: string) => u.includes('search=Sarah'))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Sarah Staff').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Master Admin')).not.toBeInTheDocument();
    });
  });

  it('supports filtering by role', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('role=IT_STAFF')) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockUsers[2]],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    const roleSelect = screen.getByLabelText(/filter by role/i);
    fireEvent.change(roleSelect, { target: { value: 'IT_STAFF' } });

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: any) => c[0]);
      expect(calls.some((u: string) => u.includes('role=IT_STAFF'))).toBe(true);
    });
  });

  it('opens create user modal and creates a new user', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url === '/api/admin/users' && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 5,
            ...body,
            mustChangePassword: true,
            createdAt: '2026-01-05T00:00:00Z',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    // Open Create Modal
    fireEvent.click(screen.getByRole('button', { name: /\+ Create User/i }));

    expect(screen.getByRole('heading', { level: 2, name: /create new user/i })).toBeInTheDocument();

    // Fill Form
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/initial password/i);

    fireEvent.change(nameInput, { target: { value: 'New Engineer' } });
    fireEvent.change(emailInput, { target: { value: 'new.eng@toktick.it' } });
    fireEvent.change(passwordInput, { target: { value: 'Welcome@123' } });

    // Submit Form
    const submitBtn = screen.getByRole('button', { name: /save user/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c: any) => c[0] === '/api/admin/users' && c[1]?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall[1].body);
      expect(body.name).toBe('New Engineer');
      expect(body.email).toBe('new.eng@toktick.it');
      expect(body.initialPassword).toBe('Welcome@123');
      expect(body.isActive).toBe(true);
    });
  });

  it('displays error when create user fails with 409 duplicate email', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url === '/api/admin/users' && opts?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ error: 'A user with this email address already exists.' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Create User/i }));

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Duplicate' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@toktick.it' } });
    fireEvent.change(screen.getByLabelText(/initial password/i), { target: { value: 'Welcome@123' } });

    fireEvent.click(screen.getByRole('button', { name: /save user/i }));

    await waitFor(() => {
      expect(screen.getByText(/a user with this email address already exists/i)).toBeInTheDocument();
    });
  });

  it('enforces self-deactivation safety guard (BR-24) in edit user modal', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    // Open Edit modal on self (id: 1, mockCurrentUser.id === 1)
    fireEvent.click(screen.getAllByRole('button', { name: /edit master admin/i })[0]);

    expect(screen.getByRole('heading', { level: 2, name: /edit user details/i })).toBeInTheDocument();

    // Active switch must be disabled
    const activeSwitch = screen.getByRole('switch', { name: /active account/i });
    expect(activeSwitch).toBeDisabled();

    // Explanation message must be shown
    expect(screen.getByText(/you cannot deactivate your own account \(BR-24\)/i)).toBeInTheDocument();
  });

  it('enforces sole active administrator safety guard (BR-25) in edit user modal', async () => {
    // Single active admin in list
    const singleAdminUsers: AdminUser[] = [
      {
        id: 1,
        name: 'Master Admin',
        email: 'admin@toktick.it',
        role: 'ADMINISTRATOR',
        isActive: true,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 3,
        name: 'Sarah Staff',
        email: 'sarah.it@toktick.it',
        role: 'IT_STAFF',
        isActive: true,
        mustChangePassword: false,
        createdAt: '2026-01-03T00:00:00Z',
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: async () => singleAdminUsers,
      });
    });

    // Logged in as another hypothetical context or viewing sole admin
    render(<UserManagement currentUser={{ id: 99, name: 'Root Super', email: 'root@toktick.it', role: 'ADMINISTRATOR' }} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit master admin/i })[0]);

    // Both Role selector and Active switch must be disabled
    const activeSwitch = screen.getByRole('switch', { name: /active account/i });
    expect(activeSwitch).toBeDisabled();

    expect(screen.getByText(/cannot deactivate the last active administrator \(BR-25\)/i)).toBeInTheDocument();
    expect(screen.getByText(/role modification locked: this is the sole active administrator account \(BR-25\)/i)).toBeInTheDocument();
  });

  it('submits edit user modal successfully for non-guarded user', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/admin/users/3') && opts?.method === 'PATCH') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockUsers[2], ...body }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Sarah Staff').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit sarah staff/i })[0]);

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Sarah Senior Staff' } });

    fireEvent.click(screen.getByRole('button', { name: /save user/i }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c: any) => c[0].includes('/api/admin/users/3') && c[1]?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall[1].body);
      expect(body.name).toBe('Sarah Senior Staff');
    });
  });

  it('opens reset password modal and resets initial password (BR-26)', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/admin/users/4/reset-password') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Password reset successfully' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Alex Requester').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /reset password for alex requester/i })[0]);

    expect(screen.getByRole('heading', { level: 2, name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/user will be required to change this password on their next login/i)).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/new initial password/i);
    fireEvent.change(passwordInput, { target: { value: 'Reset@2026' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm reset/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const resetCall = fetchMock.mock.calls.find(
        (c: any) => c[0].includes('/api/admin/users/4/reset-password')
      );
      expect(resetCall).toBeDefined();
      const body = JSON.parse(resetCall[1].body);
      expect(body.initialPassword).toBe('Reset@2026');
    });
  });

  it('displays empty state when no users are returned', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => [],
      })
    );

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
  });

  it('displays error alert when fetch fails', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })
    );

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load users \(Status: 500\)/i)).toBeInTheDocument();
    });
  });

  it('supports pagination with 10 users per page', async () => {
    const fifteenUsers: AdminUser[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@toktick.it`,
      role: 'REQUESTER',
      isActive: true,
      mustChangePassword: false,
      createdAt: '2026-01-01T00:00:00Z',
    }));

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => fifteenUsers,
      })
    );

    render(<UserManagement currentUser={mockCurrentUser} />);

    // Page 1 displays first 10 users (User 1 through User 10)
    await waitFor(() => {
      expect(screen.getAllByText('User 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('User 10').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Showing 1 to 10 of 15 users \(Page 1 of 2\)/i)).toBeInTheDocument();

    // Navigate to Page 2
    const nextBtn = screen.getByRole('button', { name: /next page/i });
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);

    // Page 2 displays remaining users (User 11 through User 15)
    await waitFor(() => {
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
      expect(screen.getAllByText('User 11').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('User 15').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText(/Showing 11 to 15 of 15 users \(Page 2 of 2\)/i)).toBeInTheDocument();

    // Previous button navigates back to Page 1
    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    expect(prevBtn).toBeEnabled();
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getAllByText('User 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });
  });

  it('renders mobile card representation with reachable single-tap Edit and Reset actions', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('user-cards-mobile')).toBeInTheDocument();
    });

    const mobileContainer = screen.getByTestId('user-cards-mobile');
    const mobileCards = within(mobileContainer).getAllByTestId('user-card-item');
    expect(mobileCards.length).toBe(4);

    // Verify first card has user info, badges, and action buttons
    const firstCard = mobileCards[0];
    expect(within(firstCard).getByText('Master Admin')).toBeInTheDocument();
    expect(within(firstCard).getByText('admin@toktick.it')).toBeInTheDocument();
    expect(within(firstCard).getByRole('button', { name: /edit master admin/i })).toBeInTheDocument();
    expect(within(firstCard).getByRole('button', { name: /reset password for master admin/i })).toBeInTheDocument();
  });

  it('allows editing another Administrator when multiple active Administrators exist with toggle enabled and no guard message', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/admin/users/2') && opts?.method === 'PATCH') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockUsers[1], ...body }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });
    global.fetch = fetchMock;

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Secondary Admin').length).toBeGreaterThanOrEqual(1);
    });

    // Master Admin (id: 1) edits Secondary Admin (id: 2)
    fireEvent.click(screen.getAllByRole('button', { name: /edit secondary admin/i })[0]);

    expect(screen.getByRole('heading', { level: 2, name: /edit user details/i })).toBeInTheDocument();

    // Active switch must be ENABLED
    const activeSwitch = screen.getByRole('switch', { name: /active account/i });
    expect(activeSwitch).toBeEnabled();

    // Role select must be ENABLED
    const roleSelect = screen.getByRole('combobox', { name: /^role$/i });
    expect(roleSelect).toBeEnabled();

    // No safety guard warning messages may appear
    expect(screen.queryByText(/you cannot deactivate your own account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cannot deactivate the last active administrator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/role modification locked/i)).not.toBeInTheDocument();

    // Deactivate Secondary Admin and Save
    fireEvent.click(activeSwitch);
    fireEvent.click(screen.getByRole('button', { name: /save user/i }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c: any) => c[0].includes('/api/admin/users/2') && c[1]?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall[1].body);
      expect(body.isActive).toBe(false);
    });
  });

  it('displays error when edit user fails with 409 duplicate email', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/admin/users/3') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ error: 'This email address is already in use' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      });
    });

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Sarah Staff').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /edit sarah staff/i })[0]);

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'admin@toktick.it' } });

    fireEvent.click(screen.getByRole('button', { name: /save user/i }));

    await waitFor(() => {
      expect(screen.getByText(/this email address is already in use/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility with show/hide eye toggle in Create and Reset Password modals', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      })
    );

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    // 1. Create User Modal Password Toggle
    fireEvent.click(screen.getByRole('button', { name: /\+ Create User/i }));
    const createPassInput = screen.getByLabelText(/initial password/i);
    expect(createPassInput).toHaveAttribute('type', 'password');

    const showCreatePassBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(showCreatePassBtn);
    expect(createPassInput).toHaveAttribute('type', 'text');

    const hideCreatePassBtn = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideCreatePassBtn);
    expect(createPassInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // 2. Reset Password Modal Password Toggle
    fireEvent.click(screen.getAllByRole('button', { name: /reset password for alex requester/i })[0]);
    const resetPassInput = screen.getByLabelText(/new initial password/i);
    expect(resetPassInput).toHaveAttribute('type', 'password');

    const showResetPassBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(showResetPassBtn);
    expect(resetPassInput).toHaveAttribute('type', 'text');

    const hideResetPassBtn = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideResetPassBtn);
    expect(resetPassInput).toHaveAttribute('type', 'password');
  });

  it('renders title attribute showing full email on hover in table cells', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockUsers,
      })
    );

    render(<UserManagement currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThanOrEqual(1);
    });

    const emailElements = screen.getAllByText('admin@toktick.it');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
    expect(emailElements[0]).toHaveAttribute('title', 'admin@toktick.it');
  });
});
