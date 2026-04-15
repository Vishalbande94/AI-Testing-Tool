# 🧪 AI Testing Tool

A complete AI-powered QA platform that handles **every stage of software testing** — from requirement analysis to test generation, execution, and reporting. Covers 12+ testing disciplines, works with any application, generates ready-to-run test suites you can download and execute.

> **Built to let any QA team ship faster with fewer bugs.** Upload a requirement doc, screenshots, or a test-case sheet — get a complete testing project.

---

## ✨ What's inside

### Testing disciplines covered
| Discipline | Tools available |
|-----------|-----------------|
| ⚡ **Manual / Functional** | Playwright (JS/TS), 17 built-in modules |
| 🔍 **Exploratory** | Claude Vision analyzes screenshots/video |
| 🔌 **API Testing** | Postman, REST Assured, Playwright API, k6, Supertest |
| 🛡️ **Security** | OWASP ZAP, Nuclei, Playwright, OWASP Top 10 checklist |
| ⚡ **Performance** | k6, JMeter, Artillery, Gatling (5 scenarios) |
| ♿ **Accessibility** | axe-core + Playwright, axe-cli, Lighthouse CI, Pa11y |
| 👁️ **Visual Regression** | Playwright, BackstopJS, Percy |
| 📱 **Mobile** | Appium+WDIO, Appium+Java, Detox, Maestro (iOS/Android) |
| 🗃️ **Database / ETL** | SQL assertions (pg/mysql/mssql/sqlite), dbt, Great Expectations |
| 🚀 **CI/CD Pipelines** | GitHub Actions, GitLab CI, Jenkins, Azure DevOps, CircleCI |
| 🛠️ **Script Generator** | Playwright/Selenium/Cypress project scaffolds |
| 📧 **Email Monitor** | Trigger test runs from inbox subject keywords |

### Platform features
- 🔐 **JWT authentication** with bcrypt + AES-256-GCM encrypted per-user secrets
- 🤖 **5 specialized AI agents** (Requirement Analyst, Test Architect, Execution Engineer, QA Director, Report Analyst)
- 🔔 **Slack/Teams/webhook** notifications on test completion
- 🔗 **JIRA integration** — auto-logs bugs from test failures
- 📊 **Dashboard** with run history, pass-rate KPIs, trend data
- 📑 **Multiple input modes** — requirement doc (PDF/TXT/MD), test case sheet (CSV/XLSX), or generic mode
- 🎨 **Dark/Light mode**, responsive UI, keyboard shortcuts
- 🔒 **Production-ready security**: Helmet headers, rate limiting, CORS whitelist, input validation
- ✅ **122 end-to-end tests** covering every endpoint

---

## 🚀 Quick Start (any machine)

### Prerequisites
- **Node.js 18+** — https://nodejs.org
- **Git** — https://git-scm.com
- *(optional)* **Claude API key** for AI-powered features — https://console.anthropic.com

### 1. Clone
```bash
git clone https://github.com/Vishalbande94/AI-Testing-Tool.git
cd AI-Testing-Tool
```

### 2. Install + start backend
```bash
cd qa-tool/backend
npm install
cp .env.example .env            # then edit .env and set JWT_SECRET + APP_SECRET
npm start                       # runs on http://localhost:5000
```

### 3. Install + start frontend (new terminal)
```bash
cd qa-tool/frontend
npm install
npm run dev                     # runs on http://localhost:3001
```

### 4. Open the app
Go to **http://localhost:3001** → sign up → first user automatically becomes admin.

---

## ⚡ One-click setup

### Windows
Double-click `setup.bat` in the repo root.

### macOS / Linux
```bash
bash setup.sh
```

Both scripts install all dependencies, generate a `.env` with secure random secrets, and start the app.

---

## 📁 Project structure

```
AI-Testing-Tool/
├── qa-tool/                        ← Main application
│   ├── backend/                    ← Node.js + Express API
│   │   ├── server.js               ← Entry point
│   │   ├── middleware/             ← Auth middleware
│   │   ├── routes/                 ← 10+ route files (auth, test, notifications, ...)
│   │   ├── services/
│   │   │   ├── agents/             ← 5 AI agents (Claude-based)
│   │   │   ├── *Generator.js       ← 10+ test-suite generators
│   │   │   ├── authService.js      ← JWT signing
│   │   │   ├── userStore.js        ← Per-user data + encrypted secrets
│   │   │   └── notificationService.js
│   │   ├── tests/e2e.test.js       ← 122 end-to-end tests
│   │   └── .env.example            ← Copy to .env
│   ├── frontend/                   ← React + Vite
│   │   ├── src/App.jsx             ← Main UI (all tabs)
│   │   └── src/App.css             ← Styles
│   ├── docs/                       ← User manual + presentations
│   └── README.md                   ← Tool-specific detailed docs
├── insurance-app/                  ← Demo app for testing against
├── docs/                           ← QA reports, sample test-case sheets
│   └── test-cases/                 ← Example CSVs ready to import
├── tests/                          ← Original Playwright practice tests
├── setup.bat                       ← Windows one-click setup
├── setup.sh                        ← macOS/Linux one-click setup
└── README.md                       ← This file
```

