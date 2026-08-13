# Automated Tests (Lab 01)

Test files: `server/test/lab-01/` และ `client/test/lab-01/`

| Test ID | Tool      | Test Description                                                                     | Result |
| ------- | --------- | ------------------------------------------------------------------------------------ | ------ |
| API-01  | Supertest | GET /api/health returns 200 and status ok                                            | Pass   |
| API-02  | Supertest | GET /api/categories should return 200 OK and an array of categories                  | Pass   |
| API-03  | Supertest | GET /api/categories should return categories with id and name properties             | Pass   |
| UI-01   | Vitest    | App displays all categories returned by the API                                      | Pass   |
| UI-02   | Vitest    | App shows an error message when the categories API fails                             | Pass   |
| UI-03   | Vitest    | App shows an error when a network error occurs                                       | Pass   |

## วิธีรันทดสอบ

Backend:

```bash
cd server
npx vitest run
```

Frontend:

```bash
cd client
npx vitest run
```

## หลักฐานผลการรัน

**Server Test Output:**

```text
 RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/server

 ✓ test/lab-01/categories.test.ts (2 tests) 20ms
 ✓ test/lab-01/health.test.ts (1 test) 13ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
```

**Client Test Output:**

```text
 RUN  v4.1.10 C:/Work/2569/CPE334/toktickit/client

 ✓ test/App.test.tsx (3 tests) 114ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```
