# Planned Tests & Verification Plan (Lab 04)

TokTickIT: Actions Taken, Dashboards, and Final Regression

## 1. Test Architecture & Directory Structure

```
server/tests/lab-04/
├── actions-taken.api.test.ts      # Actions Taken CRUD, authorization, assignee validation, follow-up rules
├── ticket-workflow.api.test.ts    # Resolution gate enforcement, status transition matrix, claiming, OCC 409
├── requester-dashboard.api.test.ts # Requester personal metrics calculation, time boundaries, isolation
└── staff-dashboard.api.test.ts    # IT Staff & Admin operational metrics, priority breakdown, user stats

client/tests/lab-04/
├── StaffDashboard.test.tsx        # IT Staff KPI cards, drill-down links, urgent tickets list, error retry
├── RequesterDashboard.test.tsx    # Requester KPI cards, drill-down links, recent tickets list, empty states
├── ActionsTaken.test.tsx          # Actions Taken table/cards, create/edit modal, follow-up note toggle
└── TicketWorkflow.test.tsx        # Permitted transitions dropdown, resolution gate blocking modal, OCC alert

e2e/lab-04/
├── actions-taken-flow.spec.ts     # E2E multi-technician Actions Taken creation, editing, and requester view
├── ticket-resolution.spec.ts      # E2E Resolution Gate enforcement (blocked without action, pass with action)
└── dashboards.spec.ts             # E2E Requester, Staff, and Admin dashboard cards and drill-down navigation
```

---

## 2. Planned Test Inventory (Handout Table Format)

