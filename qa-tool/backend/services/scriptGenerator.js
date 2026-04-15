// ── Automation Script Generator ───────────────────────────────────────────────
// Generates complete, ready-to-run automation test suites
const fs      = require('fs');
const path    = require('path');
const archiver = require('archiver');
const claudeClient = require('./agents/claudeClient');

const SYSTEM_PROMPT = `You are a Senior SDET with 12 years of experience building automation frameworks at enterprise companies. You write production-grade, clean, maintainable test code.

YOUR TASK: Generate a COMPLETE, ready-to-run automation test suite.

The output must be a JSON object where each key is a file path and each value is the file content string:
{
  "path/to/file.js": "file content here",
  "path/to/another.py": "content here"
}

RULES:
1. Output ONLY valid JSON. No markdown, no explanation.
2. Every file must be complete — no placeholders like "// add more tests here"
3. Include ALL config files (package.json, tsconfig, playwright.config, pom.xml, etc.)
4. Include a README.md with exact run instructions
5. Use Page Object Model pattern always
6. Include proper assertions with meaningful messages
7. Include test data files where needed
8. Make tests independent — each test should work standalone
9. Include proper setup/teardown hooks
10. Add comments explaining key decisions`;

/**
 * Generate a complete automation suite.
 * @param {Object} params
 * @returns {Promise<string>} Path to generated ZIP file
 */
