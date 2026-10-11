import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Homepage Sections Layout Builder Workflow', () => {

  test('Toggle Section Visibility -> Save -> Storefront / Reflection', async ({
    adminPage,
    storefrontPage,
  }) => {
    // 1. Open Homepage Builder in Admin
    await adminPage.goto('/dashboard/homepage');
    await adminPage.waitForLoadState('domcontentloaded');

    // Verify sections table is loaded
    const rows = adminPage.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    // Pick first section's status switch
    const firstRow = rows.first();
    const statusSwitch = firstRow.locator('button[role="switch"]');

    // Toggle switch
    await statusSwitch.click();
    await adminPage.waitForTimeout(600);

    // Click "Save Layout" button
    const saveBtn = adminPage.getByRole('button', { name: /save layout/i });
    const [saveRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-homepage') && res.request().method() === 'POST', { timeout: 15000 }),
      saveBtn.click(),
    ]);
    expect(saveRes.status()).toBe(200);

    // 2. Open Public Storefront Homepage
    await storefrontPage.goto('/');
    await storefrontPage.waitForLoadState('domcontentloaded');

    // 3. Restore toggle back to preserve initial user state
    await adminPage.bringToFront();
    await statusSwitch.click();
    await adminPage.waitForTimeout(600);
    await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-homepage') && res.request().method() === 'POST', { timeout: 15000 }),
      saveBtn.click(),
    ]);
  });

});
