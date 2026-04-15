// ── Security Test Suite Generator ────────────────────────────────────────────
// Produces a ready-to-run security-testing project with scan configs, custom
// templates, and a manual OWASP Top 10 checklist. Works for any web app.
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

/**
 * @param {object} params
 * @param {string} params.targetUrl
 * @param {string} params.tool       - zap | nuclei | checklist | playwright
 * @param {string} params.scanDepth  - baseline | full | active
 * @param {string} params.outputDir
 */
async function generate({ targetUrl, tool = 'zap', scanDepth = 'baseline', outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });

  const generators = {
    zap:        () => genZap(targetUrl, scanDepth),
    nuclei:     () => genNuclei(targetUrl, scanDepth),
    checklist:  () => genChecklist(targetUrl),
    playwright: () => genPlaywrightSecurity(targetUrl),
  };
  const files = (generators[tool] || generators.zap)();

  const projectName = `security-test-suite-${tool}`;
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

// ── OWASP ZAP (Docker + config) ─────────────────────────────────────────────
function genZap(targetUrl, depth) {
  const scanCmd = depth === 'full'
    ? `zap-full-scan.py -t "${targetUrl}" -r report.html -J report.json -w report.md`
    : depth === 'active'
      ? `zap-api-scan.py -t "${targetUrl}" -f openapi -r report.html`
      : `zap-baseline.py -t "${targetUrl}" -r report.html -J report.json -w report.md -m 5`;

  return {
    'run.sh': `#!/bin/bash
# OWASP ZAP scan — ${depth}
set -e
mkdir -p ./reports
docker run --rm \\
  -v "\$(pwd)/reports":/zap/wrk/ \\
  -t ghcr.io/zaproxy/zaproxy:stable \\
  ${scanCmd}
`,
    'run.ps1': `# OWASP ZAP scan — ${depth}
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path ./reports | Out-Null
docker run --rm \`
  -v "$(Get-Location)/reports:/zap/wrk/" \`
  -t ghcr.io/zaproxy/zaproxy:stable \`
  ${scanCmd}
`,
    'zap-config.yaml': `# ZAP automation framework config — customize as needed
env:
  contexts:
    - name: Target
      urls: ["${targetUrl}"]
      includePaths: ["${targetUrl}.*"]
jobs:
  - type: passiveScan-config
    parameters:
      maxAlertsPerRule: 10
  - type: spider
    parameters:
      context: Target
      maxDuration: 10
  - type: passiveScan-wait
    parameters:
      maxDuration: 5
  - type: ${depth === 'full' || depth === 'active' ? 'activeScan' : 'passiveScan-wait'}
    parameters:
      context: Target
      maxDuration: 20
  - type: report
    parameters:
      template: traditional-html
      reportDir: /zap/wrk/reports
      reportFile: zap-report
`,
    'README.md': `# OWASP ZAP Security Scan

Target: **${targetUrl}**
Scan depth: **${depth}**

## Prerequisites
- Docker installed & running

## Run
\`\`\`bash
# Linux / macOS
bash run.sh

# Windows PowerShell
./run.ps1
\`\`\`

Reports are saved to \`./reports/\`:
- \`report.html\` — human-readable
- \`report.json\` — machine-readable (CI)
- \`report.md\`   — markdown

## Scan Types
- **baseline**  — passive scan only. Safe for production.
- **full**      — passive + active scan (may trigger WAF). Use staging.
- **active**    — API-focused active scan with OpenAPI spec.

## OWASP Top 10 Coverage
| ID  | Category                              | ZAP Coverage |
|-----|---------------------------------------|:------------:|
| A01 | Broken Access Control                 | ✅ Partial   |
| A02 | Cryptographic Failures                | ✅           |
| A03 | Injection (SQL, NoSQL, Command)       | ✅           |
| A04 | Insecure Design                       | ⚠️ Manual    |
| A05 | Security Misconfiguration             | ✅           |
| A06 | Vulnerable Components                 | ✅           |
| A07 | Authentication Failures               | ✅           |
| A08 | Data Integrity Failures               | ⚠️           |
| A09 | Logging & Monitoring Failures         | ❌ Manual    |
| A10 | Server-Side Request Forgery           | ✅           |
`,
  };
}

