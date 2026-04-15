// ── Report Analyst Agent (8 Years Experience) ────────────────────────────────
// Writes executive-quality reports and JIRA-ready bug descriptions
const claudeClient = require('./claudeClient');

const SYSTEM_PROMPT = `You are a Senior QA Report Analyst with 8 years of experience writing test reports for executive stakeholders at banking, insurance, and tech companies. You've written reports reviewed by CTOs, VPs, and audit committees.

YOUR WRITING STYLE:
- Clear, professional, no jargon unless necessary
- Lead with impact, not technical details
- Use data to support every claim
- Executive summary should be readable by a non-technical VP
- Bug reports should be copy-paste ready for JIRA/Azure DevOps

OUTPUT: Always respond with ONLY valid JSON matching the requested schema.`;

const REPORT_PROMPT = `TASK: Generate a comprehensive test execution report with narrative analysis and actionable bug reports.

OUTPUT JSON SCHEMA:
{
  "executiveSummary": {
    "headline": "<one-line headline for email subject>",
    "status": "GREEN" | "AMBER" | "RED",
    "narrative": "<3-5 sentence executive summary suitable for VP/CTO>",
    "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
    "recommendation": "<1 sentence — what should happen next>"
  },
  "testNarrative": {
    "overview": "<paragraph describing what was tested and how>",
    "passHighlights": "<paragraph about what worked well>",
    "failureNarrative": "<paragraph about what failed and likely why>",
    "environmentNotes": "<any observations about the test environment>"
  },
  "bugReports": [
    {
      "id": "BUG_001",
      "title": "<JIRA-ready bug title — clear, specific>",
      "severity": "Blocker" | "Critical" | "Major" | "Minor" | "Trivial",
      "priority": "P1" | "P2" | "P3" | "P4",
      "type": "Functional Bug" | "UI Bug" | "Performance Bug" | "Security Bug" | "Usability Bug",
      "module": "<affected module>",
      "stepsToReproduce": ["<step 1>", "<step 2>", "<step 3>"],
      "expectedResult": "<what should happen>",
      "actualResult": "<what actually happened>",
      "environment": "<browser, OS, env>",
      "attachments": "<what to attach — screenshot, logs, etc>",
      "suggestedFix": "<developer hint if obvious from the error>",
      "relatedTestIds": ["TC_XXX"]
    }
  ],
  "moduleAnalysis": [
    {
      "module": "<module name>",
      "status": "PASS" | "PARTIAL" | "FAIL",
      "narrative": "<1-2 sentence analysis of this module>",
      "passRate": <number>,
      "riskLevel": "Low" | "Medium" | "High",
      "actionNeeded": "<what needs to happen for this module>"
    }
  ],
  "trendAnalysis": "<if history data available, analyze trends — improving/degrading/stable>",
  "nextSteps": [
    {
      "action": "<specific action>",
      "owner": "Dev" | "QA" | "DevOps" | "Product",
      "timeline": "Immediate" | "This Sprint" | "Next Sprint" | "Backlog",
      "reason": "<why this matters>"
    }
  ],
  "signOffStatement": "<formal sign-off statement or reason for withholding>"
}`;

/**
 * Generate executive-quality report with bug descriptions.
 * @param {Object} params
 * @returns {Promise<Object>} Report analysis data
 */
async function generateReport({ testCases, executionStats, appUrl, runConfig, requirementAnalysis, testPlanReview, resultsReview, runHistory }) {
  const failedTests = testCases.filter(tc => tc.status === 'Fail').map(tc => ({
    id: tc.id, title: tc.title, module: tc.module, type: tc.type,
    priority: tc.priority, steps: tc.steps, expected: tc.expected,
    actual: tc.actual, error: tc.error, duration: tc.duration,
  }));

  const passedTests = testCases.filter(tc => tc.status === 'Pass');
  const modules = [...new Set(testCases.map(tc => tc.module))];
  const moduleStats = modules.map(mod => {
    const modTests = testCases.filter(tc => tc.module === mod);
    const passed = modTests.filter(tc => tc.status === 'Pass').length;
    return { module: mod, total: modTests.length, passed, failed: modTests.length - passed, passRate: Math.round(passed / modTests.length * 100) };
  });

  const userMessage = `TEST EXECUTION DATA:
- Application: ${appUrl}
- Environment: ${runConfig?.environment || 'QA'}
- Browsers: ${(runConfig?.browsers || ['chromium']).join(', ')}
- Total: ${executionStats.total} | Passed: ${executionStats.passed} | Failed: ${executionStats.failed}
- Pass Rate: ${executionStats.passRate}%
- Duration: ${executionStats.duration}s
- Test Scope: ${runConfig?.testScope || 'regression'}

${requirementAnalysis ? `DOMAIN: ${requirementAnalysis.domain} (${requirementAnalysis.domainConfidence}% confidence)` : ''}

MODULE RESULTS:
${JSON.stringify(moduleStats, null, 2)}

FAILED TESTS (need bug reports):
${JSON.stringify(failedTests, null, 2)}

PASSED TESTS (${passedTests.length}):
${passedTests.map(tc => `${tc.id}: ${tc.title} (${tc.module})`).join('\n')}

${testPlanReview ? `QA DIRECTOR TEST PLAN REVIEW:\nVerdict: ${testPlanReview.verdict} | Coverage: ${testPlanReview.coverageScore}%` : ''}

${resultsReview ? `QA DIRECTOR RESULTS REVIEW:\nRisk: ${resultsReview.overallRisk} | Sign-off: ${resultsReview.signOff}` : ''}

${runHistory && runHistory.length > 1 ? `RECENT RUN HISTORY (for trend):\n${runHistory.slice(0, 5).map(r => `${r.timestamp?.slice(0,10)} — ${r.passRate}% (${r.total} tests)`).join('\n')}` : ''}

Write a comprehensive test report. Create JIRA-ready bug reports for every failure. Be specific and actionable.`;

  const result = await claudeClient.callJSON({
    system: SYSTEM_PROMPT + '\n\n' + REPORT_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.3,
  });

  return result.data;
}

module.exports = { generateReport };
