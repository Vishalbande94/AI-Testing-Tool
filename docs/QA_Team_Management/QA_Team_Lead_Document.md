# 🏢 QA TEAM LEAD — END-TO-END TESTING MANAGEMENT DOCUMENT
## Application: InsureAI — General Insurance Web Portal
### QA Lead: [Your Name] | Date: 24-Mar-2026 | Version: 1.0

---

> **Team Composition**
> | Role | Name | Responsibility |
> |---|---|---|
> | QA Team Lead | TL | Planning, coordination, sign-off, reporting |
> | Manual QA Engineer | QA-M | Functional, exploratory, regression testing |
> | Automation QA Engineer | QA-A | Framework, automation, CI/CD, performance, API |

---

# ══════════════════════════════════════════════
# PHASE 1 — REQUIREMENT ANALYSIS
# ══════════════════════════════════════════════

## 1.1 Application Summary

**InsureAI** is a web-based General Insurance Portal that allows customers to:
- Register, login, and manage their profile
- Get quotes for Motor, Health, Home, and Travel insurance
- Purchase and manage insurance policies
- File and track claims
- Make premium payments
- Download policy documents

**Technology Stack:** HTML5, CSS3, JavaScript, Bootstrap 5, localStorage (demo)
**User Roles:** Guest, Customer, Agent, Admin

---

## 1.2 Module-wise Requirement Summary

| Module | Requirements | Complexity |
|---|---|---|
| Registration & Login | REQ-001 to REQ-015 | High |
| Customer Dashboard | REQ-016 to REQ-018 | Medium |
| Get a Quote (Motor/Health/Home/Travel) | REQ-019 to REQ-033 | High |
| Policy Management | REQ-034 to REQ-047 | High |
| Claims Management | REQ-048 to REQ-057 | High |
| Payment Management | REQ-058 to REQ-066 | Critical |
| Documents & Downloads | REQ-067 to REQ-069 | Low |
| Admin Panel | REQ-070 to REQ-075 | Medium |
| Non-Functional (Perf/Security/UI) | REQ-076 to REQ-087 | High |

---

## 1.3 Identified Testable Scenarios

### Functional Scenarios
1. New user registers with valid/invalid data
2. User logs in with correct/incorrect credentials
3. Account locks after 5 failed attempts
4. Customer generates Motor/Health/Home/Travel quotes
5. NCB discount applied correctly in motor premium
6. Premium updates dynamically on add-on selection
7. Customer purchases policy and receives policy number
8. Customer files claim within policy period
9. Claim date validation (before/after policy period)
10. Admin updates claim status
11. Customer tracks claim status timeline
12. Payment processes successfully with multiple methods
13. Policy cancellation with refund calculation
14. Policy renewal within 60-day window
15. Admin deactivates/unlocks customer account

### Non-Functional Scenarios
16. All pages load within 3 seconds (REQ-017)
17. Application is responsive on 320px–2560px
18. No card data stored in localStorage (REQ-060)
19. Auth guard prevents unauthorized access
20. Cross-browser compatibility (Chrome/Firefox/Edge/Safari)

---

## 1.4 Acceptance Criteria

| Scenario | Acceptance Criteria |
|---|---|
| Registration | Valid data → success message; duplicate email → error; age < 18 → rejected |
| Login | Valid credentials → dashboard; 5 failed → account locked |
| Motor Quote | Valid form → 3 plans displayed with premiums; add-ons update total dynamically |
| Policy Purchase | Checkout → policy number + txn ID generated; policy visible in My Policies |
| Claim Filing | Incident date within policy period → claim ID generated |
| Performance | All pages < 3s load time (REQ-017) |
| Security | No card data in localStorage; auth guard on all protected pages |
| Admin | Admin login → admin.html; customer cannot access admin.html |

---

## 1.5 Assumptions Made

1. Backend is simulated via localStorage — no real server API in demo
2. Email/SMS notifications are simulated (logged to console)
3. Payment gateway uses sandbox/demo mode
4. Documents generate demo files, not real PDFs
5. Performance thresholds apply to local environment baseline

---

# ══════════════════════════════════════════════
# PHASE 2 — TEST PLANNING
# ══════════════════════════════════════════════

## 2.1 Test Plan Document

### Objective
To validate that InsureAI General Insurance Portal meets all functional, non-functional, and security requirements as defined in SRS v1.0, and is ready for client demonstration.

### Scope

**IN SCOPE:**
- All 8 functional modules (Registration to Admin)
- Positive, negative, boundary, and edge case testing
- Cross-browser testing (Chrome, Firefox, Edge)
- Responsive/mobile testing
- Security testing (auth guard, card data)
- Performance testing (page load, concurrent users, Core Web Vitals)
- API testing (simulated via localStorage interactions)
- Regression testing after any change

**OUT OF SCOPE:**
- Real payment gateway integration testing
- Email delivery testing (simulated)
- Backend database testing (no real DB in demo)
- Load testing beyond 10 concurrent browser sessions

### Entry Criteria
- [ ] Application deployed at localhost:3000
- [ ] Test environment verified and stable
- [ ] Requirements document reviewed and signed off
- [ ] Test cases reviewed and approved by TL
- [ ] Test data prepared
- [ ] Automation framework setup complete

### Exit Criteria
- [ ] 100% test case execution
- [ ] All Critical and High defects fixed and verified
- [ ] Regression pass rate ≥ 95%
- [ ] Performance: All pages < 3s load time
- [ ] No P1/P2 open defects
- [ ] Test Summary Report signed by TL

### Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| localStorage cleared between tests | High | High | Seed data before each test run |
| Browser compatibility differences | Medium | Medium | Test on all 3 browsers |
| Test data conflicts between parallel runs | Medium | High | Isolate data per test |
| flaky tests due to timing | Medium | Medium | Add explicit waits in automation |
| Scope creep from new requirements | Low | High | Change request process |

---

## 2.2 Responsibility Matrix (RACI)

| Activity | QA Lead | Manual QA | Automation QA |
|---|---|---|---|
| Requirement Analysis | A | R | C |
| Test Plan Creation | R/A | C | C |
| Test Case Design | A | R | C |
| Automation Framework Design | A | I | R |
| Test Environment Setup | A | R | R |
| Manual Test Execution | A | R | I |
| Automation Script Development | A | I | R |
| Defect Logging | A | R | R |
| Defect Triage | R/A | C | C |
| API Test Design & Execution | A | I | R |
| Performance Test Execution | A | I | R |
| Daily Status Report | R | R | R |
| Test Summary Report | R/A | C | C |

> R = Responsible | A = Accountable | C = Consulted | I = Informed

---

## 2.3 Timeline / Sprint Plan

| Week | Manual QA Activity | Automation QA Activity |
|---|---|---|
| Week 1 | Requirement analysis, test case writing (Modules 1-4) | Framework setup, folder structure, page objects |
| Week 2 | Test case writing (Modules 5-8), RTM creation | Smoke test automation, login/registration scripts |
| Week 3 | Smoke, Sanity, Functional testing execution | Quote flow automation, policy purchase automation |
| Week 4 | Regression, exploratory, cross-browser testing | Claims/payments automation, API tests |
| Week 5 | Defect re-testing, final regression | Performance tests, CI/CD pipeline setup |
| Week 6 | Test summary report, release activities | Final automation report, maintenance doc |

---

# ══════════════════════════════════════════════
# PHASE 3 — TEST DESIGN
# ══════════════════════════════════════════════

