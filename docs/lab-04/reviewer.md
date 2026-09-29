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

| Issue                         | PR Link                                      | ผลการรีวิว | Comment ที่ได้รับ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | เราตอบ/แก้อย่างไร |
| :---------------------------- | :------------------------------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------- |
| Sprint 4 Engineering Contract | https://github.com/jetanin/toktickit/pull/54 | Approve    | Approved<br>Reviewed all specification documents in docs/lab-04/ (specification.md, api-spec.md, ui-spec.md, and tests.md). The engineering contract is complete, robust, internally consistent, and preserves 100% backward compatibility with Labs 1–3.<br>FRs, BRs, ACs, and REST API contracts are fully defined with end-to-end traceability.<br>Test plan comprehensively covers API, UI, E2E, and regression verification adhering to Spec-DD principles.<br>UI specification strictly follows the Zen Green design system across all viewports. | Thank u หลายๆ     |

---

## Pull Requests ที่เราไปรีวิวให้เพื่อน

| Issue                                              | PR Link                                       | ผลการรีวิว | Comment ที่เราให้                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | เพื่อนตอบ/แก้อย่างไร                                 |
| :------------------------------------------------- | :-------------------------------------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| [Lab4] Sprint 4 Engineering Contract               | https://github.com/IEAR2548/TokTickIT/pull/60 | Approve    | การตรวจสอบความพร้อมของระบบผ่านเกณฑ์สำคัญครบถ้วน ทั้งการรักษาความสมบูรณ์ของ Schema โดยใช้ชนิดข้อมูล Int และจำกัด onDelete: Restrict เพื่อป้องกันข้อมูลสูญหายโดยไม่เพิ่มคอลัมน์ซ้ำซ้อน ด้าน Status Transition Matrix ได้รับการปรับปรุงให้รองรับเงื่อนไขใหม่โดยไม่กระทบผลทดสอบเดิมของ Lab 3 พร้อมแยก Error Code สำหรับ INVALID_TRANSITION และ STALE_UPDATE ชัดเจน อีกทั้งยังบังคับใช้ resolutionSummary ก่อนปิดงานตามกฎเดิม ฝั่ง UI ออกแบบ Dashboard ครบทุกบทบาท รองรับ Accessibility 3 ขนาดหน้าจอ และระบุ data-testid ครบถ้วน สอดรับกับแผนการทดสอบทั้ง 10 รูปแบบที่มี Test Traceability เต็ม 100% | ขอบคุณสำหรับคอมเม้นต์ที่ยาวสุด ๆ ของคุณ คุณเจตนินทร์ |
| [Lab4] Actions Taken Foundation (DB + API + Tests) | https://github.com/IEAR2548/TokTickIT/pull/61 | Approve    | Approved ✅ Database model ActionTaken strictly enforces BR-01 (ticketId NOT NULL, onDelete: Restrict). Actions Taken CRUD APIs fully implement Idempotency-Key, 5s deduplication fallback, 15m edit window, cancelled ticket guard, and optimistic concurrency. Verified 19/19 Lab 4 tests and 230/230 server regression tests pass with zero errors.                                                                                                                                                                                                                                          |                                                      |

---

## สรุป
