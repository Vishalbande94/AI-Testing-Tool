// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PERFORMANCE TEST — CORE WEB VITALS (CWV)
 * Industry-standard metrics used by Google to measure real-world user experience.
 *
 * Metrics:
 *  LCP  — Largest Contentful Paint    : How fast the main content loads    (Good < 2.5s)
 *  FID  — First Input Delay           : How fast the page responds to input (Good < 100ms)
 *  CLS  — Cumulative Layout Shift     : How stable the layout is            (Good < 0.1)
 *  FCP  — First Contentful Paint      : First visual feedback to user       (Good < 1.8s)
 *  TBT  — Total Blocking Time         : Main thread blocking time           (Good < 200ms)
 *  INP  — Interaction to Next Paint   : Responsiveness                      (Good < 200ms)
 *  SI   — Speed Index                 : How quickly content visually loads
 */

// ── CWV THRESHOLDS ──────────────────────────────────────────────────────────
const CWV = {
  lcp:  { good: 2500, needsWork: 4000 },   // ms
  fcp:  { good: 1800, needsWork: 3000 },   // ms
  cls:  { good: 0.1,  needsWork: 0.25 },   // score (unitless)
  tbt:  { good: 200,  needsWork: 600  },   // ms
  ttfb: { good: 800,  needsWork: 1800 },   // ms
};

function getCWVRating(metric, value) {
  if (value <= CWV[metric].good)       return '🟢 Good';
  if (value <= CWV[metric].needsWork)  return '🟡 Needs Work';
  return '🔴 Poor';
}

// ── INJECT SESSION ──────────────────────────────────────────────────────────
async function seedSession(page, role = 'customer') {
  await page.goto('/login.html');
  await page.evaluate((r) => {
    const user = r === 'admin'
      ? { id:'USR000', name:'Admin User', email:'admin@insureai.com', role:'admin', verified:true, locked:false }
      : { id:'USR001', name:'Rahul Sharma', email:'rahul@demo.com', role:'customer', verified:true, locked:false };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('seeded', 'true');
    localStorage.setItem('policies', JSON.stringify([
      { id:'POL001', userId:'USR001', type:'Motor', plan:'Comprehensive',
        startDate:'2026-01-01', endDate:'2026-12-31', premium:12500,
        sumInsured:500000, status:'Active', createdAt:'2026-01-01T00:00:00Z' }
    ]));
    localStorage.setItem('claims', JSON.stringify([]));
    localStorage.setItem('payments', JSON.stringify([]));
  }, role);
}

// ── MEASURE LCP via PerformanceObserver ─────────────────────────────────────
async function measureLCP(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = Math.round(lastEntry.startTime);
      });
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) { /* not supported */ }

      // Resolve after 2 seconds to capture LCP
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 2000);
    });
  });
}

// ── MEASURE CLS via PerformanceObserver ─────────────────────────────────────
async function measureCLS(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) { /* not supported */ }

      setTimeout(() => {
        observer.disconnect();
        resolve(Math.round(clsValue * 1000) / 1000);
      }, 2000);
    });
  });
}

// ── MEASURE TBT via Long Tasks ───────────────────────────────────────────────
async function measureTBT(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      let tbt = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Long task blocking time = task duration - 50ms threshold
          if (entry.duration > 50) {
            tbt += entry.duration - 50;
          }
        }
      });
      try {
        observer.observe({ type: 'longtask', buffered: true });
      } catch (e) { /* not supported */ }

      setTimeout(() => {
        observer.disconnect();
        resolve(Math.round(tbt));
      }, 2000);
    });
  });
}

// ── MEASURE ALL CWV FOR A PAGE ───────────────────────────────────────────────
async function measureCWV(page, url) {
  // Navigate and capture metrics in parallel with LCP/CLS observation
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const [lcp, cls, tbt] = await Promise.all([
    measureLCP(page),
    measureCLS(page),
    measureTBT(page),
  ]);

  const paint = await page.evaluate(() => {
    const entries = performance.getEntriesByType('paint');
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = entries.find(e => e.name === 'first-contentful-paint');
    return {
      fcp:  Math.round(fcp ? fcp.startTime : 0),
      ttfb: Math.round(nav ? nav.responseStart - nav.requestStart : 0),
    };
  });

  // Simulate INP via a button click response time
  let inp = 0;
  try {
    const clickStart = Date.now();
    await page.evaluate(() => document.body.click());
    inp = Date.now() - clickStart;
  } catch (e) { inp = 0; }

  return { lcp, cls, tbt, inp, ...paint };
}

