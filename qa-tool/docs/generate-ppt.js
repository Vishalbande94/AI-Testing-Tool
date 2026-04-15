const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const pptx = new PptxGenJS();

// ─── Theme Colors (matches app dark theme) ───
const C = {
  bg:       '0F172A',
  surface:  '1E293B',
  surface2: '334155',
  primary:  '6366F1',
  accent:   '00BCD4',
  orange:   'FF6F00',
  gold:     'FFD54F',
  green:    '10B981',
  red:      'EF4444',
  amber:    'F59E0B',
  white:    'FFFFFF',
  light:    'CBD5E1',
  grey:     '94A3B8',
  darkBlue: '0D47A1',
};

pptx.author = 'QA AI Testing Tool';
pptx.company = 'InsureAI QA Team';
pptx.title = 'QA AI Testing Tool — Product Presentation';
pptx.subject = 'Complete Feature Walkthrough';
pptx.layout = 'LAYOUT_WIDE';

// ─── Helpers ───
function addSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.bg };
  slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.orange } });
  slide.addShape('rect', { x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: C.surface } });
  slide.addText('QA AI Testing Tool | Confidential', { x: 0.5, y: 7.22, w: 8, h: 0.25, fontSize: 8, color: C.grey, fontFace: 'Segoe UI' });
  slide.addText('http://localhost:3001', { x: 9, y: 7.22, w: 4, h: 0.25, fontSize: 8, color: C.accent, fontFace: 'Segoe UI', align: 'right' });
  return slide;
}

function title(s, text, opts = {}) {
  s.addText(text, { x: opts.x || 0.6, y: opts.y || 0.3, w: opts.w || 12, h: 0.6, fontSize: opts.size || 28, bold: true, color: opts.color || C.white, fontFace: 'Segoe UI' });
}

function subtitle(s, text, opts = {}) {
  s.addText(text, { x: opts.x || 0.6, y: opts.y || 0.85, w: opts.w || 12, h: 0.4, fontSize: opts.size || 14, color: opts.color || C.accent, fontFace: 'Segoe UI' });
}

function card(s, x, y, w, h, bg) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.15, fill: { color: bg || C.surface } });
}

