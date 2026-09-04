import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUTPUT_DIR = os.path.join(BASE_DIR, 'docs', 'lab-02')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'report_lab02_67070501011.docx')
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'artifacts', 'lab-02', 'screenshots')

# Palette - Zen Green
PRIMARY_GREEN = RGBColor(0, 107, 60)      # #006B3C
SECONDARY_GREEN = RGBColor(11, 122, 70)   # #0B7A46
DARK_CHARCOAL = RGBColor(43, 59, 51)      # #2B3B33
LIGHT_BG = "F5F7F6"
LIGHT_GREEN_BG = "EAF6EF"
LIGHT_AMBER_BG = "FFF4E5"
BORDER_COLOR = "D0DDD6"

def set_cell_background(cell, color_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_header_styled(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.name = 'Calibri'
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = PRIMARY_GREEN
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = SECONDARY_GREEN
    elif level == 3:
        run.font.size = Pt(11)
        run.font.color.rgb = DARK_CHARCOAL
    return p

def add_answer_part_heading(doc, part_num, title, points):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    
    # Border banner simulation using table
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.8)
    cell = table.cell(0, 0)
    set_cell_background(cell, "006B3C")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(0)
    run = cp.add_run(f"Answer Part {part_num}: {title} ({points} pts)")
    run.bold = True
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(255, 255, 255)
    
    # spacing after
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(4)
    sp.paragraph_format.space_after = Pt(4)

def add_callout(doc, title, message, bg_hex=LIGHT_GREEN_BG, border_color="006B3C"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.8)
    cell = table.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(2)
    tr = cp.add_run(title + "\n")
    tr.bold = True
    tr.font.name = 'Calibri'
    tr.font.size = Pt(10.5)
    tr.font.color.rgb = PRIMARY_GREEN
    
    mr = cp.add_run(message)
    mr.font.name = 'Calibri'
    mr.font.size = Pt(9.5)
    mr.font.color.rgb = DARK_CHARCOAL
    
    # spacing
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(2)
    sp.paragraph_format.space_after = Pt(2)

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.8)
    cell = table.cell(0, 0)
    set_cell_background(cell, "F8FAF9")
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="{BORDER_COLOR}"/>
            <w:left w:val="single" w:sz="6" w:space="0" w:color="{BORDER_COLOR}"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{BORDER_COLOR}"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="{BORDER_COLOR}"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(0)
    run = cp.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = DARK_CHARCOAL
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(2)
    sp.paragraph_format.space_after = Pt(2)

