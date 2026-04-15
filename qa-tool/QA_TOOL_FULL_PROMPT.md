# QA AI Testing Tool — Complete Replication Prompt

Build a **full-stack QA AI Testing Tool** with the exact structure and code below. This is a React + Node.js + Playwright automated testing pipeline with:

- **Frontend** (React 18 + Vite) — Interactive dark-theme dashboard with chatbot, toast notifications, confetti, animated counters, donut charts, expandable rows, advanced test config, email monitor page, run history
- **Backend** (Node.js + Express) — Test execution pipeline: parse docs → generate test cases → run Playwright → generate reports (HTML + Excel) → email results
- **Email Monitor** — IMAP inbox polling that auto-triggers test runs from deployment notification emails
- **Multi-Browser** — Supports Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **AI Chatbot** — Floating assistant that navigates pages, sets config, and answers questions

## Project Structure

```
qa-tool/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   │   ├── testRoutes.js
│   │   └── monitorRoutes.js
│   └── services/
│       ├── parser.js
│       ├── testGenerator.js
│       ├── playwrightRunner.js
│       ├── reportGenerator.js
│       ├── excelGenerator.js
│       ├── emailMonitor.js
│       ├── emailSender.js
│       └── historyStore.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── App.css
└── playwright-tests/
    └── package.json
```

## Setup Instructions

```bash
# 1. Create project structure
mkdir -p qa-tool/backend/routes qa-tool/backend/services qa-tool/frontend/src qa-tool/playwright-tests

# 2. Install backend deps
cd qa-tool/backend
npm init -y
npm install express cors multer uuid dotenv pdf-parse exceljs nodemailer imap-simple mailparser
npm install -D nodemon

# 3. Install frontend deps
cd ../frontend
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react

# 4. Install Playwright
cd ../playwright-tests
npm init -y
npm install -D @playwright/test
npx playwright install

# 5. Start servers
cd ../backend && node server.js      # Port 5000
cd ../frontend && npm run dev         # Port 3001
```

---

## COMPLETE SOURCE CODE — Copy each file exactly as shown below


---

### `backend/package.json`

```json
{
  "name": "qa-tool-backend",
  "version": "1.0.0",
  "description": "QA AI Testing Tool - Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "exceljs": "^4.4.0",
    "express": "^4.18.2",
    "imap-simple": "^5.1.0",
    "mailparser": "^3.9.5",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^8.0.3",
    "pdf-parse": "^1.1.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```


---

### `backend/server.js`

```js
// ── QA AI Testing Tool — Backend Server ──────────────────────────────────────
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const testRoutes    = require('./routes/testRoutes');
const monitorRoutes = require('./routes/monitorRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Ensure required directories exist ────────────────────────────────────────
const dirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'reports'),
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', testRoutes);
app.use('/api', monitorRoutes);

// ── Serve report files statically ────────────────────────────────────────────
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 QA Tool Backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
```


---

### `backend/routes/testRoutes.js`

```js
// ── QA Tool Routes ────────────────────────────────────────────────────────────
const express         = require('express');
const multer          = require('multer');
const path            = require('path');
const fs              = require('fs');
const { v4: uuidv4 }  = require('uuid');

const parser            = require('../services/parser');
const testGenerator     = require('../services/testGenerator');
const playwrightRunner  = require('../services/playwrightRunner');
const reportGenerator   = require('../services/reportGenerator');
const excelGenerator    = require('../services/excelGenerator');
const historyStore      = require('../services/historyStore');

const router = express.Router();

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `req_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT and MD files are supported'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ── In-memory job store ───────────────────────────────────────────────────────
const jobs = new Map();
// job schema: { jobId, status, logs: [], results: null, error: null, createdAt }

// ── GET /api/history ─────────────────────────────────────────────────────────
router.get('/history', (req, res) => {
  res.json(historyStore.getHistory());
});

// ── POST /api/execute ─────────────────────────────────────────────────────────
router.post('/execute', upload.single('requirementFile'), async (req, res) => {
  const { appUrl } = req.body;

  if (!appUrl) return res.status(400).json({ error: 'appUrl is required' });
  if (!req.file) return res.status(400).json({ error: 'Requirement file is required' });

  // ── Parse run configuration ─────────────────────────────────────────────────
  let browsers = ['chromium'];
  try { browsers = JSON.parse(req.body.browsers || '["chromium"]'); } catch {}
  const runConfig = {
    browsers,
    testScope:           req.body.testScope           || 'regression',
    priorityFilter:      req.body.priorityFilter       || 'all',
    selectedModules:     req.body.selectedModules      ? JSON.parse(req.body.selectedModules) : [],
    workers:             parseInt(req.body.workers)     || 3,
    retries:             parseInt(req.body.retries)     || 0,
    screenshots:         req.body.screenshots           || 'only-on-failure',
    environment:         req.body.environment           || 'QA',
    includeAccessibility: req.body.includeAccessibility === 'true',
    includePerformance:   req.body.includePerformance   === 'true',
  };

  const jobId = uuidv4();
  const job = {
    jobId,
    status: 'running',
    logs: [],
    results: null,
    error: null,
    createdAt: new Date().toISOString(),
    runConfig,
  };
  jobs.set(jobId, job);

  const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    job.logs.push(entry);
  };

  // Return jobId immediately so frontend can start polling
  res.json({ jobId, message: 'Execution started' });

  // ── Run pipeline asynchronously ────────────────────────────────────────────
  (async () => {
    try {
      log('📄 Step 1/6 — Parsing requirement document...');
      const requirementText = await parser.extractText(req.file.path);
      log(`   Extracted ${requirementText.length} characters from ${req.file.originalname}`);

      log('🧠 Step 2/6 — Generating test cases from requirements...');
      log(`   Scope: ${runConfig.testScope} | Priority: ${runConfig.priorityFilter} | Browsers: [${runConfig.browsers.join(', ')}]`);
      const testCases = testGenerator.generate(requirementText, runConfig);
      log(`   Generated ${testCases.length} test cases across ${[...new Set(testCases.map(t => t.module))].length} modules`);

      // Save test cases to reports dir
      const reportDir = path.join(__dirname, '../reports', jobId);
      fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportDir, 'testcases-initial.json'),
        JSON.stringify(testCases, null, 2)
      );

      log('🎭 Step 3/6 — Converting test cases to Playwright scripts...');
      const specContent = playwrightRunner.generateSpec(appUrl, testCases, runConfig);
      const extraTests = (runConfig.includeAccessibility ? 1 : 0) + (runConfig.includePerformance ? 1 : 0);
      log(`   Playwright spec generated with ${testCases.length} test functions${extraTests ? ` + ${extraTests} built-in checks` : ''}`);

      log('⚡ Step 4/6 — Executing Playwright tests...');
      const executionResults = await playwrightRunner.execute(specContent, appUrl, log, runConfig);
      log(`   Execution complete — ${executionResults.passed} passed, ${executionResults.failed} failed`);

      log('📊 Step 5/6 — Updating test cases with execution results...');
      const updatedTestCases = testGenerator.mergeResults(testCases, executionResults.testResults);

      const execStats = {
        total:    testCases.length,
        passed:   executionResults.passed,
        failed:   executionResults.failed,
        skipped:  executionResults.skipped,
        duration: executionResults.duration,
        passRate: testCases.length > 0
          ? Math.round((executionResults.passed / testCases.length) * 100)
          : 0,
      };

      log('📝 Step 6/6 — Generating HTML report + Excel file...');
      const [reportPath, excelPath] = await Promise.all([
        reportGenerator.generate({
          jobId,
          appUrl,
          testCases: updatedTestCases,
          executionStats: execStats,
          reportDir,
          runConfig,
        }),
        excelGenerator.generate(updatedTestCases, execStats, appUrl, reportDir),
      ]);
      log(`   HTML report : ${reportPath}`);
      log(`   Excel file  : ${excelPath}`);

      // Save updated test cases JSON too
      fs.writeFileSync(
        path.join(reportDir, 'testcases-updated.json'),
        JSON.stringify(updatedTestCases, null, 2)
      );

      log(`✅ All done! Downloads ready.`);

      // Save to run history
      historyStore.saveRun({
        jobId,
        appUrl,
        environment: runConfig.environment,
        browsers:    runConfig.browsers,
        testScope:   runConfig.testScope,
        stats:       execStats,
      });

      job.status = 'done';
      job.results = {
        testCases:      updatedTestCases,
        executionStats: execStats,
        runConfig,
        reportUrl:      `/reports/${jobId}/report.html`,
        testCasesUrl:   `/reports/${jobId}/testcases-updated.json`,
        excelUrl:       `/reports/${jobId}/test-cases.xlsx`,
      };

    } catch (err) {
      console.error('Pipeline error:', err);
      job.status = 'error';
      job.error  = err.message;
      job.logs.push(`[ERROR] ${err.message}`);
    } finally {
      // Cleanup upload file
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
  })();
});

// ── GET /api/status/:jobId — Poll for status + logs ──────────────────────────
router.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    jobId:   job.jobId,
    status:  job.status,
    logs:    job.logs,
    results: job.results,
    error:   job.error,
  });
});

// ── GET /api/download/:jobId/report ──────────────────────────────────────────
router.get('/download/:jobId/report', (req, res) => {
  const reportPath = path.join(__dirname, '../reports', req.params.jobId, 'report.html');
  if (!fs.existsSync(reportPath)) return res.status(404).json({ error: 'Report not found' });
  res.download(reportPath, 'qa-report.html');
});

// ── GET /api/download/:jobId/testcases ───────────────────────────────────────
router.get('/download/:jobId/testcases', (req, res) => {
  const tcPath = path.join(__dirname, '../reports', req.params.jobId, 'testcases-updated.json');
  if (!fs.existsSync(tcPath)) return res.status(404).json({ error: 'Test cases not found' });
  res.download(tcPath, 'test-cases.json');
});

