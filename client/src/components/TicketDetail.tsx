import React, { useState, useEffect } from 'react';
import type { Requester } from './RequesterSelector';

interface AttachmentItem {
  id: number;
  originalFilename: string;
  size: number;
  mimeType: string;
  removedAt: string | null;
  removalReason: string | null;
  createdAt: string;
}

interface TicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string };
  attachments: AttachmentItem[];
}

interface Props {
  requester: Requester;
  ticketId: number;
  onBack: () => void;
}

const PREDEFINED_REASONS = [
  'Uploaded the wrong file',
  'File contains sensitive information',
  'Duplicate attachment',
  'Updated version available',
  'อื่นๆ (โปรดระบุ)',
];

const TicketDetail: React.FC<Props> = ({ requester, ticketId, onBack }) => {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Soft-remove modal state
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'X-Requester-Id': String(requester.id),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load ticket (Status: ${res.status})`);
      }

      const data = await res.json();
      setTicket(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadError(null);

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size exceeds 5MB limit.');
        setFileToUpload(null);
        e.target.value = '';
        return;
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
        setUploadError('Invalid file type. Only JPG, PNG, WEBP, and PDF are permitted.');
        setFileToUpload(null);
        e.target.value = '';
        return;
      }

      setFileToUpload(file);
    } else {
      setFileToUpload(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('attachment', fileToUpload);

      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: {
          'X-Requester-Id': String(requester.id),
        },
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to upload attachment (Status: ${res.status})`);
      }

      // Reset file input and refresh
      setFileToUpload(null);
      const inputEl = document.getElementById('ticketDetailAttachmentInput') as HTMLInputElement | null;
      if (inputEl) inputEl.value = '';

      await fetchTicketDetail();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId: number, filename: string) => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/download`, {
        headers: {
          'X-Requester-Id': String(requester.id),
        },
      });

      if (!res.ok) {
        throw new Error('Download failed or attachment was removed.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTargetId) return;

    const finalReason = selectedReason === 'อื่นๆ (โปรดระบุ)' ? customReason.trim() : selectedReason;
    if (!finalReason) {
      setRemoveError('Please provide a reason for removal.');
      return;
    }

    setRemoving(true);
    setRemoveError(null);

    try {
      const res = await fetch(`/api/attachments/${removeTargetId}/remove`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requester-Id': String(requester.id),
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to remove attachment.');
      }

      setRemoveTargetId(null);
      setSelectedReason(PREDEFINED_REASONS[0]);
      setCustomReason('');
      await fetchTicketDetail();
    } catch (err: any) {
      setRemoveError(err.message || 'Unable to remove attachment.');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0 py-5 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="spinner-border mx-auto mb-2" role="status" style={{ color: '#006B3C' }}>
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <span className="text-muted small">Loading ticket details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="card shadow-sm border-0 p-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="alert alert-danger mb-3" role="alert">
          {error || 'Ticket not found or access denied.'}
        </div>
        <button type="button" className="btn btn-outline-secondary w-auto" onClick={onBack}>
          &larr; Back to My Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.removedAt) || [];
  const removedAttachments = ticket.attachments?.filter((a) => a.removedAt) || [];

  return (
    <div>
      {/* Header bar with Back action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-3"
          onClick={onBack}
        >
          &larr; Back to My Tickets
        </button>
        <span className="small text-muted">
          Official Ticket Number: <strong className="text-dark">{ticket.ticketNumber}</strong>
        </span>
      </div>

      <div className="row g-4">
        {/* Left Column: Read-Only Ticket Details */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <span className="small text-muted fw-semibold d-block mb-1">{ticket.ticketNumber}</span>
                  <h1 className="h4 fw-bold mb-0 text-dark">{ticket.summary}</h1>
                </div>
                <span
                  className="badge px-2 py-1 fw-medium"
                  style={{ backgroundColor: '#E8F1FA', color: '#105696', border: '1px solid #BDD8F0' }}
                >
                  {ticket.currentStatus}
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Description Section */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted text-uppercase mb-2">
                  Description
                </label>
                <div
                  className="p-3 rounded small"
                  style={{
                    backgroundColor: '#F8FAF9',
                    border: '1px solid #E2E8E5',
                    whiteSpace: 'pre-wrap',
                    minHeight: '100px',
                    color: '#2B3B33',
                  }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="row g-3 pt-3 border-top">
                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Category</span>
                  <strong className="small text-dark">{ticket.category?.name}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Related System</span>
                  <strong className="small text-dark">{ticket.relatedSystem?.name}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Requester</span>
                  <strong className="small text-dark">{ticket.requester?.name}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Requested Priority</span>
                  <span
                    className="badge fw-medium px-2 py-1"
                    style={{
                      backgroundColor: ticket.requestedPriority === 'High' ? '#FDECEB' : '#EAF6EF',
                      color: ticket.requestedPriority === 'High' ? '#9C1A1A' : '#006B3C',
                    }}
                  >
                    {ticket.requestedPriority}
                  </span>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">IT Priority</span>
                  {ticket.itPriority ? (
                    <span className="badge bg-secondary">{ticket.itPriority}</span>
                  ) : (
                    <span className="small text-muted">Unassigned</span>
                  )}
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Created Date</span>
                  <span className="small text-dark">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attachments Lifecycle */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h2 className="h6 fw-bold mb-0" style={{ color: '#006B3C' }}>
                Attachments
              </h2>
              <span className="badge rounded-pill bg-light text-muted border">
                {activeAttachments.length}/5 active
              </span>
            </div>

            <div className="card-body p-3">
              {/* Active Attachments List */}
              <div className="d-flex flex-column gap-2 mb-3">
                {activeAttachments.length === 0 && removedAttachments.length === 0 && (
                  <span className="text-muted small text-center py-3">No attachments uploaded</span>
                )}

                {activeAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="d-flex justify-content-between align-items-center p-2 rounded"
                    style={{ backgroundColor: '#F8FAF9', border: '1px solid #E2E8E5' }}
                  >
                    <div className="text-truncate me-2" style={{ maxWidth: '170px' }}>
                      <span className="d-block small fw-semibold text-truncate" title={att.originalFilename}>
                        {att.originalFilename}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {(att.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary py-0 px-2 small"
                        onClick={() => handleDownload(att.id, att.originalFilename)}
                        title="Download"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger py-0 px-2 small"
                        onClick={() => {
                          setRemoveTargetId(att.id);
                          setSelectedReason(PREDEFINED_REASONS[0]);
                          setCustomReason('');
                          setRemoveError(null);
                        }}
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Soft-Removed Attachments per ui-spec.md Section 11 */}
                {removedAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 rounded text-muted"
                    style={{ backgroundColor: '#F2F4F3', border: '1px dashed #D0D6D3' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-decoration-line-through small text-truncate" style={{ maxWidth: '180px' }}>
                        {att.originalFilename}
                      </span>
                      <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                        Removed
                      </span>
                    </div>
                    {att.removalReason && (
                      <span className="d-block small text-danger" style={{ fontSize: '0.72rem' }}>
                        Reason: {att.removalReason}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Attachment Form (only if active count < 5) */}
              {activeAttachments.length < 5 ? (
                <form onSubmit={handleUploadSubmit} className="pt-3 border-top">
                  <label htmlFor="ticketDetailAttachmentInput" className="form-label small fw-semibold text-muted">
                    Add Attachment
                  </label>
                  <input
                    type="file"
                    id="ticketDetailAttachmentInput"
                    className={`form-control form-control-sm mb-1 ${uploadError ? 'is-invalid' : ''}`}
                    onChange={handleFileSelection}
                    disabled={uploading}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                  <div className="form-text small text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                    JPG, PNG, WEBP, PDF (max 5MB)
                  </div>
                  {uploadError && <div className="invalid-feedback d-block mb-2">{uploadError}</div>}

                  <button
                    type="submit"
                    className="btn btn-sm text-white w-100 fw-semibold"
                    style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                    disabled={!fileToUpload || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Attachment'}
                  </button>
                </form>
              ) : (
                <div className="alert alert-warning small py-2 mb-0" role="alert">
                  Maximum of 5 active attachments reached.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Soft-Removal Dialog / Modal per ui-spec.md Section 11 & specification.md Section 11 */}
      {removeTargetId && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleConfirmRemove}>
                <div className="modal-header border-bottom py-3">
                  <h3 className="modal-title h5 fw-bold text-danger">Remove Attachment</h3>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setRemoveTargetId(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Are you sure you want to remove this attachment? Soft-removal cannot be undone and will prevent future downloads.
                  </p>

                  <div className="mb-3">
                    <label htmlFor="removalReasonSelect" className="form-label small fw-semibold text-muted">
                      Reason for removal <span className="text-danger">*</span>
                    </label>
                    <select
                      id="removalReasonSelect"
                      className="form-select"
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      required
                    >
                      {PREDEFINED_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedReason === 'อื่นๆ (โปรดระบุ)' && (
                    <div className="mb-3">
                      <label htmlFor="customReasonInput" className="form-label small fw-semibold text-muted">
                        Specify reason <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="customReasonInput"
                        className="form-control"
                        placeholder="Please specify reason for removal..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        maxLength={300}
                        required
                      />
                    </div>
                  )}

                  {removeError && <div className="alert alert-danger py-2 small mb-0">{removeError}</div>}
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRemoveTargetId(null)}
                    disabled={removing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm px-3 fw-semibold"
                    disabled={removing}
                  >
                    {removing ? 'Removing...' : 'Confirm Remove'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
