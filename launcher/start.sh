#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Digital Twin Enterprise Launcher — Linux / macOS
#  Equivalent of launcher/start.bat adapted for POSIX systems
#
#  USAGE:
#    chmod +x launcher/start.sh
#    ./launcher/start.sh          # Normal launch (install + seed + run)
#    ./launcher/start.sh --skip-seed   # Skip database seeding
#    ./launcher/start.sh --check       # Pre-flight check only
# ═══════════════════════════════════════════════════════════════════

# ─── IMPORTANT: Do NOT use "set -e" ──────────────────────────────
# We handle every error manually with if-checks so the script never
# crashes unexpectedly. set -e would abort on any non-zero exit code
# including harmless ones like grep finding no match.
# ──────────────────────────────────────────────────────────────────

# ── Colors (with terminal capability check) ───────────────────────
if [ -t 1 ] && command -v tput &>/dev/null && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' DIM='' NC=''
fi

# ── Resolve project root (script lives in launcher/) ──────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd)"

if [ ! -d "$PROJECT_ROOT/backend" ] || [ ! -d "$PROJECT_ROOT/frontend" ]; then
  echo -e "${RED}[ERROR]${NC} Cannot locate backend/ and frontend/ directories."
  echo "       Expected project root: $PROJECT_ROOT"
  echo "       Run this script from the project root or via launcher/start.sh"
  exit 1
fi

cd "$PROJECT_ROOT" || exit 1

# ── Parse CLI flags ───────────────────────────────────────────────
SKIP_SEED=false
CHECK_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --skip-seed)  SKIP_SEED=true ;;
    --check)      CHECK_ONLY=true ;;
  esac
done

# ── Helper functions ──────────────────────────────────────────────
ok()   { echo -e "  ${GREEN}[✔]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[!]${NC} $1"; }
fail() { echo -e "  ${RED}[✗]${NC} $1"; }
info() { echo -e "  ${CYAN}[→]${NC} $1"; }
step() { echo -e "\n${BOLD}${CYAN}$1${NC}"; }

check_cmd() {
  command -v "$1" &>/dev/null
}

# Portable TCP port check (works on bash without /dev/tcp, and on macOS/Linux)
wait_for_port() {
  local port="$1"
  local max_wait="${2:-30}"
  local elapsed=0

  while [ "$elapsed" -lt "$max_wait" ]; do
    # Try multiple methods: nc (netcat), /dev/tcp, or python
    if check_cmd nc; then
      if nc -z 127.0.0.1 "$port" 2>/dev/null; then
        return 0
      fi
    elif (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
      return 0
    elif [ -n "$PYTHON_CMD" ]; then
      if $PYTHON_CMD -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1)
try:
    s.connect(('127.0.0.1', $port))
    s.close()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null; then
        return 0
      fi
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  return 1
}

# Port check for pre-flight (single attempt, no waiting)
check_port() {
  local port="$1"
  if check_cmd nc; then
    nc -z 127.0.0.1 "$port" 2>/dev/null
    return $?
  elif (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
    return 0
  elif check_cmd python3; then
    python3 -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect(('127.0.0.1', $port))
    s.close()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null
    return $?
  elif check_cmd python; then
    python -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect(('127.0.0.1', $port))
    s.close()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null
    return $?
  else
    # No way to check — assume it's up and let later steps fail with a clear error
    return 0
  fi
}

# ── Trap setup (register early so Ctrl+C during install is clean) ─
BACKEND_PID=""
FRONTEND_PID=""
PYTHON_PID=""

cleanup() {
  echo ""
  echo -e "${YELLOW}[→] Shutting down Digital Twin services...${NC}"
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "$PYTHON_PID" ]   && kill "$PYTHON_PID"   2>/dev/null || true
  # Also kill any child processes in our process group
  kill 0 2>/dev/null || true
  echo -e "${GREEN}[✔] All services stopped. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ═══════════════════════════════════════════════════════════════════
#  PRE-FLIGHT CHECK
# ═══════════════════════════════════════════════════════════════════
clear 2>/dev/null || true   # clear may fail in non-interactive terminals
echo -e "${BOLD}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}        Digital Twin Environment Pre-flight Check           ${NC}"
echo -e "${BOLD}═════════════════════════════════════════════════════════════${NC}"

PREFLIGHT_PASS=true

# 1. Node.js (v18+)
if check_cmd node; then
  NODE_VER="$(node -v 2>/dev/null || echo '')"
  NODE_MAJOR="$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)"
  # Guard against non-numeric output
  if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -ge 18 ] 2>/dev/null; then
    ok "Node.js $NODE_VER detected"
  else
    fail "Node.js $NODE_VER detected — v18+ required"
    PREFLIGHT_PASS=false
  fi