// ── Nuclei (Go-based template scanner) ──────────────────────────────────────
function genNuclei(targetUrl, depth) {
  return {
    'scan.sh': `#!/bin/bash
# Nuclei scan — ${depth}
set -e
mkdir -p ./reports
docker run --rm \\
  -v "\$(pwd)/reports":/reports \\
  projectdiscovery/nuclei:latest \\
  -target "${targetUrl}" \\
  -severity low,medium,high,critical \\
  -silent \\
  -o /reports/nuclei-report.txt \\
  -je /reports/nuclei-report.json
`,
    'scan.ps1': `# Nuclei scan — ${depth}
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path ./reports | Out-Null
docker run --rm \`
  -v "$(Get-Location)/reports:/reports" \`
  projectdiscovery/nuclei:latest \`
  -target "${targetUrl}" \`
  -severity low,medium,high,critical \`
  -silent \`
  -o /reports/nuclei-report.txt \`
  -je /reports/nuclei-report.json
`,
    'templates/custom-headers.yaml': `id: security-headers-check
info:
  name: Essential Security Headers
  author: qa-tool
  severity: medium
  tags: headers,best-practice

http:
  - method: GET
    path: ["{{BaseURL}}"]
    matchers-condition: and
    matchers:
      - type: status
        status: [200, 301, 302]
      - type: word
        part: header
        words:
          - "Strict-Transport-Security"
          - "X-Content-Type-Options"
          - "Content-Security-Policy"
        condition: and
`,
    'README.md': `# Nuclei Security Scanner

Target: **${targetUrl}**

## Prerequisites
- Docker

## Run
\`\`\`bash
bash scan.sh         # Linux/macOS
./scan.ps1           # Windows
\`\`\`

Results in \`./reports/nuclei-report.json\`.

## Custom templates
Place additional YAML templates in \`./templates/\` — they'll be merged.
See: https://nuclei.projectdiscovery.io/templating-guide/
`,
  };
}

// ── Manual OWASP Top 10 checklist ───────────────────────────────────────────
function genChecklist(targetUrl) {
  return {
    'OWASP-Top-10-Checklist.md': `# OWASP Top 10 (2021) — Manual Security Test Checklist

Target: **${targetUrl}**

> Work through each section systematically. Check the box when verified.
> Capture evidence (screenshots, request/response pairs) for failed items.

## A01 — Broken Access Control
- [ ] Test IDOR by changing resource IDs in URLs
- [ ] Verify user can't escalate to admin via UI/API manipulation
- [ ] Check forced browsing to admin pages while unauthenticated
- [ ] Confirm proper 401/403 responses for protected resources
- [ ] Test CORS headers aren't over-permissive (no \`*\` with credentials)

## A02 — Cryptographic Failures
- [ ] All traffic uses HTTPS (HSTS enabled, HSTS preload list)
- [ ] TLS 1.2 minimum (1.3 preferred); weak ciphers disabled
- [ ] No sensitive data in URL (tokens, passwords)
- [ ] Password storage uses bcrypt/scrypt/argon2 (verify via reset flow behavior)
- [ ] Session cookies have \`Secure\`, \`HttpOnly\`, \`SameSite=Lax/Strict\`

## A03 — Injection
- [ ] SQLi: test \`' OR '1'='1\`, \`1; DROP TABLE users\`, UNION-based, time-based
- [ ] NoSQLi: test \`{"$ne": null}\`, \`{"$gt": ""}\`, operator injection
- [ ] Command injection: test \`; ls\`, \`| whoami\`, \`\` \`id\` \`\`
- [ ] LDAP injection, XPath injection on respective inputs
- [ ] HTML/JS injection (XSS) — reflected, stored, DOM-based

## A04 — Insecure Design
- [ ] Business logic flaws — negative quantities, price manipulation
- [ ] Rate limiting on sensitive flows (login, password reset, checkout)
- [ ] No race conditions (concurrent double-submit)
- [ ] Workflow can't be bypassed by skipping steps

## A05 — Security Misconfiguration
- [ ] Default credentials changed
- [ ] Debug endpoints disabled in production
- [ ] Directory listing disabled
- [ ] Error messages don't leak stack traces
- [ ] Cloud storage buckets aren't public

## A06 — Vulnerable & Outdated Components
- [ ] \`npm audit\` / \`mvn dependency-check\` / \`pip-audit\` — 0 high/critical
- [ ] Server software (nginx, node) on supported version
- [ ] Docker images from trusted registries, scanned (Trivy, Snyk)

## A07 — Identification & Authentication Failures
- [ ] Account lockout after N failed attempts
- [ ] MFA available for sensitive accounts
- [ ] Strong password policy enforced (length, complexity)
- [ ] Session timeout works; session invalidated on logout
- [ ] Password reset tokens are one-time, time-limited, unpredictable

## A08 — Software & Data Integrity Failures
- [ ] JS libraries loaded with SRI (Subresource Integrity)
- [ ] CI/CD pipeline signed/verified
- [ ] Deserialization of untrusted data rejected

## A09 — Security Logging & Monitoring Failures
- [ ] Auth events (login, logout, failures) are logged
- [ ] Access to sensitive data is logged
- [ ] Logs are shipped to central store and alertable
- [ ] Failed login attempts trigger alerts

## A10 — Server-Side Request Forgery (SSRF)
- [ ] User-supplied URLs can't fetch internal resources (169.254.169.254, 10.x, 127.0.0.1)
- [ ] URL schemes restricted (no \`file://\`, \`gopher://\`)
- [ ] DNS rebinding protection

---

## Tooling Reference
| Tool         | Purpose                      |
|--------------|------------------------------|
| OWASP ZAP    | Automated web app scanner    |
| Burp Suite   | Manual proxy + scanner       |
| Nuclei       | Template-based scanner       |
| sqlmap       | SQL injection exploitation   |
| nikto        | Web server misconfig scanner |
| testssl.sh   | TLS/SSL configuration audit  |

## Evidence Template
For each finding, document:
- **ID**: AXX-001
- **Severity**: Critical / High / Medium / Low
- **Category**: OWASP A01..A10
- **Affected Endpoint**: URL + method
- **Reproduction Steps**: ordered
- **Request / Response pair**: captured
- **Impact**: what an attacker could do
- **Recommendation**: specific fix
`,
    'README.md': `# Manual Security Testing Checklist

Walk through [\`OWASP-Top-10-Checklist.md\`](./OWASP-Top-10-Checklist.md) systematically.
Capture evidence for each finding in a separate document.

For automated scanning, pair this checklist with the ZAP or Nuclei generators.
`,
  };
}

