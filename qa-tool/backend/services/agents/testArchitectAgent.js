// ── Test Architect Agent (15 Years Experience) ───────────────────────────────
// AI-powered test case generation with deep domain knowledge
const claudeClient = require('./claudeClient');

const SYSTEM_PROMPT = `You are a Senior Test Architect with 15 years of experience in QA across:
- **Banking** (3 yrs): Core banking (Finacle/T24), payments (SWIFT, NEFT, RTGS, UPI), KYC/AML, loan origination, card management, internet banking, mobile banking
- **Insurance** (3 yrs): Policy lifecycle (issuance→endorsement→renewal→cancellation), claims (FNOL→assessment→payment), underwriting rules, premium calculations, reinsurance, regulatory compliance (IRDA/Solvency II)
- **Investment Banking** (4 yrs): Trade order management, FIX protocol (4.2/4.4), settlement (T+1, T+2), P&L reconciliation, regulatory reporting (MiFID II, Dodd-Frank), market data feeds
- **Telecom** (2 yrs): Billing & rating engines, CRM, provisioning, number portability, CDR validation
- **Digital/E-commerce** (3 yrs): Cart, checkout, payments, search, user profiles, session management

YOUR TASK: Generate comprehensive test cases from requirement text.

OUTPUT FORMAT — JSON array of test case objects. Each object MUST have EXACTLY these fields:
{
  "id": "TC_001",
  "module": "Module Name",
  "icon": "🔐",
  "title": "Test case title",
  "type": "Positive",
  "priority": "Critical",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "expected": "Expected result description",
  "playwrightKey": "module_type_id",
  "status": "Not Executed",
  "actual": "",
  "error": "",
  "duration": null,
  "screenshot": null
}

RULES:
1. "id": Sequential TC_001, TC_002, TC_003...
2. "type": "Positive" | "Negative" | "Edge"
3. "priority": "Critical" | "High" | "Medium" | "Low"
4. "playwrightKey": unique snake_case like "login_positive", "payment_negative_expired", "form_edge_empty"
5. "status" MUST be "Not Executed", "actual"/"error" MUST be "", "duration"/"screenshot" MUST be null
6. "icon": Use relevant emoji per module (🔐 auth, 📝 register, 💳 payment, 📋 form, 🔍 search, 🚪 logout, 🔑 password, 📊 dashboard, 🧭 navigation, 👤 profile)
7. "steps": Array of 3-6 clear, actionable steps
8. Always include Navigation baseline tests (app loads, links work)
9. For each module: generate Positive + Negative + Edge cases
10. Think about what a JUNIOR tester would MISS — race conditions, boundary values, empty states, special characters, session handling, back-button behavior

DOMAIN-SPECIFIC EDGE CASES TO CONSIDER:
- Banking: Transaction limits, concurrent transfers, date boundary (EOD batch), rounding errors, multi-currency
- Insurance: Grace period expiry, mid-term endorsement premium recalc, claim re-opening, cooling-off period
- Investment Banking: Market hours validation, partial fills, settlement date holidays, FIX tag validation
- Telecom: Proration for mid-cycle changes, roaming billing, number portability flow, balance deduction timing

SCOPE FILTERING (apply AFTER generating):
- "smoke": Keep only 1 Critical test per module (the most important positive case)
- "sanity": Keep max 2 tests per module (1 positive + 1 negative)
- "regression": Keep all tests
- "full": Keep all tests + add extra edge cases

PRIORITY FILTERING:
- "critical": Keep only Critical priority tests
- "high": Keep Critical + High priority
- "all": Keep everything`;

/**
 * Generate test cases using AI Test Architect agent.
 * @param {string} requirementText - Parsed requirement document text
 * @param {Object} config - { testScope, priorityFilter, environment, browsers, ... }
 * @returns {Promise<Array>} Array of test case objects
 */
async function generate(requirementText, config = {}) {
  const userMessage = `REQUIREMENTS DOCUMENT:
---
${requirementText.slice(0, 80000)}
---

CONFIGURATION:
- Test Scope: ${config.testScope || 'regression'}
- Priority Filter: ${config.priorityFilter || 'all'}
- Environment: ${config.environment || 'QA'}
- Browsers: ${(config.browsers || ['chromium']).join(', ')}

Generate comprehensive test cases based on the above requirements. Apply the scope and priority filters. Output ONLY the JSON array.`;

  const result = await claudeClient.callJSON({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.3,
  });

  const testCases = result.data;

  // Validate and fix each test case
  const validated = [];
  let idCounter = 1;

  for (const tc of testCases) {
    if (!tc.title || !tc.module) continue; // skip invalid

    validated.push({
      id:            tc.id || `TC_${String(idCounter).padStart(3, '0')}`,
      module:        tc.module || 'Unknown',
      icon:          tc.icon || '🧪',
      title:         tc.title,
      type:          ['Positive', 'Negative', 'Edge'].includes(tc.type) ? tc.type : 'Positive',
      priority:      ['Critical', 'High', 'Medium', 'Low'].includes(tc.priority) ? tc.priority : 'Medium',
      steps:         Array.isArray(tc.steps) ? tc.steps : [tc.steps || 'Execute test'],
      expected:      tc.expected || 'Expected behavior observed',
      playwrightKey: tc.playwrightKey || `tc_${idCounter}`,
      status:        'Not Executed',
      actual:        '',
      error:         '',
      duration:      null,
      screenshot:    null,
    });
    idCounter++;
  }

  return validated;
}

module.exports = { generate };
