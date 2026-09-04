# AI Use and Reflection (Lab 02)

I used **Antigravity IDE** (Google DeepMind) with models including **Claude Sonnet 4.6 (Thinking)** **Gemini 3.8 Flash** and **Gemini 2.5 Pro** as my main AI assistant throughout Lab 02, covering specification writing, API design, test planning, database schema decisions, and documentation reviews and I use **Claude** (Anthropic) for planning to do this lab.

## Selected Key Prompts

| Prompt Name                                                         | Actual Prompt Text                                                                                                              | My Reflection                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Draft Sprint Engineering Specification**                          | สรุปมาว่าต้องทำอะไรบ้าง และบอกขั้นตอนการทำทีละขึ้นตอน                                                                           | ได้ list สิ่งที่ต้องทำทั้งหมดและสามารถ divide lab 02 เป็น task ย่อยๆ ได้ พร้อมทั้งเห็นภาพรวมของแลปนี้                                                                                                                                                                                            |
| **Draft Sprint Engineering Specification**                          | ช่วยเขียน specification.md สำหรับ Lab 02 ครอบคลุม Sprint Goal, Scope, FR, BR, UI Summary, Data Model, API Contract, AC, และ DoD | ได้ draft ครบทุก section ในครั้งเดียว ทำให้เห็นภาพรวมของ sprint ได้เร็ว แต่ต้องกลับมาตรวจทุก BR ทีละข้อว่าตรงกับ lab sheet จริงๆ โดยเฉพาะกฎเรื่อง attachment limit และ soft-removal                                                                                                              |
| **Design API Contract for tickets endpoint**                        | ออกแบบ GET /api/tickets ให้รองรับ pagination, search, filter, sort พร้อม query parameters ครบ และบอก error response ทุกกรณี     | ได้โครงสร้าง response JSON ที่มี data array กับ meta object แยกกันชัดเจน แต่ต้องเพิ่ม secondary sort rule และ invalid parameter behavior เอง เพราะ AI ไม่ได้ระบุ edge case พวกนี้ในรอบแรก                                                                                                        |
| **Plan test cases for Lab 02**                                      | สร้าง test plan ครอบคลุม Unit, API, UI, E2E, Style ให้ครบทุก AC โดยใช้ Vitest, Supertest, Playwright                            | ได้ตารางทดสอบที่ครอบคลุมดี แต่ต้องตรวจว่า AC-11 (API failure state) ถูก map กับ automated test จริงหรือแค่ manual ซึ่งเป็นจุดที่ต้องแก้ไขในภายหลัง                                                                                                                                               |
| **Fix missing endpoint in specification.md**                        | specification.md Section 8 ขาด GET /api/attachments/:id ซึ่งมีใน api-spec.md                                                    | AI ตรวจ cross-reference ระหว่าง specification.md กับ api-spec.md และเพิ่ม endpoint ที่หายไปได้ทันที ทำให้เห็นว่าการเขียน spec แยกไฟล์ต้องระวัง sync กัน                                                                                                                                          |
| **Add max page size to API spec**                                   | api-spec.md ระบุ default limit=8 แต่ไม่บอก max permitted page size                                                              | ได้เพิ่ม Maximum: 100 และ invalid parameter rule สำหรับกรณี limit > 100 ทำให้ backend developer รู้ว่าต้อง validate ค่านี้ด้วย                                                                                                                                                                   |
| **Write implementation + audit prompts for coding agent (Issue 3)** | เขียน prompt ทั้งการทำงานและการเช็ค acceptance criteria ให้ agent                                                               | ได้แนวคิดสำคัญคือแยก prompt เป็น 2 ชั้น (ทำงาน / ตรวจสอบตัวเอง) ตรงกับหลักการในหัวข้อ 11.2 ที่ห้าม agent อ้างว่า done โดยไม่มีหลักฐาน ทำให้ AI agent ไม่สามารถ "มั่ว" ว่าเสร็จได้ง่ายๆ                                                                                                           |
| **Add inspect-before-edit step to all prompts**                     | เขียน prompt ใหม่เป็นภาษาอังกฤษ พร้อมให้ agent ตรวจโค้ดปัจจุบันก่อนแก้ เพราะบางไฟล์อาจถูกแก้ไปแล้ว                              | บทเรียนสำคัญที่สุดของ Lab 2 — เพราะงานมีหลาย Issue ต่อเนื่องกัน โค้ดจริงมักเบี่ยงจาก spec ที่วางแผนไว้ตอนแรก (เหมือนที่เจอใน Lab 1 ตอน Prisma version เปลี่ยน breaking change) ถ้าไม่บังคับให้ agent เช็คของจริงก่อนทุกครั้ง จะเสี่ยงแก้ทับของเดิมผิดจุดหรือ assume field/route ที่ไม่มีอยู่แล้ว |
| **Responsive QA — badge color audit (feature/4)**                   | Priority Badge ใน TicketDetail.tsx ใช้สีผิด และ Status Badge ยัง hardcode สีฟ้าตลอด ช่วยเขียน helper function `getPriorityBadgeStyle()` และ `getStatusBadgeStyle()` ให้ตรงกับ Zen Green spec | AI อ่านโค้ดจริงก่อน แล้วพบว่า Status Badge ยังไม่มีใครแก้แม้จะ merge feature/3 ไปแล้ว ทำให้จับ bug ที่หลุดรอดได้ก่อน PR review นอกจากนี้ยังช่วยเขียน unit test ตรวจสีแต่ละ case ให้ด้วย (test #5 ใน TicketDetail.test.tsx) |
| **Tablet layout — hide Category column on tablet (feature/4)**      | หน้า My Tickets ขนาด tablet ตัด column Category ทำให้ข้อมูลแสดงไม่ครบ ใช้ Bootstrap class อะไรถึงจะซ่อนเฉพาะ tablet? | AI แนะนำ `d-none d-lg-table-cell` (แสดงเฉพาะ ≥992 px) และ apply ให้ทั้ง `<th>` และ `<td>` พร้อมเพิ่ม responsive viewport test ใน Playwright ด้วย |
| **E2E test creation (feature/5)**                                   | Before writing the E2E test, inspect the actual UI flow: exact selectors, route paths, field names, and button labels currently used on the Requester Selection, Create Ticket, and My Tickets screens | AI อ่านโค้ดจริงทุกไฟล์ก่อนเขียน test พบว่า App.tsx ใช้ Client-side State Navigation (ไม่ใช่ React Router) และ "Create Ticket" button ใน navbar match 2 element พร้อมกัน ต้องใช้ `exact: true` — ถ้าไม่ inspect ก่อนจะเขียน selector ผิดตั้งแต่ต้น |
| **Playwright webServer config (feature/5)**                         | Configure Playwright ให้ auto-start ทั้ง server (port 3001) และ client (port 5173) ก่อนรัน E2E | AI เพิ่ม `webServer` array ใน `playwright.config.ts` พร้อม `reuseExistingServer: true` ทำให้รัน E2E บน CI หรือเครื่องใหม่ได้โดยไม่ต้องเปิด server เอง |
| **Fix DB pool contention in server tests (feature/5)**              | Server Vitest รัน parallel แล้วมี worker fork error ประปราย แก้ยังไง? | AI วินิจฉัยว่า Vitest เปิด test worker หลายตัวพร้อมกัน แต่ละตัวขอ connection pool ทำให้ PostgreSQL pool exhausted แก้ด้วย `--fileParallelism=false` ใน test script |
| **git cleanup — untrack server/uploads/ (feature/5)**               | server/uploads/*.png ถูก commit ไปแล้วทั้งที่อยู่ใน .gitignore ลบออกจาก tracking ยังไง? | AI รัน `git rm -r --cached server/uploads/` และ commit cleanup แยก แนะนำให้เพิ่ม `uploads/` ใน `server/.gitignore` ด้วยเพื่อป้องกันซ้ำในอนาคต |

## Reflection

Lab 2 ต่างจาก Lab 1 ตรงที่ต้องทำงานร่วมกับ AI สองบทบาทแยกกันชัดเจน — specification
agent สำหรับวางแผนก่อนโค้ด กับ coding agent สำหรับ implement จริง การแยกแบบนี้ช่วย
ลดปัญหาที่เจอตอน Lab 1 ได้มาก เพราะตอน Lab 1 มักจะสั่งให้ AI เขียนโค้ดตรงๆ โดยไม่มี
contract ที่ชัดเจนก่อน พอเจอ edge case (เช่น ownership check, multi-requester) ทีหลัง
ต้องย้อนกลับไปแก้เยอะ

สิ่งที่เรียนรู้เพิ่มคือการเขียน prompt สำหรับ agent ที่ทำงานหลาย Issue ต่อเนื่องกัน
ต้องกันไว้ตั้งแต่ต้นว่าโค้ดจริง ณ ตอนนั้นอาจไม่ตรงกับ spec ที่เขียนไว้ตอนแรก (spec drift)
เพราะแต่ละ Issue อาจมีการแก้ไขเล็กๆ น้อยๆ ระหว่างทางที่ไม่ได้ย้อนกลับไปอัปเดตเอกสาร
การบังคับให้ agent "inspect ก่อน edit" ทุกครั้งและรายงาน mismatch ที่เจอ ทำให้จับ
ปัญหาแบบนี้ได้เร็วขึ้น แทนที่จะปล่อยให้ agent เดาโครงสร้างเก่าแล้วพังตอนรัน test จริง

จุดที่ยังต้องระวังต่อไปคือ ถึงจะมี audit prompt (Prompt B) ให้ agent ตรวจสอบตัวเอง
ก็ยังต้องมีคนตรวจซ้ำอีกชั้นอยู่ดี เพราะ agent อาจรายงานผล test ที่ผ่านจริง แต่ coverage
ยังไม่ครอบคลุมทุก edge case ที่ acceptance criteria ต้องการ (เช่น ownership check
ที่ทดสอบแค่ 1 กรณีอาจไม่พอ) การอ่านโค้ดและผลเทสจริงด้วยตัวเองก่อน merge ทุก PR
ยังจำเป็นอยู่เสมอ ไม่สามารถพึ่ง AI audit เพียงอย่างเดียวได้

สำหรับ feature/4 (Responsive QA) และ feature/5 (E2E Release) พบว่า AI มีประโยชน์มาก
ในการ "ตรวจซ้ำ" สิ่งที่อาจหลุดรอดจากการ implement ก่อนหน้า เช่น Status Badge ที่ยัง
hardcode สี, หรือ selector ที่ match element ผิดตัวใน E2E test แต่สิ่งที่ต้องระวังคือ
AI มักรายงานผลในแง่ดีก่อน ถ้าไม่ขอให้ตรวจซ้ำรอบที่สอง (run twice, confirm identical)
อาจพลาด flaky test ที่ผ่านบางครั้งไม่ผ่านบางครั้งได้ การกำหนดให้ agent ต้อง "run twice
and confirm identical results" ไว้ใน prompt ตั้งแต่ต้นช่วยแก้ปัญหานี้ได้