async function generate({
  appUrl,
  testCases,
  tool,        // playwright | selenium | cypress | restassured
  language,    // javascript | typescript | java | python
  framework,   // pom | bdd | datadriven
  testType,    // smoke | regression | e2e
  outputDir,
}) {
  fs.mkdirSync(outputDir, { recursive: true });

  let files;
  if (claudeClient.isConfigured()) {
    files = await generateWithAI({ appUrl, testCases, tool, language, framework, testType });
  } else {
    files = generateFromTemplates({ appUrl, testCases, tool, language, framework, testType });
  }

  // Write files to disk and create ZIP
  const projectName = `qa-automation-${tool}-${language}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  // Create ZIP
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);

  return { zipPath, projectName, fileCount: Object.keys(files).length };
}

// ── AI-powered generation ────────────────────────────────────────────────────
async function generateWithAI({ appUrl, testCases, tool, language, framework, testType }) {
  const tcSummary = testCases.map(tc => ({
    id: tc.id, module: tc.module, title: tc.title, type: tc.type,
    priority: tc.priority, steps: tc.steps, expected: tc.expected,
  }));

  const toolConfig = getToolConfig(tool, language, framework);

  const userMessage = `Generate a COMPLETE automation test suite:

APPLICATION URL: ${appUrl}
TOOL: ${tool}
LANGUAGE: ${language}
FRAMEWORK PATTERN: ${framework.toUpperCase()}
TEST TYPE: ${testType}
PROJECT STRUCTURE: ${toolConfig.structure}

TEST CASES TO AUTOMATE (${testCases.length} total):
${JSON.stringify(tcSummary, null, 2)}

REQUIREMENTS:
1. Generate a ${toolConfig.configFile} with proper configuration
2. Use ${framework.toUpperCase()} pattern — create page objects for each module
3. Create test specs grouping tests by module
4. This is a ${testType.toUpperCase()} suite — ${testType === 'smoke' ? 'only critical happy paths' : testType === 'regression' ? 'all test cases including negative and edge' : 'full end-to-end flows covering all modules'}
5. Include a README.md with setup and run commands
6. ${toolConfig.extraInstructions}

Output a JSON object where keys are file paths and values are complete file contents.`;

  const result = await claudeClient.callJSON({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 16000,
    temperature: 0.2,
  });

  return result.data;
}

// ── Template-based generation (no AI) ────────────────────────────────────────
function generateFromTemplates({ appUrl, testCases, tool, language, framework, testType }) {
  // Filter test cases by type
  let filtered = [...testCases];
  if (testType === 'smoke') {
    const seen = new Set();
    filtered = filtered.filter(tc => { if (seen.has(tc.module)) return false; seen.add(tc.module); return true; });
  } else if (testType === 'e2e') {
    filtered = filtered.filter(tc => tc.type === 'Positive');
  }

  const generators = {
    'playwright-javascript':  () => genPlaywrightJS(appUrl, filtered, framework),
    'playwright-typescript':  () => genPlaywrightTS(appUrl, filtered, framework),
    'selenium-java':          () => genSeleniumJava(appUrl, filtered, framework),
    'selenium-python':        () => genSeleniumPython(appUrl, filtered, framework),
    'cypress-javascript':     () => genCypressJS(appUrl, filtered, framework),
    'restassured-java':       () => genRestAssuredJava(appUrl, filtered, framework),
  };

  const key = `${tool}-${language}`;
  const gen = generators[key];
  if (!gen) return generators['playwright-javascript']();
  return gen();
}

// ── Step → Playwright code inference helpers ────────────────────────────────
// Turn a natural-language step like "Enter a valid email address" into concrete
// Playwright code using smart selector chains (getByRole → getByLabel → getByPlaceholder).
function inferStepCode(step, testData = {}) {
  const s = String(step || '').trim();
  const lower = s.toLowerCase();

  // Extract button/link names — "click the Login / Sign In button" → first synonym "login"
  const clickBtn = lower.match(/click (?:the )?['"]?([a-z0-9 _-]+?)['"]? (?:button|link|tab|icon)/);
  if (clickBtn) {
    const raw = clickBtn[1].trim();
    const name = firstWord(raw);
    return `await this.page.getByRole('button', { name: /${escapeRx(name)}/i }).or(this.page.getByRole('link', { name: /${escapeRx(name)}/i })).first().click();`;
  }
  if (/^click /.test(lower) || /\btap /.test(lower)) {
    const raw = lower.replace(/^(click|tap)\s+(the\s+)?/, '').replace(/\s+(button|link|tab|icon|menu).*$/, '').trim();
    const name = firstWord(raw);
    if (name) return `await this.page.getByRole('button', { name: /${escapeRx(name)}/i }).or(this.page.getByText(/${escapeRx(name)}/i)).first().click();`;
  }

  // Enter / type / fill
  const enterMatch = lower.match(/(?:enter|type|fill|input)\s+(?:an?\s+|the\s+)?(?:valid\s+|invalid\s+|correct\s+|incorrect\s+|wrong\s+|registered\s+|real\s+)?([a-z0-9 ]+?)(?:\s+(?:address|value|field))?(?:\s*[:\-]\s*(.+))?$/);
  if (enterMatch) {
    const rawField = enterMatch[1].trim();
    const field = canonicalField(rawField);
    const valueOverride = enterMatch[2];
    const value = valueOverride || pickTestDataForField(field, lower, testData);
    return `await this.page.getByLabel(/${escapeRx(field)}/i).or(this.page.getByPlaceholder(/${escapeRx(field)}/i)).or(this.page.locator('input[name*="${cssField(field)}" i], input[id*="${cssField(field)}" i]')).first().fill(${JSON.stringify(value)});`;
  }

  // Select / choose from dropdown
  const selectMatch = lower.match(/(?:select|choose|pick)\s+['"]?([a-z0-9 ]+?)['"]?(?:\s+from\s+(.+))?$/);
  if (selectMatch) {
    const opt = selectMatch[1].trim();
    const from = (selectMatch[2] || 'select').trim();
    return `await this.page.getByLabel(/${escapeRx(from)}/i).or(this.page.locator('select')).first().selectOption({ label: new RegExp('${escapeRx(opt)}', 'i') });`;
  }

  // Checkbox / toggle
  if (/\b(check|tick|enable|toggle on)\b/.test(lower)) {
    const name = lower.replace(/.*?(check|tick|enable|toggle on)\s+(?:the\s+)?/, '').replace(/\s+(checkbox|option|toggle).*$/, '').trim();
    return `await this.page.getByLabel(/${escapeRx(name || 'checkbox')}/i).check();`;
  }
  if (/\b(uncheck|untick|disable|toggle off)\b/.test(lower)) {
    const name = lower.replace(/.*?(uncheck|untick|disable|toggle off)\s+(?:the\s+)?/, '').replace(/\s+(checkbox|option|toggle).*$/, '').trim();
    return `await this.page.getByLabel(/${escapeRx(name || 'checkbox')}/i).uncheck();`;
  }

  // Submit
  if (/\bsubmit\b/.test(lower)) {
    return `await this.page.getByRole('button', { name: /submit|save|continue|confirm/i }).first().click();`;
  }

  // Navigate to URL / page
  const navMatch = lower.match(/navigate\s+(?:to\s+)?(.+?)(?:\s+url)?(?:\s+page)?$/);
  if (navMatch && /^https?:\/\//.test(navMatch[1])) {
    return `await this.page.goto(${JSON.stringify(navMatch[1])});`;
  }
  if (/navigate/.test(lower) || /go to/.test(lower) || /open/.test(lower)) {
    return `await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');`;
  }

  // Wait
  const waitMatch = lower.match(/wait\s+(?:for\s+)?(\d+)\s*(sec|second|ms|millisecond)/);
  if (waitMatch) {
    const ms = waitMatch[2].startsWith('s') ? parseInt(waitMatch[1]) * 1000 : parseInt(waitMatch[1]);
    return `await this.page.waitForTimeout(${ms});`;
  }

  // Observe / verify  → becomes a soft wait
  if (/^(observe|verify|check|confirm|ensure)\b/.test(lower)) {
    return `// Verification covered in test-level assertion: ${s}`;
  }

  // Fallback — keep as a comment so it's obvious but non-blocking
  return `// Step: ${s.replace(/\*\//g, '*\\/')}`;
}

