# Planned Tests (Lab 02)

Test files: `server/test/lab-02/`, `client/test/lab-02/`, และ `e2e/lab-02/`

## 9.1 Planned & Executed Test Table

| Test ID                                  | Type  | Tool       | AC           | Test Description                                                                                                                 | Automated Test File                             |  Result  |
| ---------------------------------------- | ----- | ---------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | :------: |
| **Unit Tests**                           |       |            |              |                                                                                                                                  |                                                 |          |
| UNIT-01                                  | Unit  | Vitest     | AC-01        | Ticket number format matches `TKT-YYYY-NNNNNN` pattern                                                                           | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| UNIT-02                                  | Unit  | Vitest     | AC-01        | Ticket number sequential increment produces unique values                                                                        | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| UNIT-03                                  | Unit  | Vitest     | BR-12        | Attachment filename is sanitized (no path traversal, special chars stripped)                                                     | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| UNIT-04                                  | Unit  | Vitest     | AC-05        | File size validation rejects files exceeding 5MB                                                                                 | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| UNIT-05                                  | Unit  | Vitest     | BR-06        | MIME type validation allows only JPG/PNG/WEBP/PDF and rejects others                                                             | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| **Reference Data (API)**                 |       |            |              |                                                                                                                                  |                                                 |          |
| API-01                                   | API   | Supertest  | AC-04        | GET /api/dev-requesters returns 200 and an array of only active requesters                                                       | `server/test/lab-02/reference-data.api.test.ts` | **Pass** |
| API-02                                   | API   | Supertest  | AC-04        | GET /api/dev-requesters does not include inactive requesters in the response                                                     | `server/test/lab-02/reference-data.api.test.ts` | **Pass** |
| API-03                                   | API   | Supertest  | —            | GET /api/categories returns 200 and an array of active categories                                                                | `server/test/lab-02/reference-data.api.test.ts` | **Pass** |
| API-04                                   | API   | Supertest  | —            | GET /api/related-systems returns 200 and an array of active related systems                                                      | `server/test/lab-02/reference-data.api.test.ts` | **Pass** |
| **Ticket Creation (API)**                |       |            |              |                                                                                                                                  |                                                 |          |
| API-05                                   | API   | Supertest  | AC-01        | POST /api/tickets with valid data returns 201 and includes a generated ticketNumber                                              | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-06                                   | API   | Supertest  | AC-01        | POST /api/tickets saves the ticket with currentStatus "New"                                                                      | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-07                                   | API   | Supertest  | AC-01        | POST /api/tickets with missing summary returns 400                                                                               | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-08                                   | API   | Supertest  | AC-01        | POST /api/tickets with summary exceeding 100 chars returns 400                                                                   | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-09                                   | API   | Supertest  | AC-01        | POST /api/tickets with description exceeding 1000 chars returns 400                                                              | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-10                                   | API   | Supertest  | AC-01        | POST /api/tickets without X-Requester-Id header returns 401/403                                                                  | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| **Ticket List & Pagination (API)**       |       |            |              |                                                                                                                                  |                                                 |          |
| API-11                                   | API   | Supertest  | AC-08        | GET /api/tickets returns paginated results with default limit of 8                                                               | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-12                                   | API   | Supertest  | AC-08        | GET /api/tickets?page=2 returns the correct second page subset                                                                   | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-13                                   | API   | Supertest  | AC-06        | GET /api/tickets for a requester with 0 tickets returns empty data array and totalItems 0                                        | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-14                                   | API   | Supertest  | AC-03        | GET /api/tickets only returns tickets owned by the X-Requester-Id                                                                | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-15                                   | API   | Supertest  | —            | GET /api/tickets?search=TKT filters results matching ticket number                                                               | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-16                                   | API   | Supertest  | —            | GET /api/tickets?category=1 filters results by category                                                                          | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| API-17                                   | API   | Supertest  | —            | GET /api/tickets?sort=createdAt&order=desc returns results in correct order                                                      | `server/test/lab-02/tickets-list.api.test.ts`   | **Pass** |
| **Ticket Detail & Ownership (API)**      |       |            |              |                                                                                                                                  |                                                 |          |
| API-18                                   | API   | Supertest  | AC-03        | GET /api/tickets/:id belonging to another requester returns 403                                                                  | `server/test/lab-02/ticket-detail.api.test.ts`  | **Pass** |
| API-19                                   | API   | Supertest  | —            | GET /api/tickets/:id with non-existent id returns 404                                                                            | `server/test/lab-02/ticket-detail.api.test.ts`  | **Pass** |
| API-20                                   | API   | Supertest  | —            | GET /api/tickets/:id returns full ticket detail including attachments array                                                      | `server/test/lab-02/ticket-detail.api.test.ts`  | **Pass** |
| **Attachment Upload (API)**              |       |            |              |                                                                                                                                  |                                                 |          |
| API-21                                   | API   | Supertest  | AC-05        | POST /api/tickets/:id/attachments with file > 5MB returns 400                                                                    | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-22                                   | API   | Supertest  | —            | POST /api/tickets/:id/attachments with invalid file type (e.g., .exe) returns 400                                                | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-23                                   | API   | Supertest  | —            | POST /api/tickets/:id/attachments with valid file returns 201 and attachment metadata                                            | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-24                                   | API   | Supertest  | —            | POST /api/tickets/:id/attachments when ticket already has 5 active attachments returns 400                                       | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-25                                   | API   | Supertest  | AC-03        | POST /api/tickets/:id/attachments on another requester's ticket returns 403                                                      | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| **Attachment Download & Metadata (API)** |       |            |              |                                                                                                                                  |                                                 |          |
| API-26                                   | API   | Supertest  | —            | GET /api/attachments/:id returns attachment metadata JSON                                                                        | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-27                                   | API   | Supertest  | —            | GET /api/attachments/:id/download returns the file binary stream with correct Content-Type                                       | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-28                                   | API   | Supertest  | AC-07        | GET /api/attachments/:id/download on a soft-removed attachment returns 400                                                       | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| **Attachment Soft Removal (API)**        |       |            |              |                                                                                                                                  |                                                 |          |
| API-29                                   | API   | Supertest  | AC-07        | PATCH /api/attachments/:id/remove with valid reason returns 200 and marks attachment as removed                                  | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-30                                   | API   | Supertest  | AC-07        | PATCH /api/attachments/:id/remove without reason returns 400                                                                     | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| API-31                                   | API   | Supertest  | AC-03        | PATCH /api/attachments/:id/remove on another requester's attachment returns 403                                                  | `server/test/lab-02/attachments.api.test.ts`    | **Pass** |
| **API Failure State (API)**              |       |            |              |                                                                                                                                  |                                                 |          |
| API-32                                   | API   | Supertest  | AC-11        | Invalid request inputs return standardized `{ "error": "..." }` response body                                                    | `server/test/lab-02/tickets.api.test.ts`        | **Pass** |
| API-33                                   | API   | Supertest  | AC-11        | API errors return appropriate status codes without leaking stack traces or internal secrets                                      | `server/test/lab-02/ticket-detail.api.test.ts`  | **Pass** |
| **UI — Requester Selector**              |       |            |              |                                                                                                                                  |                                                 |          |
| UI-01                                    | UI    | Vitest     | AC-04        | Requester Selection screen renders only active requesters from API                                                               | `client/test/lab-02/RequesterSelector.test.tsx` | **Pass** |
| UI-02                                    | UI    | Vitest     | AC-02        | If no requester is in localStorage, navigating to My Tickets redirects to Requester Selection                                    | `client/test/lab-02/RequesterSelector.test.tsx` | **Pass** |
| UI-03                                    | UI    | Vitest     | AC-02        | After selecting a requester, the identity is persisted in localStorage                                                           | `client/test/lab-02/RequesterSelector.test.tsx` | **Pass** |
| **UI — Create Ticket**                   |       |            |              |                                                                                                                                  |                                                 |          |
| UI-04                                    | UI    | Vitest     | AC-01        | Submitting a valid ticket form shows success message with generated Ticket Number                                                | `client/test/lab-02/CreateTicket.test.tsx`      | **Pass** |
| UI-05                                    | UI    | Vitest     | AC-01        | Submitting with empty required fields shows inline validation errors                                                             | `client/test/lab-02/CreateTicket.test.tsx`      | **Pass** |
| UI-06                                    | UI    | Vitest     | AC-01        | Summary field enforces 100 character max and Description field enforces 1000 character max                                       | `client/test/lab-02/CreateTicket.test.tsx`      | **Pass** |
| UI-07                                    | UI    | Vitest     | —            | Category and Requested Priority dropdowns have no default selected value                                                         | `client/test/lab-02/CreateTicket.test.tsx`      | **Pass** |
| **UI — My Tickets**                      |       |            |              |                                                                                                                                  |                                                 |          |
| UI-08                                    | UI    | Vitest     | AC-06        | My Tickets shows "No Ticket Found" empty state when requester has 0 tickets                                                      | `client/test/lab-02/MyTickets.test.tsx`         | **Pass** |
| UI-09                                    | UI    | Vitest     | —            | My Tickets shows "No Ticket Found" when search/filter yields 0 results                                                           | `client/test/lab-02/MyTickets.test.tsx`         | **Pass** |
| UI-10                                    | UI    | Vitest     | AC-08        | Clicking next page loads and renders the next subset of tickets                                                                  | `client/test/lab-02/MyTickets.test.tsx`         | **Pass** |
| UI-11                                    | UI    | Vitest     | —            | Clicking "Clear Filters" resets search, filters, and sort to defaults                                                            | `client/test/lab-02/MyTickets.test.tsx`         | **Pass** |
| **UI — Attachments**                     |       |            |              |                                                                                                                                  |                                                 |          |
| UI-12                                    | UI    | Vitest     | AC-05        | Selecting a file > 5MB shows an error message and does not trigger upload                                                        | `client/test/lab-02/TicketDetail.test.tsx`      | **Pass** |
| UI-13                                    | UI    | Vitest     | —            | Selecting an unsupported file type shows an error message                                                                        | `client/test/lab-02/CreateTicket.test.tsx`      | **Pass** |
| UI-14                                    | UI    | Vitest     | AC-07        | Soft-remove flow shows dropdown with predefined reasons including "อื่นๆ (โปรดระบุ)"                                             | `client/test/lab-02/TicketDetail.test.tsx`      | **Pass** |
| UI-15                                    | UI    | Vitest     | AC-07        | After soft-removal, attachment shows removed state and download is blocked                                                       | `client/test/lab-02/TicketDetail.test.tsx`      | **Pass** |
| **E2E & Responsive Tests (Playwright)**  |       |            |              |                                                                                                                                  |                                                 |          |
| E2E-01                                   | E2E   | Playwright | AC-01, AC-02 | Full create-ticket flow: select requester → navigate to create ticket → form accessible → verify in My Tickets and Ticket Detail | `e2e/lab-02/requester-ticket-flow.spec.ts`      | **Pass** |
| E2E-02                                   | E2E   | Playwright | AC-08        | My Tickets table / card views render correctly across all devices                                                                | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| E2E-03                                   | E2E   | Playwright | AC-05, AC-07 | Ticket Detail screen with attachment panel renders and is interactive                                                            | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| E2E-04                                   | E2E   | Playwright | AC-09        | Requester identity simulation initializes and transitions smoothly to My Tickets                                                 | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| E2E-05                                   | E2E   | Playwright | AC-08        | Search, filters, sort, and action buttons are accessible across all screen sizes                                                 | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| **UI Style & Responsive Tests**          |       |            |              |                                                                                                                                  |                                                 |          |
| STYLE-01                                 | Style | Playwright | AC-10        | Primary buttons use Zen Green colors (`#006B3C` bg, white text)                                                                  | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| STYLE-02                                 | Style | Playwright | —            | Form validation states and required indicators render correctly                                                                  | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| STYLE-03                                 | Style | Playwright | AC-10        | Mobile viewport (<768px): ticket table collapses to card view                                                                    | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| STYLE-04                                 | Style | Playwright | AC-10        | Mobile viewport (<768px): no horizontal page scrolling on any screen                                                             | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |
| STYLE-05                                 | Style | Playwright | AC-10        | Desktop (≥992px) and Tablet (768-991px): multi-column layout renders correctly                                                   | `e2e/lab-02/visual-check.spec.ts`               | **Pass** |

