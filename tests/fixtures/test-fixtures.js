import { test as base, expect } from '@playwright/test';
import { ensureAdminStorageState } from '../helpers/auth.helper.js';
import * as db from '../helpers/db.helper.js';
import * as factory from '../helpers/factory.helper.js';

/**
 * Custom Playwright test fixture extending base test with:
 * - adminPage: Authenticated browser page
 * - storefrontPage: Unauthenticated clean browser page for public testing
 * - db: MongoDB helper
 * - factory: Test data generators
 */
export const test = base.extend({
  // Global admin authenticated context
  adminPage: async ({ browser }, use) => {
    const storageState = await ensureAdminStorageState(browser);
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    await use(page);

    await context.close();
  },

  // Public storefront page (incognito/unauthenticated)
  storefrontPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await use(page);

    await context.close();
  },

  // Direct MongoDB helper
  db: async ({}, use) => {
    await db.connectTestDB();
    await use(db);
  },

  // Data factory
  factory: async ({}, use) => {
    await use(factory);
  },
});

export { expect };

// Auto-cleanup after each test file run to prevent orphan test data
test.afterAll(async () => {
  try {
    await db.cleanupTestRecords();
  } catch (err) {
    console.warn('[afterAll Cleanup Warning]:', err.message);
  }
});