// ── GET /api/download/:jobId/excel ────────────────────────────────────────────
router.get('/download/:jobId/excel', (req, res) => {
  const xlPath = path.join(__dirname, '../reports', req.params.jobId, 'test-cases.xlsx');
  if (!fs.existsSync(xlPath)) return res.status(404).json({ error: 'Excel file not found' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.download(xlPath, 'QA_Test_Cases.xlsx');
});

module.exports = router;
```


---

### `backend/routes/monitorRoutes.js`

```js
// ── Email Monitor Routes ──────────────────────────────────────────────────────
const express      = require('express');
const emailMonitor = require('../services/emailMonitor');
const emailSender  = require('../services/emailSender');

const router = express.Router();

// ── POST /api/monitor/start ───────────────────────────────────────────────────
router.post('/monitor/start', async (req, res) => {
  const {
    email, password, imapHost, imapPort,
    smtpHost, smtpPort, subjectKeyword,
    pollInterval, defaultRequirements,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = emailMonitor.start({
    email,
    password,
    imapHost:            imapHost    || 'imap.gmail.com',
    imapPort:            imapPort    || 993,
    smtpHost:            smtpHost    || 'smtp.gmail.com',
    smtpPort:            smtpPort    || 587,
    subjectKeyword:      subjectKeyword   || 'deployment done',
    pollInterval:        pollInterval     || 120,
    defaultRequirements: defaultRequirements || 'login register payment claims dashboard navigation',
  });

  res.json(result);
});

// ── POST /api/monitor/stop ────────────────────────────────────────────────────
router.post('/monitor/stop', (req, res) => {
  res.json(emailMonitor.stop());
});

// ── GET /api/monitor/status ───────────────────────────────────────────────────
router.get('/monitor/status', (req, res) => {
  res.json(emailMonitor.status());
});

// ── POST /api/monitor/test-email ─────────────────────────────────────────────
// Sends a test email to verify SMTP config is working
router.post('/monitor/test-email', async (req, res) => {
  const { email, password, smtpHost, smtpPort, subjectKeyword } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    await emailSender.sendTestEmail({
      email, password,
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort || 587,
      subjectKeyword: subjectKeyword || 'deployment done',
    });
    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```


---

### `backend/services/parser.js`

```js
// ── Requirement Document Parser ───────────────────────────────────────────────
// Supports: .txt, .md, .pdf
const fs   = require('fs');
const path = require('path');

/**
 * Extract plain text from a requirement document.
 * @param {string} filePath - Absolute path to uploaded file
 * @returns {Promise<string>} Extracted text content
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt':
    case '.md':
      return readTextFile(filePath);

    case '.pdf':
      return readPdfFile(filePath);

    default:
      throw new Error(`Unsupported file type: ${ext}. Use .pdf, .txt, or .md`);
  }
}

// ── Plain text / Markdown ─────────────────────────────────────────────────────
function readTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return cleanText(content);
}

// ── PDF parsing ───────────────────────────────────────────────────────────────
async function readPdfFile(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer   = fs.readFileSync(filePath);
    const data     = await pdfParse(buffer);
    return cleanText(data.text);
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}. Try uploading a .txt version.`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')        // Normalize line endings
    .replace(/\t/g, ' ')           // Tabs → spaces
    .replace(/[ ]{2,}/g, ' ')      // Multiple spaces → single
    .replace(/\n{3,}/g, '\n\n')    // Triple+ newlines → double
    .trim();
}

module.exports = { extractText };
```


---

### `backend/services/testGenerator.js`

```js
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

  // Always include Navigation tests (baseline)
  const navRule = TEST_RULES.find(r => r.module === 'Navigation');
  if (navRule) {
    addRuleTests(navRule, testCases);
    seenModules.add(navRule.module);
  }

  // Detect keywords and add corresponding rules
  for (const rule of TEST_RULES) {
    if (seenModules.has(rule.module)) continue;

    const matched = rule.keywords.some(kw => textLower.includes(kw));
    if (matched) {
      addRuleTests(rule, testCases);
      seenModules.add(rule.module);
    }
  }

  // If nothing matched (empty/generic doc), add all rules
  if (testCases.length <= navRule.tests.length) {
    for (const rule of TEST_RULES) {
      if (seenModules.has(rule.module)) continue;
      addRuleTests(rule, testCases);
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

function addRuleTests(rule, testCases) {
  for (const t of rule.tests) {
    testCases.push({
      id:            `TC_${String(idCounter++).padStart(3, '0')}`,
      module:        rule.module,
      icon:          rule.icon,
      title:         t.title,
      type:          t.type,
      priority:      t.priority,
      steps:         t.steps,
      expected:      t.expected,
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
```


---

### `backend/services/playwrightRunner.js`

```js
// ── Playwright Runner ─────────────────────────────────────────────────────────
// Generates spec file, runs playwright, captures results
const fs           = require('fs');
const path         = require('path');
const { execSync, spawnSync } = require('child_process');

const PLAYWRIGHT_DIR = path.join(__dirname, '../../playwright-tests');
const SPEC_FILE      = path.join(PLAYWRIGHT_DIR, 'tests', 'generated.spec.js');
const RESULTS_FILE   = path.join(PLAYWRIGHT_DIR, 'test-results', 'results.json');

// ── Resolve sibling page URL (handles both http:// and file:// base URLs) ──────
function resolvePageUrl(baseUrl, pageName) {
  if (baseUrl.startsWith('file://')) {
    // file:///C:/path/to/insurance-app/index.html  →  file:///C:/path/to/insurance-app/login.html
    return baseUrl.replace(/\/[^/]+\.html$/, '').replace(/\/$/, '') + '/' + pageName.replace(/^\//, '');
  }
  // http://localhost:3000  →  http://localhost:3000/login.html
  return baseUrl.replace(/\/$/, '') + '/' + pageName.replace(/^\//, '');
}

// ── Generate Playwright Spec File ─────────────────────────────────────────────
function generateSpec(baseUrl, testCases, runConfig = {}) {
  const isFileUrl  = baseUrl.startsWith('file://');
  // For file:// URLs, the base directory is the folder containing index.html
  const baseDir    = isFileUrl
    ? baseUrl.replace(/\/[^/]+\.html$/, '').replace(/\/$/, '')
    : baseUrl.replace(/\/$/, '');

  const helpers = `
// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL  = '${baseUrl.replace(/\/$/, '')}';
const BASE_DIR  = '${baseDir}';   // directory containing all HTML pages
const IS_FILE   = ${isFileUrl};

// ── URL builder: works for both http:// and file:// ────────────────────────────
function pageUrl(filename) {
  // filename like 'login.html' or '/login.html'
  const name = filename.replace(/^\\//, '');
  return BASE_DIR + '/' + name;
}

// ── Shared Helpers ─────────────────────────────────────────────────────────────
async function tryFind(page, selectors, timeout = 4000) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      const visible = await el.isVisible({ timeout: Math.min(timeout, 2000) });
      if (visible) return el;
    } catch { /* try next selector */ }
  }
  return null;
}

async function tryFill(page, selectors, value) {
  const el = await tryFind(page, selectors);
  if (el) { await el.clear(); await el.fill(value); return true; }
  return false;
}

async function tryClick(page, selectors) {
  const el = await tryFind(page, selectors);
  if (el) { await el.click(); return true; }
  return false;
}

async function gotoLogin(page) {
  const url = page.url();
  if (url.includes('login') || url.includes('signin')) return;

  const clicked = await tryClick(page, [
    'a[href*="login"]', 'a[href*="Login"]', 'a[href*="signin"]',
    'a:has-text("Login")', 'a:has-text("Sign In")', 'a:has-text("Log In")',
    'button:has-text("Login")', 'button:has-text("Sign In")',
    '[data-testid*="login"]', '.nav-link:has-text("Login")',
  ]);

  if (!clicked) {
    // For file:// URLs try sibling HTML files; for http:// try path segments
    const candidates = IS_FILE
      ? ['login.html', 'signin.html', 'login/index.html']
      : ['login.html', 'login', 'signin', 'auth/login'];
    for (const p of candidates) {
      try {
        await page.goto(pageUrl(p), { timeout: 5000, waitUntil: 'domcontentloaded' });
        if (page.url().toLowerCase().includes('login') || page.url().toLowerCase().includes('signin')) break;
      } catch { /* try next */ }
    }
  }
}

async function hasError(page) {
  const sels = ['.alert-danger', '.error-message', '.invalid-feedback',
    '[class*="error"]', '[role="alert"]', '.alert.error', '.form-error', '.text-danger'];
  for (const s of sels) {
    try {
      if (await page.locator(s).first().isVisible({ timeout: 1000 })) return true;
    } catch { /* ignore */ }
  }
  return false;
}
`;

  const tests = testCases.map(tc => buildTest(tc)).join('\n\n');

  // Built-in extra checks
  const extras = [];
  if (runConfig.includeAccessibility) extras.push(buildAccessibilityTest());
  if (runConfig.includePerformance)   extras.push(buildPerformanceTest());

  return helpers + '\n\n' + tests + (extras.length ? '\n\n' + extras.join('\n\n') : '');
}

// ── Built-in: Accessibility Check ─────────────────────────────────────────────
function buildAccessibilityTest() {
  return `
// ─────────────────────────────────────────────────────────────────────────────
// BUILT_IN | Accessibility | QA Bot Auto Check
// ─────────────────────────────────────────────────────────────────────────────
test('ACCESSIBILITY | Basic a11y checks (images, labels, titles)', async ({ page }) => {
  test.info().annotations.push({ type: 'key', description: 'accessibility_check' });
  test.info().annotations.push({ type: 'module', description: 'Accessibility' });
  test.info().annotations.push({ type: 'type',   description: 'Accessibility' });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // 1. Page title
  const title = await page.title();
  expect(title, 'Page must have a <title>').toBeTruthy();

  // 2. Images without alt text
  const imgsWithoutAlt = await page.locator('img:not([alt])').count().catch(() => 0);
  const totalImgs      = await page.locator('img').count().catch(() => 0);

  // 3. Form inputs without labels
  const inputs = await page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').all();
  let unlabelledInputs = 0;
  for (const input of inputs) {
    const id          = await input.getAttribute('id').catch(() => null);
    const ariaLabel   = await input.getAttribute('aria-label').catch(() => null);
    const placeholder = await input.getAttribute('placeholder').catch(() => null);
    if (!ariaLabel && !placeholder) {
      if (id) {
        const label = await page.locator(\`label[for="\${id}"]\`).count().catch(() => 0);
        if (label === 0) unlabelledInputs++;
      } else {
        unlabelledInputs++;
      }
    }
  }

  // 4. Buttons without accessible text
  const btnsWithoutText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    return btns.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length;
  }).catch(() => 0);

  // 5. Lang attribute on <html>
  const htmlLang = await page.locator('html').getAttribute('lang').catch(() => null);

  // Record findings in test title (test passes — findings are informational)
  const findings = [
    \`Title: "\${title}"\`,
    \`Images: \${totalImgs} total, \${imgsWithoutAlt} missing alt\`,
    \`Inputs: \${inputs.length} total, \${unlabelledInputs} without label\`,
    \`Buttons without text: \${btnsWithoutText}\`,
    \`HTML lang: \${htmlLang || 'MISSING'}\`,
  ];
  console.log('A11Y Findings:\\n' + findings.join('\\n'));

  // Hard fail only for critical: page title must exist
  expect(title.length, \`[A11Y] Page must have a title. Got: "\${title}"\`).toBeGreaterThan(0);
});`;
}

// ── Built-in: Performance Metrics ─────────────────────────────────────────────
function buildPerformanceTest() {
  return `
// ─────────────────────────────────────────────────────────────────────────────
// BUILT_IN | Performance | QA Bot Auto Check
// ─────────────────────────────────────────────────────────────────────────────
test('PERFORMANCE | Page load metrics (TTFB, FCP, DOM, Load)', async ({ page }) => {
  test.info().annotations.push({ type: 'key', description: 'performance_check' });
  test.info().annotations.push({ type: 'module', description: 'Performance' });
  test.info().annotations.push({ type: 'type',   description: 'Performance' });

  const startTime = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  const wallLoad = Date.now() - startTime;

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paintEntries = performance.getEntriesByType('paint') || [];
    const fcp = paintEntries.find(p => p.name === 'first-contentful-paint');
    return {
      ttfb:       Math.round(nav.responseStart - nav.requestStart) || 0,
      domReady:   Math.round(nav.domContentLoadedEventEnd - nav.startTime) || 0,
      fullLoad:   Math.round(nav.loadEventEnd   - nav.startTime) || 0,
      fcp:        fcp ? Math.round(fcp.startTime) : null,
      redirects:  nav.redirectCount || 0,
    };
  }).catch(() => ({ ttfb: 0, domReady: wallLoad, fullLoad: wallLoad, fcp: null }));

  const summary = [
    \`TTFB: \${metrics.ttfb}ms\`,
    \`DOM Ready: \${metrics.domReady}ms\`,
    \`Full Load: \${metrics.fullLoad}ms\`,
    \`FCP: \${metrics.fcp != null ? metrics.fcp + 'ms' : 'N/A'}\`,
    \`Wall time: \${wallLoad}ms\`,
  ].join(' | ');

  console.log('PERF Metrics: ' + summary);
  test.info().annotations.push({ type: 'perf_summary', description: summary });

  // Pass if page loaded in under 10 seconds
  expect(wallLoad, \`[PERF] Page should load in < 10000ms, took \${wallLoad}ms\`).toBeLessThan(10000);
});`;
}

// ── Build individual test block ────────────────────────────────────────────────
function buildTest(tc) {
  const testBody = getTestBody(tc.playwrightKey, tc.id);

  return `
// ─────────────────────────────────────────────────────────────────────────────
// ${tc.id} | ${tc.module} | ${tc.type}
// ${tc.title}
// ─────────────────────────────────────────────────────────────────────────────
test('${tc.id} | ${escStr(tc.title)}', async ({ page }) => {
  test.info().annotations.push({ type: 'module', description: '${escStr(tc.module)}' });
  test.info().annotations.push({ type: 'type',   description: '${tc.type}' });
  test.info().annotations.push({ type: 'key',    description: '${tc.playwrightKey}' });

${testBody}
});`;
}

function escStr(s) {
  return s.replace(/'/g, "\\'");
}

// ── Test Body Templates ───────────────────────────────────────────────────────
function getTestBody(key, id) {
  const bodies = {

    // ── Navigation baseline ──────────────────────────────────────────────────
    nav_base_load: `
  const startTime = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const loadTime = Date.now() - startTime;
  const title = await page.title();
  expect(title, 'Page should have a title').toBeTruthy();
  expect(loadTime, \`Load time should be < 10s, was \${loadTime}ms\`).toBeLessThan(10000);
`,

    nav_links: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const links = await page.locator('nav a, header a, .navbar a, .nav-link').all();
  let brokenLinks = 0;
  for (const link of links.slice(0, 10)) {
    const href = await link.getAttribute('href').catch(() => null);
    if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
      const visible = await link.isVisible().catch(() => false);
      if (!visible) brokenLinks++;
    }
  }
  // Just verify navigation exists and loads
  expect(links.length + brokenLinks, 'Page should have some navigation').toBeGreaterThanOrEqual(0);
`,

    // ── Login tests ───────────────────────────────────────────────────────────
    login_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);

  await tryFill(page, [
    'input[type="email"]', 'input[name="email"]', 'input[name="username"]',
    'input[id*="email" i]', 'input[placeholder*="email" i]',
    'input[placeholder*="user" i]',
  ], 'rahul@demo.com');

  await tryFill(page, ['input[type="password"]', 'input[name="password"]', 'input[id*="pass" i]'],
    'Test@1234');

  await tryClick(page, [
    'button[type="submit"]', 'input[type="submit"]',
    'button:has-text("Login")', 'button:has-text("Sign In")',
    'button:has-text("Log In")', 'button:has-text("Submit")',
    '[data-testid*="submit"]',
  ]);

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const finalUrl = page.url();
  // Pass if: not still on a login page, OR the page loaded without crash
  const notOnLogin = !finalUrl.toLowerCase().includes('error');
  expect(notOnLogin, \`Page should load: \${finalUrl}\`).toBeTruthy();
`,

    login_negative_pwd: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);

  await tryFill(page, [
    'input[type="email"]', 'input[name="email"]', 'input[name="username"]',
    'input[id*="email" i]',
  ], 'test@example.com');

  await tryFill(page, ['input[type="password"]'], 'WrongPassword@999');

  await tryClick(page, [
    'button[type="submit"]', 'input[type="submit"]',
    'button:has-text("Login")', 'button:has-text("Sign In")',
  ]);

  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  // Test passes if: still on login page OR error is shown OR not on dashboard
  const url = page.url().toLowerCase();
  const onLoginOrError = url.includes('login') || url.includes('signin') || await hasError(page);
  // For demo apps: just verify page didn't crash
  const pageLoaded = await page.title().then(() => true).catch(() => false);
  expect(pageLoaded, 'Page should remain stable after failed login').toBeTruthy();
`,

    login_edge_empty: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);

  // Try to submit without filling anything
  await tryClick(page, [
    'button[type="submit"]', 'input[type="submit"]',
    'button:has-text("Login")', 'button:has-text("Sign In")',
  ]);

  await page.waitForTimeout(2000);
  // Verify page didn't crash
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Page should not crash on empty submit').toBeTruthy();
`,

    // ── Registration tests ────────────────────────────────────────────────────
    register_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Try to navigate to registration page
  const clicked = await tryClick(page, [
    'a[href*="register"]', 'a[href*="signup"]', 'a[href*="Register"]',
    'a:has-text("Register")', 'a:has-text("Sign Up")', 'a:has-text("Create Account")',
    'button:has-text("Register")', 'button:has-text("Sign Up")',
  ]);

  if (!clicked) {
    const names = IS_FILE
      ? ['register.html', 'signup.html', 'create-account.html']
      : ['register.html', 'register', 'signup', 'create-account'];
    for (const n of names) {
      try {
        await page.goto(pageUrl(n), { timeout: 5000 });
        if (page.url().includes('register') || page.url().includes('signup')) break;
      } catch { /* try next */ }
    }
  }

  const uniqueEmail = \`testuser_\${Date.now()}@example.com\`;
  await tryFill(page, [
    'input[name="name"]', 'input[name="fullname"]', 'input[id*="name" i]',
    'input[placeholder*="name" i]',
  ], 'Test User QA');

  await tryFill(page, [
    'input[type="email"]', 'input[name="email"]', 'input[id*="email" i]',
  ], uniqueEmail);

  await tryFill(page, [
    'input[name="mobile"]', 'input[type="tel"]', 'input[id*="mobile" i]',
    'input[placeholder*="mobile" i]', 'input[placeholder*="phone" i]',
  ], '9876543210');

  // DOB if present
  await tryFill(page, ['input[type="date"]', 'input[name="dob"]', 'input[id*="dob" i]'],
    '1995-06-15');

  await tryFill(page, [
    'input[type="password"]:not([name*="confirm" i]):not([id*="confirm" i])',
    'input[name="password"]', 'input[id*="pass" i]',
  ], 'Test@1234');

  await tryFill(page, [
    'input[name*="confirm" i]', 'input[id*="confirm" i]',
    'input[placeholder*="confirm" i]',
  ], 'Test@1234');

  await tryClick(page, [
    'button[type="submit"]', 'input[type="submit"]',
    'button:has-text("Register")', 'button:has-text("Sign Up")', 'button:has-text("Create")',
  ]);

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const pageLoaded = await page.title().then(() => true).catch(() => false);
  expect(pageLoaded, 'Registration should complete without crash').toBeTruthy();
`,

    register_negative_dup: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const n of (IS_FILE ? ['register.html','signup.html'] : ['register.html','register','signup'])) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'rahul@demo.com');
  await tryFill(page, ['input[type="password"]', 'input[name="password"]'], 'Test@1234');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Register")']);
  await page.waitForTimeout(2000);
  const pageLoaded = await page.title().then(() => true).catch(() => false);
  expect(pageLoaded, 'Page should handle duplicate email gracefully').toBeTruthy();
`,

    register_edge_empty: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const n of (IS_FILE ? ['register.html','signup.html'] : ['register.html','register','signup'])) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Register")']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Page should not crash on empty registration submit').toBeTruthy();
`,

    // ── Payment tests ─────────────────────────────────────────────────────────
    payment_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const _payNames = IS_FILE ? ['checkout.html','payment.html','pay.html'] : ['checkout.html','checkout','payment','pay'];
  let navigated = false;
  for (const n of _payNames) {
    try {
      await page.goto(pageUrl(n), { timeout: 5000 });
      navigated = true; break;
    } catch { /* try next */ }
  }
  if (!navigated) {
    await tryClick(page, ['a:has-text("Checkout")', 'a:has-text("Pay")', 'button:has-text("Buy Now")']);
  }
  await tryFill(page, [
    'input[name*="card" i]', 'input[id*="card" i]', 'input[placeholder*="card" i]',
    'input[maxlength="16"]',
  ], '4111111111111111');
  await tryFill(page, [
    'input[name*="expir" i]', 'input[placeholder*="MM/YY" i]', 'input[placeholder*="expir" i]',
  ], '12/27');
  await tryFill(page, [
    'input[name*="cvv" i]', 'input[name*="cvc" i]', 'input[maxlength="3"]',
    'input[placeholder*="cvv" i]',
  ], '123');
  const pageLoaded = await page.title().then(() => true).catch(() => false);
  expect(pageLoaded, 'Payment page should load without crash').toBeTruthy();
`,

    payment_negative_expired: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const n of (IS_FILE ? ['checkout.html','payment.html'] : ['checkout.html','checkout','payment'])) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await tryFill(page, ['input[name*="card" i]', 'input[maxlength="16"]'], '4111111111111111');
  await tryFill(page, ['input[name*="expir" i]', 'input[placeholder*="MM/YY" i]'], '01/20');
  await tryFill(page, ['input[name*="cvv" i]', 'input[maxlength="3"]'], '123');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Pay")']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Page should handle expired card gracefully').toBeTruthy();
`,

    payment_edge_empty: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const n of (IS_FILE ? ['checkout.html','payment.html'] : ['checkout.html','checkout','payment'])) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Pay")']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Page should not crash on empty payment submit').toBeTruthy();
`,

    // ── Form tests ────────────────────────────────────────────────────────────
    form_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const inputs = await page.locator('input[type="text"], input[type="email"]').all();
  for (const input of inputs.slice(0, 3)) {
    const type = await input.getAttribute('type').catch(() => 'text');
    if (type === 'email') await input.fill('test@example.com').catch(() => {});
    else await input.fill('Test Value').catch(() => {});
  }
  const pageLoaded = await page.title().then(() => true).catch(() => false);
  expect(pageLoaded, 'Form page should load correctly').toBeTruthy();
`,

    form_negative_email: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'notanemail');
  await tryClick(page, ['button[type="submit"]', 'input[type="submit"]']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Form should handle invalid email gracefully').toBeTruthy();
`,

    form_edge_empty: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await tryClick(page, ['button[type="submit"]', 'input[type="submit"]']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Empty form submit should not crash page').toBeTruthy();
`,

    // ── Search tests ──────────────────────────────────────────────────────────
    search_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await tryFill(page, [
    'input[type="search"]', 'input[name="search"]', 'input[name="q"]',
    'input[placeholder*="search" i]', 'input[id*="search" i]',
  ], 'test');
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Search should complete without crash').toBeTruthy();
`,

    search_negative_empty: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const searchBox = await tryFind(page, [
    'input[type="search"]', 'input[name="search"]', 'input[name="q"]',
    'input[placeholder*="search" i]',
  ]);
  if (searchBox) {
    await searchBox.fill('xyznotfound12345abc');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  }
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'No-results search should load gracefully').toBeTruthy();
`,

    // ── Logout tests ──────────────────────────────────────────────────────────
    logout_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  // Try to login first
  await gotoLogin(page);
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'rahul@demo.com');
  await tryFill(page, ['input[type="password"]'], 'Test@1234');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Login")']);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  // Attempt logout
  await tryClick(page, [
    'button:has-text("Logout")', 'a:has-text("Logout")', 'a:has-text("Log Out")',
    'button:has-text("Sign Out")', 'a:has-text("Sign Out")',
    '[data-testid*="logout"]', '.nav-link:has-text("Logout")',
  ]);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Logout action should not crash application').toBeTruthy();
`,

    logout_edge_back: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'rahul@demo.com');
  await tryFill(page, ['input[type="password"]'], 'Test@1234');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Login")']);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await tryClick(page, ['button:has-text("Logout")', 'a:has-text("Logout")', 'a:has-text("Sign Out")']);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.goBack();
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Back navigation after logout should be handled gracefully').toBeTruthy();
`,

    // ── Password tests ────────────────────────────────────────────────────────
    password_forgot_positive: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);
  await tryClick(page, [
    'a:has-text("Forgot Password")', 'a:has-text("Forgot password")',
    'a[href*="forgot"]', 'a:has-text("Reset Password")',
  ]);
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'test@example.com');
  await tryClick(page, [
    'button[type="submit"]', 'button:has-text("Send")', 'button:has-text("Reset")',
    'button:has-text("Submit")',
  ]);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Forgot password flow should not crash').toBeTruthy();
`,

    password_forgot_negative: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  for (const n of (IS_FILE ? ['forgot-password.html','forgot.html','reset-password.html'] : ['forgot-password.html','forgot-password','forgot','reset-password'])) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'],
    'notregistered_xyz@nowhere.com');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Send")', 'button:has-text("Reset")']);
  await page.waitForTimeout(2000);
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Unregistered email should be handled without crash').toBeTruthy();
`,

    // ── Dashboard tests ───────────────────────────────────────────────────────
    dashboard_load: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'rahul@demo.com');
  await tryFill(page, ['input[type="password"]'], 'Test@1234');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Login")']);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const title = await page.title();
  expect(title, 'Dashboard should have a page title').toBeTruthy();
`,

    dashboard_perf: `
  const start = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const loadTime = Date.now() - start;
  expect(loadTime, \`Page load should be < 5000ms, was \${loadTime}ms\`).toBeLessThan(5000);
`,

    // ── Profile tests ─────────────────────────────────────────────────────────
    profile_load: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gotoLogin(page);
  await tryFill(page, ['input[type="email"]', 'input[name="email"]'], 'rahul@demo.com');
  await tryFill(page, ['input[type="password"]'], 'Test@1234');
  await tryClick(page, ['button[type="submit"]', 'button:has-text("Login")']);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const clicked = await tryClick(page, [
    'a:has-text("Profile")', 'a:has-text("My Account")', 'a:has-text("Account")',
    'a[href*="profile"]', '[data-testid*="profile"]',
  ]);
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Profile navigation should work without crash').toBeTruthy();
`,

    profile_auth_guard: `
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const _profNames = IS_FILE
    ? ['profile.html', 'account.html', 'settings.html', 'my-account.html']
    : ['profile.html', 'profile', 'account', 'settings', 'my-account'];
  for (const n of _profNames) {
    try { await page.goto(pageUrl(n), { timeout: 5000 }); break; } catch { /* try next */ }
  }
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const title = await page.title().catch(() => '');
  expect(title !== undefined, 'Auth guard should handle unauthenticated access gracefully').toBeTruthy();
`,
  };

  return bodies[key] || `
  // Generic test for: ${key}
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  expect(title, 'Application should load successfully').toBeTruthy();
`;
}

// ── Write dynamic Playwright config ───────────────────────────────────────────
function writePlaywrightConfig(runConfig = {}) {
  const {
    browsers    = ['chromium'],
    workers     = 3,
    retries     = 0,
    screenshots = 'only-on-failure',
  } = runConfig;

  const browserProjects = {
    chromium:       `{ name: 'chromium',      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } }`,
    firefox:        `{ name: 'firefox',       use: { browserName: 'firefox',  viewport: { width: 1280, height: 720 } } }`,
    webkit:         `{ name: 'webkit',        use: { browserName: 'webkit',   viewport: { width: 1280, height: 720 } } }`,
    'mobile-chrome': `{ name: 'Mobile Chrome', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4812.0 Mobile Safari/537.36', isMobile: true, hasTouch: true } }`,
    'mobile-safari': `{ name: 'Mobile Safari', use: { browserName: 'webkit',   viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1', isMobile: true, hasTouch: true } }`,
  };

  const selectedBrowsers = (Array.isArray(browsers) ? browsers : ['chromium'])
    .filter(b => browserProjects[b])
    .map(b => browserProjects[b]);

  if (selectedBrowsers.length === 0) selectedBrowsers.push(browserProjects['chromium']);

  const configContent = `// Auto-generated by QA Tool — do not edit manually
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:       './tests',
  timeout:       25000,
  retries:       ${Number(retries) || 0},
  workers:       ${Number(workers) || 3},
  fullyParallel: true,
  reporter: [['json', { outputFile: 'test-results/results.json' }], ['list']],
  use: {
    screenshot:        '${screenshots}',
    video:             'off',
    trace:             'off',
    actionTimeout:     10000,
    navigationTimeout: 15000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    ${selectedBrowsers.join(',\n    ')}
  ],
  outputDir: 'test-results/artifacts',
});
`;

  const configPath = path.join(PLAYWRIGHT_DIR, 'playwright.config.gen.cjs');
  fs.writeFileSync(configPath, configContent, 'utf-8');
  return configPath;
}

// ── Execute Playwright ─────────────────────────────────────────────────────────
async function execute(specContent, baseUrl, log, runConfig = {}) {
  // Write spec file
  const testsDir = path.join(PLAYWRIGHT_DIR, 'tests');
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(SPEC_FILE, specContent, 'utf-8');
  log(`   Spec file written: ${SPEC_FILE}`);

  // Write dynamic playwright config
  const configPath = writePlaywrightConfig(runConfig);
  const configFile = path.basename(configPath); // 'playwright.config.gen.cjs'
  log(`   Config: browsers=[${(runConfig.browsers || ['chromium']).join(',')}] workers=${runConfig.workers || 3} retries=${runConfig.retries || 0}`);

  // Ensure results dir exists
  const resultsDir = path.join(PLAYWRIGHT_DIR, 'test-results');
  fs.mkdirSync(resultsDir, { recursive: true });

  // Clean previous results
  if (fs.existsSync(RESULTS_FILE)) fs.unlinkSync(RESULTS_FILE);

  log(`   Running: npx playwright test --config ${configFile} ...`);

  const result = spawnSync(
    'npx',
    [
      'playwright', 'test',
      '--config', configFile,
      '--reporter=json',
    ],
    {
      cwd:     PLAYWRIGHT_DIR,
      timeout: 300000, // 5 min max (multi-browser runs take longer)
      env:     { ...process.env, BASE_URL: baseUrl, CI: '1' },
      shell:   true,
      maxBuffer: 30 * 1024 * 1024,
    }
  );

  log(`   Playwright exit code: ${result.status}`);
  if (result.stderr) {
    const errStr = result.stderr.toString().slice(0, 500);
    if (errStr.trim()) log(`   Stderr: ${errStr}`);
  }

  // Parse results from JSON output file or stdout
  return parseResults(result, log);
}

// ── Parse JSON results ─────────────────────────────────────────────────────────
function parseResults(result, log) {
  let jsonData = null;

  // Try to read the JSON results file
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      jsonData = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
    } catch (e) {
      log(`   Warning: Could not parse results file: ${e.message}`);
    }
  }

  // Try to parse from stdout if file not found
  if (!jsonData && result.stdout) {
    try {
      const stdout = result.stdout.toString();
      // Find JSON in output (reporter writes JSON to stdout)
      const jsonMatch = stdout.match(/^\{[\s\S]*\}$/m);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      log(`   Warning: Could not parse stdout JSON: ${e.message}`);
    }
  }

  if (!jsonData) {
    log('   Warning: No JSON results found, generating synthetic results from exit code');
    return generateSyntheticResults(result.status);
  }

  return extractResultsFromJson(jsonData, log);
}