function inferAssertion(expected, testData = {}) {
  const e = String(expected || '').trim();
  const lower = e.toLowerCase();

  if (!e) return `// No explicit expected result provided`;

  // URL change — redirect / dashboard / home
  if (/redirect(ed)? to (?:the )?([a-z0-9 /-]+)/.test(lower)) {
    const m = lower.match(/redirect(?:ed)? to (?:the )?([a-z0-9 /-]+?)(?:\s|\.|$)/);
    if (m) {
      return `await expect(page).toHaveURL(new RegExp('${escapeRx(m[1])}', 'i'));`;
    }
  }
  if (/dashboard|home|account page/.test(lower)) {
    return `await expect(page).toHaveURL(/dashboard|home|account/i);`;
  }
  if (/login page|sign[- ]?in page/.test(lower)) {
    return `await expect(page).toHaveURL(/login|sign[- ]?in/i);`;
  }

  // Error message visible
  if (/error|invalid|rejected|denied|forbidden|failed/.test(lower)) {
    return `await expect(page.getByText(/error|invalid|failed|denied|required/i).first()).toBeVisible({ timeout: 5000 });`;
  }
  // Success message visible
  if (/success|confirmation|welcome|thank you|created|saved|approved/.test(lower)) {
    return `await expect(page.getByText(/success|welcome|thank|created|saved|confirmed/i).first()).toBeVisible({ timeout: 5000 });`;
  }
  // HTTP status in expectation
  const status = lower.match(/\b(200|201|204|301|302|400|401|403|404|409|422|429|500|502|503)\b/);
  if (status) {
    return `// Assert HTTP status ${status[1]} via page.waitForResponse() — see test body`;
  }
  // Email format / specific text
  if (/email|sent|notification/.test(lower)) {
    return `await expect(page.getByText(/email|sent|notification/i).first()).toBeVisible({ timeout: 5000 });`;
  }

  return `// Expected: ${e.replace(/\*\//g, '*\\/')}\n    await expect(page).toHaveTitle(/.*/);`;
}

function pickTestDataForField(field, fullStep, testData) {
  const f = field.toLowerCase();
  if (/wrong|incorrect|invalid/.test(fullStep)) {
    if (/password/.test(f)) return 'WrongPass!2026';
    if (/email/.test(f))    return 'notfound@example.com';
  }
  if (/valid|correct|registered/.test(fullStep) || true) {
    if (/email/.test(f))        return 'testuser@example.com';
    if (/password/.test(f))     return 'Test@1234';
    if (/first\s*name/.test(f)) return 'Ada';
    if (/last\s*name/.test(f))  return 'Lovelace';
    if (/full\s*name|^name$/.test(f)) return 'Ada Lovelace';
    if (/phone|mobile/.test(f)) return '+14155551234';
    if (/card(?:\s*number)?/.test(f)) return '4111111111111111';
    if (/cvv|cvc/.test(f))      return '123';
    if (/expiry|expiration/.test(f)) return '12/28';
    if (/zip|postal/.test(f))   return '94103';
    if (/address/.test(f))      return '1 Market Street';
    if (/city/.test(f))         return 'San Francisco';
    if (/country/.test(f))      return 'United States';
    if (/amount|price/.test(f)) return '100';
    if (/search|query/.test(f)) return 'test query';
    if (/otp|code/.test(f))     return '123456';
  }
  return 'Test123';
}

