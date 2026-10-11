import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Blogs Complete CRUD Workflow', () => {

  test('Create Article -> DB Verify -> Admin UI -> Storefront /blog/[slug] -> Toggle -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testArticle = factory.createBlogData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Open Write Article Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/blogs');
    await adminPage.waitForLoadState('domcontentloaded');

    const writeBtn = adminPage.getByRole('button', { name: /write article/i });
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await writeBtn.click();

    const dialog = adminPage.locator('[role="dialog"]').filter({ hasText: /write new celebration article|create article|publish article/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Fill Article Title
    const titleInput = dialog.locator('input').first();
    await titleInput.fill(testArticle.title);

    // Save Article
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/blogs') && res.request().method() === 'POST', { timeout: 15000 }),
      dialog.getByRole('button', { name: /publish article/i }).click(),
    ]);
    expect(createRes.status()).toBe(200);

    // ─────────────────────────────────────────────────────────────
    // 2. DB VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const blogDoc = await db.findBlog({ title: testArticle.title });
    expect(blogDoc).not.toBeNull();
    expect(blogDoc.title).toBe(testArticle.title);
    expect(blogDoc.isPublished).toBe(true);

    // ─────────────────────────────────────────────────────────────
    // 3. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const blogRow = adminPage.locator('tr, [role="row"]').filter({ hasText: testArticle.title });
    await expect(blogRow.first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PUBLIC STOREFRONT REFLECTION (/blog and /blog/[slug])
    // ─────────────────────────────────────────────────────────────
    // A) Blog Listing
    await storefrontPage.goto('/blog');
    await storefrontPage.waitForLoadState('domcontentloaded');
    await expect(storefrontPage.getByText(testArticle.title).first()).toBeVisible({ timeout: 15000 });

    // B) Direct Post Page
    await storefrontPage.goto(`/blog/${blogDoc.slug}`);
    await storefrontPage.waitForLoadState('domcontentloaded');
    await expect(storefrontPage.getByText(testArticle.title).first()).toBeVisible({ timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 5. STATUS TOGGLE (Live -> Draft)
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const statusSwitch = blogRow.first().locator('button[role="switch"]');
    await statusSwitch.click();
    await adminPage.waitForTimeout(1500);

    // DB verify
    const toggledDoc = await db.findBlog({ _id: blogDoc._id });
    expect(toggledDoc.isPublished).toBe(false);

    // ─────────────────────────────────────────────────────────────
    // 6. DELETE ARTICLE
    // ─────────────────────────────────────────────────────────────
    const deleteBtn = blogRow.first().locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/blogs') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // UI verify removed
    await expect(blogRow.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify removed
    const deletedDoc = await db.findBlog({ _id: blogDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
