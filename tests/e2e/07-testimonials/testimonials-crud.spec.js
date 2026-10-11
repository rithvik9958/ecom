import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Testimonials Complete CRUD Workflow', () => {

  test('Create Testimonial -> DB Verify -> Admin UI -> Storefront /testimonials -> Edit -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testItem = factory.createTestimonialData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Open Add Testimonial Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/ecommerce/testimonials');
    await adminPage.waitForLoadState('domcontentloaded');

    const addBtn = adminPage.getByRole('button', { name: /add testimonial/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = adminPage.locator('[role="dialog"]').filter({ hasText: /testimonial/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Fill Customer Name & City
    const inputs = dialog.locator('input');
    await inputs.nth(0).fill(testItem.name);
    await inputs.nth(1).fill(testItem.location);

    // Fill Review Body
    const textarea = dialog.locator('textarea').first();
    await textarea.fill(testItem.comment);

    // Submit form
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/testimonials') && res.request().method() === 'POST', { timeout: 15000 }),
      dialog.getByRole('button', { name: /create testimonial/i }).click(),
    ]);
    expect(createRes.status()).toBe(200);

    // ─────────────────────────────────────────────────────────────
    // 2. DB VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const testimonialDoc = await db.findTestimonial({ name: testItem.name });
    expect(testimonialDoc).not.toBeNull();
    expect(testimonialDoc.name).toBe(testItem.name);

    // ─────────────────────────────────────────────────────────────
    // 3. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const row = adminPage.locator('tr, [role="row"]').filter({ hasText: testItem.name });
    await expect(row.first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PUBLIC STOREFRONT REFLECTION (/testimonials)
    // ─────────────────────────────────────────────────────────────
    await storefrontPage.goto('/testimonials');
    await storefrontPage.waitForLoadState('domcontentloaded');

    const customerCard = storefrontPage.getByText(testItem.name);
    await expect(customerCard.first()).toBeVisible({ timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 5. DELETE TESTIMONIAL
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const deleteBtn = row.first().locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/testimonials') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // UI verify removed
    await expect(row.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify removed
    const deletedDoc = await db.findTestimonial({ _id: testimonialDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