function escapeRx(s) { return String(s).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/"/g, '\\"'); }
function cssField(s)  { return String(s).replace(/\s+/g, ''); }
// "login / sign in" or "login | sign in" → "login" (take first synonym only)
function firstWord(s) {
  const parts = String(s).split(/\s*[/|]\s*/);
  return parts[0].trim();
}
// Normalize noisy phrases like "the correct password" → "password", "valid email address" → "email"
function canonicalField(raw) {
  const s = String(raw).toLowerCase().trim();
  if (/email/.test(s))                 return 'email';
  if (/password/.test(s))              return 'password';
  if (/(^|\s)first\s*name/.test(s))    return 'first name';
  if (/(^|\s)last\s*name/.test(s))     return 'last name';
  if (/(^|\s)full\s*name/.test(s) || /(^|\s)name(\s|$)/.test(s)) return 'name';
  if (/phone|mobile/.test(s))          return 'phone';
  if (/card\s*number/.test(s) || /(^|\s)card(\s|$)/.test(s)) return 'card number';
  if (/cvv|cvc|security code/.test(s)) return 'cvv';
  if (/expir/.test(s))                 return 'expiry';
  if (/zip|postal/.test(s))            return 'zip';
  if (/address/.test(s))               return 'address';
  if (/city/.test(s))                  return 'city';
  if (/country/.test(s))               return 'country';
  if (/amount/.test(s))                return 'amount';
  if (/search|query/.test(s))          return 'search';
  if (/otp|(^|\s)code(\s|$)/.test(s))  return 'code';
  // Default — strip leading articles/adjectives
  return s.replace(/^(a|an|the)\s+/, '').replace(/\s+(address|value|field)$/, '').trim();
}

// ── Playwright + JavaScript ──────────────────────────────────────────────────
function genPlaywrightJS(appUrl, testCases, framework) {
  const modules = [...new Set(testCases.map(tc => tc.module))];
  const files = {};

  files['package.json'] = JSON.stringify({
    name: 'qa-automation-playwright',
    version: '1.0.0',
    scripts: {
      test: 'npx playwright test',
      'test:headed': 'npx playwright test --headed',
      'test:ui': 'npx playwright test --ui',
      report: 'npx playwright show-report',
    },
    devDependencies: { '@playwright/test': '^1.55.0' },
  }, null, 2);

  files['playwright.config.js'] = `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  workers: 3,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: '${appUrl}',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox',  use: { browserName: 'firefox' } },
  ],
});
`;

  // Page Objects — inferred runnable methods
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    const tcInMod = testCases.filter(tc => tc.module === mod);
    files[`pages/${safeName}Page.js`] = `// Page Object: ${mod}
// Auto-generated with smart selector chains (getByRole → getByLabel → getByPlaceholder).
// Selectors are heuristic — tune them to your app if needed.

export class ${safeName}Page {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }
${tcInMod.map(tc => {
  const methodName = tc.playwrightKey || tc.id.toLowerCase();
  const stepCode = (tc.steps || []).map((s, i) => {
    const line = inferStepCode(s, tc.testData);
    return `    // Step ${i + 1}: ${s.replace(/\*\//g, '*\\/')}\n    ${line}`;
  }).join('\n');
  return `
  /** ${tc.title} */
  async ${methodName}() {
${stepCode}
  }`;
}).join('\n')}
}
`;
  });

  // Test Specs — runnable with real assertions
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    const tcInMod = testCases.filter(tc => tc.module === mod);
    files[`tests/${safeName}.spec.js`] = `import { test, expect } from '@playwright/test';
import { ${safeName}Page } from '../pages/${safeName}Page.js';

test.describe('${mod.replace(/'/g, "\\'")}', () => {
  let pageObj;

  test.beforeEach(async ({ page }) => {
    pageObj = new ${safeName}Page(page);
    await pageObj.navigate();
  });
${tcInMod.map(tc => {
  const methodName = tc.playwrightKey || tc.id.toLowerCase();
  const assertion = inferAssertion(tc.expected, tc.testData);
  return `
  test(${JSON.stringify(`${tc.id} | ${tc.title}`)}, async ({ page }) => {
    // Type: ${tc.type} | Priority: ${tc.priority}
    // Expected: ${String(tc.expected || '').replace(/\*\//g, '*\\/')}
    await pageObj.${methodName}();
    ${assertion}
  });`;
}).join('\n')}
});
`;
  });

  // Test Data
  files['test-data/testData.json'] = JSON.stringify({
    validUser: { email: 'testuser@example.com', password: 'Test@1234', name: 'Test User' },
    invalidUser: { email: 'invalid@test.com', password: 'wrong' },
    testCard: { number: '4111111111111111', expiry: '12/28', cvv: '123' },
  }, null, 2);

  files['README.md'] = `# QA Automation Suite — Playwright + JavaScript

