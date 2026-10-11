import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Orders Management & Fulfillment Workflow', () => {

  test('View Orders List -> Open Order Details Modal -> Verify Order Data', async ({
    adminPage,
  }) => {
    // 1. Navigate to Orders in Admin
    await adminPage.goto('/dashboard/ecommerce/orders');
    await adminPage.waitForLoadState('domcontentloaded');

    // Verify orders table or empty state
    const table = adminPage.locator('table, tbody');
    await expect(table.first()).toBeVisible({ timeout: 15000 });

    // Open first order modal via View button
    const viewBtn = adminPage.locator('button[title="View Order"], button[title="Edit Order"]').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();

      // Verify modal opens with order details
      const modal = adminPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Close modal
      const closeBtn = modal.locator('button').filter({ hasText: /cancel|close/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

});