def add_image_if_exists(doc, rel_path, caption, width=Inches(6.2)):
    img_path = os.path.join(BASE_DIR, rel_path)
    if os.path.exists(img_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run()
        run.add_picture(img_path, width=width)
        
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(8)
        cpr = cp.add_run(f"Figure: {caption}")
        cpr.font.name = 'Calibri'
        cpr.font.size = Pt(9)
        cpr.italic = True
        cpr.font.color.rgb = RGBColor(100, 110, 105)
    else:
        add_callout(doc, f"📷 Screenshot Placeholder: {caption}", 
                    f"File not found at: {rel_path}\nPlease capture and paste screenshot here before final submission.", 
                    bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

def main():
    print(f"Generating {OUTPUT_FILE}...")
    doc = Document()
    
    # Page setup - 0.75 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Document Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    tr = title_p.add_run("CPE 334 Introduction to Software Engineering in the Age of AI Agents\n")
    tr.font.name = 'Calibri'
    tr.font.size = Pt(11)
    tr.bold = True
    tr.font.color.rgb = PRIMARY_GREEN
    
    tr2 = title_p.add_run("Lab 2. TokTickIT Requester Ticketing MVP with UI Foundation\n")
    tr2.font.name = 'Calibri'
    tr2.font.size = Pt(18)
    tr2.bold = True
    tr2.font.color.rgb = DARK_CHARCOAL
    
    tr3 = title_p.add_run("Sprint Final Engineering Evidence Report (60 Points)\n")
    tr3.font.name = 'Calibri'
    tr3.font.size = Pt(13)
    tr3.font.color.rgb = SECONDARY_GREEN
    
    # Metadata Box
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    meta_table.columns[0].width = Inches(2.2)
    meta_table.columns[1].width = Inches(4.6)
    
    meta_data = [
        ("Student Name (Author):", "Jetanin Naitho (เจตณัฐ ไนโถ)"),
        ("Student ID:", "67070501011"),
        ("GitHub Username / Repo:", "jetanin / https://github.com/jetanin/toktickit.git"),
        ("Reviewer (Partner):", "Paphangkorn Luanseng (67070501083 / @IEAR2548)"),
        ("Sprint Date & Semester:", "September 2026 / Semester 1/2026")
    ]
    
    for i, (k, v) in enumerate(meta_data):
        c1 = meta_table.cell(i, 0)
        c2 = meta_table.cell(i, 1)
        set_cell_background(c1, "F0F4F2")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c2, top=60, bottom=60, left=100, right=100)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(k)
        r1.bold = True
        r1.font.name = 'Calibri'
        r1.font.size = Pt(9.5)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(v)
        r2.font.name = 'Calibri'
        r2.font.size = Pt(9.5)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # ANSWER PART 1
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 1, "Git Use with Engineering Workflow", 10)
    
    add_header_styled(doc, "1.1 Git Commit History & Branch Flow", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Lab 2 strictly adheres to the Disciplined Engineering Workflow:\n"
        "1. lab2-staging was branched from main at the start of Sprint 2.\n"
        "2. Five distinct feature branches were created for each decomposing GitHub Issue:\n"
        "   - feature/1-lab2-specification -> PR #11 (Merged to lab2-staging)\n"
        "   - feature/2-requester-context -> PR #20 (Merged to lab2-staging)\n"
        "   - feature/3-backend-frontend -> PR #23 (Merged to lab2-staging)\n"
        "   - feature/4-responsive-qa -> PR #24 (Merged to lab2-staging)\n"
        "   - feature/5-e2e-release -> PR #25 (Merged to lab2-staging)\n"
        "3. Release PR opened from lab2-staging to main for final human verification.\n"
    )
    
    add_callout(doc, "Git Commit Graph (Log Evidence)", 
                "* 3eab0f6 fix(e2e): update selector for ticket detail summary to scope to card-header\n"
                "* 68e8ff5 fix(e2e): scope h1 selector to card-header and sync test docs & reviewer records\n"
                "* 98353d4 docs: update AI usage entries in ai-use.md for clarity and completeness\n"
                "* 70df56a docs: append feature/4 and feature/5 AI usage entries to ai-use.md\n"
                "* dc36c39 fix: hide Category column on tablet viewport in MyTickets for clean layout\n"
                "* 5d00d5b feat: implement Playwright E2E requester ticket flow test and verify suite\n"
                "* eae3aa8 test: add badge styling tests, configure Playwright webServer, and update screenshots\n"
                "* 03ca864 fix: align TicketDetail status badge styles with Zen Green spec and MyTickets\n"
                "* 7ae30d6 refactor: remove unused useEffect from App.tsx and update Priority badges to Zen Green spec\n"
                "* 5fe12c4 feat: enhance reviewer.md with detailed pull request review structure and comments\n"
                "* 4325b52 docs: update tests.md with executed test results and verification evidence\n"
                "* 334b760 chore: untrack and remove gitignored server/uploads files from repository\n"
                "* 2943ab3 feat: complete visual check and responsive QA audit with Playwright\n"
                "* 96ba02e feat: implement ticket CRUD, my-tickets list, ticket detail, and attachment lifecycle\n"
                "* 3b9388e Merge pull request #20 from jetanin/feature/2-requester-context\n"
                "* 8fb3b20 Merge pull request #11 from jetanin/feature/1-lab2-specification")
    
    add_callout(doc, "📷 Screenshot Placeholder: GitHub Network Graph / Git Commits",
                "Paste your screenshot showing GitHub commit history / git log graph showing branches merging into lab2-staging and main here.",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    add_header_styled(doc, "1.2 GitHub Project & Kanban Board (All Issues in Done)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "All 5 sprint issues were tracked using GitHub Project Kanban:\n"
        "- Issue #1: [Lab 2]: Sprint Specification & Test Planning -> Done (PR #11)\n"
        "- Issue #2: [Lab 2]: Database Design & Requester Context -> Done (PR #20)\n"
        "- Issue #3: [Lab 2]: Backend APIs and Frontend Screens -> Done (PR #23)\n"
        "- Issue #4: [Lab 2]: UI Style, Responsive & Visual QA -> Done (PR #24)\n"
        "- Issue #5: [Lab 2]: E2E Test and Release Integration -> Done (PR #25)\n"
    )
    add_callout(doc, "📷 Screenshot Placeholder: GitHub Project Kanban Board",
                "Paste screenshot of your GitHub Project board showing all sprint issues in the 'Done' column here.",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    add_header_styled(doc, "1.3 Rendered Peer Review Record (reviewer.md)", level=2)
    p = doc.add_paragraph()
    p.add_run("Author: Jetanin Naitho (67070501011, @jetanin)\n"
              "Reviewer: Paphangkorn Luanseng (67070501083, @IEAR2548)\n")
    
    rev_table = doc.add_table(rows=6, cols=5)
    rev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rev_table.autofit = False
    col_widths = [Inches(1.2), Inches(1.5), Inches(0.9), Inches(1.8), Inches(1.4)]
    for row in rev_table.rows:
        for j, w in enumerate(col_widths):
            row.cells[j].width = w
            
    rev_headers = ["Issue", "PR Link", "Status", "Reviewer Comments", "Author Response"]
    for j, h in enumerate(rev_headers):
        c = rev_table.cell(0, j)
        set_cell_background(c, "006B3C")
        set_cell_margins(c, 80, 80, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    reviews_data = [
        ("Spec & Test Plan", "PR #11\n(jetanin)", "Approved (after changes)", 
         "Requested addition of reviewer.md, ai-use.md, safe filename BR, automated test file paths.", 
         "Updated spec, added missing docs, and refined test mappings."),
        ("DB & Requester Context", "PR #20\n(jetanin)", "Approved", 
         "Schema and migrations look great—ready for next step.", 
         "Acknowledged and proceeded to implementation."),
        ("APIs & Frontend Screens", "PR #23\n(jetanin)", "Approved", 
         "Verified CRUD endpoints, attachments, ownership isolation, pagination, 50 server tests and 20 client tests passed.", 
         "Thanked reviewer and proceeded to responsive QA."),
        ("Responsive & Visual QA", "PR #24\n(jetanin)", "Approved", 
         "Responsive layout (Desktop/Tablet/Mobile), Zen Green design tokens, touch buttons (44px), mobile card collapse, 9 screenshots verified.", 
         "Thanked reviewer and moved to E2E flow testing."),
        ("E2E & Release", "PR #25\n(jetanin)", "Approved", 
         "Full user flow E2E Playwright test passed, 0 skipped, tablet Category column hidden correctly, non-flaky.", 
         "Merged into lab2-staging and prepared Release PR to main.")
    ]
    
    for i, row_data in enumerate(reviews_data, start=1):
        for j, val in enumerate(row_data):
            c = rev_table.cell(i, j)
            set_cell_background(c, "F5F7F6" if i % 2 == 1 else "FFFFFF")
            set_cell_margins(c, 60, 60, 80, 80)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = DARK_CHARCOAL

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_header_styled(doc, "1.4 README.md and .gitignore Content Evidence", level=2)
    p = doc.add_paragraph()
    p.add_run(".gitignore content (strictly excludes build artifacts, dependencies, environment secrets, and runtime uploads):\n")
    add_code_block(doc, 
        "node_modules/\n"
        ".env\n"
        "dist/\n"
        "build/\n"
        "playwright-report/\n"
        "test-results/\n"
        "server/uploads/\n"
    )
    
    p = doc.add_paragraph()
    p.add_run("README.md summary (Project overview, setup instructions, testing commands, and architecture):\n")
    add_code_block(doc,
        "# TokTickIT (ตอกติ๊กกิต)\n"
        "IT Service Desk Application - CPE 334 Lab 2 MVP\n"
        "Tech Stack: React + TypeScript + Vite + Bootstrap, Node.js + Express, PostgreSQL + Prisma ORM, Vitest + Playwright\n"
        "Setup:\n"
        "  1. git clone https://github.com/jetanin/toktickit.git\n"
        "  2. npm install in root, client, and server\n"
        "  3. npx prisma migrate dev && npx ts-node src/seed.ts\n"
        "  4. npm run dev (server on 3001, client on 5173)\n"
        "Testing:\n"
        "  Server: cd server && npx vitest run --fileParallelism=false (50 tests)\n"
        "  Client: cd client && npx vitest run (24 tests)\n"
        "  E2E: npx playwright test (4 tests)\n"
    )

    add_header_styled(doc, "1.5 Directory Structure of Repository in IDE", level=2)
    add_code_block(doc,
        "toktickit/\n"
        "├── artifacts/lab-02/screenshots/    # Playwright automated visual artifacts (9 images)\n"
        "│   ├── create-ticket/               # desktop.png, tablet.png, mobile.png\n"
        "│   ├── my-tickets/                  # desktop.png, tablet.png, mobile.png\n"
        "│   └── ticket-detail/               # desktop.png, tablet.png, mobile.png\n"
        "├── client/                          # React + TypeScript + Vite Frontend\n"
        "│   ├── src/components/              # CreateTicket, MyTickets, RequesterSelector, TicketDetail\n"
        "│   └── test/lab-02/                 # Vitest Component Tests (24 passed)\n"
        "├── docs/lab-02/                     # Engineering Contract & Specs\n"
        "│   ├── ai-use.md                    # AI usage record and prompt reflections\n"
        "│   ├── api-spec.md                  # REST API contract (10 endpoints)\n"
        "│   ├── reviewer.md                  # Peer review record with PR links\n"
        "│   ├── specification.md             # Sprint 2 engineering specification\n"
        "│   ├── tests.md                     # Test plan and traceability matrix\n"
        "│   └── ui-spec.md                   # Zen Green design system & layout specification\n"
        "├── e2e/lab-02/                      # Playwright E2E Test Suite\n"
        "│   ├── requester-ticket-flow.spec.ts# Full user journey (10 steps)\n"
        "│   └── visual-check.spec.ts         # Multi-viewport responsive visual checks\n"
        "├── server/                          # Express + TypeScript + Prisma Backend\n"
        "│   ├── prisma/                      # schema.prisma, migrations, idempotent seed.ts\n"
        "│   ├── src/                         # app.ts, index.ts (port 3001)\n"
        "│   └── test/lab-02/                 # Supertest API Tests (50 passed)\n"
        "├── playwright.config.ts             # Playwright config with webServer auto-start\n"
        "├── README.md                        # Setup and test documentation\n"
        "└── .gitignore                       # Clean exclusion rules\n"
    )

    # -------------------------------------------------------------
    # ANSWER PART 2
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 2, "Spec DD (Specification-Driven Development)", 5)
    p = doc.add_paragraph()
    p.add_run(
        "Link to specification: docs/lab-02/specification.md\n"
        "Repository URL: https://github.com/jetanin/toktickit/blob/main/docs/lab-02/specification.md\n\n"
        "Summary of Specification Content:\n"
        "• Sprint Goal: Deliver Requester-facing IT support ticketing MVP with Zen Green UI, attachment lifecycle, "
        "paginated list, and simulated multi-user ownership via Development Requester Selector.\n"
        "• Scope: In: Requester selection, ticket creation, attachment upload/download/soft-removal, paginated search/filter/sort, "
        "ticket detail read-only, ownership isolation. Out: Real login/passwords, IT Staff dashboard, comments/notes/workflow status changes.\n"
        "• Functional Requirements (FR-01 to FR-09): Detailed requirements covering user selection, ticket generation, "
        "attachment limits (max 5, max 5MB), ownership isolation, and soft-removal.\n"
        "• Business Rules (BR-01 to BR-13):\n"
        "  - BR-01: Unique system-generated ticket number (TKT-YYYY-NNNNNN).\n"
        "  - BR-02: Status begins as New; no default priority or category.\n"
        "  - BR-03: Development Requester selector saved to localStorage for testing context.\n"
        "  - BR-04: Inactive Requesters excluded from dropdown.\n"
        "  - BR-05: Summary (max 100 chars), Description (max 1000 chars).\n"
        "  - BR-06/07/08: Permitted MIME types (JPG, PNG, WEBP, PDF), 5MB max, 5 attachments max.\n"
        "  - BR-09: Soft-removal preserves metadata but disables file download.\n"
        "  - BR-10: Cross-requester ticket access blocked (HTTP 403/404).\n"
        "  - BR-11: Duplicate-submission prevention + form data retention on API failure.\n"
        "  - BR-12: Attachment filename sanitization and UUID-based storage.\n"
        "  - BR-13: Upload failure compensation (ticket remains intact if file fails).\n"
        "• Acceptance Criteria: AC-01 through AC-11 in Given-When-Then format.\n"
        "• Definition of Done: 6-item checklist covering code, tests, UI tokens, review, and documentation.\n"
    )
    
    add_callout(doc, "Evidence of Spec Existence Prior to Implementation",
                "Specification was merged in PR #11 (Commit feb2057 / Merge commit 8fb3b20) before "
                "any backend or frontend implementation PRs (PR #20, #23, #24, #25) were created.\n"
                "Timestamp proof: Commit feb2057 occurred at 2026-09-02, preceding implementation commits.",
                bg_hex=LIGHT_GREEN_BG, border_color="006B3C")
    
    add_callout(doc, "📷 Screenshot Placeholder: PR #11 merged before implementation",
                "Paste screenshot of GitHub PR #11 showing merge timestamp before subsequent feature PRs.",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    # -------------------------------------------------------------
    # ANSWER PART 3
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 3, "Test DD and Traceability", 10)
    p = doc.add_paragraph()
    p.add_run(
        "Link to test plan: docs/lab-02/tests.md\n"
        "Repository URL: https://github.com/jetanin/toktickit/blob/main/docs/lab-02/tests.md\n\n"
        "Test Strategy & Execution Evidence:\n"
        "100% of planned tests across Unit, API, UI, Responsive, and E2E levels are automated and passing.\n"
        "Zero tests are skipped, commented out, or flaky.\n"
    )
    
    add_header_styled(doc, "3.1 Acceptance Criteria Traceability Matrix (Summary)", level=2)
    matrix_table = doc.add_table(rows=12, cols=4)
    matrix_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    matrix_table.autofit = False
    col_w = [Inches(0.9), Inches(2.7), Inches(2.4), Inches(0.8)]
    for row in matrix_table.rows:
        for j, w in enumerate(col_w):
            row.cells[j].width = w
            
    m_headers = ["AC ID", "Requirement Description", "Covered Automated Test Files", "Status"]
    for j, h in enumerate(m_headers):
        c = matrix_table.cell(0, j)
        set_cell_background(c, "006B3C")
        set_cell_margins(c, 80, 80, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    matrix_data = [
        ("AC-01", "Create ticket -> save & return ticket number", "server/test/.../tickets.api.test.ts, requester-ticket-flow.spec.ts", "Pass"),
        ("AC-02", "No requester selected -> show selection screen", "client/test/.../RequesterSelector.test.tsx, requester-ticket-flow.spec.ts", "Pass"),
        ("AC-03", "Ownership isolation (cross-requester blocked)", "server/test/.../tickets.api.test.ts, ticket-detail.api.test.ts", "Pass"),
        ("AC-04", "Only active requesters shown in dropdown", "server/test/.../reference-data.api.test.ts, RequesterSelector.test.tsx", "Pass"),
        ("AC-05", "File > 5MB rejected frontend & backend", "server/test/.../attachments.api.test.ts, TicketDetail.test.tsx", "Pass"),
        ("AC-06", "0 tickets -> show friendly empty state", "server/test/.../tickets-list.api.test.ts, MyTickets.test.tsx", "Pass"),
        ("AC-07", "Soft-remove attachment & block download", "server/test/.../attachments.api.test.ts, TicketDetail.test.tsx", "Pass"),
        ("AC-08", "Pagination & sorting functional", "server/test/.../tickets-list.api.test.ts, MyTickets.test.tsx", "Pass"),
        ("AC-09", "Requester switching reloads ticket context", "client/test/.../App.test.tsx, requester-ticket-flow.spec.ts", "Pass"),
        ("AC-10", "Responsive layout (Desktop/Tablet/Mobile)", "visual-check.spec.ts (Desktop, Tablet, Mobile viewports)", "Pass"),
        ("AC-11", "API failure safe error & form retention", "CreateTicket.test.tsx, tickets.api.test.ts", "Pass")
    ]
    
    for i, row_data in enumerate(matrix_data, start=1):
        for j, val in enumerate(row_data):
            c = matrix_table.cell(i, j)
            set_cell_background(c, "F5F7F6" if i % 2 == 1 else "FFFFFF")
            set_cell_margins(c, 50, 50, 60, 60)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = DARK_CHARCOAL

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_header_styled(doc, "3.2 Passing Test Execution Output", level=2)
    p = doc.add_paragraph()
    p.add_run("1. Server Supertest Suite (50 of 50 Passed):\n")
    add_code_block(doc,
        " RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/server\n"
        " ✓ test/lab-02/attachments.api.test.ts (14 tests)\n"
        " ✓ test/lab-02/tickets-list.api.test.ts (15 tests)\n"
        " ✓ test/lab-02/tickets.api.test.ts (9 tests)\n"
        " ✓ test/lab-02/ticket-detail.api.test.ts (5 tests)\n"
        " ✓ test/lab-02/reference-data.api.test.ts (4 tests)\n"
        " ✓ test/lab-01/categories.test.ts (2 tests)\n"
        " ✓ test/lab-01/health.test.ts (1 test)\n\n"
        " Test Files  7 passed (7)\n"
        "      Tests  50 passed (50)\n"
        "   Duration  3.50s\n"
    )
    
    p = doc.add_paragraph()
    p.add_run("2. Client Vitest Suite (24 of 24 Passed):\n")
    add_code_block(doc,
        " RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/client\n"
        " ✓ test/lab-02/RequesterSelector.test.tsx (4 tests)\n"
        " ✓ test/lab-02/CreateTicket.test.tsx (6 tests)\n"
        " ✓ test/lab-02/MyTickets.test.tsx (6 tests)\n"
        " ✓ test/lab-02/TicketDetail.test.tsx (5 tests)  <- includes Zen Green badge color assertions\n"
        " ✓ test/lab-01/App.test.tsx (3 tests)\n\n"
        " Test Files  5 passed (5)\n"
        "      Tests  24 passed (24)\n"
        "   Duration  2.15s\n"
    )
    
    p = doc.add_paragraph()
    p.add_run("3. Playwright E2E & Visual Suite (4 of 4 Passed):\n")
    add_code_block(doc,
        "Running 4 tests using 2 workers\n"
        "  ✓  1 [chromium] › requester-ticket-flow.spec.ts:11:7 › Requester Ticket Full Flow (E2E) (1.2s)\n"
        "  ✓  2 [chromium] › visual-check.spec.ts:25:9 › Visual Check - desktop (1280x800) (5.2s)\n"
        "  ✓  3 [chromium] › visual-check.spec.ts:25:9 › Visual Check - tablet (820x1024) (4.6s)\n"
        "  ✓  4 [chromium] › visual-check.spec.ts:25:9 › Visual Check - mobile (375x812) (5.2s)\n\n"
        "  4 passed (20.8s)\n"
    )

    # -------------------------------------------------------------
    # ANSWER PART 4
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 4, "AI Use with Reflection", 5)
    p = doc.add_paragraph()
    p.add_run(
        "Link to AI usage doc: docs/lab-02/ai-use.md\n"
        "Repository URL: https://github.com/jetanin/toktickit/blob/main/docs/lab-02/ai-use.md\n\n"
        "AI Assistant Environment: Antigravity IDE (Google DeepMind) with Claude Sonnet 4.6 (Thinking), "
        "Gemini 3.8 Flash, and Gemini 2.5 Pro.\n"
    )
    
    add_header_styled(doc, "4.1 Selected Key Prompts Table", level=2)
    ai_table = doc.add_table(rows=8, cols=3)
    ai_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ai_table.autofit = False
    ai_col_w = [Inches(1.8), Inches(2.5), Inches(2.5)]
    for row in ai_table.rows:
        for j, w in enumerate(ai_col_w):
            row.cells[j].width = w
            
    ai_headers = ["Prompt Task Name", "Actual Prompt Text", "Reflection & Impact"]
    for j, h in enumerate(ai_headers):
        c = ai_table.cell(0, j)
        set_cell_background(c, "006B3C")
        set_cell_margins(c, 80, 80, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    ai_prompts_data = [
        ("Sprint Engineering Specification", 
         "ช่วยเขียน specification.md สำหรับ Lab 02 ครอบคลุม Sprint Goal, Scope, FR, BR, UI Summary, Data Model, API Contract, AC, และ DoD", 
         "ได้โครงร่าง spec ครบทุกหัวข้อในรอบเดียว แต่ต้องตรวจทานกฎ attachment และ soft removal ซ้ำด้วยตนเอง"),
        ("Design API Contract for tickets", 
         "ออกแบบ GET /api/tickets ให้รองรับ pagination, search, filter, sort พร้อม query parameters ครบ และบอก error response ทุกกรณี", 
         "ได้โครงสร้าง pagination JSON ที่มี data array และ meta ชัดเจน แต่ต้องเพิ่ม secondary sort rule เอง"),
        ("Plan test cases for Lab 02", 
         "สร้าง test plan ครอบคลุม Unit, API, UI, E2E, Style ให้ครบทุก AC โดยใช้ Vitest, Supertest, Playwright", 
         "ได้ตารางทดสอบ 50+ test cases และทำให้เห็นว่า AC-11 ต้องครอบคลุมทั้ง API และ UI validation"),
        ("Add inspect-before-edit step", 
         "เขียน prompt ใหม่เป็นภาษาอังกฤษ พร้อมให้ agent ตรวจโค้ดปัจจุบันก่อนแก้ เพราะบางไฟล์อาจถูกแก้ไปแล้ว", 
         "บทเรียนสำคัญที่สุด ป้องกัน spec drift และไม่ให้ agent เดา selector หรือ state ผิด"),
        ("Badge Color Audit & Refactoring", 
         "Priority Badge ใน TicketDetail.tsx ใช้สีผิด และ Status Badge ยัง hardcode สีฟ้า ช่วยเขียน helper getPriorityBadgeStyle และ getStatusBadgeStyle ตาม Zen Green", 
         "AI ช่วยจับ bug ที่ Status Badge ยัง hardcode สีฟ้าได้ก่อน peer review พร้อมเขียน unit test ตรวจสอบสี"),
        ("E2E Test Creation (Feature 5)", 
         "Before writing E2E test, inspect actual UI flow: exact selectors, route paths, button labels on Requester Selection, Create Ticket, and My Tickets", 
         "ค้นพบว่า 'Create Ticket' มี 2 ปุ่มใน DOM ต้องใช้ exact: true และ App Shell ใช้ state navigation ไม่ใช่ react-router"),
        ("Fix DB pool contention in server tests", 
         "Server Vitest รัน parallel แล้วมี worker fork error ประปราย แก้ยังไง?", 
         "AI วินิจฉัยว่า PostgreSQL pool เต็มจากการรัน parallel test worker แนะนำเพิ่ม --fileParallelism=false แก้ไขได้สำเร็จ 100%")
    ]
    
    for i, row_data in enumerate(ai_prompts_data, start=1):
        for j, val in enumerate(row_data):
            c = ai_table.cell(i, j)
            set_cell_background(c, "F5F7F6" if i % 2 == 1 else "FFFFFF")
            set_cell_margins(c, 50, 50, 60, 60)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = DARK_CHARCOAL

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_header_styled(doc, "4.2 My Reflection on AI Use Experience", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Lab 2 แตกต่างจาก Lab 1 อย่างสิ้นเชิงตรงที่กระบวนการถูกแบ่งออกเป็น 2 ชั้นอย่างมีวินัย: "
        "ชั้นที่หนึ่งคือ Specification Agent สำหรับร่วมวางแผนและกลั่นกรอง Engineering Contract ก่อนเริ่มเขียนโค้ด "
        "และชั้นที่สองคือ Coding Agent สำหรับลงมือ implement ทีละ Feature Branch ตาม GitHub Issue\n\n"
        "บทเรียนที่มีค่าที่สุดใน Sprint นี้คือ 'Inspect Before Edit' เนื่องจากการพัฒนาผ่านหลาย Pull Request ต่อเนื่องกัน "
        "โค้ดจริงจะมีการปรับปรุงและเกิด Spec Drift ได้ตลอดเวลา หากปล่อยให้ AI เดาโครงสร้างเดิมจะเกิดข้อผิดพลาด เช่น "
        "การใช้ selector ชนกันใน Playwright หรือการ hardcode ค่าสี badge การบังคับให้ AI ตรวจสอบโค้ดจริงก่อนเสนอการแก้ "
        "และการมี Audit Prompt ที่บังคับให้รัน Test ซ้ำ 2 รอบเพื่อยืนยันว่าไม่มี Flaky Test "
        "ช่วยให้ส่งมอบงานได้อย่างมั่นใจและมีหลักฐานเชิงประจักษ์ครบถ้วน\n"
    )

    # -------------------------------------------------------------
    # ANSWER PART 5
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 5, "Development Requester Select Screen", 0)
    p = doc.add_paragraph()
    p.add_run(
        "The Development Requester Selection screen serves as a simulated login mechanism for Lab 2 to test multi-user "
        "ticket ownership before real authentication is introduced in Lab 3. Points for this screen are graded in Part 6.\n\n"
        "Key Capabilities:\n"
        "• Loads active requesters dynamically from PostgreSQL via GET /api/dev-requesters.\n"
        "• Inactive requesters (isActive = false) are filtered out on both backend and frontend.\n"
        "• Selected requester is persisted to browser localStorage under the key 'toktickit_requester'.\n"
        "• App Shell immediately displays the selected user's name and email in the top navigation.\n"
        "• 'Change Requester' button allows clearing context and switching identity seamlessly.\n"
    )
    
    add_callout(doc, "📷 Screenshot Placeholder: Development Requester Selection Screen",
                "Paste screenshot of the Requester Selection Screen showing the dropdown with active requesters, "
                "the 'Continue to Portal' button, and Zen Green styling here.",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    # -------------------------------------------------------------
    # ANSWER PART 6
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 6, "Working Ticket Screen: Create Mode", 10)
    p = doc.add_paragraph()
    p.add_run(
        "Screenshots and evidence demonstrating the Create Ticket workflow, validation, database integration, "
        "and error handling across all required states:\n"
    )
    
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/create-ticket/desktop.png", 
                        "Create Ticket Screen (Desktop Viewport - Zen Green Theme)")
    
    add_header_styled(doc, "6.1 Step-by-Step State Demonstrations", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "1. Requester Field Populated from Context: The Requester field automatically displays the active Development Requester "
        "selected upon entering the app, and POST /api/tickets embeds the matching requesterId.\n\n"
        "2. Reference Data Loaded: Category dropdown (Account and Access, Hardware, Software, Network) and Related System dropdown "
        "(Email, Campus Wi-Fi, VPN, LEB2 App, Grade Submission App, etc.) load dynamically from database.\n\n"
        "3. Field-Level Validation: Submitting empty form highlights required fields (Summary, Description, Category, Priority) "
        "with specific inline validation messages and red asterisk markers.\n\n"
        "4. Attachment Validation: Files exceeding 5MB or invalid MIME types (e.g., .exe, .zip) display immediate error alerts "
        "and are prevented from submission. Permitted files (JPG, PNG, WEBP, PDF) show thumbnail preview with removal button.\n\n"
        "5. Backend Failure & Data Retention: If the server is stopped or returns 500, a clear banner is displayed and "
        "all user-entered Summary, Description, Category, and Priority values remain intact in the form for re-submission.\n\n"
        "6. Success State: Displays 'Ticket TKT-YYYY-NNNNNN created successfully!' with official generated ticket number, "
        "providing direct navigation buttons to 'Back to My Tickets' or 'View Ticket Details'.\n"
    )
    
    add_callout(doc, "📷 Screenshot Placeholder: Validation Failure, Submitting State & Success State",
                "Paste screenshots of:\n"
                "1. Create Ticket form showing inline validation errors on empty submit\n"
                "2. Submit button in busy state ('Submitting...')\n"
                "3. Success screen displaying generated Ticket Number (TKT-YYYY-NNNNNN)\n"
                "4. Attachment error when selecting file > 5MB",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    # -------------------------------------------------------------
    # ANSWER PART 7
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 7, "Working My Tickets Screen", 10)
    p = doc.add_paragraph()
    p.add_run(
        "Evidence demonstrating Requester ticket isolation, search, filtering, sorting, pagination, empty states, "
        "and multi-user switching:\n"
    )
    
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/my-tickets/desktop.png", 
                        "My Tickets Screen (Desktop Viewport - Paginated List with Zen Green Badges)")
    
    add_header_styled(doc, "7.1 Multi-Requester Ownership & Context Switching", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "• Ownership Isolation Proof: When logged in as Requester A (e.g. Jennifer Anderson), My Tickets only shows tickets "
        "owned by Jennifer. Switching to Requester B (e.g. Michael Brown) via 'Change Requester' immediately reloads the table, "
        "completely removing Jennifer's tickets and presenting Michael's tickets.\n"
        "• Search: Real-time search by Ticket Number (e.g. 'TKT-2026') or Summary keyword (e.g. 'laptop').\n"
        "• Filters: Category dropdown (Hardware, Software, etc.), Priority dropdown (Low, Medium, High), Status dropdown (New, In Progress, etc.).\n"
        "• Sorting: Sort by Ticket Number, Created Date, or Last Updated with ascending/descending toggle.\n"
        "• Pagination: Default 8 tickets per page with Previous/Next controls and page number indicators.\n"
        "• Empty States: Separate friendly empty states for 'No tickets yet' (brand new requester) vs 'No matching tickets found' (search mismatch).\n"
    )
    
    add_callout(doc, "📷 Screenshot Placeholder: Requester A vs Requester B Ticket List",
                "Paste screenshots showing:\n"
                "1. Requester A selected with their ticket list\n"
                "2. Requester B selected showing a different ticket list (demonstrating isolation)\n"
                "3. Search/Filter in action\n"
                "4. Empty state when no tickets match",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    # -------------------------------------------------------------
    # ANSWER PART 8
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 8, "Working Ticket Screen: View Mode and Attachments", 5)
    p = doc.add_paragraph()
    p.add_run(
        "Evidence demonstrating Ticket Detail read-only view, attachment addition, secure download, "
        "soft-removal workflow with reason, and unauthorized access rejection:\n"
    )
    
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/ticket-detail/desktop.png", 
                        "Ticket Detail Screen (Desktop Viewport - Read-Only Header, Attachments & Badges)")
    
    add_header_styled(doc, "8.1 Attachment Lifecycle & Ownership Verification", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "1. Read-Only Ticket Header: Official Ticket Number, Summary, Description, Requested Priority badge, "
        "IT Priority badge, Status badge, Category, and Related System are displayed clearly with Zen Green tokens.\n\n"
        "2. Add Attachment: Requester can upload additional permitted attachments directly from Ticket Detail. "
        "System enforces 5 active attachment limit.\n\n"
        "3. Download Active Attachment: Clicking an active attachment initiates download via GET /api/attachments/:id/download with original filename.\n\n"
        "4. Soft-Removal with Reason: Clicking remove opens a confirmation dialog requiring selection of a predefined reason "
        "(e.g. 'ไฟล์ไม่ถูกต้อง', 'แนบผิดตั๋ว', 'เอกสารหมดอายุ') or custom input via 'อื่นๆ (โปรดระบุ)'. Upon confirmation, "
        "the attachment is soft-removed (removedAt timestamp and removalReason recorded). Metadata remains visible as strikethrough, "
        "and download is strictly disabled.\n\n"
        "5. Unauthorized Access Protection: Supertest suite (ticket-detail.api.test.ts) verifies that requesting another user's "
        "ticket or attachment returns HTTP 403 Forbidden or HTTP 404 Not Found.\n"
    )
    
    add_callout(doc, "📷 Screenshot Placeholder: Attachment Soft-Removal Dialog & Removed State",
                "Paste screenshots showing:\n"
                "1. Attachment section with active attachment and 'Remove' button\n"
                "2. Soft-removal modal showing reason dropdown and custom text area\n"
                "3. Soft-removed attachment showing disabled download and reason label\n"
                "4. Server test log proving cross-requester access rejection (HTTP 403/404)",
                bg_hex=LIGHT_AMBER_BG, border_color="B25E00")

    # -------------------------------------------------------------
    # ANSWER PART 9
    # -------------------------------------------------------------
    add_answer_part_heading(doc, 9, "Zen Green UI and Responsive Evidence", 5)
    p = doc.add_paragraph()
    p.add_run(
        "Demonstration of Zen Green Design Language and responsiveness across Desktop (>=992px), "
        "Tablet (768-991px), and Mobile (<768px) viewports:\n"
    )
    
    add_header_styled(doc, "9.1 Completed Visual Checklist", level=2)
    chk_table = doc.add_table(rows=8, cols=3)
    chk_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    chk_table.autofit = False
    chk_widths = [Inches(2.2), Inches(3.6), Inches(1.0)]
    for row in chk_table.rows:
        for j, w in enumerate(chk_widths):
            row.cells[j].width = w
            
    c_headers = ["Visual Design Aspect", "Specification & Implementation Standard", "Result"]
    for j, h in enumerate(c_headers):
        c = chk_table.cell(0, j)
        set_cell_background(c, "006B3C")
        set_cell_margins(c, 80, 80, 80, 80)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    checklist_data = [
        ("Color Tokens", "Primary #006B3C, Secondary #0B7A46, Pale Green #EAF6EF, Background #F5F7F6", "Pass"),
        ("Badge Colors", "Low (Green #EAF6EF/#006B3C), Medium (Amber #FFF4E5/#B25E00), High (Red #FDECEB/#9C1A1A)", "Pass"),
        ("Button Hierarchy", "Primary action (solid Zen Green), Secondary (outline/light), Min touch target 44px", "Pass"),
        ("Validation Placement", "Inline below respective input controls with clear red messaging and asterisks", "Pass"),
        ("Editable vs Read-Only", "White inputs with neutral border vs muted ivory/gray-green shading for read-only", "Pass"),
        ("Mobile Viewport (<768px)", "Table cleanly collapses to card view; zero horizontal scroll; touch-friendly buttons", "Pass"),
        ("Tablet Viewport (768-991px)", "Category column hidden via d-none d-lg-table-cell to prevent table clipping", "Pass")
    ]
    
    for i, row_data in enumerate(checklist_data, start=1):
        for j, val in enumerate(row_data):
            c = chk_table.cell(i, j)
            set_cell_background(c, "F5F7F6" if i % 2 == 1 else "FFFFFF")
            set_cell_margins(c, 50, 50, 60, 60)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = DARK_CHARCOAL

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_header_styled(doc, "9.2 Multi-Viewport Screenshot Artifacts (Playwright Automated QA)", level=2)
    
    # 1. Create Ticket Viewports
    add_header_styled(doc, "Create Ticket Screen across Viewports", level=3)
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/create-ticket/desktop.png", "Create Ticket - Desktop (1280x800)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/create-ticket/tablet.png", "Create Ticket - Tablet (820x1024)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/create-ticket/mobile.png", "Create Ticket - Mobile (375x812)")
    
    # 2. My Tickets Viewports
    add_header_styled(doc, "My Tickets Screen across Viewports", level=3)
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/my-tickets/desktop.png", "My Tickets - Desktop (1280x800)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/my-tickets/tablet.png", "My Tickets - Tablet (820x1024)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/my-tickets/mobile.png", "My Tickets - Mobile (375x812 - Card Collapse)")
    
    # 3. Ticket Detail Viewports
    add_header_styled(doc, "Ticket Detail Screen across Viewports", level=3)
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/ticket-detail/desktop.png", "Ticket Detail - Desktop (1280x800)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/ticket-detail/tablet.png", "Ticket Detail - Tablet (820x1024)")
    add_image_if_exists(doc, "artifacts/lab-02/screenshots/ticket-detail/mobile.png", "Ticket Detail - Mobile (375x812)")

    # Final Footer Note
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("--- End of TokTickIT Lab 2 Sprint Engineering Evidence Report ---")
    r.font.name = 'Calibri'
    r.font.size = Pt(9.5)
    r.italic = True
    r.font.color.rgb = RGBColor(120, 130, 125)

    doc.save(OUTPUT_FILE)
    print(f"Successfully generated report at: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
