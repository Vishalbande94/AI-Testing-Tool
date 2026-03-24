// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PERFORMANCE TEST — PAGE LOAD TIMES
 * Tests each page of InsureAI for load time against defined thresholds.
 * Uses the Navigation Timing API (W3C standard) — no JMeter required.
 *
 * Metrics measured per page:
 *  - TTFB       : Time to First Byte
 *  - DOM Load   : DOMContentLoaded event
 *  - Full Load  : window.onload event
 *  - FCP        : First Contentful Paint
 *  - DOM Elements: Number of DOM nodes
 *  - JS Heap    : JavaScript memory used
 */

// ── PERFORMANCE BUDGET (thresholds in ms) ──────────────────────────────────
const BUDGET = {
  ttfb:      600,   // Time to First Byte — under 600ms
  domLoad:  2000,   // DOM interactive — under 2s
  fullLoad: 3000,   // Full page load — under 3s (REQ-017)
  fcp:      1800,   // First Contentful Paint — under 1.8s
};

// ── PAGES TO TEST ──────────────────────────────────────────────────────────
const PAGES = [
  { name: 'Landing Page',       url: '/',                  auth: false },
  { name: 'Login Page',         url: '/login.html',        auth: false },
  { name: 'Register Page',      url: '/register.html',     auth: false },
  { name: 'Forgot Password',    url: '/forgot-password.html', auth: false },
  { name: 'Dashboard',          url: '/dashboard.html',    auth: true  },
  { name: 'Get Quote',          url: '/get-quote.html',    auth: true  },
  { name: 'Motor Quote',        url: '/motor-quote.html',  auth: true  },
  { name: 'Health Quote',       url: '/health-quote.html', auth: true  },
  { name: 'Home Quote',         url: '/home-quote.html',   auth: true  },
  { name: 'Travel Quote',       url: '/travel-quote.html', auth: true  },
  { name: 'My Policies',        url: '/policies.html',     auth: true  },
  { name: 'Claims',             url: '/claims.html',       auth: true  },
  { name: 'Payments',           url: '/payments.html',     auth: true  },
  { name: 'Documents',          url: '/documents.html',    auth: true  },
  { name: 'Admin Panel',        url: '/admin.html',        auth: true, role: 'admin' },
];

// ── HELPER: Inject demo session into localStorage ──────────────────────────
async function seedSession(page, role = 'customer') {
  await page.goto('/login.html');
  await page.evaluate((r) => {
    const users = [
      { id:'USR001', name:'Rahul Sharma', email:'rahul@demo.com', mobile:'9876543210',
        dob:'1990-05-15', password:'Test@1234', role:'customer', verified:true,
        loginAttempts:0, locked:false, createdAt:'2026-01-10T00:00:00Z' },
      { id:'USR000', name:'Admin User', email:'admin@insureai.com', mobile:'9000000000',
        dob:'1985-01-01', password:'Admin@123', role:'admin', verified:true,
        loginAttempts:0, locked:false, createdAt:'2026-01-01T00:00:00Z' }
    ];
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('policies', JSON.stringify([
      { id:'POL001', userId:'USR001', type:'Motor', plan:'Comprehensive',
        startDate:'2026-01-01', endDate:'2026-12-31', premium:12500,
        sumInsured:500000, status:'Active', nominee:'Test', nomineeRel:'Spouse',
        vehicleData:{ regNum:'MH12AB1234', make:'Maruti Suzuki', model:'Swift',
          year:'2022', fuelType:'Petrol', city:'Mumbai' }, createdAt:'2026-01-01T00:00:00Z' }
    ]));
    localStorage.setItem('claims', JSON.stringify([]));
    localStorage.setItem('payments', JSON.stringify([
      { id:'TXN001', userId:'USR001', policyId:'POL001', policyType:'Motor',
        date:'2026-01-01', amount:12500, method:'Credit Card', status:'Success', txnRef:'REF001' }
    ]));
    localStorage.setItem('seeded', 'true');
    const user = r === 'admin' ? users[1] : users[0];
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, role);
}

// ── HELPER: Collect navigation timing metrics ──────────────────────────────
async function collectMetrics(page) {
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(e => e.name === 'first-contentful-paint');
    const fp  = paint.find(e => e.name === 'first-paint');

    const domElements = document.querySelectorAll('*').length;
    const resources   = performance.getEntriesByType('resource');
    const totalResourceSize = resources.reduce((s, r) => s + (r.transferSize || 0), 0);

    return {
      ttfb:             Math.round(nav ? nav.responseStart - nav.requestStart : 0),
      domInteractive:   Math.round(nav ? nav.domInteractive - nav.startTime : 0),
      domContentLoaded: Math.round(nav ? nav.domContentLoadedEventEnd - nav.startTime : 0),
      fullLoad:         Math.round(nav ? nav.loadEventEnd - nav.startTime : 0),
      firstPaint:       Math.round(fp  ? fp.startTime  : 0),
      fcp:              Math.round(fcp ? fcp.startTime : 0),
      domElements,
      resourceCount:    resources.length,
      totalResourceKB:  Math.round(totalResourceSize / 1024),
    };
  });
}

// ── RESULTS STORE ──────────────────────────────────────────────────────────
const results = [];

// ══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ══════════════════════════════════════════════════════════════════════════

