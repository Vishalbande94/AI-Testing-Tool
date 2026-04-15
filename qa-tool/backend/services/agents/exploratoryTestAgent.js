// ── Exploratory Test Agent ────────────────────────────────────────────────────
// Analyzes screenshots / video frames of an application screen using Claude Vision
// and generates comprehensive E2E test cases for exploratory testing.
const claudeClient = require('./claudeClient');

const SYSTEM_PROMPT = `You are a Senior QA Engineer & SDET with 10+ years of exploratory testing experience across Banking, Insurance, Telecom, and Investment Banking domains.

YOUR TASK: Analyze the provided screenshot(s) or video frame(s) of an application screen and generate comprehensive end-to-end test cases suitable for exploratory testing.

For each screen you see, you must:
1. IDENTIFY all UI elements (buttons, inputs, dropdowns, links, tables, modals, forms, navigation, etc.)
2. DETECT the page/module type (login, dashboard, form, listing, checkout, settings, etc.)
3. INFER the application domain if possible (banking, insurance, e-commerce, telecom, healthcare, generic)
4. GENERATE comprehensive test cases covering:
   - Happy path / positive flows
   - Negative / error scenarios
   - Boundary value testing
   - Field validation (required, format, length, type)
   - Navigation & routing
   - State transitions
   - Accessibility checks
   - Responsive / UI checks
   - Security considerations (XSS, injection, auth bypass)
   - Cross-browser / cross-device notes
   - Performance observations (heavy tables, lazy loading, etc.)
5. SUGGEST exploratory testing charters — time-boxed missions for manual exploration
6. IDENTIFY potential risks and areas needing deeper exploration

OUTPUT JSON SCHEMA:
{
  "screenAnalysis": {
    "pageType": "<detected page type>",
    "domain": "<detected domain or 'Generic'>",
    "title": "<descriptive title of what this screen shows>",
    "description": "<2-3 sentence description of the screen's purpose>",
    "uiElements": [
      {
        "type": "<button|input|dropdown|link|table|form|modal|nav|image|text|checkbox|radio|toggle|other>",
        "label": "<visible label or placeholder>",
        "purpose": "<what it likely does>",
        "testRelevance": "High" | "Medium" | "Low"
      }
    ]
  },
  "testCases": [
    {
      "id": "ET_001",
      "category": "Positive|Negative|Boundary|Validation|Navigation|Security|Accessibility|Performance|UI/UX|Integration",
      "title": "<concise test title>",
      "priority": "Critical|High|Medium|Low",
      "preconditions": "<what must be true before test>",
      "steps": [
        "Step 1: ...",
        "Step 2: ..."
      ],
      "expectedResult": "<what should happen>",
      "testData": "<suggested test data if applicable>",
      "notes": "<additional context or domain-specific considerations>"
    }
  ],
  "exploratoryCharters": [
    {
      "id": "EC_001",
      "mission": "<what to explore>",
      "timeBox": "<suggested duration e.g. 30 min>",
      "focus": "<specific area to focus on>",
      "risks": "<what might go wrong in this area>"
    }
  ],
  "riskAreas": [
    {
      "area": "<feature or element>",
      "risk": "<what could go wrong>",
      "severity": "Critical|High|Medium|Low",
      "suggestion": "<how to test this>"
    }
  ],
  "accessibilityNotes": ["<observation 1>", "<observation 2>"],
  "summary": {
    "totalTestCases": "<number>",
    "criticalTests": "<number>",
    "coverageAreas": ["<area1>", "<area2>"],
    "estimatedExplorationTime": "<e.g. 2-3 hours>",
    "overallRiskLevel": "High|Medium|Low"
  }
}`;

/**
 * Analyze screenshot(s) and generate exploratory test cases.
 * @param {Array<{type: string, data: string}>} images - Array of {type: 'image/png', data: base64string}
 * @param {Object} context - Additional context from user
 * @returns {Promise<Object>} Structured exploratory test plan
 */
async function analyzeScreenshots(images, context = {}) {
  const content = [];

  // Add each image
  images.forEach((img, idx) => {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.type,
        data: img.data,
      },
    });
    content.push({
      type: 'text',
      text: `[Screenshot ${idx + 1} of ${images.length}]`,
    });
  });

  // Add context message
  content.push({
    type: 'text',
    text: `CONTEXT:
- Application URL: ${context.appUrl || 'Not provided'}
- Application Name: ${context.appName || 'Not provided'}
- Module/Feature: ${context.module || 'Not specified'}
- Domain: ${context.domain || 'Auto-detect from screenshots'}
- Additional Notes: ${context.notes || 'None'}
- Number of screenshots: ${images.length}

Analyze ALL the screenshots thoroughly. Identify every UI element, every possible interaction, every edge case. Generate comprehensive E2E test cases that a QA engineer can use for exploratory testing. Be specific with test steps and expected results. Think like a 10-year veteran QA engineer who has seen bugs in production.`,
  });

  const result = await claudeClient.callJSON({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
    maxTokens: 8192,
    temperature: 0.3,
    model: 'claude-sonnet-4-20250514',
  });

  return result.data;
}

/**
 * Analyze video frames (extracted as images) and generate test cases.
 * @param {Array<{type: string, data: string}>} frames - Extracted video frames as base64 images
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Structured exploratory test plan
 */
async function analyzeVideoFrames(frames, context = {}) {
  // Video frames are treated the same as screenshots but with flow-awareness
  const enhancedContext = {
    ...context,
    notes: `${context.notes || ''} [These are frames extracted from a video recording showing a user flow. Pay attention to the SEQUENCE of screens to identify the complete user journey and generate test cases for the entire flow.]`.trim(),
  };
  return analyzeScreenshots(frames, enhancedContext);
}

module.exports = { analyzeScreenshots, analyzeVideoFrames };
