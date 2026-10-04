import { test, expect } from '@playwright/test';

test.describe('RESP-01: Responsive Viewports Audit (Mobile 375px, Tablet 768px, Desktop 1280px)', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`renders cleanly with zero horizontal overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.request.post('/api/auth/logout').catch(() => {});
      await page.reload();

      // Log in as IT Staff
      await page.locator('#email').fill('sarah.it@toktick.it');
      await page.locator('#password').fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

      // Open first ticket
      const viewBtn = page.getByRole('button', { name: /view/i }).first();
      await viewBtn.click();

      await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('heading', { name: /actions taken/i })).toBeVisible();

      // Verify zero horizontal page overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify Actions Taken Add button or controls have touch target height >= 30px
      const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
      if (await addActionBtn.isVisible()) {
        const box = await addActionBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(30);
      }
    });
  }
});