## ┌─────────────────────────────────────────┐
## │         MANUAL QA ENGINEER              │
## └─────────────────────────────────────────┘

### 3.1 Test Scenarios (Manual QA)

#### Module 1: Registration & Login
| ID | Scenario |
|---|---|
| TS_REG_01 | Verify user can register with all valid mandatory details |
| TS_REG_02 | Verify system rejects registration with invalid/missing data |
| TS_REG_03 | Verify password strength validation works correctly |
| TS_REG_04 | Verify duplicate email registration is blocked |
| TS_LOG_01 | Verify login with valid credentials redirects to dashboard |
| TS_LOG_02 | Verify login fails with wrong credentials |
| TS_LOG_03 | Verify account locks after 5 consecutive failed attempts |
| TS_LOG_04 | Verify forgot password flow works end-to-end |
| TS_LOG_05 | Verify logout clears session and prevents back-navigation |

#### Module 2: Quote Generation
| ID | Scenario |
|---|---|
| TS_MOTOR_01 | Verify motor quote generates 3 plans with correct premiums |
| TS_MOTOR_02 | Verify NCB discount applied correctly to premium |
| TS_MOTOR_03 | Verify add-ons update premium dynamically |
| TS_MOTOR_04 | Verify vehicle registration number format validated |
| TS_HLT_01 | Verify health quote for individual and family floater plans |
| TS_HLT_02 | Verify pre-existing disease warning displayed |
| TS_HOME_01 | Verify home insurance quote generated with all cover types |
| TS_TRVL_01 | Verify travel quote rejects past dates |
| TS_TRVL_02 | Verify max 180-day trip duration enforced |

#### Module 3: Policy Management
| ID | Scenario |
|---|---|
| TS_POL_01 | Verify policy created after successful checkout |
| TS_POL_02 | Verify policy appears in My Policies with correct status |
| TS_POL_03 | Verify policy renewal within 60-day window |
| TS_POL_04 | Verify policy cancellation with refund calculation |
| TS_POL_05 | Verify renewal alert shown for policies within 30 days |

#### Module 4: Claims Management
| ID | Scenario |
|---|---|
| TS_CLM_01 | Verify claim filed with reference number generated |
| TS_CLM_02 | Verify claim rejected for date outside policy period |
| TS_CLM_03 | Verify claim status timeline displayed correctly |
| TS_CLM_04 | Verify admin can update claim status |
| TS_CLM_05 | Verify customer sees upload option for "Additional Info Required" |

#### Module 5: Payment, Documents, Admin
| ID | Scenario |
|---|---|
| TS_PAY_01 | Verify payment with all 5 methods |
| TS_PAY_02 | Verify payment receipt downloadable |
| TS_DOC_01 | Verify all documents listed and downloadable |
| TS_ADM_01 | Verify admin can search, deactivate customers |
| TS_ADM_02 | Verify admin can update claim status |
| TS_ADM_03 | Verify admin reports show correct data |

---

### 3.2 Sample Detailed Test Cases (Manual QA)

#### TC_FULL_001 — End-to-End Motor Policy Purchase
| Field | Details |
|---|---|
| **Test Case ID** | TC_FULL_001 |
| **Title** | End-to-End Motor Insurance Policy Purchase |
| **Module** | Motor Quote → Checkout → Policy |
| **Priority** | Critical |
| **Type** | Integration / Positive |
| **Pre-condition** | User registered and logged in |
| **Test Data** | Vehicle: MH12AB1234, Maruti Swift 2022, Petrol, Mumbai, NCB: 20% |

**Steps:**
1. Login with `rahul@demo.com / Test@1234`
2. Navigate to Get Quote → Motor Insurance
3. Fill vehicle details: Type=Four-Wheeler, Reg=MH12AB1234, Make=Maruti Suzuki, Model=Swift, Year=2022, Fuel=Petrol, City=Mumbai
4. Select NCB: 20%
5. Click Get Quotes
6. Verify 3 plans displayed (Third Party, Standard, Comprehensive)
7. Select Comprehensive plan
8. Check Zero Depreciation add-on
9. Verify premium increases by ₹1,200
10. Click Buy Now
11. Fill Nominee: Sunita Sharma, Spouse, PAN: ABCDE1234F
12. Select Credit Card payment
13. Enter card: 4111 1111 1111 1111, Exp: 12/27, CVV: 123
14. Click Pay Securely
15. Verify success modal with Policy Number and Transaction ID
16. Navigate to My Policies
17. Verify new policy appears with Active status

**Expected Results:**
- Step 5: Step 2 visible with plans
- Step 9: Premium updates dynamically (no page reload)
- Step 14: Payment spinner shown for ~2 seconds
- Step 15: Success modal shows unique POL# and TXN#
- Step 17: Policy listed as Active with correct premium

**Actual Result:** *(to be filled during execution)*
**Status:** Not Executed

---

#### TC_FULL_002 — End-to-End Claim Filing & Admin Approval
| Field | Details |
|---|---|
| **Test Case ID** | TC_FULL_002 |
| **Title** | File Claim → Admin Approves → Customer Tracks |
| **Module** | Claims + Admin |
| **Priority** | Critical |
| **Type** | Integration / Positive |
| **Pre-condition** | Customer has active policy POL202600001 |

**Steps:**
1. Login as customer `rahul@demo.com`
2. Navigate to Claims → File New Claim
3. Select Policy: POL202600001 (Motor)
4. Select Type: Cashless
5. Enter Incident Date: within policy period
6. Enter Amount: ₹25,000
7. Enter Description: "Front bumper damaged in parking lot collision"
8. Click Submit Claim
9. Verify claim reference number displayed (CLM...)
10. Logout
11. Login as admin `admin@insureai.com`
12. Navigate to Claims section
13. Find the new claim → Click Update
14. Set status to "Under Review" → Submit
15. Set status to "Approved" → Submit
16. Logout
17. Login as customer
18. Navigate to Claims → Track
19. Verify timeline shows: Submitted → Under Review → Approved

**Expected Results:**
- Step 9: Toast shows CLM reference number
- Step 15: Claim status updated to Approved
- Step 19: All 3 statuses visible in timeline with dates

**Status:** Not Executed

---

### 3.3 Test Data (Manual QA)

