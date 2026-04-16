// ── URL Analyzer ─────────────────────────────────────────────────────────────
// Fetches a URL, parses its HTML, and extracts features (forms, inputs,
// buttons, links) to drive targeted test case generation — without needing
// a requirement document.
//
// Works for static HTML + server-rendered pages. For pure client-side SPAs
// the page may return an empty shell; in that case we fall back to keyword
// extraction from whatever text is present and the rule-based generator
// fills in standard modules.

const fs      = require('fs');
const path    = require('path');

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES     = 2_000_000; // 2 MB cap on fetched HTML

// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Analyze a URL or a local file:// path.
 * @param {string} url
 * @returns {Promise<{keywords: string[], summary: object, detected: object}>}
 */
async function analyze(url) {
  if (!url) throw new Error('url is required');

  let html = '';
  try {
    html = await fetchContent(url);
  } catch (err) {
    // Networking failure — return empty analysis; caller will fall back to
    // generic mode (all 17 modules).
    return {
      keywords: ['login', 'register', 'signup', 'form', 'submit', 'navigation', 'dashboard'],
      summary: {
        title: 'Unable to fetch URL',
        fetchError: err.message,
      },
      detected: {},
    };
  }

  return extractFeatures(html, url);
}

// ── Fetch (http/https/file://) ──────────────────────────────────────────────
async function fetchContent(url) {
  if (url.startsWith('file://')) {
    const filePath = url.replace(/^file:\/{2,}/, '').replace(/^\/?([a-zA-Z]):/, '$1:');
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.slice(0, MAX_BODY_BYTES);
  }

  // http / https — use Node's built-in fetch (Node 18+)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Pretend to be a normal browser — some sites gate HTML on UA
        'User-Agent': 'Mozilla/5.0 (compatible; QA-Platform-Analyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    return text.slice(0, MAX_BODY_BYTES);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Feature extractor ───────────────────────────────────────────────────────
function extractFeatures(html, url) {
  const h = html; // alias
  const lower = h.toLowerCase();

  // --- Title & meta ---
  const titleMatch = h.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = h.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,300})/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // --- Forms ---
  const forms = (h.match(/<form\b[^>]*>/gi) || []).length;

  // --- Inputs ---
  const inputs = h.match(/<input\b[^>]*>/gi) || [];
  const inputTypes = {};
  for (const inp of inputs) {
    const typeMatch = inp.match(/type=["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text';
    inputTypes[type] = (inputTypes[type] || 0) + 1;
  }

  // --- Buttons ---
  const buttons = h.match(/<button\b[^>]*>([^<]*)<\/button>/gi) || [];
  const buttonTexts = buttons
    .map(b => (b.match(/>([^<]+)</) || [])[1])
    .filter(Boolean)
    .map(t => t.trim().toLowerCase());

  // --- Links (to discover navigation structure) ---
  const anchors = h.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([^<]{0,100})<\/a>/gi) || [];
  const navLinks = [];
  for (const a of anchors.slice(0, 200)) {
    const hrefMatch = a.match(/href=["']([^"']+)["']/i);
    const textMatch = a.match(/>([^<]+)</);
    if (hrefMatch && textMatch) {
      const text = textMatch[1].trim();
      if (text && text.length < 60) navLinks.push(text.toLowerCase());
    }
  }

  // --- Keyword detection helpers ---
  const has = (re) => re.test(lower);
  const hasAny = (...regexes) => regexes.some(r => r.test(lower));

  const keywords = new Set();
  const detected = {};

  // Login form (password input is the strongest signal)
  if (inputTypes.password > 0 || hasAny(/\blog\s*in\b/, /\bsign\s*in\b/, /forgot\s+password/)) {
    detected.login = true;
    ['login', 'signin', 'sign in', 'password', 'authentication'].forEach(k => keywords.add(k));
  }

  // Registration
  if (hasAny(/\bsign\s*up\b/, /\bregister\b/, /create\s+account/, /create\s+an\s+account/, /get\s+started/)) {
    detected.register = true;
    ['register', 'signup', 'sign up', 'create account', 'registration'].forEach(k => keywords.add(k));
  }

  // Email (could be anywhere — form, footer, etc)
  if (inputTypes.email > 0 || has(/\btype=["']email["']/)) {
    keywords.add('email');
  }

  // Payment / checkout / billing
  if (hasAny(/\bpayment\b/, /\bcheckout\b/, /\bcredit\s*card\b/, /\bbilling\b/, /\bpurchase\b/, /card\s*number/)) {
    detected.payment = true;
    ['payment', 'checkout', 'billing', 'card', 'transaction'].forEach(k => keywords.add(k));
  }

  // Search
  if (inputTypes.search > 0 || /<input[^>]*(name|id|placeholder)=["'][^"']*search/i.test(h) ||
      hasAny(/\bsearch\b/, /\bfind\b/, /\bquery\b/)) {
    detected.search = true;
    ['search', 'filter', 'find'].forEach(k => keywords.add(k));
  }

  // Navigation / menu
  const hasNav = /<nav\b/i.test(h) || /(role=["']navigation["'])/i.test(h) || navLinks.length >= 3;
  if (hasNav) {
    detected.navigation = true;
    ['navigation', 'menu', 'nav', 'link', 'page'].forEach(k => keywords.add(k));
  }

  // Logout / session
  if (hasAny(/\blog\s*out\b/, /\bsign\s*out\b/, /\blogout\b/, /\bsignout\b/)) {
    detected.logout = true;
    ['logout', 'signout', 'session'].forEach(k => keywords.add(k));
  }

  // Password reset / forgot
  if (hasAny(/forgot\s+password/, /reset\s+password/, /password\s+reset/, /change\s+password/)) {
    detected.password = true;
    ['forgot password', 'reset password', 'password'].forEach(k => keywords.add(k));
  }

  // Dashboard / home
  if (hasAny(/\bdashboard\b/, /\bhome\s+page\b/, /\blanding\b/, /\boverview\b/, /\bsummary\b/)) {
    detected.dashboard = true;
    ['dashboard', 'home', 'overview', 'summary'].forEach(k => keywords.add(k));
  }

  // Profile / account / settings
  if (hasAny(/\bprofile\b/, /\baccount\b/, /\bsettings\b/, /\bmy\s+account\b/)) {
    detected.profile = true;
    ['profile', 'account', 'settings', 'user details'].forEach(k => keywords.add(k));
  }

  // Form generally
  if (forms > 0 || inputs.length >= 2) {
    detected.forms = true;
    ['form', 'input', 'validation', 'validate', 'field', 'submit'].forEach(k => keywords.add(k));
  }

  // Security — HTTPS check
  if (url.startsWith('https://')) detected.https = true;
  // CSP?
  if (/content-security-policy/i.test(h)) detected.hasCSP = true;

  // Summary
  const summary = {
    title,
    description: description.slice(0, 200),
    formsCount:   forms,
    inputsCount:  inputs.length,
    buttonsCount: buttons.length,
    linksCount:   anchors.length,
    inputTypes,
    buttonLabels: buttonTexts.slice(0, 10),
    navLinks:     navLinks.slice(0, 15),
    detected,
  };

  return {
    keywords: [...keywords],
    summary,
    detected,
  };
}

module.exports = { analyze };
