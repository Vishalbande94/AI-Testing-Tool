// ── Rule-Based Test Case Generator ───────────────────────────────────────────
// No external AI required. Uses keyword detection + rule mapping.

/**
 * Test rule definitions.
 * Each rule = { keywords[], module, tests[] }
 * Each test  = { idSuffix, title, type, priority, steps[], expected, playwrightKey }
 */
const TEST_RULES = [
  // ── LOGIN ──────────────────────────────────────────────────────────────────
  {
    keywords: ['login', 'sign in', 'signin', 'log in', 'authentication', 'authenticate'],
    module:   'Authentication — Login',
    icon:     '🔐',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Login with valid credentials',
        type:          'Positive',
        priority:      'Critical',
        steps: [
          'Navigate to the application URL',
          'Locate the login page/link',
          'Enter a valid registered email address',
          'Enter the correct password',
          'Click the Login / Sign In button',
        ],
        expected:      'User is authenticated and redirected to dashboard or home page',
        playwrightKey: 'login_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Login with incorrect password',
        type:          'Negative',
        priority:      'High',
        steps: [
          'Navigate to the login page',
          'Enter a valid registered email address',
          'Enter an incorrect/wrong password',
          'Click the Login button',
        ],
        expected:      'Error message displayed: "Invalid credentials" or similar. User stays on login page.',
        playwrightKey: 'login_negative_pwd',
      },
      {
        idSuffix:      'E01',
        title:         'Login with empty fields',
        type:          'Edge',
        priority:      'High',
        steps: [
          'Navigate to the login page',
          'Leave email and password fields empty',
          'Click the Login button',
        ],
        expected:      'Inline validation errors shown for required fields. Form not submitted.',
        playwrightKey: 'login_edge_empty',
      },
    ],
  },

  // ── REGISTRATION ──────────────────────────────────────────────────────────
  {
    keywords: ['register', 'registration', 'signup', 'sign up', 'create account', 'new account'],
    module:   'User Registration',
    icon:     '📝',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Register a new user with valid details',
        type:          'Positive',
        priority:      'Critical',
        steps: [
          'Navigate to the registration/signup page',
          'Fill in all required fields with valid data (name, email, mobile, password)',
          'Ensure password meets strength requirements',
          'Click the Register / Sign Up button',
        ],
        expected:      'Account created successfully. Confirmation message shown or user redirected to dashboard.',
        playwrightKey: 'register_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Register with an already-registered email',
        type:          'Negative',
        priority:      'High',
        steps: [
          'Navigate to the registration page',
          'Enter an email address that is already registered',
          'Fill remaining fields with valid data',
          'Click Register button',
        ],
        expected:      'Error: "Email already in use" or similar. Registration blocked.',
        playwrightKey: 'register_negative_dup',
      },
      {
        idSuffix:      'E01',
        title:         'Register with missing mandatory fields',
        type:          'Edge',
        priority:      'High',
        steps: [
          'Navigate to the registration page',
          'Leave one or more required fields empty',
          'Click the Register button',
        ],
        expected:      'Inline validation errors shown for all empty required fields.',
        playwrightKey: 'register_edge_empty',
      },
    ],
  },

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  {
    keywords: ['payment', 'checkout', 'billing', 'pay', 'card', 'transaction', 'purchase'],
    module:   'Payment & Checkout',
    icon:     '💳',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Complete payment with valid card details',
        type:          'Positive',
        priority:      'Critical',
        steps: [
          'Navigate to the checkout/payment page',
          'Select or confirm the item/plan to purchase',
          'Enter valid card number: 4111 1111 1111 1111',
          'Enter expiry date (future date) and CVV',
          'Click Pay / Submit Payment button',
        ],
        expected:      'Payment processed. Success message shown with transaction ID or order confirmation.',
        playwrightKey: 'payment_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Payment with expired card',
        type:          'Negative',
        priority:      'High',
        steps: [
          'Navigate to the checkout/payment page',
          'Enter an expired card (expiry in the past)',
          'Click Pay button',
        ],
        expected:      'Payment declined. Error: "Card expired" or similar message shown.',
        playwrightKey: 'payment_negative_expired',
      },
      {
        idSuffix:      'E01',
        title:         'Payment with empty card fields',
        type:          'Edge',
        priority:      'Medium',
        steps: [
          'Navigate to the checkout/payment page',
          'Leave card number, expiry, and CVV fields empty',
          'Click Pay button',
        ],
        expected:      'Validation errors shown for all empty payment fields. Payment not submitted.',
        playwrightKey: 'payment_edge_empty',
      },
    ],
  },

  // ── FORM VALIDATION ───────────────────────────────────────────────────────
  {
    keywords: ['form', 'input', 'validation', 'validate', 'field', 'submit'],
    module:   'Form Validation',
    icon:     '📋',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Submit form with all valid data',
        type:          'Positive',
        priority:      'High',
        steps: [
          'Navigate to the page containing the form',
          'Fill all fields with valid data',
          'Click the Submit button',
        ],
        expected:      'Form submitted successfully. Success message or redirect to next step.',
        playwrightKey: 'form_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Submit form with invalid email format',
        type:          'Negative',
        priority:      'High',
        steps: [
          'Navigate to the form page',
          'Enter an invalid email format (e.g., "notanemail")',
          'Fill other fields with valid data',
          'Click Submit',
        ],
        expected:      'Error: "Invalid email format" shown. Form not submitted.',
        playwrightKey: 'form_negative_email',
      },
      {
        idSuffix:      'E01',
        title:         'Submit completely empty form',
        type:          'Edge',
        priority:      'Medium',
        steps: [
          'Navigate to the form page',
          'Do not fill any fields',
          'Click the Submit button',
        ],
        expected:      'All required field validation errors displayed simultaneously.',
        playwrightKey: 'form_edge_empty',
      },
    ],
  },

  // ── SEARCH ────────────────────────────────────────────────────────────────
  {
    keywords: ['search', 'filter', 'find', 'query', 'lookup'],
    module:   'Search & Filter',
    icon:     '🔍',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Search with valid keyword returns results',
        type:          'Positive',
        priority:      'High',
        steps: [
          'Navigate to the search page or locate the search bar',
          'Enter a valid keyword that should return results',
          'Press Enter or click the Search button',
        ],
        expected:      'Search results displayed matching the keyword.',
        playwrightKey: 'search_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Search with no results keyword shows empty state',
        type:          'Negative',
        priority:      'Medium',
        steps: [
          'Navigate to the search feature',
          'Enter a keyword that has no matching results (e.g., "xyzabcnotfound")',
          'Submit the search',
        ],
        expected:      'Empty state message displayed: "No results found" or similar.',
        playwrightKey: 'search_negative_empty',
      },
    ],
  },

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  {
    keywords: ['logout', 'log out', 'signout', 'sign out', 'session'],
    module:   'Session Management — Logout',
    icon:     '🚪',
    tests: [
      {
        idSuffix:      'P01',
        title:         'User can logout successfully',
        type:          'Positive',
        priority:      'High',
        steps: [
          'Login with valid credentials',
          'Locate the Logout button (in nav bar or user menu)',
          'Click Logout',
        ],
        expected:      'User logged out. Redirected to login page or landing page. Session cleared.',
        playwrightKey: 'logout_positive',
      },
      {
        idSuffix:      'E01',
        title:         'Back button after logout should not access protected pages',
        type:          'Edge',
        priority:      'Critical',
        steps: [
          'Login with valid credentials',
          'Logout from the application',
          'Click the browser Back button',
        ],
        expected:      'User is NOT returned to the protected page. Redirected to login instead.',
        playwrightKey: 'logout_edge_back',
      },
    ],
  },

  // ── PASSWORD ─────────────────────────────────────────────────────────────
  {
    keywords: ['password', 'forgot password', 'reset password', 'change password'],
    module:   'Password Management',
    icon:     '🔑',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Forgot password flow sends reset link',
        type:          'Positive',
        priority:      'High',
        steps: [
          'Navigate to the login page',
          'Click "Forgot Password" link',
          'Enter a registered email address',
          'Click Send Reset Link / Submit',
        ],
        expected:      'Confirmation message: "Password reset email sent" or similar.',
        playwrightKey: 'password_forgot_positive',
      },
      {
        idSuffix:      'N01',
        title:         'Forgot password with unregistered email',
        type:          'Negative',
        priority:      'Medium',
        steps: [
          'Navigate to the forgot password page',
          'Enter an email that is NOT registered',
          'Click Submit',
        ],
        expected:      'Either: error "Email not found", or generic message for security. No reset email for invalid address.',
        playwrightKey: 'password_forgot_negative',
      },
    ],
  },

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  {
    keywords: ['dashboard', 'home page', 'landing', 'overview', 'summary'],
    module:   'Dashboard',
    icon:     '📊',
    tests: [
      {
        idSuffix:      'P01',
        title:         'Dashboard loads with all required sections',
        type:          'Positive',
        priority:      'High',
        steps: [
          'Login with valid credentials',
          'Verify the dashboard page loads',
          'Check that key sections/widgets are visible',
        ],
        expected:      'Dashboard displays without errors. Key data sections visible.',
        playwrightKey: 'dashboard_load',
      },
      {
        idSuffix:      'P02',
        title:         'Dashboard page load time within performance budget',
        type:          'Positive',
        priority:      'Medium',
        steps: [
          'Navigate to the dashboard page while logged in',
          'Measure page load time',
        ],
        expected:      'Page fully loads in under 3 seconds.',
        playwrightKey: 'dashboard_perf',
      },
    ],
  },

  // ── NAVIGATION ───────────────────────────────────────────────────────────
  {
    keywords: ['navigation', 'menu', 'nav', 'breadcrumb', 'link', 'page'],
    module:   'Navigation',
    icon:     '🧭',
    tests: [
      {
        idSuffix:      'P01',
        title:         'All navigation links are functional',
        type:          'Positive',
        priority:      'Medium',
        steps: [
          'Navigate to the application',
          'Click each main navigation menu item',
          'Verify each link navigates to the correct page',
        ],
        expected:      'All navigation links work. No 404 errors.',
        playwrightKey: 'nav_links',
      },
      {
        idSuffix:      'P02',
        title:         'Application loads successfully at base URL',
        type:          'Positive',
        priority:      'Critical',
        steps: [
          'Open the application URL in a browser',
          'Verify the page loads without errors',
          'Check that the page title is present',
        ],
        expected:      'Application loads. Status 200. Page title present. No console errors.',
        playwrightKey: 'nav_base_load',
      },
    ],
  },

  // ── PROFILE / ACCOUNT ─────────────────────────────────────────────────────
  {
    keywords: ['profile', 'account', 'settings', 'user details', 'my account'],
    module:   'User Profile & Settings',
    icon:     '👤',
    tests: [
      {
        idSuffix:      'P01',
        title:         'User profile page loads with correct information',
        type:          'Positive',
        priority:      'Medium',
        steps: [
          'Login with valid credentials',
          'Navigate to Profile / My Account section',
          'Verify user details are displayed',
        ],
        expected:      'Profile page loads. User name and email displayed correctly.',
        playwrightKey: 'profile_load',
      },
      {
        idSuffix:      'N01',
        title:         'Access profile without login redirects to login',
        type:          'Negative',
        priority:      'High',
        steps: [
          'Without logging in, navigate directly to the profile URL',
        ],
        expected:      'User is redirected to the login page (auth guard active).',
        playwrightKey: 'profile_auth_guard',
      },
    ],
  },

  // ── SECURITY (OWASP Top 10) ────────────────────────────────────────────────
  {
    keywords: ['login', 'register', 'form', 'input', 'search', 'profile', 'comment', 'post', 'submit'],
    module:   'Security — OWASP',
    icon:     '🛡️',
    tests: [
      {
        idSuffix: 'SEC01', title: 'XSS — Reflected script injection in input fields',
        type: 'Security', priority: 'Critical', testData: `<script>alert('XSS')</script>`,
        steps: [
          'Identify any text input field (search, profile, comment, login email)',
          "Enter payload: <script>alert('XSS')</script>",
          'Submit or trigger the field value to be rendered somewhere',
          'Observe whether the alert executes or the payload is rendered as plain text',
        ],
        expected: 'Payload is escaped/sanitized — alert never executes, and output is rendered as literal text',
        playwrightKey: 'sec_xss_reflected',
      },
      {
        idSuffix: 'SEC02', title: 'XSS — Stored script injection via saved data',
        type: 'Security', priority: 'Critical', testData: `<img src=x onerror=alert(1)>`,
        steps: [
          'Log in and navigate to a page that saves user text (profile bio, comment, note)',
          'Submit payload: <img src=x onerror=alert(1)>',
          'Save the value, log out, log back in, reload the page',
          'Observe whether the payload fires or is displayed safely',
        ],
        expected: 'Stored payload is sanitized on both write and read — alert never fires on any user visit',
        playwrightKey: 'sec_xss_stored',
      },
      {
        idSuffix: 'SEC03', title: 'SQL Injection — Authentication bypass attempt',
        type: 'Security', priority: 'Critical', testData: `' OR '1'='1`,
        steps: [
          'Open the login page',
          "Enter email: admin' OR '1'='1'--",
          'Enter any password',
          'Attempt to log in',
        ],
        expected: 'Login is rejected with a generic error. No SQL error leaked. Attempt is logged server-side.',
        playwrightKey: 'sec_sqli_login',
      },
      {
        idSuffix: 'SEC04', title: 'IDOR — Access another user\'s resource by manipulating ID',
        type: 'Security', priority: 'Critical',
        steps: [
          'Log in as user A and open a profile/order URL containing an ID (e.g. /orders/1001)',
          'Change the ID to a resource known to belong to user B (e.g. /orders/1002)',
          'Observe whether A can see B\'s data',
        ],
        expected: 'Server returns 403 Forbidden or 404 — A cannot read B\'s data',
        playwrightKey: 'sec_idor',
      },
      {
        idSuffix: 'SEC05', title: 'CSRF — State-changing action without token',
        type: 'Security', priority: 'High',
        steps: [
          'Log in as an authenticated user',
          'Identify a state-changing POST endpoint (change password, transfer, delete)',
          'Craft a request from a different origin without the CSRF token',
          'Submit the request',
        ],
        expected: 'Request is rejected (403) — CSRF token is required and SameSite/Origin is enforced',
        playwrightKey: 'sec_csrf',
      },
      {
        idSuffix: 'SEC06', title: 'Brute Force — Rate limiting on login attempts',
        type: 'Security', priority: 'High',
        steps: [
          'Open the login page',
          'Attempt to log in with wrong credentials 10+ times in succession',
          'Observe server response on subsequent attempts',
        ],
        expected: 'After N failed attempts (typically 5-10), account is temporarily locked or rate-limited (HTTP 429)',
        playwrightKey: 'sec_brute_force',
      },
      {
        idSuffix: 'SEC07', title: 'Sensitive Data Exposure — HTTPS & security headers',
        type: 'Security', priority: 'Critical',
        steps: [
          'Open browser DevTools → Network',
          'Load the application',
          'Inspect response headers on main document and API calls',
        ],
        expected: 'All traffic is HTTPS. Headers present: Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options (or CSP frame-ancestors), Content-Security-Policy, Referrer-Policy',
        playwrightKey: 'sec_headers',
      },
      {
        idSuffix: 'SEC08', title: 'Session — Session fixation and logout invalidation',
        type: 'Security', priority: 'High',
        steps: [
          'Capture session cookie before login',
          'Log in with valid credentials',
          'Verify session cookie rotates (new value post-login)',
          'Log out and attempt to reuse the old cookie',
        ],
        expected: 'Session cookie is regenerated on login. Old cookies are rejected after logout (server-side invalidation).',
        playwrightKey: 'sec_session_fixation',
      },
    ],
  },

  // ── API TESTING ────────────────────────────────────────────────────────────
  {
    keywords: ['api', 'rest', 'endpoint', 'webservice', 'graphql', 'integration'],
    module:   'API Testing',
    icon:     '🔌',
    tests: [
      {
        idSuffix: 'API01', title: 'Valid GET — Correct status code and response schema',
        type: 'Positive', priority: 'Critical',
        steps: [
          'Identify a public GET endpoint',
          'Send request with valid auth headers',
          'Capture response',
        ],
        expected: 'HTTP 200, JSON response matches schema, response time < 1s',
        playwrightKey: 'api_get_valid',
      },
      {
        idSuffix: 'API02', title: 'Unauthorized — Missing/invalid auth token',
        type: 'Negative', priority: 'Critical',
        steps: [
          'Call any protected endpoint without Authorization header',
          'Call again with an expired/invalid token',
        ],
        expected: 'HTTP 401 Unauthorized with clear error body. No data leaked.',
        playwrightKey: 'api_unauthorized',
      },
      {
        idSuffix: 'API03', title: 'Forbidden — Authenticated but insufficient privileges',
        type: 'Negative', priority: 'High',
        steps: [
          'Authenticate as a low-privilege user',
          'Call an admin-only endpoint',
        ],
        expected: 'HTTP 403 Forbidden. No leakage of admin data.',
        playwrightKey: 'api_forbidden',
      },
      {
        idSuffix: 'API04', title: 'Bad Request — Invalid payload fields & types',
        type: 'Negative', priority: 'High',
        steps: [
          'POST an endpoint with missing required fields',
          'POST with wrong type (string instead of number, etc.)',
          'POST with extra unknown fields',
        ],
        expected: 'HTTP 400 with a validation-error body listing each invalid field. No 500s.',
        playwrightKey: 'api_bad_request',
      },
      {
        idSuffix: 'API05', title: 'Not Found — Non-existent resource ID',
        type: 'Negative', priority: 'Medium',
        steps: [
          'GET /resource/<id that does not exist>',
        ],
        expected: 'HTTP 404. Body contains a non-revealing error message (no stack trace).',
        playwrightKey: 'api_not_found',
      },
      {
        idSuffix: 'API06', title: 'Rate Limiting — Sustained request flood',
        type: 'Boundary', priority: 'High',
        steps: [
          'Send 100+ requests to the same endpoint within 60s from one client',
          'Observe response codes and headers',
        ],
        expected: 'After threshold, server returns HTTP 429 with X-RateLimit-* headers',
        playwrightKey: 'api_rate_limit',
      },
      {
        idSuffix: 'API07', title: 'Idempotency — Repeated POST with same idempotency key',
        type: 'Positive', priority: 'High',
        steps: [
          'POST create with Idempotency-Key: uuid-1',
          'Repeat the same POST with same key',
        ],
        expected: 'Second call returns the same resource without creating a duplicate',
        playwrightKey: 'api_idempotency',
      },
      {
        idSuffix: 'API08', title: 'Pagination — Limit, offset, and total-count',
        type: 'Positive', priority: 'Medium',
        steps: [
          'GET list endpoint with ?limit=10&offset=0',
          'GET again with ?limit=10&offset=10',
          'Inspect total count header/field',
        ],
        expected: 'Each page returns ≤ limit items, offset advances correctly, no duplicates, total count stable',
        playwrightKey: 'api_pagination',
      },
    ],
  },

  // ── ACCESSIBILITY (WCAG 2.1 AA) ───────────────────────────────────────────
  {
    keywords: ['form', 'login', 'button', 'navigation', 'menu', 'page', 'field', 'input'],
    module:   'Accessibility — WCAG 2.1',
    icon:     '♿',
    tests: [
      {
        idSuffix: 'A11Y01', title: 'Keyboard navigation — Tab order and focus trap',
        type: 'Accessibility', priority: 'High',
        steps: [
          'Load the page',
          'Use Tab to move through all interactive elements',
          'Use Shift+Tab to move backward',
          'Open any modal and verify focus is trapped inside',
        ],
        expected: 'All interactive elements are reachable by Tab in a logical order. Modals trap focus until closed. Focus outline is always visible.',
        playwrightKey: 'a11y_keyboard_nav',
      },
      {
        idSuffix: 'A11Y02', title: 'Screen reader — Labels and ARIA for form controls',
        type: 'Accessibility', priority: 'High',
        steps: [
          'Enable NVDA/JAWS/VoiceOver',
          'Tab through each form field',
          'Listen to the announcement',
        ],
        expected: 'Each field is announced with its label, type, required state, and current value. Error messages are announced via aria-live.',
        playwrightKey: 'a11y_screen_reader',
      },
      {
        idSuffix: 'A11Y03', title: 'Color contrast — Text meets 4.5:1 (normal) / 3:1 (large)',
        type: 'Accessibility', priority: 'Medium',
        steps: [
          'Open browser DevTools → Accessibility audit',
          'Run Lighthouse or axe-core',
        ],
        expected: 'No contrast failures on primary text, links, buttons, form labels',
        playwrightKey: 'a11y_contrast',
      },
      {
        idSuffix: 'A11Y04', title: 'Images — Alt text presence and accuracy',
        type: 'Accessibility', priority: 'Medium',
        steps: [
          'Scan page for <img> tags',
          'Verify each has a meaningful alt= attribute (or alt="" for decorative)',
        ],
        expected: 'Every informative image has descriptive alt text. Decorative images use alt="".',
        playwrightKey: 'a11y_alt_text',
      },
      {
        idSuffix: 'A11Y05', title: 'Heading hierarchy and landmark regions',
        type: 'Accessibility', priority: 'Low',
        steps: [
          'Inspect DOM for h1..h6 order',
          'Verify presence of <main>, <nav>, <header>, <footer> or equivalent ARIA roles',
        ],
        expected: 'Exactly one h1; headings follow nesting order; landmark regions exist and are unique',
        playwrightKey: 'a11y_headings',
      },
    ],
  },

  // ── PERFORMANCE (Core Web Vitals) ─────────────────────────────────────────
  {
    keywords: ['dashboard', 'page', 'home', 'landing', 'load', 'performance'],
    module:   'Performance — Core Web Vitals',
    icon:     '⚡',
    tests: [
      {
        idSuffix: 'PERF01', title: 'LCP — Largest Contentful Paint under 2.5s',
        type: 'Performance', priority: 'High',
        steps: [
          'Open DevTools → Performance → Record',
          'Load the page cold (cache disabled)',
          'Stop recording and read LCP metric',
        ],
        expected: 'LCP ≤ 2.5s on a simulated 4G connection',
        playwrightKey: 'perf_lcp',
      },
      {
        idSuffix: 'PERF02', title: 'CLS — Cumulative Layout Shift under 0.1',
        type: 'Performance', priority: 'Medium',
        steps: [
          'Open DevTools → Performance → Record',
          'Load the page and interact for 5s',
          'Read CLS metric',
        ],
        expected: 'CLS ≤ 0.1 — no unexpected layout shifts during load or interaction',
        playwrightKey: 'perf_cls',
      },
      {
        idSuffix: 'PERF03', title: 'INP — Interaction to Next Paint under 200ms',
        type: 'Performance', priority: 'High',
        steps: [
          'Load page, interact with buttons/inputs/links',
          'Measure INP via web-vitals library or DevTools',
        ],
        expected: 'INP ≤ 200ms for all primary interactions',
        playwrightKey: 'perf_inp',
      },
      {
        idSuffix: 'PERF04', title: 'Bundle size — JS payload under 250KB compressed',
        type: 'Performance', priority: 'Medium',
        steps: [
          'Open DevTools → Network → Filter JS',
          'Reload and sum transferred size',
        ],
        expected: 'Total JS transferred ≤ 250KB gzipped on initial load',
        playwrightKey: 'perf_bundle',
      },
      {
        idSuffix: 'PERF05', title: 'API response time — p95 under 1s',
        type: 'Performance', priority: 'High',
        steps: [
          'Run 100 iterations of a representative API call',
          'Compute p50 / p95 / p99',
        ],
        expected: 'p95 ≤ 1s on nominal load. No request exceeds 3s.',
        playwrightKey: 'perf_api_p95',
      },
    ],
  },

  // ── RESPONSIVE / MOBILE ───────────────────────────────────────────────────
  {
    keywords: ['page', 'dashboard', 'form', 'home', 'landing', 'navigation', 'menu', 'mobile', 'responsive'],
    module:   'Responsive & Mobile',
    icon:     '📱',
    tests: [
      {
        idSuffix: 'RESP01', title: 'Mobile viewport — 375×667 layout integrity',
        type: 'UI/UX', priority: 'High',
        steps: [
          'Open DevTools → Toggle device toolbar',
          'Select iPhone SE (375×667)',
          'Scroll through the page',
        ],
        expected: 'No horizontal scroll. All interactive elements are tappable (min 44×44). Text remains readable.',
        playwrightKey: 'resp_mobile_375',
      },
      {
        idSuffix: 'RESP02', title: 'Tablet viewport — 768×1024 portrait and landscape',
        type: 'UI/UX', priority: 'Medium',
        steps: [
          'Switch to iPad (768×1024)',
          'Toggle portrait/landscape',
        ],
        expected: 'Layout adapts correctly. Navigation collapses appropriately. No truncated content.',
        playwrightKey: 'resp_tablet',
      },
      {
        idSuffix: 'RESP03', title: 'Touch interactions — Tap, swipe, long-press',
        type: 'UI/UX', priority: 'Medium',
        steps: [
          'On a mobile viewport, emulate touch events',
          'Tap buttons, swipe carousels, long-press menus',
        ],
        expected: 'All touch gestures fire correct handlers. No hover-only UX.',
        playwrightKey: 'resp_touch',
      },
      {
        idSuffix: 'RESP04', title: 'Orientation change — Portrait ↔ Landscape preserves state',
        type: 'UI/UX', priority: 'Low',
        steps: [
          'Begin filling a form on a mobile viewport',
          'Rotate the device (emulate orientation change)',
        ],
        expected: 'Entered data is preserved; layout reflows without breaking',
        playwrightKey: 'resp_orientation',
      },
    ],
  },

  // ── BOUNDARY / DATA VALIDATION ────────────────────────────────────────────
  {
    keywords: ['form', 'input', 'field', 'validate', 'number', 'date', 'submit'],
    module:   'Boundary & Data Validation',
    icon:     '📏',
    tests: [
      {
        idSuffix: 'BV01', title: 'Numeric field — min, min-1, max, max+1',
        type: 'Boundary', priority: 'High',
        steps: [
          'Enter min allowed value → submit',
          'Enter min-1 → submit',
          'Enter max allowed value → submit',
          'Enter max+1 → submit',
        ],
        expected: 'min and max are accepted. min-1 and max+1 are rejected with clear error messages.',
        playwrightKey: 'bv_numeric',
      },
      {
        idSuffix: 'BV02', title: 'Text field — length 0, 1, max, max+1',
        type: 'Boundary', priority: 'Medium',
        steps: [
          'Enter empty string → submit',
          'Enter 1 char → submit',
          'Enter max length → submit',
          'Enter max+1 chars → submit',
        ],
        expected: 'Empty and max+1 are rejected. 1 and max are accepted.',
        playwrightKey: 'bv_text_length',
      },
      {
        idSuffix: 'BV03', title: 'Date field — past, today, future, invalid',
        type: 'Boundary', priority: 'Medium',
        steps: [
          'Enter a past date, today, and a future date',
          'Enter an invalid date (2026-13-40 or Feb 30)',
        ],
        expected: 'Valid dates accepted per business rule. Invalid dates rejected with specific error.',
        playwrightKey: 'bv_date',
      },
      {
        idSuffix: 'BV04', title: 'Email — RFC 5321 format edge cases',
        type: 'Boundary', priority: 'Medium', testData: `user+tag@sub.example.co.uk`,
        steps: [
          'Enter: user+tag@sub.example.co.uk',
          'Enter: user..dots@example.com',
          'Enter: missing@tld',
          'Enter: "very long"@longdomain-with-many-subs.example.com',
        ],
        expected: 'Valid RFC 5321 emails are accepted. Malformed are rejected. No 500 errors.',
        playwrightKey: 'bv_email',
      },
      {
        idSuffix: 'BV05', title: 'Unicode — Multi-byte chars, emojis, RTL in text fields',
        type: 'Boundary', priority: 'Low', testData: `测试 🔥 مرحبا`,
        steps: [
          'Enter text containing Chinese, Arabic (RTL), emojis: 测试 🔥 مرحبا',
          'Submit and reload',
        ],
        expected: 'Text persists and renders correctly on reload. No mojibake, no truncation.',
        playwrightKey: 'bv_unicode',
      },
    ],
  },

  // ── CONCURRENCY & STATE ───────────────────────────────────────────────────
  {
    keywords: ['form', 'submit', 'payment', 'order', 'transfer', 'booking', 'cart'],
    module:   'Concurrency & State',
    icon:     '🔀',
    tests: [
      {
        idSuffix: 'CONC01', title: 'Double-click submission — no duplicate records',
        type: 'Negative', priority: 'High',
        steps: [
          'Fill a create/pay/transfer form',
          'Click the submit button twice in quick succession',
        ],
        expected: 'Only one record is created. Button disables on click or server deduplicates via idempotency key.',
        playwrightKey: 'conc_double_submit',
      },
      {
        idSuffix: 'CONC02', title: 'Concurrent edit — two tabs editing same resource',
        type: 'Negative', priority: 'Medium',
        steps: [
          'Open the same record in Tab A and Tab B',
          'Edit field X in A and save',
          'Edit field Y in B and save',
        ],
        expected: 'B either sees a stale-data warning (optimistic locking) or merges cleanly. No silent overwrite of A\'s change.',
        playwrightKey: 'conc_concurrent_edit',
      },
      {
        idSuffix: 'CONC03', title: 'Back button after state-changing action',
        type: 'Edge', priority: 'Medium',
        steps: [
          'Complete an action that changes state (submit, pay, delete)',
          'Click browser Back',
          'Attempt to resubmit',
        ],
        expected: 'Browser shows "form resubmission" warning or app shows current state — no duplicate action',
        playwrightKey: 'conc_back_button',
      },
      {
        idSuffix: 'CONC04', title: 'Session expiry — Action after token expiry',
        type: 'Edge', priority: 'High',
        steps: [
          'Log in and idle past session timeout',
          'Attempt any action requiring auth',
        ],
        expected: 'User is redirected to login with a message; in-flight data is not lost if possible',
        playwrightKey: 'conc_session_expiry',
      },
    ],
  },
];

