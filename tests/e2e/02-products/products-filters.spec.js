import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Products Search, Filters & Table Toolbar', () => {

  test('should search and filter products in real-time in Admin DataTable', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/ecommerce/products');
    await adminPage.waitForLoadState('domcontentloaded');

    // Ensure products table is loaded
    const rows = adminPage.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    const searchInput = adminPage.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // 1. Search for non-existent term
    await searchInput.fill('XYZ_NON_EXISTENT_PRODUCT_QUERY_999');
    await adminPage.waitForTimeout(500);

    // Should display empty state or 0 rows
    const noResults = adminPage.getByText(/no products found|no data available|no records/i);
    const visibleRowCount = await rows.count();
    expect(visibleRowCount === 0 || await noResults.isVisible()).toBe(true);

    // 2. Clear search input
    await searchInput.fill('');
    await adminPage.waitForTimeout(500);
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

});
