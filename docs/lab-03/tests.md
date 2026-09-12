# Planned Tests & Verification Plan (Lab 03)

This test plan defines the complete verification strategy for **Lab 3: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens**. In accordance with Spec-DD, Test-DD, and TDD methodologies, all tests are planned prior to feature implementation, mapped directly to numbered Acceptance Criteria (AC) and Business Rules (BR), and tracked to final status.

---

## 1. Test Architecture & Directory Structure

```
server/tests/lab-03/
├── auth.api.test.ts            # Authentication, session cookies, logout, password boundaries
├── authorization.api.test.ts   # RBAC enforcement, cross-requester protection, route gating
├── staff-queue.api.test.ts     # Queue queries, filters, assignment, search, pagination
├── staff-ticket-detail.api.test.ts # Claim, reassign, IT priority, status transitions, resolution summary
├── comments-notes.api.test.ts  # Public comments, internal notes confidentiality, validation
└── users-admin.api.test.ts     # User management, validation, safety guards, password reset

client/test/lab-03/
├── Login.test.tsx              # Login form, show/hide password, busy states, error alert states
├── ChangePassword.test.tsx     # Mandatory password change modal, live complexity checklist
├── StaffTicketQueue.test.tsx   # Queue table/cards, search, filter controls, pagination
├── StaffTicketDetail.test.tsx  # Operational detail, resolution summary, tabs, claim/reassign
└── UserManagement.test.tsx     # Admin table, user modal dialogs, deactivation guards

e2e/lab-03/
├── authentication.spec.ts      # Login, first-login password change, logout lifecycle
├── staff-ticket-flow.spec.ts   # Queue triage, claim, priority, status workflow, comments, notes
└── user-administration.spec.ts # Admin create user, edit, deactivation safety guards, password reset
```

---

## 2. Planned Test Inventory (Handout Table Format)