```
╔══════════════════════════════════════════════════════════════╗
║                     TEST DATA SHEET                         ║
╠══════════════════════════════════════════════════════════════╣
║ VALID USERS                                                  ║
║   Customer : rahul@demo.com        / Test@1234              ║
║   Admin    : admin@insureai.com    / Admin@123               ║
║   New User : newuser@test.com      / NewTest@123             ║
╠══════════════════════════════════════════════════════════════╣
║ INVALID LOGIN DATA                                           ║
║   Wrong pwd : rahul@demo.com       / Wrong@123              ║
║   No email  : notexist@test.com    / Test@1234              ║
║   Locked    : (after 5 failures)                            ║
╠══════════════════════════════════════════════════════════════╣
║ REGISTRATION DATA                                            ║
║   Valid DOB (18+)  : 1995-06-15                             ║
║   Invalid DOB (<18): 2010-01-01                             ║
║   Weak Password    : test123 (no uppercase/special)         ║
║   Invalid Mobile   : 98765 (5 digits)                       ║
║   Duplicate Email  : rahul@demo.com                         ║
╠══════════════════════════════════════════════════════════════╣
║ MOTOR QUOTE DATA                                             ║
║   Valid Reg    : MH12AB1234                                  ║
║   Invalid Reg  : ABCD123 (wrong format)                     ║
║   Make/Model   : Maruti Suzuki / Swift                      ║
║   Year         : 2022                                        ║
║   Fuel         : Petrol                                      ║
║   NCB          : 20% (1 year claim-free)                    ║
╠══════════════════════════════════════════════════════════════╣
║ HEALTH QUOTE DATA                                            ║
║   Individual, Age: 35, SI: ₹5 Lakh, City: Mumbai           ║
║   Family, Members: 3, Ages: 35/32/8, SI: ₹10 Lakh         ║
╠══════════════════════════════════════════════════════════════╣
║ TRAVEL QUOTE DATA                                            ║
║   Valid Start  : [Tomorrow's date]                           ║
║   Invalid Start: [Yesterday's date]                          ║
║   Duration 180 : [Start + 180 days] — boundary              ║
║   Duration 181 : [Start + 181 days] — should fail           ║
║   Dest         : Thailand (International)                    ║
╠══════════════════════════════════════════════════════════════╣
║ PAYMENT DATA                                                 ║
║   Card No      : 4111 1111 1111 1111                        ║
║   Expiry       : 12/27                                       ║
║   CVV          : 123                                         ║
║   UPI          : test@upi                                    ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 3.4 Requirement Traceability Matrix (RTM)

| Req ID | Requirement | Test Scenario | Test Case IDs | Priority | Covered By |
|---|---|---|---|---|---|
| REQ-001 | Registration with mandatory fields | TS_REG_01/02/03 | TC_REG_001–006 | High | Manual |
| REQ-002 | Verification email after registration | TS_REG_01 | TC_REG_020 | Medium | Manual |
| REQ-003 | Inline validation errors | TS_REG_02 | TC_REG_002–004 | High | Manual+Auto |
| REQ-004 | Unique email check | TS_REG_04 | TC_REG_016 | High | Manual+Auto |
| REQ-005 | Mobile 10-digit validation | TS_REG_02 | TC_REG_005–007 | High | Manual+Auto |
| REQ-007 | Login with email/password | TS_LOG_01 | TC_LOG_001–002 | Critical | Manual+Auto |
| REQ-008 | Account lock after 5 failures | TS_LOG_03 | TC_LOG_007–008 | Critical | Manual+Auto |
| REQ-009 | Forgot password link | TS_LOG_04 | TC_LOG_009–012 | Medium | Manual |
| REQ-011 | Remember Me 7 days | TS_LOG_01 | TC_LOG_015 | Low | Manual |
| REQ-013 | Error without field specificity | TS_LOG_02 | TC_LOG_003 | High | Manual |
| REQ-015 | Back button after logout | TS_LOG_05 | TC_LOG_014 | Critical | Manual+Auto |
| REQ-016 | Dashboard summary display | TS_DASH | TC_DASH_001–008 | High | Manual+Auto |
| REQ-017 | Dashboard < 3 seconds | Performance | TC_NFR_001 | High | Auto |
| REQ-019 | Motor quote form | TS_MOTOR_01 | TC_MOTOR_001–015 | High | Manual+Auto |
| REQ-020 | Registration number format | TS_MOTOR_02 | TC_MOTOR_002 | High | Manual+Auto |
| REQ-022 | Motor add-ons | TS_MOTOR_03 | TC_MOTOR_006–009 | Medium | Manual+Auto |
| REQ-023 | Dynamic premium update | TS_MOTOR_03 | TC_MOTOR_006–009 | High | Manual+Auto |
| REQ-024 | Health quote members | TS_HLT_01/02 | TC_HLT_001–009 | High | Manual+Auto |
| REQ-025 | PED waiting period warning | TS_HLT_02 | TC_HLT_003–004 | Medium | Manual |
| REQ-027 | Home insurance quote | TS_HOME_01 | TC_HOME_001–005 | High | Manual |
| REQ-030 | Travel dates in future | TS_TRVL_01 | TC_TRVL_002–003 | Critical | Manual+Auto |
| REQ-031 | Max 180-day trip | TS_TRVL_02 | TC_TRVL_004–005 | High | Manual+Auto |
| REQ-034 | Buy policy from quote | TS_POL_01 | TC_CHK_001 | Critical | Auto |
| REQ-037 | Policy number after payment | TS_POL_01 | TC_CHK_007 | Critical | Auto |
| REQ-041 | Renew within 60 days | TS_POL_03 | TC_POL_010 | High | Manual |
| REQ-045 | Cancel policy | TS_POL_04 | TC_POL_007–009 | High | Manual |
| REQ-048 | File a claim | TS_CLM_01 | TC_CLM_001 | Critical | Auto |
| REQ-050 | Incident date within policy | TS_CLM_02 | TC_CLM_002–003 | Critical | Auto |
| REQ-051 | Claim reference number | TS_CLM_01 | TC_CLM_007 | Critical | Auto |
| REQ-058 | Payment methods | TS_PAY_01 | TC_CHK_005–006 | High | Manual+Auto |
| REQ-060 | No card data stored | Security | TC_NFR_008 | Critical | Auto |
| REQ-062 | Transaction ID generated | TS_PAY_01 | TC_CHK_008 | Critical | Auto |
| REQ-067 | Document downloads | TS_DOC_01 | TC_DOC_001–005 | Medium | Manual |
| REQ-070 | Admin view customers | TS_ADM_01 | TC_ADM_005 | High | Manual |
| REQ-071 | Admin search customer | TS_ADM_01 | TC_ADM_006–008 | High | Manual+Auto |
| REQ-072 | Admin update claim | TS_ADM_02 | TC_ADM_012–014 | High | Manual+Auto |
| REQ-073 | Admin reports | TS_ADM_03 | TC_ADM_015–017 | Medium | Manual |
| REQ-074 | Deactivate customer | TS_ADM_01 | TC_ADM_009–010 | High | Manual |
| REQ-075 | Admin IP restriction | Security | TC_ADM_002 | Critical | Auto |
| REQ-081 | Responsive 320px–2560px | Usability | TC_NFR_002–003 | Medium | Manual |
| REQ-083 | Error=red, success=green | UI | TC_NFR_009–010 | Low | Manual |
| REQ-087 | Cross-browser compatibility | Compat | TC_NFR_004–006 | High | Manual+Auto |

---

## ┌─────────────────────────────────────────┐
## │       AUTOMATION QA ENGINEER            │
## └─────────────────────────────────────────┘

### 3.5 Automation Candidates

#### Priority 1 — Automate Immediately (Regression-critical)
| Test | Reason |
|---|---|
| Login (valid/invalid) | Executed every sprint |
| Registration validation | Core entry point |
| Account lockout | Security — must not regress |
| Dashboard load | REQ-017 performance compliance |
| Motor quote generation | Highest usage flow |
| Policy purchase (checkout) | Revenue-critical |
| Claim filing | Core business flow |
| Auth guard (back button) | Security — must not regress |
| Admin access control | Security |

#### Priority 2 — Automate in Sprint 2
| Test | Reason |
|---|---|
| Travel date validations | Boundary logic — easy to miss |
| Health quote (family floater) | Complex calculation |
| Add-on premium calculation | Dynamic UI behavior |
| Claim date boundary | Business rule validation |
| Payment method switching | UI conditional logic |
| Admin claim status update | Multi-role flow |

#### Priority 3 — Manual Only (Complex/Exploratory)
| Test | Reason |
|---|---|
| Exploratory testing | Requires human judgment |
| UI aesthetics (color, spacing) | Visual validation |
| Cross-browser rendering | Needs visual inspection |
| Document download (file content) | Hard to automate file validation |
| Usability testing | Human observation required |

---

### 3.6 Automation Framework Design (Playwright + JavaScript)

```
InsureAI-Automation/
│
├── playwright.config.js              ← Main config (browsers, baseURL, reporters)
├── playwright.perf.config.js         ← Performance test config
├── package.json                      ← Dependencies
│
├── tests/
│   ├── smoke/                        ← Smoke Test Suite (Priority 1)
│   │   ├── login.smoke.js
│   │   ├── registration.smoke.js
│   │   └── dashboard.smoke.js
│   │
│   ├── regression/                   ← Full Regression Suite
│   │   ├── auth/
│   │   │   ├── login.spec.js
│   │   │   ├── registration.spec.js
│   │   │   ├── logout.spec.js
│   │   │   └── forgot-password.spec.js
│   │   ├── quote/
│   │   │   ├── motor-quote.spec.js
│   │   │   ├── health-quote.spec.js
│   │   │   ├── home-quote.spec.js
│   │   │   └── travel-quote.spec.js
│   │   ├── policy/
│   │   │   ├── checkout.spec.js
│   │   │   ├── policies-list.spec.js
│   │   │   └── policy-cancel.spec.js
│   │   ├── claims/
│   │   │   ├── file-claim.spec.js
│   │   │   └── track-claim.spec.js
│   │   ├── payments/
│   │   │   └── payment-history.spec.js
│   │   └── admin/
│   │       ├── admin-access.spec.js
│   │       └── claim-management.spec.js
│   │
│   ├── performance/                  ← Performance Test Suite
│   │   ├── page-load.perf.js
│   │   ├── core-web-vitals.perf.js
│   │   └── concurrent-users.perf.js
│   │
│   └── e2e/                          ← End-to-End Flows
│       ├── motor-policy-purchase.e2e.js
│       ├── health-policy-purchase.e2e.js
│       └── claim-approval-flow.e2e.js
│
├── pages/                            ← Page Object Model (POM)
│   ├── BasePage.js                   ← Common: navigate, waitFor, screenshot
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── DashboardPage.js
│   ├── MotorQuotePage.js
│   ├── HealthQuotePage.js
│   ├── CheckoutPage.js
│   ├── PoliciesPage.js
│   ├── ClaimsPage.js
│   ├── PaymentsPage.js
│   └── AdminPage.js
│
├── fixtures/                         ← Test Data & Fixtures
│   ├── users.json                    ← Valid/invalid user data
│   ├── motor-data.json               ← Vehicle test data
│   ├── health-data.json              ← Member/age test data
│   ├── travel-data.json              ← Trip date test data
│   └── payment-data.json             ← Card/UPI test data
│
├── helpers/                          ← Reusable Utilities
│   ├── seed-data.js                  ← localStorage seeder
│   ├── auth-helper.js                ← Login/logout helpers
│   ├── date-helper.js                ← Date calculation utils
│   └── assertion-helper.js           ← Custom assertions
│
├── reports/                          ← Test Reports
│   ├── playwright-report/            ← HTML report (built-in)
│   ├── allure-results/               ← Allure raw results
│   └── performance-results/          ← Perf JSON + HTML dashboard
│
└── .github/workflows/
    └── qa-pipeline.yml               ← GitHub Actions CI/CD
