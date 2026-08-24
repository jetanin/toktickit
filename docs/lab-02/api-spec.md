# Lab 2 API Specification

## Common Error Response

All endpoints may return the following unexpected error:

- `500 Internal Server Error`: Unexpected server error.
```json
{ "error": "Internal Server Error" }
```

---

## 1. Reference Data Endpoints

### 1.1 GET /api/dev-requesters
- **Description**: Retrieve a list of active Development Requesters for the selector.
- **Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.a@example.com",
    "isActive": true
  }
]
```
- **Error Responses**:
  - `500 Internal Server Error`: Unexpected server error.

### 1.2 GET /api/categories
- **Description**: Retrieve active Categories for ticket creation.
- **Response** (200 OK):
```json
[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" }
]
```
- **Error Responses**:
  - `500 Internal Server Error`: Unexpected server error.

### 1.3 GET /api/related-systems
- **Description**: Retrieve active Related Systems.
- **Response** (200 OK):
```json
[
  { "id": 1, "name": "Corporate Laptop" },
  { "id": 2, "name": "VPN" }
]
```
- **Error Responses**:
  - `500 Internal Server Error`: Unexpected server error.

## 2. Ticket Endpoints

### 2.1 POST /api/tickets
- **Description**: Create a new Ticket for the selected requester.
- **Headers**: `X-Requester-Id: <id>`
- **Request Body**:
```json
{
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual...",
  "requestedPriority": "Medium"
}
```
- **Responses**:
  - `201 Created`: Ticket successfully created. Returns the created ticket object including the generated `ticketNumber` and `id`.
  - `400 Bad Request`: Validation failure (e.g., summary exceeds 100 chars, description exceeds 1000 chars, missing required fields).
  - `401/403 Unauthorized`: Requester ID missing or inactive.
  - `500 Internal Server Error`: Unexpected server error.

### 2.2 GET /api/tickets
- **Description**: Retrieve a paginated, searchable, filterable, and sortable list of tickets owned by the selected Requester.
- **Headers**: `X-Requester-Id: <id>`
- **Query Parameters**:
  - `search` (string): Matches Ticket Number, Summary, or Ticket Owner.
  - `category` (number): Filter by category ID.
  - `priority` (string): Filter by requested priority.
  - `status` (string): Filter by current status.
  - `sort` (string): Field to sort by (e.g., `ticketNumber`, `createdAt`, `updatedAt`). Default: `updatedAt`.
  - `order` (string): `asc` or `desc`. Default: `desc`.
  - `page` (number): Page number (1-indexed). Default: `1`.
  - `limit` (number): Items per page. Default: `8`.
- **Invalid Parameter Behavior**:
  - Unknown query parameters are silently ignored.
  - `page` values ≤ 0, non-numeric, or exceeding total pages → `400 Bad Request` with `{ "error": "Invalid page parameter" }`.
  - `sort` with an unsupported field name → `400 Bad Request` with `{ "error": "Invalid sort field" }`.
  - `order` with a value other than `asc` or `desc` → `400 Bad Request` with `{ "error": "Invalid order parameter" }`.
  - `limit` values ≤ 0 or non-numeric → `400 Bad Request` with `{ "error": "Invalid limit parameter" }`.
- **Secondary Sort**: When the primary `sort` field contains duplicate values, `id DESC` is used as a secondary sort to guarantee deterministic ordering.
- **Response** (200 OK):
```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2025-001234",
      "summary": "Laptop battery drains quickly",
      "requestedPriority": "Medium",
      "itPriority": "Medium",
      "currentStatus": "In Progress",
      "createdAt": "2025-05-12T09:14:00Z",
      "updatedAt": "2025-05-13T10:30:00Z",
      "category": { "id": 1, "name": "Hardware" },
      "owner": { "id": 5, "name": "Michael Brown" }
    }
  ],
  "meta": {
    "totalItems": 42,
    "totalPages": 6,
    "currentPage": 1,
    "itemsPerPage": 8
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters (see above).
  - `500 Internal Server Error`: Unexpected server error.

### 2.3 GET /api/tickets/:id
- **Description**: Retrieve details of a specific ticket owned by the selected Requester.
- **Headers**: `X-Requester-Id: <id>`
- **Response** (200 OK):
```json
{
  "id": 101,
  "ticketNumber": "TKT-2025-001234",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual. It used to last 6-8 hours but now dies within 2-3 hours even with minimal usage.",
  "requestedPriority": "Medium",
  "itPriority": null,
  "currentStatus": "New",
  "createdAt": "2025-05-12T09:14:00Z",
  "updatedAt": "2025-05-12T09:14:00Z",
  "category": { "id": 1, "name": "Hardware" },
  "relatedSystem": { "id": 1, "name": "Corporate Laptop" },
  "requester": { "id": 5, "name": "Michael Brown" },
  "attachments": [
    {
      "id": 1,
      "originalFilename": "screenshot.png",
      "size": 102400,
      "mimeType": "image/png",
      "isRemoved": false,
      "removalReason": null,
      "removedAt": null,
      "createdAt": "2025-05-12T09:15:00Z"
    }
  ]
}
```
- **Error Responses**:
  - `403 Forbidden`: Ticket exists but belongs to a different Requester.
  - `404 Not Found`: Ticket does not exist.
  - `500 Internal Server Error`: Unexpected server error.

## 3. Attachment Endpoints

### 3.1 POST /api/tickets/:id/attachments
- **Description**: Upload a new attachment to a specific ticket.
- **Headers**: `X-Requester-Id: <id>` (to verify ownership of the ticket)
- **Request**: `multipart/form-data` with an `attachment` field.
- **Responses**:
  - `201 Created`: Attachment uploaded successfully. Returns attachment metadata.
  - `400 Bad Request`: File size exceeds 5MB, unsupported file type (must be JPG, PNG, WEBP, PDF), or ticket already has 5 active attachments.
  - `403 Forbidden`: User does not own the ticket.
  - `404 Not Found`: Ticket not found.
  - `500 Internal Server Error`: Unexpected server error.

### 3.2 GET /api/attachments/:id
- **Description**: Retrieve attachment metadata (not the file content itself).
- **Headers**: `X-Requester-Id: <id>`
- **Responses**:
  - `200 OK`: Returns `{ "id": 1, "originalFilename": "screenshot.png", "size": 102400, "mimeType": "image/png", "isRemoved": false }`
  - `403 Forbidden` / `404 Not Found`.
  - `500 Internal Server Error`: Unexpected server error.

### 3.3 GET /api/attachments/:id/download
- **Description**: Download the active attachment binary file.
- **Headers**: `X-Requester-Id: <id>`
- **Responses**:
  - `200 OK`: Returns the file stream (e.g., `Content-Type: image/png`).
  - `400 Bad Request`: Attachment is soft-removed and cannot be downloaded.
  - `403 Forbidden` / `404 Not Found`.
  - `500 Internal Server Error`: Unexpected server error.

### 3.4 PATCH /api/attachments/:id/remove
- **Description**: Soft-remove an attachment.
- **Headers**: `X-Requester-Id: <id>`
- **Request Body** (JSON):
```json
{
  "reason": "Uploaded the wrong screenshot."
}
```
- **Responses**:
  - `200 OK` (or `204 No Content`): Attachment successfully soft-removed.
  - `400 Bad Request`: Missing reason payload.
  - `403 Forbidden` / `404 Not Found`.
  - `500 Internal Server Error`: Unexpected server error.