| Test ID                                             | Type  | Requirement / AC    | What It Tests                                                                                           | Expected Result                                                         | Automated Test File                                   | Final |
| :-------------------------------------------------- | :---- | :------------------ | :------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------- | :---------------------------------------------------- | :---: |
| **Unit & Validator Tests**                          |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `UNIT-01`                                           | Unit  | AC-06, BR-06        | Password complexity validator boundaries (8+ chars, upper, lower, digit, symbol)                        | Valid passwords accept; non-compliant or identical passwords reject     | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `UNIT-02`                                           | Unit  | AC-14, BR-15        | Status transition matrix validator                                                                      | Permitted transitions return true; illegal transitions return false     | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `UNIT-03`                                           | Unit  | AC-01, BR-07        | Session cookie generation and token signer helper                                                       | Produces secure, tamper-proof payload                                   | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| **Authentication & Password APIs**                  |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `API-01`                                            | API   | AC-01               | Valid login                                                                                             | Authenticated response; safe user data; session cookie set              | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-02`                                            | API   | AC-05, BR-01        | Invalid password login attempt                                                                          | Generic 401 Unauthorized; no account existence leaked                   | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-03`                                            | API   | AC-05, BR-01        | Inactive account login attempt (`isActive: false`)                                                      | Generic 401 Unauthorized; no extra account info exposed                 | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-04`                                            | API   | AC-02, BR-02        | Operational access when `mustChangePassword = true`                                                     | 403 Forbidden with `PASSWORD_CHANGE_REQUIRED`                           | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-05`                                            | API   | AC-06, BR-06        | First-login password change submission                                                                  | 200 OK; updates password hash; clears `mustChangePassword`              | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-06`                                            | API   | AC-06, BR-06        | Password change with password < 8 chars or missing complexity                                           | 400 Bad Request with validation errors                                  | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-07`                                            | API   | AC-07, BR-07        | Logout invalidation                                                                                     | 200 OK; clears session cookie; next request returns 401                 | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| `API-08`                                            | API   | AC-04               | Requester requests Internal Notes                                                                       | Forbidden (403); no note data returned                                  | `server/tests/lab-03/comments-notes.api.test.ts`      | Pass  |
| `API-09`                                            | API   | BR-08               | `GET /api/auth/me` with active session                                                                  | 200 OK; returns safe user profile without password hash                 | `server/tests/lab-03/auth.api.test.ts`                | Pass  |
| **Role-Based Authorization & Requester Continuity** |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `API-10`                                            | API   | AC-03, AC-08        | Client supplies another `requesterId` in header or body                                                 | Backend uses session identity; returns only caller's tickets            | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| `API-11`                                            | API   | AC-09, BR-27        | Requester accessing another user's ticket or attachment                                                 | 404 Not Found (or 403 Forbidden); no data leaked                        | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| `API-12`                                            | API   | FR-07, BR-10        | Requester accessing `/api/staff/tickets`                                                                | 403 Forbidden                                                           | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| `API-13`                                            | API   | FR-07, BR-10        | Non-Administrator accessing `/api/admin/users`                                                          | 403 Forbidden                                                           | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| **IT Staff Ticket Queue & Operations**              |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `API-14`                                            | API   | AC-10, FR-13        | IT Staff queue retrieval with default pagination (10 items)                                             | 200 OK; paginated list with total counts                                | `server/tests/lab-03/staff-queue.api.test.ts`         | Pass  |
| `API-15`                                            | API   | AC-11, FR-13        | Queue search by ticket number, summary, or requester                                                    | 200 OK; matching subset returned                                        | `server/tests/lab-03/staff-queue.api.test.ts`         | Pass  |
| `API-16`                                            | API   | AC-11, FR-13        | Queue multi-filter (Category, Priority, Status)                                                         | 200 OK; correctly filtered results                                      | `server/tests/lab-03/staff-queue.api.test.ts`         | Pass  |
| `API-17`                                            | API   | AC-11, FR-13        | Queue filter `assigned=unassigned` and `assigned=me`                                                    | 200 OK; returns unassigned or caller-assigned tickets                   | `server/tests/lab-03/staff-queue.api.test.ts`         | Pass  |
| `API-18`                                            | API   | AC-12, BR-12        | IT Staff claims unassigned ticket                                                                       | 200 OK; assigns caller; status advances `New` -> `Open`                 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `API-19`                                            | API   | AC-12, BR-11, BR-12 | Reassign ticket to another active IT Staff or Administrator user                                        | 200 OK; updates `ticketOwnerId`                                         | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `API-20`                                            | API   | AC-13, BR-13        | Update IT Priority (`Low`, `Medium`, `High`, `Critical`)                                                | 200 OK; updates `itPriority`                                            | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `API-21`                                            | API   | AC-14, BR-15        | Transition status to `Resolved` with resolution summary                                                 | 200 OK; saves status and `resolutionSummary`                            | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `API-22`                                            | API   | AC-14, BR-15        | Illegal status transition (e.g. `New` -> `Resolved`)                                                    | 400 Bad Request                                                         | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| `API-23`                                            | API   | AC-17, BR-05        | Requester indicates "Problem Appears Resolved"                                                          | 200 OK; sets flag; ticket not directly closed                           | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass  |
| **Comments & Internal Notes**                       |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `API-24`                                            | API   | AC-15, BR-04        | Post Public Comment by Requester and IT Staff                                                           | 201 Created; appears in shared thread                                   | `server/tests/lab-03/comments-notes.api.test.ts`      | Pass  |
| `API-25`                                            | API   | AC-16, BR-04        | IT Staff creates Internal Note                                                                          | 201 Created; stored with staff authorship                               | `server/tests/lab-03/comments-notes.api.test.ts`      | Pass  |
| `API-26`                                            | API   | BR-18, BR-19        | Empty or whitespace-only comment/note body                                                              | 400 Bad Request                                                         | `server/tests/lab-03/comments-notes.api.test.ts`      | Pass  |
| **Administrator User Management**                   |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `API-27`                                            | API   | AC-18, FR-20        | Admin lists users with search and role filter                                                           | 200 OK; returns matching user records                                   | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-28`                                            | API   | AC-18, FR-22        | Admin creates user with one role and initial password                                                   | 201 Created; `mustChangePassword = true`                                | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-29`                                            | API   | AC-19, BR-22        | Admin creates user with duplicate email                                                                 | 409 Conflict                                                            | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-30`                                            | API   | FR-23               | Admin edits user's name, email, role, and active status                                                 | 200 OK; updates persisted                                               | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-31`                                            | API   | AC-21, BR-26        | Admin resets password generating new initial password                                                   | 200 OK; flags `mustChangePassword = true`                               | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-32`                                            | API   | AC-20, BR-24        | Admin attempts to deactivate own account                                                                | 400 Bad Request with self-deactivation guard message                    | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-33`                                            | API   | AC-20, BR-25        | Admin attempts to deactivate the sole active Administrator                                              | 400 Bad Request with sole-admin protection message                      | `server/tests/lab-03/users-admin.api.test.ts`         | Pass  |
| `API-34`                                            | API   | BR-27               | Safe failure behavior across endpoints (401/403/400/404/409/500) without leaking stack/internal secrets | 4xx/5xx sanitized JSON body                                             | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| **Regression & Migration Tests**                    |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `REGR-01`                                           | Regr  | AC-08, Sec 5.2      | Lab 2 DevelopmentRequester records migration to User model                                              | All tickets retain correct requester ownership and initial password set | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| `REGR-02`                                           | Regr  | AC-08, BR-21        | Lab 2 Attachment upload, download, and soft-removal with reason                                         | 201/200 OK; functions seamlessly with session authentication            | `server/tests/lab-03/authorization.api.test.ts`       | Pass  |
| **Client UI Component Tests**                       |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `UI-01`                                             | UI    | AC-01, AC-05        | Login form renders email, password, busy spinner, and error banner                                      | Pass                                                                    | `client/test/lab-03/Login.test.tsx`                   | Pass  |
| `UI-02`                                             | UI    | AC-02, AC-06        | Mandatory Change Password modal blocks app; checks live complexity                                      | Pass                                                                    | `client/test/lab-03/ChangePassword.test.tsx`          | Pass  |
| `UI-03`                                             | UI    | AC-10, AC-11        | Staff Ticket Queue renders table on desktop and cards on mobile                                         | Pass                                                                    | `client/test/lab-03/StaffTicketQueue.test.tsx`        | Pass  |
| `UI-04`                                             | UI    | AC-11               | Queue toolbar filter popover updates query and renders empty state                                      | Pass                                                                    | `client/test/lab-03/StaffTicketQueue.test.tsx`        | Pass  |
| `UI-05`                                             | UI    | AC-12, AC-14        | Ticket Detail renders operational controls and resolution summary box                                   | Pass                                                                    | `client/test/lab-03/StaffTicketDetail.test.tsx`       | Pass  |
| `UI-06`                                             | UI    | AC-15, AC-16        | Tabs switch between Public Comments and amber Internal Notes panel                                      | Pass                                                                    | `client/test/lab-03/StaffTicketDetail.test.tsx`       | Pass  |
| `UI-07`                                             | UI    | AC-18, AC-19        | User Management renders table, search, role filter, and create modal                                    | Pass                                                                    | `client/test/lab-03/UserManagement.test.tsx`          | Pass  |
| `UI-08`                                             | UI    | AC-20               | Safety guards disable deactivation and display warning alert                                            | Pass                                                                    | `client/test/lab-03/UserManagement.test.tsx`          | Pass  |
| **UI Style & Responsive Tests**                     |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `STYLE-01`                                          | Style | AC-22               | Zen Green color tokens and status/priority/role badges conform                                          | Pass                                                                    | `e2e/lab-03/authentication.spec.ts`                   | Pass  |
| `STYLE-02`                                          | Style | AC-22               | Mobile viewport (<768px): Queue table collapses to cards with 44px touch targets                        | Pass                                                                    | `e2e/lab-03/staff-ticket-flow.spec.ts`                | Pass  |
| `STYLE-03`                                          | Style | AC-22               | Zero horizontal overflow across desktop, tablet, and mobile viewports                                   | Pass                                                                    | `e2e/lab-03/user-administration.spec.ts`              | Pass  |
| **End-to-End Tests (Playwright)**                   |       |                     |                                                                                                         |                                                                         |                                                       |       |
| `E2E-01`                                            | E2E   | AC-01, AC-07        | Full auth lifecycle: login -> authenticated shell -> logout                                             | Pass                                                                    | `e2e/lab-03/authentication.spec.ts`                   | Pass  |
| `E2E-02`                                            | E2E   | AC-02               | Initial password login and change: normal app opens only after valid change                             | Pass                                                                    | `e2e/lab-03/authentication.spec.ts`                   | Pass  |
| `E2E-03`                                            | E2E   | AC-10..16           | IT Staff flow: open queue -> claim ticket -> set priority -> resolve with summary -> comment -> note    | Pass                                                                    | `e2e/lab-03/staff-ticket-flow.spec.ts`                | Pass  |
| `E2E-04`                                            | E2E   | AC-18..21           | Admin flow: user list -> search -> create user -> edit -> reset password -> guards                      | Pass                                                                    | `e2e/lab-03/user-administration.spec.ts`              | Pass  |

