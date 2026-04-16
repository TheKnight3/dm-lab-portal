#!/usr/bin/env bash
# =============================================================================
# run_integration_tests.sh
#
# Avvia l'intera applicazione con docker-compose, esegue i test di
# integrazione e di stress, salva i risultati in docs/report/ e infine
# arresta i container.
#
# Uso:
#   cd <project-root>          # dm-project-final/
#   bash integration/run_integration_tests.sh
# =============================================================================

set -euo pipefail

# ── Percorsi ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_DIR/docs/report"

BACKEND_URL="http://localhost:5000"
HEALTH_URL="$BACKEND_URL/health"
MAX_WAIT=120          # secondi massimi di attesa per il backend

# ── Colori (opzionali) ─────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── 1. Avvio stack con docker-compose ──────────────────────────────────────
info "Avvio dell'applicazione con docker-compose ..."
cd "$PROJECT_DIR"
docker-compose up -d --build

# ── 2. Attesa che il backend sia pronto ────────────────────────────────────
info "Attesa che il backend risponda su $HEALTH_URL (max ${MAX_WAIT}s) ..."
elapsed=0
until curl -sf "$HEALTH_URL" > /dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [ "$elapsed" -ge "$MAX_WAIT" ]; then
        error "Il backend non ha risposto entro ${MAX_WAIT} secondi."
        error "Log del container backend:"
        docker-compose logs --tail=40 backend
        docker-compose down
        exit 1
    fi
done
info "Backend pronto dopo ~${elapsed}s."

# ── 3. Installazione dipendenze test ──────────────────────────────────────
info "Installazione dipendenze di test (requests, pytest) ..."
pip install --quiet requests pytest 2>/dev/null || pip3 install --quiet requests pytest

# ── 4. Creazione cartella report ───────────────────────────────────────────
mkdir -p "$REPORT_DIR"

# ── 5. Esecuzione test end-to-end ──────────────────────────────────────────
info "Esecuzione test end-to-end ..."
E2E_REPORT="$REPORT_DIR/integration_e2e_results.txt"

pytest "$PROJECT_DIR/integration/test_end_to_end.py" -v --tb=short 2>&1 | tee "$E2E_REPORT"
E2E_EXIT=${PIPESTATUS[0]}

if [ "$E2E_EXIT" -eq 0 ]; then
    info "Test end-to-end: TUTTI PASSATI ✓"
else
    warn "Test end-to-end: alcuni test falliti (exit code $E2E_EXIT)"
fi

# ── 6. Esecuzione test di stress / carico ──────────────────────────────────
info "Esecuzione test di stress (100 utenti concorrenti) ..."
STRESS_REPORT="$REPORT_DIR/integration_stress_results.txt"

pytest "$PROJECT_DIR/integration/test_stress.py" -v -s --tb=short 2>&1 | tee "$STRESS_REPORT"
STRESS_EXIT=${PIPESTATUS[0]}

if [ "$STRESS_EXIT" -eq 0 ]; then
    info "Test di stress: TUTTI PASSATI ✓"
else
    warn "Test di stress: alcuni test falliti (exit code $STRESS_EXIT)"
fi

# ── 7. Riepilogo ───────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  RIEPILOGO TEST DI INTEGRAZIONE"
echo "============================================================"
echo "  End-to-end : $([ $E2E_EXIT -eq 0 ] && echo 'PASSED ✓' || echo 'FAILED ✗')"
echo "  Stress     : $([ $STRESS_EXIT -eq 0 ] && echo 'PASSED ✓' || echo 'FAILED ✗')"
echo ""
echo "  Report salvati in:"
echo "    - $E2E_REPORT"
echo "    - $STRESS_REPORT"
echo "============================================================"

# ── 8. Arresto stack ──────────────────────────────────────────────────────
info "Arresto dei container ..."
cd "$PROJECT_DIR"
docker-compose down

# ── Exit code finale ──────────────────────────────────────────────────────
if [ "$E2E_EXIT" -ne 0 ] || [ "$STRESS_EXIT" -ne 0 ]; then
    exit 1
fi
exit 0
