// ── UI Enhancements — Command Palette, Shortcuts Modal, Notifications, Charts ──
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Command, Keyboard, Bell, TrendingUp, TrendingDown,
  Settings, User, LogOut, Moon, Sun, Zap, Shield, Eye, Smartphone,
  Database, Rocket, Target, CheckCircle, XCircle, AlertCircle,
  Sparkles, ArrowRight, ChevronRight, Plus, Clock, Filter,
  Download, Upload, Play, FileText, Globe, Activity,
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
export const Icons = {
  Search, Command, Keyboard, Bell, TrendingUp, TrendingDown,
  Settings, User, LogOut, Moon, Sun, Zap, Shield, Eye, Smartphone,
  Database, Rocket, Target, CheckCircle, XCircle, AlertCircle,
  Sparkles, ArrowRight, ChevronRight, Plus, Clock, Filter,
  Download, Upload, Play, FileText, Globe, Activity,
};
