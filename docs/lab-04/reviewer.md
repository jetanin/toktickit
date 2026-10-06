# Peer Review Record (Lab 04)

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

| Issue                         | PR Link                                      | ผลการรีวิว | Comment ที่ได้รับ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | เราตอบ/แก้อย่างไร   |
| :---------------------------- | :------------------------------------------- | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| Sprint 4 Engineering Contract | https://github.com/jetanin/toktickit/pull/54 | Approve    | Approved<br>Reviewed all specification documents in docs/lab-04/ (specification.md, api-spec.md, ui-spec.md, and tests.md). The engineering contract is complete, robust, internally consistent, and preserves 100% backward compatibility with Labs 1–3.<br>FRs, BRs, ACs, and REST API contracts are fully defined with end-to-end traceability.<br>Test plan comprehensively covers API, UI, E2E, and regression verification adhering to Spec-DD principles.<br>UI specification strictly follows the Zen Green design system across all viewports.               | Thank u หลายๆ       |
| Actions Taken Foundation      | https://github.com/jetanin/toktickit/pull/55 | Approve    | Approved<br>The ActionTaken database schema, migration, and CRUD APIs fully conform to the Lab 4 specification. RBAC, caller auto-attribution (performedById), and follow-up validation rules are strictly enforced. The accompanying test suite comprehensively covers the test inventory (API-01 through API-10b).                                                                                                                                                                                                                                                  | Thx MR.Paphangkorn. |
| Actions Taken UI              | https://github.com/jetanin/toktickit/pull/56 | Approve    | Approved.<br><br>UI implementation on TicketDetail strictly complies with Lab 4 UI Spec (Section 3.4) and Zen Green design tokens.<br>Actions Taken table/card views, modal validations (mandatory description/result, conditional follow-up note), auto-captured Performed By, and role-based read-only views for Requesters are properly handled.<br>All 7/7 component tests in ActionsTaken.test.tsx and 81/81 client regression tests pass without errors.                                                                                                        | thank u mr.Ear      |
| Ticket Workflow & Concurrency | https://github.com/jetanin/toktickit/pull/57 | Approve    | Approved.<br><br>Status transition matrix strictly conforms to spec across both frontend dropdown controls and server endpoints.<br>Resolution Gate properly enforces >= 1 Action Taken and mandatory resolution summary (1-1,000 chars) while preserving backward compatibility.<br>Optimistic Concurrency Control is fully functional with Ticket version tracking, 409 CONCURRENCY_CONFLICT handling, and the UI warning banner per UI-spec Section 3.5 C.<br>All client tests (86/86 across 13 suites) and comprehensive server workflow test cases pass cleanly. | Thank you!          |
| Dashboards                    | https://github.com/jetanin/toktickit/pull/58 | Approve    | Approved.<br><br>- Resolution Gate is now universally enforced on the backend, preventing any direct API bypass while keeping legacy regression suites green.<br>- Client-side validation in TicketDetail is hardened to strictly require Action Date/Time and Assignee.<br>- State transitions from Resolved (Closed, Reopened) are verified.<br>- All 88/88 client tests across 13 suites pass with zero failures.                                                                                                                                                  | kob kun kub         |

---

## Pull Requests ที่เราไปรีวิวให้เพื่อน

