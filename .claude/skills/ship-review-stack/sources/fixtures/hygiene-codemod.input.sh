#!/usr/bin/env bash
#
# determinism-batch.sh -- fixture for the hash comment family (Phase 138, D-13/D-14).
#   See `.planning/phases/138-x/138-DETERMINISM-LEDGER.md` §4 for the ledger shape.
#
# PHASE 1: JSONB Schema
#

set -euo pipefail

EPERM07_STEP_PREFIX='EPERM-07 customData.terms'

# The full gate suite's expected executed count was 134 through Phase 137; plan 01 of
# this phase raised it (INTEG-02).
echo "--- PHASE 1: JSONB SCHEMA ---"
echo "# Phase 138 -- Determinism batch ledger (criterion 3, INTEG-02)"
echo "prefix is $EPERM07_STEP_PREFIX"
