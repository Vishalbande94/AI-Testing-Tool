// ── UI Enhancements — Command Palette, Shortcuts Modal, Notifications, Charts ──
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Command, Keyboard, Bell, TrendingUp, TrendingDown,
  Settings, User, LogOut, Moon, Sun, Zap, Shield, Eye, Smartphone,
  Database, Rocket, Target, CheckCircle, XCircle, AlertCircle,
  Sparkles, ArrowRight, ChevronRight, ChevronDown, Plus, Clock, Filter,
  Download, Upload, Play, FileText, Globe, Activity, Home,
  Users, BarChart3, Server, Mail, BookOpen, Mic, Menu,
  Trash2, UserCheck, UserX, Crown, Beaker, Layers, Wrench,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. COMMAND PALETTE (Cmd+K / Ctrl+K)
// ═══════════════════════════════════════════════════════════════════════════
export function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.toLowerCase().includes(q)) ||
      c.group?.toLowerCase().includes(q)
    );
  }, [query, commands]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(c => {
      const g = c.group || 'Actions';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    return groups;
  }, [filtered]);

  const flat = filtered;

  // Keyboard navigation
  const handleKey = (e) => {
    if (e.key === 'Escape')       { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter')     { e.preventDefault(); const cmd = flat[cursor]; if (cmd) { cmd.action(); onClose(); } }
  };

  if (!open) return null;

  let flatIdx = -1;
  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="cmdk-search-wrap">
          <Search size={18} className="cmdk-search-icon" />
          <input
            ref={inputRef}
            className="cmdk-search-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>

        <div className="cmdk-results">
          {Object.keys(grouped).length === 0 && (
            <div className="cmdk-empty">
              <Search size={32} />
              <p>No matches for "<strong>{query}</strong>"</p>
            </div>
          )}
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group} className="cmdk-group">
              <div className="cmdk-group-label">{group}</div>
              {cmds.map(c => {
                flatIdx++;
                const isActive = flatIdx === cursor;
                const Icon = c.icon || ChevronRight;
                return (
                  <button
                    key={c.id}
                    className={`cmdk-item ${isActive ? 'active' : ''}`}
                    onClick={() => { c.action(); onClose(); }}
                    onMouseEnter={() => setCursor(flatIdx)}
                  >
                    <span className="cmdk-item-icon" style={{ color: c.color || '#94a3b8' }}>
                      <Icon size={16} />
                    </span>
                    <span className="cmdk-item-label">{c.label}</span>
                    {c.description && <span className="cmdk-item-desc">{c.description}</span>}
                    {c.shortcut && <kbd className="cmdk-item-kbd">{c.shortcut}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cmdk-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. KEYBOARD SHORTCUTS MODAL
// ═══════════════════════════════════════════════════════════════════════════
export function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const shortcuts = [
    { group: 'Navigation', items: [
      { keys: ['Ctrl', 'K'], desc: 'Open command palette' },
      { keys: ['?'],          desc: 'Show this shortcuts panel' },
      { keys: ['g', 'd'],     desc: 'Go to Dashboard' },
      { keys: ['g', 'm'],     desc: 'Go to Manual Test' },
      { keys: ['g', 'e'],     desc: 'Go to Exploratory' },
      { keys: ['g', 'a'],     desc: 'Go to API Testing' },
      { keys: ['g', 's'],     desc: 'Go to Security' },
      { keys: ['g', 'p'],     desc: 'Go to Performance' },
    ]},
    { group: 'Actions', items: [
      { keys: ['Ctrl', 'Enter'], desc: 'Execute current configured test' },
      { keys: ['t'],             desc: 'Toggle dark/light theme' },
      { keys: ['/'],             desc: 'Focus search' },
    ]},
  ];

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <Keyboard size={22} />
          <h2>Keyboard Shortcuts</h2>
          <button className="shortcuts-close" onClick={onClose}>✕</button>
        </div>
        <div className="shortcuts-body">
          {shortcuts.map(section => (
            <div key={section.group} className="shortcuts-section">
              <div className="shortcuts-section-title">{section.group}</div>
              {section.items.map((s, i) => (
                <div key={i} className="shortcuts-row">
                  <span className="shortcuts-desc">{s.desc}</span>
                  <span className="shortcuts-keys">
                    {s.keys.map((k, j) => (
                      <span key={j}>
                        <kbd>{k}</kbd>
                        {j < s.keys.length - 1 && <span className="shortcuts-plus">+</span>}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. NOTIFICATION CENTER (bell icon + dropdown)
// ═══════════════════════════════════════════════════════════════════════════
export function NotificationBell({ notifications = [], onMarkRead, onClearAll }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)} title="Notifications">
        <Bell size={18} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-clear" onClick={onClearAll}>Clear all</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={24} />
              <p>You're all caught up!</p>
              <span>New activity will appear here</span>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.slice(0, 20).map(n => {
                const Icon = n.type === 'success' ? CheckCircle : n.type === 'error' ? XCircle : AlertCircle;
                const color = n.type === 'success' ? '#10b981' : n.type === 'error' ? '#ef4444' : '#f59e0b';
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'unread'}`}
                    onClick={() => onMarkRead(n.id)}
                  >
                    <span className="notif-icon" style={{ color }}><Icon size={16} /></span>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      {n.description && <div className="notif-desc">{n.description}</div>}
                      <div className="notif-time">{timeAgo(n.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DASHBOARD SPARKLINE CHART (pass-rate trend)
// ═══════════════════════════════════════════════════════════════════════════
export function Sparkline({ data, color = '#06b6d4', height = 40, width = 120, showArea = true }) {
  if (!data || data.length === 0) return <div className="sparkline-empty">No data yet</div>;

  const values = data.map(d => typeof d === 'number' ? d : d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * width,
    y: height - ((v - min) / range) * height,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = showArea
    ? `${path} L ${width} ${height} L 0 ${height} Z`
    : '';

  const last = values[values.length - 1];
  const prev = values[values.length - 2] ?? last;
  const trend = last > prev ? 'up' : last < prev ? 'down' : 'flat';

  return (
    <svg width={width} height={height} className="sparkline">
      <defs>
        <linearGradient id={`spark-${color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && <path d={areaPath} fill={`url(#spark-${color.slice(1)})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.slice(-1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="var(--bg)" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHART: Horizontal bar distribution (e.g. tests by module)
// ═══════════════════════════════════════════════════════════════════════════
export function BarChart({ data, height = 200 }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="bar-row">
            <div className="bar-label">{d.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${pct}%`,
                  background: d.color || 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                }}
              >
                <span className="bar-value">{d.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. TREND CARD (big number + sparkline + delta)
// ═══════════════════════════════════════════════════════════════════════════
export function TrendCard({ label, value, delta, deltaUnit = '%', trend, color = '#06b6d4', history = [], icon: Icon }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8';

  return (
    <div className="trend-card">
      <div className="trend-card-top">
        <div className="trend-card-label">
          {Icon && <Icon size={14} />}
          {label}
        </div>
        {delta !== undefined && (
          <span className="trend-card-delta" style={{ color: trendColor }}>
            <TrendIcon size={12} />
            {delta > 0 ? '+' : ''}{delta}{deltaUnit}
          </span>
        )}
      </div>
      <div className="trend-card-value" style={{ color }}>{value}</div>
      {history.length > 0 && (
        <div className="trend-card-chart">
          <Sparkline data={history} color={color} width={220} height={44} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function EmptyState({ icon: Icon = Sparkles, title, description, action, illustration }) {
  return (
    <div className="empty-state">
      <div className="empty-state-visual">
        {illustration || <Icon size={56} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick}>
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════════════
export function Skeleton({ width = '100%', height = 20, radius = 6, className = '' }) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. ICON MAP — consistent icons for common terms
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING TOUR — guided walkthrough for first-time users
// ═══════════════════════════════════════════════════════════════════════════
export function OnboardingTour({ open, steps, onClose, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);

  useEffect(() => {
    if (!open) return;
    const step = steps[stepIdx];
    if (!step) return;
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        setHighlightRect({
          top:    r.top - 4,
          left:   r.left - 4,
          width:  r.width + 8,
          height: r.height + 8,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [open, stepIdx, steps]);

  if (!open || steps.length === 0) return null;
  const step = steps[stepIdx];

  const next = () => {
    if (stepIdx < steps.length - 1) setStepIdx(s => s + 1);
    else { onComplete?.(); onClose(); }
  };

  // Position tooltip — centered if no target, else below or near target
  const tooltipStyle = highlightRect
    ? {
        top:  Math.min(highlightRect.top + highlightRect.height + 16, window.innerHeight - 220),
        left: Math.min(Math.max(highlightRect.left, 20), window.innerWidth - 380),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <div className="tour-backdrop" />
      {highlightRect && (
        <div
          className="tour-highlight"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-step-counter">
          Step {stepIdx + 1} of {steps.length}
        </div>
        <div className="tour-title">{step.title}</div>
        <div className="tour-desc">{step.description}</div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onClose}>Skip tour</button>
          <button className="tour-next" onClick={next}>
            {stepIdx === steps.length - 1 ? (
              <>Got it! <CheckCircle size={14} /></>
            ) : (
              <>Next <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WHAT'S NEW MODAL — show recent changes/features
// ═══════════════════════════════════════════════════════════════════════════
export function WhatsNewModal({ open, onClose, items }) {
  if (!open) return null;
  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="whatsnew-card" onClick={e => e.stopPropagation()}>
        <div className="whatsnew-hero">
          <div style={{ fontSize: 48, marginBottom: 8, position: 'relative' }}>✨</div>
          <div className="whatsnew-hero-title">What's New</div>
          <div className="whatsnew-hero-sub">Fresh features added to your QA platform</div>
        </div>
        <div className="whatsnew-body">
          {items.map((item, i) => (
            <div key={i} className="whatsnew-item">
              <div className="whatsnew-icon" style={{ color: item.color || '#06b6d4' }}>
                {item.icon ? <item.icon size={18} /> : <Sparkles size={18} />}
              </div>
              <div>
                <div className="whatsnew-title">
                  {item.title}
                  {item.isNew && <span className="chip chip-new" style={{ marginLeft: 8 }}>NEW</span>}
                </div>
                <div className="whatsnew-desc">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="whatsnew-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got it, let me explore
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTED CONTROL — iOS-style pill tabs
// ═══════════════════════════════════════════════════════════════════════════
export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`segmented-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <opt.icon size={13} style={{ marginRight: 4, verticalAlign: -2 }} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR — animated gradient fill
// ═══════════════════════════════════════════════════════════════════════════
export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const style = color ? { background: color } : {};
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, ...style }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHIP — reusable pill/tag
// ═══════════════════════════════════════════════════════════════════════════
export function Chip({ children, variant = 'default', icon: Icon }) {
  return (
    <span className={`chip chip-${variant}`}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE DOT — animated pulse indicator
// ═══════════════════════════════════════════════════════════════════════════
export function LiveDot({ color = 'green', size = 'normal' }) {
  const className = `live-dot ${size === 'large' ? 'large' : ''} ${
    color === 'red' ? 'dot-red' :
    color === 'amber' ? 'dot-amber' :
    color === 'cyan' ? 'dot-cyan' : ''
  }`;
  return <span className={className} />;
}

export const Icons = {
  Search, Command, Keyboard, Bell, TrendingUp, TrendingDown,
  Settings, User, LogOut, Moon, Sun, Zap, Shield, Eye, Smartphone,
  Database, Rocket, Target, CheckCircle, XCircle, AlertCircle,
  Sparkles, ArrowRight, ChevronRight, ChevronDown, Plus, Clock, Filter,
  Download, Upload, Play, FileText, Globe, Activity, Home,
  Users, BarChart3, Server, Mail, BookOpen, Mic, Menu,
  Trash2, UserCheck, UserX, Crown, Beaker, Layers, Wrench,
};

// ═══════════════════════════════════════════════════════════════════════════
// MASCOT COMPANION — emotional AI mascot that reacts to what's happening
// ═══════════════════════════════════════════════════════════════════════════
// Emotions: idle | happy | excited | thinking | sad | celebrating | waving
//           sleeping | running | surprised | loving | farewell
//
// Props:
//   emotion — current emotion (see list above)
//   message — optional speech bubble text
//   position — { x: 'right'|'left'|number, y: 'bottom'|'top'|number }
//   onClick  — callback when user clicks the mascot
export function MascotCompanion({ emotion = 'idle', message, position, onClick }) {
  const [show, setShow] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(false);

  // Show bubble when message changes, auto-hide after 5s
  useEffect(() => {
    if (!message) { setBubbleVisible(false); return; }
    setBubbleVisible(true);
    const t = setTimeout(() => setBubbleVisible(false), 5000);
    return () => clearTimeout(t);
  }, [message]);

  if (!show) return null;

  // Emotion → face + body animation class
  const faces = {
    idle:        '🤖',
    happy:       '😊',
    excited:     '🤩',
    thinking:    '🤔',
    sad:         '😢',
    celebrating: '🎉',
    waving:      '👋',
    sleeping:    '😴',
    running:     '🏃',
    surprised:   '😮',
    loving:      '🥰',
    farewell:    '👋',
    confused:    '😕',
    proud:       '😎',
    angry:       '😤',
  };

  const moods = {
    celebrating: { rays: true, confetti: true },
    excited:     { rays: true },
    loving:      { hearts: true },
    sleeping:    { zzz: true },
    thinking:    { bubble: true },
    sad:         { tears: true },
    angry:       { fume: true },
  };

  const mood = moods[emotion] || {};

  const posStyle = {};
  if (position?.x === 'left')   posStyle.left = 24;
  else if (position?.x === 'right') posStyle.right = 24;
  else if (typeof position?.x === 'number') posStyle.left = position.x;
  else posStyle.right = 100;
  if (position?.y === 'top')    posStyle.top = 90;
  else if (position?.y === 'bottom') posStyle.bottom = 24;
  else if (typeof position?.y === 'number') posStyle.bottom = position.y;
  else posStyle.bottom = 100;

  return (
    <div className={`mascot mascot-${emotion}`} style={posStyle} onClick={onClick}>
      {mood.confetti && (
        <div className="mascot-confetti-burst">
          {'🎉🎊✨🌟⭐'.split('').map((e, i) => (
            <span key={i} className="mascot-confetti-piece" style={{ '--i': i }}>{e}</span>
          ))}
        </div>
      )}
      {mood.hearts && <span className="mascot-float mascot-heart">❤️</span>}
      {mood.zzz && (
        <>
          <span className="mascot-float mascot-zzz" style={{ animationDelay: '0s' }}>💤</span>
          <span className="mascot-float mascot-zzz" style={{ animationDelay: '1s' }}>💤</span>
        </>
      )}
      {mood.fume && <span className="mascot-float mascot-fume">💢</span>}
      {mood.tears && <span className="mascot-float mascot-tear">💧</span>}
      {mood.rays && <div className="mascot-rays" />}

      <div className="mascot-body">
        <div className="mascot-face">{faces[emotion] || faces.idle}</div>
      </div>

      {message && bubbleVisible && (
        <div className="mascot-bubble">
          {message}
          <div className="mascot-bubble-tail" />
        </div>
      )}
    </div>
  );
}

// Helper: pick an emotion + message based on test-run results
export function emotionForResults(stats) {
  if (!stats) return { emotion: 'idle', message: null };
  const rate = stats.passRate ?? 0;
  if (rate === 100) return { emotion: 'celebrating', message: `Perfect! ${stats.passed}/${stats.total} tests passed! 🎉` };
  if (rate >= 80)   return { emotion: 'excited',     message: `Great run! ${rate}% pass rate — looking good!` };
  if (rate >= 50)   return { emotion: 'thinking',    message: `${rate}% passed — some tests need a look.` };
  if (rate > 0)     return { emotion: 'sad',         message: `Only ${rate}% passed. Let's fix these issues.` };
  return { emotion: 'confused', message: 'No tests passed — something went wrong.' };
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MODAL — shows missing required fields with inline fix inputs
// ═══════════════════════════════════════════════════════════════════════════
export function ValidationModal({ open, issues, onClose, onContinue }) {
  // Track local edits (which field is being fixed inline)
  const inputRefs = useRef({});

  useEffect(() => {
    if (open) {
      // Focus first input
      setTimeout(() => {
        const first = Object.values(inputRefs.current)[0];
        if (first) first.focus();
      }, 50);
    }
  }, [open]);

  if (!open) return null;

  const remaining = issues.filter(i => !i.resolved);
  const canContinue = remaining.length === 0;

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="validation-modal" onClick={e => e.stopPropagation()}>
        <div className="validation-header">
          <div className="validation-icon">
            <AlertCircle size={26} />
          </div>
          <div>
            <div className="validation-title">
              {canContinue ? 'Ready to run!' : 'Missing information'}
            </div>
            <div className="validation-sub">
              {canContinue
                ? 'All required fields are filled. Click Continue to start.'
                : `Please provide the ${remaining.length} field${remaining.length > 1 ? 's' : ''} below to start the test run.`}
            </div>
          </div>
        </div>

        <div className="validation-body">
          {issues.map((issue, i) => (
            <div key={i} className={`validation-item ${issue.resolved ? 'resolved' : 'pending'}`}>
              <div className="validation-item-head">
                <span className="validation-item-icon">
                  {issue.resolved ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </span>
                <div className="validation-item-label">
                  <div className="validation-item-field">{issue.label}</div>
                  <div className="validation-item-msg">{issue.message}</div>
                </div>
              </div>
              {issue.input && !issue.resolved && (
                <div className="validation-item-input-wrap">
                  {issue.input.type === 'file' ? (
                    <input
                      ref={el => { inputRefs.current[issue.field] = el; }}
                      type="file"
                      accept={issue.input.accept}
                      onChange={e => issue.input.onChange(e.target.files[0])}
                      className="field-input"
                    />
                  ) : (
                    <input
                      ref={el => { inputRefs.current[issue.field] = el; }}
                      type={issue.input.type || 'text'}
                      placeholder={issue.input.placeholder}
                      value={issue.input.value || ''}
                      onChange={e => issue.input.onChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && canContinue) {
                          onContinue();
                        } else if (e.key === 'Enter') {
                          // Move to next unfixed field
                          const unresolvedKeys = issues
                            .filter(x => !x.resolved && x !== issue && x.input)
                            .map(x => x.field);
                          if (unresolvedKeys.length > 0) {
                            const nextEl = inputRefs.current[unresolvedKeys[0]];
                            if (nextEl) nextEl.focus();
                          }
                        }
                      }}
                      className="field-input"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="validation-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onContinue}
            disabled={!canContinue}
          >
            {canContinue ? <>Continue <ArrowRight size={14} /></> : `${remaining.length} field${remaining.length > 1 ? 's' : ''} remaining`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION — colorful, grouped, collapsible
// ═══════════════════════════════════════════════════════════════════════════
export function Sidebar({ page, setPage, authUser, collapsed, onToggleCollapse }) {
  const isAdmin = authUser?.role === 'admin';

  const groups = [
    {
      label: 'Overview',
      color: '#06b6d4',
      items: [
        { id: 'dashboard',  icon: BarChart3, label: 'Dashboard' },
        { id: 'monitor',    icon: Mail,      label: 'Email Monitor' },
        { id: 'guide',      icon: BookOpen,  label: 'User Guide' },
      ],
    },
    {
      label: 'Run Tests',
      color: '#8b5cf6',
      items: [
        { id: 'manual',       icon: Play,    label: 'Manual Test' },
        { id: 'exploratory',  icon: Search,  label: 'Exploratory' },
      ],
    },
    {
      label: 'Generate Test Suites',
      color: '#10b981',
      items: [
        { id: 'api',          icon: Globe,      label: 'API Testing',       badge: 'Hot' },
        { id: 'security',     icon: Shield,     label: 'Security',          color: '#ef4444' },
        { id: 'performance',  icon: Zap,        label: 'Performance',       color: '#f59e0b' },
        { id: 'a11y',         icon: Eye,        label: 'Accessibility',     color: '#10b981' },
        { id: 'visual',       icon: Layers,     label: 'Visual Regression', color: '#8b5cf6' },
        { id: 'mobile',       icon: Smartphone, label: 'Mobile',            color: '#3b82f6' },
        { id: 'database',     icon: Database,   label: 'Database / ETL',    color: '#0891b2' },
        { id: 'cicd',         icon: Rocket,     label: 'CI/CD Pipelines',   color: '#f59e0b' },
      ],
    },
    {
      label: 'Tools',
      color: '#f59e0b',
      items: [
        { id: 'scripts',    icon: Wrench,  label: 'Script Generator' },
      ],
    },
    ...(isAdmin ? [{
      label: 'Administration',
      color: '#ef4444',
      adminOnly: true,
      items: [
        { id: 'admin-users',    icon: Users,   label: 'Users' },
        { id: 'admin-activity', icon: Activity, label: 'Activity Log' },
        { id: 'admin-system',   icon: Server,  label: 'System Health' },
      ],
    }] : []),
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
        <div className="sidebar-logo-wrap">
          <Beaker size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name gradient-text">QA Platform</div>
            <div className="sidebar-brand-sub">AI-Powered Testing</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {groups.map(g => (
          <SidebarGroup key={g.label} group={g} page={page} setPage={setPage} collapsed={collapsed} />
        ))}
      </nav>

      {!collapsed && authUser && (
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setPage('settings')}>
            <div className="sidebar-user-avatar">
              {(authUser.name || authUser.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{authUser.name}</div>
              <div className="sidebar-user-role">
                {authUser.role === 'admin' && <Crown size={10} />}
                {authUser.role}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SidebarGroup({ group, page, setPage, collapsed }) {
  const [open, setOpen] = useState(true);
  const isActive = group.items.some(i => i.id === page);

  return (
    <div className={`sidebar-group ${group.adminOnly ? 'admin-group' : ''}`}>
      {!collapsed && (
        <button
          className="sidebar-group-label"
          onClick={() => setOpen(o => !o)}
          style={{ '--group-color': group.color }}
        >
          <ChevronDown size={12} className={open ? '' : 'rotated'} />
          {group.label}
          {group.adminOnly && <span className="sidebar-admin-chip">ADMIN</span>}
        </button>
      )}
      {(open || collapsed) && (
        <div className="sidebar-items">
          {group.items.map(item => {
            const Icon = item.icon;
            const isPage = item.id === page;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${isPage ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
                title={collapsed ? item.label : undefined}
                style={{ '--item-color': item.color || group.color, '--group-color': group.color }}
              >
                <span className="sidebar-item-icon"><Icon size={16} /></span>
                {!collapsed && (
                  <>
                    <span className="sidebar-item-label">{item.label}</span>
                    {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
                  </>
                )}
                {isPage && <span className="sidebar-active-bar" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN: USERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function AdminUsersPage({ currentUser, toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  const reload = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const loadDetail = (id) => {
    setSelected(id);
    setUserDetail(null);
    fetch(`/api/admin/users/${id}`).then(r => r.json()).then(setUserDetail);
  };

  const promote = async (id, role) => {
    if (!confirm(`Change role to ${role}?`)) return;
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Failed', 'error');
    toast(`Role changed to ${role}`, 'success');
    reload();
    if (selected === id) loadDetail(id);
  };

  const remove = async (id, email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return toast(data.error || 'Failed', 'error');
    toast(`Deleted ${email}`, 'success');
    setSelected(null);
    reload();
  };

  const filtered = users.filter(u =>
    !query ||
    u.email.toLowerCase().includes(query.toLowerCase()) ||
    u.name?.toLowerCase().includes(query.toLowerCase()) ||
    u.role === query.toLowerCase()
  );

  return (
    <div className="admin-page">
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}>
        <div className="admin-header-icon"><Users size={36} /></div>
        <div>
          <h1 className="admin-header-title">User Management</h1>
          <p className="admin-header-sub">{users.length} total · {users.filter(u => u.role === 'admin').length} admin(s)</p>
        </div>
      </div>

      <div className="admin-layout">
        <div className="admin-list-panel">
          <div className="admin-search">
            <Search size={16} />
            <input
              className="admin-search-input"
              placeholder="Search by email, name, or role..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Skeleton height={48} />
              <div style={{ marginTop: 8 }}><Skeleton height={48} /></div>
              <div style={{ marginTop: 8 }}><Skeleton height={48} /></div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No users match" description={`No users matched "${query}"`} />
          ) : (
            <div className="admin-user-list">
              {filtered.map(u => (
                <button
                  key={u.id}
                  className={`admin-user-row ${selected === u.id ? 'selected' : ''}`}
                  onClick={() => loadDetail(u.id)}
                >
                  <div className={`admin-user-avatar role-${u.role}`}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="admin-user-main">
                    <div className="admin-user-name">
                      {u.name}
                      {u.role === 'admin' && <Crown size={12} style={{ color: '#f59e0b' }} />}
                      {u.id === currentUser?.id && <span className="admin-you">You</span>}
                    </div>
                    <div className="admin-user-email">{u.email}</div>
                  </div>
                  <div className="admin-user-stats">
                    <div className="admin-user-stat">
                      <Activity size={11} />
                      {u.activityCount}
                    </div>
                    <div className="admin-user-stat admin-user-seen">
                      {u.lastSeen ? timeSince(u.lastSeen) : 'never'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="admin-detail-panel">
          {!selected && (
            <EmptyState
              icon={User}
              title="Select a user"
              description="Click a user from the list to view their details, activity, and manage their access."
            />
          )}
          {selected && !userDetail && (
            <div style={{ padding: 40 }}><Skeleton height={200} /></div>
          )}
          {userDetail && (
            <>
              <div className="admin-detail-header">
                <div className={`admin-detail-avatar role-${userDetail.user.role}`}>
                  {(userDetail.user.name || userDetail.user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="admin-detail-name">{userDetail.user.name}</h2>
                  <p className="admin-detail-email">{userDetail.user.email}</p>
                  <div className="admin-detail-meta">
                    <span className={`user-role-chip role-${userDetail.user.role}`}>{userDetail.user.role}</span>
                    <span>· Joined {new Date(userDetail.user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="admin-actions-bar">
                {userDetail.user.role === 'user' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => promote(userDetail.user.id, 'admin')}>
                    <Crown size={14} /> Promote to Admin
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => promote(userDetail.user.id, 'user')}
                    disabled={userDetail.user.id === currentUser?.id}>
                    <UserX size={14} /> Demote to User
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm admin-danger-btn"
                  onClick={() => remove(userDetail.user.id, userDetail.user.email)}
                  disabled={userDetail.user.id === currentUser?.id}
                >
                  <Trash2 size={14} /> Delete User
                </button>
              </div>

              <h3 className="admin-section-title">Recent Activity ({userDetail.activity.length})</h3>
              {userDetail.activity.length === 0 ? (
                <div className="admin-empty-small">No activity recorded yet.</div>
              ) : (
                <div className="admin-activity-list">
                  {userDetail.activity.map(a => (
                    <ActivityRow key={a.id} event={a} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ event }) {
  const icon = event.status === 'success' ? CheckCircle : event.status === 'failure' ? XCircle : Activity;
  const Icon = icon;
  const color = event.status === 'success' ? '#10b981' : event.status === 'failure' ? '#ef4444' : '#06b6d4';
  return (
    <div className="admin-activity-row">
      <div className="admin-activity-icon" style={{ background: `${color}22`, color }}>
        <Icon size={14} />
      </div>
      <div className="admin-activity-body">
        <div className="admin-activity-top">
          <code className="admin-activity-action">{event.action}</code>
          <span className="admin-activity-time">{new Date(event.timestamp).toLocaleString()}</span>
        </div>
        {event.resource && <div className="admin-activity-resource">{event.resource}</div>}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="admin-activity-meta">
            {Object.entries(event.metadata).slice(0, 3).map(([k, v]) => (
              <span key={k} className="admin-meta-chip">{k}: <strong>{String(v).slice(0, 40)}</strong></span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function timeSince(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)      return 'just now';
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN: ACTIVITY LOG PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function AdminActivityPage() {
  const [data, setData] = useState({ entries: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const reload = () => {
    setLoading(true);
    const qs = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : '';
    fetch(`/api/admin/activity${qs}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  };
  useEffect(reload, [actionFilter]);

  const uniqueActions = [...new Set(data.entries.map(e => e.action))].sort();

  return (
    <div className="admin-page">
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' }}>
        <div className="admin-header-icon"><Activity size={36} /></div>
        <div>
          <h1 className="admin-header-title">Activity Log</h1>
          <p className="admin-header-sub">{data.total} events recorded — audit trail of all significant actions</p>
        </div>
      </div>

      <div className="admin-activity-toolbar">
        <select
          className="field-input"
          style={{ maxWidth: 260 }}
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="">All actions ({data.total})</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={reload}>Refresh</button>
      </div>

      {loading ? (
        <div className="panel">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ marginBottom: 8 }}><Skeleton height={56} /></div>
          ))}
        </div>
      ) : data.entries.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Activity} title="No activity yet" description="Events will appear here as users interact with the platform." />
        </div>
      ) : (
        <div className="panel admin-activity-full">
          {data.entries.map(e => (
            <div key={e.id} className="admin-activity-full-row">
              <div className="admin-activity-full-left">
                <div className="admin-activity-full-user">
                  <div className="admin-activity-full-avatar">
                    {(e.userEmail || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="admin-activity-full-email">{e.userEmail || <em>anonymous</em>}</div>
                    <div className="admin-activity-full-time">{new Date(e.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="admin-activity-full-mid">
                <code className="admin-activity-action">{e.action}</code>
                {e.resource && <div className="admin-activity-resource">{e.resource}</div>}
              </div>
              <div className="admin-activity-full-right">
                <span className={`activity-status status-${e.status}`}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN: SYSTEM HEALTH PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function AdminSystemPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="admin-page"><Skeleton height={200} /></div>;
  if (!stats) return <div className="admin-page">Failed to load stats</div>;

  const uptimeHours = Math.floor(stats.server.uptime / 3600);
  const uptimeMins = Math.floor((stats.server.uptime % 3600) / 60);
  const memMB = Math.round(stats.server.memory.heapUsed / 1024 / 1024);

  return (
    <div className="admin-page">
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #10b981 100%)' }}>
        <div className="admin-header-icon"><Server size={36} /></div>
        <div>
          <h1 className="admin-header-title">System Health</h1>
          <p className="admin-header-sub">Real-time backend & usage metrics (auto-refreshes every 10s)</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <TrendCard label="Total Users" value={stats.users.total} color="#06b6d4" icon={Users} />
        <TrendCard label="Admins" value={stats.users.admins} color="#f59e0b" icon={Crown} />
        <TrendCard label="Total Runs" value={stats.testing.totalRuns} color="#8b5cf6" icon={Play} />
        <TrendCard label="Events (24h)" value={stats.activity.last24h} color="#10b981" icon={Activity} />
      </div>

      <div className="admin-split">
        <div className="panel">
          <div className="section-title"><Server size={16} style={{ verticalAlign: -3 }} /> Server</div>
          <div className="admin-kv">
            <div><label>Uptime</label><strong>{uptimeHours}h {uptimeMins}m</strong></div>
            <div><label>Memory (heap)</label><strong>{memMB} MB</strong></div>
            <div><label>Node.js</label><strong>{stats.server.nodeVersion}</strong></div>
            <div><label>Platform</label><strong>{stats.server.platform}</strong></div>
          </div>
        </div>

        <div className="panel">
          <div className="section-title"><BarChart3 size={16} style={{ verticalAlign: -3 }} /> Test Results</div>
          <BarChart height={140} data={[
            { label: 'Passed',  value: stats.testing.totalPassed, color: 'linear-gradient(90deg, #10b981, #059669)' },
            { label: 'Failed',  value: stats.testing.totalFailed, color: 'linear-gradient(90deg, #ef4444, #dc2626)' },
          ]} />
        </div>
      </div>

      <div className="panel">
        <div className="section-title"><Activity size={16} style={{ verticalAlign: -3 }} /> Activity by Action</div>
        <BarChart height={Math.max(80, Object.keys(stats.activity.byAction).length * 30)} data={
          Object.entries(stats.activity.byAction)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([label, value]) => ({ label, value, color: 'linear-gradient(90deg, #06b6d4, #8b5cf6)' }))
        } />
      </div>

      <div className="panel">
        <div className="section-title"><Database size={16} style={{ verticalAlign: -3 }} /> Storage</div>
        <div className="admin-kv">
          <div><label>Reports directory</label><strong>{stats.storage.reportsDirMB} MB</strong></div>
          <div><label>Total events logged</label><strong>{stats.activity.total}</strong></div>
          <div><label>Failed events</label><strong style={{ color: '#ef4444' }}>{stats.activity.byStatus.failure || 0}</strong></div>
          <div><label>Successful events</label><strong style={{ color: '#10b981' }}>{stats.activity.byStatus.success || 0}</strong></div>
        </div>
      </div>
    </div>
  );
}
