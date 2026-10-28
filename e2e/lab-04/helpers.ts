import { expect, type Page } from '@playwright/test';
export const accounts = { requester: 'jennifer.anderson@toktick.it', staff: 'sarah.it@toktick.it', secondStaff: 'michael.it@toktick.it', admin: 'admin@toktick.it' };
export async function login(page: Page, email: string) {
  await page.goto('/');
  await page.request.post('/api/auth/logout');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(email === accounts.admin ? 'Admin1234!' : 'Password123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
}
export async function createTicket(page: Page) {
  const auth = await page.request.post('/api/auth/login', { data: { email: accounts.requester, password: 'Password123!' } });
  expect(auth.status()).toBe(200);
  const categories = await (await page.request.get('/api/categories')).json();
  const systems = await (await page.request.get('/api/related-systems')).json();
  const response = await page.request.post('/api/tickets', { data: { categoryId: categories[0].id, relatedSystemId: systems[0].id,
    summary: `Lab 4 E2E ${crypto.randomUUID()}`, description: 'Isolated Lab 4 acceptance test', requestedPriority: 'High' } });
  expect(response.status()).toBe(201);
  const ticket = await response.json();
  await page.request.post('/api/auth/logout');
  return ticket as { id: number; ticketNumber: string; summary: string };
}
export async function openTicket(page: Page, ticketNumber: string) {
  await page.getByPlaceholder(/Search.*ticket number/).fill(ticketNumber);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: /^view$/i }).first().click();
  await expect(page.getByRole('heading', { name: /actions taken/i })).toBeVisible();
}
export async function addAction(page: Page, description: string, followUp = false) {
  await page.getByRole('button', { name: '+ Add Action Taken', exact: true }).click();
  await page.locator('#actionDescriptionInput').fill(description);
  await page.locator('#actionResultInput').fill('Verified the result of this intervention.');
  if (followUp) {
    await page.locator('#actionFollowUpCheck').check();
    await page.locator('#actionFollowUpNoteInput').fill('Monitor stability tomorrow.');
  }
  await page.getByRole('button', { name: 'Save Action Taken', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible();
}
