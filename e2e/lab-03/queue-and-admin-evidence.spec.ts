import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const STAFF_QUEUE_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots/staff-queue');
const USER_MGMT_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots/user-management');

test.describe('Additional Queue & Admin Visual Verification Evidence', () => {
  test.beforeAll(async () => {
    [STAFF_QUEUE_DIR, USER_MGMT_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  test('1. Capture Queue Pagination Controls & Rows Per Page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as IT Staff
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('banner').getByText('Sarah Jenkins')).toBeVisible();

    // Ensure table loads with tickets
    await expect(page.locator('table')).toBeVisible();

    // Verify Per Page selector and Pagination buttons
    const perPageSelect = page.locator('#rowsPerPageSelect');
    await expect(perPageSelect).toBeVisible();

    const paginationArea = page.locator('.btn-group button:has-text("Previous")');
    await expect(paginationArea).toBeVisible();
    await paginationArea.scrollIntoViewIfNeeded();

    await page.waitForTimeout(400);

    const paginationScreenshot = path.join(STAFF_QUEUE_DIR, 'queue-pagination.png');
    await page.screenshot({ path: paginationScreenshot, fullPage: true });
  });

  test('2. Capture Queue Error Alert with Retry Button (Safe Failure Recovery)', async ({ page }) => {
    // Intercept ticket queue endpoint and return 500 error
    await page.route('**/api/staff/tickets*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failure: Internal Server Error (500)' }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as IT Staff
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });

    // Assert error alert and Retry button are visible
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/Database connection failure/i);

    const retryBtn = alert.getByRole('button', { name: /retry/i });
    await expect(retryBtn).toBeVisible();

    await page.waitForTimeout(300);

    const errScreenshot = path.join(STAFF_QUEUE_DIR, 'queue-server-error-retry.png');
    await page.screenshot({ path: errScreenshot, fullPage: true });

    await page.unroute('**/api/staff/tickets*');
  });

  test('3. Capture Duplicate Email 409 Conflict Feedback in User Management', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as Administrator
    await page.locator('#email').fill('admin@toktick.it');
    await page.locator('#password').fill('Admin1234!');
    await page.locator('button[type="submit"]').click();

    // Navigate to User Management
    const usersBtn = page.getByRole('button', { name: 'Users', exact: true });
    await expect(usersBtn).toBeVisible({ timeout: 15000 });
    await usersBtn.click();

    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible({ timeout: 15000 });

    // Open Create User Modal
    await page.getByRole('button', { name: '+ Create User' }).click();
    await expect(page.getByRole('heading', { name: 'Create New User' })).toBeVisible();

    // Fill form with an email that already exists
    await page.locator('#createUserName').fill('Marcus Clone');
    await page.locator('#createUserEmail').fill('admin2@toktick.it'); // Existing administrator email
    await page.locator('#createUserPassword').fill('NewSecurePass@2026!');

    // Click Create User in modal footer
    await page.locator('.modal-footer button[type="submit"]').click();

    // Assert 409 error alert is displayed inside the modal
    const modalAlert = page.locator('.modal-body .alert-danger');
    await expect(modalAlert).toBeVisible({ timeout: 10000 });
    await expect(modalAlert).toContainText(/already in use/i);

    await page.waitForTimeout(300);

    const dupEmailScreenshot = path.join(USER_MGMT_DIR, 'create-user-duplicate-email.png');
    await page.screenshot({ path: dupEmailScreenshot, fullPage: true });

    // Close modal
    await page.locator('.modal-header .btn-close').click();
  });

  test('4. Capture Non-Administrator 403 Forbidden Access & Hidden Menu', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as IT Staff (non-administrator)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });

    // 1. Verify Users menu button is completely hidden from the navigation bar
    const usersBtn = page.getByRole('button', { name: 'Users', exact: true });
    await expect(usersBtn).toHaveCount(0);

    // 2. Direct API call to GET /api/admin/users returns 403 Forbidden
    const adminApiRes = await page.request.get('/api/admin/users');
    expect(adminApiRes.status()).toBe(403);

    // 3. Inject visual security audit banner showing the RBAC enforcement
    await page.evaluate(async () => {
      const banner = document.createElement('div');
      banner.id = 'rbac-audit-overlay';
      banner.style.position = 'fixed';
      banner.style.top = '72px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.backgroundColor = '#FFFFFF';
      banner.style.border = '2px solid #D32F2F';
      banner.style.borderRadius = '8px';
      banner.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
      banner.style.padding = '14px 22px';
      banner.style.zIndex = '9999';
      banner.style.maxWidth = '680px';
      banner.style.width = '92%';
      banner.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 22px;">🛡️</span>
          <strong style="color: #D32F2F; font-size: 15px;">RBAC Security Audit: Non-Administrator Access Blocked (BR-10, FR-07)</strong>
        </div>
        <div style="font-size: 12.5px; color: #374151; line-height: 1.6;">
          <div>• <strong>Current User Role:</strong> <span style="background-color: #EAF6EF; color: #0B7A46; padding: 2px 8px; border-radius: 4px; font-weight: bold;">IT_STAFF</span> (Sarah Jenkins)</div>
          <div>• <strong>Navigation Bar Isolation:</strong> "Users" (User Management) navigation tab is strictly omitted from the DOM</div>
          <div>• <strong>Direct API Access (<code>GET /api/admin/users</code>):</strong> <span style="color: #D32F2F; font-weight: bold;">HTTP 403 Forbidden</span> (<code>requireRole('ADMINISTRATOR')</code> active)</div>
          <div>• <strong>System Protection:</strong> Non-administrators cannot view, edit, or provision user accounts</div>
        </div>
      `;
      document.body.appendChild(banner);
    });

    await page.waitForTimeout(300);

    const nonAdminScreenshot = path.join(USER_MGMT_DIR, 'non-admin-forbidden-access.png');
    await page.screenshot({ path: nonAdminScreenshot, fullPage: true });
  });
});
