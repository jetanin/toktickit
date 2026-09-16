import React, { useState, useEffect } from 'react';
import type { Requester } from '../types';

interface AttachmentItem {
  id: number;
  originalFilename: string;
  size: number;
  mimeType: string;
  removedAt: string | null;
  removalReason: string | null;
  createdAt: string;
}

interface PublicCommentItem {
  id: number;
  ticketId: number;
  content: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface InternalNoteItem {
  id: number;
  ticketId: number;
  content: string;
  author: {
    id: number;
    name: string;
    role: string;
  };
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
  resolutionSummary?: string | null;
  ticketOwnerId?: number | null;
  ticketOwner?: { id: number; name: string; email: string; role: string } | null;
  requesterResolutionPending?: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string };
  attachments: AttachmentItem[];
}

interface Props {
  requester?: Requester;
  currentUser?: { id: number; name: string; email: string; role: string } | null;
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

// Permitted status transitions per BR-15
const PERMITTED_STATUS_TRANSITIONS: Record<string, string[]> = {
  New: ['Open', 'In Progress', 'Cancelled'],
  Open: ['In Progress', 'Waiting for Requester', 'Resolved', 'Cancelled'],
  'In Progress': ['Waiting for Requester', 'Resolved', 'Cancelled'],
  'Waiting for Requester': ['In Progress', 'Resolved', 'Cancelled'],
  Resolved: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['In Progress', 'Resolved', 'Cancelled'],
  Cancelled: [],
};

const TicketDetail: React.FC<Props> = ({ requester, currentUser, ticketId, onBack }) => {
  const userRole = currentUser?.role || (requester as any)?.role || 'REQUESTER';
  const isStaffOrAdmin = userRole === 'IT_STAFF' || userRole === 'ADMINISTRATOR';

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operational controls state for IT Staff / Admin
  const [assignees, setAssignees] = useState<{ id: number; name: string; email: string; role: string }[]>([]);
  const [assigningOwner, setAssigningOwner] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  const [targetStatus, setTargetStatus] = useState<string>('');
  const [resolutionSummaryInput, setResolutionSummaryInput] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Communication tabs state
  type TabType = 'COMMENTS' | 'INTERNAL_NOTES' | 'ATTACHMENTS';
  const [activeTab, setActiveTab] = useState<TabType>('COMMENTS');

  // Internal Notes state
  const [internalNotes, setInternalNotes] = useState<InternalNoteItem[]>([]);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

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

  // Public Comments state
  const [comments, setComments] = useState<PublicCommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Resolution indication state (Requester)
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketDetail();
    fetchComments();
    if (isStaffOrAdmin) {
      fetchAssignees();
      fetchInternalNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, isStaffOrAdmin]);