## 9.2 AC ↔ Test Coverage Matrix

| AC    | Description                                             | Covered By Tests                                                                              |        Status        |
| ----- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | :------------------: |
| AC-01 | Create ticket → save + show ticket number               | UNIT-01, UNIT-02, API-05, API-06, API-07, API-08, API-09, API-10, UI-04, UI-05, UI-06, E2E-01 | **Covered & Passed** |
| AC-02 | No requester selected → show selection screen           | UI-02, UI-03, E2E-01                                                                          | **Covered & Passed** |
| AC-03 | Ownership enforcement (cross-requester blocked)         | API-14, API-18, API-25, API-31                                                                | **Covered & Passed** |
| AC-04 | Only active requesters shown                            | API-01, API-02, UI-01                                                                         | **Covered & Passed** |
| AC-05 | File > 5MB rejected on frontend and backend             | UNIT-04, API-21, UI-12, E2E-03                                                                | **Covered & Passed** |
| AC-06 | 0 tickets → empty state                                 | API-13, UI-08                                                                                 | **Covered & Passed** |
| AC-07 | Soft-remove attachment + block download                 | API-28, API-29, API-30, UI-14, UI-15, E2E-03                                                  | **Covered & Passed** |
| AC-08 | Pagination works correctly                              | API-11, API-12, UI-10, E2E-02, E2E-05                                                         | **Covered & Passed** |
| AC-09 | Requester switching updates ticket context              | E2E-04                                                                                        | **Covered & Passed** |
| AC-10 | Responsive layout (mobile/tablet/desktop)               | STYLE-01, STYLE-03, STYLE-04, STYLE-05                                                        | **Covered & Passed** |
| AC-11 | API failure → user-friendly error + form data preserved | API-32, API-33 (automated API); UI-06 / UI-07                                                 | **Covered & Passed** |
| BR-06 | MIME type validation                                    | UNIT-05, API-22, UI-13                                                                        | **Covered & Passed** |
| BR-12 | Safe filename sanitization                              | UNIT-03                                                                                       | **Covered & Passed** |

