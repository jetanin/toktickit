# AI Use and Reflection (Lab 02)

I used **Antigravity IDE** (Google DeepMind) with models including **Claude Sonnet 4.6 (Thinking)** and **Gemini 2.5 Pro** as my main AI assistant throughout Lab 02, covering specification writing, API design, test planning, database schema decisions, and documentation reviews and I use **Claude** (Anthropic) for planning to do this lab.

## Selected Key Prompts

| Prompt Name | Actual Prompt Text | My Reflection |
| :---------- | :----------------- | :------------ |
| **Draft Sprint Engineering Specification** | สรุปมาว่าต้องทำอะไรบ้าง และบอกขั้นตอนการทำทีละขึ้นตอน | ได้ list สิ่งที่ต้องทำทั้งหมดและสามารถ divide lab 02 เป็น task ย่อยๆ ได้ พร้อมทั้งเห็นภาพรวมของแลปนี้ |
| **Draft Sprint Engineering Specification** | ช่วยเขียน specification.md สำหรับ Lab 02 ครอบคลุม Sprint Goal, Scope, FR, BR, UI Summary, Data Model, API Contract, AC, และ DoD | ได้ draft ครบทุก section ในครั้งเดียว ทำให้เห็นภาพรวมของ sprint ได้เร็ว แต่ต้องกลับมาตรวจทุก BR ทีละข้อว่าตรงกับ lab sheet จริงๆ โดยเฉพาะกฎเรื่อง attachment limit และ soft-removal |
| **Design API Contract for tickets endpoint** | ออกแบบ GET /api/tickets ให้รองรับ pagination, search, filter, sort พร้อม query parameters ครบ และบอก error response ทุกกรณี | ได้โครงสร้าง response JSON ที่มี data array กับ meta object แยกกันชัดเจน แต่ต้องเพิ่ม secondary sort rule และ invalid parameter behavior เอง เพราะ AI ไม่ได้ระบุ edge case พวกนี้ในรอบแรก |
| **Plan test cases for Lab 02** | สร้าง test plan ครอบคลุม Unit, API, UI, E2E, Style ให้ครบทุก AC โดยใช้ Vitest, Supertest, Playwright | ได้ตารางทดสอบที่ครอบคลุมดี แต่ต้องตรวจว่า AC-11 (API failure state) ถูก map กับ automated test จริงหรือแค่ manual ซึ่งเป็นจุดที่ต้องแก้ไขในภายหลัง |
| **Fix missing endpoint in specification.md** | specification.md Section 8 ขาด GET /api/attachments/:id ซึ่งมีใน api-spec.md | AI ตรวจ cross-reference ระหว่าง specification.md กับ api-spec.md และเพิ่ม endpoint ที่หายไปได้ทันที ทำให้เห็นว่าการเขียน spec แยกไฟล์ต้องระวัง sync กัน |
| **Add max page size to API spec** | api-spec.md ระบุ default limit=8 แต่ไม่บอก max permitted page size | ได้เพิ่ม Maximum: 100 และ invalid parameter rule สำหรับกรณี limit > 100 ทำให้ backend developer รู้ว่าต้อง validate ค่านี้ด้วย |

## Reflection