```

---

### 3.7 Page Object Model — Sample (LoginPage.js)

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    // Locators
    this.emailInput       = page.locator('#email');
    this.passwordInput    = page.locator('#password');
    this.submitBtn        = page.locator('#submitBtn');
    this.alertBox         = page.locator('#alertBox');
    this.forgotPwdLink    = page.locator('a[href="forgot-password.html"]');
    this.rememberMeChk    = page.locator('#rememberMe');
  }

  async navigate() {
    await this.page.goto('/login.html');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async getAlertText() {
    await this.alertBox.waitFor({ state: 'visible' });
    return await this.alertBox.innerText();
  }

  async isOnDashboard() {
    await this.page.waitForURL('**/dashboard.html', { timeout: 5000 });
    return true;
  }
}
```

---

# ══════════════════════════════════════════════
# PHASE 4 — ENVIRONMENT SETUP
# ══════════════════════════════════════════════

## 4.1 QA Environment Configuration

```
╔══════════════════════════════════════════════════════════════╗
║              QA ENVIRONMENT SETUP                            ║
╠══════════════╦═══════════════════════════════════════════════╣
║ Component    ║ Details                                       ║
╠══════════════╬═══════════════════════════════════════════════╣
║ App URL      ║ http://localhost:3000 (npx serve)            ║
║ OS           ║ Windows 11 Pro                               ║
║ Node.js      ║ v18+ LTS                                     ║
║ Playwright   ║ v1.55.0                                      ║
║ Browsers     ║ Chrome, Firefox, Edge, Webkit (Safari)       ║
╠══════════════╬═══════════════════════════════════════════════╣
║ MANUAL QA TOOLS                                              ║
║ Bug Tracker  ║ JIRA (or demo: GitHub Issues)                ║
║ Test Mgmt    ║ Excel / Google Sheets / TestRail             ║
║ Screenshots  ║ Snagit / ShareX / Greenshot                  ║
║ Browser DevT ║ Chrome DevTools (F12)                        ║
╠══════════════╬═══════════════════════════════════════════════╣
║ AUTOMATION QA TOOLS                                          ║
║ Framework    ║ Playwright v1.55 + JavaScript                ║
║ Reporter     ║ Playwright HTML + Allure                     ║
║ CI/CD        ║ GitHub Actions                               ║
║ Performance  ║ Playwright + Web APIs (no JMeter)            ║
║ Version Ctrl ║ Git + GitHub                                  ║
╚══════════════╩═══════════════════════════════════════════════╝
```

## 4.2 Setup Commands

```bash
# MANUAL QA — App Setup
cd C:\Users\Vishal\PlaywrightPractice
npx serve insurance-app -p 3000
# Open http://localhost:3000 in browser

# AUTOMATION QA — Framework Setup
npm install
npx playwright install
npx playwright install-deps

# Run Smoke Tests
npx playwright test tests/smoke/ --project=chromium

# Run Full Regression
npx playwright test tests/regression/

# Run Performance Tests
npm run perf:all

# Generate Allure Report
npx allure generate allure-results --clean
npx allure open
```

---

# ══════════════════════════════════════════════
# PHASE 5 — TEST EXECUTION
# ══════════════════════════════════════════════

## ┌─────────────────────────────────────────┐
## │         MANUAL QA ENGINEER              │
## └─────────────────────────────────────────┘

### 5.1 Test Execution Strategy

| Cycle | Type | Scope | When |
|---|---|---|---|
| Cycle 1 | Smoke Test | 15 critical cases | Day 1 of each build |
| Cycle 2 | Sanity Test | Per-module (new features) | After each bug fix |
| Cycle 3 | Functional Testing | All 167 test cases | Week 3 |
| Cycle 4 | Integration Testing | E2E flows | Week 3–4 |
| Cycle 5 | Regression Testing | Full suite | After defect fixes |
| Cycle 6 | Exploratory Testing | Unscripted | Week 4 |
| Cycle 7 | Cross-Browser Testing | Chrome/Firefox/Edge | Week 4 |
| Cycle 8 | UAT Support | Client scenarios | Week 5–6 |

### 5.2 Smoke Test Checklist (Manual QA — Run in 30 mins)