---

## 3. AC ↔ Test Traceability Matrix

| Acceptance Criterion / Business Rule                    | Covered By Automated Tests                       | Verification Scope                                     |
| :------------------------------------------------------ | :----------------------------------------------- | :----------------------------------------------------- |
| **AC-01** (Valid login & session)                       | `UNIT-03`, `API-01`, `UI-01`, `E2E-01`           | Backend cookie + frontend auth context + E2E           |
| **AC-02** (Must change initial password gate)           | `API-04`, `UI-02`, `E2E-02`                      | Endpoint 403 block + blocking modal + E2E flow         |
| **AC-03** (Server-derived requester identity)           | `API-10`, `API-11`                               | Header tampering rejected; caller identity enforced    |
| **AC-04** (Requester Internal Notes rejection)          | `API-08`                                         | Strict 403 forbidden without leaking note content      |
| **AC-05** (Generic failure on bad credentials/inactive) | `API-02`, `API-03`, `UI-01`                      | Generic 401 response; no account existence leaked      |
| **AC-06** (Password change & complexity rules)          | `UNIT-01`, `API-05`, `API-06`, `UI-02`, `E2E-02` | Complexity validator & flag clear                      |
| **AC-07** (Logout session invalidation)                 | `API-07`, `E2E-01`                               | Cookie expiry + redirection to `/login`                |
| **AC-08** (Requester continuity & migration)            | `API-10`, `REGR-01`, `REGR-02`                   | Preserved tickets/attachments under session auth       |
| **AC-09** (Cross-requester resource isolation)          | `API-11`                                         | 404/403 on unauthorized ticket or attachment access    |
| **AC-10** (IT Staff Ticket Queue view)                  | `API-14`, `UI-03`, `E2E-03`                      | Shared queue with status badges and owners             |
| **AC-11** (Queue search, filter, sort, paginate)        | `API-15`, `API-16`, `API-17`, `UI-03`, `UI-04`   | Multi-filter query engine and pagination               |
| **AC-12** (Claim ticket & reassign owner)               | `API-18`, `API-19`, `UI-05`, `E2E-03`            | Owner assignment (IT Staff/Admin) & `New` -> `Open`    |
| **AC-13** (Update IT Priority)                          | `API-20`, `UI-05`, `E2E-03`                      | IT Priority selector & persistence                     |
| **AC-14** (Status transition matrix & summary)          | `UNIT-02`, `API-21`, `API-22`, `UI-05`, `E2E-03` | Permitted transitions & resolution summary rule        |
| **AC-15** (Public comments stream)                      | `API-24`, `UI-06`, `E2E-03`                      | Shared chronological thread                            |
| **AC-16** (Internal notes confidentiality)              | `API-25`, `UI-06`, `E2E-03`                      | Distinct amber panel; hidden from Requesters           |
| **AC-17** (Requester resolution indication)             | `API-23`                                         | Sets flag without directly closing ticket              |
| **AC-18** (Admin user list & creation)                  | `API-27`, `API-28`, `UI-07`, `E2E-04`            | Admin user portal rendering & creation                 |
| **AC-19** (Duplicate email rejection)                   | `API-29`, `UI-07`                                | 409 Conflict validation                                |
| **AC-20** (Admin safety guards)                         | `API-32`, `API-33`, `UI-08`, `E2E-04`            | Self & sole admin deactivation block                   |
| **AC-21** (Admin password reset)                        | `API-31`, `E2E-04`                               | Initial password regeneration with flag                |
| **AC-22** (Zen Green responsive UI & no overflow)       | `STYLE-01`, `STYLE-02`, `STYLE-03`, `E2E-01..04` | 3-viewport layout compliance and zero overflow         |
| **BR-27** (Safe failure behavior across all HTTP codes) | `API-02`, `API-03`, `API-11`, `API-29`, `API-34` | 401, 403, 404, 409, 500 error sanitization & safe JSON |

