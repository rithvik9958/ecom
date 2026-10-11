import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS } from '../../helpers/auth.helper.js';

test.describe('Admin Authentication & Route Protection', () => {

  test('should display error message on invalid credentials', async ({ page }) => {
    await page.goto('/admin-login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('admin@eshop.com');
    await page.locator('#password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /login/i }).click();

    // Verify error banner is displayed
    const errorAlert = page.locator('.bg-rose-50');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/invalid/i);
  });

  test('should successfully log in with valid credentials and navigate to dashboard', async ({ page }) => {
    await page.goto('/admin-login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill(ADMIN_CREDENTIALS.email);
    await page.locator('#password').fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Verify URL redirect to /dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify sidebar exists
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users away from /dashboard to /admin-login', async ({ browser }) => {
    const context = await browser.newContext(); // completely clean context
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForURL('**/admin-login**', { timeout: 15000 });
    expect(page.url()).toContain('/admin-login');

    await context.close();
  });

  test('should log out from admin dashboard and redirect to /admin-login', async ({ page }) => {
    // 1. Log in
    await page.goto('/admin-login');
    await page.locator('#email').fill(ADMIN_CREDENTIALS.email);
    await page.locator('#password').fill(ADMIN_CREDENTIALS.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // 2. Open user menu in topbar
    const userMenuButton = page.locator('header .rounded-full').last();
    await userMenuButton.click();

    const logoutButton = page.getByRole('button', { name: /sign out/i });
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    // 3. Confirm redirected to /admin-login
    await page.waitForURL('**/admin-login**', { timeout: 15000 });
    expect(page.url()).toContain('/admin-login');
  });

});
