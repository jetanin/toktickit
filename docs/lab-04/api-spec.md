# Lab 4 REST API Specification

TokTickIT: Actions Taken, Dashboards, and Workflow Hardening

## 1. Authentication & Security Protocol

### 1.1 Session Protocol & RBAC

- **Authentication**: TokTickIT uses signed, HTTP-only session cookies (`toktickit_session`) or Bearer tokens in the `Authorization` header.
- **Payload**: Session token decrypts to `{ id: number, email: string, role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR' }`.
- **Role Enforcement**:
  - `Requester`: Restricted strictly to tickets they own (`ticket.requesterId == req.user.id`). Blocked from internal notes, staff queues, user management, and creating Actions Taken.
  - `IT Staff`: Full access to shared ticket queue, operational ticket fields, public comments, internal notes, Actions Taken creation/editing, and staff dashboards.
  - `Administrator`: Super-set permissions including user management and system administration.

### 1.2 Optimistic Concurrency Control (OCC) Protocol

- All ticket mutation endpoints (`PATCH /api/staff/tickets/:id/*`) accept a `version: number` attribute in the request body (or optional header `If-Match` / `updatedAt: string` fallback).
- When `version` is supplied:
  - If `ticket.version !== req.body.version`, the mutation is aborted and the server returns `HTTP 409 Conflict`.
  - When the mutation succeeds, `ticket.version` is incremented by `1`.
- If `version` is omitted, the server checks whether `updatedAt` matches.
- Safe Error Body for Concurrency Conflicts:

```json
{
  "error": "Conflict: Ticket has been modified by another user. Please refresh and review latest changes.",
  "code": "CONCURRENCY_CONFLICT",
  "currentVersion": 4,
  "updatedAt": "2026-09-26T14:35:12.123Z"
}
```

### 1.3 Standard Error Responses

```json
// 400 Bad Request
{ "error": "Validation failed: Follow-up note is required when follow-up is requested." }

// 401 Unauthorized (Generic response: invalid credentials or inactive account)
{ "error": "Invalid email or password" }

// 403 Forbidden (Insufficient role or cross-requester resource access)
{ "error": "Access forbidden: Insufficient permissions" }

// 404 Not Found (Resource does not exist or unauthorized access)
{ "error": "Resource not found" }

// 409 Conflict (Concurrency conflict or duplicate email)
{ "error": "Conflict: Ticket has been modified by another user. Please refresh and review latest changes." }

// 500 Internal Server Error
{ "error": "Internal Server Error" }
```

### 1.4 Wire Format Convention (Enum Serialization)

All status and priority enums follow a single consistent convention across the API:

- **Canonical Wire Format (Request & Response)**: **Title Case** with spaces.
  - Ticket Status values: `"New"`, `"Open"`, `"In Progress"`, `"Waiting for Requester"`, `"Resolved"`, `"Closed"`, `"Reopened"`, `"Cancelled"`.
  - Priority values: `"Low"`, `"Medium"`, `"High"`, `"Critical"`.
  - Action Status values: `"Pending"`, `"In Progress"`, `"Completed"`, `"Cancelled"`.
- **Database Storage**: Prisma/PostgreSQL enums use SCREAMING_SNAKE_CASE (`RESOLVED`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `HIGH`, etc.). This is an internal detail — clients never see or send these raw values.
- **Input Tolerance**: The server normalizes incoming status/priority strings (via `parseStatus` / `parsePriority`) so `"Resolved"`, `"resolved"`, and `"RESOLVED"` are all accepted. However, **clients should always send the canonical Title Case form** shown above.
- **Output Guarantee**: All API responses serialize statuses and priorities in Title Case, never raw DB enum values.

---

## 2. Actions Taken Endpoints

### 2.1 GET /api/tickets/:id/actions-taken

Retrieve all Actions Taken lines for a specific ticket in chronological order.

- **Access**:
  - `Requester`: Permitted only if caller is the ticket owner (`ticket.requesterId == req.user.id`). Cross-requester access returns `404 Not Found`.
  - `IT Staff` & `Administrator`: Permitted on any existing ticket.
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Response** (`200 OK`):

