# Lab 4 Sprint Engineering Specification

TokTickIT: Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal

Complete the core TokTickIT service-desk workflow by introducing an auditable child work-tracking model ("Actions Taken") under each Ticket, enforcing the finalized Ticket lifecycle and resolution gates, providing role-appropriate operational dashboards for Requesters, IT Staff, and Administrators, and hardening the entire full-stack system against concurrent modifications and regression across Labs 1 through 3.

---

## 2. Stakeholder Request Interpretation

The IT Service Desk organization has established core identity management and communication channels (Public Comments and Internal Notes). However, management and technicians still lack a structured mechanism to record, plan, and verify the physical and technical labor performed on individual tickets, as well as high-level visibility into desk operations.

1. **Actions Taken Tracking**:
   - Each Ticket requires an auditable sub-entity ("Actions Taken") recording individual steps of work performed.
   - Each Action Taken must track: Action Date/Time, Action Description, Result, Performed by (auto-captured from session), Assignee (the technician responsible), Follow-Up Required flag, Follow-Up Note (strictly required if follow-up is flagged), and Attachment Notes (referencing supporting files or external image assets).
   - The primary Ticket Owner coordinates the Ticket as a whole, but different IT Staff members may perform and record Actions Taken on the same ticket.
   - Requesters must be able to view Actions Taken on their own tickets for transparency, but are strictly prohibited from creating, modifying, or deleting them.