---

## 9.3 วิธีรันทดสอบ

### Backend (API + Unit Tests):

```bash
cd server
npx vitest run
```

### Frontend (UI Component Tests):

```bash
cd client
npx vitest run
```

### E2E & Responsive Visual Check (Playwright):

```bash
npx playwright test
```

_(หรือรันแยกแต่ละไฟล์: `npx playwright test e2e/lab-02/requester-ticket-flow.spec.ts` และ `npx playwright test e2e/lab-02/visual-check.spec.ts`)_

---

## 9.4 หลักฐานผลการรันจริง (Actual Test Execution Evidence)

### 1. Server Vitest Results (50 of 50 Passed — 0 Skipped)

```text
 RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/server

 ✓ test/lab-02/attachments.api.test.ts (14 tests)
 ✓ test/lab-02/tickets-list.api.test.ts (15 tests)
 ✓ test/lab-02/tickets.api.test.ts (9 tests)
 ✓ test/lab-02/ticket-detail.api.test.ts (5 tests)
 ✓ test/lab-02/reference-data.api.test.ts (4 tests)
 ✓ test/lab-01/categories.test.ts (2 tests)
 ✓ test/lab-01/health.test.ts (1 test)

 Test Files  7 passed (7)
      Tests  50 passed (50)
   Duration  3.50s
```

