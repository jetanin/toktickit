# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Replace the temporary Development Requester selector with production-grade email/password authentication, session management, and server-side role-based authorization (`Requester`, `IT Staff`, `Administrator`). Introduce the initial operational IT Staff ticketing workflow (shared Ticket Queue, ticket ownership assignment, IT Priority management, status transitions, Public Comments, and role-restricted Internal Notes) and a minimalist Administrator User Management portal, while guaranteeing 100% regression safety for all existing Lab 2 Requester capabilities (including ticket and attachment operations).

---

## 2. Stakeholder Request Interpretation

The IT Service Desk organization requires a unified, secure system with real identity management. The temporary requester selector must be decommissioned in favor of authenticated credentials.

1. **Security & Accounts**: Users authenticate with email and password. Newly created or reset accounts with temporary initial passwords must be forced to change their password upon their first login before accessing any application features. Administrators require a clean, responsive User Management interface to provision accounts, assign one role, edit user details, toggle account activation, and issue new initial passwords. Deletion of users is forbidden; deactivation must be used instead, and safety guards must prevent self-deactivation or deactivation of the last active Administrator.
2. **IT Staff Operations**: IT Staff need a professional Ticket Queue with search, filters, sorting, and pagination to triage incoming issues. Within Ticket Detail, IT Staff can claim unassigned tickets or reassign ownership to active colleagues, adjust IT Priority, advance the ticket through an explicit status workflow (recording a resolution summary when resolving), communicate transparently with Requesters via Public Comments, and record private Internal Notes.
3. **Requester Empowerment & Continuity**: Requesters must continue to create tickets, view their own ticket history, and manage attachments using their authenticated identity without breaking changes. Requesters can participate in Public Comments and signal that an issue "Appears Resolved", leaving formal resolution and closure to IT Staff.
4. **Enforcement & Consistency**: Authorization and ownership must be strictly validated on the server. Hiding or disabling UI controls is useful feedback, but backend APIs must enforce role permissions and ownership checks, returning standard, secure HTTP status codes without leaking resource existence. The application must retain the Zen Green design system established in Lab 2.

---

## 3. Scope

### Included

- **Authentication & Identity**:
  - Secure email and password login with hashed credentials (bcrypt).
  - Authenticated session management (HTTP-only secure cookies / signed tokens).
  - Current authenticated user retrieval (`GET /api/auth/me`).
  - Mandatory first-login password change for accounts flagged with `mustChangePassword: true`.
  - Secure logout action invalidating the active session.
  - Server-side RBAC distinguishing `Requester`, `IT Staff`, and `Administrator`.
- **Requester Continuity & Enhancement (Lab 2 Regression Safety)**:
  - Migration of Lab 2 ticket creation, paginated list, ticket detail, and attachment management from `X-Requester-Id` to authenticated session identity.
  - Full continuation of all attachment capabilities: upload (multipart), metadata retrieval, file download, and soft-removal with reason.
  - Ability for Requesters to post Public Comments on their owned tickets.
  - "Problem Appears Resolved" action allowing Requesters to signal resolution.
  - Complete removal of the temporary Development Requester selector and localStorage mockup.
- **IT Staff Ticket Queue & Workflow**:
  - Shared Ticket Queue supporting text search, multi-criteria filtering (Category, Priority, Status, Assignment), sorting, and pagination (default 10 items/page).
  - Ticket Detail for IT Staff: operational view displaying requester details, timestamps, and attachments.
  - Ownership management: Claiming unassigned tickets or reassigning tickets to active IT Staff.
  - Operational controls: Updating IT Priority (`Low`, `Medium`, `High`, `Critical`) and advancing ticket status through permitted transitions (with `resolutionSummary` on `Resolved`).
  - Dual communication stream: Threaded Public Comments (shared with Requester) and Internal Notes (strictly restricted to IT Staff and Admin).
- **Administrator User Management**:
  - Minimalist user management interface displaying name, email, role, status, and action buttons.
  - User filtering by role and keyword search across name and email.
  - User creation with initial password generation and mandatory first-login flag.
  - User editing (name, email, role, activation state).
  - Admin password reset generating a new initial password.
  - Safety constraints: Guard against self-deactivation and preventing deactivation of the sole active Administrator.
  - Deactivation instead of deleting users.
- **Data & Migration**:
  - Database schema evolution preserving all Lab 2 tickets, categories, related systems, and attachments.
  - Migration upgrading `DevelopmentRequester` records into the `User` model.
  - Idempotent seed data supporting all roles, active/inactive states, tickets, comments, and notes.

### Explicitly Excluded

