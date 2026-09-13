import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../../src/components/Login';

describe('UI-01: Login Screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders email input, password input, show/hide toggle, and sign in button', () => {
    render(<Login onLoginSuccess={() => {}} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show password|hide password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles password visibility between password and text when show/hide is clicked', () => {
    render(<Login onLoginSuccess={() => {}} />);

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    const toggleBtn = screen.getByRole('button', { name: /show password|hide password/i });

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('shows loading state/spinner on submit while request is pending', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<Login onLoginSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jennifer.anderson@toktick.it' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password123!' },
    });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays safe error banner when credentials are invalid (401)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password' }),
    });

    render(<Login onLoginSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jennifer.anderson@toktick.it' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'WrongPassword!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/invalid email or password/i);
    });
  });

  it('calls onLoginSuccess with user data on successful login', async () => {
    const mockUser = {
      id: 1,
      name: 'Jennifer Anderson',
      email: 'jennifer.anderson@toktick.it',
      role: 'REQUESTER',
      mustChangePassword: false,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: mockUser }),
    });

    const handleSuccess = vi.fn();
    render(<Login onLoginSuccess={handleSuccess} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jennifer.anderson@toktick.it' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith(mockUser);
    });
  });
});

