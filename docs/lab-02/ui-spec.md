# Lab 2 UI Specification (Zen Green Theme)

## 1. Color Tokens and Intended Use

- **Primary Green** (`#006B3C`): App header, primary actions (e.g., Submit button), and strong emphasis.
- **Secondary Green** (`#0B7A46`): Active tabs, focus accents, text links, and button hover states.
- **Pale Green** (`#EAF6EF`): Selected states, success backgrounds, and subtle section emphasis.
- **Page Background** (`#F5F7F6`): Quiet near-white for the main app background.
- **Surface / Cards**: White (`#FFFFFF`) with a subtle border and restrained shadow.
- **Text**: Dark charcoal-green (not pure black) for comfortable reading.
- **Error**: Dark red text and border for invalid states.
- **Warning**: Amber callout or badge.
- **Success**: Green confirmation with readable text.

## 2. Typography and Spacing

- **Font Family**: Inter, sans-serif
- **Spacing**: 8px base grid

## 3. Controls and States

- **Editable Field**: White background with a clear neutral border.
- **Read-only Field**: Soft gray-green or warm ivory shading (clearly distinct from editable, but readable).
- **Invalid Field**: Dark red border. Validation messages appear immediately below the associated field in dark red text.
- **Disabled Field**: Visually distinct (e.g., muted text, grayed out background) and cannot be activated.
- **Focused Control**: Clear focus ring (e.g., using Secondary Green) visible for keyboard users.
- **Required-field Marker**: A red asterisk `*` placed next to the label.

## 4. Button Hierarchy and States

- **Primary Button**: Solid Primary Green background, white text.
- **Secondary Button**: Outline or lighter background.
- **Tertiary Button**: Text-only (no background, no border), uses Secondary Green (`#0B7A46`) text color. Used for low-emphasis actions such as "Cancel", "Clear Filters", "Change Requester". Hover state adds a subtle underline or pale green background.
- **Destructive Button**: Red background/text for actions like soft-removal.
- **Busy State**: Button shows a loading spinner/text and is disabled while processing (e.g., "Submitting...").

## 5. Screen Layouts and Responsive Rules

- **All Sizes**: No clipped labels, overlapping messages, hidden buttons, or unreadable attachment names at any viewport width.
- **Desktop (>= 992px)**: Multi-column layout as specified. Content centered with a sensible maximum width. Tables used for data lists.
- **Tablet (768-991px)**: Two-column layout where practical. `Summary` and `Description` receive full width.
- **Mobile (< 768px)**: Fields stack vertically. Buttons remain touch-friendly (min 44px height). No horizontal page scrolling. Tables collapse into card views:
  - **Show on Card**:
    - Summary (Bold/larger font, most prominent)
    - Current Status (Badge in top right)
    - Ticket No. (Small/light text, top left above summary)
    - IT Priority (Icon/small colored dot)
    - Last Updated (Gray text, bottom)
    - Requester (Avatar initial/icon + small name, bottom)
  - **Hide on Card (Available in Detail View)**: Created Date, Category, Requested Priority.

## 6. Requester Selection Screen States

- **Loading**: Skeleton cards or a centered spinner displayed while fetching the requester list from `GET /api/dev-requesters`.
- **Loaded (Normal)**: Grid/list of active requester cards, each showing name and email. Clicking a card selects the requester and navigates to My Tickets.
- **Empty State**: When the API returns an empty array (no active requesters), display an illustration with the message: "No active requesters available. Please contact the IT administrator."
- **API Failure State**: When the API request fails (network error or HTTP 5xx), display an error message: "Unable to load requesters. Please try again." with a **Retry** button.

## 7. Application Shell and Navigation

- **Header**: TokTickIT application identity/logo.
- **Navigation**: Links to "My Tickets" and "Create Ticket". Clear active-page indication. Responsive hamburger menu on mobile.
- **User Context**: Active Development Requester identity displayed in the header, with a "Change Requester" action (Tertiary button) to return to the selection screen.

## 8. Form and Page States

- **Initial**: Blank or default values.
- **Loading**: Skeletons or spinners when fetching data.
- **Submitting**: Form disabled, primary action shows busy state.
- **Success**: Clear green confirmation (e.g., showing generated Ticket Number) and prompt for next action.
- **Failure/Error**: Safe error state with form values preserved and clear error message. The user can re-submit without re-entering data.

## 9. Ticket List (My Tickets)

- **Columns**: Ticket No., Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Requester, Last Updated.
- **Controls**: Search input, Filter dropdowns (Category, Priority, Status), Sort options, "Clear Filters" button (Tertiary), and Pagination controls (default 8 items per page).
- **Empty List / No Results**: Display "No Ticket Found".
- **Badges**:
  - **Priority (Requested & IT)**:
    - Low: Green text, light green background.
    - Medium: Orange text, light orange background.
    - High: Red text, light red background.
  - **Status**:
    - Open: Blue text, light blue background.
    - In Progress: Green text, light green background.
    - Pending: Orange text, light orange background.
    - Resolved: Green text, light green background.