- Email invitations, password-reset email, multi-factor authentication (MFA), social login, and single sign-on (SSO).
- Self-registration and Requester-created accounts.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, escalation rules, and notification services.
- Dashboards and KPI analytics beyond simple queue counts.
- Multi-tenant organizations, departments, and customer administration.
- Multiple roles assigned to one user (each user has exactly one permitted role).
- User deletion, bulk user operations, user import/export, and account-history screens.
- Department, organization, profile-photo, and extended user-profile management.
- Email delivery of initial passwords or reset links.
- Account unlocking, administrator approval workflows, and advanced identity-management functions.
- Advanced user-list features such as mandatory pagination, multi-column sorting, and multiple simultaneous filters.
- Production-grade cloud deployment or orchestration cluster changes.

---

## 4. Functional Requirements

### 4.1 Authentication & Session Management

- **FR-01**: The system shall authenticate users using email address and password against securely hashed credentials.
- **FR-02**: The system shall enforce mandatory password change for any user flagged with `mustChangePassword = true` immediately upon login, blocking access to all normal application routes until completed.
- **FR-03**: The system shall provide an endpoint returning the currently authenticated user's profile and role (`GET /api/auth/me`).
- **FR-04**: The system shall provide a secure logout mechanism that immediately invalidates the session and clears client authentication state.
- **FR-05**: The system shall reject unauthenticated or expired requests with `HTTP 401 Unauthorized` without leaking account information.

### 4.2 Role-Based Authorization

- **FR-06**: The system shall enforce role-based access control (RBAC) on every endpoint on the server side:
  - `Requester`: Restricted to own tickets, attachments, and public comments.
  - `IT Staff`: Access to shared queue, ticket operational fields, public comments, and internal notes.
  - `Administrator`: Access to user management and system administration.
- **FR-07**: The system shall reject unauthorized role access with `HTTP 403 Forbidden` without leaking the existence of restricted resources.

### 4.3 Requester Capabilities & Lab 2 Continuity

- **FR-08**: The system shall derive ticket ownership directly from the authenticated session identity, ignoring any client-supplied requester ID.
- **FR-09**: The system shall preserve all Lab 2 ticket query, detail, and attachment capabilities without requiring the `X-Requester-Id` header.
- **FR-10**: The system shall allow Requesters to upload, view, download, and soft-remove attachments on their owned tickets.
- **FR-11**: The system shall allow Requesters to post Public Comments on their owned tickets.
- **FR-12**: The system shall allow Requesters to indicate that their reported issue "Appears Resolved" without directly resolving or closing the ticket.

### 4.4 IT Staff Ticket Queue & Workflow

- **FR-13**: The system shall display a shared Ticket Queue for IT Staff with search, filters (Category, Priority, Status, Assignment), sorting, and pagination (default 10 items/page).
- **FR-14**: The system shall allow IT Staff to view any ticket's full operational details, attachments, public comments, and internal notes.
- **FR-15**: The system shall allow IT Staff or Administrators to claim an unassigned ticket or assign/reassign a ticket to any active IT Staff user.
- **FR-16**: The system shall allow IT Staff or Administrators to update the `IT Priority` of a ticket (`Low`, `Medium`, `High`, `Critical`).
- **FR-17**: The system shall allow IT Staff or Administrators to transition ticket status according to the approved state transition matrix, requiring a resolution summary when marking `Resolved`.
- **FR-18**: The system shall allow IT Staff and Administrators to create and view confidential Internal Notes on tickets.
- **FR-19**: The system shall allow IT Staff and Administrators to create and view Public Comments on any ticket.

### 4.5 Administrator User Management

- **FR-20**: The system shall provide Administrators with a user management screen listing all users with their Name, Email, Role, and Active Status.
- **FR-21**: The system shall allow Administrators to search users by name or email and optionally filter by role.
- **FR-22**: The system shall allow Administrators to create a new user account with one permitted role (`Requester`, `IT Staff`, `Administrator`), an initial password, and mandatory password change enabled.
- **FR-23**: The system shall allow Administrators to update an existing user's name, email, role, and active status.
- **FR-24**: The system shall allow Administrators to set a new initial password for any user, automatically re-enabling the mandatory password change requirement.
- **FR-25**: The system shall prevent an Administrator from deactivating their own account.
- **FR-26**: The system shall prevent removal or deactivation of the last active Administrator.

---

## 5. Business Rules & Authorization Matrix

### 5.1 Mandatory Handout Rules (BR-01 through BR-05)

- **BR-01**: **Active Account Verification**: Only an active user with valid credentials may authenticate. Inactive users receive a generic authentication failure (`401 Unauthorized`) to prevent account enumeration.
- **BR-02**: **Mandatory First-Login Password Change**: A user marked as requiring a password change cannot enter the normal application until a new valid password is saved. Any attempt to access operational endpoints returns `403 Forbidden` (`PASSWORD_CHANGE_REQUIRED`).
- **BR-03**: **Server-Derived Requester Identity**: The authenticated user identity, not a requesterId supplied by the client, determines ownership of Requester operations.
- **BR-04**: **Dual Communication Stream Visibility**: Public Comments are visible to the Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator.
- **BR-05**: **Requester Resolution Indication**: A Requester may indicate that the problem appears resolved, but cannot formally set the Ticket to Resolved or Closed.