2. **Ticket Workflow & Resolution Gate**:
   - The Ticket status lifecycle (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`) must be strictly finalized and enforced on the server.
   - Requesters can indicate that their problem "Appears Resolved", but this indication is strictly advisory and cannot directly change the ticket status to `Resolved` or `Closed`.
   - Formal resolution is strictly reserved for IT Staff and Administrators. To transition a ticket to `Resolved`, the server must enforce a two-part Resolution Gate:
     1. A non-empty `resolutionSummary` (1–1,000 characters).
     2. At least one recorded Action Taken line documenting the work done.
3. **Role-Appropriate Dashboards**:
   - **Requester Dashboard**: High-level personal overview summarizing open tickets, tickets waiting for requester input, recently resolved tickets, and total closed tickets, with quick links to create tickets and inspect details.
   - **IT Staff Dashboard**: Operational triage hub showing unassigned tickets, tickets assigned to the logged-in staff member, breakdown by status and IT priority, urgent/critical tickets, and recently updated tickets with one-click drill-down to filtered queue views.
   - **Administrator Dashboard**: Reuses the IT Staff operational dashboard and augments it with concise user account statistics (active counts for Requesters, IT Staff, and Administrators).
4. **Hardening & Concurrency Protection**:
   - Multiple IT Staff members may view or update the same ticket simultaneously. The system must implement Optimistic Concurrency Control (OCC) using a version counter or timestamp match to prevent blind overwrites and stale updates.
   - The complete application must preserve 100% regression compatibility with all Lab 1, Lab 2, and Lab 3 features, adhering strictly to the Zen Green design system across desktop, tablet, and mobile viewports.

---

## 3. Scope

### Included in Sprint 4

- **Actions Taken Core Model & Workflow**:
  - Relational PostgreSQL table and Prisma model `ActionTaken` linked 1-to-many to `Ticket`.
  - Capturing `actionDateTime`, `description`, `result`, `performedById` (auto-bound session user), `assigneeId` (assigned technician), `isFollowUpRequired`, `followUpNote`, `attachmentNotes`, and action status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - Validation: Follow-up note mandatory when `isFollowUpRequired = true`; assignee must be an active IT Staff or Administrator.
  - Server-side RBAC: Requesters have read-only visibility for owned tickets; IT Staff and Administrators have full create and update permissions.
- **Finalized Ticket Status Engine & Resolution Gate**:
  - Complete server-side state transition matrix for all 8 statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
  - Enforcement of Resolution Gate: Transition to `Resolved` requires both non-empty `resolutionSummary` and ≥ 1 recorded Action Taken.
  - Advisory Requester Resolution Indication (`requesterResolutionPending = true`) without status alteration.
- **Optimistic Concurrency Control (OCC)**:
  - Ticket mutation endpoints validate an incoming `version` integer (or `updatedAt` ISO string).
  - Stale mutations return `HTTP 409 Conflict` with clear error messaging and fresh ticket state, preventing lost updates.
- **Operational Dashboards**:
  - Requester Dashboard with personal metrics (Open, Waiting for Requester, Recently Resolved, Closed) and recent ticket list.
  - IT Staff Dashboard with operational metrics (Unassigned, Assigned to Me, Status distribution, Priority breakdown, Urgent list).
  - Administrator Dashboard combining operational metrics with active user account counts.
  - Interactive drill-down navigation from dashboard cards directly to pre-filtered Queue / My Tickets views.
- **Database Evolution & Backfill**:
  - Prisma migration introducing `ActionTaken` model and `version` column on `Ticket`.
  - Idempotent seed data supporting tickets with zero, one, and multiple Actions Taken across all statuses and ownership states.
  - Backward-compatible handling of existing legacy tickets without Actions Taken.
- **Zen Green UI Integration & Responsive Polish**:
  - Actions Taken list/table and modal dialogs on Ticket Detail.
  - Dashboard screens for Requester and IT Staff with responsive layouts (Desktop, Tablet, Mobile).
  - Minimum 44px touch targets on mobile viewports (<768px) and zero horizontal overflow.
  - Complete regression verification across authentication, attachments, comments, notes, and user administration.

### Explicitly Excluded from Sprint 4

- Automatic SLA clocks, countdown timers, escalation warning banners, and breach notifications.
- Email, SMS, LINE, Webhook, push, or external notification services.
- Inventory consumption, spare parts management, procurement, or asset tracking.
- Timesheet billing, hourly rate accounting, payroll, or labor cost computations.
- Multi-level hierarchical approval workflows and cryptographic digital signatures.
- Advanced BI tools, ad-hoc OLAP query builders, CSV/Excel report warehouse exporters.
- Multi-tenant organizational partitioning, department billing codes, or cloud-scale clustering.

---

## 4. Functional Requirements

### 4.1 Actions Taken Management

- **FR-01**: The system shall allow permitted IT Staff and Administrators to record one or more Actions Taken under any accessible Ticket.
- **FR-02**: The system shall automatically bind the authenticated caller's identity as the `performedBy` actor when creating an Action Taken.
- **FR-03**: The system shall allow the creator or updater of an Action Taken to designate an `assignee` from among active IT Staff or Administrator users.
- **FR-04**: The system shall require non-empty text for `description` and `result` (1–1,000 characters).
- **FR-05**: The system shall require a non-empty `followUpNote` (1–1,000 characters) whenever `isFollowUpRequired` is set to `true`.
- **FR-06**: The system shall allow IT Staff and Administrators to update existing Actions Taken details and update their status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **FR-07**: The system shall provide Requesters with read-only access to all Actions Taken records on tickets they own, while completely blocking Requesters from creating, modifying, or deleting Actions Taken.

### 4.2 Ticket Status & Resolution Gate

- **FR-08**: The system shall enforce permitted ticket status transitions according to the finalized state transition matrix on the server, rejecting illegal transitions with `HTTP 400 Bad Request`.
- **FR-09**: The system shall strictly prevent transition of a ticket to `Resolved` unless the ticket contains at least one recorded Action Taken line and a non-empty `resolutionSummary`.
- **FR-10**: The system shall preserve the advisory "Problem Appears Resolved" button for Requesters, setting `requesterResolutionPending = true` without modifying `currentStatus`.
- **FR-11**: The system shall allow IT Staff or Administrators to transition a ticket from `Resolved` to `Closed` (final closure) or `Reopened` (if the issue recurs).

### 4.3 Dashboards & Analytics

- **FR-12**: The system shall provide an authenticated endpoint (`GET /api/requester/dashboard`) returning personal metrics and recent tickets for the logged-in Requester.
- **FR-13**: The system shall provide an authenticated endpoint (`GET /api/staff/dashboard`) returning operational ticket metrics, priority distribution, unassigned counts, and urgent tickets for IT Staff.
- **FR-14**: The system shall provide an Administrator dashboard endpoint (`GET /api/admin/dashboard`) returning operational metrics combined with user account counts by role.
- **FR-15**: The system shall enable one-click drill-down navigation from dashboard metric cards directly to the Ticket Queue or My Tickets view with active filter parameters applied.

### 4.4 Concurrency & Product Hardening

- **FR-16**: The system shall detect concurrent updates on tickets using an optimistic concurrency control token (`version` integer) supplied in mutation requests, rejecting stale updates with `HTTP 409 Conflict`.
- **FR-17**: The system shall return standard, sanitized error responses across all new endpoints without leaking sensitive server internals or stack traces.
- **FR-18**: The system shall maintain 100% regression compatibility with all Lab 1, 2, and 3 functional capabilities.

---

## 5. Business Rules & Authorization Matrix

### 5.1 Actions Taken Rules (Continuing from Handout BR-01 & BR-02)

- **BR-01**: **Single Ticket Parentage**: An Action Taken belongs to exactly one Ticket (`ticketId` is mandatory, immutable, and foreign-keyed to `Ticket.id`).
- **BR-02**: **Distributed Execution**: The primary Ticket Owner coordinates the Ticket as a whole, but any active IT Staff member or Administrator may take action and record an Action Taken line on that ticket.
- **BR-03**: **Role Authorization for Actions Taken**:
  - `Requester`: View-only for owned tickets (`ticket.requesterId == req.user.id`). Creation, editing, or status changes are strictly rejected with `HTTP 403 Forbidden`.
  - `IT Staff`: Can create, view, edit, and update status of Actions Taken on any accessible ticket.
  - `Administrator`: Full creation, modification, and inspection permissions.
- **BR-04**: **Actor Auto-Attribution**: The `performedById` field is automatically derived from the authenticated session user (`req.user.id`) upon creation. Clients cannot forge or override this attribute.
- **BR-05**: **Assignee Governance**:
  - An Action Taken may have an assigned technician (`assigneeId`), defaulting to `performedById` if omitted.
  - If specified, `assigneeId` must reference an active user with role `IT_STAFF` or `ADMINISTRATOR`. Assigning to an inactive user or a user with role `REQUESTER` is rejected with `HTTP 400 Bad Request`.
- **BR-06**: **Follow-Up Coupling**:
  - `isFollowUpRequired` is a Boolean flag (default `false`).
  - When `isFollowUpRequired` is `true`, `followUpNote` must be provided as a non-empty string between 1 and 1,000 characters.
  - When `isFollowUpRequired` is `false`, `followUpNote` is optional and cleared or stored as `null`.
- **BR-07**: **Attachment Notes**:
  - `attachmentNotes` is an optional text field (max 500 characters) used to record references to external asset identifiers, physical diagrams, or file context.
- **BR-08**: **Action Taken Lifecycle**:
  - Permitted Action Taken statuses: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
  - Actions Taken default to `COMPLETED` when recorded as immediate historical work, or `PENDING` when scheduled as upcoming tasks.

### 5.2 Final Ticket Status Transition Matrix & Resolution Gate

- **BR-09**: **Final Ticket Status Transition Matrix**:

| Current Status          | Permitted Next Statuses                                         | Permitted Roles | Required Conditions / Payload                     |
| :---------------------- | :-------------------------------------------------------------- | :-------------- | :------------------------------------------------ |
| `New`                   | `Open`, `In Progress`, `Cancelled`                              | IT Staff, Admin | Claiming sets status to `Open` automatically      |
| `Open`                  | `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled` | IT Staff, Admin | —                                                 |
| `In Progress`           | `Waiting for Requester`, `Resolved`, `Cancelled`                | IT Staff, Admin | Transition to `Resolved` enforces Resolution Gate |
| `Waiting for Requester` | `In Progress`, `Resolved`, `Cancelled`                          | IT Staff, Admin | Transition to `Resolved` enforces Resolution Gate |
| `Resolved`              | `Closed`, `Reopened`                                            | IT Staff, Admin | Requester advisory confirmation permitted         |
| `Closed`                | `Reopened`                                                      | IT Staff, Admin | Reopens ticket back to active workflow            |
| `Reopened`              | `In Progress`, `Resolved`, `Cancelled`                          | IT Staff, Admin | Transition to `Resolved` enforces Resolution Gate |
| `Cancelled`             | _(Terminal State - No transitions permitted)_                   | None            | Sealed record                                     |

- **BR-10**: **Server-Enforced Resolution Gate**:
  Transitioning any ticket to `Resolved` requires all of the following conditions:
  1. A non-empty `resolutionSummary` string (1–1,000 characters).
  2. At least one recorded `ActionTaken` record belonging to the ticket.
     If either condition is unmet, the server rejects the request with `HTTP 400 Bad Request` and message `"Cannot resolve ticket: At least one Action Taken and a non-empty resolution summary are required."`
- **BR-11**: **Advisory Resolution Indication**:
  When a Requester clicks "Problem Appears Resolved", the server sets `ticket.requesterResolutionPending = true` and appends a system-authored Public Comment. The `currentStatus` remains unchanged (e.g. `Waiting for Requester` or `In Progress`) until formally reviewed and transitioned by IT Staff.

### 5.3 Optimistic Concurrency Control (OCC)

- **BR-12**: **Stale Update Rejection**:
  - Every Ticket maintains an integer `version` attribute (incremented on each successful mutation) and an `updatedAt` timestamp.
  - When an IT Staff or Administrator user submits an operational mutation (`PATCH /api/staff/tickets/:id/*`), the request must include the client's `lastKnownVersion` (or `lastKnownUpdatedAt`).
  - If the database `version` does not match the submitted version, the update is aborted, and the server responds with `HTTP 409 Conflict` containing the fresh ticket state.

### 5.4 Dashboard Metric Definitions & Boundaries

- **BR-13**: **Requester Dashboard Calculations**:
  1. `openTicketsCount`: Count of tickets where `requesterId = user.id` AND `currentStatus IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')`.
  2. `waitingForRequesterCount`: Count of tickets where `requesterId = user.id` AND `currentStatus = 'WAITING_FOR_REQUESTER'`.
  3. `recentlyResolvedCount`: Count of tickets where `requesterId = user.id` AND `currentStatus = 'RESOLVED'` AND `updatedAt >= NOW() - INTERVAL '30 DAYS'`.
  4. `closedTicketsCount`: Count of tickets where `requesterId = user.id` AND `currentStatus = 'CLOSED'`.
  5. `recentTickets`: Top 5 tickets where `requesterId = user.id`, ordered by `updatedAt DESC`.
- **BR-14**: **IT Staff Dashboard Calculations**:
  1. `unassignedCount`: Count of tickets where `ticketOwnerId IS NULL` AND `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.
  2. `myAssignedCount`: Count of tickets where `ticketOwnerId = user.id` AND `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.
  3. `statusBreakdown`: Key-value map of counts for active statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`).
  4. `priorityBreakdown`: Key-value map of counts for active tickets grouped by `itPriority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  5. `urgentTickets`: Tickets where `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')` AND `itPriority IN ('CRITICAL', 'HIGH')`, ordered by `itPriority ASC, createdAt ASC`, limit 5.
  6. `recentUpdatedTickets`: Top 5 tickets across the queue ordered by `updatedAt DESC`.
- **BR-15**: **Administrator Dashboard Calculations**:
  - Includes all IT Staff Dashboard metrics plus:
    1. `activeUsersCount`: Count of `User` where `isActive = true`.
    2. `activeRequestersCount`: Count of `User` where `role = 'REQUESTER'` AND `isActive = true`.
    3. `activeStaffCount`: Count of `User` where `role = 'IT_STAFF'` AND `isActive = true`.
    4. `activeAdminsCount`: Count of `User` where `role = 'ADMINISTRATOR'` AND `isActive = true`.

### 5.5 Complete Authorization Matrix

| Operation / Feature                         | Requester | IT Staff | Admin | Rule / Ownership Condition                                      |
| :------------------------------------------ | :-------: | :------: | :---: | :-------------------------------------------------------------- |
| **View Actions Taken List**                 |   Owner   |   Yes    |  Yes  | Requester read-only for owned tickets; IT Staff/Admin for all.  |
| **Create Action Taken**                     |  **No**   |   Yes    |  Yes  | Restricted to IT Staff and Admin; `performedById` auto-bound.   |
| **Update Action Taken**                     |  **No**   |   Yes    |  Yes  | Restricted to IT Staff and Admin.                               |
| **Assign Action Taken**                     |  **No**   |   Yes    |  Yes  | Target assignee must be active IT Staff or Administrator.       |
| **View Requester Dashboard**                |    Yes    |    No    |  No   | Caller's own metrics only.                                      |
| **View IT Staff Dashboard**                 |    No     |   Yes    |  Yes  | Operational queue metrics.                                      |
| **View Administrator Dashboard**            |    No     |    No    |  Yes  | Operational metrics + user management statistics.               |
| **Transition Ticket Status**                |    No     |   Yes    |  Yes  | Must satisfy BR-09 matrix; `Resolved` enforces Resolution Gate. |
| **Indicate Problem Appears Resolved**       |   Owner   |    No    |  No   | Advisory flag only (`requesterResolutionPending = true`).       |
| **Claim / Reassign Ticket**                 |    No     |   Yes    |  Yes  | Active IT Staff or Administrator assignee only.                 |
| **Update IT Priority**                      |    No     |   Yes    |  Yes  | Values: Low, Medium, High, Critical.                            |
| **View / Add Public Comments**              |   Owner   |   Yes    |  Yes  | Shared transparency thread.                                     |
| **View / Add Internal Notes**               |  **No**   |   Yes    |  Yes  | Strictly confidential for IT Staff and Administrator.           |
| **Attachments (Upload, View, Soft-Remove)** |   Owner   |   Yes    |  Yes  | Existing Lab 2 & 3 rules preserved.                             |
| **User Management (`/admin/users`)**        |    No     |    No    |  Yes  | Existing Lab 3 administrator safety guards preserved.           |

---

## 6. UI Specification Summary

All Sprint 4 screens strictly adhere to the Zen Green design system (`#006B3C` Primary, `#0B7A46` Secondary, `#EAF6EF` Pale Accent, `#FFFFFF` Surface, `#F5F7F6` Canvas Background):

1. **Dashboard Navigation**:
   - Role-adaptive top navigation bar:
     - `Requester`: **Dashboard** | **My Tickets** | **Create Ticket** | Profile Dropdown
     - `IT Staff`: **Dashboard** | **Ticket Queue** | **Create Ticket** | Profile Dropdown
     - `Administrator`: **Dashboard** | **Ticket Queue** | **Users** | Profile Dropdown
   - Active navigation item clearly indicated with solid white text and underline bar.
2. **Dashboard Layouts**:
   - Concise KPI summary cards at top displaying integer metric value, descriptive subtitle, and accessible click target linking to pre-filtered list.
   - Dual-card / split-grid lower section: "Recent Tickets" table/cards on left, "Quick Actions" panel and Priority breakdown on right.
   - Responsive reflow: 4-column cards on Desktop (≥992px), 2-column cards on Tablet (768px–991px), stacked single-column on Mobile (<768px).
3. **Actions Taken UI on Ticket Detail**:
   - Positioned as a dedicated first-class panel/tab within Ticket Detail.
   - Action item list displaying: Date/time badge, Description, Result, Performed by staff pill, Assignee pill, Follow-Up indicator badge, and Follow-Up Note alert callout.
   - "+ Add Action Taken" primary button opens modal dialog with form validation.
   - Clean read-only presentation for Requesters without "+ Add Action Taken" or edit buttons.
4. **Ticket Resolution Gate Feedback**:
   - Status dropdown in Ticket Detail guides the user. Selecting `Resolved` opens a confirmation modal requiring non-empty `resolutionSummary`.
   - If the ticket has 0 Actions Taken, the modal blocks submission with a clear warning: _"Cannot resolve ticket: Please record at least one Action Taken before resolving."_
5. **Optimistic Concurrency Feedback**:
   - When a 409 Conflict response is received, the UI displays a dismissible warning toast/banner: _"This ticket was modified by another user. Reloading latest state..."_ and safely refreshes without crashing.

---

## 7. Data Changes & Migration Decisions

### 7.1 Schema Changes

```prisma
enum ActionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ActionTaken {
  id                 Int          @id @default(autoincrement())
  ticketId           Int
  ticket             Ticket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  actionDateTime     DateTime     @default(now())
  description        String       @db.VarChar(1000)
  result             String       @db.VarChar(1000)

  performedById      Int
  performedBy        User         @relation("ActionTakenAuthor", fields: [performedById], references: [id], onDelete: Restrict)

  assigneeId         Int?
  assignee           User?        @relation("ActionTakenAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  status             ActionStatus @default(COMPLETED)

  isFollowUpRequired Boolean      @default(false)
  followUpNote       String?      @db.VarChar(1000)
  attachmentNotes    String?      @db.VarChar(500)

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([ticketId, actionDateTime])
  @@index([assigneeId, status])
}
```

- **Ticket Model Update**:
  - Add `actionsTaken ActionTaken[]` relation.
  - Add `version Int @default(1)` for Optimistic Concurrency Control.

### 7.2 Database Design Justifications

1. **Dedicated Relational Model vs. JSON Blob**:
   _Decision_: Model `ActionTaken` as a separate normalized relational table with strict foreign keys (`ticketId -> Ticket.id`, `performedById -> User.id`, `assigneeId -> User.id`) instead of an unstructured JSON array on `Ticket`.
   _Justification_: A service-desk audit trail requires strict referential integrity. If an IT Staff user is updated or deactivated, relations remain auditable. Furthermore, normalized records allow indexing by `[ticketId, actionDateTime]` and `[assigneeId, status]`, enabling fast querying for staff dashboard workload calculations without parsing JSON payloads.
2. **Version-Based Optimistic Concurrency Control**:
   _Decision_: Implement an integer `version` column on `Ticket` that increments monotonically on every mutation.
   _Justification_: In an enterprise multi-technician environment, two staff members might claim or resolve the same ticket simultaneously. Pessimistic locking (SELECT FOR UPDATE) degrades database throughput and creates deadlock risks in HTTP REST architectures. Optimistic concurrency control via a `version` field detects collisions cleanly at commit time, guarantees zero lost updates, and allows the client to gracefully prompt the user with fresh server state.

### 7.3 Migration & Backfill Strategy

- **Zero Data Loss Guarantee**: The migration adds a new table `ActionTaken` and adds the nullable/defaulted `version` column to `Ticket`. Zero existing rows or columns in `User`, `Ticket`, `Attachment`, `PublicComment`, or `InternalNote` are dropped.
- **Legacy Ticket Handling**:
  - Existing tickets will have 0 Actions Taken.
  - Legacy tickets currently in `RESOLVED` or `CLOSED` status remain valid and queryable.
  - Legacy open tickets transitioning to `RESOLVED` in Sprint 4 will require adding an Action Taken before resolution can be completed.
  - Dashboard counts correctly aggregate both legacy and new tickets.

---

## 8. REST API Contract Summary

| Method  | Endpoint                                         | Access Role                     | Description                                                                |
| :------ | :----------------------------------------------- | :------------------------------ | :------------------------------------------------------------------------- |
| `GET`   | `/api/tickets/:id/actions-taken`                 | Requester (Owner), Staff, Admin | List all Actions Taken for a ticket in chronological order                 |
| `POST`  | `/api/staff/tickets/:id/actions-taken`           | IT Staff, Admin                 | Create a new Action Taken line under the ticket                            |
| `GET`   | `/api/staff/tickets/:id/actions-taken/:actionId` | IT Staff, Admin                 | Retrieve a single Action Taken item                                        |
| `PATCH` | `/api/staff/tickets/:id/actions-taken/:actionId` | IT Staff, Admin                 | Update Action Taken details or status                                      |
| `GET`   | `/api/requester/dashboard`                       | Requester                       | Retrieve personal dashboard metrics and top 5 recent tickets               |
| `GET`   | `/api/staff/dashboard`                           | IT Staff, Admin                 | Retrieve operational queue metrics, priority breakdown, and urgent tickets |
| `GET`   | `/api/admin/dashboard`                           | Admin                           | Retrieve operational metrics combined with user account stats              |
| `PATCH` | `/api/staff/tickets/:id/status`                  | IT Staff, Admin                 | Advance ticket status (enforces Resolution Gate and OCC `version`)         |
| `PATCH` | `/api/staff/tickets/:id/owner`                   | IT Staff, Admin                 | Claim or reassign ticket owner (enforces OCC `version`)                    |
| `PATCH` | `/api/staff/tickets/:id/priority`                | IT Staff, Admin                 | Update IT Priority (enforces OCC `version`)                                |

---

## 9. Acceptance Criteria (AC-01 Style Given-When-Then)

### Actions Taken Lifecycle

- **AC-01**: **Valid Action Taken Creation**:
  _Given_ an authenticated IT Staff user and valid input data (`description`, `result`, `isFollowUpRequired = false`),
  _When_ the user submits `POST /api/staff/tickets/:id/actions-taken`,
  _Then_ the system creates an `ActionTaken` linked to the ticket with `performedById` set to the caller, defaults `status = COMPLETED`, and returns `HTTP 201 Created`.
- **AC-02**: **Follow-Up Coupling Validation**:
  _Given_ an authenticated IT Staff user submitting an Action Taken with `isFollowUpRequired = true` but an empty `followUpNote`,
  _When_ `POST /api/staff/tickets/:id/actions-taken` is called,
  _Then_ the system rejects the submission with `HTTP 400 Bad Request` and error `"Follow-up note is required when follow-up is requested."`
- **AC-03**: **Inactive Assignee Rejection**:
  _Given_ an IT Staff user attempting to assign an Action Taken to a deactivated user or a user with role `REQUESTER`,
  _When_ `POST /api/staff/tickets/:id/actions-taken` is executed,
  _Then_ the request is rejected with `HTTP 400 Bad Request` and error `"Target assignee must be an active IT Staff or Administrator user."`
- **AC-04**: **Requester Read-Only Authorization**:
  _Given_ an authenticated Requester viewing their owned ticket,
  _When_ `GET /api/tickets/:id/actions-taken` is requested,
  _Then_ the system returns all Actions Taken lines (`HTTP 200 OK`).
  _When_ the Requester attempts `POST /api/staff/tickets/:id/actions-taken`,
  _Then_ the server returns `HTTP 403 Forbidden`.
- **AC-05**: **Cross-Requester Isolation**:
  _Given_ an authenticated Requester A,
  _When_ attempting to access `GET /api/tickets/:id/actions-taken` for a ticket owned by Requester B,
  _Then_ the system returns `HTTP 404 Not Found` (or `HTTP 403 Forbidden`) without leaking the existence of the ticket.

### Ticket Status Workflow & Resolution Gate

- **AC-06**: **Resolution Gate - Missing Action Taken**:
  _Given_ a ticket in `In Progress` status that has zero recorded Actions Taken,
  _When_ an IT Staff member attempts to transition status to `Resolved` with a non-empty `resolutionSummary`,
  _Then_ the server rejects the transition with `HTTP 400 Bad Request` and message `"Cannot resolve ticket: At least one Action Taken and a non-empty resolution summary are required."`
- **AC-07**: **Resolution Gate - Successful Resolution**:
  _Given_ a ticket in `In Progress` status that has at least one recorded Action Taken,
  _When_ an IT Staff member transitions status to `Resolved` with a valid `resolutionSummary`,
  _Then_ the server updates status to `RESOLVED`, clears `requesterResolutionPending`, and returns `HTTP 200 OK`.
- **AC-08**: **Advisory Requester Resolution**:
  _Given_ an authenticated Requester viewing their open ticket,
  _When_ the Requester clicks "Problem Appears Resolved",
  _Then_ `requesterResolutionPending` is set to `true`, a Public Comment is recorded, and the ticket's `currentStatus` remains unchanged.
- **AC-09**: **Final Status Closure and Reopening**:
  _Given_ a ticket in `Resolved` status,
  _When_ an IT Staff user transitions to `Closed`,
  _Then_ status advances to `CLOSED` (`HTTP 200 OK`).
  _When_ an IT Staff user transitions from `Closed` to `Reopened`,
  _Then_ status transitions to `REOPENED` (`HTTP 200 OK`).

### Dashboards & Calculations

- **AC-10**: **Requester Dashboard Isolation & Counts**:
  _Given_ an authenticated Requester,
  _When_ `GET /api/requester/dashboard` is requested,
  _Then_ the server returns accurate counts for Open, Waiting for Requester, Recently Resolved, and Closed tickets matching only the caller's `id`, plus top 5 recent tickets.
- **AC-11**: **IT Staff Dashboard Operational Counts**:
  _Given_ an authenticated IT Staff user,
  _When_ `GET /api/staff/dashboard` is requested,
  _Then_ the response contains accurate counts for Unassigned tickets, My Assigned tickets, status breakdown, and priority breakdown matching database records.
- **AC-12**: **Administrator Dashboard Aggregation**:
  _Given_ an authenticated Administrator,
  _When_ `GET /api/admin/dashboard` is requested,
  _Then_ the response contains operational queue metrics plus active user counts categorized by role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **AC-13**: **Dashboard Drill-Down Integrity**:
  _Given_ any dashboard metric card (e.g. "Unassigned Tickets = 14"),
  _When_ the user clicks the card,
  _Then_ the client navigates to the Ticket Queue with filter parameter `assigned=unassigned` pre-selected and matching tickets rendered.

### Concurrency & Hardening

- **AC-14**: **Optimistic Concurrency Detection**:
  _Given_ two staff users editing Ticket #101 at version 3,
  _When_ User A successfully updates the ticket (incrementing version to 4),
  _And_ User B subsequently submits an update with version 3,
  _Then_ User B's request is rejected with `HTTP 409 Conflict` and the updated ticket data is returned for client-side reconciliation.
- **AC-15**: **Zero Regression Across Labs 1–3**:
  _Given_ the complete TokTickIT test suite,
  _When_ executed against the upgraded server and client,
  _Then_ all 196 existing server tests, 74 client tests, and E2E suites pass 100% green without modification to business contracts.

---

## 10. Product Definition of Done (DoD)

1. **Specification & Contracts**: Complete `docs/lab-04/` specification, ui-spec, api-spec, and tests documents reviewed and aligned with stakeholder goals.
2. **Schema & Migration**: Prisma schema updated with `ActionTaken` model and `version` concurrency column; clean, idempotent migration and backfill scripts tested without data loss.
3. **Automated Test Coverage**:
   - Unit tests covering status transition matrix, OCC conflict detection, and calculation boundaries.
   - API integration tests covering Actions Taken CRUD, authorization, dashboard endpoints, and OCC conflicts.
   - Vitest component tests covering Dashboards, Actions Taken list/modals, and Ticket Workflow controls.
   - Playwright E2E suites covering Actions Taken workflows, resolution gates, and multi-role dashboard drill-downs.
4. **UI & Design Fidelity**: Zen Green theme adhered to consistently across all viewports (375px, 768px, 1280px) with zero horizontal overflow, visible focus indicators, and accessible touch targets (≥ 44px).
5. **Quality & Test Hygiene**: 100% green test execution across all new and existing test files with zero unhandled rejections, noisy warnings, or console errors.

---

## 11. Assumptions and Decisions

1. **Default Status for Recorded Actions Taken**: When an IT Staff member records work that has already been performed, `status` defaults to `COMPLETED`. When work is planned for future follow-up, `status` can be set to `PENDING` or `IN_PROGRESS`.
2. **Assignee Defaulting**: If `assigneeId` is omitted in the creation request payload, it defaults to the authenticated creator (`performedById`).
3. **Resolution Gate Rule**: Requiring at least one Action Taken before setting status to `Resolved` directly answers the stakeholder's demand: _"we still need a reliable way to plan and track the actual work... IT Staff must review the work and formally update the Ticket."_
4. **Time Window for Recently Resolved Metric**: "Recently Resolved" on dashboards is bounded to tickets resolved within the last 30 calendar days to keep metrics operationally actionable.
5. **OCC Mechanism**: Concurrency conflicts are checked using an integer `version` field on `Ticket`. If a client does not supply `version`, the server falls back to matching `lastKnownUpdatedAt` ISO string.
