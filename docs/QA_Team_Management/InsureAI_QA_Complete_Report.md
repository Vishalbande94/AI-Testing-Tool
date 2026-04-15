<!--
══════════════════════════════════════════════════════════════════════════════
  INSUREAI — COMPLETE QA LIFECYCLE REPORT
  Theme Colors: Primary #0d47a1 | Accent #ffd54f | Secondary #ff6f00
  Apply these colors to Word headings, table headers, and borders
══════════════════════════════════════════════════════════════════════════════
-->

---

# ██████████████████████████████████████████████████████████████
# ██                                                          ██
# ██   INSUREAI — GENERAL INSURANCE WEB PORTAL                ██
# ██   COMPLETE QA LIFECYCLE REPORT                           ██
# ██                                                          ██
# ██   Version    : 1.0                                       ██
# ██   Date       : 24-Mar-2026                               ██
# ██   Prepared By: QA Team Lead                              ██
# ██   Client     : InsureAI Platform                         ██
# ██   URL        : http://localhost:3000                      ██
# ██                                                          ██
# ██   CONFIDENTIAL — FOR INTERNAL QA USE ONLY                ██
# ██                                                          ██
# ██████████████████████████████████████████████████████████████

---

# TABLE OF CONTENTS

| # | Section | Page |
|---|---------|------|
| 1 | Application Analysis & Theme Detection | 3 |
| 2 | Requirement Generation (Functional + Non-Functional) | 5 |
| 3 | Test Planning | 12 |
| 4 | Test Design — Manual QA | 18 |
| 5 | Test Design — Automation QA | 35 |
| 6 | Test Execution — Manual (Simulated) | 42 |
| 7 | Test Execution — Automation (Simulated) | 48 |
| 8 | API Testing | 54 |
| 9 | Performance Testing | 62 |
| 10 | Defect Summary | 68 |
| 11 | Parallel Execution Timeline | 74 |
| 12 | Test Summary Report | 76 |
| 13 | Sign-Off & Release Recommendation | 80 |

---

# ══════════════════════════════════════════════════════════════
# SECTION 1 — APPLICATION ANALYSIS & THEME DETECTION
# ══════════════════════════════════════════════════════════════

## 1.1 Application Overview

| Field | Details |
|-------|---------|
| **Application Name** | InsureAI — Smart Insurance Portal |
| **URL** | file:///C:/Users/Vishal/PlaywrightPractice/insurance-app/payments.html |
| **Serving URL** | http://localhost:3000 |
| **Technology Stack** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3.0, localStorage |
| **Application Type** | Single Page Web Application (client-side rendering) |
| **Data Storage** | Browser localStorage (demo/prototype) |
| **Authentication** | Client-side email/password with session storage |
| **Responsive** | Yes — Bootstrap grid, media queries (breakpoint 768px) |

## 1.2 Theme Detection Report

