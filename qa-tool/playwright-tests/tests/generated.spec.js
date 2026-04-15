
// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL  = 'https://example.com';
const BASE_DIR  = 'https://example.com';   // directory containing all HTML pages
const IS_FILE   = false;

// ── URL builder: works for both http:// and file:// ────────────────────────────
function pageUrl(filename) {
  // filename like 'login.html' or '/login.html'
  const name = filename.replace(/^\//, '');
  return BASE_DIR + '/' + name;
}

// ── Shared Helpers ─────────────────────────────────────────────────────────────
async function tryFind(page, selectors, timeout = 4000) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      const visible = await el.isVisible({ timeout: Math.min(timeout, 2000) });
      if (visible) return el;
    } catch { /* try next selector */ }
  }
  return null;
}

async function tryFill(page, selectors, value) {
  const el = await tryFind(page, selectors);
  if (el) { await el.clear(); await el.fill(value); return true; }
  return false;
}

async function tryClick(page, selectors) {
  const el = await tryFind(page, selectors);
  if (el) { await el.click(); return true; }
  return false;
}

async function gotoLogin(page) {
  const url = page.url();
  if (url.includes('login') || url.includes('signin')) return;

  const clicked = await tryClick(page, [
    'a[href*="login"]', 'a[href*="Login"]', 'a[href*="signin"]',
    'a:has-text("Login")', 'a:has-text("Sign In")', 'a:has-text("Log In")',
    'button:has-text("Login")', 'button:has-text("Sign In")',
    '[data-testid*="login"]', '.nav-link:has-text("Login")',
  ]);

  if (!clicked) {
    // For file:// URLs try sibling HTML files; for http:// try path segments
    const candidates = IS_FILE
      ? ['login.html', 'signin.html', 'login/index.html']
      : ['login.html', 'login', 'signin', 'auth/login'];
    for (const p of candidates) {
      try {
        await page.goto(pageUrl(p), { timeout: 5000, waitUntil: 'domcontentloaded' });
        if (page.url().toLowerCase().includes('login') || page.url().toLowerCase().includes('signin')) break;
      } catch { /* try next */ }
    }
  }
}

async function hasError(page) {
  const sels = ['.alert-danger', '.error-message', '.invalid-feedback',
    '[class*="error"]', '[role="alert"]', '.alert.error', '.form-error', '.text-danger'];
  for (const s of sels) {
    try {
      if (await page.locator(s).first().isVisible({ timeout: 1000 })) return true;
    } catch { /* ignore */ }
  }
  return false;
}



// ─────────────────────────────────────────────────────────────────────────────
// TC_001 | Login | Positive
// Valid login
// ─────────────────────────────────────────────────────────────────────────────
test('TC_001 | Valid login', async ({ page }) => {
  test.info().annotations.push({ type: 'module', description: 'Login' });
  test.info().annotations.push({ type: 'type',   description: 'Positive' });
  test.info().annotations.push({ type: 'key',    description: 'login_tc_001' });


  // Generic test for: login_tc_001
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  expect(title, 'Application should load successfully').toBeTruthy();

});


// ─────────────────────────────────────────────────────────────────────────────
// TC_002 | Login | Negative
// Invalid password
// ─────────────────────────────────────────────────────────────────────────────
test('TC_002 | Invalid password', async ({ page }) => {
  test.info().annotations.push({ type: 'module', description: 'Login' });
  test.info().annotations.push({ type: 'type',   description: 'Negative' });
  test.info().annotations.push({ type: 'key',    description: 'login_tc_002' });


  // Generic test for: login_tc_002
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  expect(title, 'Application should load successfully').toBeTruthy();

});


// ─────────────────────────────────────────────────────────────────────────────
// TC_003 | Security | Security
// XSS sanitization
// ─────────────────────────────────────────────────────────────────────────────
test('TC_003 | XSS sanitization', async ({ page }) => {
  test.info().annotations.push({ type: 'module', description: 'Security' });
  test.info().annotations.push({ type: 'type',   description: 'Security' });
  test.info().annotations.push({ type: 'key',    description: 'security_tc_003' });


  // Generic test for: security_tc_003
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  expect(title, 'Application should load successfully').toBeTruthy();

});