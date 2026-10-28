import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { accounts, addAction, createTicket, login, openTicket } from './helpers';
const output = path.resolve(__dirname, '../../artifacts/lab-04/screenshots');
for (const folder of ['actions-taken', 'ticket-workflow', 'resolution-gate', 'responsive-audit']) fs.mkdirSync(path.join(output, folder), { recursive: true });

test('Screenshot evidence: actions create/edit and requester visibility on the same ticket', async ({ page }) => {
  const ticket = await createTicket(page);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  await page.getByRole('button', { name: '+ Add Action Taken', exact: true }).click();
  await page.locator('#actionDescriptionInput').fill('Inspected cooling fan and replaced thermal paste.');
  await page.locator('#actionResultInput').fill('Temperatures stable under stress workload.');
  await page.screenshot({ path: path.join(output, 'actions-taken/add-action-modal.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save Action Taken', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.screenshot({ path: path.join(output, 'actions-taken/actions-taken-list.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.screenshot({ path: path.join(output, 'actions-taken/edit-action-modal.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await login(page, accounts.requester);
  await openTicket(page, ticket.ticketNumber);
  await expect(page.getByRole('button', { name: '+ Add Action Taken', exact: true })).toHaveCount(0);
  await page.screenshot({ path: path.join(output, 'actions-taken/requester-readonly.png'), fullPage: true });
});

test('Screenshot evidence: resolution gate blocked, allowed and resolved', async ({ page }) => {
  const ticket = await createTicket(page);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  await page.getByRole('button', { name: 'Claim', exact: true }).click();
  const status = page.getByLabel('Ticket Status');
  await expect(status).toHaveValue('Open');
  await page.screenshot({ path: path.join(output, 'ticket-workflow/status-dropdown.png'), fullPage: true });
  await status.selectOption('Resolved');
  await expect(page.getByRole('button', { name: 'Confirm Resolution', exact: true })).toBeDisabled();
  await expect(page.getByTestId('resolution-gate-warning')).toBeVisible();
  await page.screenshot({ path: path.join(output, 'resolution-gate/resolution-gate-modal-blocked.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await addAction(page, 'Replaced damaged fan and verified system temperatures.');
  await status.selectOption('Resolved');
  await page.getByLabel('Resolution Summary', { exact: true }).fill('Fan replaced; temperatures remain stable after stress test.');
  const confirm = page.getByRole('button', { name: 'Confirm Resolution', exact: true });
  await expect(confirm).toBeEnabled();
  await page.screenshot({ path: path.join(output, 'resolution-gate/resolution-gate-modal-allowed.png'), fullPage: true });
  await confirm.click();
  await expect(status).toHaveValue('Resolved');
  await page.screenshot({ path: path.join(output, 'ticket-workflow/resolved-ticket-badge.png'), fullPage: true });
});

test('Screenshot evidence: Actions Taken responsive table/cards at all viewports', async ({ page }) => {
  const ticket = await createTicket(page);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  await addAction(page, 'Responsive evidence action with diagnostic result.');
  for (const [name, width] of [['mobile-375px.png', 375], ['tablet-768px.png', 768], ['desktop-1280px.png', 1280]] as const) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: path.join(output, 'responsive-audit', name), fullPage: true });
  }
});
