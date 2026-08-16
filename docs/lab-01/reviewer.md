# Peer Review Record (Lab 01)

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

| Issue                 | PR Link                                     | ผลการรีวิว        | Comment ที่ได้รับ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | เราตอบ/แก้อย่างไร                                |
| --------------------- | ------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1. Project Foundation | https://github.com/jetanin/toktickit/pull/5 | Approved          | "Very good mr.In! All criteria pass. Ready to merge."                                                                                                                                                                                                                                                                                                                                                                                                                              | Thank you krub.                                  |
| 2. API Health Check   | https://github.com/jetanin/toktickit/pull/6 | Approved          | "Approved! I've tested the API health check endpoint and the frontend, GET /api/health returns status 200 with the correct JSON response., Supertest passes., Frontend handles both online and offline backend states correctly. But I recommend changing error strings like HTTP error! Status: 502 to something more user-friendly and easy to understand in order to provide a better user experience; for example, "Unable to connect to the server. Please try again later."" | "I have already fix error alert."                |
| 3. Category Seed      | https://github.com/jetanin/toktickit/pull/7 | Approved          | "Approved! Passed all safety checks and criteria Schema & Migration: The Category model and migration function without issues., Idempotent Seed: Running the data seed multiple times correctly adds all 4 category items without creating duplicates., Security: The .env file is ignored, database credentials are not exposed, and DATABASE_URL is securely loaded via process.env. Ready to merge."                                                                            | thanks MR.Ear.                                   |
| 4. Category List      | https://github.com/jetanin/toktickit/pull/8 | suggested changes | Everything passes except for "A Vitest test verifies the category-list UI behavior" due to a path error in vitest.config.ts. You can fix it by updating setupFiles from './test/setupTests.ts' to './test/lab-01/setupTests.ts'.                                                                                                                                                                                                                                                   | Thanks Mr.Phapangkorn. I already fix it leaw na. |

---

## Pull Requests ที่เราไปรีวิวให้เพื่อน

| Issue                 | PR Link                                      | ผลการรีวิว | Comment ที่เราให้                                                                                                                                                                                                                                                                                                                                                               | เพื่อนตอบ/แก้อย่างไร                   |
| --------------------- | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1. Project Foundation | https://github.com/IEAR2548/TokTickIT/pull/5 | Approved   | "Its ok! Feature 1 has done. Ready for do next step. :)"                                                                                                                                                                                                                                                                                                                        | "thank you, Mr. In."                   |
| 2. API Health Check   | https://github.com/IEAR2548/TokTickIT/pull/6 | Approved   | "all features can run correctly and meet the all acceptance criteria. Ready to merge krub."                                                                                                                                                                                                                                                                                     | -                                      |
| 3. Category Seed      | https://github.com/IEAR2548/TokTickIT/pull/7 | Approved   | ✅ Category model มี id, unique name, createdAt ครบ ✅ Migration สร้างตาราง Category สำเร็จ ✅ Seed insert ครบ 4 categories ตรงชื่อ ✅ รัน seed ซ้ำ 3 รอบแล้วไม่มีข้อมูลซ้ำ (ยังคง 4 แถว) ✅ ไม่พบ .env หรือรหัสผ่านจริงถูก commit Good job Mr.Ear. U have been approved for merge.                                                                                             | -                                      |
| 4. Category List      | https://github.com/IEAR2548/TokTickIT/pull/8 | Approved   | ✅ GET /api/categories ดึงจาก PostgreSQL ผ่าน Prisma จริง (ไม่ hardcode), ✅ ลำดับ id/name คงที่ทุกครั้งที่เรียก (มี orderBy), ✅ มี Supertest ทดสอบ endpoint และผ่าน, ✅ React แสดงข้อมูลจาก API จริง ไม่ hardcode, ✅ มี loading state ที่สังเกตเห็นได้จริง, ✅ มี error state ที่มีข้อความเป็นประโยชน์เมื่อ backend ล่ม, ✅ มี Vitest ทดสอบพฤติกรรม UI category list และผ่าน | Thank you for your effort, Mr.Jetanin. |

---

## สรุป

การรีวิวทั้งสองทางช่วยจับจุดที่มองข้ามไปได้ เช่น error message ที่ไม่สื่อความหมายพอ และไฟล์ตัวอย่าง .env ที่ไม่ครบ ทำให้งานทั้งสองฝั่งมีคุณภาพดีขึ้นก่อน merge เข้า lab1-staging