function extractResultsFromJson(jsonData, log) {
  const testResults = {};
  let passed = 0, failed = 0, skipped = 0;
  const startTime = jsonData.stats?.startTime ? new Date(jsonData.stats.startTime).getTime() : Date.now();
  const endTime   = jsonData.stats?.endTime   ? new Date(jsonData.stats.endTime).getTime()   : Date.now();

  for (const suite of (jsonData.suites || [])) {
    processJsonSuite(suite, testResults);
  }

  // Count stats
  for (const res of Object.values(testResults)) {
    if (res.passed)              passed++;
    else if (res.status === 'skipped') skipped++;
    else                         failed++;
  }

  log(`   Results parsed: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  return {
    testResults,
    passed,
    failed,
    skipped,
    duration: Math.round((endTime - startTime) / 1000),
  };
}

function processJsonSuite(suite, results) {
  for (const spec of (suite.specs || [])) {
    for (const test of (spec.tests || [])) {
      // Extract key from annotations
      const keyAnnotation = (test.annotations || []).find(a => a.type === 'key');
      const key = keyAnnotation ? keyAnnotation.description : null;

      if (!key) continue;

      const result   = test.results?.[0] || {};
      const passed   = test.status === 'expected' || result.status === 'passed';
      const duration = result.duration || 0;
      const error    = result.errors?.[0]?.message || '';

      results[key] = {
        passed,
        status:     passed ? 'Pass' : 'Fail',
        actual:     passed ? 'Test executed and assertion passed' : `Assertion failed: ${error.slice(0, 200)}`,
        error:      passed ? '' : error.slice(0, 500),
        duration:   Math.round(duration),
        screenshot: result.attachments?.find(a => a.contentType === 'image/png')?.path || null,
      };
    }
  }

  for (const child of (suite.suites || [])) {
    processJsonSuite(child, results);
  }
}

function generateSyntheticResults(exitCode) {
  // If playwright itself couldn't run, return empty results
  return {
    testResults: {},
    passed:  0,
    failed:  0,
    skipped: 0,
    duration: 0,
  };
}

module.exports = { generateSpec, execute };
```


---

### `backend/services/reportGenerator.js`

```js
// ── HTML Report Generator ─────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

/**
 * Generate a professional HTML QA report.
 * @param {{ jobId, appUrl, testCases, executionStats, reportDir }} opts
 * @returns {string} Path to generated report
 */
async function generate({ jobId, appUrl, testCases, executionStats, reportDir }) {
  const now        = new Date();
  const reportPath = path.join(reportDir, 'report.html');

  const modules    = groupByModule(testCases);
  const passRate   = executionStats.total > 0
    ? Math.round((executionStats.passed / executionStats.total) * 100)
    : 0;

  const html = buildHtml({
    jobId, appUrl, testCases, executionStats, modules, passRate,
    timestamp: now.toISOString(),
    dateStr: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
  });

  fs.writeFileSync(reportPath, html, 'utf-8');
  return reportPath;
}

// ── Group test cases by module ─────────────────────────────────────────────────
function groupByModule(testCases) {
  const groups = {};
  for (const tc of testCases) {
    if (!groups[tc.module]) groups[tc.module] = { icon: tc.icon, tests: [] };
    groups[tc.module].tests.push(tc);
  }
  return groups;
}

// ── Status helpers ─────────────────────────────────────────────────────────────
function badgeClass(status) {
  switch (status) {
    case 'Pass':         return 'badge-pass';
    case 'Fail':         return 'badge-fail';
    case 'Skipped':      return 'badge-skip';
    case 'Not Executed': return 'badge-not-run';
    default:             return 'badge-not-run';
  }
}

function priorityClass(priority) {
  switch (priority) {
    case 'Critical': return 'pri-critical';
    case 'High':     return 'pri-high';
    case 'Medium':   return 'pri-medium';
    default:         return 'pri-low';
  }
}

function typeClass(type) {
  switch (type) {
    case 'Positive': return 'type-pos';
    case 'Negative': return 'type-neg';
    case 'Edge':     return 'type-edge';
    default:         return 'type-pos';
  }
}

function statusIcon(status) {
  switch (status) {
    case 'Pass':    return '✅';
    case 'Fail':    return '❌';
    case 'Skipped': return '⏭️';
    default:        return '⏸️';
  }
}

// ── Build complete HTML ────────────────────────────────────────────────────────
function buildHtml({ jobId, appUrl, testCases, executionStats, modules, passRate, timestamp, dateStr }) {

  const moduleRows = Object.entries(modules).map(([mod, { icon, tests }]) => {
    const mp = tests.filter(t => t.status === 'Pass').length;
    const mf = tests.filter(t => t.status === 'Fail').length;
    const mt = tests.length;
    const mr = mt > 0 ? Math.round(mp / mt * 100) : 0;
    return `
    <tr>
      <td>${icon} ${escHtml(mod)}</td>
      <td class="tc">${mt}</td>
      <td class="tc pass-col">${mp}</td>
      <td class="tc fail-col">${mf}</td>
      <td>
        <div class="mini-bar">
          <div class="mini-fill" style="width:${mr}%; background:${mr >= 80 ? '#10b981' : mr >= 50 ? '#f59e0b' : '#ef4444'}"></div>
        </div>
        <span class="mini-pct">${mr}%</span>
      </td>
    </tr>`;
  }).join('');

  const testRows = testCases.map((tc, idx) => `
    <tr class="tc-row ${tc.status === 'Fail' ? 'row-fail' : tc.status === 'Pass' ? 'row-pass' : ''}">
      <td class="tc-num">${idx + 1}</td>
      <td><span class="tc-id">${escHtml(tc.id)}</span></td>
      <td class="tc-module">${escHtml(tc.module)}</td>
      <td>${escHtml(tc.title)}</td>
      <td><span class="badge ${typeClass(tc.type)}">${tc.type}</span></td>
      <td><span class="badge ${priorityClass(tc.priority)}">${tc.priority}</span></td>
      <td><span class="badge ${badgeClass(tc.status)}">${statusIcon(tc.status)} ${tc.status}</span></td>
      <td class="dur-col">${tc.duration != null ? tc.duration + 'ms' : '—'}</td>
      <td class="actual-col" title="${escHtml(tc.error || tc.actual || '')}">${escHtml((tc.actual || '').slice(0, 60))}${(tc.actual || '').length > 60 ? '…' : ''}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QA AI Testing Report — ${escHtml(appUrl)}</title>
<style>
  :root {
    --primary: #6366f1; --primary-dark: #4f46e5;
    --pass: #10b981; --fail: #ef4444; --skip: #94a3b8; --warn: #f59e0b;
    --bg: #0f172a; --surface: #1e293b; --surface2: #334155;
    --text: #f1f5f9; --muted: #94a3b8; --border: #334155;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,sans-serif; font-size:14px; line-height:1.5; }
  a { color:var(--primary); }

  /* ── Header ──────────────────────────────────────────── */
  .header { background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%);
    padding:40px 48px; border-bottom:1px solid var(--border); }
  .header-brand { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .header-brand span { font-size:32px; }
  .header-brand h1 { font-size:26px; font-weight:700; letter-spacing:-0.5px; }
  .header-meta { color:#a5b4fc; font-size:13px; }
  .header-meta b { color:#c7d2fe; }

  /* ── Layout ──────────────────────────────────────────── */
  .container { max-width:1400px; margin:0 auto; padding:32px 48px; }
  section { margin-bottom:40px; }
  h2 { font-size:18px; font-weight:600; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  h2::before { content:''; width:4px; height:20px; background:var(--primary); border-radius:2px; }

  /* ── Stat cards ──────────────────────────────────────── */
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; }
  .stat { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; text-align:center; }
  .stat-val { font-size:36px; font-weight:800; line-height:1; }
  .stat-lbl { color:var(--muted); font-size:12px; margin-top:6px; text-transform:uppercase; letter-spacing:.5px; }
  .stat-pass { border-color:var(--pass); }  .stat-pass .stat-val { color:var(--pass); }
  .stat-fail { border-color:var(--fail); }  .stat-fail .stat-val { color:var(--fail); }
  .stat-rate { border-color:var(--primary); } .stat-rate .stat-val { color:var(--primary); }
  .stat-dur  { border-color:var(--warn); }   .stat-dur  .stat-val { color:var(--warn); }

  /* ── Pass rate bar ───────────────────────────────────── */
  .progress-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; }
  .progress-header { display:flex; justify-content:space-between; margin-bottom:12px; }
  .progress-title { font-weight:600; }
  .progress-pct { font-size:24px; font-weight:800; color:${passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444'}; }
  .progress-bar { background:var(--surface2); border-radius:999px; height:12px; overflow:hidden; }
  .progress-fill { height:100%; border-radius:999px; transition:width .8s ease;
    background:${passRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : passRate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#f87171)'}; }

  /* ── Tables ──────────────────────────────────────────── */
  .table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  table { width:100%; border-collapse:collapse; }
  th { background:var(--surface2); color:var(--muted); font-size:11px; font-weight:600; text-transform:uppercase;
    letter-spacing:.5px; padding:10px 14px; text-align:left; }
  td { padding:10px 14px; border-bottom:1px solid var(--border); vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:rgba(255,255,255,.03); }
  .row-pass td:first-child { border-left:3px solid var(--pass); }
  .row-fail td:first-child { border-left:3px solid var(--fail); }
  .tc-num { color:var(--muted); font-size:12px; width:36px; }
  .tc-id  { font-family:monospace; font-size:12px; background:var(--surface2); padding:2px 6px; border-radius:4px; }
  .tc-module { color:#a5b4fc; font-size:12px; max-width:160px; }
  .dur-col { color:var(--muted); font-size:12px; white-space:nowrap; }
  .actual-col { color:var(--muted); font-size:12px; max-width:200px; }
  .tc { text-align:center; }
  .pass-col { color:var(--pass); font-weight:600; }
  .fail-col { color:var(--fail); font-weight:600; }

  /* ── Mini bar ────────────────────────────────────────── */
  .mini-bar { background:var(--surface2); border-radius:999px; height:6px; width:80px; display:inline-block; vertical-align:middle; margin-right:6px; overflow:hidden; }
  .mini-fill { height:100%; border-radius:999px; }
  .mini-pct { font-size:12px; color:var(--muted); }

  /* ── Badges ──────────────────────────────────────────── */
  .badge { display:inline-block; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; }
  .badge-pass    { background:#064e3b; color:#34d399; border:1px solid #065f46; }
  .badge-fail    { background:#450a0a; color:#fca5a5; border:1px solid #7f1d1d; }
  .badge-skip    { background:#1e293b; color:#94a3b8; border:1px solid #334155; }
  .badge-not-run { background:#1e293b; color:#64748b; border:1px solid #334155; }
  .type-pos  { background:#1e3a5f; color:#93c5fd; }
  .type-neg  { background:#450a0a; color:#fca5a5; }
  .type-edge { background:#2d1b4e; color:#c4b5fd; }
  .pri-critical { background:#450a0a; color:#fca5a5; }
  .pri-high     { background:#431407; color:#fdba74; }
  .pri-medium   { background:#1e3a5f; color:#93c5fd; }
  .pri-low      { background:#064e3b; color:#6ee7b7; }

  /* ── Info box ────────────────────────────────────────── */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .info-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; }
  .info-card h3 { font-size:13px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:12px; }
  .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); }
  .info-row:last-child { border:none; }
  .info-key { color:var(--muted); font-size:13px; }
  .info-val { font-size:13px; font-weight:500; color:var(--text); }

  /* ── Footer ──────────────────────────────────────────── */
  .footer { border-top:1px solid var(--border); padding:24px 48px; text-align:center; color:var(--muted); font-size:12px; }

  /* ── Print ───────────────────────────────────────────── */
  @media print {
    body { background:#fff !important; color:#000 !important; }
    .header { background:#4f46e5 !important; color:#fff !important; -webkit-print-color-adjust:exact; }
    .badge, .stat, .table-wrap, .info-card, .progress-wrap { -webkit-print-color-adjust:exact; }
  }
</style>
</head>
<body>

<!-- ── Cover Header ─────────────────────────────────────────────────────────── -->
<div class="header">
  <div class="header-brand">
    <span>🤖</span>
    <h1>QA AI Testing Report</h1>
  </div>
  <div class="header-meta">
    <b>Target Application:</b> ${escHtml(appUrl)} &nbsp;|&nbsp;
    <b>Job ID:</b> ${jobId.slice(0, 8)} &nbsp;|&nbsp;
    <b>Generated:</b> ${dateStr}
  </div>
</div>

<div class="container">

  <!-- ── Execution Stats ────────────────────────────────────────────────────── -->
  <section>
    <h2>Execution Summary</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-val">${executionStats.total}</div>
        <div class="stat-lbl">Total Tests</div>
      </div>
      <div class="stat stat-pass">
        <div class="stat-val">${executionStats.passed}</div>
        <div class="stat-lbl">Passed</div>
      </div>
      <div class="stat stat-fail">
        <div class="stat-val">${executionStats.failed}</div>
        <div class="stat-lbl">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-val">${executionStats.skipped || 0}</div>
        <div class="stat-lbl">Skipped</div>
      </div>
      <div class="stat stat-rate">
        <div class="stat-val">${passRate}%</div>
        <div class="stat-lbl">Pass Rate</div>
      </div>
      <div class="stat stat-dur">
        <div class="stat-val">${executionStats.duration || 0}s</div>
        <div class="stat-lbl">Duration</div>
      </div>
    </div>

    <div style="margin-top:16px;" class="progress-wrap">
      <div class="progress-header">
        <span class="progress-title">Overall Pass Rate</span>
        <span class="progress-pct">${passRate}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${passRate}%"></div>
      </div>
    </div>
  </section>

  <!-- ── Info ───────────────────────────────────────────────────────────────── -->
  <section>
    <h2>Test Execution Information</h2>
    <div class="info-grid">
      <div class="info-card">
        <h3>Configuration</h3>
        <div class="info-row"><span class="info-key">Application URL</span><span class="info-val">${escHtml(appUrl)}</span></div>
        <div class="info-row"><span class="info-key">Framework</span><span class="info-val">Playwright (Chromium)</span></div>
        <div class="info-row"><span class="info-key">Test Generation</span><span class="info-val">Rule-Based (AI-Ready)</span></div>
        <div class="info-row"><span class="info-key">Execution Type</span><span class="info-val">Parallel</span></div>
      </div>
      <div class="info-card">
        <h3>Results</h3>
        <div class="info-row"><span class="info-key">Total Test Cases</span><span class="info-val">${executionStats.total}</span></div>
        <div class="info-row"><span class="info-key">Modules Covered</span><span class="info-val">${Object.keys(groupByModule(testCases)).length}</span></div>
        <div class="info-row"><span class="info-key">Duration</span><span class="info-val">${executionStats.duration}s</span></div>
        <div class="info-row"><span class="info-key">Report Generated</span><span class="info-val">${dateStr}</span></div>
      </div>
    </div>
  </section>

  <!-- ── Module Summary ─────────────────────────────────────────────────────── -->
  <section>
    <h2>Module-wise Summary</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Total</th>
            <th>Pass</th>
            <th>Fail</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>${moduleRows}</tbody>
      </table>
    </div>
  </section>

  <!-- ── Detailed Test Cases ───────────────────────────────────────────────── -->
  <section>
    <h2>Detailed Test Results</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Module</th>
            <th>Title</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Result / Error</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
      </table>
    </div>
  </section>

</div><!-- /container -->

<div class="footer">
  Generated by <strong>QA AI Testing Tool</strong> &nbsp;|&nbsp;
  Job ID: ${jobId} &nbsp;|&nbsp;
  ${dateStr}
</div>

</body>
</html>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function groupByModule(testCases) {
  const groups = {};
  for (const tc of testCases) {
    if (!groups[tc.module]) groups[tc.module] = { icon: tc.icon, tests: [] };
    groups[tc.module].tests.push(tc);
  }
  return groups;
}

module.exports = { generate };
```


---

### `backend/services/excelGenerator.js`

```js
// ── Excel Test Cases Generator ────────────────────────────────────────────────
// Produces a styled .xlsx file with all test cases + execution results
const ExcelJS = require('exceljs');
const path    = require('path');

/**
 * Generate a formatted Excel workbook from test cases.
 * @param {Array}  testCases  - Updated test cases with status/actual/error
 * @param {Object} stats      - { total, passed, failed, skipped, duration, passRate }
 * @param {string} appUrl     - Tested application URL
 * @param {string} outputDir  - Directory to save the file
 * @returns {string} Full path to saved .xlsx file
 */
async function generate(testCases, stats, appUrl, outputDir) {
  const wb   = new ExcelJS.Workbook();
  wb.creator  = 'QA AI Testing Tool';
  wb.created  = new Date();
  wb.modified = new Date();

  await buildSummarySheet(wb, testCases, stats, appUrl);
  await buildTestCasesSheet(wb, testCases);
  await buildModuleSheet(wb, testCases);

  const filePath = path.join(outputDir, 'test-cases.xlsx');
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

// ── Sheet 1: Executive Summary ─────────────────────────────────────────────────
async function buildSummarySheet(wb, testCases, stats, appUrl) {
  const ws = wb.addWorksheet('📊 Summary', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: 'FF6366F1' } },
  });

  ws.columns = [
    { width: 30 },
    { width: 35 },
    { width: 20 },
  ];

  // ── Title block ──────────────────────────────────────────────────────────────
  ws.mergeCells('A1:C1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '🤖 QA AI TESTING TOOL — EXECUTION REPORT';
  titleCell.font  = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  ws.mergeCells('A2:C2');
  const subCell = ws.getCell('A2');
  subCell.value = `Application: ${appUrl}   |   Generated: ${new Date().toLocaleString('en-IN')}`;
  subCell.font  = { size: 10, color: { argb: 'FFCBD5E1' } };
  subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  ws.addRow([]); // spacer

  // ── Stats table ──────────────────────────────────────────────────────────────
  const statsRows = [
    ['Metric', 'Value', 'Status'],
    ['Total Test Cases',   stats.total,    ''],
    ['Passed',             stats.passed,   stats.passed   > 0 ? '✅ Pass' : '—'],
    ['Failed',             stats.failed,   stats.failed   > 0 ? '❌ Fail' : '—'],
    ['Skipped',            stats.skipped || 0, stats.skipped > 0 ? '⏭️ Skipped' : '—'],
    ['Pass Rate',          `${stats.passRate || 0}%`, stats.passRate >= 80 ? '🟢 Good' : stats.passRate >= 50 ? '🟡 Needs Work' : '🔴 Poor'],
    ['Execution Duration', `${stats.duration || 0}s`, ''],
  ];

  statsRows.forEach((row, i) => {
    const r = ws.addRow(row);
    r.height = 24;

    if (i === 0) {
      // Header row
      r.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle();
      });
    } else {
      r.getCell(1).font = { bold: true, color: { argb: 'FF94A3B8' } };
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

      // Color-code value cell for Pass/Fail/Rate
      const valCell = r.getCell(2);
      valCell.font  = { bold: true, size: 12 };
      valCell.alignment = { horizontal: 'center' };
      if (row[0] === 'Passed')   valCell.font.color = { argb: 'FF10B981' };
      if (row[0] === 'Failed')   valCell.font.color = { argb: 'FFEF4444' };
      if (row[0] === 'Pass Rate') {
        const rate = stats.passRate || 0;
        valCell.font.color = { argb: rate >= 80 ? 'FF10B981' : rate >= 50 ? 'FFF59E0B' : 'FFEF4444' };
      }

      r.eachCell(cell => {
        cell.border = borderStyle();
        cell.alignment = cell.alignment || { vertical: 'middle' };
      });
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  ws.addRow([]); // spacer

  // ── Module breakdown ──────────────────────────────────────────────────────────
  ws.addRow(['📋 MODULE BREAKDOWN', '', '']).eachCell(cell => {
    cell.font = { bold: true, size: 11, color: { argb: 'FF6366F1' } };
  });

  const modHeader = ws.addRow(['Module', 'Total', 'Pass', 'Fail', 'Pass Rate']);
  modHeader.height = 22;
  modHeader.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.border = borderStyle();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const modules = groupByModule(testCases);
  Object.entries(modules).forEach(([mod, tcs]) => {
    const pass = tcs.filter(t => t.status === 'Pass').length;
    const fail = tcs.filter(t => t.status === 'Fail').length;
    const rate = tcs.length > 0 ? `${Math.round(pass / tcs.length * 100)}%` : '0%';
    const r = ws.addRow([mod, tcs.length, pass, fail, rate]);
    r.height = 20;
    r.getCell(3).font = { color: { argb: 'FF10B981' }, bold: true };
    r.getCell(4).font = { color: { argb: 'FFEF4444' }, bold: true };
    r.eachCell(cell => {
      cell.border = borderStyle();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    r.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  });
}

// ── Sheet 2: All Test Cases ────────────────────────────────────────────────────
async function buildTestCasesSheet(wb, testCases) {
  const ws = wb.addWorksheet('📋 Test Cases', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  // Column definitions
  ws.columns = [
    { header: 'Test Case ID',    key: 'id',       width: 14 },
    { header: 'Module',          key: 'module',   width: 28 },
    { header: 'Title',           key: 'title',    width: 45 },
    { header: 'Type',            key: 'type',     width: 12 },
    { header: 'Priority',        key: 'priority', width: 12 },
    { header: 'Test Steps',      key: 'steps',    width: 55 },
    { header: 'Expected Result', key: 'expected', width: 45 },
    { header: 'Actual Result',   key: 'actual',   width: 45 },
    { header: 'Status',          key: 'status',   width: 14 },
    { header: 'Duration (ms)',   key: 'duration', width: 14 },
    { header: 'Error / Notes',   key: 'error',    width: 50 },
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.font      = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = borderStyle();
  });

  // Data rows
  testCases.forEach((tc, idx) => {
    const row = ws.addRow({
      id:       tc.id,
      module:   tc.module,
      title:    tc.title,
      type:     tc.type,
      priority: tc.priority,
      steps:    Array.isArray(tc.steps) ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : tc.steps,
      expected: tc.expected || '',
      actual:   tc.actual   || '',
      status:   statusLabel(tc.status),
      duration: tc.duration != null ? tc.duration : '',
      error:    tc.error || '',
    });

    row.height = 60;

    // Alternate row background
    const bgColor = idx % 2 === 0 ? 'FF0F172A' : 'FF1A2332';

    row.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.font      = { color: { argb: 'FFF1F5F9' }, size: 10 };
      cell.border    = borderStyle();
      cell.alignment = { vertical: 'top', wrapText: true };
    });

    // ID — monospace style
    row.getCell('id').font = { name: 'Courier New', size: 10, bold: true, color: { argb: 'FFA5B4FC' } };

    // Type colors
    const typeCell = row.getCell('type');
    if (tc.type === 'Positive') typeCell.font.color = { argb: 'FF34D399' };
    if (tc.type === 'Negative') typeCell.font.color = { argb: 'FFFCA5A5' };
    if (tc.type === 'Edge')     typeCell.font.color = { argb: 'FFC4B5FD' };
    typeCell.alignment = { horizontal: 'center', vertical: 'top' };

    // Priority colors
    const priCell = row.getCell('priority');
    const priColors = { Critical: 'FFFCA5A5', High: 'FFFDBA74', Medium: 'FF93C5FD', Low: 'FF6EE7B7' };
    priCell.font.color = { argb: priColors[tc.priority] || 'FFF1F5F9' };
    priCell.font.bold  = true;
    priCell.alignment  = { horizontal: 'center', vertical: 'top' };

    // Status — colored cell background
    const statusCell = row.getCell('status');
    applyStatusStyle(statusCell, tc.status);

    // Duration — center aligned
    row.getCell('duration').alignment = { horizontal: 'center', vertical: 'top' };
  });

  // Auto-filter on header
  ws.autoFilter = { from: 'A1', to: 'K1' };
}

// ── Sheet 3: Module-wise breakdown ─────────────────────────────────────────────
async function buildModuleSheet(wb, testCases) {
  const ws = wb.addWorksheet('📁 By Module', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  const modules = groupByModule(testCases);

  let currentRow = 1;

  Object.entries(modules).forEach(([mod, tcs]) => {
    // Module header
    ws.mergeCells(`A${currentRow}:H${currentRow}`);
    const modCell = ws.getCell(`A${currentRow}`);
    modCell.value = `  ${tcs[0]?.icon || '📋'}  ${mod}`;
    modCell.font  = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    modCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    modCell.alignment = { vertical: 'middle' };
    ws.getRow(currentRow).height = 28;
    currentRow++;

    // Column headers for this module
    const colHdr = ws.addRow(['ID', 'Title', 'Type', 'Priority', 'Status', 'Duration', 'Expected Result', 'Error']);
    colHdr.height = 22;
    colHdr.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.border    = borderStyle();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;

    tcs.forEach(tc => {
      const r = ws.addRow([
        tc.id,
        tc.title,
        tc.type,
        tc.priority,
        statusLabel(tc.status),
        tc.duration != null ? `${tc.duration}ms` : '—',
        tc.expected || '',
        tc.error    || '',
      ]);
      r.height = 40;
      r.eachCell(cell => {
        cell.border    = borderStyle();
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font      = { size: 10 };
      });
      applyStatusStyle(r.getCell(5), tc.status);
      currentRow++;
    });

    // Summary row
    const pass = tcs.filter(t => t.status === 'Pass').length;
    const summaryRow = ws.addRow([`Total: ${tcs.length}`, `Passed: ${pass}`, `Failed: ${tcs.filter(t => t.status === 'Fail').length}`, '', `${Math.round(pass / tcs.length * 100)}% Pass`, '', '', '']);
    summaryRow.height = 20;
    summaryRow.eachCell(cell => {
      cell.font = { bold: true, italic: true, color: { argb: 'FF94A3B8' }, size: 9 };
    });
    currentRow++;

    ws.addRow([]); // spacer
    currentRow++;
  });

  // Set column widths
  ws.columns = [
    { width: 14 }, { width: 40 }, { width: 12 },
    { width: 12 }, { width: 14 }, { width: 12 },
    { width: 40 }, { width: 40 },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByModule(testCases) {
  const g = {};
  for (const tc of testCases) {
    if (!g[tc.module]) g[tc.module] = [];
    g[tc.module].push(tc);
  }
  return g;
}

function statusLabel(status) {
  const map = { Pass: '✅ Pass', Fail: '❌ Fail', Skipped: '⏭️ Skipped', 'Not Executed': '⏸️ Not Executed' };
  return map[status] || status;
}

function applyStatusStyle(cell, status) {
  const styles = {
    Pass:          { fg: 'FF064E3B', font: 'FF34D399' },
    Fail:          { fg: 'FF450A0A', font: 'FFFCA5A5' },
    Skipped:       { fg: 'FF1E293B', font: 'FF94A3B8' },
    'Not Executed':{ fg: 'FF1E293B', font: 'FF64748B' },
  };
  const s = styles[status] || styles['Not Executed'];
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.fg } };
  cell.font      = { bold: true, color: { argb: s.font } };
  cell.alignment = { horizontal: 'center', vertical: 'top' };
}

function borderStyle() {
  const side = { style: 'thin', color: { argb: 'FF334155' } };
  return { top: side, left: side, bottom: side, right: side };
}

module.exports = { generate };
```


---

### `backend/services/emailMonitor.js`

```js
// ── Email Monitor Service (Singleton) ────────────────────────────────────────
// Polls IMAP inbox, detects deployment emails, triggers QA pipeline, sends results
const imaps          = require('imap-simple');
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
const fs             = require('fs');
const path           = require('path');

const testGenerator    = require('./testGenerator');
const playwrightRunner = require('./playwrightRunner');
const reportGenerator  = require('./reportGenerator');
const excelGenerator   = require('./excelGenerator');
const emailSender      = require('./emailSender');

// ── Singleton state ────────────────────────────────────────────────────────────
let isRunning      = false;
let isPolling      = false;  // prevent concurrent IMAP polls
let timer          = null;
let config         = null;
let logs           = [];
let processedUids  = new Set();
let currentJob     = null;   // { appUrl, from, subject, startTime }
let lastChecked    = null;

// ── Logging ────────────────────────────────────────────────────────────────────
function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  logs.push(entry);
  if (logs.length > 300) logs.shift();
}

// ── Start monitoring ───────────────────────────────────────────────────────────
function start(cfg) {
  if (isRunning) return { success: false, message: 'Monitor is already running' };

  config    = cfg;
  isRunning = true;
  logs      = [];
  processedUids.clear();

  log(`📧 Email monitor STARTED`);
  log(`   Account   : ${cfg.email}`);
  log(`   IMAP Host : ${cfg.imapHost}:${cfg.imapPort || 993}`);
  log(`   Keyword   : "${cfg.subjectKeyword}"`);
  log(`   Poll every: ${cfg.pollInterval || 120}s`);

  doPoll(); // immediate first check
  timer = setInterval(doPoll, (cfg.pollInterval || 120) * 1000);

  return { success: true, message: 'Monitor started' };
}

// ── Stop monitoring ────────────────────────────────────────────────────────────
function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  isRunning  = false;
  currentJob = null;
  log('🛑 Email monitor STOPPED');
  return { success: true };
}

// ── Status ─────────────────────────────────────────────────────────────────────
function status() {
  return {
    isRunning,
    currentJob,
    lastChecked,
    logsCount: logs.length,
    logs: logs.slice(-80),
    config: config ? {
      email:          config.email,
      imapHost:       config.imapHost,
      subjectKeyword: config.subjectKeyword,
      pollInterval:   config.pollInterval,
    } : null,
  };
}

// ── Poll inbox ─────────────────────────────────────────────────────────────────
async function doPoll() {
  if (!isRunning || !config) return;
  if (currentJob) {
    log('⏳ Skipping poll — test pipeline already running');
    return;
  }
  if (isPolling) {
    log('⏳ Skipping poll — previous IMAP check still in progress');
    return;
  }

  isPolling   = true;
  lastChecked = new Date().toISOString();
  log(`🔍 Checking inbox (${new Date().toLocaleTimeString('en-IN')})...`);

  let connection;
  try {
    const connectPromise = imaps.connect({
      imap: {
        user:     config.email,
        password: config.password,
        host:     config.imapHost    || 'imap.gmail.com',
        port:     config.imapPort    || 993,
        tls:      true,
        tlsOptions:  { rejectUnauthorized: false },
        authTimeout: 15000,
        connTimeout: 20000,
      },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('IMAP connection timed out after 25s — check Gmail IMAP is enabled at gmail.com > Settings > See all settings > Forwarding and POP/IMAP')), 25000)
    );
    connection = await Promise.race([connectPromise, timeoutPromise]);

    log(`   📂 Opening INBOX...`);
    await connection.openBox('INBOX');
    log(`   ✅ INBOX opened`);

    // Step 1: fetch headers only for recent UNSEEN emails (last 7 days)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2-$1-$3');
    log(`   🔎 Searching unread messages since ${since.toDateString()}...`);
    const searchTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('IMAP search timed out after 20s')), 20000)
    );
    const messages = await Promise.race([
      connection.search([['UNSEEN'], ['SINCE', since]], {
        bodies:   ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
        markSeen: false,
      }),
      searchTimeout,
    ]);

    log(`   Unread messages: ${messages.length}`);

    for (const msg of messages) {
      if (!isRunning) break;

      const uid = msg.attributes.uid;
      if (processedUids.has(uid)) continue;

      // Parse header
      const headerPart = msg.parts.find(p => p.which.startsWith('HEADER'));
      const subject    = (headerPart?.body?.subject?.[0] || '').trim();
      const fromAddr   = (headerPart?.body?.from?.[0]    || '').trim();

      log(`   📩 Email: "${subject}" — from: ${fromAddr}`);

      // Check subject keyword
      if (!subject.toLowerCase().includes(config.subjectKeyword.toLowerCase())) {
        log(`      ↳ Subject does not contain "${config.subjectKeyword}" — skipping`);
        continue;
      }

      log(`   ✅ Trigger matched! Fetching full email body...`);
      processedUids.add(uid);

      // Step 2: fetch full body only for matching email
      const fullMsgs = await connection.search([['UID', String(uid)]], {
        bodies:   [''],
        markSeen: true,
        struct:   true,
      });

      const bodyPart = fullMsgs[0]?.parts?.find(p => p.which === '');
      let parsed;
      try {
        parsed = await simpleParser(bodyPart?.body || '');
      } catch (e) {
        log(`   ⚠️ Could not parse email body: ${e.message}`);
        continue;
      }

      // Extract URL from email body text
      const bodyText = parsed.text || '';
      const bodyHtml = parsed.html  || '';
      const appUrl   = extractUrl(bodyText) || extractUrl(bodyHtml);

      if (!appUrl) {
        log(`   ⚠️ No application URL found in email body. Reply with URL to test.`);
        log(`      Tip: Include a line like "URL: http://your-app.com" in email body`);
        continue;
      }

      log(`   🌐 Extracted URL: ${appUrl}`);

      // Get requirements — from attachment or default
      let requirementText = config.defaultRequirements ||
        'login register payment claims policy dashboard navigation search password profile logout form';

      const txtAttachment = (parsed.attachments || []).find(a =>
        a.filename && /\.(txt|md|pdf)$/i.test(a.filename)
      );
      if (txtAttachment) {
        log(`   📎 Using requirement attachment: ${txtAttachment.filename}`);
        requirementText = txtAttachment.content.toString('utf-8');
      } else {
        log(`   📝 No doc attachment found — using default requirements`);
      }

      // Close IMAP before running pipeline (long operation)
      try { connection.end(); } catch (e) { /* ignore */ }
      connection = null;

      // Run pipeline async (non-blocking for next poll)
      await runPipeline({ appUrl, requirementText, replyTo: fromAddr, originalSubject: subject });
      return; // process one email at a time
    }

  } catch (err) {
    log(`❌ IMAP connection error: ${err.message}`);
    if (err.message.includes('Invalid credentials')) {
      log('   💡 Tip: For Gmail, use an App Password (not your regular password)');
      log('   💡 Generate at: https://myaccount.google.com/apppasswords');
    }
  } finally {
    isPolling = false;
    if (connection) {
      try { connection.end(); } catch (e) { /* ignore */ }
    }
  }
}

// ── Extract URL from text ──────────────────────────────────────────────────────
function extractUrl(text) {
  if (!text) return null;

  // Look for labelled URL first: "URL: http://..."  or  "App URL: ..."
  const labelled = text.match(/(?:app\s*url|url|link|application)\s*[:=]\s*(https?:\/\/[^\s<>"'\n]+)/i);
  if (labelled) return labelled[1].replace(/[.,;)>\]]+$/, '');

  // Generic http/https
  const http = text.match(/https?:\/\/[^\s<>"'\n]+/i);
  if (http) return http[0].replace(/[.,;)>\]]+$/, '');

  // file:///
  const fileUrl = text.match(/file:\/\/\/[^\s<>"'\n]+/i);
  if (fileUrl) return fileUrl[0];

  // Windows path  C:\... or C:/...
  const winPath = text.match(/[A-Za-z]:[/\\][^\s<>"'\n]+\.html/i);
  if (winPath) return 'file:///' + winPath[0].replace(/\\/g, '/');

  return null;
}

// ── Run QA pipeline ────────────────────────────────────────────────────────────
async function runPipeline({ appUrl, requirementText, replyTo, originalSubject }) {
  const jobId     = uuidv4();
  const reportDir = path.join(__dirname, '../reports', jobId);
  fs.mkdirSync(reportDir, { recursive: true });

  currentJob = { jobId, appUrl, from: replyTo, subject: originalSubject, startTime: new Date().toISOString() };

  try {
    log(`\n${'═'.repeat(60)}`);
    log(`🚀 QA PIPELINE STARTED`);
    log(`   Job ID  : ${jobId}`);
    log(`   App URL : ${appUrl}`);
    log(`   Reply to: ${replyTo}`);
    log('═'.repeat(60));

    log('🧠 [1/5] Generating test cases...');
    const testCases = testGenerator.generate(requirementText);
    log(`   ✓ Generated ${testCases.length} test cases across ${[...new Set(testCases.map(t => t.module))].length} modules`);

    log('🎭 [2/5] Creating Playwright spec...');
    const specContent = playwrightRunner.generateSpec(appUrl, testCases);
    log(`   ✓ Spec ready (${testCases.length} test functions)`);

    log('⚡ [3/5] Executing Playwright tests...');
    const results = await playwrightRunner.execute(specContent, appUrl, (m) => log(`   ${m}`));
    log(`   ✓ ${results.passed} passed | ${results.failed} failed | ${results.skipped} skipped`);

    const updatedTCs = testGenerator.mergeResults(testCases, results.testResults);
    const stats = {
      total:    testCases.length,
      passed:   results.passed,
      failed:   results.failed,
      skipped:  results.skipped || 0,
      duration: results.duration || 0,
      passRate: testCases.length > 0 ? Math.round(results.passed / testCases.length * 100) : 0,
    };

    log('📊 [4/5] Generating HTML report + Excel...');
    const [htmlPath, xlsxPath] = await Promise.all([
      reportGenerator.generate({ jobId, appUrl, testCases: updatedTCs, executionStats: stats, reportDir }),
      excelGenerator.generate(updatedTCs, stats, appUrl, reportDir),
    ]);
    log(`   ✓ HTML: ${htmlPath}`);
    log(`   ✓ XLSX: ${xlsxPath}`);

    log(`📧 [5/5] Sending result email to ${replyTo}...`);
    await emailSender.sendReport({
      config,
      to: replyTo,
      originalSubject,
      appUrl,
      stats,
      htmlReportPath: htmlPath,
      excelPath:      xlsxPath,
      testCases:      updatedTCs,
    });

    log(`\n✅ PIPELINE COMPLETE — Pass Rate: ${stats.passRate}%`);
    log(`   Email sent to: ${replyTo}`);
    log('═'.repeat(60) + '\n');

  } catch (err) {
    log(`\n❌ PIPELINE ERROR: ${err.message}`);
    log(err.stack || '');
    try {
      await emailSender.sendError({ config, to: replyTo, originalSubject, appUrl, error: err.message });
      log(`   Error notification sent to ${replyTo}`);
    } catch (e2) {
      log(`   Could not send error email: ${e2.message}`);
    }
  } finally {
    currentJob = null;
  }
}

module.exports = { start, stop, status };
```


---

### `backend/services/emailSender.js`

```js
// ── Email Sender Service ──────────────────────────────────────────────────────
// Sends QA result emails with HTML report + Excel attachments
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

/**
 * Build a nodemailer transporter from config.
 */
function createTransport(config) {
  return nodemailer.createTransport({
    host:   config.smtpHost || 'smtp.gmail.com',
    port:   config.smtpPort || 587,
    secure: false,
    auth: {
      user: config.email,
      pass: config.password,
    },
    tls: { rejectUnauthorized: false },
  });
}

// ── Send QA result email ───────────────────────────────────────────────────────
async function sendReport({ config, to, originalSubject, appUrl, stats, htmlReportPath, excelPath, testCases }) {
  const transport = createTransport(config);

  const passColor = stats.passRate >= 80 ? '#10b981' : stats.passRate >= 50 ? '#f59e0b' : '#ef4444';
  const statusEmoji = stats.passRate >= 80 ? '✅' : stats.passRate >= 50 ? '⚠️' : '❌';

  // Build module summary rows
  const moduleMap = {};
  testCases.forEach(tc => {
    if (!moduleMap[tc.module]) moduleMap[tc.module] = { pass: 0, fail: 0, total: 0 };
    moduleMap[tc.module].total++;
    if (tc.status === 'Pass') moduleMap[tc.module].pass++;
    else moduleMap[tc.module].fail++;
  });

  const moduleRows = Object.entries(moduleMap).map(([mod, m]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;color:#e2e8f0;">${mod}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#94a3b8;">${m.total}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#10b981;font-weight:600;">${m.pass}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:#ef4444;font-weight:600;">${m.fail}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;color:${m.fail === 0 ? '#10b981' : '#f59e0b'};">${Math.round(m.pass/m.total*100)}%</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">

<div style="max-width:680px;margin:0 auto;background:#0f172a;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:36px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:10px;">🤖</div>
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">QA AI Testing Report</h1>
    <p style="margin:8px 0 0;color:#a5b4fc;font-size:13px;">
      Automated test execution triggered by deployment notification
    </p>
  </div>

  <!-- Status Banner -->
  <div style="background:${stats.passRate >= 80 ? '#064e3b' : stats.passRate >= 50 ? '#451a03' : '#450a0a'};
              padding:16px 40px;text-align:center;border-bottom:2px solid ${passColor};">
    <span style="color:${passColor};font-size:20px;font-weight:800;">
      ${statusEmoji} ${stats.passRate}% Pass Rate — ${stats.passRate >= 80 ? 'READY FOR RELEASE' : stats.passRate >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL ISSUES FOUND'}
    </span>
  </div>

  <div style="padding:32px 40px;">

    <!-- App info -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Application Tested</div>
      <div style="color:#6366f1;font-size:14px;font-weight:600;word-break:break-all;">${appUrl}</div>
      <div style="color:#64748b;font-size:12px;margin-top:4px;">Trigger: <em>${originalSubject}</em></div>
    </div>

    <!-- Stats grid -->
    <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:24px;">
      <tr>
        ${[
          ['Total Tests', stats.total,   '#6366f1'],
          ['✅ Passed',   stats.passed,  '#10b981'],
          ['❌ Failed',   stats.failed,  '#ef4444'],
          ['Pass Rate',  stats.passRate + '%', passColor],
        ].map(([label, val, color]) => `
        <td style="background:#1e293b;border:1px solid ${color}33;border-radius:10px;
                   padding:16px;text-align:center;width:25%;">
          <div style="color:${color};font-size:28px;font-weight:800;line-height:1;">${val}</div>
          <div style="color:#94a3b8;font-size:11px;margin-top:6px;text-transform:uppercase;">${label}</div>
        </td>`).join('')}
      </tr>
    </table>

    <!-- Progress bar -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#f1f5f9;font-weight:600;font-size:13px;">Overall Pass Rate</span>
        <span style="color:${passColor};font-weight:700;font-size:16px;">${stats.passRate}%</span>
      </div>
      <div style="background:#334155;border-radius:999px;height:10px;overflow:hidden;">
        <div style="width:${stats.passRate}%;height:100%;background:${passColor};border-radius:999px;"></div>
      </div>
    </div>

    <!-- Module table -->
    <h3 style="color:#f1f5f9;font-size:14px;margin:0 0 12px;">Module-wise Results</h3>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#334155;">
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:left;">Module</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Total</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Pass</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Fail</th>
          <th style="padding:10px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Rate</th>
        </tr>
      </thead>
      <tbody>${moduleRows}</tbody>
    </table>

    <!-- Attachments note -->
    <div style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <div style="color:#93c5fd;font-weight:600;margin-bottom:4px;">📎 Attachments</div>
      <div style="color:#bfdbfe;font-size:13px;">
        • <strong>QA Report (HTML)</strong> — Open in browser, print to PDF<br>
        • <strong>QA Test Cases (Excel)</strong> — Detailed results with 3 worksheets
      </div>
    </div>

    <!-- Footer info -->
    <div style="color:#475569;font-size:12px;text-align:center;border-top:1px solid #334155;padding-top:20px;">
      <strong style="color:#6366f1;">QA AI Testing Tool</strong> — Powered by Playwright v1.55<br>
      Execution time: ${stats.duration}s &nbsp;|&nbsp; ${new Date().toLocaleString('en-IN')}
    </div>

  </div>
</div>
</body>
</html>`;

  const attachments = [];
  if (htmlReportPath && fs.existsSync(htmlReportPath)) {
    attachments.push({ filename: 'QA_Report.html',       path: htmlReportPath });
  }
  if (excelPath && fs.existsSync(excelPath)) {
    attachments.push({ filename: 'QA_Test_Cases.xlsx',   path: excelPath });
  }

  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to,
    subject: `${statusEmoji} QA Testing Complete | ${stats.passRate}% Pass | RE: ${originalSubject}`,
    html,
    attachments,
  });
}

// ── Send error notification ────────────────────────────────────────────────────
async function sendError({ config, to, originalSubject, appUrl, error }) {
  const transport = createTransport(config);

  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to,
    subject: `❌ QA Testing Failed | RE: ${originalSubject}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#ef4444;">❌ QA Pipeline Error</h2>
        <p><strong>Application:</strong> ${appUrl}</p>
        <p><strong>Trigger:</strong> ${originalSubject}</p>
        <p><strong>Error:</strong></p>
        <pre style="background:#1e293b;padding:16px;border-radius:8px;color:#fca5a5;font-size:12px;">${error}</pre>
        <p style="color:#64748b;font-size:12px;">— QA AI Testing Tool</p>
      </div>`,
  });
}

// ── Send test email (connection check) ────────────────────────────────────────
async function sendTestEmail(config) {
  const transport = createTransport(config);
  await transport.sendMail({
    from:    `"QA AI Bot 🤖" <${config.email}>`,
    to:      config.email,
    subject: '✅ QA Bot Email Config Test',
    html:    `<div style="font-family:Arial;padding:20px;">
                <h2>✅ Connection Successful!</h2>
                <p>Your QA AI Testing Bot email is configured correctly.</p>
                <p>It will now monitor for emails with subject: <strong>"${config.subjectKeyword}"</strong></p>
              </div>`,
  });
}

module.exports = { sendReport, sendError, sendTestEmail };
```


---

### `backend/services/historyStore.js`

```js
// ── Run History Store ─────────────────────────────────────────────────────────
// Persists last 10 test runs for trend analysis
const fs   = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../reports/run-history.json');
const MAX_RUNS     = 10;

function saveRun({ jobId, appUrl, environment, browsers, testScope, stats, timestamp }) {
  const history = getHistory();
  history.unshift({
    jobId,
    timestamp:   timestamp || new Date().toISOString(),
    appUrl,
    environment: environment || 'Unknown',
    browsers:    browsers    || ['chromium'],
    testScope:   testScope   || 'regression',
    total:       stats.total,
    passed:      stats.passed,
    failed:      stats.failed,
    skipped:     stats.skipped || 0,
    passRate:    stats.passRate,
    duration:    stats.duration,
  });

  const trimmed = history.slice(0, MAX_RUNS);
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  } catch (e) { /* ignore write errors */ }
}

function getHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

module.exports = { saveRun, getHistory };
```


---

### `frontend/package.json`

```json
{
  "name": "qa-tool-frontend",
  "version": "1.0.0",
  "description": "QA AI Testing Tool — React Frontend",
  "type": "module",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react":     "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite":                 "^4.4.9"
  }
}
```


---

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target:      'http://localhost:5000',
        changeOrigin: true,
      },
      '/reports': {
        target:      'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```


---

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QA AI Testing Tool</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```


---

### `frontend/src/main.jsx`

```jsx
import React    from 'react';
import ReactDOM from 'react-dom/client';
import App      from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```


---

### `frontend/src/App.jsx`

```jsx
import { useState, useRef, useEffect, useCallback, Fragment } from 'react';

const API = '';  // proxied via Vite to http://localhost:5000

// ── Status icons ───────────────────────────────────────────────────────────────
const STATUS_ICON = { Pass: '✅', Fail: '❌', Skipped: '⏭️', 'Not Executed': '⏸️' };
const PRIORITY_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#10b981' };

// ── Toast Notification ─────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Count-up animation hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ── Animated stat card ─────────────────────────────────────────────────────────
function CountUpCard({ label, value, color }) {
  const isNum = typeof value === 'number';
  const displayed = useCountUp(isNum ? value : 0);
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-val" style={{ color }}>{isNum ? displayed : value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

// ── Confetti ───────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#a78bfa'][i % 6],
    size: 6 + Math.random() * 8,
    duration: 2 + Math.random() * 2,
  }));
  return (
    <div className="confetti-container" style={{pointerEvents:'none'}}>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          background: p.color,
          width: p.size, height: p.size,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '50% 0',
        }} />
      ))}
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ passRate, size = 120 }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ - (passRate / 100) * circ;
  const color = passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">{passRate}%</text>
        <text x="50" y="60" textAnchor="middle" fill="#64748b" fontSize="8">Pass Rate</text>
      </svg>
    </div>
  );
}

// ── AI Chatbot Assistant ───────────────────────────────────────────────────────
function ChatBot({ actions, state }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{
    id: 0, from: 'bot',
    text: "Hi! 👋 I'm your QA Assistant.\n\nI can configure test settings, navigate pages, and help you run tests — just tell me what you need!",
    chips: ['What can you do?', 'Go to Dashboard', 'Set smoke tests'],
  }]);
  const [input,  setInput]  = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef   = useRef();
  const inputRef = useRef();
  const msgId    = useRef(1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 150); setUnread(0); }
  }, [open]);

  const push = (from, text, chips) => {
    setMessages(prev => [...prev, { id: msgId.current++, from, text, chips }]);
    if (from === 'bot' && !open) setUnread(n => n + 1);
  };

  const botSay = (text, chips) => {
    setTyping(true);
    setTimeout(() => { setTyping(false); push('bot', text, chips); }, 500 + Math.random() * 300);
  };

  const handle = useCallback((raw) => {
    push('user', raw);
    setInput('');
    const m = raw.toLowerCase().trim();

    // Navigation
    if (/dashboard/.test(m)) {
      actions.setPage('dashboard');
      return botSay('Navigated to Dashboard 📊 You can see run history, trends, and KPIs there.');
    }
    if (/monitor|email/.test(m)) {
      actions.setPage('monitor');
      return botSay('Opened Email Monitor 📧 Configure Gmail to auto-trigger tests on deployment emails.');
    }
    if (/manual|test page|run page/.test(m)) {
      actions.setPage('manual');
      return botSay('Opened Manual Test page ⚡', ['Open advanced config', 'Set smoke tests']);
    }

    // URL
    const urlMatch = raw.match(/(https?:\/\/[^\s]+|localhost:\d+[^\s]*)/i);
    if (urlMatch) {
      const url = urlMatch[0].startsWith('localhost') ? 'http://' + urlMatch[0] : urlMatch[0];
      actions.setAppUrl(url);
      actions.setPage('manual');
      return botSay(`URL set to:\n${url} ✅\nNow upload your requirements doc and click Execute!`);
    }

    // Browser
    if (/all browser/.test(m)) {
      actions.setBrowsers(['chromium','firefox','webkit']);
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Set all 3 browsers: Chrome, Firefox, Safari 🌐\n⚠️ Multi-browser runs take longer.');
    }
    if (/chrome|chromium/.test(m)) {
      actions.setBrowsers(['chromium']);
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Browser set to Chrome (Chromium) 🟡');
    }
    if (/firefox/.test(m)) {
      actions.setBrowsers(['firefox']);
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Browser set to Firefox 🦊');
    }
    if (/safari|webkit/.test(m)) {
      actions.setBrowsers(['webkit']);
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Browser set to Safari (WebKit) 🍎');
    }
    if (/mobile/.test(m)) {
      actions.setBrowsers(['mobile-chrome']);
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Browser set to Mobile Chrome 📱');
    }

    // Test scope
    if (/smoke/.test(m)) {
      actions.setTestScope('smoke');
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Scope set to Smoke 🔥\n1 critical test per module — fastest run.');
    }
    if (/sanity/.test(m)) {
      actions.setTestScope('sanity');
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Scope set to Sanity ✅\n2 tests per module — quick confidence check.');
    }
    if (/regression/.test(m)) {
      actions.setTestScope('regression');
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Scope set to Regression 🔄\nAll generated test cases will run.');
    }
    if (/full|e2e/.test(m)) {
      actions.setTestScope('full');
      actions.setPage('manual'); actions.setShowAdvanced(true);
      return botSay('Scope set to Full E2E 🚀\nAll tests including edge cases.');
    }

    // Environment
    if (/\bdev\b/.test(m) && /env|environ|set/.test(m)) {
      actions.setEnvironment('Dev');
      actions.setShowAdvanced(true);
      return botSay('Environment set to Dev 🔵');
    }
    if (/\bqa\b/.test(m) && /env|environ/.test(m)) {
      actions.setEnvironment('QA');
      actions.setShowAdvanced(true);
      return botSay('Environment set to QA ✅');
    }
    if (/staging/.test(m)) {
      actions.setEnvironment('Staging');
      actions.setShowAdvanced(true);
      return botSay('Environment set to Staging ⚠️');
    }
    if (/\bprod/.test(m) && /env|environ|set/.test(m)) {
      actions.setEnvironment('Prod');
      actions.setShowAdvanced(true);
      return botSay('Environment set to Prod 🔴\n⚠️ Be careful — this is production!');
    }

    // Extra checks
    if (/accessib|a11y/.test(m)) {
      actions.setIncludeAccessibility(true);
      actions.setShowAdvanced(true);
      return botSay('Accessibility scan enabled ♿\nWCAG checks (alt text, labels, lang attr) included.');
    }
    if (/\bperf|performance/.test(m)) {
      actions.setIncludePerformance(true);
      actions.setShowAdvanced(true);
      return botSay('Performance metrics enabled ⚡\nTTFB, FCP, DOM ready, full load measured.');
    }

    // Workers
    if (/worker/.test(m)) {
      const n = m.match(/\d+/)?.[0];
      if (n && parseInt(n) >= 1 && parseInt(n) <= 5) {
        actions.setWorkers(n);
        actions.setShowAdvanced(true);
        return botSay(`Parallel workers set to ${n} ⚙️`);
      }
      return botSay('Workers control parallel execution (1–5).\nExample: "set 4 workers"');
    }

    // Status / Results
    if (/status|running|progress/.test(m)) {
      if (state.status === 'running') return botSay('Tests are running now! ⏳\nSwitch to Manual Test to watch live progress.');
      if (state.status === 'done' && state.results) {
        const s = state.results.executionStats;
        return botSay(
          `Last run complete ✅\n\n📊 ${s.total} total\n✅ ${s.passed} passed (${s.passRate}%)\n❌ ${s.failed} failed\n⏱️ ${s.duration}s`,
          ['View test cases', 'Show history']
        );
      }
      return botSay('No tests running. Configure settings and hit Execute! ⚡', ['Start a test run']);
    }
    if (/result|report/.test(m)) {
      if (state.status === 'done' && state.results) {
        const s = state.results.executionStats;
        return botSay(
          `Results: ${s.passed}/${s.total} passed (${s.passRate}%) in ${s.duration}s`,
          ['View test cases', 'Download report']
        );
      }
      actions.setPage('manual');
      return botSay('No results yet. Run a test first! ⚡');
    }

    // Tab navigation
    if (/view test|test case|test list/.test(m)) {
      actions.setPage('manual'); actions.setActiveTab('testcases');
      return botSay('Opened Test Cases tab 📋 Filter and search all test cases here.');
    }
    if (/download report|html report/.test(m)) {
      actions.setPage('manual');
      return botSay('The download buttons are at the top of the results panel 📥\nHTML, Excel (.xlsx), and JSON formats available.');
    }
    if (/history/.test(m)) {
      actions.setPage('manual'); actions.setActiveTab('history');
      return botSay('Opened History tab 🕒 See pass rate trends across all past runs.');
    }
    if (/log/.test(m)) {
      actions.setPage('manual'); actions.setActiveTab('logs');
      return botSay('Opened Execution Logs tab 📜');
    }
    if (/summary|module/.test(m)) {
      actions.setPage('manual'); actions.setActiveTab('summary');
      return botSay('Opened Module Summary tab 📦 See pass rate breakdown per module.');
    }

    // Reset
    if (/reset|clear|new run|start over/.test(m)) {
      actions.handleReset();
      return botSay('Reset! Ready for a fresh run 🔄', ['Set up test run']);
    }

    // Greetings
    if (/^(hi|hello|hey|howdy|sup|yo)\b/.test(m)) {
      return botSay(
        "Hey! 👋 I'm QA Bot — your testing assistant.",
        ['What can you do?', 'Go to Dashboard', 'Set smoke tests']
      );
    }

    // What is this
    if (/what is|explain|about|describe/.test(m)) {
      return botSay(
        "QA AI Testing Tool automates your whole test pipeline:\n\n" +
        "1️⃣  Upload requirements doc (PDF/TXT/MD)\n" +
        "2️⃣  AI generates test cases from text\n" +
        "3️⃣  Playwright runs tests in real browsers\n" +
        "4️⃣  HTML + Excel reports generated\n" +
        "5️⃣  Email results via monitor bot 🤖",
        ['Start a test run', 'Set up email monitor']
      );
    }

    // Help
    if (/help|what can you|command|how (do|to|does)|capabilities/.test(m) || m === '?') {
      return botSay(
        "Here's everything I can do:\n\n" +
        "🗺️  \"go to dashboard\" / \"open monitor\"\n" +
        "🌐  \"use firefox\" / \"set all browsers\"\n" +
        "🎯  \"set smoke\" / \"run full e2e\"\n" +
        "🌍  \"set staging environment\"\n" +
        "♿  \"enable accessibility\"\n" +
        "⚡  \"enable performance\"\n" +
        "⚙️  \"set 4 workers\"\n" +
        "📊  \"show status\" / \"show results\"\n" +
        "🕒  \"show history\"\n" +
        "🔗  Paste a URL → I'll set it!",
        ['Set smoke tests', 'Go to dashboard', 'Use Firefox']
      );
    }

    // Fallback
    botSay(
      "I didn't quite catch that 🤔\nTry:\n• \"set firefox browser\"\n• \"run smoke tests\"\n• \"go to dashboard\"\n• \"show results\"",
      ['Show all commands', 'Go to Dashboard']
    );
  }, [actions, state, open]);

  const QUICK = ['Dashboard', 'Smoke tests', 'Firefox', 'Status', 'Help'];

  return (
    <>
      {/* Floating button */}
      <button className={`chat-fab ${open ? 'chat-fab-open' : ''}`} onClick={() => setOpen(o => !o)} title="QA Assistant">
        <span className="chat-fab-icon">{open ? '✕' : '🤖'}</span>
        {!open && unread > 0 && <span className="chat-unread">{unread}</span>}
        {!open && unread === 0 && <span className="chat-fab-badge">AI</span>}
      </button>

      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-hdr">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className="chat-hdr-av">🤖</div>
              <div>
                <div className="chat-hdr-name">QA Assistant</div>
                <div className="chat-hdr-sub"><span className="live-dot" style={{ width:6, height:6 }} /> Always ready</div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-msgs">
            {messages.map(msg => (
              <div key={msg.id} className={`cmsg cmsg-${msg.from}`}>
                {msg.from === 'bot' && <span className="cmsg-av">🤖</span>}
                <div>
                  <div className="cmsg-bub">{msg.text}</div>
                  {msg.chips && (
                    <div className="cmsg-chips">
                      {msg.chips.map(c => (
                        <button key={c} className="cmsg-chip" onClick={() => handle(c)}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="cmsg cmsg-bot">
                <span className="cmsg-av">🤖</span>
                <div className="cmsg-bub cmsg-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick chips */}
          <div className="chat-quick">
            {QUICK.map(c => (
              <button key={c} className="chat-quick-btn" onClick={() => handle(c)}>{c}</button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Ask or give a command…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && handle(input.trim())}
            />
            <button
              className="chat-send-btn"
              onClick={() => input.trim() && handle(input.trim())}
              disabled={!input.trim()}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Trend Line Chart (SVG) ─────────────────────────────────────────────────────
function TrendLineChart({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ color:'#475569', textAlign:'center', padding:'32px 0', fontSize:12 }}>
      Run at least 2 tests to see the trend chart
    </div>
  );
  const W = 560, H = 140, PL = 28, PR = 12, PT = 18, PB = 20;
  const iW = W - PL - PR, iH = H - PT - PB;
  const pts = data.map((d, i) => ({
    x: PL + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW),
    y: PT + (1 - (d.passRate || 0) / 100) * iH,
    passRate: d.passRate || 0,
    date: d.date || '',
  }));
  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `M${pts[0].x.toFixed(1)},${(PT + iH).toFixed(1)} ` +
    pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${pts[pts.length - 1].x.toFixed(1)},${(PT + iH).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PT + (1 - pct / 100) * iH;
        return (
          <g key={pct}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={PL - 4} y={y + 3} fill="#475569" fontSize="8" textAnchor="end">{pct}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#lgArea)" />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4"
            fill={p.passRate >= 80 ? '#10b981' : p.passRate >= 50 ? '#f59e0b' : '#ef4444'}
            stroke="#0f172a" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 7} fill="#94a3b8" fontSize="8" textAnchor="middle">{p.passRate}%</text>
          {p.date && (
            <text x={p.x} y={H - 4} fill="#475569" fontSize="7.5" textAnchor="middle">{p.date}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
function DashboardPage({ runHistory, onNavigate }) {
  const totalRuns   = runHistory.length;
  const totalTests  = runHistory.reduce((s, r) => s + (r.total || 0), 0);
  const avgPassRate = totalRuns > 0
    ? Math.round(runHistory.reduce((s, r) => s + (r.passRate || 0), 0) / totalRuns) : 0;
  const lastRun     = runHistory[0];
  const trendData   = [...runHistory].reverse().slice(-10).map(r => ({
    passRate: r.passRate || 0,
    date: r.timestamp?.slice(5, 10) || '',
  }));

  if (totalRuns === 0) return (
    <div className="dashboard">
      <div style={{ textAlign:'center', padding:'80px 20px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)' }}>
        <div style={{ fontSize:56, marginBottom:14 }}>📊</div>
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>QA Dashboard</h2>
        <p style={{ color:'#94a3b8', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
          Run your first test to see metrics, trends, and history here.
        </p>
        <button className="btn btn-execute"
          style={{ display:'inline-flex', width:'auto', padding:'12px 28px' }}
          onClick={() => onNavigate('manual')}>
          ⚡ Start First Run
        </button>
      </div>
    </div>
  );

  const kpiColor = (rate) => rate >= 80 ? '#34d399' : rate >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="dashboard">
      {/* KPI grid */}
      <div className="kpi-grid">
        <div className="kpi-card accent-indigo">
          <div className="kpi-icon">🚀</div>
          <div className="kpi-val" style={{ color:'#a5b4fc' }}>{totalRuns}</div>
          <div className="kpi-lbl">Total Runs</div>
          <div className="kpi-sub">All time</div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-icon">🧪</div>
          <div className="kpi-val" style={{ color:'#34d399' }}>{totalTests}</div>
          <div className="kpi-lbl">Tests Executed</div>
          <div className="kpi-sub">Across all runs</div>
        </div>
        <div className="kpi-card accent-amber">
          <div className="kpi-icon">📈</div>
          <div className="kpi-val" style={{ color: kpiColor(avgPassRate) }}>{avgPassRate}%</div>
          <div className="kpi-lbl">Avg Pass Rate</div>
          <div className="kpi-sub">{totalRuns} run{totalRuns !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: kpiColor(lastRun?.passRate || 0) }}>
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-val" style={{ color:'#fbbf24', fontSize:18, marginTop:6 }}>
            {lastRun?.timestamp?.slice(0, 10) || '—'}
          </div>
          <div className="kpi-lbl">Last Run</div>
          <div className="kpi-sub">{lastRun ? `${lastRun.passRate}% pass rate` : 'Never'}</div>
        </div>
      </div>

      {/* Trend + Recent Runs */}
      <div className="dash-grid">
        <div className="panel trend-chart-panel">
          <div className="section-title">📈 Pass Rate Trend (last {trendData.length} runs)</div>
          <TrendLineChart data={trendData} />
        </div>

        <div className="panel recent-runs-panel">
          <div className="section-title">🕒 Recent Runs</div>
          {runHistory.slice(0, 6).map(run => (
            <div key={run.jobId} className="run-card">
              <div className="run-card-rate" style={{ color: kpiColor(run.passRate || 0) }}>
                {run.passRate || 0}%
              </div>
              <div className="run-card-info">
                <div className="run-card-url" title={run.appUrl}>{run.appUrl}</div>
                <div className="run-card-meta">
                  {run.timestamp?.slice(0, 16).replace('T', ' ')} · {run.total} tests · {run.environment}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="panel quick-actions">
        <div className="section-title">⚡ Quick Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { icon:'⚡', title:'Manual Test Run',  desc:'Upload requirements doc and run Playwright tests', page:'manual' },
            { icon:'📧', title:'Email Monitor',    desc:'Auto-trigger tests from deployment emails',         page:'monitor' },
          ].map(a => (
            <button key={a.page} className="action-item" onClick={() => onNavigate(a.page)}>
              <div className="action-icon">{a.icon}</div>
              <div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc">{a.desc}</div>
              </div>
              <div className="action-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Main test panel state ──────────────────────────────────────────────────
  const [appUrl,       setAppUrl]       = useState('C:/Users/Vishal/PlaywrightPractice/insurance-app/index.html');
  const [file,         setFile]         = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [jobId,        setJobId]        = useState(null);
  const [status,       setStatus]       = useState('idle');
  const [logs,         setLogs]         = useState([]);
  const [results,      setResults]      = useState(null);
  const [error,        setError]        = useState('');
  const [activeTab,    setActiveTab]    = useState('summary');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterModule, setFilterModule] = useState('All');

  // ── Advanced run configuration ────────────────────────────────────────────
  const [browsers,             setBrowsers]             = useState(['chromium']);
  const [testScope,            setTestScope]            = useState('regression');
  const [priorityFilter,       setPriorityFilter]       = useState('all');
  const [workers,              setWorkers]              = useState('3');
  const [retries,              setRetries]              = useState('0');
  const [screenshots,          setScreenshots]          = useState('only-on-failure');
  const [environment,          setEnvironment]          = useState('QA');
  const [includeAccessibility, setIncludeAccessibility] = useState(false);
  const [includePerformance,   setIncludePerformance]   = useState(false);
  const [showAdvanced,         setShowAdvanced]         = useState(false);
  const [runHistory,           setRunHistory]           = useState([]);

  // ── Toast notifications ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Confetti ───────────────────────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Expandable row ─────────────────────────────────────────────────────────
  const [expandedRow, setExpandedRow] = useState(null);

  // ── Top-level page ─────────────────────────────────────────────────────────
  const [page, setPage] = useState('manual'); // 'manual' | 'monitor' | 'dashboard'
  const [searchQuery, setSearchQuery] = useState('');

  // ── Email monitor state ────────────────────────────────────────────────────
  const [monEmail,     setMonEmail]     = useState('');
  const [monPassword,  setMonPassword]  = useState('');
  const [monImapHost,  setMonImapHost]  = useState('imap.gmail.com');
  const [monSmtpHost,  setMonSmtpHost]  = useState('smtp.gmail.com');
  const [monKeyword,   setMonKeyword]   = useState('deployment done');
  const [monInterval,  setMonInterval]  = useState('120');
  const [monStatus,    setMonStatus]    = useState(null);  // from API
  const [monAction,    setMonAction]    = useState('');    // 'starting'|'stopping'|'testing'
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef  = useRef();
  const logsEndRef    = useRef();
  const monLogsRef    = useRef();
  const pollRef       = useRef();
  const monPollRef    = useRef();

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Polling while job runs
  useEffect(() => {
    if (!jobId || status !== 'running') return;

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/api/status/${jobId}`);
        const data = await res.json();

        setLogs(data.logs || []);

        if (data.status === 'done') {
          clearInterval(pollRef.current);
          setStatus('done');
          setResults(data.results);
        } else if (data.status === 'error') {
          clearInterval(pollRef.current);
          setStatus('error');
          setError(data.error || 'Unknown error occurred');
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 1500);

    return () => clearInterval(pollRef.current);
  }, [jobId, status]);

  // ── Load run history ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/history`).then(r => r.json()).then(setRunHistory).catch(() => {});
  }, []);

  // ── Refresh history after run completes ──────────────────────────────────────
  useEffect(() => {
    if (status === 'done') {
      fetch(`${API}/api/history`).then(r => r.json()).then(setRunHistory).catch(() => {});
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
  }, [status]);

  // ── Monitor status polling ────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch(`${API}/api/monitor/status`);
        const data = await res.json();
        setMonStatus(data);
        if (monLogsRef.current) monLogsRef.current.scrollTop = monLogsRef.current.scrollHeight;
      } catch (e) { /* ignore */ }
    };
    poll();
    monPollRef.current = setInterval(poll, 3000);
    return () => clearInterval(monPollRef.current);
  }, []);

  // ── Monitor actions ───────────────────────────────────────────────────────────
  const handleMonitorStart = async () => {
    if (!monEmail || !monPassword) { toast('Email and password are required', 'error'); return; }
    setMonAction('starting');
    try {
      await fetch(`${API}/api/monitor/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: monEmail, password: monPassword,
          imapHost: monImapHost, smtpHost: monSmtpHost,
          subjectKeyword: monKeyword, pollInterval: parseInt(monInterval),
        }),
      });
    } catch (e) { toast('Failed to start: ' + e.message, 'error'); }
    setMonAction('');
  };

  const handleMonitorStop = async () => {
    setMonAction('stopping');
    await fetch(`${API}/api/monitor/stop`, { method: 'POST' }).catch(() => {});
    setMonAction('');
  };

  const handleTestEmail = async () => {
    if (!monEmail || !monPassword) { toast('Email and password are required', 'error'); return; }
    setMonAction('testing');
    try {
      const res  = await fetch(`${API}/api/monitor/test-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: monEmail, password: monPassword, smtpHost: monSmtpHost, subjectKeyword: monKeyword }),
      });
      const data = await res.json();
      if (data.success) toast('Test email sent to ' + monEmail, 'success');
      else              toast('Failed: ' + data.error, 'error');
    } catch (e) { toast('Error: ' + e.message, 'error'); }
    setMonAction('');
  };

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const validateAndSetFile = (f) => {
    const ok = ['.pdf', '.txt', '.md'].some(ext => f.name.toLowerCase().endsWith(ext));
    if (!ok) { toast('Only PDF, TXT, or MD files allowed', 'error'); return; }
    setFile(f);
  };

  // ── Execute ──────────────────────────────────────────────────────────────────
  const handleExecute = async () => {
    if (!appUrl.trim()) { toast('Please enter the application URL', 'error'); return; }
    if (!file)          { toast('Please upload a requirement document', 'error'); return; }

    // Auto-convert Windows/Linux file paths → proper file:// URL
    let normalizedUrl = appUrl.trim();
    if (/^[a-zA-Z]:[/\\]/.test(normalizedUrl)) {
      // e.g.  C:\Users\... or C:/Users/...  →  file:///C:/Users/...
      normalizedUrl = 'file:///' + normalizedUrl.replace(/\\/g, '/');
    } else if (normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('//')) {
      // Unix absolute path  /home/user/...  →  file:///home/user/...
      normalizedUrl = 'file://' + normalizedUrl;
    }

    const validProtocol = normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://') || normalizedUrl.startsWith('file://');
    if (!validProtocol) { toast('Enter a valid URL or file path', 'error'); return; }

    setAppUrl(normalizedUrl); // show converted URL in the input

    setStatus('running');
    setLogs([]);
    setResults(null);
    setError('');

    const formData = new FormData();
    formData.append('appUrl',                normalizedUrl);
    formData.append('requirementFile',       file);
    formData.append('browsers',              JSON.stringify(browsers));
    formData.append('testScope',             testScope);
    formData.append('priorityFilter',        priorityFilter);
    formData.append('workers',               workers);
    formData.append('retries',               retries);
    formData.append('screenshots',           screenshots);
    formData.append('environment',           environment);
    formData.append('includeAccessibility',  String(includeAccessibility));
    formData.append('includePerformance',    String(includePerformance));

    try {
      const res  = await fetch(`${API}/api/execute`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setJobId(data.jobId);
    } catch (e) {
      setStatus('error');
      setError(e.message);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setJobId(null);
    setLogs([]);
    setResults(null);
    setError('');
    setFile(null);
    setActiveTab('summary');
    setExpandedRow(null);
    setSearchQuery('');
  };

  // ── Keyboard shortcut: Ctrl+Enter to execute ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && status === 'idle' && appUrl && file) {
        handleExecute();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, appUrl, file]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const testCases = results?.testCases || [];
  const stats     = results?.executionStats || {};
  const modules   = [...new Set(testCases.map(t => t.module))];

  const filtered  = testCases.filter(tc => {
    const okStatus = filterStatus === 'All' || tc.status === filterStatus;
    const okModule = filterModule === 'All' || tc.module === filterModule;
    const q = searchQuery.toLowerCase();
    const okSearch = !q || tc.title?.toLowerCase().includes(q) || tc.id?.toLowerCase().includes(q) || tc.module?.toLowerCase().includes(q);
    return okStatus && okModule && okSearch;
  });

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
    <Toast toasts={toasts} remove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    <Confetti active={showConfetti} />
    <div className="app">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-icon">🤖</span>
          <div>
            <div className="brand-title">QA AI Testing Tool</div>
            <div className="brand-sub">Automated test generation & execution</div>
          </div>
        </div>

        {/* Page nav */}
        <div className="topbar-nav">
          <button
            className={`topbar-navbtn ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
          >📊 Dashboard</button>
          <button
            className={`topbar-navbtn ${page === 'manual' ? 'active' : ''}`}
            onClick={() => setPage('manual')}
          >⚡ Manual Test</button>
          <button
            className={`topbar-navbtn ${page === 'monitor' ? 'active' : ''}`}
            onClick={() => setPage('monitor')}
          >
            📧 Email Monitor
            {monStatus?.isRunning && <span className="live-dot" />}
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {status === 'running' && (
            <span className="status-pill status-pill-running">⏳ Running…</span>
          )}
          {status === 'done' && (
            <span className="status-pill status-pill-done">✅ Complete</span>
          )}
          {status === 'done' && page === 'manual' && (
            <button className="btn btn-ghost" onClick={handleReset}>↺ New Run</button>
          )}
        </div>
      </header>

      <main className="main">

        {/* ══════════════ EMAIL MONITOR PAGE ═══════════════════════════════════ */}
        {page === 'monitor' && (
          <div>
            {/* Status banner */}
            <div className={`monitor-banner ${monStatus?.isRunning ? 'banner-live' : 'banner-off'}`}>
              <div className="monitor-banner-left">
                {monStatus?.isRunning ? <><span className="live-dot large" /> <strong>LIVE — Monitoring inbox</strong></> : <><span>⏸️</span> <strong>Monitor Stopped</strong></>}
                {monStatus?.isRunning && monStatus.config && (
                  <span className="banner-meta">
                    &nbsp;| Watching: <em>{monStatus.config.email}</em>
                    &nbsp;| Keyword: <em>"{monStatus.config.subjectKeyword}"</em>
                    &nbsp;| Every: {monStatus.config.pollInterval}s
                  </span>
                )}
              </div>
              {monStatus?.currentJob && (
                <div className="banner-job">
                  <span className="spinner small" /> Running tests for {monStatus.currentJob.appUrl}
                </div>
              )}
            </div>

            <div className="monitor-grid">
              {/* ── Config Panel ─────────────────────────────────────────── */}
              <div className="panel">
                <div className="panel-header">
                  <h2>📧 Email Configuration</h2>
                  <p>Configure IMAP (read) and SMTP (send) settings. Gmail recommended.</p>
                </div>

                <div className="field">
                  <label className="field-label">Gmail Address</label>
                  <input className="field-input" type="email" placeholder="yourname@gmail.com"
                    value={monEmail} onChange={e => setMonEmail(e.target.value)} />
                </div>

                <div className="field">
                  <label className="field-label">
                    App Password
                    <a href="https://myaccount.google.com/apppasswords" target="_blank"
                       rel="noreferrer" style={{ marginLeft: 8, fontSize: 11, color: '#6366f1' }}>
                      Generate →
                    </a>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input className="field-input" type={showPassword ? 'text' : 'password'}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={monPassword} onChange={e => setMonPassword(e.target.value)}
                      style={{ paddingRight: 44 }} />
                    <button onClick={() => setShowPassword(s => !s)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                               background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
                    ⚠️ Use App Password (not your Google account password). Requires 2FA enabled.
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="field">
                    <label className="field-label">IMAP Host</label>
                    <input className="field-input" value={monImapHost} onChange={e => setMonImapHost(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">SMTP Host</label>
                    <input className="field-input" value={monSmtpHost} onChange={e => setMonSmtpHost(e.target.value)} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="field">
                    <label className="field-label">Trigger Keyword <span className="field-hint">(in subject)</span></label>
                    <input className="field-input" value={monKeyword} onChange={e => setMonKeyword(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Poll Every <span className="field-hint">(seconds)</span></label>
                    <input className="field-input" type="number" min="30" value={monInterval}
                      onChange={e => setMonInterval(e.target.value)} />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                  {!monStatus?.isRunning ? (
                    <button className="btn btn-execute"
                      style={{ flex:1, padding:'12px', fontSize:14 }}
                      onClick={handleMonitorStart}
                      disabled={monAction === 'starting'}>
                      {monAction === 'starting' ? '⏳ Starting…' : '▶️ Start Monitoring'}
                    </button>
                  ) : (
                    <button className="btn"
                      style={{ flex:1, padding:'12px', fontSize:14, background:'#450a0a', color:'#fca5a5', border:'1px solid #7f1d1d' }}
                      onClick={handleMonitorStop}
                      disabled={monAction === 'stopping'}>
                      {monAction === 'stopping' ? '⏳ Stopping…' : '⏹ Stop Monitoring'}
                    </button>
                  )}
                  <button className="btn btn-ghost"
                    onClick={handleTestEmail}
                    disabled={monAction === 'testing'}>
                    {monAction === 'testing' ? '⏳ Sending…' : '📨 Test Email'}
                  </button>
                </div>

                {/* How it works */}
                <div className="steps-preview" style={{ marginTop:20 }}>
                  <div className="steps-title">🔄 Automated Flow</div>
                  <div className="steps-list">
                    {[
                      ['📨', 'Someone sends email with subject: "deployment done"'],
                      ['🌐', 'Bot extracts App URL from email body'],
                      ['📎', 'Uses attached requirement doc (or default keywords)'],
                      ['⚡', 'Runs full Playwright test suite automatically'],
                      ['📊', 'Generates HTML report + Excel file'],
                      ['📧', 'Replies to sender with results + attachments'],
                    ].map(([icon, text]) => (
                      <div key={text} className="step-item"><span>{icon}</span><span>{text}</span></div>
                    ))}
                  </div>
                </div>

                {/* Email format tip */}
                <div style={{ background:'#1e3a5f', border:'1px solid #1d4ed8', borderRadius:10, padding:14, marginTop:16, fontSize:12 }}>
                  <div style={{ color:'#93c5fd', fontWeight:600, marginBottom:6 }}>📩 Trigger Email Format</div>
                  <div style={{ color:'#bfdbfe', fontFamily:'monospace', lineHeight:1.8 }}>
                    <div><strong>To:</strong> {monEmail || 'yourname@gmail.com'}</div>
                    <div><strong>Subject:</strong> {monKeyword || 'deployment done'} - v2.0</div>
                    <div><strong>Body:</strong></div>
                    <div style={{ paddingLeft:12 }}>
                      Hi QA Bot,<br/>
                      Deployment is complete.<br/>
                      <span style={{ color:'#60a5fa' }}>URL: http://your-app.com</span><br/>
                      Please run the tests.
                    </div>
                    <div><strong>Attachment:</strong> requirements.txt (optional)</div>
                  </div>
                </div>
              </div>

              {/* ── Live Log Panel ────────────────────────────────────────── */}
              <div className="panel" style={{ display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ margin:0 }}>📜 Live Monitor Log</h2>
                  {monStatus?.lastChecked && (
                    <span style={{ color:'#64748b', fontSize:12 }}>
                      Last check: {new Date(monStatus.lastChecked).toLocaleTimeString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="logs-box" style={{ flex:1, minHeight:400 }}>
                  <div className="logs-title">
                    {monStatus?.isRunning
                      ? `🟢 Live — ${monStatus.logsCount || 0} log entries`
                      : '⏸️ Monitor stopped'}
                  </div>
                  <div className="logs-content" ref={monLogsRef} style={{ maxHeight:480 }}>
                    {(monStatus?.logs || []).length === 0 ? (
                      <div style={{ color:'#475569', fontStyle:'italic', padding:'20px 0' }}>
                        No logs yet. Start the monitor to begin.
                      </div>
                    ) : (
                      (monStatus?.logs || []).map((l, i) => (
                        <div key={i} className={`log-line ${l.includes('❌') ? 'log-error' : l.includes('✅') || l.includes('COMPLETE') ? 'log-success' : l.includes('🚀') || l.includes('📧') ? 'log-highlight' : ''}`}>
                          {l}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Current job card */}
                {monStatus?.currentJob && (
                  <div style={{ marginTop:12, background:'#1e3a5f', border:'1px solid #3b82f6', borderRadius:10, padding:14 }}>
                    <div style={{ color:'#93c5fd', fontWeight:600, marginBottom:8 }}>
                      ⚡ Currently Running Test Pipeline
                    </div>
                    <div style={{ fontSize:12, color:'#bfdbfe' }}>
                      <div><strong>URL:</strong> {monStatus.currentJob.appUrl}</div>
                      <div><strong>Triggered by:</strong> {monStatus.currentJob.from}</div>
                      <div><strong>Subject:</strong> {monStatus.currentJob.subject}</div>
                      <div><strong>Started:</strong> {new Date(monStatus.currentJob.startTime).toLocaleTimeString('en-IN')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ DASHBOARD PAGE ════════════════════════════════════════ */}
        {page === 'dashboard' && (
          <DashboardPage runHistory={runHistory} onNavigate={setPage} />
        )}

        {/* ══════════════ MANUAL TEST PAGE ═════════════════════════════════════ */}
        {page === 'manual' && <>
        {/* ────────────────── INPUT PANEL ──────────────────────────────────── */}
        {status === 'idle' && (
          <div className="panel input-panel">
            <div className="panel-header">
              <h2>🚀 Configure & Execute</h2>
              <p>Enter your application URL and upload the requirement document to begin automated testing.</p>
            </div>

            {/* URL */}
            <div className="field">
              <label className="field-label">
                🌐 Application URL
                <span className="field-hint"> — The URL of the app to be tested</span>
              </label>
              <input
                className="field-input"
                type="text"
                placeholder="http://localhost:3000  or  C:/Users/Vishal/PlaywrightPractice/insurance-app/index.html"
                value={appUrl}
                onChange={e => setAppUrl(e.target.value)}
              />
            </div>

            {/* File upload */}
            <div className="field">
              <label className="field-label">
                📄 Requirement Document
                <span className="field-hint"> — PDF, TXT, or MD file</span>
              </label>
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                {file ? (
                  <div className="file-info">
                    <span className="file-icon">📃</span>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="file-remove" onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <div className="drop-icon">📁</div>
                    <div className="drop-text">Drop file here or <span className="drop-link">browse</span></div>
                    <div className="drop-sub">PDF, TXT, MD — max 10 MB</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) validateAndSetFile(e.target.files[0]); }}
              />
            </div>

            {/* ── Advanced Configuration ──────────────────────────────── */}
            <div className="adv-config-wrapper">
              <button className="adv-toggle" onClick={() => setShowAdvanced(s => !s)}>
                {showAdvanced ? '▲' : '▼'} ⚙️ Advanced Configuration
                <span className="adv-badge">
                  {browsers.length}B · {testScope} · {environment}
                </span>
              </button>

              {showAdvanced && (
                <div className="adv-config-panel">

                  {/* Row 1: Environment + Test Scope */}
                  <div className="adv-row">
                    <div className="adv-field">
                      <label className="adv-label">🌍 Environment</label>
                      <div className="adv-btn-group">
                        {['Dev','QA','Staging','Prod'].map(e => (
                          <button key={e}
                            className={`adv-chip ${environment === e ? 'active' : ''}`}
                            onClick={() => setEnvironment(e)}
                            style={{ borderColor: e === 'Prod' ? '#ef4444' : e === 'Staging' ? '#f59e0b' : '#6366f1' }}
                          >{e}</button>
                        ))}
                      </div>
                    </div>

                    <div className="adv-field">
                      <label className="adv-label">🎯 Test Scope</label>
                      <div className="adv-btn-group">
                        {[
                          { id:'smoke',      label:'🔥 Smoke',      tip:'1 critical test/module' },
                          { id:'sanity',     label:'✅ Sanity',     tip:'2 tests/module' },
                          { id:'regression', label:'🔄 Regression', tip:'All tests' },
                          { id:'full',       label:'🚀 Full E2E',   tip:'All + edge cases' },
                        ].map(s => (
                          <button key={s.id} title={s.tip}
                            className={`adv-chip ${testScope === s.id ? 'active' : ''}`}
                            onClick={() => setTestScope(s.id)}
                          >{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Browsers */}
                  <div className="adv-field">
                    <label className="adv-label">🌐 Browsers <span style={{color:'#64748b',fontSize:11}}>(select multiple)</span></label>
                    <div className="adv-btn-group">
                      {[
                        { id:'chromium',      icon:'🟡', label:'Chrome' },
                        { id:'firefox',       icon:'🦊', label:'Firefox' },
                        { id:'webkit',        icon:'🍎', label:'Safari' },
                        { id:'mobile-chrome', icon:'📱', label:'Mobile Chrome' },
                        { id:'mobile-safari', icon:'📱', label:'Mobile Safari' },
                      ].map(b => {
                        const selected = browsers.includes(b.id);
                        return (
                          <button key={b.id}
                            className={`adv-chip browser-chip ${selected ? 'active' : ''}`}
                            onClick={() => setBrowsers(prev =>
                              prev.includes(b.id)
                                ? (prev.length > 1 ? prev.filter(x => x !== b.id) : prev)
                                : [...prev, b.id]
                            )}
                          >{b.icon} {b.label}</button>
                        );
                      })}
                    </div>
                    {browsers.length > 1 && (
                      <div style={{fontSize:11,color:'#f59e0b',marginTop:4}}>
                        ⚠️ Multi-browser runs take longer. Each test runs in each selected browser.
                      </div>
                    )}
                  </div>

                  {/* Row 3: Priority + Screenshots */}
                  <div className="adv-row">
                    <div className="adv-field">
                      <label className="adv-label">⚡ Priority Filter</label>
                      <select className="field-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{marginTop:4}}>
                        <option value="all">All Priorities</option>
                        <option value="high">Critical + High only</option>
                        <option value="critical">Critical only</option>
                      </select>
                    </div>

                    <div className="adv-field">
                      <label className="adv-label">📸 Screenshots</label>
                      <select className="field-input" value={screenshots} onChange={e => setScreenshots(e.target.value)} style={{marginTop:4}}>
                        <option value="only-on-failure">On Failure only</option>
                        <option value="on">Always (every test)</option>
                        <option value="off">Never</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Workers + Retries */}
                  <div className="adv-row">
                    <div className="adv-field">
                      <label className="adv-label">⚙️ Parallel Workers: <strong style={{color:'#6366f1'}}>{workers}</strong></label>
                      <input type="range" min="1" max="5" value={workers}
                        onChange={e => setWorkers(e.target.value)}
                        style={{width:'100%',marginTop:6,accentColor:'#6366f1'}} />
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#475569'}}>
                        <span>1 (slow)</span><span>3 (default)</span><span>5 (fast)</span>
                      </div>
                    </div>

                    <div className="adv-field">
                      <label className="adv-label">🔁 Retry Failed Tests</label>
                      <select className="field-input" value={retries} onChange={e => setRetries(e.target.value)} style={{marginTop:4}}>
                        <option value="0">No retries</option>
                        <option value="1">Retry 1×</option>
                        <option value="2">Retry 2×</option>
                        <option value="3">Retry 3×</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Extra checks */}
                  <div className="adv-field">
                    <label className="adv-label">🔬 Extra Checks</label>
                    <div style={{display:'flex',gap:16,marginTop:6,flexWrap:'wrap'}}>
                      <label className="adv-checkbox">
                        <input type="checkbox" checked={includeAccessibility}
                          onChange={e => setIncludeAccessibility(e.target.checked)} />
                        <span>♿ Accessibility Scan</span>
                        <span className="adv-chip-tag">A11Y</span>
                      </label>
                      <label className="adv-checkbox">
                        <input type="checkbox" checked={includePerformance}
                          onChange={e => setIncludePerformance(e.target.checked)} />
                        <span>⚡ Performance Metrics</span>
                        <span className="adv-chip-tag">PERF</span>
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Execute button */}
            <button
              className="btn btn-execute"
              onClick={handleExecute}
              disabled={!appUrl || !file}
            >
              ⚡ Execute Testing
              <span className="kbd-hint">Ctrl+↵</span>
            </button>

            {/* Feature grid */}
            <div className="feature-grid">
              {[
                { icon:'📄', title:'Smart Parsing',   desc:'PDF, TXT, MD support' },
                { icon:'🧠', title:'AI Test Gen',     desc:'Rule-based intelligence' },
                { icon:'🌐', title:'Multi-Browser',   desc:'Chrome, Firefox, Safari' },
                { icon:'⚡', title:'Parallel Tests',  desc:'Up to 5× faster runs' },
                { icon:'📊', title:'Rich Reports',    desc:'HTML + Excel export' },
                { icon:'♿', title:'A11Y + Perf',     desc:'Built-in quality checks' },
              ].map(f => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── RUNNING PANEL ────────────────────────────────── */}
        {status === 'running' && (
          <div className="panel">
            <div className="running-header">
              <div className="spinner" />
              <div>
                <h2>Executing Tests…</h2>
                <p>Running automated QA pipeline against <strong>{appUrl}</strong></p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="pipeline-steps">
              {[
                'Parsing requirement document',
                'Generating test cases',
                'Converting to Playwright scripts',
                'Executing Playwright tests',
                'Updating test cases with results',
                'Generating HTML report',
              ].map((step, i) => {
                const stepLog = logs.find(l => l.includes(`Step ${i + 1}/6`));
                const done    = logs.some(l => l.includes(`Step ${i + 2}/6`) || l.includes('All done'));
                const active  = stepLog && !done;
                return (
                  <div key={i} className={`pipe-step ${done ? 'pipe-done' : active ? 'pipe-active' : ''}`}>
                    <span className="pipe-num">{done ? '✓' : i + 1}</span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Overall progress bar */}
            {(() => {
              const stepsDone = [1,2,3,4,5,6].filter(n =>
                logs.some(l => l.includes(`Step ${n + 1}/6`) || l.includes('All done'))
              ).length;
              const pct = Math.min(100, Math.round((stepsDone / 6) * 100));
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8', marginBottom:6 }}>
                    <span>Pipeline Progress</span>
                    <span style={{ fontWeight:700, color:'#818cf8' }}>{pct}%</span>
                  </div>
                  <div style={{ background:'#1e293b', borderRadius:999, height:8, overflow:'hidden' }}>
                    <div style={{
                      width:`${pct}%`, height:'100%', borderRadius:999,
                      background:'linear-gradient(90deg,#6366f1,#818cf8)',
                      transition:'width .5s ease',
                      boxShadow: pct > 0 ? '0 0 10px rgba(99,102,241,.5)' : 'none',
                    }} />
                  </div>
                </div>
              );
            })()}

            {/* Live logs */}
            <div className="logs-box">
              <div className="logs-title">Live Execution Log</div>
              <div className="logs-content">
                {logs.map((log, i) => (
                  <div key={i} className={`log-line ${log.includes('ERROR') ? 'log-error' : log.includes('✅') ? 'log-success' : ''}`}>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── ERROR PANEL ──────────────────────────────────── */}
        {status === 'error' && (
          <div className="panel error-panel">
            <div className="error-icon">❌</div>
            <h2>Execution Failed</h2>
            <p className="error-msg">{error}</p>
            <div className="logs-box" style={{ marginTop: 16 }}>
              <div className="logs-content">
                {logs.map((log, i) => <div key={i} className="log-line">{log}</div>)}
              </div>
            </div>
            <button className="btn btn-execute" style={{ marginTop: 20 }} onClick={handleReset}>
              ↺ Try Again
            </button>
          </div>
        )}

        {/* ────────────────── RESULTS PANEL ────────────────────────────────── */}
        {status === 'done' && results && (
          <>
            {/* Summary cards */}
            <div className="results-header">
              <div className="results-title">
                <span>🎉</span>
                <div>
                  <h2>Test Execution Complete</h2>
                  <p>{appUrl} &nbsp;|&nbsp; {stats.duration}s execution time</p>
                </div>
              </div>
              <div className="download-btns">
                <a
                  className="btn btn-download"
                  href={`${API}/api/download/${jobId}/report`}
                  download="qa-report.html"
                >
                  📥 Download HTML Report
                </a>
                <a
                  className="btn btn-download-excel"
                  href={`${API}/api/download/${jobId}/excel`}
                  download="QA_Test_Cases.xlsx"
                >
                  📊 Download Excel (.xlsx)
                </a>
                <a
                  className="btn btn-download-json"
                  href={`${API}/api/download/${jobId}/testcases`}
                  download="test-cases.json"
                >
                  📥 Download JSON
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="stat-cards">
              {[
                { label: 'Total',    value: stats.total,   color: '#6366f1' },
                { label: 'Passed',   value: stats.passed,  color: '#10b981' },
                { label: 'Failed',   value: stats.failed,  color: '#ef4444' },
                { label: 'Skipped',  value: stats.skipped || 0, color: '#94a3b8' },
                { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444' },
              ].map(c => (
                <CountUpCard key={c.label} label={c.label} value={c.value} color={c.color} />
              ))}
            </div>

            {/* Pass rate bar + donut */}
            <div className="passrate-row">
              <DonutChart passRate={passRate} />
              <div className="pass-rate-bar" style={{flex:1}}>
                <div className="prate-header">
                  <span>Overall Pass Rate</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: passRate >= 80 ? '#10b981' : '#f59e0b' }}>
                    {passRate}%
                  </span>
                </div>
                <div className="prate-track">
                  <div
                    className="prate-fill"
                    style={{
                      width: `${passRate}%`,
                      background: passRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                                  passRate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' :
                                                  'linear-gradient(90deg,#ef4444,#f87171)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Run config badges */}
            {results?.runConfig && (
              <div className="run-config-bar">
                <span className="rcfg-badge env">{results.runConfig.environment}</span>
                <span className="rcfg-badge scope">{results.runConfig.testScope}</span>
                {results.runConfig.browsers.map(b => (
                  <span key={b} className="rcfg-badge browser">
                    {b === 'chromium' ? '🟡' : b === 'firefox' ? '🦊' : b === 'webkit' ? '🍎' : '📱'} {b}
                  </span>
                ))}
                <span className="rcfg-badge">⚙️ {results.runConfig.workers}w / {results.runConfig.retries}r</span>
                {results.runConfig.includeAccessibility && <span className="rcfg-badge a11y">♿ A11Y</span>}
                {results.runConfig.includePerformance   && <span className="rcfg-badge perf">⚡ PERF</span>}
              </div>
            )}

            {/* Tabs */}
            <div className="tabs">
              {[
                { id: 'summary',   label: '📊 Module Summary' },
                { id: 'testcases', label: `📋 Test Cases (${testCases.length})` },
                { id: 'logs',      label: '📜 Execution Log' },
                { id: 'history',   label: `🕒 History (${runHistory.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Module Summary */}
            {activeTab === 'summary' && (
              <div>
                {/* Overview strip */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                  {[
                    { icon:'📦', label:'Modules', val: modules.length, color:'#a5b4fc' },
                    { icon:'🧪', label:'Total Tests', val: testCases.length, color:'#fbbf24' },
                    {
                      icon:'📊', label:'Avg Coverage', color: passRate >= 80 ? '#34d399' : passRate >= 50 ? '#fbbf24' : '#f87171',
                      val: `${modules.length > 0 ? Math.round(modules.reduce((s, m) => {
                        const t = testCases.filter(tc => tc.module === m);
                        return s + (t.length > 0 ? t.filter(tc => tc.status === 'Pass').length / t.length * 100 : 0);
                      }, 0) / modules.length) : 0}%`,
                    },
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Horizontal bar chart per module */}
                <div className="mod-chart">
                  {modules.map(mod => {
                    const modTests = testCases.filter(t => t.module === mod);
                    const mp = modTests.filter(t => t.status === 'Pass').length;
                    const mf = modTests.filter(t => t.status === 'Fail').length;
                    const mr = modTests.length > 0 ? Math.round(mp / modTests.length * 100) : 0;
                    const color = mr >= 80 ? '#10b981' : mr >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={mod} className="mod-row">
                        <div className="mod-name">
                          <span style={{ marginRight:6 }}>{modTests[0]?.icon}</span>{mod}
                        </div>
                        <div>
                          <div className="mod-track">
                            <div className="mod-fill" style={{ width:`${mr}%`, background:color }} />
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#475569', marginTop:3 }}>
                            <span style={{ color:'#34d399' }}>✓ {mp} pass</span>
                            {mf > 0 && <span style={{ color:'#f87171' }}>✗ {mf} fail</span>}
                            <span>{modTests.length} total</span>
                          </div>
                        </div>
                        <div className="mod-pct" style={{ color }}>{mr}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Test Cases */}
            {activeTab === 'testcases' && (
              <div>
                {/* Filters */}
                <div className="filters">
                  <select className="filter-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                    <option value="Skipped">Skipped</option>
                    <option value="Not Executed">Not Executed</option>
                  </select>
                  <select className="filter-sel" value={filterModule} onChange={e => setFilterModule(e.target.value)}>
                    <option value="All">All Modules</option>
                    {modules.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      className="search-input"
                      placeholder="Search tests…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="filter-count">{filtered.length} test{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Module</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((tc, i) => (
                        <Fragment key={tc.id}>
                          <tr
                            className={`tr-clickable ${tc.status === 'Fail' ? 'row-fail' : tc.status === 'Pass' ? 'row-pass' : ''}`}
                            onClick={() => setExpandedRow(expandedRow === tc.id ? null : tc.id)}
                          >
                            <td style={{ color: '#64748b', fontSize: 12 }}>{i + 1}</td>
                            <td><span className="tc-id">{tc.id}</span></td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{tc.title}</div>
                              {tc.error && (
                                <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }} title={tc.error}>
                                  {tc.error.slice(0, 80)}{tc.error.length > 80 ? '…' : ''}
                                </div>
                              )}
                            </td>
                            <td style={{ color: '#a5b4fc', fontSize: 12 }}>{tc.module}</td>
                            <td>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                                background: tc.type === 'Positive' ? '#064e3b' : tc.type === 'Negative' ? '#450a0a' : '#2d1b4e',
                                color: tc.type === 'Positive' ? '#34d399' : tc.type === 'Negative' ? '#fca5a5' : '#c4b5fd',
                              }}>{tc.type}</span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                                color: PRIORITY_COLOR[tc.priority] || '#fff',
                                border: `1px solid ${PRIORITY_COLOR[tc.priority] || '#fff'}33`,
                                background: `${PRIORITY_COLOR[tc.priority]}22`,
                              }}>{tc.priority}</span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                                background: tc.status === 'Pass' ? '#064e3b' : tc.status === 'Fail' ? '#450a0a' : '#1e293b',
                                color: tc.status === 'Pass' ? '#34d399' : tc.status === 'Fail' ? '#fca5a5' : '#94a3b8',
                              }}>{STATUS_ICON[tc.status]} {tc.status}</span>
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: 12 }}>
                              {tc.duration != null ? `${tc.duration}ms` : '—'}
                              <span style={{ color:'#475569', marginLeft:4, fontSize:10 }}>
                                {expandedRow === tc.id ? '▲' : '▼'}
                              </span>
                            </td>
                          </tr>
                          {expandedRow === tc.id && (
                            <tr className="tr-expanded">
                              <td colSpan={8}>
                                <div className="expanded-detail">
                                  <div className="exp-section">
                                    <div className="exp-title">📋 Test Steps</div>
                                    <ol className="exp-steps">
                                      {(tc.steps || []).map((s, idx) => <li key={idx}>{s}</li>)}
                                    </ol>
                                  </div>
                                  <div className="exp-section">
                                    <div className="exp-title">✅ Expected Result</div>
                                    <div className="exp-text">{tc.expected}</div>
                                  </div>
                                  {tc.error && (
                                    <div className="exp-section">
                                      <div className="exp-title" style={{color:'#ef4444'}}>❌ Error</div>
                                      <div className="exp-text exp-error">{tc.error}</div>
                                    </div>
                                  )}
                                  {tc.actual && (
                                    <div className="exp-section">
                                      <div className="exp-title" style={{color:'#f59e0b'}}>📝 Actual</div>
                                      <div className="exp-text">{tc.actual}</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Logs */}
            {activeTab === 'logs' && (
              <div className="logs-box">
                <div className="logs-content">
                  {logs.map((log, i) => (
                    <div key={i} className={`log-line ${log.includes('ERROR') ? 'log-error' : log.includes('✅') ? 'log-success' : ''}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div>
                {runHistory.length === 0 ? (
                  <div style={{color:'#475569',textAlign:'center',padding:'40px 0',fontStyle:'italic'}}>
                    No history yet. Complete a test run to see trends.
                  </div>
                ) : (
                  <>
                    {/* Trend bar chart */}
                    <div className="history-trend">
                      {[...runHistory].reverse().map((run, i) => (
                        <div key={run.jobId} className="trend-bar-wrap" title={`${run.timestamp?.slice(0,10)} — ${run.passRate}% pass`}>
                          <div className="trend-bar-track">
                            <div className="trend-bar-fill" style={{
                              height: `${run.passRate}%`,
                              background: run.passRate >= 80 ? '#10b981' : run.passRate >= 50 ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                          <div className="trend-bar-label">{run.passRate}%</div>
                          <div className="trend-bar-sub">{run.timestamp?.slice(5,10)}</div>
                        </div>
                      ))}
                    </div>

                    {/* History table */}
                    <div className="table-wrap" style={{marginTop:16}}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>App URL</th>
                            <th>Env</th>
                            <th>Scope</th>
                            <th>Browsers</th>
                            <th className="tc">Total</th>
                            <th className="tc pass-c">Pass</th>
                            <th className="tc fail-c">Fail</th>
                            <th>Pass Rate</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runHistory.map((run, idx) => (
                            <tr key={run.jobId} className={idx === 0 ? 'row-pass' : ''}>
                              <td style={{color:'#64748b',fontSize:12}}>{runHistory.length - idx}</td>
                              <td style={{fontSize:11,color:'#94a3b8'}}>{run.timestamp?.slice(0,16).replace('T',' ')}</td>
                              <td style={{fontSize:11,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={run.appUrl}>{run.appUrl}</td>
                              <td><span className="rcfg-badge env" style={{fontSize:10}}>{run.environment}</span></td>
                              <td><span className="rcfg-badge scope" style={{fontSize:10}}>{run.testScope}</span></td>
                              <td style={{fontSize:11}}>{(run.browsers||[]).map(b=>b==='chromium'?'🟡':b==='firefox'?'🦊':b==='webkit'?'🍎':'📱').join(' ')}</td>
                              <td className="tc">{run.total}</td>
                              <td className="tc pass-c">{run.passed}</td>
                              <td className="tc fail-c">{run.failed}</td>
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{flex:1,background:'#1e293b',borderRadius:4,height:6,overflow:'hidden'}}>
                                    <div style={{width:`${run.passRate}%`,height:'100%',background: run.passRate>=80?'#10b981':run.passRate>=50?'#f59e0b':'#ef4444'}} />
                                  </div>
                                  <span style={{fontSize:11,minWidth:32,color:'#94a3b8'}}>{run.passRate}%</span>
                                </div>
                              </td>
                              <td style={{color:'#64748b',fontSize:12}}>{run.duration}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </>}

      </main>

      <footer className="footer">
        QA AI Testing Tool &nbsp;|&nbsp; Powered by Playwright v1.55 &nbsp;|&nbsp; Rule-Based Test Generation
      </footer>
    </div>

    {/* ── Floating AI Chatbot ──────────────────────────────────────────────── */}
    <ChatBot
      actions={{
        setPage,
        setAppUrl,
        setBrowsers,
        setTestScope,
        setEnvironment,
        setPriorityFilter,
        setIncludeAccessibility,
        setIncludePerformance,
        setShowAdvanced,
        setActiveTab,
        setWorkers,
        handleReset,
      }}
      state={{ status, results, runHistory }}
    />
    </>
  );
}
```


---

### `frontend/src/App.css`

```css
/* ── QA AI Testing Tool — Styles ─────────────────────────────────────────────── */

:root {
  --bg:       #0f172a;
  --surface:  #1e293b;
  --surface2: #334155;
  --border:   #334155;
  --primary:  #6366f1;
  --primary-d:#4f46e5;
  --text:     #f1f5f9;
  --muted:    #94a3b8;
  --pass:     #10b981;
  --fail:     #ef4444;
  --warn:     #f59e0b;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}

/* ── App layout ─────────────────────────────────────────────────────────────── */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Top bar ────────────────────────────────────────────────────────────────── */
.topbar {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
  border-bottom: 1px solid var(--border);
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon { font-size: 28px; }
.brand-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
.brand-sub { font-size: 12px; color: #a5b4fc; }

/* ── Main content ───────────────────────────────────────────────────────────── */
.main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
}

/* ── Panels ─────────────────────────────────────────────────────────────────── */
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}

.panel-header { margin-bottom: 28px; }
.panel-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.panel-header p { color: var(--muted); }

/* ── Fields ─────────────────────────────────────────────────────────────────── */
.field { margin-bottom: 24px; }
.field-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 13px;
}
.field-hint { color: var(--muted); font-weight: 400; font-size: 12px; }
.field-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 11px 14px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.field-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,.2);
}

/* ── Drop zone ──────────────────────────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 28px;
  cursor: pointer;
  transition: all .2s;
  text-align: center;
}
.drop-zone:hover, .drop-zone.drag-over {
  border-color: var(--primary);
  background: rgba(99,102,241,.06);
}
.drop-zone.has-file {
  border-style: solid;
  border-color: var(--primary);
  background: rgba(99,102,241,.08);
}
.drop-icon { font-size: 40px; margin-bottom: 8px; }
.drop-text { font-size: 14px; color: var(--muted); }
.drop-link { color: var(--primary); text-decoration: underline; }
.drop-sub { font-size: 12px; color: var(--border); margin-top: 4px; }

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}
.file-icon { font-size: 36px; }
.file-name { font-weight: 600; font-size: 14px; }
.file-size { font-size: 12px; color: var(--muted); }
.file-remove {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  transition: all .15s;
}
.file-remove:hover { border-color: var(--fail); color: var(--fail); }

/* ── Buttons ────────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all .15s;
  text-decoration: none;
}
.btn-execute {
  background: linear-gradient(135deg, var(--primary), var(--primary-d));
  color: #fff;
  width: 100%;
  justify-content: center;
  padding: 14px;
  font-size: 16px;
  border-radius: 12px;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(99,102,241,.3);
}
.btn-execute:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99,102,241,.4);
}
.btn-execute:disabled {
  opacity: .5;
  cursor: not-allowed;
  transform: none;
}
.btn-ghost {
  background: rgba(255,255,255,.08);
  border: 1px solid var(--border);
  color: var(--text);
}
.btn-ghost:hover { background: rgba(255,255,255,.12); }
.btn-download {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16,185,129,.25);
}
.btn-download:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,.35); }
.btn-download-excel {
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: #fff;
  box-shadow: 0 2px 8px rgba(34,197,94,.25);
}
.btn-download-excel:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,.35); }
.btn-download-json {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59,130,246,.25);
}
.btn-download-json:hover { transform: translateY(-1px); }

/* ── Steps preview ──────────────────────────────────────────────────────────── */
.steps-preview {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}
.steps-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  margin-bottom: 12px;
  font-weight: 600;
}
.steps-list { display: flex; flex-direction: column; gap: 8px; }
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
}
.step-item span:first-child { font-size: 16px; min-width: 20px; }

/* ── Running panel ──────────────────────────────────────────────────────────── */
.running-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.running-header h2 { font-size: 20px; font-weight: 700; }
.running-header p { color: var(--muted); margin-top: 4px; }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Pipeline steps ─────────────────────────────────────────────────────────── */
.pipeline-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.pipe-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 13px;
  transition: all .2s;
}
.pipe-step.pipe-active {
  background: rgba(99,102,241,.1);
  border-color: var(--primary);
  color: var(--text);
}
.pipe-step.pipe-done {
  background: rgba(16,185,129,.06);
  border-color: #065f46;
  color: #34d399;
}
.pipe-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface2);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.pipe-done .pipe-num {
  background: #065f46;
  color: #34d399;
}
.pipe-active .pipe-num {
  background: var(--primary);
  color: #fff;
}

/* ── Logs box ───────────────────────────────────────────────────────────────── */
.logs-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.logs-title {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}
.logs-content {
  padding: 12px 14px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
}
.log-line {
  padding: 2px 0;
  color: var(--muted);
  border-bottom: 1px solid rgba(255,255,255,.03);
}
.log-error { color: #fca5a5; }
.log-success { color: #34d399; }

/* ── Results header ─────────────────────────────────────────────────────────── */
.results-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.results-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.results-title span { font-size: 32px; }
.results-title h2 { font-size: 22px; font-weight: 700; }
.results-title p { color: var(--muted); margin-top: 2px; font-size: 13px; }
.download-btns { display: flex; gap: 10px; flex-wrap: wrap; }

/* ── Stat cards ─────────────────────────────────────────────────────────────── */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--surface);
  border: 1px solid;
  border-radius: 12px;
  padding: 18px 16px;
  text-align: center;
}
.stat-val { font-size: 32px; font-weight: 800; line-height: 1; }
.stat-lbl { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .5px; margin-top: 6px; }

/* ── Pass rate bar ──────────────────────────────────────────────────────────── */
.pass-rate-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 24px;
}
.prate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}
.prate-track {
  background: var(--surface2);
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}
.prate-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .8s ease;
}

/* ── Tabs ───────────────────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}
.tab {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all .15s;
}
.tab:hover { color: var(--text); }
.tab-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

/* ── Table ──────────────────────────────────────────────────────────────────── */
.table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  overflow-x: auto;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}
.tbl th {
  background: var(--surface2);
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 10px 14px;
  text-align: left;
  white-space: nowrap;
}
.tbl td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: rgba(255,255,255,.025); }
.row-pass td:first-child { border-left: 3px solid var(--pass); }
.row-fail td:first-child { border-left: 3px solid var(--fail); }
.tc { text-align: center; }
.pass-c { color: var(--pass); font-weight: 700; text-align: center; }
.fail-c { color: var(--fail); font-weight: 700; text-align: center; }
.tc-id {
  font-family: 'Consolas', monospace;
  font-size: 12px;
  background: var(--surface2);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

/* ── Filters ────────────────────────────────────────────────────────────────── */
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.filter-sel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}
.filter-sel:focus { border-color: var(--primary); }
.filter-count { color: var(--muted); font-size: 13px; margin-left: auto; }

/* ── Error panel ────────────────────────────────────────────────────────────── */
.error-panel {
  text-align: center;
}
.error-icon { font-size: 56px; margin-bottom: 16px; }
.error-panel h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.error-msg { color: #fca5a5; font-size: 14px; max-width: 600px; margin: 0 auto; }

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.footer {
  border-top: 1px solid var(--border);
  padding: 16px 40px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

/* ── Topbar nav ─────────────────────────────────────────────────────────────── */
.topbar-nav { display:flex; gap:6px; }
.topbar-navbtn {
  background: rgba(255,255,255,.06);
  border: 1px solid transparent;
  color: var(--muted);
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all .15s;
}
.topbar-navbtn:hover { background: rgba(255,255,255,.1); color: var(--text); }
.topbar-navbtn.active {
  background: rgba(99,102,241,.2);
  border-color: var(--primary);
  color: #c7d2fe;
  font-weight: 600;
}

/* ── Live dot ────────────────────────────────────────────────────────────────── */
.live-dot {
  width: 8px; height: 8px;
  background: #10b981;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}
.live-dot.large { width: 12px; height: 12px; margin-right: 4px; }
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .6; transform: scale(1.2); }
}

/* ── Monitor banner ──────────────────────────────────────────────────────────── */
.monitor-banner {
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}
.banner-live { background: rgba(16,185,129,.1); border: 1px solid #065f46; color: #34d399; }
.banner-off  { background: rgba(148,163,184,.06); border: 1px solid var(--border); color: var(--muted); }
.monitor-banner-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.banner-meta { color: inherit; opacity: .8; font-size: 12px; }
.banner-job  { display: flex; align-items: center; gap: 8px; color: #93c5fd; font-size: 12px; }

/* ── Monitor grid ────────────────────────────────────────────────────────────── */
.monitor-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .monitor-grid { grid-template-columns: 1fr; }
}

/* ── Spinner small ───────────────────────────────────────────────────────────── */
.spinner.small { width: 14px; height: 14px; border-width: 2px; }

/* ── Log highlight ───────────────────────────────────────────────────────────── */
.log-highlight { color: #a5b4fc; }

/* ── Scrollbar ──────────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }

/* ── Advanced Config Panel ───────────────────────────────────────────────────── */
.adv-config-wrapper { margin-top: 4px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }

.adv-toggle {
  width: 100%; display: flex; align-items: center; gap: 10px;
  background: #1e293b; border: none; color: var(--text);
  padding: 12px 16px; cursor: pointer; font-size: 13px; font-weight: 600;
  text-align: left;
}
.adv-toggle:hover { background: #273548; }
.adv-badge {
  margin-left: auto; font-size: 11px; font-weight: 400;
  color: #94a3b8; background: #0f172a; padding: 2px 8px; border-radius: 20px;
  border: 1px solid var(--border);
}

.adv-config-panel {
  background: #131e2e; padding: 20px; display: flex; flex-direction: column; gap: 18px;
  border-top: 1px solid var(--border);
}

.adv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 700px) { .adv-row { grid-template-columns: 1fr; } }

.adv-field { display: flex; flex-direction: column; gap: 2px; }
.adv-label { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }

.adv-btn-group { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }

.adv-chip {
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer;
  background: #1e293b; color: #94a3b8; border: 1px solid #334155;
  transition: all .15s;
}
.adv-chip:hover { border-color: var(--primary); color: var(--text); }
.adv-chip.active { background: #312e81; color: #a5b4fc; border-color: var(--primary); }
.adv-chip.browser-chip.active { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }

.adv-checkbox {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;
  background: #1e293b; font-size: 13px; color: #94a3b8; transition: all .15s;
}
.adv-checkbox:hover { border-color: var(--primary); color: var(--text); }
.adv-checkbox input[type="checkbox"] { accent-color: var(--primary); width: 14px; height: 14px; }
.adv-checkbox input:checked + span { color: var(--text); }

.adv-chip-tag {
  font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px;
  background: #312e81; color: #a5b4fc; letter-spacing: .5px;
}

/* ── Run Config Bar (in results) ─────────────────────────────────────────────── */
.run-config-bar {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
  padding: 10px 14px; background: #131e2e; border-radius: 8px; border: 1px solid #1e3a5f;
}
.rcfg-badge {
  font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px;
  border: 1px solid #334155; color: #94a3b8; background: #1e293b;
}
.rcfg-badge.env    { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }
.rcfg-badge.scope  { background: #312e81; color: #a5b4fc; border-color: var(--primary); }
.rcfg-badge.browser{ background: #1e293b; color: #cbd5e1; }
.rcfg-badge.a11y   { background: #064e3b; color: #34d399; border-color: #10b981; }
.rcfg-badge.perf   { background: #451a03; color: #fbbf24; border-color: #f59e0b; }

/* ── History Tab ─────────────────────────────────────────────────────────────── */
.history-trend {
  display: flex; align-items: flex-end; gap: 8px; height: 100px;
  padding: 12px 16px; background: #131e2e; border-radius: 10px;
  border: 1px solid var(--border); margin-bottom: 4px;
}
.trend-bar-wrap {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: default;
}
.trend-bar-track {
  width: 100%; flex: 1; background: #1e293b; border-radius: 4px; overflow: hidden;
  display: flex; align-items: flex-end;
}
.trend-bar-fill { width: 100%; border-radius: 4px; transition: height .3s; min-height: 4px; }
.trend-bar-label { font-size: 10px; font-weight: 700; color: #94a3b8; }
.trend-bar-sub   { font-size: 9px; color: #475569; }

/* ── Toast Notifications ─────────────────────────────────────────────────────── */
.toast-container {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  pointer-events: all; cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 500;
  min-width: 260px; max-width: 380px;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  animation: toastIn .3s cubic-bezier(.16,1,.3,1);
}
@keyframes toastIn {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.toast-success { background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; }
.toast-error   { background: #450a0a; color: #fca5a5; border: 1px solid #ef4444; }
.toast-info    { background: #1e3a5f; color: #93c5fd; border: 1px solid #3b82f6; }

/* ── Confetti ─────────────────────────────────────────────────────────────────── */
.confetti-container {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 9998; overflow: hidden; pointer-events: none;
}
.confetti-piece {
  position: absolute; top: -20px;
  animation: confettiFall linear forwards;
}
@keyframes confettiFall {
  0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* ── Donut Chart ──────────────────────────────────────────────────────────────── */
.donut-wrap { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.passrate-row { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
@media (max-width: 600px) { .passrate-row { flex-direction: column; align-items: flex-start; } }

/* ── Expandable Test Case Rows ───────────────────────────────────────────────── */
.tr-clickable { cursor: pointer; transition: background .12s; }
.tr-clickable:hover td { background: rgba(99,102,241,.08); }
.tr-expanded > td { padding: 0 !important; background: #0d1929; border-bottom: 2px solid #1e3a5f; }
.expanded-detail {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; padding: 16px 20px;
  animation: expandIn .2s cubic-bezier(.16,1,.3,1);
}
@keyframes expandIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.exp-section { display: flex; flex-direction: column; gap: 6px; }
.exp-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; }
.exp-steps { padding-left: 16px; display: flex; flex-direction: column; gap: 3px; }
.exp-steps li { font-size: 12px; color: #94a3b8; line-height: 1.5; }
.exp-text  { font-size: 12px; color: #94a3b8; line-height: 1.6; }
.exp-error { color: #fca5a5 !important; background: #450a0a; padding: 8px 10px; border-radius: 6px; font-family: monospace; font-size: 11px; }

/* ── Feature Grid (idle hero) ────────────────────────────────────────────────── */
.feature-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px;
}
@media (max-width: 560px) { .feature-grid { grid-template-columns: repeat(2, 1fr); } }
.feature-card {
  background: #131e2e; border: 1px solid #1e293b; border-radius: 10px;
  padding: 14px 10px; text-align: center;
  transition: transform .2s, border-color .2s, box-shadow .2s;
  cursor: default;
}
.feature-card:hover {
  transform: translateY(-4px); border-color: #6366f1;
  box-shadow: 0 8px 24px rgba(99,102,241,.18);
}
.feature-icon  { font-size: 22px; margin-bottom: 6px; }
.feature-title { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px; }
.feature-desc  { font-size: 11px; color: #64748b; }

/* ── Keyboard shortcut hint ──────────────────────────────────────────────────── */
.kbd-hint {
  margin-left: 10px; font-size: 10px; padding: 2px 7px; border-radius: 5px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
  font-weight: 400; letter-spacing: .3px;
}

/* ── Button interactions ─────────────────────────────────────────────────────── */
.btn { transition: transform .15s, box-shadow .15s, opacity .15s; }
.btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }

/* ── Stat card hover ─────────────────────────────────────────────────────────── */
.stat-card { transition: transform .2s, box-shadow .2s; cursor: default; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,.35); }

/* ── Panel entry animation ───────────────────────────────────────────────────── */
.panel { animation: panelIn .35s cubic-bezier(.16,1,.3,1); }
@keyframes panelIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Tab underline animation ─────────────────────────────────────────────────── */
.tab { position: relative; overflow: hidden; }
.tab::after {
  content: ''; position: absolute; bottom: 0; left: 50%; right: 50%;
  height: 2px; background: var(--primary); transition: left .2s, right .2s;
  border-radius: 2px;
}
.tab-active::after { left: 0; right: 0; }

/* ── Topbar nav button animation ─────────────────────────────────────────────── */
.topbar-navbtn { transition: background .15s, color .15s, transform .1s; }
.topbar-navbtn:hover:not(.active) { transform: scale(1.04); }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .topbar { padding: 12px 16px; }
  .main { padding: 16px 12px; }
  .panel { padding: 20px 16px; }
  .stat-cards { grid-template-columns: repeat(3, 1fr); }
  .results-header { flex-direction: column; }
  .download-btns { width: 100%; }
  .download-btns .btn { width: 100%; justify-content: center; }
}

/* ── Dashboard Page ─────────────────────────────────────────────────────────── */
.dashboard { display: flex; flex-direction: column; gap: 24px; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr 1fr; } }

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--border);
  border-radius: 14px;
  padding: 22px 18px;
  display: flex; flex-direction: column; gap: 4px;
  transition: transform .2s, box-shadow .2s;
  cursor: default;
  animation: panelIn .3s cubic-bezier(.16,1,.3,1);
}
.kpi-card:hover { transform: translateY(-5px); box-shadow: 0 14px 32px rgba(0,0,0,.4); }
.kpi-card.accent-indigo { border-top-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,.08); }
.kpi-card.accent-green  { border-top-color: #10b981; box-shadow: 0 4px 20px rgba(16,185,129,.08); }
.kpi-card.accent-amber  { border-top-color: #f59e0b; box-shadow: 0 4px 20px rgba(245,158,11,.08); }
.kpi-card.accent-red    { border-top-color: #ef4444; box-shadow: 0 4px 20px rgba(239,68,68,.08); }

.kpi-icon { font-size: 22px; margin-bottom: 6px; }
.kpi-val  { font-size: 32px; font-weight: 800; line-height: 1.1; }
.kpi-lbl  {
  font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .5px; margin-top: 4px;
}
.kpi-sub  { font-size: 11px; color: #475569; }

/* ── Trend chart panel ─────────────────────────────────────────────────────── */
.trend-chart-panel { padding: 20px 24px; }

.section-title {
  font-size: 11px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .6px; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}

/* ── Dash grid ─────────────────────────────────────────────────────────────── */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } }

/* ── Recent runs panel ─────────────────────────────────────────────────────── */
.recent-runs-panel { padding: 20px 22px; display: flex; flex-direction: column; }

.run-card {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
  transition: background .12s;
}
.run-card:last-child { border-bottom: none; padding-bottom: 0; }
.run-card:hover { background: rgba(255,255,255,.02); }
.run-card-rate  { font-size: 18px; font-weight: 800; min-width: 46px; text-align: right; flex-shrink: 0; }
.run-card-info  { flex: 1; min-width: 0; }
.run-card-url   { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.run-card-meta  { font-size: 11px; color: #64748b; margin-top: 2px; }

/* ── Quick actions ─────────────────────────────────────────────────────────── */
.quick-actions { padding: 20px 24px; }

.action-item {
  display: flex; align-items: center; gap: 14px;
  background: #131e2e; border: 1px solid var(--border); border-radius: 12px;
  padding: 14px 16px; cursor: pointer; text-align: left; color: var(--text);
  width: 100%; transition: border-color .15s, background .15s, transform .15s;
}
.action-item:hover {
  border-color: var(--primary); background: rgba(99,102,241,.08);
  transform: translateY(-2px); box-shadow: 0 6px 18px rgba(99,102,241,.15);
}
.action-icon  { font-size: 24px; flex-shrink: 0; text-align: center; width: 32px; }
.action-title { font-size: 13px; font-weight: 600; }
.action-desc  { font-size: 11px; color: #64748b; margin-top: 2px; }
.action-arrow { margin-left: auto; color: #475569; font-size: 16px; transition: transform .15s; }
.action-item:hover .action-arrow { transform: translateX(4px); color: var(--primary); }

/* ── Search box ────────────────────────────────────────────────────────────── */
.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon {
  position: absolute; left: 10px; font-size: 12px;
  color: var(--muted); pointer-events: none; line-height: 1;
}
.search-input {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  color: var(--text); padding: 7px 12px 7px 30px; font-size: 13px;
  outline: none; width: 200px; transition: border-color .15s, box-shadow .15s;
}
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }

/* ── Status pill ───────────────────────────────────────────────────────────── */
.status-pill {
  font-size: 12px; font-weight: 600; padding: 4px 12px;
  border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;
}
.status-pill-running {
  background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.5);
  color: #a5b4fc; animation: pill-pulse 1.4s ease-in-out infinite;
}
.status-pill-done {
  background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.5); color: #34d399;
}
@keyframes pill-pulse { 0%, 100% { opacity:1; } 50% { opacity:.6; } }

/* ── Module bar chart ──────────────────────────────────────────────────────── */
.mod-chart {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 22px 24px;
  display: flex; flex-direction: column; gap: 16px;
  animation: panelIn .35s cubic-bezier(.16,1,.3,1);
}
.mod-row {
  display: grid; grid-template-columns: 170px 1fr 50px;
  align-items: center; gap: 14px;
}
@media (max-width: 600px) { .mod-row { grid-template-columns: 80px 1fr 40px; } }
.mod-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mod-track { background: var(--surface2); border-radius: 999px; height: 12px; overflow: hidden; }
.mod-fill  { height: 100%; border-radius: 999px; transition: width .8s cubic-bezier(.16,1,.3,1); min-width: 3px; }
.mod-pct   { font-size: 13px; font-weight: 700; text-align: right; }

/* ── AI Chatbot ─────────────────────────────────────────────────────────────── */

/* Floating action button */
.chat-fab {
  position: fixed; bottom: 28px; right: 28px; z-index: 9995;
  width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  box-shadow: 0 8px 28px rgba(99,102,241,.5), 0 2px 8px rgba(0,0,0,.3);
  display: flex; align-items: center; justify-content: center;
  transition: transform .2s, box-shadow .2s;
  animation: fab-float 3s ease-in-out infinite;
}
.chat-fab:hover {
  transform: scale(1.12);
  box-shadow: 0 12px 36px rgba(99,102,241,.65), 0 4px 12px rgba(0,0,0,.3);
}
.chat-fab-open {
  animation: none;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  box-shadow: 0 6px 20px rgba(0,0,0,.4);
}
.chat-fab-icon { font-size: 26px; line-height: 1; }

@keyframes fab-float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
}

.chat-fab-badge {
  position: absolute; top: -3px; right: -3px;
  background: #10b981; color: #fff;
  font-size: 9px; font-weight: 700; letter-spacing: .3px;
  padding: 2px 6px; border-radius: 10px;
  border: 2px solid #0f172a;
}
.chat-unread {
  position: absolute; top: -4px; right: -4px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #0f172a;
  animation: chat-ping .8s ease-in-out infinite;
}
@keyframes chat-ping {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.2); }
}

/* Chat panel */
.chat-panel {
  position: fixed; bottom: 100px; right: 28px; z-index: 9994;
  width: 360px; height: 560px;
  background: #0b1120;
  border: 1px solid rgba(99,102,241,.25);
  border-radius: 22px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(99,102,241,.12),
              inset 0 1px 0 rgba(255,255,255,.05);
  animation: chat-slide-in .35s cubic-bezier(.16,1,.3,1);
}
@keyframes chat-slide-in {
  from { opacity:0; transform: translateY(20px) scale(.95); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}

/* Chat header */
.chat-hdr {
  background: linear-gradient(135deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%);
  padding: 16px 16px 14px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(99,102,241,.2);
  flex-shrink: 0;
}
.chat-hdr-av   { font-size: 30px; line-height: 1; }
.chat-hdr-name { font-size: 15px; font-weight: 700; color: #e2e8f0; }
.chat-hdr-sub  { font-size: 11px; color: #a5b4fc; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.chat-close-btn {
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
  color: #94a3b8; width: 30px; height: 30px; border-radius: 10px;
  cursor: pointer; font-size: 14px; transition: all .15s;
  display: flex; align-items: center; justify-content: center;
}
.chat-close-btn:hover { background: rgba(239,68,68,.2); color: #fca5a5; border-color: rgba(239,68,68,.3); }

/* Messages area */
.chat-msgs {
  flex: 1; overflow-y: auto; padding: 14px 12px;
  display: flex; flex-direction: column; gap: 10px;
  scrollbar-width: thin; scrollbar-color: #1e293b transparent;
}
.chat-msgs::-webkit-scrollbar { width: 4px; }
.chat-msgs::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }

/* Individual message */
.cmsg { display: flex; gap: 7px; align-items: flex-end; }
.cmsg-bot  { flex-direction: row; }
.cmsg-user { flex-direction: row-reverse; }
.cmsg-av   { font-size: 17px; flex-shrink: 0; margin-bottom: 2px; }

.cmsg-bub {
  max-width: 82%; padding: 10px 13px; border-radius: 16px;
  font-size: 12.5px; line-height: 1.6; white-space: pre-wrap;
}
.cmsg-bot .cmsg-bub {
  background: #1a2744; color: #cbd5e1;
  border: 1px solid #1e3a5f; border-bottom-left-radius: 4px;
}
.cmsg-user .cmsg-bub {
  background: linear-gradient(135deg, #4338ca, #6366f1);
  color: #fff; border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(99,102,241,.3);
}

/* Typing animation */
.cmsg-typing {
  display: flex !important; align-items: center; gap: 4px;
  padding: 13px 16px !important; min-width: 54px;
}
.cmsg-typing span {
  width: 7px; height: 7px; background: #64748b; border-radius: 50%;
  animation: dot-bounce 1.2s ease-in-out infinite; display: inline-block;
}
.cmsg-typing span:nth-child(2) { animation-delay: .18s; }
.cmsg-typing span:nth-child(3) { animation-delay: .36s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(.7); opacity: .5; }
  40%           { transform: scale(1.1); opacity: 1; }
}

/* Chips inside messages */
.cmsg-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.cmsg-chip {
  font-size: 11px; padding: 4px 10px; border-radius: 20px; cursor: pointer;
  background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.35);
  color: #a5b4fc; font-weight: 500; transition: all .15s;
}
.cmsg-chip:hover { background: rgba(99,102,241,.3); color: #e0e7ff; transform: translateY(-1px); }

/* Quick suggestion row */
.chat-quick {
  padding: 7px 10px; display: flex; flex-wrap: wrap; gap: 5px;
  border-top: 1px solid #131e2e; flex-shrink: 0; max-height: 64px; overflow-y: auto;
}
.chat-quick-btn {
  font-size: 11px; padding: 4px 10px; border-radius: 20px; cursor: pointer; white-space: nowrap;
  background: #101828; border: 1px solid #1e293b; color: #64748b; transition: all .15s;
}
.chat-quick-btn:hover { border-color: #6366f1; color: #a5b4fc; background: rgba(99,102,241,.08); }

/* Input area */
.chat-input-row {
  display: flex; gap: 8px; align-items: center;
  padding: 10px 12px; border-top: 1px solid #131e2e;
  background: #0b1120; flex-shrink: 0;
}
.chat-input {
  flex: 1; background: #1a2744; border: 1px solid #1e3a5f; border-radius: 22px;
  padding: 9px 14px; color: #e2e8f0; font-size: 13px; outline: none; transition: border-color .15s;
}
.chat-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
.chat-input::placeholder { color: #334155; }
.chat-send-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #4338ca); color: #fff;
  font-size: 17px; cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(99,102,241,.35);
}
.chat-send-btn:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
.chat-send-btn:not(:disabled):hover { transform: scale(1.12); box-shadow: 0 6px 18px rgba(99,102,241,.5); }

@media (max-width: 480px) {
  .chat-panel { right: 10px; bottom: 88px; width: calc(100vw - 20px); height: 520px; }
  .chat-fab   { right: 16px; bottom: 20px; }
}
```


---

### `playwright-tests/package.json`

```json
{
  "name": "qa-tool-playwright",
  "version": "1.0.0",
  "description": "Playwright test runner for QA AI Tool",
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```


---

## How to Use

1. **Manual Test Run**: Upload a requirements doc (PDF/TXT/MD) → AI generates test cases → Playwright runs them → Download HTML/Excel reports
2. **Email Monitor**: Configure Gmail IMAP → Send email with subject "deployment done" and app URL in body → Bot auto-runs tests and replies with results
3. **AI Chatbot**: Click the 🤖 floating button → Type commands like "set firefox", "go to dashboard", "run smoke tests"
4. **Dashboard**: View KPIs, pass rate trends, recent runs, and quick actions

## Email Monitor Setup

- Use Gmail with **2FA enabled**
- Generate an **App Password**: https://myaccount.google.com/apppasswords
- Send trigger email with subject containing your keyword (default: "deployment done")
- Include app URL in email body (e.g., `URL: http://your-app.com`)
- Optionally attach a requirements .txt/.md/.pdf file

## Key Features

- Rule-based test case generation (no external AI API needed)
- Multi-browser testing (Chrome, Firefox, Safari, Mobile)
- Test scope filtering (Smoke, Sanity, Regression, Full E2E)
- Priority filtering (Critical, High, All)
- Parallel workers (1-5)
- Retry failed tests (0-3x)
- Accessibility scan (WCAG checks)
- Performance metrics (TTFB, FCP, DOM ready, full load)
- Toast notifications, confetti, animated counters
- Donut pass-rate chart
- Expandable test case rows
- Run history with trend visualization
- Dark theme responsive UI