else
  fail "Node.js not found — install v18+ from https://nodejs.org"
  PREFLIGHT_PASS=false
fi

# 2. npm
if check_cmd npm; then
  NPM_VER="$(npm -v 2>/dev/null || echo 'unknown')"
  ok "npm v$NPM_VER detected"
else
  fail "npm not found — it should come with Node.js"
  PREFLIGHT_PASS=false
fi

# 3. Python 3
PYTHON_CMD=""
if check_cmd python3; then
  PYTHON_CMD="python3"
elif check_cmd python; then
  # Ensure it's Python 3, not Python 2
  PY_MAJOR="$(python -c 'import sys; print(sys.version_info.major)' 2>/dev/null || echo '2')"
  if [ "$PY_MAJOR" = "3" ]; then
    PYTHON_CMD="python"
  fi
fi

if [ -n "$PYTHON_CMD" ]; then
  PY_VER="$($PYTHON_CMD --version 2>&1 || echo 'Python 3')"
  ok "$PY_VER detected"
else
  fail "Python 3 not found — install Python 3.10+"
  PREFLIGHT_PASS=false
fi

# 4. pip
PIP_CMD=""
if check_cmd pip3; then
  PIP_CMD="pip3"
elif check_cmd pip; then
  PIP_CMD="pip"
elif [ -n "$PYTHON_CMD" ]; then
  # Try python -m pip
  if $PYTHON_CMD -m pip --version &>/dev/null; then
    PIP_CMD="$PYTHON_CMD -m pip"
  fi
fi

if [ -n "$PIP_CMD" ]; then
  PIP_VER="$($PIP_CMD --version 2>/dev/null | awk '{print $2}' || echo 'installed')"
  ok "pip v$PIP_VER detected"
else
  warn "pip not found — Python package installation may fail"
fi

# 5. PostgreSQL (check port 5432)
if check_port 5432; then
  ok "PostgreSQL Server verified on Port 5432"
else
  fail "PostgreSQL unreachable on Port 5432 — start the postgres service"
  echo -e "    ${DIM}Ubuntu/Debian: sudo systemctl start postgresql${NC}"
  echo -e "    ${DIM}macOS (Homebrew): brew services start postgresql${NC}"
  PREFLIGHT_PASS=false
fi

# 6. Docker (optional — for Grafana)
if check_cmd docker; then
  if docker info &>/dev/null 2>&1; then
    DOCKER_VER="$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',' || echo 'unknown')"
    ok "Docker v$DOCKER_VER daemon running — Grafana auto-start ready"
  else
    DOCKER_VER="$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',' || echo 'unknown')"
    warn "Docker CLI v$DOCKER_VER detected, but daemon is NOT running — Skipping Grafana"
  fi
else
  echo -e "  ${DIM}[-]${NC} Docker not installed — Skipping Grafana auto-start"
fi

echo -e "${BOLD}═════════════════════════════════════════════════════════════${NC}"

if [ "$PREFLIGHT_PASS" = false ]; then
  echo ""
  fail "Pre-flight check failed. Please install the missing dependencies listed above."
  exit 1
fi

# If --check flag, stop here
if [ "$CHECK_ONLY" = true ]; then
  echo ""
  ok "All pre-flight checks passed!"
  exit 0
fi

echo ""
read -rp "  Press [ENTER] to install dependencies and launch the platform..."

# ═══════════════════════════════════════════════════════════════════
#  STEP 1: Python Dependencies
# ═══════════════════════════════════════════════════════════════════
step "[1/7] Installing Python dependencies..."

