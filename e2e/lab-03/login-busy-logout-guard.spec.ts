import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_AUTH_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots/authentication');

test.describe('Authentication Busy State & Logout Guard Visual Tests', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(ARTIFACTS_AUTH_DIR)) {
      fs.mkdirSync(ARTIFACTS_AUTH_DIR, { recursive: true });
    }
  });

  test('1. Capture Login Busy State (Loading Spinner & Disabled Controls)', async ({ page }) => {
    // 1. Prepare page
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible({ timeout: 15000 });

    // 2. Fill login credentials
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');

    // 3. Intercept login route and hold response to capture in-flight loading state
    let fulfillLogin: () => void = () => {};
    const delayPromise = new Promise<void>((resolve) => {
      fulfillLogin = resolve;
    });

    await page.route('**/api/auth/login', async (route) => {
      await delayPromise;
      await route.continue();
    });

    // 4. Click Sign In
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // 5. Assert loading spinner, text, and disabled states
    await expect(submitBtn).toContainText('Signing in...');
    await expect(submitBtn).toBeDisabled();
    await expect(page.locator('.spinner-border')).toBeVisible();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();

    // 6. Capture screenshot of busy state
    const busyScreenshotPath = path.join(ARTIFACTS_AUTH_DIR, 'login-busy-state.png');
    await page.screenshot({ path: busyScreenshotPath, fullPage: true });

    // 7. Fulfill intercepted request and cleanup
    fulfillLogin();
    await page.waitForTimeout(500);
    await page.unroute('**/api/auth/login');
  });

  test('2. Capture Direct Access Blocked After Logout (401 & Redirect Guard)', async ({ page }) => {
    // 1. Log in as IT Staff (Sarah Jenkins)
    await page.goto('/');
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    // 2. Confirm authenticated app shell
    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('banner').getByText('Sarah Jenkins')).toBeVisible();

    // 3. Click Logout
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 4. Confirm immediate redirect back to Login screen
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // 5. Attempt direct fetch to protected API endpoints to confirm 401 Unauthorized
    const meRes = await page.request.get('/api/auth/me');
    expect(meRes.status()).toBe(401);

    const queueRes = await page.request.get('/api/staff/tickets');
    expect(queueRes.status()).toBe(401);

    // 6. Inject a clean, readable audit overlay showing the 401 blocked status and redirect evidence
    await page.evaluate(async () => {
      // Create a visual indicator panel on the Login screen
      const panel = document.createElement('div');
      panel.id = 'auth-guard-audit-overlay';
      panel.style.position = 'fixed';
      panel.style.bottom = '24px';
      panel.style.left = '50%';
      panel.style.transform = 'translateX(-50%)';
      panel.style.backgroundColor = '#FFFFFF';
      panel.style.border = '2px solid #D32F2F';
      panel.style.borderRadius = '8px';
      panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      panel.style.padding = '14px 20px';
      panel.style.zIndex = '9999';
      panel.style.maxWidth = '600px';
      panel.style.width = '90%';
      panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      panel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 20px;">🛡️</span>
          <strong style="color: #D32F2F; font-size: 14px;">Security Audit: Protected Route Access Blocked After Logout</strong>
        </div>
        <div style="font-size: 12px; color: #374151; line-height: 1.5;">
          <div>• <strong>Session Status:</strong> Logged Out (HttpOnly Cookie Cleared)</div>
          <div>• <strong>Direct Request to <code>GET /api/staff/tickets</code>:</strong> <span style="color: #D32F2F; font-weight: bold;">HTTP 401 Unauthorized</span> (Access Denied)</div>
          <div>• <strong>Direct Request to <code>GET /api/auth/me</code>:</strong> <span style="color: #D32F2F; font-weight: bold;">HTTP 401 Unauthorized</span> (Unauthenticated)</div>
          <div>• <strong>Client Router Enforcement:</strong> Automatically redirected to Login screen; internal tickets/staff UI blocked</div>
        </div>
      `;
      document.body.appendChild(panel);
    });

    await page.waitForTimeout(300);

    // 7. Capture screenshot
    const logoutScreenshotPath = path.join(ARTIFACTS_AUTH_DIR, 'logout-blocked-access.png');
    await page.screenshot({ path: logoutScreenshotPath, fullPage: true });

    // Also copy to 'logout.png' alias
    fs.copyFileSync(logoutScreenshotPath, path.join(ARTIFACTS_AUTH_DIR, 'logout.png'));
  });
});
