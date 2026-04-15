// ── Exploratory Testing Fallback Generator ────────────────────────────────────
// Generates template-based exploratory test cases when AI is not configured.
// Uses context (module, domain, notes) + common UI patterns to produce a solid
// baseline test plan.

function generateTemplate(context = {}, fileCount = 1) {
  const module  = (context.module || 'Application Screen').trim();
  const domain  = (context.domain || 'Generic').trim();
  const appName = (context.appName || 'Application').trim();
  const appUrl  = context.appUrl || '';
  const notes   = context.notes || '';

  // Domain-specific considerations
  const domainChecks = getDomainChecks(domain);

  const testCases = [
    // ── Positive flows ────────────────────────────────────────────
    {
      id: 'ET_001',
      category: 'Positive',
      title: `Verify ${module} loads successfully with all expected UI elements`,
      priority: 'Critical',
      preconditions: `User has valid access to ${appName}`,
      steps: [
        `Navigate to ${appUrl || 'the application URL'}`,
        `Access the ${module} screen`,
        'Observe all UI elements (headers, buttons, inputs, tables, navigation)',
        'Verify page title and branding are correct',
      ],
      expectedResult: `${module} page loads within 3 seconds with all UI elements rendered correctly, no console errors`,
      testData: 'Valid user credentials',
      notes: 'Baseline smoke test',
    },
    {
      id: 'ET_002',
      category: 'Positive',
      title: `Verify all interactive elements on ${module} are clickable/usable`,
      priority: 'High',
      preconditions: `${module} page is loaded`,
      steps: [
        'Identify all buttons, links, dropdowns, and form fields',
        'Click each button and verify expected action',
        'Interact with each dropdown and verify options load',
        'Type in each input field and verify input is accepted',
      ],
      expectedResult: 'Every interactive element responds correctly with no errors',
      testData: 'N/A',
      notes: 'Covers general element usability',
    },

    // ── Negative / validation ──────────────────────────────────────
    {
      id: 'ET_003',
      category: 'Negative',
      title: 'Verify error handling for invalid inputs',
      priority: 'High',
      preconditions: `${module} has input fields`,
      steps: [
        'Enter invalid data in each field (special chars, too long, wrong format)',
        'Submit the form',
        'Observe error messages',
      ],
      expectedResult: 'Clear, user-friendly error messages appear near the relevant field; form does not submit',
      testData: 'Invalid emails, phone numbers, dates, special chars (< > " \' & ;)',
      notes: 'Covers client-side validation',
    },
    {
      id: 'ET_004',
      category: 'Validation',
      title: 'Verify required field validation',
      priority: 'High',
      preconditions: `${module} has a form with required fields`,
      steps: [
        'Leave all required fields empty',
        'Attempt to submit the form',
        'Verify validation messages',
        'Fill one field at a time and re-submit',
      ],
      expectedResult: 'All required fields show validation errors when empty; error clears once field is filled',
      testData: 'Empty values',
      notes: 'Covers mandatory field enforcement',
    },
    {
      id: 'ET_005',
      category: 'Boundary',
      title: 'Verify boundary value handling for input fields',
      priority: 'Medium',
      preconditions: `${module} has fields with length/value limits`,
      steps: [
        'Enter minimum allowed value',
        'Enter maximum allowed value',
        'Enter value just below minimum',
        'Enter value just above maximum',
      ],
      expectedResult: 'Boundary values are accepted; out-of-range values show clear error messages',
      testData: 'Min-1, Min, Max, Max+1 values',
      notes: 'Classic boundary value analysis',
    },

    // ── Security ──────────────────────────────────────────────────
    {
      id: 'ET_006',
      category: 'Security',
      title: 'Verify XSS protection in input fields',
      priority: 'Critical',
      preconditions: `${module} has text input fields`,
      steps: [
        'Enter XSS payload: <script>alert("XSS")</script>',
        'Enter HTML tags: <img src=x onerror=alert(1)>',
        'Submit and observe display',
      ],
      expectedResult: 'Scripts do not execute; input is sanitized/escaped when displayed',
      testData: 'XSS payloads, HTML injection strings',
      notes: 'OWASP Top 10 — XSS',
    },
    {
      id: 'ET_007',
      category: 'Security',
      title: 'Verify SQL injection protection',
      priority: 'Critical',
      preconditions: `${module} has input fields that query backend`,
      steps: [
        "Enter SQL injection: ' OR '1'='1",
        'Enter: admin\'--',
        'Submit and observe results',
      ],
      expectedResult: 'Backend rejects malicious input; no sensitive data exposure',
      testData: 'SQL injection payloads',
      notes: 'OWASP Top 10 — Injection',
    },
    {
      id: 'ET_008',
      category: 'Security',
      title: 'Verify authentication & authorization',
      priority: 'Critical',
      preconditions: 'Application requires authentication',
      steps: [
        'Attempt to access protected pages without login',
        'Login with valid credentials',
        'Logout and try to access protected pages again',
        'Try accessing other user\'s data by manipulating URL/IDs',
      ],
      expectedResult: 'Unauthorized access is blocked; session is properly invalidated on logout',
      testData: 'Valid/invalid credentials, manipulated URLs',
      notes: 'OWASP Top 10 — Broken Access Control',
    },

    // ── Navigation ────────────────────────────────────────────────
    {
      id: 'ET_009',
      category: 'Navigation',
      title: `Verify navigation from and to ${module}`,
      priority: 'High',
      preconditions: 'User is authenticated',
      steps: [
        `Navigate to ${module} via menu`,
        `Navigate to ${module} via direct URL`,
        'Click browser back button',
        'Click browser forward button',
        'Refresh the page (F5)',
      ],
      expectedResult: 'Navigation works correctly in all directions; state is preserved on refresh',
      testData: 'N/A',
      notes: 'Covers browser history & state preservation',
    },

    // ── Accessibility ─────────────────────────────────────────────
    {
      id: 'ET_010',
      category: 'Accessibility',
      title: 'Verify keyboard navigation (WCAG 2.1)',
      priority: 'Medium',
      preconditions: `${module} is loaded`,
      steps: [
        'Press Tab to navigate through all interactive elements',
        'Press Shift+Tab to navigate backward',
        'Press Enter/Space on buttons',
        'Verify focus indicators are visible',
      ],
      expectedResult: 'All elements are reachable via keyboard; focus order is logical; focus indicators are visible',
      testData: 'N/A',
      notes: 'WCAG 2.1 AA compliance',
    },
    {
      id: 'ET_011',
      category: 'Accessibility',
      title: 'Verify screen reader compatibility',
      priority: 'Medium',
      preconditions: `${module} is loaded with NVDA/JAWS enabled`,
      steps: [
        'Navigate through page using screen reader',
        'Verify all buttons have accessible names',
        'Verify all images have alt text',
        'Verify form fields have labels',
      ],
      expectedResult: 'Screen reader announces all elements meaningfully',
      testData: 'N/A',
      notes: 'WCAG 2.1 AA — Perceivable',
    },

    // ── Performance ───────────────────────────────────────────────
    {
      id: 'ET_012',
      category: 'Performance',
      title: `Verify ${module} page load performance`,
      priority: 'Medium',
      preconditions: 'Browser DevTools open, Network tab active',
      steps: [
        'Clear cache and reload page',
        'Measure Time to First Byte (TTFB)',
        'Measure First Contentful Paint (FCP)',
        'Measure Largest Contentful Paint (LCP)',
        'Check total page weight and request count',
      ],
      expectedResult: 'LCP < 2.5s, FCP < 1.8s, page weight < 2MB',
      testData: 'Throttled 3G network for worst-case test',
      notes: 'Core Web Vitals compliance',
    },

    // ── UI/UX ─────────────────────────────────────────────────────
    {
      id: 'ET_013',
      category: 'UI/UX',
      title: 'Verify responsive design across viewports',
      priority: 'High',
      preconditions: `${module} is accessible`,
      steps: [
        'Test on desktop (1920x1080)',
        'Test on laptop (1366x768)',
        'Test on tablet (768x1024 portrait & landscape)',
        'Test on mobile (375x667, 414x896)',
      ],
      expectedResult: 'Layout adapts correctly; no horizontal scrolling; all elements remain usable',
      testData: 'Multiple viewport sizes',
      notes: 'Responsive breakpoints verification',
    },
    {
      id: 'ET_014',
      category: 'UI/UX',
      title: 'Verify cross-browser compatibility',
      priority: 'High',
      preconditions: `${module} is accessible`,
      steps: [
        'Test on Chrome (latest)',
        'Test on Firefox (latest)',
        'Test on Edge (latest)',
        'Test on Safari (if applicable)',
      ],
      expectedResult: 'Consistent behavior and appearance across all browsers',
      testData: 'N/A',
      notes: 'Cross-browser compatibility',
    },

    // ── Integration ───────────────────────────────────────────────
    {
      id: 'ET_015',
      category: 'Integration',
      title: `Verify ${module} handles network errors gracefully`,
      priority: 'High',
      preconditions: 'Browser DevTools open',
      steps: [
        'Set network to Offline',
        'Attempt to perform actions',
        'Set network to Slow 3G',
        'Re-attempt actions',
      ],
      expectedResult: 'Clear error messages shown; app does not crash; retries gracefully',
      testData: 'N/A',
      notes: 'Network resilience',
    },

    // ── Additional Security ───────────────────────────────────────
    {
      id: 'ET_016',
      category: 'Security',
      title: 'Verify CSRF protection on state-changing requests',
      priority: 'Critical',
      preconditions: 'Authenticated session',
      steps: [
        'Capture a state-changing POST/PUT/DELETE request in DevTools',
        'Replay the request without the CSRF token (or from a different origin)',
        'Observe server response',
      ],
      expectedResult: 'Request is rejected with HTTP 403; SameSite cookies or CSRF token are required',
      testData: 'Origin: evil.example.com',
      notes: 'OWASP A01 — Broken Access Control; paired with SameSite=Lax/Strict cookies',
    },
    {
      id: 'ET_017',
      category: 'Security',
      title: 'Verify security response headers are present',
      priority: 'High',
      preconditions: 'Browser DevTools — Network tab',
      steps: [
        'Load the main document',
        'Inspect response headers',
        'Check: Strict-Transport-Security, X-Content-Type-Options, Content-Security-Policy, X-Frame-Options (or frame-ancestors), Referrer-Policy, Permissions-Policy',
      ],
      expectedResult: 'All 6 security headers are present with safe values',
      testData: 'N/A',
      notes: 'HTTPS + HSTS + CSP baseline',
    },
    {
      id: 'ET_018',
      category: 'Security',
      title: 'Verify rate limiting on authentication endpoints',
      priority: 'High',
      preconditions: 'Login endpoint accessible',
      steps: [
        'Issue 10+ failed login attempts in succession',
        'Observe server response on subsequent attempts',
      ],
      expectedResult: 'After threshold, HTTP 429 or account-locked response is returned',
      testData: 'Same email, rotating wrong passwords',
      notes: 'Brute-force mitigation',
    },

    // ── Concurrency & State ───────────────────────────────────────
    {
      id: 'ET_019',
      category: 'Negative',
      title: 'Verify no duplicate submissions on rapid double-click',
      priority: 'High',
      preconditions: `${module} has a submission form`,
      steps: [
        'Fill a create/pay/transfer form',
        'Click Submit twice in ≤200ms',
        'Check backend for duplicate records',
      ],
      expectedResult: 'Exactly one record created; button disables on first click or server uses idempotency key',
      testData: 'Any valid payload',
      notes: 'Common bug — leads to double-charges in payment flows',
    },
    {
      id: 'ET_020',
      category: 'Negative',
      title: 'Verify optimistic locking on concurrent edits',
      priority: 'Medium',
      preconditions: 'Same record editable by multiple users/tabs',
      steps: [
        'Open the same record in Tab A and Tab B',
        'Edit field X in A and save',
        'Edit field Y in B and save without refreshing',
      ],
      expectedResult: 'Tab B sees a stale-data warning or field-merge dialog — no silent overwrite',
      testData: 'N/A',
      notes: 'Lost-update problem',
    },

    // ── API / Data Integrity ──────────────────────────────────────
    {
      id: 'ET_021',
      category: 'Integration',
      title: 'Verify API response schema stability',
      priority: 'Medium',
      preconditions: 'Browser DevTools — Network',
      steps: [
        'Trigger a representative API call',
        'Capture the JSON response',
        'Compare structure against documented schema / OpenAPI spec',
      ],
      expectedResult: 'All required fields present with correct types; no unexpected nulls',
      testData: 'N/A',
      notes: 'Schema drift is a common silent-breakage source',
    },

    // ── Domain-specific (appended based on domain) ────────────────
    ...domainChecks,
  ];

  const charters = [
    {
      id: 'EC_001',
      mission: `Explore all error paths in ${module}`,
      timeBox: '45 min',
      focus: 'Invalid inputs, broken flows, network errors, permission issues',
      risks: 'Users may encounter unhelpful error messages or data loss',
    },
    {
      id: 'EC_002',
      mission: `Test ${module} under load and edge conditions`,
      timeBox: '30 min',
      focus: 'Large datasets, rapid clicking, concurrent tabs, long sessions',
      risks: 'Performance degradation, memory leaks, state corruption',
    },
    {
      id: 'EC_003',
      mission: `Accessibility audit of ${module}`,
      timeBox: '30 min',
      focus: 'Keyboard nav, screen reader, color contrast, WCAG 2.1 AA',
      risks: 'Non-compliance could result in lawsuits and loss of users',
    },
    {
      id: 'EC_004',
      mission: `Security exploration of ${module}`,
      timeBox: '60 min',
      focus: 'XSS, SQL injection, auth bypass, CSRF, sensitive data exposure',
      risks: 'Data breaches, account takeovers, regulatory penalties',
    },
    {
      id: 'EC_005',
      mission: `Cross-device & cross-browser exploration`,
      timeBox: '45 min',
      focus: 'Mobile, tablet, desktop across Chrome/Firefox/Safari/Edge',
      risks: 'Broken layouts or functionality on less-tested browsers/devices',
    },
    {
      id: 'EC_006',
      mission: `Concurrency & race-condition exploration of ${module}`,
      timeBox: '45 min',
      focus: 'Double-submit, two-tab edits, session expiry mid-action, back-button replay',
      risks: 'Double-charges, lost updates, stale-data corruption',
    },
    {
      id: 'EC_007',
      mission: `API contract & integration exploration`,
      timeBox: '45 min',
      focus: 'Request/response schema, auth headers, pagination, rate limits, error bodies',
      risks: 'Silent schema drift, missing auth enforcement, unbounded lists',
    },
  ];

  const riskAreas = [
    {
      area: 'Input Validation',
      risk: 'Insufficient validation could allow malicious data or corrupt state',
      severity: 'High',
      suggestion: 'Test all input fields with XSS, SQL injection, and boundary values',
    },
    {
      area: 'Session Management',
      risk: 'Weak session handling could lead to account takeover',
      severity: 'Critical',
      suggestion: 'Verify session expiry, logout behavior, and concurrent login handling',
    },
    {
      area: 'Error Handling',
      risk: 'Poor error messages may confuse users or expose sensitive info',
      severity: 'Medium',
      suggestion: 'Test all failure scenarios — network, backend 500, timeouts, validation errors',
    },
    {
      area: 'Performance on Slow Networks',
      risk: 'App may be unusable on 3G / high-latency networks',
      severity: 'Medium',
      suggestion: 'Test with DevTools network throttling at 3G speeds',
    },
    ...(domain !== 'Generic' ? getDomainRisks(domain) : []),
  ];

  const accessibilityNotes = [
    'Verify all form inputs have associated <label> elements',
    'Ensure color contrast ratios meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)',
    'Ensure all interactive elements are reachable via keyboard',
    'Verify focus indicators are clearly visible',
    'Check that images have meaningful alt attributes',
    'Verify ARIA roles/labels on custom components',
  ];

  const critical = testCases.filter(t => t.priority === 'Critical').length;

  return {
    screenAnalysis: {
      pageType: module,
      domain,
      title: `${module} — ${appName}`,
      description: `Template-based exploratory test plan for ${module} in ${appName} (${domain} domain). ${notes ? 'Notes: ' + notes : ''} Analysis generated without AI vision — upload context and configure Claude API key for screen-specific, AI-powered analysis.`,
      uiElements: [
        { type: 'button',   label: 'Primary action button(s)', purpose: 'Submit / confirm user actions', testRelevance: 'High' },
        { type: 'input',    label: 'Text / number / email inputs', purpose: 'Capture user data', testRelevance: 'High' },
        { type: 'dropdown', label: 'Select fields',             purpose: 'Select from predefined options', testRelevance: 'High' },
        { type: 'link',     label: 'Navigation links',          purpose: 'Move between pages/sections', testRelevance: 'Medium' },
        { type: 'form',     label: 'Form container(s)',         purpose: 'Group related inputs for submission', testRelevance: 'High' },
        { type: 'table',    label: 'Data table(s)',             purpose: 'Display records', testRelevance: 'Medium' },
        { type: 'nav',      label: 'Navigation bar / menu',     purpose: 'Global navigation', testRelevance: 'Medium' },
      ],
    },
    testCases,
    exploratoryCharters: charters,
    riskAreas,
    accessibilityNotes,
    summary: {
      totalTestCases: testCases.length,
      criticalTests: critical,
      coverageAreas: ['Positive', 'Negative', 'Validation', 'Boundary', 'Security', 'Accessibility', 'Performance', 'Navigation', 'UI/UX', 'Integration'],
      estimatedExplorationTime: '3-4 hours',
      overallRiskLevel: 'Medium',
    },
    _fallback: true,
  };
}

