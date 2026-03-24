# Software Requirements Specification (SRS)
# General Insurance Web Application

---

**Document Version:** 1.0
**Date:** 2026-03-23
**Purpose:** Dummy application for AI-powered Software Testing Demo
**Prepared For:** QA AI Demo Presentation

---

## Table of Contents

1. Introduction
2. Overall Description
3. Module 1 — User Registration & Login
4. Module 2 — Customer Dashboard
5. Module 3 — Get a Quote
6. Module 4 — Policy Management
7. Module 5 — Claims Management
8. Module 6 — Payment Management
9. Module 7 — Documents & Downloads
10. Module 8 — Admin Panel
11. Non-Functional Requirements
12. Assumptions & Constraints

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for a **General Insurance Web Application**. It covers core modules from user registration to claims processing. This document will be used to generate test cases, execute tests, and demonstrate AI-assisted testing capabilities.

### 1.2 Scope
The application allows customers to:
- Register and manage their profile
- Get insurance quotes for Motor, Health, Home, and Travel insurance
- Purchase and manage policies
- File and track claims
- Make premium payments
- Download policy documents

### 1.3 Intended Audience
- QA Engineers
- Developers
- Client Stakeholders

---

## 2. Overall Description

### 2.1 Application Overview
A web-based insurance portal accessible via modern browsers. Users can self-serve from quote generation to claims filing without visiting a branch.

### 2.2 User Roles

| Role | Description |
|---|---|
| Guest | Can view product info and get quote |
| Customer | Registered user who can buy, manage policies and file claims |
| Agent | Internal staff who manages customer policies |
| Admin | Full access to all modules and reports |

### 2.3 Technology Assumptions
- Responsive Web Application (Desktop + Mobile)
- Supported Browsers: Chrome, Firefox, Edge, Safari
- Session timeout: 30 minutes of inactivity

---

## 3. Module 1 — User Registration & Login

### 3.1 User Registration

**REQ-001:** The system shall allow new users to register using:
- Full Name (mandatory)
- Email Address (mandatory, must be unique)
- Mobile Number (mandatory, 10 digits)
- Date of Birth (mandatory, user must be 18+)
- Password (mandatory, min 8 chars, must include uppercase, lowercase, number, special character)
- Confirm Password (mandatory, must match password)

**REQ-002:** The system shall send a verification email after successful registration. User cannot log in until email is verified.

**REQ-003:** The system shall display inline validation errors for each field without page reload.

**REQ-004:** The system shall not allow registration with an already registered email address.

**REQ-005:** Mobile number must be validated as a 10-digit numeric value.

**REQ-006:** The system shall display a success message after successful registration.

---

### 3.2 User Login

**REQ-007:** Registered and verified users shall be able to log in using Email and Password.

**REQ-008:** The system shall lock the account after 5 consecutive failed login attempts and send an unlock email.

**REQ-009:** The system shall provide a "Forgot Password" option that sends a reset link to the registered email.

**REQ-010:** Password reset link shall expire after 24 hours.

**REQ-011:** The system shall support "Remember Me" functionality for 7 days.

**REQ-012:** The system shall redirect users to their Dashboard after successful login.

**REQ-013:** The system shall display an appropriate error message for invalid credentials without specifying which field is wrong (for security).

---

### 3.3 Logout

**REQ-014:** Users shall be able to log out from any page using the top navigation.

**REQ-015:** After logout, clicking the browser back button shall not allow access to authenticated pages.

---

## 4. Module 2 — Customer Dashboard

**REQ-016:** The dashboard shall display:
- Welcome message with customer name
- Active policies summary (count and type)
- Upcoming renewal dates (within 30 days highlighted in orange, within 7 days in red)
- Pending claims count
- Quick action buttons: Get Quote, File Claim, Make Payment, Download Policy

**REQ-017:** The dashboard shall load within 3 seconds on a standard broadband connection.

**REQ-018:** Customers with no policies shall see a prompt to "Get Your First Quote".

---

## 5. Module 3 — Get a Quote

### 5.1 Insurance Types Available

The application shall support quotes for:
1. Motor Insurance
2. Health Insurance
3. Home Insurance
4. Travel Insurance

---

### 5.2 Motor Insurance Quote

**REQ-019:** To generate a motor insurance quote, the system shall collect:
- Vehicle Type (Two-Wheeler / Four-Wheeler / Commercial)
- Vehicle Registration Number (mandatory)
- Vehicle Make and Model (dropdown)
- Manufacturing Year (dropdown, current year to 20 years back)
- Fuel Type (Petrol / Diesel / Electric / CNG)
- Previous Insurance Expiry Date
- No Claim Bonus (NCB) percentage
- Owner Name (auto-filled from profile)
- City of Registration

**REQ-020:** The system shall validate the vehicle registration number format.