// ── Counter for unique IDs ─────────────────────────────────────────────────────
let idCounter = 1;

/**
 * Generate test cases from requirement text using rule-based keyword detection.
 * @param {string} requirementText
 * @param {Object} config - { testScope, priorityFilter, selectedModules }
 * @returns {Array}
 */
function generate(requirementText, config = {}) {
  const textLower  = requirementText.toLowerCase();
  const testCases  = [];
  const seenModules = new Set();

  const ctx = { requirementText };

  // Always include Navigation tests (baseline)
  const navRule = TEST_RULES.find(r => r.module === 'Navigation');
  if (navRule) {
    addRuleTests(navRule, testCases, ctx);
    seenModules.add(navRule.module);
  }

  // Detect keywords and add corresponding rules
  for (const rule of TEST_RULES) {
    if (seenModules.has(rule.module)) continue;

    const matched = rule.keywords.some(kw => textLower.includes(kw));
    if (matched) {
      addRuleTests(rule, testCases, ctx);
      seenModules.add(rule.module);
    }
  }

  // If nothing matched (empty/generic doc), add all rules
  if (testCases.length <= navRule.tests.length) {
    for (const rule of TEST_RULES) {
      if (seenModules.has(rule.module)) continue;
      addRuleTests(rule, testCases, ctx);
      seenModules.add(rule.module);
    }
  }

  return applyFilters(testCases, config);
}