### 5.2 Extended Authentication & Account Governance Rules

- **BR-06**: **Password Complexity & Boundary Rules**: All new passwords submitted during first login or password reset must satisfy:
  - Minimum length: 8 characters.
  - At least 1 uppercase letter (`A-Z`).
  - At least 1 lowercase letter (`a-z`).
  - At least 1 numeric digit (`0-9`).
  - At least 1 special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`).
  - New password must not be identical to the temporary initial password.
- **BR-07**: **Session Invalidation on Logout**: Logging out immediately invalidates the active session token/cookie on the server. Clients must purge cached state and redirect to `/login`.
- **BR-08**: **Current User Retrieval**: `GET /api/auth/me` returns the caller's safe profile (`id`, `name`, `email`, `role`, `mustChangePassword`). Sensitive hashes are never returned.
- **BR-09**: **Role Exclusivity**: Each user has exactly one assigned role (`REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`). Multiple roles assigned to one user are prohibited.
- **BR-10**: **Separation of Concerns**: IT Staff manage tickets; Administrators manage user accounts. Administrators do not appear in the ticket assignment dropdown unless dual-duty IT Staff membership is explicitly configured.

### 5.3 Ticket Ownership, Priority, and Status Rules

- **BR-11**: **Ticket Assignment & Ownership**: Each ticket may have zero or one primary Ticket Owner (`ticketOwnerId`), who must be an active user with the `IT_STAFF` or `ADMINISTRATOR` role. Tickets created by Requesters start unassigned (`ticketOwnerId = null`).
- **BR-12**: **Claiming and Reassignment**:
  - An IT Staff member may "Claim" an unassigned ticket, setting `ticketOwnerId` to themselves. If status is `New`, status automatically advances to `Open`.
  - An IT Staff member or Administrator may reassign a ticket to any active IT Staff user.
- **BR-13**: **Dual Priority Lifecycle**:
  - `Requested Priority` remains the value submitted by the Requester at creation (`Low`, `Medium`, `High`) and is strictly read-only thereafter.
  - `IT Priority` initially copies `Requested Priority` at ticket creation.
  - Only IT Staff and Administrators may modify `IT Priority` (`Low`, `Medium`, `High`, `Critical`).
- **BR-14**: **Permitted Ticket Status Values**:
  1. `New`: Newly created ticket, unassigned.
  2. `Open`: Acknowledged / claimed by IT Staff.
  3. `In Progress`: Actively investigated or worked on.
  4. `Waiting for Requester`: IT Staff requested information from Requester.
  5. `Resolved`: Work completed; resolution summary recorded.
  6. `Closed`: Final administrative closure.
  7. `Reopened`: Previously resolved/closed ticket reopened due to recurring issues.
  8. `Cancelled`: Voided or rejected request.
- **BR-15**: **Status Transition Matrix**:

| Current Status          | Permitted Next Statuses                                         | Permitted Roles | Required Data / Conditions                                 |
| :---------------------- | :-------------------------------------------------------------- | :-------------- | :--------------------------------------------------------- |
| `New`                   | `Open`, `In Progress`, `Cancelled`                              | IT Staff, Admin | Claim automatically sets status to `Open`                  |
| `Open`                  | `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled` | IT Staff, Admin | —                                                          |
| `In Progress`           | `Waiting for Requester`, `Resolved`, `Cancelled`                | IT Staff, Admin | Non-empty `resolutionSummary` required for `Resolved`      |
| `Waiting for Requester` | `In Progress`, `Resolved`, `Cancelled`                          | IT Staff, Admin | Requester comment automatically flags ticket back to staff |
| `Resolved`              | `Closed`, `Reopened`                                            | IT Staff, Admin | Requester can confirm "Problem Appears Resolved"           |
| `Closed`                | `Reopened` (within 14 days)                                     | IT Staff, Admin | Reopen reason required                                     |
| `Reopened`              | `In Progress`, `Resolved`, `Cancelled`                          | IT Staff, Admin | —                                                          |
| `Cancelled`             | _(Terminal State)_                                              | IT Staff, Admin | Cancellation reason required                               |

- **BR-16**: **Resolution Summary Requirement**: Transitioning a ticket to `Resolved` requires a non-empty `resolutionSummary` (1–1,000 characters) visible to both Requester and IT Staff.

### 5.4 Comments, Internal Notes, and Attachments

- **BR-17**: **Append-Only Immutability**: Neither Public Comments nor Internal Notes may be edited or deleted once submitted.
- **BR-18**: **Author and Timestamp Integrity**: `authorId` and `createdAt` are captured from the server session and server clock at insertion. Client overrides are rejected.
- **BR-19**: **Content Validation**: Comment and note text must contain between 1 and 2,000 characters after trimming. Empty or whitespace-only bodies are rejected (`400 Bad Request`). Safe rendering (HTML escaping) is mandatory.
- **BR-20**: **Internal Notes Confidentiality**: Accessing `/api/tickets/:id/internal-notes` by a Requester returns `403 Forbidden` without revealing note count or existence.
- **BR-21**: **Lab 2 Attachment Continuity**:
  - Max 5 active attachments per ticket.
  - Max file size: 5MB.
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Soft-removal requires a non-empty `removalReason`. Soft-removed attachments cannot be downloaded.
  - Attachment endpoints inherit ticket ownership rules.

### 5.5 Administrator Safety & User Governance Rules

- **BR-22**: **Email Uniqueness**: User email addresses must be unique across the system (case-insensitive).
- **BR-23**: **Deactivation Instead of Deletion**: Hard deletion of user accounts is prohibited. User access is revoked by setting `isActive = false`.
- **BR-24**: **Self-Deactivation Guard**: An Administrator cannot set `isActive = false` on their own currently authenticated account.
- **BR-25**: **Sole Active Administrator Protection**: The system must verify that at least one other active Administrator exists before permitting deactivation or role modification of an Administrator account.
- **BR-26**: **Initial Password Reset Behavior**: When an Administrator resets a user's password, the system saves the new initial password and forces `mustChangePassword = true`.
- **BR-27**: **Safe Failure Behavior**: Every protected endpoint distinguishes unauthenticated (401), forbidden (403), invalid input (400), not found (404), conflict (409), and server error (500) without leaking whether another user's protected ticket, attachment, or note exists.

---

### 5.6 Role-Based Authorization Matrix

| Feature / Operation                        | Requester | IT Staff | Admin | Enforcement Rule / Ownership Condition                                    |
| :----------------------------------------- | :-------: | :------: | :---: | :------------------------------------------------------------------------ |
| **Login / Logout / Change Initial Pass**   |    Yes    |   Yes    |  Yes  | Public login; password change requires active session with flag.          |
| **Retrieve Current Profile (`/auth/me`)**  |    Yes    |   Yes    |  Yes  | Authenticated user only.                                                  |
| **Create Ticket**                          |    Yes    |   Yes    |  No   | Caller identity bound as `requesterId`.                                   |
| **View My Tickets (`/api/tickets`)**       |    Yes    |    No    |  No   | Filtered strictly to `ticket.requesterId == req.user.id`.                 |
| **View Ticket Detail (`/tickets/:id`)**    |   Owner   |   Yes    |  Yes  | Requester restricted to owned tickets (403/404 on others).                |
| **Signal Resolution Intent**               |   Owner   |    No    |  No   | Only ticket owner may click "Problem Appears Resolved".                   |
| **View IT Staff Queue (`/staff/tickets`)** |    No     |   Yes    |  Yes  | Shared queue with search/filter/sort/pagination.                          |
| **Claim / Reassign Ticket**                |    No     |   Yes    |  Yes  | Target owner must be active user with `IT_STAFF` or `ADMINISTRATOR` role. |
| **Update IT Priority**                     |    No     |   Yes    |  Yes  | Values: `Low`, `Medium`, `High`, `Critical`.                              |
| **Update Ticket Status**                   |    No     |   Yes    |  Yes  | Must conform to BR-15 transition matrix; `Resolved` needs summary.        |
| **View / Add Public Comments**             |   Owner   |   Yes    |  Yes  | Visible to Requester, IT Staff, and Admin. Append-only.                   |
| **View / Add Internal Notes**              |  **No**   |   Yes    |  Yes  | **Strictly forbidden for Requesters (403)**; hidden from ticket view.     |
| **Upload Attachment**                      |   Owner   |   Yes    |  Yes  | Max 5MB, JPG/PNG/WEBP/PDF, max 5 files.                                   |
| **Download Attachment**                    |   Owner   |   Yes    |  Yes  | Blocked if soft-removed.                                                  |
| **Soft-Remove Attachment**                 |   Owner   |   Yes    |  Yes  | Requires non-empty reason.                                                |
| **User Management (`/admin/users`)**       |    No     |    No    |  Yes  | Minimalist portal: list, search, role filter, create, edit, reset pass.   |
| **Deactivate User Account**                |    No     |    No    |  Yes  | Guarded against self-deactivation and sole active Administrator.          |

---

## 6. UI Specification Summary

The TokTickIT interface adheres strictly to the **Zen Green** design language (`#006B3C` primary, `#0B7A46` secondary, `#EAF6EF` light background):