**REQ-021:** The system shall display at least 3 plan options (Basic, Standard, Comprehensive) with premium amounts.

**REQ-022:** Customer shall be able to add optional add-ons: Zero Depreciation, Roadside Assistance, Engine Protection.

**REQ-023:** Premium shall update dynamically when add-ons are selected/deselected.

---

### 5.3 Health Insurance Quote

**REQ-024:** To generate a health insurance quote, the system shall collect:
- Plan Type (Individual / Family Floater)
- Number of Members (1–6)
- Age of each member
- Sum Insured (dropdown: 3L, 5L, 10L, 15L, 25L, 50L)
- City (for hospital network display)
- Any Pre-existing Disease (Yes/No)

**REQ-025:** If pre-existing disease is selected, a waiting period note shall be displayed.

**REQ-026:** Premium shall vary based on age, sum insured, and number of members.

---

### 5.4 Home Insurance Quote

**REQ-027:** To generate a home insurance quote, the system shall collect:
- Property Type (Owned / Rented)
- Construction Type (RCC / Other)
- Property Age (in years)
- Built-up Area (in sq. ft.)
- Property Value (estimated)
- City and PIN Code

**REQ-028:** Cover options shall include: Structure Only, Contents Only, Structure + Contents.

---

### 5.5 Travel Insurance Quote

**REQ-029:** To generate a travel insurance quote, the system shall collect:
- Trip Type (Single Trip / Multi Trip / Student)
- Destination (Domestic / International — country selection)
- Travel Start Date and End Date
- Number of Travellers
- Age of each traveller
- Sum Insured

**REQ-030:** Travel dates must be in the future; past dates shall not be accepted.

**REQ-031:** Maximum trip duration for single trip shall be 180 days.

---

### 5.6 Quote Summary

**REQ-032:** After quote generation, the system shall display:
- Plan details and coverage summary
- Premium breakdown (Base Premium + GST + Add-ons)
- "Buy Now" and "Save Quote" buttons
- "Compare Plans" option (up to 3 plans)

**REQ-033:** Saved quotes shall be accessible from the customer dashboard for 30 days.

---

## 6. Module 4 — Policy Management

### 6.1 Buy Policy

**REQ-034:** Customer shall be able to purchase a policy from:
- A saved quote
- Directly from the quote results page

**REQ-035:** Before purchase, the system shall collect/confirm:
- Nominee Name, Relationship, and Date of Birth
- Communication Address
- KYC Documents (PAN Card / Aadhaar)

**REQ-036:** The system shall display a Policy Summary page before final payment.

**REQ-037:** After successful payment, the system shall:
- Generate a unique Policy Number
- Send policy document to registered email
- Display policy confirmation screen

---

### 6.2 View Policies

**REQ-038:** Customer shall be able to view all active and expired policies.

**REQ-039:** Each policy tile shall display:
- Policy Number
- Insurance Type
- Coverage Amount
- Start and End Date
- Premium Amount
- Status (Active / Expired / Cancelled)

**REQ-040:** Customer shall be able to click on any policy to view full details.

---

### 6.3 Renew Policy

**REQ-041:** Customer shall be able to renew a policy within 60 days before its expiry date.

**REQ-042:** The renewal premium may differ from the original based on NCB or age changes.

**REQ-043:** Customer shall be able to modify add-ons or sum insured at the time of renewal.

**REQ-044:** After renewal payment, a new policy document shall be generated with a new policy number.

---

### 6.4 Cancel Policy

**REQ-045:** Customer shall be able to request policy cancellation from the policy detail page.

**REQ-046:** The system shall display the refund amount (pro-rata basis) before confirmation.

**REQ-047:** Cancellation requests shall be processed within 7 business days.

---

## 7. Module 5 — Claims Management

### 7.1 File a Claim

**REQ-048:** Customer shall be able to file a claim from the dashboard or policy detail page.

**REQ-049:** The system shall collect:
- Policy Number (auto-filled if coming from policy page)
- Date of Incident
- Type of Claim (Cashless / Reimbursement)
- Description of Incident (max 500 characters)
- Estimated Claim Amount
- Supporting Documents (PDF/JPG, max 5MB each, max 5 files)

**REQ-050:** Date of Incident must not be before the policy start date or after the policy end date.

**REQ-051:** The system shall generate a unique Claim Reference Number after submission.

**REQ-052:** A confirmation email with the claim reference number shall be sent to the customer.

---

### 7.2 Track Claim Status

**REQ-053:** Customer shall be able to track claim status using the claim reference number or from the dashboard.

**REQ-054:** Claim status values: Submitted → Under Review → Approved / Rejected / Additional Info Required.

**REQ-055:** Customer shall be notified via email and SMS on every status change.

