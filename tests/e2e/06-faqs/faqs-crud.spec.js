import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('FAQs Complete CRUD Workflow', () => {

  test('Create FAQ -> DB Verify -> Admin UI -> Storefront /faqs -> Edit -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testFaq = factory.createFaqData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Open Add Question Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/ecommerce/faqs');
    await adminPage.waitForLoadState('domcontentloaded');

    const addBtn = adminPage.getByRole('button', { name: /add question/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialog = adminPage.locator('[role="dialog"]').filter({ hasText: /faq question/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Fill Question & Answer
    const questionInput = dialog.locator('input').first();
    await questionInput.fill(testFaq.question);

    const answerInput = dialog.locator('textarea').first();
    await answerInput.fill(testFaq.answer);

    // Save Question (button text is "Create Question")
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/faqs') && res.request().method() === 'POST', { timeout: 15000 }),
      dialog.getByRole('button', { name: /create question/i }).click(),
    ]);
    expect(createRes.status()).toBe(200);

    // ─────────────────────────────────────────────────────────────
    // 2. DB VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const faqDoc = await db.findFaq({ question: testFaq.question });
    expect(faqDoc).not.toBeNull();
    expect(faqDoc.question).toBe(testFaq.question);
    expect(faqDoc.isActive).toBe(true);

    // ─────────────────────────────────────────────────────────────
    // 3. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const faqRow = adminPage.locator('tr, [role="row"]').filter({ hasText: testFaq.question });
    await expect(faqRow.first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PUBLIC STOREFRONT REFLECTION (/faqs)
    // ─────────────────────────────────────────────────────────────
    await storefrontPage.goto('/faqs');
    await storefrontPage.waitForLoadState('domcontentloaded');

    const questionItem = storefrontPage.getByText(testFaq.question);
    await expect(questionItem.first()).toBeVisible({ timeout: 15000 });

    // ─────────────────────────────────────────────────────────────
    // 5. DELETE FAQ
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const deleteBtn = faqRow.first().locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/faqs') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // Admin UI verify removed
    await expect(faqRow.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify removed
    const deletedDoc = await db.findFaq({ _id: faqDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