```json
{
  "ticketId": 101,
  "ticketNumber": "TKT-2026-000101",
  "data": [
    {
      "id": 1,
      "ticketId": 101,
      "actionDateTime": "2026-09-18T14:30:00.000Z",
      "description": "Replaced primary DDR5 memory module with 16GB certified stock.",
      "result": "MemTest86 completed 4 passes with 0 errors. Machine booted cleanly.",
      "status": "COMPLETED",
      "performedBy": {
        "id": 2,
        "name": "Sarah Jenkins",
        "email": "sarah.it@toktick.it",
        "role": "IT_STAFF"
      },
      "assignee": {
        "id": 2,
        "name": "Sarah Jenkins",
        "email": "sarah.it@toktick.it",
        "role": "IT_STAFF"
      },
      "isFollowUpRequired": false,
      "followUpNote": null,
      "attachmentNotes": "See test log attached.",
      "createdAt": "2026-09-18T14:35:00.000Z",
      "updatedAt": "2026-09-18T14:35:00.000Z"
    }
  ]
}
```

---

### 2.2 POST /api/staff/tickets/:id/actions-taken

Create a new Action Taken line under the specified ticket.

- **Access**: `IT Staff`, `Administrator`. (Requesters receive `403 Forbidden`).
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Request Body**:

```json
{
  "actionDateTime": "2026-09-18T14:30:00.000Z",
  "description": "Replaced primary DDR5 memory module with 16GB certified stock.",
  "result": "MemTest86 completed 4 passes with 0 errors. Machine booted cleanly.",
  "assigneeId": 2,
  "status": "COMPLETED",
  "isFollowUpRequired": true,
  "followUpNote": "Monitor crash dump logs after user runs heavy compile workloads.",
  "attachmentNotes": "memtest_pass.png uploaded to Attachments."
}
```