# Upgrade pip (non-fatal if it fails)
$PYTHON_CMD -m pip install --upgrade pip --quiet 2>/dev/null || warn "pip upgrade skipped (non-fatal)"

if [ -f "launcher/requirements.txt" ]; then
  if $PYTHON_CMD -m pip install -r launcher/requirements.txt --quiet 2>/dev/null; then
    ok "Python dependencies installed"
  else
    warn "Some Python packages failed to install — telemetry simulator may not work"
  fi
elif [ -f "requirements.txt" ]; then
  $PYTHON_CMD -m pip install -r requirements.txt --quiet 2>/dev/null || warn "Python package install had warnings"
  ok "Python dependencies installed"
else
  $PYTHON_CMD -m pip install psycopg2-binary requests paho-mqtt --quiet 2>/dev/null || warn "Fallback Python install had warnings"
  ok "Python dependencies installed (fallback packages)"
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 2: Backend Node Modules
# ═══════════════════════════════════════════════════════════════════
step "[2/7] Installing Backend Node modules..."

cd "$PROJECT_ROOT/backend" || { fail "Cannot cd to backend/"; exit 1; }
if npm install 2>&1 | tail -3; then
  ok "Backend node_modules ready"
else
  fail "Backend npm install failed!"
  echo "    Try running manually: cd backend && npm install"
  exit 1
fi
cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════════
#  STEP 3: Frontend Node Modules
# ═══════════════════════════════════════════════════════════════════
step "[3/7] Installing Frontend Node modules..."

cd "$PROJECT_ROOT/frontend" || { fail "Cannot cd to frontend/"; exit 1; }
if npm install 2>&1 | tail -3; then
  ok "Frontend node_modules ready"
else
  fail "Frontend npm install failed!"
  echo "    Try running manually: cd frontend && npm install"
  exit 1
fi
cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════════
#  STEP 4: Database Auto-Configuration
# ═══════════════════════════════════════════════════════════════════
step "[4/7] Auto-configuring PostgreSQL database and backend/.env..."

if [ ! -f "launcher/setup-db.js" ]; then
  warn "launcher/setup-db.js not found — skipping auto-config"
  warn "Make sure backend/.env has a valid DATABASE_URL"
else
  if node launcher/setup-db.js 2>&1; then
    ok "Database configured and backend/.env updated"
  else
    fail "Database auto-configuration failed!"
    echo "    Check PostgreSQL is running and credentials in launcher/setup-db.js are correct."
    echo "    You can also manually create the database and update backend/.env"
    exit 1
  fi
fi

# ═══════════════════════════════════════════════════════════════════
#  STEP 5: Prisma — Generate Client, Push Schema, Seed Data
# ═══════════════════════════════════════════════════════════════════
step "[5/7] Setting up Prisma ORM..."

cd "$PROJECT_ROOT/backend" || { fail "Cannot cd to backend/"; exit 1; }

if [ ! -f "prisma/schema.prisma" ]; then
  fail "backend/prisma/schema.prisma missing!"
  echo "    The Prisma schema file is required to set up the database."
  exit 1
fi

info "Generating Prisma Client..."
if npx prisma generate 2>&1 | tail -3; then
  ok "Prisma Client generated"
else
  fail "Prisma generate failed!"
  exit 1
fi

info "Pushing database schema to PostgreSQL..."
if npx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -3; then
  ok "Database schema synced"
else
  fail "Prisma db push failed — check DATABASE_URL in backend/.env"
  exit 1
fi

if [ "$SKIP_SEED" = false ]; then
  info "[Seed 1/3] Seeding Digital Twin core data..."
  if npx ts-node src/seed.ts 2>&1 | tail -3; then
    ok "Core data seeded"
  else
    warn "Core seed had errors (may already be seeded — continuing)"
  fi

  info "[Seed 2/3] Seeding Hydroponic System data..."
  if npx ts-node src/seed-hydroponic.ts 2>&1 | tail -3; then
    ok "Hydroponic data seeded"
  else
    warn "Hydroponic seed had errors (may already be seeded — continuing)"
  fi

  info "[Seed 3/3] Seeding Hydroponic historical telemetry..."
  if npx ts-node src/seed-hydroponic-history.ts 2>&1 | tail -3; then
    ok "Historical telemetry seeded"
  else
    warn "Historical seed had errors (may already be seeded — continuing)"
  fi
