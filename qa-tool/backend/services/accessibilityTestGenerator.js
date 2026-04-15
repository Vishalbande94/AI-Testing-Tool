// ── Accessibility Test Generator ─────────────────────────────────────────────
// Generates a ready-to-run WCAG 2.1 accessibility test suite using axe-core.
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

/**
 * @param {object} p
 * @param {string} p.targetUrl
 * @param {string} p.tool       - playwright-axe | axe-cli | lighthouse-ci | pa11y
 * @param {string} p.standard   - wcag2a | wcag2aa | wcag21aa | section508
 * @param {string} p.outputDir
 */
async function generate({ targetUrl, tool = 'playwright-axe', standard = 'wcag21aa', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const generators = {
    'playwright-axe': () => genPlaywrightAxe(targetUrl, standard, options),
    'axe-cli':        () => genAxeCli(targetUrl, standard, options),
    'lighthouse-ci':  () => genLighthouseCi(targetUrl, options),
    'pa11y':          () => genPa11y(targetUrl, standard, options),
  };
  const files = (generators[tool] || generators['playwright-axe'])();
  const projectName = `a11y-test-suite-${tool}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool, standard };
}

// ── Playwright + axe-core (most popular stack) ──────────────────────────────
function genPlaywrightAxe(targetUrl, standard, opts) {
  const pages = (opts.pages || '/').split(',').map(s => s.trim()).filter(Boolean);
  const tests = pages.map(p => `
  test('A11y scan: ${p}', async ({ page }) => {
    await page.goto('${p}');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(${JSON.stringify(tagFor(standard))})
      .analyze();

    // Log violations with details for developer debugging
    if (results.violations.length > 0) {
      console.log('\\nA11y violations for ${p}:');
      results.violations.forEach((v, i) => {
        console.log(\`  \${i + 1}. [\${v.impact}] \${v.id}: \${v.description}\`);
        v.nodes.forEach(n => console.log(\`     → \${n.target.join(', ')}\`));
      });
    }
    expect(results.violations, 'No accessibility violations').toEqual([]);
  });`).join('\n');

  return {
    'package.json': JSON.stringify({
      name: 'a11y-playwright-axe', version: '1.0.0',
      scripts: {
        test: 'npx playwright test',
        report: 'npx playwright show-report',
      },
      devDependencies: {
        '@playwright/test': '^1.55.0',
        '@axe-core/playwright': '^4.10.0',
      },
    }, null, 2),
    'playwright.config.js': `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: { baseURL: process.env.TARGET_URL || '${targetUrl}' },
});
`,
    'tests/a11y.spec.js': `import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — ${standard.toUpperCase()}', () => {${tests}
});
`,
    'README.md': `# Accessibility Test Suite — Playwright + axe-core

Target: **${targetUrl}**
Standard: **${standard.toUpperCase()}**
Pages tested: ${pages.map(p => `\`${p}\``).join(', ')}

## What it checks
Runs the [axe-core](https://www.deque.com/axe/) engine against each page and fails on any WCAG 2.1 AA violation. Typical checks include:

- Missing \`alt\` text on images
- Insufficient color contrast (< 4.5:1)
- Missing form labels
- Keyboard-inaccessible elements
- Invalid ARIA
- Skipped heading levels
- Missing page language

## Prerequisites
- Node.js 18+

## Run
\`\`\`bash
npm install
npx playwright install
TARGET_URL="${targetUrl}" npm test
npm run report
\`\`\`

Violations are logged with the exact CSS selector of the offending element for fast fixing.

## CI integration
\`\`\`yaml
# .github/workflows/a11y.yml
- run: npm ci && npx playwright install --with-deps
- run: npm test
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: a11y-report, path: playwright-report/ }
\`\`\`
`,
  };
}

function tagFor(standard) {
  const map = {
    wcag2a:    ['wcag2a'],
    wcag2aa:   ['wcag2a', 'wcag2aa'],
    wcag21aa:  ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    section508: ['section508'],
  };
  return map[standard] || map.wcag21aa;
}

// ── axe-cli (simple standalone scanner) ─────────────────────────────────────
function genAxeCli(targetUrl, standard, opts) {
  return {
    'run.sh': `#!/bin/bash
npm install -g @axe-core/cli
axe "${targetUrl}" --tags ${tagFor(standard).join(',')} --save report.json --exit
`,
    'README.md': `# axe-cli scan

## Prerequisites
- Node.js 18+

## Run
\`\`\`bash
npm install -g @axe-core/cli
axe "${targetUrl}" --tags ${tagFor(standard).join(',')} --save report.json --exit
\`\`\`

Exit code 1 if violations found. Report saved to \`report.json\`.
`,
  };
}

// ── Lighthouse CI (includes a11y + performance + SEO + best-practices) ─────
function genLighthouseCi(targetUrl, opts) {
  return {
    'lighthouserc.json': JSON.stringify({
      ci: {
        collect: { url: [targetUrl], numberOfRuns: 3 },
        assert: {
          preset: 'lighthouse:recommended',
          assertions: {
            'categories:accessibility': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['warn', { minScore: 0.85 }],
          },
        },
        upload: { target: 'temporary-public-storage' },
      },
    }, null, 2),
    'package.json': JSON.stringify({
      name: 'a11y-lighthouse-ci', version: '1.0.0',
      scripts: { test: 'lhci autorun' },
      devDependencies: { '@lhci/cli': '^0.13.0' },
    }, null, 2),
    'README.md': `# Lighthouse CI (A11y + Perf + SEO)

## Run
\`\`\`bash
npm install
npm test
\`\`\`

Includes a11y assertion ≥ 90/100 (customize in \`lighthouserc.json\`).
`,
  };
}

// ── Pa11y (command-line accessibility tester) ──────────────────────────────
function genPa11y(targetUrl, standard, opts) {
  return {
    'package.json': JSON.stringify({
      name: 'a11y-pa11y', version: '1.0.0',
      scripts: { test: `pa11y --standard ${standard.toUpperCase()} --runner axe "${targetUrl}"` },
      devDependencies: { pa11y: '^8.0.0' },
    }, null, 2),
    'README.md': `# Pa11y A11y Tester

## Run
\`\`\`bash
npm install
npm test
\`\`\`
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
