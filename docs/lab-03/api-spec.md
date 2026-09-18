# Lab 3 REST API Specification

## 1. Authentication & Security Protocol

### 1.1 Authentication Mechanism

- TokTickIT uses signed, HTTP-only session cookies (or Bearer token in `Authorization` header for API clients) generated upon successful authentication.
- **Cookie Name**: `toktickit_session`
- **Cookie Attributes**: `HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` (Secure flag active in production).
- The session payload contains the authenticated user's `id`, `email`, and `role`.
- The server extracts and validates the caller's identity on every protected endpoint. Client-supplied user IDs in headers (e.g. legacy `X-Requester-Id`) are strictly ignored.

### 1.2 Mandatory Password Change Gate

- Any authenticated user with `mustChangePassword: true` is restricted to `/api/auth/change-password`, `/api/auth/me`, and `/api/auth/logout`.
- Attempting to access any other endpoint while `mustChangePassword` is active returns `HTTP 403 Forbidden` with:

```json
{
  "error": "Password change required",
  "code": "PASSWORD_CHANGE_REQUIRED"
}
```

### 1.3 Standard Error Responses & Safe Failures

Every protected endpoint distinguishes unauthenticated access, forbidden access, invalid input, missing resources, conflicts, and unexpected server errors. The backend prevents leaking whether another user's protected Ticket, Attachment, or Internal Note exists.

```json
// 400 Bad Request
{ "error": "Validation failed: Summary is required" }

// 401 Unauthorized (Generic response: used for invalid credentials or inactive accounts to prevent account enumeration)
{ "error": "Invalid email or password" }

// 403 Forbidden (Insufficient role or accessing restricted operational resources)
{ "error": "Access forbidden: Insufficient permissions" }

// 404 Not Found (Resource not found or unauthorized cross-requester resource access)
{ "error": "Resource not found" }

// 409 Conflict (Duplicate email address during user creation/update)
{ "error": "Email address is already in use" }

// 500 Internal Server Error
{ "error": "Internal Server Error" }
```

### 1.4 Local Development Seed Credentials

These credentials are provided strictly for local development and testing:

| Email                          | Role            | Status   | Must Change Pass | Initial Password | Notes / Usage                          |
| :----------------------------- | :-------------- | :------- | :--------------: | :--------------- | :------------------------------------- |
| `admin@toktick.it`             | `ADMINISTRATOR` | Active   |        No        | `Admin1234!`     | Primary Administrator                  |
| `admin2@toktick.it`            | `ADMINISTRATOR` | Active   |        No        | `Admin1234!`     | Secondary Admin (sole-admin test)      |
| `sarah.it@toktick.it`          | `IT_STAFF`      | Active   |        No        | `Password123!`   | Senior IT Staff / Queue Triage         |
| `michael.it@toktick.it`        | `IT_STAFF`      | Active   |        No        | `Password123!`   | Hardware Specialist                    |
| `david.it@toktick.it`          | `IT_STAFF`      | Active   |        No        | `Password123!`   | Network Specialist                     |
| `kevin.it@toktick.it`          | `IT_STAFF`      | Inactive |        No        | `Password123!`   | Inactive IT Staff (auth failure test)  |
| `jennifer.anderson@toktick.it` | `REQUESTER`     | Active   |        No        | `Password123!`   | Active Requester                       |
| `alex.thompson@toktick.it`     | `REQUESTER`     | Active   |     **Yes**      | `Password123!`   | First-login password change test       |
| `lisa.martinez@toktick.it`     | `REQUESTER`     | Active   |        No        | `Password123!`   | Active Requester                       |
| `amanda.clark@toktick.it`      | `REQUESTER`     | Active   |        No        | `Password123!`   | Active Requester                       |
| `robert.wilson@toktick.it`     | `REQUESTER`     | Inactive |        No        | `Password123!`   | Inactive Requester (auth failure test) |

---

## 2. Authentication Endpoints

### 2.1 POST /api/auth/login

Authenticate user credentials and establish session.

- **Access**: Public
- **Request Body**:

```json
{
  "email": "jennifer.anderson@toktick.it",
  "password": "Password123!"
}
```

- **Validation Rules**:
  - `email`: Required, valid email format.
  - `password`: Required, string.