## 10. Ticket Detail (Read-only)

- **Layout**: Read-only presentation of ticket fields, clearly separated from the Attachments section.

## 11. Attachment Lifecycle UI

- **Selection**: File input for choosing allowed files (JPG, PNG, WEBP, PDF).
- **Error Presentation**: Inline errors for oversized (>5MB) or invalid file types.
- **Active State**: File name, size, and download link/icon.
- **Uploading State**: Progress indication or busy state.
- **Removed State**: Strikethrough or muted visual indicating soft-removal, removal reason displayed, and download blocked.
- **Unavailable State**: When attachment metadata loads successfully but the physical file is missing from storage, display a warning icon with the text "File unavailable". Use muted styling similar to the Removed State but without a removal reason. Download action is disabled.
- **Soft Removal Action**: Clicking 'Remove' opens a prompt requiring the user to select a reason from a dropdown (including an "Other" option for free-text input).

## 12. Accessibility

- All icon-only controls must have accessible labels (`aria-label`) and tooltips.
- Keyboard focus indicators must remain visible.
- Success and Error states must not rely on color alone (use icons + text).

## 13. Visual Inspection Checklist & Screenshots

Completed audit against Section 8.8 of the labsheet across all 3 viewports (Desktop ≥ 992px, Tablet 768–991px, Mobile < 768px):

| Checklist Item                                                            |  Status  | Evidence & References                                                                                                                                                                                                                                                                                                                |
| :------------------------------------------------------------------------ | :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No clipped labels or unreadable text**                                  | **PASS** | Form inputs, select dropdowns, table headers, and badges have full text visibility across all viewports. (`artifacts/lab-02/screenshots/create-ticket/{desktop,tablet,mobile}.png`, `artifacts/lab-02/screenshots/my-tickets/{desktop,tablet,mobile}.png`)                                                                           |
| **No overlapping text or messages**                                       | **PASS** | Header bar in Ticket Detail stacks cleanly on mobile (`d-flex flex-column flex-sm-row`) without collision between Back button and ticket number. (`artifacts/lab-02/screenshots/ticket-detail/mobile.png`)                                                                                                                           |
| **No unintended horizontal scrolling on mobile**                          | **PASS** | Layout elements, forms, and cards are constrained to viewport width with zero horizontal page scroll. (`artifacts/lab-02/screenshots/{create-ticket,my-tickets,ticket-detail}/mobile.png`)                                                                                                                                           |
| **Consistent badge colors across all pages**                              | **PASS** | Requested Priority: Low (`#0B7A46`/`#EAF6EF`), Medium (`#8A6D00`/`#FEF8E7`), High (`#C5221F`/`#FCE8E6`). Status: New (`#0052CC`/`#DEEBFF`). Identical badges in table and detail screens. (`artifacts/lab-02/screenshots/my-tickets/desktop.png`, `artifacts/lab-02/screenshots/ticket-detail/desktop.png`)                          |
| **Filters, pagination, and attachment controls usable at every viewport** | **PASS** | Filter bar collapses into touch-friendly cards on mobile and grids on tablet/desktop; attachment card stacks neatly below ticket info on tablet/mobile and sits beside on desktop. (`artifacts/lab-02/screenshots/my-tickets/{desktop,tablet,mobile}.png`, `artifacts/lab-02/screenshots/ticket-detail/{desktop,tablet,mobile}.png`) |
| **Buttons are touch-friendly on mobile**                                  | **PASS** | All interactive buttons adhere to `min-height: 44px` on mobile screens per Zen Green guidelines. (`artifacts/lab-02/screenshots/{create-ticket,my-tickets,ticket-detail}/mobile.png`)                                                                                                                                                |

### Generated Screenshot Artifacts (9 of 9 produced)

- **Create Ticket**:
  - Desktop (1280x800): `artifacts/lab-02/screenshots/create-ticket/desktop.png`
  - Tablet (820x1024): `artifacts/lab-02/screenshots/create-ticket/tablet.png`
  - Mobile (375x812): `artifacts/lab-02/screenshots/create-ticket/mobile.png`
- **My Tickets**:
  - Desktop (1280x800): `artifacts/lab-02/screenshots/my-tickets/desktop.png`
  - Tablet (820x1024): `artifacts/lab-02/screenshots/my-tickets/tablet.png`
  - Mobile (375x812): `artifacts/lab-02/screenshots/my-tickets/mobile.png`
- **Ticket Detail**:
  - Desktop (1280x800): `artifacts/lab-02/screenshots/ticket-detail/desktop.png`
  - Tablet (820x1024): `artifacts/lab-02/screenshots/ticket-detail/tablet.png`
  - Mobile (375x812): `artifacts/lab-02/screenshots/ticket-detail/mobile.png`
