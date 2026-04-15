import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import {
  CommandPalette, ShortcutsModal, NotificationBell,
  Sparkline, BarChart, TrendCard, EmptyState, Skeleton, Icons,
  Sidebar, AdminUsersPage, AdminActivityPage, AdminSystemPage,
  OnboardingTour, WhatsNewModal, SegmentedControl, ProgressBar, Chip, LiveDot,
} from './Enhancements.jsx';

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

// ── Dynamic tool-option field renderer ───────────────────────────────────────
function ToolOptionsPanel({ tool, values, onChange }) {
  if (!tool?.options?.length) return null;
  const set = (key, val) => onChange({ ...values, [key]: val });
  return (
    <div className="adv-tool-options">
      <div className="adv-tool-options-hdr" style={{ color: tool.color }}>
        <span className="adv-tool-options-icon">{tool.icon}</span>
        {tool.name} — Configuration
      </div>
      <div className="adv-tool-options-grid">
        {tool.options.map(opt => {
          const cur = values[opt.key] ?? opt.default;
          return (
            <div key={opt.key} className="field adv-opt-field">
              <label className="field-label">{opt.label}</label>
              {opt.type === 'boolean' ? (
                <label className="adv-opt-switch">
                  <input type="checkbox" checked={!!cur} onChange={e => set(opt.key, e.target.checked)} />
                  <span className="adv-opt-switch-slider" style={{ background: cur ? tool.color : undefined }} />
                  <span className="adv-opt-switch-label">{cur ? 'Enabled' : 'Disabled'}</span>
                </label>
              ) : opt.type === 'select' ? (
                <select className="field-input" value={cur} onChange={e => set(opt.key, e.target.value)}>
                  {opt.values.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : opt.type === 'number' ? (
                <input className="field-input" type="number" min={opt.min} max={opt.max} step={opt.step || 1}
                  value={cur} onChange={e => set(opt.key, e.target.value === '' ? '' : Number(e.target.value))} />
              ) : (
                <input className="field-input" type="text" placeholder={opt.placeholder || ''}
                  value={cur} onChange={e => set(opt.key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared panel for API / Security / Performance testing pages ──────────────
function AdvancedTestingPanel({ kind, title, subtitle, heroIcon, accent, accentGrad, tools, selectedTool, setSelectedTool, toolOpts, setToolOpts, extraConfig, onGenerate, disabled, loading, result, error }) {
  const curTool = tools.find(t => t.id === selectedTool);
  const curOpts = toolOpts?.[selectedTool] || {};
  const setCurOpts = (nextVals) => setToolOpts?.({ ...toolOpts, [selectedTool]: nextVals });
  return (
    <div className="exploratory-page" style={{ '--accent': accent, '--accent-grad': accentGrad }}>

      {/* Hero banner */}
      <div className="adv-hero" style={{ background: accentGrad }}>
        <div className="adv-hero-icon">{heroIcon}</div>
        <div className="adv-hero-text">
          <h1 className="adv-hero-title">{title}</h1>
          <p className="adv-hero-sub">{subtitle}</p>
        </div>
        <div className="adv-hero-chip">🤖 AI + Rule-Based</div>
      </div>

      <div className="panel input-panel">

        {/* Tool picker */}
        <div className="adv-section-hdr">
          <div className="adv-section-dot" style={{ background: accentGrad }} />
          <h3>Step 1 · Choose your tool</h3>
          <span className="adv-section-count">{tools.length} options</span>
        </div>

        <div className="adv-tool-grid">
          {tools.map(t => (
            <label
              key={t.id}
              className={`adv-tool-card ${selectedTool === t.id ? 'selected' : ''}`}
              style={selectedTool === t.id ? { '--tool-color': t.color, borderColor: t.color, boxShadow: `0 0 0 1px ${t.color}, 0 10px 24px ${t.color}22` } : { '--tool-color': t.color }}
            >
              <input type="radio" name={`tool-${kind}`} value={t.id} checked={selectedTool === t.id} onChange={() => setSelectedTool(t.id)} />
              <div className="adv-tool-icon-wrap" style={{ background: `linear-gradient(135deg, ${t.color}22, ${t.color}08)`, borderColor: `${t.color}40` }}>
                <span className="adv-tool-icon">{t.icon}</span>
              </div>
              <div className="adv-tool-meta">
                <div className="adv-tool-name">{t.name}</div>
                <div className="adv-tool-desc">{t.desc}</div>
              </div>
              {selectedTool === t.id && (
                <div className="adv-tool-check" style={{ background: t.color }}>✓</div>
              )}
            </label>
          ))}
        </div>

        {/* Target & basic config */}
        <div className="adv-section-hdr" style={{ marginTop: 28 }}>
          <div className="adv-section-dot" style={{ background: accentGrad }} />
          <h3>Step 2 · Target &amp; basic settings</h3>
        </div>

        <div className="exp-context-section">
          {extraConfig}
        </div>

        {/* Tool-specific options */}
        {curTool?.options?.length > 0 && (
          <>
            <div className="adv-section-hdr" style={{ marginTop: 24 }}>
              <div className="adv-section-dot" style={{ background: curTool.color }} />
              <h3>Step 3 · {curTool.name} options</h3>
              <span className="adv-section-count">{curTool.options.length} settings</span>
            </div>
            <ToolOptionsPanel tool={curTool} values={curOpts} onChange={setCurOpts} />
          </>
        )}

        {/* Generate button */}
        <button
          className="btn btn-primary btn-lg adv-generate-btn"
          style={{ marginTop: 20, width: '100%', background: accentGrad, boxShadow: `0 8px 24px ${accent}44` }}
          disabled={disabled || loading}
          onClick={onGenerate}
        >
          {loading ? (
            <><span className="spinner" /> Generating your test suite...</>
          ) : (
            <>🚀 Generate {kind.charAt(0).toUpperCase() + kind.slice(1)} Test Suite</>
          )}
        </button>

        {error && (
          <div className="adv-error-card">
            <span className="adv-error-icon">❌</span>
            <div><strong>Something went wrong</strong><div style={{ marginTop: 4, fontSize: 13 }}>{error}</div></div>
          </div>
        )}

        {result && (
          <div className="adv-result-card" style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}0d, ${accent}05)` }}>
            <div className="adv-result-hdr">
              <div className="adv-result-badge" style={{ background: accentGrad }}>✓</div>
              <div>
                <div className="adv-result-title">Test suite generated successfully!</div>
                <div className="adv-result-sub">{result.projectName}</div>
              </div>
            </div>

            <div className="adv-result-stats">
              <div className="adv-result-stat">
                <div className="adv-result-stat-val">{result.fileCount}</div>
                <div className="adv-result-stat-lbl">Files</div>
              </div>
              <div className="adv-result-stat">
                <div className="adv-result-stat-val" style={{ textTransform: 'uppercase', fontSize: 14 }}>{result.tool}</div>
                <div className="adv-result-stat-lbl">Tool</div>
              </div>
              {result.scenario && (
                <div className="adv-result-stat">
                  <div className="adv-result-stat-val" style={{ textTransform: 'capitalize', fontSize: 14 }}>{result.scenario}</div>
                  <div className="adv-result-stat-lbl">Scenario</div>
                </div>
              )}
              {result.scanDepth && (
                <div className="adv-result-stat">
                  <div className="adv-result-stat-val" style={{ textTransform: 'capitalize', fontSize: 14 }}>{result.scanDepth}</div>
                  <div className="adv-result-stat-lbl">Depth</div>
                </div>
              )}
            </div>

            <div className="adv-result-actions">
              <a className="btn btn-primary" href={result.downloadUrl} download style={{ background: accentGrad, boxShadow: `0 4px 12px ${accent}55` }}>
                ⬇️ Download ZIP
              </a>
              <div className="adv-result-hint">
                💡 Extract the ZIP and follow the README inside for setup &amp; run instructions.
              </div>
            </div>
          </div>
        )}
      </div>
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
    color: ['#00bcd4','#b9b7ff','#0097a7','#0097a7','#f59e0b','#10b981'][i % 6],
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
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eef1f6" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">{passRate}%</text>
        <text x="50" y="60" textAnchor="middle" fill="#9ca3af" fontSize="8">Pass Rate</text>
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
    <div style={{ color:'#b0b7c3', textAlign:'center', padding:'32px 0', fontSize:12 }}>
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
          <stop offset="0%"   stopColor="#00bcd4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PT + (1 - pct / 100) * iH;
        return (
          <g key={pct}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#eef1f6" strokeWidth="1" />
            <text x={PL - 4} y={y + 3} fill="#b0b7c3" fontSize="8" textAnchor="end">{pct}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#lgArea)" />
      <polyline points={polyline} fill="none" stroke="#00bcd4" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4"
            fill={p.passRate >= 80 ? '#10b981' : p.passRate >= 50 ? '#f59e0b' : '#ef4444'}
            stroke="#0f172a" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 7} fill="#6b7280" fontSize="8" textAnchor="middle">{p.passRate}%</text>
          {p.date && (
            <text x={p.x} y={H - 4} fill="#b0b7c3" fontSize="7.5" textAnchor="middle">{p.date}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
// ── Settings Page — profile, notifications, appearance, security ──────────
function SettingsPage({ authUser, darkMode, onToggleTheme, onLogout, toast, addNotification }) {
  const [section, setSection] = useState('profile');
  const [notifs,  setNotifs]  = useState({ slackWebhookUrl: '', teamsWebhookUrl: '', webhookUrl: '' });
  const [newSlack, setNewSlack] = useState('');
  const [newTeams, setNewTeams] = useState('');
  const [newWebhook, setNewWebhook] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setNotifs(d); })
      .catch(() => {});
  }, []);

  const saveNotif = async (kind, url) => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Refresh
      const getRes = await fetch('/api/notifications');
      if (getRes.ok) setNotifs(await getRes.json());
      toast(`${kind.charAt(0).toUpperCase() + kind.slice(1)} webhook saved`, 'success');
      if (addNotification) addNotification({ type: 'success', title: `${kind} notifications configured`, description: 'You will receive test run alerts.' });
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const testNotif = async (kind) => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast('Test notification sent!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">
            <Icons.Settings size={28} />
            Settings
          </h1>
          <p className="settings-sub">Manage your profile, integrations, and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {[
            { id: 'profile',       label: 'Profile',        icon: Icons.User },
            { id: 'appearance',    label: 'Appearance',     icon: darkMode ? Icons.Moon : Icons.Sun },
            { id: 'notifications', label: 'Notifications',  icon: Icons.Bell },
            { id: 'security',      label: 'Security',       icon: Icons.Shield },
            { id: 'danger',        label: 'Danger Zone',    icon: Icons.AlertCircle, danger: true },
          ].map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={`settings-nav ${section === s.id ? 'active' : ''} ${s.danger ? 'danger' : ''}`}
                onClick={() => setSection(s.id)}
              >
                <Icon size={16} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="settings-content">
          {section === 'profile' && (
            <div className="settings-card">
              <h2 className="settings-card-title"><Icons.User size={18} /> Profile</h2>
              <div className="settings-row">
                <label>Name</label>
                <input className="field-input" value={authUser?.name || ''} readOnly />
              </div>
              <div className="settings-row">
                <label>Email</label>
                <input className="field-input" value={authUser?.email || ''} readOnly />
              </div>
              <div className="settings-row">
                <label>Role</label>
                <div>
                  <span className={`user-role-chip role-${authUser?.role}`} style={{ fontSize: 11 }}>
                    {authUser?.role}
                  </span>
                </div>
              </div>
              <div className="settings-row">
                <label>Account ID</label>
                <code className="settings-code">{authUser?.id}</code>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="settings-card">
              <h2 className="settings-card-title"><Icons.Sparkles size={18} /> Appearance</h2>
              <div className="settings-theme-grid">
                <button className={`theme-card ${!darkMode ? 'active' : ''}`} onClick={() => darkMode && onToggleTheme()}>
                  <Icons.Sun size={36} />
                  <div className="theme-card-name">Light</div>
                </button>
                <button className={`theme-card ${darkMode ? 'active' : ''}`} onClick={() => !darkMode && onToggleTheme()}>
                  <Icons.Moon size={36} />
                  <div className="theme-card-name">Dark</div>
                </button>
              </div>
              <p className="settings-hint">Theme preference is saved to your browser.</p>
            </div>
          )}

          {section === 'notifications' && (
            <div className="settings-card">
              <h2 className="settings-card-title"><Icons.Bell size={18} /> Notifications</h2>
              <p className="settings-hint">Get alerts in Slack, Teams, or a custom webhook when tests complete.</p>

              {/* Slack */}
              <div className="settings-integration">
                <div className="settings-integration-top">
                  <strong>💬 Slack</strong>
                  {notifs.slackWebhookUrl && <span className="settings-chip-on">Connected</span>}
                </div>
                {notifs.slackWebhookUrl ? (
                  <>
                    <code className="settings-code">{notifs.slackWebhookUrl}</code>
                    <div className="settings-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => testNotif('slack')} disabled={loading}>Send test</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => saveNotif('slack', '')} disabled={loading}>Remove</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      className="field-input"
                      placeholder="https://hooks.slack.com/services/..."
                      value={newSlack}
                      onChange={e => setNewSlack(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => saveNotif('slack', newSlack)} disabled={loading || !newSlack.startsWith('https://')}>Save Slack webhook</button>
                  </>
                )}
              </div>

              {/* Teams */}
              <div className="settings-integration">
                <div className="settings-integration-top">
                  <strong>👥 Microsoft Teams</strong>
                  {notifs.teamsWebhookUrl && <span className="settings-chip-on">Connected</span>}
                </div>
                {notifs.teamsWebhookUrl ? (
                  <>
                    <code className="settings-code">{notifs.teamsWebhookUrl}</code>
                    <div className="settings-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => testNotif('teams')} disabled={loading}>Send test</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => saveNotif('teams', '')} disabled={loading}>Remove</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      className="field-input"
                      placeholder="https://outlook.office.com/webhook/..."
                      value={newTeams}
                      onChange={e => setNewTeams(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => saveNotif('teams', newTeams)} disabled={loading || !newTeams.startsWith('https://')}>Save Teams webhook</button>
                  </>
                )}
              </div>

              {/* Generic webhook */}
              <div className="settings-integration">
                <div className="settings-integration-top">
                  <strong>🔗 Custom Webhook</strong>
                  {notifs.webhookUrl && <span className="settings-chip-on">Connected</span>}
                </div>
                {notifs.webhookUrl ? (
                  <>
                    <code className="settings-code">{notifs.webhookUrl}</code>
                    <div className="settings-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => testNotif('webhook')} disabled={loading}>Send test</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => saveNotif('webhook', '')} disabled={loading}>Remove</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      className="field-input"
                      placeholder="https://your-endpoint.com/..."
                      value={newWebhook}
                      onChange={e => setNewWebhook(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => saveNotif('webhook', newWebhook)} disabled={loading || !newWebhook.startsWith('https://')}>Save webhook</button>
                  </>
                )}
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="settings-card">
              <h2 className="settings-card-title"><Icons.Shield size={18} /> Security</h2>
              <div className="settings-sec-item">
                <div>
                  <div className="settings-sec-label">🔐 Authentication</div>
                  <div className="settings-sec-desc">JWT-based login, bcrypt password hashing</div>
                </div>
                <span className="settings-chip-on">Active</span>
              </div>
              <div className="settings-sec-item">
                <div>
                  <div className="settings-sec-label">🔒 Secrets encryption</div>
                  <div className="settings-sec-desc">AES-256-GCM at rest for Slack, Teams, webhook URLs, API keys</div>
                </div>
                <span className="settings-chip-on">Active</span>
              </div>
              <div className="settings-sec-item">
                <div>
                  <div className="settings-sec-label">⚡ Rate limiting</div>
                  <div className="settings-sec-desc">2000 requests / 15 min per IP (loopback exempt)</div>
                </div>
                <span className="settings-chip-on">Active</span>
              </div>
              <div className="settings-sec-item">
                <div>
                  <div className="settings-sec-label">🛡️ HTTP security headers</div>
                  <div className="settings-sec-desc">HSTS, CSP, X-Frame-Options, X-Content-Type-Options via Helmet</div>
                </div>
                <span className="settings-chip-on">Active</span>
              </div>
            </div>
          )}

          {section === 'danger' && (
            <div className="settings-card settings-danger">
              <h2 className="settings-card-title"><Icons.AlertCircle size={18} color="#ef4444" /> Danger Zone</h2>
              <div className="settings-danger-item">
                <div>
                  <div className="settings-danger-label">Log out</div>
                  <div className="settings-danger-desc">Sign out of this browser. Your data stays safe.</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>Log out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
      <div className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-animated-bg" />
        <div style={{ position: 'relative' }}>
          <EmptyState
            icon={Icons.Activity}
            title="Welcome to your QA Dashboard"
            description="Run your first test to see metrics, pass-rate trends, flaky test detection, and module-level distribution right here."
            action={{ label: 'Start First Run', icon: Icons.Play, onClick: () => onNavigate('manual') }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 32, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
            {[
              { i: Icons.Zap,       t: 'Manual Test',   d: 'Run Playwright suites', p: 'manual' },
              { i: Icons.Search,    t: 'Exploratory',    d: 'Analyze screenshots', p: 'exploratory' },
              { i: Icons.Globe,     t: 'API Testing',    d: 'Generate API suites', p: 'api' },
              { i: Icons.Shield,    t: 'Security',       d: 'OWASP scans', p: 'security' },
            ].map(q => (
              <button key={q.p} className="adv-tool-card" onClick={() => onNavigate(q.p)} style={{ textAlign: 'left' }}>
                <div className="adv-tool-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,.15), rgba(139,92,246,.08))' }}>
                  <q.i size={20} />
                </div>
                <div className="adv-tool-meta">
                  <div className="adv-tool-name">{q.t}</div>
                  <div className="adv-tool-desc">{q.d}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Module distribution for the bar chart ─────────────────────────────────
  const moduleData = [
    { label: 'Passed', value: runHistory.reduce((s, r) => s + (r.passed || 0), 0), color: 'linear-gradient(90deg, #10b981, #059669)' },
    { label: 'Failed', value: runHistory.reduce((s, r) => s + (r.failed || 0), 0), color: 'linear-gradient(90deg, #ef4444, #dc2626)' },
    { label: 'Skipped', value: runHistory.reduce((s, r) => s + (r.skipped || 0), 0), color: 'linear-gradient(90deg, #f59e0b, #d97706)' },
  ];
  const sparkRates = trendData.map(d => d.passRate);
  const sparkTotal = [...runHistory].reverse().slice(-10).map(r => r.total || 0);

  const kpiColor = (rate) => rate >= 80 ? '#34d399' : rate >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="dashboard">
      {/* KPI grid — now with sparklines */}
      <div className="kpi-grid">
        <div className="kpi-card accent-indigo" style={{ position:'relative', overflow:'hidden' }}>
          <div className="kpi-icon">🚀</div>
          <div className="kpi-val" style={{ color:'#0097a7' }}>{totalRuns}</div>
          <div className="kpi-lbl">Total Runs</div>
          <div className="kpi-sub">All time</div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={sparkTotal.length > 1 ? sparkTotal : [0, totalRuns]} color="#0097a7" width={180} height={30} />
          </div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-icon">🧪</div>
          <div className="kpi-val" style={{ color:'#34d399' }}>{totalTests}</div>
          <div className="kpi-lbl">Tests Executed</div>
          <div className="kpi-sub">Across all runs</div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={sparkTotal} color="#34d399" width={180} height={30} />
          </div>
        </div>
        <div className="kpi-card accent-amber">
          <div className="kpi-icon">📈</div>
          <div className="kpi-val" style={{ color: kpiColor(avgPassRate) }}>{avgPassRate}%</div>
          <div className="kpi-lbl">Avg Pass Rate</div>
          <div className="kpi-sub">{totalRuns} run{totalRuns !== 1 ? 's' : ''}</div>
          <div style={{ marginTop: 8 }}>
            <Sparkline data={sparkRates} color={kpiColor(avgPassRate)} width={180} height={30} />
          </div>
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

      {/* Test Result Distribution */}
      <div className="panel">
        <div className="section-title">🎯 Test Result Distribution (cumulative)</div>
        <BarChart data={moduleData} height={120} />
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

// ── Auth Screen (Login / Signup) ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('login');   // 'login' | 'signup'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [err,      setErr]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => { if (d.userCount === 0) { setMode('signup'); setFirstRun(true); } })
      .catch(() => {});
  }, []);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('qa_token', data.token);
      onAuth(data.user, data.token);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="auth-hero-icon">🧪</div>
          <h1 className="auth-hero-title">QA Testing Platform</h1>
          <p className="auth-hero-sub">AI-powered testing for any application</p>
        </div>

        {firstRun && (
          <div className="auth-firstrun">
            👋 <strong>Welcome!</strong> No users exist yet — the first account you create will be the admin.
          </div>
        )}

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Log In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <div className="auth-form">
          {mode === 'signup' && (
            <div className="field">
              <label className="field-label">Name</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label className="field-label">Password <span className="field-hint">— min 8 characters</span></label>
            <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          {err && <div className="auth-error">❌ {err}</div>}

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} onClick={submit} disabled={loading || !email || !password}>
            {loading ? '⏳ …' : mode === 'login' ? '🔓 Log In' : '✨ Create Account'}
          </button>

          <div className="auth-footer">
            {mode === 'login' ? (
              <span>No account? <a onClick={() => setMode('signup')}>Sign up</a></span>
            ) : (
              <span>Already have an account? <a onClick={() => setMode('login')}>Log in</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AppShell — handles auth gating, then delegates to the main App ──────────
export default function App() {
  const [authUser,   setAuthUser]   = useState(null);
  const [authToken,  setAuthToken]  = useState(() => localStorage.getItem('qa_token') || '');
  const [authReady,  setAuthReady]  = useState(false);

  useEffect(() => {
    if (!authToken) { setAuthReady(true); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setAuthUser(d.user); else localStorage.removeItem('qa_token'); })
      .finally(() => setAuthReady(true));
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    const origFetch = window.fetch;
    window.fetch = function (input, init = {}) {
      const url = typeof input === 'string' ? input : input.url;
      if (url && url.startsWith('/api/') &&
          !url.includes('/auth/login') &&
          !url.includes('/auth/signup') &&
          !url.includes('/auth/status')) {
        init.headers = { ...(init.headers || {}), Authorization: `Bearer ${authToken}` };
      }
      return origFetch.call(this, input, init);
    };
    return () => { window.fetch = origFetch; };
  }, [authToken]);

  const handleLogout = () => {
    localStorage.removeItem('qa_token');
    setAuthUser(null);
    setAuthToken('');
  };

  if (!authReady) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>;
  }
  if (!authUser) {
    return <AuthScreen onAuth={(user, token) => { setAuthUser(user); setAuthToken(token); }} />;
  }

  return <QAToolApp authUser={authUser} onLogout={handleLogout} />;
}

// ── Main QA Tool application (only rendered once authenticated) ──────────────
function QAToolApp({ authUser, onLogout }) {
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
  const [videoRecording,       setVideoRecording]       = useState('off');
  const [traceCapture,         setTraceCapture]         = useState('off');
  const [showAdvanced,         setShowAdvanced]         = useState(false);
  const [runHistory,           setRunHistory]           = useState([]);
  const [genericMode,          setGenericMode]          = useState(false);
  const [inputMode,            setInputMode]            = useState('requirement'); // 'requirement' | 'testcase' | 'generic'
  const [testcaseFile,         setTestcaseFile]         = useState(null);
  const testcaseFileRef = useRef();

  // ── Script Generator state ───────────────────────────────────────────────
  const [sgTool,       setSgTool]       = useState('playwright');
  const [sgLang,       setSgLang]       = useState('javascript');
  const [sgFramework,  setSgFramework]  = useState('pom');
  const [sgTestType,   setSgTestType]   = useState('regression');
  const [sgUrl,        setSgUrl]        = useState('');
  const [sgFile,       setSgFile]       = useState(null);
  const [sgGeneric,    setSgGeneric]    = useState(false);
  const [sgLoading,    setSgLoading]    = useState(false);
  const [sgResult,     setSgResult]     = useState(null);
  const sgFileRef = useRef();

  // ── Exploratory Testing state ─────────────────────────────────────────────
  const [expFiles,       setExpFiles]       = useState([]);
  const [expPreviews,    setExpPreviews]    = useState([]);
  const [expAppUrl,      setExpAppUrl]      = useState('');
  const [expAppName,     setExpAppName]     = useState('');
  const [expModule,      setExpModule]      = useState('');
  const [expDomain,      setExpDomain]      = useState('');
  const [expNotes,       setExpNotes]       = useState('');
  const [expSessionId,   setExpSessionId]   = useState(null);
  const [expStatus,      setExpStatus]      = useState('idle'); // idle | processing | done | error
  const [expLogs,        setExpLogs]        = useState([]);
  const [expResults,     setExpResults]     = useState(null);
  const [expError,       setExpError]       = useState('');
  const [expActiveTab,   setExpActiveTab]   = useState('testcases');
  const [expDragOver,    setExpDragOver]    = useState(false);
  const [expFilterCat,   setExpFilterCat]   = useState('All');
  const [expFilterPri,   setExpFilterPri]   = useState('All');
  const expFileRef = useRef();

  // ── AI Agent state ───────────────────────────────────────────────────────
  const [aiApiKey,      setAiApiKey]      = useState('');
  const [aiConfigured,  setAiConfigured]  = useState(false);
  const [aiKeyPreview,  setAiKeyPreview]  = useState('');

  // ── JIRA state ───────────────────────────────────────────────────────────
  const [jiraUrl,        setJiraUrl]        = useState('');
  const [jiraEmail,      setJiraEmail]      = useState('');
  const [jiraToken,      setJiraToken]      = useState('');
  const [jiraProject,    setJiraProject]    = useState('');
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [jiraLoading,    setJiraLoading]    = useState(false);

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
  const [page, setPage] = useState('manual'); // 'manual' | 'monitor' | 'dashboard' | 'exploratory' | 'api' | 'security' | 'performance'

  // ── Advanced-testing tabs state ────────────────────────────────────────────
  const [advType,       setAdvType]       = useState(null); // tracks last-generated type
  const [apiBaseUrl,    setApiBaseUrl]    = useState('https://api.example.com');
  const [apiTool,       setApiTool]       = useState('postman');
  const [apiAuth,       setApiAuth]       = useState('bearer');
  const [secTarget,     setSecTarget]     = useState('https://example.com');
  const [secTool,       setSecTool]       = useState('zap');
  const [secDepth,      setSecDepth]      = useState('baseline');
  const [perfTarget,    setPerfTarget]    = useState('https://example.com');
  const [perfTool,      setPerfTool]      = useState('k6');
  const [perfScenario,  setPerfScenario]  = useState('load');
  const [perfUsers,     setPerfUsers]     = useState('');
  const [advLoading,    setAdvLoading]    = useState(false);
  const [advResult,     setAdvResult]     = useState(null);
  const [advError,      setAdvError]      = useState('');
  const [advToolOpts,   setAdvToolOpts]   = useState({}); // { [toolId]: { [fieldKey]: value } }

  // ── Accessibility testing state ───────────────────────────────────────────
  const [a11yTarget,    setA11yTarget]    = useState('https://example.com');
  const [a11yTool,      setA11yTool]      = useState('playwright-axe');
  const [a11yStandard,  setA11yStandard]  = useState('wcag21aa');
  // ── Visual regression state ───────────────────────────────────────────────
  const [visualTarget,  setVisualTarget]  = useState('https://example.com');
  const [visualTool,    setVisualTool]    = useState('playwright');
  // ── Mobile testing state ──────────────────────────────────────────────────
  const [mobilePkg,     setMobilePkg]     = useState('com.example.app');
  const [mobilePlatform, setMobilePlatform] = useState('android');
  const [mobileTool,    setMobileTool]    = useState('appium-webdriverio');
  // ── Database testing state ────────────────────────────────────────────────
  const [dbType,        setDbType]        = useState('postgres');
  const [dbTool,        setDbTool]        = useState('sql-assertion-js');
  // ── CI/CD state ───────────────────────────────────────────────────────────
  const [cicdPlatform,  setCicdPlatform]  = useState('github');
  const [cicdStack,     setCicdStack]     = useState('playwright');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('qa-theme') !== 'light');

  // ── Sidebar state ──────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('qa-sidebar-collapsed') === 'true');
  useEffect(() => { localStorage.setItem('qa-sidebar-collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);

  // ── Mouse-follow spotlight (updates CSS vars for .spotlight elements) ────
  useEffect(() => {
    const handler = (e) => {
      const targets = document.querySelectorAll('.panel, .trend-card, .stat-card, .kpi-card, .adv-tool-card, .admin-user-row, .cmdk-item');
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        // Only set if cursor is within the element's bounds (+ padding)
        if (e.clientX >= r.left - 100 && e.clientX <= r.right + 100 &&
            e.clientY >= r.top  - 100 && e.clientY <= r.bottom + 100) {
          el.style.setProperty('--mx', `${e.clientX - r.left}px`);
          el.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // ── Onboarding tour + What's New ──────────────────────────────────────────
  const tourCompletedKey = `qa-tour-completed-${authUser?.id || 'anon'}`;
  const whatsNewKey       = 'qa-whatsnew-v2';
  const [tourOpen,     setTourOpen]     = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  // Show tour on first login + what's new modal on version bump
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (!localStorage.getItem(tourCompletedKey)) setTourOpen(true);
      else if (!localStorage.getItem(whatsNewKey))  setWhatsNewOpen(true);
    }, 800);
    return () => clearTimeout(t1);
  }, [authUser?.id, tourCompletedKey]);

  // ── Command Palette + Shortcuts Modal + Notifications ──────────────────────
  const [cmdOpen,       setCmdOpen]       = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qa_notifications') || '[]'); } catch { return []; }
  });

  const addNotification = useCallback((notif) => {
    const item = { id: Date.now() + Math.random(), read: false, timestamp: new Date().toISOString(), ...notif };
    setNotifications(prev => {
      const next = [item, ...prev].slice(0, 50);
      localStorage.setItem('qa_notifications', JSON.stringify(next));
      return next;
    });
  }, []);
  const markNotifRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('qa_notifications', JSON.stringify(next));
      return next;
    });
  }, []);
  const clearAllNotifs = useCallback(() => {
    setNotifications([]);
    localStorage.setItem('qa_notifications', '[]');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('qa-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
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

  // ── Check AI agent status ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/agent/status`).then(r => r.json()).then(data => {
      setAiConfigured(data.configured);
      setAiKeyPreview(data.keyPreview || '');
    }).catch(() => {});
    fetch(`${API}/api/jira/status`).then(r => r.json()).then(data => {
      setJiraConfigured(data.configured);
      if (data.baseUrl) setJiraUrl(data.baseUrl);
      if (data.projectKey) setJiraProject(data.projectKey);
      if (data.email) setJiraEmail(data.email);
    }).catch(() => {});
  }, []);

  const handleSaveApiKey = async () => {
    if (!aiApiKey.trim()) return;
    try {
      const res = await fetch(`${API}/api/agent/apikey`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiApiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiConfigured(true);
        setAiKeyPreview(aiApiKey.slice(0, 10) + '...');
        setAiApiKey('');
        toast('AI Agents activated! 3 agents ready.', 'success');
      } else {
        toast(data.error || 'Invalid API key', 'error');
      }
    } catch (e) { toast('Failed to save: ' + e.message, 'error'); }
  };

  // ── JIRA handlers ────────────────────────────────────────────────────────
  const handleJiraSave = async () => {
    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraProject) { toast('All JIRA fields required', 'error'); return; }
    setJiraLoading(true);
    try {
      const res = await fetch(`${API}/api/jira/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: jiraUrl, email: jiraEmail, apiToken: jiraToken, projectKey: jiraProject }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setJiraConfigured(true);
      toast('JIRA connected! Bugs will auto-log on test failures.', 'success');
    } catch (e) { toast('JIRA error: ' + e.message, 'error'); }
    setJiraLoading(false);
  };

  const handleJiraTest = async () => {
    setJiraLoading(true);
    try {
      const res = await fetch(`${API}/api/jira/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) toast(`Connected to ${data.projectName} (${data.projectKey})`, 'success');
      else toast('Connection failed: ' + data.error, 'error');
    } catch (e) { toast('Test failed: ' + e.message, 'error'); }
    setJiraLoading(false);
  };

  const handleJiraClear = async () => {
    await fetch(`${API}/api/jira/config`, { method: 'DELETE' }).catch(() => {});
    setJiraConfigured(false);
    setJiraToken('');
    toast('JIRA disconnected', 'info');
  };

  // ── Script Generator handler ──────────────────────────────────────────────
  const handleGenerateScripts = async () => {
    if (!sgUrl.trim()) { toast('Enter the application URL', 'error'); return; }
    if (!sgFile && !sgGeneric) { toast('Upload a requirements doc or enable Generic Mode', 'error'); return; }
    setSgLoading(true);
    setSgResult(null);
    try {
      const fd = new FormData();
      fd.append('appUrl', sgUrl.trim());
      fd.append('tool', sgTool);
      fd.append('language', sgLang);
      fd.append('framework', sgFramework);
      fd.append('testType', sgTestType);
      fd.append('genericMode', String(sgGeneric));
      if (sgFile) fd.append('requirementFile', sgFile);
      const res = await fetch(`${API}/api/generate-scripts`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSgResult(data);
      toast(`Suite generated! ${data.fileCount} files ready to download`, 'success');
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
    setSgLoading(false);
  };

  const handleClearApiKey = async () => {
    await fetch(`${API}/api/agent/apikey`, { method: 'DELETE' }).catch(() => {});
    setAiConfigured(false);
    setAiKeyPreview('');
    toast('AI cleared. Using rule-based mode.', 'info');
  };

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
    if (inputMode === 'requirement' && !file)    { toast('Please upload a requirement document', 'error'); return; }
    if (inputMode === 'testcase'    && !testcaseFile) { toast('Please upload a test case sheet (CSV or XLSX)', 'error'); return; }

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
    formData.append('genericMode',           String(inputMode === 'generic'));
    if (inputMode === 'requirement' && file) {
      formData.append('requirementFile',     file);
    }
    if (inputMode === 'testcase' && testcaseFile) {
      formData.append('testcaseFile',        testcaseFile);
    }
    formData.append('browsers',              JSON.stringify(browsers));
    formData.append('testScope',             testScope);
    formData.append('priorityFilter',        priorityFilter);
    formData.append('workers',               workers);
    formData.append('retries',               retries);
    formData.append('screenshots',           screenshots);
    formData.append('video',                 videoRecording);
    formData.append('trace',                 traceCapture);
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

  // ── Exploratory Testing handlers ───────────────────────────────────────────
  const handleExpFilesChange = (fileList) => {
    const files = Array.from(fileList);
    setExpFiles(prev => [...prev, ...files]);
    // Generate previews for images
    files.forEach(f => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setExpPreviews(prev => [...prev, { name: f.name, url: e.target.result }]);
        reader.readAsDataURL(f);
      } else {
        setExpPreviews(prev => [...prev, { name: f.name, url: null, isVideo: true }]);
      }
    });
  };

  const handleExpRemoveFile = (idx) => {
    setExpFiles(prev => prev.filter((_, i) => i !== idx));
    setExpPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExpAnalyze = async () => {
    if (expFiles.length === 0) return;

    setExpStatus('processing');
    setExpLogs([]);
    setExpResults(null);
    setExpError('');
    setExpActiveTab('testcases');

    const formData = new FormData();
    expFiles.forEach(f => formData.append('files', f));
    formData.append('appUrl', expAppUrl);
    formData.append('appName', expAppName);
    formData.append('module', expModule);
    formData.append('domain', expDomain);
    formData.append('notes', expNotes);

    try {
      const res = await fetch(`${API}/api/exploratory/analyze`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setExpSessionId(data.sessionId);
    } catch (err) {
      setExpStatus('error');
      setExpError(err.message);
    }
  };

  // Poll exploratory session status
  useEffect(() => {
    if (!expSessionId || expStatus === 'done' || expStatus === 'error') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/exploratory/status/${expSessionId}`);
        const data = await res.json();
        setExpLogs(data.logs || []);
        if (data.status === 'done') {
          setExpStatus('done');
          setExpResults(data.results);
          toast('Exploratory analysis complete!', 'success');
          clearInterval(interval);
        } else if (data.status === 'error') {
          setExpStatus('error');
          setExpError(data.error || 'Analysis failed');
          toast('Exploratory analysis failed', 'error');
          clearInterval(interval);
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [expSessionId, expStatus]);

  const handleExpReset = () => {
    setExpFiles([]);
    setExpPreviews([]);
    setExpSessionId(null);
    setExpStatus('idle');
    setExpLogs([]);
    setExpResults(null);
    setExpError('');
    setExpActiveTab('testcases');
    setExpFilterCat('All');
    setExpFilterPri('All');
  };

  const handleExpExport = () => {
    if (!expResults) return;
    const exportData = {
      generatedAt: new Date().toISOString(),
      screenAnalysis: expResults.screenAnalysis,
      testCases: expResults.testCases,
      exploratoryCharters: expResults.exploratoryCharters,
      riskAreas: expResults.riskAreas,
      summary: expResults.summary,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exploratory-tests-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Test cases exported!', 'success');
  };

  const handleExpExportCSV = () => {
    if (!expResults?.testCases) return;
    const headers = ['ID', 'Category', 'Title', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Test Data', 'Notes'];
    const rows = expResults.testCases.map(tc => [
      tc.id, tc.category, tc.title, tc.priority, tc.preconditions || '',
      (tc.steps || []).join(' | '), tc.expectedResult || '', tc.testData || '', tc.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exploratory-tests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Test cases exported as CSV!', 'success');
  };

  // ── Global keyboard shortcuts (Cmd+K, ?, g+letter, t) ────────────────────
  useEffect(() => {
    let gPressed = false;
    let gTimer;

    const handler = (e) => {
      // Ignore if user is typing in input/textarea/contenteditable
      const t = e.target;
      const isInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;

      // Cmd/Ctrl+K → command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
        return;
      }

      if (isInput) return;

      // ? → shortcuts modal
      if (e.key === '?') { e.preventDefault(); setShortcutsOpen(true); return; }
      // t → theme
      if (e.key === 't') { e.preventDefault(); setDarkMode(d => !d); return; }

      // g + letter navigation
      if (e.key === 'g') { gPressed = true; clearTimeout(gTimer); gTimer = setTimeout(() => { gPressed = false; }, 1200); return; }
      if (gPressed) {
        const map = { d: 'dashboard', m: 'manual', e: 'exploratory', a: 'api', s: 'security', p: 'performance', c: 'cicd', v: 'visual' };
        const pageName = map[e.key.toLowerCase()];
        if (pageName) { e.preventDefault(); setPage(pageName); gPressed = false; }
      }
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(gTimer); };
  }, []);

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
    <div className={`app app-with-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        authUser={authUser}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />
      {/* ── Top bar (minimal — sidebar handles nav) ──────────────────────────── */}
      <div className="page-bg-canvas" data-page={page}>
        <div className="page-bg-orb page-bg-orb-1" />
        <div className="page-bg-orb page-bg-orb-2" />
        <div className="page-bg-orb page-bg-orb-3" />
        <div className="page-bg-orb page-bg-orb-4" />
        <div className="page-bg-orb page-bg-orb-5" />
        <div className="page-bg-noise" />
        <svg className="page-bg-mesh" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity=".18" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      <header className="topbar topbar-minimal">
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(c => !c)} title="Toggle sidebar">
          <Icons.Menu size={20} />
        </button>
        <div className="topbar-breadcrumb">
          {monStatus?.isRunning && page !== 'monitor' && (
            <span className="topbar-live-chip">
              <span className="live-dot" /> Email Monitor Active
            </span>
          )}
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
          <button
            className="topbar-iconbtn"
            onClick={() => setCmdOpen(true)}
            title="Command palette (Ctrl+K)"
          >
            <Icons.Search size={18} />
            <kbd className="topbar-kbd">⌘K</kbd>
          </button>
          <NotificationBell
            notifications={notifications}
            onMarkRead={markNotifRead}
            onClearAll={clearAllNotifs}
          />
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
          </button>
          <div className="user-menu">
            <button className="user-menu-btn" title={authUser?.email}>
              <span className="user-avatar">{(authUser?.name || authUser?.email || '?').charAt(0).toUpperCase()}</span>
              <span className="user-name">{authUser?.name || authUser?.email}</span>
              <span className={`user-role-chip role-${authUser?.role}`}>{authUser?.role}</span>
            </button>
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-menu-name">{authUser?.name}</div>
                <div className="user-menu-email">{authUser?.email}</div>
              </div>
              <button className="user-menu-item" onClick={() => setPage('settings')}>
                <Icons.Settings size={14} style={{ marginRight: 8, verticalAlign: -2 }} /> Settings
              </button>
              <button className="user-menu-item" onClick={onLogout}>
                <Icons.LogOut size={14} style={{ marginRight: 8, verticalAlign: -2 }} /> Log out
              </button>
            </div>
          </div>
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
                       rel="noreferrer" style={{ marginLeft: 8, fontSize: 11, color: '#00bcd4' }}>
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
                               background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:16 }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
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
                    <span style={{ color:'#9ca3af', fontSize:12 }}>
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
                      <div style={{ color:'#b0b7c3', fontStyle:'italic', padding:'20px 0' }}>
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

        {/* ══════════════ SCRIPT GENERATOR PAGE ═══════════════════════════════ */}
        {page === 'scripts' && (
          <div className="panel">
            <div className="panel-header">
              <h2>🛠️ Automation Script Generator</h2>
              <p>Generate a complete, ready-to-run automation test suite. Just download, extract, and execute.</p>
            </div>

            {/* URL */}
            <div className="field">
              <label className="field-label">🌐 Application URL</label>
              <input className="field-input" placeholder="http://your-app.com or C:/path/to/index.html"
                value={sgUrl} onChange={e => setSgUrl(e.target.value)} />
            </div>

            {/* Generic toggle */}
            <label className="generic-toggle">
              <input type="checkbox" checked={sgGeneric} onChange={e => setSgGeneric(e.target.checked)} />
              <span className="generic-toggle-slider" />
              <div className="generic-toggle-content">
                <span className="generic-toggle-label">🧪 Generic Test Mode</span>
                <span className="generic-toggle-hint">{sgGeneric ? 'All 10 modules — no document needed' : 'Upload requirements to generate targeted tests'}</span>
              </div>
            </label>

            {/* File upload */}
            {!sgGeneric && (
              <div className="field">
                <label className="field-label">📄 Requirements Document <span className="field-hint">— PDF, TXT, MD</span></label>
                <div className={`drop-zone ${sgFile ? 'has-file' : ''}`} onClick={() => sgFileRef.current?.click()}>
                  {sgFile ? (
                    <div className="file-info">
                      <span className="file-icon">📃</span>
                      <div><div className="file-name">{sgFile.name}</div><div className="file-size">{(sgFile.size/1024).toFixed(1)} KB</div></div>
                      <button className="file-remove" onClick={e => { e.stopPropagation(); setSgFile(null); }}>✕</button>
                    </div>
                  ) : (
                    <div className="drop-prompt">
                      <div className="drop-icon">📁</div>
                      <div className="drop-text">Drop file here or <span className="drop-link">browse</span></div>
                    </div>
                  )}
                </div>
                <input ref={sgFileRef} type="file" accept=".pdf,.txt,.md" style={{display:'none'}}
                  onChange={e => { if (e.target.files[0]) setSgFile(e.target.files[0]); }} />
              </div>
            )}

            {/* Tool Selection */}
            <div className="sg-config">
              <div className="sg-row">
                <div className="sg-field">
                  <label className="sg-label">🔧 Automation Tool</label>
                  <div className="sg-chips">
                    {[
                      { id:'playwright', icon:'🎭', label:'Playwright' },
                      { id:'selenium',   icon:'🌐', label:'Selenium' },
                      { id:'cypress',    icon:'🌲', label:'Cypress' },
                      { id:'restassured',icon:'🔗', label:'REST Assured' },
                    ].map(t => (
                      <button key={t.id} className={`sg-chip ${sgTool === t.id ? 'sg-chip-active' : ''}`}
                        onClick={() => {
                          setSgTool(t.id);
                          if (t.id === 'cypress') setSgLang('javascript');
                          if (t.id === 'restassured') setSgLang('java');
                        }}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sg-field">
                  <label className="sg-label">💻 Language</label>
                  <div className="sg-chips">
                    {[
                      { id:'javascript',  label:'JavaScript',  tools:['playwright','cypress'] },
                      { id:'typescript',  label:'TypeScript',  tools:['playwright'] },
                      { id:'java',        label:'Java',        tools:['selenium','restassured'] },
                      { id:'python',      label:'Python',      tools:['selenium'] },
                    ].filter(l => l.tools.includes(sgTool)).map(l => (
                      <button key={l.id} className={`sg-chip ${sgLang === l.id ? 'sg-chip-active' : ''}`}
                        onClick={() => setSgLang(l.id)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sg-row">
                <div className="sg-field">
                  <label className="sg-label">📐 Framework Pattern</label>
                  <div className="sg-chips">
                    {[
                      { id:'pom',        icon:'📦', label:'Page Object Model', desc:'Recommended — clean, maintainable' },
                      { id:'bdd',        icon:'🥒', label:'BDD (Cucumber)',    desc:'Given/When/Then — business readable' },
                      { id:'datadriven', icon:'📊', label:'Data-Driven',       desc:'Excel/JSON parameterized tests' },
                    ].map(f => (
                      <button key={f.id} className={`sg-chip sg-chip-lg ${sgFramework === f.id ? 'sg-chip-active' : ''}`}
                        onClick={() => setSgFramework(f.id)} title={f.desc}>
                        {f.icon} {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sg-field">
                  <label className="sg-label">🎯 Test Type</label>
                  <div className="sg-chips">
                    {[
                      { id:'smoke',      icon:'🔥', label:'Smoke',      desc:'1 critical test per module' },
                      { id:'regression', icon:'🔄', label:'Regression', desc:'All test cases' },
                      { id:'e2e',        icon:'🚀', label:'Full E2E',   desc:'End-to-end positive flows' },
                    ].map(t => (
                      <button key={t.id} className={`sg-chip ${sgTestType === t.id ? 'sg-chip-active' : ''}`}
                        onClick={() => setSgTestType(t.id)} title={t.desc}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Config summary */}
            <div className="sg-summary">
              <span className="sg-tag">{sgTool === 'playwright' ? '🎭' : sgTool === 'selenium' ? '🌐' : sgTool === 'cypress' ? '🌲' : '🔗'} {sgTool}</span>
              <span className="sg-tag">💻 {sgLang}</span>
              <span className="sg-tag">📐 {sgFramework.toUpperCase()}</span>
              <span className="sg-tag">🎯 {sgTestType}</span>
              {aiConfigured && <span className="sg-tag sg-tag-ai">🤖 AI Enhanced</span>}
            </div>

            {/* Generate button */}
            <button className="btn btn-execute" onClick={handleGenerateScripts}
              disabled={sgLoading || !sgUrl || (!sgFile && !sgGeneric)}>
              {sgLoading ? '⏳ Generating Suite...' : '🛠️ Generate Automation Suite'}
            </button>

            {/* Result */}
            {sgResult && (
              <div className="sg-result">
                <div className="sg-result-icon">✅</div>
                <div className="sg-result-info">
                  <h3>Suite Generated Successfully!</h3>
                  <p>{sgResult.projectName} — {sgResult.fileCount} files, {sgResult.testCaseCount} test cases</p>
                  <div className="sg-result-badges">
                    <span className="sg-tag">{sgTool}</span>
                    <span className="sg-tag">{sgLang}</span>
                    <span className="sg-tag">{sgFramework}</span>
                    <span className="sg-tag">{sgTestType}</span>
                    {sgResult.aiEnabled && <span className="sg-tag sg-tag-ai">AI Generated</span>}
                  </div>
                </div>
                <a className="btn btn-download" href={`${API}${sgResult.downloadUrl}`} download>
                  📥 Download ZIP
                </a>
              </div>
            )}

            {/* What you get */}
            <div className="sg-whatyouget">
              <div className="sg-whatyouget-title">📦 What's Inside the ZIP</div>
              <div className="sg-whatyouget-grid">
                {sgTool === 'playwright' && sgLang === 'javascript' && (
                  <>
                    <div className="sg-file-item">📄 <strong>package.json</strong> — Dependencies & scripts</div>
                    <div className="sg-file-item">⚙️ <strong>playwright.config.js</strong> — Multi-browser config</div>
                    <div className="sg-file-item">📦 <strong>pages/*.js</strong> — Page Object classes</div>
                    <div className="sg-file-item">🧪 <strong>tests/*.spec.js</strong> — Test specs by module</div>
                    <div className="sg-file-item">📊 <strong>test-data/</strong> — Test data JSON files</div>
                    <div className="sg-file-item">📖 <strong>README.md</strong> — Setup & run instructions</div>
                  </>
                )}
                {sgTool === 'playwright' && sgLang === 'typescript' && (
                  <>
                    <div className="sg-file-item">📄 <strong>package.json</strong> + <strong>tsconfig.json</strong></div>
                    <div className="sg-file-item">⚙️ <strong>playwright.config.ts</strong></div>
                    <div className="sg-file-item">📦 <strong>pages/*.ts</strong> — Typed Page Objects</div>
                    <div className="sg-file-item">🧪 <strong>tests/*.spec.ts</strong> — TypeScript specs</div>
                  </>
                )}
                {sgTool === 'selenium' && sgLang === 'java' && (
                  <>
                    <div className="sg-file-item">📄 <strong>pom.xml</strong> — Maven dependencies</div>
                    <div className="sg-file-item">⚙️ <strong>testng.xml</strong> — Suite configuration</div>
                    <div className="sg-file-item">🏗️ <strong>BaseTest.java</strong> — WebDriver setup</div>
                    <div className="sg-file-item">📦 <strong>pages/*Page.java</strong> — PageFactory POM</div>
                    <div className="sg-file-item">🧪 <strong>tests/*Test.java</strong> — TestNG test classes</div>
                  </>
                )}
                {sgTool === 'selenium' && sgLang === 'python' && (
                  <>
                    <div className="sg-file-item">📄 <strong>requirements.txt</strong> — pip dependencies</div>
                    <div className="sg-file-item">⚙️ <strong>conftest.py</strong> — Pytest fixtures</div>
                    <div className="sg-file-item">📦 <strong>pages/*_page.py</strong> — Page Object classes</div>
                    <div className="sg-file-item">🧪 <strong>tests/test_*.py</strong> — Pytest test files</div>
                  </>
                )}
                {sgTool === 'cypress' && (
                  <>
                    <div className="sg-file-item">📄 <strong>package.json</strong></div>
                    <div className="sg-file-item">⚙️ <strong>cypress.config.js</strong></div>
                    <div className="sg-file-item">🧪 <strong>cypress/e2e/*.cy.js</strong> — Test specs</div>
                    <div className="sg-file-item">🔧 <strong>cypress/support/</strong> — Custom commands</div>
                  </>
                )}
                {sgTool === 'restassured' && (
                  <>
                    <div className="sg-file-item">📄 <strong>pom.xml</strong> — REST Assured + TestNG</div>
                    <div className="sg-file-item">🧪 <strong>tests/*Test.java</strong> — API test classes</div>
                    <div className="sg-file-item">📊 <strong>testng.xml</strong> — Suite runner</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ USER GUIDE PAGE ═════════════════════════════════════ */}
        {page === 'guide' && (
          <div className="guide-page">

            {/* Hero */}
            <div className="guide-hero">
              <div style={{fontSize:48}}>📖</div>
              <h2>User Guide & Documentation</h2>
              <p>Everything you need to know about QA AI Testing Tool</p>
            </div>

            {/* Quick Start */}
            <div className="guide-section">
              <h3 className="guide-section-title">🚀 Quick Start — 3 Steps</h3>
              <div className="guide-steps-row">
                <div className="guide-step-card">
                  <div className="guide-step-num">1</div>
                  <div className="guide-step-icon">📄</div>
                  <div className="guide-step-title">Upload Requirements</div>
                  <div className="guide-step-desc">Upload a PDF, TXT, or MD file describing your application's features and modules.</div>
                </div>
                <div className="guide-step-arrow">→</div>
                <div className="guide-step-card">
                  <div className="guide-step-num">2</div>
                  <div className="guide-step-icon">🌐</div>
                  <div className="guide-step-title">Enter App URL</div>
                  <div className="guide-step-desc">Enter http:// URL or local file path (e.g., C:/Users/.../index.html).</div>
                </div>
                <div className="guide-step-arrow">→</div>
                <div className="guide-step-card">
                  <div className="guide-step-num">3</div>
                  <div className="guide-step-icon">⚡</div>
                  <div className="guide-step-title">Click Execute</div>
                  <div className="guide-step-desc">AI generates tests, runs Playwright, delivers reports. That's it!</div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="guide-section">
              <h3 className="guide-section-title">✨ Feature Overview</h3>
              <div className="guide-feature-grid">
                {[
                  { icon:'📊', title:'Dashboard', desc:'KPIs, pass rate trends, recent runs, quick actions', page:'dashboard' },
                  { icon:'⚡', title:'Manual Test', desc:'Upload doc → configure → execute → download reports', page:'manual' },
                  { icon:'📧', title:'Email Monitor', desc:'Auto-trigger tests from Gmail deployment notifications', page:'monitor' },
                  { icon:'🤖', title:'AI Chatbot', desc:'Natural language assistant — "set firefox", "run smoke tests"' },
                  { icon:'🧠', title:'5 AI Agents', desc:'Requirement Analyst, Test Architect, QA Director, Exec Engineer, Report Analyst' },
                  { icon:'🌐', title:'Multi-Browser', desc:'Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari' },
                  { icon:'♿', title:'Accessibility', desc:'WCAG checks: alt text, labels, lang attr, heading structure' },
                  { icon:'📈', title:'Performance', desc:'TTFB, FCP, DOM Ready, Full Load time metrics' },
                  { icon:'📥', title:'Reports', desc:'Download HTML, Excel (.xlsx), and JSON reports' },
                  { icon:'🕒', title:'Run History', desc:'Trend charts and comparison table across runs' },
                  { icon:'🎯', title:'Test Scope', desc:'Smoke (fast) → Sanity → Regression → Full E2E (thorough)' },
                  { icon:'🔄', title:'Retries', desc:'Auto-retry failed tests 1-3 times for flaky test handling' },
                ].map(f => (
                  <div key={f.title} className="guide-feat-card" onClick={() => f.page && setPage(f.page)} style={f.page ? {cursor:'pointer'} : {}}>
                    <div className="guide-feat-icon">{f.icon}</div>
                    <div className="guide-feat-title">{f.title}</div>
                    <div className="guide-feat-desc">{f.desc}</div>
                    {f.page && <div className="guide-feat-link">Open →</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Agents */}
            <div className="guide-section">
              <h3 className="guide-section-title">🤖 Meet the 5 AI Agents (Requires API Key)</h3>
              <div className="guide-agent-grid">
                {[
                  { avatar:'📋', name:'Requirement Analyst', exp:'12 Years', role:'Analyzes requirements, detects domain (Banking/Insurance/Telecom), identifies ambiguities and risks, extracts testable features.', step:'Step 2/10' },
                  { avatar:'🧠', name:'Test Architect', exp:'15 Years', role:'Generates 25+ domain-specific test cases with edge cases a junior tester would miss. Knows IRDA, KYC, FIX protocol, billing engines.', step:'Step 3/10' },
                  { avatar:'👔', name:'QA Director (Supervisor)', exp:'20 Years', role:'Reviews test plan BEFORE execution (coverage gaps, risk flags). Reviews results AFTER (root cause, deployment sign-off YES/NO).', step:'Step 4 + 8/10' },
                  { avatar:'⚡', name:'Execution Engineer', exp:'10 Years', role:'Enhances Playwright scripts with smart selectors (getByRole, getByLabel), fallback chains, and resilient wait strategies.', step:'Step 5/10' },
                  { avatar:'📊', name:'Report Analyst', exp:'8 Years', role:'Writes executive summaries (GREEN/AMBER/RED), JIRA-ready bug reports with severity, steps, suggested fix, and next steps.', step:'Step 9/10' },
                ].map(a => (
                  <div key={a.name} className="guide-agent-card">
                    <div className="guide-agent-top">
                      <span className="guide-agent-av">{a.avatar}</span>
                      <div>
                        <div className="guide-agent-name">{a.name}</div>
                        <div className="guide-agent-exp">{a.exp} Experience · {a.step}</div>
                      </div>
                    </div>
                    <div className="guide-agent-role">{a.role}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Activate AI */}
            <div className="guide-section">
              <h3 className="guide-section-title">🔑 How to Activate AI Agents</h3>
              <div className="guide-steps-col">
                <div className="guide-howto-step"><span className="guide-howto-num">1</span> Go to <strong>console.anthropic.com</strong> and sign up / log in</div>
                <div className="guide-howto-step"><span className="guide-howto-num">2</span> Navigate to <strong>API Keys</strong> → Click <strong>Create Key</strong></div>
                <div className="guide-howto-step"><span className="guide-howto-num">3</span> Copy the key (starts with <code>sk-ant-...</code>)</div>
                <div className="guide-howto-step"><span className="guide-howto-num">4</span> In the app, go to <strong>Manual Test</strong> page → Paste key in the purple <strong>AI Config Bar</strong></div>
                <div className="guide-howto-step"><span className="guide-howto-num">5</span> Click <strong>Activate AI</strong> — green dot appears, 5 agents are ready!</div>
              </div>
              <div className="guide-note">
                <strong>No API key?</strong> The tool works in rule-based mode (free, offline, limited). AI is an optional upgrade (~$0.10-0.50/run).
              </div>
            </div>

            {/* Email Monitor Setup */}
            <div className="guide-section">
              <h3 className="guide-section-title">📧 Email Monitor Setup</h3>
              <div className="guide-steps-col">
                <div className="guide-howto-step"><span className="guide-howto-num">1</span> Enable <strong>2-Step Verification</strong> on your Google account</div>
                <div className="guide-howto-step"><span className="guide-howto-num">2</span> Generate an <strong>App Password</strong> at <code>myaccount.google.com/apppasswords</code></div>
                <div className="guide-howto-step"><span className="guide-howto-num">3</span> Go to <strong style={{cursor:'pointer',color:'#0097a7',textDecoration:'underline'}} onClick={() => setPage('monitor')}>Email Monitor</strong> page in the app</div>
                <div className="guide-howto-step"><span className="guide-howto-num">4</span> Enter Gmail address + App Password → Set trigger keyword → Click <strong>Start Monitoring</strong></div>
                <div className="guide-howto-step"><span className="guide-howto-num">5</span> Send test email with subject <strong>"deployment done"</strong> and app URL in body → Bot auto-runs tests and replies!</div>
              </div>
              <div className="guide-email-format">
                <div style={{fontWeight:700,color:'#93c5fd',marginBottom:8}}>📩 Trigger Email Format:</div>
                <div style={{fontFamily:'monospace',lineHeight:2,fontSize:13}}>
                  <div><strong>To:</strong> yourname@gmail.com</div>
                  <div><strong>Subject:</strong> deployment done - v2.0</div>
                  <div><strong>Body:</strong></div>
                  <div style={{paddingLeft:16}}>URL: http://your-app.com</div>
                  <div><strong>Attachment:</strong> requirements.txt (optional)</div>
                </div>
              </div>
            </div>

            {/* Chatbot Commands */}
            <div className="guide-section">
              <h3 className="guide-section-title">💬 Chatbot Commands</h3>
              <p style={{color:'#6b7280',fontSize:13,marginBottom:12}}>Click the 🤖 button in the bottom-right corner, then type:</p>
              <div className="guide-cmd-grid">
                {[
                  ['"go to dashboard"', 'Navigate to Dashboard'],
                  ['"set firefox browser"', 'Select Firefox'],
                  ['"set all browsers"', 'Chrome + Firefox + Safari'],
                  ['"set smoke tests"', 'Scope → Smoke (fastest)'],
                  ['"run full e2e"', 'Scope → Full E2E'],
                  ['"set staging environment"', 'Env → Staging'],
                  ['"enable accessibility"', 'Turn on A11Y scan'],
                  ['"enable performance"', 'Turn on Perf metrics'],
                  ['"set 5 workers"', 'Parallel workers → 5'],
                  ['"show status"', 'Current run status'],
                  ['"show history"', 'Open History tab'],
                  ['Paste a URL', 'Auto-sets app URL field'],
                  ['"reset"', 'Clear results, new run'],
                  ['"help"', 'Show all commands'],
                ].map(([cmd, desc]) => (
                  <div key={cmd} className="guide-cmd-row">
                    <code className="guide-cmd">{cmd}</code>
                    <span className="guide-cmd-desc">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline */}
            <div className="guide-section">
              <h3 className="guide-section-title">🔄 10-Step Pipeline (AI Mode)</h3>
              <div className="guide-pipeline">
                {[
                  { num:1, label:'Parse Document', actor:'SYSTEM', tag:'📄' },
                  { num:2, label:'Analyze Requirements', actor:'AGENT — Req Analyst (12 yrs)', tag:'📋' },
                  { num:3, label:'Generate Test Cases', actor:'AGENT — Test Architect (15 yrs)', tag:'🧠' },
                  { num:4, label:'Review Test Plan', actor:'AGENT — QA Director (20 yrs)', tag:'👔' },
                  { num:5, label:'Enhance Playwright Scripts', actor:'AGENT — Exec Engineer (10 yrs)', tag:'⚡' },
                  { num:6, label:'Execute in Real Browser', actor:'SYSTEM — Playwright', tag:'🎭' },
                  { num:7, label:'Merge Results', actor:'SYSTEM', tag:'📊' },
                  { num:8, label:'Review Results', actor:'AGENT — QA Director (20 yrs)', tag:'👔' },
                  { num:9, label:'Write Executive Report', actor:'AGENT — Report Analyst (8 yrs)', tag:'📊' },
                  { num:10, label:'Generate HTML + Excel', actor:'SYSTEM', tag:'📝' },
                ].map(s => (
                  <div key={s.num} className={`guide-pipe-step ${s.actor.startsWith('AGENT') ? 'pipe-agent' : 'pipe-sys'}`}>
                    <span className="guide-pipe-num">{s.num}</span>
                    <span className="guide-pipe-tag">{s.tag}</span>
                    <div>
                      <div className="guide-pipe-label">{s.label}</div>
                      <div className="guide-pipe-actor">{s.actor}</div>
                    </div>
                    <span className={`guide-pipe-badge ${s.actor.startsWith('AGENT') ? 'badge-agent' : 'badge-sys'}`}>
                      {s.actor.startsWith('AGENT') ? 'AI' : 'SYS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="guide-section">
              <h3 className="guide-section-title">🏦 Supported Domains</h3>
              <div className="guide-domain-grid">
                {[
                  { icon:'🏦', name:'Banking', items:'Core banking, Payments (SWIFT/NEFT/UPI), KYC/AML, Loans, Cards, Mobile banking' },
                  { icon:'🛡️', name:'Insurance', items:'Policy lifecycle, Claims (FNOL→payment), Underwriting, Premiums, IRDA compliance' },
                  { icon:'📈', name:'Investment Banking', items:'Trade management, FIX protocol, Settlement (T+1/T+2), Regulatory (MiFID II)' },
                  { icon:'📡', name:'Telecom', items:'Billing engines, CRM, Number portability, Provisioning, CDR validation' },
                  { icon:'🛒', name:'E-commerce', items:'Cart, Checkout, Payments, Search, User auth, Session management' },
                  { icon:'🌐', name:'Generic Web', items:'Login, Registration, Forms, Dashboard, Navigation, Profile' },
                ].map(d => (
                  <div key={d.name} className="guide-domain-card">
                    <div style={{fontSize:28,marginBottom:6}}>{d.icon}</div>
                    <div style={{fontWeight:700,fontSize:14,color:'#e2e8f0',marginBottom:4}}>{d.name}</div>
                    <div style={{fontSize:12,color:'#6b7280',lineHeight:1.6}}>{d.items}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="guide-section">
              <h3 className="guide-section-title">❓ FAQ</h3>
              <div className="guide-faq">
                {[
                  ['Do I need an API key?', 'No. The tool works in rule-based mode without any API key. AI agents are an optional upgrade.'],
                  ['How much does AI cost per run?', '$0.05-$0.50 depending on test count and document size.'],
                  ['What if an AI agent fails?', 'Each agent has automatic fallback. Pipeline continues with rule-based alternative.'],
                  ['Can I test local HTML files?', 'Yes! Enter the file path (e.g., C:/Users/.../index.html) and it auto-converts.'],
                  ['What browsers are supported?', 'Chrome, Firefox, Safari, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12).'],
                  ['Where are reports stored?', 'In qa-tool/backend/reports/{jobId}/ — HTML, Excel, and JSON files.'],
                  ['Can I run multiple browsers at once?', 'Yes! Select multiple in Advanced Config. Each test runs in every selected browser.'],
                ].map(([q, a]) => (
                  <details key={q} className="guide-faq-item">
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════ API TESTING PAGE ══════════════════════════════════════ */}
        {page === 'api' && (
          <AdvancedTestingPanel
            kind="api"
            accent="#06b6d4"
            accentGrad="linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
            heroIcon="🔌"
            title="API Testing"
            subtitle="Generate a complete, production-grade API test suite for any REST API. Pick your favorite tool."
            tools={[
              { id: 'postman',     icon: '📮', color: '#FF6C37', name: 'Postman / Newman',  desc: 'Collection + environment, runnable via Postman UI or Newman CLI',
                options: [
                  { key: 'collectionFormat', label: 'Collection Format',     type: 'select',  values: ['v2.1', 'v2.0'], default: 'v2.1' },
                  { key: 'includePreRequest', label: 'Pre-request Scripts',  type: 'boolean', default: true },
                  { key: 'includeTests',     label: 'Test Assertions',       type: 'boolean', default: true },
                  { key: 'includeEnv',       label: 'Include Environment',   type: 'boolean', default: true },
                  { key: 'htmlReport',       label: 'Newman HTMLExtra Report', type: 'boolean', default: true },
                ] },
              { id: 'playwright',  icon: '🎭', color: '#2EAD33', name: 'Playwright API',    desc: 'JS tests with built-in HTTP client, parallel exec, HTML reports',
                options: [
                  { key: 'workers',  label: 'Parallel Workers', type: 'number', default: 3, min: 1, max: 20 },
                  { key: 'retries',  label: 'Retry Count',       type: 'number', default: 1, min: 0, max: 5 },
                  { key: 'timeout',  label: 'Timeout (ms)',      type: 'number', default: 30000, min: 5000, step: 5000 },
                  { key: 'reporter', label: 'Reporter',          type: 'select', values: ['html', 'list', 'json', 'junit'], default: 'html' },
                  { key: 'typescript', label: 'Use TypeScript',  type: 'boolean', default: false },
                ] },
              { id: 'restassured', icon: '☕', color: '#E76F00', name: 'REST Assured',      desc: 'Java + Maven + TestNG. Industry standard for enterprise QA',
                options: [
                  { key: 'buildTool',      label: 'Build Tool',        type: 'select', values: ['Maven', 'Gradle'],     default: 'Maven' },
                  { key: 'testFramework',  label: 'Test Framework',    type: 'select', values: ['TestNG', 'JUnit 5'],   default: 'TestNG' },
                  { key: 'assertionLib',   label: 'Assertion Library', type: 'select', values: ['Hamcrest', 'AssertJ'], default: 'Hamcrest' },
                  { key: 'javaVersion',    label: 'Java Version',      type: 'select', values: ['11', '17', '21'],       default: '17' },
                  { key: 'parallel',       label: 'Parallel Execution',type: 'boolean', default: true },
                ] },
              { id: 'k6',          icon: '⚡', color: '#7D64FF', name: 'k6 (load + smoke)', desc: 'Go-based, scenarios and thresholds as code',
                options: [
                  { key: 'vus',         label: 'Virtual Users (VUs)',    type: 'number', default: 10,  min: 1, max: 10000 },
                  { key: 'duration',    label: 'Duration',               type: 'select', values: ['30s', '1m', '5m', '10m', '30m', '1h'], default: '1m' },
                  { key: 'thresholdP95', label: 'p95 Threshold (ms)',    type: 'number', default: 2000, min: 100, step: 100 },
                  { key: 'errorRate',   label: 'Max Error Rate (%)',     type: 'number', default: 1, min: 0, max: 100 },
                  { key: 'cloudExport', label: 'Export for k6 Cloud',    type: 'boolean', default: false },
                ] },
              { id: 'supertest',   icon: '🧪', color: '#68A063', name: 'Supertest (Node)',  desc: 'Mocha + Chai + Supertest. Lightweight Node suite',
                options: [
                  { key: 'runner',       label: 'Test Runner',       type: 'select', values: ['Mocha', 'Jest'],    default: 'Mocha' },
                  { key: 'assertion',    label: 'Assertion Library', type: 'select', values: ['Chai', 'Expect'],   default: 'Chai' },
                  { key: 'typescript',   label: 'Use TypeScript',    type: 'boolean', default: false },
                  { key: 'coverage',     label: 'Code Coverage (nyc)', type: 'boolean', default: true },
                ] },
            ]}
            toolOpts={advToolOpts}
            setToolOpts={setAdvToolOpts}
            selectedTool={apiTool} setSelectedTool={setApiTool}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🌐 Base URL</label>
                  <input className="field-input" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://api.example.com" />
                </div>
                <div className="field">
                  <label className="field-label">🔐 Auth Type</label>
                  <select className="field-input" value={apiAuth} onChange={e => setApiAuth(e.target.value)}>
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apiKey">API Key</option>
                  </select>
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('api');
              try {
                const res = await fetch(`${API}/api/generate-api-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ baseUrl: apiBaseUrl, tool: apiTool, authType: apiAuth, options: advToolOpts[apiTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data);
                toast('API test suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={!apiBaseUrl}
            loading={advLoading && advType === 'api'}
            result={advType === 'api' ? advResult : null}
            error={advType === 'api' ? advError : ''}
          />
        )}

        {/* ══════════════ SECURITY TESTING PAGE ═════════════════════════════════ */}
        {page === 'security' && (
          <AdvancedTestingPanel
            kind="security"
            accent="#ef4444"
            accentGrad="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
            heroIcon="🛡️"
            title="Security Testing"
            subtitle="Generate a production-grade security-testing project for any web app. OWASP Top 10 coverage included."
            tools={[
              { id: 'zap',        icon: '🎯', color: '#00549E', name: 'OWASP ZAP',        desc: 'Automated scanner (Docker). Baseline, full, or API-focused scans',
                options: [
                  { key: 'scanDepth',   label: 'Scan Depth',      type: 'select', values: ['baseline', 'full', 'active'], default: 'baseline' },
                  { key: 'maxDuration', label: 'Max Duration (min)', type: 'number', default: 10, min: 1, max: 120 },
                  { key: 'ajaxSpider',  label: 'Enable AJAX Spider', type: 'boolean', default: false },
                  { key: 'alertThreshold', label: 'Alert Threshold', type: 'select', values: ['Low', 'Medium', 'High'], default: 'Medium' },
                  { key: 'authMethod',  label: 'Authentication', type: 'select', values: ['None', 'Form-based', 'HTTP Auth', 'Script'], default: 'None' },
                ] },
              { id: 'nuclei',     icon: '☢️', color: '#8B5CF6', name: 'Nuclei',           desc: 'Template-based scanner. Fast, extensible with custom YAML',
                options: [
                  { key: 'severityLow',      label: 'Include Low',      type: 'boolean', default: true },
                  { key: 'severityMedium',   label: 'Include Medium',   type: 'boolean', default: true },
                  { key: 'severityHigh',     label: 'Include High',     type: 'boolean', default: true },
                  { key: 'severityCritical', label: 'Include Critical', type: 'boolean', default: true },
                  { key: 'rateLimit',        label: 'Rate Limit (req/s)', type: 'number', default: 150, min: 1, max: 1000 },
                  { key: 'templateTags',     label: 'Template Tags (comma-sep)', type: 'text', default: 'cve,oast,exposure,misconfig', placeholder: 'e.g. cve,xss,sqli' },
                ] },
              { id: 'playwright', icon: '🔐', color: '#2EAD33', name: 'Playwright Security', desc: 'Browser checks: headers, cookies, CSP, mixed content, XSS',
                options: [
                  { key: 'checkHeaders',     label: 'Security Headers',  type: 'boolean', default: true },
                  { key: 'checkCookies',     label: 'Cookie Flags',       type: 'boolean', default: true },
                  { key: 'checkCSP',         label: 'CSP Violations',     type: 'boolean', default: true },
                  { key: 'checkXSS',         label: 'XSS Baseline',       type: 'boolean', default: true },
                  { key: 'checkMixedContent', label: 'Mixed Content',     type: 'boolean', default: true },
                  { key: 'checkRelNoopener',  label: 'rel="noopener"',    type: 'boolean', default: true },
                ] },
              { id: 'checklist',  icon: '📋', color: '#F59E0B', name: 'OWASP Top 10 Checklist',   desc: 'Comprehensive manual test checklist for expert pentesters',
                options: [
                  { key: 'format',      label: 'Format',        type: 'select', values: ['Markdown', 'HTML', 'PDF'], default: 'Markdown' },
                  { key: 'depth',       label: 'Depth',         type: 'select', values: ['Standard', 'Enterprise', 'PCI-DSS', 'HIPAA'], default: 'Standard' },
                  { key: 'evidenceTmpl', label: 'Evidence Template', type: 'boolean', default: true },
                  { key: 'coverage',    label: 'OWASP Version', type: 'select', values: ['2021', '2017'], default: '2021' },
                ] },
            ]}
            toolOpts={advToolOpts}
            setToolOpts={setAdvToolOpts}
            selectedTool={secTool} setSelectedTool={setSecTool}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🌐 Target URL</label>
                  <input className="field-input" value={secTarget} onChange={e => setSecTarget(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="field">
                  <label className="field-label">🔍 Scan Depth (ZAP only)</label>
                  <select className="field-input" value={secDepth} onChange={e => setSecDepth(e.target.value)}>
                    <option value="baseline">Baseline (passive — safe for prod)</option>
                    <option value="full">Full (passive + active — staging only)</option>
                    <option value="active">Active API scan</option>
                  </select>
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('security');
              try {
                const res = await fetch(`${API}/api/generate-security-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUrl: secTarget, tool: secTool, scanDepth: secDepth, options: advToolOpts[secTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data);
                toast('Security test suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={!secTarget}
            loading={advLoading && advType === 'security'}
            result={advType === 'security' ? advResult : null}
            error={advType === 'security' ? advError : ''}
          />
        )}

        {/* ══════════════ PERFORMANCE TESTING PAGE ══════════════════════════════ */}
        {page === 'performance' && (
          <AdvancedTestingPanel
            kind="performance"
            accent="#f59e0b"
            accentGrad="linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)"
            heroIcon="⚡"
            title="Performance Testing"
            subtitle="Generate a complete load-testing suite. Smoke, load, stress, spike, or soak — your choice."
            tools={[
              { id: 'k6',        icon: '⚡', color: '#7D64FF', name: 'k6',        desc: 'JavaScript-defined load tests. Thresholds as code. Best DX',
                options: [
                  { key: 'vus',         label: 'Virtual Users (VUs)', type: 'number', default: 50, min: 1, max: 10000 },
                  { key: 'rampUp',      label: 'Ramp-up Duration',     type: 'select', values: ['10s', '30s', '1m', '2m', '5m'], default: '1m' },
                  { key: 'holdDuration', label: 'Hold Duration',        type: 'select', values: ['30s', '1m', '5m', '10m', '30m', '1h'], default: '5m' },
                  { key: 'thresholdP95', label: 'p95 Threshold (ms)',   type: 'number', default: 2000, min: 100, step: 100 },
                  { key: 'thresholdP99', label: 'p99 Threshold (ms)',   type: 'number', default: 5000, min: 100, step: 100 },
                  { key: 'errorRate',   label: 'Max Error Rate (%)',    type: 'number', default: 1, min: 0, max: 100 },
                ] },
              { id: 'jmeter',    icon: '📊', color: '#D22128', name: 'JMeter',    desc: 'Industry standard. JMX plan + HTML report via CLI',
                options: [
                  { key: 'threads',  label: 'Thread Count',      type: 'number', default: 50,  min: 1, max: 10000 },
                  { key: 'rampUp',   label: 'Ramp-up (seconds)', type: 'number', default: 60,  min: 1, max: 3600 },
                  { key: 'loops',    label: 'Loop Count (-1=infinite)', type: 'number', default: -1, min: -1 },
                  { key: 'duration', label: 'Duration (seconds)', type: 'number', default: 300, min: 10 },
                  { key: 'thinkTime', label: 'Think Time (ms)',  type: 'number', default: 1000, min: 0, step: 100 },
                  { key: 'htmlReport', label: 'HTML Report',     type: 'boolean', default: true },
                  { key: 'listenersEnabled', label: 'Listeners (debug only)', type: 'boolean', default: false },
                ] },
              { id: 'artillery', icon: '🏹', color: '#F25022', name: 'Artillery', desc: 'YAML-based scenarios. Great for quick API load tests',
                options: [
                  { key: 'arrivalRate', label: 'Arrival Rate (users/s)', type: 'number', default: 10,  min: 1, max: 1000 },
                  { key: 'duration',    label: 'Duration (seconds)',     type: 'number', default: 300, min: 10 },
                  { key: 'rampTo',      label: 'Ramp To (users/s)',      type: 'number', default: 50,  min: 1 },
                  { key: 'maxErrorRate', label: 'Max Error Rate (%)',    type: 'number', default: 1, min: 0, max: 100 },
                  { key: 'metricsPlugin', label: 'Metrics-by-Endpoint plugin', type: 'boolean', default: true },
                ] },
              { id: 'gatling',   icon: '🔫', color: '#FF6B00', name: 'Gatling',   desc: 'Scala-based. High performance, rich HTML reports',
                options: [
                  { key: 'usersPerSec', label: 'Users per second',   type: 'number', default: 10,  min: 1, max: 10000 },
                  { key: 'rampDuration', label: 'Ramp Duration',     type: 'select', values: ['10s', '30s', '1m', '2m'], default: '30s' },
                  { key: 'holdDuration', label: 'Hold Duration',     type: 'select', values: ['30s', '1m', '5m', '10m', '30m'], default: '5m' },
                  { key: 'responseTimeP95', label: 'p95 Assertion (ms)', type: 'number', default: 2000, min: 100 },
                  { key: 'failureRate', label: 'Max Failure Rate (%)', type: 'number', default: 1, min: 0 },
                ] },
            ]}
            toolOpts={advToolOpts}
            setToolOpts={setAdvToolOpts}
            selectedTool={perfTool} setSelectedTool={setPerfTool}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🌐 Target URL</label>
                  <input className="field-input" value={perfTarget} onChange={e => setPerfTarget(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="field">
                  <label className="field-label">🧪 Scenario</label>
                  <select className="field-input" value={perfScenario} onChange={e => setPerfScenario(e.target.value)}>
                    <option value="smoke">Smoke — 1 VU / 1 min (sanity check)</option>
                    <option value="load">Load — 50 VUs / 5 min (nominal capacity)</option>
                    <option value="stress">Stress — 200 VUs / 10 min (find breaking point)</option>
                    <option value="spike">Spike — 500 VUs / 3 min (flash surge)</option>
                    <option value="soak">Soak — 30 VUs / 1 hour (memory leaks)</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">👥 Custom VU count (optional)</label>
                  <input className="field-input" type="number" min="1" value={perfUsers} onChange={e => setPerfUsers(e.target.value)} placeholder="Leave blank for scenario default" />
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('performance');
              try {
                const body = { targetUrl: perfTarget, tool: perfTool, scenario: perfScenario, options: advToolOpts[perfTool] || {} };
                if (perfUsers) body.users = parseInt(perfUsers);
                const res = await fetch(`${API}/api/generate-performance-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data);
                toast('Performance test suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={!perfTarget}
            loading={advLoading && advType === 'performance'}
            result={advType === 'performance' ? advResult : null}
            error={advType === 'performance' ? advError : ''}
          />
        )}

        {/* ══════════════ ACCESSIBILITY TESTING PAGE ════════════════════════════ */}
        {page === 'a11y' && (
          <AdvancedTestingPanel
            kind="a11y"
            accent="#10b981"
            accentGrad="linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
            heroIcon="♿"
            title="Accessibility Testing"
            subtitle="Generate an axe-core-powered WCAG 2.1 compliance suite. Legal requirement in many regions."
            tools={[
              { id: 'playwright-axe', icon: '🎭', color: '#2EAD33', name: 'Playwright + axe-core', desc: 'Most popular. Browser-based a11y scan with detailed violation reports',
                options: [
                  { key: 'pages',    label: 'Pages (comma-sep)', type: 'text',   default: '/,/about,/contact' },
                  { key: 'standard', label: 'Standard',          type: 'select', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'], default: 'wcag21aa' },
                ] },
              { id: 'axe-cli',        icon: '🛠️', color: '#0891B2', name: 'axe-cli',             desc: 'Standalone CLI scanner. Simplest — just scans a URL' },
              { id: 'lighthouse-ci',  icon: '🏠', color: '#F44B21', name: 'Lighthouse CI',        desc: 'A11y + Performance + SEO combined. Great for CI gates' },
              { id: 'pa11y',          icon: '📐', color: '#7C3AED', name: 'Pa11y',                desc: 'Command-line a11y tester with axe runner' },
            ]}
            selectedTool={a11yTool} setSelectedTool={setA11yTool}
            toolOpts={advToolOpts} setToolOpts={setAdvToolOpts}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🌐 Target URL</label>
                  <input className="field-input" value={a11yTarget} onChange={e => setA11yTarget(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="field">
                  <label className="field-label">📏 WCAG Standard</label>
                  <select className="field-input" value={a11yStandard} onChange={e => setA11yStandard(e.target.value)}>
                    <option value="wcag2a">WCAG 2.0 A</option>
                    <option value="wcag2aa">WCAG 2.0 AA</option>
                    <option value="wcag21aa">WCAG 2.1 AA (recommended)</option>
                    <option value="section508">Section 508 (US gov)</option>
                  </select>
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('a11y');
              try {
                const res = await fetch(`${API}/api/generate-accessibility-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUrl: a11yTarget, tool: a11yTool, standard: a11yStandard, options: advToolOpts[a11yTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data); toast('Accessibility suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={!a11yTarget}
            loading={advLoading && advType === 'a11y'}
            result={advType === 'a11y' ? advResult : null}
            error={advType === 'a11y' ? advError : ''}
          />
        )}

        {/* ══════════════ VISUAL REGRESSION PAGE ══════════════════════════════════ */}
        {page === 'visual' && (
          <AdvancedTestingPanel
            kind="visual"
            accent="#8b5cf6"
            accentGrad="linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
            heroIcon="👁️"
            title="Visual Regression Testing"
            subtitle="Catch unintended UI changes with pixel-perfect screenshot diffing."
            tools={[
              { id: 'playwright', icon: '🎭', color: '#2EAD33', name: 'Playwright (toHaveScreenshot)', desc: 'Built-in. Multi-viewport. No external service required',
                options: [
                  { key: 'pages',     label: 'Pages (comma-sep)',    type: 'text',   default: '/,/about,/contact' },
                  { key: 'viewports', label: 'Viewports (comma-sep)', type: 'text',   default: 'desktop,tablet,mobile' },
                  { key: 'threshold', label: 'Diff Threshold',        type: 'number', default: 0.2, min: 0, max: 1, step: 0.05 },
                ] },
              { id: 'backstop',   icon: '📸', color: '#1E2A3C', name: 'BackstopJS', desc: 'Puppeteer-based. HTML side-by-side diff report' },
              { id: 'percy',      icon: '👀', color: '#8F4DC9', name: 'Percy (BrowserStack)', desc: 'Hosted visual testing with PR review workflow' },
            ]}
            selectedTool={visualTool} setSelectedTool={setVisualTool}
            toolOpts={advToolOpts} setToolOpts={setAdvToolOpts}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🌐 Target URL</label>
                  <input className="field-input" value={visualTarget} onChange={e => setVisualTarget(e.target.value)} placeholder="https://example.com" />
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('visual');
              try {
                const res = await fetch(`${API}/api/generate-visual-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUrl: visualTarget, tool: visualTool, options: advToolOpts[visualTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data); toast('Visual regression suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={!visualTarget}
            loading={advLoading && advType === 'visual'}
            result={advType === 'visual' ? advResult : null}
            error={advType === 'visual' ? advError : ''}
          />
        )}

        {/* ══════════════ MOBILE TESTING PAGE ═════════════════════════════════════ */}
        {page === 'mobile' && (
          <AdvancedTestingPanel
            kind="mobile"
            accent="#3b82f6"
            accentGrad="linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)"
            heroIcon="📱"
            title="Mobile Testing"
            subtitle="Generate Appium/WebdriverIO/Detox/Maestro suite for Android or iOS apps."
            tools={[
              { id: 'appium-webdriverio', icon: '🎯', color: '#EA2328', name: 'Appium + WebdriverIO (JS)', desc: 'Most popular combo. Node.js + Appium. Works on real devices and emulators' },
              { id: 'appium-java',        icon: '☕', color: '#E76F00', name: 'Appium + Java + TestNG',    desc: 'Enterprise choice. Strong typing, Maven integration' },
              { id: 'detox',              icon: '⚛️', color: '#61DAFB', name: 'Detox (React Native)',       desc: 'Gray-box testing — fastest option for RN apps' },
              { id: 'maestro',            icon: '🎼', color: '#7C3AED', name: 'Maestro',                   desc: 'YAML-based. Simplest syntax. Great for smoke tests' },
            ]}
            selectedTool={mobileTool} setSelectedTool={setMobileTool}
            toolOpts={advToolOpts} setToolOpts={setAdvToolOpts}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">📱 Platform</label>
                  <select className="field-input" value={mobilePlatform} onChange={e => setMobilePlatform(e.target.value)}>
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">📦 App Package / Bundle ID</label>
                  <input className="field-input" value={mobilePkg} onChange={e => setMobilePkg(e.target.value)} placeholder="com.example.app" />
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('mobile');
              try {
                const res = await fetch(`${API}/api/generate-mobile-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appPackage: mobilePkg, platform: mobilePlatform, tool: mobileTool, options: advToolOpts[mobileTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data); toast('Mobile test suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={false}
            loading={advLoading && advType === 'mobile'}
            result={advType === 'mobile' ? advResult : null}
            error={advType === 'mobile' ? advError : ''}
          />
        )}

        {/* ══════════════ DATABASE TESTING PAGE ═══════════════════════════════════ */}
        {page === 'database' && (
          <AdvancedTestingPanel
            kind="database"
            accent="#0891b2"
            accentGrad="linear-gradient(135deg, #0891b2 0%, #1e40af 100%)"
            heroIcon="🗃️"
            title="Database &amp; ETL Testing"
            subtitle="Data integrity, referential integrity, ETL source-vs-target reconciliation."
            tools={[
              { id: 'sql-assertion-js',  icon: '📊', color: '#68A063', name: 'SQL Assertions (Node)', desc: 'Mocha + pg/mysql2/mssql/sqlite3. Lightweight, fast' },
              { id: 'dbt-test',          icon: '🔧', color: '#FF6B35', name: 'dbt Tests',              desc: 'Declarative YAML-based tests. Best for data warehouses' },
              { id: 'great-expectations', icon: '🎓', color: '#FF6D00', name: 'Great Expectations',     desc: 'Python framework. Rich data quality assertions' },
            ]}
            selectedTool={dbTool} setSelectedTool={setDbTool}
            toolOpts={advToolOpts} setToolOpts={setAdvToolOpts}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🗄️ Database Type</label>
                  <select className="field-input" value={dbType} onChange={e => setDbType(e.target.value)}>
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL / MariaDB</option>
                    <option value="mssql">Microsoft SQL Server</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('database');
              try {
                const res = await fetch(`${API}/api/generate-database-tests`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dbType, tool: dbTool, options: advToolOpts[dbTool] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data); toast('Database test suite generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={false}
            loading={advLoading && advType === 'database'}
            result={advType === 'database' ? advResult : null}
            error={advType === 'database' ? advError : ''}
          />
        )}

        {/* ══════════════ CI/CD PIPELINE PAGE ═════════════════════════════════════ */}
        {page === 'cicd' && (
          <AdvancedTestingPanel
            kind="cicd"
            accent="#f59e0b"
            accentGrad="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
            heroIcon="🚀"
            title="CI/CD Pipeline Generator"
            subtitle="Generate ready-to-drop pipeline definitions. Automated test runs on every push, PR, or nightly."
            tools={[
              { id: 'github',   icon: '🐙', color: '#24292e', name: 'GitHub Actions',  desc: 'YAML workflow with scheduled runs, artifacts, Slack notifications' },
              { id: 'gitlab',   icon: '🦊', color: '#FC6D26', name: 'GitLab CI',        desc: '.gitlab-ci.yml with stages, artifacts, JUnit reports' },
              { id: 'jenkins',  icon: '👔', color: '#D33833', name: 'Jenkins',           desc: 'Jenkinsfile with pipeline stages, HTML reports, Slack' },
              { id: 'azure',    icon: '☁️', color: '#0078D4', name: 'Azure DevOps',      desc: 'azure-pipelines.yml with test publish + artifact upload' },
              { id: 'circleci', icon: '⭕', color: '#343434', name: 'CircleCI',          desc: 'config.yml with scheduled workflows + artifact storage' },
            ]}
            selectedTool={cicdPlatform} setSelectedTool={setCicdPlatform}
            toolOpts={advToolOpts} setToolOpts={setAdvToolOpts}
            extraConfig={
              <div className="exp-context-grid">
                <div className="field">
                  <label className="field-label">🛠️ Test Stack</label>
                  <select className="field-input" value={cicdStack} onChange={e => setCicdStack(e.target.value)}>
                    <option value="playwright">Playwright (JS/TS)</option>
                    <option value="jest">Jest / Mocha (Node)</option>
                    <option value="maven">Maven (Java)</option>
                    <option value="pytest">pytest (Python)</option>
                    <option value="k6">k6 (Performance)</option>
                    <option value="jmeter">JMeter (Performance)</option>
                  </select>
                </div>
              </div>
            }
            onGenerate={async () => {
              setAdvLoading(true); setAdvError(''); setAdvResult(null); setAdvType('cicd');
              try {
                const res = await fetch(`${API}/api/generate-cicd-pipeline`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ platform: cicdPlatform, testStack: cicdStack, options: advToolOpts[cicdPlatform] || {} }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Generation failed');
                setAdvResult(data); toast('CI/CD pipeline generated!', 'success');
              } catch (e) { setAdvError(e.message); toast(e.message, 'error'); }
              finally { setAdvLoading(false); }
            }}
            disabled={false}
            loading={advLoading && advType === 'cicd'}
            result={advType === 'cicd' ? advResult : null}
            error={advType === 'cicd' ? advError : ''}
          />
        )}

        {/* ══════════════ EXPLORATORY TESTING PAGE ══════════════════════════════ */}
        {page === 'exploratory' && (
          <div className="exploratory-page">

            {/* ── Input Panel (idle state) ──────────────────────────────────── */}
            {expStatus === 'idle' && (
              <div className="panel input-panel">
                <div className="panel-header">
                  <h2>🔍 Exploratory Testing — AI-Powered</h2>
                  <p>Upload screenshots or video recordings of your application screens. The AI will analyze them and generate comprehensive E2E test cases for exploratory testing.</p>
                </div>

                {/* File upload zone */}
                <div
                  className={`exp-upload-zone ${expDragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setExpDragOver(true); }}
                  onDragLeave={() => setExpDragOver(false)}
                  onDrop={e => { e.preventDefault(); setExpDragOver(false); handleExpFilesChange(e.dataTransfer.files); }}
                  onClick={() => expFileRef.current?.click()}
                >
                  <input
                    ref={expFileRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={e => { handleExpFilesChange(e.target.files); e.target.value = ''; }}
                  />
                  <div className="exp-upload-icon">🖼️</div>
                  <div className="exp-upload-text">
                    <strong>Drag & Drop</strong> screenshots or video recordings here
                  </div>
                  <div className="exp-upload-hint">
                    Supports: Images (PNG, JPG, GIF, WebP, BMP) and Videos (MP4, WebM, MOV, AVI, MKV) — Max 200MB per file, up to 20 files
                  </div>
                </div>

                {/* Preview thumbnails */}
                {expPreviews.length > 0 && (
                  <div className="exp-previews">
                    <div className="exp-previews-header">
                      <span>📎 {expPreviews.length} file(s) selected</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setExpFiles([]); setExpPreviews([]); }}>Clear All</button>
                    </div>
                    <div className="exp-previews-grid">
                      {expPreviews.map((p, idx) => (
                        <div key={idx} className="exp-preview-card">
                          {p.url ? (
                            <img src={p.url} alt={p.name} className="exp-preview-img" />
                          ) : (
                            <div className="exp-preview-video">🎥</div>
                          )}
                          <div className="exp-preview-name" title={p.name}>{p.name}</div>
                          <button className="exp-preview-remove" onClick={(e) => { e.stopPropagation(); handleExpRemoveFile(idx); }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context fields */}
                <div className="exp-context-section">
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 15, color: 'var(--text-primary)' }}>Optional Context (helps AI generate better test cases)</h3>
                  <div className="exp-context-grid">
                    <div className="field">
                      <label className="field-label">🌐 Application URL</label>
                      <input className="field-input" type="text" placeholder="https://myapp.com" value={expAppUrl} onChange={e => setExpAppUrl(e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">📛 Application Name</label>
                      <input className="field-input" type="text" placeholder="InsureAI, BankApp, etc." value={expAppName} onChange={e => setExpAppName(e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">📦 Module / Feature</label>
                      <input className="field-input" type="text" placeholder="Login, Dashboard, Checkout, etc." value={expModule} onChange={e => setExpModule(e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">🏷️ Domain</label>
                      <select className="field-input" value={expDomain} onChange={e => setExpDomain(e.target.value)}>
                        <option value="">Auto-detect</option>
                        <option value="Banking">Banking</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Investment Banking">Investment Banking</option>
                        <option value="Telecom">Telecom</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Generic">Generic Web App</option>
                      </select>
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <label className="field-label">📝 Additional Notes</label>
                    <textarea
                      className="field-input"
                      rows={3}
                      placeholder="Any specific areas to focus on, known issues, user flows to test..."
                      value={expNotes}
                      onChange={e => setExpNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Analyze button */}
                <button
                  className="btn btn-primary btn-lg"
                  style={{ marginTop: 16, width: '100%' }}
                  disabled={expFiles.length === 0}
                  onClick={handleExpAnalyze}
                >
                  {aiConfigured
                    ? `🧠 Analyze ${expFiles.length} File(s) & Generate Test Cases (AI)`
                    : `📋 Generate Test Cases from ${expFiles.length} File(s) (Template Mode)`}
                </button>
                {!aiConfigured && expFiles.length > 0 && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(59,130,246,.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    💡 <strong>Template mode active</strong> — You'll get a comprehensive baseline test plan with 15+ test cases covering positive, negative, security, accessibility, and performance scenarios.
                    For <strong>screen-specific AI-powered analysis</strong> (reads your actual screenshots and generates tailored test cases), configure your Claude API key in the AI Settings.
                  </div>
                )}
              </div>
            )}

            {/* ── Processing state ───────────────────────────────────────────── */}
            {expStatus === 'processing' && (
              <div className="panel">
                <div className="panel-header">
                  <h2>🧠 AI Analyzing Your Screens...</h2>
                  <p>The AI is examining every UI element, interaction pattern, and potential test scenario.</p>
                </div>
                <div className="log-box" style={{ maxHeight: 400 }}>
                  {expLogs.map((l, i) => <div key={i} className="log-line">{l}</div>)}
                  <div className="log-line blink">⏳ Processing...</div>
                </div>
              </div>
            )}

            {/* ── Error state ────────────────────────────────────────────────── */}
            {expStatus === 'error' && (
              <div className="panel">
                <div className="panel-header">
                  <h2>❌ Analysis Failed</h2>
                  <p style={{ color: '#ef4444' }}>{expError}</p>
                </div>
                {expLogs.length > 0 && (
                  <div className="log-box" style={{ maxHeight: 300 }}>
                    {expLogs.map((l, i) => <div key={i} className="log-line">{l}</div>)}
                  </div>
                )}
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleExpReset}>↺ Try Again</button>
              </div>
            )}

            {/* ── Results state ──────────────────────────────────────────────── */}
            {expStatus === 'done' && expResults && (
              <div className="exp-results">
                {/* Summary banner */}
                <div className="exp-summary-banner">
                  <div className="exp-summary-stats">
                    <CountUpCard label="Test Cases" value={expResults.testCases?.length || 0} color="#0097a7" />
                    <CountUpCard label="Charters" value={expResults.exploratoryCharters?.length || 0} color="#7c3aed" />
                    <CountUpCard label="Risk Areas" value={expResults.riskAreas?.length || 0} color="#ef4444" />
                    <CountUpCard label="Critical Tests" value={expResults.summary?.criticalTests || expResults.testCases?.filter(t => t.priority === 'Critical').length || 0} color="#f97316" />
                  </div>
                  <div className="exp-summary-meta">
                    <span>🏷️ {expResults.screenAnalysis?.pageType || 'Unknown'}</span>
                    <span>🌐 {expResults.screenAnalysis?.domain || 'Generic'}</span>
                    <span>⏱️ {expResults.summary?.estimatedExplorationTime || 'N/A'}</span>
                    <span>⚠️ Risk: {expResults.summary?.overallRiskLevel || 'N/A'}</span>
                  </div>
                  {expResults.screenAnalysis?.description && (
                    <div className="exp-summary-desc">{expResults.screenAnalysis.description}</div>
                  )}
                  <div className="exp-summary-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleExpExportCSV}>📥 Export CSV</button>
                    <button className="btn btn-secondary btn-sm" onClick={handleExpExport}>📥 Export JSON</button>
                    <button className="btn btn-ghost btn-sm" onClick={handleExpReset}>↺ New Analysis</button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                  {[
                    { id: 'testcases', label: `📋 Test Cases (${expResults.testCases?.length || 0})` },
                    { id: 'charters', label: `🧭 Charters (${expResults.exploratoryCharters?.length || 0})` },
                    { id: 'risks', label: `⚠️ Risks (${expResults.riskAreas?.length || 0})` },
                    { id: 'ui-elements', label: `🔲 UI Elements (${expResults.screenAnalysis?.uiElements?.length || 0})` },
                    { id: 'exp-logs', label: '📜 Logs' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`tab ${expActiveTab === tab.id ? 'tab-active' : ''}`}
                      onClick={() => setExpActiveTab(tab.id)}
                    >{tab.label}</button>
                  ))}
                </div>

                {/* Test Cases tab */}
                {expActiveTab === 'testcases' && (
                  <div className="panel" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    {/* Filters */}
                    <div className="exp-filters">
                      <select className="field-input field-sm" value={expFilterCat} onChange={e => setExpFilterCat(e.target.value)}>
                        <option value="All">All Categories</option>
                        {[...new Set((expResults.testCases || []).map(tc => tc.category))].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select className="field-input field-sm" value={expFilterPri} onChange={e => setExpFilterPri(e.target.value)}>
                        <option value="All">All Priorities</option>
                        {['Critical', 'High', 'Medium', 'Low'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <span className="exp-filter-count">
                        {(expResults.testCases || []).filter(tc =>
                          (expFilterCat === 'All' || tc.category === expFilterCat) &&
                          (expFilterPri === 'All' || tc.priority === expFilterPri)
                        ).length} test case(s)
                      </span>
                    </div>

                    <div className="exp-tc-list">
                      {(expResults.testCases || [])
                        .filter(tc =>
                          (expFilterCat === 'All' || tc.category === expFilterCat) &&
                          (expFilterPri === 'All' || tc.priority === expFilterPri)
                        )
                        .map((tc, idx) => (
                          <div key={tc.id || idx} className="exp-tc-card">
                            <div className="exp-tc-header">
                              <span className="exp-tc-id">{tc.id}</span>
                              <span className={`exp-tc-priority priority-${(tc.priority || '').toLowerCase()}`}>{tc.priority}</span>
                              <span className="exp-tc-category">{tc.category}</span>
                            </div>
                            <div className="exp-tc-title">{tc.title}</div>
                            {tc.preconditions && <div className="exp-tc-pre"><strong>Preconditions:</strong> {tc.preconditions}</div>}
                            <div className="exp-tc-steps">
                              <strong>Steps:</strong>
                              <ol>
                                {(tc.steps || []).map((s, si) => <li key={si}>{s.replace(/^Step \d+:\s*/i, '')}</li>)}
                              </ol>
                            </div>
                            <div className="exp-tc-expected"><strong>Expected:</strong> {tc.expectedResult}</div>
                            {tc.testData && <div className="exp-tc-data"><strong>Test Data:</strong> {tc.testData}</div>}
                            {tc.notes && <div className="exp-tc-notes"><strong>Notes:</strong> {tc.notes}</div>}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Charters tab */}
                {expActiveTab === 'charters' && (
                  <div className="panel" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <div className="exp-charter-list">
                      {(expResults.exploratoryCharters || []).map((ch, idx) => (
                        <div key={ch.id || idx} className="exp-charter-card">
                          <div className="exp-charter-header">
                            <span className="exp-charter-id">{ch.id}</span>
                            <span className="exp-charter-time">⏱️ {ch.timeBox}</span>
                          </div>
                          <div className="exp-charter-mission"><strong>Mission:</strong> {ch.mission}</div>
                          <div className="exp-charter-focus"><strong>Focus:</strong> {ch.focus}</div>
                          <div className="exp-charter-risks"><strong>Risks:</strong> {ch.risks}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks tab */}
                {expActiveTab === 'risks' && (
                  <div className="panel" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <div className="exp-risk-list">
                      {(expResults.riskAreas || []).map((r, idx) => (
                        <div key={idx} className={`exp-risk-card risk-${(r.severity || '').toLowerCase()}`}>
                          <div className="exp-risk-header">
                            <span className={`exp-risk-severity severity-${(r.severity || '').toLowerCase()}`}>{r.severity}</span>
                            <span className="exp-risk-area">{r.area}</span>
                          </div>
                          <div className="exp-risk-desc">{r.risk}</div>
                          <div className="exp-risk-suggestion"><strong>How to test:</strong> {r.suggestion}</div>
                        </div>
                      ))}
                    </div>
                    {expResults.accessibilityNotes?.length > 0 && (
                      <div style={{ marginTop: 20 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 8 }}>♿ Accessibility Notes</h3>
                        <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                          {expResults.accessibilityNotes.map((n, i) => <li key={i}>{n}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* UI Elements tab */}
                {expActiveTab === 'ui-elements' && (
                  <div className="panel" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <div className="exp-ui-list">
                      <table className="exp-ui-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Label</th>
                            <th>Purpose</th>
                            <th>Test Relevance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(expResults.screenAnalysis?.uiElements || []).map((el, idx) => (
                            <tr key={idx}>
                              <td><span className="exp-ui-type">{el.type}</span></td>
                              <td>{el.label}</td>
                              <td>{el.purpose}</td>
                              <td><span className={`exp-ui-relevance rel-${(el.testRelevance || '').toLowerCase()}`}>{el.testRelevance}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Logs tab */}
                {expActiveTab === 'exp-logs' && (
                  <div className="panel" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <div className="log-box" style={{ maxHeight: 500 }}>
                      {expLogs.map((l, i) => <div key={i} className="log-line">{l}</div>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ DASHBOARD PAGE ════════════════════════════════════════ */}
        {page === 'settings' && (
          <SettingsPage
            authUser={authUser}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(d => !d)}
            onLogout={onLogout}
            toast={toast}
            addNotification={addNotification}
          />
        )}

        {page === 'admin-users'    && authUser?.role === 'admin' && <AdminUsersPage    currentUser={authUser} toast={toast} />}
        {page === 'admin-activity' && authUser?.role === 'admin' && <AdminActivityPage />}
        {page === 'admin-system'   && authUser?.role === 'admin' && <AdminSystemPage   />}

        {['admin-users', 'admin-activity', 'admin-system'].includes(page) && authUser?.role !== 'admin' && (
          <div className="panel">
            <EmptyState icon={Icons.Shield} title="Admin access required" description="You need an admin role to view this page. Contact your administrator to request access." />
          </div>
        )}

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

            {/* ── Input source selector — 3-way ────────────────────────────── */}
            <div className="field">
              <label className="field-label">
                📥 Test Input Source
                <span className="field-hint"> — Choose how you want to define your tests</span>
              </label>
              <div className="input-mode-grid">
                <label className={`input-mode-card ${inputMode === 'requirement' ? 'selected' : ''}`}>
                  <input type="radio" name="inputMode" checked={inputMode === 'requirement'}
                    onChange={() => { setInputMode('requirement'); setGenericMode(false); }} />
                  <div className="input-mode-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>📄</div>
                  <div className="input-mode-meta">
                    <div className="input-mode-title">Requirement Document</div>
                    <div className="input-mode-desc">Upload a PDF/TXT/MD requirement; AI generates test cases</div>
                  </div>
                </label>

                <label className={`input-mode-card ${inputMode === 'testcase' ? 'selected' : ''}`}>
                  <input type="radio" name="inputMode" checked={inputMode === 'testcase'}
                    onChange={() => { setInputMode('testcase'); setGenericMode(false); }} />
                  <div className="input-mode-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>📋</div>
                  <div className="input-mode-meta">
                    <div className="input-mode-title">Test Case Sheet</div>
                    <div className="input-mode-desc">Upload CSV/XLSX with pre-written test cases — no AI needed</div>
                  </div>
                </label>

                <label className={`input-mode-card ${inputMode === 'generic' ? 'selected' : ''}`}>
                  <input type="radio" name="inputMode" checked={inputMode === 'generic'}
                    onChange={() => { setInputMode('generic'); setGenericMode(true); }} />
                  <div className="input-mode-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>🧪</div>
                  <div className="input-mode-meta">
                    <div className="input-mode-title">Generic Test Mode</div>
                    <div className="input-mode-desc">No file — runs all 17 built-in test modules (smoke to security)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Requirement Document uploader ───────────────────────────── */}
            {inputMode === 'requirement' && (
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
            )}

            {/* ── Test Case Sheet uploader ────────────────────────────────── */}
            {inputMode === 'testcase' && (
              <div className="field">
                <label className="field-label">
                  📋 Test Case Sheet
                  <span className="field-hint"> — CSV or XLSX (up to 10 MB). <a href={`${API}/api/testcase-template?format=csv`} download style={{ color: '#0891b2', textDecoration: 'underline' }}>Download CSV template</a> · <a href={`${API}/api/testcase-template?format=xlsx`} download style={{ color: '#0891b2', textDecoration: 'underline' }}>Download XLSX template</a></span>
                </label>
                <div
                  className={`drop-zone ${testcaseFile ? 'has-file' : ''}`}
                  onClick={() => testcaseFileRef.current?.click()}
                >
                  {testcaseFile ? (
                    <div className="file-info">
                      <span className="file-icon">📊</span>
                      <div>
                        <div className="file-name">{testcaseFile.name}</div>
                        <div className="file-size">{(testcaseFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button className="file-remove" onClick={e => { e.stopPropagation(); setTestcaseFile(null); }}>✕</button>
                    </div>
                  ) : (
                    <div className="drop-prompt">
                      <div className="drop-icon">📊</div>
                      <div className="drop-text">Drop sheet here or <span className="drop-link">browse</span></div>
                      <div className="drop-sub">CSV, XLSX, XLS — max 10 MB</div>
                    </div>
                  )}
                </div>
                <input
                  ref={testcaseFileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) setTestcaseFile(e.target.files[0]); }}
                />
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  💡 <strong>Expected columns (flexible names):</strong> ID, Module, Title, Type, Priority, Preconditions, Steps, Expected Result, Test Data. Steps may be separated by pipes (<code>|</code>), numbers (<code>1. ... 2. ...</code>), or newlines.
                </div>
              </div>
            )}

            {/* ── Generic mode info ──────────────────────────────────────── */}
            {inputMode === 'generic' && (
              <div className="generic-info">
                <div className="generic-info-title">🧪 Generic Test Mode Active</div>
                <div className="generic-info-desc">
                  All 17 test modules will run: Authentication, Registration, Payment, Forms, Search, Logout, Password, Dashboard, Navigation, Profile + Security (OWASP), API, Accessibility, Performance, Responsive, Boundary, Concurrency
                </div>
                <div className="generic-info-modules">
                  {['🔐 Login','📝 Register','💳 Payment','📋 Forms','🔍 Search','🚪 Logout','🔑 Password','📊 Dashboard','🧭 Navigation','👤 Profile','🛡️ Security','🔌 API','♿ A11y','⚡ Perf','📱 Responsive','📏 Boundary','🔀 Concurrency'].map(m => (
                    <span key={m} className="generic-module-chip">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── JIRA Integration ────────────────────────────────────── */}
            <div className="jira-config-bar">
              <div className="jira-config-left">
                <span className={`ai-dot ${jiraConfigured ? 'ai-dot-on' : ''}`} style={jiraConfigured ? {background:'#3b82f6',boxShadow:'0 0 8px rgba(59,130,246,.6)'} : {}} />
                <span className="ai-config-label">{jiraConfigured ? '🔗 JIRA Connected' : '🔗 JIRA Not Connected'}</span>
                {jiraConfigured && <span className="ai-config-hint">{jiraProject} — Auto-logs bugs on failure</span>}
              </div>
              {!jiraConfigured ? (
                <div className="jira-fields">
                  <input className="field-input" placeholder="https://your-org.atlassian.net" value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} style={{fontSize:11,padding:'6px 8px',minWidth:180}} />
                  <input className="field-input" placeholder="email@company.com" value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} style={{fontSize:11,padding:'6px 8px',minWidth:140}} />
                  <input className="field-input" type="password" placeholder="API Token" value={jiraToken} onChange={e => setJiraToken(e.target.value)} style={{fontSize:11,padding:'6px 8px',minWidth:100}} />
                  <input className="field-input" placeholder="Project Key" value={jiraProject} onChange={e => setJiraProject(e.target.value)} style={{fontSize:11,padding:'6px 8px',width:80}} />
                  <button className="btn" style={{padding:'6px 12px',fontSize:11,background:'#3b82f6',color:'#fff',borderRadius:8}} onClick={handleJiraSave} disabled={jiraLoading}>
                    {jiraLoading ? '...' : 'Connect'}
                  </button>
                </div>
              ) : (
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:11}} onClick={handleJiraTest} disabled={jiraLoading}>Test</button>
                  <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:11}} onClick={handleJiraClear}>Disconnect</button>
                </div>
              )}
            </div>

            {/* ── AI Agent Configuration ──────────────────────────────── */}
            <div className="ai-config-bar">
              <div className="ai-config-left">
                <span className={`ai-dot ${aiConfigured ? 'ai-dot-on' : ''}`} />
                <span className="ai-config-label">
                  {aiConfigured ? '🤖 AI Agents Active' : '⚙️ Rule-Based Mode'}
                </span>
                {aiConfigured && <span className="ai-config-hint">5 agents: Req Analyst · Test Architect · Exec Engineer · Report Analyst · QA Director</span>}
              </div>
              {!aiConfigured ? (
                <div className="ai-key-input">
                  <input
                    className="field-input"
                    type="password"
                    placeholder="sk-ant-... (Anthropic API key)"
                    value={aiApiKey}
                    onChange={e => setAiApiKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
                    style={{ fontSize:12, padding:'7px 10px', minWidth:220 }}
                  />
                  <button className="btn btn-execute" style={{ padding:'7px 16px', fontSize:12, marginTop:0, width:'auto' }}
                    onClick={handleSaveApiKey} disabled={!aiApiKey.trim()}>
                    Activate AI
                  </button>
                </div>
              ) : (
                <div className="ai-key-input">
                  <span style={{ fontSize:11, color:'#9ca3af', fontFamily:'monospace' }}>{aiKeyPreview}</span>
                  <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:11 }}
                    onClick={handleClearApiKey}>Clear Key</button>
                </div>
              )}
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
                            style={{ borderColor: e === 'Prod' ? '#ef4444' : e === 'Staging' ? '#f59e0b' : '#00bcd4' }}
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
                    <label className="adv-label">🌐 Browsers <span style={{color:'#9ca3af',fontSize:11}}>(select multiple)</span></label>
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

                  {/* Row 3b: Video Recording + Trace */}
                  <div className="adv-row">
                    <div className="adv-field">
                      <label className="adv-label">🎬 Video Recording</label>
                      <select className="field-input" value={videoRecording} onChange={e => setVideoRecording(e.target.value)} style={{marginTop:4}}>
                        <option value="off">Off</option>
                        <option value="on-first-retry">On First Retry (saves disk)</option>
                        <option value="retain-on-failure">Retain on Failure only</option>
                        <option value="on">Always (every test)</option>
                      </select>
                      <div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>
                        {videoRecording === 'off' ? 'No video captured' :
                         videoRecording === 'on' ? '⚠️ Records every test — uses more disk & time' :
                         videoRecording === 'retain-on-failure' ? '✅ Recommended — only keeps videos for failed tests' :
                         '🔄 Records on retry — good for flaky test debugging'}
                      </div>
                    </div>

                    <div className="adv-field">
                      <label className="adv-label">🔍 Trace Capture</label>
                      <select className="field-input" value={traceCapture} onChange={e => setTraceCapture(e.target.value)} style={{marginTop:4}}>
                        <option value="off">Off</option>
                        <option value="on-first-retry">On First Retry</option>
                        <option value="retain-on-failure">Retain on Failure only</option>
                        <option value="on">Always</option>
                      </select>
                      <div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>
                        {traceCapture === 'off' ? 'No trace captured' :
                         'Trace = DOM snapshots + network + console logs (open with npx playwright show-trace)'}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Workers + Retries */}
                  <div className="adv-row">
                    <div className="adv-field">
                      <label className="adv-label">⚙️ Parallel Workers: <strong style={{color:'#00bcd4'}}>{workers}</strong></label>
                      <input type="range" min="1" max="5" value={workers}
                        onChange={e => setWorkers(e.target.value)}
                        style={{width:'100%',marginTop:6,accentColor:'#00bcd4'}} />
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#b0b7c3'}}>
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
              disabled={!appUrl || (inputMode === 'requirement' && !file) || (inputMode === 'testcase' && !testcaseFile)}
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
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#6b7280', marginBottom:6 }}>
                    <span>Pipeline Progress</span>
                    <span style={{ fontWeight:700, color:'#26c6da' }}>{pct}%</span>
                  </div>
                  <div style={{ background:'#eef1f6', borderRadius:999, height:8, overflow:'hidden' }}>
                    <div style={{
                      width:`${pct}%`, height:'100%', borderRadius:999,
                      background:'linear-gradient(90deg,#00bcd4,#26c6da)',
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
                { label: 'Total',    value: stats.total,   color: '#00bcd4' },
                { label: 'Passed',   value: stats.passed,  color: '#10b981' },
                { label: 'Failed',   value: stats.failed,  color: '#ef4444' },
                { label: 'Skipped',  value: stats.skipped || 0, color: '#6b7280' },
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
                ...(results?.aiEnabled ? [{ id: 'ai-analysis', label: '🤖 AI Analysis' }] : []),
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
                    { icon:'📦', label:'Modules', val: modules.length, color:'#0097a7' },
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
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#b0b7c3', marginTop:3 }}>
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
                        <th>JIRA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((tc, i) => (
                        <Fragment key={tc.id}>
                          <tr
                            className={`tr-clickable ${tc.status === 'Fail' ? 'row-fail' : tc.status === 'Pass' ? 'row-pass' : ''}`}
                            onClick={() => setExpandedRow(expandedRow === tc.id ? null : tc.id)}
                          >
                            <td style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                            <td><span className="tc-id">{tc.id}</span></td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{tc.title}</div>
                              {tc.error && (
                                <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }} title={tc.error}>
                                  {tc.error.slice(0, 80)}{tc.error.length > 80 ? '…' : ''}
                                </div>
                              )}
                            </td>
                            <td style={{ color: '#0097a7', fontSize: 12 }}>{tc.module}</td>
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
                                background: tc.status === 'Pass' ? '#064e3b' : tc.status === 'Fail' ? '#450a0a' : '#eef1f6',
                                color: tc.status === 'Pass' ? '#34d399' : tc.status === 'Fail' ? '#fca5a5' : '#6b7280',
                              }}>{STATUS_ICON[tc.status]} {tc.status}</span>
                            </td>
                            <td style={{ color: '#6b7280', fontSize: 12 }}>
                              {tc.duration != null ? `${tc.duration}ms` : '—'}
                              <span style={{ color:'#b0b7c3', marginLeft:4, fontSize:10 }}>
                                {expandedRow === tc.id ? '▲' : '▼'}
                              </span>
                            </td>
                            <td>
                              {tc.jiraKey ? (
                                <a href={tc.jiraUrl} target="_blank" rel="noreferrer" className="jira-link">
                                  🔗 {tc.jiraKey}
                                </a>
                              ) : tc.status === 'Fail' && results?.jiraConfigured ? (
                                <span style={{fontSize:11,color:'#b0b7c3'}}>Pending</span>
                              ) : null}
                            </td>
                          </tr>
                          {expandedRow === tc.id && (
                            <tr className="tr-expanded">
                              <td colSpan={9}>
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
            {/* Tab: AI Analysis */}
            {activeTab === 'ai-analysis' && results?.aiEnabled && (
              <div className="ai-analysis">

                {/* ── Requirement Analysis ── */}
                {results.requirementAnalysis && (
                  <div className="ai-review-card">
                    <div className="ai-review-header">
                      <span className="ai-agent-badge">📋 Requirement Analyst (12 yrs)</span>
                      <h3>Requirement Analysis</h3>
                    </div>
                    <div className="ai-verdict-row">
                      <span className="ai-verdict verdict-pass">
                        🏦 {results.requirementAnalysis.domain}
                      </span>
                      <span className="ai-coverage-score">Confidence: <strong>{results.requirementAnalysis.domainConfidence}%</strong></span>
                      <span style={{fontSize:12,color:'#6b7280'}}>{results.requirementAnalysis.appType}</span>
                    </div>
                    <p className="ai-summary">{results.requirementAnalysis.summary}</p>

                    {(results.requirementAnalysis.modules || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">📦 Detected Modules</div>
                        <div className="ai-gap-grid">
                          {results.requirementAnalysis.modules.map((m, i) => (
                            <div key={i} className="ai-gap-card">
                              <div className="ai-gap-header">
                                <span className={`ai-sev sev-${(m.riskLevel || 'medium').toLowerCase()}`}>{m.riskLevel} Risk</span>
                                <strong>{m.name}</strong>
                              </div>
                              <p>{(m.features || []).join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(results.requirementAnalysis.ambiguities || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">❓ Ambiguities Found</div>
                        {results.requirementAnalysis.ambiguities.map((a, i) => (
                          <div key={i} className="ai-risk-item">
                            <span className={`ai-sev sev-${(a.impact || 'medium').toLowerCase()}`}>{a.impact}</span>
                            <div>
                              <strong>{a.area}</strong><br/>
                              <span style={{color:'#93c5fd',fontSize:12}}>Q: {a.question}</span><br/>
                              <span style={{color:'#6b7280',fontSize:11}}>Assumption: {a.assumption}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {results.requirementAnalysis.testStrategy && (
                      <div className="ai-section">
                        <div className="ai-section-title">🎯 Test Strategy Recommendation</div>
                        <div className="ai-exec-brief">
                          <p><strong>Recommended Scope:</strong> {results.requirementAnalysis.testStrategy.recommendedScope}</p>
                          <p><strong>Estimated Test Cases:</strong> {results.requirementAnalysis.testStrategy.estimatedTestCases}</p>
                          <p><strong>Critical Path:</strong> {(results.requirementAnalysis.testStrategy.criticalPathModules || []).join(' → ')}</p>
                          <p style={{color:'#0097a7'}}>{results.requirementAnalysis.testStrategy.suggestedPriority}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Test Plan Review ── */}
                {results.testPlanReview && (
                  <div className="ai-review-card">
                    <div className="ai-review-header">
                      <span className="ai-agent-badge">👔 QA Director (20 yrs)</span>
                      <h3>Test Plan Review</h3>
                    </div>
                    <div className="ai-verdict-row">
                      <span className={`ai-verdict ${results.testPlanReview.verdict === 'Approved' ? 'verdict-pass' : results.testPlanReview.verdict === 'Needs Revision' ? 'verdict-fail' : 'verdict-warn'}`}>
                        {results.testPlanReview.verdict === 'Approved' ? '✅' : results.testPlanReview.verdict === 'Needs Revision' ? '❌' : '⚠️'} {results.testPlanReview.verdict}
                      </span>
                      <span className="ai-coverage-score">Coverage: <strong>{results.testPlanReview.coverageScore}%</strong></span>
                    </div>
                    <p className="ai-summary">{results.testPlanReview.summary}</p>

                    {(results.testPlanReview.strengths || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">💪 Strengths</div>
                        <ul className="ai-list">{results.testPlanReview.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}

                    {(results.testPlanReview.gaps || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">🔍 Coverage Gaps</div>
                        <div className="ai-gap-grid">
                          {results.testPlanReview.gaps.map((g, i) => (
                            <div key={i} className="ai-gap-card">
                              <div className="ai-gap-header">
                                <span className={`ai-sev sev-${(g.severity || 'medium').toLowerCase()}`}>{g.severity}</span>
                                <strong>{g.area}</strong>
                              </div>
                              <p>{g.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(results.testPlanReview.riskFlags || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">⚠️ Risk Flags</div>
                        {results.testPlanReview.riskFlags.map((r, i) => (
                          <div key={i} className="ai-risk-item">
                            <span className={`ai-sev sev-${(r.impact || 'medium').toLowerCase()}`}>{r.impact}</span>
                            <div><strong>{r.risk}</strong><br/><span style={{color:'#6b7280',fontSize:12}}>Mitigation: {r.mitigation}</span></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(results.testPlanReview.domainInsights || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">🏦 Domain Insights</div>
                        <ul className="ai-list ai-insights">{results.testPlanReview.domainInsights.map((d, i) => <li key={i}>{d}</li>)}</ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Results Review ── */}
                {results.resultsReview && (
                  <div className="ai-review-card" style={{marginTop:16}}>
                    <div className="ai-review-header">
                      <span className="ai-agent-badge">👔 QA Director (20 yrs)</span>
                      <h3>Execution Results Review</h3>
                    </div>
                    <div className="ai-verdict-row">
                      <span className={`ai-verdict ${results.resultsReview.signOff ? 'verdict-pass' : 'verdict-fail'}`}>
                        {results.resultsReview.signOff ? '✅ Approved for Deployment' : '❌ NOT Ready for Deployment'}
                      </span>
                      <span className={`ai-risk-badge risk-${(results.resultsReview.overallRisk || 'medium').toLowerCase()}`}>
                        Risk: {results.resultsReview.overallRisk}
                      </span>
                    </div>
                    <p className="ai-summary">{results.resultsReview.summary}</p>

                    {results.resultsReview.executiveBrief && (
                      <div className="ai-exec-brief">
                        <div className="ai-section-title">📋 Executive Brief</div>
                        <p>{results.resultsReview.executiveBrief}</p>
                      </div>
                    )}

                    {(results.resultsReview.failureAnalysis || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">🔬 Failure Root Cause Analysis</div>
                        <div className="table-wrap">
                          <table className="tbl">
                            <thead><tr>
                              <th>Test</th><th>Category</th><th>Root Cause</th><th>Severity</th><th>Fix</th>
                            </tr></thead>
                            <tbody>
                              {results.resultsReview.failureAnalysis.map((f, i) => (
                                <tr key={i}>
                                  <td><span className="tc-id">{f.testId}</span><br/><span style={{fontSize:11,color:'#6b7280'}}>{f.testTitle}</span></td>
                                  <td><span className={`ai-cat cat-${(f.category || '').replace(/\s/g,'-').toLowerCase()}`}>{f.category}</span></td>
                                  <td style={{fontSize:12}}>{f.rootCause}</td>
                                  <td><span className={`ai-sev sev-${(f.severity || 'medium').toLowerCase()}`}>{f.severity}</span></td>
                                  <td style={{fontSize:12,color:'#0097a7'}}>{f.recommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(results.resultsReview.recommendations || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">📌 Recommendations</div>
                        {results.resultsReview.recommendations.map((r, i) => (
                          <div key={i} className="ai-rec-item">
                            <span className={`ai-rec-cat cat-${(r.category || '').toLowerCase().replace(/\s/g,'-')}`}>{r.category}</span>
                            <span className={`ai-sev sev-${(r.priority || 'medium').toLowerCase()}`}>{r.priority}</span>
                            <span style={{flex:1}}>{r.action}</span>
                            {r.owner && <span className="ai-owner">{r.owner}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {results.resultsReview.riskAssessment && (
                      <div className="ai-section">
                        <div className="ai-section-title">🛡️ Risk Assessment</div>
                        <div className="ai-risk-grid">
                          {(results.resultsReview.riskAssessment.blockers || []).length > 0 && (
                            <div className="ai-risk-col risk-blocker">
                              <div className="ai-risk-col-title">🚫 Blockers</div>
                              <ul>{results.resultsReview.riskAssessment.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
                            </div>
                          )}
                          {(results.resultsReview.riskAssessment.concerns || []).length > 0 && (
                            <div className="ai-risk-col risk-concern">
                              <div className="ai-risk-col-title">⚠️ Concerns</div>
                              <ul>{results.resultsReview.riskAssessment.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                            </div>
                          )}
                          {(results.resultsReview.riskAssessment.passedAreas || []).length > 0 && (
                            <div className="ai-risk-col risk-pass">
                              <div className="ai-risk-col-title">✅ Passed Areas</div>
                              <ul>{results.resultsReview.riskAssessment.passedAreas.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {results.resultsReview.qualityMetrics && (
                      <div className="ai-section">
                        <div className="ai-section-title">📊 Quality Metrics</div>
                        <div className="ai-metrics-grid">
                          {Object.entries(results.resultsReview.qualityMetrics).map(([k, v]) => (
                            <div key={k} className="ai-metric">
                              <div className="ai-metric-val">{v}</div>
                              <div className="ai-metric-lbl">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Report Analyst Output ── */}
                {results.reportAnalysis && (
                  <div className="ai-review-card" style={{marginTop:16}}>
                    <div className="ai-review-header">
                      <span className="ai-agent-badge">📊 Report Analyst (8 yrs)</span>
                      <h3>Executive Report & Bug Reports</h3>
                    </div>

                    {results.reportAnalysis.executiveSummary && (
                      <>
                        <div className="ai-verdict-row">
                          <span className={`ai-verdict ${results.reportAnalysis.executiveSummary.status === 'GREEN' ? 'verdict-pass' : results.reportAnalysis.executiveSummary.status === 'RED' ? 'verdict-fail' : 'verdict-warn'}`}>
                            {results.reportAnalysis.executiveSummary.status === 'GREEN' ? '🟢' : results.reportAnalysis.executiveSummary.status === 'RED' ? '🔴' : '🟡'} {results.reportAnalysis.executiveSummary.status}
                          </span>
                          <strong style={{color:'#e2e8f0',fontSize:14}}>{results.reportAnalysis.executiveSummary.headline}</strong>
                        </div>
                        <div className="ai-exec-brief">
                          <div className="ai-section-title">📋 Executive Summary</div>
                          <p>{results.reportAnalysis.executiveSummary.narrative}</p>
                          {(results.reportAnalysis.executiveSummary.keyFindings || []).length > 0 && (
                            <ul className="ai-list" style={{marginTop:8}}>
                              {results.reportAnalysis.executiveSummary.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                          )}
                          <p style={{color:'#0097a7',fontWeight:600,marginTop:8}}>{results.reportAnalysis.executiveSummary.recommendation}</p>
                        </div>
                      </>
                    )}

                    {results.reportAnalysis.testNarrative && (
                      <div className="ai-section">
                        <div className="ai-section-title">📝 Test Narrative</div>
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {results.reportAnalysis.testNarrative.overview && <p className="ai-summary" style={{margin:0}}><strong>Overview:</strong> {results.reportAnalysis.testNarrative.overview}</p>}
                          {results.reportAnalysis.testNarrative.passHighlights && <p className="ai-summary" style={{margin:0,color:'#6ee7b7'}}><strong>Passed:</strong> {results.reportAnalysis.testNarrative.passHighlights}</p>}
                          {results.reportAnalysis.testNarrative.failureNarrative && <p className="ai-summary" style={{margin:0,color:'#fca5a5'}}><strong>Failures:</strong> {results.reportAnalysis.testNarrative.failureNarrative}</p>}
                        </div>
                      </div>
                    )}

                    {(results.reportAnalysis.bugReports || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">🐛 JIRA-Ready Bug Reports ({results.reportAnalysis.bugReports.length})</div>
                        {results.reportAnalysis.bugReports.map((bug, i) => (
                          <div key={i} className="bug-report-card">
                            <div className="bug-header">
                              <span className="bug-id">{bug.id}</span>
                              <span className={`ai-sev sev-${(bug.severity || 'major').toLowerCase()}`}>{bug.severity}</span>
                              <span className="bug-priority">{bug.priority}</span>
                              <span className="bug-type">{bug.type}</span>
                            </div>
                            <div className="bug-title">{bug.title}</div>
                            <div className="bug-body">
                              <div className="bug-field"><strong>Module:</strong> {bug.module}</div>
                              <div className="bug-field"><strong>Steps to Reproduce:</strong>
                                <ol className="exp-steps">{(bug.stepsToReproduce || []).map((s, j) => <li key={j}>{s}</li>)}</ol>
                              </div>
                              <div className="bug-field"><strong>Expected:</strong> <span style={{color:'#6ee7b7'}}>{bug.expectedResult}</span></div>
                              <div className="bug-field"><strong>Actual:</strong> <span style={{color:'#fca5a5'}}>{bug.actualResult}</span></div>
                              {bug.suggestedFix && <div className="bug-field"><strong>Suggested Fix:</strong> <span style={{color:'#0097a7'}}>{bug.suggestedFix}</span></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(results.reportAnalysis.nextSteps || []).length > 0 && (
                      <div className="ai-section">
                        <div className="ai-section-title">📌 Next Steps</div>
                        {results.reportAnalysis.nextSteps.map((s, i) => (
                          <div key={i} className="ai-rec-item">
                            <span className={`ai-rec-cat cat-${(s.timeline || '').toLowerCase().replace(/\s/g, '-')}`}>{s.timeline}</span>
                            <span className="ai-owner">{s.owner}</span>
                            <span style={{flex:1}}>{s.action}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {results.reportAnalysis.signOffStatement && (
                      <div className="ai-exec-brief" style={{marginTop:12,borderColor:'#4338ca'}}>
                        <div className="ai-section-title">✍️ Sign-Off</div>
                        <p style={{fontStyle:'italic'}}>{results.reportAnalysis.signOffStatement}</p>
                      </div>
                    )}
                  </div>
                )}

                {!results.requirementAnalysis && !results.testPlanReview && !results.resultsReview && !results.reportAnalysis && (
                  <div style={{textAlign:'center',padding:'40px 0',color:'#b0b7c3'}}>
                    AI analysis data not available for this run.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {runHistory.length === 0 ? (
                  <div style={{color:'#b0b7c3',textAlign:'center',padding:'40px 0',fontStyle:'italic'}}>
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
                              <td style={{color:'#9ca3af',fontSize:12}}>{runHistory.length - idx}</td>
                              <td style={{fontSize:11,color:'#6b7280'}}>{run.timestamp?.slice(0,16).replace('T',' ')}</td>
                              <td style={{fontSize:11,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={run.appUrl}>{run.appUrl}</td>
                              <td><span className="rcfg-badge env" style={{fontSize:10}}>{run.environment}</span></td>
                              <td><span className="rcfg-badge scope" style={{fontSize:10}}>{run.testScope}</span></td>
                              <td style={{fontSize:11}}>{(run.browsers||[]).map(b=>b==='chromium'?'🟡':b==='firefox'?'🦊':b==='webkit'?'🍎':'📱').join(' ')}</td>
                              <td className="tc">{run.total}</td>
                              <td className="tc pass-c">{run.passed}</td>
                              <td className="tc fail-c">{run.failed}</td>
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{flex:1,background:'#eef1f6',borderRadius:4,height:6,overflow:'hidden'}}>
                                    <div style={{width:`${run.passRate}%`,height:'100%',background: run.passRate>=80?'#10b981':run.passRate>=50?'#f59e0b':'#ef4444'}} />
                                  </div>
                                  <span style={{fontSize:11,minWidth:32,color:'#6b7280'}}>{run.passRate}%</span>
                                </div>
                              </td>
                              <td style={{color:'#9ca3af',fontSize:12}}>{run.duration}s</td>
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
        QA AI Testing Tool &nbsp;|&nbsp; Powered by Playwright v1.55 &nbsp;|&nbsp; AI-Powered Test Automation
      </footer>
    </div>

    {/* ── Command Palette (Cmd+K) ──────────────────────────────────────────── */}
    <CommandPalette
      open={cmdOpen}
      onClose={() => setCmdOpen(false)}
      commands={[
        // Navigation
        { id: 'nav-dashboard',   group: 'Navigate', label: 'Dashboard',           description: 'View KPIs & trends', icon: Icons.Activity, color: '#06b6d4', shortcut: 'g d', action: () => setPage('dashboard') },
        { id: 'nav-manual',      group: 'Navigate', label: 'Manual Test',          description: 'Run tests against an app', icon: Icons.Play,  color: '#8b5cf6', shortcut: 'g m', action: () => setPage('manual') },
        { id: 'nav-exploratory', group: 'Navigate', label: 'Exploratory Testing',  description: 'Analyze screenshots/video',  icon: Icons.Search, color: '#10b981', shortcut: 'g e', action: () => setPage('exploratory') },
        { id: 'nav-api',         group: 'Navigate', label: 'API Testing',          description: 'Generate API test suite',    icon: Icons.Globe,  color: '#06b6d4', shortcut: 'g a', action: () => setPage('api') },
        { id: 'nav-security',    group: 'Navigate', label: 'Security Testing',     description: 'OWASP ZAP, Nuclei, checklist', icon: Icons.Shield, color: '#ef4444', shortcut: 'g s', action: () => setPage('security') },
        { id: 'nav-performance', group: 'Navigate', label: 'Performance Testing',  description: 'k6, JMeter, Artillery',      icon: Icons.Zap,   color: '#f59e0b', shortcut: 'g p', action: () => setPage('performance') },
        { id: 'nav-a11y',        group: 'Navigate', label: 'Accessibility',        description: 'WCAG 2.1 / axe-core',        icon: Icons.Eye,   color: '#10b981', action: () => setPage('a11y') },
        { id: 'nav-visual',      group: 'Navigate', label: 'Visual Regression',    description: 'Screenshot diffing',         icon: Icons.Eye,   color: '#8b5cf6', action: () => setPage('visual') },
        { id: 'nav-mobile',      group: 'Navigate', label: 'Mobile Testing',       description: 'Appium / Detox / Maestro',   icon: Icons.Smartphone, color: '#3b82f6', action: () => setPage('mobile') },
        { id: 'nav-database',    group: 'Navigate', label: 'Database Testing',     description: 'SQL assertions, ETL',        icon: Icons.Database, color: '#0891b2', action: () => setPage('database') },
        { id: 'nav-cicd',        group: 'Navigate', label: 'CI/CD Pipelines',      description: 'GitHub Actions, Jenkins',    icon: Icons.Rocket,  color: '#f59e0b', action: () => setPage('cicd') },
        { id: 'nav-scripts',     group: 'Navigate', label: 'Script Generator',     description: 'Scaffold automation project', icon: Icons.FileText, color: '#6366f1', action: () => setPage('scripts') },
        { id: 'nav-monitor',     group: 'Navigate', label: 'Email Monitor',        description: 'Trigger tests via email',     icon: Icons.Bell, color: '#ec4899', action: () => setPage('monitor') },
        { id: 'nav-guide',       group: 'Navigate', label: 'User Guide',           description: 'Docs & how-tos',              icon: Icons.FileText, color: '#94a3b8', action: () => setPage('guide') },
        // Quick actions
        { id: 'act-theme',       group: 'Actions',  label: 'Toggle theme',         description: 'Dark ↔ Light', icon: darkMode ? Icons.Sun : Icons.Moon, shortcut: 't', action: () => setDarkMode(d => !d) },
        { id: 'act-shortcuts',   group: 'Actions',  label: 'Keyboard shortcuts',   description: 'View all shortcuts', icon: Icons.Keyboard, shortcut: '?', action: () => setShortcutsOpen(true) },
        { id: 'act-reset',       group: 'Actions',  label: 'Reset Manual test',    description: 'Clear current run state', icon: Icons.Plus, action: () => handleReset() },
        { id: 'act-logout',      group: 'Account',  label: 'Log out',              description: `Signed in as ${authUser?.email}`, icon: Icons.LogOut, color: '#ef4444', action: () => onLogout() },
      ]}
    />

    {/* ── Keyboard shortcuts modal (?) ─────────────────────────────────────── */}
    <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

    {/* ── Onboarding tour ──────────────────────────────────────────────────── */}
    <OnboardingTour
      open={tourOpen}
      onClose={() => { setTourOpen(false); localStorage.setItem(tourCompletedKey, '1'); }}
      onComplete={() => localStorage.setItem(tourCompletedKey, '1')}
      steps={[
        {
          title: `Welcome, ${authUser?.name || 'friend'}! 👋`,
          description: 'You\'re using a complete AI-powered QA platform covering 12+ testing disciplines. This 5-step tour will show you the essentials.',
        },
        {
          targetSelector: '.sidebar-nav',
          title: '🧭 Navigation sidebar',
          description: 'Groups: Overview · Run Tests · Generate Suites · Tools · Administration (admin only). Click the logo at top to collapse.',
        },
        {
          targetSelector: '.topbar-iconbtn',
          title: '🔍 Command Palette',
          description: 'Press Ctrl+K anytime to search & jump to any page, run a quick action, or toggle the theme. The fastest way around the app.',
        },
        {
          targetSelector: '.notif-btn',
          title: '🔔 Notifications',
          description: 'Stay informed about completed test runs, errors, and system events. Configure Slack/Teams integration in Settings.',
        },
        {
          targetSelector: '.user-menu-btn',
          title: '⚙️ Your account',
          description: 'Click your avatar to access Settings where you configure notifications, theme, and view your security posture. Admins have extra controls.',
        },
      ]}
    />

    {/* ── What's New modal (shown once per version) ────────────────────────── */}
    <WhatsNewModal
      open={whatsNewOpen}
      onClose={() => { setWhatsNewOpen(false); localStorage.setItem(whatsNewKey, '1'); }}
      items={[
        { icon: Icons.Command,   color: '#06b6d4', isNew: true, title: 'Command Palette', description: 'Press Ctrl+K to jump anywhere, search commands, and run quick actions.' },
        { icon: Icons.Users,     color: '#ef4444', isNew: true, title: 'Admin Control Panel', description: 'Manage users, view global activity log, monitor system health in real time.' },
        { icon: Icons.Activity,  color: '#10b981', isNew: true, title: 'Audit Activity Log', description: 'Every login, signup, and config change is recorded and reviewable by admins.' },
        { icon: Icons.Bell,      color: '#f59e0b', isNew: true, title: 'Notification Center', description: 'Bell icon shows all recent events. Slack/Teams webhooks via Settings.' },
        { icon: Icons.Sparkles,  color: '#8b5cf6', isNew: true, title: 'Beautiful Visual Polish', description: 'Animated gradients, pulse indicators, glass morphism, aurora backgrounds.' },
        { icon: Icons.Shield,    color: '#06b6d4', title: '12+ Testing Disciplines', description: 'API, Security, Performance, A11y, Visual, Mobile, Database, CI/CD — all included.' },
      ]}
    />

    {/* ── FAB for Cmd+K on mobile ─────────────────────────────────────────── */}
    <button className="fab-cmdk" onClick={() => setCmdOpen(true)} title="Command palette">
      <Icons.Command size={22} />
    </button>

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