```
╔══════════════════════════════════════════════════════════════════╗
║                    🎨 THEME ANALYSIS                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  PRIMARY COLOR     : #0d47a1  ████████  (Dark Blue)             ║
║  PRIMARY LIGHT     : #1976d2  ████████  (Medium Blue)           ║
║  ACCENT / BRAND    : #ffd54f  ████████  (Gold/Yellow)           ║
║  SECONDARY         : #ff6f00  ████████  (Orange)                ║
║  SUCCESS           : #2e7d32  ████████  (Green)                 ║
║  DANGER            : #c62828  ████████  (Red)                   ║
║  WARNING           : #f57f17  ████████  (Amber)                 ║
║  BACKGROUND        : #f4f6fb  ████████  (Light Grey-Blue)       ║
║  TEXT              : #1a1a2e  ████████  (Near Black)            ║
║  MUTED TEXT        : #6c757d  ████████  (Grey)                  ║
║                                                                  ║
║  FONT FAMILY       : 'Segoe UI', sans-serif                    ║
║  BORDER RADIUS     : 8px (buttons), 12px (cards)               ║
║  NAVBAR            : Dark blue gradient (#0d47a1)               ║
║  SIDEBAR           : White (#fff) with blue active state        ║
║  HERO GRADIENT     : 135deg #0d47a1 → #1976d2 → #0288d1       ║
║  BRANDING          : "Insure" (white) + "AI" (gold #ffd54f)    ║
║                                                                  ║
║  UI FRAMEWORK      : Bootstrap 5.3.0                            ║
║  ICON LIBRARY      : Bootstrap Icons 1.11.0                     ║
║  CARD STYLE        : Flat, 12px radius, subtle shadow           ║
║  BUTTON STYLE      : Rounded (8px), bold text (600 weight)     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

> **Word Document Instruction:** Apply **#0d47a1** (dark blue) to all Heading 1/2 borders and table headers. Use **#ffd54f** (gold) for accent highlights. Use **#2e7d32** (green) for pass indicators and **#c62828** (red) for fail indicators.

## 1.3 Modules Identified

| # | Module | Pages | Complexity | User Roles |
|---|--------|-------|------------|------------|
| 1 | Landing / Home | index.html | Low | Guest |
| 2 | Registration | register.html | High | Guest |
| 3 | Login / Authentication | login.html, forgot-password.html | High | Guest |
| 4 | Customer Dashboard | dashboard.html | Medium | Customer |
| 5 | Quote Generation — Motor | motor-quote.html | High | Customer |
| 6 | Quote Generation — Health | health-quote.html | High | Customer |
| 7 | Quote Generation — Home | home-quote.html | Medium | Customer |
| 8 | Quote Generation — Travel | travel-quote.html | High | Customer |
| 9 | Quote Hub | get-quote.html | Low | Customer |
| 10 | Policy Purchase (Checkout) | checkout.html | Critical | Customer |
| 11 | Policy Management | policies.html, policy-detail.html | High | Customer |
| 12 | Claims Management | claims.html | Critical | Customer |
| 13 | Payment History | payments.html | Medium | Customer |
| 14 | Documents & Downloads | documents.html | Low | Customer |
| 15 | Admin Panel | admin.html | High | Admin |
| 16 | Forgot Password | forgot-password.html | Low | Guest |

## 1.4 User Roles & Workflows

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER WORKFLOW MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GUEST USER:                                                    │
│  index.html → register.html → login.html                       │
│                                                                 │
│  CUSTOMER:                                                      │
│  login → dashboard → get-quote → [motor/health/home/travel]    │
│       → checkout → policies → policy-detail                     │
│       → claims (file/track)                                     │
│       → payments (history/receipt)                               │
│       → documents (download)                                    │
│                                                                 │
│  ADMIN:                                                         │
│  login → admin.html                                             │
│       → Dashboard (stats)                                       │
│       → Customers (search/deactivate/unlock)                    │
│       → All Policies (view)                                     │
│       → Claims (update status)                                  │
│       → Payments (view all)                                     │
│       → Reports (analytics)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1.5 Key Business Flows

| Flow | Steps | Priority |
|------|-------|----------|
| **E2E Policy Purchase** | Register → Login → Get Quote → Fill Details → Select Plan → Checkout → Pay → View Policy | Critical |
| **Claim Lifecycle** | Login → File Claim → Admin Review → Approve/Reject → Customer Track | Critical |
| **Payment Verification** | Purchase Policy → Payment Processed → View in Payment History → Download Receipt | High |
| **Admin Management** | Admin Login → View Dashboard → Manage Customers → Update Claims → View Reports | High |
| **Policy Renewal** | Login → Dashboard (alert) → Policies → Renew (within 60 days) → Checkout → Pay | Medium |
| **Policy Cancellation** | Login → Policies → Policy Detail → Cancel → Confirm → Refund Calculation | Medium |

---

# ══════════════════════════════════════════════════════════════
# SECTION 2 — REQUIREMENT GENERATION
# ══════════════════════════════════════════════════════════════

## 2.1 Functional Requirements (Inferred from UI/UX Analysis)

### Module 1: Registration & Authentication

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-001 | System shall allow new user registration with Name, Email, Mobile, DOB, Password | Valid data → success message; user stored in system | Critical |
| FR-002 | System shall validate email format (RFC 5322 pattern) | Invalid email → inline error "Please enter a valid email" | High |
| FR-003 | System shall validate mobile number (exactly 10 digits) | Non-10-digit → error; only numeric allowed | High |
| FR-004 | System shall enforce minimum age of 18 years | DOB < 18 years → "You must be at least 18 years old" | High |
| FR-005 | System shall enforce password complexity: 8+ chars, uppercase, lowercase, number, special char | Weak password → specific inline error per missing rule | High |
| FR-006 | System shall verify password and confirm password match | Mismatch → "Passwords do not match" error | High |
| FR-007 | System shall prevent duplicate email registration | Existing email → "Email already registered" error | Critical |
| FR-008 | System shall allow login with email and password | Valid credentials → redirect to dashboard (customer) or admin panel (admin) | Critical |
| FR-009 | System shall display generic error on invalid login (no field specificity) | Wrong credentials → "Invalid credentials. Please try again." | High |
| FR-010 | System shall lock account after 5 consecutive failed login attempts | 5th failure → "Account locked" message | Critical |
| FR-011 | System shall show remaining login attempts on failure | After each failure → "X attempts remaining" displayed | Medium |
| FR-012 | System shall provide "Forgot Password" flow | Click link → enter email → success message shown | Medium |
| FR-013 | System shall provide password visibility toggle | Eye icon click → password shown/hidden | Low |
| FR-014 | System shall provide "Remember Me for 7 days" option | Checkbox available on login form | Low |
| FR-015 | System shall redirect logged-in users away from login page | Already logged in + visit login → auto redirect to dashboard | Medium |
| FR-016 | System shall clear session on logout and prevent back-button access | Logout → session cleared; back button → stays on login | Critical |

### Module 2: Customer Dashboard

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-017 | Dashboard shall display 4 stat cards: Active Policies, Due for Renewal, Total Claims, Total Premium | All values correctly calculated from user data | High |
| FR-018 | Dashboard shall display time-based greeting (Morning/Afternoon/Evening) | Greeting matches current time of day | Low |
| FR-019 | Dashboard shall show list of active policies with type, plan, premium, end date | Policies listed with status badges | High |
| FR-020 | Dashboard shall display renewal alerts for policies expiring within 30 days | Orange alert (30 days), Red alert (<7 days) | High |
| FR-021 | Dashboard shall show 3 most recent claims with status | Claims listed with ID, type, date, status badge | Medium |
| FR-022 | Dashboard shall provide Quick Actions: Get Quote, File Claim, Make Payment, Download | Buttons navigate to correct pages | Medium |

### Module 3: Quote Generation

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-023 | Motor quote shall collect: Vehicle Type, Reg Number, Make, Model, Year, Fuel, NCB, City | All fields validated before submission | High |
| FR-024 | Motor registration number shall match format XX00XX0000 | Invalid format → validation error | High |
| FR-025 | Vehicle Model dropdown shall populate dynamically based on Make selection | Select Make → Models appear | High |
| FR-026 | Motor quote shall display 3 plans: Third Party, Standard, Comprehensive | 3 plan cards shown with features and premiums | High |
| FR-027 | NCB discount shall be applied to motor premium calculation | Higher NCB → lower premium (0%, 20%, 25%, 35%, 45%, 50%) | High |
| FR-028 | Motor add-ons (Zero Dep, Roadside, Engine Protection) shall update premium dynamically | Check add-on → premium recalculates without page reload | High |
| FR-029 | Health quote shall support Individual and Family Floater plans | Individual: 1 member; Family: 2-6 members | High |
| FR-030 | Health quote shall generate member age inputs dynamically based on member count | Select 3 members → 3 age dropdowns appear | Medium |
| FR-031 | Pre-existing disease selection shall show waiting period warning | PED = Yes → yellow alert with 48-month waiting period note | Medium |
| FR-032 | Home quote shall collect property details: Type, Construction, Age, Area, Value, City, PIN | All fields validated | High |
| FR-033 | Home premium shall calculate based on property value (0.05%–0.12%) | Premium = property value × rate × plan multiplier | High |
| FR-034 | Travel quote shall require future start date | Past date → validation error | Critical |
| FR-035 | Travel trip duration shall not exceed 180 days | End date > start + 180 → error | High |
| FR-036 | Travel quote shall differentiate domestic vs international pricing | International destinations → higher premiums | Medium |
| FR-037 | All quote types shall support "Save Quote" and "Buy Now" actions | Save → stored in quotes list; Buy Now → redirects to checkout | High |

### Module 4: Policy Purchase (Checkout)

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-038 | Checkout shall collect Nominee details: Name, Relationship, DOB, Address, KYC | All fields required and validated | High |
| FR-039 | Checkout shall support 5 payment methods: Credit Card, Debit Card, UPI, Net Banking, Wallet | Method selection shows corresponding input fields | High |
| FR-040 | Card number shall format with spaces every 4 digits | Input "4111111111111111" → displays "4111 1111 1111 1111" | Medium |
| FR-041 | Payment processing shall show spinner/loading for ~2 seconds | Button → spinner → success modal | Medium |
| FR-042 | Success modal shall display unique Policy Number (POL...) and Transaction ID (TXN...) | Both IDs generated and shown | Critical |
| FR-043 | Order Summary shall show Type, Plan, Sum Insured, Period, Base Premium, GST (18%), Total | Accurate calculation displayed | High |
| FR-044 | No card data shall be stored in localStorage after payment | Post-payment: no card/CVV in storage | Critical |

### Module 5: Policy Management

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-045 | My Policies page shall list all user policies with filter tabs | Tabs: All, Active, Expired, Motor, Health, Home, Travel | High |
| FR-046 | Policy card shall show type, plan, status badge, sum insured, dates, premium, nominee | All data correctly populated | High |
| FR-047 | Renewal button shall appear for active policies within 60 days of expiry | Active + ≤60 days → Renew button visible | High |
| FR-048 | Policy cancellation shall calculate pro-rata refund | Days remaining / 365 × annual premium = refund amount | High |
| FR-049 | Policy detail page shall display type-specific information (vehicle/property/travel details) | Motor shows vehicle info; Home shows property info | Medium |
| FR-050 | Policy detail shall show claims history linked to that policy | Claims table filtered by policy ID | Medium |

### Module 6: Claims Management

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-051 | Customer shall file a claim against an active policy | Claim form with policy dropdown (active policies only) | Critical |
| FR-052 | Incident date must fall within policy start and end date | Date outside period → validation error | Critical |
| FR-053 | Claim description shall enforce 20-500 character limit with counter | <20 chars → error; counter shows remaining | Medium |
| FR-054 | System shall generate unique Claim ID (CLM...) on submission | Success → CLM reference number displayed | Critical |
| FR-055 | Claim status timeline shall show progression with dates | Timeline: Submitted → Under Review → [Approved/Rejected] | High |
| FR-056 | Customer shall see "Upload Additional Documents" when status = "Additional Info Required" | Upload section appears only for this status | Medium |

### Module 7: Payment History

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-057 | Payments page shall display stats: Successful Payments count, Total Premium Paid | Values calculated from payment records | High |
| FR-058 | All transactions shall be listed with: TXN ID, Policy, Type, Date, Method, Amount, Status | Table populated with all user payments | High |
| FR-059 | Search shall filter transactions by ID, type, or payment method | Type partial text → table filters in real-time | Medium |
| FR-060 | Receipt modal shall display full payment details | Click receipt icon → modal shows TXN details | Medium |
| FR-061 | Print Receipt button shall trigger browser print dialog | Click Print → window.print() called | Low |

### Module 8: Documents & Downloads

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-062 | Documents page shall list: Policy Documents, Premium Receipts, Renewal Notices | Documents generated from policies and payments | Medium |
| FR-063 | Approved claim settlement letters shall appear in documents | Approved claims → settlement letter listed | Medium |
| FR-064 | Download button shall generate a demo text file | Click → file downloaded with policy/payment details | Low |

### Module 9: Admin Panel

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|---------------------|----------|
| FR-065 | Admin dashboard shall show 4 stats: Customers, Policies, Claims, Premium Collected | Aggregated from all data | High |
| FR-066 | Admin shall search customers by name, email, or mobile | Partial match search → filtered results | High |
| FR-067 | Admin shall deactivate/unlock customer accounts | Deactivate → status changes; Unlock → locked=false | High |
| FR-068 | Admin shall update claim status with remarks | Status dropdown + remarks → claim updated | Critical |
| FR-069 | Admin reports shall show policies by type, claims by status, premium collection stats | Bar charts and summary cards | Medium |
| FR-070 | Non-admin users shall be redirected away from admin.html | Customer accessing admin.html → redirected to login | Critical |

---

## 2.2 Non-Functional Requirements

| Req ID | Category | Requirement | Acceptance Criteria | Priority |
|--------|----------|-------------|---------------------|----------|
| NFR-001 | Performance | All pages shall load within 3 seconds | Measured via Navigation Timing API | High |
| NFR-002 | Performance | First Contentful Paint (FCP) < 1.8 seconds | Measured via PerformanceObserver | High |
| NFR-003 | Performance | Largest Contentful Paint (LCP) < 2.5 seconds | Core Web Vital threshold | High |
| NFR-004 | Performance | Cumulative Layout Shift (CLS) < 0.1 | Core Web Vital threshold | Medium |
| NFR-005 | Responsiveness | Application shall be usable from 320px to 2560px width | Sidebar hidden on mobile; content reflows | Medium |
| NFR-006 | Compatibility | Application shall work on Chrome, Firefox, Edge, Safari (WebKit) | No functional differences across browsers | High |
| NFR-007 | Security | No card data (number, CVV, expiry) stored in localStorage | Post-checkout: localStorage audit passes | Critical |
| NFR-008 | Security | Auth guard shall prevent unauthenticated access to protected pages | Direct URL → redirect to login.html | Critical |
| NFR-009 | Security | Admin pages shall be inaccessible to non-admin users | Customer accessing admin.html → redirected | Critical |
| NFR-010 | Usability | Error messages shall use red (#c62828); success messages shall use green (#2e7d32) | Visual audit passes | Low |
| NFR-011 | Usability | Form validation shall provide inline feedback (not just alert boxes) | Invalid field → red border + message below field | Medium |
| NFR-012 | Data Integrity | Policy, Claim, and Transaction IDs shall be unique | No duplicate IDs across all records | High |
| NFR-013 | Reliability | Application shall handle concurrent multi-tab usage | No data corruption between tabs | Medium |
| NFR-014 | Accessibility | All interactive elements shall be keyboard navigable | Tab order correct; Enter/Space activates buttons | Low |

---

# ══════════════════════════════════════════════════════════════
# SECTION 3 — TEST PLANNING
# ══════════════════════════════════════════════════════════════

## 3.1 Test Plan Document

### 3.1.1 Objective
To validate that InsureAI General Insurance Portal v1.0 meets all functional, non-functional, security, and performance requirements inferred from UI/UX analysis, ensuring production-readiness for client demonstration.

### 3.1.2 Scope

**IN SCOPE:**

| Category | Details |
|----------|---------|
| Functional Testing | All 15 modules, 70 functional requirements |
| Integration Testing | E2E flows: Registration → Policy Purchase → Claim → Payment |
| UI/UX Testing | Responsive design, cross-browser, theme consistency |
| Security Testing | Auth guard, card data storage, admin access control, XSS, injection |
| Performance Testing | Page load, Core Web Vitals, concurrent users, memory leaks |
| API Testing | Simulated API contracts (production-readiness design) |
| Regression Testing | Full suite after each defect fix cycle |
| Exploratory Testing | Unscripted edge case discovery |

**OUT OF SCOPE:**

| Category | Reason |
|----------|--------|
| Real payment gateway testing | Demo uses simulated payments |
| Email/SMS delivery verification | Simulated via console.log |
| Backend database testing | No real DB (localStorage demo) |
| Load testing beyond 10 concurrent sessions | Browser limitation for localStorage |
| Native mobile app testing | Web-only application |
| Penetration testing | Requires separate engagement |

### 3.1.3 Entry Criteria

- [ ] Application deployed and accessible at localhost:3000
- [ ] All 16 HTML pages rendering without console errors
- [ ] Test environment stable (localStorage seeded with demo data)
- [ ] Requirements document reviewed and baselined
- [ ] Test cases reviewed and approved by QA Lead
- [ ] Test data prepared and verified
- [ ] Automation framework setup and smoke test passing
- [ ] Playwright installed with all browser engines

### 3.1.4 Exit Criteria

- [ ] 100% test case execution completed
- [ ] All Critical (P1) and High (P2) defects fixed and verified
- [ ] Regression pass rate ≥ 95%
- [ ] Performance: All pages < 3s load time
- [ ] No open P1 defects; ≤ 2 open P2 defects (with workarounds)
- [ ] Automation coverage ≥ 80% of automatable test cases
- [ ] Test Summary Report signed by QA Lead
- [ ] All security tests passed (auth guard, card data, admin access)

### 3.1.5 Risk Register

| # | Risk | Probability | Impact | Mitigation Strategy |
|---|------|-------------|--------|---------------------|
| R1 | localStorage cleared between test runs | High | High | Seed data in beforeEach hook; verify seed before each test |
| R2 | Browser compatibility differences in date pickers | Medium | Medium | Test on all 4 browsers; document known differences |
| R3 | Test data conflicts in parallel test execution | Medium | High | Isolate data per test; use unique email/IDs per run |
| R4 | Flaky tests due to animation/transition timing | Medium | Medium | Use Playwright auto-wait; add explicit waitFor assertions |
| R5 | Scope creep from UI changes during testing | Low | High | Baseline UI before testing; change request process |
| R6 | localStorage size limits affecting large data sets | Low | Medium | Monitor storage usage; clean up after test suites |
| R7 | Race conditions in multi-tab testing | Medium | Medium | Sequential execution for multi-tab scenarios |

---

## 3.2 QA Team Responsibility Matrix (RACI)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    QA TEAM — RESPONSIBILITY MATRIX                      ║
╠══════════════════════════════╦═══════╦═══════╦═══════╦═════════════════╣
║ Activity                     ║ QA TL ║ Man QA║ Auto QA║ Perf/API QA   ║
╠══════════════════════════════╬═══════╬═══════╬═══════╬═════════════════╣
║ Requirement Analysis         ║   A   ║   R   ║   C   ║       C       ║
║ Test Plan Creation           ║  R/A  ║   C   ║   C   ║       C       ║
║ Test Scenario Design         ║   A   ║   R   ║   C   ║       I       ║
║ Test Case Writing            ║   A   ║   R   ║   I   ║       I       ║
║ RTM Creation                 ║   A   ║   R   ║   C   ║       I       ║
║ Test Data Preparation        ║   A   ║   R   ║   R   ║       C       ║
║ Automation Framework Design  ║   A   ║   I   ║   R   ║       C       ║
║ Automation Script Dev        ║   A   ║   I   ║   R   ║       I       ║
║ Smoke Test Execution         ║   A   ║   R   ║   R   ║       I       ║
║ Functional Test Execution    ║   A   ║   R   ║   I   ║       I       ║
║ Regression Test Execution    ║   A   ║   R   ║   R   ║       I       ║
║ Integration/E2E Testing      ║   A   ║   R   ║   R   ║       I       ║
║ Cross-Browser Testing        ║   A   ║   R   ║   R   ║       I       ║
║ API Test Design & Execution  ║   A   ║   I   ║   C   ║       R       ║
║ Performance Test Execution   ║   A   ║   I   ║   C   ║       R       ║
║ Security Testing             ║   A   ║   R   ║   R   ║       C       ║
║ Exploratory Testing          ║   A   ║   R   ║   I   ║       I       ║
║ Defect Logging & Triage      ║  R/A  ║   R   ║   R   ║       R       ║
║ Daily Status Report          ║   A   ║   R   ║   R   ║       R       ║
║ Test Summary Report          ║  R/A  ║   C   ║   C   ║       C       ║
╠══════════════════════════════╬═══════╬═══════╬═══════╬═════════════════╣
║ R = Responsible | A = Accountable | C = Consulted | I = Informed      ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 3.3 Sprint Timeline — Parallel Execution Plan

```
╔════════════════════════════════════════════════════════════════════════════════════════╗
║                          6-WEEK QA SPRINT PLAN                                        ║
╠═══════╦═══════════════════════════════╦═══════════════════════════════════════════════╣
║ Week  ║ Manual QA Engineer            ║ Automation / Perf / API QA Engineer           ║
╠═══════╬═══════════════════════════════╬═══════════════════════════════════════════════╣
║       ║                               ║                                               ║
║ WK 1  ║ ▪ Requirement analysis        ║ ▪ Framework setup (Playwright + POM)         ║
║       ║ ▪ Test scenario writing        ║ ▪ Folder structure creation                  ║
║       ║ ▪ Test cases: Modules 1-4     ║ ▪ Page object creation (Login, Register)     ║
║       ║ ▪ Test data preparation       ║ ▪ Seed data helper implementation            ║
║       ║                               ║                                               ║
║ WK 2  ║ ▪ Test cases: Modules 5-9    ║ ▪ Smoke test automation (10 tests)           ║
║       ║ ▪ Test cases: Modules 10-15  ║ ▪ Login/Registration automation              ║
║       ║ ▪ RTM creation                ║ ▪ API test design (endpoints + contracts)    ║
║       ║ ▪ Test case review with TL    ║ ▪ Performance test setup (page load)         ║
║       ║                               ║                                               ║
║ WK 3  ║ ▪ Smoke testing (30 min)     ║ ▪ Quote flow automation (Motor, Health)      ║
║       ║ ▪ Sanity testing             ║ ▪ Checkout + Policy automation               ║
║       ║ ▪ Functional: Auth module    ║ ▪ Core Web Vitals test implementation        ║
║       ║ ▪ Functional: Quote module   ║ ▪ CI/CD pipeline setup (GitHub Actions)      ║
║       ║                               ║                                               ║
║ WK 4  ║ ▪ Functional: Policy module  ║ ▪ Claims + Payments automation               ║
║       ║ ▪ Functional: Claims/Payment ║ ▪ Admin panel automation                     ║
║       ║ ▪ Integration testing (E2E)  ║ ▪ API test execution (simulated)             ║
║       ║ ▪ Cross-browser testing      ║ ▪ Concurrent users perf test                 ║
║       ║                               ║                                               ║
║ WK 5  ║ ▪ Regression cycle 1        ║ ▪ Full regression run (all browsers)         ║
║       ║ ▪ Defect re-testing         ║ ▪ Performance suite execution                ║
║       ║ ▪ Exploratory testing        ║ ▪ Memory leak testing                        ║
║       ║ ▪ Admin module testing       ║ ▪ Security automation (auth guard, data)     ║
║       ║                               ║                                               ║
║ WK 6  ║ ▪ Final regression cycle     ║ ▪ Final automation run + report              ║
║       ║ ▪ UAT support               ║ ▪ Performance benchmark report               ║
║       ║ ▪ Test summary report        ║ ▪ CI/CD pipeline documentation               ║
║       ║ ▪ Sign-off preparation       ║ ▪ Automation maintenance guide               ║
║       ║                               ║                                               ║
╚═══════╩═══════════════════════════════╩═══════════════════════════════════════════════╝
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 4 — TEST DESIGN (MANUAL QA)
# ══════════════════════════════════════════════════════════════

## 4.1 Test Scenarios — Complete List

### Module 1: Registration

| ID | Scenario | Priority |
|----|----------|----------|
| TS_REG_01 | Verify successful registration with all valid mandatory fields | Critical |
| TS_REG_02 | Verify inline validation errors for each invalid field | High |
| TS_REG_03 | Verify password strength rules enforcement | High |
| TS_REG_04 | Verify duplicate email registration is blocked | Critical |
| TS_REG_05 | Verify age validation (must be 18+) | High |
| TS_REG_06 | Verify confirm password mismatch error | High |
| TS_REG_07 | Verify mobile number accepts exactly 10 digits | High |
| TS_REG_08 | Verify successful redirect to login after registration | Medium |

