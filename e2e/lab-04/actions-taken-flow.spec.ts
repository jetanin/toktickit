import { test, expect } from '@playwright/test';

test.describe('E2E-01: Multi-Technician Actions Taken Lifecycle & Requester Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();
  });

  test('staff records and edits action taken with follow-up, requester views read-only', async ({ page }) => {
    // 1. Log in as IT Staff (Sarah Jenkins)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible({ timeout: 15000 });

    // Open first ticket in queue
    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();

    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });

    // Verify + Add Action Taken button is present for IT Staff
    const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    // Verify Record Action Taken Modal
    await expect(page.getByRole('heading', { name: 'Record Action Taken' })).toBeVisible();

    // Fill in required fields
    await page.locator('#actionDescriptionInput').fill('Inspected workstation motherboard capacitors and memory slots.');
    await page.locator('#actionResultInput').fill('Detected micro-fracture in slot 2. Re-seated DIMMs into channels 1 and 3.');

    // Select Assignee
    const assigneeSelect = page.locator('#actionAssigneeSelect');
    await expect(assigneeSelect).toBeVisible();
    await assigneeSelect.selectOption({ label: 'Sarah Jenkins (IT Staff)' });

    // Toggle Follow-Up Required
    const followUpToggle = page.locator('#actionFollowUpCheck');
    await followUpToggle.check();

    // Verify Follow-up Note input appears
    const followUpNoteInput = page.locator('#actionFollowUpNoteInput');
    await expect(followUpNoteInput).toBeVisible();
    await followUpNoteInput.fill('Run prime95 torture test tomorrow morning.');

    // Save Action Taken
    const saveActionBtn = page.getByRole('button', { name: 'Save Action Taken' });
    await expect(saveActionBtn).toBeEnabled();
    await saveActionBtn.click();

    // Modal should close and action should appear in list
    await expect(page.getByRole('heading', { name: 'Record Action Taken' })).not.toBeVisible();
    await expect(page.locator('text=Inspected workstation motherboard capacitors and memory slots.').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Run prime95 torture test tomorrow morning.').first()).toBeVisible();

    // 2. Edit Action Taken
    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.getByRole('heading', { name: 'Edit Action Taken' })).toBeVisible();
    await page.locator('#actionResultInput').fill('Re-seated DIMMs. Ran MemTest86 for 2 hours with 0 errors.');
    
    // Save updated action
    const updateActionBtn = page.getByRole('button', { name: 'Update Action Taken' });
    await updateActionBtn.click();

    await expect(page.getByRole('heading', { name: 'Edit Action Taken' })).not.toBeVisible();
    await expect(page.locator('text=Ran MemTest86 for 2 hours with 0 errors.').first()).toBeVisible();

    // 3. Log out and log in as Requester
    const logoutBtn = page.getByRole('button', { name: /sign out|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.request.post('/api/auth/logout').catch(() => {});
      await page.reload();
    }

    await page.locator('#email').fill('jennifer.anderson@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 15000 });

    // Open first ticket in My Tickets
    const reqViewBtn = page.getByRole('button', { name: /view/i }).first();
    await reqViewBtn.click();

    await expect(page.getByRole('button', { name: /back to my tickets/i })).toBeVisible({ timeout: 15000 });

    // Verify Read-Only Actions Taken: + Add Action Taken and Edit buttons MUST NOT exist
    await expect(page.getByRole('button', { name: /\+ Add Action Taken/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /actions taken/i })).toBeVisible();
  });
});

