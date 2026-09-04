import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 820, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const ARTIFACTS_DIR = path.resolve(__dirname, '../../artifacts/lab-02/screenshots');

// Ensure output directories exist
['create-ticket', 'my-tickets', 'ticket-detail'].forEach((pageName) => {
  const dir = path.join(ARTIFACTS_DIR, pageName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

for (const vp of VIEWPORTS) {
  test.describe(`Visual Check - ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`captures screenshots for My Tickets, Create Ticket, and Ticket Detail`, async ({ page }) => {
      // 1. Navigate to root
      await page.goto('/');

      // Wait for requester selection button if not logged in
      const continueBtn = page.getByRole('button', { name: /continue to portal/i });
      try {
        await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
        await continueBtn.click();
      } catch {
        // Already logged in
      }

      // Verify My Tickets is visible
      await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });
      // Wait for tickets table or cards to be loaded
      await page.waitForTimeout(1000);

      const myTicketsPath = path.join(ARTIFACTS_DIR, 'my-tickets', `${vp.name}.png`);
      await page.screenshot({ path: myTicketsPath, fullPage: true });
      expect(fs.existsSync(myTicketsPath)).toBe(true);

      // 2. Create Ticket Screen
      if (vp.name === 'mobile') {
        const hamburgerBtn = page.getByRole('button', { name: /toggle navigation/i });
        if (await hamburgerBtn.isVisible()) {
          await hamburgerBtn.click();
          await page.waitForTimeout(300);
        }
      }
      await page.getByRole('button', { name: 'Create Ticket' }).first().click();
      await expect(page.getByRole('heading', { name: /create new it support ticket/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#summaryInput')).toBeVisible();
      await page.waitForTimeout(1000);

      const createTicketPath = path.join(ARTIFACTS_DIR, 'create-ticket', `${vp.name}.png`);
      await page.screenshot({ path: createTicketPath, fullPage: true });
      expect(fs.existsSync(createTicketPath)).toBe(true);

      // 3. Ticket Detail Screen
      if (vp.name === 'mobile') {
        const hamburgerBtn = page.getByRole('button', { name: /toggle navigation/i });
        if (await hamburgerBtn.isVisible()) {
          await hamburgerBtn.click();
          await page.waitForTimeout(300);
        }
      }
      await page.getByRole('button', { name: 'My Tickets' }).first().click();
      await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      if (vp.name === 'mobile') {
        // In mobile view, click the first ticket title
        await page.getByRole('heading', { level: 6 }).first().click();
      } else {
        // On desktop/tablet, table has "View" buttons
        const viewBtn = page.getByRole('button', { name: /^view$/i }).first();
        await viewBtn.click();
      }

      await expect(page.getByRole('button', { name: /back to my tickets/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { name: /attachments/i })).toBeVisible();
      await page.waitForTimeout(1000);

      const ticketDetailPath = path.join(ARTIFACTS_DIR, 'ticket-detail', `${vp.name}.png`);
      await page.screenshot({ path: ticketDetailPath, fullPage: true });
      expect(fs.existsSync(ticketDetailPath)).toBe(true);
    });
  });
}

