// ── Visual Regression Test Generator ────────────────────────────────────────
// Generates a screenshot-diff suite using Playwright, Percy, or BackstopJS.
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

async function generate({ targetUrl, tool = 'playwright', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const generators = {
    playwright: () => genPlaywrightVisual(targetUrl, options),
    backstop:   () => genBackstop(targetUrl, options),
    percy:      () => genPercy(targetUrl, options),
  };
  const files = (generators[tool] || generators.playwright)();
  const projectName = `visual-regression-${tool}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool };
}

// ── Playwright visual comparisons (toHaveScreenshot) ────────────────────────
function genPlaywrightVisual(targetUrl, opts) {
  const pages = (opts.pages || '/,/about,/contact').split(',').map(s => s.trim()).filter(Boolean);
  const viewports = (opts.viewports || 'desktop,tablet,mobile');
  const threshold = opts.threshold ?? 0.2;

  const tests = pages.map(p => `
  test('Visual: ${p}', async ({ page }) => {
    await page.goto('${p}');
    await page.waitForLoadState('networkidle');
    // Mask dynamic elements that legitimately change between runs
    const dynamicSelectors = ['time', '[data-testid="now"]', '[data-dynamic]'];
    await expect(page).toHaveScreenshot('${p.replace(/[^a-z0-9]/gi, '_') || 'home'}.png', {
      fullPage: true,
      mask: dynamicSelectors.map(s => page.locator(s)),
      threshold: ${threshold},
      maxDiffPixelRatio: 0.01,
    });
  });`).join('\n');

  const projectLines = viewports.split(',').map(v => v.trim()).filter(Boolean).map(v => {
    if (v === 'desktop')  return `    { name: 'desktop',  use: { ...devices['Desktop Chrome'] } }`;
    if (v === 'tablet')   return `    { name: 'tablet',   use: { ...devices['iPad (gen 7)'] } }`;
    if (v === 'mobile')   return `    { name: 'mobile',   use: { ...devices['iPhone 13'] } }`;
    return `    { name: '${v}', use: { ...devices['Desktop Chrome'] } }`;
  }).join(',\n');

  return {
    'package.json': JSON.stringify({
      name: 'visual-regression-playwright', version: '1.0.0',
      scripts: {
        test: 'npx playwright test',
        baseline: 'npx playwright test --update-snapshots',
        report: 'npx playwright show-report',
      },
      devDependencies: { '@playwright/test': '^1.55.0' },
    }, null, 2),
    'playwright.config.js': `import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: { baseURL: process.env.TARGET_URL || '${targetUrl}' },
  expect: { toHaveScreenshot: { maxDiffPixels: 100 } },
  projects: [
${projectLines}
  ],
});
`,
    'tests/visual.spec.js': `import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {${tests}
});
`,
    'README.md': `# Visual Regression Suite — Playwright

Target: **${targetUrl}**
Pages: ${pages.map(p => `\`${p}\``).join(', ')}
Viewports: ${viewports}

## How it works
First run captures baseline screenshots. Subsequent runs diff against baselines; any visual change above the threshold (${threshold}) fails the test.

## Prerequisites
- Node.js 18+

## Run
\`\`\`bash
npm install
npx playwright install

# First time — capture baselines
npm run baseline

# Compare on every run
npm test
npm run report
\`\`\`

## Updating baselines intentionally (after approved design changes)
\`\`\`bash
npm run baseline  # regenerates all baselines
\`\`\`

## CI
Commit the \`tests/visual.spec.js-snapshots/\` directory to git as your source-of-truth baseline.
`,
  };
}

// ── BackstopJS (popular Node-based visual regression) ──────────────────────
function genBackstop(targetUrl, opts) {
  const pages = (opts.pages || '/,/about').split(',').map(s => s.trim()).filter(Boolean);
  const scenarios = pages.map((p, i) => ({
    label: `Page ${i + 1}: ${p}`,
    url:   `${targetUrl}${p}`,
    misMatchThreshold: 0.1,
    selectors: ['document'],
  }));
  return {
    'backstop.json': JSON.stringify({
      id: 'visual-regression',
      viewports: [
        { label: 'desktop', width: 1920, height: 1080 },
        { label: 'tablet',  width: 768,  height: 1024 },
        { label: 'mobile',  width: 375,  height: 667 },
      ],
      scenarios,
      paths: {
        bitmaps_reference:  'backstop_data/bitmaps_reference',
        bitmaps_test:       'backstop_data/bitmaps_test',
        engine_scripts:     'backstop_data/engine_scripts',
        html_report:        'backstop_data/html_report',
        ci_report:          'backstop_data/ci_report',
      },
      report:  ['browser'],
      engine:  'puppeteer',
      asyncCaptureLimit: 5,
    }, null, 2),
    'package.json': JSON.stringify({
      name: 'visual-regression-backstop', version: '1.0.0',
      scripts: {
        reference: 'backstop reference',
        test:      'backstop test',
        approve:   'backstop approve',
      },
      devDependencies: { backstopjs: '^6.3.0' },
    }, null, 2),
    'README.md': `# BackstopJS Visual Regression

## Run
\`\`\`bash
npm install
npx backstop reference  # capture baselines
npx backstop test       # compare
npx backstop approve    # promote changes
\`\`\`
`,
  };
}

// ── Percy (BrowserStack's hosted visual testing) ───────────────────────────
function genPercy(targetUrl, opts) {
  return {
    'package.json': JSON.stringify({
      name: 'visual-regression-percy', version: '1.0.0',
      scripts: { test: 'npx percy exec -- npx playwright test' },
      devDependencies: {
        '@playwright/test': '^1.55.0',
        '@percy/cli': '^1.29.0',
        '@percy/playwright': '^1.0.6',
      },
    }, null, 2),
    'tests/percy.spec.js': `import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('Percy snapshot — homepage', async ({ page }) => {
  await page.goto('${targetUrl}');
  await percySnapshot(page, 'Homepage');
});
`,
    'README.md': `# Percy Visual Testing

## Run
\`\`\`bash
npm install
export PERCY_TOKEN="your-percy-token"
npm test
\`\`\`

Snapshots are uploaded to Percy.io for review.
`,
  };
}

function createZip(srcDir, outPath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outPath);
    const zip = archiver('zip', { zlib: { level: 9 } });
    out.on('close', resolve);
    zip.on('error', reject);
    zip.pipe(out);
    zip.directory(srcDir, false);
    zip.finalize();
  });
}

module.exports = { generate };
