import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RequesterSelector, { Requester } from '../../src/components/RequesterSelector';

describe('RequesterSelector', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while fetching requesters', () => {
    // Return a pending promise to keep component in loading state
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<RequesterSelector onSelect={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders loaded active requesters, displays testing disclaimer, and calls onSelect on continue', async () => {
    const mockRequesters: Requester[] = [
      { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
      { id: 2, name: 'Bob Jones', email: 'bob@example.com' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRequesters,
    });

    const handleSelect = vi.fn();
    render(<RequesterSelector onSelect={handleSelect} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Verify clear labeling as development / testing simulation mechanism
    expect(screen.getByRole('heading', { name: /development requester/i })).toBeInTheDocument();
    expect(screen.getByText(/testing only/i)).toBeInTheDocument();

    // Verify requesters are listed
    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Jones/i)).toBeInTheDocument();

    // Select Bob Jones
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockRequesters[1]);
  });

  it('shows empty state when no active requesters are available', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<RequesterSelector onSelect={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText(/no active requesters available\. please contact the it administrator\./i)
      ).toBeInTheDocument();
    });
  });

  it('shows error state with retry button when API fails', async () => {
    // First call fails
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<RequesterSelector onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load requesters\. please try again\./i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Second call succeeds on retry
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, name: 'Alice Smith', email: 'alice@example.com' }],
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    });
  });
});