| Issue                                              | PR Link                                       | ผลการรีวิว | Comment ที่เราให้                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | เพื่อนตอบ/แก้อย่างไร                                 |
| :------------------------------------------------- | :-------------------------------------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| [Lab4] Sprint 4 Engineering Contract               | https://github.com/IEAR2548/TokTickIT/pull/60 | Approve    | การตรวจสอบความพร้อมของระบบผ่านเกณฑ์สำคัญครบถ้วน ทั้งการรักษาความสมบูรณ์ของ Schema โดยใช้ชนิดข้อมูล Int และจำกัด onDelete: Restrict เพื่อป้องกันข้อมูลสูญหายโดยไม่เพิ่มคอลัมน์ซ้ำซ้อน ด้าน Status Transition Matrix ได้รับการปรับปรุงให้รองรับเงื่อนไขใหม่โดยไม่กระทบผลทดสอบเดิมของ Lab 3 พร้อมแยก Error Code สำหรับ INVALID_TRANSITION และ STALE_UPDATE ชัดเจน อีกทั้งยังบังคับใช้ resolutionSummary ก่อนปิดงานตามกฎเดิม ฝั่ง UI ออกแบบ Dashboard ครบทุกบทบาท รองรับ Accessibility 3 ขนาดหน้าจอ และระบุ data-testid ครบถ้วน สอดรับกับแผนการทดสอบทั้ง 10 รูปแบบที่มี Test Traceability เต็ม 100% | ขอบคุณสำหรับคอมเม้นต์ที่ยาวสุด ๆ ของคุณ คุณเจตนินทร์ |
| [Lab4] Actions Taken Foundation (DB + API + Tests) | https://github.com/IEAR2548/TokTickIT/pull/61 | Approve    | Approved ✅ Database model ActionTaken strictly enforces BR-01 (ticketId NOT NULL, onDelete: Restrict). Actions Taken CRUD APIs fully implement Idempotency-Key, 5s deduplication fallback, 15m edit window, cancelled ticket guard, and optimistic concurrency. Verified 19/19 Lab 4 tests and 230/230 server regression tests pass with zero errors.                                                                                                                                                                                                                                          | thank you very much                                  |
| [Lab4] Actions Taken UI                            | https://github.com/IEAR2548/TokTickIT/pull/62 | Approve    | Approved ✅ Actions Taken UI panel fully conforms to ui-spec.md §3; strictly enforces 15m edit window, role boundaries (Requester read-only), 409 STALE_UPDATE draft recovery, and mobile stacked reflow with zero overflow. Server BR-04 validator gap closed. Verified 15/15 component tests, 9/9 responsive/axe E2E tests, and 238/238 server regression tests pass.                                                                                                                                                                                                                         | Okay, I will delete this branch.                     |
| [Lab4] Ticket Workflow                             | https://github.com/IEAR2548/TokTickIT/pull/63 | Approve    | Approved ✅ Ticket workflow fully implements §5.1 matrix, resolution gate (BR-06/07), role-aware cancel (BR-15), 409 STALE_UPDATE conflict/self-retry branching (§10.1), and BR-16 appearsResolved reset. Verified 70/70 Lab 4 server tests (281/281 full regression) and 24/24 client tests (110/110 full regression) pass with zero errors.                                                                                                                                                                                                                                                   | Thank you for everything, my friend.                 |
| [Lab4] Dashboards (Feature/57 lab4 dashboards)     | https://github.com/IEAR2548/TokTickIT/pull/64 | Approve    | Approved ✅ ตรวจสอบละเอียดครบถ้วนตาม docs/lab-04/: Dashboards FR-10..12, Status Exclusivity (BR-11), Open+Reopened bucket (BR-12), 7-day UTC+7 window (BR-13) และ Interactive Links Pre-filtered สมบูรณ์ทุกจุด ทดสอบ 78/78 Server, 29/29 Client, 6/6 E2E ผ่านครบ (289 Server / 115 Client Full regression tests 0 failures)                                                                                                                                                                                                                                                                     | Ok, I am deleting this branch now.                   |
| [Lab4] Final Hardening (Feature/58 lab4 hardening) | https://github.com/IEAR2548/TokTickIT/pull/65 | Approve    | Approved ✅ ตรวจสอบละเอียดครบถ้วนตาม docs/lab-04/: Hardening & Fresh updatedAt (BR-14), API-24 Reopen reset (BR-16), Lab 3 E2E modal adaptation, E2E-01..10 inventory ครบ 100% ผ่านทั้งหมด (291 Server / 115 Client / 54 E2E tests 0 failures, TS 0 errors)                                                                                                                                                                                                                                                                                                                                     |                                                      |

---

## สรุป

### 1. ภาพรวมกระบวนการ Peer Review (Overview)

ใน Sprint 4 (Lab 04) ของ TokTickIT มีการดำเนินกระบวนการ Peer Review ระหว่าง **Jetanin Naitho** (Author) และ **Paphangkorn Luanseng** (Reviewer) อย่างเป็นระบบตามรอบ Feature Branches ครอบคลุมทั้งฝั่งข้อกำหนดสถาปัตยกรรม (Engineering Contracts), โมเดลและการจัดการข้อมูล Actions Taken, หน้าจอส่วนติดต่อผู้ใช้ Ticket Detail & Actions Taken UI, ขั้นตอน Ticket Lifecycle Workflow, Resolution Gate, Optimistic Concurrency Control (OCC), ตลอดจนระบบ Multi-Role Dashboards (Requester, IT Staff, Admin) และการทำ Final Regression Hardening & E2E Verification

การรีวิวแต่ละรอบมุ่งเน้นการปฏิบัติตาม **Specification-Driven Development (Spec-DD)** เพื่อให้มั่นใจว่า:

1. การบันทึก Actions Taken มีการเก็บข้อมูลครบถ้วน ตรวจสอบสิทธิ์ (RBAC) แยกบทบาทอย่างเคร่งครัด (Requester เป็นแบบ Read-only, Staff/Admin สามารถสร้างและแก้ไขได้)
2. การเปลี่ยนสถานะตั๋วปฏิบัติตาม Status Transition Matrix อย่างสมบูรณ์ และมี Resolution Gate บังคับว่าต้องมี Actions Taken อย่างน้อย 1 รายการพร้อม Resolution Summary ก่อนปิดงาน
3. ระบบสามารถตรวจจับการบันทึกชนกัน (OCC Stale Update) และแจ้งเตือนผู้ใช้งานผ่าน UI Banner ได้อย่างปลอดภัยโดยไม่สูญเสียข้อมูล
4. ระบบ Dashboard ของแต่ละบทบาทคำนวณ Metric ทางธุรกิจได้อย่างถูกต้องแม่นยำตามขอบเขตเวลาและเงื่อนไขทางธุรกิจ พร้อม Interactive Pre-filtered Navigation
5. การทดสอบ Full Regression ครอบคลุมทุกระดับ (Server, Client, E2E) ผ่าน 100% ปราศจาก Console Errors หรือการถดถอยของระบบเดิม