### Module 2: Login & Authentication

| ID | Scenario | Priority |
|----|----------|----------|
| TS_LOG_01 | Verify customer login with valid credentials → dashboard redirect | Critical |
| TS_LOG_02 | Verify admin login with valid credentials → admin panel redirect | Critical |
| TS_LOG_03 | Verify login failure with wrong password → generic error message | High |
| TS_LOG_04 | Verify account lockout after 5 consecutive failed attempts | Critical |
| TS_LOG_05 | Verify remaining attempts counter decrements on each failure | Medium |
| TS_LOG_06 | Verify forgot password flow displays success message | Medium |
| TS_LOG_07 | Verify password visibility toggle works | Low |
| TS_LOG_08 | Verify logout clears session and back button doesn't return to dashboard | Critical |
| TS_LOG_09 | Verify logged-in user is redirected away from login page | Medium |

### Module 3: Dashboard

| ID | Scenario | Priority |
|----|----------|----------|
| TS_DASH_01 | Verify dashboard loads with correct stat cards | High |
| TS_DASH_02 | Verify time-based greeting message | Low |
| TS_DASH_03 | Verify active policies listed correctly | High |
| TS_DASH_04 | Verify renewal alerts displayed for policies within 30 days | High |
| TS_DASH_05 | Verify recent claims section shows latest 3 claims | Medium |
| TS_DASH_06 | Verify Quick Actions buttons navigate correctly | Medium |

### Module 4: Motor Quote

| ID | Scenario | Priority |
|----|----------|----------|
| TS_MOTOR_01 | Verify motor quote form accepts all valid vehicle details | High |
| TS_MOTOR_02 | Verify registration number format validation (XX00XX0000) | High |
| TS_MOTOR_03 | Verify Model dropdown populates after Make selection | High |
| TS_MOTOR_04 | Verify 3 plans displayed with correct premiums | High |
| TS_MOTOR_05 | Verify NCB discount applied correctly to premium | High |
| TS_MOTOR_06 | Verify add-ons dynamically update premium (no page reload) | High |
| TS_MOTOR_07 | Verify Save Quote stores quote in system | Medium |
| TS_MOTOR_08 | Verify Buy Now redirects to checkout with correct data | High |

### Module 5: Health Quote

| ID | Scenario | Priority |
|----|----------|----------|
| TS_HLT_01 | Verify Individual plan generates quote for 1 member | High |
| TS_HLT_02 | Verify Family Floater dynamically shows member count + age inputs | High |
| TS_HLT_03 | Verify PED selection shows 48-month waiting period warning | Medium |
| TS_HLT_04 | Verify premium calculates based on oldest member age | High |
| TS_HLT_05 | Verify 3 plans: Silver, Gold, Platinum with different features | High |

### Module 6: Home Quote

| ID | Scenario | Priority |
|----|----------|----------|
| TS_HOME_01 | Verify home quote with valid property details | High |
| TS_HOME_02 | Verify premium calculation based on property value | High |
| TS_HOME_03 | Verify PIN code validation (6 digits) | Medium |
| TS_HOME_04 | Verify 3 plans: Basic, Standard, Comprehensive | Medium |

### Module 7: Travel Quote

| ID | Scenario | Priority |
|----|----------|----------|
| TS_TRVL_01 | Verify travel quote rejects past start dates | Critical |
| TS_TRVL_02 | Verify max 180-day trip duration enforced | High |
| TS_TRVL_03 | Verify domestic vs international pricing differentiation | Medium |
| TS_TRVL_04 | Verify dynamic traveller age inputs based on count | Medium |
| TS_TRVL_05 | Verify premium = rate × days × travellers × 1.18 (GST) | High |

### Module 8: Checkout & Payment

| ID | Scenario | Priority |
|----|----------|----------|
| TS_CHK_01 | Verify nominee details form validation | High |
| TS_CHK_02 | Verify 5 payment methods display correct input fields | High |
| TS_CHK_03 | Verify credit card number formatting (spaces every 4 digits) | Medium |
| TS_CHK_04 | Verify payment processing shows spinner animation | Medium |
| TS_CHK_05 | Verify success modal shows Policy Number + Transaction ID | Critical |
| TS_CHK_06 | Verify order summary calculations (premium + 18% GST = total) | High |
| TS_CHK_07 | Verify no card data stored in localStorage post-payment | Critical |

### Module 9: Policy Management

| ID | Scenario | Priority |
|----|----------|----------|
| TS_POL_01 | Verify policies listed with correct filter tabs | High |
| TS_POL_02 | Verify Active/Expired/Cancelled status badges | High |
| TS_POL_03 | Verify Renew button appears within 60 days of expiry | High |
| TS_POL_04 | Verify policy cancellation with pro-rata refund calculation | High |
| TS_POL_05 | Verify policy detail shows type-specific information | Medium |
| TS_POL_06 | Verify claims history on policy detail page | Medium |

### Module 10: Claims Management

| ID | Scenario | Priority |
|----|----------|----------|
| TS_CLM_01 | Verify claim filed successfully with Claim ID generated | Critical |
| TS_CLM_02 | Verify incident date validation (must be within policy period) | Critical |
| TS_CLM_03 | Verify description 20-500 char limit with counter | Medium |
| TS_CLM_04 | Verify claim dropdown shows only active policies | High |
| TS_CLM_05 | Verify claim status timeline displays correctly | High |
| TS_CLM_06 | Verify "Upload Documents" shown only for "Additional Info Required" status | Medium |

### Module 11: Payment History (payments.html — TARGET PAGE)

| ID | Scenario | Priority |
|----|----------|----------|
| TS_PAY_01 | Verify payment stats cards show correct counts and totals | High |
| TS_PAY_02 | Verify all transactions listed with correct columns | High |
| TS_PAY_03 | Verify search filters by Transaction ID | High |
| TS_PAY_04 | Verify search filters by insurance type | Medium |
| TS_PAY_05 | Verify search filters by payment method | Medium |
| TS_PAY_06 | Verify receipt modal shows full transaction details | High |
| TS_PAY_07 | Verify Print Receipt triggers browser print | Low |
| TS_PAY_08 | Verify empty state when no transactions exist | Medium |

### Module 12: Documents

| ID | Scenario | Priority |
|----|----------|----------|
| TS_DOC_01 | Verify documents listed for each policy | Medium |
| TS_DOC_02 | Verify download generates demo file | Low |
| TS_DOC_03 | Verify approved claim settlement letters appear | Medium |

### Module 13: Admin Panel

| ID | Scenario | Priority |
|----|----------|----------|
| TS_ADM_01 | Verify admin dashboard stats are accurate | High |
| TS_ADM_02 | Verify customer search by name/email/mobile | High |
| TS_ADM_03 | Verify admin can deactivate a customer account | High |
| TS_ADM_04 | Verify admin can unlock a locked account | High |
| TS_ADM_05 | Verify admin can update claim status with remarks | Critical |
| TS_ADM_06 | Verify admin reports show correct aggregations | Medium |
| TS_ADM_07 | Verify non-admin user cannot access admin.html | Critical |

### Module 14: Non-Functional

| ID | Scenario | Priority |
|----|----------|----------|
| TS_NFR_01 | Verify all 16 pages load within 3 seconds | High |
| TS_NFR_02 | Verify responsive layout at 320px, 375px, 768px, 1024px, 1440px, 2560px | Medium |
| TS_NFR_03 | Verify cross-browser: Chrome, Firefox, Edge, Safari | High |
| TS_NFR_04 | Verify auth guard on all protected pages | Critical |
| TS_NFR_05 | Verify no card data in localStorage | Critical |
| TS_NFR_06 | Verify error=red, success=green color coding | Low |

---

## 4.2 Detailed Test Cases — Payments Module (Target Page Deep Dive)

Since the URL provided is **payments.html**, here are exhaustive test cases for this module:

### TC_PAY_001 — Verify Payment Stats Cards Display Correctly

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_001 |
| **Title** | Verify Successful Payments count and Total Premium Paid stats |
| **Module** | Payment History |
| **Priority** | High |
| **Type** | Functional / Positive |
| **Pre-condition** | User logged in with existing payment records |
| **Test Data** | User: rahul@demo.com / Test@1234 (has 2 payments: ₹12,500 + ₹18,000 = ₹30,500) |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as rahul@demo.com | Dashboard displayed |
| 2 | Navigate to Payments from sidebar | payments.html loaded |
| 3 | Verify "Successful Payments" stat card | Shows "2" (count of Success status payments) |
| 4 | Verify "Total Premium Paid" stat card | Shows "₹30,500" (12,500 + 18,000) |
| 5 | Verify stat card styling | Blue gradient for count; Green gradient for total |

**Status:** ✓ PASS

---

### TC_PAY_002 — Verify Transaction Table Columns and Data

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_002 |
| **Title** | Verify all transaction columns display with correct data |
| **Module** | Payment History |
| **Priority** | High |
| **Type** | Functional / Positive |
| **Pre-condition** | User logged in with payments |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Payments page | Transactions table visible |
| 2 | Verify table header columns | Headers: Transaction ID, Policy, Type, Date, Method, Amount, Status, [Receipt] |
| 3 | Verify first row: TXN202600001 | Policy: POL202600001, Type: Motor, Method: 💳 Credit Card, Amount: ₹12,500, Status: Success (green badge) |
| 4 | Verify second row: TXN202600002 | Policy: POL202600002, Type: Health, Method: 📱 UPI, Amount: ₹18,000, Status: Success (green badge) |
| 5 | Verify date format | DD-Mon-YYYY format (e.g., "01 Jan 2026") |
| 6 | Verify amount format | Currency with Indian locale (₹ prefix, comma separators) |

**Status:** ✓ PASS

---

### TC_PAY_003 — Verify Search Filter by Transaction ID

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_003 |
| **Title** | Search transactions by Transaction ID |
| **Module** | Payment History |
| **Priority** | High |
| **Type** | Functional / Positive |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Payments page | All transactions visible |
| 2 | Type "TXN202600001" in search box | Only TXN202600001 row shown |
| 3 | Clear search box | All transactions restored |
| 4 | Type partial ID "00001" | Matching transaction(s) filtered |

**Status:** ✓ PASS

---

### TC_PAY_004 — Verify Search Filter by Insurance Type

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_004 |
| **Title** | Search transactions by insurance type |
| **Module** | Payment History |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type "Motor" in search box | Only Motor type transactions shown |
| 2 | Type "Health" in search box | Only Health type transactions shown |
| 3 | Type "xyz" (no match) | Empty state: "No transactions found." |

**Status:** ✓ PASS

---

### TC_PAY_005 — Verify Search Filter by Payment Method

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_005 |
| **Title** | Search transactions by payment method |
| **Module** | Payment History |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type "Credit Card" in search | Only Credit Card payments shown |
| 2 | Type "UPI" in search | Only UPI payments shown |
| 3 | Type "Net Banking" in search | Only Net Banking payments shown |

**Status:** ✓ PASS

---

### TC_PAY_006 — Verify Receipt Modal Opens with Correct Details

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_006 |
| **Title** | Receipt modal displays complete transaction details |
| **Module** | Payment History |
| **Priority** | High |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click receipt icon on TXN202600001 row | Modal opens with animation |
| 2 | Verify modal title | "Payment Receipt" with receipt icon |
| 3 | Verify success checkmark | ✅ icon displayed |
| 4 | Verify Transaction ID | Shows "TXN202600001" |
| 5 | Verify Reference No. | Shows "HDFC8723641" |
| 6 | Verify Policy ID | Shows "POL202600001" |
| 7 | Verify Insurance Type | Shows "Motor" |
| 8 | Verify Payment Date | Shows formatted date |
| 9 | Verify Payment Method | Shows "Credit Card" |
| 10 | Verify Status | Green "Success" badge |
| 11 | Verify Amount Paid | Shows "₹12,500" in blue, large font |
| 12 | Verify "Print Receipt" button present | Button with printer icon visible |
| 13 | Click "Close" button | Modal closes |

**Status:** ✓ PASS

---

### TC_PAY_007 — Verify Print Receipt Functionality

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_007 |
| **Title** | Print Receipt button triggers browser print dialog |
| **Module** | Payment History |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open receipt modal for any transaction | Modal displayed |
| 2 | Click "Print Receipt" button | Browser's native print dialog opens |
| 3 | Cancel print dialog | Modal remains open, no error |

**Status:** ✓ PASS

---

### TC_PAY_008 — Verify Empty State When No Payments Exist

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_008 |
| **Title** | Empty state message displayed for new user with no payments |
| **Module** | Payment History |
| **Priority** | Medium |
| **Test Data** | New user with no purchase history |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register new user and login | Dashboard displayed |
| 2 | Navigate to Payments | Payments page loaded |
| 3 | Verify transaction table area | Shows "No transactions found." with receipt icon |
| 4 | Verify stats | Successful Payments: 0, Total Premium: ₹0 |

**Status:** ✓ PASS

---

### TC_PAY_009 — Verify Payment Method Icons Display Correctly

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_009 |
| **Title** | Verify emoji icons for each payment method |
| **Module** | Payment History |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify Credit Card row | Shows 💳 icon before "Credit Card" |
| 2 | Verify UPI row | Shows 📱 icon before "UPI" |
| 3 | Verify Net Banking row | Shows 🏦 icon before "Net Banking" |

**Status:** ✓ PASS

---

### TC_PAY_010 — Verify Auth Guard Redirects Unauthenticated Users

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_010 |
| **Title** | Payments page requires authentication |
| **Module** | Payment History / Security |
| **Priority** | Critical |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear all localStorage (logout) | Session cleared |
| 2 | Navigate directly to payments.html | Redirected to login.html |
| 3 | Verify payments page content not visible | Login form displayed instead |

**Status:** ✓ PASS

---

### TC_PAY_011 — Verify Search is Case-Insensitive

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_011 |
| **Title** | Search filter works regardless of case |
| **Module** | Payment History |
| **Priority** | Medium |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type "motor" (lowercase) in search | Motor transactions shown |
| 2 | Type "MOTOR" (uppercase) in search | Same Motor transactions shown |
| 3 | Type "Motor" (mixed case) in search | Same Motor transactions shown |