| Test ID                                            | Type | Requirement / AC | What It Tests                                                                             | Expected Result                                                           | Automated Test File                                   | Final |
| :------------------------------------------------- | :--- | :--------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :---------------------------------------------------- | :---: |
| **Actions Taken API & Business Rules**             |      |                  |                                                                                           |                                                                           |                                                       |       |
| `API-01`                                           | API  | AC-01, BR-01     | Create valid Action Taken by IT Staff                                                     | 201 Created; saved with `performedById = caller.id`, status `"Completed"` | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-02`                                           | API  | AC-01, BR-02     | Different staff members record Actions Taken on same ticket                               | 201 Created; distinct `performedById` and `assigneeId` persisted          | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-03`                                           | API  | AC-02, BR-06     | Create Action Taken with `isFollowUpRequired = true` but empty `followUpNote`             | 400 Bad Request; validation error returned                                | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-04`                                           | API  | AC-02, BR-06     | Create Action Taken with `isFollowUpRequired = true` and valid `followUpNote`             | 201 Created; follow-up note persisted                                     | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-05`                                           | API  | AC-03, BR-05     | Assign Action Taken to inactive IT Staff user                                             | 400 Bad Request with inactive-assignee error message                      | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-06`                                           | API  | AC-03, BR-05     | Assign Action Taken to user with role `REQUESTER`                                         | 400 Bad Request; only IT Staff/Admin permitted                            | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-07`                                           | API  | AC-04, BR-03     | Requester attempts to create Action Taken (`POST /api/staff/tickets/:id/actions-taken`)   | 403 Forbidden; creation blocked                                           | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-08`                                           | API  | AC-04, BR-03     | Requester retrieves Actions Taken for owned ticket (`GET /api/tickets/:id/actions-taken`) | 200 OK; array of Actions Taken returned                                   | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-09`                                           | API  | AC-05, BR-03     | Requester attempts to retrieve Actions Taken for another user's ticket                    | 404 Not Found (or 403 Forbidden); no data leaked                          | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| `API-10`                                           | API  | FR-06, BR-08     | IT Staff updates existing Action Taken details and transitions status to `"Cancelled"`    | 200 OK; updated fields and status persisted                               | `server/tests/lab-04/actions-taken.api.test.ts`       | Pass  |
| **Ticket Workflow, Resolution Gate & Concurrency** |      |                  |                                                                                           |                                                                           |                                                       |       |
| `API-11`                                           | API  | AC-06, BR-10     | Attempt to resolve ticket with 0 Actions Taken (with resolution summary)                  | 400 Bad Request; Resolution Gate blocks transition                        | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-12`                                           | API  | AC-06, BR-10     | Attempt to resolve ticket with 1 Action Taken but empty resolution summary                | 400 Bad Request; Resolution Gate blocks transition                        | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-13`                                           | API  | AC-07, BR-10     | Resolve ticket with ≥ 1 Action Taken and valid resolution summary                         | 200 OK; status updates to `"Resolved"`, pending flag cleared              | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-14`                                           | API  | AC-08, BR-11     | Requester indicates "Problem Appears Resolved" (`POST /api/tickets/:id/problem-resolved`) | 200 OK; `requesterResolutionPending = true`, status unchanged             | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-15`                                           | API  | AC-09, BR-09     | Transition status from `Resolved` to `Closed`                                             | 200 OK; status updates to `"Closed"`                                      | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-16`                                           | API  | AC-09, BR-09     | Transition status from `CLOSED` to `REOPENED`                                             | 200 OK; status updates to `REOPENED`                                      | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-17`                                           | API  | BR-09            | Illegal status transition attempt (e.g. `NEW` -> `CLOSED`)                                | 400 Bad Request; illegal transition rejected                              | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| `API-18`                                           | API  | AC-14, BR-12     | Concurrent update conflict detection (stale `version` submitted)                          | 409 Conflict with fresh ticket details                                    | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| **Dashboards & Metric Calculations**               |      |                  |                                                                                           |                                                                           |                                                       |       |
| `API-19`                                           | API  | AC-10, BR-13     | Requester Dashboard returns accurate counts for owned tickets only                        | 200 OK; matches DB queries, ignores other requesters' tickets             | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass  |
| `API-20`                                           | API  | AC-10, BR-13     | Requester Dashboard recently resolved metric excludes tickets resolved > 30 days ago      | 200 OK; 30-day time boundary strictly respected                           | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass  |
| `API-21`                                           | API  | AC-10, BR-13     | Requester Dashboard recent tickets contains top 5 ordered by `updatedAt DESC`             | 200 OK; sorted correctly with status and timestamps                       | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass  |
| `API-22`                                           | API  | AC-11, BR-14     | IT Staff Dashboard calculates total queue, unassigned, and my assigned counts             | 200 OK; matches live database ticket ownership counts                     | `server/tests/lab-04/staff-dashboard.api.test.ts`     | Pass  |
| `API-23`                                           | API  | AC-11, BR-14     | IT Staff Dashboard returns correct status and priority breakdown maps                     | 200 OK; all active tickets tallied by category                            | `server/tests/lab-04/staff-dashboard.api.test.ts`     | Pass  |
| `API-24`                                           | API  | AC-11, BR-14     | IT Staff Dashboard urgent tickets list returns Critical/High tickets                      | 200 OK; ordered by urgency, max 5 records                                 | `server/tests/lab-04/staff-dashboard.api.test.ts`     | Pass  |
| `API-25`                                           | API  | AC-12, BR-15     | Administrator Dashboard returns operational metrics + user account counts                 | 200 OK; active user counts by role verified                               | `server/tests/lab-04/staff-dashboard.api.test.ts`     | Pass  |
| `API-26`                                           | API  | BR-03, FR-07     | Non-admin user attempts access to `/api/admin/dashboard`                                  | 403 Forbidden                                                             | `server/tests/lab-04/staff-dashboard.api.test.ts`     | Pass  |
| `API-27`                                           | API  | BR-09            | Claiming ticket in `New` status via `PATCH /api/staff/tickets/:id/owner`                  | 200 OK; status automatically transitions from `New` to `Open`             | `server/tests/lab-04/ticket-workflow.api.test.ts`     | Pass  |
| **Client UI Component Tests**                      |      |                  |                                                                                           |                                                                           |                                                       |       |
| `UI-01`                                            | UI   | AC-11, AC-13     | IT Staff Dashboard renders metric cards and drill-down links                              | Metric cards render correct counts; clicks invoke queue filter            | `client/tests/lab-04/StaffDashboard.test.tsx`         | Pass  |
| `UI-02`                                            | UI   | AC-11            | IT Staff Dashboard renders urgent tickets table and empty state                           | List displays urgent tickets; shows empty banner when count is 0          | `client/tests/lab-04/StaffDashboard.test.tsx`         | Pass  |
| `UI-03`                                            | UI   | AC-10, AC-13     | Requester Dashboard renders personal metric cards and recent tickets                      | Shows personal metrics; drill-down links to My Tickets                    | `client/tests/lab-04/RequesterDashboard.test.tsx`     | Pass  |
| `UI-04`                                            | UI   | AC-01, AC-02     | Actions Taken panel renders items, create modal, and follow-up toggle                     | Form validates required fields; conditionally requires note               | `client/tests/lab-04/ActionsTaken.test.tsx`           | Pass  |
| `UI-05`                                            | UI   | AC-04            | Requester viewing Ticket Detail sees Actions Taken in read-only mode                      | Items displayed; add/edit buttons omitted from DOM                        | `client/tests/lab-04/ActionsTaken.test.tsx`           | Pass  |
| `UI-06`                                            | UI   | AC-06, AC-07     | Ticket Detail Resolution Gate modal blocks resolve when Actions Taken = 0                 | Displays warning alert; enables confirm button only when actions exist    | `client/tests/lab-04/TicketWorkflow.test.tsx`         | Pass  |
| `UI-07`                                            | UI   | AC-14            | Optimistic concurrency conflict alert displays when 409 received                          | Shows non-intrusive warning banner and refreshes ticket data              | `client/tests/lab-04/TicketWorkflow.test.tsx`         | Pass  |
| **End-to-End Playwright Tests**                    |      |                  |                                                                                           |                                                                           |                                                       |       |
| `E2E-01`                                           | E2E  | AC-01..05        | Full Actions Taken lifecycle across multiple staff and requester view                     | Staff A adds action; Staff B adds follow-up; Requester views              | `e2e/lab-04/actions-taken-flow.spec.ts`               | Pass  |
| `E2E-02`                                           | E2E  | AC-06..09        | Complete Resolution Gate and lifecycle flow from New to Closed                            | Blocked at 0 actions; resolves after action added; closes cleanly         | `e2e/lab-04/ticket-resolution.spec.ts`                | Pass  |
| `E2E-03`                                           | E2E  | AC-10..13        | Requester, IT Staff, and Admin dashboard navigation and drill-down                        | Cards show correct numbers; clicking card filters target table            | `e2e/lab-04/dashboards.spec.ts`                       | Pass  |
| **Regression & Hardening Verification**            |      |                  |                                                                                           |                                                                           |                                                       |       |
| `REGR-01`                                          | Regr | AC-15            | Full Lab 1, 2, and 3 server suite execution                                               | All baseline server regression tests pass 100% green                      | `server/test/lab-03/*`, `server/test/lab-02/*`        | Pass  |
| `REGR-02`                                          | Regr | AC-15            | Full Lab 1, 2, and 3 client suite execution                                               | All baseline client regression tests pass 100% green                      | `client/test/lab-03/*`, `client/test/lab-02/*`        | Pass  |
| `REGR-03`                                          | Regr | AC-15            | Full Lab 3 E2E test suites execution                                                      | All baseline Lab 3 E2E suites pass 100% green                             | `e2e/lab-03/*`                                        | Pass  |