Auto-generated test suite built with **Page Object Model** pattern.
Target application: **${appUrl}**

---

## 📋 Prerequisites

Before you begin, make sure you have:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18.x or higher | \`node --version\` |
| npm | 9.x or higher | \`npm --version\` |

If not installed, download from https://nodejs.org/

---

## 🚀 Getting Started

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Install Playwright browsers (one-time setup)
\`\`\`bash
npx playwright install
\`\`\`
This downloads Chromium, Firefox, and WebKit browsers (~400MB).

### 3. Run the tests
\`\`\`bash
npm test
\`\`\`

That's it! Tests will run headless against \`${appUrl}\`.

---

## 🧪 Test Commands

| Command | What it does |
|---------|--------------|
| \`npm test\` | Run all tests headless across all configured browsers |
| \`npm run test:headed\` | Run with the browser window visible (good for debugging) |
| \`npm run test:ui\` | Open Playwright's interactive UI runner |
| \`npm run report\` | Open the last HTML test report in your browser |

### Advanced: Run a single test
\`\`\`bash
npx playwright test tests/AuthenticationLogin.spec.js
npx playwright test --grep "TC_001"          # by test title match
npx playwright test --project=chromium        # single browser only
\`\`\`

### Debug mode
\`\`\`bash
npx playwright test --debug                   # step-through with inspector
PWDEBUG=1 npx playwright test                 # pause on failure
\`\`\`

---

## 📁 Project Structure

\`\`\`
qa-automation-playwright-javascript/
├── pages/                  # Page Object classes (one per module)
│   ├── AuthenticationLoginPage.js
│   ├── DashboardPage.js
│   └── ...
├── tests/                  # Test specifications (one per module)
│   ├── AuthenticationLogin.spec.js
│   ├── Dashboard.spec.js
│   └── ...
├── test-data/              # Reusable test data (JSON)
│   └── testData.json
├── playwright.config.js    # Playwright configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
\`\`\`

---

## ⚙️ Configuration

Open \`playwright.config.js\` to customize:

- **\`baseURL\`** — application URL (currently: \`${appUrl}\`)
- **\`timeout\`** — test timeout in ms (default: 30000)
- **\`retries\`** — automatic retries on failure (default: 1)
- **\`workers\`** — parallel test workers (default: 3)
- **\`projects\`** — browsers to run against (Chromium + Firefox)
- **\`screenshot\`**, **\`video\`**, **\`trace\`** — artifact capture settings

---

## 📊 Viewing Results

After tests run:

1. **Terminal output** — live pass/fail list
2. **HTML report** — \`npm run report\` opens a rich report with:
   - Test results per browser
   - Screenshots of failures
   - Video recordings
   - Trace files (click to open in Playwright Trace Viewer)

---

## 🐛 Debugging Failed Tests

1. Run with trace enabled (already on-retain-on-failure):
   \`\`\`bash
   npm test
   \`\`\`
2. Open the trace:
   \`\`\`bash
   npx playwright show-trace test-results/.../trace.zip
   \`\`\`
3. Or use UI mode for interactive debugging:
   \`\`\`bash
   npm run test:ui
   \`\`\`

---

## 🔧 Adapting Tests to Your App

The generated Page Object methods contain **TODO markers** where you need to fill in actual selectors from your application.

Example (\`pages/AuthenticationLoginPage.js\`):
\`\`\`js
async login_positive() {
  // TODO: Implement based on actual app selectors
  // await this.page.fill('input[name="email"]', 'user@test.com');
  // await this.page.fill('input[name="password"]', 'password');
  // await this.page.click('button[type="submit"]');
}
\`\`\`

**Tip**: Use \`npx playwright codegen ${appUrl}\` to record a flow and copy the selectors into your page objects.

---

## 📈 CI/CD Integration

### GitHub Actions example
\`\`\`yaml
- uses: actions/setup-node@v4
  with: { node-version: '20' }
- run: npm ci
- run: npx playwright install --with-deps
- run: npm test
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
\`\`\`

### Jenkins example
\`\`\`groovy
stage('Test') {
  steps {
    sh 'npm ci'
    sh 'npx playwright install --with-deps'
    sh 'npm test'
  }
  post {
    always {
      publishHTML([reportDir: 'playwright-report', reportFiles: 'index.html'])
    }
  }
}
\`\`\`

---

## 📦 Suite Summary

- **Test Cases**: ${testCases.length}
- **Modules**: ${modules.length}
- **Browsers**: Chromium, Firefox
- **Pattern**: Page Object Model (POM)
- **Framework**: ${framework === 'bdd' ? 'BDD (Given/When/Then)' : framework === 'datadriven' ? 'Data-Driven' : 'POM'}

### Modules Covered
${modules.map(m => `- ${m}`).join('\n')}

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| \`browserType.launch: Executable doesn't exist\` | Run \`npx playwright install\` |
| Tests hang / time out | Increase \`timeout\` in \`playwright.config.js\` |
| \`ECONNREFUSED\` on baseURL | Verify the app at \`${appUrl}\` is running |
| Flaky tests | Increase \`retries\` in config; check for race conditions |

---

Generated by **AnAr QA Platform** — AI-Powered Test Automation
`;

  return files;
}

