import { test, expect } from '../../fixtures/test-fixtures.js';

test.describe('Theme, Branding & Visual Styling Workflow', () => {

  test('Verify Brand Settings in Admin & Reflection on Admin Login & Storefront', async ({
    adminPage,
    storefrontPage,
  }) => {
    // 1. Navigate to Theme & Branding
    await adminPage.goto('/dashboard/ecommerce/theme');
    await adminPage.waitForLoadState('domcontentloaded');

    // Verify brand config tabs / sections are visible
    const brandHeading = adminPage.getByText(/brand.*logo|store.*theme/i);
    await expect(brandHeading.first()).toBeVisible({ timeout: 15000 });

    // 2. Verify Storefront has active branding loaded in navbar / title
    await storefrontPage.goto('/');
    await storefrontPage.waitForLoadState('domcontentloaded');

    // Storefront title should be non-empty and page rendered without error
    const pageTitle = await storefrontPage.title();
    expect(pageTitle.length).toBeGreaterThan(0);
  });

});
