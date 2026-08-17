#!/usr/bin/env bash
#
# determinism-batch.sh -- fixture for the hash comment family (see phase 138).
#   See for the ledger shape.
#
# PHASE 1: JSONB Schema
#

set -euo pipefail

EPERM07_STEP_PREFIX='EPERM-07 customData.terms'

# The full gate suite's expected executed count was 134 through see phase 137; plan 01 of
# this phase raised it.
echo "--- PHASE 1: JSONB SCHEMA ---"
echo "# Phase 138 -- Determinism batch ledger (criterion 3, INTEG-02)"
echo "prefix is $EPERM07_STEP_PREFIX"