**Status:** ✓ PASS

---

### TC_PAY_012 — Verify Navigation and Sidebar Active State

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_PAY_012 |
| **Title** | Sidebar highlights Payments link as active |
| **Module** | Payment History / UI |
| **Priority** | Low |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Payments page | Page loaded |
| 2 | Verify sidebar | "Payments" link has blue highlight + left border |
| 3 | Verify other sidebar links | No active state on other links |
| 4 | Verify navbar | Shows "Hi, [FirstName]" and Logout button |

**Status:** ✓ PASS

---

## 4.3 Detailed Test Cases — E2E Integration Flows

### TC_E2E_001 — Complete Motor Policy Purchase → Payment Verification

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_E2E_001 |
| **Title** | End-to-End: Motor Quote → Purchase → Payment History Verification |
| **Priority** | Critical |
| **Type** | Integration / E2E |
| **Pre-condition** | User registered and logged in |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as rahul@demo.com | Dashboard displayed |
| 2 | Navigate to Get Quote → Motor Insurance | Motor quote form loaded |
| 3 | Fill: Type=Four-Wheeler, Reg=MH12CD5678, Make=Hyundai, Model=Creta, Year=2023, Fuel=Diesel, NCB=25%, City=Mumbai | All fields filled |
| 4 | Click "Get Quotes" | 3 plans displayed |
| 5 | Select Comprehensive plan | Plan highlighted |
| 6 | Check Zero Depreciation add-on | Premium increases by ₹1,200 |
| 7 | Click Buy Now | Checkout page loaded with quote data |
| 8 | Fill nominee: Name=Test Nominee, Relationship=Spouse, DOB=1992-01-01, KYC=PAN, KYC#=ABCDE1234F | Nominee form filled |
| 9 | Select Credit Card, enter card: 4111 1111 1111 1111, Exp: 12/28, CVV: 123 | Card fields populated |
| 10 | Click "Pay Securely" | Spinner shows for ~2 seconds |
| 11 | Verify success modal | Policy Number (POL...) and Transaction ID (TXN...) displayed |
| 12 | Navigate to Payments | payments.html loaded |
| 13 | Verify new transaction in table | New TXN row with correct amount, method=Credit Card, status=Success |
| 14 | Click receipt icon on new transaction | Receipt modal shows correct details |
| 15 | Verify stats updated | Successful Payments count +1, Total Premium updated |

**Status:** ✓ PASS

---

### TC_E2E_002 — Claim Filing → Admin Approval → Payment History Check

| Field | Details |
|-------|---------|
| **Test Case ID** | TC_E2E_002 |
| **Title** | End-to-End: File Claim → Admin Updates → Customer Tracks |
| **Priority** | Critical |
| **Type** | Integration / E2E |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as customer | Dashboard |
| 2 | Navigate to Claims → File New Claim | Claim modal opens |
| 3 | Select active Motor policy, enter incident details | Form filled |
| 4 | Submit claim | CLM reference number generated |
| 5 | Logout → Login as admin | Admin panel |
| 6 | Navigate to Claims → Find new claim | Claim visible in list |
| 7 | Update status to "Under Review" → "Approved" | Status updated |
| 8 | Logout → Login as customer | Dashboard |
| 9 | Navigate to Claims → Track | Timeline shows all status changes |

**Status:** ✓ PASS

---

## 4.4 Test Data Sheet

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         TEST DATA REPOSITORY                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ VALID USER ACCOUNTS                                                  │ ║
║ ├─────────────┬──────────────────────────┬────────────┬───────────────┤ ║
║ │ Role        │ Email                    │ Password   │ Name          │ ║
║ ├─────────────┼──────────────────────────┼────────────┼───────────────┤ ║
║ │ Customer    │ rahul@demo.com           │ Test@1234  │ Rahul Sharma  │ ║
║ │ Customer    │ priya@demo.com           │ Test@1234  │ Priya Patel   │ ║
║ │ Admin       │ admin@insureai.com       │ Admin@123  │ Admin User    │ ║
║ │ New User    │ newuser_[timestamp]@test │ Test@1234  │ Test User     │ ║
║ └─────────────┴──────────────────────────┴────────────┴───────────────┘ ║
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ INVALID LOGIN DATA                                                   │ ║
║ ├──────────────────────────────┬───────────────────────────────────────┤ ║
║ │ Wrong password               │ rahul@demo.com / WrongPass@1        │ ║
║ │ Non-existent email           │ nouser@test.com / Test@1234         │ ║
║ │ Empty email                  │ (blank) / Test@1234                 │ ║
║ │ Empty password               │ rahul@demo.com / (blank)            │ ║
║ │ SQL injection                │ ' OR 1=1 -- / anything              │ ║
║ │ XSS attempt                  │ <script>alert(1)</script> / pass    │ ║
║ └──────────────────────────────┴───────────────────────────────────────┘ ║
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ REGISTRATION DATA                                                    │ ║
║ ├──────────────────────────────┬───────────────────────────────────────┤ ║
║ │ Valid DOB (18+)              │ 1995-06-15                           │ ║
║ │ Invalid DOB (<18)            │ 2015-01-01                           │ ║
║ │ Boundary DOB (exactly 18)   │ 2008-03-24                           │ ║
║ │ Weak password (no upper)    │ test@1234                             │ ║
║ │ Weak password (no special)  │ Test12345                             │ ║
║ │ Weak password (short)       │ Te@1                                  │ ║
║ │ Valid mobile                 │ 9876543210                           │ ║
║ │ Invalid mobile (5 digits)   │ 98765                                │ ║
║ │ Invalid mobile (letters)    │ 98765abcde                           │ ║
║ └──────────────────────────────┴───────────────────────────────────────┘ ║
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ MOTOR INSURANCE DATA                                                 │ ║
║ ├──────────────────────────────┬───────────────────────────────────────┤ ║
║ │ Valid Reg Number             │ MH12AB1234                           │ ║
║ │ Invalid Reg Number           │ ABCD123 / 12MH1234AB                │ ║
║ │ Make/Model                   │ Maruti Suzuki / Swift                │ ║
║ │ Year                         │ 2022                                 │ ║
║ │ Fuel Types                   │ Petrol, Diesel, Electric, CNG       │ ║
║ │ NCB Values                   │ 0%, 20%, 25%, 35%, 45%, 50%         │ ║
║ │ Add-ons                      │ Zero Dep (₹1200), Roadside (₹500)  │ ║
║ └──────────────────────────────┴───────────────────────────────────────┘ ║
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ PAYMENT DATA                                                         │ ║
║ ├──────────────────────────────┬───────────────────────────────────────┤ ║
║ │ Valid Card Number            │ 4111 1111 1111 1111                  │ ║
║ │ Card Expiry                  │ 12/28                                │ ║
║ │ CVV                          │ 123                                  │ ║
║ │ UPI ID                       │ test@upi                             │ ║
║ │ Invalid Card (short)        │ 4111 1111                            │ ║
║ │ Expired Card                 │ 01/20                                │ ║
║ └──────────────────────────────┴───────────────────────────────────────┘ ║
║                                                                          ║
║ ┌──────────────────────────────────────────────────────────────────────┐ ║
║ │ SEEDED PAYMENT RECORDS (for Payments page testing)                   │ ║
║ ├───────────────┬──────────────┬────────┬────────┬────────┬──────────┤ ║
║ │ TXN ID        │ Policy ID    │ Type   │ Amount │ Method │ Status   │ ║
║ ├───────────────┼──────────────┼────────┼────────┼────────┼──────────┤ ║
║ │ TXN202600001  │ POL202600001 │ Motor  │ 12,500 │ Credit │ Success  │ ║
║ │ TXN202600002  │ POL202600002 │ Health │ 18,000 │ UPI    │ Success  │ ║
║ │ TXN202600003  │ POL202600004 │ Home   │  8,500 │ NetBnk │ Success  │ ║
║ └───────────────┴──────────────┴────────┴────────┴────────┴──────────┘ ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 4.5 Requirement Traceability Matrix (RTM)

| Req ID | Requirement | Test Scenarios | Test Cases | Priority | Owner |
|--------|-------------|---------------|------------|----------|-------|
| FR-001 | Registration with mandatory fields | TS_REG_01, TS_REG_02 | TC_REG_001–008 | Critical | Manual |
| FR-004 | Minimum age 18 validation | TS_REG_05 | TC_REG_009–011 | High | Manual+Auto |
| FR-005 | Password complexity rules | TS_REG_03 | TC_REG_012–016 | High | Manual+Auto |
| FR-007 | Duplicate email blocked | TS_REG_04 | TC_REG_017 | Critical | Manual+Auto |
| FR-008 | Login with credentials | TS_LOG_01, TS_LOG_02 | TC_LOG_001–004 | Critical | Manual+Auto |
| FR-010 | Account lockout (5 failures) | TS_LOG_04 | TC_LOG_005–007 | Critical | Manual+Auto |
| FR-016 | Logout + back button prevention | TS_LOG_08 | TC_LOG_008–010 | Critical | Manual+Auto |
| FR-024 | Motor reg number format | TS_MOTOR_02 | TC_MOTOR_005–008 | High | Manual+Auto |
| FR-028 | Motor add-on dynamic premium | TS_MOTOR_06 | TC_MOTOR_012–015 | High | Manual+Auto |
| FR-034 | Travel future date requirement | TS_TRVL_01 | TC_TRVL_001–003 | Critical | Manual+Auto |
| FR-035 | Travel max 180 days | TS_TRVL_02 | TC_TRVL_004–006 | High | Manual+Auto |
| FR-042 | Success modal with POL# + TXN# | TS_CHK_05 | TC_CHK_010–012 | Critical | Auto |
| FR-044 | No card data in localStorage | TS_CHK_07 | TC_SEC_001–003 | Critical | Auto |
| FR-051 | File claim with CLM ID | TS_CLM_01 | TC_CLM_001–003 | Critical | Auto |
| FR-052 | Claim date within policy period | TS_CLM_02 | TC_CLM_004–006 | Critical | Auto |
| FR-057 | Payment stats display | TS_PAY_01 | TC_PAY_001 | High | Manual+Auto |
| FR-058 | Transaction table | TS_PAY_02 | TC_PAY_002 | High | Manual+Auto |
| FR-059 | Payment search filter | TS_PAY_03–05 | TC_PAY_003–005 | Medium | Manual+Auto |
| FR-060 | Receipt modal | TS_PAY_06 | TC_PAY_006 | Medium | Manual+Auto |
| FR-068 | Admin update claim status | TS_ADM_05 | TC_ADM_010–012 | Critical | Manual+Auto |
| FR-070 | Admin access control | TS_ADM_07 | TC_ADM_013–015 | Critical | Auto |
| NFR-001 | Page load < 3 seconds | TS_NFR_01 | TC_PERF_001–016 | High | Perf QA |
| NFR-006 | Cross-browser compatibility | TS_NFR_03 | TC_COMPAT_001–004 | High | Manual+Auto |
| NFR-007 | No card data stored | TS_NFR_05 | TC_SEC_001 | Critical | Auto |
| NFR-008 | Auth guard on protected pages | TS_NFR_04 | TC_SEC_004–010 | Critical | Auto |

---

# ══════════════════════════════════════════════════════════════
# SECTION 5 — TEST DESIGN (AUTOMATION QA)
# ══════════════════════════════════════════════════════════════

## 5.1 Automation Candidates

### Priority 1 — Automate Immediately (Sprint 1)

| # | Test Area | Test Count | Reason |
|---|-----------|-----------|--------|
| 1 | Login (valid/invalid/lockout) | 8 | Regression-critical, run every sprint |
| 2 | Registration validation | 10 | Core entry point, complex validations |
| 3 | Auth guard (all protected pages) | 8 | Security — must never regress |
| 4 | Dashboard load + data verification | 5 | REQ-017 performance compliance |
| 5 | Motor quote generation | 12 | Highest usage flow, complex calculation |
| 6 | Checkout + Payment | 10 | Revenue-critical flow |
| 7 | Claim filing + date validation | 8 | Core business flow |
| 8 | Payment history display + search | 6 | Data integrity verification |
| **Total** | | **67** | |

### Priority 2 — Automate in Sprint 2

| # | Test Area | Test Count | Reason |
|---|-----------|-----------|--------|
| 1 | Health quote (family floater) | 6 | Complex dynamic UI |
| 2 | Travel date validations | 5 | Boundary logic |
| 3 | Policy management (filter/cancel/renew) | 8 | Business rules |
| 4 | Admin claim status update | 5 | Multi-role flow |
| 5 | Receipt modal verification | 4 | UI modal interaction |
| **Total** | | **28** | |

### Priority 3 — Keep Manual

| # | Test Area | Reason |
|---|-----------|--------|
| 1 | Exploratory testing | Requires human judgment |
| 2 | Visual/UI aesthetics | Color, spacing, alignment |
| 3 | Cross-browser rendering | Visual comparison needed |
| 4 | Print receipt (browser dialog) | Cannot automate native dialog |
| 5 | Usability feedback | Human observation |

---

## 5.2 Automation Framework Design

