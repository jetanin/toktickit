import { test, expect } from '@playwright/test';

test.describe('E2E-03: IT Staff Ticket Lifecycle & Operational Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Log in as IT Staff (Sarah Jenkins)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });
  });

  test('staff claims ticket, updates priority, changes status, posts comment and internal note', async ({ page }) => {
    // 1. Open the first ticket in the queue
    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();

    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /public comments/i })).toBeVisible();

    // 2. Claim Ticket (if claim button is available, click it; or reassign)
    const claimBtn = page.getByRole('button', { name: /claim/i });
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Owner dropdown can be set to Sarah Jenkins
      const ownerSelect = page.locator('select[aria-label="Ticket Owner"]');
      if (await ownerSelect.isVisible()) {
        await ownerSelect.selectOption({ label: 'Sarah Jenkins (IT Staff)' });
        await page.waitForTimeout(1000);
      }
    }

    // 3. Update IT Priority to Critical or High
    const prioritySelect = page.locator('select[aria-label="IT Priority"]');
    await expect(prioritySelect).toBeVisible();
    await prioritySelect.selectOption('Critical');
    await page.waitForTimeout(1000);

    // Verify priority selector now shows Critical
    await expect(prioritySelect).toHaveValue('Critical');

    // 4. Change Status through permitted transition
    const statusSelect = page.locator('select[aria-label="Ticket Status"]');
    await expect(statusSelect).toBeVisible();

    // Permitted options excluding the "(Current)" option at index 0
    const permittedOptions = await statusSelect.locator('option:not(:first-child)').allInnerTexts();

    if (permittedOptions.length > 0) {
      let targetOption = permittedOptions[0];
      if (permittedOptions.includes('In Progress')) {
        targetOption = 'In Progress';
      } else if (permittedOptions.includes('Waiting for Requester')) {
        targetOption = 'Waiting for Requester';
      } else if (permittedOptions.includes('Resolved')) {
        targetOption = 'Resolved';
      }

      await statusSelect.selectOption({ label: targetOption });
      if (targetOption === 'Resolved') {
        const resSummaryInput = page.locator('#resolutionSummaryInput');
        if (await resSummaryInput.isVisible()) {
          await resSummaryInput.fill('The issue was investigated and successfully resolved via automated E2E test.');
        }
      }
      const updateBtn = page.getByRole('button', { name: /save status/i });
      await expect(updateBtn).toBeEnabled();
      await updateBtn.click();
      await page.waitForTimeout(1000);
    }

    // 5. Post a Public Comment
    const commentsTab = page.getByRole('button', { name: /public comments/i });
    await commentsTab.click();

    const commentInput = page.locator('#commentInput');
    await expect(commentInput).toBeVisible();
    const commentText = `E2E Public Comment created at ${Date.now()}`;
    await commentInput.fill(commentText);

    const postCommentBtn = page.getByRole('button', { name: /post comment/i });
    await postCommentBtn.click();

    // Verify public comment appears in the thread
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10000 });

    // 6. Switch to Internal Notes and post an Internal Note
    const notesTab = page.getByRole('button', { name: /internal notes/i });
    await notesTab.click();

    const noteInput = page.locator('#internalNoteInput');
    await expect(noteInput).toBeVisible();
    const noteText = `E2E Confidential Note created at ${Date.now()}`;
    await noteInput.fill(noteText);

    const postNoteBtn = page.getByRole('button', { name: /post internal note/i });
    await postNoteBtn.click();

    // Verify internal note appears in the internal notes panel
    await expect(page.getByText(noteText)).toBeVisible({ timeout: 10000 });
  });
});

