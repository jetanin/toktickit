# Lab 3 UI Specification (Zen Green Theme)

## 1. Design Philosophy & Color System

TokTickIT preserves and extends the **Zen Green** enterprise design language established in Lab 2. All screens, typography, interactive controls, and responsive layouts adhere to this unified aesthetic.

### 1.1 Core Palette Tokens

- **Primary Green** (`#006B3C`): App navigation header bar, primary submit actions, active navigation indicator, brand identity.
- **Secondary Green** (`#0B7A46`): Hover states, interactive link accents, focus rings, secondary badge tones.
- **Pale Green** (`#EAF6EF`): Selected row highlights, subtle section containers, success banners, low priority badges.
- **Page Background** (`#F5F7F6`): Neutral near-white background maintaining high contrast without eye strain.
- **Surface / Card Background** (`#FFFFFF`): Clean white container with a 1px border (`#D0DDD6`) and subtle drop shadow (`0 2px 4px rgba(0,0,0,0.04)`).
- **Text Primary** (`#2B3B33`): Deep charcoal-green ensuring crisp legibility.
- **Text Muted** (`#61756C`): Secondary captions, field hints, and timestamps.
- **Border Neutral** (`#D0DDD6`): Card outlines, table dividers, input borders.
- **Internal Note Amber Accent** (`#FBF4DB` bg, `#8F6B00` border, `#5C4300` text): Explicitly distinguishes private IT operational notes from public comments.

---

### 1.2 Status, Priority, and Role Badge Tokens

| Badge Category | Value                   | Background | Text Color | Border    | Usage                              |
| :------------- | :---------------------- | :--------- | :--------- | :-------- | :--------------------------------- |
| **Status**     | `New`                   | `#DEEBFF`  | `#0747A6`  | `#B3D4FF` | Newly submitted ticket, unassigned |
| **Status**     | `Open`                  | `#E3FCEF`  | `#006644`  | `#ABF5D1` | Claimed / acknowledged by IT Staff |
| **Status**     | `In Progress`           | `#FFF0B3`  | `#172B4D`  | `#FFE380` | Actively investigated              |
| **Status**     | `Waiting for Requester` | `#EAE6FF`  | `#403294`  | `#C0B6F2` | Awaiting additional requester info |
| **Status**     | `Resolved`              | `#EAF6EF`  | `#006B3C`  | `#C3E6D5` | Work complete, resolution recorded |
| **Status**     | `Closed`                | `#F4F5F7`  | `#42526E`  | `#DFE1E6` | Final administrative closure       |
| **Status**     | `Reopened`              | `#FFEBE6`  | `#BF2600`  | `#FFBDAD` | Reopened due to recurring issue    |
| **Status**     | `Cancelled`             | `#F4F5F7`  | `#8993A4`  | `#DFE1E6` | Rejected / cancelled request       |
| **Priority**   | `Low`                   | `#EAF6EF`  | `#0B7A46`  | `#C3E6D5` | Routine issue                      |
| **Priority**   | `Medium`                | `#FEF8E7`  | `#8A6D00`  | `#FCEBB8` | Normal business impact             |
| **Priority**   | `High`                  | `#FCE8E6`  | `#C5221F`  | `#F7BDB8` | Urgent / impeding work             |
| **Priority**   | `Critical`              | `#5A1A1A`  | `#FFFFFF`  | `#3D1010` | Severe outage / mission critical   |
| **Role**       | `Requester`             | `#E8F4FD`  | `#1B6CA8`  | `#B8DCF8` | Standard employee                  |
| **Role**       | `IT Staff`              | `#EAF6EF`  | `#006B3C`  | `#C3E6D5` | Helpdesk technician                |
| **Role**       | `Administrator`         | `#F3E8FD`  | `#6929C4`  | `#D4BBFF` | System administrator               |
| **Account**    | `Active`                | `#EAF6EF`  | `#006B3C`  | `#C3E6D5` | Account enabled                    |
| **Account**    | `Inactive`              | `#FCE8E6`  | `#C5221F`  | `#F7BDB8` | Account deactivated                |

