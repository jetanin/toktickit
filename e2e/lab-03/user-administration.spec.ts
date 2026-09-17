import { test, expect } from '@playwright/test';

test.describe('E2E-04: Administrator User Governance & Onboarding Workflow', () => {
  const timestamp = Date.now();
  const newUserName = `E2E New Tech ${timestamp}`;
  const newUserEmail = `e2e.tech.${timestamp}@toktick.it`;
  const initialPassword = 'TempPassword123!';
  const permanentPassword = 'PermanentPass456!';

  test('admin provisions user, verifies safety guards, and new user completes first-login onboarding', async ({ page }) => {
    // 1. Log in as Administrator (Eleanor Vance)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.locator('#email').fill('admin@toktick.it');
    await page.locator('#password').fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 2. Navigate to User Management
    const usersNavBtn = page.getByRole('button', { name: 'Users', exact: true });
    await expect(usersNavBtn).toBeVisible({ timeout: 15000 });
    await usersNavBtn.click();

    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // 3. Verify Self-Deactivation Guard (BR-24)
    const editSelfBtn = page.getByRole('button', { name: /edit eleanor vance/i });
    if (await editSelfBtn.isVisible()) {
      await editSelfBtn.click();
      await expect(page.getByRole('heading', { level: 2, name: /edit user details/i })).toBeVisible();
      await expect(page.getByRole('switch', { name: /active account/i })).toBeDisabled();
      await expect(page.getByText(/you cannot deactivate your own account \(BR-24\)/i)).toBeVisible();
      await page.getByRole('button', { name: /cancel/i }).click();
    }

    // 4. Create New User with IT_STAFF role and initial password
    await page.getByRole('button', { name: /\+ Create User/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: /create new user/i })).toBeVisible();

    await page.locator('#createUserName').fill(newUserName);
    await page.locator('#createUserEmail').fill(newUserEmail);
    await page.locator('#createUserRole').selectOption('IT_STAFF');
    await page.locator('#createUserPassword').fill(initialPassword);

    await page.getByRole('button', { name: /save user/i }).click();

    // 5. Verify the new user appears in the User Management table
    await expect(page.getByRole('table').getByText(newUserName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('table').getByText(newUserEmail)).toBeVisible();

    // 6. Admin logs out
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    await logoutBtn.click();
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible({ timeout: 10000 });

    // 7. New user logs in with initial password
    await page.locator('#email').fill(newUserEmail);
    await page.locator('#password').fill(initialPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    // 8. New user is forced to change password (mustChangePassword = true)
    await expect(page.getByRole('heading', { name: /change your password/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/action required/i)).toBeVisible();

    // Fill current and new permanent password
    await page.locator('#currentPassword').fill(initialPassword);
    await page.locator('#newPassword').fill(permanentPassword);
    await page.locator('#confirmPassword').fill(permanentPassword);

    const changePassBtn = page.getByRole('button', { name: /change password/i });
    await expect(changePassBtn).toBeEnabled();
    await changePassBtn.click();

    // 9. Successfully unlocks and enters application with IT Staff navigation
    await expect(page.getByRole('heading', { name: /change your password/i })).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText(newUserName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('IT Staff', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /ticket queue/i })).toBeVisible();

    // 10. Clean up session
    await page.request.post('/api/auth/logout').catch(() => {});
  });
});

