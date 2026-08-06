#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Digital Twin Engine — Ubuntu Server Quick Start
# ═══════════════════════════════════════════════════════════════
#  USAGE:
#    chmod +x start.sh launcher/start.sh
#    ./start.sh                       # Interactive launch
#    ./start.sh -y                    # Non-interactive / CI / SSH launch
#    ./start.sh --skip-seed           # Skip database seeding
#    ./start.sh --check               # Pre-flight check only
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$SCRIPT_DIR/launcher/start.sh" 2>/dev/null || true

exec bash "$SCRIPT_DIR/launcher/start.sh" "$@"