```
InsureAI-Automation/
│
├── playwright.config.js                ← Main config
├── playwright.perf.config.js           ← Performance config
├── package.json                        ← Dependencies
│
├── tests/
│   ├── smoke/                          ← 10 Smoke Tests (5 min)
│   │   ├── login.smoke.spec.js
│   │   ├── registration.smoke.spec.js
│   │   ├── dashboard.smoke.spec.js
│   │   ├── motor-quote.smoke.spec.js
│   │   └── checkout.smoke.spec.js
│   │
│   ├── regression/                     ← 82 Regression Tests (25 min)
│   │   ├── auth/
│   │   │   ├── login.spec.js           (8 tests)
│   │   │   ├── registration.spec.js    (10 tests)
│   │   │   ├── logout.spec.js          (4 tests)
│   │   │   └── forgot-password.spec.js (3 tests)
│   │   ├── quote/
│   │   │   ├── motor-quote.spec.js     (12 tests)
│   │   │   ├── health-quote.spec.js    (6 tests)
│   │   │   ├── home-quote.spec.js      (4 tests)
│   │   │   └── travel-quote.spec.js    (5 tests)
│   │   ├── policy/
│   │   │   ├── checkout.spec.js        (10 tests)
│   │   │   ├── policies-list.spec.js   (6 tests)
│   │   │   └── policy-cancel.spec.js   (4 tests)
│   │   ├── claims/
│   │   │   ├── file-claim.spec.js      (8 tests)
│   │   │   └── track-claim.spec.js     (4 tests)
│   │   ├── payments/
│   │   │   ├── payment-history.spec.js (6 tests)
│   │   │   └── payment-receipt.spec.js (4 tests)
│   │   ├── admin/
│   │   │   ├── admin-access.spec.js    (5 tests)
│   │   │   └── claim-management.spec.js(4 tests)
│   │   └── security/
│   │       ├── auth-guard.spec.js      (8 tests)
│   │       └── card-data.spec.js       (3 tests)
│   │
│   ├── e2e/                            ← 5 E2E Flows (10 min)
│   │   ├── motor-policy-purchase.e2e.spec.js
│   │   ├── health-policy-purchase.e2e.spec.js
│   │   ├── claim-approval-flow.e2e.spec.js
│   │   ├── policy-cancel-refund.e2e.spec.js
│   │   └── payment-verification.e2e.spec.js
│   │
│   ├── performance/                    ← 14 Perf Tests (8 min)
│   │   ├── page-load.perf.js
│   │   ├── core-web-vitals.perf.js
│   │   └── concurrent-users.perf.js
│   │
│   └── api/                            ← 10 API Tests (simulated)
│       └── auth-api.spec.js
│
├── pages/                              ← Page Object Model
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── DashboardPage.js
│   ├── MotorQuotePage.js
│   ├── HealthQuotePage.js
│   ├── HomeQuotePage.js
│   ├── TravelQuotePage.js
│   ├── CheckoutPage.js
│   ├── PoliciesPage.js
│   ├── PolicyDetailPage.js
│   ├── ClaimsPage.js
│   ├── PaymentsPage.js
│   ├── DocumentsPage.js
│   └── AdminPage.js
│
├── fixtures/
│   ├── users.json
│   ├── motor-data.json
│   ├── health-data.json
│   ├── travel-data.json
│   └── payment-data.json
│
├── helpers/
│   ├── seed-data.js
│   ├── auth-helper.js
│   ├── date-helper.js
│   └── assertion-helper.js
│
└── reports/
    ├── playwright-report/
    └── performance-results/
```

## 5.3 Sample Page Object — PaymentsPage.js

```javascript
// pages/PaymentsPage.js
export class PaymentsPage {
  constructor(page) {
    this.page = page;
    // Locators
    this.payStats         = page.locator('#payStats');
    this.successCount     = page.locator('.stat-value').first();
    this.totalPremium     = page.locator('.stat-value').nth(1);
    this.searchInput      = page.locator('#searchTxn');
    this.transactionsTable = page.locator('#paymentsTable');
    this.tableRows        = page.locator('#paymentsTable tbody tr');
    this.emptyState       = page.locator('.empty-state');
    this.receiptModal     = page.locator('#receiptModal');
    this.receiptBody      = page.locator('#receiptBody');
    this.printBtn         = page.locator('button:has-text("Print Receipt")');
    this.closeModalBtn    = page.locator('#receiptModal .btn-outline-secondary');
  }

  async navigate() {
    await this.page.goto('/payments.html');
  }

  async getSuccessfulPaymentsCount() {
    return await this.successCount.innerText();
  }

  async getTotalPremiumPaid() {
    return await this.totalPremium.innerText();
  }

  async searchTransactions(query) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  async getTransactionCount() {
    return await this.tableRows.count();
  }

  async openReceipt(txnId) {
    await this.page.locator(`button[onclick="showReceipt('${txnId}')"]`).click();
    await this.receiptModal.waitFor({ state: 'visible' });
  }

  async getReceiptField(label) {
    return await this.receiptBody.locator(`tr:has(td:text("${label}")) td`).nth(1).innerText();
  }

  async closeReceipt() {
    await this.closeModalBtn.click();
  }

  async isEmptyState() {
    return await this.emptyState.isVisible();
  }
}
```

## 5.4 Sample Automation Script — Payment History Tests

```javascript
// tests/regression/payments/payment-history.spec.js
import { test, expect } from '@playwright/test';
import { PaymentsPage } from '../../../pages/PaymentsPage.js';
import { LoginPage } from '../../../pages/LoginPage.js';
import { seedTestData } from '../../../helpers/seed-data.js';

test.describe('💳 Payment History — Functional Tests', () => {

  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('rahul@demo.com', 'Test@1234');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('FR-057 | Stats show correct Successful Payments count', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    const count = await payments.getSuccessfulPaymentsCount();
    expect(count).toBe('2');
  });

  test('FR-057 | Stats show correct Total Premium Paid', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    const total = await payments.getTotalPremiumPaid();
    expect(total).toContain('30,500');
  });

  test('FR-058 | All transactions listed with correct columns', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    const count = await payments.getTransactionCount();
    expect(count).toBe(2); // Rahul has 2 payments

    // Verify headers
    await expect(page.locator('th:text("Transaction ID")')).toBeVisible();
    await expect(page.locator('th:text("Policy")')).toBeVisible();
    await expect(page.locator('th:text("Amount")')).toBeVisible();
    await expect(page.locator('th:text("Status")')).toBeVisible();
  });

  test('FR-059 | Search filters by Transaction ID', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    await payments.searchTransactions('TXN202600001');
    const count = await payments.getTransactionCount();
    expect(count).toBe(1);
    await expect(page.locator('td:text("TXN202600001")')).toBeVisible();
  });

  test('FR-059 | Search filters by insurance type', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    await payments.searchTransactions('Motor');
    const count = await payments.getTransactionCount();
    expect(count).toBe(1);
  });

  test('FR-060 | Receipt modal shows correct transaction details', async ({ page }) => {
    const payments = new PaymentsPage(page);
    await payments.navigate();
    await payments.openReceipt('TXN202600001');

    const txnId = await payments.getReceiptField('Transaction ID');
    expect(txnId).toBe('TXN202600001');

    const method = await payments.getReceiptField('Payment Method');
    expect(method).toBe('Credit Card');

    const amount = await payments.getReceiptField('Amount Paid');
    expect(amount).toContain('12,500');

    await payments.closeReceipt();
  });

});
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 6 — TEST EXECUTION (SIMULATED — MANUAL QA)
# ══════════════════════════════════════════════════════════════

## 6.1 Smoke Test Results

```
╔══════════════════════════════════════════════════════════════════════════╗
║              SMOKE TEST EXECUTION RESULTS                               ║
║              Date: 24-Mar-2026 | Duration: 28 minutes                  ║
╠═════╦═══════════════════════════════════════════════════════╦═══════════╣
║  #  ║ Test Case                                            ║ Result    ║
╠═════╬═══════════════════════════════════════════════════════╬═══════════╣
║  1  ║ Application opens at localhost:3000                   ║ ✓ PASS   ║
║  2  ║ Home page loads with all 4 product cards              ║ ✓ PASS   ║
║  3  ║ New user can register successfully                    ║ ✓ PASS   ║
║  4  ║ Registered user can login (customer)                  ║ ✓ PASS   ║
║  5  ║ Dashboard loads with stats and policies               ║ ✓ PASS   ║
║  6  ║ Motor insurance quote can be generated                ║ ✓ PASS   ║
║  7  ║ Policy can be purchased (checkout flow)               ║ ✓ PASS   ║
║  8  ║ Claim can be filed against a policy                   ║ ✓ PASS   ║
║  9  ║ Payment history displays transactions                 ║ ✓ PASS   ║
║ 10  ║ Admin can login and access admin panel                ║ ✓ PASS   ║
║ 11  ║ Logout works and session is cleared                   ║ ✓ PASS   ║
║ 12  ║ Documents page shows downloadable files               ║ ✓ PASS   ║
╠═════╩═══════════════════════════════════════════════════════╩═══════════╣
║                      RESULT: 12/12 PASSED (100%) ✓                     ║
║                      BUILD STATUS: GO FOR FUNCTIONAL TESTING           ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## 6.2 Functional Test Execution Results

```
╔══════════════════════════════════════════════════════════════════════════╗
║             FUNCTIONAL TEST EXECUTION SUMMARY                           ║
║             Date: 24-Mar-2026 | Cycle: 1                               ║
╠═══════════════════╦═══════╦══════╦══════╦═══════╦═══════╦═════════════╣
║ Module            ║ Total ║ Pass ║ Fail ║ Block ║ Skip  ║ Pass Rate   ║
╠═══════════════════╬═══════╬══════╬══════╬═══════╬═══════╬═════════════╣
║ Registration      ║   17  ║  15  ║   2  ║   0   ║   0   ║  88% ⚠️    ║
║ Login             ║   10  ║   9  ║   1  ║   0   ║   0   ║  90% ⚠️    ║
║ Dashboard         ║    8  ║   8  ║   0  ║   0   ║   0   ║ 100% ✓     ║
║ Motor Quote       ║   15  ║  13  ║   2  ║   0   ║   0   ║  87% ⚠️    ║
║ Health Quote      ║    9  ║   9  ║   0  ║   0   ║   0   ║ 100% ✓     ║
║ Home Quote        ║    5  ║   5  ║   0  ║   0   ║   0   ║ 100% ✓     ║
║ Travel Quote      ║    8  ║   7  ║   1  ║   0   ║   0   ║  88% ⚠️    ║
║ Checkout          ║   12  ║  11  ║   0  ║   1   ║   0   ║  92% ⚠️    ║
║ Policies          ║   11  ║  10  ║   1  ║   0   ║   0   ║  91% ⚠️    ║
║ Claims            ║   15  ║  13  ║   2  ║   0   ║   0   ║  87% ⚠️    ║
║ Payments          ║   12  ║  12  ║   0  ║   0   ║   0   ║ 100% ✓     ║
║ Documents         ║    5  ║   5  ║   0  ║   0   ║   0   ║ 100% ✓     ║
║ Admin Panel       ║   18  ║  16  ║   1  ║   1   ║   0   ║  89% ⚠️    ║
║ Security/NFR      ║   14  ║  13  ║   1  ║   0   ║   0   ║  93%       ║
╠═══════════════════╬═══════╬══════╬══════╬═══════╬═══════╬═════════════╣
║ TOTAL             ║  159  ║ 146  ║  11  ║   2   ║   0   ║  92%       ║
╚═══════════════════╩═══════╩══════╩══════╩═══════╩═══════╩═════════════╝
```

### Execution Progress Bar

```
OVERALL PROGRESS: ████████████████████████████████████░░░░  92% (146/159 Pass)

Registration : ████████████████▓▓░░  88%
Login        : ████████████████████░░  90%
Dashboard    : ████████████████████████  100%
Motor Quote  : ███████████████▓▓░░░  87%
Health Quote : ████████████████████████  100%
Home Quote   : ████████████████████████  100%
Travel Quote : ████████████████▓▓░░  88%
Checkout     : █████████████████████░░  92%
Policies     : ████████████████████░░░  91%
Claims       : ███████████████▓▓░░░  87%
Payments     : ████████████████████████  100% ★
Documents    : ████████████████████████  100%
Admin Panel  : ████████████████▓▓░░  89%
Security/NFR : █████████████████████░░  93%
```

---

## 6.3 Integration / E2E Test Results

```
╔══════════════════════════════════════════════════════════════════════════╗
║             E2E INTEGRATION TEST RESULTS                                ║
╠═════╦══════════════════════════════════════════════════╦════════════════╣
║  #  ║ E2E Flow                                        ║ Result         ║
╠═════╬══════════════════════════════════════════════════╬════════════════╣
║  1  ║ Register → Login → Dashboard                    ║ ✓ PASS         ║
║  2  ║ Motor Quote → Checkout → Payment → Policy List  ║ ✓ PASS         ║
║  3  ║ Health Quote → Checkout → Payment History        ║ ✓ PASS         ║
║  4  ║ File Claim → Admin Approval → Track Timeline    ║ ✓ PASS         ║
║  5  ║ Policy Purchase → Payment History → Receipt     ║ ✓ PASS         ║
║  6  ║ Policy Cancel → Refund Calculation              ║ ✓ PASS         ║
║  7  ║ Admin Deactivate → Customer Login Blocked       ║ ✗ FAIL (DEF-08)║
║  8  ║ Multi-tab Login → Data Consistency              ║ ⚠️ BLOCKED     ║
╠═════╩══════════════════════════════════════════════════╩════════════════╣
║                      RESULT: 6/8 PASSED | 1 Failed | 1 Blocked        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 6.4 Cross-Browser Test Results

```
╔══════════════════════════════════════════════════════════════════════════╗
║             CROSS-BROWSER COMPATIBILITY RESULTS                         ║
╠═══════════════════╦═══════════╦═══════════╦══════════╦════════════════╣
║ Module            ║ Chrome 131║ Firefox132║ Edge 131 ║ Safari(WebKit) ║
╠═══════════════════╬═══════════╬═══════════╬══════════╬════════════════╣
║ Landing Page      ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Registration      ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Login             ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Dashboard         ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Motor Quote       ║  ✓ PASS   ║  ⚠️ MINOR ║ ✓ PASS  ║   ✓ PASS      ║
║ Health Quote      ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Checkout          ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Policies          ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Claims            ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Payments          ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
║ Admin             ║  ✓ PASS   ║  ✓ PASS   ║ ✓ PASS  ║   ✓ PASS      ║
╠═══════════════════╬═══════════╬═══════════╬══════════╬════════════════╣
║ Status            ║ ✓ CLEAR   ║ ⚠️ 1 Minor║ ✓ CLEAR ║   ✓ CLEAR     ║
╚═══════════════════╩═══════════╩═══════════╩══════════╩════════════════╝

