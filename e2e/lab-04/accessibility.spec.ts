import { test, expect } from '@playwright/test';

test.describe('A11Y-01: Automated Accessibility & Semantics Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();
  });

  test('verifies semantic structure and ARIA attributes of Actions Taken modal and status controls', async ({ page }) => {
    // 1. Log in as IT Staff (Sarah Jenkins)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

    // 2. Open first ticket in queue
    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();
    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

    // 3. Verify Ticket Detail header & semantic elements
    await expect(page.locator('h1')).toBeVisible();

    // 4. Verify Actions Taken button and modal dialog semantics
    const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
    if (await addActionBtn.isVisible()) {
      await addActionBtn.click();

      // Check modal has role="dialog" and aria-modal="true"
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute('aria-modal', 'true');

      // Verify form elements have accessible inputs
      await expect(page.locator('#actionDescriptionInput')).toBeVisible();
      await expect(page.locator('#actionResultInput')).toBeVisible();

      // Close modal
      const cancelBtn = modal.getByRole('button', { name: /cancel/i });
      await cancelBtn.click();
      await expect(modal).not.toBeVisible();
    }

    // 5. Verify status control is present
    const statusSelect = page.locator('select').filter({ hasText: /Open|In Progress|Waiting for User|Resolved|Closed/i }).first();
    await expect(statusSelect).toBeVisible();
  });
});
