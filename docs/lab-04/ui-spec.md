# Lab 4 UI Specification (Zen Green Theme)

TokTickIT: Dashboards, Actions Taken, and Workflow Hardening

## 1. Design System & Zen Green Visual Identity

TokTickIT preserves and extends the unified **Zen Green** enterprise design language established in Lab 2 and expanded in Lab 3. The UI emphasizes clarity, low cognitive load, role transparency, and high accessibility across all viewports.

### 1.1 Color Tokens

- **Primary Green** (`#006B3C`): App header bar, primary action buttons, active navigation indicator, brand identity.
- **Secondary Green** (`#0B7A46`): Interactive links, hover states, focus rings, secondary action button outlines.
- **Pale Accent Green** (`#EAF6EF`): Selected table rows, positive badge backgrounds, card highlight containers.
- **Canvas / Page Background** (`#F5F7F6`): Neutral, soft background preventing eye fatigue.
- **Surface / Card Background** (`#FFFFFF`): Pristine white containers with 1px border (`#D0DDD6`) and subtle elevation (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`).
- **Text Primary** (`#2B3B33`): Deep charcoal-slate ensuring WCAG AAA contrast for body text.
- **Text Muted** (`#61756C`): Helper captions, timestamps, and secondary table columns.
- **Border Neutral** (`#D0DDD6`): Section dividers, input borders, card outlines.
- **Internal Note Amber Accent** (`#FBF4DB` bg, `#8F6B00` border, `#5C4300` text): Dedicated confidential styling for IT Staff notes.
- **Actions Taken Slate Accent** (`#F0F4F8` bg, `#CBD5E1` border, `#1E293B` text): Dedicated styling for auditable technical work records.
- **Danger Red Accent** (`#C5221F` text, `#FCE8E6` bg, `#F7BDB8` border): Destructive actions, validation errors, and conflict alerts.

---

### 1.2 Status, Priority, and Action Badges

| Category          | Value                   | Background | Text Color | Border    | Description                        |
| :---------------- | :---------------------- | :--------- | :--------- | :-------- | :--------------------------------- |
| **Ticket Status** | `New`                   | `#DEEBFF`  | `#0747A6`  | `#B3D4FF` | Unassigned initial submission      |
| **Ticket Status** | `Open`                  | `#E3FCEF`  | `#006644`  | `#ABF5D1` | Claimed / triaged                  |
| **Ticket Status** | `In Progress`           | `#FFF0B3`  | `#172B4D`  | `#FFE380` | Work actively underway             |
| **Ticket Status** | `Waiting for Requester` | `#EAE6FF`  | `#403294`  | `#C0B6F2` | Blocked on user clarification      |
| **Ticket Status** | `Resolved`              | `#EAF6EF`  | `#006B3C`  | `#C3E6D5` | Work complete, resolution recorded |
| **Ticket Status** | `Closed`                | `#F4F5F7`  | `#42526E`  | `#DFE1E6` | Final administrative closure       |
| **Ticket Status** | `Reopened`              | `#FFEBE6`  | `#BF2600`  | `#FFBDAD` | Reopened due to recurring issue    |
| **Ticket Status** | `Cancelled`             | `#F4F5F7`  | `#8993A4`  | `#DFE1E6` | Voided request (terminal)          |
| **IT Priority**   | `Low`                   | `#EAF6EF`  | `#0B7A46`  | `#C3E6D5` | Minor business impact              |
| **IT Priority**   | `Medium`                | `#FEF8E7`  | `#8A6D00`  | `#FCEBB8` | Standard operational priority      |
| **IT Priority**   | `High`                  | `#FCE8E6`  | `#C5221F`  | `#F7BDB8` | Significant operational impact     |
| **IT Priority**   | `Critical`              | `#5A1A1A`  | `#FFFFFF`  | `#3D1010` | Urgent outage / mission critical   |
| **Action Status** | `Pending`               | `#F1F5F9`  | `#475569`  | `#CBD5E1` | Scheduled / queued work            |
| **Action Status** | `In Progress`           | `#FEF3C7`  | `#92400E`  | `#FDE68A` | Currently being executed           |
| **Action Status** | `Completed`             | `#DCFCE7`  | `#166534`  | `#BBF7D0` | Successfully completed action      |
| **Action Status** | `Cancelled`             | `#F3F4F6`  | `#6B7280`  | `#E5E7EB` | Abandoned or superseded action     |
| **Follow-Up**     | `Follow-Up Req.`        | `#FEF2F2`  | `#991B1B`  | `#FECACA` | Critical action requires follow-up |

---

## 2. Global Navigation & Application Shell

### 2.1 Role-Based Navigation Header

The navigation bar features the Zen Green branding (`#006B3C`), current user indicator, role badge, and active view highlights:

- **Requester Navigation**:
  - `TokTickIT` (Logo / Brand Home)
  - `Dashboard` (Active when viewing Requester Dashboard)
  - `My Tickets` (Active when viewing Ticket List)
  - `Create Ticket` (Active when creating a new ticket)
  - User Pill: `[Name] [Requester Badge]`
  - `Logout` Button
- **IT Staff Navigation**:
  - `TokTickIT` (Logo / Brand Home)
  - `Dashboard` (Active when viewing Staff Dashboard)
  - `Ticket Queue` (Active when viewing operational queue)
  - `Create Ticket` (Internal ticket creation)
  - User Pill: `[Name] [IT Staff Badge]`
  - `Logout` Button
- **Administrator Navigation**:
  - `TokTickIT` (Logo / Brand Home)
  - `Dashboard` (Active when viewing Admin Dashboard)
  - `Ticket Queue` (Operational triage queue)
  - `Users` (User Management screen)
  - User Pill: `[Name] [Admin Badge]`
  - `Logout` Button

---

## 3. Screen Specifications

### 3.1 IT Staff Dashboard (`/staff/dashboard`)

Provides an operational command center summarizing the current service desk queue (aligning with Handout Page 5 reference layout).

```
+-----------------------------------------------------------------------------------------+
| Welcome back, Michael!                                                       [Refresh]  |
| Here's what's happening with your queue today.                                          |
+-----------------------------------------------------------------------------------------+
| [New]             [Open]          [In Progress]      [Waiting Req]      [My Assigned]   |
|   14                23                 18                  7                 16         |
| +3 from yesterday -2 from yest.   -1 from yest.      +1 from yest.      +1 from yest.   |
| View Queue ->     View Queue ->   View Queue ->      View Queue ->      View Queue ->   |
+-----------------------------------------------------------------------------------------+
| RECENT UPDATED TICKETS (Top 5)               | QUICK ACTIONS                            |
| - TKT-2025-001234: Laptop battery drains...  | [+ Create Ticket] [Search Tickets]       |
|   [In Progress]  May 12, 09:14 AM     [View] | [My Queue]        [Unassigned Queue (14)]|
| - TKT-2025-001230: Printer badge offline     +------------------------------------------+
|   [Open]         May 10, 02:10 PM     [View] | URGENT TICKETS (High & Critical)         |
| - TKT-2025-001228: Outlook freezing          | - TKT-2026-000412: Database conn. [View] |
|   [In Progress]  May 9, 03:22 PM      [View] | - TKT-2026-000388: Core router    [View] |
| - TKT-2025-001215: Phone not receiving calls +------------------------------------------+
|   [Open]         May 9, 10:05 AM      [View] | PRIORITY BREAKDOWN & TOTAL ACTIVE QUEUE  |
| - TKT-2025-001119: VPN disconnects randomly  | Critical: 3, High: 8, Med: 24, Low: 12   |
|   [Resolved]     May 8, 04:15 PM      [View] | Total Active Queue: 67 tickets           |
+-----------------------------------------------------------------------------------------+
```

#### A. Metric Cards Grid

- **Card Anatomy**:
  - Top label: Muted small title (`New`, `Open`, `In Progress`, `Waiting for Requester`, `My Assigned`).
  - Metric Value: Large bold display font (`2rem` / `32px`, Zen Green `#006B3C` or semantic tone).
  - Trend / Context: e.g. `+3 from yesterday`, `Operational queue`.
  - Accessible Link / Drill-down: Clickable button or card action with `aria-label="View [N] tickets in queue"`.
- **Drill-down Destinations**:
  - `New`: Navigates to Ticket Queue with `status=New`.
  - `Open`: Navigates to Ticket Queue with `status=Open`.
  - `In Progress`: Navigates to Ticket Queue with `status=In+Progress`.
  - `Waiting for Requester`: Navigates to Ticket Queue with `status=Waiting+for+Requester`.
  - `My Assigned`: Navigates to Ticket Queue with `assigned=me`.
  - `Unassigned Queue`: Accessible from Quick Actions panel, navigates to Ticket Queue with `assigned=unassigned` (count: 14).

#### B. Recent Updated Tickets Table (`recentUpdatedTickets`)

- Positioned prominently in the left-hand main container (matching Handout Page 5).
- Displays top 5 tickets across the queue ordered by `updatedAt DESC`.
- Row items: Ticket Number (e.g. `TKT-2025-001234`), Summary, Status badge, formatted timestamp (`May 12, 09:14 AM`), and direct `[View]` button linking to Ticket Detail.
- **Empty State**: Centered neutral container with text: _"No recent tickets in queue."_

#### C. Urgent Tickets List

- Displays up to 5 tickets where status is active and `itPriority IN ('Critical', 'High')`.
- Displays: Ticket Number, Summary, Priority badge, Created date, and direct "View" button opening Ticket Detail.
- **Empty State**: Centered checkmark icon with text: _"No urgent or critical tickets requiring immediate attention."_

#### D. Safe Failure & Retry

- If dashboard API fetch fails, displays an alert banner: `"Unable to load dashboard data: [Error Details]"` accompanied by a `"Retry"` button calling `fetchDashboardData()`.

---

### 3.2 Requester Dashboard (`/requester/dashboard`)

Provides Requesters with a personalized summary of their active and recently concluded support requests.

```
+-----------------------------------------------------------------------------------------+
| Welcome, Jennifer Anderson!                                                  [Refresh]  |
| Here is the current status of your submitted support requests                           |
+-----------------------------------------------------------------------------------------+
| [My Open Tickets]   [Waiting for Me]   [Recently Resolved]   [Closed Tickets]           |
|         3                  1                   5                    12                  |
|    View All ->        View All ->         View All ->          View All ->              |
+-----------------------------------------------------------------------------------------+
| MY RECENT TICKETS                                           [View All My Tickets ->]    |
| - TKT-2026-000101: Laptop battery drains quickly     [Open]        Updated 2 hrs ago View |
| - TKT-2026-000115: VPN connection drops on campus   [In Progress] Updated yesterday View |
| - TKT-2026-000098: Need monitor replacement          [Waiting Req] Updated 3 days ago View |
|                                                                                         |
| QUICK ACTIONS                                                                           |
| [+ Submit New Ticket]       [Browse Knowledge / Reference]                              |
+-----------------------------------------------------------------------------------------+
```

#### A. Metric Cards

- `My Open Tickets`: Count of caller's active tickets (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`). Drill-down: My Tickets list.
- `Waiting for Me`: Count of caller's tickets where status is `WAITING_FOR_REQUESTER`. Drill-down: My Tickets filtered to `Waiting for Requester`.
- `Recently Resolved`: Count of caller's tickets resolved within the last 30 days.
- `Closed Tickets`: Total closed historical requests.

#### B. Recent Tickets Table

- Displays caller's 5 most recently updated tickets.
- Columns: Ticket Number, Summary, Status badge, Last updated timestamp, and "View Details" button.
- **Empty State**: _"You currently have no submitted support tickets. Click 'Submit New Ticket' to create one."_

---

### 3.3 Administrator Dashboard (`/admin/dashboard`)

Augments the IT Staff operational dashboard with enterprise user account governance metrics:

- Reuses all operational queue metric cards and urgent ticket tables from Section 3.1.
- Adds **User Management Summary Panel**:
  - `Active Users`: Total enabled accounts.
  - `Requesters`: Count of active employees.
  - `IT Staff`: Count of active technicians.
  - `Administrators`: Count of active system administrators.
  - Quick Link: `[Manage All Users ->]` navigating directly to `/admin/users`.

---

### 3.4 Actions Taken UI on Ticket Detail

Positioned prominently within the Ticket Detail screen as a dedicated section between Ticket Metadata and the Communication panel.

```
+-----------------------------------------------------------------------------------------+
| ACTIONS TAKEN (3)                                                  [+ Add Action Taken] |
| Work performed, technical interventions, and follow-up activities                       |
+-----------------------------------------------------------------------------------------+
| DATE / TIME       | DESCRIPTION & RESULT        | PERFORMED BY & ASSIGNEE | FOLLOW-UP   |
+-----------------------------------------------------------------------------------------+
| Sep 18, 14:30     | Description: Replaced RAM   | Performed: Sarah J.     | None        |
|                   | Result: Passed memtest      | Assignee: Sarah J.      | [Edit]      |
+-----------------------------------------------------------------------------------------+
| Sep 18, 16:15     | Description: OS Patch Run   | Performed: Michael C.   | REQUIRED    |
|                   | Result: Reboot required     | Assignee: Michael C.    | Check logs  |
|                   | Attachment Notes: log.txt   |                         | [Edit]      |
+-----------------------------------------------------------------------------------------+
```

#### A. Actions Taken List / Table

- **Desktop (≥992px)**: Data table with clean padding, bordered rows, and hover highlights.
  - Columns:
    1. `Date/Time`: Formatted timestamp (e.g. `Sep 18, 2026, 14:30`).
    2. `Description & Result`: Two-line display. Line 1: `Description: [text]`, Line 2: `Result: [text]` (with subtle muted prefix).
    3. `Technician & Assignee`: `By: [Staff Name]` chip, `Assigned: [Assignee Name]` chip.
    4. `Follow-Up`: If `isFollowUpRequired = true`, displays red badge `Follow-Up Req.` with the `followUpNote` callout beneath. If false, displays `—`.
    5. `Attachment Notes`: Displays file/asset reference text if present.
    6. `Actions`: `Edit` button (IT Staff / Admin only).
- **Mobile (<768px)**: Reflows into stacked cards with clear semantic labels and touch target height ≥ 44px.
- **Requester View**: Requesters see all rows and columns in read-only format. The `+ Add Action Taken` button and all `Edit` buttons are omitted from the DOM.

#### B. Create / Edit Action Taken Modal Dialog

```
+-----------------------------------------------------------------------+
| Record Action Taken                                               [X] |
+-----------------------------------------------------------------------+
| Action Date & Time *                                                  |
| [ 2026-09-18T14:30                                                 ] |
|                                                                       |
| Action Description * (What technical work was done)                   |
| [ Replaced primary DDR5 memory module with 16GB certified stock... ] |
|                                                                       |
| Result * (Outcome or observed diagnostic behavior)                    |
| [ MemTest86 completed 4 passes with 0 errors. Machine booted cleanly.] |
|                                                                       |
| Performed By (Auto-captured)                                          |
| [ Sarah Jenkins (IT Staff)                                  [LOCKED] ] |
|                                                                       |
| Assignee (Responsible Technician) *                                   |
| [ Sarah Jenkins (IT Staff)                                         v] |
|                                                                       |
| [X] Follow-Up Required                                                |
|                                                                       |
| Follow-Up Note * (Mandatory when follow-up is checked)                |
| [ Monitor crash dump logs after user runs heavy compile workloads  ] |
|                                                                       |
| Attachment / Evidence Notes (Optional)                                |
| [ See attachment memtest_pass.png uploaded under Attachments tab    ] |
+-----------------------------------------------------------------------+
| [Cancel]                                       [Save Action Taken]    |
+-----------------------------------------------------------------------+
```

- **Validation Rules**:
  - `description`: Required, 1–1,000 characters.
  - `result`: Required, 1–1,000 characters.
  - `assigneeId`: Required select dropdown populated with active `IT_STAFF` and `ADMINISTRATOR` users.
  - `isFollowUpRequired`: Checkbox / toggle switch.
  - `followUpNote`: Conditionally required when `isFollowUpRequired = true`. Disabled or hidden when false.
  - `attachmentNotes`: Optional, max 500 characters.

---

### 3.5 Ticket Workflow & Resolution Gate UI

#### A. Status Dropdown

- Located in Ticket Detail header/controls.
- Displays only statuses permitted by the BR-09 status transition matrix based on current ticket state.
- Selecting `Resolved` does not immediately submit; it launches the **Resolution Gate Modal Dialog**.

#### B. Resolution Gate Modal Dialog

- **Header**: `"Resolve Ticket [Ticket Number]"`
- **Pre-flight Check**:
  - If ticket has **zero Actions Taken**:
    - The modal displays a prominent warning callout:
      > ⚠️ **Cannot Resolve Ticket**
      > At least one Action Taken must be recorded before this ticket can be resolved. Please close this dialog, add an Action Taken detailing the work performed, and try again.
    - The `"Confirm Resolution"` submit button is disabled.
  - If ticket has **≥ 1 Actions Taken**:
    - Displays textarea for `Resolution Summary *` (1–1,000 characters) with live character counter.
    - `"Confirm Resolution"` primary button submits `PATCH /api/staff/tickets/:id/status` with `status: "RESOLVED"` and `resolutionSummary`.

#### C. Optimistic Concurrency Conflict UI

- If another user modifies the ticket while the current user has the screen open, any subsequent update receives `409 Conflict`.
- The screen catches the 409 response and renders a floating banner at the top of the viewport:
  > ⚠️ **Ticket Modified by Another User**
  > This ticket was updated by another team member while you were editing. The latest information has been loaded to prevent overwriting their work.
- Automatically refreshes ticket fields without navigating away or discarding unsaved modal input.

---

## 4. Accessibility & Responsive Verification Checklist

| Criterion                   | Standard / Target                                            | Implementation Method                                                                               |
| :-------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Touch Targets**           | Min 44px × 44px for all mobile interactive controls          | Mobile buttons, toggles, and table action links styled with `min-height: 44px` and padding          |
| **Contrast Ratios**         | WCAG AA (≥ 4.5:1 for body text, ≥ 3.0:1 for large/badges)    | Zen Green `#006B3C` and `#0B7A46` tested against white background (contrast > 5.5:1)                |
| **Keyboard Navigation**     | Visible outline on all inputs, tabs, and buttons             | `outline: 2px solid #0B7A46; outline-offset: 2px` on `:focus-visible`                               |
| **Zero Page Overflow**      | Zero unintended horizontal scrolling at 375px, 768px, 1280px | `overflow-x: hidden` on root; table containers scroll internally                                    |
| **Screen Reader Semantics** | ARIA roles and alerts on dialogs, badges, and counters       | `role="alert"` on errors; `role="dialog" aria-modal="true"` on modals; `aria-label` on metric cards |
| **Non-Color Cues**          | Status and Priority communicate meaning beyond color alone   | Badges pair color with explicit text labels and semantic icons                                      |
