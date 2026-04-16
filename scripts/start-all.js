#!/usr/bin/env node
// ── Start Everything — runs backend + frontend together ────────────────────
// Usage: npm start
// Quits cleanly on Ctrl+C.
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const BACKEND  = path.join(ROOT, 'qa-tool', 'backend');
const FRONTEND = path.join(ROOT, 'qa-tool', 'frontend');

const RESET = '\x1b[0m';
const CYAN  = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

function prefix(tag, color) {
  return (line) => `${color}[${tag}]${RESET} ${line}`;
}

function spawnService(name, cwd, color) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = name === 'backend' ? ['start'] : ['run', 'dev'];
  const proc = spawn(cmd, args, {
    cwd, shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const fmt = prefix(name, color);

  proc.stdout.on('data', (buf) => {
    for (const line of buf.toString().split('\n')) {
      if (line.trim()) console.log(fmt(line));
    }
  });
  proc.stderr.on('data', (buf) => {
    for (const line of buf.toString().split('\n')) {
      if (line.trim()) console.error(fmt(line));
    }
  });
  proc.on('exit', (code) => {
    console.log(fmt(`exited with code ${code}`));
    shutdown(code);
  });

  return proc;
}

let procs = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${YELLOW}Shutting down...${RESET}`);
  procs.forEach(p => { try { p.kill(); } catch {} });
  setTimeout(() => process.exit(code), 1000);
}

process.on('SIGINT',  () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`${GREEN}┌─────────────────────────────────────────────────────────┐${RESET}`);
console.log(`${GREEN}│          QA Testing Platform — starting...              │${RESET}`);
console.log(`${GREEN}│                                                         │${RESET}`);
console.log(`${GREEN}│   Backend  →  http://localhost:5000                     │${RESET}`);
console.log(`${GREEN}│   Frontend →  http://localhost:3001                     │${RESET}`);
console.log(`${GREEN}│                                                         │${RESET}`);
console.log(`${GREEN}│   Press Ctrl+C to stop both services                    │${RESET}`);
console.log(`${GREEN}└─────────────────────────────────────────────────────────┘${RESET}\n`);

procs.push(spawnService('backend',  BACKEND,  CYAN));
// Give backend 2s to bind its port before starting frontend
setTimeout(() => {
  procs.push(spawnService('frontend', FRONTEND, MAGENTA));
}, 2000);
