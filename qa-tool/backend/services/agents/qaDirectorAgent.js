// ── Senior QA Director Agent (20 Years Experience) ───────────────────────────
// Supervisor agent — reviews test plans and execution results
const claudeClient = require('./claudeClient');

const DIRECTOR_SYSTEM = `You are a Senior QA Director with 20 years of experience leading QA teams at:
- Goldman Sachs, JP Morgan (Investment Banking) — 6 years
- HDFC Bank, ICICI Bank (Retail & Corporate Banking) — 5 years
- Bajaj Allianz, ICICI Prudential (Insurance) — 4 years
- Vodafone, Bharti Airtel (Telecom) — 3 years
- Amazon, Flipkart (E-commerce) — 2 years

You have managed 50+ member QA teams, owned test programs for applications processing billions in transactions, and directly reported to CTO/VP Engineering. You follow IEEE 829, ISTQB best practices, and have deep knowledge of OWASP, PCI-DSS, SOX, GDPR compliance testing.

OUTPUT: Always respond with ONLY valid JSON matching the requested schema. No markdown, no code fences.`;

const REVIEW_PLAN_PROMPT = `TASK: Review the test plan before execution.

Analyze the test cases against the requirements and provide your expert assessment.

OUTPUT JSON SCHEMA:
{
  "verdict": "Approved" | "Approved with Concerns" | "Needs Revision",
  "coverageScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<what the test plan does well>"],
  "gaps": [
    {
      "area": "<untested area>",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "description": "<what's missing and why it matters>"
    }
  ],
  "riskFlags": [
    {
      "risk": "<what could go wrong>",
      "impact": "Critical" | "High" | "Medium" | "Low",
      "mitigation": "<suggested action>"
    }
  ],
  "domainInsights": ["<domain-specific advice based on the application type>"],
  "suggestedAdditionalTests": [
    {
      "title": "<test title>",
      "module": "<module name>",
      "priority": "Critical" | "High" | "Medium",
      "rationale": "<why this test is needed>"
    }
  ],
  "complianceNotes": ["<any regulatory/compliance considerations>"],
  "estimatedDefectYield": "<Low|Medium|High — how many defects this test suite is likely to find>"
}`;

const REVIEW_RESULTS_PROMPT = `TASK: Review execution results and provide deployment readiness assessment.

Analyze test results with your 20 years of experience. Distinguish between real bugs, environment issues, and test infrastructure problems.

OUTPUT JSON SCHEMA:
{
  "overallRisk": "Low" | "Medium" | "High" | "Critical",
  "signOff": <boolean — true if ready for deployment>,
  "summary": "<2-3 sentence executive summary for stakeholders>",
  "failureAnalysis": [
    {
      "testId": "<TC_XXX>",
      "testTitle": "<title>",
      "rootCause": "<likely cause based on error message>",
      "category": "Application Bug" | "Test Infrastructure" | "Environment Issue" | "Data Issue",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "recommendation": "<specific fix suggestion>"
    }
  ],
  "recommendations": [
    {
      "category": "Immediate" | "Next Sprint" | "Backlog",
      "action": "<specific actionable recommendation>",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "owner": "Dev Team" | "QA Team" | "DevOps" | "Product"
    }
  ],
  "riskAssessment": {
    "deploymentReady": <boolean>,
    "blockers": ["<list of blocking issues>"],
    "concerns": ["<non-blocking concerns>"],
    "passedAreas": ["<modules that passed well>"]
  },
  "qualityMetrics": {
    "testEffectiveness": "Excellent" | "Good" | "Moderate" | "Poor",
    "coverageAdequacy": "Excellent" | "Good" | "Moderate" | "Poor",
    "defectDensity": "Low" | "Medium" | "High",
    "automationReliability": "Excellent" | "Good" | "Moderate" | "Poor"
  },
  "executiveBrief": "<1 paragraph summary suitable for VP/CTO email>"
}`;

/**
 * Review test plan before execution.
 */
async function reviewTestPlan(requirementText, testCases, config = {}) {
  const tcSummary = testCases.map(tc => ({
    id: tc.id, module: tc.module, title: tc.title,
    type: tc.type, priority: tc.priority, steps: tc.steps, expected: tc.expected,
  }));

  const modules = [...new Set(testCases.map(tc => tc.module))];

  const userMessage = `REQUIREMENTS:
${requirementText.slice(0, 30000)}

TEST PLAN TO REVIEW:
- Total test cases: ${testCases.length}
- Modules covered: ${modules.join(', ')}
- Test scope: ${config.testScope || 'regression'}
- Environment: ${config.environment || 'QA'}
- Priority filter: ${config.priorityFilter || 'all'}

TEST CASES:
${JSON.stringify(tcSummary, null, 2)}

Review this test plan with your 20 years of experience. Be specific and actionable.`;

  const result = await claudeClient.callJSON({
    system: DIRECTOR_SYSTEM + '\n\n' + REVIEW_PLAN_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 4096,
    temperature: 0.3,
  });

  return result.data;
}

/**
 * Review execution results and provide deployment readiness assessment.
 */
async function reviewResults(testCases, executionStats, appUrl, config = {}) {
  const failedTests = testCases.filter(tc => tc.status === 'Fail').map(tc => ({
    id: tc.id, title: tc.title, module: tc.module,
    error: tc.error, actual: tc.actual, expected: tc.expected,
  }));

  const passedModules = [...new Set(testCases.filter(tc => tc.status === 'Pass').map(tc => tc.module))];
  const failedModules = [...new Set(testCases.filter(tc => tc.status === 'Fail').map(tc => tc.module))];

  const userMessage = `EXECUTION RESULTS:
- Application URL: ${appUrl}
- Environment: ${config.environment || 'QA'}
- Total: ${executionStats.total} | Passed: ${executionStats.passed} | Failed: ${executionStats.failed} | Skipped: ${executionStats.skipped || 0}
- Pass Rate: ${executionStats.passRate}%
- Duration: ${executionStats.duration}s
- Browsers: ${(config.browsers || ['chromium']).join(', ')}

PASSED MODULES: ${passedModules.join(', ') || 'None'}
FAILED MODULES: ${failedModules.join(', ') || 'None'}

FAILED TEST DETAILS:
${JSON.stringify(failedTests, null, 2)}

ALL TEST RESULTS:
${JSON.stringify(testCases.map(tc => ({ id: tc.id, title: tc.title, module: tc.module, status: tc.status, error: tc.error || '' })), null, 2)}

Analyze these results. Determine root causes for failures. Assess deployment readiness.`;

  const result = await claudeClient.callJSON({
    system: DIRECTOR_SYSTEM + '\n\n' + REVIEW_RESULTS_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 4096,
    temperature: 0.3,
  });

  return result.data;
}

module.exports = { reviewTestPlan, reviewResults };
