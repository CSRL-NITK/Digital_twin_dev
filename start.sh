#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Digital Twin — Quick Start
#  Delegates to launcher/start.sh  |  Usage: ./start.sh
# ═══════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/launcher/start.sh" "$@"
