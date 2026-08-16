# TokTickIT

TokTickIT (ตอกติ๊กกิต) คือแอปพลิเคชัน IT Service Desk สำหรับแจ้งและติดตามคำขอด้าน Account and Access, Hardware, Software และ Network

โปรเจกต์นี้เป็นส่วนหนึ่งของวิชา CPE 334 Introduction to Software Engineering in the Age of AI Agents

## เทคโนโลยีที่ใช้

- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Testing:** Vitest (frontend/unit) และ Supertest (API)

## สิ่งที่ต้องมีก่อนเริ่ม

ก่อนรันโปรเจกต์นี้ ต้องติดตั้งของพวกนี้ในเครื่องก่อน:

- [Node.js](https://nodejs.org/) เวอร์ชัน 20 ขึ้นไป (แนะนำ LTS)
- [PostgreSQL](https://www.postgresql.org/download/) หรือจะใช้ผ่าน Docker ก็ได้
- npm (มาพร้อม Node.js อยู่แล้ว)

เช็คเวอร์ชันที่ติดตั้งได้ด้วย:

```bash
node --version
npm --version
```

## โครงสร้างโปรเจกต์

```
toktickit/
├── client/          # React frontend
│   ├── src/         # โค้ด frontend
│   └── test/        # ไฟล์ทดสอบ frontend
├── server/          # Express backend + Prisma
│   ├── prisma/      # Schema และ migration files
│   ├── src/         # โค้ด backend
│   └── test/        # ไฟล์ทดสอบ backend
├── docs/            # เอกสารประกอบ
└── README.md
```

## วิธีติดตั้งและรัน

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/jetanin/toktickit.git
cd toktickit
```

### 2. ตั้งค่าฐานข้อมูล PostgreSQL

ถ้ามี PostgreSQL ติดตั้งในเครื่องอยู่แล้ว ให้สร้างฐานข้อมูลชื่อ `toktickit`:

```bash
psql -U postgres -c "CREATE DATABASE toktickit;"
```

หรือถ้าอยากรันผ่าน Docker แทน (ไม่ต้องติดตั้ง PostgreSQL ลงเครื่อง):

```bash
docker run --name toktickit-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=toktickit -p 5432:5432 -d postgres
```

### 3. ตั้งค่าและรัน Backend (server)

```bash
cd server
npm install
```

คัดลอกไฟล์ตัวอย่าง env แล้วแก้ให้ตรงกับฐานข้อมูลของตัวเอง:

```bash
copy .env.example .env
```

เปิดไฟล์ `.env` แล้วแก้บรรทัด `DATABASE_URL` ให้ตรงกับ username/password/port ของ PostgreSQL ที่ใช้จริง เช่น:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit?schema=public"

รัน migration เพื่อสร้างตารางในฐานข้อมูล:

```bash
npx prisma migrate dev
```

รัน seed เพื่อใส่ข้อมูลหมวดหมู่เริ่มต้น (Account and Access, Hardware, Software, Network):

```bash
npx prisma db seed
```

สตาร์ท backend server:

```bash
npm run dev
```

ถ้าทุกอย่างถูกต้อง จะเห็นข้อความ `Server running on port 3001` และสามารถเปิด `http://localhost:3001/api/health` ในเบราว์เซอร์เพื่อเช็คได้ ควรเห็นผลลัพธ์แบบนี้:

```json
{ "status": "ok", "service": "TokTickIT API" }
```

### 4. ตั้งค่าและรัน Frontend (client)

เปิด terminal ใหม่อีกหน้าต่าง (เก็บ backend ไว้รันอยู่) แล้วรัน:

```bash
cd client
npm install
npm run dev
```

Vite จะเปิด dev server ขึ้นมา ปกติจะรันที่ `http://localhost:5173` เปิดลิงก์นี้ในเบราว์เซอร์เพื่อดูหน้าเว็บ

## วิธีรันเทส

### Backend (Supertest)

```bash
cd server
npm test
```

### Frontend (Vitest)

```bash
cd client
npm test
```