```
SMOKE TEST CHECKLIST — InsureAI v1.0
─────────────────────────────────────────
□ SM-01 | Application opens at localhost:3000
□ SM-02 | New user can register successfully
□ SM-03 | Registered user can login
□ SM-04 | Dashboard loads with stats and policies
□ SM-05 | Motor insurance quote can be generated
□ SM-06 | Policy can be purchased (checkout flow)
□ SM-07 | Claim can be filed against a policy
□ SM-08 | Payment history is visible
□ SM-09 | Admin can login and access admin panel
□ SM-10 | Logout works and session is cleared
─────────────────────────────────────────
Result: ___/10 passed | Sign off: _______
```

### 5.3 Exploratory Testing Charter

| Charter | Area | Time Box | Notes |
|---|---|---|---|
| ET-01 | Registration edge cases | 30 min | Try SQL injection, XSS, special chars |
| ET-02 | Quote form boundary values | 45 min | Max chars, zero values, negative numbers |
| ET-03 | Multi-tab session behavior | 30 min | Open app in multiple tabs, test conflicts |
| ET-04 | Payment flow edge cases | 45 min | Incomplete card, expired card format |
| ET-05 | Admin operations | 30 min | Rapid status changes, search edge cases |
| ET-06 | Mobile responsiveness | 30 min | 320px, 375px, 768px, 1024px breakpoints |

---

## ┌─────────────────────────────────────────┐
## │       AUTOMATION QA ENGINEER            │
## └─────────────────────────────────────────┘

### 5.4 Automation Execution Plan

```bash
# DAILY SMOKE (runs in ~5 minutes)
npx playwright test tests/smoke/ --project=chromium --reporter=list

# NIGHTLY REGRESSION (runs in ~25 minutes)
npx playwright test tests/regression/ --project=chromium --reporter=html

# WEEKLY FULL SUITE (all browsers, ~60 minutes)
npx playwright test --project=chromium --project=firefox --project=webkit

# PERFORMANCE SUITE (runs in ~15 minutes)
npm run perf:all
```

### 5.5 Sample Automation Script — Login Tests

```javascript
// tests/regression/auth/login.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage.js';
import { seedTestData } from '../../../helpers/seed-data.js';

test.describe('🔐 Login — Functional Tests', () => {

  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
  });

  test('REG-007 | Valid customer login → dashboard redirect', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('rahul@demo.com', 'Test@1234');
    await expect(page).toHaveURL(/dashboard\.html/);
    await expect(page.locator('#navUserName')).toContainText('Rahul');
  });

  test('REG-007 | Valid admin login → admin panel redirect', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('admin@insureai.com', 'Admin@123');
    await expect(page).toHaveURL(/admin\.html/);
  });

  test('REG-013 | Wrong password → generic error (no field specificity)', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('rahul@demo.com', 'WrongPassword@1');
    const alert = await login.getAlertText();
    expect(alert).toContain('Invalid credentials');
    expect(alert).not.toContain('password');  // Should not say "wrong password"
    expect(alert).not.toContain('email');     // Should not say "email not found"
  });

  test('REG-008 | Account locks after 5 consecutive failures', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    for (let i = 0; i < 5; i++) {
      await login.login('rahul@demo.com', 'WrongPass@1');
      await page.waitForTimeout(300);
    }
    const alert = await login.getAlertText();
    expect(alert).toContain('locked');
  });

  test('REG-015 | After logout, back button should not access dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('rahul@demo.com', 'Test@1234');
    await expect(page).toHaveURL(/dashboard\.html/);
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/login\.html/);
    await page.goBack();
    await expect(page).toHaveURL(/login\.html/);  // Should not return to dashboard
  });

});
```

---

# ══════════════════════════════════════════════
# PHASE 6 — DEFECT MANAGEMENT
# ══════════════════════════════════════════════

## ┌─────────────────────────────────────────┐
## │         MANUAL QA ENGINEER              │
## └─────────────────────────────────────────┘

### 6.1 JIRA Defect Template

```
╔══════════════════════════════════════════════════════════════╗
║                    DEFECT REPORT                             ║
╠══════════════════════════════════════════════════════════════╣
║ Defect ID     : DEF-[Auto-generated]                        ║
║ Title         : [Short, clear description]                  ║
║ Module        : [e.g., Login / Motor Quote / Claims]        ║
║ Severity      : Critical / Major / Minor / Trivial          ║
║ Priority      : P1 / P2 / P3 / P4                          ║
║ Found In      : v1.0                                        ║
║ Found By      : [QA Engineer Name]                          ║
║ Reported Date : 24-Mar-2026                                 ║
║ Assigned To   : [Developer Name]                            ║
╠══════════════════════════════════════════════════════════════╣
║ Environment                                                  ║
║   OS          : Windows 11 Pro                              ║
║   Browser     : Chrome 131                                  ║
║   URL         : http://localhost:3000/claims.html           ║
╠══════════════════════════════════════════════════════════════╣
║ STEPS TO REPRODUCE                                           ║
║   1. Login as rahul@demo.com                                ║
║   2. Navigate to Claims                                     ║
║   3. Click File New Claim                                   ║
║   4. Enter incident date before policy start date           ║
║   5. Click Submit                                           ║
╠══════════════════════════════════════════════════════════════╣
║ EXPECTED RESULT                                              ║
║   Error message: Date must be within policy period           ║
╠══════════════════════════════════════════════════════════════╣
║ ACTUAL RESULT                                                ║
║   Claim submitted without validation error [BUG]            ║
╠══════════════════════════════════════════════════════════════╣
║ ATTACHMENTS                                                  ║
║   [Screenshot] [Video] [Console logs]                       ║
╚══════════════════════════════════════════════════════════════╝
```

### 6.2 Defect Severity & Priority Matrix

| Severity | Priority | Examples |
|---|---|---|
| Critical (S1) | P1 | Account lockout not working, policy purchase fails, auth bypass |
| Major (S2) | P2 | Form validation missing, claim date not validated, premium wrong |
| Minor (S3) | P3 | UI misalignment, wrong color, non-critical field error |
| Trivial (S4) | P4 | Typo, tooltip missing, placeholder text wrong |

### 6.3 Defect Lifecycle

```
New → Assigned → In Progress → Fixed → Re-Test → [Pass → Closed] / [Fail → Reopen]
```

---

## ┌─────────────────────────────────────────┐
## │       AUTOMATION QA ENGINEER            │
## └─────────────────────────────────────────┘

### 6.4 Automation Failure Capture

```javascript
// playwright.config.js — Global failure handling
use: {
  screenshot: 'only-on-failure',   // Auto-capture screenshot
  video: 'retain-on-failure',      // Auto-capture video
  trace: 'on-first-retry',         // Full trace on retry
}

// Custom failure logging in test
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Capture full page screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('failure-screenshot', {
      body: screenshot, contentType: 'image/png'
    });

    // Capture console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    if (logs.length > 0) {
      await testInfo.attach('console-errors', {
        body: logs.join('\n'), contentType: 'text/plain'
      });
    }
  }
});
```

---

# ══════════════════════════════════════════════
# PHASE 7 — API TESTING (Automation QA)
# ══════════════════════════════════════════════

> **Note:** InsureAI demo uses localStorage, not REST APIs.
> The following represents the API test design for production readiness.

### 7.1 API Test Cases (Playwright / Postman)

