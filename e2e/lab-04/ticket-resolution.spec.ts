import { test, expect } from '@playwright/test';
import { accounts, addAction, createTicket, login, openTicket } from './helpers';

test('E2E-02: New to Reopened, advisory indication and resolution gate', async ({ page }) => {
  const ticket = await createTicket(page);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  await page.getByRole('button', { name: /claim/i }).click();
  const status = page.getByLabel('Ticket Status');
  await expect(status).toHaveValue('Open');
  await status.selectOption('Resolved');
  await expect(page.getByText('Cannot Resolve Ticket', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm Resolution', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await addAction(page, 'Replaced damaged component and verified operation.');
  await login(page, accounts.requester);
  await openTicket(page, ticket.ticketNumber);
  await page.getByRole('button', { name: 'Problem Appears Resolved', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /yes.*resolved/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const advisory = await (await page.request.get(`/api/tickets/${ticket.id}`)).json();
  expect(advisory.currentStatus).toBe('Open');
  expect(advisory.requesterResolutionPending).toBe(true);
  await login(page, accounts.staff);
  await openTicket(page, ticket.ticketNumber);
  await status.selectOption('Resolved');
  await page.getByLabel('Resolution Summary', { exact: true }).fill('Replaced damaged component; stability checks passed.');
  await page.getByRole('button', { name: 'Confirm Resolution', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(status).toHaveValue('Resolved');
  for (const next of ['Closed', 'Reopened']) {
    await status.selectOption(next);
    await page.getByRole('button', { name: 'Save Status', exact: true }).click();
    await expect(status).toHaveValue(next);
  }
  expect((await (await page.request.get(`/api/tickets/${ticket.id}`)).json()).requesterResolutionPending).toBe(false);
});
