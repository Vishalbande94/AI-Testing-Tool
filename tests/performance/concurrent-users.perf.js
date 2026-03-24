// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * PERFORMANCE TEST — CONCURRENT USERS & STRESS TEST
 * Simulates multiple users accessing the application simultaneously.
 * Uses Playwright's parallel context feature — no JMeter, no extra tools.
 *
 * Tests:
 *  1. Baseline single-user response time
 *  2. 5 concurrent users — page load time comparison
 *  10. 10 concurrent users — stress test
 *  3. Repeated navigation test (simulates user browsing behavior)
 *  4. Memory leak detection (repeated loads)
 *  5. Response time degradation analysis
 */

// ── THRESHOLDS ───────────────────────────────────────────────────────────────
const THRESHOLDS = {
  singleUserLoad:      3000,   // 3s for single user
  concurrentUserLoad:  5000,   // 5s acceptable under load
  maxResponseTime:     8000,   // Hard fail if above 8s
  memoryLeakDelta:     50,     // Max MB increase over 10 iterations
};

// ── HELPER: Session seed ──────────────────────────────────────────────────
async function seedSession(page) {
  await page.goto('/login.html');
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id:'USR001', name:'Rahul Sharma', email:'rahul@demo.com',
      role:'customer', verified:true, locked:false
    }));
    localStorage.setItem('seeded', 'true');
    localStorage.setItem('policies', JSON.stringify([
      { id:'POL001', userId:'USR001', type:'Motor', plan:'Comprehensive',
        startDate:'2026-01-01', endDate:'2026-12-31', premium:12500,
        sumInsured:500000, status:'Active', createdAt:'2026-01-01T00:00:00Z' }
    ]));
    localStorage.setItem('claims', JSON.stringify([]));
    localStorage.setItem('payments', JSON.stringify([]));
  });
}

// ── HELPER: Measure single page load time ─────────────────────────────────
async function measureLoad(page, url) {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  return Date.now() - start;
}

// ── RESULTS STORE ─────────────────────────────────────────────────────────
const loadResults = [];

// ══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ══════════════════════════════════════════════════════════════════════════

