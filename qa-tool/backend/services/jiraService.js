// ── JIRA Integration Service ──────────────────────────────────────────────────
// Auto-creates bugs from failed tests, links tickets back to test cases
const https = require('https');
const http  = require('http');

let config = null; // { baseUrl, email, apiToken, projectKey, issueType }

function setConfig(cfg) {
  config = cfg;
  return { success: true, configured: true };
}

function clearConfig() {
  config = null;
}

function isConfigured() {
  return !!(config && config.baseUrl && config.email && config.apiToken && config.projectKey);
}

function getStatus() {
  return {
    configured: isConfigured(),
    baseUrl: config?.baseUrl || null,
    projectKey: config?.projectKey || null,
    email: config?.email || null,
  };
}

/**
 * Test JIRA connection by fetching project info.
 */
async function testConnection() {
  if (!isConfigured()) throw new Error('JIRA not configured');
  const data = await jiraRequest('GET', `/rest/api/3/project/${config.projectKey}`);
  return { success: true, projectName: data.name, projectKey: data.key };
}

/**
 * Create JIRA issues for all failed test cases.
 * @param {Array} failedTests - Array of failed test case objects
 * @param {Object} context - { appUrl, environment, jobId, runConfig }
 * @returns {Array} Created issues with JIRA keys
 */
async function createBugsFromFailures(failedTests, context = {}) {
  if (!isConfigured()) return [];
  if (!failedTests || failedTests.length === 0) return [];

  const results = [];

  for (const tc of failedTests) {
    try {
      const severity = mapSeverity(tc.priority);
      const labels = [
        'qa-automation',
        `module-${(tc.module || 'unknown').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        `type-${(tc.type || 'unknown').toLowerCase()}`,
        `env-${(context.environment || 'qa').toLowerCase()}`,
      ];

      const description = buildDescription(tc, context);

      const issue = await jiraRequest('POST', '/rest/api/3/issue', {
        fields: {
          project:     { key: config.projectKey },
          issuetype:   { name: config.issueType || 'Bug' },
          summary:     `[QA Auto] ${tc.title}`,
          description: {
            type: 'doc',
            version: 1,
            content: description,
          },
          priority:    { name: severity },
          labels:      labels,
        },
      });

      results.push({
        testId:    tc.id,
        testTitle: tc.title,
        module:    tc.module,
        jiraKey:   issue.key,
        jiraUrl:   `${config.baseUrl}/browse/${issue.key}`,
        severity,
        status:    'Created',
      });
    } catch (err) {
      results.push({
        testId:    tc.id,
        testTitle: tc.title,
        module:    tc.module,
        jiraKey:   null,
        jiraUrl:   null,
        severity:  mapSeverity(tc.priority),
        status:    'Failed',
        error:     err.message,
      });
    }
  }

  return results;
}

/**
 * Update test cases array with JIRA ticket info.
 */
function linkTicketsToTestCases(testCases, jiraResults) {
  const ticketMap = {};
  for (const jr of jiraResults) {
    ticketMap[jr.testId] = jr;
  }

  return testCases.map(tc => {
    const ticket = ticketMap[tc.id];
    if (ticket && ticket.jiraKey) {
      return {
        ...tc,
        jiraKey:  ticket.jiraKey,
        jiraUrl:  ticket.jiraUrl,
        jiraStatus: ticket.status,
      };
    }
    return tc;
  });
}

// ── Build Atlassian Document Format description ──────────────────────────────
function buildDescription(tc, context) {
  const content = [];

  // Header
  content.push({
    type: 'heading', attrs: { level: 3 },
    content: [{ type: 'text', text: 'Bug Details' }],
  });

  // Info table
  const infoItems = [
    `Test ID: ${tc.id}`,
    `Module: ${tc.module}`,
    `Type: ${tc.type}`,
    `Priority: ${tc.priority}`,
    `App URL: ${context.appUrl || 'N/A'}`,
    `Environment: ${context.environment || 'QA'}`,
    `Job ID: ${context.jobId || 'N/A'}`,
  ];

  content.push({
    type: 'bulletList',
    content: infoItems.map(item => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
    })),
  });

  // Steps to reproduce
  if (tc.steps && tc.steps.length > 0) {
    content.push({
      type: 'heading', attrs: { level: 4 },
      content: [{ type: 'text', text: 'Steps to Reproduce' }],
    });
    content.push({
      type: 'orderedList',
      content: tc.steps.map(step => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }],
      })),
    });
  }

  // Expected
  content.push({
    type: 'heading', attrs: { level: 4 },
    content: [{ type: 'text', text: 'Expected Result' }],
  });
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: tc.expected || 'N/A' }],
  });

  // Actual
  content.push({
    type: 'heading', attrs: { level: 4 },
    content: [{ type: 'text', text: 'Actual Result' }],
  });
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: tc.actual || tc.error || 'Test assertion failed' }],
  });

  // Error
  if (tc.error) {
    content.push({
      type: 'heading', attrs: { level: 4 },
      content: [{ type: 'text', text: 'Error Details' }],
    });
    content.push({
      type: 'codeBlock', attrs: { language: 'text' },
      content: [{ type: 'text', text: tc.error }],
    });
  }

  // Footer
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: '---\nLogged by QA AI Testing Tool (Automated)', marks: [{ type: 'em' }] }],
  });

  return content;
}

// ── Map test priority to JIRA priority ───────────────────────────────────────
function mapSeverity(priority) {
  const map = {
    'Critical': 'Highest',
    'High':     'High',
    'Medium':   'Medium',
    'Low':      'Low',
  };
  return map[priority] || 'Medium';
}

// ── Generic JIRA API request ─────────────────────────────────────────────────
function jiraRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    const options = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        } else {
          let errMsg = `JIRA API ${res.statusCode}`;
          try {
            const errData = JSON.parse(data);
            errMsg = errData.errorMessages?.join(', ') || errData.errors ? JSON.stringify(errData.errors) : errMsg;
          } catch {}
          reject(new Error(errMsg));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('JIRA request timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = { setConfig, clearConfig, isConfigured, getStatus, testConnection, createBugsFromFailures, linkTicketsToTestCases };