- **Response** (`200 OK`):
  - Sets `Set-Cookie: toktickit_session=...; HttpOnly; SameSite=Lax; Path=/`

```json
{
  "user": {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@toktick.it",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```

- **Errors**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email, incorrect password, or account inactive (`isActive: false`).

---

### 2.2 POST /api/auth/logout

Invalidate the current session and clear cookie.

- **Access**: Authenticated
- **Request Body**: None
- **Response** (`200 OK`):
  - Sets `Set-Cookie: toktickit_session=; Max-Age=0; Path=/`

```json
{
  "message": "Logged out successfully"
}
```

---

### 2.3 GET /api/auth/me

Retrieve profile and role of the currently authenticated user.

- **Access**: Authenticated
- **Response** (`200 OK`):

```json
{
  "user": {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@toktick.it",
    "role": "REQUESTER",
    "mustChangePassword": false
  }
}
```

- **Errors**:
  - `401 Unauthorized`: No active session or session expired.

---

### 2.4 POST /api/auth/change-password

Change password for authenticated user with initial password. Clears `mustChangePassword` upon success.

- **Access**: Authenticated
- **Request Body**:

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```

- **Validation Rules**:
  - `currentPassword`: Required, matches current stored password hash.
  - `newPassword`: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
  - `confirmPassword`: Must match `newPassword`.
  - `newPassword` cannot be identical to `currentPassword`.
- **Response** (`200 OK`):

```json
{
  "message": "Password changed successfully",
  "mustChangePassword": false
}
```

- **Errors**:
  - `400 Bad Request`: Validation failure (complexity not met or passwords do not match).
  - `401 Unauthorized`: Current password incorrect.

---

## 3. Reference Data Endpoints

### 3.1 GET /api/categories

Retrieve active ticket categories.

- **Access**: Authenticated (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Response** (`200 OK`):

```json
[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" },
  { "id": 3, "name": "Network" },
  { "id": 4, "name": "Account and Access" }
]
```

### 3.2 GET /api/related-systems

Retrieve active related systems.

- **Access**: Authenticated (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Response** (`200 OK`):

```json
[
  { "id": 1, "name": "Corporate Laptop" },
  { "id": 2, "name": "VPN" },
  { "id": 3, "name": "Email Client" }
]
```

---

## 4. Requester Ticket Endpoints (Lab 2 Continuation)

### 4.1 POST /api/tickets

Create a new ticket owned by the authenticated user.

- **Access**: `REQUESTER` or `IT_STAFF`
- **Request Body**:

```json
{
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains quickly",
  "description": "My battery drains completely within 45 minutes of boot.",
  "requestedPriority": "Medium"
}
```

- **Validation Rules**:
  - `categoryId`: Required integer referencing active Category.
  - `relatedSystemId`: Optional integer referencing active RelatedSystem.
  - `summary`: Required string, 1–100 characters.
  - `description`: Required string, 1–1000 characters.
  - `requestedPriority`: Required enum (`Low`, `Medium`, `High`).
- **Response** (`201 Created`):

```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requesterId": 1,
  "ticketOwnerId": null,
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains quickly",
  "description": "My battery drains completely within 45 minutes of boot.",
  "requestedPriority": "Medium",
  "itPriority": "Medium",
  "currentStatus": "New",
  "resolutionSummary": null,
  "requesterResolutionPending": false,
  "createdAt": "2026-09-11T10:00:00.000Z",
  "updatedAt": "2026-09-11T10:00:00.000Z"
}
```

---

### 4.2 GET /api/tickets

List tickets owned by the authenticated Requester.

- **Access**: `REQUESTER`
- **Query Parameters**:
  - `search` (string): Partial match on `ticketNumber` or `summary`.
  - `category` (number): Filter by category ID.
  - `priority` (string): Filter by `requestedPriority`.
  - `status` (string): Filter by `currentStatus`.
  - `sort` (string): `ticketNumber`, `createdAt`, `updatedAt` (Default: `updatedAt`).
  - `order` (string): `asc` or `desc` (Default: `desc`).
  - `page` (number): 1-indexed (Default: `1`).
  - `limit` (number): Page size (Default: `8`, max: `50`).
- **Response** (`200 OK`):

```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "Medium",
      "itPriority": "Medium",
      "currentStatus": "New",
      "requesterResolutionPending": false,
      "createdAt": "2026-09-11T10:00:00.000Z",
      "updatedAt": "2026-09-11T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 8,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