```javascript
// tests/api/auth-api.spec.js
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000/api'; // Production API

test.describe('🔌 API Tests — Authentication', () => {

  // ── POST /api/auth/register ────────────────────────────
  test('API_001 | POST /register — 201 on valid data', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/register`, {
      data: {
        name: 'Test User',
        email: `test_${Date.now()}@demo.com`,
        mobile: '9876543210',
        dob: '1995-06-15',
        password: 'Test@1234'
      }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('userId');
    expect(body.message).toContain('registered');
  });

  test('API_002 | POST /register — 400 on duplicate email', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/register`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234', name:'Test', mobile:'9876543210', dob:'1995-01-01' }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('already registered');
  });

  test('API_003 | POST /register — 422 on age < 18', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/register`, {
      data: { email: 'young@demo.com', password: 'Test@1234', name:'Young User', mobile:'9876543210', dob:'2015-01-01' }
    });
    expect(res.status()).toBe(422);
  });

  // ── POST /api/auth/login ───────────────────────────────
  test('API_004 | POST /login — 200 + JWT token on valid credentials', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234' }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');
    expect(body.user.role).toBe('customer');
  });

  test('API_005 | POST /login — 401 on wrong password', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'WrongPass@1' }
    });
    expect(res.status()).toBe(401);
  });

  // ── GET /api/policies ──────────────────────────────────
  test('API_006 | GET /policies — 200 with valid JWT token', async ({ request }) => {
    // First login to get token
    const loginRes = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234' }
    });
    const { token } = await loginRes.json();

    const res = await request.get(`${BASE}/policies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.policies)).toBeTruthy();
  });

  test('API_007 | GET /policies — 401 without token', async ({ request }) => {
    const res = await request.get(`${BASE}/policies`);
    expect(res.status()).toBe(401);
  });

  // ── POST /api/claims ───────────────────────────────────
  test('API_008 | POST /claims — 201 on valid claim', async ({ request }) => {
    const loginRes = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234' }
    });
    const { token } = await loginRes.json();

    const res = await request.post(`${BASE}/claims`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        policyId: 'POL202600001',
        type: 'Cashless',
        incidentDate: '2026-03-01',
        amount: 25000,
        description: 'Front bumper damaged in parking lot accident near office'
      }
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('claimId');
    expect(body.claimId).toMatch(/^CLM/);
  });

  test('API_009 | POST /claims — 422 date outside policy period', async ({ request }) => {
    const loginRes = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234' }
    });
    const { token } = await loginRes.json();
    const res = await request.post(`${BASE}/claims`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: { policyId: 'POL202600001', type: 'Cashless', incidentDate: '2020-01-01', amount: 5000, description: 'Test description for validation' }
    });
    expect(res.status()).toBe(422);
  });

  // ── Schema Validation ──────────────────────────────────
  test('API_010 | GET /policies — Response schema validation', async ({ request }) => {
    const loginRes = await request.post(`${BASE}/auth/login`, {
      data: { email: 'rahul@demo.com', password: 'Test@1234' }
    });
    const { token } = await loginRes.json();
    const res = await request.get(`${BASE}/policies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const body = await res.json();
    const policy = body.policies[0];

    // Schema assertions
    expect(typeof policy.id).toBe('string');
    expect(typeof policy.type).toBe('string');
    expect(typeof policy.premium).toBe('number');
    expect(typeof policy.status).toBe('string');
    expect(['Active','Expired','Cancelled']).toContain(policy.status);
    expect(policy.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

});
```

### 7.2 API Test Summary Table

| ID | Endpoint | Method | Scenario | Expected Status |
|---|---|---|---|---|
| API_001 | /auth/register | POST | Valid registration | 201 |
| API_002 | /auth/register | POST | Duplicate email | 400 |
| API_003 | /auth/register | POST | Age < 18 | 422 |
| API_004 | /auth/login | POST | Valid credentials | 200 + JWT |
| API_005 | /auth/login | POST | Wrong password | 401 |
| API_006 | /policies | GET | With valid token | 200 |
| API_007 | /policies | GET | Without token | 401 |
| API_008 | /claims | POST | Valid claim | 201 |
| API_009 | /claims | POST | Date outside policy | 422 |
| API_010 | /policies | GET | Schema validation | Pass |

---

# ══════════════════════════════════════════════
# PHASE 8 — PERFORMANCE TESTING (Automation QA)
# ══════════════════════════════════════════════

### 8.1 Performance Test Strategy

Since **JMeter is not required** (per project constraint), performance testing is done using:
- **Playwright + Navigation Timing API** (already implemented)
- **PerformanceObserver** for Core Web Vitals
- **Chrome DevTools Protocol** for memory

### 8.2 Performance Test Scenarios

| Scenario | Tool | Metric | Pass Threshold |
|---|---|---|---|
| Page load — all 14 pages | Playwright | Full Load | < 3000ms (REQ-017) |
| First Contentful Paint | PerformanceObserver | FCP | < 1800ms |
| Largest Contentful Paint | PerformanceObserver | LCP | < 2500ms |
| Layout Stability | PerformanceObserver | CLS | < 0.1 |
| Total Blocking Time | Long Tasks API | TBT | < 200ms |
| 5 Concurrent Users | Playwright Multi-Context | Avg Load | < 5000ms |
| 10 Concurrent Users (Stress) | Playwright Multi-Context | Max Load | < 8000ms |
| Memory Leak (8 iterations) | CDP metrics() | Heap growth | < 50MB |
| Form Interaction (INP) | Performance.now() | Click response | < 200ms |

### 8.3 JMeter Alternative — Equivalent Test Design

```
If JMeter were used, these would be the equivalent test plans:

[Thread Group 1: Smoke Load]
  Users      : 5
  Ramp-up    : 10 seconds
  Duration   : 60 seconds
  Requests   : GET /login, GET /dashboard, GET /policies

[Thread Group 2: Stress Test]
  Users      : 50 (ramp 1→50 in 5 min)
  Ramp-up    : 300 seconds
  Duration   : 600 seconds
  Assertions : Response < 3000ms

[Thread Group 3: Spike Test]
  Users      : Spike to 100 in 10s, then back to 10
  Purpose    : Detect crash/degradation under sudden load

With Playwright (actual implementation):
  → page-load.perf.js     ≡ JMeter Transaction Controller
  → concurrent-users.perf.js ≡ JMeter Thread Groups
  → core-web-vitals.perf.js  ≡ JMeter Response Time Graphs
```

---

# ══════════════════════════════════════════════
# PHASE 9 — REPORTING
# ══════════════════════════════════════════════

## ┌─────────────────────────────────────────┐
## │         MANUAL QA ENGINEER              │
## └─────────────────────────────────────────┘

### 9.1 Daily Status Report Template

```
════════════════════════════════════════════════
DAILY QA STATUS REPORT — InsureAI
Date        : 24-Mar-2026
Reported By : Manual QA Engineer
Sprint      : Sprint 3 / Week 3
════════════════════════════════════════════════

📊 TEST EXECUTION SUMMARY
───────────────────────────────────────────────
Total Test Cases   : 167
Executed Today     :  45
Pass               :  40  (88%)
Fail               :   3  (7%)
Blocked            :   2  (4%)
Not Executed       : 122

📈 CUMULATIVE PROGRESS
───────────────────────────────────────────────
Total Executed     :  98 / 167  (59%)
Overall Pass Rate  :  89%

🐛 DEFECTS TODAY
───────────────────────────────────────────────
New Defects        :   3
  DEF-012 | MAJOR  | Claim date validation allows past dates
  DEF-013 | MINOR  | NCB discount not shown in plan card
  DEF-014 | MINOR  | Mobile layout breaks at 375px on login

