# Peer Review Record (Lab 02)

## ผู้ทำ (Author)

- ชื่อ-นามสกุล: Jetanin Naitho
- รหัสนักศึกษา: 67070501011
- GitHub username: jetanin

## ผู้ตรวจ (Reviewer)

- ชื่อ-นามสกุล: Paphangkorn Luanseng
- รหัสนักศึกษา: 67070501083
- GitHub username: IEAR2548

---

## Pull Requests ที่เพื่อนรีวิวให้เรา

| Issue | PR Link | ผลการรีวิว | Comment ที่ได้รับ | เราตอบ/แก้อย่างไร |
| ----- | ------- | ---------- | ----------------- | ----------------- |
| Sprint specification and test plan | https://github.com/jetanin/toktickit/pull/11 | Suggested changes | เพิ่มไฟล์<br><br>docs/lab-02/reviewer.md<br>docs/lab-02/ai-use.md<br>tests.md — ขาดสำคัญมาก (Section 9.2)<br><br>ไม่มี Unit tests เลย (เช่น ticket number format)<br>ไม่มี E2E tests เลย (Lab Sheet กำหนดให้ใช้ Playwright e2e/lab-02/)<br>ไม่มี UI style tests และ responsive tests<br>ทุก test row ขาด column "Automated Test File" (Lab Sheet Section 9.1<br>กำหนดให้ระบุ path จริง เช่น server/tests/lab-02/tickets.api.test.ts)<br>specification.md<br><br>ขาด BR เรื่อง duplicate-submission prevention และ<br>form data retained after API failure<br>ขาด BR เรื่อง safe filename/storage และ<br>upload failure compensation (ticket สร้างได้ แต่ attachment fail)<br>ขาด index/constraint decisions และ justification อย่างน้อย 1 ข้อ<br>(Lab Sheet Section 5.2 บังคับ)<br>Seed data spec ไม่ระบุจำนวนขั้นต่ำ: ≥6 Related Systems,<br>≥4 active Requesters, ≥1 inactive Requester<br>ขาด AC สำหรับ Requester switching, responsive, API failure state<br>api-spec.md<br><br>ทุก endpoint ไม่มี HTTP 500 unexpected error response<br>GET /api/tickets ขาด invalid-parameter behavior และ secondary sort<br>GET /api/tickets/:id ไม่มี example response JSON เลย<br>ui-spec.md<br><br>Requester Selection Screen ขาด: loading state, empty state<br>(กรณีไม่มี active requesters), API-failure state<br>Button hierarchy ขาด Tertiary button<br>ขาด unavailable attachment state<br>ส่วนที่ดีแล้ว<br>โครงสร้าง specification.md ถูกต้องครบ<br>Zen Green color tokens ตรงทุกค่า<br>API endpoints ครบ 10 capabilities<br>AC-01–08 เขียน Given-When-Then ได้ดี<br>AC Traceability Matrix ครบ<br>รอแก้ไข reviewer.md, ai-use.md, และ tests.md ก่อนจะ approve | แก้ไข reviewer.md, ai-use.md, และ tests.md พร้อมทั้งเพิ่ม reviewer.md และ ai-use.md แล้ว |
| <!-- ISSUE_NAME --> | <!-- PR_URL --> | <!-- Approved / Suggested changes --> | <!-- COMMENT --> | <!-- RESPONSE --> |
| <!-- ISSUE_NAME --> | <!-- PR_URL --> | <!-- Approved / Suggested changes --> | <!-- COMMENT --> | <!-- RESPONSE --> |

---

## Pull Requests ที่เราไปรีวิวให้เพื่อน

| Issue | PR Link | ผลการรีวิว | Comment ที่เราให้ | เพื่อนตอบ/แก้อย่างไร |
| ----- | ------- | ---------- | ----------------- | --------------------- |
| <!-- ISSUE_NAME --> | <!-- PR_URL --> | <!-- Approved / Suggested changes --> | <!-- COMMENT --> | <!-- RESPONSE --> |
| <!-- ISSUE_NAME --> | <!-- PR_URL --> | <!-- Approved / Suggested changes --> | <!-- COMMENT --> | <!-- RESPONSE --> |
| <!-- ISSUE_NAME --> | <!-- PR_URL --> | <!-- Approved / Suggested changes --> | <!-- COMMENT --> | <!-- RESPONSE --> |

---

## สรุป