### 4.3 GET /api/tickets/:id

Retrieve full details of a specific ticket.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, or `ADMINISTRATOR`
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "summary": "Laptop battery drains quickly",
  "description": "My battery drains completely within 45 minutes of boot.",
  "category": { "id": 1, "name": "Hardware" },
  "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
  "requestedPriority": "Medium",
  "itPriority": "Medium",
  "currentStatus": "New",
  "resolutionSummary": null,
  "requesterResolutionPending": false,
  "requester": {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@toktick.it"
  },
  "ticketOwner": null,
  "attachments": [
    {
      "id": 501,
      "originalFilename": "battery-report.png",
      "size": 1048576,
      "mimeType": "image/png",
      "removedAt": null,
      "removalReason": null
    }
  ],
  "createdAt": "2026-09-11T10:00:00.000Z",
  "updatedAt": "2026-09-11T10:00:00.000Z"
}
```

- **Errors**:
  - `403/404`: Caller is a Requester who does not own this ticket.

---

### 4.4 PATCH /api/tickets/:id/resolve-indication

Requester signals that their issue appears resolved.

- **Access**: Ticket Owner (`REQUESTER`)
- **Request Body**: None
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "requesterResolutionPending": true,
  "message": "Problem indicated as resolved"
}
```

---

## 5. Attachment Endpoints (Lab 2 Continuation)

### 5.1 POST /api/tickets/:id/attachments

Upload a new attachment to a specific ticket.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, or `ADMINISTRATOR`
- **Request**: `multipart/form-data` with field `attachment`.
- **Validation Rules**:
  - Max file size: 5MB.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Max 5 active attachments per ticket.
- **Response** (`201 Created`):

```json
{
  "id": 501,
  "ticketId": 101,
  "filename": "uuid-battery-report.png",
  "originalFilename": "battery-report.png",
  "size": 1048576,
  "mimeType": "image/png",
  "removalReason": null,
  "removedAt": null,
  "createdAt": "2026-09-11T10:05:00.000Z"
}
```

- **Errors**:
  - `400 Bad Request`: File size exceeds 5MB, unsupported type, or ticket already has 5 active attachments.
  - `403 Forbidden` / `404 Not Found`: Unauthorized ticket access.

---

### 5.2 GET /api/attachments/:id

Retrieve attachment metadata.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, or `ADMINISTRATOR`
- **Response** (`200 OK`):

```json
{
  "id": 501,
  "ticketId": 101,
  "originalFilename": "battery-report.png",
  "size": 1048576,
  "mimeType": "image/png",
  "removedAt": null,
  "removalReason": null
}
```

---

### 5.3 GET /api/attachments/:id/download

Download active attachment binary file.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, or `ADMINISTRATOR`
- **Response** (`200 OK`): Binary file stream with corresponding `Content-Type`.
- **Errors**:
  - `400 Bad Request`: Attachment has been soft-removed.
  - `403/404`: Unauthorized access or attachment not found.

---

### 5.4 PATCH /api/attachments/:id/remove

Soft-remove an attachment with mandatory reason.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, or `ADMINISTRATOR`
- **Request Body**:

```json
{
  "reason": "Uploaded confidential or incorrect document"
}
```

- **Validation Rules**:
  - `reason`: Required non-empty string (1–255 characters).
- **Response** (`200 OK`):

```json
{
  "id": 501,
  "removedAt": "2026-09-11T10:15:00.000Z",
  "removalReason": "Uploaded confidential or incorrect document"
}
```

---

## 6. IT Staff Ticket Queue & Operations

### 6.1 GET /api/staff/tickets

