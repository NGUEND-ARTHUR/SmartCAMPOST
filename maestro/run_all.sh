#!/usr/bin/env bash
# SmartCAMPOST — Maestro E2E Mobile Test Runner
# Usage: ./run_all.sh [--device <id>] [--tag <tag>] [--suite <folder>]
#
# Prerequisites:
#   - Maestro CLI installed (curl -Ls "https://get.maestro.mobile.dev" | bash)
#   - Android emulator running OR real device connected (adb devices)
#   - SmartCAMPOST mobile app installed (com.smartcampost.mobile)
#   - Backend running on http://10.0.2.2:8082 (emulator) or device IP

set -euo pipefail

FLOWS_DIR="$(dirname "$0")/flows"
REPORT_DIR="$(dirname "$0")/reports/$(date +%Y%m%d_%H%M%S)"
SUITE="${1:-all}"
PASS=0
FAIL=0
SKIP=0

mkdir -p "$REPORT_DIR"

echo "=============================================="
echo " SmartCAMPOST Mobile E2E — Maestro Suite"
echo " Date: $(date)"
echo " Report: $REPORT_DIR"
echo "=============================================="

run_flow() {
  local flow="$1"
  local name
  name=$(basename "$flow" .yaml)
  echo ""
  echo "▶ Running: $flow"
  if maestro test "$flow" \
      --format junit \
      --output "$REPORT_DIR/${name}.xml" \
      2>&1 | tee "$REPORT_DIR/${name}.log"; then
    echo "  ✓ PASSED: $name"
    ((PASS++))
  else
    echo "  ✗ FAILED: $name"
    ((FAIL++))
  fi
}

# Determine which suite(s) to run
if [[ "$SUITE" == "all" ]]; then
  FOLDERS=(
    "00_guest"
    "01_auth"
    "02_client"
    "03_agent"
    "04_staff"
    "05_courier"
    "06_admin"
    "07_finance"
    "08_risk"
    "09_workflows"
    "10_security"
    "11_device"
  )
else
  FOLDERS=("$SUITE")
fi

for folder in "${FOLDERS[@]}"; do
  folder_path="$FLOWS_DIR/$folder"
  if [[ ! -d "$folder_path" ]]; then
    echo "⚠ Folder not found: $folder_path"
    ((SKIP++))
    continue
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " Suite: $folder"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  for flow in "$folder_path"/*.yaml; do
    [[ -f "$flow" ]] || continue
    run_flow "$flow"
  done
done

echo ""
echo "=============================================="
echo " RESULTS"
echo "  Passed:  $PASS"
echo "  Failed:  $FAIL"
echo "  Skipped: $SKIP"
echo "  Report:  $REPORT_DIR"
echo "=============================================="

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
