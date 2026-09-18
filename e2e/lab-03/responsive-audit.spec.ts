import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUDIT_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots/responsive-audit');

test.beforeAll(() => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
});

test.describe('Responsive Audit: Administrator User Management', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as admin
    await page.locator('#email').fill('admin@toktick.it');
    await page.locator('#password').fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Navigate to Users
    const usersNav = page.getByRole('button', { name: 'Users', exact: true });
    await expect(usersNav).toBeVisible({ timeout: 15000 });
    await usersNav.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible({ timeout: 15000 });
  });

  test('Item 1: Mobile width (375px and 767px) - Role, Status, Edit, Reset Password visible & interactive', async ({ page }) => {
    for (const width of [375, 767]) {
      await page.setViewportSize({ width, height: 812 });
      await page.waitForTimeout(500);

      // Verify mobile card container is visible, table is hidden
      const mobileContainer = page.getByTestId('user-cards-mobile');
      await expect(mobileContainer).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('table')).not.toBeVisible();

      // Wait for at least one card to appear
      const firstCard = page.getByTestId('user-card-item').first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Check horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasHorizontalScroll, `Horizontal scroll detected at ${width}px`).toBe(false);

      // Verify cards
      const cards = page.getByTestId('user-card-item');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        await expect(card.locator('.badge').first()).toBeVisible();
        const editBtn = card.getByRole('button', { name: /^edit/i });
        const resetBtn = card.getByRole('button', { name: /^reset password/i });
        await expect(editBtn).toBeVisible();
        await expect(resetBtn).toBeVisible();

        const editBox = await editBtn.boundingBox();
        expect(editBox?.height).toBeGreaterThanOrEqual(44);
        const resetBox = await resetBtn.boundingBox();
        expect(resetBox?.height).toBeGreaterThanOrEqual(44);
      }

      // Test interaction on first card: Open Edit Modal
      const firstEditBtn = cards.first().getByRole('button', { name: /^edit/i });
      await firstEditBtn.click();
      await expect(page.getByRole('heading', { level: 2, name: /edit user details/i })).toBeVisible();
      await page.getByRole('button', { name: /cancel/i }).click();

      // Test interaction on first card: Open Reset Password Modal
      const firstResetBtn = cards.first().getByRole('button', { name: /^reset password/i });
      await firstResetBtn.click();
      await expect(page.getByRole('heading', { level: 2, name: /reset password/i })).toBeVisible();
      await page.getByRole('button', { name: /cancel/i }).click();

      // Take screenshot
      await page.screenshot({
        path: path.join(AUDIT_DIR, `item-1-mobile-${width}px.png`),
        fullPage: true,
      });
    }
  });

  test('Item 2: Tablet width (768px and 991px) - Actions column fully visible, no clipping, no horizontal scroll', async ({ page }) => {
    for (const width of [768, 991]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.waitForTimeout(500);

      // Verify table is visible, mobile cards hidden
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByTestId('user-cards-mobile')).not.toBeVisible();

      // Wait for table rows to load
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

      // Check horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasHorizontalScroll, `Horizontal scroll detected at ${width}px`).toBe(false);

      // Check Actions column header
      await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

      // Verify every row in the table has visible and unclipped Edit and Reset Password buttons
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const editBtn = row.getByRole('button', { name: /^edit/i });
        const resetBtn = row.getByRole('button', { name: /^reset password/i });
        await expect(editBtn).toBeVisible();
        await expect(resetBtn).toBeVisible();

        // Verify button text is full and not clipped
        const resetText = await resetBtn.innerText();
        expect(resetText.trim()).toBe('Reset Password');
      }

      // Take screenshot
      await page.screenshot({
        path: path.join(AUDIT_DIR, `item-2-tablet-${width}px.png`),
        fullPage: true,
      });
    }
  });

  test('Item 3: Desktop layout (1280px) - unchanged and fully functional', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    // Wait for table to load
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Verify all table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();

    // Verify toolbar controls
    await expect(page.getByPlaceholder(/search users/i)).toBeVisible();
    await expect(page.getByLabel(/filter by role/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Create User/i })).toBeVisible();

    // Verify zero horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({
      path: path.join(AUDIT_DIR, 'item-3-desktop-1280px.png'),
      fullPage: true,
    });
  });

  test('Item 4: Self-Deactivation Guard (BR-24) at Mobile (375px) and Tablet (768px)', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 812 });
      await page.waitForTimeout(300);

      // Search for Eleanor Vance to guarantee she is on page 1
      const searchInput = page.getByPlaceholder(/search users/i);
      await searchInput.fill('Eleanor Vance');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.waitForTimeout(500);

      // Locate Eleanor Vance's edit button
      let editSelfBtn;
      if (width < 768) {
        editSelfBtn = page.getByTestId('user-cards-mobile').getByRole('button', { name: /edit eleanor vance/i });
      } else {
        editSelfBtn = page.getByRole('table').getByRole('button', { name: /edit eleanor vance/i });
      }

      await expect(editSelfBtn).toBeVisible({ timeout: 10000 });
      await editSelfBtn.click();

      // Verify modal and BR-24 self-deactivation guard
      await expect(page.getByRole('heading', { level: 2, name: /edit user details/i })).toBeVisible();
      const activeSwitch = page.getByRole('switch', { name: /active account/i });
      await expect(activeSwitch).toBeDisabled();
      await expect(page.getByText(/you cannot deactivate your own account \(BR-24\)/i)).toBeVisible();

      // Take screenshot of modal with guard active
      await page.screenshot({
        path: path.join(AUDIT_DIR, `item-4-self-deactivation-${width}px.png`),
      });

      await page.getByRole('button', { name: /cancel/i }).click();
      await page.waitForTimeout(300);

      // Clear search
      await searchInput.fill('');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.waitForTimeout(300);
    }
  });

  test('Item 5: Sole-Active-Administrator Guard (BR-25) at Mobile (375px) and Tablet (768px)', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 812 });
      await page.waitForTimeout(300);

      // Intercept /api/admin/users to return only Marcus Reed as active admin, and Sarah as IT Staff
      await page.route('**/api/admin/users*', async (route) => {
        const mockSoleAdminList = [
          {
            id: 2,
            name: 'Marcus Reed',
            email: 'admin2@toktick.it',
            role: 'ADMINISTRATOR',
            isActive: true,
            mustChangePassword: false,
            createdAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 3,
            name: 'Sarah Jenkins',
            email: 'sarah.it@toktick.it',
            role: 'IT_STAFF',
            isActive: true,
            mustChangePassword: false,
            createdAt: '2026-01-02T00:00:00Z',
          },
        ];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSoleAdminList),
        });
      });

      // Trigger re-fetch via search button to load mocked sole-admin list without full reload
      const searchBtn = page.getByRole('button', { name: 'Search' });
      await searchBtn.click();
      await page.waitForTimeout(500);

      // Marcus Reed is the sole active admin in the returned list
      let editMarcusBtn;
      if (width < 768) {
        editMarcusBtn = page.getByTestId('user-cards-mobile').getByRole('button', { name: /edit marcus reed/i });
      } else {
        editMarcusBtn = page.getByRole('table').getByRole('button', { name: /edit marcus reed/i });
      }

      await expect(editMarcusBtn).toBeVisible({ timeout: 10000 });
      await editMarcusBtn.click();

      // Verify modal and BR-25 sole active admin guard
      await expect(page.getByRole('heading', { level: 2, name: /edit user details/i })).toBeVisible();

      // 1. Role selector must be disabled with BR-25 warning
      const roleSelect = page.locator('#editUserRole');
      await expect(roleSelect).toBeDisabled();
      await expect(page.getByText(/role modification locked: this is the sole active administrator account \(BR-25\)/i)).toBeVisible();

      // 2. Active switch must be disabled with BR-25 warning
      const activeSwitch = page.getByRole('switch', { name: /active account/i });
      await expect(activeSwitch).toBeDisabled();
      await expect(page.getByText(/cannot deactivate the last active administrator \(BR-25\)/i)).toBeVisible();

      // Take screenshot of modal with guard active
      await page.screenshot({
        path: path.join(AUDIT_DIR, `item-5-sole-admin-${width}px.png`),
      });

      await page.getByRole('button', { name: /cancel/i }).click();
      await page.unroute('**/api/admin/users*');
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Responsive Audit: IT Staff Ticket Queue (Tablet 6-Column & Collapsed Filters)', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // Login as IT Staff (Sarah Jenkins)
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify queue is loaded
    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
  });

  test('Tablet width (768px, 900px, 991px) - 6 columns visible, 4 hidden, collapsed filters button, zero horizontal scroll', async ({ page }) => {
    for (const width of [768, 900, 991]) {
      await page.setViewportSize({ width, height: 1024 });
      await page.waitForTimeout(500);

      // Verify table is visible and mobile cards are hidden
      const table = page.getByRole('table');
      await expect(table).toBeVisible({ timeout: 10000 });

      // Check zero unintended horizontal scroll on both page and table container
      const scrollInfo = await page.evaluate(() => {
        const tableResp = document.querySelector('.table-responsive');
        return {
          pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          tableScroll: tableResp ? tableResp.scrollWidth > tableResp.clientWidth : false,
        };
      });
      expect(scrollInfo.pageScroll, `Page horizontal scroll detected at ${width}px`).toBe(false);
      expect(scrollInfo.tableScroll, `Table container horizontal scroll detected at ${width}px`).toBe(false);

      // Verify visible column headers on tablet: exactly 6 visible headers
      const visibleHeaders = table.locator('thead th:visible');
      const visibleCount = await visibleHeaders.count();
      expect(visibleCount).toBe(6);

      const headerTexts = (await visibleHeaders.allInnerTexts()).map((h) => h.trim());
      expect(headerTexts).toEqual(['TICKET NO.', 'SUMMARY', 'IT PRIORITY', 'STATUS', 'OWNER', 'ACTION']);

      // Verify the 4 folded/hidden column headers are NOT visible
      const hiddenHeaders = table.locator('thead th.d-none.d-lg-table-cell');
      const hiddenCount = await hiddenHeaders.count();
      expect(hiddenCount).toBe(4);
      for (let i = 0; i < hiddenCount; i++) {
        await expect(hiddenHeaders.nth(i)).not.toBeVisible();
      }

      // Verify secondary lines inside first row:
      // 1. Ticket No cell contains visible date
      const firstRow = table.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
      const dateSubtext = firstRow.locator('td').first().locator('.font-monospace.small');
      await expect(dateSubtext).toBeVisible();

      // 2. Summary cell contains visible category badge
      const summaryCell = firstRow.locator('td:visible').nth(1); // 2nd visible column is Summary
      const categoryBadge = summaryCell.locator('.badge');
      await expect(categoryBadge).toBeVisible();

      // 3. Action column View button is fully within viewport (no clipping)
      const firstViewBtn = firstRow.getByRole('button', { name: /^view$/i });
      await expect(firstViewBtn).toBeVisible();
      const viewBtnBox = await firstViewBtn.boundingBox();
      expect(viewBtnBox).not.toBeNull();
      if (viewBtnBox) {
        expect(viewBtnBox.x + viewBtnBox.width).toBeLessThanOrEqual(width);
      }

      // Verify collapsed "Filters" toggle button is visible on tablet
      const filtersToggleBtn = page.getByRole('button', { name: /^filters/i });
      await expect(filtersToggleBtn).toBeVisible();

      // Take screenshot of tablet queue
      await page.screenshot({
        path: path.join(AUDIT_DIR, `queue-tablet-${width}px.png`),
        fullPage: true,
      });

      // Test expanding collapsed filter panel
      await filtersToggleBtn.click();
      await page.waitForTimeout(300);

      // Verify filter dropdowns are visible inside collapsible panel
      const categorySelect = page.locator('select').filter({ hasText: 'All Categories' });
      await expect(categorySelect).toBeVisible();

      // Take screenshot with filters panel open
      await page.screenshot({
        path: path.join(AUDIT_DIR, `queue-tablet-${width}px-filters-open.png`),
        fullPage: true,
      });

      // Close filter panel
      await filtersToggleBtn.click();
      await page.waitForTimeout(200);
    }
  });

  test('Desktop width (1280px) - all 10 columns visible, collapsed filters button hidden, no secondary tablet chips', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const visibleHeaders = table.locator('thead th:visible');
    const visibleCount = await visibleHeaders.count();
    expect(visibleCount).toBe(10);

    const headerTexts = (await visibleHeaders.allInnerTexts()).map((h) => h.trim());
    expect(headerTexts).toEqual([
      'TICKET NO.',
      'CREATED DATE',
      'SUMMARY',
      'CATEGORY',
      'REQ. PRIORITY',
      'IT PRIORITY',
      'STATUS',
      'OWNER',
      'LAST UPDATED',
      'ACTION',
    ]);

    // Tablet filters toggle button is hidden on desktop
    const filtersToggleBtn = page.getByRole('button', { name: /^filters/i });
    await expect(filtersToggleBtn).not.toBeVisible();

    // First row: secondary tablet date under ticket number is hidden
    const firstRow = table.locator('tbody tr').first();
    const dateSubtext = firstRow.locator('td').first().locator('.font-monospace.small');
    await expect(dateSubtext).not.toBeVisible();

    // First row: secondary tablet category badge inside summary is hidden
    const summaryCell = firstRow.locator('td').nth(2); // 3rd column is Summary on desktop
    const categoryBadge = summaryCell.locator('.badge');
    await expect(categoryBadge).not.toBeVisible();

    // Check zero horizontal scroll
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('Mobile width (375px) - table hidden, cards view rendered, zero horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Table is hidden on mobile
    await expect(page.getByRole('table')).not.toBeVisible();

    // Check zero horizontal scroll
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);

    // Cards should be rendered
    const viewButtons = page.getByRole('button', { name: /^view$/i });
    const count = await viewButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

