import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const output = path.resolve(__dirname, '../../artifacts/lab-04/screenshots');
for (const role of ['requester-dashboard', 'staff-dashboard', 'admin-dashboard']) fs.mkdirSync(path.join(output, role), { recursive: true });

for (const account of [
  { email: 'jennifer.anderson@toktick.it', title: 'Requester Dashboard', folder: 'requester-dashboard', api: 'requester', button: 'View Waiting for Me tickets', query: 'status=Waiting+for+Requester', target: 'My Tickets' },
  { email: 'sarah.it@toktick.it', title: 'IT Staff Dashboard', folder: 'staff-dashboard', api: 'staff', button: 'View Unassigned Queue tickets', query: 'assigned=unassigned', target: 'IT Staff Ticket Queue' },
  { email: 'admin@toktick.it', title: 'Administrator Dashboard', folder: 'admin-dashboard', api: 'admin', button: 'View My Assigned tickets', query: 'assigned=me', target: 'IT Staff Ticket Queue' },
]) {
  test(`${account.title}: real API, refresh, responsive evidence and filtered navigation`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#email').fill(account.email);
    await page.locator('#password').fill(account.api === 'admin' ? 'Admin1234!' : 'Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    const response = page.waitForResponse(r => r.url().includes(`/api/${account.api}/dashboard`));
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    const dashboardResponse = await response;
    expect(dashboardResponse.status()).toBe(200);
    const metrics = await dashboardResponse.json();
    await expect(page.getByRole('heading', { name: account.title, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled();
    const metricLabel = account.api === 'requester' ? 'My Open Tickets' : 'Total Active Queue';
    const metricValue = account.api === 'requester' ? metrics.openTicketsCount : metrics.totalActiveQueueCount;
    await expect(page.getByRole('heading', { name: metricLabel, exact: true }).locator('..').locator('p').first()).toHaveText(String(metricValue));
    await expect(page).toHaveURL(new RegExp(`/${account.api}/dashboard$`));
    if (account.api === 'admin') await expect(page.getByRole('heading', { name: 'User Management Summary' })).toBeVisible();
    for (const width of [1280, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const refreshBox = await page.getByRole('button', { name: 'Refresh', exact: true }).boundingBox();
      expect(refreshBox!.height).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: path.join(output, account.folder, `${width}px.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    const refreshed = page.waitForResponse(r => r.url().includes(`/api/${account.api}/dashboard`));
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    expect((await refreshed).status()).toBe(200);
    const list = page.waitForRequest(r => r.url().includes('/api/') && r.url().includes(account.query));
    await page.getByRole('button', { name: account.button, exact: true }).click();
    await list;
    await expect(page.getByRole('heading', { name: account.target, exact: true })).toBeVisible();
  });
}
