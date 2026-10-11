import fs from 'fs';
import path from 'path';

export const ADMIN_CREDENTIALS = {
  email: 'admin@eshop.com',
  password: 'Admin@1234',
};

export const AUTH_DIR = path.resolve(process.cwd(), 'tests/.auth');
export const AUTH_FILE = path.resolve(AUTH_DIR, 'admin-state.json');

/**
 * Perform manual UI login as admin
 */
export async function loginAsAdmin(page, credentials = ADMIN_CREDENTIALS) {
  await page.goto('/admin-login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(credentials.email);

  const pwdInput = page.locator('#password');
  await pwdInput.fill(credentials.password);

  await page.getByRole('button', { name: /login/i }).click();

  // Wait for redirect to /dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Ensure storageState exists; if not or expired, authenticate and save state
 */
export async function ensureAdminStorageState(browser) {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // If state file exists and was created recently (less than 2 hours ago), reuse it
  if (fs.existsSync(AUTH_FILE)) {
    const stats = fs.statSync(AUTH_FILE);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < 2 * 60 * 60 * 1000) {
      return AUTH_FILE;
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  await loginAsAdmin(page);

  await context.storageState({ path: AUTH_FILE });
  await context.close();

  return AUTH_FILE;
}