---

## 2. Controls, Inputs, and States

- **Editable Inputs**: White background (`#FFFFFF`), 1px neutral border (`#D0DDD6`), 4px border radius.
- **Read-Only Fields**: Soft sage-tinted background (`#EEF4F1`), text color `#2B3B33`, cursor `default`. Clearly distinguished from editable inputs.
- **Focused State**: 2px outer glow in Secondary Green (`rgba(11, 122, 70, 0.25)`), border color `#0B7A46`.
- **Validation Errors**: Dark red border (`#C5221F`). Error message renders immediately beneath the control in 12px red font with an alert circle icon.
- **Required Fields**: Indicated by a red asterisk `*` after the label.
- **Disabled State**: Opacity 0.5, cursor `not-allowed`.

---

## 3. Button Hierarchy

- **Primary Action**: Solid `#006B3C` with white text. Used for main form submissions ("Sign In", "Submit Ticket", "Claim Ticket", "Post Comment", "Save User").
- **Secondary Action**: White surface with `#0B7A46` border and text. Used for secondary navigation ("Back to Queue", "View", "Filters").
- **Tertiary Action**: Transparent background, `#0B7A46` text. Used for low-friction actions ("Cancel", "Clear Filters").
- **Destructive Action**: Red border or solid red (`#C5221F`) with white text. Used for "Deactivate User" and "Remove Attachment", always backed by confirmation.
- **Busy / Processing State**: Button shows an inline spinning indicator, label updates to "Submitting...", "Saving...", or "Authenticating...", and the button is temporarily disabled.

---

## 4. Responsive Layout Rules

- **Desktop (≥ 992px)**:
  - Multi-column structured data tables with sortable headers.
  - Dual-column card view in Ticket Detail (Ticket Metadata & Operational controls on left, Communication panel on right).
- **Tablet (768px – 991px)**:
  - Responsive two-column collapsing; secondary metadata folds into compact summary chips.
  - Table scrolls horizontally within its container or folds secondary columns.
- **Mobile (< 768px)**:
  - Single-column vertical stacking.
  - Tables automatically collapse into touch-friendly card layouts.
  - Minimum touch target height: 44px for all buttons and interactive controls.
  - **Zero horizontal page overflow** (enforced by `overflow-x: hidden` on viewport containers).

---

## 5. Screen Specifications

### 5.1 Login & Mandatory Password Change (Handout Page 8)

#### A. Login Screen (`/login`)

- **Layout**: Centered card (`max-width: 420px`) on neutral background (`#F5F7F6`).
- **Header**: TokTickIT logo in Primary Green, title `"Sign in to your account"`.
- **Form Controls**:
  - Email Address input (`type="email"`, placeholder `name@toktick.it`).
  - Password input (`type="password"` with show/hide password toggle eye icon).
  - "Sign In" Primary Button (with loading spinner during authentication).
- **Error Feedback**:
  - Generic alert banner on bad credentials or inactive accounts: `"Invalid email or password. Please try again."`

#### B. Mandatory Change Password Modal (`/change-password`)

- **Trigger**: Appears when authenticated user has `mustChangePassword: true`.
- **Modal Title**: `"Change Your Password"`.
- **Subheading**: `"You must change your password to continue."`
- **Form Controls**:
  - Current (temporary) password input with eye icon.
  - New password input with eye icon.
  - Confirm new password input with eye icon.
  - Live requirement checklist:
    - [x] Be at least 8 characters
    - [x] Include upper and lower case letters
    - [x] Include a number and a special character
  - "Continue" Primary Button.
- **Behavior**: Modal cannot be dismissed or navigated away from until valid new password is saved.

#### C. Application Shell Header

- **Background**: `#006B3C` (Primary Green).
- **Brand**: TokTickIT brand logo linking to user's home screen.
- **Role-Based Navigation Links**:
  - `Requester`: **My Tickets** | **Create Ticket** | **Profile v**
  - `IT Staff`: **My Queue** | **Create Ticket** | **Profile v**
  - `Administrator`: **Admin** | **Profile v**
