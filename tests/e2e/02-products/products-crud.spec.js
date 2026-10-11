import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Products Complete End-to-End Workflow', () => {

  test('Full Lifecycle: Create -> API -> DB -> Admin UI -> Storefront -> Edit -> Toggle -> Delete', async ({
    adminPage,
    storefrontPage,
    db,
    factory,
  }) => {
    const testData = factory.createProductData();

    // ─────────────────────────────────────────────────────────────
    // 1. ADMIN UI: Navigate and Open Create Modal
    // ─────────────────────────────────────────────────────────────
    await adminPage.goto('/dashboard/ecommerce/products');
    await adminPage.waitForLoadState('domcontentloaded');

    // Click "Add Product" button
    const addProductBtn = adminPage.getByRole('button', { name: /add product/i });
    await expect(addProductBtn).toBeVisible({ timeout: 10000 });
    await addProductBtn.click();

    // Wait for ProductModal dialog to open
    const modal = adminPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Fill Title
    const titleInput = modal.locator('input[placeholder*="Red Roses Bouquet"]');
    await titleInput.fill(testData.title);

    // Select Category (pick first available option)
    const categoryTrigger = modal.getByText(/select category\.\.\./i);
    if (await categoryTrigger.isVisible()) {
      await categoryTrigger.click();
      const selectContainer = modal.locator('.custom-select-container').first();
      const firstCatOption = selectContainer.locator('.max-h-56 button').first();
      await firstCatOption.waitFor({ state: 'visible', timeout: 5000 });
      await firstCatOption.click();
    }

    // Fill Selling Price & Stock
    const priceInput = modal.locator('input[type="number"]').first();
    await priceInput.fill(testData.price);

    const stockInput = modal.locator('input[placeholder*="50"]');
    if (await stockInput.isVisible()) {
      await stockInput.fill(testData.stock);
    }

    // Submit form: Click "Create Product" and wait for response
    const [createRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-products') && res.request().method() === 'POST', { timeout: 15000 }),
      modal.getByRole('button', { name: /create product/i }).click(),
    ]);

    // ─────────────────────────────────────────────────────────────
    // 2. BACKEND / API VERIFICATION
    // ─────────────────────────────────────────────────────────────
    expect([200, 201]).toContain(createRes.status());
    const createdProductPayload = await createRes.json();
    expect(createdProductPayload.title).toBe(testData.title);

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 3. DATABASE / MONGODB STATE VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const productDoc = await db.findProduct({ title: testData.title });
    expect(productDoc).not.toBeNull();
    expect(productDoc.title).toBe(testData.title);
    expect(Number(productDoc.price)).toBe(Number(testData.price));
    expect(productDoc.isActive).toBe(true);

    // ─────────────────────────────────────────────────────────────
    // 4. ADMIN UI LISTING VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const tableRow = adminPage.locator('tr, [role="row"]').filter({ hasText: testData.title });
    await expect(tableRow.first()).toBeVisible({ timeout: 10000 });
    await expect(tableRow.first()).toContainText(testData.price);

    // ─────────────────────────────────────────────────────────────
    // 5. PUBLIC STOREFRONT REFLECTION
    // ─────────────────────────────────────────────────────────────
    // A) Catalog Listing
    await storefrontPage.goto('/products');
    await storefrontPage.waitForLoadState('domcontentloaded');
    const catalogItem = storefrontPage.getByText(testData.title);
    await expect(catalogItem.first()).toBeVisible({ timeout: 15000 });

    // B) Direct Product Detail Page
    const productId = productDoc.id || String(productDoc._id);
    await storefrontPage.goto(`/products/${productId}`);
    await storefrontPage.waitForLoadState('domcontentloaded');

    await expect(storefrontPage.getByText(testData.title).first()).toBeVisible({ timeout: 10000 });
    await expect(storefrontPage.getByText(`₹${testData.price}`).first()).toBeVisible();

    // ─────────────────────────────────────────────────────────────
    // 6. UPDATE PRODUCT (Price edit: 499 -> 599)
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const editBtn = tableRow.first().locator('button[title="Edit Product"], button:has-text("Edit Product")');
    await editBtn.click();

    const editModal = adminPage.locator('[role="dialog"]');
    await expect(editModal).toBeVisible({ timeout: 10000 });

    const newPrice = '599';
    const editPriceInput = editModal.locator('input[type="number"]').first();
    await editPriceInput.fill(newPrice);

    const [updateRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-products') && res.request().method() === 'PUT', { timeout: 30000 }),
      editModal.getByRole('button', { name: /save changes/i }).click(),
    ]);
    expect(updateRes.status()).toBe(200);

    // Wait for edit modal to close
    await expect(editModal).not.toBeVisible({ timeout: 15000 });

    // DB verify update
    const updatedDoc = await db.findProduct({ _id: productDoc._id });
    expect(Number(updatedDoc.price)).toBe(599);

    // Storefront reflection verify update
    await storefrontPage.bringToFront();
    await storefrontPage.reload();
    await expect(storefrontPage.getByText('₹599').first()).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────
    // 7. STATUS TOGGLE (Active -> Inactive)
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const statusSwitch = tableRow.first().locator('button[role="switch"]');
    await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-products') && res.request().method() === 'PUT', { timeout: 15000 }),
      statusSwitch.click(),
    ]);
    await adminPage.waitForTimeout(500);

    // DB verify inactive
    const toggledDoc = await db.findProduct({ _id: productDoc._id });
    expect(toggledDoc.isActive).toBe(false);

    // Storefront reflection: Should no longer be present on catalog
    await storefrontPage.bringToFront();
    await storefrontPage.goto('/products');
    await expect(storefrontPage.getByText(testData.title)).not.toBeVisible();

    // ─────────────────────────────────────────────────────────────
    // 8. DELETE PRODUCT
    // ─────────────────────────────────────────────────────────────
    await adminPage.bringToFront();
    const deleteBtn = tableRow.first().locator('button[title="Delete Product"], button:has-text("Delete Product")');
    await deleteBtn.click();

    const confirmModal = adminPage.locator('[role="dialog"]').filter({ hasText: /delete/i });
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    const [deleteRes] = await Promise.all([
      adminPage.waitForResponse(res => res.url().includes('/api/admin/store-products') && res.request().method() === 'DELETE', { timeout: 15000 }),
      confirmModal.getByRole('button', { name: /^delete$/i }).click(),
    ]);
    expect(deleteRes.status()).toBe(200);

    // Admin UI verify removed
    await expect(tableRow.first()).not.toBeVisible({ timeout: 5000 });

    // DB verify permanently deleted
    const deletedDoc = await db.findProduct({ _id: productDoc._id });
    expect(deletedDoc).toBeNull();
  });

});