---

## 🔑 Configuration

### Required environment variables (in `qa-tool/backend/.env`)

```bash
# Generate with: openssl rand -hex 32
JWT_SECRET=your-long-random-string-at-least-32-chars
APP_SECRET=your-other-long-random-string-at-least-32-chars
```

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | Backend port |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime |
| `ALLOWED_ORIGINS` | *(any)* | Comma-sep allowed CORS origins for production |
| `RATE_LIMIT_MAX` | `2000` | API requests per 15-min window per IP |
| `NODE_ENV` | `development` | Set to `production` to hide stack traces |

**AI features (optional)**: configure your Claude API key **per-user** in the app UI (not via env). Each user stores their own key, encrypted at rest.

---

## ✅ Running the tests

The tool comes with **122 end-to-end tests** covering every endpoint:

```bash
cd qa-tool/backend
npm test                # runs all 122 tests
npm run test:verbose    # detailed per-test output
```

Expected output:
```
ℹ tests 122
ℹ pass 122
ℹ fail 0
ℹ duration_ms ~15000
```

---

## 🎯 Usage walkthrough

### Manual Test Execution
1. Top nav → **⚡ Manual Test**
2. Enter target app URL
3. Pick input mode:
   - **📄 Requirement Document** — upload PDF/TXT/MD → AI generates tests
   - **📋 Test Case Sheet** — upload CSV/XLSX → import tests directly (download template from the same page)
   - **🧪 Generic Mode** — no file needed, runs all 17 built-in modules
4. Configure browsers, priorities, environment
5. Click **🚀 Execute** — watch live logs → download HTML/Excel report

### Advanced testing tabs
- **🔌 API** — Generate Postman/k6/REST-Assured/Playwright-API/Supertest project
- **🛡️ Security** — Generate ZAP/Nuclei/Playwright-security/OWASP-checklist project
- **⚡ Performance** — Generate k6/JMeter/Artillery/Gatling project with scenario selection
- **♿ A11y** — Generate axe-core/Lighthouse/Pa11y suite with WCAG standard selection
- **👁️ Visual** — Generate Playwright screenshot diff / BackstopJS / Percy project
- **📱 Mobile** — Generate Appium / Detox / Maestro project for iOS or Android
- **🗃️ Data** — Generate SQL assertion / dbt / Great Expectations suite
- **🚀 CI/CD** — Generate GH Actions / GitLab / Jenkins / Azure / CircleCI pipeline

Each generates a downloadable ZIP with a ready-to-run project and detailed README.

---

## 🏗️ Tech stack

**Frontend**: React 18 · Vite 4 · Pure CSS (no Tailwind)
**Backend**: Node 18+ · Express 4 · Multer · Helmet · Compression · express-rate-limit
**Auth**: bcryptjs · jsonwebtoken · AES-256-GCM
**AI**: Anthropic SDK (Claude Sonnet 4)
**Testing runtime**: Playwright 1.55 · ffmpeg-static
**Storage**: JSON-file based (swappable to SQLite/Postgres)

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

Please run `cd qa-tool/backend && npm test` before submitting — all 122 tests must pass.

---

## 📝 License

MIT © 2026 Vishalbande94

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `EADDRINUSE: :::5000` | Port 5000 already in use. Set `PORT=5001` in `.env` or kill the process. |
| `fatal: not a git repository` | Run commands from the repo root. |
| Backend won't start | Check `.env` has `JWT_SECRET` and `APP_SECRET` set. |
| `Browser not found` when running generated Playwright suite | Run `npx playwright install` inside the generated project. |
| 401 on API calls | Your JWT expired. Log out and log in again. |
| Lost admin access | Delete `qa-tool/backend/reports/users.json` and restart backend — next signup becomes admin. |

---

## 🗺️ Roadmap

- [ ] SQLite migration for jobs/sessions (currently in-memory)
- [ ] Multi-tenancy / team workspaces
- [ ] SSO (Okta / Google / Azure AD)
- [ ] Scheduled runs (cron)
- [ ] Trend charts + flaky test detection
- [ ] WebSocket live updates
- [ ] Self-healing tests (AI selector repair)
- [ ] Contract testing (Pact)
- [ ] Mutation testing (Stryker)
- [ ] BrowserStack / Sauce Labs integration

---

**Built with ❤️ using Claude Code.** Star ⭐ the repo if this helps your team!
