import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots');

// Ensure output directories exist
['authentication', 'staff-queue', 'staff-ticket-detail', 'user-management'].forEach((folder) => {
  const dir = path.join(ARTIFACTS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('Lab 3 Scenario Screenshots & Visual Verification', () => {
  test.setTimeout(180000);

  // Helper to copy file to alias
  const copyScreenshot = (src: string, dest: string) => {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  };

  test('1. Authentication Screen & Viewports', async ({ page }) => {
    // Navigate and clear any session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Call logout to clear cookie
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    // 1a. Login Screen Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    const loginDesktop = path.join(ARTIFACTS_DIR, 'authentication', 'desktop.png');
    await page.screenshot({ path: loginDesktop, fullPage: true });
    copyScreenshot(loginDesktop, path.join(ARTIFACTS_DIR, 'authentication', 'login-screen.png'));

    // 1b. Login Screen Tablet
    await page.setViewportSize({ width: 820, height: 1024 });
    await page.waitForTimeout(300);
    const loginTablet = path.join(ARTIFACTS_DIR, 'authentication', 'tablet.png');
    await page.screenshot({ path: loginTablet, fullPage: true });

    // 1c. Login Screen Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    const loginMobile = path.join(ARTIFACTS_DIR, 'authentication', 'mobile.png');
    await page.screenshot({ path: loginMobile, fullPage: true });

    // Reset to Desktop for scenario captures
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1d. Invalid credentials error state
    await page.locator('#email').fill('nonexistent@toktick.it');
    await page.locator('#password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
    const invalidErrPath = path.join(ARTIFACTS_DIR, 'authentication', 'login-invalid-error.png');
    await page.screenshot({ path: invalidErrPath, fullPage: true });

    // 1e. Inactive account error state (Kevin Miller is inactive IT Staff)
    await page.locator('#email').fill('kevin.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
    const inactiveErrPath = path.join(ARTIFACTS_DIR, 'authentication', 'login-inactive-error.png');
    await page.screenshot({ path: inactiveErrPath, fullPage: true });

    // 1f. Mandatory first-login password change screen (Alex Thompson has mustChangePassword = true)
    await page.locator('#email').fill('alex.thompson@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /change your password/i })).toBeVisible({ timeout: 15000 });

    const changePassPath = path.join(ARTIFACTS_DIR, 'authentication', 'change-password-screen.png');
    await page.screenshot({ path: changePassPath, fullPage: true });

    // 1g. Password complexity validation failure checklist
    await page.locator('#currentPassword').fill('Password123!');
    await page.locator('#newPassword').fill('weak');
    await page.locator('#confirmPassword').fill('mismatch');
    await page.waitForTimeout(500);

    const changePassValPath = path.join(ARTIFACTS_DIR, 'authentication', 'change-password-validation.png');
    await page.screenshot({ path: changePassValPath, fullPage: true });

    // Cleanup session
    await page.request.post('/api/auth/logout').catch(() => {});
  });

  test('2. IT Staff Ticket Queue & Viewports', async ({ page }) => {
    // Log in as IT Staff (Sarah Jenkins)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify Staff Queue is loaded
    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // 2a. Queue Desktop
    const queueDesktop = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-desktop.png');
    await page.screenshot({ path: queueDesktop, fullPage: true });
    copyScreenshot(queueDesktop, path.join(ARTIFACTS_DIR, 'staff-queue', 'desktop.png'));

    // 2b. Queue Tablet
    await page.setViewportSize({ width: 820, height: 1024 });
    await page.waitForTimeout(500);
    const queueTablet = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-tablet.png');
    await page.screenshot({ path: queueTablet, fullPage: true });
    copyScreenshot(queueTablet, path.join(ARTIFACTS_DIR, 'staff-queue', 'tablet.png'));

    // 2c. Queue Mobile (collapses into cards)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const queueMobile = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-mobile.png');
    await page.screenshot({ path: queueMobile, fullPage: true });
    copyScreenshot(queueMobile, path.join(ARTIFACTS_DIR, 'staff-queue', 'mobile.png'));

    // Reset to Desktop for scenario captures
    await page.setViewportSize({ width: 1280, height: 800 });

    // 2d. Queue Search & Filter active
    const searchInput = page.locator('input[placeholder*="Search by ticket number"]');
    await searchInput.fill('Wi-Fi');
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(800);
    const queueSearchPath = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-search-filter.png');
    await page.screenshot({ path: queueSearchPath, fullPage: true });

    // 2e. Queue Filter "Assigned to Me"
    const assignedSelect = page.locator('select').filter({ hasText: 'All Assignments' });
    if (await assignedSelect.isVisible()) {
      await assignedSelect.selectOption('me');
      await page.waitForTimeout(800);
      const queueMePath = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-assigned-to-me.png');
      await page.screenshot({ path: queueMePath, fullPage: true });
    }

    // 2f. Queue Empty State
    await searchInput.fill('NONEXISTENT_TICKET_SEARCH_12345_XYZ');
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(800);
    const queueEmptyPath = path.join(ARTIFACTS_DIR, 'staff-queue', 'queue-empty-state.png');
    await page.screenshot({ path: queueEmptyPath, fullPage: true });

    // Cleanup session
    await page.request.post('/api/auth/logout').catch(() => {});
  });

  test('3. IT Staff Ticket Detail & Operational Controls', async ({ page }) => {
    // Log in as IT Staff (Sarah Jenkins)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#email').fill('sarah.it@toktick.it');
    await page.locator('#password').fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'Ticket Queue' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // Click on the first ticket's View button
    const viewBtn = page.getByRole('button', { name: /view/i }).first();
    await viewBtn.click();

    // Verify Ticket Detail is rendered
    await expect(page.getByRole('button', { name: /back to queue/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /public comments/i })).toBeVisible();

    // 3a. Ticket Detail Desktop
    const detailDesktop = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'ticket-detail-desktop.png');
    await page.screenshot({ path: detailDesktop, fullPage: true });
    copyScreenshot(detailDesktop, path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'desktop.png'));

    // 3b. Ticket Detail Tablet
    await page.setViewportSize({ width: 820, height: 1024 });
    await page.waitForTimeout(500);
    const detailTablet = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'tablet.png');
    await page.screenshot({ path: detailTablet, fullPage: true });

    // 3c. Ticket Detail Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const detailMobile = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'ticket-detail-mobile.png');
    await page.screenshot({ path: detailMobile, fullPage: true });
    copyScreenshot(detailMobile, path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'mobile.png'));

    // Reset to Desktop for operational controls captures
    await page.setViewportSize({ width: 1280, height: 800 });

    // 3d. Ticket Claim / Reassign Dropdown
    const ownerSelect = page.locator('select[aria-label="Ticket Owner"]');
    if (await ownerSelect.isVisible()) {
      await ownerSelect.focus();
      const claimPath = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'ticket-claim-reassign.png');
      await page.screenshot({ path: claimPath, fullPage: true });
    }

    // 3e. IT Priority Update Dropdown
    const prioritySelect = page.locator('select[aria-label="IT Priority"]');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.focus();
      const priorityPath = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'ticket-priority-update.png');
      await page.screenshot({ path: priorityPath, fullPage: true });
    }

    // 3f. Public Comments Thread
    const commentsTab = page.getByRole('button', { name: /public comments/i });
    await commentsTab.click();
    await page.waitForTimeout(300);
    const commentsPath = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'public-comments-thread.png');
    await page.screenshot({ path: commentsPath, fullPage: true });

    // 3g. Internal Notes Panel (Amber Distinct Accent)
    const notesTab = page.getByRole('button', { name: /internal notes/i });
    await notesTab.click();
    await page.waitForTimeout(300);
    const notesPath = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'internal-notes-panel.png');
    await page.screenshot({ path: notesPath, fullPage: true });

    // 3h. Requester Resolved Indicator Badge
    // Switch back to public comments tab
    await commentsTab.click();
    const resolvedBadgePath = path.join(ARTIFACTS_DIR, 'staff-ticket-detail', 'requester-resolved-badge.png');
    await page.screenshot({ path: resolvedBadgePath, fullPage: true });

    // Cleanup session
    await page.request.post('/api/auth/logout').catch(() => {});
  });

  test('4. Administrator User Management & Safety Guards', async ({ page }) => {
    // Log in as Administrator (Eleanor Vance)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.request.post('/api/auth/logout').catch(() => {});
    await page.reload();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#email').fill('admin@toktick.it');
    await page.locator('#password').fill('Admin1234!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify Admin Header Navigation has "Users"
    const usersNavBtn = page.getByRole('button', { name: 'Users', exact: true });
    await expect(usersNavBtn).toBeVisible({ timeout: 15000 });
    await usersNavBtn.click();

    // Verify User Management is rendered
    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // 4a. User Management Desktop
    const userListDesktop = path.join(ARTIFACTS_DIR, 'user-management', 'user-list-desktop.png');
    await page.screenshot({ path: userListDesktop, fullPage: true });
    copyScreenshot(userListDesktop, path.join(ARTIFACTS_DIR, 'user-management', 'desktop.png'));

    // 4b. User Management Tablet (768px minimum tablet width)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.getByRole('table')).toBeVisible();
    const hasTabletScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasTabletScroll).toBe(false);
    const userListTablet = path.join(ARTIFACTS_DIR, 'user-management', 'tablet.png');
    await page.screenshot({ path: userListTablet, fullPage: true });

    // Tablet at 991px (maximum tablet width)
    await page.setViewportSize({ width: 991, height: 1024 });
    await page.waitForTimeout(300);
    const hasTablet991Scroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasTablet991Scroll).toBe(false);
    const userListTablet991 = path.join(ARTIFACTS_DIR, 'user-management', 'tablet-991.png');
    await page.screenshot({ path: userListTablet991, fullPage: true });

    // 4c. User Management Mobile (375px mobile width)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await expect(page.getByTestId('user-cards-mobile')).toBeVisible();
    const hasMobileScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasMobileScroll).toBe(false);

    // Verify Edit and Reset Password action buttons are reachable in mobile card view
    const firstMobileCard = page.getByTestId('user-card-item').first();
    await expect(firstMobileCard.getByRole('button', { name: /^edit /i })).toBeVisible();
    await expect(firstMobileCard.getByRole('button', { name: /^reset password /i })).toBeVisible();

    const userListMobile = path.join(ARTIFACTS_DIR, 'user-management', 'user-management-mobile.png');
    await page.screenshot({ path: userListMobile, fullPage: true });
    copyScreenshot(userListMobile, path.join(ARTIFACTS_DIR, 'user-management', 'mobile.png'));

    // Reset to Desktop for dialogs and safety guards
    await page.setViewportSize({ width: 1280, height: 800 });

    // 4d. Create User Modal
    await page.getByRole('button', { name: /\+ Create User/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: /create new user/i })).toBeVisible();
    const createModalPath = path.join(ARTIFACTS_DIR, 'user-management', 'create-user-modal.png');
    await page.screenshot({ path: createModalPath, fullPage: true });
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);

    // 4e. Edit User Modal
    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    await editBtn.click();
    await expect(page.getByRole('heading', { level: 2, name: /edit user details/i })).toBeVisible();
    const editModalPath = path.join(ARTIFACTS_DIR, 'user-management', 'edit-user-modal.png');
    await page.screenshot({ path: editModalPath, fullPage: true });
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);

    // 4f. Reset Password Modal
    const resetBtn = page.getByRole('button', { name: /reset password/i }).first();
    await resetBtn.click();
    await expect(page.getByRole('heading', { level: 2, name: /reset password/i })).toBeVisible();
    const resetModalPath = path.join(ARTIFACTS_DIR, 'user-management', 'reset-password-modal.png');
    await page.screenshot({ path: resetModalPath, fullPage: true });
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);

    // 4g. Self-Deactivation Guard (BR-24)
    // Edit self (Eleanor Vance - admin@toktick.it)
    const editSelfBtn = page.getByRole('button', { name: /edit eleanor vance/i });
    if (await editSelfBtn.isVisible()) {
      await editSelfBtn.click();
      await expect(page.getByRole('switch', { name: /active account/i })).toBeDisabled();
      await expect(page.getByText(/you cannot deactivate your own account \(BR-24\)/i)).toBeVisible();
      const selfGuardPath = path.join(ARTIFACTS_DIR, 'user-management', 'self-deactivation-guard.png');
      await page.screenshot({ path: selfGuardPath, fullPage: true });
      await page.getByRole('button', { name: /cancel/i }).click();
      await page.waitForTimeout(300);
    }

    // 4h. Sole Active Admin Guard (BR-25)
    // Edit Marcus Reed (admin2) or view warning when guarded
    const editAdmin2Btn = page.getByRole('button', { name: /edit marcus reed/i });
    if (await editAdmin2Btn.isVisible()) {
      await editAdmin2Btn.click();
      const soleGuardPath = path.join(ARTIFACTS_DIR, 'user-management', 'sole-admin-guard.png');
      await page.screenshot({ path: soleGuardPath, fullPage: true });
      await page.getByRole('button', { name: /cancel/i }).click();
    }

    // Cleanup session
    await page.request.post('/api/auth/logout').catch(() => {});
  });
});

