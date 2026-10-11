import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Custom Pages Complete CRUD Workflow', () => {

  test('Create Page -> DB Verify -> Admin UI -> Storefront /[slug] -> Toggle -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testPage = factory.createCustomPageData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Open Create Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/custom-pages');
    await adminPage.waitForLoadState('domcontentloaded');

    const addBtn = adminPage.getByRole('button', { name: /add page/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = adminPage.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Fill Title (FloatingInput)
    const titleInput = dialog.locator('input').first();
    await titleInput.fill(testPage.title);

    // Save Page
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/custom-pages') && res.request().method() === 'POST', { timeout: 15000 }),
      dialog.getByRole('button', { name: /save page/i }).click(),
    ]);
    expect(createRes.status()).toBe(201);

    // ─────────────────────────────────────────────────────────────
    // 2. DB VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const pageDoc = await db.findCustomPage({ title: testPage.title });
    expect(pageDoc).not.toBeNull();
    expect(pageDoc.title).toBe(testPage.title);
    expect(pageDoc.isActive).toBe(true);

    // ─────────────────────────────────────────────────────────────
    // 3. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const pageRow = adminPage.locator('tr, [role="row"]').filter({ hasText: testPage.title });
    await expect(pageRow.first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PUBLIC STOREFRONT REFLECTION (/[slug])
    // ─────────────────────────────────────────────────────────────
    await storefrontPage.goto(`/${pageDoc.slug}`);
    await storefrontPage.waitForLoadState('domcontentloaded');

    const heading = storefrontPage.getByText(testPage.title);
    await expect(heading.first()).toBeVisible({ timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 5. STATUS TOGGLE (Active -> Inactive)
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const statusSwitch = pageRow.first().locator('button[role="switch"]');
    await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/custom-pages') && res.request().method() === 'PUT', { timeout: 15000 }),
      statusSwitch.click(),
    ]);
    await adminPage.waitForTimeout(500);

    // DB verify
    const toggledDoc = await db.findCustomPage({ _id: pageDoc._id });
    expect(toggledDoc.isActive).toBe(false);

    // ─────────────────────────────────────────────────────────────
    // 6. DELETE CUSTOM PAGE
    // ─────────────────────────────────────────────────────────────
    const deleteBtn = pageRow.first().locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/custom-pages') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // Admin UI verify removed
    await expect(pageRow.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify removed
    const deletedDoc = await db.findCustomPage({ _id: pageDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