1. **Authentication Shell**:
   - Clean, centered login card with email, password, show/hide eye toggle, Sign In button, and safe error banner.
   - Mandatory Change Password overlay blocking application content when `mustChangePassword` is active, with live rule checklist.
   - Application Header displaying brand name, current user's name, role badge, and quick Logout action.
2. **Role-Specific Navigation**:
   - `Requester`: **My Tickets** | **Create Ticket** | Profile Dropdown
   - `IT Staff`: **My Queue** | **Create Ticket** | Profile Dropdown
   - `Administrator`: **Admin** | Profile Dropdown
3. **IT Staff Ticket Queue**:
   - Search bar across Ticket Number, Summary, and Requester.
   - `Filters` button opening Category, Priority, Status, and Assignment (All / Unassigned / Assigned to Me) controls.
   - Summary count indicator (`Showing 1 to 10 of 87 tickets`).
   - Responsive data table on Desktop (≥992px); touch-friendly stacked cards on Mobile (<768px).
4. **IT Staff Ticket Detail**:
   - Breadcrumb (`My Queue > Ticket Detail`) and `<- Back to Queue` button.
   - Grouped cards: Overview, Requester Details, Status dropdown, IT Priority dropdown, Owner dropdown with "Claim" button.
   - `Resolution Summary` input required for status transition to `Resolved`.
   - Communication panel with 4 tabs:
     - **Public Comments (N)**: Shared dialogue with Requester.
     - **Internal Notes (N)**: Distinct amber accent banner (_"Internal IT Note - Not visible to Requester"_).
     - **Attachments (N)**: Download, view, soft-remove.
     - **Service Actions (0)**: Disabled placeholder for Lab 4.