- **Validation Rules**:
  - `actionDateTime`: Optional ISO 8601 string, defaults to server `NOW()`.
  - `description`: Required string, 1–1,000 characters after trimming.
  - `result`: Required string, 1–1,000 characters after trimming.
  - `assigneeId`: Optional integer. If provided, must reference an active user with role `IT_STAFF` or `ADMINISTRATOR`. Defaults to authenticated caller.
  - `status`: Optional enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`). Defaults to `COMPLETED`.
  - `isFollowUpRequired`: Optional boolean, defaults to `false`.
  - `followUpNote`: Conditional. If `isFollowUpRequired = true`, must be non-empty string between 1 and 1,000 characters. If `false`, ignored or stored as `null`.
  - `attachmentNotes`: Optional string, max 500 characters.
- **Response** (`201 Created`):

```json
{
  "id": 1,
  "ticketId": 101,
  "actionDateTime": "2026-09-18T14:30:00.000Z",
  "description": "Replaced primary DDR5 memory module with 16GB certified stock.",
  "result": "MemTest86 completed 4 passes with 0 errors. Machine booted cleanly.",
  "status": "COMPLETED",
  "performedById": 2,
  "performedBy": {
    "id": 2,
    "name": "Sarah Jenkins",
    "email": "sarah.it@toktick.it"
  },
  "assigneeId": 2,
  "assignee": {
    "id": 2,
    "name": "Sarah Jenkins",
    "email": "sarah.it@toktick.it"
  },
  "isFollowUpRequired": true,
  "followUpNote": "Monitor crash dump logs after user runs heavy compile workloads.",
  "attachmentNotes": "memtest_pass.png uploaded to Attachments.",
  "createdAt": "2026-09-18T14:35:00.000Z",
  "updatedAt": "2026-09-18T14:35:00.000Z"
}
```

---

### 2.3 GET /api/staff/tickets/:id/actions-taken/:actionId

Retrieve a single Action Taken record.

- **Access**: `IT Staff`, `Administrator`.
- **Response** (`200 OK`): Single `ActionTaken` JSON object.

---

### 2.4 PATCH /api/staff/tickets/:id/actions-taken/:actionId

Update an existing Action Taken record.

- **Access**: `IT Staff`, `Administrator`.
- **Request Body**: Partial update object:

```json
{
  "description": "Updated technical description",
  "result": "Updated diagnostic result",
  "assigneeId": 3,
  "status": "COMPLETED",
  "isFollowUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "Updated notes"
}
```

- **Response** (`200 OK`): Updated `ActionTaken` object.

---

## 3. Dashboard Endpoints

### 3.1 GET /api/requester/dashboard

Retrieve personalized operational metrics and top 5 recent tickets for the authenticated Requester.

- **Access**: `Requester`. (IT Staff and Admin calling this endpoint receive `403 Forbidden`).
- **Response** (`200 OK`):

```json
{
  "metrics": {
    "openTicketsCount": 3,
    "waitingForRequesterCount": 1,
    "recentlyResolvedCount": 5,
    "closedTicketsCount": 12
  },
  "recentTickets": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "currentStatus": "Open",
      "requestedPriority": "Medium",
      "categoryName": "Hardware",
      "updatedAt": "2026-09-18T16:00:00.000Z"
    }
  ]
}
```

---

### 3.2 GET /api/staff/dashboard

Retrieve queue-wide operational triage metrics, status/priority distributions, and urgent tickets.

- **Access**: `IT Staff`, `Administrator`.
- **Response** (`200 OK`):

```json
{
  "metrics": {
    "unassignedCount": 14,
    "myAssignedCount": 16,
    "totalActiveQueueCount": 67,
    "statusBreakdown": {
      "New": 14,
      "Open": 23,
      "In Progress": 18,
      "Waiting for Requester": 7,
      "Reopened": 5
    },
    "priorityBreakdown": {
      "Critical": 3,
      "High": 8,
      "Medium": 24,
      "Low": 12
    }
  },
  "urgentTickets": [
    {
      "id": 412,
      "ticketNumber": "TKT-2026-000412",
      "summary": "Database connectivity loss in Building A",
      "itPriority": "Critical",
      "currentStatus": "New",
      "ticketOwner": null,
      "requesterName": "Jennifer Anderson",
      "createdAt": "2026-09-18T15:20:00.000Z"
    }
  ],
  "recentUpdatedTickets": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "itPriority": "High",
      "currentStatus": "In Progress",
      "ticketOwner": {
        "id": 2,
        "name": "Sarah Jenkins"
      },
      "updatedAt": "2026-09-18T16:45:00.000Z"
    }
  ]
}
```

---

### 3.3 GET /api/admin/dashboard

Retrieve combined operational triage metrics and enterprise user governance counts.

- **Access**: `Administrator`.
- **Response** (`200 OK`):

```json
{
  "operational": {
    "unassignedCount": 14,
    "myAssignedCount": 16,
    "totalActiveQueueCount": 67,
    "statusBreakdown": {
      "New": 14,
      "Open": 23,
      "In Progress": 18,
      "Waiting for Requester": 7,
      "Reopened": 5
    },
    "priorityBreakdown": { "Critical": 3, "High": 8, "Medium": 24, "Low": 12 }
  },
  "userGovernance": {
    "activeUsersCount": 48,
    "activeRequestersCount": 38,
    "activeStaffCount": 8,
    "activeAdminsCount": 2
  }
}
```

---

## 4. Enhanced Ticket Operations & Concurrency Endpoints

### 4.1 PATCH /api/staff/tickets/:id/status

Advance ticket status conforming to BR-09 status transition matrix, enforcing the Resolution Gate and Optimistic Concurrency Control.

- **Access**: `IT Staff`, `Administrator`.
- **Request Body**:

```json
{
  "status": "Resolved",
  "resolutionSummary": "Replaced degraded memory module and verified system stability under test load.",
  "version": 3
}
```

- **Validation & Business Logic**:
  - `status`: Required. Must be a valid next status from current status per BR-09.
  - Concurrency Check: If `body.version` is supplied and does not match database `version`, returns `409 Conflict`.
  - **Resolution Gate**: If `status === "RESOLVED"`:
    - `resolutionSummary`: Required string, 1–1,000 characters.
    - **Action Taken Check**: Must have count of `ActionTaken` for this ticket >= 1. Otherwise returns `HTTP 400 Bad Request` with:
      `{ "error": "Cannot resolve ticket: At least one Action Taken and a non-empty resolution summary are required." }`
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "currentStatus": "Resolved",
  "resolutionSummary": "Replaced degraded memory module and verified system stability under test load.",
  "requesterResolutionPending": false,
  "version": 4,
  "updatedAt": "2026-09-18T16:50:00.000Z"
}
```