Retrieve the shared IT Staff Ticket Queue with multi-criteria filtering, search, sorting, and pagination.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Query Parameters**:
  - `search` (string): Matches `ticketNumber`, `summary`, or Requester name.
  - `category` (number): Filter by category ID.
  - `priority` (string): Filter by `itPriority` (`Low`, `Medium`, `High`, `Critical`).
  - `status` (string): Filter by `currentStatus`.
  - `assigned` (string): `all`, `unassigned`, or `me` (Default: `all`).
  - `sort` (string): `ticketNumber`, `createdAt`, `updatedAt`, `itPriority`, `currentStatus` (Default: `createdAt`).
  - `order` (string): `asc` or `desc` (Default: `desc`).
  - `page` (number): Default `1`.
  - `limit` (number): Default `10` (permitted: `10`, `25`, `50`).
- **Response** (`200 OK`):

```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "Medium",
      "itPriority": "Medium",
      "currentStatus": "New",
      "requesterResolutionPending": false,
      "requester": { "id": 1, "name": "Jennifer Anderson" },
      "ticketOwner": null,
      "createdAt": "2026-09-11T10:00:00.000Z",
      "updatedAt": "2026-09-11T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

### 6.2 PATCH /api/staff/tickets/:id/assign

Claim or reassign ticket ownership.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:

```json
{
  "ticketOwnerId": 2
}
```

- **Validation Rules**:
  - `ticketOwnerId`: Must belong to an active user with role `IT_STAFF` or `ADMINISTRATOR` (or `null` to unassign).
- **Business Behavior**:
  - If ticket status is `New` and assigned to a user, status automatically transitions to `Open`.
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "ticketOwnerId": 2,
  "currentStatus": "Open",
  "ticketOwner": {
    "id": 2,
    "name": "Sarah Johnson",
    "email": "sarah.it@toktick.it"
  }
}
```

---

### 6.3 PATCH /api/staff/tickets/:id/priority

Update the IT Priority of a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:

```json
{
  "itPriority": "High"
}
```

- **Validation Rules**:
  - `itPriority`: Required enum (`Low`, `Medium`, `High`, `Critical`).
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "itPriority": "High",
  "updatedAt": "2026-09-11T10:15:00.000Z"
}
```

---

### 6.4 PATCH /api/staff/tickets/:id/status

Advance ticket status according to the state transition matrix.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:

```json
{
  "status": "Resolved",
  "resolutionSummary": "Replaced depleted 4-cell lithium battery with new unit; battery health tested at 100%."
}
```

- **Validation Rules**:
  - `status`: Must be a permitted target status from current status per BR-15.
  - `resolutionSummary`: Required when transitioning to `Resolved` (1–1,000 characters).
  - Invalid transitions return `400 Bad Request`.
- **Response** (`200 OK`):

```json
{
  "id": 101,
  "currentStatus": "Resolved",
  "resolutionSummary": "Replaced depleted 4-cell lithium battery with new unit; battery health tested at 100%.",
  "updatedAt": "2026-09-11T10:20:00.000Z"
}
```

---

## 7. Public Comments & Internal Notes

### 7.1 GET /api/tickets/:id/comments

Retrieve chronological Public Comments for a ticket.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, `ADMINISTRATOR`
- **Response** (`200 OK`):

```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "Thank you for the report. Please run the battery diagnostic tool.",
    "author": {
      "id": 2,
      "name": "Sarah Johnson",
      "role": "IT_STAFF"
    },
    "createdAt": "2026-09-11T10:05:00.000Z"
  }
]
```

---

### 7.2 POST /api/tickets/:id/comments

Post a new Public Comment on a ticket.

- **Access**: Ticket Owner (`REQUESTER`), `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:

```json
{
  "content": "Diagnostic report attached. Battery health reports 42% capacity."
}
```

- **Validation Rules**:
  - `content`: Required string, 1–2000 characters after trimming. Whitespace-only is rejected.
- **Response** (`201 Created`):

```json
{
  "id": 2,
  "ticketId": 101,
  "content": "Diagnostic report attached. Battery health reports 42% capacity.",
  "author": {
    "id": 1,
    "name": "Jennifer Anderson",
    "role": "REQUESTER"
  },
  "createdAt": "2026-09-11T10:10:00.000Z"
}
```

---

### 7.3 GET /api/tickets/:id/internal-notes