// ── RESULTS ─────────────────────────────────────────────────────────────────
const cwvResults = [];

// ══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ══════════════════════════════════════════════════════════════════════════

test.describe('🌐 Core Web Vitals — InsureAI', () => {

  test.beforeEach(async ({ page }) => {
    await seedSession(page, 'customer');
  });

  test('CWV_001 | Landing Page — Core Web Vitals', async ({ page }) => {
    const metrics = await measureCWV(page, '/');
    cwvResults.push({ page: 'Landing Page', url: '/', ...metrics });

    console.log('\n🌐 Landing Page — Core Web Vitals');
    console.log(`  LCP  : ${metrics.lcp}ms  ${getCWVRating('lcp', metrics.lcp)}`);
    console.log(`  FCP  : ${metrics.fcp}ms  ${getCWVRating('fcp', metrics.fcp)}`);
    console.log(`  CLS  : ${metrics.cls}   ${getCWVRating('cls', metrics.cls)}`);
    console.log(`  TBT  : ${metrics.tbt}ms  ${getCWVRating('tbt', metrics.tbt)}`);
    console.log(`  TTFB : ${metrics.ttfb}ms  ${getCWVRating('ttfb', metrics.ttfb)}`);

    expect(metrics.lcp,  `LCP: ${metrics.lcp}ms`).toBeLessThanOrEqual(CWV.lcp.needsWork);
    expect(metrics.fcp,  `FCP: ${metrics.fcp}ms`).toBeLessThanOrEqual(CWV.fcp.needsWork);
    expect(metrics.cls,  `CLS: ${metrics.cls}`).toBeLessThanOrEqual(CWV.cls.needsWork);
  });

  test('CWV_002 | Login Page — Core Web Vitals', async ({ page }) => {
    const metrics = await measureCWV(page, '/login.html');
    cwvResults.push({ page: 'Login Page', url: '/login.html', ...metrics });

    console.log('\n🌐 Login Page — Core Web Vitals');
    console.log(`  LCP  : ${metrics.lcp}ms  ${getCWVRating('lcp', metrics.lcp)}`);
    console.log(`  FCP  : ${metrics.fcp}ms  ${getCWVRating('fcp', metrics.fcp)}`);
    console.log(`  CLS  : ${metrics.cls}   ${getCWVRating('cls', metrics.cls)}`);

    expect(metrics.lcp).toBeLessThanOrEqual(CWV.lcp.needsWork);
    expect(metrics.cls).toBeLessThanOrEqual(CWV.cls.needsWork);
  });

  test('CWV_003 | Dashboard — Core Web Vitals (REQ-017)', async ({ page }) => {
    const metrics = await measureCWV(page, '/dashboard.html');
    cwvResults.push({ page: 'Dashboard', url: '/dashboard.html', ...metrics });

    console.log('\n🌐 Dashboard — Core Web Vitals');
    console.log(`  LCP  : ${metrics.lcp}ms  ${getCWVRating('lcp', metrics.lcp)}`);
    console.log(`  FCP  : ${metrics.fcp}ms  ${getCWVRating('fcp', metrics.fcp)}`);
    console.log(`  CLS  : ${metrics.cls}   ${getCWVRating('cls', metrics.cls)}`);
    console.log(`  TBT  : ${metrics.tbt}ms  ${getCWVRating('tbt', metrics.tbt)}`);

    // REQ-017: Dashboard loads within 3 seconds
    expect(metrics.lcp, `Dashboard LCP exceeds budget. REQ-017 requires < 3000ms`).toBeLessThanOrEqual(3000);
    expect(metrics.cls).toBeLessThanOrEqual(CWV.cls.needsWork);
    expect(metrics.tbt).toBeLessThanOrEqual(CWV.tbt.needsWork);
  });

  test('CWV_004 | Motor Quote — Core Web Vitals', async ({ page }) => {
    const metrics = await measureCWV(page, '/motor-quote.html');
    cwvResults.push({ page: 'Motor Quote', url: '/motor-quote.html', ...metrics });

    expect(metrics.lcp).toBeLessThanOrEqual(CWV.lcp.needsWork);
    expect(metrics.cls).toBeLessThanOrEqual(CWV.cls.needsWork);
  });

  test('CWV_005 | Claims Page — Core Web Vitals', async ({ page }) => {
    const metrics = await measureCWV(page, '/claims.html');
    cwvResults.push({ page: 'Claims', url: '/claims.html', ...metrics });

    expect(metrics.lcp).toBeLessThanOrEqual(CWV.lcp.needsWork);
    expect(metrics.cls).toBeLessThanOrEqual(CWV.cls.needsWork);
  });

  test('CWV_006 | Checkout Page — Core Web Vitals', async ({ page }) => {
    // Seed a quote first
    await page.evaluate(() => {
      const q = [{ id:'QT001', userId:'USR001', type:'Motor', plan:'Comprehensive',
        sumInsured:500000, premium:12500, createdAt:'2026-01-01T00:00:00Z' }];
      localStorage.setItem('quotes', JSON.stringify(q));
    });
    const metrics = await measureCWV(page, '/checkout.html?quoteId=QT001');
    cwvResults.push({ page: 'Checkout', url: '/checkout.html', ...metrics });

    expect(metrics.lcp).toBeLessThanOrEqual(CWV.lcp.needsWork);
    expect(metrics.cls).toBeLessThanOrEqual(CWV.cls.needsWork);
  });

  // ── CWV INTERACTION: Form Response Time ──────────────────────────────────

  test('CWV_007 | Login Form — Interaction Response Time (INP)', async ({ page }) => {
    await page.goto('/login.html', { waitUntil: 'load' });

    // Measure time from typing to visual response
    const start = Date.now();
    await page.fill('#email', 'rahul@demo.com');
    await page.fill('#password', 'Test@1234');
    const fillTime = Date.now() - start;

    const clickStart = Date.now();
    await page.click('#submitBtn');
    const clickResponse = Date.now() - clickStart;

    console.log(`\n🖱️ Login Form INP:`);
    console.log(`  Fill time    : ${fillTime}ms`);
    console.log(`  Click response: ${clickResponse}ms`);

    cwvResults.push({ page: 'Login Interaction', url: '/login.html',
      lcp: 0, fcp: 0, cls: 0, tbt: 0, ttfb: 0, inp: clickResponse });

    // INP should be under 200ms for Good rating
    expect(clickResponse, `Login click response: ${clickResponse}ms (Good < 200ms)`).toBeLessThanOrEqual(500);
  });

  test('CWV_008 | Motor Quote Form — Submission Response Time', async ({ page }) => {
    await page.goto('/motor-quote.html', { waitUntil: 'load' });

    // Fill form
    await page.selectOption('#vehicleType', 'Four-Wheeler');
    await page.fill('#regNum', 'MH12AB1234');
    await page.selectOption('#make', 'Maruti Suzuki');
    await page.waitForTimeout(200);
    await page.selectOption('#model', 'Swift');
    await page.selectOption('#year', '2022');
    await page.selectOption('#fuelType', 'Petrol');
    await page.selectOption('#city', 'Mumbai');

    // Measure form submission response
    const submitStart = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForSelector('#step2:not(.d-none)', { timeout: 5000 });
    const responseTime = Date.now() - submitStart;

    console.log(`\n🖱️ Motor Quote Submission Response: ${responseTime}ms`);
    cwvResults.push({ page: 'Motor Quote Submit', url: '/motor-quote.html',
      lcp: 0, fcp: 0, cls: 0, tbt: 0, ttfb: 0, inp: responseTime });

    // Quote generation should respond within 5 seconds (REQ-019 area)
    expect(responseTime, `Quote generation: ${responseTime}ms`).toBeLessThanOrEqual(5000);
  });

  // ── SAVE CWV RESULTS ─────────────────────────────────────────────────────
  test.afterAll(async () => {
    const dir = path.join(process.cwd(), 'performance-results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'cwv-results.json'),
      JSON.stringify({ thresholds: CWV, results: cwvResults, timestamp: new Date().toISOString() }, null, 2)
    );

    console.log('\n════════════════════════════════════════════════════════');
    console.log('🌐 CORE WEB VITALS SUMMARY');
    console.log('════════════════════════════════════════════════════════');
    cwvResults.filter(r => r.lcp > 0).forEach(r => {
      console.log(`\n  📄 ${r.page}`);
      console.log(`     LCP : ${r.lcp}ms   ${getCWVRating('lcp', r.lcp)}`);
      console.log(`     FCP : ${r.fcp}ms   ${getCWVRating('fcp', r.fcp)}`);
      console.log(`     CLS : ${r.cls}    ${getCWVRating('cls', r.cls)}`);
      console.log(`     TBT : ${r.tbt}ms   ${getCWVRating('tbt', r.tbt)}`);
    });
  });

});