// ── Domain-specific test case additions ──────────────────────────────────────
function getDomainChecks(domain) {
  const base = {
    Banking: [
      {
        id: 'ET_D01',
        category: 'Positive',
        title: 'Verify fund transfer limits (daily/per-transaction)',
        priority: 'Critical',
        preconditions: 'User has sufficient balance',
        steps: ['Initiate transfer below daily limit', 'Initiate transfer at exact limit', 'Initiate transfer exceeding limit'],
        expectedResult: 'Transfers within limits succeed; over-limit transfers are blocked with clear message',
        testData: 'Transfer amounts around daily/per-txn limits',
        notes: 'Banking compliance — transaction limits',
      },
      {
        id: 'ET_D02',
        category: 'Validation',
        title: 'Verify interest calculation accuracy',
        priority: 'Critical',
        preconditions: 'Account with known principal and rate',
        steps: ['Fetch account details', 'Verify simple interest', 'Verify compound interest', 'Verify reducing balance (loans)'],
        expectedResult: 'Interest matches formula within rounding tolerance',
        testData: 'Known principal amounts and rates',
        notes: 'Financial accuracy is critical',
      },
    ],
    Insurance: [
      {
        id: 'ET_D01',
        category: 'Positive',
        title: 'Verify premium calculation for different risk profiles',
        priority: 'Critical',
        preconditions: 'Policy creation screen available',
        steps: ['Create policy for low-risk profile', 'Create policy for high-risk profile', 'Verify premium values'],
        expectedResult: 'Premium calculated correctly per underwriting rules',
        testData: 'Varying age, sum insured, coverage type',
        notes: 'Premium accuracy — regulatory requirement',
      },
      {
        id: 'ET_D02',
        category: 'Positive',
        title: 'Verify claims workflow end-to-end',
        priority: 'Critical',
        preconditions: 'Active policy exists',
        steps: ['Submit FNOL', 'Upload documents', 'Track claim status', 'Receive payment'],
        expectedResult: 'Claim moves through all states correctly with proper notifications',
        testData: 'Valid claim details',
        notes: 'FNOL → assessment → approval → payment',
      },
    ],
    Telecom: [
      {
        id: 'ET_D01',
        category: 'Positive',
        title: 'Verify billing accuracy for different tariff plans',
        priority: 'Critical',
        preconditions: 'Customer has known plan & usage',
        steps: ['Fetch customer usage', 'Apply rating rules', 'Verify bill total'],
        expectedResult: 'Bill matches expected calculation per tariff',
        testData: 'Prepaid and postpaid customers',
        notes: 'Billing accuracy',
      },
    ],
    'Investment Banking': [
      {
        id: 'ET_D01',
        category: 'Positive',
        title: 'Verify trade settlement dates (T+1, T+2)',
        priority: 'Critical',
        preconditions: 'Trade executed',
        steps: ['Execute trade', 'Verify settlement date calculated correctly', 'Handle weekends/holidays'],
        expectedResult: 'Settlement date respects T+N convention with business-day calendar',
        testData: 'Trades on various weekdays',
        notes: 'Regulatory compliance — MiFID II / Dodd-Frank',
      },
    ],
    'E-commerce': [
      {
        id: 'ET_D01',
        category: 'Positive',
        title: 'Verify checkout flow end-to-end',
        priority: 'Critical',
        preconditions: 'Cart has items',
        steps: ['Proceed to checkout', 'Enter shipping address', 'Select payment method', 'Complete payment'],
        expectedResult: 'Order placed successfully with confirmation email',
        testData: 'Test cards, various shipping addresses',
        notes: 'Revenue-critical flow',
      },
    ],
  };
  return base[domain] || [];
}

function getDomainRisks(domain) {
  const base = {
    Banking: [{ area: 'Transaction Limits', risk: 'Bypassing daily/per-txn limits could enable fraud', severity: 'Critical', suggestion: 'Test boundaries and concurrent transactions' }],
    Insurance: [{ area: 'Premium Calculation', risk: 'Incorrect premiums could cause regulatory fines', severity: 'Critical', suggestion: 'Verify underwriting rules across all profiles' }],
    Telecom: [{ area: 'Billing Accuracy', risk: 'Billing errors result in customer complaints and revenue leakage', severity: 'High', suggestion: 'Test all tariff plans and edge cases' }],
    'Investment Banking': [{ area: 'Settlement Dates', risk: 'Incorrect settlement could cause regulatory violations', severity: 'Critical', suggestion: 'Verify T+N across holidays & weekends' }],
    'E-commerce': [{ area: 'Payment Processing', risk: 'Payment failures directly impact revenue', severity: 'Critical', suggestion: 'Test all payment methods, decline scenarios, retries' }],
  };
  return base[domain] || [];
}

module.exports = { generateTemplate };