Closed Today       :   1
  DEF-009 | Fixed and verified ✅

Open Defects       :   8 (2 Critical, 3 Major, 3 Minor)

⚠️  BLOCKERS / RISKS
───────────────────────────────────────────────
- DEF-012 (Claim validation) blocking claim test cases
- Waiting for dev fix on DEF-011 (payment method switch)

📅 PLAN FOR TOMORROW
───────────────────────────────────────────────
- Execute Claims module remaining 12 test cases
- Re-test DEF-012 after fix
- Start Admin Panel testing

QA Engineer Sign: _________________
════════════════════════════════════════════════
```

### 9.2 Weekly Test Execution Summary

```
╔═══════════════════════════════════════════════════════╗
║         WEEKLY TEST EXECUTION SUMMARY                 ║
║         Week 3 | InsureAI v1.0 | 24-Mar-2026         ║
╠════════════════╦══════╦═════╦══════╦═════╦═══════════╣
║ Module         ║ Total║ Pass║ Fail ║Block║ % Done    ║
╠════════════════╬══════╬═════╬══════╬═════╬═══════════╣
║ Registration   ║   20 ║  18 ║    2 ║   0 ║ 100%      ║
║ Login          ║   15 ║  14 ║    1 ║   0 ║ 100%      ║
║ Dashboard      ║    8 ║   8 ║    0 ║   0 ║ 100%      ║
║ Motor Quote    ║   15 ║  13 ║    2 ║   0 ║ 100%      ║
║ Health Quote   ║   10 ║  10 ║    0 ║   0 ║ 100%      ║
║ Home Quote     ║    5 ║   5 ║    0 ║   0 ║ 100%      ║
║ Travel Quote   ║    8 ║   6 ║    2 ║   0 ║ 100%      ║
║ Checkout       ║   10 ║   8 ║    1 ║   1 ║  90%      ║
║ Policies       ║   11 ║   9 ║    1 ║   1 ║  91%      ║
║ Claims         ║   15 ║  10 ║    3 ║   2 ║  80%      ║
║ Payments       ║    7 ║   0 ║    0 ║   0 ║   0% (TBD)║
║ Documents      ║    5 ║   0 ║    0 ║   0 ║   0% (TBD)║
║ Admin Panel    ║   18 ║   0 ║    0 ║   0 ║   0% (TBD)║
║ NFR/Security   ║   14 ║   0 ║    0 ║   0 ║   0% (TBD)║
╠════════════════╬══════╬═════╬══════╬═════╬═══════════╣
║ TOTAL          ║  167 ║ 101 ║   12 ║   4 ║  70%      ║
╚════════════════╩══════╩═════╩══════╩═════╩═══════════╝
```

---

## ┌─────────────────────────────────────────┐
## │       AUTOMATION QA ENGINEER            │
## └─────────────────────────────────────────┘

### 9.3 Automation Execution Report

```
════════════════════════════════════════════════
AUTOMATION EXECUTION REPORT — InsureAI
Date     : 24-Mar-2026
Run ID   : RUN-2026-032401
Browser  : Chromium 131 | Firefox 132 | Webkit
════════════════════════════════════════════════

SUITE RESULTS
─────────────────────────────────────────────
Smoke Tests        :  10/10 PASSED ✅  (2m 14s)
Regression Tests   :  68/72 PASSED    (18m 42s)
  ├─ Auth          :  12/12 PASSED ✅
  ├─ Quote         :  18/20 PASSED ⚠️  (2 failed)
  ├─ Policy        :  14/14 PASSED ✅
  ├─ Claims        :  12/12 PASSED ✅
  ├─ Payments      :   8/ 8 PASSED ✅
  └─ Admin         :   4/ 6 PASSED ⚠️  (2 failed)
Performance Tests  :  14/14 PASSED ✅  (8m 33s)
E2E Tests          :   3/ 3 PASSED ✅  (4m 11s)

FAILURE DETAILS
─────────────────────────────────────────────
1. motor-quote.spec.js:45 — Model dropdown not populated
   Error: locator '#model' has no options after make selection
   Screenshot: attached | Video: attached

2. admin-access.spec.js:78 — Race condition in claim update
   Error: Timeout waiting for table refresh after status update
   Likely: Missing await after modal close
   Fix: Add explicit wait for table re-render

PERFORMANCE SUMMARY
─────────────────────────────────────────────
Avg Page Load : 312ms  ✅ (Budget: 3000ms)
FCP Average   : 248ms  ✅ (Budget: 1800ms)
LCP Average   : 421ms  ✅ (Budget: 2500ms)
CLS Average   : 0.02   ✅ (Budget: 0.1)

NEXT ACTIONS
─────────────────────────────────────────────
□ Fix model dropdown race condition (ETA: today)
□ Add explicit wait for admin table refresh
□ Add 5 more regression tests for claims module
════════════════════════════════════════════════
```

---

# ══════════════════════════════════════════════
# PHASE 10 — RELEASE ACTIVITIES
# ══════════════════════════════════════════════

### 10.1 Test Summary Report (TSR)

```
╔══════════════════════════════════════════════════════════════╗
║               TEST SUMMARY REPORT (TSR)                      ║
║           InsureAI General Insurance Portal v1.0             ║
╠══════════════════════════════════════════════════════════════╣
║ Project         : InsureAI Demo Platform                     ║
║ Version         : 1.0                                        ║
║ Test Period     : 01-Mar-2026 to 24-Mar-2026                ║
║ QA Lead         : [Your Name]                               ║
║ Environment     : localhost:3000 | Chrome 131               ║
╠══════════════════════════════════════════════════════════════╣
║ EXECUTION SUMMARY                                            ║
║   Total Test Cases     : 167                                ║
║   Executed             : 167 (100%)                         ║
║   Passed               : 152 (91%)                          ║
║   Failed               :  10 (6%)                           ║
║   Blocked              :   5 (3%)                           ║
╠══════════════════════════════════════════════════════════════╣
║ DEFECT SUMMARY                                               ║
║   Total Raised         :  28                                ║
║   Critical (P1)        :   2  — CLOSED ✅                   ║
║   Major (P2)           :   8  — 6 Closed, 2 Open ⚠️        ║
║   Minor (P3)           :  14  — 10 Closed, 4 Open          ║
║   Trivial (P4)         :   4  — 2 Closed, 2 Open           ║
╠══════════════════════════════════════════════════════════════╣
║ AUTOMATION COVERAGE                                          ║
║   Total Automatable    :  95                                ║
║   Automated            :  82 (86%)                          ║
║   Automation Pass Rate : 94%                                ║
╠══════════════════════════════════════════════════════════════╣
║ PERFORMANCE RESULTS                                          ║
║   All 14 pages < 3s load time    : ✅ PASS (REQ-017)       ║
║   Core Web Vitals (LCP/CLS/FCP)  : ✅ GOOD rating          ║
║   10 Concurrent Users Stress     : ✅ PASS                  ║
╠══════════════════════════════════════════════════════════════╣
║ SIGN-OFF RECOMMENDATION                                      ║
║                                                              ║
║   ✅ All Critical defects resolved                          ║
║   ✅ Performance budgets met                                 ║
║   ✅ Security tests passed (auth guard, card data)          ║
║   ⚠️  2 Minor defects known — acceptable for demo           ║
║                                                              ║
║   RECOMMENDATION: APPROVE FOR CLIENT DEMONSTRATION          ║
╠══════════════════════════════════════════════════════════════╣
║ SIGN-OFF                                                     ║
║   QA Lead      : _____________ Date: ___________           ║
║   Dev Lead     : _____________ Date: ___________           ║
║   Product Owner: _____________ Date: ___________           ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 10.2 Release Notes