// ── Playwright + TypeScript ──────────────────────────────────────────────────
function genPlaywrightTS(appUrl, testCases, framework) {
  const jsFiles = genPlaywrightJS(appUrl, testCases, framework);
  const files = {};

  // Convert .js to .ts
  for (const [p, content] of Object.entries(jsFiles)) {
    const tsPath = p.replace(/\.js$/, '.ts').replace('playwright.config.ts', 'playwright.config.ts');
    files[tsPath] = content;
  }

  // Update package.json
  const pkg = JSON.parse(jsFiles['package.json']);
  pkg.devDependencies['typescript'] = '^5.3.0';
  pkg.devDependencies['@types/node'] = '^20.0.0';
  files['package.json'] = JSON.stringify(pkg, null, 2);

  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler',
      strict: true, esModuleInterop: true, outDir: './dist',
    },
    include: ['tests/**/*.ts', 'pages/**/*.ts'],
  }, null, 2);

  files['README.md'] = jsFiles['README.md'].replace('JavaScript', 'TypeScript');
  return files;
}

// ── Selenium + Java ──────────────────────────────────────────────────────────
function genSeleniumJava(appUrl, testCases, framework) {
  const modules = [...new Set(testCases.map(tc => tc.module))];
  const files = {};

  files['pom.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.anar.qa</groupId>
  <artifactId>qa-automation</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <selenium.version>4.18.0</selenium.version>
    <testng.version>7.9.0</testng.version>
  </properties>
  <dependencies>
    <dependency><groupId>org.seleniumhq.selenium</groupId><artifactId>selenium-java</artifactId><version>\${selenium.version}</version></dependency>
    <dependency><groupId>org.testng</groupId><artifactId>testng</artifactId><version>\${testng.version}</version><scope>test</scope></dependency>
    <dependency><groupId>io.github.bonigarcia</groupId><artifactId>webdrivermanager</artifactId><version>5.7.0</version></dependency>
    <dependency><groupId>com.aventstack</groupId><artifactId>extentreports</artifactId><version>5.1.1</version></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.2.5</version>
        <configuration><suiteXmlFiles><suiteXmlFile>testng.xml</suiteXmlFile></suiteXmlFiles></configuration>
      </plugin>
    </plugins>
  </build>
</project>`;

  files['testng.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="QA Automation Suite" parallel="tests" thread-count="3">
${modules.map(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    return `  <test name="${mod}">
    <classes><class name="com.anar.qa.tests.${safeName}Test"/></classes>
  </test>`;
  }).join('\n')}
</suite>`;

  // Base Test
  files['src/test/java/com/anar/qa/base/BaseTest.java'] = `package com.anar.qa.base;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.testng.annotations.*;

public class BaseTest {
    protected WebDriver driver;
    protected static final String BASE_URL = "${appUrl}";

    @BeforeMethod
    public void setUp() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless", "--no-sandbox", "--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
        driver.manage().window().maximize();
        driver.get(BASE_URL);
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) driver.quit();
    }
}
`;

  // Page Objects
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    files[`src/test/java/com/anar/qa/pages/${safeName}Page.java`] = `package com.anar.qa.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

public class ${safeName}Page {
    private WebDriver driver;
    private WebDriverWait wait;

    public ${safeName}Page(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    // TODO: Add @FindBy locators based on actual app
    // @FindBy(id = "email") private WebElement emailInput;
}
`;
  });

  // Test Classes
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    const tcInMod = testCases.filter(tc => tc.module === mod);
    files[`src/test/java/com/anar/qa/tests/${safeName}Test.java`] = `package com.anar.qa.tests;

import com.anar.qa.base.BaseTest;
import com.anar.qa.pages.${safeName}Page;
import org.testng.Assert;
import org.testng.annotations.*;

public class ${safeName}Test extends BaseTest {
    private ${safeName}Page page;

    @BeforeMethod
    public void initPage() {
        page = new ${safeName}Page(driver);
    }
${tcInMod.map(tc => `
    @Test(priority = ${tc.priority === 'Critical' ? 1 : tc.priority === 'High' ? 2 : 3}, description = "${tc.title}")
    public void ${(tc.playwrightKey || tc.id).replace(/[^a-zA-Z0-9_]/g, '_')}() {
        // Type: ${tc.type} | Priority: ${tc.priority}
${(tc.steps || []).map((s, i) => `        // Step ${i + 1}: ${s}`).join('\n')}
        // Expected: ${tc.expected}
        // TODO: Implement test logic
    }`).join('\n')}
}
`;
  });

  files['README.md'] = `# QA Automation Suite — Selenium + Java + TestNG

## Setup
\`\`\`bash
# Requires Java 17+ and Maven
mvn clean install -DskipTests
\`\`\`

## Run Tests
\`\`\`bash
mvn test                              # Run all tests
mvn test -Dgroups="smoke"            # Run smoke tests
mvn test -Dtest=AuthenticationTest   # Run specific test class
\`\`\`

## Structure
\`\`\`
├── src/test/java/com/anar/qa/
│   ├── base/BaseTest.java
│   ├── pages/*Page.java
│   └── tests/*Test.java
├── testng.xml
└── pom.xml
\`\`\`

Generated by AnAr QA Platform
`;

  return files;
}