---

## 4. Test Execution Instructions

### Backend Vitest & Supertest Suite

```bash
cd server
npx vitest run tests/lab-03/ --fileParallelism=false
```

### Frontend Client Vitest Suite

```bash
cd client
npx vitest run test/lab-03/
```

### Playwright End-to-End Suite

```bash
npx playwright test e2e/lab-03/
```

---

## 5. Required Screenshot Artifacts Checklist (Submission Part 5–9)

All screenshots must be produced into `artifacts/lab-03/screenshots/`:

- `authentication/login-screen.png`
- `authentication/login-invalid-error.png`
- `authentication/login-inactive-error.png`
- `authentication/change-password-screen.png`
- `authentication/change-password-validation.png`
- `authentication/desktop.png`, `tablet.png`, `mobile.png`
- `staff-queue/queue-desktop.png`
- `staff-queue/queue-tablet.png`
- `staff-queue/queue-mobile.png`
- `staff-queue/queue-search-filter.png`
- `staff-queue/queue-assigned-to-me.png`
- `staff-queue/queue-empty-state.png`
- `staff-ticket-detail/ticket-detail-desktop.png`
- `staff-ticket-detail/ticket-claim-reassign.png`
- `staff-ticket-detail/ticket-priority-update.png`
- `staff-ticket-detail/public-comments-thread.png`
- `staff-ticket-detail/internal-notes-panel.png`
- `staff-ticket-detail/requester-resolved-badge.png`
- `staff-ticket-detail/ticket-detail-mobile.png`
- `user-management/user-list-desktop.png`
- `user-management/create-user-modal.png`
- `user-management/edit-user-modal.png`
- `user-management/reset-password-modal.png`
- `user-management/self-deactivation-guard.png`
- `user-management/sole-admin-guard.png`
- `user-management/user-management-mobile.png`
