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
- **Destructive Button**: Red background/text for actions like soft-removal.
- **Busy State**: Button shows a loading spinner/text and is disabled while processing (e.g., "Submitting...").

## 5. Screen Layouts and Responsive Rules
- **Desktop (>= 992px)**: Multi-column layout as specified. Content centered with a sensible maximum width. Tables used for data lists.
- **Tablet (768-991px)**: Two-column layout where practical. `Summary` and `Description` receive full width.
- **Mobile (< 768px)**: Fields stack vertically. Buttons remain touch-friendly (min 44px height). No horizontal page scrolling. Tables collapse into card views:
  - **Show on Card**: 
    - Summary (Bold/larger font, most prominent)
    - Current Status (Badge in top right)
    - Ticket No. (Small/light text, top left above summary)
    - IT Priority (Icon/small colored dot)
    - Last Updated (Gray text, bottom)
    - Ticket Owner (Avatar initial/icon + small name, bottom)
  - **Hide on Card (Available in Detail View)**: Created Date, Category, Requested Priority.

## 6. Application Shell and Navigation
- **Header**: TokTickIT application identity/logo.
- **Navigation**: Links to "My Tickets" and "Create Ticket". Clear active-page indication. Responsive hamburger menu on mobile.
- **User Context**: Active Development Requester identity displayed in the header, with a "Change Requester" action to return to the selection screen.

## 7. Form and Page States
- **Initial**: Blank or default values.
- **Loading**: Skeletons or spinners when fetching data.
- **Submitting**: Form disabled, primary action shows busy state.
- **Success**: Clear green confirmation (e.g., showing generated Ticket Number) and prompt for next action.
- **Failure/Error**: Safe error state with form values preserved and clear error message.

## 8. Ticket List (My Tickets)
- **Columns**: Ticket No., Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Ticket Owner, Last Updated.
- **Controls**: Search input, Filter dropdowns (Category, Priority, Status), Sort options, "Clear Filters" button, and Pagination controls (default 8 items per page).
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

## 9. Ticket Detail (Read-only)
- **Layout**: Read-only presentation of ticket fields, clearly separated from the Attachments section.

## 10. Attachment Lifecycle UI
- **Selection**: File input for choosing allowed files (JPG, PNG, WEBP, PDF).
- **Error Presentation**: Inline errors for oversized (>5MB) or invalid file types.
- **Active State**: File name, size, and download link/icon.
- **Uploading State**: Progress indication or busy state.
- **Removed State**: Strikethrough or muted visual indicating soft-removal, removal reason displayed, and download blocked.
- **Soft Removal Action**: Clicking 'Remove' opens a prompt requiring the user to select a reason from a dropdown (including an "Other" option for free-text input).

## 11. Accessibility
- All icon-only controls must have accessible labels (`aria-label`) and tooltips.
- Keyboard focus indicators must remain visible.
- Success and Error states must not rely on color alone (use icons + text).

## 12. Visual Inspection Checklist & Screenshots
- [ ] No clipped labels or unreadable text.
- [ ] No overlapping messages or hidden buttons.
- [ ] No unintended horizontal scrolling on mobile.
- **Screenshot Paths**:
  - `artifacts/lab-02/screenshots/create-ticket/desktop.png`
  - `artifacts/lab-02/screenshots/create-ticket/mobile.png`
  - `artifacts/lab-02/screenshots/my-tickets/desktop.png`
  - `artifacts/lab-02/screenshots/ticket-detail/desktop.png`