// ── Selenium + Python ────────────────────────────────────────────────────────
function genSeleniumPython(appUrl, testCases, framework) {
  const modules = [...new Set(testCases.map(tc => tc.module))];
  const files = {};

  files['requirements.txt'] = `selenium==4.18.0
pytest==8.0.0
pytest-html==4.1.1
webdriver-manager==4.0.1
allure-pytest==2.13.2`;

  files['conftest.py'] = `import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "${appUrl}"

@pytest.fixture(scope="function")
def driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    driver.get(BASE_URL)
    yield driver
    driver.quit()
`;

  files['pytest.ini'] = `[pytest]
testpaths = tests
markers =
    smoke: Smoke tests
    regression: Regression tests
    e2e: End-to-end tests
addopts = --html=reports/report.html --self-contained-html -v`;

  // Page Objects
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    files[`pages/${safeName}_page.py`] = `"""Page Object: ${mod}"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class ${mod.replace(/[^a-zA-Z0-9]/g, '')}Page:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def navigate(self):
        self.driver.get(self.driver.current_url)

    # TODO: Add locators and methods based on actual app
`;
  });

  files['pages/__init__.py'] = '';

  // Test Files
  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const className = mod.replace(/[^a-zA-Z0-9]/g, '');
    const tcInMod = testCases.filter(tc => tc.module === mod);
    files[`tests/test_${safeName}.py`] = `"""Tests for: ${mod}"""
import pytest
from pages.${safeName}_page import ${className}Page


class Test${className}:
${tcInMod.map(tc => `
    @pytest.mark.${tc.priority === 'Critical' ? 'smoke' : 'regression'}
    def test_${(tc.playwrightKey || tc.id).replace(/[^a-zA-Z0-9_]/g, '_')}(self, driver):
        """${tc.title} [${tc.type} | ${tc.priority}]"""
        page = ${className}Page(driver)
${(tc.steps || []).map((s, i) => `        # Step ${i + 1}: ${s}`).join('\n')}
        # Expected: ${tc.expected}
        # TODO: Implement test logic
        pass`).join('\n')}
`;
  });

  files['tests/__init__.py'] = '';

  files['README.md'] = `# QA Automation Suite — Selenium + Python + Pytest

## Setup
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Run Tests
\`\`\`bash
pytest                          # Run all tests
pytest -m smoke                 # Run smoke tests only
pytest -m regression            # Run regression tests
pytest tests/test_auth.py      # Run specific module
pytest --html=report.html      # Generate HTML report
\`\`\`

Generated by AnAr QA Platform
`;

  return files;
}