- **User Profile Area**: Authenticated user's full name, role badge (`[Requester]`, `[IT Staff]`, `[Administrator]`), and **Logout** action.

---

### 5.2 Requester Regression & Public Comments (Handout Page 8)

#### A. My Tickets (`/tickets`)

- Continues all Lab 2 capabilities: Paginated ticket table, search by ticket number/summary, filter by category/priority/status, sorting.
- Shows tickets owned exclusively by the authenticated Requester.

#### B. Create Ticket (`/create-ticket`)

- Retains Lab 2 form: Summary, Description, Category, Related System, Requested Priority, Attachment uploader (up to 5 files, 5MB limit).
- Automatically associates ownership with authenticated user.

#### C. Requester Ticket Detail (`/tickets/:id`)

- Displays read-only ticket details, status badge, IT priority badge, and attachments list.
- **Public Comments Stream**: Threaded conversation displaying notes from IT Staff and Requester. Includes text area to add new comments.
- **"Problem Appears Resolved" Action**:
  - Displayed when ticket status is `In Progress` or `Waiting for Requester`.
  - Clicking shows a confirmation modal: _"Are you sure the reported issue is resolved?"_
  - Upon confirmation, updates `requesterResolutionPending = true` and posts system notice.

---

### 5.3 IT Staff Ticket Queue (`/staff/queue`) (Handout Page 9)

- **Header / Navigation**: `TikTockIT` | `My Queue` (ticket icon) | `Create Ticket` (plus icon) | `Profile v` dropdown.
- **Queue Toolbar**:
  - Search input: _"Search by ticket number or summary..."_
  - `Filters` button opening popover with Category, Priority, Status, and Assignment toggles.
  - Summary count indicator: _"Showing 1 to 10 of 87 tickets"_.
- **Desktop Table Columns (≥992px)**:
  1. `Ticket No.` (Monospace font, sortable, links to detail e.g. `TKT-2025-001234`)
  2. `Created Date` (Sortable, formatted timestamp)
  3. `Summary` (Bold title, truncated with tooltip)
  4. `Category` (Sortable, name chip)
  5. `Req. Priority` (Priority badge)
  6. `IT Priority` (Priority badge)
  7. `Status` (Sortable, status badge)
  8. `Owner` (Sortable, staff name or muted `"Unassigned"`)
  9. `Actions` ("View" button)
- **Mobile Card View (<768px)**:
  - Card header: Ticket Number + Status Badge.
  - Card body: Summary in bold, Category chip, IT Priority indicator.
  - Card footer: Requester name + Owner avatar/initials + Last Updated timestamp.
- **Pagination Controls**:
  - `< Previous` `1` `2` `3` `4` `5` `...` `9` `Next >` (defaults to 10 items per page, supports 25 and 50).

---

### 5.4 IT Staff Ticket Detail (`/staff/tickets/:id`) (Handout Page 10)

- **Top Bar**: Breadcrumb (`My Queue > Ticket Detail`), Ticket Number heading, and `<- Back to Queue` button.
- **Grouped Ticket Metadata Card**:
  - `Ticket No.`: Read-only monospace string.
  - `Category`: Read-only chip.
  - `Related System`: Read-only text.
  - `Requester`: Read-only requester name.
  - `Requested Priority`: Read-only priority badge.
  - `Current Status`: Dropdown showing only permitted next transitions per BR-15.
  - `Ticket Owner`: Dropdown of active IT Staff and Administrator accounts, with "Claim" quick button if unassigned.
  - `IT Priority`: Dropdown selector (`Low`, `Medium`, `High`, `Critical`).
  - `Summary`: Read-only bold text.
  - `Description`: Read-only body text.
  - `Resolution Summary`: Editable textarea (_"Add resolution summary (visible to requester)..."_), required when status is `Resolved`.
  - `Requester Resolution Banner`: Amber alert banner displayed if Requester marked "Problem Appears Resolved".