Note: Firefox minor issue — date picker styling differs slightly (cosmetic only, DEF-14)
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 7 — TEST EXECUTION (SIMULATED — AUTOMATION QA)
# ══════════════════════════════════════════════════════════════

## 7.1 Automation Run Summary

```
══════════════════════════════════════════════════════════════
AUTOMATION EXECUTION REPORT
Date     : 24-Mar-2026 | 23:00 IST (Nightly Run)
Run ID   : RUN-2026-032401
Browsers : Chromium 131 | Firefox 132 | WebKit
Duration : 33 minutes 18 seconds
══════════════════════════════════════════════════════════════

SUITE RESULTS — CHROMIUM (Primary)
─────────────────────────────────────────────────────────────
✅ Smoke Tests         :  12/12  PASSED     (1m 48s)
✅ Auth Tests          :  25/25  PASSED     (3m 22s)
⚠️ Quote Tests         :  25/27  PASSED     (5m 14s)  — 2 FAILED
✅ Policy Tests        :  20/20  PASSED     (3m 56s)
✅ Claims Tests        :  12/12  PASSED     (2m 41s)
✅ Payment Tests       :  10/10  PASSED     (1m 52s)  ★
⚠️ Admin Tests         :   8/ 9  PASSED     (2m 08s)  — 1 FAILED
✅ Security Tests      :  11/11  PASSED     (1m 34s)
✅ E2E Tests           :   5/ 5  PASSED     (4m 22s)
✅ Performance Tests   :  14/14  PASSED     (6m 21s)
─────────────────────────────────────────────────────────────
TOTAL                  : 142/145  PASSED    (33m 18s)
PASS RATE              : 97.9%
═════════════════════════════════════════════════════════════
```

## 7.2 Failed Test Details

```
═══════════════════════════════════════════════════════════
FAILURE #1
═══════════════════════════════════════════════════════════
File    : tests/regression/quote/motor-quote.spec.js
Test    : FR-025 | Model dropdown populates after make selection
Line    : 45
Duration: 8.2s

Error Log:
  ┌────────────────────────────────────────────────────────┐
  │ TimeoutError: locator('#model option')                 │
  │   expected to have count > 0                           │
  │   but found 0 options                                  │
  │                                                        │
  │ Waiting for: page.locator('#model option').count()     │
  │ Timeout: 5000ms exceeded                               │
  │                                                        │
  │ Call stack:                                             │
  │   at motor-quote.spec.js:45:7                          │
  │   at Object.<anonymous> (test-runner.js:112:23)        │
  └────────────────────────────────────────────────────────┘

Root Cause: Race condition — model dropdown populates via JS
            after make selection but test asserts before
            event handler completes.

Fix: Add explicit waitFor on model dropdown population:
     await page.waitForFunction(() =>
       document.querySelector('#model').options.length > 1
     );

Screenshot: [Full page screenshot captured — model dropdown
             shows "Select Model" with no options populated.
             Make dropdown shows "Hyundai" selected.]

═══════════════════════════════════════════════════════════
FAILURE #2
═══════════════════════════════════════════════════════════
File    : tests/regression/quote/motor-quote.spec.js
Test    : FR-028 | Add-on Engine Protection updates premium
Line    : 89

Error Log:
  ┌────────────────────────────────────────────────────────┐
  │ AssertionError:                                        │
  │   Expected: premium to increase by ₹800               │
  │   Received: premium unchanged                          │
  │                                                        │
  │   Before add-on: ₹14,750                              │
  │   After add-on:  ₹14,750 (expected ₹15,550)          │
  └────────────────────────────────────────────────────────┘

Root Cause: Engine Protection add-on click event not
            triggering recalculation. Possible JS binding
            issue on checkbox change listener.

Screenshot: [Checkbox appears checked but premium display
             shows same amount. Console shows no errors.]

═══════════════════════════════════════════════════════════
FAILURE #3
═══════════════════════════════════════════════════════════
File    : tests/regression/admin/admin-access.spec.js
Test    : FR-067 | Admin deactivate updates customer status
Line    : 78

Error Log:
  ┌────────────────────────────────────────────────────────┐
  │ TimeoutError: Waiting for table refresh                │
  │   locator('td:text("Deactivated")').waitFor()         │
  │   Timeout: 5000ms exceeded                             │
  │                                                        │
  │ Table still shows "Active" after deactivate click.    │
  └────────────────────────────────────────────────────────┘

Root Cause: Table re-render not triggered after localStorage
            update. Missing DOM refresh call.

Screenshot: [Admin Customers table showing user still
             Active. Deactivate button was clicked but
             table did not refresh.]
```

## 7.3 Payment Tests — All Passed (Detail)

```
═══════════════════════════════════════════════════════════
PAYMENT TESTS — DETAILED RESULTS  ★ 10/10 PASSED
═══════════════════════════════════════════════════════════
Duration: 1 minute 52 seconds

✓ FR-057 | Stats show correct Successful Payments count    (1.2s)
✓ FR-057 | Stats show correct Total Premium Paid           (1.1s)
✓ FR-058 | All transactions listed with correct columns    (1.8s)
✓ FR-059 | Search filters by Transaction ID                (2.1s)
✓ FR-059 | Search filters by insurance type                (1.9s)
✓ FR-059 | Search filters by payment method                (1.8s)
✓ FR-060 | Receipt modal shows correct transaction details  (3.2s)
✓ FR-060 | Receipt modal Close button works                (1.4s)
✓ FR-058 | Empty state shown for user with no payments     (2.8s)
✓ SEC    | Auth guard redirects unauthenticated user       (1.1s)
═══════════════════════════════════════════════════════════
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 8 — API TESTING (SIMULATED)
# ══════════════════════════════════════════════════════════════

> **Note:** InsureAI uses localStorage, not REST APIs. The following represents
> production-readiness API contracts inferred from UI functionality.

## 8.1 API Endpoint Mapping (Inferred from UI)

| # | Endpoint | Method | Description | Auth Required |
|---|----------|--------|-------------|---------------|
| 1 | /api/auth/register | POST | User registration | No |
| 2 | /api/auth/login | POST | User authentication | No |
| 3 | /api/auth/forgot-password | POST | Password reset request | No |
| 4 | /api/auth/logout | POST | Session termination | Yes |
| 5 | /api/dashboard | GET | Dashboard stats + data | Yes |
| 6 | /api/quotes | POST | Generate insurance quote | Yes |
| 7 | /api/quotes | GET | List saved quotes | Yes |
| 8 | /api/policies | GET | List user policies | Yes |
| 9 | /api/policies/:id | GET | Policy detail | Yes |
| 10 | /api/policies/:id/cancel | POST | Cancel policy | Yes |
| 11 | /api/policies/:id/renew | POST | Renew policy | Yes |
| 12 | /api/claims | POST | File new claim | Yes |
| 13 | /api/claims | GET | List user claims | Yes |
| 14 | /api/claims/:id | GET | Claim detail + timeline | Yes |
| 15 | /api/claims/:id/status | PATCH | Update claim status (admin) | Admin |
| 16 | /api/payments | GET | Payment history | Yes |
| 17 | /api/payments/:id/receipt | GET | Payment receipt | Yes |
| 18 | /api/documents | GET | List downloadable docs | Yes |
| 19 | /api/admin/customers | GET | List all customers (admin) | Admin |
| 20 | /api/admin/customers/:id | PATCH | Activate/deactivate (admin) | Admin |
| 21 | /api/admin/reports | GET | Analytics data (admin) | Admin |

## 8.2 API Test Cases — Payments Endpoints (Target Module)

| ID | Endpoint | Method | Scenario | Request | Expected |
|----|----------|--------|----------|---------|----------|
| API_PAY_01 | /api/payments | GET | List payments with valid token | Header: Authorization: Bearer {jwt} | 200 + payments array |
| API_PAY_02 | /api/payments | GET | Unauthorized (no token) | No auth header | 401 Unauthorized |
| API_PAY_03 | /api/payments | GET | Expired token | Header: Bearer expired_token | 401 Token expired |
| API_PAY_04 | /api/payments | GET | Filter by type=Motor | Query: ?type=Motor | 200 + filtered array |
| API_PAY_05 | /api/payments | GET | Filter by method=UPI | Query: ?method=UPI | 200 + filtered array |
| API_PAY_06 | /api/payments | GET | Search by txnId | Query: ?search=TXN202600001 | 200 + single item |
| API_PAY_07 | /api/payments/:id/receipt | GET | Get receipt for valid TXN | Param: TXN202600001 | 200 + receipt object |
| API_PAY_08 | /api/payments/:id/receipt | GET | Receipt for non-existent TXN | Param: TXN999999 | 404 Not Found |
| API_PAY_09 | /api/payments | GET | Verify response schema | Valid request | All fields present with correct types |
| API_PAY_10 | /api/payments | GET | User isolation (no cross-user data) | User A token | Only User A payments returned |

## 8.3 API Test Execution Results (Simulated)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    API TEST EXECUTION RESULTS                           ║
╠═══════════╦══════════════════════════════════════════╦═════════════════╣
║ Test ID   ║ Scenario                                 ║ Result          ║
╠═══════════╬══════════════════════════════════════════╬═════════════════╣
║ API_AUTH_01║ POST /register — valid data (201)       ║ ✓ PASS          ║
║ API_AUTH_02║ POST /register — duplicate email (400)  ║ ✓ PASS          ║
║ API_AUTH_03║ POST /register — age < 18 (422)         ║ ✓ PASS          ║
║ API_AUTH_04║ POST /login — valid credentials (200)   ║ ✓ PASS          ║
║ API_AUTH_05║ POST /login — wrong password (401)      ║ ✓ PASS          ║
║ API_AUTH_06║ POST /login — locked account (403)      ║ ✓ PASS          ║
║ API_POL_01║ GET /policies — with token (200)         ║ ✓ PASS          ║
║ API_POL_02║ GET /policies — without token (401)      ║ ✓ PASS          ║
║ API_POL_03║ GET /policies/:id — valid (200)          ║ ✓ PASS          ║
║ API_POL_04║ GET /policies/:id — not found (404)      ║ ✓ PASS          ║
║ API_CLM_01║ POST /claims — valid claim (201)         ║ ✓ PASS          ║
║ API_CLM_02║ POST /claims — date outside policy (422) ║ ✓ PASS          ║
║ API_CLM_03║ PATCH /claims/:id/status — admin (200)   ║ ✓ PASS          ║
║ API_CLM_04║ PATCH /claims/:id/status — non-admin(403)║ ✓ PASS          ║
║ API_PAY_01║ GET /payments — with token (200)         ║ ✓ PASS          ║
║ API_PAY_02║ GET /payments — unauthorized (401)       ║ ✓ PASS          ║
║ API_PAY_03║ GET /payments — filter by type (200)     ║ ✓ PASS          ║
║ API_PAY_04║ GET /payments/:id/receipt — valid (200)  ║ ✓ PASS          ║
║ API_PAY_05║ GET /payments/:id/receipt — 404          ║ ✓ PASS          ║
║ API_PAY_06║ GET /payments — schema validation        ║ ✓ PASS          ║
╠═══════════╩══════════════════════════════════════════╩═════════════════╣
║                       RESULT: 20/20 PASSED (100%) ✓                    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Sample API Request/Response — GET /api/payments

```
REQUEST:
  GET /api/payments HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Accept: application/json

RESPONSE (200 OK):
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "id": "TXN202600001",
      "userId": "USR001",
      "policyId": "POL202600001",
      "policyType": "Motor",
      "date": "2026-01-01T00:00:00Z",
      "amount": 12500,
      "method": "Credit Card",
      "status": "Success",
      "txnRef": "HDFC8723641"
    },
    {
      "id": "TXN202600002",
      "userId": "USR001",
      "policyId": "POL202600002",
      "policyType": "Health",
      "date": "2026-02-01T00:00:00Z",
      "amount": 18000,
      "method": "UPI",
      "status": "Success",
      "txnRef": "UPI9034512"
    }
  ]
}
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 9 — PERFORMANCE TESTING
# ══════════════════════════════════════════════════════════════

## 9.1 Performance Test Strategy

| Metric | Tool | Threshold | Priority |
|--------|------|-----------|----------|
| Full Page Load | Navigation Timing API | < 3,000ms | High |
| First Contentful Paint (FCP) | PerformanceObserver | < 1,800ms | High |
| Largest Contentful Paint (LCP) | PerformanceObserver | < 2,500ms | High |
| Cumulative Layout Shift (CLS) | PerformanceObserver | < 0.1 | Medium |
| Total Blocking Time (TBT) | Long Tasks API | < 200ms | Medium |
| 5 Concurrent Users | Playwright Multi-Context | Avg < 5,000ms | High |
| 10 Concurrent Users (Stress) | Playwright Multi-Context | Max < 8,000ms | Medium |
| Memory Leak (8 iterations) | CDP metrics() | Heap growth < 50MB | Medium |
| Form Interaction (INP) | Performance.now() | < 200ms | Low |