---

## 3. Acceptance Criteria to Test Mapping Matrix

| Acceptance Criterion                    | Primary Automated Test(s)                                | Verification Scope                                                  |
| :-------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------ |
| **AC-01** (Action Taken Creation)       | `API-01`, `UI-04`, `E2E-01`                              | Auto-performed attribution, valid storage, default completed status |
| **AC-02** (Follow-Up Coupling)          | `API-03`, `API-04`, `UI-04`                              | Follow-up note mandatory when required is true                      |
| **AC-03** (Inactive Assignee Rejection) | `API-05`, `API-06`                                       | Inactive staff and requester assignees rejected with 400            |
| **AC-04** (Requester Read-Only)         | `API-07`, `API-08`, `UI-05`, `E2E-01`                    | Requester sees actions on owned ticket; write actions blocked       |
| **AC-05** (Cross-Requester Isolation)   | `API-09`                                                 | Accessing another requester's ticket actions returns 404/403        |
| **AC-06** (Resolution Gate - Blocked)   | `API-11`, `API-12`, `UI-06`, `E2E-02`                    | Transition to Resolved fails if Actions Taken count = 0             |
| **AC-07** (Resolution Gate - Success)   | `API-13`, `UI-06`, `E2E-02`                              | Transition to Resolved succeeds with action and summary             |
| **AC-08** (Advisory Resolution)         | `API-14`, `E2E-02`                                       | Requester resolution indicator sets flag without changing status    |
| **AC-09** (Status Closure & Reopen)     | `API-15`, `API-16`, `API-27`, `E2E-02`                   | Permitted transitions Closed, Reopened, and Claiming per BR-09      |
| **AC-10** (Requester Dashboard)         | `API-19`, `API-20`, `API-21`, `UI-03`, `E2E-03`          | Personal metrics and recent tickets isolated to caller              |
| **AC-11** (IT Staff Dashboard)          | `API-22`, `API-23`, `API-24`, `UI-01`, `UI-02`, `E2E-03` | Operational metrics, status/priority breakdown, urgent list         |
| **AC-12** (Administrator Dashboard)     | `API-25`, `API-26`, `E2E-03`                             | Combined operational queue and user account statistics              |
| **AC-13** (Dashboard Drill-Down)        | `UI-01`, `UI-03`, `E2E-03`                               | Clicking card navigates to queue pre-filtered by metric query       |
| **AC-14** (Optimistic Concurrency)      | `API-18`, `UI-07`                                        | Stale update returns 409 Conflict; UI refreshes gracefully          |
| **AC-15** (Regression Integrity)        | `REGR-01`, `REGR-02`, `REGR-03`                          | 100% passing results across all baseline legacy test suites         |