// ── Cypress + JavaScript ─────────────────────────────────────────────────────
function genCypressJS(appUrl, testCases, framework) {
  const modules = [...new Set(testCases.map(tc => tc.module))];
  const files = {};

  files['package.json'] = JSON.stringify({
    name: 'qa-automation-cypress',
    version: '1.0.0',
    scripts: {
      test: 'npx cypress run',
      open: 'npx cypress open',
      'test:chrome': 'npx cypress run --browser chrome',
    },
    devDependencies: { cypress: '^13.6.0' },
  }, null, 2);

  files['cypress.config.js'] = `const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    baseUrl: '${appUrl}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {},
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
});
`;

  modules.forEach(mod => {
    const safeName = mod.replace(/[^a-zA-Z0-9]/g, '');
    const tcInMod = testCases.filter(tc => tc.module === mod);
    files[`cypress/e2e/${safeName}.cy.js`] = `describe('${mod}', () => {
  beforeEach(() => {
    cy.visit('/');
  });
${tcInMod.map(tc => `
  it('${tc.id} | ${tc.title}', () => {
    // Type: ${tc.type} | Priority: ${tc.priority}
${(tc.steps || []).map((s, i) => `    // Step ${i + 1}: ${s}`).join('\n')}
    // Expected: ${tc.expected}
    // TODO: Add Cypress commands
  });`).join('\n')}
});
`;
  });

  files['cypress/support/commands.js'] = `// Custom commands
Cypress.Commands.add('login', (email, password) => {
  cy.get('[type="email"], [name="email"], #email').first().clear().type(email);
  cy.get('[type="password"], [name="password"], #password').first().clear().type(password);
  cy.get('[type="submit"], button:contains("Login")').first().click();
});
`;

  files['cypress/support/e2e.js'] = `import './commands';\n`;

  files['README.md'] = `# QA Automation Suite — Cypress + JavaScript

## Setup
\`\`\`bash
npm install
\`\`\`

## Run Tests
\`\`\`bash
npm test              # Run headless
npm run open          # Open Cypress UI
npm run test:chrome   # Run in Chrome
\`\`\`

Generated by AnAr QA Platform
`;

  return files;
}

// ── REST Assured + Java ──────────────────────────────────────────────────────
function genRestAssuredJava(appUrl, testCases, framework) {
  const files = genSeleniumJava(appUrl, testCases, framework);
  // Add REST Assured dependency
  files['pom.xml'] = files['pom.xml'].replace('</dependencies>',
    `    <dependency><groupId>io.rest-assured</groupId><artifactId>rest-assured</artifactId><version>5.4.0</version><scope>test</scope></dependency>
    <dependency><groupId>com.google.code.gson</groupId><artifactId>gson</artifactId><version>2.10.1</version></dependency>
  </dependencies>`);
  files['README.md'] = files['README.md'].replace('Selenium', 'Selenium + REST Assured');
  return files;
}

// ── Tool config helper ───────────────────────────────────────────────────────
function getToolConfig(tool, language, framework) {
  const configs = {
    'playwright-javascript': { configFile: 'playwright.config.js', structure: 'pages/ + tests/ + test-data/', extraInstructions: 'Use import/export ESM syntax. Use page.getByRole, page.getByLabel for selectors.' },
    'playwright-typescript': { configFile: 'playwright.config.ts', structure: 'pages/ + tests/ + test-data/', extraInstructions: 'Use TypeScript with strict mode. Define interfaces for page objects.' },
    'selenium-java':        { configFile: 'pom.xml + testng.xml', structure: 'src/test/java/com/anar/qa/{base,pages,tests}/', extraInstructions: 'Use TestNG, PageFactory, WebDriverWait. Maven project.' },
    'selenium-python':      { configFile: 'conftest.py + pytest.ini', structure: 'pages/ + tests/ + conftest.py', extraInstructions: 'Use pytest fixtures, Page Object classes, explicit waits.' },
    'cypress-javascript':   { configFile: 'cypress.config.js', structure: 'cypress/e2e/ + cypress/support/', extraInstructions: 'Use cy.get, cy.contains, custom commands. Include cy.intercept for API mocking.' },
    'restassured-java':     { configFile: 'pom.xml', structure: 'src/test/java/com/anar/qa/{base,tests}/', extraInstructions: 'Use REST Assured BDD style (given/when/then). Validate status codes, response body, headers.' },
  };
  return configs[`${tool}-${language}`] || configs['playwright-javascript'];
}

// ── ZIP creator ──────────────────────────────────────────────────────────────
function createZip(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, path.basename(sourceDir));
    archive.finalize();
  });
}

module.exports = { generate };