---

### 4.2 PATCH /api/staff/tickets/:id/owner

Claim or reassign ticket owner with OCC protection.

- **Access**: `IT Staff`, `Administrator`.
- **Request Body**:

```json
{
  "ticketOwnerId": 2,
  "version": 3
}
```

- **Validation & Business Logic**:
  - `ticketOwnerId`: Required integer referencing an active `IT_STAFF` or `ADMINISTRATOR` user.
  - Concurrency Check: If `body.version` is supplied and does not match database `version`, returns `409 Conflict`.
  - **Claiming Side-Effect (BR-09)**: If the target ticket is currently in `New` status, assigning an owner automatically transitions its status to `Open` (`currentStatus = 'Open'`). If the ticket is in any other status, `currentStatus` is unchanged.
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "ticketOwnerId": 2,
  "currentStatus": "Open",
  "version": 4,
  "updatedAt": "2026-09-18T16:50:00.000Z"
}
```

---

### 4.3 PATCH /api/staff/tickets/:id/priority

Update ticket IT Priority with OCC protection.

- **Access**: `IT Staff`, `Administrator`.
- **Request Body**:

```json
{
  "itPriority": "High",
  "version": 3
}
```

- **Validation & Business Logic**:
  - `itPriority`: Required enum string (`Low`, `Medium`, `High`, `Critical` or uppercase).
  - Concurrency Check: If `body.version` is supplied and does not match database `version`, returns `409 Conflict`.
- **Response** (`200 OK`): Updated ticket object with incremented `version`. Returns `409 Conflict` if version mismatch.

---

### 4.4 POST /api/tickets/:id/problem-resolved

Requester advisory signal indicating that their issue appears resolved (BR-11, AC-08).

- **Access**: `Requester` (Ticket owner only. Cross-requester access returns `404 Not Found`).
- **Path Parameters**:
  - `id` (integer, required): Target Ticket ID.
- **Request Body**: Optional JSON payload:

```json
{
  "comment": "Verified my issue is resolved after the RAM replacement."
}
```

- **Validation & Business Logic**:
  - Sets `ticket.requesterResolutionPending = true`.
  - Appends an automated Public Comment authored by the system: `"Requester indicated the problem appears resolved."` (plus user comment if provided).
  - **Status Immutability**: Does **NOT** alter `currentStatus` (remains in `Waiting for Requester`, `In Progress`, etc.). Formal resolution remains strictly reserved for IT Staff via Section 4.1.
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "currentStatus": "Waiting for Requester",
  "requesterResolutionPending": true,
  "message": "Problem indicated as resolved. Awaiting IT Staff formal resolution."
}
```

---

## 5. Regression Endpoints Preservation (Labs 1–3)

All existing endpoints from earlier labs remain active. Endpoints listed below are **unchanged** unless noted:

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`.
- **Requester Ticketing**: `POST /api/tickets`, `GET /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets/:id/comments`.
- **Attachments**: `POST /api/tickets/:id/attachments`, `GET /api/tickets/:id/attachments`, `GET /api/attachments/:id/download`, `DELETE /api/attachments/:id`.
- **IT Staff Queue & Detail**: `GET /api/staff/tickets`, `GET /api/staff/tickets/:id`, `POST /api/staff/tickets/:id/internal-notes`, `GET /api/staff/tickets/:id/internal-notes`.
- **Administrator Users**: `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`, `POST /api/admin/users/:id/reset-password`.
- **Reference & Diagnostics**: `GET /api/categories`, `GET /api/related-systems`, `GET /api/health`.

**Enhanced in Lab 4** (existing endpoint, expanded business logic — see Section 4.4):

- `POST /api/tickets/:id/problem-resolved`: Now sets `requesterResolutionPending = true` and appends an automated Public Comment per BR-11/AC-08. Status remains unchanged (advisory only).
