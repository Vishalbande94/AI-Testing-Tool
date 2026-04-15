#!/bin/bash
# ── AI Testing Tool — One-Click Setup (macOS / Linux) ─────────────────────
set -e

BLUE='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       AI Testing Tool — One-Click Setup                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Prereq check ─────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}✖ Node.js not found. Install from https://nodejs.org (v18+)${NC}"; exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✖ Node.js v${NODE_MAJOR} detected. v18+ required.${NC}"; exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"
echo -e "${GREEN}✓${NC} npm  $(npm -v)"
echo ""

# ── Backend setup ────────────────────────────────────────────────────────
echo -e "${BLUE}[1/4]${NC} Installing backend dependencies..."
cd qa-tool/backend
npm install --silent
echo -e "${GREEN}✓${NC} Backend deps installed"

# ── Generate .env if missing ────────────────────────────────────────────
if [ ! -f .env ]; then
  echo -e "${BLUE}[2/4]${NC} Generating .env with secure random secrets..."
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  APP_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cp .env.example .env
  # Replace placeholders (BSD/GNU sed compatible)
  if sed --version >/dev/null 2>&1; then
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|APP_SECRET=.*|APP_SECRET=$APP_SECRET|" .env
  else
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i '' "s|APP_SECRET=.*|APP_SECRET=$APP_SECRET|" .env
  fi
  echo -e "${GREEN}✓${NC} .env generated with fresh secrets"
else
  echo -e "${YELLOW}→${NC}  .env already exists, skipping"
fi
echo ""

# ── Frontend setup ───────────────────────────────────────────────────────
echo -e "${BLUE}[3/4]${NC} Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo -e "${GREEN}✓${NC} Frontend deps installed"
echo ""

# ── Success ──────────────────────────────────────────────────────────────
cd ../..
echo -e "${BLUE}[4/4]${NC} Setup complete!"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉  READY TO RUN  🎉                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Open TWO terminals and run:"
echo ""
echo -e "  ${YELLOW}Terminal 1 (backend):${NC}"
echo -e "    cd qa-tool/backend && npm start"
echo ""
echo -e "  ${YELLOW}Terminal 2 (frontend):${NC}"
echo -e "    cd qa-tool/frontend && npm run dev"
echo ""
echo "Then open  ${BLUE}http://localhost:3001${NC}  in your browser."
echo ""
echo "First user to sign up becomes the admin."
echo ""
