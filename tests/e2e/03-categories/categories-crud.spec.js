import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Categories Complete CRUD Workflow', () => {

  test('Create Category -> DB Verify -> Admin UI -> Storefront -> Toggle -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testCat = factory.createCategoryData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Open Create Category Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/ecommerce/categories');
    await adminPage.waitForLoadState('domcontentloaded');

    const addCatBtn = adminPage.getByRole('button', { name: /add category/i });
    await expect(addCatBtn).toBeVisible({ timeout: 10000 });
    await addCatBtn.click();

    const modal = adminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Fill Title & Description
    const titleInput = modal.locator('input[placeholder*="Birthday Gifts"]');
    await titleInput.fill(testCat.title);

    const descInput = modal.locator('textarea[placeholder*="Category description"]');
    await descInput.fill(testCat.description);

    // Click Save Category and wait for POST request
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-categories') && res.request().method() === 'POST', { timeout: 15000 }),
      modal.getByRole('button', { name: /save category/i }).click(),
    ]);

    expect([200, 201]).toContain(createRes.status());

    // ─────────────────────────────────────────────────────────────
    // 2. DB VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const catDoc = await db.findCategory({ title: testCat.title });
    expect(catDoc).not.toBeNull();
    expect(catDoc.title).toBe(testCat.title);
    expect(catDoc.isActive).toBe(true);

    // ─────────────────────────────────────────────────────────────
    // 3. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const catRow = adminPage.locator('tr, [role="row"]').filter({ hasText: testCat.title });
    await expect(catRow.first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PUBLIC STOREFRONT REFLECTION
    // ─────────────────────────────────────────────────────────────
    const catSlug = catDoc.slug || catDoc.id;
    await storefrontPage.goto(`/category/${catSlug}`);
    await storefrontPage.waitForLoadState('domcontentloaded');

    // Verify category title or page content reflects new category
    const heading = storefrontPage.getByText(testCat.title);
    await expect(heading.first()).toBeVisible({ timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 5. STATUS TOGGLE (Active -> Inactive)
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const statusSwitch = catRow.first().locator('button[role="switch"]');
    await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-categories') && res.request().method() === 'PUT', { timeout: 15000 }),
      statusSwitch.click(),
    ]);
    await adminPage.waitForTimeout(500);

    // DB verify
    const toggledDoc = await db.findCategory({ _id: catDoc._id });
    expect(toggledDoc.isActive).toBe(false);

    // ─────────────────────────────────────────────────────────────
    // 6. DELETE CATEGORY
    // ─────────────────────────────────────────────────────────────
    const deleteBtn = catRow.first().locator('button[title="Delete Category"], button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-categories') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // UI verify removed
    await expect(catRow.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify removed
    const deletedDoc = await db.findCategory({ _id: catDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