test.describe('👥 Concurrent Users & Stress Test — InsureAI', () => {

  // ── TEST 1: BASELINE ──────────────────────────────────────────────────
  test('LOAD_001 | Baseline — Single User Page Load Times', async ({ page, browser }) => {
    await seedSession(page);

    const pages = [
      { name: 'Landing',   url: '/' },
      { name: 'Login',     url: '/login.html' },
      { name: 'Dashboard', url: '/dashboard.html' },
      { name: 'Policies',  url: '/policies.html' },
      { name: 'Claims',    url: '/claims.html' },
    ];

    console.log('\n👤 BASELINE — Single User');
    console.log('────────────────────────────────────');

    for (const p of pages) {
      await seedSession(page);
      const loadTime = await measureLoad(page, p.url);
      console.log(`  ${p.name.padEnd(12)}: ${loadTime}ms  ${loadTime <= 3000 ? '✅' : '❌'}`);
      loadResults.push({ test: 'Baseline', users: 1, page: p.name, url: p.url, loadTime, pass: loadTime <= THRESHOLDS.singleUserLoad });
      expect(loadTime, `${p.name} baseline: ${loadTime}ms`).toBeLessThanOrEqual(THRESHOLDS.singleUserLoad);
    }
  });

  // ── TEST 2: 5 CONCURRENT USERS ───────────────────────────────────────
  test('LOAD_002 | 5 Concurrent Users — Dashboard Load Test', async ({ browser }) => {
    const USER_COUNT = 5;
    const TARGET_URL = '/dashboard.html';

    console.log(`\n👥 5 CONCURRENT USERS — ${TARGET_URL}`);
    console.log('────────────────────────────────────');

    // Create 5 browser contexts (simulating independent users)
    const contexts = await Promise.all(
      Array.from({ length: USER_COUNT }, () => browser.newContext())
    );
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    // Seed sessions for all users
    for (const p of pages) {
      await seedSession(p);
    }

    // Fire all navigation requests simultaneously
    const startAll = Date.now();
    const loadTimes = await Promise.all(
      pages.map(p => measureLoad(p, TARGET_URL))
    );
    const totalTime = Date.now() - startAll;

    const avg = Math.round(loadTimes.reduce((s, t) => s + t, 0) / loadTimes.length);
    const max = Math.max(...loadTimes);
    const min = Math.min(...loadTimes);

    loadTimes.forEach((t, i) => {
      console.log(`  User ${i + 1}: ${t}ms  ${t <= THRESHOLDS.concurrentUserLoad ? '✅' : '⚠️'}`);
      loadResults.push({ test: '5 Concurrent Users', users: 5, page: 'Dashboard',
        url: TARGET_URL, loadTime: t, pass: t <= THRESHOLDS.concurrentUserLoad });
    });

    console.log(`\n  📊 Stats: Min=${min}ms | Avg=${avg}ms | Max=${max}ms | Total=${totalTime}ms`);

    // Cleanup
    await Promise.all(pages.map(p => p.close()));
    await Promise.all(contexts.map(ctx => ctx.close()));

    expect(avg, `Avg load time under 5 concurrent users: ${avg}ms`).toBeLessThanOrEqual(THRESHOLDS.concurrentUserLoad);
    expect(max, `Max load time must not exceed hard limit: ${max}ms`).toBeLessThanOrEqual(THRESHOLDS.maxResponseTime);
  });

  // ── TEST 3: 10 CONCURRENT USERS (STRESS) ─────────────────────────────
  test('LOAD_003 | 10 Concurrent Users — Stress Test (Landing Page)', async ({ browser }) => {
    const USER_COUNT = 10;
    const TARGET_URL = '/';

    console.log(`\n🔥 STRESS TEST — ${USER_COUNT} Concurrent Users — ${TARGET_URL}`);
    console.log('────────────────────────────────────');

    const contexts = await Promise.all(
      Array.from({ length: USER_COUNT }, () => browser.newContext())
    );
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    const startAll = Date.now();
    const loadTimes = await Promise.all(
      pages.map(p => measureLoad(p, TARGET_URL))
    );
    const totalTime = Date.now() - startAll;

    const avg = Math.round(loadTimes.reduce((s, t) => s + t, 0) / loadTimes.length);
    const max = Math.max(...loadTimes);
    const min = Math.min(...loadTimes);
    const p95 = loadTimes.sort((a, b) => a - b)[Math.floor(USER_COUNT * 0.95)];

    loadTimes.forEach((t, i) => {
      console.log(`  User ${String(i + 1).padStart(2)}: ${t}ms  ${t <= 5000 ? '✅' : t <= 8000 ? '⚠️' : '❌'}`);
      loadResults.push({ test: '10 Concurrent Users (Stress)', users: 10, page: 'Landing',
        url: TARGET_URL, loadTime: t, pass: t <= THRESHOLDS.maxResponseTime });
    });

    console.log(`\n  📊 Stats:`);
    console.log(`     Min  : ${min}ms`);
    console.log(`     Avg  : ${avg}ms`);
    console.log(`     Max  : ${max}ms`);
    console.log(`     P95  : ${p95}ms  (95th percentile)`);
    console.log(`     Total wall clock: ${totalTime}ms`);

    await Promise.all(pages.map(p => p.close()));
    await Promise.all(contexts.map(ctx => ctx.close()));

    // Under stress, max should not exceed hard limit
    expect(max, `Stress test max load: ${max}ms`).toBeLessThanOrEqual(THRESHOLDS.maxResponseTime);
  });

  // ── TEST 4: USER JOURNEY — SEQUENTIAL NAVIGATION ─────────────────────
  test('LOAD_004 | User Journey — Sequential Navigation Simulation', async ({ page }) => {
    await seedSession(page);

    const journey = [
      { step: 1, name: 'Open Landing',      url: '/' },
      { step: 2, name: 'Go to Login',       url: '/login.html' },
      { step: 3, name: 'Go to Dashboard',   url: '/dashboard.html' },
      { step: 4, name: 'Go to Get Quote',   url: '/get-quote.html' },
      { step: 5, name: 'Open Motor Quote',  url: '/motor-quote.html' },
      { step: 6, name: 'Go to Policies',    url: '/policies.html' },
      { step: 7, name: 'Go to Claims',      url: '/claims.html' },
      { step: 8, name: 'Go to Payments',    url: '/payments.html' },
      { step: 9, name: 'Go to Documents',   url: '/documents.html' },
    ];

    const journeyStart = Date.now();
    console.log('\n🗺️  USER JOURNEY — Sequential Navigation');
    console.log('────────────────────────────────────');

    let totalJourneyTime = 0;

    for (const step of journey) {
      if (step.step > 2) await seedSession(page); // re-seed for auth pages
      const loadTime = await measureLoad(page, step.url);
      totalJourneyTime += loadTime;
      console.log(`  Step ${step.step}: ${step.name.padEnd(22)}: ${loadTime}ms`);
      loadResults.push({ test: 'User Journey', users: 1, page: step.name,
        url: step.url, loadTime, pass: loadTime <= THRESHOLDS.singleUserLoad });
    }

    const totalElapsed = Date.now() - journeyStart;
    console.log(`\n  🏁 Total journey time   : ${totalJourneyTime}ms`);
    console.log(`  ⏱️  Wall clock (with setup): ${totalElapsed}ms`);
    console.log(`  📊 Average per page      : ${Math.round(totalJourneyTime / journey.length)}ms`);

    const avgJourney = totalJourneyTime / journey.length;
    expect(avgJourney, `Avg journey step: ${Math.round(avgJourney)}ms`).toBeLessThanOrEqual(THRESHOLDS.singleUserLoad);
  });

  // ── TEST 5: MEMORY LEAK DETECTION ────────────────────────────────────
  test('LOAD_005 | Memory Leak Detection — Repeated Dashboard Loads', async ({ page }) => {
    const ITERATIONS = 8;
    const heapSizes = [];

    console.log(`\n🧠 MEMORY LEAK TEST — ${ITERATIONS} Iterations on Dashboard`);
    console.log('────────────────────────────────────');

    for (let i = 0; i < ITERATIONS; i++) {
      await seedSession(page);
      await page.goto('/dashboard.html', { waitUntil: 'load' });

      const metrics = await page.metrics();
      const heapMB = Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 10) / 10;
      heapSizes.push(heapMB);

      console.log(`  Iteration ${i + 1}: JS Heap = ${heapMB} MB`);
    }

    const firstHeap  = heapSizes[0];
    const lastHeap   = heapSizes[heapSizes.length - 1];
    const heapDelta  = lastHeap - firstHeap;
    const maxHeap    = Math.max(...heapSizes);

    console.log(`\n  📊 Heap Analysis:`);
    console.log(`     First iteration : ${firstHeap} MB`);
    console.log(`     Last iteration  : ${lastHeap} MB`);
    console.log(`     Delta (growth)  : ${heapDelta.toFixed(1)} MB`);
    console.log(`     Peak heap       : ${maxHeap} MB`);
    console.log(`     Status          : ${heapDelta <= THRESHOLDS.memoryLeakDelta ? '✅ No leak detected' : '⚠️  Possible memory leak'}`);

    loadResults.push({ test: 'Memory Leak', users: 1, page: 'Dashboard (x8)',
      url: '/dashboard.html', loadTime: heapDelta, pass: heapDelta <= THRESHOLDS.memoryLeakDelta });

    expect(heapDelta, `Heap growth over ${ITERATIONS} iterations: ${heapDelta.toFixed(1)}MB`).toBeLessThanOrEqual(THRESHOLDS.memoryLeakDelta);
  });

  // ── TEST 6: RAPID NAVIGATION STRESS ──────────────────────────────────
  test('LOAD_006 | Rapid Navigation — Back/Forward Stress', async ({ page }) => {
    await seedSession(page);

    const urls = ['/dashboard.html', '/policies.html', '/claims.html', '/payments.html'];
    const navTimes = [];

    console.log('\n⚡ RAPID NAVIGATION STRESS TEST');
    console.log('────────────────────────────────────');

    for (let round = 0; round < 3; round++) {
      for (const url of urls) {
        await seedSession(page);
        const t = await measureLoad(page, url);
        navTimes.push(t);
      }
    }

    const avg = Math.round(navTimes.reduce((s, t) => s + t, 0) / navTimes.length);
    const max = Math.max(...navTimes);
    const min = Math.min(...navTimes);

    console.log(`  Navigations   : ${navTimes.length}`);
    console.log(`  Min load time : ${min}ms`);
    console.log(`  Avg load time : ${avg}ms`);
    console.log(`  Max load time : ${max}ms`);
    console.log(`  Status        : ${max <= THRESHOLDS.singleUserLoad ? '✅ All within budget' : '⚠️  Some exceeded budget'}`);

    loadResults.push({ test: 'Rapid Navigation', users: 1, page: 'Multiple',
      url: 'various', loadTime: avg, pass: avg <= THRESHOLDS.singleUserLoad });

    expect(avg, `Rapid nav avg: ${avg}ms`).toBeLessThanOrEqual(THRESHOLDS.singleUserLoad);
  });

  // ── SAVE RESULTS ──────────────────────────────────────────────────────
  test.afterAll(async () => {
    const dir = path.join(process.cwd(), 'performance-results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'load-results.json'),
      JSON.stringify({ thresholds: THRESHOLDS, results: loadResults, timestamp: new Date().toISOString() }, null, 2)
    );

    console.log('\n════════════════════════════════════════════════════════');
    console.log('👥 CONCURRENT USERS TEST SUMMARY');
    console.log('════════════════════════════════════════════════════════');
    const groups = [...new Set(loadResults.map(r => r.test))];
    groups.forEach(g => {
      const group = loadResults.filter(r => r.test === g);
      const avg = Math.round(group.reduce((s, r) => s + r.loadTime, 0) / group.length);
      const passed = group.filter(r => r.pass).length;
      console.log(`  ${g.padEnd(35)}: Avg=${avg}ms  ${passed}/${group.length} passed`);
    });
  });

});
