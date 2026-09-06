import React, { useState, useEffect } from 'react';
import type { Requester } from './RequesterSelector';

interface ReferenceOption {
  id: number;
  name: string;
}

interface Props {
  requester: Requester;
  onCancel: () => void;
  onCreated: (ticketId: number) => void;
}

const CreateTicket: React.FC<Props> = ({ requester, onCancel, onCreated }) => {
  const [categories, setCategories] = useState<ReferenceOption[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<ReferenceOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Form Fields (Preserved on failure)
  const [categoryId, setCategoryId] = useState('');
  const [relatedSystemId, setRelatedSystemId] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [requestedPriority, setRequestedPriority] = useState('Low');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI State Handling
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<{ id: number; ticketNumber: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReferences = async () => {
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/related-systems'),
        ]);

        if (catRes.ok && sysRes.ok) {
          const cats = await catRes.json();
          const syss = await sysRes.json();
          if (mounted) {
            setCategories(cats);
            setRelatedSystems(syss);
          }
        }
      } catch (err) {
        console.error('Failed to load reference data:', err);
      } finally {
        if (mounted) setLoadingRefs(false);
      }
    };

    fetchReferences();
    return () => {
      mounted = false;
    };
  }, []);

  // Validation Rules
  const summaryError =
    touched.summary && summary.trim() === ''
      ? 'Summary is required'
      : summary.length > 100
      ? 'Summary cannot exceed 100 characters'
      : null;

  const descriptionError =
    touched.description && description.trim() === ''
      ? 'Description is required'
      : description.length > 1000
      ? 'Description cannot exceed 1000 characters'
      : null;

  const categoryError = touched.categoryId && !categoryId ? 'Category is required' : null;
  const systemError = touched.relatedSystemId && !relatedSystemId ? 'Related System is required' : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachmentError(null);

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAttachmentError('File size exceeds 5MB limit');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
        setAttachmentError('Invalid file type. Only JPG, PNG, WEBP, and PDF are permitted.');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      summary: true,
      description: true,
      categoryId: true,
      relatedSystemId: true,
    });

    if (
      !summary.trim() ||
      summary.length > 100 ||
      !description.trim() ||
      description.length > 1000 ||
      !categoryId ||
      !relatedSystemId ||
      attachmentError
    ) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      // 1. Create Ticket
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requester.id),
        },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          summary: summary.trim(),
          description: description.trim(),
          requestedPriority,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create ticket (Status: ${res.status})`);
      }

      const ticket = await res.json();

      // 2. If attachment was chosen, upload it
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('attachment', selectedFile);

          const attachRes = await fetch(`/api/tickets/${ticket.id}/attachments`, {
            method: 'POST',
            headers: { 'X-Requester-Id': String(requester.id) },
            body: formData,
          });

          if (!attachRes.ok) {
            console.error('Attachment upload failed, but ticket was created');
          }
        } catch (attErr) {
          console.error('Attachment upload error:', attErr);
        }
      }

      // State 4: Success State
      setCreatedTicketInfo({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      });
    } catch (err: any) {
      // State 5: API Failure State (form values are preserved!)
      setApiError(err.message || 'Unable to create ticket. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // State 4: Success Screen
  if (createdTicketInfo) {
    return (
      <div className="card shadow-sm border-0 mt-3" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="card-body text-center p-5">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '64px', height: '64px', backgroundColor: '#EAF6EF', color: '#006B3C' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
            </svg>
          </div>

          <h3 className="h4 fw-bold mb-2" style={{ color: '#006B3C' }}>
            Ticket {createdTicketInfo.ticketNumber} created successfully!
          </h3>
          <p className="text-muted mb-4">
            Your support request has been logged in the system. You can view its details or return to your tickets list.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2"
              onClick={onCancel}
            >
              Back to My Tickets
            </button>
            <button
              type="button"
              className="btn text-white px-4 py-2 fw-semibold"
              style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
              onClick={() => onCreated(createdTicketInfo.id)}
            >
              View Ticket Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="card-header bg-white border-bottom py-3 px-4">
        <h2 className="h5 fw-bold mb-0" style={{ color: '#006B3C' }}>
          Create New IT Support Ticket
        </h2>
        <span className="small text-muted">
          Submitting as <strong>{requester.name}</strong> ({requester.email})
        </span>
      </div>

      <div className="card-body p-4">
        {apiError && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16">
              <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06c-.033-.06-.034-.124.002-.183L7.884 2.073a.15.15 0 0 1 .054-.057zm1.044 10.222v-1.444H7.018v1.444h1.964zm-.008-2.617v-4.14H7.026v4.14h1.948z"/>
            </svg>
            <div>{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Category & Related System */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label htmlFor="categorySelect" className="form-label small fw-semibold text-muted">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="categorySelect"
                className={`form-select ${categoryError ? 'is-invalid' : ''}`}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setTouched((t) => ({ ...t, categoryId: true }));
                }}
                disabled={loadingRefs || submitting}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoryError && <div className="invalid-feedback">{categoryError}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="systemSelect" className="form-label small fw-semibold text-muted">
                Related System <span className="text-danger">*</span>
              </label>
              <select
                id="systemSelect"
                className={`form-select ${systemError ? 'is-invalid' : ''}`}
                value={relatedSystemId}
                onChange={(e) => {
                  setRelatedSystemId(e.target.value);
                  setTouched((t) => ({ ...t, relatedSystemId: true }));
                }}
                disabled={loadingRefs || submitting}
              >
                <option value="">-- Select System --</option>
                {relatedSystems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {systemError && <div className="invalid-feedback">{systemError}</div>}
            </div>
          </div>

          {/* Row 2: Summary */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label htmlFor="summaryInput" className="form-label small fw-semibold text-muted mb-1">
                Summary <span className="text-danger">*</span>
              </label>
              <span className={`small ${summary.length > 100 ? 'text-danger' : 'text-muted'}`}>
                {summary.length}/100
              </span>
            </div>
            <input
              type="text"
              id="summaryInput"
              className={`form-control ${summaryError ? 'is-invalid' : ''}`}
              placeholder="Brief summary of the issue"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setTouched((t) => ({ ...t, summary: true }));
              }}
              disabled={submitting}
            />
            {summaryError && <div className="invalid-feedback">{summaryError}</div>}
          </div>

          {/* Row 3: Description */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label htmlFor="descriptionInput" className="form-label small fw-semibold text-muted mb-1">
                Description <span className="text-danger">*</span>
              </label>
              <span className={`small ${description.length > 1000 ? 'text-danger' : 'text-muted'}`}>
                {description.length}/1000
              </span>
            </div>
            <textarea
              id="descriptionInput"
              rows={4}
              className={`form-control ${descriptionError ? 'is-invalid' : ''}`}
              placeholder="Detailed explanation of the issue, symptoms, and steps to reproduce..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setTouched((t) => ({ ...t, description: true }));
              }}
              disabled={submitting}
            />
            {descriptionError && <div className="invalid-feedback">{descriptionError}</div>}
          </div>

          {/* Row 4: Requested Priority & Attachment */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <label htmlFor="prioritySelect" className="form-label small fw-semibold text-muted">
                Requested Priority
              </label>
              <select
                id="prioritySelect"
                className="form-select"
                value={requestedPriority}
                onChange={(e) => setRequestedPriority(e.target.value)}
                disabled={submitting}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="col-12 col-md-8">
              <label htmlFor="attachmentInput" className="form-label small fw-semibold text-muted">
                Attachment (Optional)
              </label>
              <input
                type="file"
                id="attachmentInput"
                className={`form-control ${attachmentError ? 'is-invalid' : ''}`}
                onChange={handleFileChange}
                disabled={submitting}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              />
              <div className="form-text small text-muted">
                Max file size: 5MB. Formats accepted: JPG, PNG, WEBP, PDF.
              </div>
              {attachmentError && <div className="invalid-feedback d-block">{attachmentError}</div>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button
              type="button"
              className="btn btn-link text-decoration-none px-3"
              style={{ color: '#0B7A46' }}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn text-white px-4 py-2 fw-semibold"
              style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
              disabled={submitting || loadingRefs}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
