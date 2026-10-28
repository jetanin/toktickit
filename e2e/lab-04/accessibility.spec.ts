import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accounts, createTicket, login, openTicket } from './helpers';

for (const [role, email] of [['requester', accounts.requester], ['staff', accounts.staff], ['admin', accounts.admin]]) {
  test(`A11Y-01: ${role} dashboard has no serious/critical WCAG violations`, async ({ page }) => {
    await login(page, email);
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}
test('A11Y-01: Ticket Detail and Action Taken dialog, labels and keyboard focus', async ({ page }) => {
  const ticket = await createTicket(page);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  const detail = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(detail.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  const add = page.getByRole('button', { name: '+ Add Action Taken', exact: true });
  await add.click();
  const dialog = page.getByRole('dialog', { name: 'Record Action Taken' });
  await expect(dialog).toBeVisible();
  const modal = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(modal.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Save Action Taken', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(add).toBeFocused();
});
