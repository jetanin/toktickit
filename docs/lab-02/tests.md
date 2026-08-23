# Planned Tests (Lab 02)

Test files: `server/test/lab-02/` และ `client/test/lab-02/`

## 9.1 Planned Test Table

| Test ID | Type | Tool | AC | Test Description | Result |
| ------- | ---- | ---- | -- | ---------------- | ------ |
| **Reference Data** | | | | | |
| API-01 | API | Supertest | AC-04 | GET /api/dev-requesters returns 200 and an array of only active requesters | Planned |
| API-02 | API | Supertest | AC-04 | GET /api/dev-requesters does not include inactive requesters in the response | Planned |
| API-03 | API | Supertest | — | GET /api/categories returns 200 and an array of active categories | Planned |
| API-04 | API | Supertest | — | GET /api/related-systems returns 200 and an array of active related systems | Planned |
| **Ticket Creation** | | | | | |
| API-05 | API | Supertest | AC-01 | POST /api/tickets with valid data returns 201 and includes a generated ticketNumber | Planned |
| API-06 | API | Supertest | AC-01 | POST /api/tickets saves the ticket with currentStatus "New" | Planned |
| API-07 | API | Supertest | AC-01 | POST /api/tickets with missing summary returns 400 | Planned |
| API-08 | API | Supertest | AC-01 | POST /api/tickets with summary exceeding 100 chars returns 400 | Planned |
| API-09 | API | Supertest | AC-01 | POST /api/tickets with description exceeding 1000 chars returns 400 | Planned |
| API-10 | API | Supertest | AC-01 | POST /api/tickets without X-Requester-Id header returns 401/403 | Planned |
| **Ticket List & Pagination** | | | | | |
| API-11 | API | Supertest | AC-08 | GET /api/tickets returns paginated results with default limit of 8 | Planned |
| API-12 | API | Supertest | AC-08 | GET /api/tickets?page=2 returns the correct second page subset | Planned |
| API-13 | API | Supertest | AC-06 | GET /api/tickets for a requester with 0 tickets returns empty data array and totalItems 0 | Planned |
| API-14 | API | Supertest | AC-03 | GET /api/tickets only returns tickets owned by the X-Requester-Id | Planned |
| API-15 | API | Supertest | — | GET /api/tickets?search=TKT filters results matching ticket number | Planned |
| API-16 | API | Supertest | — | GET /api/tickets?category=1 filters results by category | Planned |
| API-17 | API | Supertest | — | GET /api/tickets?sort=createdAt&order=desc returns results in correct order | Planned |
| **Ticket Detail & Ownership** | | | | | |
| API-18 | API | Supertest | AC-03 | GET /api/tickets/:id belonging to another requester returns 403 | Planned |
| API-19 | API | Supertest | — | GET /api/tickets/:id with non-existent id returns 404 | Planned |
| API-20 | API | Supertest | — | GET /api/tickets/:id returns full ticket detail including attachments array | Planned |
| **Attachment Upload** | | | | | |
| API-21 | API | Supertest | AC-05 | POST /api/tickets/:id/attachments with file > 5MB returns 400 | Planned |
| API-22 | API | Supertest | — | POST /api/tickets/:id/attachments with invalid file type (e.g., .exe) returns 400 | Planned |
| API-23 | API | Supertest | — | POST /api/tickets/:id/attachments with valid file returns 201 and attachment metadata | Planned |
| API-24 | API | Supertest | — | POST /api/tickets/:id/attachments when ticket already has 5 active attachments returns 400 | Planned |
| API-25 | API | Supertest | AC-03 | POST /api/tickets/:id/attachments on another requester's ticket returns 403 | Planned |
| **Attachment Download & Metadata** | | | | | |
| API-26 | API | Supertest | — | GET /api/attachments/:id returns attachment metadata JSON | Planned |
| API-27 | API | Supertest | — | GET /api/attachments/:id/download returns the file binary stream with correct Content-Type | Planned |
| API-28 | API | Supertest | AC-07 | GET /api/attachments/:id/download on a soft-removed attachment returns 400 | Planned |
| **Attachment Soft Removal** | | | | | |
| API-29 | API | Supertest | AC-07 | PATCH /api/attachments/:id/remove with valid reason returns 200 and marks attachment as removed | Planned |
| API-30 | API | Supertest | AC-07 | PATCH /api/attachments/:id/remove without reason returns 400 | Planned |
| API-31 | API | Supertest | AC-03 | PATCH /api/attachments/:id/remove on another requester's attachment returns 403 | Planned |
| **UI — Requester Selector** | | | | | |
| UI-01 | UI | Vitest | AC-04 | Requester Selection screen renders only active requesters from API | Planned |
| UI-02 | UI | Vitest | AC-02 | If no requester is in localStorage, navigating to My Tickets redirects to Requester Selection | Planned |
| UI-03 | UI | Vitest | AC-02 | After selecting a requester, the identity is persisted in localStorage | Planned |
| **UI — Create Ticket** | | | | | |
| UI-04 | UI | Vitest | AC-01 | Submitting a valid ticket form shows success message with generated Ticket Number | Planned |
| UI-05 | UI | Vitest | AC-01 | Submitting with empty required fields shows inline validation errors | Planned |
| UI-06 | UI | Vitest | AC-01 | Summary field enforces 100 character max and Description field enforces 1000 character max | Planned |
| UI-07 | UI | Vitest | — | Category and Requested Priority dropdowns have no default selected value | Planned |
| **UI — My Tickets** | | | | | |
| UI-08 | UI | Vitest | AC-06 | My Tickets shows "No Ticket Found" empty state when requester has 0 tickets | Planned |
| UI-09 | UI | Vitest | — | My Tickets shows "No Ticket Found" when search/filter yields 0 results | Planned |
| UI-10 | UI | Vitest | AC-08 | Clicking next page loads and renders the next subset of tickets | Planned |
| UI-11 | UI | Vitest | — | Clicking "Clear Filters" resets search, filters, and sort to defaults | Planned |
| **UI — Attachments** | | | | | |
| UI-12 | UI | Vitest | AC-05 | Selecting a file > 5MB shows an error message and does not trigger upload | Planned |
| UI-13 | UI | Vitest | — | Selecting an unsupported file type shows an error message | Planned |
| UI-14 | UI | Vitest | AC-07 | Soft-remove flow shows dropdown with predefined reasons including "อื่นๆ (โปรดระบุ)" | Planned |
| UI-15 | UI | Vitest | AC-07 | After soft-removal, attachment shows removed state and download is blocked | Planned |

## AC ↔ Test Coverage Matrix

| AC | Description | Covered By Tests |
| -- | ----------- | ---------------- |
| AC-01 | Create ticket → save + show ticket number | API-05, API-06, API-07, API-08, API-09, API-10, UI-04, UI-05, UI-06 |
| AC-02 | No requester selected → show selection screen | UI-02, UI-03 |
| AC-03 | Ownership enforcement (cross-requester blocked) | API-14, API-18, API-25, API-31 |
| AC-04 | Only active requesters shown | API-01, API-02, UI-01 |
| AC-05 | File > 5MB rejected on frontend | API-21, UI-12 |
| AC-06 | 0 tickets → empty state | API-13, UI-08 |
| AC-07 | Soft-remove attachment + block download | API-28, API-29, API-30, UI-14, UI-15 |
| AC-08 | Pagination works correctly | API-11, API-12, UI-10 |

## วิธีรันทดสอบ

Backend:

```bash
cd server
npx vitest run
```

Frontend:

```bash
cd client
npx vitest run
```

## หลักฐานผลการรัน

(จะเพิ่มเมื่อเขียน test เสร็จและรันผ่าน)