```
════════════════════════════════════════════════════════════
RELEASE NOTES — InsureAI v1.0
Date: 24-Mar-2026
════════════════════════════════════════════════════════════

FEATURES INCLUDED
─────────────────────────────────────────────────────────
✅ Module 1: User Registration & Login (with lockout)
✅ Module 2: Customer Dashboard with renewal alerts
✅ Module 3: Motor, Health, Home, Travel quote generation
✅ Module 4: Policy purchase, view, renew, cancel
✅ Module 5: Claims filing and status tracking
✅ Module 6: Payment with 5 methods + receipt
✅ Module 7: Document downloads
✅ Module 8: Admin panel (customers, claims, reports)

KNOWN ISSUES (Minor — Accepted for Demo)
─────────────────────────────────────────────────────────
⚠️ DEF-024: On mobile 375px, login form label overlaps
   Workaround: Use 390px or desktop for demo

⚠️ DEF-026: Firefox — date picker styling inconsistent
   Workaround: Use Chrome for demo

NOT INCLUDED IN THIS RELEASE
─────────────────────────────────────────────────────────
❌ Real payment gateway (sandbox only)
❌ Email/SMS delivery (simulated)
❌ PDF document generation (text file demo)

TEST CREDENTIALS
─────────────────────────────────────────────────────────
Customer : rahul@demo.com    / Test@1234
Admin    : admin@insureai.com / Admin@123
════════════════════════════════════════════════════════════
```

---

### 10.3 Stakeholder Email Template

```
Subject: ✅ InsureAI v1.0 — QA Sign-Off & Test Summary

Dear [Stakeholder Name],

I am pleased to share the QA sign-off for InsureAI General Insurance
Portal v1.0, which is now ready for client demonstration.

SUMMARY
───────────────────────────────────
• Total Test Cases Executed : 167/167 (100%)
• Pass Rate                 : 91%
• Critical Defects          : 0 Open
• Automation Coverage       : 86% (82 automated scripts)
• Performance               : All pages < 3s load (REQ-017 ✅)
• Core Web Vitals           : Good rating on all key pages

WHAT WAS TESTED
───────────────────────────────────
✅ User Registration & Login (including account lockout)
✅ Motor, Health, Home, Travel Insurance Quote flows
✅ End-to-end Policy Purchase with payment processing
✅ Claims filing, tracking and admin approval
✅ Admin panel: customer management, reports
✅ Security: Auth guard, no card data in storage
✅ Performance: Page load, concurrent users, memory
✅ Cross-browser: Chrome, Firefox, Edge

KNOWN MINOR ISSUES (Not blocking demo)
───────────────────────────────────
• Minor UI issue on 375px mobile (Chrome recommended for demo)
• Firefox date picker minor styling difference

RECOMMENDATION
───────────────────────────────────
The application is APPROVED for client demonstration.
All critical business flows are working correctly.

Attached: Test Summary Report, Automation Report, Performance Dashboard

Best regards,
[QA Team Lead Name]
QA Team Lead — InsureAI Project
```

---

# ══════════════════════════════════════════════
# PHASE 11 — MAINTENANCE
# ══════════════════════════════════════════════

## ┌─────────────────────────────────────────┐
## │         MANUAL QA ENGINEER              │
## └─────────────────────────────────────────┘

### 11.1 Test Case Maintenance Checklist

```
WHEN TO UPDATE TEST CASES
─────────────────────────────────────────────
□ New feature added         → Add new test cases
□ Existing feature changed  → Update affected test cases
□ Bug fixed                 → Add regression test case
□ Requirement changed       → Update RTM + test cases
□ UI changed (locators)     → Update test steps/screenshots
□ Test case marked invalid  → Remove or archive with reason
□ Sprint retrospective      → Review and improve test coverage
```

## ┌─────────────────────────────────────────┐
## │       AUTOMATION QA ENGINEER            │
## └─────────────────────────────────────────┘

### 11.2 Automation Maintenance Plan

```
MAINTENANCE TRIGGERS
─────────────────────────────────────────────
1. Locator change    → Update Page Object selectors
2. New field added   → Add to test + fixture data
3. Flow changed      → Update E2E spec files
4. Flaky test        → Add explicit waits / retry logic
5. Performance drift → Update threshold constants

FLAKY TEST RESOLUTION STRATEGY
─────────────────────────────────────────────
Step 1 : Run flaky test 5x — record pass/fail rate
Step 2 : Check if timing issue → add waitFor() or expect()
Step 3 : Check if data issue  → fix seed data
Step 4 : Check if env issue   → add beforeEach cleanup
Step 5 : If irreparable → quarantine with @flaky tag

CI/CD PIPELINE — GitHub Actions
─────────────────────────────────────────────
Trigger     : On every push to main branch
              On every Pull Request
Schedule    : Nightly regression at 11 PM

Jobs        :
  1. lint-check    (2 min)
  2. smoke-tests   (5 min) — Fail fast
  3. regression    (25 min)
  4. perf-tests    (15 min)
  5. report-gen    (2 min)
  6. notify        → Slack/email on failure
```

### 11.3 GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/qa-pipeline.yml
name: InsureAI QA Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 23 * * *'   # Nightly at 11 PM

jobs:
  smoke-test:
    name: 🔥 Smoke Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run serve & sleep 3 && npx playwright test tests/smoke/
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: smoke-failure-report
          path: playwright-report/

  regression:
    name: 🔄 Regression Tests
    needs: smoke-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run serve & sleep 3 && npx playwright test tests/regression/
      - uses: actions/upload-artifact@v3
        with:
          name: regression-report
          path: playwright-report/

  performance:
    name: ⚡ Performance Tests
    needs: smoke-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run perf:all
      - uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-results/
```

---

# ══════════════════════════════════════════════
# APPENDIX
# ══════════════════════════════════════════════

## A. Test Coverage Summary

| Module | Manual TCs | Auto TCs | Coverage |
|---|---|---|---|
| Registration/Login | 20 | 18 | 95% |
| Dashboard | 8 | 5 | 85% |
| Motor Quote | 15 | 12 | 90% |
| Health Quote | 10 | 8 | 85% |
| Home/Travel Quote | 13 | 8 | 80% |
| Checkout/Policy | 21 | 18 | 90% |
| Claims | 15 | 12 | 88% |
| Payments | 7 | 5 | 85% |
| Documents | 5 | 2 | 70% |
| Admin Panel | 18 | 10 | 75% |
| NFR/Security | 14 | 12 | 92% |
| **TOTAL** | **146** | **110** | **87%** |

## B. Tools Summary

| Tool | Used By | Purpose |
|---|---|---|
| Playwright v1.55 | Automation QA | Test automation + performance |
| VS Code | Both | Code editor |
| Chrome DevTools | Both | Debugging, network, performance |
| JIRA | Manual QA | Defect tracking |
| GitHub Actions | Automation QA | CI/CD pipeline |
| `serve` (npm) | Both | Local web server |
| Navigation Timing API | Automation QA | Page load measurement |
| PerformanceObserver | Automation QA | Core Web Vitals |
| Excel/Google Sheets | Manual QA | Test case management |

---

*Document Version: 1.0 | Prepared by: QA Team Lead | Date: 24-Mar-2026*
*Project: InsureAI General Insurance Portal | Client Demo Version*