5. **Administrator User Management**:
   - Filterable user table displaying `Name`, `Role`, `Status`, and `Edit` action.
   - Modal dialogs for `Create New User`, `Edit User Details`, and `Reset Password` with inline validation and safety guards.
6. **Error & Feedback States**:
   - Clear feedback for loading, saving, success, empty/no-results, forbidden, not-found, conflict, and safe API failures.
   - Minimum touch targets (≥44px) and zero horizontal overflow on all viewports.
   - Complete design tokens and checklist documented in [ui-spec.md](file:///c:/Work/2569/CPE334/toktickit/docs/lab-03/ui-spec.md).

---

## 7. Data Changes

### 7.1 Data Models & Relationships

```
+--------------------+        +-------------------------+
|        User        |        |         Ticket          |
+--------------------+        +-------------------------+
| id (PK)            |<---1:N-| requesterId (FK)        |
| name               |<---0:1-| ticketOwnerId (FK)      |
| email (UQ)         |        | ticketNumber (UQ)       |
| passwordHash       |        | summary                 |
| role (Enum)        |        | description             |
| isActive (Bool)    |        | categoryId (FK)         |
| mustChangePassword |        | relatedSystemId (FK)    |
| createdAt          |        | requestedPriority       |
| updatedAt          |        | itPriority              |
+--------------------+        | currentStatus           |
         |                    | resolutionSummary       |
         | 1:N                | requesterResolutionPending
         +-------------+      | createdAt               |
         |             |      | updatedAt               |
         v             v      +-------------------------+
+----------------+ +----------------+      |
| PublicComment  | |  InternalNote  |      | 1:N
+----------------+ +----------------+      v
| id (PK)        | | id (PK)        | +-------------------+
| ticketId (FK)  | | ticketId (FK)  | |    Attachment     |
| authorId (FK)  | | authorId (FK)  | +-------------------+
| content        | | content        | | id (PK)           |
| createdAt      | | createdAt      | | ticketId (FK)     |
+----------------+ +----------------+ | filename          |
                                      | originalFilename  |
                                      | mimeType          |
                                      | size              |
                                      | removalReason     |
                                      | removedAt         |
                                      | createdAt         |
                                      +-------------------+
```

### 7.2 Model Definitions

#### User Model (New)

- `id` (Int, PK, autoincrement)
- `name` (VarChar 100, NOT NULL)
- `email` (VarChar 255, UNIQUE, NOT NULL)
- `passwordHash` (VarChar 255, NOT NULL)
- `role` (Enum: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`, NOT NULL, default `REQUESTER`)
- `isActive` (Boolean, NOT NULL, default `true`)
- `mustChangePassword` (Boolean, NOT NULL, default `false`)
- `createdAt` (DateTime, default `now()`)
- `updatedAt` (DateTime, updated on change)

#### Ticket Model (Evolved from Lab 2)

- Added `ticketOwnerId` (Int, Nullable, FK -> `User.id`)
- Added `itPriority` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, default `LOW`)
- Evolved `currentStatus` (Enum: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`, default `NEW`)
- Added `resolutionSummary` (Text, Nullable)
- Added `requesterResolutionPending` (Boolean, default `false`)
- Existing Lab 2 fields retained: `id`, `ticketNumber`, `requesterId`, `categoryId`, `relatedSystemId`, `summary`, `description`, `requestedPriority`, `createdAt`, `updatedAt`.

#### PublicComment Model (New)

- `id` (Int, PK, autoincrement)
- `ticketId` (Int, FK -> `Ticket.id`, cascade delete)
- `authorId` (Int, FK -> `User.id`, restrict delete)
- `content` (Text, NOT NULL)
- `createdAt` (DateTime, default `now()`)

#### InternalNote Model (New)

- `id` (Int, PK, autoincrement)
- `ticketId` (Int, FK -> `Ticket.id`, cascade delete)
- `authorId` (Int, FK -> `User.id`, restrict delete)
- `content` (Text, NOT NULL)
- `createdAt` (DateTime, default `now()`)

#### Attachment Model (Retained from Lab 2)

- `id` (Int, PK, autoincrement)
- `ticketId` (Int, FK -> `Ticket.id`, cascade delete)
- `filename` (VarChar 255, NOT NULL)
- `originalFilename` (VarChar 255, NOT NULL)
- `mimeType` (VarChar 100, NOT NULL)
- `size` (Int, NOT NULL)
- `removalReason` (VarChar 255, Nullable)
- `removedAt` (DateTime, Nullable)
- `createdAt` (DateTime, default `now()`)

---

### 7.3 Index & Constraint Decisions

| Table           | Column / Constraint           | Type            | Justification                                                          |
| :-------------- | :---------------------------- | :-------------- | :--------------------------------------------------------------------- |
| `User`          | `email`                       | UNIQUE B-Tree   | Ensures credentials uniqueness and fast lookup during login.           |
| `User`          | `role`, `isActive`            | B-Tree Index    | Accelerates user-management queries and role-based assignment lookups. |
| `Ticket`        | `ticketOwnerId`               | B-Tree Index    | Crucial for IT Staff "Assigned to Me" queue filtering.                 |
| `Ticket`        | `currentStatus`, `itPriority` | Composite Index | Optimizes IT Queue multi-filter sorting and triage queries.            |
| `PublicComment` | `ticketId`, `createdAt`       | Composite Index | Speeds up threaded comment chronological retrieval per ticket.         |
| `InternalNote`  | `ticketId`, `createdAt`       | Composite Index | Accelerates operational internal note timeline rendering.              |
| `Attachment`    | `ticketId`, `removedAt`       | Composite Index | Speeds up active attachment lookup per ticket.                         |

---

### 7.4 Migration Strategy from Lab 2

1. **Prisma Migration**:
   - Create table `User` with bcrypt hashed passwords.
   - Migrate data from `DevelopmentRequester` into `User` with `role = 'REQUESTER'`, active status, and assign initial temporary passwords (`Password123!`) with `mustChangePassword = true`.
   - Update `Ticket.requesterId` foreign key to point to `User.id`.
   - Add new columns to `Ticket` (`ticketOwnerId`, `itPriority`, `resolutionSummary`, `requesterResolutionPending`).
   - Create tables `PublicComment` and `InternalNote`.
   - Preserve existing `Attachment`, `Category`, and `RelatedSystem` records.
   - Safely drop or archive `DevelopmentRequester` table.
2. **Client Cleanup**:
   - Delete `RequesterSelector.tsx`, `RequesterSelector.test.tsx`, and session/localStorage mockups.
   - Replace with real auth store / context connected to `GET /api/auth/me`.

---

### 7.5 Seed Data Requirements

Idempotent seed script (`prisma/seed.ts`) populating:

| Email                          | Role            | Active | Must Change Pass | Initial Password | Purpose                                     |
| :----------------------------- | :-------------- | :----: | :--------------: | :--------------- | :------------------------------------------ |
| `admin@toktick.it`             | `ADMINISTRATOR` |  Yes   |        No        | `Admin1234!`     | Primary active Administrator                |
| `admin2@toktick.it`            | `ADMINISTRATOR` |  Yes   |        No        | `Admin1234!`     | Secondary Admin (for sole-admin guard test) |
| `sarah.it@toktick.it`          | `IT_STAFF`      |  Yes   |        No        | `Password123!`   | Senior IT Staff / Triage                    |
| `michael.it@toktick.it`        | `IT_STAFF`      |  Yes   |        No        | `Password123!`   | Hardware Specialist IT Staff                |
| `david.it@toktick.it`          | `IT_STAFF`      |  Yes   |        No        | `Password123!`   | Network Specialist IT Staff                 |
| `kevin.it@toktick.it`          | `IT_STAFF`      | **No** |        No        | `Password123!`   | Inactive IT Staff (auth failure test)       |
| `jennifer.anderson@toktick.it` | `REQUESTER`     |  Yes   |        No        | `Password123!`   | Active Requester                            |
| `alex.thompson@toktick.it`     | `REQUESTER`     |  Yes   |     **Yes**      | `Password123!`   | Active Requester (first-login pass change)  |
| `lisa.martinez@toktick.it`     | `REQUESTER`     |  Yes   |        No        | `Password123!`   | Active Requester                            |
| `amanda.clark@toktick.it`      | `REQUESTER`     |  Yes   |        No        | `Password123!`   | Active Requester                            |
| `robert.wilson@toktick.it`     | `REQUESTER`     | **No** |        No        | `Password123!`   | Inactive Requester (auth failure test)      |

- **Realistic Tickets**: ≥15 realistic tickets distributed across Requesters, statuses (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`), priorities, and owners (assigned vs unassigned).
- **Public Comments & Internal Notes**: Realistic interaction threads illustrating triage and requester communication.

---

## 8. API Contract Summary

| Method  | Endpoint                              | Allowed Roles       | Description                                                     |
| :------ | :------------------------------------ | :------------------ | :-------------------------------------------------------------- |
| `POST`  | `/api/auth/login`                     | Public              | Authenticate with email & password, create session cookie.      |
| `POST`  | `/api/auth/logout`                    | Authenticated       | Destroy session cookie and logout.                              |
| `GET`   | `/api/auth/me`                        | Authenticated       | Return currently authenticated user profile & role.             |
| `POST`  | `/api/auth/change-password`           | Authenticated       | Mandatory first-login password change.                          |
| `GET`   | `/api/tickets`                        | Requester           | List tickets owned by current requester (paginated).            |
| `POST`  | `/api/tickets`                        | Requester, Staff    | Create a new ticket (ownership assigned to caller).             |
| `GET`   | `/api/tickets/:id`                    | Owner, Staff, Admin | Retrieve ticket details and attachments.                        |
| `PATCH` | `/api/tickets/:id/resolve-indication` | Owner               | Requester indicates problem appears resolved.                   |
| `POST`  | `/api/tickets/:id/attachments`        | Owner, Staff, Admin | Upload attachment (multipart/form-data, max 5MB).               |
| `GET`   | `/api/attachments/:id`                | Owner, Staff, Admin | Retrieve attachment metadata.                                   |
| `GET`   | `/api/attachments/:id/download`       | Owner, Staff, Admin | Download attachment binary file (blocked if soft-removed).      |
| `PATCH` | `/api/attachments/:id/remove`         | Owner, Staff, Admin | Soft-remove attachment with required removal reason.            |
| `GET`   | `/api/staff/tickets`                  | IT Staff, Admin     | Shared IT Staff Ticket Queue (search, filter, sort, paginate).  |
| `PATCH` | `/api/staff/tickets/:id/assign`       | IT Staff, Admin     | Claim or reassign ticket owner.                                 |
| `PATCH` | `/api/staff/tickets/:id/priority`     | IT Staff, Admin     | Update IT Priority (`Low`, `Medium`, `High`, `Critical`).       |
| `PATCH` | `/api/staff/tickets/:id/status`       | IT Staff, Admin     | Transition ticket status (with `resolutionSummary` if resolved) |
| `GET`   | `/api/tickets/:id/comments`           | Owner, Staff, Admin | Retrieve Public Comments list.                                  |
| `POST`  | `/api/tickets/:id/comments`           | Owner, Staff, Admin | Add a Public Comment.                                           |
| `GET`   | `/api/tickets/:id/internal-notes`     | IT Staff, Admin     | Retrieve Internal Notes list (403 for Requester).               |
| `POST`  | `/api/tickets/:id/internal-notes`     | IT Staff, Admin     | Add an Internal Note (403 for Requester).                       |
| `GET`   | `/api/admin/users`                    | Admin               | List users with search and role filter.                         |
| `POST`  | `/api/admin/users`                    | Admin               | Provision a new user account with initial password.             |
| `PATCH` | `/api/admin/users/:id`                | Admin               | Update user details (name, email, role, active state).          |
| `POST`  | `/api/admin/users/:id/reset-password` | Admin               | Set new initial password requiring change on next login.        |

---

## 9. Acceptance Criteria

### 9.1 Mandatory Handout Acceptance Criteria (AC-01 through AC-04)

- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02**: Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03**: Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester's data.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected without exposing note content.

### 9.2 Extended Acceptance Criteria

- **AC-05**: Given an inactive user or invalid credentials, when login is attempted, then the server responds with `401 Unauthorized` with a generic message, leaving account existence unrevealed.
- **AC-06**: Given a user on the Change Password screen, when they submit a password meeting all complexity rules (≥8 chars, upper, lower, number, symbol), then the password is saved, `mustChangePassword` is cleared, and they enter the application.
- **AC-07**: Given an authenticated user, when they click Logout, then the session cookie is invalidated and any subsequent request returns `401 Unauthorized`.
- **AC-08**: Given an authenticated Requester, when they view My Tickets or create a ticket, then the backend uses the session identity and only returns tickets belonging to that Requester.
- **AC-09**: Given a Requester attempting to access another user's ticket or attachment, then the server responds with `404 Not Found` (or `403 Forbidden`) without leaking resource data.
- **AC-10**: Given an IT Staff user, when they navigate to the Ticket Queue, then they see all tickets across requesters with correct status badges, priorities, and assigned owners.
- **AC-11**: Given an IT Staff user on the Ticket Queue, when they search by ticket number or summary, or filter by category/priority/status/assignment, then matching results update accurately.
- **AC-12**: Given an IT Staff user viewing an unassigned ticket, when they click "Claim", then the ticket's owner is updated to themselves and status advances to `Open` (if previously `New`).
- **AC-13**: Given an IT Staff user viewing a ticket, when they select a new IT Priority (`Critical`, `High`, `Medium`, `Low`), then the change is persisted and visible immediately.
- **AC-14**: Given an IT Staff user, when they advance a ticket's status in accordance with the transition matrix, then the new status is applied; invalid status transitions are rejected with `400 Bad Request`.
- **AC-15**: Given a ticket, when any permitted participant posts a Public Comment, then the comment appears in the chronological thread visible to Requester, IT Staff, and Admin.
- **AC-16**: Given an IT Staff user or Admin, when they create an Internal Note, then the note is saved and displayed with distinct internal amber styling.
- **AC-17**: Given a Requester viewing a ticket, when they click "Problem Appears Resolved", then the ticket is marked with the requester resolution indication without directly setting it to Closed.
- **AC-18**: Given an Administrator, when they access User Management, then all users are listed with name, email, role, and active status, and search/filter controls function.
- **AC-19**: Given an Administrator, when they create a user with a duplicate email, then the server returns `409 Conflict` with a clear error message.
- **AC-20**: Given an Administrator, when they attempt to deactivate their own account or the sole active Administrator, then the system prevents the action with an explicit guard error.
- **AC-21**: Given an Administrator, when they reset a user's password, then a new initial password is saved and `mustChangePassword` is set to `true`.
- **AC-22**: Given any screen in the application, when resized across Desktop (≥992px), Tablet (768–991px), and Mobile (<768px), then layout conforms to Zen Green standards without text clipping or horizontal page overflow.

---

## 10. Product Definition of Done

1. **Feature Completeness**: All 22 Acceptance Criteria implemented across Backend API, Prisma DB, and Frontend React views.
2. **Security & Authorization**:
   - Zero plaintext passwords in database, repository, or logs.
   - All protected routes verified with automated authorization test suites.
   - Requester data strictly isolated; Internal Notes inaccessible to Requesters.
3. **Automated Testing Suite**:
   - Server integration tests passing (Supertest/Vitest) with zero skips.
   - Client unit/component tests passing (Vitest/RTL) with clean output.
   - Playwright E2E suites passing across Desktop, Tablet, and Mobile viewports.
4. **Regression Safety**: All Lab 2 Requester workflows (ticket creation, attachments upload/download/soft-remove, search, pagination) function identically under real authentication.
5. **Zen Green UI Compliance**: Responsive tables, cards, touch targets (≥44px), badges, and accessibility labels conform to design specifications.
6. **Documentation & Deliverables**:
   - `docs/lab-03/specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md` fully synchronized.
   - Branching workflow and peer reviews completed on GitHub.

---

## 11. Assumptions and Decisions

1. **Authentication Technology**: Session-based authentication using signed HTTP-only cookies (`toktickit_session`) with bcrypt (salt rounds = 10) password hashing. Credentials and tokens remain hidden from client-side script tampering.
2. **Initial Password Delivery**: In accordance with Lab 3 scope (excluding email delivery), initial passwords generated by the Administrator are displayed in the UI modal for copying by the admin, with a clear notice that the user must change it on first login.
3. **Attachment Storage**: Attachments continue to be stored in the local sanitized filesystem directory (`server/uploads/`) with UUID-prefixed filenames as established in Lab 2.
4. **Queue Pagination**: The IT Staff Ticket Queue defaults to 10 items per page with support for 25 and 50 items.
5. **Requester Resolution Signal**: When a Requester clicks "Problem Appears Resolved", the system updates `requesterResolutionPending = true` on the ticket and appends an automated system public comment `"[Requester] indicated that the problem appears resolved."` to ensure full audit visibility.
