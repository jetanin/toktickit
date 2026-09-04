import { test, expect } from '@playwright/test';

test.describe('Requester Ticket Full Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure we start cleanly on the Requester Selection screen
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('completes full end-to-end flow: select requester -> create ticket -> verify in My Tickets -> verify Ticket Detail', async ({
    page,
  }) => {
    // 1. Open app at root
    await page.goto('/');

    // 2. Select a Development Requester from dropdown
    const requesterSelect = page.locator('#requesterSelect');
    await expect(requesterSelect).toBeVisible({ timeout: 10000 });

    // Wait until options are populated from /api/dev-requesters
    await expect(requesterSelect.locator('option')).not.toHaveCount(0);
    const firstRequesterValue = await requesterSelect.locator('option').first().getAttribute('value');
    expect(firstRequesterValue).toBeTruthy();
    await requesterSelect.selectOption(firstRequesterValue!);

    // Submit selection to enter portal
    const continueBtn = page.getByRole('button', { name: /continue to portal/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // 3. Confirm transition to portal (My Tickets view is default)
    const myTicketsNavBtn = page.getByRole('button', { name: 'My Tickets' });
    await expect(myTicketsNavBtn).toBeVisible();

    // 4. Navigate to Create Ticket screen
    const createTicketNavBtn = page.getByRole('button', { name: 'Create Ticket', exact: true });
    await expect(createTicketNavBtn).toBeVisible();
    await createTicketNavBtn.click();

    // 5. Fill in required ticket form fields
    const categorySelect = page.locator('#categorySelect');
    const systemSelect = page.locator('#systemSelect');
    const summaryInput = page.locator('#summaryInput');
    const descriptionInput = page.locator('#descriptionInput');
    const prioritySelect = page.locator('#prioritySelect');

    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    await expect(systemSelect).toBeVisible({ timeout: 10000 });

    // Wait for dropdowns to be populated from reference data APIs
    await expect(async () => {
      const count = await categorySelect.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    await expect(async () => {
      const count = await systemSelect.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });

    // Select valid category and related system options (index 1 to skip placeholder)
    await categorySelect.selectOption({ index: 1 });
    const selectedCategoryText = await categorySelect.locator('option:checked').textContent();

    await systemSelect.selectOption({ index: 1 });
    const selectedSystemText = await systemSelect.locator('option:checked').textContent();

    // Unique summary and descriptive body
    const testTimestamp = Date.now();
    const testSummary = `E2E Support Test Issue ${testTimestamp}`;
    const testDescription = `Automated end-to-end verification description detailing system diagnostics at timestamp ${testTimestamp}.`;
    const testPriority = 'High';

    await summaryInput.fill(testSummary);
    await descriptionInput.fill(testDescription);
    await prioritySelect.selectOption(testPriority);

    // 6. Submit the ticket
    const submitBtn = page.getByRole('button', { name: /submit ticket/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Verify Success State and extract correctly formatted Ticket Number (TKT-YYYY-NNNNNN)
    const successHeading = page.locator('h3:has-text("created successfully")');
    await expect(successHeading).toBeVisible({ timeout: 10000 });

    const headingText = await successHeading.textContent();
    expect(headingText).toBeTruthy();

    const ticketNumberMatch = headingText!.match(/TKT-\d{4}-\d{6}/);
    expect(ticketNumberMatch).not.toBeNull();
    const createdTicketNumber = ticketNumberMatch![0];

    // 8. Return to My Tickets screen and confirm newly created ticket appears in the list
    const backToMyTicketsBtn = page.getByRole('button', { name: /back to my tickets/i });
    await expect(backToMyTicketsBtn).toBeVisible();
    await backToMyTicketsBtn.click();

    // Wait for table to load
    const ticketRow = page.locator('tr', { hasText: createdTicketNumber });
    await expect(ticketRow).toBeVisible({ timeout: 10000 });
    await expect(ticketRow).toContainText(testSummary);

    // 9. Open that ticket's detail view via the "View" action button
    const viewBtn = ticketRow.getByRole('button', { name: 'View' });
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    // 10. Confirm Ticket Detail view matches what was submitted
    const detailOfficialNumber = page.locator('span:has-text("Official Ticket Number:")');
    await expect(detailOfficialNumber).toBeVisible({ timeout: 10000 });
    await expect(detailOfficialNumber).toContainText(createdTicketNumber);

    const detailSummary = page.locator('h1');
    await expect(detailSummary).toHaveText(testSummary);

    const detailDescription = page.locator('div[style*="pre-wrap"]');
    await expect(detailDescription).toHaveText(testDescription);

    // Confirm metadata attributes
    if (selectedCategoryText) {
      await expect(page.locator('strong:has-text("' + selectedCategoryText.trim() + '")')).toBeVisible();
    }
    if (selectedSystemText) {
      await expect(page.locator('strong:has-text("' + selectedSystemText.trim() + '")')).toBeVisible();
    }

    const priorityBadge = page.locator(`span.badge:has-text("${testPriority}")`);
    await expect(priorityBadge).toBeVisible();

    const statusBadge = page.locator('span.badge:has-text("New")');
    await expect(statusBadge).toBeVisible();
  });
});
