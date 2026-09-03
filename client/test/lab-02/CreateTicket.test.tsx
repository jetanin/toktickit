import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateTicket from '../../src/components/CreateTicket';
import { Requester } from '../../src/components/RequesterSelector';

const mockRequester: Requester = { id: 1, name: 'Alice Smith', email: 'alice@example.com' };

describe('CreateTicket Screen (All 6 States)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockRefs = () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Hardware' },
            { id: 2, name: 'Software' },
          ],
        });
      }
      if (url.includes('/api/related-systems')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 10, name: 'Corporate Laptop' },
            { id: 20, name: 'Email System' },
          ],
        });
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  };

  // State 1: Initial State
  it('State 1 (Initial): renders empty form with no default selection for category/system, and required asterisks', async () => {
    setupMockRefs();

    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Hardware')).toBeInTheDocument();
      expect(screen.getByText('Corporate Laptop')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    const systemSelect = screen.getByLabelText(/related system/i) as HTMLSelectElement;
    const summaryInput = screen.getByLabelText(/summary/i) as HTMLInputElement;
    const descTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

    expect(categorySelect.value).toBe('');
    expect(systemSelect.value).toBe('');
    expect(summaryInput.value).toBe('');
    expect(descTextarea.value).toBe('');

    // Required asterisks
    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThanOrEqual(4);
  });

  // State 2: Validation Failure
  it('State 2 (Validation Failure): shows validation errors when fields are empty or limits exceeded', async () => {
    setupMockRefs();

    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={() => {}} />);
    await waitFor(() => screen.getByText('Hardware'));

    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });

    // Submit while empty
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/summary is required/i)).toBeInTheDocument();
    });

    // Enter summary > 100 characters
    const summaryInput = screen.getByLabelText(/summary/i);
    fireEvent.change(summaryInput, { target: { value: 'X'.repeat(101) } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/summary cannot exceed 100 characters/i)).toBeInTheDocument();
    });

    // Enter description > 1000 characters
    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'Y'.repeat(1001) } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/description cannot exceed 1000 characters/i)).toBeInTheDocument();
    });
  });

  // State 3: Submitting (Busy)
  it('State 3 (Submitting): disables submit button and shows busy text while submitting', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'Hardware' }] });
      }
      if (url.includes('/api/related-systems')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 10, name: 'Corporate Laptop' }] });
      }
      if (url.includes('/api/tickets') && init?.method === 'POST') {
        // Return hanging promise to stay in busy state
        return new Promise(() => {});
      }
      return Promise.reject(new Error('Unknown'));
    });

    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={() => {}} />);
    await waitFor(() => screen.getByText('Hardware'));

    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Valid Summary' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Valid Description' } });

    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });
    fireEvent.click(submitBtn);

    // Verify busy state
    await waitFor(() => {
      expect(screen.getByText(/submitting\.\.\./i)).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
    });
  });

  // State 4: Success State
  it('State 4 (Success): displays generated ticket number returned from API', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'Hardware' }] });
      }
      if (url.includes('/api/related-systems')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 10, name: 'Corporate Laptop' }] });
      }
      if (url.includes('/api/tickets') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 999,
            ticketNumber: 'TKT-2026-123456',
            summary: 'Valid Summary',
          }),
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    const handleCreated = vi.fn();
    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={handleCreated} />);
    await waitFor(() => screen.getByText('Hardware'));

    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Valid Summary' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Valid Description' } });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/TKT-2026-123456/i)).toBeInTheDocument();
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
  });

  // State 5: API Failure State (Form values preserved!)
  it('State 5 (API Failure): preserves entered form data when backend API returns an error', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || '';
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'Hardware' }] });
      }
      if (url.includes('/api/related-systems')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 10, name: 'Corporate Laptop' }] });
      }
      if (url.includes('/api/tickets') && init?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Database connection failed' }),
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={() => {}} />);
    await waitFor(() => screen.getByText('Hardware'));

    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/related system/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Preserve my summary text' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Preserve my description text' } });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });

    // Verify form values remain intact
    expect((screen.getByLabelText(/summary/i) as HTMLInputElement).value).toBe('Preserve my summary text');
    expect((screen.getByLabelText(/description/i) as HTMLTextAreaElement).value).toBe('Preserve my description text');
    expect((screen.getByLabelText(/category/i) as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText(/related system/i) as HTMLSelectElement).value).toBe('10');
  });

  // State 6: Invalid Attachment
  it('State 6 (Invalid Attachment): shows error when file exceeds 5MB or has invalid type', async () => {
    setupMockRefs();

    render(<CreateTicket requester={mockRequester} onCancel={() => {}} onCreated={() => {}} />);
    await waitFor(() => screen.getByText('Hardware'));

    const fileInput = screen.getByLabelText(/attachment/i);

    // File > 5MB
    const largeFile = new File(['0'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds 5mb/i)).toBeInTheDocument();
    });

    // Invalid file type
    const exeFile = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput, { target: { files: [exeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/only jpg, png, webp, and pdf/i)).toBeInTheDocument();
    });
  });
});

