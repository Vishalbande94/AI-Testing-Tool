// ── Execution Engineer Agent (10 Years Experience) ───────────────────────────
// AI-powered Playwright spec enhancement with smart selectors
const claudeClient = require('./claudeClient');

const SYSTEM_PROMPT = `You are a Senior Automation Engineer with 10 years of experience in Playwright, Selenium, and Cypress at major financial institutions and tech companies.

YOUR TASK: Given an existing Playwright spec (template-based) and a set of test cases, enhance the spec OR generate new test bodies for AI-generated test cases.

CRITICAL RULES:
1. Output ONLY the complete Playwright spec file as raw JavaScript. No markdown fences, no explanation.
2. The file MUST start with: import { test, expect } from '@playwright/test';
3. PRESERVE all existing helper functions (tryFind, tryFill, tryClick, gotoLogin, hasError, pageUrl, BASE_URL, BASE_DIR, IS_FILE)
4. PRESERVE the test naming pattern: test('TC_XXX | Title [playwrightKey]', async ({ page }) => { ... })
5. PRESERVE: test.info().annotations.push({ type: 'playwrightKey', description: 'key' })
6. For EXISTING tests with known template bodies: enhance selectors, add better assertions, add waits
7. For NEW tests (from AI Test Architect): generate complete test bodies using the "steps" and "expected" fields

SELECTOR STRATEGY (order of preference):
1. getByRole('button', { name: '...' }) / getByLabel('...')
2. data-testid / data-test attributes
3. aria-label, aria-labelledby
4. Text-based: getByText(), has-text CSS
5. Semantic: button[type="submit"], input[type="email"]
6. CSS class/id with tryFind fallback chain (LAST RESORT)

TEST BODY GENERATION RULES:
- Each test should be SELF-CONTAINED (no dependency on other tests)
- Always start with: await page.goto(BASE_URL) or await page.goto(pageUrl('page.html'))
- Add page.waitForLoadState('networkidle') after navigation
- Use expect() with meaningful error messages: expect(el, 'Login button should be visible').toBeVisible()
- Handle both file:// and http:// URLs using the IS_FILE flag
- Use try/catch for optional elements, not for assertions
- Keep test bodies under 30 lines each
- Use existing helpers: tryFind, tryFill, tryClick for resilience

COMMON PATTERNS:
- Login flow: gotoLogin(page) → tryFill email → tryFill password → tryClick submit → check no error
- Form submission: goto page → fill fields → submit → check success message
- Navigation: goto base → find links → click → check page loaded
- Negative tests: fill invalid data → submit → check error message appears
- Edge tests: leave empty → submit → check validation errors shown`;

/**
 * Enhance Playwright spec using AI Execution Engineer.
 * @param {string} baseUrl - Application URL
 * @param {Array} testCases - Test cases array
 * @param {Object} runConfig - Run configuration
 * @param {string} baseSpec - Existing template-generated spec
 * @returns {Promise<string>} Enhanced Playwright spec content
 */
async function enhanceSpec(baseUrl, testCases, runConfig = {}, baseSpec) {
  // Build a summary of test cases for the AI
  const tcSummary = testCases.map(tc => ({
    id: tc.id,
    title: tc.title,
    module: tc.module,
    type: tc.type,
    playwrightKey: tc.playwrightKey,
    steps: tc.steps,
    expected: tc.expected,
  }));

  const userMessage = `BASE URL: ${baseUrl}
IS FILE URL: ${baseUrl.startsWith('file://')}

TEST CASES TO AUTOMATE:
${JSON.stringify(tcSummary, null, 2)}

EXISTING PLAYWRIGHT SPEC (template-generated):
\`\`\`javascript
${baseSpec.slice(0, 50000)}
\`\`\`

INSTRUCTIONS:
1. Keep ALL existing helper functions and constants at the top
2. For tests that already have bodies in the existing spec: enhance selectors and assertions
3. For tests that have empty/stub bodies: generate complete test bodies based on their "steps" and "expected" fields
4. Make selectors resilient with fallback chains
5. Output the COMPLETE spec file as raw JavaScript`;

  const result = await claudeClient.call({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 16000,
    temperature: 0.2,
  });

  let spec = result.text.trim();

  // Strip markdown fences if the AI wrapped it
  spec = spec.replace(/^```(?:javascript|js)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Basic validation: must contain test() calls
  if (!spec.includes("from '@playwright/test'") && !spec.includes('from "@playwright/test"')) {
    throw new Error('AI-generated spec missing Playwright import — falling back to template');
  }

  return spec;
}

module.exports = { enhanceSpec };