---

### 2. สิ่งที่ได้เรียนรู้จากการได้รับ Review (Receiving Feedback)

1. **การเข้มงวดของ Resolution Gate และความเข้ากันได้กับระบบเดิม**:
   - การตรวจทานทำให้เห็นความสำคัญของการบังคับใช้กฎ Resolution Gate แบบ Universal Enforcement เพื่อไม่ให้คำขอ API โดยตรงสามารถหลีกเลี่ยงกฎความปลอดภัยได้ แม้จะไม่มีการส่งโทเค็นเวอร์ชัน OCC มาด้วยก็ตาม
   - ได้เรียนรู้วิธีการปรับปรุง Regression Test Suite เดิมของ Lab 3 ให้สอดรับกับกฎเกณฑ์ใหม่ของ Lab 4 โดยการ pre-seed ข้อมูล Actions Taken เพื่อไม่ให้เกิดข้อผิดพลาดในการทดสอบย้อนหลัง
2. **ความรัดกุมของ Form Validation บน UI**:
   - การระบุเครื่องหมาย `*` บนฟิลด์ที่จำเป็น (เช่น `Assignee` และ `Action Date/Time`) จำเป็นต้องมี Client-side Validation สอดคล้องกันอย่างแท้จริงใน `handleSaveAction` เพื่อป้องกันไม่ให้ผู้ใช้ส่งข้อมูลว่างเปล่าไปยังเซิร์ฟเวอร์
   - การออกแบบ Modal Dialog ที่ถูกต้องตามมาตรฐาน Accessibility (ARIA roles, `aria-modal="true"`, `aria-labelledby`) ช่วยยกระดับคุณภาพของแอปพลิเคชันในระดับมืออาชีพ
3. **การตรวจสอบ Dashboard Metrics และการปิดงานแบบสมบูรณ์ (PR #58)**:
   - ได้รับการยืนยันความถูกต้องของ Resolution Gate ที่ฝั่ง Backend และการตรวจสอบวงจรชีวิตของตั๋วหลังจาก Resolved สู่ Closed และการ Reopen กลับมาทำงานต่อ
   - การรักษาระดับคุณภาพของโค้ดให้ชุดทดสอบ Client ทั้ง 88/88 tests ผ่านอย่างสมบูรณ์โดยไม่มี Failed Suites

---

### 3. สิ่งที่ได้เรียนรู้จากการไป Review ให้เพื่อน (Giving Feedback)

1. **การตรวจสอบ Concurrency Handling & Recovery**:
   - การตรวจสอบโค้ดของคู่ตรวจทำให้เห็นกรณีการจัดการ Optimistic Concurrency ในสถานการณ์ชนกัน (HTTP 409) ที่คำนึงถึง Draft Recovery ของผู้ใช้งาน ช่วยให้ผู้ใช้ไม่ต้องกรอกข้อมูลใหม่ทั้งหมดเมื่อเกิดความขัดแย้งในการบันทึก
2. **การรักษาความสมบูรณ์ของการไหลของสถานะงาน (State Machine Integrity)**:
   - การตรวจสอบ Transition Matrix ครอบคลุมทุก Edge Case (เช่น การ Reopen จาก Closed, หรือการกดยกเลิกตั๋วตามสิทธิ์) ช่วยยืนยันว่าไม่มีช่องโหว่ที่สถานะงานจะกระโดดข้ามขั้นตอนสำคัญโดยไม่ผ่านการอนุมัติหรือการบันทึกการทำงาน
3. **การตรวจสอบความแม่นยำของ Dashboard Metrics & Date Windows (PR #64)**:
   - การตรวจสอบการคำนวณตัวชี้วัดบน Dashboard ของเพื่อนร่วมงาน ทำให้เห็นความสำคัญของการแยกกลุ่มสถานะ (Status Exclusivity, Open + Reopened buckets) และการจัดการ Time Window (เช่น 7-day UTC+7 window) ให้ตรงกับข้อกำหนด เพื่อให้ Metric แสดงผลได้อย่างถูกต้องไม่นับซ้ำ
4. **ความสมบูรณ์ของการทำ Hardening & Fresh State Synchronization (PR #65)**:
   - การตรวจสอบการส่งค่า Timestamp `updatedAt` ล่าสุดกลับมาจากคำสั่ง Mutation ช่วยให้ Client ถือ Concurrency Token ที่เป็นปัจจุบันอยู่เสมอ และการรีเซ็ตค่าสถานะ advisory (`appearsResolved = false`) เมื่อตั๋วถูกเปิดใหม่ (Reopened) ช่วยป้องกัน Logic Deadlock ของวงจรชีวิตตั๋วได้อย่างยอดเยี่ยม