Retrieve confidential Internal Notes for a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` strictly.
- **Requester Call**: Returns `403 Forbidden` (`{ "error": "Access forbidden: Insufficient permissions" }`).
- **Response** (`200 OK`):

```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "Battery model has a known recall bulletin. Prepare replacement unit.",
    "author": {
      "id": 2,
      "name": "Sarah Johnson",
      "role": "IT_STAFF"
    },
    "createdAt": "2026-09-11T10:06:00.000Z"
  }
]
```

---

### 7.4 POST /api/tickets/:id/internal-notes

Append a confidential Internal Note on a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` strictly.
- **Requester Call**: Returns `403 Forbidden`.
- **Request Body**:

```json
{
  "content": "Spoke with hardware vendor; part shipment expected tomorrow."
}
```

- **Validation Rules**:
  - `content`: Required string, 1–2000 characters after trimming.
- **Response** (`201 Created`):

```json
{
  "id": 2,
  "ticketId": 101,
  "content": "Spoke with hardware vendor; part shipment expected tomorrow.",
  "author": {
    "id": 2,
    "name": "Sarah Johnson",
    "role": "IT_STAFF"
  },
  "createdAt": "2026-09-11T10:12:00.000Z"
}
```

---

## 8. Administrator User Management Endpoints

### 8.1 GET /api/admin/users

List all users with search and optional role filter.

- **Access**: `ADMINISTRATOR`
- **Query Parameters**:
  - `search` (string): Partial match on `name` or `email`.
  - `role` (string): Filter by `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.
- **Response** (`200 OK`):

```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@toktick.it",
    "role": "REQUESTER",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Sarah Johnson",
    "email": "sarah.it@toktick.it",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T08:00:00.000Z"
  }
]
```

---

### 8.2 POST /api/admin/users

Provision a new user account with an initial password.

- **Access**: `ADMINISTRATOR`
- **Request Body**:

```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktick.it",
  "role": "REQUESTER",
  "isActive": true,
  "initialPassword": "TempPassword123!"
}
```

- **Validation Rules**:
  - `name`: Required string, 1–100 characters.
  - `email`: Required valid email, unique across all users.
  - `role`: Required enum (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
  - `isActive`: Boolean (default: `true`).
  - `initialPassword`: Required string satisfying password complexity rules.
- **Behavior**:
  - `mustChangePassword` is automatically set to `true`.
  - Password is saved as a bcrypt hash.
- **Response** (`201 Created`):

```json
{
  "id": 10,
  "name": "Alex Thompson",
  "email": "alex.thompson@toktick.it",
  "role": "REQUESTER",
  "isActive": true,
  "mustChangePassword": true,
  "createdAt": "2026-09-11T11:00:00.000Z"
}
```

- **Errors**:
  - `409 Conflict`: Email address is already registered.

---

### 8.3 PATCH /api/admin/users/:id

Update an existing user's basic profile, role, or activation state.

- **Access**: `ADMINISTRATOR`
- **Request Body**:

```json
{
  "name": "Alex Thompson-Smith",
  "email": "alex.t@toktick.it",
  "role": "IT_STAFF",
  "isActive": true
}
```

- **Safety Guards**:
  - **Self-Deactivation Guard**: If `id == req.user.id` and `isActive == false`, returns `400 Bad Request` (`"Cannot deactivate your own account"`).
  - **Sole Administrator Guard**: If `targetUser.role == 'ADMINISTRATOR'` and (`isActive == false` or `role != 'ADMINISTRATOR'`), the server verifies at least one other active Administrator exists. If not, returns `400 Bad Request` (`"Cannot deactivate or demote the last active Administrator"`).
- **Response** (`200 OK`):

```json
{
  "id": 10,
  "name": "Alex Thompson-Smith",
  "email": "alex.t@toktick.it",
  "role": "IT_STAFF",
  "isActive": true,
  "updatedAt": "2026-09-11T11:15:00.000Z"
}
```

---

### 8.4 POST /api/admin/users/:id/reset-password

Set a new initial password for a user.

- **Access**: `ADMINISTRATOR`
- **Request Body**:

```json
{
  "initialPassword": "ResetPassword456!"
}
```

- **Behavior**:
  - Sets `mustChangePassword = true` for the target user.
  - Updates stored password hash.
- **Response** (`200 OK`):

```json
{
  "message": "Initial password set successfully",
  "userId": 10,
  "mustChangePassword": true
}
```
