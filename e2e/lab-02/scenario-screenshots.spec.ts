import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(__dirname, '../../artifacts/lab-02/screenshots');

// Ensure output directories exist
['requester-select', 'create-ticket', 'my-tickets', 'ticket-detail'].forEach((folder) => {
  const dir = path.join(ARTIFACTS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('Scenario Screenshots Capture', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('captures all required scenario screenshots for Lab 2', async ({ page }) => {
    test.setTimeout(120000);
    // -------------------------------------------------------------
    // 1. Requester Selection Screen (Part 5 & 6.1)
    // -------------------------------------------------------------
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('toktickit_requester'));
    await page.reload();

    const selectDropdown = page.locator('#requesterSelect');
    await expect(selectDropdown).toBeVisible({ timeout: 10000 });
    const continueBtn = page.getByRole('button', { name: /continue to portal/i });
    await expect(continueBtn).toBeVisible();

    const requesterSelectPath = path.join(ARTIFACTS_DIR, 'requester-select', 'selection-screen.png');
    await page.screenshot({ path: requesterSelectPath, fullPage: true });
    expect(fs.existsSync(requesterSelectPath)).toBe(true);

    // Enter portal with first active requester
    await continueBtn.click();
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // 2. Create Ticket - Validation Errors & Invalid Attachment (Part 6.3 & 6.4)
    // -------------------------------------------------------------
    const createTicketNavBtn = page.getByRole('button', { name: 'Create Ticket', exact: true });
    await createTicketNavBtn.click();
    await expect(page.getByRole('heading', { name: /create new it support ticket/i })).toBeVisible({ timeout: 10000 });

    // 2a. Trigger validation error by clicking Submit with empty form
    const submitBtn = page.getByRole('button', { name: /submit ticket/i });
    await submitBtn.click();
    await expect(page.locator('#summaryInput')).toHaveClass(/is-invalid/);
    await expect(page.locator('#descriptionInput')).toHaveClass(/is-invalid/);

    const validationErrorPath = path.join(ARTIFACTS_DIR, 'create-ticket', 'validation-error.png');
    await page.screenshot({ path: validationErrorPath, fullPage: true });
    expect(fs.existsSync(validationErrorPath)).toBe(true);

    // 2b. Trigger invalid attachment error (> 5MB)
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const fileInput = page.locator('#attachmentInput');
    await fileInput.setInputFiles({
      name: 'oversized-file.png',
      mimeType: 'image/png',
      buffer: bigBuffer,
    });
    await expect(page.locator('.invalid-feedback:has-text("5MB")')).toBeVisible();

    const invalidAttachPath = path.join(ARTIFACTS_DIR, 'create-ticket', 'invalid-attachment.png');
    await page.screenshot({ path: invalidAttachPath, fullPage: true });
    expect(fs.existsSync(invalidAttachPath)).toBe(true);

    // Clear the invalid file input
    await fileInput.setInputFiles([]);

    // -------------------------------------------------------------
    // 3. Create Ticket - API Failure State (Part 6.5)
    // -------------------------------------------------------------
    // Wait for dropdown options to populate
    await expect(async () => {
      const catCount = await page.locator('#categorySelect option').count();
      const sysCount = await page.locator('#systemSelect option').count();
      expect(catCount).toBeGreaterThan(1);
      expect(sysCount).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    await page.locator('#categorySelect').selectOption({ index: 1 });
    await page.locator('#systemSelect').selectOption({ index: 1 });
    await page.locator('#prioritySelect').selectOption('Medium');
    await page.locator('#summaryInput').fill('E2E screenshot — failure state ticket');
    await page.locator('#descriptionInput').fill('This submission is mocked to fail with a 500 response.');

    // Mock POST /api/tickets to fail with 500
    await page.route('**/api/tickets', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unexpected server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await submitBtn.click();
    const errorAlert = page.locator('.alert.alert-danger:has-text("Unexpected server error")');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Form inputs must remain preserved
    await expect(page.locator('#summaryInput')).toHaveValue('E2E screenshot — failure state ticket');
    await expect(page.locator('#descriptionInput')).toHaveValue('This submission is mocked to fail with a 500 response.');

    const apiFailurePath = path.join(ARTIFACTS_DIR, 'create-ticket', 'api-failure.png');
    await page.screenshot({ path: apiFailurePath, fullPage: true });
    expect(fs.existsSync(apiFailurePath)).toBe(true);

    // Unroute to restore normal behavior
    await page.unroute('**/api/tickets');

    // -------------------------------------------------------------
    // 4. Create Ticket - Success State (Part 6.6)
    // -------------------------------------------------------------
    const testSummary = `E2E Success Ticket - ${Date.now()}`;
    await page.locator('#summaryInput').fill(testSummary);
    await submitBtn.click();

    const successHeading = page.locator('h3:has-text("created successfully")');
    await expect(successHeading).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /back to my tickets/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /view ticket details/i })).toBeVisible();

    const successStatePath = path.join(ARTIFACTS_DIR, 'create-ticket', 'success-state.png');
    await page.screenshot({ path: successStatePath, fullPage: true });
    expect(fs.existsSync(successStatePath)).toBe(true);

    // -------------------------------------------------------------
    // 5. My Tickets States (Part 7)
    // -------------------------------------------------------------
    // Navigate back to My Tickets
    await page.getByRole('button', { name: /back to my tickets/i }).click();
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // 5a. Requester A list
    const requesterAPath = path.join(ARTIFACTS_DIR, 'my-tickets', 'requester-a.png');
    await page.screenshot({ path: requesterAPath, fullPage: true });
    expect(fs.existsSync(requesterAPath)).toBe(true);

    // 5b. Search No-Results State (search "zzz-no-such-ticket")
    const searchInput = page.locator('input[placeholder*="Search ticket number"]');
    await searchInput.fill('zzz-no-such-ticket');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('text=No tickets match your search or filter criteria.')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();

    const noResultsPath = path.join(ARTIFACTS_DIR, 'my-tickets', 'no-results.png');
    await page.screenshot({ path: noResultsPath, fullPage: true });
    expect(fs.existsSync(noResultsPath)).toBe(true);

    // 5c. Clear filter and apply Search/Filter active
    await page.getByRole('button', { name: /clear filters/i }).click();
    await page.waitForTimeout(500);
    await searchInput.fill('Ticket');
    await page.locator('form select').first().selectOption({ index: 1 }); // Select a category
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(500);

    const searchFilterPath = path.join(ARTIFACTS_DIR, 'my-tickets', 'search-filter.png');
    await page.screenshot({ path: searchFilterPath, fullPage: true });
    expect(fs.existsSync(searchFilterPath)).toBe(true);

    // 5d. Switch to Requester B to show Ownership Isolation
    await page.getByRole('button', { name: /change requester/i }).click();
    await expect(selectDropdown).toBeVisible({ timeout: 5000 });
    // Pick the second active requester
    const options = await selectDropdown.locator('option').all();
    if (options.length > 1) {
      const secondReqValue = await options[1].getAttribute('value');
      if (secondReqValue) {
        await selectDropdown.selectOption(secondReqValue);
      }
    }
    await continueBtn.click();
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    const requesterBPath = path.join(ARTIFACTS_DIR, 'my-tickets', 'requester-b.png');
    await page.screenshot({ path: requesterBPath, fullPage: true });
    expect(fs.existsSync(requesterBPath)).toBe(true);

    // 5e. My Tickets API Failure State
    await page.route('**/api/tickets*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to load tickets. Please try again.' }),
      });
    });
    // Trigger refresh by filling search and submitting
    await page.locator('input[placeholder*="Search ticket number"]').fill('trigger-error');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.alert.alert-danger:has-text("Failed to load tickets")')).toBeVisible({ timeout: 5000 });

    const myTicketsApiFailurePath = path.join(ARTIFACTS_DIR, 'my-tickets', 'api-failure.png');
    await page.screenshot({ path: myTicketsApiFailurePath, fullPage: true });
    expect(fs.existsSync(myTicketsApiFailurePath)).toBe(true);

    await page.unroute('**/api/tickets*');

    // -------------------------------------------------------------
    // 6. Ticket Detail Screen & Attachment Soft-Removal (Part 8)
    // -------------------------------------------------------------
    // Switch back to Requester A so we have tickets and attachments
    await page.getByRole('button', { name: /change requester/i }).click();
    await expect(selectDropdown).toBeVisible({ timeout: 5000 });
    const firstReqValue = await (await selectDropdown.locator('option').first()).getAttribute('value');
    if (firstReqValue) {
      await selectDropdown.selectOption(firstReqValue);
    }
    await continueBtn.click();
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Open first ticket
    const viewBtn = page.getByRole('button', { name: /^view$/i }).first();
    await viewBtn.click();
    await expect(page.getByRole('button', { name: /back to my tickets/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /attachments/i })).toBeVisible();

    // Ensure we have at least one attachment by uploading one if none exists
    const detailFileInput = page.locator('#ticketDetailAttachmentInput');
    if (await detailFileInput.isVisible()) {
      const dummyFile = Buffer.from('test attachment content for lab 02');
      await detailFileInput.setInputFiles({
        name: 'test-evidence.png',
        mimeType: 'image/png',
        buffer: dummyFile,
      });
      await page.getByRole('button', { name: /upload attachment/i }).click();
      await page.waitForTimeout(1500);
    }

    // Now find active attachment Remove button
    const removeBtn = page.locator('button:has-text("Remove")').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      // 6a. Soft removal confirmation dialog
      const reasonModal = page.locator('#removalReasonSelect');
      await expect(reasonModal).toBeVisible({ timeout: 5000 });

      // Select custom reason "อื่นๆ (โปรดระบุ)"
      await reasonModal.selectOption('อื่นๆ (โปรดระบุ)');
      const customReasonInput = page.locator('#customReasonInput');
      await expect(customReasonInput).toBeVisible();
      await customReasonInput.fill('Uploaded wrong file version');

      const softRemoveDialogPath = path.join(ARTIFACTS_DIR, 'ticket-detail', 'soft-remove-dialog.png');
      await page.screenshot({ path: softRemoveDialogPath, fullPage: true });
      expect(fs.existsSync(softRemoveDialogPath)).toBe(true);

      // Confirm removal
      const confirmRemoveBtn = page.getByRole('button', { name: /confirm remove/i });
      await confirmRemoveBtn.click();
      await page.waitForTimeout(1000);

      // 6b. Soft-removed attachment display
      await expect(page.locator('span.badge.bg-secondary:has-text("Removed")').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Uploaded wrong file version').first()).toBeVisible();

      const attachmentRemovedPath = path.join(ARTIFACTS_DIR, 'ticket-detail', 'attachment-removed.png');
      await page.screenshot({ path: attachmentRemovedPath, fullPage: true });
      expect(fs.existsSync(attachmentRemovedPath)).toBe(true);
    }
  });
});

