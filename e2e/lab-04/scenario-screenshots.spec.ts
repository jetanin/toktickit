import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(__dirname, '../../artifacts/lab-04/screenshots');

['actions-taken', 'ticket-workflow', 'resolution-gate', 'responsive-audit'].forEach((folder) => {
  const dir = path.join(ARTIFACTS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('Lab 4 Scenario Screenshots & Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();
  });

  test('1. Actions Taken Lifecycle & Screen Captures', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();
    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

    const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
    if (await addActionBtn.isVisible()) {
      await addActionBtn.click();
      await expect(page.getByRole('heading', { name: 'Record Action Taken' })).toBeVisible();

      await page.locator('#actionDescriptionInput').fill('Inspected workstation cooling fans and heatsink thermal paste.');
      await page.locator('#actionResultInput').fill('Cleaned dust filters, re-applied thermal paste.');
      await page.locator('#actionFollowUpCheck').check();
      await page.locator('#actionFollowUpNoteInput').fill('Monitor GPU temperatures during stress workload.');

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'actions-taken/add-action-modal.png'), fullPage: false });

      await page.getByRole('button', { name: 'Save Action Taken' }).click();
      await expect(page.getByRole('heading', { name: 'Record Action Taken' })).not.toBeVisible();
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'actions-taken/actions-taken-list.png'), fullPage: true });

    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByRole('heading', { name: 'Edit Action Taken' })).toBeVisible();
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'actions-taken/edit-action-modal.png'), fullPage: false });
      await page.getByRole('button', { name: /cancel/i }).click();
    }

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.locator('#email').fill('jennifer.anderson@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 15000 });

    const reqViewBtn = page.getByRole('button', { name: /view/i }).first();
    await reqViewBtn.click();
    await expect(page.getByRole('button', { name: /back to my tickets/i })).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'actions-taken/requester-readonly.png'), fullPage: true });
  });

  test('2. Ticket Workflow & Resolution Gate Screen Captures', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

    const statusFilter = page.locator('select').filter({ hasText: /All Statuses|In Progress/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('In Progress').catch(() => {});
    }

    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();
    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

    const statusSelect = page.locator('select[aria-label="Ticket Status"]');
    await expect(statusSelect).toBeVisible();

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'ticket-workflow/status-dropdown.png') });

    const canResolve = await statusSelect.locator('option[value="Resolved"]').evaluateAll((opts) =>
      opts.some((o) => !o.textContent?.includes('Current'))
    );

    if (canResolve) {
      await statusSelect.selectOption('Resolved');
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      const hasWarning = await page.locator('[data-testid="resolution-gate-warning"]').isVisible();
      if (hasWarning) {
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'resolution-gate/resolution-gate-modal-blocked.png') });
      }

      await page.locator('#modalResolutionSummaryInput').fill('Workstation diagnostics and fan replacement confirmed operational.');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'resolution-gate/resolution-gate-modal-allowed.png') });

      const confirmBtn = page.getByRole('button', { name: /confirm resolution/i });
      if (await confirmBtn.isEnabled()) {
        await confirmBtn.click();
        await expect(modal).not.toBeVisible();
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'ticket-workflow/resolved-ticket-badge.png') });
      } else {
        await page.getByRole('button', { name: /cancel/i }).click();
      }
    }
  });

  test('3. Responsive Layout Audit Captures', async ({ page }) => {
    const viewports = [
      { name: 'mobile-375px.png', width: 375, height: 667 },
      { name: 'tablet-768px.png', width: 768, height: 1024 },
      { name: 'desktop-1280px.png', width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.request.post('/api/auth/logout').catch(() => {});
      await page.reload();

      await page.locator('#email').fill('sarah.it@toktick.it');
      await page.locator('#password').fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

      const viewBtn = page.getByRole('button', { name: /view/i }).first();
      await viewBtn.click();
      await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `responsive-audit/${vp.name}`), fullPage: true });
    }
  });
});