- **Communication & Resource Tabs**:
  1. **Public Comments (N)** (Icon: Chat bubble):
     - Shared thread between Requester and IT Staff.
     - Author cards with avatar initials, name, role badge (`[Requester]` or `[IT Support]`), timestamp, and message.
     - _"Add Public Comment"_ textarea + _"Post Comment"_ Primary Button.
  2. **Internal Notes (N)** (Icon: Lock):
     - Distinct amber accent banner: _"Internal IT Note - Not visible to Requester"_.
     - Yellow/cream tinted cards distinguishing notes from public comments.
     - _"Add Internal Note"_ input with lock icon.
  3. **Attachments (N)** (Icon: Paperclip):
     - List active attachments with download link, file size, and soft-remove button.
     - Soft-removed attachments displayed with strikethrough and removal reason.
  4. **Service Actions (0)** (Icon: Wrench):
     - Disabled tab header (_"Actions Taken by IT Staff - Deferred to Lab 4"_).

---

### 5.5 Administrator User Management (`/admin/users`) (Handout Page 12)

- **Header / Navigation**: `TikTockIT` | `Admin` (shield icon) | `Profile v` dropdown.
- **Top Toolbar**:
  - Title: `Users`.
  - `+ Create User` Primary Green button.
  - Search input: _"Search users..."_ (matches Name or Email).
  - `Filters` button: Role filter (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
- **User Table Columns**:
  1. `Name` (Sortable, full name)
  2. `Email` (Email address)
  3. `Role` (Sortable, role badge)
  4. `Status` (Sortable, Active green badge / Inactive red badge)
  5. `Actions` ("Edit", "Reset Password")
- **Create User Modal / Side Drawer**:
  - `Full Name *` input.
  - `Email Address *` input.
  - `Role *` dropdown selector (`Requester`, `IT Staff`, `Administrator`).
  - `Active` toggle switch (`Yes` / `No`, default `Yes`).
  - `Initial Password`: Auto-generated or custom temporary password with helper note: _"User will set password on first login."_
  - `Save User` Primary Button | `Cancel` Button.
- **Edit User Modal**:
  - Editable Name and Email fields.
  - Role dropdown selector.
  - `Active` toggle switch.
  - Safety Guards: Deactivate switch disabled if editing own account or if user is the last active Administrator.
  - `Save User` Primary Button | `Deactivate User` Red outline button | `Cancel` Button.
- **Reset Password Modal**:
  - New Initial Password input.
  - Warning: _"The user will be required to change this password on their next login."_
  - `Confirm Reset` Primary Button | `Cancel` Button.

---

## 6. Required Screen Modes & User Feedback (Handout Section 8.6)

For every major screen, the application defines explicit behavior for create, view, and edit modes alongside comprehensive system feedback states:

| Screen / Feature            | View Mode Behavior                            | Edit / Create Mode Behavior                    | Feedback States (Loading, Empty, Forbidden, Error)                           |
| :-------------------------- | :-------------------------------------------- | :--------------------------------------------- | :--------------------------------------------------------------------------- |
| **Login & Password Change** | Centered login card                           | Change password form with live validation      | - Loading: Button spinner<br>- Safe Failure: Generic 401 alert banner        |
| **Requester My Tickets**    | Paginated list of owned tickets               | Create Ticket form (`/create-ticket`)          | - Empty: "No tickets found"<br>- Loading: Table skeleton                     |
| **Requester Ticket Detail** | Read-only ticket details & attachments        | Add public comment / Signal resolution         | - Forbidden (403/404): "Ticket not found or inaccessible"                    |
| **IT Staff Ticket Queue**   | Shared queue table (desktop) / cards (mobile) | Quick search and multi-filter popover          | - Loading: 5-row pulse skeleton<br>- Empty: "No matching tickets found"      |
| **IT Staff Ticket Detail**  | Grouped operational metadata & tabs           | Inline edit: status, priority, owner, notes    | - Saving: Inline chip spinner<br>- Forbidden: 403 banner if non-staff        |
| **Admin User Management**   | User list table with role/status badges       | Modal/Drawer: Create user, Edit user, Reset pw | - Conflict (409): Inline duplicate email error<br>- Guard error: Toast alert |

---

## 7. Zen Green Visual & Accessibility Checklist (Submission Part 9)

This checklist verifies that all Lab 3 interfaces comply with the Zen Green design language and accessibility standards:

- [x] **Design Consistency**: All primary buttons, headers, and accents strictly use Zen Green tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#2B3B33`, `#F5F7F6`).
- [x] **Role-Based Navigation**: Authenticated shell dynamically presents only authorized destinations per role without leaking forbidden pages.
- [x] **Badges**: Consistent color palettes and borders for all Ticket Statuses (8 values), Priorities (4 values), and Roles (3 values).
- [x] **Editable vs Read-Only Fields**: Read-only fields rendered on soft sage background (`#EEF4F1`) with text cursor; editable inputs have crisp white background and clear borders.
- [x] **Validation Placement**: Validation error text displayed in 12px red font directly underneath invalid input fields with red borders.
- [x] **Focus & Accessibility**: Visible 2px green focus ring (`rgba(11, 122, 70, 0.25)`) on all interactive controls; WCAG AA contrast ratio (≥ 4.5:1) verified.
- [x] **Touch Target Sizes**: Minimum height of 44px for all mobile interactive buttons and controls.
- [x] **Responsive Scaling**: Clean transitions across Desktop (≥992px), Tablet (768–991px), and Mobile (<768px).
- [x] **Clipping & Overlap Prevention**: Typography uses proper truncation with ellipsis and tooltips; zero text overlaps in cards.
- [x] **Horizontal Overflow**: `overflow-x: hidden` enforced on page containers; zero horizontal page scrolling on mobile devices.

---

## 8. Screenshot Artifacts Deliverables

Screenshots must be generated under `artifacts/lab-03/screenshots/` to satisfy Submission Parts 5 through 9:

1. **Authentication (`authentication/`)**:
   - `login-screen.png`: Valid login form in Zen Green styling.
   - `login-invalid-error.png`: Generic 401 error state.
   - `login-inactive-error.png`: Safe failure state for deactivated accounts.
   - `change-password-screen.png`: Mandatory first-login password change screen.
   - `change-password-validation.png`: Password complexity validation checklist failures.
   - `desktop.png`, `tablet.png`, `mobile.png`: Login screen across viewports.
2. **IT Staff Ticket Queue (`staff-queue/`)**:
   - `queue-desktop.png`: Full multi-column queue table on Desktop.
   - `queue-tablet.png`: Tablet viewport representation.
   - `queue-mobile.png`: Mobile card view with badges.
   - `queue-search-filter.png`: Active search and multi-criteria filters.
   - `queue-assigned-to-me.png`: Queue filtered by "Assigned to Me".
   - `queue-empty-state.png`: No tickets found state.
3. **IT Staff Ticket Detail (`staff-ticket-detail/`)**:
   - `ticket-detail-desktop.png`: Full operational layout with resolution summary box.
   - `ticket-claim-reassign.png`: Ticket ownership assignment dropdown.
   - `ticket-priority-update.png`: IT Priority selector and status update.
   - `public-comments-thread.png`: Thread showing Requester and IT Staff comments.
   - `internal-notes-panel.png`: Distinct amber Internal Notes panel.
   - `requester-resolved-badge.png`: Ticket showing Requester resolution indication.
   - `ticket-detail-mobile.png`: Mobile responsive ticket detail.
4. **Administrator User Management (`user-management/`)**:
   - `user-list-desktop.png`: User listing with role and status badges.
   - `create-user-modal.png`: Create user modal with role and initial password.
   - `edit-user-modal.png`: Edit user modal.
   - `reset-password-modal.png`: Reset password modal.
   - `self-deactivation-guard.png`: Error feedback preventing self-deactivation.
   - `sole-admin-guard.png`: Error feedback protecting the last active Administrator.
   - `user-management-mobile.png`: Mobile responsive user management.