**REQ-056:** If status is "Additional Info Required", customer shall be able to upload additional documents from the portal.

---

### 7.3 Claim History

**REQ-057:** Customer shall be able to view all past claims with status and settlement amount.

---

## 8. Module 6 — Payment Management

### 8.1 Payment Methods

**REQ-058:** The system shall support:
- Credit Card / Debit Card
- Net Banking
- UPI
- Wallet (Paytm, PhonePe)
- EMI (for premiums above ₹5,000)

**REQ-059:** The payment page shall be secured (HTTPS) and PCI-DSS compliant.

**REQ-060:** The system shall not store card details on the server.

---

### 8.2 Payment Flow

**REQ-061:** After selecting payment method and entering details, customer shall see an Order Summary before final confirmation.

**REQ-062:** On successful payment, the system shall display a transaction ID and confirmation message.

**REQ-063:** On failed payment, the system shall display the failure reason and allow retry without re-entering form data.

**REQ-064:** A payment receipt shall be sent to the customer's email and available for download from the portal.

---

### 8.3 Payment History

**REQ-065:** Customer shall be able to view all past transactions with date, amount, status, and transaction ID.

**REQ-066:** Customer shall be able to download receipts for any past transaction.

---

## 9. Module 7 — Documents & Downloads

**REQ-067:** Customer shall be able to download the following documents at any time:
- Policy Document (PDF)
- Premium Receipt
- Renewal Notice
- Claim Settlement Letter

**REQ-068:** Documents shall open in a new browser tab for preview before download.

**REQ-069:** The system shall maintain a document history for the last 5 years.

---

## 10. Module 8 — Admin Panel

**REQ-070:** Admin shall be able to view all registered customers and their policies.

**REQ-071:** Admin shall be able to search customers by Name, Email, Policy Number, or Mobile Number.

**REQ-072:** Admin shall be able to view and update claim status.

**REQ-073:** Admin shall be able to generate reports:
- Total Policies Sold (date range filter)
- Claims Filed vs Settled
- Premium Collection Summary
- Customer Registration Trend

**REQ-074:** Admin shall be able to deactivate a customer account.

**REQ-075:** Admin panel shall be accessible only from whitelisted IP addresses.

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Requirement | Target |
|---|---|
| Page Load Time | < 3 seconds |
| Quote Generation Response | < 5 seconds |
| Payment Processing | < 10 seconds |
| Concurrent Users Supported | 500+ |

### 11.2 Security

**REQ-076:** All passwords shall be stored using bcrypt hashing (min cost factor 12).

**REQ-077:** All API endpoints shall require authentication tokens (JWT).

**REQ-078:** The system shall implement CSRF protection on all forms.

**REQ-079:** The system shall implement rate limiting: max 10 API requests per second per user.

**REQ-080:** All sensitive data in transit shall be encrypted using TLS 1.2 or higher.

### 11.3 Usability

**REQ-081:** The application shall be fully responsive and usable on screen widths from 320px to 2560px.

**REQ-082:** All form fields shall have visible labels and placeholder text.

**REQ-083:** Error messages shall be displayed in red, success messages in green.

**REQ-084:** All date pickers shall follow DD/MM/YYYY format.

### 11.4 Availability

**REQ-085:** System uptime shall be 99.9% (excluding planned maintenance).

**REQ-086:** Planned maintenance windows shall be communicated 48 hours in advance.

### 11.5 Compatibility

**REQ-087:** The application shall be compatible with:
- Chrome 100+
- Firefox 100+
- Edge 100+
- Safari 15+
- iOS 14+ (Mobile Safari)
- Android 10+ (Chrome)

---

## 12. Assumptions & Constraints

### Assumptions
- Users have a valid email address for registration and communication.
- Payment gateway integration will use a sandbox/mock environment for the demo.
- Document generation will produce dummy PDFs for the demo.
- SMS notifications will be simulated (logged to console) in the demo environment.

### Constraints
- This is a demonstration application — no real insurance products are sold.
- All data entered is fictional and for testing purposes only.
- The application does not integrate with any real insurance regulatory systems.

---

## Appendix — Quick Module Summary

| Module | Key Entities | Key Actions |
|---|---|---|
| Registration/Login | User | Register, Login, Forgot Password, Logout |
| Dashboard | Policy, Claim | View summary, Quick actions |
| Get a Quote | Quote | Motor, Health, Home, Travel quote |
| Policy Management | Policy | Buy, View, Renew, Cancel |
| Claims Management | Claim | File, Track, Upload docs |
| Payments | Transaction | Pay, View history, Download receipt |
| Documents | Document | Download policy, receipt, letter |
| Admin Panel | All | Manage customers, claims, reports |

---

*End of Requirements Document*
*Version 1.0 — General Insurance Application — QA AI Demo*
