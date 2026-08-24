# Planned Tests (Lab 02)

Test files: `server/test/lab-02/`, `client/test/lab-02/`, และ `e2e/lab-02/`

## 9.1 Planned Test Table

| Test ID | Type | Tool | AC | Test Description | Automated Test File | Result |
| ------- | ---- | ---- | -- | ---------------- | ------------------- | ------ |
| **Unit Tests** | | | | | | |
| UNIT-01 | Unit | Vitest | AC-01 | Ticket number format matches `TKT-YYYY-NNNNNN` pattern | `server/test/lab-02/ticket-number.unit.test.ts` | Planned |
| UNIT-02 | Unit | Vitest | AC-01 | Ticket number sequential increment produces unique values | `server/test/lab-02/ticket-number.unit.test.ts` | Planned |
| UNIT-03 | Unit | Vitest | BR-12 | Attachment filename is sanitized (no path traversal, special chars stripped) | `server/test/lab-02/attachment-sanitize.unit.test.ts` | Planned |
| UNIT-04 | Unit | Vitest | AC-05 | File size validation rejects files exceeding 5MB | `server/test/lab-02/attachment-validation.unit.test.ts` | Planned |
| UNIT-05 | Unit | Vitest | BR-06 | MIME type validation allows only JPG/PNG/WEBP/PDF and rejects others | `server/test/lab-02/attachment-validation.unit.test.ts` | Planned |
| **Reference Data (API)** | | | | | | |
| API-01 | API | Supertest | AC-04 | GET /api/dev-requesters returns 200 and an array of only active requesters | `server/test/lab-02/dev-requesters.api.test.ts` | Planned |
| API-02 | API | Supertest | AC-04 | GET /api/dev-requesters does not include inactive requesters in the response | `server/test/lab-02/dev-requesters.api.test.ts` | Planned |
| API-03 | API | Supertest | — | GET /api/categories returns 200 and an array of active categories | `server/test/lab-02/categories.api.test.ts` | Planned |
| API-04 | API | Supertest | — | GET /api/related-systems returns 200 and an array of active related systems | `server/test/lab-02/related-systems.api.test.ts` | Planned |
| **Ticket Creation (API)** | | | | | | |
| API-05 | API | Supertest | AC-01 | POST /api/tickets with valid data returns 201 and includes a generated ticketNumber | `server/test/lab-02/tickets.api.test.ts` | Planned |
| API-06 | API | Supertest | AC-01 | POST /api/tickets saves the ticket with currentStatus "New" | `server/test/lab-02/tickets.api.test.ts` | Planned |
| API-07 | API | Supertest | AC-01 | POST /api/tickets with missing summary returns 400 | `server/test/lab-02/tickets.api.test.ts` | Planned |
| API-08 | API | Supertest | AC-01 | POST /api/tickets with summary exceeding 100 chars returns 400 | `server/test/lab-02/tickets.api.test.ts` | Planned |
| API-09 | API | Supertest | AC-01 | POST /api/tickets with description exceeding 1000 chars returns 400 | `server/test/lab-02/tickets.api.test.ts` | Planned |
| API-10 | API | Supertest | AC-01 | POST /api/tickets without X-Requester-Id header returns 401/403 | `server/test/lab-02/tickets.api.test.ts` | Planned |
| **Ticket List & Pagination (API)** | | | | | | |
| API-11 | API | Supertest | AC-08 | GET /api/tickets returns paginated results with default limit of 8 | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-12 | API | Supertest | AC-08 | GET /api/tickets?page=2 returns the correct second page subset | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-13 | API | Supertest | AC-06 | GET /api/tickets for a requester with 0 tickets returns empty data array and totalItems 0 | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-14 | API | Supertest | AC-03 | GET /api/tickets only returns tickets owned by the X-Requester-Id | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-15 | API | Supertest | — | GET /api/tickets?search=TKT filters results matching ticket number | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-16 | API | Supertest | — | GET /api/tickets?category=1 filters results by category | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| API-17 | API | Supertest | — | GET /api/tickets?sort=createdAt&order=desc returns results in correct order | `server/test/lab-02/tickets-list.api.test.ts` | Planned |
| **Ticket Detail & Ownership (API)** | | | | | | |
| API-18 | API | Supertest | AC-03 | GET /api/tickets/:id belonging to another requester returns 403 | `server/test/lab-02/ticket-detail.api.test.ts` | Planned |
| API-19 | API | Supertest | — | GET /api/tickets/:id with non-existent id returns 404 | `server/test/lab-02/ticket-detail.api.test.ts` | Planned |
| API-20 | API | Supertest | — | GET /api/tickets/:id returns full ticket detail including attachments array | `server/test/lab-02/ticket-detail.api.test.ts` | Planned |
| **Attachment Upload (API)** | | | | | | |
| API-21 | API | Supertest | AC-05 | POST /api/tickets/:id/attachments with file > 5MB returns 400 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-22 | API | Supertest | — | POST /api/tickets/:id/attachments with invalid file type (e.g., .exe) returns 400 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-23 | API | Supertest | — | POST /api/tickets/:id/attachments with valid file returns 201 and attachment metadata | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-24 | API | Supertest | — | POST /api/tickets/:id/attachments when ticket already has 5 active attachments returns 400 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-25 | API | Supertest | AC-03 | POST /api/tickets/:id/attachments on another requester's ticket returns 403 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| **Attachment Download & Metadata (API)** | | | | | | |
| API-26 | API | Supertest | — | GET /api/attachments/:id returns attachment metadata JSON | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-27 | API | Supertest | — | GET /api/attachments/:id/download returns the file binary stream with correct Content-Type | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-28 | API | Supertest | AC-07 | GET /api/attachments/:id/download on a soft-removed attachment returns 400 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| **Attachment Soft Removal (API)** | | | | | | |
| API-29 | API | Supertest | AC-07 | PATCH /api/attachments/:id/remove with valid reason returns 200 and marks attachment as removed | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-30 | API | Supertest | AC-07 | PATCH /api/attachments/:id/remove without reason returns 400 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| API-31 | API | Supertest | AC-03 | PATCH /api/attachments/:id/remove on another requester's attachment returns 403 | `server/test/lab-02/attachments.api.test.ts` | Planned |
| **UI — Requester Selector** | | | | | | |
| UI-01 | UI | Vitest | AC-04 | Requester Selection screen renders only active requesters from API | `client/test/lab-02/RequesterSelector.test.tsx` | Planned |
| UI-02 | UI | Vitest | AC-02 | If no requester is in localStorage, navigating to My Tickets redirects to Requester Selection | `client/test/lab-02/RequesterSelector.test.tsx` | Planned |
| UI-03 | UI | Vitest | AC-02 | After selecting a requester, the identity is persisted in localStorage | `client/test/lab-02/RequesterSelector.test.tsx` | Planned |
| **UI — Create Ticket** | | | | | | |
| UI-04 | UI | Vitest | AC-01 | Submitting a valid ticket form shows success message with generated Ticket Number | `client/test/lab-02/CreateTicket.test.tsx` | Planned |
| UI-05 | UI | Vitest | AC-01 | Submitting with empty required fields shows inline validation errors | `client/test/lab-02/CreateTicket.test.tsx` | Planned |
| UI-06 | UI | Vitest | AC-01 | Summary field enforces 100 character max and Description field enforces 1000 character max | `client/test/lab-02/CreateTicket.test.tsx` | Planned |
| UI-07 | UI | Vitest | — | Category and Requested Priority dropdowns have no default selected value | `client/test/lab-02/CreateTicket.test.tsx` | Planned |
| **UI — My Tickets** | | | | | | |
| UI-08 | UI | Vitest | AC-06 | My Tickets shows "No Ticket Found" empty state when requester has 0 tickets | `client/test/lab-02/MyTickets.test.tsx` | Planned |
| UI-09 | UI | Vitest | — | My Tickets shows "No Ticket Found" when search/filter yields 0 results | `client/test/lab-02/MyTickets.test.tsx` | Planned |
| UI-10 | UI | Vitest | AC-08 | Clicking next page loads and renders the next subset of tickets | `client/test/lab-02/MyTickets.test.tsx` | Planned |
| UI-11 | UI | Vitest | — | Clicking "Clear Filters" resets search, filters, and sort to defaults | `client/test/lab-02/MyTickets.test.tsx` | Planned |
| **UI — Attachments** | | | | | | |
| UI-12 | UI | Vitest | AC-05 | Selecting a file > 5MB shows an error message and does not trigger upload | `client/test/lab-02/Attachments.test.tsx` | Planned |
| UI-13 | UI | Vitest | — | Selecting an unsupported file type shows an error message | `client/test/lab-02/Attachments.test.tsx` | Planned |
| UI-14 | UI | Vitest | AC-07 | Soft-remove flow shows dropdown with predefined reasons including "อื่นๆ (โปรดระบุ)" | `client/test/lab-02/Attachments.test.tsx` | Planned |
| UI-15 | UI | Vitest | AC-07 | After soft-removal, attachment shows removed state and download is blocked | `client/test/lab-02/Attachments.test.tsx` | Planned |
| **E2E Tests (Playwright)** | | | | | | |
| E2E-01 | E2E | Playwright | AC-01, AC-02 | Full create-ticket flow: select requester → fill form → submit → see ticket number | `e2e/lab-02/create-ticket.spec.ts` | Planned |
| E2E-02 | E2E | Playwright | AC-08 | My Tickets pagination: navigate pages and verify data changes | `e2e/lab-02/my-tickets.spec.ts` | Planned |
| E2E-03 | E2E | Playwright | AC-05, AC-07 | Attachment upload and soft-removal flow end-to-end | `e2e/lab-02/attachments.spec.ts` | Planned |
| E2E-04 | E2E | Playwright | AC-09 | Requester switching: change requester → verify ticket list changes | `e2e/lab-02/requester-switch.spec.ts` | Planned |
| E2E-05 | E2E | Playwright | AC-08 | Search and filter flow on My Tickets page | `e2e/lab-02/my-tickets.spec.ts` | Planned |
| **UI Style & Responsive Tests** | | | | | | |
| STYLE-01 | Style | Playwright | AC-10 | Primary button uses correct Zen Green colors (#006B3C bg, white text) | `e2e/lab-02/style-responsive.spec.ts` | Planned |
| STYLE-02 | Style | Playwright | — | Error fields show dark red border and validation text | `e2e/lab-02/style-responsive.spec.ts` | Planned |
| STYLE-03 | Style | Playwright | AC-10 | Mobile viewport (<768px): ticket table collapses to card view | `e2e/lab-02/style-responsive.spec.ts` | Planned |
| STYLE-04 | Style | Playwright | AC-10 | Mobile viewport (<768px): no horizontal scrolling on any page | `e2e/lab-02/style-responsive.spec.ts` | Planned |
| STYLE-05 | Style | Playwright | AC-10 | Desktop viewport (≥992px): multi-column layout renders correctly | `e2e/lab-02/style-responsive.spec.ts` | Planned |

## 9.2 AC ↔ Test Coverage Matrix

| AC | Description | Covered By Tests |
| -- | ----------- | ---------------- |
| AC-01 | Create ticket → save + show ticket number | UNIT-01, UNIT-02, API-05, API-06, API-07, API-08, API-09, API-10, UI-04, UI-05, UI-06, E2E-01 |
| AC-02 | No requester selected → show selection screen | UI-02, UI-03, E2E-01 |
| AC-03 | Ownership enforcement (cross-requester blocked) | API-14, API-18, API-25, API-31 |
| AC-04 | Only active requesters shown | API-01, API-02, UI-01 |
| AC-05 | File > 5MB rejected on frontend | UNIT-04, API-21, UI-12, E2E-03 |
| AC-06 | 0 tickets → empty state | API-13, UI-08 |
| AC-07 | Soft-remove attachment + block download | API-28, API-29, API-30, UI-14, UI-15, E2E-03 |
| AC-08 | Pagination works correctly | API-11, API-12, UI-10, E2E-02, E2E-05 |
| AC-09 | Requester switching updates ticket context | E2E-04 |
| AC-10 | Responsive layout (mobile/tablet/desktop) | STYLE-01, STYLE-03, STYLE-04, STYLE-05 |
| AC-11 | API failure → user-friendly error + form data preserved | — (manual verification) |
| BR-06 | MIME type validation | UNIT-05, API-22, UI-13 |
| BR-12 | Safe filename sanitization | UNIT-03 |

## วิธีรันทดสอบ

Backend (API + Unit):

```bash
cd server
npx vitest run
```

Frontend (UI Component):

```bash
cd client
npx vitest run
```

E2E (Playwright):

```bash
npx playwright test e2e/lab-02/
```

## หลักฐานผลการรัน

(จะเพิ่มเมื่อเขียน test เสร็จและรันผ่าน)