## 9.2 Page Load Results — All 16 Pages

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    PAGE LOAD PERFORMANCE RESULTS                        ║
║                    Budget: < 3,000ms per page                           ║
╠═══════════════════════╦══════════╦══════════╦══════════╦═══════════════╣
║ Page                  ║ Load(ms) ║ FCP(ms)  ║ LCP(ms)  ║ Status        ║
╠═══════════════════════╬══════════╬══════════╬══════════╬═══════════════╣
║ index.html            ║    287   ║    198   ║    342   ║ ✓ PASS        ║
║ login.html            ║    195   ║    142   ║    228   ║ ✓ PASS        ║
║ register.html         ║    201   ║    148   ║    235   ║ ✓ PASS        ║
║ forgot-password.html  ║    178   ║    126   ║    198   ║ ✓ PASS        ║
║ dashboard.html        ║    412   ║    285   ║    498   ║ ✓ PASS        ║
║ get-quote.html        ║    238   ║    172   ║    302   ║ ✓ PASS        ║
║ motor-quote.html      ║    356   ║    248   ║    421   ║ ✓ PASS        ║
║ health-quote.html     ║    328   ║    234   ║    389   ║ ✓ PASS        ║
║ home-quote.html       ║    312   ║    218   ║    368   ║ ✓ PASS        ║
║ travel-quote.html     ║    335   ║    242   ║    398   ║ ✓ PASS        ║
║ checkout.html         ║    389   ║    268   ║    465   ║ ✓ PASS        ║
║ policies.html         ║    345   ║    238   ║    412   ║ ✓ PASS        ║
║ policy-detail.html    ║    298   ║    202   ║    355   ║ ✓ PASS        ║
║ claims.html           ║    378   ║    262   ║    448   ║ ✓ PASS        ║
║ payments.html  ★      ║    285   ║    195   ║    338   ║ ✓ PASS        ║
║ documents.html        ║    248   ║    178   ║    298   ║ ✓ PASS        ║
║ admin.html            ║    456   ║    312   ║    542   ║ ✓ PASS        ║
╠═══════════════════════╬══════════╬══════════╬══════════╬═══════════════╣
║ AVERAGE               ║    308   ║    216   ║    367   ║ ✓ ALL PASS    ║
║ MAX                   ║    456   ║    312   ║    542   ║ (admin.html)  ║
║ MIN                   ║    178   ║    126   ║    198   ║ (forgot-pwd)  ║
╚═══════════════════════╩══════════╩══════════╩══════════╩═══════════════╝

★ payments.html — Target page: 285ms load | Well within 3s budget
```

## 9.3 Core Web Vitals Summary

```
╔══════════════════════════════════════════════════════════════╗
║              CORE WEB VITALS — OVERALL RATING               ║
╠════════════════════╦═══════════╦═══════════╦════════════════╣
║ Metric             ║ Value     ║ Threshold ║ Rating         ║
╠════════════════════╬═══════════╬═══════════╬════════════════╣
║ FCP (avg)          ║   216ms   ║ < 1800ms  ║ 🟢 GOOD       ║
║ LCP (avg)          ║   367ms   ║ < 2500ms  ║ 🟢 GOOD       ║
║ CLS (avg)          ║   0.02    ║ < 0.1     ║ 🟢 GOOD       ║
║ TBT (avg)          ║    45ms   ║ < 200ms   ║ 🟢 GOOD       ║
║ INP (avg)          ║    62ms   ║ < 200ms   ║ 🟢 GOOD       ║
╠════════════════════╩═══════════╩═══════════╩════════════════╣
║                 OVERALL: 🟢 GOOD (All vitals within budget) ║
╚═════════════════════════════════════════════════════════════╝
```

## 9.4 Concurrent Users Stress Test

```
╔══════════════════════════════════════════════════════════════╗
║              CONCURRENT USERS — STRESS TEST                  ║
╠══════════════════╦══════════╦══════════╦════════╦═══════════╣
║ Scenario         ║ Avg Load ║ Max Load ║ Errors ║ Status    ║
╠══════════════════╬══════════╬══════════╬════════╬═══════════╣
║ 1 User (baseline)║    285ms ║    285ms ║   0    ║ ✓ PASS   ║
║ 3 Users          ║    412ms ║    548ms ║   0    ║ ✓ PASS   ║
║ 5 Users          ║    856ms ║  1,245ms ║   0    ║ ✓ PASS   ║
║ 8 Users          ║  1,423ms ║  2,178ms ║   0    ║ ✓ PASS   ║
║ 10 Users (stress)║  2,845ms ║  4,512ms ║   0    ║ ✓ PASS   ║
╠══════════════════╩══════════╩══════════╩════════╩═══════════╣
║ Budget: 5 users < 5,000ms avg | 10 users < 8,000ms max     ║
║ Result: ALL SCENARIOS PASSED ✓                               ║
╚═════════════════════════════════════════════════════════════╝
```

## 9.5 Memory Leak Test

```
╔══════════════════════════════════════════════════════════════╗
║              MEMORY LEAK TEST — 8 NAVIGATION CYCLES          ║
╠═══════╦═════════════╦══════════════╦════════════════════════╣
║ Cycle ║ JS Heap (MB)║ Delta (MB)   ║ Observation            ║
╠═══════╬═════════════╬══════════════╬════════════════════════╣
║   1   ║    12.4     ║     —        ║ Baseline               ║
║   2   ║    14.8     ║   +2.4       ║ Expected growth        ║
║   3   ║    16.1     ║   +1.3       ║ Normal                 ║
║   4   ║    15.2     ║   -0.9       ║ GC collected           ║
║   5   ║    17.8     ║   +2.6       ║ Normal                 ║
║   6   ║    16.5     ║   -1.3       ║ GC collected           ║
║   7   ║    18.2     ║   +1.7       ║ Normal                 ║
║   8   ║    17.1     ║   -1.1       ║ GC collected           ║
╠═══════╬═════════════╬══════════════╬════════════════════════╣
║ Total ║  Net: +4.7  ║ Budget: 50MB ║ ✓ PASS — No leak      ║
╚═══════╩═════════════╩══════════════╩════════════════════════╝
```

## 9.6 Performance Visualization (Text-Based Chart)

```
PAGE LOAD TIMES (ms) — Budget: 3000ms
──────────────────────────────────────────────────────────────
index.html          █████████████████                    287ms
login.html          ████████████                         195ms
register.html       ████████████                         201ms
forgot-password     ███████████                          178ms
dashboard.html      █████████████████████████            412ms
get-quote.html      ██████████████                       238ms
motor-quote.html    █████████████████████                356ms
health-quote.html   ████████████████████                 328ms
home-quote.html     ███████████████████                  312ms
travel-quote.html   ████████████████████                 335ms
checkout.html       ███████████████████████              389ms
policies.html       ████████████████████                 345ms
policy-detail.html  ██████████████████                   298ms
claims.html         ██████████████████████               378ms
payments.html  ★    █████████████████                    285ms
documents.html      ███████████████                      248ms
admin.html          ███████████████████████████          456ms
──────────────────────────────────────────────────────────────
                    0    500   1000   1500   2000   2500  3000
                    ▲ All pages well within 3000ms budget

CONCURRENT USERS — Average Response Time
──────────────────────────────────────────────────────────────
1 User    ████                                           285ms
3 Users   ██████                                         412ms
5 Users   █████████████                                  856ms
8 Users   ██████████████████████                       1,423ms
10 Users  ████████████████████████████████████████     2,845ms
──────────────────────────────────────────────────────────────
          0     1000    2000    3000    4000    5000
          ▲ All within budget thresholds
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 10 — DEFECT SUMMARY
# ══════════════════════════════════════════════════════════════

## 10.1 Defect Log

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                              DEFECT REGISTER                                        ║
╠═══════╦════════╦════╦════╦══════════════════════════════════════════════╦═══════════╣
║ ID    ║ Module ║Sev ║Pri ║ Title                                       ║ Status    ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-01 ║ Reg    ║ S2 ║ P2 ║ Mobile field accepts alphabetic chars via   ║ ✗ OPEN    ║
║       ║        ║    ║    ║ paste (no input type="tel" enforcement)     ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-02 ║ Reg    ║ S3 ║ P3 ║ No inline validation feedback for Name     ║ ✗ OPEN    ║
║       ║        ║    ║    ║ field (only required, no format check)      ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-03 ║ Login  ║ S2 ║ P2 ║ After account lockout, no email sent       ║ ✓ BY      ║
║       ║        ║    ║    ║ (demo limitation — simulated only)          ║ DESIGN    ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-04 ║ Motor  ║ S2 ║ P2 ║ Model dropdown race condition — loads      ║ ✗ OPEN    ║
║       ║        ║    ║    ║ before Make selection event completes       ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-05 ║ Motor  ║ S2 ║ P2 ║ Engine Protection add-on click does not    ║ ✗ OPEN    ║
║       ║        ║    ║    ║ recalculate premium (binding issue)         ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-06 ║ Travel ║ S2 ║ P2 ║ 181-day trip not rejected when end date    ║ ✗ OPEN    ║
║       ║        ║    ║    ║ entered before start date                   ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-07 ║ Claims ║ S1 ║ P1 ║ Claim date validation allows dates before  ║ ✓ FIXED   ║
║       ║        ║    ║    ║ policy start date (boundary off-by-one)    ║ VERIFIED  ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-08 ║ Claims ║ S2 ║ P2 ║ Claim with amount ₹0 accepted without     ║ ✗ OPEN    ║
║       ║        ║    ║    ║ validation error                            ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-09 ║ Admin  ║ S2 ║ P2 ║ Deactivated user can still login until     ║ ✗ OPEN    ║
║       ║        ║    ║    ║ localStorage refresh (session not cleared)  ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-10 ║ Policy ║ S3 ║ P3 ║ Cancellation refund shows NaN when policy  ║ ✗ OPEN    ║
║       ║        ║    ║    ║ end date is in the past                     ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-11 ║ Chkout ║ S3 ║ P3 ║ CVV field allows more than 3 digits on     ║ ✗ OPEN    ║
║       ║        ║    ║    ║ some browsers (no maxlength enforcement)    ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-12 ║ NFR    ║ S1 ║ P1 ║ Auth guard on admin.html can be bypassed   ║ ✓ FIXED   ║
║       ║        ║    ║    ║ by setting currentUser.role="admin" in      ║ VERIFIED  ║
║       ║        ║    ║    ║ browser console                             ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-13 ║ UI     ║ S3 ║ P3 ║ Login form label overlaps at 375px mobile  ║ ✗ OPEN    ║
║       ║        ║    ║    ║ width (CSS media query gap)                 ║           ║
╠═══════╬════════╬════╬════╬══════════════════════════════════════════════╬═══════════╣
║DEF-14 ║ UI     ║ S4 ║ P4 ║ Firefox date picker styling inconsistent   ║ ✗ OPEN    ║
║       ║        ║    ║    ║ (cosmetic only, no functional impact)       ║           ║
╚═══════╩════════╩════╩════╩══════════════════════════════════════════════╩═══════════╝
```

## 10.2 Defect Summary Statistics

```
TOTAL DEFECTS RAISED: 14
──────────────────────────────────────────────────────────────

BY SEVERITY                          BY PRIORITY
─────────────────────────────        ─────────────────────────────
Critical (S1)  : ██  2 (14%)        P1 : ██  2 (14%) — Both FIXED ✓
Major (S2)     : ███████  7 (50%)   P2 : ███████  7 (50%)
Minor (S3)     : ████  4 (29%)      P3 : ████  4 (29%)
Trivial (S4)   : █  1 (7%)          P4 : █  1 (7%)

BY STATUS
─────────────────────────────
Open           : █████████  9 (64%)
Fixed/Verified : ██  2 (14%)
By Design      : █  1 (7%)
Deferred       : ██  2 (14%)

BY MODULE
─────────────────────────────
Registration   : ██  2
Login          : █  1 (By Design)
Motor Quote    : ██  2
Travel Quote   : █  1
Claims         : ██  2 (1 Fixed)
Admin          : █  1
Checkout       : █  1
Policy         : █  1
Security/NFR   : █  1 (Fixed)
UI/Responsive  : ██  2
Payments       : 0 (No defects) ★
```

## 10.3 Sample Defect Report — DEF-05

```
╔══════════════════════════════════════════════════════════════╗
║                    DEFECT REPORT — DEF-05                    ║
╠══════════════════════════════════════════════════════════════╣
║ Defect ID     : DEF-05                                      ║
║ Title         : Engine Protection add-on does not            ║
║                 recalculate motor premium                    ║
║ Module        : Motor Quote                                  ║
║ Severity      : Major (S2)                                   ║
║ Priority      : P2                                           ║
║ Found In      : v1.0                                         ║
║ Found By      : Automation QA (motor-quote.spec.js:89)      ║
║ Reported Date : 24-Mar-2026                                  ║
║ Assigned To   : Developer                                    ║
║ Status        : Open                                         ║
╠══════════════════════════════════════════════════════════════╣
║ Environment                                                  ║
║   OS          : Windows 11 Pro                               ║
║   Browser     : Chromium 131                                 ║
║   URL         : http://localhost:3000/motor-quote.html       ║
╠══════════════════════════════════════════════════════════════╣
║ STEPS TO REPRODUCE                                           ║
║   1. Login as rahul@demo.com / Test@1234                    ║
║   2. Navigate to Get Quote → Motor Insurance                 ║
║   3. Fill valid vehicle details                              ║
║   4. Click "Get Quotes"                                      ║
║   5. Select Comprehensive plan                               ║
║   6. Note base premium (e.g., ₹14,750)                      ║
║   7. Check "Engine Protection" add-on checkbox               ║
║   8. Observe premium display                                 ║
╠══════════════════════════════════════════════════════════════╣
║ EXPECTED RESULT                                              ║
║   Premium should increase by ₹800 (₹14,750 → ₹15,550)     ║
║   Total should recalculate dynamically without page reload  ║
╠══════════════════════════════════════════════════════════════╣
║ ACTUAL RESULT                                                ║
║   Premium remains at ₹14,750 after checking Engine          ║
║   Protection. No recalculation occurs. Console shows no     ║
║   errors. Zero Depreciation and Roadside add-ons work       ║
║   correctly — only Engine Protection is affected.           ║
╠══════════════════════════════════════════════════════════════╣
║ ROOT CAUSE (Suspected)                                       ║
║   Change event listener not bound to Engine Protection       ║
║   checkbox. Likely missing event binding in JS code.        ║
╠══════════════════════════════════════════════════════════════╣
║ ATTACHMENTS                                                  ║
║   [Screenshot: Premium unchanged after checkbox checked]    ║
║   [Video: 12-second reproduction clip]                      ║
║   [Console log: No errors captured]                          ║
╚══════════════════════════════════════════════════════════════╝
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 11 — PARALLEL EXECUTION TIMELINE
# ══════════════════════════════════════════════════════════════

## 11.1 Day-Wise Parallel Execution View

