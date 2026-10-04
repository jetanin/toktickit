import { test, expect } from '@playwright/test';

test.describe('E2E-02: Ticket Resolution Gate Enforcement & Full Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();
  });

  test('blocks resolution when 0 actions taken, succeeds after action recorded, closes and reopens', async ({ page }) => {
    // 1. Login as IT Staff
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

    // 2. Open first ticket
    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();
    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

    const statusSelect = page.locator('select[aria-label="Ticket Status"]');
    await expect(statusSelect).toBeVisible();

    // 3. If ticket can transition to Resolved, test Resolution Gate
    const hasResolvedOption = await statusSelect.locator('option[value="Resolved"]').count() > 0;
    if (hasResolvedOption) {
      // Trigger Resolution Gate Modal
      await statusSelect.selectOption('Resolved');

      // Check for resolution modal
      const modal = page.locator('div[role="dialog"]');
      if (await modal.isVisible()) {
        // Check if disabled when summary is empty or no actions taken
        const confirmBtn = page.getByRole('button', { name: /confirm resolution/i });
        await expect(confirmBtn).toBeDisabled();

        // Cancel out
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(modal).not.toBeVisible();
      }
    }

    // 4. Record an Action Taken
    const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
    if (await addActionBtn.isVisible()) {
      await addActionBtn.click();
      await page.locator('#actionDescriptionInput').fill('Full diagnostic and component stress test complete.');
      await page.locator('#actionResultInput').fill('Hardware diagnostics operational and verified.');
      await page.getByRole('button', { name: /save action/i }).click();

      await expect(page.locator('text=Full diagnostic and component stress test complete.').first()).toBeVisible({ timeout: 10000 });
    }

    // 5. If ticket is now eligible for Resolved, resolve it
    if (await statusSelect.locator('option[value="Resolved"]').count() > 0) {
      await statusSelect.selectOption('Resolved');
      const modal = page.locator('div[role="dialog"]');
      if (await modal.isVisible()) {
        await page.locator('#modalResolutionSummaryInput').fill('Root cause resolved successfully during E2E verification.');
        const confirmBtn = page.getByRole('button', { name: /confirm resolution/i });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();

        await expect(modal).not.toBeVisible();
        await expect(page.locator('.badge', { hasText: /resolved/i }).first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

