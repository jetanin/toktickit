import { test, expect } from '@playwright/test';

test.describe('E2E-01 & E2E-02: Authentication & Password Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();
  });

  test('invalid login: rejects wrong credentials and inactive accounts with generic 401 error', async ({ page }) => {
    // Non-existent user
    await page.locator('#email').fill('nonexistent.user@toktick.it');
    await page.locator('#password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);

    // Inactive user (Kevin Miller is inactive IT Staff)
    await page.locator('#email').fill('kevin.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
  });

  test('valid login and logout lifecycle: blocks access after logout', async ({ page }) => {
    // Valid login as IT Staff (Sarah Jenkins)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Authenticated shell loads
    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('banner').getByText('Sarah Jenkins')).toBeVisible();
    await expect(page.getByText('IT Staff', { exact: true })).toBeVisible();

    // Verify session active via API
    const meRes = await page.request.get('/api/auth/me');
    expect(meRes.ok()).toBe(true);

    // Click logout
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Redirected/rendered Login screen
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Confirm access is blocked after logout: /api/auth/me returns 401
    const meAfterLogout = await page.request.get('/api/auth/me');
    expect(meAfterLogout.status()).toBe(401);
  });

  test('mandatory password change flow: forces change on first login and unlocks app after completion', async ({ page }) => {
    // 1. Provision a dedicated user with mustChangePassword = true via admin API for test isolation
    const tempUserEmail = `mustchange.${Date.now()}@toktick.it`;
    await page.request.post('/api/auth/login', {
      data: { email: 'admin@toktick.it', password: 'Admin1234!' },
    });
    const createRes = await page.request.post('/api/admin/users', {
      data: {
        name: 'Must Change User',
        email: tempUserEmail,
        role: 'REQUESTER',
        initialPassword: 'Password123!',
      },
    });
    expect(createRes.ok()).toBe(true);
    await page.request.post('/api/auth/logout');

    // 2. Log in with initial credentials
    await page.goto('/login');
    await page.locator('#email').fill(tempUserEmail);
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Change Password modal overlay appears
    await expect(page.getByRole('heading', { name: /change your password/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/action required/i)).toBeVisible();

    // Verify submit button is disabled while form is invalid
    const submitBtn = page.getByRole('button', { name: /change password/i });
    await expect(submitBtn).toBeDisabled();

    // Fill current password
    await page.locator('#currentPassword').fill('Password123!');

    // Fill invalid weak password
    await page.locator('#newPassword').fill('weak');
    await page.locator('#confirmPassword').fill('weak');
    await expect(submitBtn).toBeDisabled();

    // Fill valid password matching BR-06
    const validNewPass = 'AlexNewPass@2026!';
    await page.locator('#newPassword').fill(validNewPass);
    await page.locator('#confirmPassword').fill(validNewPass);

    // Button should become enabled
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // After success, modal disappears and user enters portal
    await expect(page.getByRole('heading', { name: /change your password/i })).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('banner').getByText('Must Change User')).toBeVisible({ timeout: 10000 });

    // Clean up session
    await page.request.post('/api/auth/logout').catch(() => {});
  });
});