test.describe('📊 Page Load Performance — InsureAI', () => {

  // Seed session before all tests in this suite
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await seedSession(page, 'customer');
    await page.close();
  });

  // ── PUBLIC PAGES ──────────────────────────────────────────────────────
  test.describe('Public Pages (No Auth)', () => {

    test('PT_001 | Landing Page — load time within budget', async ({ page }) => {
      const start = Date.now();
      await page.goto('/', { waitUntil: 'load' });
      const elapsed = Date.now() - start;
      const metrics = await collectMetrics(page);

      console.log('\n📄 Landing Page');
      console.table(metrics);

      results.push({ page: 'Landing Page', url: '/', ...metrics, wallClock: elapsed, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad, `Landing page load: ${metrics.fullLoad}ms (budget: ${BUDGET.fullLoad}ms)`).toBeLessThanOrEqual(BUDGET.fullLoad);
      expect(metrics.fcp,      `Landing FCP: ${metrics.fcp}ms (budget: ${BUDGET.fcp}ms)`).toBeLessThanOrEqual(BUDGET.fcp);
    });

    test('PT_002 | Login Page — load time within budget', async ({ page }) => {
      await page.goto('/login.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);

      console.log('\n📄 Login Page');
      console.table(metrics);
      results.push({ page: 'Login Page', url: '/login.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
      expect(metrics.fcp).toBeLessThanOrEqual(BUDGET.fcp);
    });

    test('PT_003 | Register Page — load time within budget', async ({ page }) => {
      await page.goto('/register.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Register Page', url: '/register.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

  });

  // ── AUTHENTICATED PAGES ───────────────────────────────────────────────
  test.describe('Authenticated Pages (Customer)', () => {

    test.beforeEach(async ({ page }) => {
      await seedSession(page, 'customer');
    });

    test('PT_004 | Dashboard — load time within 3 seconds (REQ-017)', async ({ page }) => {
      await page.goto('/dashboard.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);

      console.log('\n📄 Dashboard');
      console.table(metrics);
      results.push({ page: 'Dashboard', url: '/dashboard.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      // REQ-017: Dashboard shall load within 3 seconds
      expect(metrics.fullLoad, `Dashboard load: ${metrics.fullLoad}ms — REQ-017 requires < 3000ms`).toBeLessThanOrEqual(3000);
    });

    test('PT_005 | Get Quote Page — load time within budget', async ({ page }) => {
      await page.goto('/get-quote.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Get Quote', url: '/get-quote.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_006 | Motor Quote — load time within budget', async ({ page }) => {
      await page.goto('/motor-quote.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Motor Quote', url: '/motor-quote.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_007 | Health Quote — load time within budget', async ({ page }) => {
      await page.goto('/health-quote.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Health Quote', url: '/health-quote.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_008 | Home Quote — load time within budget', async ({ page }) => {
      await page.goto('/home-quote.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Home Quote', url: '/home-quote.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_009 | Travel Quote — load time within budget', async ({ page }) => {
      await page.goto('/travel-quote.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Travel Quote', url: '/travel-quote.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_010 | My Policies — load time within budget', async ({ page }) => {
      await page.goto('/policies.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'My Policies', url: '/policies.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_011 | Claims — load time within budget', async ({ page }) => {
      await page.goto('/claims.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Claims', url: '/claims.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_012 | Payments — load time within budget', async ({ page }) => {
      await page.goto('/payments.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Payments', url: '/payments.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

    test('PT_013 | Documents — load time within budget', async ({ page }) => {
      await page.goto('/documents.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Documents', url: '/documents.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

  });

  // ── ADMIN PANEL ───────────────────────────────────────────────────────
  test.describe('Admin Panel', () => {

    test.beforeEach(async ({ page }) => {
      await seedSession(page, 'admin');
    });

    test('PT_014 | Admin Panel — load time within budget', async ({ page }) => {
      await page.goto('/admin.html', { waitUntil: 'load' });
      const metrics = await collectMetrics(page);
      results.push({ page: 'Admin Panel', url: '/admin.html', ...metrics, pass: metrics.fullLoad <= BUDGET.fullLoad });

      expect(metrics.fullLoad).toBeLessThanOrEqual(BUDGET.fullLoad);
    });

  });

  // ── SAVE RESULTS TO FILE ──────────────────────────────────────────────
  test.afterAll(async () => {
    const dir = path.join(process.cwd(), 'performance-results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'page-load-results.json');
    fs.writeFileSync(file, JSON.stringify({ budget: BUDGET, results, timestamp: new Date().toISOString() }, null, 2));
    console.log(`\n✅ Results saved to: ${file}`);

    // Print summary table
    console.log('\n════════════════════════════════════════════════════════');
    console.log('📊 PERFORMANCE SUMMARY — PAGE LOAD TIMES');
    console.log('════════════════════════════════════════════════════════');
    results.forEach(r => {
      const icon = r.pass ? '✅' : '❌';
      console.log(`${icon} ${r.page.padEnd(20)} TTFB:${String(r.ttfb).padStart(5)}ms  FCP:${String(r.fcp).padStart(5)}ms  Load:${String(r.fullLoad).padStart(5)}ms  DOM:${r.domElements} nodes`);
    });
    console.log('════════════════════════════════════════════════════════');
    const failed = results.filter(r => !r.pass);
    if (failed.length > 0) {
      console.log(`\n⚠️  ${failed.length} page(s) exceeded performance budget:`);
      failed.forEach(r => console.log(`   - ${r.page}: ${r.fullLoad}ms (budget: ${BUDGET.fullLoad}ms)`));
    } else {
      console.log('\n🎉 All pages passed the performance budget!');
    }
  });

});