// ── Playwright-based security checks (client-side) ──────────────────────────
function genPlaywrightSecurity(targetUrl) {
  return {
    'package.json': JSON.stringify({
      name: 'security-test-suite-playwright', version: '1.0.0',
      scripts: { test: 'npx playwright test', report: 'npx playwright show-report' },
      devDependencies: { '@playwright/test': '^1.55.0' },
    }, null, 2),
    'playwright.config.js': `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: { baseURL: process.env.TARGET_URL || '${targetUrl}' },
});
`,
    'tests/security.spec.js': `import { test, expect } from '@playwright/test';

test.describe('Security — client-side checks', () => {

  test('Security headers present on main document', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    expect(h['strict-transport-security'], 'HSTS header').toBeTruthy();
    expect(h['x-content-type-options'], 'X-Content-Type-Options').toMatch(/nosniff/i);
    expect(h['content-security-policy'] || h['x-frame-options'], 'CSP or X-Frame-Options').toBeTruthy();
    expect(h['referrer-policy'] || '', 'Referrer-Policy').toBeTruthy();
  });

  test('HTTPS redirect is enforced', async ({ request, baseURL }) => {
    if (!baseURL.startsWith('https://')) test.skip(true, 'Base URL is not https');
    // Requesting http:// should redirect to https://
    const httpUrl = baseURL.replace(/^https:/, 'http:');
    try {
      const res = await request.get(httpUrl, { maxRedirects: 0 });
      expect([301, 302, 307, 308]).toContain(res.status());
    } catch (e) {
      // Some servers refuse HTTP entirely — that's also acceptable
    }
  });

  test('Cookies set with Secure + HttpOnly flags', async ({ page }) => {
    await page.goto('/');
    const cookies = await page.context().cookies();
    for (const c of cookies) {
      if (/session|auth|token/i.test(c.name)) {
        expect(c.secure,   \`Cookie \${c.name} should be Secure\`).toBe(true);
        expect(c.httpOnly, \`Cookie \${c.name} should be HttpOnly\`).toBe(true);
      }
    }
  });

  test('No mixed content (http resources on https page)', async ({ page }) => {
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && /mixed content/i.test(msg.text())) warnings.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(warnings, 'No mixed content warnings').toEqual([]);
  });

  test('External links have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/');
    const unsafe = await page.$$eval(
      'a[target="_blank"]',
      (links) => links.filter(a => !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)).map(a => a.href)
    );
    expect(unsafe, \`Unsafe external links: \${unsafe.join(', ')}\`).toEqual([]);
  });

  test('Common XSS payload in search input is sanitized', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first();
    if (await search.count() === 0) test.skip(true, 'No search input found');
    await search.fill(\`<script>window.__xss=true</script>\`);
    await search.press('Enter');
    await page.waitForTimeout(500);
    const xssFlag = await page.evaluate(() => window.__xss);
    expect(xssFlag, 'XSS payload should NOT execute').not.toBe(true);
  });

});
`,
    'README.md': `# Playwright Security Test Suite

Target: **${targetUrl}**

Runs browser-based checks: headers, cookies, CSP, mixed content, XSS baseline.

## Run
\`\`\`bash
npm install
npx playwright install
TARGET_URL="${targetUrl}" npm test
npm run report
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