  const fetchTicketDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);

      if (!res.ok) {
        throw new Error(`Failed to load ticket (Status: ${res.status})`);
      }

      const data = await res.json();
      setTicket(data);
      setTargetStatus((prev) => (prev && prev !== data.currentStatus ? prev : data.currentStatus));
      if (data.resolutionSummary) {
        setResolutionSummaryInput(data.resolutionSummary);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch('/api/staff/assignees');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAssignees(data);
        }
      }
    } catch (err) {
      console.error('Error fetching assignees:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          setComments([]);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const fetchInternalNotes = async () => {
    if (!isStaffOrAdmin) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/internal-notes`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInternalNotes(data);
        }
      }
    } catch (err) {
      console.error('Error fetching internal notes:', err);
    }
  };

  // Claim or change owner
  const handleAssignOwner = async (ownerId: number | null) => {
    setAssigningOwner(true);
    setOwnerError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/owner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketOwnerId: ownerId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update ticket owner.');
      }

      await fetchTicketDetail();
    } catch (err: any) {
      setOwnerError(err.message || 'Failed to update ticket owner.');
    } finally {
      setAssigningOwner(false);
    }
  };

  // Update IT Priority
  const handlePriorityChange = async (newPriority: string) => {
    setUpdatingPriority(true);
    setPriorityError(null);
    try {
      const res = await fetch(`/api/staff/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itPriority: newPriority }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update IT Priority.');
      }

      await fetchTicketDetail();
    } catch (err: any) {
      setPriorityError(err.message || 'Failed to update IT Priority.');
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Update Ticket Status
  const handleStatusSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetStatus || targetStatus === ticket?.currentStatus) return;

    if (targetStatus === 'Resolved' && !resolutionSummaryInput.trim()) {
      setStatusError('Resolution summary is required when resolving a ticket.');
      return;
    }

    setUpdatingStatus(true);
    setStatusError(null);
    try {
      const payload: any = { status: targetStatus };
      if (targetStatus === 'Resolved') {
        payload.resolutionSummary = resolutionSummaryInput.trim();
      }

      const res = await fetch(`/api/staff/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to advance ticket status.');
      }

      await fetchTicketDetail();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to advance ticket status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add Public Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) {
      setCommentError('Comment cannot be empty or whitespace only.');
      return;
    }
    if (trimmed.length > 2000) {
      setCommentError('Comment cannot exceed 2000 characters.');
      return;
    }

    setCommentSubmitting(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to post comment.');
      }

      setNewComment('');
      await fetchComments();
    } catch (err: any) {
      setCommentError(err.message || 'Unable to post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Add Internal Note
  const handleInternalNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInternalNote.trim();
    if (!trimmed) {
      setNoteError('Internal note cannot be empty or whitespace only.');
      return;
    }
    if (trimmed.length > 2000) {
      setNoteError('Internal note cannot exceed 2000 characters.');
      return;
    }

    setNoteSubmitting(true);
    setNoteError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/internal-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to add internal note.');
      }

      setNewInternalNote('');
      await fetchInternalNotes();
    } catch (err: any) {
      setNoteError(err.message || 'Unable to add internal note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Requester: "Problem Appears Resolved"
  const handleConfirmResolved = async () => {
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/resolve-indication`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to submit resolution indication.');
      }

      setShowResolveModal(false);
      await fetchTicketDetail();
      await fetchComments();
    } catch (err: any) {
      setResolveError(err.message || 'Unable to indicate resolution.');
    } finally {
      setResolving(false);
    }
  };

  // Attachment handling
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
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to upload attachment (Status: ${res.status})`);
      }

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
      const res = await fetch(`/api/attachments/${attachmentId}/download`);

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
        headers: { 'Content-Type': 'application/json' },
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

  const getPriorityBadgeStyle = (priority: string | null) => {
    const lower = (priority || '').toLowerCase();
    if (lower === 'critical') {
      return { backgroundColor: '#5A1A1A', color: '#FFFFFF', border: '1px solid #3D1010' };
    }
    if (lower === 'high') {
      return { backgroundColor: '#FDECEB', color: '#9C1A1A', border: '1px solid #F8BEBC' };
    }
    if (lower === 'medium') {
      return { backgroundColor: '#FFF4E5', color: '#B25E00', border: '1px solid #FFE2B3' };
    }
    return { backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #BFE4D1' };
  };

  const getStatusBadgeStyle = (status: string | null) => {
    const lower = (status || '').toLowerCase();
    if (lower === 'in progress') {
      return { backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #BFE4D1' };
    }
    if (lower === 'open') {
      return { backgroundColor: '#E3FCEF', color: '#006644', border: '1px solid #ABF5D1' };
    }
    if (lower === 'waiting for requester') {
      return { backgroundColor: '#EAE6FF', color: '#403294', border: '1px solid #C0B6F2' };
    }
    if (lower === 'resolved') {
      return { backgroundColor: '#EAF6EF', color: '#006B3C', border: '1px solid #C3E6D5' };
    }
    if (lower === 'closed' || lower === 'cancelled') {
      return { backgroundColor: '#F4F5F7', color: '#42526E', border: '1px solid #DFE1E6' };
    }
    if (lower === 'reopened') {
      return { backgroundColor: '#FFEBE6', color: '#BF2600', border: '1px solid #FFBDAD' };
    }
    return { backgroundColor: '#DEEBFF', color: '#0747A6', border: '1px solid #B3D4FF' };
  };

  const permittedNextStatuses = PERMITTED_STATUS_TRANSITIONS[ticket.currentStatus] || [];

  return (
    <div>
      {/* Header bar with Back action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-3"
          onClick={onBack}
        >
          &larr; {isStaffOrAdmin ? 'Back to Queue' : 'Back to My Tickets'}
        </button>
        <span className="small text-muted">
          Official Ticket Number: <strong className="text-dark">{ticket.ticketNumber}</strong>
        </span>
      </div>

      <div className="row g-4">
        {/* Left Column: Ticket Details & Operational Controls */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <span className="small text-muted fw-semibold d-block mb-1">{ticket.ticketNumber}</span>
                  <h1 className="h4 fw-bold mb-0 text-dark">{ticket.summary}</h1>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {!isStaffOrAdmin &&
                    !ticket.requesterResolutionPending &&
                    ticket.currentStatus !== 'Resolved' &&
                    ticket.currentStatus !== 'Closed' &&
                    ticket.currentStatus !== 'Cancelled' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success fw-semibold px-2 py-1"
                        style={{ borderColor: '#006B3C', color: '#006B3C' }}
                        onClick={() => setShowResolveModal(true)}
                      >
                        Problem Appears Resolved
                      </button>
                    )}
                  <span
                    className="badge px-2 py-1 fw-medium"
                    style={getStatusBadgeStyle(ticket.currentStatus)}
                  >
                    {ticket.currentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Requester Resolution Pending Banner */}
              {ticket.requesterResolutionPending && (
                <div
                  className="alert border-0 d-flex align-items-center gap-2 mb-4 p-3 shadow-sm rounded"
                  role="alert"
                  style={{ backgroundColor: '#FFF4E5', color: '#B25E00', borderLeft: '4px solid #F59E0B' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>ℹ</span>
                  <div>
                    <strong>Problem Indicated as Resolved:</strong> Requester has indicated that this issue appears resolved. IT Staff will verify and complete official resolution.
                  </div>
                </div>
              )}

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

              {/* Resolution Summary Section (if resolved or present) */}
              {ticket.resolutionSummary && (
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted text-uppercase mb-2">
                    Resolution Summary
                  </label>
                  <div
                    className="p-3 rounded small"
                    style={{
                      backgroundColor: '#EAF6EF',
                      border: '1px solid #BFE4D1',
                      color: '#006B3C',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ticket.resolutionSummary}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="row g-3 pt-3 border-top">
                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Category</span>
                  <strong className="small text-dark">{ticket.category?.name}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Related System</span>
                  <strong className="small text-dark">{ticket.relatedSystem?.name || 'None'}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Requester</span>
                  <strong className="small text-dark">{ticket.requester?.name}</strong>
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Requested Priority</span>
                  <span
                    className="badge fw-medium px-2 py-1"
                    style={getPriorityBadgeStyle(ticket.requestedPriority)}
                  >
                    {ticket.requestedPriority}
                  </span>
                </div>

                {/* IT Priority: Editable for Staff/Admin, Badge for Requester */}
                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">IT Priority</span>
                  {isStaffOrAdmin ? (
                    <div>
                      <select
                        aria-label="IT Priority"
                        className="form-select form-select-sm mt-1"
                        value={ticket.itPriority || 'Low'}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        disabled={updatingPriority}
                        style={{ maxWidth: '140px' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      {priorityError && <div className="text-danger small mt-1">{priorityError}</div>}
                    </div>
                  ) : ticket.itPriority ? (
                    <span
                      className="badge fw-medium px-2 py-1"
                      style={getPriorityBadgeStyle(ticket.itPriority)}
                    >
                      {ticket.itPriority}
                    </span>
                  ) : (
                    <span className="small text-muted">Unassigned</span>
                  )}
                </div>

                <div className="col-6 col-sm-4">
                  <span className="d-block small text-muted">Created Date</span>
                  <span className="small text-dark">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>

                {/* Ticket Owner (Staff/Admin Operational Control) */}
                {isStaffOrAdmin && (
                  <div className="col-12 pt-3 border-top">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div>
                        <span className="d-block small text-muted fw-semibold">Ticket Owner</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <select
                            aria-label="Ticket Owner"
                            className="form-select form-select-sm"
                            style={{ minWidth: '220px' }}
                            value={ticket.ticketOwnerId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleAssignOwner(val ? parseInt(val, 10) : null);
                            }}
                            disabled={assigningOwner}
                          >
                            <option value="">(Unassigned)</option>
                            {assignees.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.role === 'ADMINISTRATOR' ? 'Admin' : 'IT Staff'})
                              </option>
                            ))}
                          </select>

                          {/* Quick Claim Button if unassigned or not self */}
                          {currentUser && ticket.ticketOwnerId !== currentUser.id && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success px-3 fw-semibold text-nowrap"
                              style={{ borderColor: '#006B3C', color: '#006B3C' }}
                              onClick={() => handleAssignOwner(currentUser.id)}
                              disabled={assigningOwner}
                            >
                              {assigningOwner ? 'Claiming...' : 'Claim'}
                            </button>
                          )}
                        </div>
                        {ownerError && <div className="text-danger small mt-1">{ownerError}</div>}
                      </div>

                      {/* Status Transition Control */}
                      <div>
                        <span className="d-block small text-muted fw-semibold">Update Status</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <select
                            aria-label="Ticket Status"
                            className="form-select form-select-sm"
                            style={{ minWidth: '180px' }}
                            value={targetStatus}
                            onChange={(e) => {
                              setTargetStatus(e.target.value);
                              if (statusError) setStatusError(null);
                            }}
                            disabled={updatingStatus || permittedNextStatuses.length === 0}
                          >
                            <option value={ticket.currentStatus}>{ticket.currentStatus} (Current)</option>
                            {permittedNextStatuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="btn btn-sm text-white px-3 fw-semibold text-nowrap"
                            style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                            onClick={() => handleStatusSubmit()}
                            disabled={updatingStatus || !targetStatus || targetStatus === ticket.currentStatus}
                          >
                            {updatingStatus ? 'Updating...' : 'Save Status'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resolution summary prompt if target status is Resolved */}
                    {targetStatus === 'Resolved' && targetStatus !== ticket.currentStatus && (
                      <div className="mt-3 p-3 rounded bg-light border">
                        <label htmlFor="resolutionSummaryInput" className="form-label small fw-semibold text-dark mb-1">
                          Resolution Summary <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="resolutionSummaryInput"
                          className="form-control form-control-sm mb-2"
                          rows={2}
                          placeholder="Describe how the problem was resolved (visible to requester)..."
                          value={resolutionSummaryInput}
                          onChange={(e) => setResolutionSummaryInput(e.target.value)}
                          maxLength={1000}
                        />
                        <div className="form-text small text-muted" style={{ fontSize: '0.75rem' }}>
                          A resolution summary is required per BR-16 before marking ticket as Resolved.
                        </div>
                      </div>
                    )}

                    {statusError && <div className="alert alert-danger py-2 small mt-2 mb-0">{statusError}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Communication & Resources Section */}
          <div className="card shadow-sm border-0 mt-4" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Tab Navigation Header (IT Staff & Administrator) */}
            {isStaffOrAdmin && (
              <div className="card-header bg-white border-bottom p-0">
                <ul className="nav nav-tabs border-0 px-3 pt-2" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      type="button"
                      className={`nav-link border-0 fw-semibold px-3 py-2 ${
                        activeTab === 'COMMENTS' ? 'active border-bottom border-3 text-dark' : 'text-muted'
                      }`}
                      style={{
                        borderBottomColor: activeTab === 'COMMENTS' ? '#006B3C' : 'transparent',
                      }}
                      onClick={() => setActiveTab('COMMENTS')}
                    >
                      💬 Public Comments ({comments.length})
                    </button>
                  </li>

                  {/* Internal Notes Tab: ONLY rendered for IT Staff and Administrator per BR-04, BR-20, AC-04 */}
                  <li className="nav-item" role="presentation">
                    <button
                      type="button"
                      className={`nav-link border-0 fw-semibold px-3 py-2 ${
                        activeTab === 'INTERNAL_NOTES' ? 'active border-bottom border-3 text-dark' : 'text-muted'
                      }`}
                      style={{
                        borderBottomColor: activeTab === 'INTERNAL_NOTES' ? '#8F6B00' : 'transparent',
                      }}
                      onClick={() => setActiveTab('INTERNAL_NOTES')}
                    >
                      🔒 Internal Notes ({internalNotes.length})
                    </button>
                  </li>

                  {/* Attachments Tab for Tablet/Mobile or unified view */}
                  <li className="nav-item" role="presentation">
                    <button
                      type="button"
                      className={`nav-link border-0 fw-semibold px-3 py-2 ${
                        activeTab === 'ATTACHMENTS' ? 'active border-bottom border-3 text-dark' : 'text-muted'
                      }`}
                      style={{
                        borderBottomColor: activeTab === 'ATTACHMENTS' ? '#006B3C' : 'transparent',
                      }}
                      onClick={() => setActiveTab('ATTACHMENTS')}
                    >
                      📎 Attachments ({activeAttachments.length})
                    </button>
                  </li>

                  {/* Service Actions Tab: Disabled placeholder for Lab 4 per ui-spec.md Section 5.4 */}
                  <li className="nav-item" role="presentation">
                    <button
                      type="button"
                      className="nav-link border-0 text-muted px-3 py-2 disabled"
                      disabled
                      title="Actions Taken by IT Staff - Deferred to Lab 4"
                      style={{ cursor: 'not-allowed', opacity: 0.5 }}
                    >
                      🔧 Service Actions (0)
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <div className="card-body p-4">
              {/* TAB 1: Public Comments */}
              {activeTab === 'COMMENTS' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 fw-bold mb-0" style={{ color: '#006B3C' }}>
                      Public Comments ({comments.length})
                    </h2>
                    <span className="small text-muted">Visible to Requester and IT Staff</span>
                  </div>

                  <div className="d-flex flex-column gap-3 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-muted small text-center my-3">No public comments yet.</p>
                    ) : (
                      comments.map((c) => {
                        const isReq = c.author.role === 'REQUESTER';
                        const roleLabel = isReq
                          ? 'Requester'
                          : c.author.role === 'IT_STAFF'
                          ? 'IT Support'
                          : 'Administrator';
                        const initials = c.author.name
                          ? c.author.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : '?';

                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded border"
                            style={{
                              backgroundColor: isReq ? '#F8FAF9' : '#F0F7FF',
                              borderColor: isReq ? '#E2E8E5' : '#D0E3F7',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="rounded-circle d-inline-flex justify-content-center align-items-center fw-bold small text-white"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: isReq ? '#006B3C' : '#105696',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {initials}
                                </span>
                                <strong className="small text-dark">{c.author.name}</strong>
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: isReq ? '#EAF6EF' : '#E8F1FA',
                                    color: isReq ? '#006B3C' : '#105696',
                                    border: `1px solid ${isReq ? '#BFE4D1' : '#BDD8F0'}`,
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {roleLabel}
                                </span>
                              </div>
                              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="small mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {c.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Public Comment Form */}
                  <form onSubmit={handleCommentSubmit} className="pt-3 border-top">
                    <label htmlFor="commentInput" className="form-label small fw-semibold text-muted">
                      Add Public Comment
                    </label>
                    <textarea
                      id="commentInput"
                      className={`form-control form-control-sm mb-2 ${commentError ? 'is-invalid' : ''}`}
                      rows={3}
                      placeholder="Write a public comment..."
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value);
                        if (commentError) setCommentError(null);
                      }}
                      maxLength={2000}
                      disabled={commentSubmitting}
                    />
                    {commentError && <div className="invalid-feedback d-block mb-2">{commentError}</div>}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {newComment.length}/2000 characters
                      </span>
                      <button
                        type="submit"
                        className="btn btn-sm text-white fw-semibold px-3"
                        style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                        disabled={!newComment.trim() || commentSubmitting}
                      >
                        {commentSubmitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: Internal Notes (Strictly for IT Staff / Admin per BR-04, BR-20, AC-04) */}
              {activeTab === 'INTERNAL_NOTES' && isStaffOrAdmin && (
                <div>
                  {/* Distinct Amber Banner per ui-spec.md Section 1.1 & Section 5.4 */}
                  <div
                    className="alert border-0 d-flex align-items-center gap-2 mb-4 p-3 shadow-sm rounded"
                    role="alert"
                    style={{
                      backgroundColor: '#FBF4DB',
                      borderLeft: '4px solid #8F6B00',
                      color: '#5C4300',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🔒</span>
                    <div>
                      <strong>Internal IT Note - Not visible to Requester</strong>
                      <div className="small text-muted">
                        Confidential operational collaboration and diagnostic logs.
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes List with Warm/Amber Tinted Styling */}
                  <div className="d-flex flex-column gap-3 mb-4">
                    {internalNotes.length === 0 ? (
                      <p className="text-muted small text-center my-3">No internal notes recorded yet.</p>
                    ) : (
                      internalNotes.map((n) => {
                        const initials = n.author.name
                          ? n.author.name
                              .split(' ')
                              .map((word) => word[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'IT';

                        return (
                          <div
                            key={n.id}
                            className="p-3 rounded"
                            style={{
                              backgroundColor: '#FBF4DB',
                              border: '1px solid #D4C494',
                              color: '#5C4300',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="rounded-circle d-inline-flex justify-content-center align-items-center fw-bold small text-white"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: '#8F6B00',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {initials}
                                </span>
                                <strong className="small" style={{ color: '#5C4300' }}>
                                  {n.author.name}
                                </strong>
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    backgroundColor: '#F5E8BE',
                                    color: '#5C4300',
                                    border: '1px solid #D4C494',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {n.author.role === 'ADMINISTRATOR' ? 'Administrator' : 'IT Support'}
                                </span>
                              </div>
                              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="small mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#3A2A00' }}>
                              {n.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Internal Note Form */}
                  <form onSubmit={handleInternalNoteSubmit} className="pt-3 border-top">
                    <label htmlFor="internalNoteInput" className="form-label small fw-semibold text-muted">
                      Add Internal Note
                    </label>
                    <textarea
                      id="internalNoteInput"
                      className={`form-control form-control-sm mb-2 ${noteError ? 'is-invalid' : ''}`}
                      rows={3}
                      placeholder="Write confidential internal note..."
                      value={newInternalNote}
                      onChange={(e) => {
                        setNewInternalNote(e.target.value);
                        if (noteError) setNoteError(null);
                      }}
                      maxLength={2000}
                      disabled={noteSubmitting}
                    />
                    {noteError && <div className="invalid-feedback d-block mb-2">{noteError}</div>}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {newInternalNote.length}/2000 characters
                      </span>
                      <button
                        type="submit"
                        className="btn btn-sm fw-semibold px-3 text-white"
                        style={{ backgroundColor: '#8F6B00', borderColor: '#8F6B00' }}
                        disabled={!newInternalNote.trim() || noteSubmitting}
                      >
                        {noteSubmitting ? 'Saving...' : 'Post Internal Note'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: Attachments (when selected via tab) */}
              {activeTab === 'ATTACHMENTS' && isStaffOrAdmin && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 fw-bold mb-0" style={{ color: '#006B3C' }}>
                      Attachments ({activeAttachments.length}/5 active)
                    </h2>
                  </div>
                  {/* Attachments List */}
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
                        <div className="text-truncate me-2">
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
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {removedAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 rounded text-muted"
                        style={{ backgroundColor: '#F2F4F3', border: '1px dashed #D0D6D3' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-decoration-line-through small text-truncate">
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

                  {activeAttachments.length < 5 && (
                    <form onSubmit={handleUploadSubmit} className="pt-3 border-top">
                      <label htmlFor="tabAttachmentInput" className="form-label small fw-semibold text-muted">
                        Add Attachment
                      </label>
                      <input
                        type="file"
                        id="tabAttachmentInput"
                        className={`form-control form-control-sm mb-1 ${uploadError ? 'is-invalid' : ''}`}
                        onChange={handleFileSelection}
                        disabled={uploading}
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                      />
                      {uploadError && <div className="invalid-feedback d-block mb-2">{uploadError}</div>}
                      <button
                        type="submit"
                        className="btn btn-sm text-white w-100 fw-semibold mt-2"
                        style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                        disabled={!fileToUpload || uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload Attachment'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Attachments Lifecycle (Always visible on desktop side column for Requester or quick access) */}
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

                {/* Soft-Removed Attachments */}
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

      {/* Soft-Removal Dialog / Modal */}
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

      {/* Problem Appears Resolved Confirmation Modal (Requester) */}
      {showResolveModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <h3 className="modal-title h5 fw-bold" style={{ color: '#006B3C' }}>
                  Problem Appears Resolved
                </h3>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowResolveModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-dark mb-2">
                  Are you sure the reported issue is resolved?
                </p>
                <p className="text-muted small mb-0">
                  This will notify IT Staff that you consider the problem resolved. IT Staff will verify and complete the official ticket closure.
                </p>
                {resolveError && <div className="alert alert-danger py-2 small mt-3 mb-0">{resolveError}</div>}
              </div>

              <div className="modal-footer border-top py-2 px-3">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm text-white fw-semibold px-3"
                  style={{ backgroundColor: '#006B3C', borderColor: '#006B3C' }}
                  onClick={handleConfirmResolved}
                  disabled={resolving}
                >
                  {resolving ? 'Submitting...' : 'Yes, Problem Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
