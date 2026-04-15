# QA AI Testing Tool — Complete User Manual

**Version:** 2.0 | **Date:** March 2026 | **Author:** QA Engineering Team

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Getting Started](#3-getting-started)
4. [Dashboard](#4-dashboard)
5. [Manual Test Run](#5-manual-test-run)
6. [AI Agent Configuration](#6-ai-agent-configuration)
7. [Advanced Test Configuration](#7-advanced-test-configuration)
8. [Test Execution & Live Logs](#8-test-execution--live-logs)
9. [Test Results & Reports](#9-test-results--reports)
10. [AI Analysis Tab](#10-ai-analysis-tab)
11. [Email Monitor (Auto-Trigger)](#11-email-monitor-auto-trigger)
12. [AI Chatbot Assistant](#12-ai-chatbot-assistant)
13. [Run History & Trends](#13-run-history--trends)
14. [Download Reports](#14-download-reports)
15. [Two Operating Modes](#15-two-operating-modes)
16. [5 AI Agent Team](#16-five-ai-agent-team)
17. [Supported Domains](#17-supported-domains)
18. [FAQ & Troubleshooting](#18-faq--troubleshooting)

---

## 1. Product Overview

### What Is QA AI Testing Tool?

QA AI Testing Tool is an **end-to-end automated testing platform** that reads your requirements document, generates test cases, executes them in real browsers using Playwright, and produces professional reports — all without writing a single line of test code.

### Key Value Proposition

| For | Benefit |
|-----|---------|
| **QA Teams** | Generate 25+ domain-specific test cases in seconds instead of days |
| **Developers** | Get JIRA-ready bug reports with steps to reproduce and suggested fixes |
| **QA Managers** | Deployment readiness sign-off from AI QA Director with 20 years of experience |
| **Executives** | GREEN/AMBER/RED status reports with executive summaries |
| **DevOps** | Email-triggered automated testing — send an email, get test results back |

### Core Capabilities

- Upload requirements document (PDF, TXT, MD) and auto-generate test cases
- Execute tests in real browsers (Chrome, Firefox, Safari, Mobile)
- 5 AI Agents with combined 65 years of QA experience
- Email-triggered automated test runs
- Multi-browser parallel testing
- Accessibility (WCAG) and Performance metrics
- HTML, Excel (.xlsx), and JSON report downloads
- AI-powered chatbot assistant
- Interactive dashboard with KPIs and trends

---

## 2. Architecture & Technology Stack

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18 + Vite)                │
│                    http://localhost:3001                      │
│  Dashboard | Manual Test | Email Monitor | AI Chatbot        │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                    BACKEND (Node.js + Express)                │
│                    http://localhost:5000                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              5 AI AGENTS (Claude API)                │    │
│  │  📋 Requirement Analyst  │  🧠 Test Architect       │    │
│  │  ⚡ Execution Engineer   │  📊 Report Analyst       │    │
│  │  👔 QA Director (Supervisor)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SYSTEM SERVICES                         │    │
│  │  Document Parser    │  Test Generator (rule-based)   │    │
│  │  Playwright Runner  │  Report Generator (HTML)       │    │
│  │  Excel Generator    │  Email Monitor (IMAP)          │    │
│  │  Email Sender       │  History Store                 │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              PLAYWRIGHT TEST RUNNER                           │
│  Chromium | Firefox | WebKit | Mobile Chrome | Mobile Safari │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 4, CSS3 (dark theme) |
| Backend | Node.js, Express 4 |
| AI Engine | Anthropic Claude API (Sonnet 4) |
| Browser Testing | Playwright v1.55 |
| Document Parsing | pdf-parse (PDF), fs (TXT/MD) |
| Reports | Custom HTML generator, ExcelJS |
| Email | imap-simple (IMAP), nodemailer (SMTP) |
| Data | JSON file-based storage |

---

## 3. Getting Started

### Prerequisites

- Node.js v18+ installed
- Internet connection (for AI agents and Playwright browser download)
- Gmail account with App Password (for email monitor — optional)
- Anthropic API key (for AI agents — optional)

### Installation

```bash
# 1. Navigate to project
cd qa-tool

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Install Playwright browsers
cd ../playwright-tests
npm install
npx playwright install

# 5. Start backend (Terminal 1)
cd ../backend
node server.js          # Runs on port 5000

# 6. Start frontend (Terminal 2)
cd ../frontend
npm run dev             # Runs on port 3001
```

### Access the Application

Open browser: **http://localhost:3001**

---

## 4. Dashboard

### Overview

The Dashboard provides a bird's-eye view of your testing activity.

### KPI Cards

| KPI | Description |
|-----|-------------|
| **Total Runs** | Number of test executions completed |
| **Tests Executed** | Total individual test cases run across all executions |
| **Avg Pass Rate** | Average pass rate across all runs |
| **Last Run** | Date and pass rate of the most recent execution |

### Pass Rate Trend Chart

- SVG line chart showing pass rate over the last 10 runs
- Color-coded dots: Green (80%+), Yellow (50-79%), Red (<50%)
- Gradient area fill for visual clarity

### Recent Runs

- Shows last 6 runs with URL, date, test count, environment, and pass rate
- Each run shows a mini progress bar

### Quick Actions

- **Manual Test Run** — Jump directly to test configuration
- **Email Monitor** — Configure auto-triggered testing

---

## 5. Manual Test Run

### Step 1: Enter Application URL

- Enter the URL of the application to test
- Supports:
  - `http://` and `https://` URLs
  - Local file paths: `C:/Users/.../index.html` (auto-converted to `file:///`)
  - Unix paths: `/home/user/.../index.html`

### Step 2: Upload Requirements Document

- Drag & drop or click to browse
- Supported formats: **PDF**, **TXT**, **MD** (Markdown)
- Maximum file size: 10 MB
- The document should describe what the application does — features, modules, user flows

### Step 3: Configure (Optional)

See [Section 7: Advanced Test Configuration](#7-advanced-test-configuration)

### Step 4: Execute

- Click **"Execute Testing"** button
- Keyboard shortcut: **Ctrl + Enter**
- The pipeline starts immediately with live log updates

---

## 6. AI Agent Configuration

### Where to Find

On the **Manual Test** page, above the Advanced Configuration section, you'll see the **AI Config Bar**:

- **Gray dot + "Rule-Based Mode"** — No API key configured
- **Green dot + "AI Agents Active"** — API key is set, 5 agents ready

### How to Activate

1. Get an Anthropic API key from https://console.anthropic.com
2. Paste the key (starts with `sk-ant-...`) in the input field
3. Click **"Activate AI"**
4. Green dot appears — agents are ready

### How to Deactivate

- Click **"Clear Key"** next to the key preview
- System falls back to rule-based mode immediately

### Cost Estimate

| Run Type | Estimated Cost |
|----------|---------------|
| Simple app (5-10 tests) | ~$0.05-0.10 |
| Medium app (15-25 tests) | ~$0.15-0.30 |
| Complex app (30+ tests) | ~$0.30-0.50 |

---

## 7. Advanced Test Configuration

Click **"Advanced Configuration"** to expand. Shows current config as badges (e.g., "1B · regression · QA").

### Environment

| Option | Use Case |
|--------|----------|
| **Dev** | Testing against development server |
| **QA** | Standard QA environment (default) |
| **Staging** | Pre-production validation |
| **Prod** | Production smoke tests (use with caution) |

### Test Scope

| Scope | Tests Generated | Speed |
|-------|----------------|-------|
| **Smoke** | 1 critical test per module | Fastest |
| **Sanity** | 2 tests per module (positive + negative) | Fast |
| **Regression** | All generated tests (default) | Standard |
| **Full E2E** | All tests + extra edge cases | Slowest |

### Browsers

Select one or more. Multi-browser runs execute every test in every selected browser:

| Browser | Engine |
|---------|--------|
| Chrome | Chromium |
| Firefox | Gecko |
| Safari | WebKit |
| Mobile Chrome | Chromium (Pixel 5 viewport) |
| Mobile Safari | WebKit (iPhone 12 viewport) |

### Priority Filter

| Filter | Tests Included |
|--------|---------------|
| **All Priorities** | Critical + High + Medium + Low |
| **Critical + High** | Only Critical and High priority tests |
| **Critical Only** | Only Critical priority tests |

### Screenshots

| Option | Behavior |
|--------|----------|
| **On Failure** | Captures screenshot only when a test fails (default) |
| **Always** | Screenshot after every test |
| **Never** | No screenshots |

### Workers

- Slider from 1 to 5
- Controls how many tests run **in parallel**
- Higher = faster but more CPU/memory usage
- Default: 3

### Retries

- 0 to 3 retries for failed tests
- Helps with flaky tests
- Default: 0 (no retry)

### Extra Checks

| Check | What It Does |
|-------|-------------|
| **Accessibility Scan** | Checks page title, alt text on images, labels on inputs, lang attribute, button text |
| **Performance Metrics** | Measures TTFB, FCP, DOM Ready, Full Load time |

---

## 8. Test Execution & Live Logs

### Pipeline Progress

When you click Execute, you see:

1. **Progress Steps** — 6 steps (rule-based) or 10 steps (AI agents)
2. **Progress Bar** — Overall percentage completion
3. **Live Execution Log** — Real-time log entries with timestamps

### Pipeline Steps (AI Mode — 10 Steps)

| Step | Actor | Description |
|------|-------|-------------|
| 1 | SYSTEM | Parse requirement document |
| 2 | AGENT | Requirement Analyst analyzes document, detects domain |
| 3 | AGENT | Test Architect generates domain-specific test cases |
| 4 | AGENT | QA Director reviews test plan, identifies gaps |
| 5 | SYSTEM + AGENT | Generate Playwright scripts (template + AI enhancement) |
| 6 | SYSTEM | Execute Playwright in real browser(s) |
| 7 | SYSTEM | Merge execution results into test cases |
| 8 | AGENT | QA Director reviews results, assesses deployment readiness |
| 9 | AGENT | Report Analyst writes executive report + bug reports |
| 10 | SYSTEM | Generate HTML + Excel reports |

### Pipeline Steps (Rule-Based Mode — 6 Steps)

| Step | Description |
|------|-------------|
| 1 | Parse requirement document |
| 2 | Generate test cases (keyword matching) |
| 3 | Convert to Playwright scripts |
| 4 | Execute Playwright tests |
| 5 | Update test cases with results |
| 6 | Generate HTML + Excel reports |

---

## 9. Test Results & Reports

### Results Header

- Completion badge with execution time
- Download buttons: HTML Report, Excel (.xlsx), JSON

### Stat Cards (Animated)

| Card | Description |
|------|-------------|
| Total | Number of test cases generated |
| Passed | Tests that passed (green) |
| Failed | Tests that failed (red) |
| Skipped | Tests not executed (gray) |
| Pass Rate | Percentage with color coding |

### Donut Chart

- Visual pass rate ring chart
- Green (80%+), Yellow (50-79%), Red (<50%)

### Run Config Badges

Shows environment, scope, browsers, workers, retries, A11Y, PERF settings used for this run.

### Tabs

| Tab | Content |
|-----|---------|
| **Module Summary** | Horizontal bar chart per module with pass/fail counts |
| **Test Cases** | Full table with filters, search, expandable rows |
| **Execution Log** | Raw pipeline log output |
| **History** | Past runs with trend chart |
| **AI Analysis** | Agent outputs (only visible with AI enabled) |

### Test Cases Table

- Filterable by status (Pass/Fail/Skipped) and module
- Searchable by test title, ID, or module name
- Click any row to expand and see:
  - Test steps
  - Expected result
  - Actual result
  - Error message (if failed)

---

## 10. AI Analysis Tab

**Visible only when AI agents are active.**

### Section 1: Requirement Analysis (📋 Requirement Analyst)

| Field | Description |
|-------|-------------|
| Domain | Detected application domain (Banking, Insurance, etc.) with confidence % |
| Modules | Detected modules with complexity and risk level |
| Ambiguities | Questions and assumptions about unclear requirements |
| Test Strategy | Recommended scope, estimated test count, critical path |

### Section 2: Test Plan Review (👔 QA Director)

| Field | Description |
|-------|-------------|
| Verdict | Approved / Approved with Concerns / Needs Revision |
| Coverage Score | 0-100% coverage assessment |
| Strengths | What the test plan does well |
| Gaps | Missing test scenarios with severity |
| Risk Flags | Potential risks with mitigation suggestions |
| Domain Insights | Industry-specific advice |

### Section 3: Results Review (👔 QA Director)

| Field | Description |
|-------|-------------|
| Overall Risk | Low / Medium / High / Critical |
| Sign-Off | YES (deploy) or NO (fix first) |
| Failure Analysis | Root cause for each failed test — bug vs infrastructure vs environment |
| Recommendations | Prioritized actions: Immediate / Next Sprint / Backlog |
| Risk Assessment | Blockers, concerns, and passed areas |
| Quality Metrics | Test effectiveness, coverage adequacy, defect density |

### Section 4: Executive Report (📊 Report Analyst)

| Field | Description |
|-------|-------------|
| Status | GREEN / AMBER / RED |
| Headline | One-line summary for email subject |
| Executive Summary | 3-5 sentence narrative for VP/CTO |
| Key Findings | Top 3 findings |
| Bug Reports | JIRA-ready with ID, title, severity, priority, steps, expected, actual, suggested fix |
| Next Steps | Actionable items with owner and timeline |
| Sign-Off Statement | Formal sign-off or reason for withholding |

---

## 11. Email Monitor (Auto-Trigger)

### Overview

The Email Monitor watches a Gmail inbox for deployment notification emails. When it finds one with the trigger keyword, it automatically runs the full test pipeline and replies with results.

### Setup

1. Go to **Email Monitor** page
2. Enter Gmail address
3. Enter Gmail **App Password** (NOT your Google password)
   - Requires 2-Step Verification enabled
   - Generate at: https://myaccount.google.com/apppasswords
4. Set IMAP Host (default: imap.gmail.com)
5. Set SMTP Host (default: smtp.gmail.com)
6. Set trigger keyword (default: "deployment done")
7. Set poll interval in seconds (default: 120)
8. Click **Start Monitoring**

### Trigger Email Format

```
To: yourname@gmail.com
Subject: deployment done - v2.0 release
Body:
   Hi QA Bot,
   Deployment is complete.
   URL: http://your-app.com
   Please run the tests.
Attachment: requirements.txt (optional)
```

### Automated Flow

1. Someone sends email with trigger keyword in subject
2. Bot extracts App URL from email body
3. Uses attached requirement doc (or default keywords)
4. Runs full Playwright test suite
5. Generates HTML report + Excel file
6. Replies to sender with results + attachments

### Live Monitor Log

- Real-time log of IMAP activity
- Shows connection status, emails found, trigger matches
- Displays current test pipeline status

### Test Email

Click **"Test Email"** to verify SMTP configuration is working.

---

## 12. AI Chatbot Assistant

### How to Access

Click the **floating robot button** (🤖) in the bottom-right corner.

### What It Can Do

| Command | Action |
|---------|--------|
| "go to dashboard" | Navigates to Dashboard page |
| "set firefox browser" | Selects Firefox, opens Advanced Config |
| "set all browsers" | Selects Chrome + Firefox + Safari |
| "set smoke tests" | Sets test scope to Smoke |
| "run full e2e" | Sets scope to Full E2E |
| "set staging environment" | Sets environment tag |
| "enable accessibility" | Turns on A11Y scan |
| "enable performance" | Turns on performance metrics |
| "set 5 workers" | Sets parallel workers |
| "show status" | Reports current test status |
| "show results" | Shows pass/fail stats |
| "show history" | Opens History tab |
| "view test cases" | Opens Test Cases tab |
| Paste a URL | Auto-sets the app URL field |
| "reset" | Clears all results |
| "what can you do?" | Lists all commands |
| "help" | Shows command reference |

### Features

- Typing indicator animation
- Quick suggestion chips
- Action buttons inside bot messages
- Unread message counter when chat is closed
- Mobile responsive

---

## 13. Run History & Trends

### History Tab (in Results)

- **Bar Chart Trend** — Pass rate bars for last 10 runs
- **Comparison Table** — Date, URL, environment, scope, browsers, total/pass/fail, pass rate, duration

### Dashboard Trend Chart

- **SVG Line Chart** — Pass rate trend with data points
- Gradient fill area under the line
- Color-coded points by pass rate

---

## 14. Download Reports

### Available Formats

| Format | Content | Use Case |
|--------|---------|----------|
| **HTML Report** | Full styled report with charts, tables, module summary | Email to stakeholders, print to PDF |
| **Excel (.xlsx)** | 3 worksheets: Summary, Test Cases, By Module | Data analysis, JIRA import |
| **JSON** | Raw test case data with results | CI/CD integration, API consumption |

---

## 15. Two Operating Modes

### Mode 1: Rule-Based (Free, No API Key)

- 10 hardcoded test modules
- Keyword matching from requirements
- 25 pre-defined test case templates
- Template Playwright scripts
- Pass/fail table report
- Works offline

### Mode 2: AI-Powered (Requires Anthropic API Key)

- 5 AI agents with 65 years combined experience
- Domain-specific test generation
- Requirement analysis with ambiguity detection
- Test plan review with gap analysis
- Smart Playwright selectors
- Root cause analysis for failures
- JIRA-ready bug reports
- Executive summaries and deployment sign-off
- Cost: ~$0.10-0.50 per run

---

## 16. Five AI Agent Team

### Agent 1: Requirement Analyst (12 Years)

| Field | Detail |
|-------|--------|
| **Role** | Analyzes uploaded requirements document |
| **Experience** | Banking (4 yrs), Insurance (3 yrs), Investment Banking (3 yrs), Telecom (2 yrs) |
| **Outputs** | Domain detection, testable requirements, ambiguities, risk areas, compliance notes, test strategy |
| **When Active** | Step 2 of 10 — after document parsing |

### Agent 2: Test Architect (15 Years)

| Field | Detail |
|-------|--------|
| **Role** | Generates comprehensive test cases from requirements |
| **Experience** | Banking (3 yrs), Insurance (3 yrs), Investment Banking (4 yrs), Telecom (2 yrs), E-commerce (3 yrs) |
| **Outputs** | Structured test cases with domain-specific edge cases, proper priority, Positive/Negative/Edge coverage |
| **When Active** | Step 3 of 10 — after requirement analysis |

### Agent 3: QA Director (20 Years) — Supervisor

| Field | Detail |
|-------|--------|
| **Role** | Reviews test plan before execution AND results after execution |
| **Experience** | Goldman Sachs, JP Morgan (6 yrs), HDFC, ICICI (5 yrs), Bajaj Allianz (4 yrs), Vodafone (3 yrs), Amazon (2 yrs) |
| **Outputs** | Coverage assessment, risk flags, deployment readiness sign-off, recommendations |
| **When Active** | Step 4 of 10 (pre-execution review) + Step 8 of 10 (post-execution review) |

### Agent 4: Execution Engineer (10 Years)

| Field | Detail |
|-------|--------|
| **Role** | Enhances Playwright test scripts with smart selectors |
| **Experience** | Playwright, Selenium, Cypress specialist across banking and insurance platforms |
| **Outputs** | Resilient test scripts with getByRole, getByLabel, fallback selector chains |
| **When Active** | Step 5 of 10 — after Director approves test plan |

### Agent 5: Report Analyst (8 Years)

| Field | Detail |
|-------|--------|
| **Role** | Writes executive-quality reports and JIRA-ready bug descriptions |
| **Experience** | Report writing for CTO/VP stakeholders, JIRA/Azure DevOps bug management |
| **Outputs** | Executive summary (GREEN/AMBER/RED), bug reports with severity/steps/fix, next steps with owners |
| **When Active** | Step 9 of 10 — after Director reviews results |

---

## 17. Supported Domains

The AI agents have deep knowledge across these domains:

### Banking
- Core banking (Finacle, T24, Temenos)
- Payments (SWIFT MT/MX, NEFT, RTGS, UPI, SEPA)
- KYC/AML compliance
- Loan origination & servicing
- Card management
- Internet & mobile banking
- Transaction limits and reconciliation

### Insurance
- Policy lifecycle (issuance, endorsement, renewal, cancellation)
- Claims lifecycle (FNOL, assessment, approval, payment)
- Underwriting rules engine
- Premium calculations and actuarial logic
- Grace period and lapse/revival
- Regulatory compliance (IRDA, Solvency II)
- Reinsurance treaty application

### Investment Banking
- Trade order management
- FIX protocol (4.2/4.4) message validation
- Settlement cycles (T+1, T+2) across time zones
- P&L reconciliation
- Regulatory reporting (MiFID II, Dodd-Frank)
- Market data feeds and Bloomberg/Reuters integration
- Multi-currency conversions

### Telecom
- Billing & rating engines (prepaid/postpaid)
- CRM integration (Siebel/Amdocs)
- Number portability (MNP)
- Provisioning workflows
- CDR validation
- Roaming and usage rating

### E-commerce / Generic Web
- Cart and checkout flows
- Payment gateway integration
- User registration and authentication
- Search and filter functionality
- Session management
- Form validation

---

## 18. FAQ & Troubleshooting

### Q: Do I need an API key to use the tool?
**No.** The tool works in rule-based mode without any API key. AI agents are an optional upgrade.

### Q: How much does the AI cost per test run?
**$0.05-$0.50** depending on the number of test cases and document size.

### Q: Can I use this for production testing?
**Yes.** Set environment to "Prod" and use Smoke scope for quick production validation.

### Q: What if the AI agent fails mid-pipeline?
Each agent has automatic fallback. If any agent fails, the pipeline continues with the non-AI alternative.

### Q: Can I run tests on a local HTML file?
**Yes.** Enter the file path (e.g., `C:/Users/.../index.html`) and it auto-converts to a file:// URL.

### Q: How do I set up the email monitor with Gmail?
Enable 2-Step Verification → Generate App Password at myaccount.google.com/apppasswords → Use that password in the Email Monitor config.

### Q: What browsers are supported?
Chromium (Chrome), Firefox (Gecko), WebKit (Safari), Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12).

### Q: Can I run tests in multiple browsers simultaneously?
**Yes.** Select multiple browsers in Advanced Config. Each test runs in every selected browser.

### Q: Where are reports stored?
In `qa-tool/backend/reports/{jobId}/` — HTML report, Excel file, and JSON test cases.

### Q: How do I integrate with CI/CD?
POST to `/api/execute` with form data containing `appUrl` and `requirementFile`. Poll `/api/status/{jobId}` for results.

---

*QA AI Testing Tool — Built with React, Node.js, Playwright, and Claude AI*
*© 2026 QA Engineering Team*