/**
 * Apply test scope, priority, and module filters.
 */
function applyFilters(testCases, config = {}) {
  const { testScope, priorityFilter, selectedModules } = config;
  let filtered = [...testCases];

  // Module filter — only run selected modules
  if (selectedModules && selectedModules.length > 0) {
    filtered = filtered.filter(tc => selectedModules.includes(tc.module));
  }

  // Priority filter
  if (priorityFilter === 'critical') {
    filtered = filtered.filter(tc => tc.priority === 'Critical');
  } else if (priorityFilter === 'high') {
    filtered = filtered.filter(tc => ['Critical', 'High'].includes(tc.priority));
  }

  // Test scope filter
  if (testScope === 'smoke') {
    // 1 test per module — the first Critical or Positive one
    const seen = new Set();
    filtered = filtered.filter(tc => {
      if (seen.has(tc.module)) return false;
      seen.add(tc.module);
      return true;
    });
  } else if (testScope === 'sanity') {
    // Max 2 tests per module (positive + one negative)
    const count = {};
    filtered = filtered.filter(tc => {
      count[tc.module] = (count[tc.module] || 0) + 1;
      return count[tc.module] <= 2;
    });
  }
  // 'regression' and 'full' → all tests (no additional filter)

  return filtered;
}

function addRuleTests(rule, testCases, context = {}) {
  const { requirementText = '' } = context;
  const lower = requirementText.toLowerCase();
  // Smart priority bump: mentions of compliance/regulated domains elevate security/API tests
  const complianceHit = /\b(pci|hipaa|gdpr|sox|irda|mifid|dodd-frank|rbi|kyc|aml|pii)\b/.test(lower);

  for (const t of rule.tests) {
    let priority = t.priority;
    if (complianceHit && (rule.module.includes('Security') || rule.module.includes('API'))) {
      priority = 'Critical';
    }

    testCases.push({
      id:            `${t.idSuffix ? t.idSuffix + '_' : 'TC_'}${String(idCounter++).padStart(3, '0')}`,
      module:        rule.module,
      icon:          rule.icon,
      title:         t.title,
      type:          t.type,
      category:      t.type, // alias for UI filters
      priority,
      steps:         t.steps,
      expected:      t.expected,
      testData:      t.testData || '',
      playwrightKey: t.playwrightKey,
      status:        'Not Executed',
      actual:        '',
      error:         '',
      duration:      null,
      screenshot:    null,
    });
  }
}

/**
 * Merge playwright execution results back into test cases.
 * @param {Array} testCases - Original test cases
 * @param {Object} testResults - Map of playwrightKey → result
 * @returns {Array} Updated test cases with status/actual/error
 */
function mergeResults(testCases, testResults) {
  // Reset counter for next run
  idCounter = 1;

  return testCases.map(tc => {
    const result = testResults[tc.playwrightKey] || testResults[tc.id];
    if (!result) return { ...tc, status: 'Skipped', actual: 'Test was not executed' };

    return {
      ...tc,
      status:     result.passed ? 'Pass' : 'Fail',
      actual:     result.actual || (result.passed ? tc.expected : 'Test assertion failed'),
      error:      result.error  || '',
      duration:   result.duration || null,
      screenshot: result.screenshot || null,
    };
  });
}

module.exports = { generate, mergeResults, applyFilters };
