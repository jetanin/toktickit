import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangePassword from '../../src/components/ChangePassword';

describe('UI-02: Change Password Screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders current password, new password, confirm password, and checklist', () => {
    render(<ChangePassword onSuccess={() => {}} />);

    expect(screen.getByLabelText(/^Current Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update password|change password/i })).toBeInTheDocument();

    // Complexity checklist items
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one numeric digit|at least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
  });

  it('disables submit button until all complexity rules and password match are satisfied', () => {
    render(<ChangePassword onSuccess={() => {}} />);

    const submitBtn = screen.getByRole('button', { name: /update password|change password/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'Weak1!' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: 'Weak1!' },
    });

    // Still less than 8 chars
    expect(submitBtn).toBeDisabled();

    // Set valid complex password but mismatched confirm
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: 'DifferentPassword123!' },
    });
    expect(submitBtn).toBeDisabled();

    // Match both
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });
    expect(submitBtn).not.toBeDisabled();
  });

  it('displays error banner if API returns failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Current password is incorrect' }),
    });

    render(<ChangePassword onSuccess={() => {}} />);

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: 'WrongPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });

    const submitBtn = screen.getByRole('button', { name: /update password|change password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/current password is incorrect/i);
    });
  });

  it('submits successfully and calls onSuccess', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Password changed successfully',
        mustChangePassword: false,
      }),
    });

    const handleSuccess = vi.fn();
    render(<ChangePassword onSuccess={handleSuccess} />);

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: 'NewValidPassword123!' },
    });

    const submitBtn = screen.getByRole('button', { name: /update password|change password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