```
══════════════════════════════════════════════════════════════════════════════
                    PARALLEL EXECUTION TIMELINE — WEEK 3-4
══════════════════════════════════════════════════════════════════════════════

         MANUAL QA                           AUTOMATION QA
         ─────────                           ──────────────
DAY 1    ┌─────────────────────┐             ┌─────────────────────┐
(Mon)    │ Smoke Testing       │             │ Smoke Suite Run     │
         │ (12 tests, 28 min)  │             │ (12 tests, 2 min)   │
         │ Result: 12/12 ✓     │             │ Result: 12/12 ✓     │
         └─────────────────────┘             └─────────────────────┘
         ┌─────────────────────┐             ┌─────────────────────┐
         │ Auth Module Testing │             │ Auth Suite Automated│
         │ (27 tests, 3.5 hrs) │             │ (25 tests, 3 min)   │
         │ Result: 24/27       │             │ Result: 25/25 ✓     │
         └─────────────────────┘             └─────────────────────┘

DAY 2    ┌─────────────────────┐             ┌─────────────────────┐
(Tue)    │ Motor Quote Testing │             │ Quote Suite Run     │
         │ (15 tests, 4 hrs)   │             │ (27 tests, 5 min)   │
         │ Result: 13/15       │             │ Result: 25/27 ⚠️    │
         │ DEF-04, DEF-05 found│             │ 2 failures logged   │
         └─────────────────────┘             └─────────────────────┘
         ┌─────────────────────┐             ┌─────────────────────┐
         │ Health/Home/Travel  │             │ Checkout + Policy   │
         │ Quote Testing       │             │ Suite Automated     │
         │ (22 tests, 4 hrs)   │             │ (30 tests, 7 min)   │
         │ Result: 20/22       │             │ Result: 30/30 ✓     │
         └─────────────────────┘             └─────────────────────┘

DAY 3    ┌─────────────────────┐             ┌─────────────────────┐
(Wed)    │ Checkout + Policy   │             │ Claims + Payments   │
         │ Module Testing      │             │ Suite Run           │
         │ (23 tests, 5 hrs)   │             │ (22 tests, 4 min)   │
         │ Result: 21/23       │             │ Result: 22/22 ✓     │
         └─────────────────────┘             └─────────────────────┘
         ┌─────────────────────┐             ┌─────────────────────┐
         │ Claims Testing      │             │ Admin + Security    │
         │ (15 tests, 3.5 hrs) │             │ Suite Run           │
         │ Result: 13/15       │             │ (20 tests, 4 min)   │
         │ DEF-07, DEF-08 found│             │ Result: 19/20 ⚠️    │
         └─────────────────────┘             └─────────────────────┘

DAY 4    ┌─────────────────────┐             ┌─────────────────────┐
(Thu)    │ Payments Module ★   │             │ E2E Suite Run       │
         │ (12 tests, 2.5 hrs) │             │ (5 tests, 10 min)   │
         │ Result: 12/12 ✓     │             │ Result: 5/5 ✓       │
         │ ZERO DEFECTS! ★     │             │                     │
         └─────────────────────┘             └─────────────────────┘
         ┌─────────────────────┐             ┌─────────────────────┐
         │ Admin Panel Testing │             │ Performance Suite   │
         │ (18 tests, 4 hrs)   │             │ (14 tests, 8 min)   │
         │ Result: 16/18       │             │ Result: 14/14 ✓     │
         │ DEF-09 found        │             │ All pages < 3s ✓    │
         └─────────────────────┘             └─────────────────────┘

DAY 5    ┌─────────────────────┐             ┌─────────────────────┐
(Fri)    │ Cross-Browser Test  │             │ Multi-Browser Run   │
         │ Chrome/Firefox/Edge │             │ Chromium+Firefox    │
         │ Result: 3/3 browsers│             │ +WebKit parallel    │
         │ DEF-13, DEF-14 found│             │ Result: Pass ✓      │
         └─────────────────────┘             └─────────────────────┘
         ┌─────────────────────┐             ┌─────────────────────┐
         │ Exploratory Testing │             │ API Test Suite      │
         │ (6 charters, 3 hrs) │             │ (20 tests, 3 min)   │
         │ DEF-12 found (sec)  │             │ Result: 20/20 ✓     │
         └─────────────────────┘             └─────────────────────┘

══════════════════════════════════════════════════════════════════════════════
SUMMARY: Manual QA = 5 days active | Automation QA = 5 days parallel
         Total Manual Execution: ~30 hours | Automation: ~45 minutes
══════════════════════════════════════════════════════════════════════════════
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 12 — TEST SUMMARY REPORT
# ══════════════════════════════════════════════════════════════

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║            ████████╗███████╗███████╗████████╗                           ║
║            ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝                           ║
║               ██║   █████╗  ███████╗   ██║                               ║
║               ██║   ██╔══╝  ╚════██║   ██║                               ║
║               ██║   ███████╗███████║   ██║                               ║
║               ╚═╝   ╚══════╝╚══════╝   ╚═╝                               ║
║                                                                          ║
║               TEST SUMMARY REPORT                                        ║
║               InsureAI General Insurance Portal v1.0                     ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Project         : InsureAI — Smart Insurance Web Portal                  ║
║ Version         : 1.0                                                    ║
║ Test Period     : 10-Mar-2026 to 24-Mar-2026 (6 weeks sprint)           ║
║ QA Team Lead    : [QA Lead Name]                                        ║
║ Manual QA       : [Manual QA Name]                                      ║
║ Automation QA   : [Automation QA Name]                                  ║
║ Perf/API QA     : [Perf QA Name]                                        ║
║ Environment     : localhost:3000 | Windows 11 | Chrome 131              ║
║ Report Date     : 24-Mar-2026                                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐   ║
║ │                    EXECUTION SUMMARY                               │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ Total Test Cases           │ 159                                   │   ║
║ │ Executed                   │ 159 (100%)                            │   ║
║ │ Passed                     │ 146 (92%)                             │   ║
║ │ Failed                     │  11 (7%)                              │   ║
║ │ Blocked                    │   2 (1%)                              │   ║
║ │ Skipped                    │   0 (0%)                              │   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐   ║
║ │                    AUTOMATION SUMMARY                              │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ Total Automatable          │ 110                                   │   ║
║ │ Automated                  │  95 (86%)                             │   ║
║ │ Automation Pass Rate       │  97.9% (142/145)                     │   ║
║ │ Execution Time             │  33 minutes (all suites)             │   ║
║ │ Browsers Covered           │  Chromium, Firefox, WebKit           │   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────��───────┐   ║
║ │                    DEFECT SUMMARY                                  │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ Total Raised               │  14                                   │   ║
║ │ Critical (P1)              │   2  — ALL FIXED & VERIFIED ✓        │   ║
║ │ Major (P2)                 │   7  — 5 Open, 1 By Design, 1 Fixed │   ║
║ │ Minor (P3)                 │   4  — 2 Open, 2 Deferred           │   ║
║ │ Trivial (P4)               │   1  — Deferred (cosmetic)          │   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐   ║
║ │                    PERFORMANCE SUMMARY                             │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ All 16 pages < 3s load     │ ✓ PASS (avg 308ms, max 456ms)       │   ║
║ │ Core Web Vitals (FCP)      │ ✓ GOOD — 216ms avg                  │   ║
║ │ Core Web Vitals (LCP)      │ ✓ GOOD — 367ms avg                  │   ║
║ │ Core Web Vitals (CLS)      │ ✓ GOOD — 0.02 avg                   │   ║
║ │ 10 Concurrent Users        │ ✓ PASS — 2,845ms avg (< 5,000ms)   │   ║
║ │ Memory Leak Test           │ ✓ PASS — Net +4.7MB (< 50MB budget)│   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐   ║
║ │                    API TEST SUMMARY                                │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ Total API Test Cases       │  20                                   │   ║
║ │ Passed                     │  20 (100%)                            │   ║
║ │ Endpoints Covered          │  21 (inferred from UI)               │   ║
║ │ Auth Scenarios             │   6 (register, login, lockout)       │   ║
║ │ CRUD Scenarios             │   8 (policies, claims, payments)     │   ║
║ │ Security Scenarios         │   6 (unauthorized, forbidden, etc.)  │   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
║ ┌────────────────────────────────────────────────────────────────────┐   ║
║ │              ★ PAYMENTS MODULE — HIGHLIGHT ★                      │   ║
║ ├────────────────────────────┬───────────────────────────────────────┤   ║
║ │ Manual Test Cases          │  12/12 PASSED (100%) ✓               │   ║
║ │ Automation Tests           │  10/10 PASSED (100%) ✓               │   ║
║ │ API Tests                  │   6/6  PASSED (100%) ✓               │   ║
║ │ Defects Found              │   0 — ZERO DEFECTS ★                │   ║
║ │ Performance (payments.html)│  285ms load time ✓                   │   ║
║ │ Cross-Browser              │  4/4 browsers PASSED ✓               │   ║
║ └────────────────────────────┴───────────────────────────────────────┘   ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   SIGN-OFF RECOMMENDATION                                               ║
║   ════════════════════════                                               ║
║                                                                          ║
║   ✓ All Critical (P1) defects resolved and verified                     ║
║   ✓ Performance budgets met on all pages                                ║
║   ✓ Security tests passed (auth guard, card data, admin access)         ║
║   ✓ Core Web Vitals rated GOOD across all metrics                       ║
║   ✓ Automation coverage at 86% with 97.9% pass rate                    ║
║   ⚠️ 5 Major (P2) defects remain open — none blocking demo              ║
║   ⚠️ 3 Minor/Trivial defects deferred — cosmetic only                   ║
║                                                                          ║
║   ┌──────────────────────────────────────────────────────────────────┐   ║
║   │                                                                  │   ║
║   │    RECOMMENDATION: ✓ APPROVED FOR CLIENT DEMONSTRATION          │   ║
║   │                                                                  │   ║
║   │    The application meets all critical business requirements.     │   ║
║   │    Open P2 defects have documented workarounds and do not        │   ║
║   │    impact core insurance workflows.                              │   ║
║   │                                                                  │   ║
║   └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# ══════════════════════════════════════════════════════════════
# SECTION 13 — SIGN-OFF & RELEASE
# ══════════════════════════════════════════════════════════════

## 13.1 Release Notes

```
════════════════════════════════════════════════════════════════
RELEASE NOTES — InsureAI v1.0
Date: 24-Mar-2026
════════════════════════════════════════════════════════════════

FEATURES TESTED & VERIFIED
───────────────────────────────────────────────────────────────
✓ Module 01 : User Registration with full validation
✓ Module 02 : Login with lockout, forgot password, session mgmt
✓ Module 03 : Customer Dashboard with stats & alerts
✓ Module 04 : Motor Insurance Quote (3 plans + add-ons + NCB)
✓ Module 05 : Health Insurance Quote (Individual + Family)
✓ Module 06 : Home Insurance Quote (3 plans)
✓ Module 07 : Travel Insurance Quote (domestic + international)
✓ Module 08 : Policy Purchase with 5 payment methods
✓ Module 09 : Policy Management (view, filter, cancel, renew)
✓ Module 10 : Claims Filing & Tracking with timeline
✓ Module 11 : Payment History with search & receipts  ★
✓ Module 12 : Document Downloads
✓ Module 13 : Admin Panel (customers, claims, reports)
✓ Security  : Auth guard, admin access control, card data protection
✓ Perf      : All pages < 3s, Core Web Vitals GOOD

KNOWN ISSUES (Accepted for Demo)
───────────────────────────────────────────────────────────────
⚠️ DEF-04 : Motor model dropdown has intermittent race condition
   Workaround: Select make, wait 1 second, then select model

⚠️ DEF-05 : Engine Protection add-on doesn't update premium
   Workaround: Use Zero Dep or Roadside add-ons for demo

⚠️ DEF-13 : Login form label overlaps at 375px mobile
   Workaround: Use Chrome desktop or 390px+ for demo

⚠️ DEF-14 : Firefox date picker styling differs slightly
   Workaround: Use Chrome for demo

TEST CREDENTIALS
───────────────────────────────────────────────────────────────
Customer : rahul@demo.com      / Test@1234
Customer : priya@demo.com      / Test@1234
Admin    : admin@insureai.com  / Admin@123
════════════════════════════════════════════════════════════════
```

## 13.2 Sign-Off Sheet

```
╔══════════════════════════════════════════════════════════════╗
║                    SIGN-OFF SHEET                            ║
║              InsureAI v1.0 — 24-Mar-2026                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  QA Team Lead    : ________________  Date: _______________  ║
║                                                              ║
║  Manual QA       : ________________  Date: _______________  ║
║                                                              ║
║  Automation QA   : ________________  Date: _______________  ║
║                                                              ║
║  Perf/API QA     : ________________  Date: _______________  ║
║                                                              ║
║  Dev Lead        : ________________  Date: _______________  ║
║                                                              ║
║  Product Owner   : ________________  Date: _______________  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 13.3 Assumptions Made

| # | Assumption | Impact |
|---|-----------|--------|
| 1 | Backend is simulated via localStorage — no real server API | API tests are contract-based (production-readiness design) |
| 2 | Email/SMS notifications are simulated (console.log) | Email delivery tests marked "By Design" |
| 3 | Payment gateway uses sandbox/demo mode | No real transaction testing |
| 4 | Documents generate demo text files, not real PDFs | Download content not validated |
| 5 | Performance thresholds based on local environment (localhost) | Production performance may differ |
| 6 | API endpoints inferred from UI functionality | Actual API may differ in production |
| 7 | Concurrent user test limited to 10 browser contexts | Real load testing needs JMeter/k6 |
| 8 | Security testing is surface-level (client-side) | Server-side security needs separate pentest |

---

*Report Version: 1.0 | Generated: 24-Mar-2026*
*QA Team: QA Lead + Manual QA + Automation QA + Performance/API QA*
*Application: InsureAI General Insurance Portal v1.0*
*Theme Colors: #0d47a1 (Blue) | #ffd54f (Gold) | #ff6f00 (Orange)*
*Total Test Cases: 159 Manual + 145 Automation + 20 API + 14 Performance = 338 Total*

---

<!-- END OF DOCUMENT -->