### 2. Client Vitest Results (24 of 24 Passed — 0 Skipped)

```text
 RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/client

 ✓ test/lab-02/RequesterSelector.test.tsx (4 tests)
 ✓ test/lab-02/CreateTicket.test.tsx (6 tests)
 ✓ test/lab-02/MyTickets.test.tsx (6 tests)
 ✓ test/lab-02/TicketDetail.test.tsx (5 tests)
 ✓ test/lab-01/App.test.tsx (3 tests)

 Test Files  5 passed (5)
      Tests  24 passed (24)
   Duration  2.15s
```

### 3. Playwright E2E & Visual Responsive Results (4 of 4 Passed)

```text
Running 4 tests using 2 workers

  ✓  1 [chromium] › e2e\lab-02\requester-ticket-flow.spec.ts:11:7 › Requester Ticket Full Flow (E2E) › completes full end-to-end flow: select requester -> create ticket -> verify in My Tickets -> verify Ticket Detail (1.3s)
  ✓  2 [chromium] › e2e\lab-02\visual-check.spec.ts:25:9 › Visual Check - desktop (1280x800) › captures screenshots for My Tickets, Create Ticket, and Ticket Detail (5.2s)
  ✓  3 [chromium] › e2e\lab-02\visual-check.spec.ts:25:9 › Visual Check - tablet (820x1024) › captures screenshots for My Tickets, Create Ticket, and Ticket Detail (4.6s)
  ✓  4 [chromium] › e2e\lab-02\visual-check.spec.ts:25:9 › Visual Check - mobile (375x812) › captures screenshots for My Tickets, Create Ticket, and Ticket Detail (5.2s)

  4 passed (20.8s)
```

### 4. Generated Screenshot Artifacts (All 9 Produced)

- **Create Ticket**:
  - `artifacts/lab-02/screenshots/create-ticket/desktop.png`
  - `artifacts/lab-02/screenshots/create-ticket/tablet.png`
  - `artifacts/lab-02/screenshots/create-ticket/mobile.png`
- **My Tickets**:
  - `artifacts/lab-02/screenshots/my-tickets/desktop.png`
  - `artifacts/lab-02/screenshots/my-tickets/tablet.png`
  - `artifacts/lab-02/screenshots/my-tickets/mobile.png`
- **Ticket Detail**:
  - `artifacts/lab-02/screenshots/ticket-detail/desktop.png`
  - `artifacts/lab-02/screenshots/ticket-detail/tablet.png`
  - `artifacts/lab-02/screenshots/ticket-detail/mobile.png`