else
  info "Skipping database seeding (--skip-seed flag)"
fi

cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════════
#  STEP 6: Launch All Services
# ═══════════════════════════════════════════════════════════════════
step "[6/6] Launching platform services..."

# ── 7a. Backend (Port 3001 + MQTT 1884) ──
info "Starting Backend Gateway (Express + MQTT Broker)..."
cd "$PROJECT_ROOT/backend" || { fail "Cannot cd to backend/"; exit 1; }
npm run dev &>/dev/null &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

info "Waiting for Backend API on port 3001..."
if wait_for_port 3001 45; then
  ok "Backend API is live on http://localhost:3001"
else
  warn "Backend did not respond within 45s — it may still be starting"
  warn "Check logs with: cd backend && npm run dev"
fi

# ── 7b. Python Telemetry Simulator ──
if [ -f "$PROJECT_ROOT/python-generator/main.py" ]; then
  info "Starting Python Telemetry Simulator..."
  cd "$PROJECT_ROOT/python-generator" || true
  $PYTHON_CMD main.py &>/dev/null &
  PYTHON_PID=$!
  cd "$PROJECT_ROOT"
  ok "Telemetry simulator started (PID: $PYTHON_PID)"
else
  warn "python-generator/main.py not found — skipping telemetry simulator"
fi

# ── 7c. Frontend (Port 5173) ──
info "Starting React Frontend (Vite dev server)..."
cd "$PROJECT_ROOT/frontend" || { fail "Cannot cd to frontend/"; exit 1; }
npm run dev &>/dev/null &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

info "Waiting for Frontend on port 5173..."
if wait_for_port 5173 30; then
  ok "Frontend is live on http://localhost:5173"
else
  warn "Frontend did not respond within 30s — it may still be starting"
  warn "Check logs with: cd frontend && npm run dev"
fi

# ── 7d. Grafana (Docker, optional) ──
if check_cmd docker && docker info &>/dev/null 2>&1; then
  if [ -f "docker-compose.grafana.yml" ]; then
    info "Starting Grafana monitoring container..."
    if docker compose -f docker-compose.grafana.yml up -d 2>&1; then
      ok "Grafana container started on http://localhost:3005"
    else
      warn "Grafana container failed to start (non-fatal)"
    fi
  fi
else
  echo -e "  ${DIM}[-] Docker not available — Grafana skipped${NC}"
fi

# ── 7e. Open browser ──
sleep 2  # Give frontend a moment to fully initialize
if check_cmd xdg-open; then
  xdg-open "http://localhost:5173" &>/dev/null 2>&1 &
elif check_cmd open; then
  open "http://localhost:5173" &>/dev/null 2>&1 &
elif check_cmd sensible-browser; then
  sensible-browser "http://localhost:5173" &>/dev/null 2>&1 &
else
  info "Open http://localhost:5173 in your browser manually"
fi

# ═══════════════════════════════════════════════════════════════════
#  SUCCESS BANNER
# ═══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}       Digital Twin Engine Started Successfully!            ${NC}"
echo -e "${BOLD}${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}Frontend Web App${NC}  : ${BOLD}http://localhost:5173${NC}"
echo -e "  ${CYAN}Backend REST API${NC}  : ${BOLD}http://localhost:3001${NC}"
echo -e "  ${CYAN}Embedded MQTT${NC}     : ${BOLD}tcp://localhost:1884${NC}"
echo -e "  ${CYAN}Grafana Dashboard${NC} : ${BOLD}http://localhost:3005${NC} ${DIM}(requires Docker)${NC}"
echo -e "${BOLD}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${DIM}Press Ctrl+C to stop all services and exit.${NC}"
echo ""

# Keep script alive so Ctrl+C can catch all background processes
wait