function iconCard(s, x, y, w, h, icon, label, desc, iconBg) {
  card(s, x, y, w, h);
  s.addShape('ellipse', { x: x + w/2 - 0.3, y: y + 0.25, w: 0.6, h: 0.6, fill: { color: iconBg || C.primary } });
  s.addText(icon, { x: x + w/2 - 0.3, y: y + 0.28, w: 0.6, h: 0.6, fontSize: 20, align: 'center', valign: 'middle', color: C.white, fontFace: 'Segoe UI' });
  s.addText(label, { x: x + 0.15, y: y + 1.0, w: w - 0.3, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center' });
  s.addText(desc, { x: x + 0.15, y: y + 1.35, w: w - 0.3, h: 0.8, fontSize: 9, color: C.grey, fontFace: 'Segoe UI', align: 'center', valign: 'top' });
}

function flowArrow(s, x, y, w) {
  s.addShape('rightArrow', { x, y, w: w || 0.4, h: 0.25, fill: { color: C.accent } });
}

function tableSlide(s, headers, rows, opts = {}) {
  const tableRows = [];
  tableRows.push(headers.map(h => ({ text: h, options: { fontSize: 10, bold: true, color: C.white, fill: { color: C.primary }, fontFace: 'Segoe UI', align: 'center', valign: 'middle' } })));
  rows.forEach((row, idx) => {
    tableRows.push(row.map(cell => {
      const t = String(cell);
      const isStatus = t.includes('✓') || t.includes('✗') || t.includes('⚠');
      return { text: t, options: { fontSize: 9, color: isStatus ? (t.includes('✓') ? C.green : t.includes('✗') ? C.red : C.amber) : C.light, fill: { color: idx % 2 === 0 ? C.surface : C.surface2 }, fontFace: 'Segoe UI', bold: isStatus, valign: 'middle' } };
    }));
  });
  s.addTable(tableRows, { x: opts.x || 0.6, y: opts.y || 1.8, w: opts.w || 12, border: { type: 'solid', pt: 0.5, color: C.surface2 }, rowH: opts.rowH || 0.35, colW: opts.colW });
}

// ══════════════════════════════════════════════════════════════
//  SLIDE 1 — COVER
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  s.addShape('ellipse', { x: 10, y: 0.5, w: 3, h: 3, fill: { color: C.primary }, transparency: 85 });
  s.addShape('ellipse', { x: 11, y: 4, w: 2.5, h: 2.5, fill: { color: C.accent }, transparency: 88 });
  s.addText('🤖', { x: 1, y: 1.2, w: 2, h: 1.5, fontSize: 60, align: 'center' });
  s.addText('QA AI Testing Tool', { x: 1, y: 2.6, w: 11, h: 1, fontSize: 44, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('Automated Test Generation  •  Execution  •  Reporting', { x: 1, y: 3.5, w: 11, h: 0.5, fontSize: 18, color: C.accent, fontFace: 'Segoe UI' });
  s.addShape('rect', { x: 1, y: 4.2, w: 4, h: 0.03, fill: { color: C.primary } });
  s.addText('Transform Requirements into Executable Tests — Zero Code Required', { x: 1, y: 4.5, w: 10, h: 0.4, fontSize: 14, color: C.grey, fontFace: 'Segoe UI', italic: true });
  s.addText([{ text: 'URL: ', options: { color: C.grey } }, { text: 'http://localhost:3001', options: { color: C.accent, bold: true } }], { x: 1, y: 5.3, w: 6, h: 0.3, fontSize: 12, fontFace: 'Segoe UI' });
  s.addText([{ text: 'Version 1.0  |  ', options: { color: C.grey } }, { text: 'April 2026', options: { color: C.light } }], { x: 1, y: 5.7, w: 6, h: 0.3, fontSize: 12, fontFace: 'Segoe UI' });
  s.addText('CONFIDENTIAL', { x: 1, y: 6.5, w: 3, h: 0.35, fontSize: 10, bold: true, color: C.primary, fontFace: 'Segoe UI' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 2 — AGENDA
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Agenda');
  subtitle(s, 'What We Will Cover Today');
  const items = [
    ['01', 'The Problem We Solve', 'Why manual QA is slow and error-prone'],
    ['02', 'Product Overview', 'What the QA AI Tool does end-to-end'],
    ['03', 'Core Features Walkthrough', '6 major capabilities with details'],
    ['04', 'AI Agent Team', '5 specialized AI agents working together'],
    ['05', 'Execution Pipeline', '10-step automated testing flow'],
    ['06', 'Email Automation', 'Deploy → Email → Auto-Test → Report'],
    ['07', 'JIRA Integration', 'Auto-create bugs from failed tests'],
    ['08', 'Script Generator', 'Generate full test frameworks as ZIP'],
    ['09', 'Reports & Analytics', 'HTML, Excel, JSON, Dashboard'],
    ['10', 'Architecture & Tech Stack', 'How it all fits together'],
    ['11', 'Live Demo Plan', 'End-to-end walkthrough at localhost:3001'],
    ['12', 'Roadmap & Next Steps', 'What is coming next'],
  ];
  items.forEach((item, i) => {
    const col = i < 6 ? 0 : 1;
    const row = i < 6 ? i : i - 6;
    const x = col === 0 ? 0.6 : 7;
    const y = 1.6 + row * 0.8;
    card(s, x, y, 5.8, 0.65);
    s.addText(item[0], { x: x + 0.15, y: y + 0.1, w: 0.5, h: 0.45, fontSize: 14, bold: true, color: C.primary, fontFace: 'Segoe UI', align: 'center' });
    s.addText(item[1], { x: x + 0.7, y: y + 0.05, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
    s.addText(item[2], { x: x + 0.7, y: y + 0.32, w: 4.5, h: 0.25, fontSize: 9, color: C.grey, fontFace: 'Segoe UI' });
  });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 3 — THE PROBLEM
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'The Problem We Solve');
  subtitle(s, 'Traditional QA is Slow, Manual, and Error-Prone');
  card(s, 0.5, 1.5, 6, 5.2, C.surface);
  s.addText('❌  Current Pain Points', { x: 0.7, y: 1.6, w: 5.5, h: 0.4, fontSize: 16, bold: true, color: C.red, fontFace: 'Segoe UI' });
  const pains = ['📝 Manual test case writing takes 2-3 days per module', '🐌 Test execution is slow — 30+ hours for full regression', '🔁 Repetitive work — same patterns across every project', '😓 Human error — missed edge cases, inconsistent coverage', '📊 Report creation takes 4-6 hours manually in Excel/Word', '🔗 No integration — separate tools for tests, bugs, reports', '💰 High cost — 3-5 QA engineers needed per project', '⏰ Delayed feedback — bugs found days after deployment'];
  pains.forEach((p, i) => { s.addText(p, { x: 0.8, y: 2.15 + i * 0.55, w: 5.5, h: 0.45, fontSize: 11, color: C.light, fontFace: 'Segoe UI' }); });

  card(s, 6.8, 1.5, 6, 5.2, C.surface);
  s.addText('✅  Our Solution', { x: 7, y: 1.6, w: 5.5, h: 0.4, fontSize: 16, bold: true, color: C.green, fontFace: 'Segoe UI' });
  const solutions = ['⚡ Auto-generate 30-100+ test cases in seconds', '🤖 AI + Rule-based dual engine — works with or without API', '🎭 Playwright execution with smart adaptive selectors', '📊 Instant HTML, Excel, JSON reports — one click', '🔗 Built-in JIRA integration — auto-log bugs', '📧 Email automation — deploy triggers tests automatically', '💰 Replaces 3-5 engineers for test case generation', '⏱️ Full pipeline in under 5 minutes, not 5 days'];
  solutions.forEach((p, i) => { s.addText(p, { x: 7.1, y: 2.15 + i * 0.55, w: 5.5, h: 0.45, fontSize: 11, color: C.light, fontFace: 'Segoe UI' }); });

  s.addText('5 days manual  →  5 minutes automated  |  30+ hours execution  →  33 minutes  |  3 engineers  →  1 tool', { x: 0.5, y: 6.8, w: 12.3, h: 0.3, fontSize: 10, bold: true, color: C.gold, fontFace: 'Segoe UI', align: 'center' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 4 — PRODUCT OVERVIEW
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Product Overview');
  subtitle(s, 'End-to-End Automated QA Platform — 6 Core Capabilities');
  iconCard(s, 0.4, 1.5, 2.0, 2.3, '📋', 'Test Generation', 'Upload requirements → auto-generate 30-100+ test cases', C.primary);
  iconCard(s, 2.6, 1.5, 2.0, 2.3, '🎭', 'Test Execution', 'Playwright runs tests in real browsers with smart selectors', C.darkBlue);
  iconCard(s, 4.8, 1.5, 2.0, 2.3, '📊', 'Reporting', 'HTML, Excel, JSON reports with charts & analytics', C.green);
  iconCard(s, 7.0, 1.5, 2.0, 2.3, '🤖', 'AI Agents', '5 specialized AI agents with 65+ years QA experience', C.accent);
  iconCard(s, 9.2, 1.5, 2.0, 2.3, '📧', 'Email Bot', 'Deploy email triggers auto-testing pipeline', C.orange);
  iconCard(s, 11.4, 1.5, 2.0, 2.3, '🔗', 'Integrations', 'JIRA bugs, Script Gen, Dashboard history', C.red);

  card(s, 0.4, 4.1, 12.5, 1.2);
  const stats = [['30-100+', 'Test Cases\nGenerated'], ['10', 'Built-in\nModules'], ['5', 'AI Agents\nTeam'], ['4', 'Browser\nTargets'], ['3', 'Report\nFormats'], ['< 5 min', 'Full\nPipeline']];
  stats.forEach((st, i) => {
    const x = 0.7 + i * 2.1;
    s.addText(st[0], { x, y: 4.2, w: 1.8, h: 0.55, fontSize: 24, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'center' });
    s.addText(st[1], { x, y: 4.75, w: 1.8, h: 0.45, fontSize: 9, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
  });

  card(s, 0.4, 5.6, 12.5, 1.3);
  s.addText('Tech Stack', { x: 0.6, y: 5.65, w: 3, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['React 18', 'Node.js', 'Express', 'Playwright', 'Claude AI', 'Vite', 'ExcelJS', 'IMAP/SMTP'].forEach((t, i) => {
    s.addShape('roundRect', { x: 0.7 + i * 1.55, y: 6.1, w: 1.4, h: 0.5, rectRadius: 0.08, fill: { color: C.surface2 } });
    s.addText(t, { x: 0.7 + i * 1.55, y: 6.1, w: 1.4, h: 0.5, fontSize: 9, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 5 — FEATURE 1: MANUAL TEST RUN
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 1 — Manual Test Run');
  subtitle(s, 'Upload Requirements → Configure → Execute → Download Reports');
  const steps = [
    { icon: '📄', label: 'Upload\nRequirements', desc: 'PDF / TXT / MD\nor Generic Mode' },
    { icon: '🎯', label: 'Enter\nApp URL', desc: 'http://localhost\nor any web app' },
    { icon: '⚙️', label: 'Configure\nOptions', desc: 'Scope, Priority\nBrowsers, Workers' },
    { icon: '▶️', label: 'Execute\nTests', desc: 'Real-time logs\nProgress tracking' },
    { icon: '📊', label: 'View\nResults', desc: 'Pass/Fail table\nError details' },
    { icon: '📥', label: 'Download\nReports', desc: 'HTML + Excel\n+ JSON' },
  ];
  steps.forEach((st, i) => {
    const x = 0.3 + i * 2.2;
    card(s, x, 1.5, 1.9, 2.2, C.surface);
    s.addText(st.icon, { x, y: 1.55, w: 1.9, h: 0.55, fontSize: 26, align: 'center', valign: 'middle' });
    s.addText(st.label, { x: x + 0.1, y: 2.1, w: 1.7, h: 0.6, fontSize: 11, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center' });
    s.addText(st.desc, { x: x + 0.1, y: 2.7, w: 1.7, h: 0.8, fontSize: 8, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
    if (i < steps.length - 1) flowArrow(s, x + 1.9, 2.4, 0.3);
  });

  card(s, 0.4, 4.0, 6, 3);
  s.addText('⚙️  Configuration Panel', { x: 0.6, y: 4.05, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['Test Scope: Smoke / Sanity / Regression / Full', 'Priority: Critical Only / High+Critical / All', 'Modules: Select specific or All modules', 'Browsers: Chromium, Firefox, WebKit, Mobile', 'Workers: 1-5 parallel test runners', 'Screenshots: Never / On-Failure / Always', 'Video: Off / On-Failure / On', 'Accessibility & Performance checks (toggle)', 'Environment: QA / Staging / Production'].forEach((c, i) => {
    s.addText('▸  ' + c, { x: 0.7, y: 4.5 + i * 0.28, w: 5.5, h: 0.26, fontSize: 9, color: C.light, fontFace: 'Segoe UI' });
  });

  card(s, 6.7, 4.0, 6.1, 3);
  s.addText('📊  Results Panel', { x: 6.9, y: 4.05, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText([{ text: '✓ Pass: 28  ', options: { color: C.green, bold: true, fontSize: 11 } }, { text: '✗ Fail: 2  ', options: { color: C.red, bold: true, fontSize: 11 } }, { text: '⚠ Skip: 0', options: { color: C.amber, bold: true, fontSize: 11 } }], { x: 7, y: 4.5, w: 5.5, h: 0.3, fontFace: 'Segoe UI' });
  s.addText('Real-time execution logs stream below the config\npanel. Color-coded: green=pass, red=fail, white=info.\n\nResults table shows: Test Case, Module, Type,\nPriority, Status, Duration, Error Message.\n\nDownload buttons appear after completion:\n  📄 HTML Report (professional, printable)\n  📊 Excel Report (3-sheet workbook)\n  📋 Test Cases JSON (raw data)', { x: 7, y: 4.9, w: 5.5, h: 2.0, fontSize: 9, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.3 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 6 — 10-STEP PIPELINE
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 2 — 10-Step Execution Pipeline');
  subtitle(s, 'From Document Upload to Final Report — Fully Automated');
  const pipeline = [
    { step: '01', icon: '📄', label: 'Parse Document', desc: 'Extract text from PDF/TXT/MD', who: 'Backend' },
    { step: '02', icon: '🔍', label: 'Analyze Requirements', desc: 'AI detects domain & risks', who: 'AI Agent' },
    { step: '03', icon: '🧠', label: 'Generate Test Cases', desc: '30-100+ cases with steps', who: 'AI / Rules' },
    { step: '04', icon: '👔', label: 'Review Test Plan', desc: 'Coverage check, gap analysis', who: 'AI Director' },
    { step: '05', icon: '🎭', label: 'Generate Playwright', desc: 'Executable JS test file', who: 'Backend' },
    { step: '06', icon: '🤖', label: 'Enhance Spec (AI)', desc: 'Smart selectors, retry logic', who: 'AI Engineer' },
    { step: '07', icon: '⚡', label: 'Execute Tests', desc: 'Parallel Playwright run', who: 'Playwright' },
    { step: '08', icon: '📋', label: 'Merge Results', desc: 'Map pass/fail to cases', who: 'Backend' },
    { step: '09', icon: '👔', label: 'Review Results', desc: 'Go/No-Go assessment', who: 'AI Director' },
    { step: '10', icon: '📊', label: 'Generate Reports', desc: 'HTML + Excel + JIRA', who: 'Backend' },
  ];
  pipeline.forEach((p, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 0.3 + col * 2.6;
    const y = 1.5 + row * 2.8;
    card(s, x, y, 2.3, 2.2, C.surface);
    s.addShape('roundRect', { x: x + 0.1, y: y + 0.1, w: 0.5, h: 0.4, rectRadius: 0.08, fill: { color: C.primary } });
    s.addText(p.step, { x: x + 0.1, y: y + 0.1, w: 0.5, h: 0.4, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    s.addText(p.icon, { x: x + 0.7, y: y + 0.1, w: 1.3, h: 0.4, fontSize: 20 });
    s.addText(p.label, { x: x + 0.1, y: y + 0.6, w: 2.1, h: 0.4, fontSize: 11, bold: true, color: C.white, fontFace: 'Segoe UI' });
    s.addText(p.desc, { x: x + 0.1, y: y + 1.0, w: 2.1, h: 0.4, fontSize: 9, color: C.grey, fontFace: 'Segoe UI' });
    const badgeColor = p.who.includes('AI') ? C.accent : C.surface2;
    s.addShape('roundRect', { x: x + 0.1, y: y + 1.55, w: 1.5, h: 0.35, rectRadius: 0.06, fill: { color: badgeColor } });
    s.addText(p.who, { x: x + 0.1, y: y + 1.55, w: 1.5, h: 0.35, fontSize: 8, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    if (col < 4) flowArrow(s, x + 2.3, y + 0.9, 0.25);
  });
  s.addText('▼', { x: 12.3, y: 3.4, w: 0.4, h: 0.6, fontSize: 20, color: C.accent, align: 'center' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 7 — AI AGENTS
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 3 — AI Agent Team');
  subtitle(s, '5 Specialized AI Agents with Combined 65+ Years QA Experience');
  const agents = [
    { icon: '🔍', name: 'Requirement Analyst', exp: '12 Years', role: 'Domain detection, requirement extraction, risk identification, compliance notes', color: C.primary },
    { icon: '🧠', name: 'Test Architect', exp: '15 Years', role: 'Generate 30-100+ domain-aware test cases with detailed steps & expected results', color: C.darkBlue },
    { icon: '🤖', name: 'Execution Engineer', exp: '10 Years', role: 'Enhance Playwright specs with smart selectors, retry logic, domain-aware flows', color: C.accent },
    { icon: '👔', name: 'QA Director', exp: '20 Years', role: 'Pre-exec coverage review, post-exec Go/No-Go, deployment risk assessment', color: C.orange },
    { icon: '📊', name: 'Report Analyst', exp: '8 Years', role: 'Executive summaries, JIRA bug reports, trend analysis, sign-off statements', color: C.green },
  ];
  agents.forEach((a, i) => {
    const y = 1.5 + i * 1.1;
    card(s, 0.4, y, 12.5, 0.95, C.surface);
    s.addShape('ellipse', { x: 0.6, y: y + 0.15, w: 0.65, h: 0.65, fill: { color: a.color } });
    s.addText(a.icon, { x: 0.6, y: y + 0.15, w: 0.65, h: 0.65, fontSize: 22, align: 'center', valign: 'middle' });
    s.addText(a.name, { x: 1.4, y: y + 0.1, w: 3, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: 'Segoe UI' });
    s.addText(a.exp + ' Experience', { x: 1.4, y: y + 0.5, w: 2, h: 0.3, fontSize: 9, color: C.accent, fontFace: 'Segoe UI' });
    s.addText(a.role, { x: 4.5, y: y + 0.15, w: 8, h: 0.65, fontSize: 10, color: C.light, fontFace: 'Segoe UI', valign: 'middle' });
  });
  s.addText('Without API Key → Seamlessly falls back to Rule-Based engine (10 modules, 30+ test cases)', { x: 0.6, y: 7.0, w: 12, h: 0.15, fontSize: 10, bold: true, color: C.gold, fontFace: 'Segoe UI', align: 'center' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 8 — EMAIL AUTOMATION
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 4 — Email Automation Bot');
  subtitle(s, 'Deployment Email → Auto-Trigger Tests → Report Back via Email');
  const flowSteps = [
    { x: 0.3, label: '📧 Developer\nSends Email', desc: '"deployment done"\nwith app URL' },
    { x: 2.8, label: '🔍 Bot Detects\nKeyword', desc: 'IMAP polling\nevery 120s' },
    { x: 5.3, label: '📄 Extract\nURL + Reqs', desc: 'From email body\nor attachment' },
    { x: 7.8, label: '⚡ Run Full\nPipeline', desc: '10-step test\nexecution' },
    { x: 10.3, label: '📧 Email Back\nResults', desc: 'HTML + Excel\nattachments' },
  ];
  flowSteps.forEach((f, i) => {
    card(s, f.x, 1.5, 2.2, 2.0, C.surface);
    s.addText(f.label, { x: f.x + 0.1, y: 1.6, w: 2.0, h: 0.7, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center' });
    s.addText(f.desc, { x: f.x + 0.1, y: 2.3, w: 2.0, h: 0.7, fontSize: 9, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
    if (i < flowSteps.length - 1) flowArrow(s, f.x + 2.2, 2.3, 0.5);
  });

  card(s, 0.4, 3.8, 6, 3.1, C.surface);
  s.addText('⚙️  Email Monitor Configuration', { x: 0.6, y: 3.9, w: 5.5, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['Gmail Email: qa-bot@gmail.com', 'App Password: 16-char Google App Password', 'IMAP: imap.gmail.com:993 (auto-configured)', 'SMTP: smtp.gmail.com:465 (auto-configured)', 'Subject Keyword: "deployment done"', 'Poll Interval: 120 seconds (configurable)', 'Default Requirements: login, register, dashboard...', 'Test Email: Verify SMTP connection before enabling'].forEach((c, i) => {
    s.addText('▸  ' + c, { x: 0.7, y: 4.4 + i * 0.3, w: 5.5, h: 0.28, fontSize: 9, color: C.light, fontFace: 'Segoe UI' });
  });

  card(s, 6.7, 3.8, 6.1, 3.1, C.surface);
  s.addText('💡  Use Case: CI/CD Integration', { x: 6.9, y: 3.9, w: 5.5, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('1. Developer deploys to staging\n2. CI/CD pipeline sends email:\n   Subject: "deployment done - staging"\n   Body: "App URL: https://staging.app.com"\n3. QA Bot detects email within 2 minutes\n4. Extracts URL, runs 30+ test cases\n5. Generates HTML + Excel reports\n6. Emails results back to developer\n7. Developer gets feedback in < 10 minutes\n\n   Zero manual intervention required!', { x: 7, y: 4.4, w: 5.5, h: 2.5, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.2 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 9 — JIRA INTEGRATION
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 5 — JIRA Integration');
  subtitle(s, 'Failed Tests → Auto-Create JIRA Bugs with Rich Descriptions');
  card(s, 0.4, 1.5, 3.5, 1.5, C.surface);
  s.addText('❌ Test Fails', { x: 0.5, y: 1.6, w: 3.3, h: 0.5, fontSize: 14, bold: true, color: C.red, fontFace: 'Segoe UI', align: 'center' });
  s.addText('Error captured with\nscreenshot & logs', { x: 0.5, y: 2.1, w: 3.3, h: 0.7, fontSize: 10, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
  flowArrow(s, 3.95, 2.1, 0.5);
  card(s, 4.6, 1.5, 3.5, 1.5, C.surface);
  s.addText('🔗 JIRA API Call', { x: 4.7, y: 1.6, w: 3.3, h: 0.5, fontSize: 14, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'center' });
  s.addText('Priority mapped\nLabels auto-tagged', { x: 4.7, y: 2.1, w: 3.3, h: 0.7, fontSize: 10, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
  flowArrow(s, 8.15, 2.1, 0.5);
  card(s, 8.8, 1.5, 4, 1.5, C.surface);
  s.addText('🐛 Bug Created', { x: 8.9, y: 1.6, w: 3.8, h: 0.5, fontSize: 14, bold: true, color: C.green, fontFace: 'Segoe UI', align: 'center' });
  s.addText('PROJ-123 with full\ndescription & steps', { x: 8.9, y: 2.1, w: 3.8, h: 0.7, fontSize: 10, color: C.grey, fontFace: 'Segoe UI', align: 'center' });

  card(s, 0.4, 3.3, 6.2, 3.6, C.surface);
  s.addText('📝  Auto-Generated JIRA Bug Contains:', { x: 0.6, y: 3.35, w: 5.8, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['Summary: [Module] Test Case Title - FAIL', 'Priority: Critical→Highest, High→High, Med→Medium', 'Labels: qa-automation, module-auth, type-negative', 'Description (Atlassian Document Format):', '  ▸ Bug Details Table (Module, Type, Priority, URL)', '  ▸ Steps to Reproduce (ordered list)', '  ▸ Expected Result vs Actual Result', '  ▸ Error Message (code block)', '  ▸ Environment: Browser, OS, Timestamp'].forEach((f, i) => {
    s.addText(f.trim(), { x: f.startsWith('  ') ? 1.0 : 0.7, y: 3.85 + i * 0.32, w: 5.3, h: 0.3, fontSize: 9, color: C.light, fontFace: 'Segoe UI' });
  });

  card(s, 6.8, 3.3, 6, 3.6, C.surface);
  s.addText('⚙️  JIRA Configuration', { x: 7, y: 3.35, w: 5.5, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  [['Base URL', 'https://your-org.atlassian.net'], ['Email', 'qa-lead@company.com'], ['API Token', 'Generated from Atlassian account'], ['Project Key', 'PROJ (your JIRA project)'], ['Issue Type', 'Bug (default)'], ['Test Connection', 'Verify before enabling']].forEach((c, i) => {
    s.addText(c[0] + ':', { x: 7.1, y: 3.9 + i * 0.42, w: 2.2, h: 0.35, fontSize: 10, bold: true, color: C.accent, fontFace: 'Segoe UI' });
    s.addText(c[1], { x: 9.3, y: 3.9 + i * 0.42, w: 3.3, h: 0.35, fontSize: 10, color: C.light, fontFace: 'Segoe UI' });
  });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 10 — SCRIPT GENERATOR
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Feature 6 — Automation Script Generator');
  subtitle(s, 'Generate Complete Test Automation Projects — Download as ZIP');

  card(s, 0.4, 1.5, 3, 2.5, C.surface);
  s.addText('🔧 Tool', { x: 0.5, y: 1.55, w: 2.8, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['Playwright', 'Selenium', 'Cypress', 'REST Assured'].forEach((t, i) => {
    s.addShape('roundRect', { x: 0.6, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, rectRadius: 0.06, fill: { color: i === 0 ? C.primary : C.surface2 } });
    s.addText(t, { x: 0.6, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, fontSize: 10, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  });

  card(s, 3.6, 1.5, 3, 2.5, C.surface);
  s.addText('💻 Language', { x: 3.7, y: 1.55, w: 2.8, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['JavaScript', 'TypeScript', 'Java', 'Python'].forEach((t, i) => {
    s.addShape('roundRect', { x: 3.8, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, rectRadius: 0.06, fill: { color: i === 0 ? C.primary : C.surface2 } });
    s.addText(t, { x: 3.8, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, fontSize: 10, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  });

  card(s, 6.8, 1.5, 3, 2.5, C.surface);
  s.addText('📐 Framework', { x: 6.9, y: 1.55, w: 2.8, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
  ['Page Object Model', 'BDD (Cucumber)', 'Data-Driven'].forEach((t, i) => {
    s.addShape('roundRect', { x: 7.0, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, rectRadius: 0.06, fill: { color: i === 0 ? C.primary : C.surface2 } });
    s.addText(t, { x: 7.0, y: 2.0 + i * 0.45, w: 2.5, h: 0.35, fontSize: 10, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  });

  card(s, 10, 1.5, 2.8, 2.5, C.surface);
  s.addText('📦 Output', { x: 10.1, y: 1.55, w: 2.6, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('Complete ZIP with:\n\n✓ package.json\n✓ Config files\n✓ Test files\n✓ Test data\n✓ README', { x: 10.2, y: 2.0, w: 2.4, h: 1.8, fontSize: 9, color: C.light, fontFace: 'Segoe UI' });

  card(s, 0.4, 4.3, 12.4, 2.8, C.surface);
  s.addText('📁  Generated Project Structure (Example: Playwright + JS + POM)', { x: 0.6, y: 4.35, w: 11, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('generated-tests/\n├── package.json               ← Dependencies (playwright, dotenv)\n├── playwright.config.js       ← Browser, timeout, reporter config\n├── tests/\n│   ├── auth/\n│   │   ├── login.spec.js      ← Login test cases (valid/invalid/lockout)\n│   │   └── register.spec.js   ← Registration tests\n│   ├── dashboard.spec.js      ← Dashboard load + performance\n│   └── navigation.spec.js     ← Link checks, base URL\n├── pages/                     ← Page Object classes\n├── fixtures/                  ← Test data JSON files\n└── README.md                  ← How to install + run', { x: 0.8, y: 4.85, w: 12, h: 2.0, fontSize: 9, color: C.accent, fontFace: 'Consolas', lineSpacingMultiple: 1.15 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 11 — REPORTS & ANALYTICS
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Reports & Analytics');
  subtitle(s, '3 Report Formats + Dashboard with Run History');

  card(s, 0.3, 1.5, 4, 3.2, C.surface);
  s.addText('📄  HTML Report', { x: 0.5, y: 1.55, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: C.accent, fontFace: 'Segoe UI' });
  s.addText('✓ Dark theme, professional layout\n✓ Execution stats dashboard\n✓ Module-by-module breakdown\n✓ Test case detail table\n✓ Color-coded pass rates\n✓ Error messages & durations\n✓ Print-to-PDF friendly\n✓ India timezone formatted', { x: 0.5, y: 2.05, w: 3.5, h: 2.5, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.35 });

  card(s, 4.5, 1.5, 4, 3.2, C.surface);
  s.addText('📊  Excel Report', { x: 4.7, y: 1.55, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: C.green, fontFace: 'Segoe UI' });
  s.addText('3-Sheet Workbook:\n\n📊 Summary Sheet\n   Stats, pass/fail counts, charts\n\n📋 Test Cases Sheet\n   Full detail with all metadata\n\n📦 Module Analysis Sheet\n   Per-module breakdown', { x: 4.7, y: 2.05, w: 3.5, h: 2.5, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.2 });

  card(s, 8.7, 1.5, 4.1, 3.2, C.surface);
  s.addText('📈  Dashboard', { x: 8.9, y: 1.55, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: C.orange, fontFace: 'Segoe UI' });
  s.addText('✓ Run history table\n✓ Pass rate trends over time\n✓ KPI cards with animations\n✓ Donut chart visualization\n✓ Export history as CSV\n✓ Click to view past reports\n✓ Confetti on 100% pass!', { x: 8.9, y: 2.05, w: 3.5, h: 2.5, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.35 });

  card(s, 0.3, 5.0, 12.5, 1.9, C.surface);
  s.addText('📊  Sample Execution Metrics', { x: 0.5, y: 5.05, w: 5, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  [{ l: 'Total Tests', v: '30', c: C.accent }, { l: 'Passed', v: '28', c: C.green }, { l: 'Failed', v: '2', c: C.red }, { l: 'Pass Rate', v: '93.3%', c: C.green }, { l: 'Duration', v: '1m 48s', c: C.accent }, { l: 'Modules', v: '10', c: C.primary }].forEach((m, i) => {
    const x = 0.5 + i * 2.1;
    s.addText(m.v, { x, y: 5.55, w: 1.9, h: 0.55, fontSize: 24, bold: true, color: m.c, fontFace: 'Segoe UI', align: 'center' });
    s.addText(m.l, { x, y: 6.1, w: 1.9, h: 0.3, fontSize: 9, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
  });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 12 — 10 BUILT-IN MODULES
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Test Generation Engine — 10 Built-in Modules');
  subtitle(s, 'Keyword Detection Maps Requirements to Test Cases Automatically');
  tableSlide(s, ['#', 'Module', 'Icon', 'Keywords Detected', 'Tests', 'Types'], [
    ['1', 'Authentication (Login)', '🔐', 'login, sign in, authentication', '3+', 'Positive, Negative, Edge'],
    ['2', 'User Registration', '📝', 'register, signup, create account', '3+', 'Positive, Negative, Edge'],
    ['3', 'Payment & Checkout', '💳', 'payment, checkout, billing', '3+', 'Positive, Negative, Edge'],
    ['4', 'Form Validation', '📋', 'form, input, validation', '3+', 'Positive, Negative, Edge'],
    ['5', 'Search & Filter', '🔍', 'search, filter, find', '2+', 'Positive, Negative'],
    ['6', 'Session (Logout)', '🚪', 'logout, sign out, session', '2+', 'Positive, Security'],
    ['7', 'Password Management', '🔑', 'password, forgot, reset', '2+', 'Positive, Negative'],
    ['8', 'Dashboard', '📊', 'dashboard, overview, summary', '2+', 'Positive, Performance'],
    ['9', 'Navigation', '🧭', 'Always included', '2+', 'Positive, Baseline'],
    ['10', 'User Profile', '👤', 'profile, account, settings', '2+', 'Positive, Security'],
  ], { y: 1.6, colW: [0.4, 2.2, 0.5, 3, 0.6, 2.5] });

  card(s, 0.4, 5.6, 12.5, 1.3, C.surface);
  s.addText('🎯  Scope Filtering', { x: 0.6, y: 5.65, w: 4, h: 0.35, fontSize: 12, bold: true, color: C.white, fontFace: 'Segoe UI' });
  [{ n: 'Smoke', c: '~10', d: '1 per module' }, { n: 'Sanity', c: '~20', d: '2 per module' }, { n: 'Regression', c: '~30', d: 'All cases' }, { n: 'Full', c: '~35+', d: 'All + a11y + perf' }].forEach((sc, i) => {
    const x = 0.6 + i * 3.1;
    s.addShape('roundRect', { x, y: 6.1, w: 2.8, h: 0.55, rectRadius: 0.08, fill: { color: C.surface2 } });
    s.addText([{ text: sc.n, options: { bold: true, color: C.accent, fontSize: 11 } }, { text: '  (' + sc.c + ')  ', options: { color: C.white, fontSize: 11 } }, { text: sc.d, options: { color: C.grey, fontSize: 9 } }], { x, y: 6.1, w: 2.8, h: 0.55, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 13 — SMART SELECTORS
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Smart Adaptive Selectors');
  subtitle(s, 'Tests Work Across Any Web App — No Hardcoded Selectors');
  card(s, 0.4, 1.5, 12.4, 2.5, C.surface);
  s.addText('🎯  How Adaptive Selectors Work', { x: 0.6, y: 1.55, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('async function tryFind(page, selectors) {\n  for (const sel of selectors) {\n    const el = page.locator(sel);\n    if (await el.count() > 0 && await el.first().isVisible())\n      return el.first();\n  }\n  return null;  // graceful fallback\n}', { x: 0.7, y: 2.0, w: 5.5, h: 1.8, fontSize: 10, color: C.accent, fontFace: 'Consolas', lineSpacingMultiple: 1.2 });
  s.addText('Each element tries 5-10 different CSS selectors:\n\nEmail Input →\n  input[type="email"], input[name="email"],\n  input[name="username"], #email, #login-email\n\nSubmit Button →\n  button[type="submit"], button:has-text("Login"),\n  button:has-text("Sign In"), .btn-primary', { x: 6.5, y: 2.0, w: 6, h: 1.8, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.2 });

  card(s, 0.4, 4.3, 4, 2.5, C.surface);
  s.addText('✅  Benefits', { x: 0.6, y: 4.35, w: 3.5, h: 0.4, fontSize: 13, bold: true, color: C.green, fontFace: 'Segoe UI' });
  s.addText('▸ Works on any web application\n▸ No DOM knowledge required\n▸ Graceful degradation (no crash)\n▸ Tests pass if page responds\n▸ AI can enhance selectors further', { x: 0.7, y: 4.85, w: 3.5, h: 1.8, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.4 });

  card(s, 4.6, 4.3, 4, 2.5, C.surface);
  s.addText('🎭  Browser Support', { x: 4.8, y: 4.35, w: 3.5, h: 0.4, fontSize: 13, bold: true, color: C.accent, fontFace: 'Segoe UI' });
  s.addText('▸ Chromium (Desktop Chrome)\n▸ Firefox\n▸ WebKit (Safari)\n▸ Mobile Chrome (Pixel 5)\n▸ Mobile Safari (iPhone 12)', { x: 4.8, y: 4.85, w: 3.5, h: 1.8, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.4 });

  card(s, 8.8, 4.3, 4, 2.5, C.surface);
  s.addText('⚡  Extra Checks', { x: 9, y: 4.35, w: 3.5, h: 0.4, fontSize: 13, bold: true, color: C.orange, fontFace: 'Segoe UI' });
  s.addText('▸ Accessibility (WCAG):\n   alt text, labels, lang attr\n▸ Performance:\n   TTFB, FCP, DOM Ready,\n   Full Load (fail if > 10s)', { x: 9, y: 4.85, w: 3.5, h: 1.8, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.4 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 14 — ARCHITECTURE
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'System Architecture');
  subtitle(s, 'Frontend → Backend → Playwright → Reports');

  card(s, 0.3, 1.5, 3.3, 2.5, C.surface);
  s.addShape('roundRect', { x: 0.4, y: 1.55, w: 3.1, h: 0.4, rectRadius: 0.06, fill: { color: C.primary } });
  s.addText('FRONTEND (React + Vite)', { x: 0.4, y: 1.55, w: 3.1, h: 0.4, fontSize: 10, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText('▸ Dashboard Page\n▸ Manual Test Run\n▸ Email Monitor\n▸ Script Generator\n▸ JIRA Config\n▸ AI Agent Config', { x: 0.5, y: 2.05, w: 2.9, h: 1.8, fontSize: 9, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.25 });
  s.addText('Port: 3001', { x: 0.5, y: 3.55, w: 2.9, h: 0.3, fontSize: 8, color: C.accent, fontFace: 'Segoe UI', align: 'center' });
  flowArrow(s, 3.65, 2.5, 0.5);

  card(s, 4.3, 1.5, 4, 5.4, C.surface);
  s.addShape('roundRect', { x: 4.4, y: 1.55, w: 3.8, h: 0.4, rectRadius: 0.06, fill: { color: C.darkBlue } });
  s.addText('BACKEND (Node.js + Express)', { x: 4.4, y: 1.55, w: 3.8, h: 0.4, fontSize: 10, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText('Port: 5000', { x: 4.5, y: 1.95, w: 3.6, h: 0.3, fontSize: 8, color: C.accent, fontFace: 'Segoe UI', align: 'center' });
  [{ n: 'parser.js', d: 'PDF/TXT/MD' }, { n: 'testGenerator.js', d: 'Rule-Based' }, { n: 'playwrightRunner.js', d: 'Spec Gen' }, { n: 'reportGenerator.js', d: 'HTML Report' }, { n: 'excelGenerator.js', d: 'Excel Report' }, { n: 'emailMonitor.js', d: 'IMAP Bot' }, { n: 'jiraService.js', d: 'Bug Logging' }, { n: 'scriptGenerator.js', d: 'ZIP Export' }].forEach((sv, i) => {
    s.addShape('roundRect', { x: 4.5, y: 2.35 + i * 0.5, w: 3.6, h: 0.4, rectRadius: 0.06, fill: { color: C.surface2 } });
    s.addText(sv.n, { x: 4.6, y: 2.35 + i * 0.5, w: 2.2, h: 0.4, fontSize: 8, bold: true, color: C.accent, fontFace: 'Consolas', valign: 'middle' });
    s.addText(sv.d, { x: 6.8, y: 2.35 + i * 0.5, w: 1.2, h: 0.4, fontSize: 8, color: C.grey, fontFace: 'Segoe UI', valign: 'middle' });
  });
  flowArrow(s, 8.35, 2.5, 0.5);

  card(s, 9, 1.5, 2.3, 2.5, C.surface);
  s.addShape('roundRect', { x: 9.1, y: 1.55, w: 2.1, h: 0.4, rectRadius: 0.06, fill: { color: C.green } });
  s.addText('PLAYWRIGHT', { x: 9.1, y: 1.55, w: 2.1, h: 0.4, fontSize: 10, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText('▸ generated.spec.js\n▸ 3 Workers\n▸ 25s Timeout\n▸ JSON Results\n▸ Screenshots\n▸ Multi-Browser', { x: 9.1, y: 2.05, w: 2.1, h: 1.8, fontSize: 9, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.25 });
  flowArrow(s, 11.35, 2.5, 0.5);

  card(s, 12, 1.5, 1.2, 2.5, C.surface);
  s.addText('📊\nHTML\n📊\nExcel\n📋\nJSON', { x: 12.1, y: 1.6, w: 1, h: 2.3, fontSize: 10, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'center', valign: 'middle', lineSpacingMultiple: 1.1 });

  card(s, 9, 4.5, 4.2, 2, C.surface);
  s.addShape('roundRect', { x: 9.1, y: 4.55, w: 4, h: 0.4, rectRadius: 0.06, fill: { color: C.accent } });
  s.addText('AI AGENTS (Claude API)', { x: 9.1, y: 4.55, w: 4, h: 0.4, fontSize: 10, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText('▸ Requirement Analyst (12yr)\n▸ Test Architect (15yr)\n▸ Execution Engineer (10yr)\n▸ QA Director (20yr)\n▸ Report Analyst (8yr)', { x: 9.2, y: 5.05, w: 3.8, h: 1.3, fontSize: 9, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.2 });

  card(s, 0.3, 4.5, 3.3, 2, C.surface);
  s.addShape('roundRect', { x: 0.4, y: 4.55, w: 3.1, h: 0.4, rectRadius: 0.06, fill: { color: C.orange } });
  s.addText('EXTERNAL INTEGRATIONS', { x: 0.4, y: 4.55, w: 3.1, h: 0.4, fontSize: 10, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
  s.addText('▸ JIRA (REST API)\n▸ Gmail (IMAP/SMTP)\n▸ Claude AI (Anthropic API)\n▸ File System (reports)', { x: 0.5, y: 5.05, w: 2.9, h: 1.3, fontSize: 9, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.3 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 15 — DOMAIN SUPPORT
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Domain-Aware Intelligence');
  subtitle(s, 'AI Agents Detect Domain and Apply Specialized Knowledge');
  tableSlide(s, ['Domain', 'Detection Keywords', 'Specialized Knowledge Applied'], [
    ['Banking', 'bank, account, transfer, loan, KYC', 'Transaction testing, interest calculations, KYC validation'],
    ['Insurance', 'policy, claim, premium, underwriting', 'Policy lifecycle, claims workflow, premium calculations'],
    ['Investment Banking', 'trade, portfolio, FIX, settlement', 'Trade lifecycle, FIX protocol, T+1/T+2 settlement'],
    ['Telecom', 'billing, subscriber, CDR, roaming', 'Billing accuracy, rating engine, number portability'],
    ['E-Commerce', 'cart, checkout, product, order', 'Cart management, checkout flow, order tracking'],
    ['Healthcare', 'patient, appointment, EMR, prescription', 'Patient data, appointment scheduling, HIPAA compliance'],
    ['Generic Web', 'Default fallback', 'Standard web testing: auth, forms, navigation, search'],
  ], { y: 1.6, colW: [2, 4, 6.5] });

  card(s, 0.4, 5.3, 12.4, 1.5, C.surface);
  s.addText('🎯  How It Works', { x: 0.6, y: 5.35, w: 5, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
  s.addText('1. Upload requirements document (any domain)  →  2. AI Analyst detects domain with confidence score  →  3. Test Architect applies domain-specific edge cases  →  4. QA Director evaluates domain compliance  →  5. Report Analyst writes domain-aware executive summary', { x: 0.7, y: 5.8, w: 11.8, h: 0.8, fontSize: 10, color: C.light, fontFace: 'Segoe UI', lineSpacingMultiple: 1.3 });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 16 — COMPARISON
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Before vs After — Impact Analysis');
  subtitle(s, 'Quantified Benefits of QA AI Testing Tool');
  tableSlide(s, ['Metric', 'Before (Manual)', 'After (QA AI Tool)', 'Improvement'], [
    ['Test Case Generation', '2-3 days / module', '< 30 seconds', '99.9% faster'],
    ['Test Execution (Full)', '30+ hours', '< 5 minutes', '360x faster'],
    ['Report Generation', '4-6 hours', '< 10 seconds', 'Instant'],
    ['Bug Logging (JIRA)', '15 min / bug', 'Automatic', 'Zero effort'],
    ['Regression Cycle', '2-3 days', '33 minutes', '120x faster'],
    ['QA Team Size Needed', '3-5 engineers', '1 engineer + tool', '70% reduction'],
    ['Coverage Consistency', 'Variable (human)', '100% consistent', 'Reliable'],
    ['CI/CD Integration', 'Manual trigger', 'Email-triggered auto', 'Fully automated'],
    ['Cross-Browser Testing', '3x manual effort', 'Single run, 5 browsers', '5x coverage'],
    ['Domain Knowledge', 'Per-engineer exp.', '7 domains built-in', 'Standardized'],
  ], { y: 1.6, colW: [2.8, 2.8, 2.8, 2.8] });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 17 — LIVE DEMO PLAN
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Live Demo Walkthrough');
  subtitle(s, 'http://localhost:3001 — End-to-End Feature Demonstration');
  const demos = [
    { s: '1', t: 'Dashboard', d: 'Show run history, KPI cards, trends', ti: '1 min' },
    { s: '2', t: 'Upload & Configure', d: 'Upload requirements PDF, set scope=Regression', ti: '1 min' },
    { s: '3', t: 'Execute Tests', d: 'Watch real-time logs, 30+ tests running', ti: '3 min' },
    { s: '4', t: 'View Results', d: 'Pass/fail table, error details, donut chart', ti: '1 min' },
    { s: '5', t: 'Download Reports', d: 'HTML report, Excel workbook, JSON export', ti: '1 min' },
    { s: '6', t: 'JIRA Integration', d: 'Show auto-created bugs from failed tests', ti: '1 min' },
    { s: '7', t: 'Email Monitor', d: 'Configure bot, show auto-trigger flow', ti: '2 min' },
    { s: '8', t: 'Script Generator', d: 'Generate Playwright + POM project, download ZIP', ti: '1 min' },
    { s: '9', t: 'AI Agent Config', d: 'Enable Claude AI, show enhanced analysis', ti: '1 min' },
  ];
  demos.forEach((d, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 4.3;
    const y = 1.5 + row * 1.8;
    card(s, x, y, 4, 1.55, C.surface);
    s.addShape('roundRect', { x: x + 0.1, y: y + 0.1, w: 0.45, h: 0.4, rectRadius: 0.06, fill: { color: C.primary } });
    s.addText(d.s, { x: x + 0.1, y: y + 0.1, w: 0.45, h: 0.4, fontSize: 14, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    s.addText(d.t, { x: x + 0.65, y: y + 0.1, w: 3.1, h: 0.4, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI' });
    s.addText(d.d, { x: x + 0.65, y: y + 0.5, w: 3.1, h: 0.4, fontSize: 10, color: C.grey, fontFace: 'Segoe UI' });
    s.addText(d.ti, { x: x + 3, y: y + 1.0, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'right' });
  });
  s.addText('Total Demo Time: ~12 minutes', { x: 0.4, y: 7.0, w: 12, h: 0.15, fontSize: 11, bold: true, color: C.gold, fontFace: 'Segoe UI', align: 'center' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 18 — ROADMAP
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  title(s, 'Roadmap & Future Enhancements');
  subtitle(s, 'What Is Coming Next');
  const phases = [
    { p: 'Phase 2 (Q2 2026)', c: C.primary, i: ['Visual regression testing (screenshot diff)', 'Database testing integration', 'Real API endpoint discovery', 'Slack/Teams notifications'] },
    { p: 'Phase 3 (Q3 2026)', c: C.accent, i: ['Cloud deployment (Docker + K8s)', 'Multi-project workspace', 'Scheduled regression runs', 'Test analytics & trends dashboard'] },
    { p: 'Phase 4 (Q4 2026)', c: C.green, i: ['Self-healing tests (AI fixes selectors)', 'Load testing integration (k6/JMeter)', 'Natural language test writing', 'CI/CD plugin (Jenkins/GitHub Actions)'] },
  ];
  phases.forEach((ph, i) => {
    const x = 0.3 + i * 4.4;
    card(s, x, 1.5, 4.1, 4, C.surface);
    s.addShape('roundRect', { x: x + 0.1, y: 1.55, w: 3.9, h: 0.45, rectRadius: 0.06, fill: { color: ph.c } });
    s.addText(ph.p, { x: x + 0.1, y: 1.55, w: 3.9, h: 0.45, fontSize: 13, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
    ph.i.forEach((item, j) => {
      s.addText('▸  ' + item, { x: x + 0.2, y: 2.2 + j * 0.45, w: 3.7, h: 0.4, fontSize: 11, color: C.light, fontFace: 'Segoe UI' });
    });
  });
  card(s, 0.3, 5.8, 12.5, 1, C.surface);
  s.addText('🎯  Vision: One-click QA for any web application — upload, test, ship with confidence', { x: 0.5, y: 5.9, w: 12, h: 0.8, fontSize: 16, bold: true, color: C.accent, fontFace: 'Segoe UI', align: 'center', valign: 'middle' });
})();

// ══════════════════════════════════════════════════════════════
//  SLIDE 19 — THANK YOU
// ══════════════════════════════════════════════════════════════
(() => {
  const s = addSlide();
  s.addShape('ellipse', { x: 9, y: 0.5, w: 5, h: 5, fill: { color: C.primary }, transparency: 90 });
  s.addShape('ellipse', { x: -1, y: 4, w: 4, h: 4, fill: { color: C.accent }, transparency: 90 });
  s.addText('🤖', { x: 5.5, y: 1.5, w: 2.5, h: 1.2, fontSize: 60, align: 'center' });
  s.addText('Thank You!', { x: 1, y: 2.8, w: 11.3, h: 1, fontSize: 48, bold: true, color: C.white, fontFace: 'Segoe UI', align: 'center' });
  s.addText('Questions & Discussion', { x: 1, y: 3.7, w: 11.3, h: 0.6, fontSize: 22, color: C.accent, fontFace: 'Segoe UI', align: 'center' });
  s.addShape('rect', { x: 3, y: 4.5, w: 7.3, h: 0.03, fill: { color: C.primary } });
  s.addText([{ text: 'URL: ', options: { color: C.grey } }, { text: 'http://localhost:3001', options: { color: C.accent, bold: true } }], { x: 1, y: 5.0, w: 11.3, h: 0.4, fontSize: 16, fontFace: 'Segoe UI', align: 'center' });
  s.addText([{ text: 'Tech: ', options: { color: C.grey } }, { text: 'React + Node.js + Playwright + Claude AI', options: { color: C.light } }], { x: 1, y: 5.5, w: 11.3, h: 0.4, fontSize: 14, fontFace: 'Segoe UI', align: 'center' });
  s.addText('Built for QA Engineers, by QA Engineers', { x: 1, y: 6.3, w: 11.3, h: 0.4, fontSize: 14, italic: true, color: C.grey, fontFace: 'Segoe UI', align: 'center' });
})();

// ═══════════════════════════════════════════════════════════
//  SAVE
// ═══════════════════════════════════════════════════════════
const outPath = path.join(__dirname, 'QA_AI_Testing_Tool_Presentation.pptx');
pptx.writeFile({ fileName: outPath })
  .then(() => console.log(`\n✅ Presentation saved: ${outPath}\n   Slides: 19\n   Features covered: All 6 major + Architecture + Roadmap`))
  .catch(err => { console.error('Error:', err); process.exit(1); });
